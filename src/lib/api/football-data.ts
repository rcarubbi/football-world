import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALLDATA_API_KEY;

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(2, 10); // 2 concurrent, 10 per minute
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
          "X-Auth-Token": API_KEY || "",
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

export async function getStandings(competitionCode: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/competitions/${competitionCode}/standings`
    )) as { standings: unknown[] };
    return data.standings || [];
  });
}

export async function getMatches(
  competitionCode: string,
  matchday?: number
) {
  return getLimiter().add(async () => {
    const url = matchday
      ? `${BASE_URL}/competitions/${competitionCode}/matches?matchday=${matchday}`
      : `${BASE_URL}/competitions/${competitionCode}/matches`;
    const data = (await fetchWithRetry(url)) as { matches: unknown[] };
    return data.matches || [];
  });
}

export async function getCompetition(competitionCode: string) {
  return getLimiter().add(async () => {
    return fetchWithRetry(`${BASE_URL}/competitions/${competitionCode}`);
  });
}
