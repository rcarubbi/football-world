import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.warn("YOUTUBE_API_KEY is not set. YouTube features disabled.");
}

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(3, 100); // 3 concurrent, 100 searches/day (100 units per search + 1 per details call)
  }
  return limiter;
}

async function fetchWithRetry(
  url: string,
  retries = 3
): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429 || response.status === 403) {
        const body = await response.text().catch(() => "");
        if (response.status === 403 && !body.includes("quotaExceeded")) {
          throw new Error(`HTTP 403 Forbidden: access denied for this API key`);
        }
        if (response.status === 403 || i === retries - 1) {
          throw new Error(`HTTP ${response.status}: daily quota exceeded`);
        }
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error("Max retries exceeded");
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
}

export async function searchVideos(
  query: string,
  maxResults = 5
): Promise<YouTubeSearchResult[]> {
  if (!API_KEY) return [];

  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${API_KEY}`
    )) as {
      items: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          thumbnails: { high: { url: string } };
          channelTitle: string;
          publishedAt: string;
        };
      }>;
    };

    if (!data.items) return [];

    const videoIds = data.items.map((item) => item.id.videoId).join(",");
    const detailsData = (await fetchWithRetry(
      `${BASE_URL}/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`
    )) as {
      items: Array<{
        id: string;
        contentDetails: { duration: string };
        statistics: { viewCount: string };
      }>;
    };

    const detailsMap = new Map(
      detailsData.items?.map((d) => [d.id, d]) ?? []
    );

    return data.items.map((item) => {
      const details = detailsMap.get(item.id.videoId);
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        channelName: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: details?.contentDetails?.duration || "PT0S",
        viewCount: details?.statistics?.viewCount || "0",
      };
    });
  });
}

export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
}
