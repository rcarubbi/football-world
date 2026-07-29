import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://api.bigballsdata.com";

function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.BBS_API_KEY) keys.push(process.env.BBS_API_KEY);
  if (process.env.BBS_API_KEY_2) keys.push(process.env.BBS_API_KEY_2);
  if (process.env.BBS_API_KEY_3) keys.push(process.env.BBS_API_KEY_3);
  if (process.env.BBS_API_KEY_4) keys.push(process.env.BBS_API_KEY_4);
  return keys;
}

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(8, 1000);
  }
  return limiter;
}

async function fetchWithRetry(url: string, retries = 3): Promise<unknown> {
  const keys = getApiKeys();
  for (let i = 0; i < retries; i++) {
    try {
      const apiKey = keys.length > 0 ? keys[i % keys.length] : "";
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
      if (response.status === 401) {
        console.warn(`Big Balls 401 with key index ${i % keys.length}, trying next...`);
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
  team_id: string;
  team_name: string;
  logo_url: string | null;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  win_pct: number | null;
  games_played: number;
  points_for: number | null;
  points_against: number | null;
  streak: string | null;
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
      data: { standings: { rows: BBSStandingRow[] }[] };
    };
    return data.data?.standings?.[0]?.rows || [];
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
  "serie-a": "seriea",
  "ligue-1": "ligue1",
  "champions-league": "ucl",
  "fifa-world-cup": "wc2026",
};

export function getBBSLeagueId(slug: string): string | null {
  return LEAGUE_MAP[slug] || null;
}

export async function getSports() {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/sports`)) as { data: unknown };
    return data.data || [];
  });
}

export async function getInjuries() {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/injuries?sport=football`)) as { data: unknown };
    return data.data || [];
  });
}

export async function getTeam(teamId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/teams/${teamId}`)) as { data: unknown };
    return data.data || null;
  });
}

export async function getTeamForm(teamId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/teams/${teamId}/form`)) as { data: unknown };
    return data.data || null;
  });
}

export async function getTeamStats(teamId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/teams/${teamId}/stats`)) as { data: unknown };
    return data.data || null;
  });
}

export async function getTeamElo(teamId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/teams/${teamId}/elo`)) as { data: unknown };
    return data.data || null;
  });
}

export async function getMatchDetail(matchId: string, fields?: string) {
  return getLimiter().add(async () => {
    const params = new URLSearchParams({ sport: "football" });
    if (fields) params.set("fields", fields);
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/matches/${matchId}?${params.toString()}`
    )) as { data: unknown };
    return data.data || null;
  });
}

export async function getMatchEvents(matchId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/matches/${matchId}/events?sport=football`
    )) as { data: unknown };
    return data.data || [];
  });
}

export async function getMatchStatistics(matchId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/matches/${matchId}/statistics`
    )) as { data: unknown };
    return data.data || null;
  });
}

export async function getMatchOdds(matchId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/matches/${matchId}/odds?sport=football`
    )) as { data: unknown };
    return data.data || [];
  });
}

export async function getPlayers(options: { limit?: number; offset?: number; team_id?: string } = {}) {
  return getLimiter().add(async () => {
    const params = new URLSearchParams({ sport: "football" });
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());
    if (options.team_id) params.set("team_id", options.team_id);
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/players?${params.toString()}`
    )) as { data: unknown[]; meta?: { total?: number } };
    return { players: data.data || [], total: data.meta?.total || 0 };
  });
}

export async function getPlayerDetail(playerId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/players/${playerId}`)) as { data: unknown };
    return data.data || null;
  });
}

export async function getPlayerStats(playerId: string, leagueId: string, season: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/players/${playerId}/stats?league=${leagueId}&season=${season}`
    )) as { data: unknown };
    return data.data || null;
  });
}

export async function getPlayerCareer(playerId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/players/${playerId}/career`)) as { data: unknown };
    return data.data || null;
  });
}

export async function getPlayerTransfers(playerId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/players/${playerId}/transfers`)) as { data: unknown };
    return data.data || null;
  });
}

export async function getPlayerTrophies(playerId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/v1/players/${playerId}/trophies`)) as { data: unknown };
    return data.data || null;
  });
}

export async function getPredictions(matchId: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/v1/predictions?match_id=${matchId}`
    )) as { data: unknown };
    return data.data || null;
  });
}
