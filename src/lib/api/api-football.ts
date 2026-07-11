import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = process.env.APIFOOTBALL_KEY;

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(2, 10); // 2 concurrent, 10 per minute, 100/day
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
          "x-rapidapi-key": API_KEY || "",
          "x-rapidapi-host": "v3.football.api-sports.io",
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

export async function getTopScorers(leagueId: number, season: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/players/topscorers?league=${leagueId}&season=${season}`
    )) as { response: unknown[] };
    return data.response || [];
  });
}

export async function getTransfers(leagueId: number, season: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/transfers?league=${leagueId}&season=${season}`
    )) as { response: unknown[] };
    return data.response || [];
  });
}

export async function getFixtures(leagueId: number, season: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/fixtures?league=${leagueId}&season=${season}`
    )) as { response: unknown[] };
    return data.response || [];
  });
}

export async function getTeamById(teamId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/teams?id=${teamId}`
    )) as { response: unknown[] };
    return data.response?.[0] || null;
  });
}
