import { NextResponse } from "next/server";

export const maxDuration = 60; // 처리 시간 확보

export async function POST(req: Request) {
    try {
        const { category, subCategory } = await req.json();

        if (!category) {
            return NextResponse.json({ error: "카테고리가 필요합니다." }, { status: 400 });
        }

        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return NextResponse.json({ error: "OpenAI API Key가 설정되지 않았습니다." }, { status: 500 });
        }

        const userPrompt = `
주제 카테고리: ${category} ${subCategory ? `> ${subCategory}` : ""}

목표: 유튜브 시청자들이 지금 가장 흥미로워할 만한, 뻔하지 않은 심층 주제 5가지를 발굴해줘.
단순한 정보 나열이 아니라, "충격적인 진실", "미래 예측", "숨겨진 뒷이야기" 같은 앵글로 잡아줘.

각 주제에 대해 다음 내용을 JSON 형식으로 출력해:
1. title: 유튜브 썸네일 어그로가 끌리는 제목 (25자 이내)
2. reason: 왜 이 주제가 지금 핫한지, 시청자가 얻을 수 있는 가치
3. hook: 영상 시작 5초만에 시청자를 사로잡을 첫 문장
4. facts: 이 내용을 뒷받침할 구체적인 팩트, 통계, 사례, 인물, 연도 등 (최소 3개, 구체적으로)
5. keywords: 관련 검색 키워드 3개

출력 형식 (JSON Array):
[
  {
    "title": "제목",
    "reason": "이유",
    "hook": "훅",
    "facts": ["팩트1", "팩트2", "팩트3"],
    "keywords": ["키워드1", "키워드2", "키워드3"]
  }
]
`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o", // 지능이 높은 모델 사용 권장
                messages: [
                    {
                        role: "system",
                        content: "너는 100만 유튜버의 메인 기획자야. 뻔한 주제는 거절하고, 사람들이 클릭할 수밖에 없는 인사이트 있는 주제를 찾아내. 항상 JSON 형식으로만 응답해."
                    },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.8,
                response_format: { type: "json_object" }
            }),
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const content = data.choices[0].message.content;
        const parsedData = JSON.parse(content);

        // topics 키가 없으면 전체가 배열일 수 있음
        const topics = parsedData.topics || parsedData.results || parsedData;

        // 배열인지 확인
        if (!Array.isArray(topics)) {
            // 만약 객체라면 topics라는 키로 감싸져 있을 확률이 높음, 다시 시도하거나 에러 처리.
            // gpt-4o json_object 모드는 보통 요청한 스키마를 잘 따름.
            // 하지만 가끔 { "topics": [...] } 형태로 줄 때도 있고 그냥 [...] 로 줄 때도 있음.
            // 여기서는 유연하게 처리.
            if (parsedData.topics) return NextResponse.json({ topics: parsedData.topics });
            return NextResponse.json({ topics: [] }); // 실패 시 빈 배열
        }

        return NextResponse.json({ topics });

    } catch (e: any) {
        console.error("Deep Research API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
