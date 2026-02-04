// src/app/api/veo/route.ts
import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getTokenValue(access: any): string | null {
    if (!access) return null;
    if (typeof access === "string") return access;
    if (typeof access?.token === "string") return access.token;
    return null;
}

// 🆕 민감한 단어 제거/순화
function sanitizePrompt(prompt: string): string {
    // 민감한 단어 목록 (Vertex AI가 거부하는 단어들)
    const sensitiveWords = [
        // 폭력/위험
        '충격', '위험', '경고', '폭발', '죽음', '살인', '공격', '테러', '전쟁', '무기',
        'shock', 'danger', 'warning', 'explosion', 'death', 'kill', 'attack', 'terror', 'war', 'weapon',
        // 유명인 (저작권 이슈)
        '젠슨황', 'Jensen Huang', '일론 머스크', 'Elon Musk', '트럼프', 'Trump',
        // 기타
        '해킹', 'hacking', '범죄', 'crime', '마약', 'drug'
    ];

    let sanitized = prompt;
    for (const word of sensitiveWords) {
        sanitized = sanitized.replace(new RegExp(word, 'gi'), '');
    }

    // 빈 줄 정리
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // 너무 짧아지면 기본 프롬프트 추가
    if (sanitized.length < 20) {
        sanitized = "A professional presenter explaining important information in a modern studio setting. " + sanitized;
    }

    console.log("🔄 Sanitized prompt:", sanitized.slice(0, 100) + "...");
    return sanitized;
}

// 🆕 폴링 로직을 별도 함수로 분리
async function pollForResult(
    token: string,
    opName: string,
    projectId: string,
    location: string,
    modelId: string,
    apiVersion: string,
    apiHost: string
) {
    const fetchUrl =
        `${apiHost}/${apiVersion}/projects/${projectId}/locations/${location}` +
        `/publishers/google/models/${modelId}:fetchPredictOperation`;

    await sleep(1500);

    for (let i = 0; i < 90; i++) {
        const pollRes = await fetch(fetchUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ operationName: opName }),
        });

        const pollText = await pollRes.text();
        if (!pollRes.ok) {
            return NextResponse.json(
                { error: `상태 확인 실패(${pollRes.status}): ${pollText}` },
                { status: pollRes.status }
            );
        }

        const pollData: any = JSON.parse(pollText);

        if (pollData?.done) {
            if (pollData?.error?.message) {
                return NextResponse.json({ error: pollData.error.message }, { status: 500 });
            }

            const videoBase64 =
                pollData?.response?.videos?.[0]?.video?.bytesBase64Encoded ||
                pollData?.response?.videos?.[0]?.bytesBase64Encoded ||
                pollData?.response?.result?.videos?.[0]?.video?.bytesBase64Encoded ||
                pollData?.response?.result?.videos?.[0]?.bytesBase64Encoded;

            const imageBase64 =
                pollData?.response?.images?.[0]?.bytesBase64Encoded ||
                pollData?.response?.result?.images?.[0]?.bytesBase64Encoded;

            if (videoBase64) {
                return NextResponse.json({ videoUrl: `data:video/mp4;base64,${videoBase64}` });
            }
            if (imageBase64) {
                return NextResponse.json({ imageDataUrl: `data:image/png;base64,${imageBase64}` });
            }

            return NextResponse.json(
                { error: "완료됐는데 video/image 데이터가 없음", dump: pollData },
                { status: 500 }
            );
        }

        await sleep(2000);
    }

    return NextResponse.json({ error: "타임아웃" }, { status: 504 });
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const prompt = String(body?.prompt || body?.scenes?.[0]?.promptEn || "").trim();
        const aspectRatio = body?.aspectRatio === "9:16" ? "9:16" : "16:9";

        if (!prompt) {
            return NextResponse.json({ error: "prompt가 비었어요" }, { status: 400 });
        }

        const projectId = process.env.GOOGLE_PROJECT_ID || "gen-lang-client-0372916912";
        const location = "us-central1";
        const modelId = "veo-3.0-fast-generate-001";
        const apiVersion = "v1beta1";
        const apiHost = `https://${location}-aiplatform.googleapis.com`;

        // ✅ 인증
        const auth = new GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/cloud-platform"],
            projectId,
        });
        const client = await auth.getClient();
        const access = await client.getAccessToken();
        const token = getTokenValue(access);

        if (!token) {
            return NextResponse.json({ error: "Google access token 생성 실패" }, { status: 500 });
        }

        // ✅ 1) Start: predictLongRunning
        const startUrl =
            `${apiHost}/${apiVersion}/projects/${projectId}/locations/${location}` +
            `/publishers/google/models/${modelId}:predictLongRunning`;

        const startRes = await fetch(startUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: {
                    aspectRatio,
                    sampleCount: 1,
                },
            }),
        });

        const startText = await startRes.text();
        if (!startRes.ok) {
            // 🆕 콘텐츠 정책 위반 감지 시 프롬프트 순화 후 재시도
            if (startText.includes("usage guidelines") || startText.includes("violate") || startText.includes("policy")) {
                console.warn("⚠️ Veo content policy violation. Sanitizing prompt...");

                // 민감한 단어 제거/교체
                const sanitizedPrompt = sanitizePrompt(prompt);

                // 재시도
                const retryRes = await fetch(startUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        instances: [{ prompt: sanitizedPrompt }],
                        parameters: {
                            aspectRatio,
                            sampleCount: 1,
                        },
                    }),
                });

                const retryText = await retryRes.text();
                if (retryRes.ok) {
                    console.log("✅ Retry with sanitized prompt succeeded");
                    // 이 결과로 계속 진행 (startData 업데이트)
                    const retryData = JSON.parse(retryText);
                    const opNameRetry = retryData?.name;
                    if (opNameRetry) {
                        // opName을 retryData의 것으로 교체하고 아래 폴링으로 계속
                        return await pollForResult(token, opNameRetry, projectId, location, modelId, apiVersion, apiHost);
                    }
                }
                // 재시도도 실패하면 원래 에러 반환
            }

            return NextResponse.json({ error: `Veo 시작 실패: ${startText}` }, { status: startRes.status });
        }

        const startData: any = JSON.parse(startText);
        const opName: string = startData?.name; // projects/.../operations/...
        if (!opName) {
            return NextResponse.json({ error: `operation name(name) 없음: ${startText}` }, { status: 500 });
        }

        // ✅ 2) Poll: fetchPredictOperation (POST로 폴링)
        const fetchUrl =
            `${apiHost}/${apiVersion}/projects/${projectId}/locations/${location}` +
            `/publishers/google/models/${modelId}:fetchPredictOperation`;

        // 약간 대기
        await sleep(1500);

        for (let i = 0; i < 90; i++) {
            const pollRes = await fetch(fetchUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ operationName: opName }),
            });

            const pollText = await pollRes.text();
            if (!pollRes.ok) {
                return NextResponse.json(
                    { error: `상태 확인 실패(${pollRes.status}): ${pollText}` },
                    { status: pollRes.status }
                );
            }

            const pollData: any = JSON.parse(pollText);

            if (pollData?.done) {
                if (pollData?.error?.message) {
                    return NextResponse.json({ error: pollData.error.message }, { status: 500 });
                }

                const videoBase64 =
                    pollData?.response?.videos?.[0]?.video?.bytesBase64Encoded ||
                    pollData?.response?.videos?.[0]?.bytesBase64Encoded ||
                    pollData?.response?.result?.videos?.[0]?.video?.bytesBase64Encoded ||
                    pollData?.response?.result?.videos?.[0]?.bytesBase64Encoded;

                const imageBase64 =
                    pollData?.response?.images?.[0]?.bytesBase64Encoded ||
                    pollData?.response?.result?.images?.[0]?.bytesBase64Encoded;

                if (videoBase64) {
                    return NextResponse.json({ videoUrl: `data:video/mp4;base64,${videoBase64}` });
                }
                if (imageBase64) {
                    return NextResponse.json({ imageDataUrl: `data:image/png;base64,${imageBase64}` });
                }

                return NextResponse.json(
                    { error: "완료됐는데 video/image 데이터가 없음", dump: pollData },
                    { status: 500 }
                );
            }

            await sleep(2000);
        }

        return NextResponse.json({ error: "타임아웃" }, { status: 504 });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
    }
}
