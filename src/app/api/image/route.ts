// src/app/api/image/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_API_KEY 없음(.env.local 확인)" }, { status: 500 });
    }

    const { prompt, aspectRatio } = (await req.json().catch(() => ({}))) as {
      prompt?: string;
      aspectRatio?: "16:9" | "9:16";
    };

    const p = String(prompt || "").trim();
    const ar = aspectRatio === "9:16" ? "9:16" : "16:9";

    if (!p) {
      return NextResponse.json({ error: "prompt가 비어있음" }, { status: 400 });
    }

    // ✅ Imagen REST API (공식 문서)
    // POST https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict
    const url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict";

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt: p }],
        parameters: {
          sampleCount: 1,
          aspectRatio: ar,
          personGeneration: "allow_adult", // ✅ Enable to bypass safety filters for celebrities
        },
      }),
    });

    const text = await r.text();
    console.log("🔍 Google API Status:", r.status, r.statusText);
    console.log("🔍 Google API Raw Response:", text.substring(0, 500)); // Log first 500 chars

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("❌ JSON Parse Error:", e);
      return NextResponse.json({ error: "Google API non-JSON response", raw: text }, { status: 500 });
    }

    if (!r.ok) {
      console.error("❌ Imagen API Error Response:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: data?.error?.message || "Imagen API error", raw: data }, { status: 500 });
    }

    // 응답 형식: predictions[0].bytesBase64Encoded (또는 이미지 필드)
    const b64 =
      data?.predictions?.[0]?.bytesBase64Encoded ||
      data?.predictions?.[0]?.image?.imageBytes ||
      data?.predictions?.[0]?.imageBytes;

    if (!b64) {
      console.error("❌ No Image Data in Response:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "이미지 base64 없음 (응답 확인 필요)", raw: data }, { status: 500 });
    }

    // Imagen은 보통 PNG
    return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
