import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Perplexity API or fallback to web search for facts
export async function POST(req: Request) {
    const body = await req.json();
    const { action, topic, query } = body;

    // Perplexity API 키 확인
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    try {
        if (action === "search_facts") {
            // 주제 관련 팩트 검색
            if (!topic) {
                return NextResponse.json({ error: "topic이 필요합니다." }, { status: 400 });
            }

            const searchQuery = `"${topic}" 관련 구체적인 팩트, 통계, 사례, 인물, 날짜를 알려줘. 출처도 포함해서.`;

            if (perplexityKey) {
                // Perplexity API 사용
                const res = await fetch("https://api.perplexity.ai/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${perplexityKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "llama-3.1-sonar-small-128k-online",
                        messages: [
                            { role: "system", content: "한국어로 답변해. 구체적인 팩트, 숫자, 날짜, 인물명을 포함해서 답변해." },
                            { role: "user", content: searchQuery }
                        ],
                        max_tokens: 1000
                    })
                });

                const data = await res.json();
                const result = data.choices?.[0]?.message?.content || "";

                return NextResponse.json({
                    success: true,
                    facts: result,
                    source: "perplexity"
                });
            } else {
                // OpenAI 대체 (웹 검색 없음, 기존 지식만)
                const openaiKey = process.env.OPENAI_API_KEY;
                if (!openaiKey) {
                    return NextResponse.json({ error: "API 키 없음" }, { status: 500 });
                }

                const res = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openaiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: "너는 유튜브 콘텐츠 제작을 위한 팩트 조사 전문가야. 구체적인 숫자, 날짜, 인물명, 사례를 포함해서 답변해." },
                            { role: "user", content: `"${topic}"에 대한 유튜브 영상에 활용할 수 있는 구체적인 팩트 5가지를 알려줘. 각 팩트에는 숫자, 날짜, 인물명 등 구체적인 정보가 포함되어야 해.` }
                        ],
                        max_tokens: 800
                    })
                });

                const data = await res.json();
                const result = data.choices?.[0]?.message?.content || "";

                return NextResponse.json({
                    success: true,
                    facts: result,
                    source: "openai"
                });
            }
        }

        if (action === "fact_check") {
            // 대본 팩트 체크
            if (!query) {
                return NextResponse.json({ error: "query가 필요합니다." }, { status: 400 });
            }

            const checkQuery = `다음 내용에서 잘못된 정보가 있는지 검증해줘. 틀린 부분이 있으면 수정 제안도 해줘:\n\n${query.slice(0, 1500)}`;

            const openaiKey = process.env.OPENAI_API_KEY;
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openaiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "너는 팩트체크 전문가야. 잘못된 정보를 찾아내고, 정확한 정보로 수정 제안해." },
                        { role: "user", content: checkQuery }
                    ],
                    max_tokens: 600
                })
            });

            const data = await res.json();
            const result = data.choices?.[0]?.message?.content || "";

            return NextResponse.json({
                success: true,
                result: result
            });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    } catch (e: any) {
        console.error("Research API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    return NextResponse.json({
        status: "ok",
        message: "Research API - NotebookLM 없이 팩트 검색/체크"
    });
}
