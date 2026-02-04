import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), ".data", "files");

function ensureDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function safeId(id: string) {
    return id.replace(/[^a-zA-Z0-9_\-\.]/g, "");
}

function inferExt(mime: string) {
    if (mime.includes("video/mp4")) return "mp4";
    if (mime.includes("audio/mpeg")) return "mp3";
    if (mime.includes("audio/mp3")) return "mp3";
    if (mime.includes("audio/wav")) return "wav";
    if (mime.includes("image/png")) return "png";
    if (mime.includes("image/jpeg")) return "jpg";
    return "bin";
}

function parseDataUrl(dataUrl: string) {
    const m = /data:\s*([^;]+);\s*base64,\s*([\s\S]*)/.exec(dataUrl || "");
    if (!m) return null;
    return { mime: m[1], b64: m[2] };
}

// POST /api/file  { dataUrl: "data:...;base64,....", filename?: "x.mp4" }
// => { id, url }
export async function POST(req: NextRequest) {
    try {
        ensureDir();
        const body = await req.json();
        const dataUrl = String(body?.dataUrl || "");
        if (!dataUrl.startsWith("data:")) {
            return NextResponse.json({ error: "dataUrl이 없습니다." }, { status: 400 });
        }

        const parsed = parseDataUrl(dataUrl);
        if (!parsed) {
            return NextResponse.json({ error: "dataUrl 파싱 실패" }, { status: 400 });
        }

        const ext = inferExt(parsed.mime);
        const hash = crypto.createHash("sha1").update(parsed.b64).digest("hex").slice(0, 16);
        const id = safeId(`${Date.now()}_${hash}.${ext}`);
        const filePath = path.join(DATA_DIR, id);

        fs.writeFileSync(filePath, Buffer.from(parsed.b64, "base64"));

        return NextResponse.json({ id, url: `/api/file?id=${id}` });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "file 저장 실패" }, { status: 500 });
    }
}

// GET /api/file?id=xxx.mp4
export async function GET(req: NextRequest) {
    try {
        ensureDir();
        const { searchParams } = new URL(req.url);
        const id = safeId(String(searchParams.get("id") || ""));
        if (!id) return NextResponse.json({ error: "id 없음" }, { status: 400 });

        const filePath = path.join(DATA_DIR, id);
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "파일 없음" }, { status: 404 });
        }

        const ext = path.extname(id).toLowerCase();
        const mime =
            ext === ".mp4" ? "video/mp4" :
                ext === ".mp3" ? "audio/mpeg" :
                    ext === ".wav" ? "audio/wav" :
                        ext === ".png" ? "image/png" :
                            ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
                                "application/octet-stream";

        const buf = fs.readFileSync(filePath);
        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Type": mime,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "file 읽기 실패" }, { status: 500 });
    }
}
