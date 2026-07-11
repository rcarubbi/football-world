export interface LeagueConfig {
  slug: string;
  name: string;
  country: string;
  sportsdbId: string;
  footballDataCode: string;
  apiFootballId: number;
}

export const LEAGUES: LeagueConfig[] = [
  {
    slug: "premier-league",
    name: "Premier League",
    country: "England",
    sportsdbId: "4328",
    footballDataCode: "PL",
    apiFootballId: 39,
  },
  {
    slug: "la-liga",
    name: "La Liga",
    country: "Spain",
    sportsdbId: "4335",
    footballDataCode: "PD",
    apiFootballId: 140,
  },
  {
    slug: "bundesliga",
    name: "Bundesliga",
    country: "Germany",
    sportsdbId: "4331",
    footballDataCode: "BL1",
    apiFootballId: 78,
  },
  {
    slug: "serie-a",
    name: "Serie A",
    country: "Italy",
    sportsdbId: "4332",
    footballDataCode: "SA",
    apiFootballId: 135,
  },
  {
    slug: "ligue-1",
    name: "Ligue 1",
    country: "France",
    sportsdbId: "4334",
    footballDataCode: "FL1",
    apiFootballId: 61,
  },
  {
    slug: "champions-league",
    name: "UEFA Champions League",
    country: "Europe",
    sportsdbId: "4480",
    footballDataCode: "CL",
    apiFootballId: 2,
  },
  {
    slug: "fifa-world-cup",
    name: "FIFA World Cup",
    country: "International",
    sportsdbId: "4442",
    footballDataCode: "WC",
    apiFootballId: 1,
  },
  {
    slug: "brasileirao-serie-a",
    name: "Campeonato Brasileiro Série A",
    country: "Brazil",
    sportsdbId: "4340",
    footballDataCode: "BSA",
    apiFootballId: 71,
  },
];

export function getLeagueBySlug(slug: string): LeagueConfig | undefined {
  return LEAGUES.find((l) => l.slug === slug);
}

export function getLeagueBySportsdbId(id: string): LeagueConfig | undefined {
  return LEAGUES.find((l) => l.sportsdbId === id);
}

export function getLeagueByFootballDataCode(
  code: string
): LeagueConfig | undefined {
  return LEAGUES.find((l) => l.footballDataCode === code);
}

export function getLeagueByApiFootballId(
  id: number
): LeagueConfig | undefined {
  return LEAGUES.find((l) => l.apiFootballId === id);
}
