import { NextResponse } from 'next/server';
import { TEAMS } from '@/lib/teams';

export async function POST(req: Request) {
    try {
        const { teamId, message, history } = await req.json();

        if (!teamId || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const team = TEAMS.find(t => t.id === teamId);
        if (!team) {
            return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
        }

        // Mock response logic
        // In a real scenario, this would call the specific Agent/LLM for the team
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay

        const mockResponses: Record<string, string> = {
            funnel: `[${team.name}] "${message}"에 대한 카피라이팅 초안입니다.\n\n1. "당신의 1분이 100만 뷰로 바뀝니다."\n2. "AI로 만드는 숏폼, 이제 전문가 퀄리티로 시작하세요."\n\n추가 수정사항이 있으신가요?`,
            marketing: `[${team.name}] 해당 주제로 블로그 포스트와 쇼츠 스크립트 변환을 시작합니다. \n- 블로그: SEO 키워드 분석 중...\n- 쇼츠: 30초 컷 편집안 생성 완료.`,
            qa: `[${team.name}] 현재 생성된 콘텐츠의 리스크 체크 결과입니다.\n- 법적 문제: 없음\n- 팩트 체크: 98% 일치 (출처: Google Trends)\n- 반려 가능성: 낮음`,
            cs: `[${team.name}] 고객 문의 "${message}"에 대한 답변 초안:\n"안녕하세요, 연희스튜디오입니다. 문의주신 내용은..."`,
            partner: `[${team.name}] 제휴 제안서 B안으로 작성했습니다. 핵심 제안 내용은 파트너사 수익 배분율 70% 상향 조정입니다.`,
            data: `[${team.name}] 이번 주 지표 분석 결과, 클릭률이 15% 상승했습니다. 특히 상단 배너의 효과가 좋습니다.`,
            automation: `[${team.name}] n8n 워크플로우 "유튜브 업로드 자동화" 실행되었습니다. 로그 확인: OK.`,
            dev: `[${team.name}] Claude Code 작업 요청서 생성 완료. \n\`src/components/Review.tsx\` 파일의 버그 수정 작업을 시작합니다.`
        };

        const responseText = mockResponses[teamId] || `[${team.name}] 요청하신 "${message}" 작업을 접수했습니다.`;

        return NextResponse.json({
            response: responseText,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
