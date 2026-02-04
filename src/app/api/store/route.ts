// src/app/api/store/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// ✅ /api/file 과 동일한 저장소로 통일
const DATA_DIR = path.join(process.cwd(), ".data", "files");

async function ensureDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
}

function dataUrlToBuffer(dataUrl: string): { buf: Buffer; ext: string; mime: string } {
    const m = /data:\s*([^;]+);\s*base64,\s*([\s\S]*)/.exec(dataUrl || "");
    if (!m) throw new Error("dataUrl 형식이 아닙니다");

    const mime = String(m[1] || "").toLowerCase();
    const buf = Buffer.from(String(m[2] || ""), "base64");

    const ext =
        mime.includes("video/mp4") ? "mp4" :
            mime.includes("image/jpeg") ? "jpg" :
                mime.includes("image/png") ? "png" :
                    (mime.includes("audio/mpeg") || mime.includes("audio/mp3")) ? "mp3" :
                        (mime.includes("audio/mp4") || mime.includes("audio/m4a")) ? "m4a" :
                            mime.includes("audio/wav") ? "wav" :
                                "bin";

    return { buf, ext, mime };
}

export async function POST(req: Request) {
    try {
        await ensureDir();

        const contentType = req.headers.get("content-type") || "";
        let buf: Buffer;
        let ext = "png";
        let mime = "image/png";
        let filename = "";

        if (contentType.includes("multipart/form-data")) {
            // ✅ Handle FormData
            const formData = await req.formData();
            const file = formData.get("file") as File;
            if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

            filename = (formData.get("filename") as string) || file.name;
            const arrayBuffer = await file.arrayBuffer();
            buf = Buffer.from(arrayBuffer);

            // Infer extension from mime or filename
            const type = file.type;
            if (type.includes("jpeg")) { ext = "jpg"; mime = "image/jpeg"; }
            else if (type.includes("png")) { ext = "png"; mime = "image/png"; }
            else if (type.includes("webp")) { ext = "webp"; mime = "image/webp"; }
            else if (type.includes("mp4")) { ext = "mp4"; mime = "video/mp4"; }
            else if (type.includes("mpeg") || type.includes("mp3")) { ext = "mp3"; mime = "audio/mpeg"; }
        } else {
            // ✅ Handle JSON (Legacy / DataURL)
            const body = await req.json().catch(() => ({}));
            const dataUrl = String(body?.dataUrl || "");
            filename = body?.filename || "";

            if (dataUrl.startsWith("http")) {
                const res = await fetch(dataUrl);
                if (!res.ok) throw new Error(`Failed to fetch remote URL: ${res.statusText}`);
                const arrayBuffer = await res.arrayBuffer();
                buf = Buffer.from(arrayBuffer);
                const cType = res.headers.get("content-type") || "";
                if (cType.includes("jpeg")) { ext = "jpg"; mime = "image/jpeg"; }
                else if (cType.includes("png")) { ext = "png"; mime = "image/png"; }
                else if (cType.includes("webp")) { ext = "webp"; mime = "image/webp"; }
                else if (cType.includes("mp4")) { ext = "mp4"; mime = "video/mp4"; }
            } else if (dataUrl.startsWith("data:")) {
                const parsed = dataUrlToBuffer(dataUrl);
                buf = parsed.buf;
                ext = parsed.ext;
                mime = parsed.mime;
            } else {
                return NextResponse.json({ error: "Invalid content" }, { status: 400 });
            }
        }

        // ✅ Persistence Filename Logic
        let id = filename ? filename : `${randomUUID()}.${ext}`;
        id = path.basename(id);
        const filePath = path.join(DATA_DIR, id);

        await fs.writeFile(filePath, buf);

        return NextResponse.json({
            ok: true,
            id,
            ext,
            mime,
            url: `/api/file?id=${id}`,
        });
    } catch (e: any) {
        console.error("Store Error:", e);
        return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
    }
}
