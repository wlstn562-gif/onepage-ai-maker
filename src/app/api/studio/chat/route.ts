import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TEAM_PERSONAS, GLOBAL_CONTEXT } from '@/lib/agents';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { teamId, message, history, mode = 'team' } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        let targetTeamId = teamId;
        let systemPrompt = "";

        // 1. Handle Auto Routing
        if (mode === 'auto') {
            const routingCompletion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: 'system',
                        content: `사용자의 질문을 분석하여 다음 팀 중 가장 적절한 팀 ID 하나만 응답하세요. 오직 ID만 출력하세요.
                        IDs: funnel, marketing, qa, cs, partner, data, automation, dev
                        
                        분석 기준:
                        - funnel: 광고, 카피라이팅, 설득
                        - marketing: 유튜브, 블로그, SNS, OSMU
                        - qa: 검증, 리스크, 체크
                        - cs: 고객응대, 환불, 답변
                        - partner: 제휴, 영업, 제안서
                        - data: 분석, 수치, 인사이트
                        - automation: 자동화, n8n, 워크플로우
                        - dev: 코드, 사이트 기능, 개발`
                    },
                    { role: 'user', content: message }
                ],
                temperature: 0,
            });
            const identifiedId = routingCompletion.choices[0].message.content?.trim().toLowerCase();
            if (identifiedId && TEAM_PERSONAS[identifiedId]) {
                targetTeamId = identifiedId;
            }
        }

        // 2. Set System Prompt based on mode
        if (mode === 'council') {
            systemPrompt = `당신은 '연희스튜디오'의 전문가 위원회입니다. 
            사용자의 의안에 대해 '운영진 복합 관점'에서 통합 답변을 제공하세요.
            답변에는 최소 3명 이상의 팀장(예: 퍼널팀장, QA팀장, 개발팀장)의 짧은 견해와 최종 결론이 포함되어야 합니다.
            ${GLOBAL_CONTEXT}`;
        } else {
            const persona = TEAM_PERSONAS[targetTeamId || 'funnel'];
            systemPrompt = `${persona.systemPrompt}\n\n${GLOBAL_CONTEXT}`;
        }

        // 3. Generate Response
        const messages: any[] = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10).map((msg: any) => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.text
            })),
            { role: 'user', content: message }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1500,
        });

        const responseText = completion.choices[0].message.content || "응답을 생성하지 못했습니다.";

        return NextResponse.json({
            response: responseText,
            teamId: targetTeamId,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Studio Chat Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
