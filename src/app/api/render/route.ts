// src/app/api/render/route.ts
// ✅ Hook: 짧은 영상은 "루프"로 채움
// ✅ 자막: ko1~ko4 순차 표시 (글자 수 비례 시간 배분)
// ✅ 줌인 개선: 속도 "티 안 나게" 느림(0.00025) + 중앙 줌 + 오버샘플링(떨림 제거)
// ✅ Hook BGM 믹스 지원
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { spawn } from "child_process";

export const runtime = "nodejs";

// page.tsx 의 <break time="...s" /> 와 동일하게 맞춰야 함
const BREAK_SEC = 0.45;

type Scene = {
  kind?: "hook" | "body";
  ko1?: string;
  ko2?: string;
  ko3?: string;
  ko4?: string;
  promptEn?: string;
  videoUrl?: string;
  imageUrl?: string;
  audioUrl: string;
  durationSec?: number;
};

type Settings = {
  fps?: number;
  aspectRatio?: "16:9" | "9:16";
  includeSubtitle?: boolean;

  logoUrl?: string;
  logoWidthPx?: number;
  logoMarginPx?: number;

  zoomEnabled?: boolean;
  zoomSpeed?: number;
  zoomMax?: number;

  // ✅ BGM (hook only)
  hookBgmUrl?: string;
  hookBgmGainDb?: number;
  hookBgmFadeSec?: number;
  hookDuckDb?: number;
};

type Project = {
  scenes: Scene[];
  settings?: Settings;
};

function dataUrlToBuffer(dataUrl: string): Buffer {
  // Robust parsing for "data: image/png; base64, ..." (handles spaces)
  const regex = /data:\s*([^;]+);\s*base64\s*,\s*([\s\S]*)$/i;
  const match = dataUrl.match(regex);

  if (!match) {
    // Fallback to strict if regex fails (though regex is wider)
    const comma = dataUrl.indexOf(",");
    if (comma < 0) throw new Error("dataUrl 콤마(,) 없음");
    const meta = dataUrl.slice(0, comma);
    if (!meta.includes(";base64")) throw new Error("base64 아님");
    return Buffer.from(dataUrl.slice(comma + 1), "base64");
  }

  return Buffer.from(match[2], "base64");
}

async function fetchToBuffer(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch 실패(${r.status})`);
  return Buffer.from(await r.arrayBuffer());
}

function resolveUrl(reqUrl: string, maybeRel: string) {
  if (maybeRel.startsWith("http://") || maybeRel.startsWith("https://")) return maybeRel;
  return new URL(maybeRel, reqUrl).toString();
}

function run(cmd: string, args: string[], cwd?: string) {
  return new Promise<void>((res, rej) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"], cwd });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", rej);
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(err || `${cmd} 실패(${code})`))));
  });
}

async function ffprobeDur(filePath: string): Promise<number> {
  return new Promise((res) => {
    const p = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    let out = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.on("close", () => res(Number(out.trim()) || 0));
    p.on("error", () => res(0));
  });
}

function isVideo(v: string) {
  return /data:\s*video/i.test(v) || v?.startsWith("/api/file") || v?.startsWith("http");
}
function isAudio(a: string) {
  return a?.startsWith("data:audio/") || a?.startsWith("/api/file") || a?.startsWith("http");
}
function isImage(u: string) {
  return /data:\s*image/i.test(u) || u?.startsWith("/api/file") || u?.startsWith("http");
}

function escapeDrawtext(s: string) {
  const normalized = (s ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized
    .replace(/\\/g, "\\\\") // Backslash first
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")  // Escape comma
    .replace(/\[/g, "\\[") // Escape brackets
    .replace(/\]/g, "\\]")
    .replace(/;/g, "\\;")  // Escape semicolon
    .replace(/\n/g, "\\n");
}

function escapeFontfileForDrawtext(p: string) {
  const normalized = p.replace(/\\/g, "/");
  return normalized;
}

// ✅ 텍스트 줄바꿈 함수 (공백 기준, 한글/영문 고려)
function wrapText(text: string, maxCharsPerLine: number): string {
  if (!text) return "";
  const words = text.split(" ");
  let currentLine = "";
  const lines = [];

  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.join("\n");
}

async function pickFontPath(): Promise<string> {
  const candidates = [
    path.join(process.cwd(), "public", "fonts", "NanumGothicBold.ttf"),
    path.join(process.cwd(), "public", "fonts", "NanumGothic.ttf"),
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "C:/Windows/Fonts/malgun.ttf",
    "C:/Windows/Fonts/malgunbd.ttf",
    "C:/Windows/Fonts/gulim.ttc",
  ];
  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch { }
  }
  return "";
}

// ✅ 훅: 짧은 영상이면 "루프", 바디: 마지막 프레임 clone
// ✅ 훅: 짧은 영상이면 "루프", 바디: 마지막 프레임 clone
async function normalizeVideoToTarget(
  inPath: string,
  outPath: string,
  targetSec: number,
  outW: number,
  outH: number,
  fps: number,
  workDir: string,
  mode: "clone" | "loop" = "clone"
) {
  const vfBase = `scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},fps=${fps},format=yuv420p`;
  if (mode === "loop") {
    await run("ffmpeg", [
      "-y", "-hide_banner", "-loglevel", "error",
      "-stream_loop", "-1",
      "-i", inPath,
      "-t", String(targetSec),
      "-vf", vfBase,
      "-an",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
      "-movflags", "+faststart",
      outPath,
    ], workDir);
    return;
  }

  const vDur = await ffprobeDur(inPath);
  const padSec = Math.max(0, targetSec - vDur);
  const vf = padSec > 0.05 ? `${vfBase},tpad=stop_mode=clone:stop_duration=${padSec.toFixed(3)}` : vfBase;
  await run("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-i", inPath,
    "-t", String(targetSec),
    "-vf", vf,
    "-an",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-movflags", "+faststart",
    outPath,
  ], workDir);
}

// ✅ BGM 믹스 (수정됨)
function buildAudioMixFilters(params: {
  hasBgm: boolean;
  targetSec: number;
  bgmGainDb: number;
  duckDb: number;
  fadeSec: number;
  ttsInputIndex: number;
  bgmInputIndex?: number;
}) {
  const { hasBgm, targetSec, bgmGainDb, duckDb, fadeSec, ttsInputIndex, bgmInputIndex } = params;
  const stOut = Math.max(0, targetSec - fadeSec);

  if (!hasBgm) {
    return {
      filter: `[${ttsInputIndex}:a]aresample=async=1:first_pts=0,afade=t=out:st=${stOut.toFixed(3)}:d=${fadeSec.toFixed(3)}[aout]`,
      map: "[aout]",
    };
  }

  const bgmIdx = typeof bgmInputIndex === "number" ? bgmInputIndex : 2;

  // 안전한 문자열 변환
  const targetSecStr = targetSec.toFixed(3);
  const fadeSecStr = fadeSec.toFixed(3);
  const stOutStr = stOut.toFixed(3);

  // BGM 필터를 단계별로 분리 (파싱 오류 방지)
  const bgmLoop = `[${bgmIdx}:a]aloop=loop=-1:size=2e9[bgm_loop]`;
  const bgmTrim = `[bgm_loop]atrim=duration=${targetSecStr}[bgm_trim]`;
  const bgmVol = `[bgm_trim]volume=${bgmGainDb}dB[bgm_vol]`;
  const bgmFadeIn = `[bgm_vol]afade=t=in:st=0:d=${fadeSecStr}[bgm_fi]`;
  const bgmFadeOut = `[bgm_fi]afade=t=out:st=${stOutStr}:d=${fadeSecStr}[bgm]`;

  // TTS 처리
  const tts = `[${ttsInputIndex}:a]aresample=async=1:first_pts=0,afade=t=out:st=${stOutStr}:d=${fadeSecStr}[tts]`;

  // TTS 분기
  const ttsSplit = `[tts]asplit=2[tts_sc][tts_mix]`;

  // 덕킹
  const ratioVal = Math.min(20, Math.max(2, Math.abs(duckDb) + 1)).toFixed(1);
  const duck = `[bgm][tts_sc]sidechaincompress=threshold=0.02:ratio=${ratioVal}:attack=20:release=250[bgmduck]`;

  // 최종 믹스
  const mix = `[bgmduck][tts_mix]amix=inputs=2:duration=first:dropout_transition=0[aout]`;

  return {
    filter: [bgmLoop, bgmTrim, bgmVol, bgmFadeIn, bgmFadeOut, tts, ttsSplit, duck, mix].join(";"),
    map: "[aout]"
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const project: Project = body?.scenes ? body : body?.project ? body.project : body;
    const scenes = Array.isArray(project?.scenes) ? project.scenes : [];
    const st = (project?.settings || {}) as Settings;

    const scenesFiltered = scenes.filter((s: any) => {
      const t1 = String(s?.ko1 || "").trim();
      const t2 = String(s?.ko2 || "").trim();
      const t3 = String(s?.ko3 || "").trim();
      const t4 = String(s?.ko4 || "").trim();
      const hasText = !!(t1 || t2 || t3 || t4);
      const hasMedia = !!(s?.videoUrl || s?.imageUrl || s?.audioUrl);
      const hasPrompt = !!String(s?.promptEn || "").trim();
      return hasText || hasMedia || hasPrompt;
    });
    if (!scenesFiltered.length) return NextResponse.json({ error: "장면 없음" }, { status: 400 });

    const fps = Math.max(1, Number(st.fps || 30));
    const aspectRatio = st.aspectRatio === "9:16" ? "9:16" : "16:9";
    const OUT_W = aspectRatio === "9:16" ? 1080 : 1920;
    const OUT_H = aspectRatio === "9:16" ? 1920 : 1080;
    const includeSubtitle = st.includeSubtitle !== false;
    const logoWidthPx = Math.max(16, Number(st.logoWidthPx || 180));
    const logoMarginPx = Math.max(0, Number(st.logoMarginPx || 24));

    const zoomEnabled = st.zoomEnabled !== false;
    const zoomMax = Number(st.zoomMax || 1.5);
    const zoomSpeed = Number(st.zoomSpeed || 0.00005);

    const hookBgmUrl = String(st.hookBgmUrl || "").trim();
    const hookBgmGainDb = Number.isFinite(Number(st.hookBgmGainDb)) ? Number(st.hookBgmGainDb) : -18;
    const hookDuckDb = Number.isFinite(Number(st.hookDuckDb)) ? Number(st.hookDuckDb) : -10;
    const hookBgmFadeSec = Number.isFinite(Number(st.hookBgmFadeSec)) ? Number(st.hookBgmFadeSec) : 0.7;

    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "render-"));
    const outDir = path.join(workDir, "out");
    await fs.mkdir(outDir, { recursive: true });

    // 로고
    let logoPath = "";
    const logoUrl = String(st.logoUrl || "").trim();
    if (logoUrl && isImage(logoUrl)) {
      logoPath = path.join(workDir, "logo.png");
      if (logoUrl.startsWith("data:image/")) await fs.writeFile(logoPath, dataUrlToBuffer(logoUrl));
      else await fs.writeFile(logoPath, await fetchToBuffer(resolveUrl(req.url, logoUrl)));
    }

    // 폰트
    const fontPathRaw = await pickFontPath();
    const useFont = includeSubtitle && Boolean(fontPathRaw);
    let fontPath = "";
    if (useFont) {
      // 윈도우 경로 문제 해결: 작업 폴더로 복사 후 상대 경로 사용
      const items = fontPathRaw.split(/[\\/]/);
      const ext = items[items.length - 1].split('.').pop() || 'ttf';
      const localFont = `font.${ext}`;
      await fs.copyFile(fontPathRaw, path.join(workDir, localFont));
      fontPath = localFont;
    }

    // BGM
    let bgmPath = "";
    if (hookBgmUrl && isAudio(hookBgmUrl)) {
      bgmPath = path.join(workDir, "hook_bgm.mp3");
      if (hookBgmUrl.startsWith("data:audio/")) await fs.writeFile(bgmPath, dataUrlToBuffer(hookBgmUrl));
      else await fs.writeFile(bgmPath, await fetchToBuffer(resolveUrl(req.url, hookBgmUrl)));
    }

    const clipPaths: string[] = [];

    // ... (이전 코드 유지)

    // 👇 여기서부터 for문 내부를 이 코드로 덮어씌우세요
    for (let i = 0; i < scenesFiltered.length; i++) {
      const s = scenesFiltered[i];
      const kind: "hook" | "body" = s?.kind === "hook" ? "hook" : "body";

      // 1. 오디오 준비
      const a = String(s?.audioUrl || "");
      let aDur = 0;
      const aPath = path.join(workDir, `a_${i}.mp3`);
      let hasAudio = false;

      if (a && isAudio(a)) {
        hasAudio = true;
        if (a.startsWith("data:audio/")) await fs.writeFile(aPath, dataUrlToBuffer(a));
        else await fs.writeFile(aPath, await fetchToBuffer(resolveUrl(req.url, a)));

        // Debug Log
        const stat = await fs.stat(aPath);
        console.log(`[Audio Debug] Scene ${i + 1}: ${aPath}, Size: ${stat.size} bytes`);

        aDur = await ffprobeDur(aPath);
        console.log(`[Audio Debug] Scene ${i + 1}: Duration: ${aDur}`);
      }

      const durHint = Number(s?.durationSec || 3);

      // 1-1. Target Duration 결정
      // 오디오가 없으면 비디오 길이나 설정된 durationSec을 따름
      let target = 0;

      // 비디오 길이 확인을 위해 미리 변수 준비 (순서 변경 필요하지만 여기서 참조만)
      // const v = String(s?.videoUrl || ""); // Removed duplicate
      // let vDur = 0;


      if (hasAudio) {
        target = kind === "hook"
          ? Math.max(0.5, aDur + 0.12)
          : Math.max(Math.max(0.5, aDur + BREAK_SEC), durHint || 0);
      } else {
        // 오디오가 없으면: 훅이면 durationSec(비디오길이) 아니면 3초
        target = (durHint > 0) ? durHint : 3;
        // 만약 비디오가 있는데 durationSec이 0이거나 작으면? 
        // 아래 비디오 처리 로직에서 -t {target}을 하므로 target이 중요함.
        // 사용자가 입력한 videoUrl이 있는 경우, ffprobe로 길이를 알면 좋음.
        // 여기서 잠시 비디오 다운로드를 땡겨올 순 없으니, 
        // 일단 target을 durHint로 잡고, 비디오 로직에서 target을 보정?
        // 아니면 아래 비디오 처리에서 vRawPath 만들고 ffprobe한 뒤 target 업데이트?
        // 하지만 target은 zoom 계산 등에도 쓰임.

        // 일단은 durationSec을 신뢰. (프로젝트 설정에서 훅 길이는 보통 잡혀있음)
      }

      // 오디오 파일이 없으면 무음 파일 생성 (렌더링 파이프라인 유지용)
      if (!hasAudio) {
        // Generate silent MP3 of target duration
        // Use ffmpeg lavfi
        await run("ffmpeg", [
          "-y", "-hide_banner", "-loglevel", "error",
          "-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo`,
          "-t", String(target > 0 ? target : 3),
          "-c:a", "libmp3lame",
          aPath
        ], workDir);
        // aDur = target; // Update duration to match
      }

      // 2. 비디오/이미지 준비
      const v = String(s?.videoUrl || "");
      const img = String(s?.imageUrl || "");
      let vRawPath = path.join(workDir, `vraw_${i}.mp4`);

      if (v && isVideo(v)) {
        if (v.startsWith("data:video/")) await fs.writeFile(vRawPath, dataUrlToBuffer(v));
        else await fs.writeFile(vRawPath, await fetchToBuffer(resolveUrl(req.url, v)));
      } else if (img && isImage(img)) {
        const imgPath = path.join(workDir, `img_${i}.png`);
        if (img.startsWith("data:image/")) await fs.writeFile(imgPath, dataUrlToBuffer(img));
        else await fs.writeFile(imgPath, await fetchToBuffer(resolveUrl(req.url, img)));

        // 줌인 효과 설정
        const zFrames = Math.max(1, Math.round(target * fps));
        const OS = 1.5;
        const W_OS = Math.round(OUT_W * OS);
        const H_OS = Math.round(OUT_H * OS);
        const scalePad = `scale=${W_OS}:${H_OS}:force_original_aspect_ratio=increase,crop=${W_OS}:${H_OS}`;

        // 줌인 효과 설정 (속도 대폭 감소: 0.00025 -> 0.00015 or less?)
        // User complaining "too fast". Let's verify zoomSpeed value.
        // If zoomSpeed is passed from frontend, usage is `zoomSpeed * on`.
        // If frontend passes 0.001, for 300 frames it is 0.3 (30%). Too fast.
        // Let's protect against high zoomSpeed by capping or reducing it here.
        // Or assume default.
        const safeZoomSpeed = (zoomSpeed || 0.00025) * 0.5; // Force 50% slower than requested to be safe
        const zoom = zoomEnabled
          ? `,zoompan=z='min(zoom+${safeZoomSpeed},1.15)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=${zFrames + 150}:s=${W_OS}x${H_OS}:fps=${fps}`
          : "";
        const postScale = `,scale=${OUT_W}:${OUT_H}`;

        await run("ffmpeg", [
          "-y", "-hide_banner", "-loglevel", "error",
          "-i", imgPath,
          "-t", String(target),
          "-r", String(fps),
          "-vf", scalePad + zoom + postScale + ",format=yuv420p",
          "-an",
          "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
          "-movflags", "+faststart",
          vRawPath,
        ], workDir);
      } else {
        throw new Error(`영상/이미지 없음: ${i + 1}`);
      }

      // 3. 비디오 길이 정규화 (vnorm)
      const vNormPath = path.join(workDir, `vnorm_${i}.mp4`);
      await normalizeVideoToTarget(
        vRawPath,
        vNormPath,
        target,
        OUT_W,
        OUT_H,
        fps,
        workDir,
        kind === "hook" ? "loop" : "clone"
      );

      // 4. 클립 합성 (로고 + 자막 + 오디오믹스)
      const clipPath = path.join(outDir, `clip_${i}.mp4`);
      const args: string[] = ["-y", "-hide_banner", "-loglevel", "error", "-i", vNormPath, "-i", aPath];

      let hasLogo = false;
      let hasBgm = false;

      if (logoPath) {
        args.push("-i", logoPath);
        hasLogo = true;
      }
      if (kind === "hook" && bgmPath) {
        args.push("-i", bgmPath);
        hasBgm = true;
      }

      const filters: string[] = [];
      filters.push(`[0:v]format=yuv420p[v0]`);

      // 4-1. 로고 합성
      let vAfterLogo = "[v1]"; // 로고 처리 후 라벨
      if (hasLogo) {
        filters.push(`[2:v]scale=${logoWidthPx}:-1[lg]`);
        filters.push(`[v0][lg]overlay=${logoMarginPx}:${logoMarginPx}[v1]`);
      } else {
        filters.push(`[v0]copy[v1]`);
      }

      // 4-2. 자막 합성
      const rawLines = [s?.ko1, s?.ko2, s?.ko3, s?.ko4]
        .map((x) => String(x || "").trim())
        .filter(Boolean);

      // 자막을 쓸 수 있고 내용도 있는 경우
      if (useFont && rawLines.length > 0) {
        const totalChars = rawLines.reduce((acc, line) => acc + line.length, 0);
        let currentTime = 0;
        let lastV = vAfterLogo;

        // Font path: Absolute path with forward slashes is safest for FFmpeg on Windows
        // ✅ Simplify: Just use forward slashes. Quotes will protect the colon.
        // BUT strict filters on Windows usually need C\:/foo. Let's try to escape the colon.
        const safeFontPath = path.join(workDir, fontPath).replace(/\\/g, "/").replace(/:/g, "\\:");

        const style =
          `fontfile='${safeFontPath}'` +
          `:fontsize=52:fontcolor=white:borderw=3:bordercolor=black` +
          `:box=1:boxcolor=black@0.65:boxborderw=18` +
          `:x=(w-text_w)/2:y=h-(text_h+120)`;

        for (let idx = 0; idx < rawLines.length; idx++) {
          const lineText = rawLines[idx];
          // Auto-Wrap Removed (User request: "Why wrap?")
          // const wrappedText = wrapText(lineText, 25); 

          // Write text to file to avoid escaping hell
          const subFileName = `sub_${i}_${idx}.txt`;
          const subFilePath = path.join(workDir, subFileName);
          await fs.writeFile(subFilePath, lineText, 'utf8');

          // Escape colon for textfile as well
          const safeSubPath = subFilePath.replace(/\\/g, "/").replace(/:/g, "\\:");

          const isLast = idx === rawLines.length - 1;
          const ratio = lineText.length / totalChars;
          const dur = isLast ? (target - currentTime) : (target * ratio);
          const endTime = currentTime + dur;

          // 마지막 줄이면 [vout]으로, 아니면 임시 이름으로
          const outLabel = isLast ? "[vout]" : `[sub${idx}]`;

          // Use textfile instead of text
          // Also escape colon in the path if needed (already done above)

          // Debugging log to confirm escaping
          const filterStr = `${lastV}drawtext=${style}:textfile='${safeSubPath}'` +
            `:enable=between(t\\,${currentTime.toFixed(3)}\\,${endTime.toFixed(3)})${outLabel}`;

          filters.push(filterStr);
          lastV = outLabel;
          currentTime = endTime;
        }
      } else {
        // 자막이 없으면 [v1]을 그대로 [vout]으로 복사
        filters.push(`${vAfterLogo}copy[vout]`);
      }

      console.log("🔍 FFmpeg Filters:", JSON.stringify(filters, null, 2));

      // 4-3. 오디오 믹스 (BGM + TTS)
      // ✅ [수정됨] BGM 필터 안전성 강화
      const audioMix = buildAudioMixFilters({
        hasBgm,
        targetSec: target,
        bgmGainDb: hookBgmGainDb,
        duckDb: hookDuckDb,
        fadeSec: hookBgmFadeSec,
        ttsInputIndex: 1,
        bgmInputIndex: hasBgm ? (hasLogo ? 3 : 2) : undefined,
      });
      filters.push(audioMix.filter);

      // 최종 매핑
      args.push("-filter_complex", filters.join(";"), "-map", "[vout]", "-map", audioMix.map);
      args.push(
        "-t", String(target),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        clipPath
      );

      console.log(`[Rentering] Clip ${i + 1}/${scenesFiltered.length} processing...`);
      try {
        await run("ffmpeg", args, workDir);
        clipPaths.push(clipPath);
      } catch (err: any) {
        console.error(`Clip ${i + 1} render failed:`, err);
        throw new Error(`Scene ${i + 1} render failed: ${err.message}`);
      }
    }

    // concat
    const finalPath = path.join(workDir, "final.mp4");
    const concatArgs: string[] = ["-hide_banner", "-loglevel", "error", "-y"];
    for (const p of clipPaths) concatArgs.push("-i", p);

    const parts = clipPaths.map((_, i) => `[${i}:v:0][${i}:a:0]`).join("");
    const filter = `${parts}concat=n=${clipPaths.length}:v=1:a=1[outv][outa]`;

    concatArgs.push(
      "-filter_complex", filter,
      "-map", "[outv]", "-map", "[outa]",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
      "-c:a", "aac", "-b:a", "192k",
      "-movflags", "+faststart",
      finalPath
    );

    console.log("[Rendering] Concat processing...");
    await run("ffmpeg", concatArgs, workDir);

    const outBuf = await fs.readFile(finalPath);
    return new NextResponse(outBuf, {
      status: 200,
      headers: { "Content-Type": "video/mp4", "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    console.error("[Render API Error]", e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
