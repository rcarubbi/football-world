import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://www.thesportsdb.com/api/v1/json";
const API_KEY = process.env.THESPORTSDB_API_KEY || "1";

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(3, 30); // 3 concurrent, 30 per minute
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

export async function searchAllTeams(leagueId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${API_KEY}/search_all_teams.php?id=${leagueId}`
    )) as { teams: unknown[] };
    return data.teams || [];
  });
}

export async function lookupTeam(teamId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${API_KEY}/lookupteam.php?id=${teamId}`
    )) as { teams: unknown[] };
    return data.teams?.[0] || null;
  });
}

export async function lookupAllPlayers(teamId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${API_KEY}/lookup_all_players.php?id=${teamId}`
    )) as { player: unknown[] };
    return data.player || [];
  });
}

export async function lookupPlayerHonours(playerId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${API_KEY}/lookupplayerhonours.php?id=${playerId}`
    )) as { honours: unknown[] };
    return data.honours || [];
  });
}

export async function lookupPlayerTeams(playerId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${API_KEY}/lookupplayerteams.php?id=${playerId}`
    )) as { teams: unknown[] };
    return data.teams || [];
  });
}
