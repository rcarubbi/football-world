import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://api.sportsapipro.com/v2/football";

function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.SPORTS_API_PRO_KEY) keys.push(process.env.SPORTS_API_PRO_KEY);
  if (process.env.SPORTS_API_PRO_KEY_2) keys.push(process.env.SPORTS_API_PRO_KEY_2);
  if (process.env.SPORTS_API_PRO_KEY_3) keys.push(process.env.SPORTS_API_PRO_KEY_3);
  if (process.env.SPORTS_API_PRO_KEY_4) keys.push(process.env.SPORTS_API_PRO_KEY_4);
  return keys;
}

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(2, 400); // 2 concurrent, 400/day per key
  }
  return limiter;
}

async function fetchWithRetry(
  url: string,
  retries = 6
): Promise<unknown> {
  const keys = getApiKeys();
  for (let i = 0; i < retries; i++) {
    try {
      const apiKey = keys.length > 0 ? keys[i % keys.length] : "";
      const response = await fetch(url, {
        headers: { "x-api-key": apiKey },
      });
      if (response.status === 429) {
        const wait = Math.min(Math.pow(2, i) * 5000, 60000);
        console.warn(`  Rate limited (attempt ${i + 1}/${retries}), waiting ${wait / 1000}s...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (response.status === 401) {
        console.warn(`Sports API Pro 401 with key index ${i % keys.length}, trying next...`);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) =>
        setTimeout(r, Math.min(Math.pow(2, i) * 2000, 30000))
      );
    }
  }
  throw new Error("Max retries exceeded");
}

export interface SportsAPIProPlayer {
  id: number;
  name: string;
  slug: string;
  position: string;
  dateOfBirth?: string;
  height?: number;
  country?: { name: string };
  jerseyNumber?: number;
}

// ── Global ──────────────────────────────────────────────────

export async function getCountries() {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/api/countries`)) as { data: unknown };
    return data.data || [];
  });
}

export async function getLeagues(country?: string) {
  return getLimiter().add(async () => {
    const params = country ? `?country=${country}` : "";
    const data = (await fetchWithRetry(`${BASE_URL}/api/leagues${params}`)) as { data: unknown };
    return data.data || [];
  });
}

export async function getTournaments() {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(`${BASE_URL}/api/tournaments`)) as { leagues?: unknown; data?: unknown };
    return data.leagues || data.data || [];
  });
}

export async function searchAll(query: string) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/search?q=${encodeURIComponent(query)}`
    )) as { data: { results: unknown[] } };
    return data.data?.results || [];
  });
}

export async function searchTeam(
  query: string
): Promise<{ id: number; name: string } | null> {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/search?q=${encodeURIComponent(query)}`
    )) as {
      data?: {
        results: Array<{
          type: string;
          entity: {
            id: number;
            name: string;
            userCount?: number;
            mainCompetitionId?: number;
            country?: { alpha2?: string };
          };
        }>;
      };
    };
    const teams = data.data?.results?.filter((r) => r.type === "team");
    if (!teams || teams.length === 0) return null;
    const sorted = [...teams].sort(
      (a, b) => (b.entity.userCount || 0) - (a.entity.userCount || 0)
    );
    return sorted[0].entity;
  });
}

export async function getNews(lang = "en") {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/news?lang=${lang}`
    )) as { data: unknown };
    return data.data || [];
  });
}

// ── Tournament ──────────────────────────────────────────────

export async function getTournamentSeasons(tournamentId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/tournaments/${tournamentId}/seasons`
    )) as { seasons?: unknown[]; data?: { seasons?: unknown[] } };
    return data.seasons || data.data?.seasons || [];
  });
}

export async function getTournamentInfo(tournamentId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/tournament/${tournamentId}/info`
    )) as Record<string, unknown>;
    return data.info || data.tournament || data.data || data || null;
  });
}

export async function getStandings(tournamentId: number, seasonId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/tournament/${tournamentId}/season/${seasonId}/standings`
    )) as { standings?: unknown; data?: unknown };
    return data.standings || data.data || null;
  });
}

export async function getTopPlayers(tournamentId: number, seasonId: number) {
  return getLimiter().add(async () => {
    try {
      const data = (await fetchWithRetry(
        `${BASE_URL}/api/tournament/${tournamentId}/season/${seasonId}/top-players`
      )) as { topPlayers?: unknown; data?: unknown };
      return data.topPlayers || data.data || null;
    } catch {
      return null;
    }
  });
}

export async function getTournamentTeams(tournamentId: number, seasonId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/tournament/${tournamentId}/season/${seasonId}/teams`
    )) as { data?: unknown; teams?: unknown[] };
    return data.teams || data.data || null;
  });
}

export async function getEventsLast(tournamentId: number, seasonId: number, page: number) {
  return getLimiter().add(async () => {
    try {
      const data = (await fetchWithRetry(
        `${BASE_URL}/api/tournament/${tournamentId}/season/${seasonId}/events/last/${page}`
      )) as { data?: { events?: unknown[]; hasNextPage?: boolean } };
      return data.data || null;
    } catch {
      return null;
    }
  });
}

export async function getEventsNext(tournamentId: number, seasonId: number, page: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/tournament/${tournamentId}/season/${seasonId}/events/next/${page}`
    )) as { data?: { events?: unknown[]; hasNextPage?: boolean } };
    return data.data || null;
  });
}

// ── Team ────────────────────────────────────────────────────

export async function getTeamDetails(teamId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/teams/${teamId}`
    )) as { data: unknown };
    return data.data || null;
  });
}

export async function getTeamSquad(teamId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/teams/${teamId}/players`
    )) as { players?: unknown; data?: { players?: unknown } };
    return data.players || data.data?.players || null;
  });
}

export async function getTeamSquadPlayers(teamId: number): Promise<SportsAPIProPlayer[]> {
  const data = await getTeamSquad(teamId) as {
    players?: Array<{
      player: {
        id: number;
        name: string;
        slug: string;
        position: string;
        dateOfBirth?: string;
        height?: number;
        country?: { name: string };
        jerseyNumber?: number;
      };
    }>;
  } | null;
  return (data?.players || []).map((p) => ({
    id: p.player.id,
    name: p.player.name,
    slug: p.player.slug,
    position: p.player.position,
    dateOfBirth: p.player.dateOfBirth,
    height: p.player.height,
    country: p.player.country,
    jerseyNumber: p.player.jerseyNumber,
  }));
}

export async function getTeamTransfers(teamId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/teams/${teamId}/transfers`
    )) as { transfers?: unknown; data?: { transfers?: unknown } };
    return data.transfers || data.data || null;
  });
}

export async function getTeamPerformance(teamId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/teams/${teamId}/performance`
    )) as Record<string, unknown>;
    return data.performance || data.data || data || null;
  });
}

// ── Match ───────────────────────────────────────────────────

export async function getMatchDetail(matchId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/match/${matchId}`
    )) as Record<string, unknown>;
    return data.match || data.data || data || null;
  });
}

export async function getMatchLineups(matchId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/match/${matchId}/lineups`
    )) as Record<string, unknown>;
    return data.lineups || data.data || data || null;
  });
}

export async function getMatchStatistics(matchId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/match/${matchId}/statistics`
    )) as Record<string, unknown>;
    return data.statistics || data.data || data || null;
  });
}

export async function getMatchIncidents(matchId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/match/${matchId}/incidents`
    )) as Record<string, unknown>;
    return data.incidents || data.data || data || null;
  });
}

export async function getMatchShotmap(matchId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/match/${matchId}/shotmap`
    )) as Record<string, unknown>;
    return data.shotmap || data.shots || data.data || data || null;
  });
}

export async function getMatchPlayerStatistics(matchId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/match/${matchId}/player-statistics`
    )) as Record<string, unknown>;
    return data.playerStatistics || data.statistics || data.data || data || null;
  });
}

// ── Player ──────────────────────────────────────────────────

export async function getPlayerDetails(playerId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/players/${playerId}`
    )) as Record<string, unknown>;
    return data.player || data.data || data || null;
  });
}

export async function getPlayerStatistics(playerId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/players/${playerId}/statistics`
    )) as Record<string, unknown>;
    return data.statistics || data.data || data || null;
  });
}

export async function getPlayerTransferHistory(playerId: number) {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/players/${playerId}/transfer-history`
    )) as { data: unknown };
    return data.data || null;
  });
}
