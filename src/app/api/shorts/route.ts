import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { mode, script, videoUrl } = body;

        // 1. Split Script into 6 Viral Shorts
        if (mode === "split") {
            if (!script) return NextResponse.json({ error: "No script provided" }, { status: 400 });

            const systemPrompt = `
You are a viral content expert.
Analyze the provided long-form video script.
Extract exactly 6 distinct, viral short-form video concepts (approx 30-60s each).
For each short, provide:
1. Title (Catchy)
2. Hook (The opening line from the script)
3. Summary (What this part is about)
4. Estimated Duration (e.g. "45s")

Return JSON format:
{
  "shorts": [
    { "id": 1, "title": "...", "hook": "...", "summary": "...", "duration": "..." },
    ...
  ]
}
`;
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Full Script:\n${script}` },
                ],
                response_format: { type: "json_object" },
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("No content from OpenAI");

            const parsed = JSON.parse(content);
            return NextResponse.json(parsed);
        }

        // 2. Generate Detailed Plan for ONE Short
        if (mode === "generate_plan") {
            const { concept, fullScript } = body; // concept: { title, hook, summary }

            if (!concept) return NextResponse.json({ error: "No concept provided" }, { status: 400 });

            const systemPrompt = `
You are a Short-Form Video Director (YouTube Shorts/Reels/TikTok).
Your task is to create a complete production plan for a 40~55s viral short based on the provided concept.

✅ **Input Concept**
- Title: ${concept.title}
- Hook: ${concept.hook}
- Summary: ${concept.summary}

✅ **Goal**
Generate strict JSON data for a video pipeline:
1. **Script (KO)**: 40~55s duration. Viral speech style.
   - Structure: [Hook 3s] -> [Build-Up 15s] -> [Twist/Climax 20s] -> [Conclusion 5s]
2. **Captions**: Split script into 1-2 lines chunks.
   - Max 16 chars per line.
   - Pick "Emphasis Words" (Yellow/Red highlights).
3. ** Scenes (Visuals)**: 
   - Mix of Image (2.5s) and Video (4s). Total duration must match script.
   - **CRITICAL**: Image Prompt must specify "NO TEXT, NO LETTERS".
   - **CRITICAL**: High contrast, center subject, simple background.
4. **Thumbnail Text**: 3 Candidates (15~22 chars).
   - Style: "Shocking Fact + Reason" or "Question + Twist".

✅ **Output JSON Format**
{
  "scriptKo": "Full script text...",
  "captions": [
    { "lines": ["Line 1 text..."], "emphasis": ["Keyword"] },
    ...
  ],
  "scenes": [
    { "type": "video", "durationSec": 4, "promptEn": "Cinematic 4k drone shot of... no text" },
    { "type": "image", "durationSec": 2.5, "promptEn": "Close up of... no text, no letters" },
    ...
  ],
  "thumbnailTextCandidates": [
    "Text candidate 1...",
    "Text candidate 2...",
    "Text candidate 3..."
  ],
  "audioPlan": {
    "voiceId": "sKvyOExD5AK7Ru1EOYvx", // Recommended voice
    "speed": 1.1,
    "gainDb": 0
  }
}
`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Full Original Script Context:\n${fullScript.slice(0, 1000)}...` },
                ],
                response_format: { type: "json_object" },
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("No content");

            return NextResponse.json(JSON.parse(content));
        }

        // 3. Mock Render (since real ffmpeg is heavy)
        if (mode === "render") {
            // In a real app, this would trigger a cloud render job
            // For now, we return the original URL with a simulated delay
            await new Promise((r) => setTimeout(r, 2000));
            return NextResponse.json({ url: videoUrl, message: "Mock render complete" });
        }

        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
