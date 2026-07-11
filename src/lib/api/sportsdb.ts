import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://www.thesportsdb.com/api/v1/json";
const FREE_KEY = "123";

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(1, 500); // 1 concurrent, 500/day (free tier is generous)
  }
  return limiter;
}

async function fetchWithRetry(
  url: string,
  retries = 1
): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        throw new Error("RATE_LIMITED");
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if ((error as Error).message === "RATE_LIMITED") throw error;
      if (i === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error("Max retries exceeded");
}

export async function searchTeams(name: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${FREE_KEY}/searchteams.php?t=${encodeURIComponent(name)}`
    )) as { teams: unknown[] | null };
    return data.teams || [];
  });
}

export async function searchAllTeams(sport: string, country: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${FREE_KEY}/search_all_teams.php?s=${encodeURIComponent(sport)}&c=${encodeURIComponent(country)}`
    )) as { teams: unknown[] | null };
    return data.teams || [];
  });
}

export async function lookupAllPlayers(teamId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${FREE_KEY}/lookup_all_players.php?id=${teamId}`
    )) as { player: unknown[] | null };
    return data.player || [];
  });
}

export async function lookupPlayerHonours(playerId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${FREE_KEY}/lookupplayerhonours.php?id=${playerId}`
    )) as { honours: unknown[] | null };
    return data.honours || [];
  });
}
