// src/app/api/tts/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = { text: string; voiceId: string };

function jsonError(msg: string, extra?: any, status = 500) {
  return NextResponse.json({ error: msg, extra }, { status });
}

export async function POST(req: Request) {
  try {
    const { text, voiceId } = (await req.json()) as Body;

    const apiKey = process.env.ELEVENLABS_API_KEY || "";
    if (!apiKey) return jsonError("ELEVENLABS_API_KEY가 설정되지 않았습니다 (.env 확인)", null, 400);

    const t = String(text || "").trim();
    const v = String(voiceId || "").trim();
    if (!t) return jsonError("text가 비었습니다.", null, 400);
    if (!v) return jsonError("voiceId가 비었습니다.", null, 400);

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(v)}`;

    const enableSsml = /<\s*break\b/i.test(t); // <break ...> 있으면 SSML 파싱 켬

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: t,
        model_id: "eleven_multilingual_v2",
        enable_ssml_parsing: enableSsml,
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return jsonError("ElevenLabs TTS 호출 실패", txt, r.status);
    }

    const arrayBuffer = await r.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const b64 = buffer.toString("base64");
    return NextResponse.json({ audioDataUrl: `data:audio/mpeg;base64,${b64}` });
  } catch (e: any) {
    console.error("TTS Error:", e);
    return jsonError(e?.message || String(e));
  }
}
