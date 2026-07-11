import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://www.googleapis.com/youtube/v3";

let _apiKeys: string[] = [];
let _currentKeyIndex = 0;
let _exhaustedKeys: Set<string> = new Set();

function loadApiKeys(): string[] {
  if (_apiKeys.length === 0) {
    const keys = [
      process.env.YOUTUBE_API_KEY,
      process.env.YOUTUBE_API_KEY_2,
      process.env.YOUTUBE_API_KEY_3,
      process.env.YOUTUBE_API_KEY_4,
    ].filter((k): k is string => !!k && k.trim() !== "");

    _apiKeys = keys;
    if (_apiKeys.length === 0) {
      console.warn("No YOUTUBE_API_KEY set. YouTube features disabled.");
    } else {
      console.log(`Loaded ${_apiKeys.length} YouTube API keys`);
    }
  }
  return _apiKeys;
}

function getNextApiKey(): string {
  const keys = loadApiKeys();
  if (keys.length === 0) return "";

  const startIndex = _currentKeyIndex;
  let attempts = 0;

  while (attempts < keys.length) {
    const key = keys[_currentKeyIndex];
    if (!_exhaustedKeys.has(key)) {
      return key;
    }
    _currentKeyIndex = (_currentKeyIndex + 1) % keys.length;
    attempts++;
  }

  console.log("All API keys exhausted, resetting...");
  _exhaustedKeys.clear();
  return keys[0];
}

function markKeyExhausted(key: string) {
  _exhaustedKeys.add(key);
  const keys = loadApiKeys();
  const exhaustedCount = _exhaustedKeys.size;
  console.log(`API key exhausted (${exhaustedCount}/${keys.length} exhausted)`);

  if (exhaustedCount < keys.length) {
    _currentKeyIndex = (_currentKeyIndex + 1) % keys.length;
    console.log(`Switching to next API key`);
  }
}

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(3, 400); // 3 concurrent, 400 searches/day per key
  }
  return limiter;
}

async function fetchWithApiKey(
  url: string,
  apiKey: string,
  retries = 2
): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url + `&key=${apiKey}`);
      if (response.status === 429 || response.status === 403) {
        const body = await response.text().catch(() => "");
        const isQuotaError = body.includes("quotaExceeded") || body.includes("quota") || body.includes("dailyLimit");

        markKeyExhausted(apiKey);
        throw new Error(`QUOTA_EXCEEDED`);
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if ((error as Error).message === "QUOTA_EXCEEDED") throw error;
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 500)
      );
    }
  }
  throw new Error("Max retries exceeded");
}

async function fetchWithAnyKey(
  url: string,
  maxAttempts = 4
): Promise<unknown> {
  const keys = loadApiKeys();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const apiKey = getNextApiKey();
    if (!apiKey) throw new Error("No YouTube API keys available");

    try {
      return await fetchWithApiKey(url, apiKey);
    } catch (error) {
      lastError = error as Error;
      if (lastError.message === "QUOTA_EXCEEDED") continue;
      throw error;
    }
  }

  throw lastError || new Error("All API keys failed");
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
  const keys = loadApiKeys();
  if (keys.length === 0) return [];

  return getLimiter().add(async () => {
    const searchUrl = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=medium&order=viewCount&maxResults=${maxResults}`;

    const data = (await fetchWithAnyKey(searchUrl)) as {
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
    const detailsUrl = `${BASE_URL}/videos?part=contentDetails,statistics&id=${videoIds}`;
    const detailsData = (await fetchWithAnyKey(detailsUrl)) as {
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
