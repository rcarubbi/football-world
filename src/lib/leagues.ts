export interface LeagueConfig {
  slug: string;
  name: string;
  country: string;
  sportsdbId: string;
  footballDataCode: string;
  logoUrl: string;
}

export interface LeagueRow {
  id: number;
  slug: string;
  name: string;
  country: string | null;
  badge_url: string | null;
  logo_url: string | null;
  sportsapipro_id: number | null;
  thesportsdb_id: string | null;
  bbd_id: string | null;
  football_data_code: string | null;
  current_season: string | null;
}

export function getCurrentSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 8 ? year : year - 1;
}

// Static config for 8 core leagues (used by importers that need FD codes)
export const LEAGUES: LeagueConfig[] = [
  {
    slug: "premier-league",
    name: "Premier League",
    country: "England",
    sportsdbId: "4328",
    footballDataCode: "PL",
    logoUrl: "/images/leagues/premier-league.png",
  },
  {
    slug: "la-liga",
    name: "La Liga",
    country: "Spain",
    sportsdbId: "4335",
    footballDataCode: "PD",
    logoUrl: "/images/leagues/la-liga.png",
  },
  {
    slug: "bundesliga",
    name: "Bundesliga",
    country: "Germany",
    sportsdbId: "4331",
    footballDataCode: "BL1",
    logoUrl: "/images/leagues/bundesliga.png",
  },
  {
    slug: "serie-a",
    name: "Serie A",
    country: "Italy",
    sportsdbId: "4332",
    footballDataCode: "SA",
    logoUrl: "/images/leagues/serie-a.png",
  },
  {
    slug: "ligue-1",
    name: "Ligue 1",
    country: "France",
    sportsdbId: "4334",
    footballDataCode: "FL1",
    logoUrl: "/images/leagues/ligue-1.png",
  },
  {
    slug: "champions-league",
    name: "UEFA Champions League",
    country: "Europe",
    sportsdbId: "4480",
    footballDataCode: "CL",
    logoUrl: "/images/leagues/champions-league.png",
  },
  {
    slug: "fifa-world-cup",
    name: "FIFA World Cup",
    country: "International",
    sportsdbId: "4442",
    footballDataCode: "WC",
    logoUrl: "/images/leagues/fifa-world-cup.png",
  },
  {
    slug: "brasileirao-serie-a",
    name: "Campeonato Brasileiro Série A",
    country: "Brazil",
    sportsdbId: "4351",
    footballDataCode: "BSA",
    logoUrl: "/images/leagues/brasileirao-serie-a.png",
  },
];

export function getLeagueBySlug(slug: string): LeagueConfig | undefined {
  return LEAGUES.find((l) => l.slug === slug);
}

// DB-backed leagues (all ~160 leagues, not just the 8 core)
export async function getLeaguesFromDb(): Promise<LeagueRow[]> {
  const { getTursoClient } = await import("./turso/client");
  const client = getTursoClient();
  const result = await client.execute(
    "SELECT * FROM leagues ORDER BY slug"
  );
  return result.rows as unknown as LeagueRow[];
}

export async function getLeagueBySlugFromDb(slug: string): Promise<LeagueRow | null> {
  const { getTursoClient } = await import("./turso/client");
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM leagues WHERE slug = ? LIMIT 1",
    args: [slug],
  });
  return (result.rows[0] as unknown as LeagueRow) ?? null;
}


