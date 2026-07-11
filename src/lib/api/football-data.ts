import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://api.football-data.org/v4";
function getApiKey(): string {
  return process.env.FOOTBALLDATA_API_KEY || "";
}

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(2, 500); // 2 concurrent, 500/day (free tier: 10/min)
  }
  return limiter;
}

async function fetchWithRetry(
  url: string,
  retries = 3
): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          "X-Auth-Token": getApiKey(),
        },
      });
      if (response.status === 429) {
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

export async function getStandings(competitionCode: string, season?: number) {
  return getLimiter().add(async () => {
    const seasonParam = season ? `?season=${season}` : "";
    const data = (await fetchWithRetry(
      `${BASE_URL}/competitions/${competitionCode}/standings${seasonParam}`
    )) as { standings: unknown[] };
    return data.standings || [];
  });
}

export async function getMatches(
  competitionCode: string,
  matchday?: number,
  season?: number
) {
  return getLimiter().add(async () => {
    const params = new URLSearchParams();
    if (matchday) params.set("matchday", matchday.toString());
    if (season) params.set("season", season.toString());
    const qs = params.toString() ? `?${params.toString()}` : "";
    const url = `${BASE_URL}/competitions/${competitionCode}/matches${qs}`;
    const data = (await fetchWithRetry(url)) as { matches: unknown[] };
    return data.matches || [];
  });
}

export async function getCompetition(competitionCode: string) {
  return getLimiter().add(async () => {
    return fetchWithRetry(`${BASE_URL}/competitions/${competitionCode}`);
  });
}
