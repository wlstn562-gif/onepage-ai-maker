import { NextResponse } from "next/server";

export const runtime = "nodejs";

const YOUTUBE_API_KEY = process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY;

function generateMockItems(keyword: string, count: number) {
    return Array.from({ length: count }).map((_, i) => ({
        id: `mock_${i}`,
        thumbnail: `https://loremflickr.com/320/180?random=${i}`,
        title: `[MOCK] ${keyword} 관련 화제의 영상 #${i + 1} - 충격적인 진실?`,
        channel: `Creator ${i + 1}`,
        date: "2024-03-01",
        views: Math.floor(Math.random() * 1000000) + 10000,
        likes: Math.floor(Math.random() * 5000) + 100,
        comments: Math.floor(Math.random() * 500),
        length: "10:00",
        desc: "이것은 API 키가 없을 때 제공되는 테스트용 Mock 데이터입니다.",
        topComments: ["정말 유익하네요!", "Mock 데이터지만 퀄리티 굿", "와 대박"]
    }));
}

export async function POST(req: Request) {
    let keyword = "";
    let count = "20";

    try {
        const body = await req.json();
        keyword = body.keyword;
        count = body.count || "20";
        const { dateRange, duration, minViews, order } = body;

        if (!keyword) return NextResponse.json({ error: "Keyword required" }, { status: 400 });

        // 🔍 API 키 디버깅
        console.log("🔑 YouTube API Key 존재:", !!YOUTUBE_API_KEY, "길이:", YOUTUBE_API_KEY?.length);

        // API 키 없으면 에러 반환 (Mock 대신)
        if (!YOUTUBE_API_KEY) {
            console.error("❌ No YouTube API Key!");
            return NextResponse.json({
                error: "YouTube API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.",
                items: []
            }, { status: 500 });
        }

        // 1. Calculate PublishedAfter Date
        let publishedAfter = undefined;
        if (dateRange && dateRange !== "any") {
            const days = parseInt(dateRange);
            if (!isNaN(days)) {
                const date = new Date();
                date.setDate(date.getDate() - days);
                publishedAfter = date.toISOString();
            }
        }

        // 2. Map Duration Param
        let videoDuration = "any";
        if (duration === "short") videoDuration = "short"; // < 4 min
        if (duration === "medium") videoDuration = "medium"; // 4-20 min
        else if (duration === "long") videoDuration = "long"; // > 20 min

        // 3. First Call: Search API
        const maxResults = Math.min(50, (parseInt(count) || 20) * 2);
        const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        searchUrl.searchParams.set("part", "snippet");
        searchUrl.searchParams.set("q", keyword);
        searchUrl.searchParams.set("type", "video");
        searchUrl.searchParams.set("order", order || "viewCount"); // date=최신순, viewCount=조회순
        if (publishedAfter) searchUrl.searchParams.set("publishedAfter", publishedAfter);
        if (videoDuration !== "any") searchUrl.searchParams.set("videoDuration", videoDuration);
        searchUrl.searchParams.set("maxResults", maxResults.toString());
        searchUrl.searchParams.set("key", YOUTUBE_API_KEY);

        const searchRes = await fetch(searchUrl.toString());
        if (!searchRes.ok) {
            const txt = await searchRes.text();
            throw new Error(`YouTube Search API Failed: ${txt}`);
        }
        const searchData = await searchRes.json();

        // 🆕 결과가 없으면 점진적으로 기간 확장
        if (!searchData.items || searchData.items.length === 0) {
            console.warn("⚠️ No items found. Retrying with broader date range...");

            // 단계적 확장: 30일 → 90일 → 180일
            const fallbackDays = [30, 90, 180];

            for (const days of fallbackDays) {
                const retryDate = new Date();
                retryDate.setDate(retryDate.getDate() - days);

                const retryUrl = new URL("https://www.googleapis.com/youtube/v3/search");
                retryUrl.searchParams.set("part", "snippet");
                retryUrl.searchParams.set("q", keyword);
                retryUrl.searchParams.set("type", "video");
                retryUrl.searchParams.set("order", order || "date"); // 최신순 유지
                retryUrl.searchParams.set("publishedAfter", retryDate.toISOString());
                retryUrl.searchParams.set("maxResults", maxResults.toString());
                retryUrl.searchParams.set("key", YOUTUBE_API_KEY);

                const retryRes = await fetch(retryUrl.toString());
                if (retryRes.ok) {
                    const retryData = await retryRes.json();
                    if (retryData.items && retryData.items.length > 0) {
                        console.log(`✅ Retry succeeded with ${days} days range`);
                        searchData.items = retryData.items;
                        break;
                    }
                }
            }

            // 그래도 없으면 빈 결과 반환 (해당 기간에 영상 없음)
            if (!searchData.items || searchData.items.length === 0) {
                console.warn("⚠️ All retries failed. No videos found.");
                return NextResponse.json({
                    items: [],
                    warning: `"${keyword}" 관련 영상을 찾지 못했습니다. 다른 키워드를 시도해보세요.`
                });
            }
        }

        // 4. Get Video IDs
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(",");

        // 5. Second Call: Videos API for Stats
        const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
        statsUrl.searchParams.set("part", "snippet,statistics,contentDetails");
        statsUrl.searchParams.set("id", videoIds);
        statsUrl.searchParams.set("key", YOUTUBE_API_KEY);

        const statsRes = await fetch(statsUrl.toString());
        if (!statsRes.ok) throw new Error("YouTube Stats API Failed");
        const statsData = await statsRes.json();

        // 6. Merge & Filter
        const minViewCount = parseInt(minViews) || 0;

        const filteredItems = statsData.items.filter((item: any) => {
            const views = parseInt(item.statistics.viewCount || "0");
            return views >= minViewCount;
        });

        const targetItems = filteredItems.slice(0, parseInt(count) || 20);

        // Fetch Comments in Parallel
        const results = await Promise.all(targetItems.map(async (item: any) => {
            const snippet = item.snippet;
            const stats = item.statistics;
            const content = item.contentDetails;

            // ISO 8601 Duration Parsing
            const durRaw = content.duration;
            const hours = durRaw.match(/(\d+)H/)?.[1];
            const mins = durRaw.match(/(\d+)M/)?.[1];
            const secs = durRaw.match(/(\d+)S/)?.[1];

            let formattedDuration = "";
            if (hours) formattedDuration += `${hours}시간 `;
            if (mins) formattedDuration += `${mins}분 `;
            if (secs) formattedDuration += `${secs}초`;
            if (!formattedDuration) formattedDuration = "Live/Short";

            let topComments: string[] = [];
            try {
                const commentUrl = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
                commentUrl.searchParams.set("part", "snippet");
                commentUrl.searchParams.set("videoId", item.id);
                commentUrl.searchParams.set("key", YOUTUBE_API_KEY);
                commentUrl.searchParams.set("maxResults", "3");
                commentUrl.searchParams.set("order", "relevance");

                const commentRes = await fetch(commentUrl.toString());
                if (commentRes.ok) {
                    const commentData = await commentRes.json();
                    if (commentData.items) {
                        topComments = commentData.items.map((c: any) =>
                            c.snippet.topLevelComment.snippet.textDisplay
                                .replace(/<br>/g, " ")
                                .replace(/&amp;/g, "&")
                                .replace(/&quot;/g, '"')
                                .slice(0, 50) + "..."
                        );
                    }
                }
            } catch (e) {
                // Ignore comment fetch error
            }

            return {
                id: item.id,
                thumbnail: snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url,
                title: snippet.title,
                channel: snippet.channelTitle,
                date: new Date(snippet.publishedAt).toLocaleDateString(),
                views: parseInt(stats.viewCount || "0"),
                likes: parseInt(stats.likeCount || "0"),
                comments: parseInt(stats.commentCount || "0"),
                length: formattedDuration.trim(),
                desc: snippet.description,
                topComments
            };
        }));

        return NextResponse.json({ items: results });

    } catch (e: any) {
        console.error("❌ YouTube API Error:", e?.message || e);
        // 에러 메시지 반환 (Mock 대신)
        return NextResponse.json({
            error: `YouTube API 에러: ${e?.message || "알 수 없는 오류"}`,
            items: []
        }, { status: 500 });
    }
}
