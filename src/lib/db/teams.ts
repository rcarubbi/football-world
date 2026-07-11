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
      thesportsdb_id = excluded.football_data_id,
      football_data_id = excluded.football_data_id,
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
