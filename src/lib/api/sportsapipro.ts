import { RateLimiter } from "./rate-limiter";

const BASE_URL = "https://api.sportsapipro.com/v2/football";

function getApiKey(): string {
  return process.env.SPORTS_API_PRO_KEY || "";
}

let limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (!limiter) {
    limiter = new RateLimiter(2, 100); // 2 concurrent, 100/day
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
        headers: { "x-api-key": getApiKey() },
      });
      if (response.status === 429) {
        const wait = Math.pow(2, i) * 5000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) =>
        setTimeout(r, Math.pow(2, i) * 1000)
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
            popularityRank?: number;
            mainCompetitionId?: number;
            country?: { alpha2?: string };
          };
        }>;
      };
    };
    const teams = data.data?.results?.filter((r) => r.type === "team");
    if (!teams || teams.length === 0) return null;
    // Always pick the most popular team (highest userCount)
    const sorted = [...teams].sort(
      (a, b) => (b.entity.userCount || 0) - (a.entity.userCount || 0)
    );
    return sorted[0].entity;
  });
}

export async function getTeamSquad(
  teamId: number
): Promise<SportsAPIProPlayer[]> {
  return getLimiter().add(async () => {
    const data = (await fetchWithRetry(
      `${BASE_URL}/api/teams/${teamId}/players`
    )) as {
      data?: {
        players: Array<{
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
      };
    };
    return (data.data?.players || []).map((p) => ({
      id: p.player.id,
      name: p.player.name,
      slug: p.player.slug,
      position: p.player.position,
      dateOfBirth: p.player.dateOfBirth,
      height: p.player.height,
      country: p.player.country,
      jerseyNumber: p.player.jerseyNumber,
    }));
  });
}
