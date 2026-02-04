// src/app/api/youtube/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type VideoItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails: {
      medium: { url: string };
    };
  };
};

type VideoStatistics = {
  items: Array<{
    id: string;
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
    contentDetails?: {
      duration: string;
    };
  }>;
};

// ISO 8601 duration을 초로 변환
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  
  return hours * 3600 + minutes * 60 + seconds;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY가 설정되지 않았습니다 (.env.local 확인)" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const keyword = String(body?.keyword || "").trim();
    const maxResults = Number(body?.maxResults || 10);
    const publishedAfter = body?.publishedAfter; // ISO 8601 format

    if (!keyword) {
      return NextResponse.json({ error: "검색 키워드가 비어있습니다" }, { status: 400 });
    }

    // 1. 검색 API 호출
    const searchParams = new URLSearchParams({
      part: "snippet",
      q: keyword,
      type: "video",
      maxResults: String(maxResults),
      order: "viewCount", // 조회수 순
      key: apiKey,
    });

    if (publishedAfter) {
      searchParams.append("publishedAfter", publishedAfter);
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams}`;
    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
      const error = await searchRes.json();
      return NextResponse.json(
        { error: error.error?.message || "YouTube 검색 실패" },
        { status: searchRes.status }
      );
    }

    const searchData = await searchRes.json();
    const videos: VideoItem[] = searchData.items || [];

    if (videos.length === 0) {
      return NextResponse.json({ videos: [], stats: null });
    }

    // 2. 비디오 ID 추출
    const videoIds = videos.map((v) => v.id.videoId).join(",");

    // 3. 통계 + 영상 정보 API 호출
    const statsParams = new URLSearchParams({
      part: "statistics,contentDetails",
      id: videoIds,
      key: apiKey,
    });

    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?${statsParams}`;
    const statsRes = await fetch(statsUrl);

    if (!statsRes.ok) {
      const error = await statsRes.json();
      return NextResponse.json(
        { error: error.error?.message || "통계 가져오기 실패" },
        { status: statsRes.status }
      );
    }

    const statsData: VideoStatistics = await statsRes.json();

    // 4. 채널 ID 추출 (중복 제거)
    const channelIds = [...new Set(videos.map((v) => v.snippet.channelId))].join(",");

    // 5. 채널 구독자 수 가져오기
    const channelParams = new URLSearchParams({
      part: "statistics",
      id: channelIds,
      key: apiKey,
    });

    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?${channelParams}`;
    const channelRes = await fetch(channelUrl);

    const channelData = await channelRes.json();
    const channelMap = new Map();
    
    if (channelRes.ok && channelData.items) {
      channelData.items.forEach((ch: any) => {
        channelMap.set(ch.id, parseInt(ch.statistics?.subscriberCount || "0"));
      });
    }

    // 6. 데이터 병합
    const results = videos.map((video, index) => {
      const stats = statsData.items.find((s) => s.id === video.id.videoId);
      const viewCount = Number(stats?.statistics.viewCount || 0);
      const likeCount = Number(stats?.statistics.likeCount || 0);
      const commentCount = Number(stats?.statistics.commentCount || 0);
      const engagement = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;

      // 영상 길이 파싱 (ISO 8601 duration)
      const duration = stats?.contentDetails?.duration || "PT0S";
      const durationSeconds = parseDuration(duration);

      // 채널 구독자 수
      const subscriberCount = channelMap.get(video.snippet.channelId) || 0;

      // 구독자 대비 조회수
      const viewsPerSub = subscriberCount > 0 ? viewCount / subscriberCount : 0;

      // 업로드 후 경과일
      const uploadDate = new Date(video.snippet.publishedAt);
      const now = new Date();
      const daysSinceUpload = Math.max(1, Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24)));

      // 일평균 조회수
      const avgViewsPerDay = Math.floor(viewCount / daysSinceUpload);

      // 좋아요율, 댓글율
      const likeRate = viewCount > 0 ? (likeCount / viewCount) * 100 : 0;
      const commentRate = viewCount > 0 ? (commentCount / viewCount) * 100 : 0;

      return {
        rank: index + 1,
        videoId: video.id.videoId,
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.medium.url,
        publishedAt: video.snippet.publishedAt,
        views: viewCount,
        likes: likeCount,
        comments: commentCount,
        engagement: Number(engagement.toFixed(2)),
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        // 새로 추가된 필드
        subscriberCount,
        viewsPerSub: Number(viewsPerSub.toFixed(2)),
        likeRate: Number(likeRate.toFixed(2)),
        commentRate: Number(commentRate.toFixed(2)),
        durationSeconds,
        daysSinceUpload,
        avgViewsPerDay,
      };
    });

    // 5. 통계 계산
    const totalVideos = results.length;
    const avgViews = Math.floor(results.reduce((sum, v) => sum + v.views, 0) / totalVideos);
    const avgLikes = Math.floor(results.reduce((sum, v) => sum + v.likes, 0) / totalVideos);
    const avgComments = Math.floor(results.reduce((sum, v) => sum + v.comments, 0) / totalVideos);
    const avgEngagement = Number(
      (results.reduce((sum, v) => sum + v.engagement, 0) / totalVideos).toFixed(2)
    );

    return NextResponse.json({
      videos: results,
      stats: {
        totalVideos,
        avgViews,
        avgLikes,
        avgComments,
        avgEngagement,
      },
    });
  } catch (e: any) {
    console.error("YouTube API Error:", e);
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
