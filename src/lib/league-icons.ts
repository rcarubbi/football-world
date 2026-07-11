export interface LeagueIconConfig {
  slug: string;
  iconUrl: string;
  fallbackUrl: string;
}

export const LEAGUE_ICONS: LeagueIconConfig[] = [
  {
    slug: "premier-league",
    iconUrl: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",
    fallbackUrl: "https://www.thesportsdb.com/images/media/league/bwd83l1473502969.png",
  },
  {
    slug: "la-liga",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/7/76/LaLiga_EA_Sports_Logo.svg",
    fallbackUrl: "https://www.thesportsdb.com/images/media/league/wup4sr1473503194.png",
  },
  {
    slug: "bundesliga",
    iconUrl: "https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg",
    fallbackUrl: "https://www.thesportsdb.com/images/media/league/kve6kf1473503365.png",
  },
  {
    slug: "serie-a",
    iconUrl: "https://upload.wikimedia.org/wikipedia/en/e/e1/Serie_A_logo_%282019%29.svg",
    fallbackUrl: "https://www.thesportsdb.com/images/media/league/z040vq1473502968.png",
  },
  {
    slug: "ligue-1",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/4/49/Ligue1_Uber_Eats_logo.svg",
    fallbackUrl: "https://www.thesportsdb.com/images/media/league/n633x11473503488.png",
  },
  {
    slug: "champions-league",
    iconUrl: "https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg",
    fallbackUrl: "https://www.thesportsdb.com/images/media/league/vwvwrw1473502981.png",
  },
  {
    slug: "fifa-world-cup",
    iconUrl: "https://upload.wikimedia.org/wikipedia/en/6/63/FIFA_World_Cup_2026_logo.svg",
    fallbackUrl: "https://www.thesportsdb.com/images/media/league/q46e9q1473502983.png",
  },
  {
    slug: "brasileirao-serie-a",
    iconUrl: "https://upload.wikimedia.org/wikipedia/pt/2/2e/Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282023%29.svg",
    fallbackUrl: "https://www.thesportsdb.com/images/media/league/24q5611473503486.png",
  },
];

export function getLeagueIcon(slug: string): LeagueIconConfig | undefined {
  return LEAGUE_ICONS.find((l) => l.slug === slug);
}

export function getLeagueIconUrl(slug: string): string {
  const config = getLeagueIcon(slug);
  return config?.iconUrl ?? "";
}

export function getLeagueIconFallback(slug: string): string {
  const config = getLeagueIcon(slug);
  return config?.fallbackUrl ?? "";
}
