import { NextResponse } from "next/server";

export const runtime = "nodejs";

function extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "YOUTUBE_API_KEY is not configured" }, { status: 500 });
        }

        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data.error?.message || "YouTube API Error" }, { status: response.status });
        }

        if (!data.items || data.items.length === 0) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const video = data.items[0];
        return NextResponse.json({
            videoId: video.id,
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
