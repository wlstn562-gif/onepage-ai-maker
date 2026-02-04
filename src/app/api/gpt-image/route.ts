// src/app/api/gpt-image/route.ts
// GPT-4o/gpt-image-1 Image Generation API (Same as ChatGPT)
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "OPENAI_API_KEY 없음" }, { status: 500 });
        }

        const { prompt, size = "1536x1024" } = await req.json();

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "prompt가 필요합니다" }, { status: 400 });
        }

        console.log("🎨 GPT-Image-1 Request:", prompt.substring(0, 100) + "...");

        // ✅ Use gpt-image-1 (Same model as ChatGPT uses)
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-image-1", // 🚀 ChatGPT's Image Model
                prompt: prompt,
                n: 1,
                size: size, // "1536x1024" for 16:9 landscape
                quality: "high",
                output_format: "png", // ✅ Fixed: Use 'png' not 'b64_json'
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ GPT-Image-1 Error:", JSON.stringify(data, null, 2));
            return NextResponse.json({
                error: data?.error?.message || "GPT-Image-1 API error",
                raw: data
            }, { status: response.status });
        }

        // gpt-image-1 returns URL, need to fetch and convert to base64
        const imageUrl = data?.data?.[0]?.url;
        if (!imageUrl) {
            // Try b64 field (in case API changes)
            const b64 = data?.data?.[0]?.b64_json;
            if (b64) {
                return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });
            }
            console.error("❌ No image URL in response:", JSON.stringify(data, null, 2));
            return NextResponse.json({ error: "이미지 URL 없음", raw: data }, { status: 500 });
        }

        // Fetch the image and convert to base64
        const imgRes = await fetch(imageUrl);
        const imgBuffer = await imgRes.arrayBuffer();
        const b64 = Buffer.from(imgBuffer).toString("base64");

        console.log("✅ GPT-Image-1 Success!");
        return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` });

    } catch (e: any) {
        console.error("❌ GPT-Image-1 Exception:", e);
        return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
    }
}
