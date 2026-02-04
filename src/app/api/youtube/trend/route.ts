import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MOCK_TRENDS = [
    { title: "2024년 한국 경제, 진짜 위기일까? (충격 분석)", viewCount: "125만", channelTitle: "슈카월드" },
    { title: "라면 맛있게 끓이는 법, 이건 몰랐지?", viewCount: "89만", channelTitle: "백종원 PAIK JONG WON" },
    { title: "손흥민 리그 15호골 현지 반응 ㄷㄷ", viewCount: "210만", channelTitle: "스포츠타임" },
    { title: "아이폰 16 유출 디자인 총정리", viewCount: "54만", channelTitle: "ITSub잇섭" },
    { title: "한국인이 좋아하는 팝송 베스트 100", viewCount: "450만", channelTitle: "Essential;" },
    { title: "편의점 알바 진상 참교육 레전드", viewCount: "77만", channelTitle: "김계란" },
    { title: "뉴진스 신곡 뮤비 해석", viewCount: "330만", channelTitle: "침착맨" },
    { title: "지금 사야 할 저평가 주식 TOP 3", viewCount: "42만", channelTitle: "삼프로TV" },
];

export async function GET(req: Request) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;

        // API 키가 없으면 Mock 데이터 반환 (개발용)
        if (!apiKey) {
            console.warn("YOUTUBE_API_KEY not found, using mock data.");
            return NextResponse.json({ items: MOCK_TRENDS });
        }

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId") || "0"; // 0 is usually fine or specific category

        // 1. Get Popular Videos (Most Reliable for "Trending")
        // chart=mostPopular, regionCode=KR
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=KR&maxResults=10&key=${apiKey}`,
            { method: "GET" }
        );

        if (!response.ok) {
            throw new Error(`YouTube API Error: ${response.statusText}`);
        }

        const data = await response.json();

        const items = data.items.map((item: any) => ({
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            viewCount: formatViewCount(item.statistics.viewCount),
            thumbnail: item.snippet.thumbnails.medium.url,
            id: item.id
        }));

        return NextResponse.json({ items });

    } catch (error: any) {
        console.error("Trend API Error:", error);
        // 에러 발생 시에도 Mock 데이터 반환하여 UI 깨짐 방지
        return NextResponse.json({ items: MOCK_TRENDS, error: error.message });
    }
}

function formatViewCount(cnt: string) {
    const num = parseInt(cnt, 10);
    if (num >= 10000) {
        return Math.floor(num / 10000) + "만";
    }
    return num.toString();
}
