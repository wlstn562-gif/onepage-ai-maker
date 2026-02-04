import { NextResponse } from "next/server";
// @ts-ignore
import googleTrends from "google-trends-api";

export const runtime = "nodejs";

// --- Types ---
interface TrendRequest {
    seedKeywords: string[];
    geo?: string;
    timeframe?: "now 1-d" | "now 7-d" | "today 1-m" | "today 3-m";
    category?: number;
    maxVideosPerKeyword?: number;
}

interface YouTubeVideo {
    videoId: string;
    title: string;
    channelTitle: string;
    publishedAt: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    velocityScore: number;
    url: string;
}

interface TrendItem {
    seed: string;
    relatedTop: { query: string; value: number }[];
    relatedRising: { query: string; value: number }[];
    youtube: YouTubeVideo[];
    bestAngles: string[];
    antiGravityScriptPack: {
        hookCandidates: { ko1: string; ko2: string; ko3: string; ko4: string; promptEn: string }[];
        bodySceneSeeds: { ko1: string; ko2: string; ko3: string; ko4: string; promptEn: string }[];
    };
}

// --- Caching ---
// Simple in-memory cache: { [hash]: { data: any, timestamp: number } }
const CACHE: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// --- Google Trends Helpers ---
// google-trends-api uses callbacks or promises. We'll wrap in helper.
async function getRelatedQueries(keyword: string, geo: string, timeframe: string) {
    // Map timeframe string to Date if needed, but google-trends-api accepts specific strings.
    // 'now 1-d', 'now 7-d', 'today 1-m', 'today 3-m' might need conversion to Date objects for startTime/endTime
    // but google-trends-api 'startTime' takes a Date object.

    let startTime = new Date();
    const now = new Date();

    if (timeframe === "now 1-d") startTime.setDate(now.getDate() - 1);
    else if (timeframe === "now 7-d") startTime.setDate(now.getDate() - 7);
    else if (timeframe === "today 1-m") startTime.setMonth(now.getMonth() - 1);
    else if (timeframe === "today 3-m") startTime.setMonth(now.getMonth() - 3);
    else startTime.setDate(now.getDate() - 7); // Default 7d

    try {
        const resString = await googleTrends.relatedQueries({
            keyword,
            geo,
            startTime,
        });
        const res = JSON.parse(resString);
        // Structure: res.default.rankedList[0] (top), [1] (rising)
        const rankedList = res.default?.rankedList || [];
        const topList = rankedList[0]?.rankedKeyword || [];
        const risingList = rankedList[1]?.rankedKeyword || [];

        return {
            top: topList.map((item: any) => ({ query: item.query, value: item.value })).slice(0, 10),
            rising: risingList.map((item: any) => ({ query: item.query, value: item.value })).slice(0, 10),
        };
    } catch (e) {
        console.error(`Google Trends Error for ${keyword}:`, e);
        return { top: [], rising: [] };
    }
}

// --- YouTube Helpers ---
async function searchYouTube(keyword: string, geo: string, timeframe: string, maxResults: number) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("YOUTUBE_API_KEY is missing");

    // Calculate publishedAfter
    let publishedAfterDate = new Date();
    const now = new Date();
    if (timeframe === "now 1-d") publishedAfterDate.setDate(now.getDate() - 1);
    else if (timeframe === "now 7-d") publishedAfterDate.setDate(now.getDate() - 7);
    else if (timeframe === "today 1-m") publishedAfterDate.setMonth(now.getMonth() - 1);
    else if (timeframe === "today 3-m") publishedAfterDate.setMonth(now.getMonth() - 3);
    else publishedAfterDate.setDate(now.getDate() - 7);

    const publishedAfter = publishedAfterDate.toISOString();

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(keyword)}&order=date&publishedAfter=${publishedAfter}&regionCode=${geo}&relevanceLanguage=ko&maxResults=${maxResults}&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
        console.error("YouTube Search Error", await searchRes.text());
        return [];
    }
    const searchJson = await searchRes.json();
    const videoIds = searchJson.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];

    if (videoIds.length === 0) return [];

    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsJson = await statsRes.json();

    const videos = (statsJson.items || []).map((item: any) => {
        const stats = item.statistics;
        const viewCount = parseInt(stats.viewCount || "0");
        const publishedAt = item.snippet.publishedAt;

        // Velocity: Views per Hour
        const hoursAge = Math.max(0.1, (now.getTime() - new Date(publishedAt).getTime()) / (1000 * 60 * 60));
        const velocityScore = Math.round(viewCount / hoursAge);

        return {
            videoId: item.id,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            publishedAt,
            viewCount,
            likeCount: parseInt(stats.likeCount || "0"),
            commentCount: parseInt(stats.commentCount || "0"),
            velocityScore,
            url: `https://www.youtube.com/watch?v=${item.id}`
        };
    });

    // Sort by Velocity Score Descending
    videos.sort((a: any, b: any) => b.velocityScore - a.velocityScore);

    return videos.slice(0, 5); // Return top 5
}

// --- Rule-based Content Generation ---
function generateContent(seed: string, rising: any[], videos: YouTubeVideo[]) {
    const risingKeywords = rising.map(r => r.query);
    const topVideoTitles = videos.map(v => v.title);

    // Pick tokens
    const rising1 = risingKeywords[0] || seed;
    const titleToken1 = topVideoTitles[0] ? topVideoTitles[0].split(" ")[0] : seed;

    // Templates
    const templates = [
        `지금 ${seed}에서 가장 무서운 변화가 시작됐습니다`,
        `${rising1}가 급상승한 이유, 딱 한 가지입니다`,
        `다들 ${rising1}만 보는데, 진짜 큰 건 ${titleToken1}입니다`,
        `${seed}에서 사람들이 지금 제일 크게 착각하는 것`,
        `이번 주 ${seed} 트렌드, 3분이면 핵심만 잡습니다`
    ];

    // Simple replacement if rising/tokens are missing
    const bestAngles = templates.map(t => t.replace(/undefined/g, seed));

    // Hook Candidates
    const hookCandidates = bestAngles.slice(0, 3).map(angle => ({
        ko1: `🛑 ${angle}`,
        ko2: `솔직히 말씀드릴게요. ${angle}`,
        ko3: `이거 모르면 진짜 손해봅니다. ${seed}의 진실.`,
        ko4: `아직도 ${rising1} 믿으세요? 이제 끝났습니다.`,
        promptEn: "A cinematic shot of a mysterious warning sign, or a shocked person looking at a screen, high contrast, 16:9 aspect ratio, 8k resolution"
    }));

    // Body Scene Seeds
    const bodySceneSeeds = [
        {
            ko1: `첫 번째, ${rising1}의 충격적인 실태입니다.`,
            ko2: `데이터를 보면 명확합니다. ${videos[0]?.viewCount || 0}명이 목격했죠.`,
            ko3: `전문가들은 이렇게 말합니다. "지금이 기회다"`,
            ko4: `하지만 주의할 점이 딱 하나 있습니다.`,
            promptEn: "Data visualization graphs floating in futuristic hud, cybernetic style, dark background, neon accents"
        },
        {
            ko1: `두 번째, ${titleToken1} 사건의 전말입니다.`,
            ko2: `실제로 겪어본 사람들은 모두 경악했습니다.`,
            ko3: `저도 처음엔 믿지 않았습니다. 그런데...`,
            ko4: `결국 승자는 ${seed}의 본질을 아는 사람뿐입니다.`,
            promptEn: "A crowd of people looking amazed, soft lighting, depth of field, realistic texture"
        },
        {
            ko1: `결론입니다. 지금 당장 ${seed}에 주목하세요.`,
            ko2: `늦으면 기회는 사라집니다.`,
            ko3: `더 자세한 내용은 고정댓글 확인해주세요.`,
            ko4: `구독과 좋아요는 큰 힘이 됩니다.`,
            promptEn: "A bright light at the end of a tunnel, symbolizing success and future, cinematic lighting"
        }
    ];

    return { bestAngles, hookCandidates, bodySceneSeeds };
}


// --- Main Handler ---
export async function POST(req: Request) {
    try {
        const body = await req.json() as TrendRequest;
        const {
            seedKeywords = [],
            geo = "KR",
            timeframe = "now 7-d",
            maxVideosPerKeyword = 10
        } = body;

        // Cache Key
        const cacheKey = JSON.stringify({ seedKeywords, geo, timeframe, maxVideosPerKeyword });
        if (CACHE[cacheKey] && (Date.now() - CACHE[cacheKey].timestamp < CACHE_TTL_MS)) {
            return NextResponse.json(CACHE[cacheKey].data);
        }

        if (!process.env.YOUTUBE_API_KEY) {
            return NextResponse.json({ error: "Server Configuration Error: YOUTUBE_API_KEY missing" }, { status: 500 });
        }

        const items: TrendItem[] = [];

        // Process each keyword
        for (const seed of seedKeywords) {
            // Parallel fetching for Google Trends & YouTube roughly
            const [trendsData, youtubeVideos] = await Promise.all([
                getRelatedQueries(seed, geo, timeframe),
                searchYouTube(seed, geo, timeframe, maxVideosPerKeyword)
            ]);

            const { bestAngles, hookCandidates, bodySceneSeeds } = generateContent(seed, trendsData.rising, youtubeVideos);

            items.push({
                seed,
                relatedTop: trendsData.top,
                relatedRising: trendsData.rising,
                youtube: youtubeVideos,
                bestAngles,
                antiGravityScriptPack: {
                    hookCandidates,
                    bodySceneSeeds
                }
            });
        }

        const responseData = {
            generatedAt: new Date().toISOString(),
            geo,
            timeframe,
            seedKeywords,
            items
        };

        // Set Cache
        CACHE[cacheKey] = { data: responseData, timestamp: Date.now() };

        return NextResponse.json(responseData);

    } catch (e: any) {
        console.error("Trend API Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
