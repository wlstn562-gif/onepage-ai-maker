// src/app/api/image/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_API_KEY 없음(.env.local 확인)" }, { status: 500 });
    }

    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();

    if (!prompt) {
      return NextResponse.json({ error: "prompt가 비어있음" }, { status: 400 });
    }

    const model = "gemini-2.5-flash-preview-05-20";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["image", "text"] },
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json({ error: data?.error?.message || "API error", raw: data }, { status: 500 });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p: any) => p?.inlineData?.data);
    const base64 = imgPart?.inlineData?.data;

    if (!base64) {
      return NextResponse.json({ error: "이미지 없음", raw: data }, { status: 500 });
    }

    const mime = imgPart?.inlineData?.mimeType || "image/png";
    return NextResponse.json({ imageUrl: `data:${mime};base64,${base64}` });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}