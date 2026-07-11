export interface LeagueIconConfig {
  slug: string;
  iconUrl: string;
  fallbackUrl: string;
}

export const LEAGUE_ICONS: LeagueIconConfig[] = [
  {
    slug: "premier-league",
    iconUrl: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",
  },
  {
    slug: "la-liga",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/LaLiga_EA_Sports_2023_Horizontal_Logo.svg",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a9/LaLiga_EA_Sports_2023_Horizontal_Logo.svg",
  },
  {
    slug: "bundesliga",
    iconUrl: "https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg",
  },
  {
    slug: "serie-a",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Serie_A.svg",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Serie_A.svg",
  },
  {
    slug: "ligue-1",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/Ligue_1_McDonald%27s_logo.svg",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/Ligue_1_McDonald%27s_logo.svg",
  },
  {
    slug: "champions-league",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d1/UEFA_Champions_League_logo_no_text.svg",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d1/UEFA_Champions_League_logo_no_text.svg",
  },
  {
    slug: "fifa-world-cup",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ab/2026_FIFA_World_Cup_emblem_%28horizontal_lockup%29.svg",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ab/2026_FIFA_World_Cup_emblem_%28horizontal_lockup%29.svg",
  },
  {
    slug: "brasileirao-serie-a",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Campeonato_Brasileiro_S%C3%A9rie_A_logo_%282024%29.svg",
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
