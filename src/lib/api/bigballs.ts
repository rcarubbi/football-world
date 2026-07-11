import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://api.bigballsdata.com";

function getApiKey(): string {
  return process.env.BBS_API_KEY || "";
}

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(2, 1000);
  }
  return limiter;
}

async function fetchWithRetry(url: string, retries = 3): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
        },
      });
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, i) * 1000;
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

export interface BBSLeague {
  id: string;
  name: string;
  sport: string;
  country: string;
}

export interface BBSStandingRow {
  position: number;
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface BBSStandings {
  league_id: string;
  season: string;
  rows: BBSStandingRow[];
  updated_at: string;
}

export interface BBSTopScorer {
  rank: number;
  player_name: string;
  team: string;
  goals: number;
  assists: number;
  minutes: number;
  matches: number;
}

export interface BBSMatch {
  id: string;
  sport: string;
  league_id: string;
  season: string;
  start_time: string;
  status: string;
  home: { team_id: string; team_name: string };
  away: { team_id: string; team_name: string };
  score?: {
    home: number | null;
    away: number | null;
    status: string;
  };
}

export async function getLeagues(): Promise<BBSLeague[]> {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/leagues?sport=football`
    )) as { data: BBSLeague[] };
    return data.data || [];
  });
}

export async function getStandings(
  leagueId: string
): Promise<BBSStandingRow[]> {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/standings?sport=football&league=${leagueId}`
    )) as {
      data: { standings: { value: BBSStandings } };
    };
    return data.data?.standings?.value?.rows || [];
  });
}

export async function getTopScorers(
  leagueId: string,
  season = 2025,
  limit = 50,
  category: "goals" | "assists" | "minutes" | "matches" = "goals"
): Promise<BBSTopScorer[]> {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/leagues/${leagueId}/top-scorers?season=${season}&limit=${limit}&category=${category}`
    )) as { data: BBSTopScorer[] };
    return data.data || [];
  });
}

export async function getMatches(
  leagueId: string,
  options: { status?: string; limit?: number; date?: string } = {}
): Promise<BBSMatch[]> {
  return getLimiter().add(async () => {
    const params = new URLSearchParams({
      sport: "football",
      league: leagueId,
    });
    if (options.status) params.set("status", options.status);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.date) params.set("date", options.date);

    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/matches?${params.toString()}`
    )) as { data: { scores: { value: BBSMatch[] } } };
    return data.data?.scores?.value || [];
  });
}

// Map our league slugs to Big Balls league IDs
export const LEAGUE_MAP: Record<string, string> = {
  "premier-league": "epl",
  "la-liga": "laliga",
  bundesliga: "bundesliga",
  "serie-a": "serie-a",
  "ligue-1": "ligue-1",
};

export function getBBSLeagueId(slug: string): string | null {
  return LEAGUE_MAP[slug] || null;
}
