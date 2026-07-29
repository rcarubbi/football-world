import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://api.football-data.org/v4";

function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.FOOTBALLDATA_API_KEY) keys.push(process.env.FOOTBALLDATA_API_KEY);
  if (process.env.FOOTBALLDATA_API_KEY_2) keys.push(process.env.FOOTBALLDATA_API_KEY_2);
  if (process.env.FOOTBALLDATA_API_KEY_3) keys.push(process.env.FOOTBALLDATA_API_KEY_3);
  if (process.env.FOOTBALLDATA_API_KEY_4) keys.push(process.env.FOOTBALLDATA_API_KEY_4);
  return keys;
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
  const keys = getApiKeys();
  for (let i = 0; i < retries; i++) {
    try {
      const apiKey = keys.length > 0 ? keys[i % keys.length] : "";
      const response = await fetch(url, {
        headers: {
          "X-Auth-Token": apiKey,
        },
      });
      if (response.status === 429) {
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      if (response.status === 401) {
        console.warn(`Football-Data 401 with key index ${i % keys.length}, trying next...`);
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

export async function getTeams(competitionCode: string, season?: number) {
  return getLimiter().add(async () => {
    const seasonParam = season ? `?season=${season}` : "";
    const data = (await fetchWithRetry(
      `${BASE_URL}/competitions/${competitionCode}/teams${seasonParam}`
    )) as { teams: unknown[] };
    return data.teams || [];
  });
}

export async function getScorers(
  competitionCode: string,
  season?: number,
  limit = 10
) {
  return getLimiter().add(async () => {
    const params = new URLSearchParams();
    if (season) params.set("season", season.toString());
    params.set("limit", limit.toString());
    const qs = `?${params.toString()}`;
    const data = (await fetchWithRetry(
      `${BASE_URL}/competitions/${competitionCode}/scorers${qs}`
    )) as { scorers: unknown[] };
    return data.scorers || [];
  });
}

export async function getTeamDetail(teamId: number) {
  return getLimiter().add(async () => {
    return fetchWithRetry(`${BASE_URL}/teams/${teamId}`);
  });
}

export async function getPersonDetail(personId: number) {
  return getLimiter().add(async () => {
    return fetchWithRetry(`${BASE_URL}/persons/${personId}`);
  });
}

export async function getMatchDetail(matchId: number) {
  return getLimiter().add(async () => {
    return fetchWithRetry(`${BASE_URL}/matches/${matchId}`);
  });
}

export async function getAllAreas() {
  return getLimiter().add(async () => {
    return fetchWithRetry(`${BASE_URL}/areas`);
  });
}
