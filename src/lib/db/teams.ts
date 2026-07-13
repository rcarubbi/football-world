import { getTursoClient } from "../turso/client";

export interface Team {
  id: number;
  thesportsdb_id: string | null;
  football_data_id: string | null;
  apifootball_id: string | null;
  name: string;
  slug: string;
  short_name: string | null;
  badge_url: string | null;
  kit_home_url: string | null;
  kit_away_url: string | null;
  kit_third_url: string | null;
  founded: string | null;
  stadium: string | null;
  location: string | null;
  league_slug: string;
  wikipedia_content: string | null;
  stadium_content: string | null;
}

export async function upsertTeam(team: Partial<Team>): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `INSERT INTO teams (
      thesportsdb_id, football_data_id, apifootball_id, name, slug, short_name,
      badge_url, kit_home_url, kit_away_url, kit_third_url, founded, stadium,
      location, league_slug, wikipedia_content, stadium_content
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      thesportsdb_id = COALESCE(excluded.thesportsdb_id, teams.thesportsdb_id),
      football_data_id = COALESCE(excluded.football_data_id, teams.football_data_id),
      apifootball_id = excluded.apifootball_id,
      name = excluded.name,
      short_name = excluded.short_name,
      badge_url = excluded.badge_url,
      kit_home_url = excluded.kit_home_url,
      kit_away_url = excluded.kit_away_url,
      kit_third_url = excluded.kit_third_url,
      founded = excluded.founded,
      stadium = excluded.stadium,
      location = excluded.location,
      league_slug = excluded.league_slug,
      wikipedia_content = COALESCE(excluded.wikipedia_content, teams.wikipedia_content),
      stadium_content = COALESCE(excluded.stadium_content, teams.stadium_content),
      updated_at = datetime('now')
    RETURNING id`,
    args: [
      team.thesportsdb_id ?? null,
      team.football_data_id ?? null,
      team.apifootball_id ?? null,
      team.name ?? "",
      team.slug ?? "",
      team.short_name ?? null,
      team.badge_url ?? null,
      team.kit_home_url ?? null,
      team.kit_away_url ?? null,
      team.kit_third_url ?? null,
      team.founded ?? null,
      team.stadium ?? null,
      team.location ?? null,
      team.league_slug ?? "",
      team.wikipedia_content ?? null,
      team.stadium_content ?? null,
    ],
  });
  return Number(result.rows[0]?.id);
}

export async function findTeamBySlug(slug: string): Promise<Team | null> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM teams WHERE slug = ?",
    args: [slug],
  });
  return (result.rows[0] as unknown as Team) ?? null;
}

export async function findTeamsByLeague(leagueSlug: string): Promise<Team[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM teams WHERE league_slug = ? ORDER BY name",
    args: [leagueSlug],
  });
  return result.rows as unknown as Team[];
}

export async function findAllTeams(): Promise<Team[]> {
  const client = getTursoClient();
  const result = await client.execute("SELECT * FROM teams ORDER BY name");
  return result.rows as unknown as Team[];
}

export async function updateTeamWikipedia(
  id: number,
  wikipediaContent: string | null,
  stadiumContent: string | null
): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `UPDATE teams SET wikipedia_content = ?, stadium_content = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [wikipediaContent, stadiumContent, id],
  });
}

export async function countTeams(): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute("SELECT COUNT(*) as n FROM teams");
  return Number(result.rows[0]?.n ?? 0);
}

export async function countTeamsByLeague(leagueSlug: string): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT COUNT(*) as n FROM teams WHERE league_slug = ?",
    args: [leagueSlug],
  });
  return Number(result.rows[0]?.n ?? 0);
}

export async function findTopTeamsWithPlayerCount(limit = 8): Promise<Array<Team & { player_count: number }>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT t.name, t.slug, t.badge_url, t.league_slug,
             COUNT(p.id) as player_count
      FROM teams t
      LEFT JOIN players p ON p.team_id = t.id
      GROUP BY t.id
      ORDER BY player_count DESC LIMIT ?`,
    args: [limit],
  });
  return result.rows as unknown as Array<Team & { player_count: number }>;
}

export async function findAllTeamsWithPlayerCount(): Promise<Array<Team & { player_count: number }>> {
  const client = getTursoClient();
  const result = await client.execute(`
    SELECT t.id, t.name, t.slug, t.badge_url, t.league_slug, t.stadium,
           COUNT(p.id) as player_count
    FROM teams t
    LEFT JOIN players p ON p.team_id = t.id
    GROUP BY t.id
    ORDER BY t.name
  `);
  return result.rows as unknown as Array<Team & { player_count: number }>;
}

export async function findTeamsWithoutPlayers(): Promise<Array<Pick<Team, 'id' | 'name' | 'league_slug' | 'thesportsdb_id' | 'apifootball_id'>>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT t.id, t.name, t.league_slug, t.thesportsdb_id, t.apifootball_id
          FROM teams t
          WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.team_id = t.id)
            AND t.league_slug != 'fifa-world-cup'
          ORDER BY t.league_slug, t.name`,
    args: [],
  });
  return result.rows as unknown as Array<Pick<Team, 'id' | 'name' | 'league_slug' | 'thesportsdb_id' | 'apifootball_id'>>;
}

export async function findTeamsWithoutVideos(limit = 50): Promise<Array<Pick<Team, 'id' | 'name' | 'league_slug'>>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT t.id, t.name, t.league_slug
          FROM teams t
          WHERE t.league_slug != 'fifa-world-cup'
            AND NOT EXISTS (
              SELECT 1 FROM videos v
              WHERE v.entity_type = 'team' AND v.entity_id = t.id
            )
          ORDER BY t.league_slug, t.name
          LIMIT ?`,
    args: [limit],
  });
  return result.rows as unknown as Array<Pick<Team, 'id' | 'name' | 'league_slug'>>;
}

export async function updateTeamApifootballId(id: number, apifootballId: string): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `UPDATE teams SET apifootball_id = ? WHERE id = ?`,
    args: [apifootballId, id],
  });
}

export async function updateTeamFromSportsDB(
  id: number,
  data: {
    thesportsdb_id?: string | null;
    badge_url?: string | null;
    stadium?: string | null;
    location?: string | null;
    founded?: string | null;
    wikipedia_content?: string | null;
  }
): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `UPDATE teams SET
      thesportsdb_id = COALESCE(NULLIF(thesportsdb_id, ''), ?),
      badge_url = COALESCE(NULLIF(badge_url, ''), ?),
      stadium = COALESCE(NULLIF(stadium, ''), ?),
      location = COALESCE(NULLIF(location, ''), ?),
      founded = COALESCE(NULLIF(founded, ''), ?),
      wikipedia_content = COALESCE(NULLIF(wikipedia_content, ''), ?)
    WHERE id = ?`,
    args: [
      data.thesportsdb_id ?? null,
      data.badge_url ?? null,
      data.stadium ?? null,
      data.location ?? null,
      data.founded ?? null,
      data.wikipedia_content ?? null,
      id,
    ],
  });
}

export async function updateTeamSportsdbId(id: number, thesportsdbId: string): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `UPDATE teams SET thesportsdb_id = ? WHERE id = ?`,
    args: [thesportsdbId, id],
  });
}

export async function findTeamById(id: number): Promise<Team | null> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM teams WHERE id = ?",
    args: [id],
  });
  return (result.rows[0] as unknown as Team) ?? null;
}

export async function searchTeamsByName(pattern: string): Promise<Pick<Team, 'name' | 'slug' | 'badge_url' | 'league_slug'>[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT name, slug, badge_url, league_slug FROM teams WHERE name LIKE ? ORDER BY name LIMIT 10`,
    args: [pattern],
  });
  return result.rows as unknown as Pick<Team, 'name' | 'slug' | 'badge_url' | 'league_slug'>[];
}

export const TEAM_NAME_MAP: Record<string, string> = {
  'Man City': 'Manchester City FC',
  'Man Utd': 'Manchester United FC',
  'Manchester United': 'Manchester United FC',
  'Manchester City': 'Manchester City FC',
  'Newcastle': 'Newcastle United FC',
  'Newcastle Utd': 'Newcastle United FC',
  'Brighton': 'Brighton & Hove Albion FC',
  'Brighton and Hove Albion': 'Brighton & Hove Albion FC',
  'Spurs': 'Tottenham Hotspur FC',
  'Tottenham': 'Tottenham Hotspur FC',
  'Tottenham Hotspur': 'Tottenham Hotspur FC',
  'West Ham': 'West Ham United FC',
  'West Ham United': 'West Ham United FC',
  'Wolves': 'Wolverhampton Wanderers FC',
  'Wolverhampton': 'Wolverhampton Wanderers FC',
  'Nott\'m Forest': 'Nottingham Forest FC',
  'Nottingham Forest': 'Nottingham Forest FC',
  'Leeds': 'Leeds United FC',
  'Leeds United': 'Leeds United FC',
  'Bournemouth': 'AFC Bournemouth',
  'Burnley': 'Burnley FC',
  'Brentford': 'Brentford FC',
  'Fulham': 'Fulham FC',
  'Crystal Palace': 'Crystal Palace FC',
  'Ipswich': 'Ipswich Town FC',
  'Ipswich Town': 'Ipswich Town FC',
  'Bayern Munich': 'FC Bayern München',
  'Dortmund': 'Borussia Dortmund',
  'Leverkusen': 'Bayer 04 Leverkusen',
  'Bayer Leverkusen': 'Bayer 04 Leverkusen',
  'Frankfurt': 'Eintracht Frankfurt',
  'Wolfsburg': 'VfL Wolfsburg',
  'Stuttgart': 'VfB Stuttgart',
  'Barcelona': 'FC Barcelona',
  'Real Madrid': 'Real Madrid CF',
  'Atlético Madrid': 'Atlético de Madrid',
  'Atletico Madrid': 'Atlético de Madrid',
  'Sevilla': 'Sevilla FC',
  'Athletic Bilbao': 'Athletic Club',
  'Real Sociedad': 'Real Sociedad',
  'Betis': 'Real Betis Balompié',
  'Real Betis': 'Real Betis Balompié',
  'Villarreal': 'Villarreal CF',
  'Girona': 'Girona FC',
  'Valencia': 'Valencia CF',
  'Celta Vigo': 'RC Celta de Vigo',
  'Las Palmas': 'UD Las Palmas',
  'Mallorca': 'RCD Mallorca',
  'Osasuna': 'CA Osasuna',
  'Alavés': 'Deportivo Alavés',
  'Leganés': 'CD Leganés',
  'Espanyol': 'RCD Espanyol',
  'Juventus': 'Juventus FC',
  'Inter': 'Inter Milan',
  'Milan': 'AC Milan',
  'Napoli': 'SSC Napoli',
  'Roma': 'AS Roma',
  'Lazio': 'SS Lazio',
  'Atalanta': 'Atalanta BC',
  'Fiorentina': 'ACF Fiorentina',
  'Bologna': 'Bologna FC 1909',
  'Monza': 'AC Monza',
  'Torino': 'Torino FC',
  'Genoa': 'Genoa CFC',
  'Cagliari': 'Cagliari Calcio',
  'Udinese': 'Udinese Calcio',
  'Lecce': 'US Lecce',
  'Empoli': 'Empoli FC',
  'Verona': 'Hellas Verona FC',
  'Parma': 'Parma Calcio 1913',
  'Como': 'Como 1907',
  'Venezia': 'Venezia FC',
  'PSG': 'Paris Saint-Germain FC',
  'Paris Saint-Germain': 'Paris Saint-Germain FC',
  'Marseille': 'Olympique de Marseille',
  'Lyon': 'Olympique Lyonnais',
  'Monaco': 'AS Monaco FC',
  'Nice': 'OGC Nice',
  'Lille': 'LOSC Lille',
  'Lens': 'RC Lens',
  'Rennes': 'Stade Rennais FC',
  'Brest': 'Stade Brestois 29',
  'Nantes': 'FC Nantes',
  'Strasbourg': 'RC Strasbourg Alsace',
  'Reims': 'Stade de Reims',
  'Montpellier': 'Montpellier HSC',
  'Le Havre': 'Le Havre AC',
  'Toulouse': 'Toulouse FC',
  'Sunderland': 'Sunderland AFC',
};

export function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

export async function findTeamIdByName(name: string): Promise<{ id: number; badge_url: string | null; name: string } | null> {
  const normalized = normalizeTeamName(name);
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT id, badge_url, name FROM teams WHERE name = ? OR name = ? OR name = ? OR name = ? OR name = ? OR name = ? LIMIT 1`,
    args: [normalized, name, name + ' FC', name.replace(' FC', ''), name + ' CF', name.replace(' CF', '')],
  });
  return result.rows.length > 0
    ? { id: result.rows[0].id as number, badge_url: result.rows[0].badge_url as string | null, name: result.rows[0].name as string }
    : null;
}
