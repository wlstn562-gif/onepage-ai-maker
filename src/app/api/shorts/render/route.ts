import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const runtime = "nodejs";

// Job Storage (Simple File Cache)
const JOB_FILE = path.join(os.tmpdir(), "shorts_render_jobs.json");

async function getJobs() {
    try {
        const data = await fs.readFile(JOB_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function saveJob(id: string, data: any) {
    const jobs = await getJobs();
    jobs[id] = { ...jobs[id], ...data, lastUpdated: Date.now() };
    await fs.writeFile(JOB_FILE, JSON.stringify(jobs, null, 2));
}

// Helper to download/create asssets
async function generateAsset(prompt: string, type: "image" | "video", apiKey: string): Promise<string> {
    // Determine API Endpoint
    // Note: We are running on server, so we can't fetch localhost easily without absolute URL. 
    // Better to invoke logic directly or use external URL. 
    // For simplicity, we will simulate the asset generation logic directly here or use a helper.

    // For Image: Use Imagen
    if (type === "image") {
        const url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict";
        const r = await fetch(url, {
            method: "POST",
            headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: { sampleCount: 1, aspectRatio: "9:16" }
            }),
        });
        const data = await r.json();
        const b64 = data?.predictions?.[0]?.bytesBase64Encoded || data?.predictions?.[0]?.imageBytes;
        if (!b64) throw new Error("Image Gen Failed");
        return `data:image/png;base64,${b64}`;
    }

    // For Video (Mock for now, as Veo isn't fully integrated in context)
    // Or return a placeholder video data URL
    return ""; // TODO
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("id");
    if (!jobId) return NextResponse.json({ error: "No Job ID" }, { status: 400 });

    const jobs = await getJobs();
    const job = jobs[jobId];
    if (!job) return NextResponse.json({ error: "Job Not Found" }, { status: 404 });

    return NextResponse.json(job);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { clip, projectId, host, settings } = body;

        if (!clip || !clip.id) return NextResponse.json({ error: "No Clip Data" }, { status: 400 });

        const jobId = `${projectId}_${clip.id}_${Date.now()}`;
        const apiKey = process.env.GOOGLE_API_KEY || "";
        const elevenKey = process.env.ELEVENLABS_API_KEY || "";

        // Initial Job State
        await saveJob(jobId, {
            status: "queued",
            progress: 0,
            step: "init",
            clipId: clip.id,
            logs: ["Job Started"],
        });

        // Async Processing
        (async () => {
            try {
                // --- STEP 1: Plan Alignment (Text -> Visual Scenes) ---
                // Distribute script text into visuals
                await saveJob(jobId, { status: "processing", step: "planning", progress: 5, logs: ["Aligning Script to Scenes..."] });

                const visualScenes = clip.scenes || [];
                const fullText = clip.scriptKo || "";

                // Split text by logic (e.g., sentences)
                const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];

                // Map sentences to visual scenes
                // Strategy: Fill scenes sequentially. If sentences run out, leave text empty (will become silence).
                // If scenes run out, combine remaining sentences into last scene.

                const itemsPerScene = Math.max(1, Math.floor(sentences.length / visualScenes.length));
                // Remainder handling

                const renderScenes: any[] = [];
                let sentenceIdx = 0;

                for (let i = 0; i < visualScenes.length; i++) {
                    const visual = visualScenes[i];

                    // Assign Text
                    let sceneSentences: string[] = [];

                    if (sentenceIdx < sentences.length) {
                        // If last scene, take all remaining
                        if (i === visualScenes.length - 1) {
                            sceneSentences = sentences.slice(sentenceIdx);
                        } else {
                            sceneSentences = sentences.slice(sentenceIdx, sentenceIdx + itemsPerScene);
                        }
                        sentenceIdx += sceneSentences.length;
                    }

                    const sceneText = sceneSentences.join(" ").trim();

                    // Assign Captions (Split into ko1..ko4 for display)
                    const lines = [];
                    let buf = "";
                    for (const char of sceneText) {
                        buf += char;
                        if (buf.length > 20 || (buf.length > 15 && char === " ")) {
                            lines.push(buf);
                            buf = "";
                        }
                    }
                    if (buf) lines.push(buf);

                    renderScenes.push({
                        ...visual, // type, promptEn, durationSec
                        text: sceneText,
                        ko1: lines[0] || "",
                        ko2: lines[1] || "",
                        ko3: lines[2] || "",
                        ko4: lines[3] || "",
                    });
                }

                // --- STEP 2: Generate Visual Assets ---
                await saveJob(jobId, { step: "visuals", progress: 10, logs: ["Generating Images/Videos..."] });

                const processedScenes = []; // Create a new array to store processed scenes

                for (let i = 0; i < renderScenes.length; i++) {
                    const s = renderScenes[i];
                    let finalImageUrl = s.imageUrl || s.assetUrl;
                    let finalVideoUrl = s.videoUrl;

                    // If no asset, generate it
                    if (!finalImageUrl && !finalVideoUrl && s.promptEn) {
                        try {
                            const isVideo = s.type === "video" && (i === 0 || i === renderScenes.length - 1);
                            const type = isVideo ? "video" : "image";

                            // Call API
                            const imgRes = await fetch(`${host}/api/image`, {
                                method: "POST",
                                body: JSON.stringify({ prompt: s.promptEn, aspectRatio: "9:16" })
                            });

                            if (!imgRes.ok) {
                                const err = await imgRes.text();
                                throw new Error(`Image API Error: ${err}`);
                            }

                            const imgData = await imgRes.json();
                            if (!imgData.imageUrl) throw new Error("API returned no imageUrl");

                            finalImageUrl = imgData.imageUrl;

                        } catch (e: any) {
                            console.error(`Asset Gen Failed [${i}]`, e.message);
                            // Fallback to Placeholder (Base64 Black Image 9:16)
                            finalImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
                            await saveJob(jobId, { logs: [`⚠️ Scene ${i + 1} Gen Failed. Using Fallback.`] });
                        }
                    }

                    // Final Safety Check
                    if (!finalImageUrl && !finalVideoUrl) {
                        finalImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
                    }

                    // Push the updated scene to the list
                    processedScenes.push({
                        ...s,
                        imageUrl: finalImageUrl,
                        videoUrl: finalVideoUrl,
                        assetUrl: finalImageUrl || finalVideoUrl
                    });

                    await saveJob(jobId, { progress: 10 + Math.floor(((i + 1) / renderScenes.length) * 30), logs: [`Generated Scene ${i + 1}/${renderScenes.length}`] });
                }

                // Update renderScenes pointer
                renderScenes.length = 0;
                renderScenes.push(...processedScenes);

                // --- STEP 3: Generate Audio (TTS) ---
                await saveJob(jobId, { step: "tts", progress: 40, logs: ["Synthesizing Voice..."] });

                // Silent MP3 (Base64) - 0.5s Silence
                const SILENT_AUDIO = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA//////////////////////////////////////////////////////////////////8AAABLbGFtZTMuMTAwA7AAAAAAAAAAGDkAAAAAAACcQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQxAADgnABGiAAQBCqgCRMAAAiDAF//8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3///8z//z///993//+f/yNg3";

                for (let i = 0; i < renderScenes.length; i++) {
                    const s = renderScenes[i];

                    if (!s.text) {
                        s.audioUrl = SILENT_AUDIO;
                        continue;
                    }

                    try {
                        const voiceId = clip.audioPlan?.voiceId || "sKvyOExD5AK7Ru1EOYvx";
                        const ttsRes = await fetch(`${host}/api/tts`, {
                            method: "POST",
                            body: JSON.stringify({ text: s.text, voiceId })
                        });
                        const ttsData = await ttsRes.json();
                        if (ttsData.audioDataUrl) {
                            s.audioUrl = ttsData.audioDataUrl;
                        } else {
                            console.warn(`TTS empty for scene ${i}, using silence`);
                            s.audioUrl = SILENT_AUDIO;
                        }
                    } catch (e) {
                        console.error(`TTS Failed [${i}]`, e);
                        s.audioUrl = SILENT_AUDIO;
                    }

                    await saveJob(jobId, { progress: 40 + Math.floor(((i + 1) / renderScenes.length) * 20), logs: [`Voice Scene ${i + 1}/${renderScenes.length}`] });
                }

                // --- STEP 4: Render (FFmpeg) ---
                await saveJob(jobId, { step: "rendering", progress: 70, logs: ["Final Rendering..."] });

                const renderPayload = {
                    scenes: renderScenes,
                    settings: {
                        fps: 30,
                        aspectRatio: "9:16",
                        includeSubtitle: true,
                        hookBgmUrl: settings?.bgmUrl,
                        hookBgmGainDb: -15,
                    }
                };

                // Debug: Log payload
                console.log("Sending Render Payload:", JSON.stringify(renderPayload.scenes.map(s => ({
                    type: s.type,
                    hasImage: !!s.imageUrl,
                    hasAudio: !!s.audioUrl,
                    textLen: s.text?.length
                })), null, 2));

                const renderRes = await fetch(`${host}/api/render`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(renderPayload)
                });

                if (!renderRes.ok) {
                    const errTxt = await renderRes.text();
                    throw new Error(`Render API Failed: ${errTxt}`);
                }

                const blob = await renderRes.blob();
                const arrayBuffer = await blob.arrayBuffer();

                // Save Output
                const fileName = `shorts_${clip.id}_${Date.now()}.mp4`;
                const outPath = path.join(process.cwd(), "public", "outputs", fileName);

                // Ensure dir
                await fs.mkdir(path.dirname(outPath), { recursive: true });
                await fs.writeFile(outPath, Buffer.from(arrayBuffer));

                const publicUrl = `/outputs/${fileName}`;

                await saveJob(jobId, {
                    status: "done",
                    progress: 100,
                    videoUrl: publicUrl,
                    logs: ["Rendering Complete!", "Saved to Project"]
                });

            } catch (err: any) {
                console.error("Job Failed", err);
                await saveJob(jobId, { status: "error", error: err.message || "Unknown Job Error" });
            }
        })();

        return NextResponse.json({ jobId });

    } catch (e: any) {
        console.error("API Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
