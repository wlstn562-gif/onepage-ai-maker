import { LucideIcon, Target, Megaphone, CheckCircle2, Headphones, Handshake, BarChart3, Bot, Code2, Palette, Search } from 'lucide-react';

export interface Team {
    id: string;
    name: string;
    description: string;
    icon: any; // LucideIcon type
    color: string;
    bgColor: string;
    borderColor: string;
    href?: string;
}

export const TEAMS: Team[] = [
    {
        id: 'funnel',
        name: '퍼널실 (Funnel)',
        description: '카피라이팅, 오퍼 설계, FAQ, 리스크 제거. 고객을 설득하는 모든 글쓰기.',
        icon: Target,
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'hover:ring-rose-500/50'
    },
    {
        id: 'marketing',
        name: '마케팅 OSMU실',
        description: '유튜브 영상을 블로그, 쇼츠, 인스타 등으로 재가공. 원소스 멀티유즈.',
        icon: Megaphone,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'hover:ring-orange-500/50'
    },
    {
        id: 'qa',
        name: 'QA/검증실',
        description: '과장 광고 체크, 법적 리스크 확인, 3사 AI 교차 검증 및 반려율 예측.',
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'hover:ring-emerald-500/50'
    },
    {
        id: 'cs',
        name: 'CS/고객지원실',
        description: '고객 문의 자동 답변, 환불 방어, 반려 대응 스크립트 작성.',
        icon: Headphones,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'hover:ring-blue-500/50'
    },
    {
        id: 'partner',
        name: '제휴/영업실',
        description: 'B2B 입점 제안서, 콜드메일 작성, 협력사 커뮤니케이션.',
        icon: Handshake,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'hover:ring-purple-500/50'
    },
    {
        id: 'data',
        name: '데이터/분석실',
        description: '주간 리포트, 지표 분석, A/B 테스트 결과 해석 및 인사이트 도출.',
        icon: BarChart3,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'hover:ring-cyan-500/50'
    },
    {
        id: 'automation',
        name: '자동화/시스템실',
        description: 'n8n 워크플로우 설계, 알림 설정, CRM 연동 및 로그 분석.',
        icon: Bot,
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'hover:ring-slate-500/50'
    },
    {
        id: 'dev',
        name: '개발실 (Dev)',
        description: '웹사이트 기능 추가, 코드 리팩토링, Claude Code 작업 요청서 생성.',
        icon: Code2,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'hover:ring-yellow-500/50'
    },
    {
        id: 'design',
        name: '디자인실 (Stitch)',
        description: 'UI/UX 디자인, 웹사이트 인터페이스 프로토타이핑, Stitch 기반 화면 생성.',
        icon: Palette,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'hover:ring-pink-500/50'
    },
    {
        id: 'research',
        name: '리서치실 (NotebookLM)',
        description: '깊이 있는 시장 조사, 팩트 체크, 프로젝트 지식 베이스 검색 및 리서치.',
        icon: Search,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        borderColor: 'hover:ring-indigo-500/50'
    },
    {
        id: 'executive',
        name: 'Executive AI',
        description: 'CEO 전용 의사결정 대시보드 및 기업 전략 지표 관리 스튜디오.',
        icon: Target,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'hover:ring-yellow-500/50',
        href: '/admin/ceo?key=edsence_ceo'
    }
];
