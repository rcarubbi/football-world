import { getTursoClient } from "../turso/client";

export interface Match {
  id: number;
  football_data_id: string | null;
  apifootball_id: string | null;
  league_slug: string;
  season: string | null;
  matchday: number | null;
  status: string | null;
  home_team_id: number | null;
  home_team_name: string | null;
  home_score: number | null;
  away_team_id: number | null;
  away_team_name: string | null;
  away_score: number | null;
  match_date: string | null;
  match_time: string | null;
  venue: string | null;
}

export async function upsertMatch(match: Partial<Match>): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `INSERT INTO matches (
      football_data_id, apifootball_id, league_slug, season, matchday, status,
      home_team_id, home_team_name, home_score, away_team_id, away_team_name,
      away_score, match_date, match_time, venue
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(football_data_id) DO UPDATE SET
      apifootball_id = excluded.apifootball_id,
      season = excluded.season,
      matchday = excluded.matchday,
      status = excluded.status,
      home_team_id = excluded.home_team_id,
      home_team_name = excluded.home_team_name,
      home_score = excluded.home_score,
      away_team_id = excluded.away_team_id,
      away_team_name = excluded.away_team_name,
      away_score = excluded.away_score,
      match_date = excluded.match_date,
      match_time = excluded.match_time,
      venue = excluded.venue
    RETURNING id`,
    args: [
      match.football_data_id ?? null,
      match.apifootball_id ?? null,
      match.league_slug ?? "",
      match.season ?? null,
      match.matchday ?? null,
      match.status ?? null,
      match.home_team_id ?? null,
      match.home_team_name ?? null,
      match.home_score ?? null,
      match.away_team_id ?? null,
      match.away_team_name ?? null,
      match.away_score ?? null,
      match.match_date ?? null,
      match.match_time ?? null,
      match.venue ?? null,
    ],
  });
  return Number(result.rows[0]?.id);
}

export async function findMatchesByTeam(
  teamId: number,
  limit = 5
): Promise<Match[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT m.* FROM matches m
      LEFT JOIN teams t ON t.id = ?
      WHERE m.home_team_id = ? OR m.away_team_id = ?
        OR m.home_team_name = t.name OR m.away_team_name = t.name
      ORDER BY m.match_date DESC
      LIMIT ?`,
    args: [teamId, teamId, teamId, limit],
  });
  return result.rows as unknown as Match[];
}

export async function findMatchesByLeague(
  leagueSlug: string,
  limit = 10
): Promise<Match[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT * FROM matches WHERE league_slug = ? ORDER BY match_date DESC LIMIT ?`,
    args: [leagueSlug, limit],
  });
  return result.rows as unknown as Match[];
}

export async function findUpcomingMatches(
  leagueSlug: string,
  limit = 10
): Promise<Match[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT * FROM matches 
      WHERE league_slug = ? AND match_date >= date('now') 
      ORDER BY match_date ASC 
      LIMIT ?`,
    args: [leagueSlug, limit],
  });
  return result.rows as unknown as Match[];
}

export async function findRecentMatches(
  leagueSlug: string,
  limit = 10
): Promise<Match[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT * FROM matches 
      WHERE league_slug = ? AND match_date < date('now') 
      ORDER BY match_date DESC 
      LIMIT ?`,
    args: [leagueSlug, limit],
  });
  return result.rows as unknown as Match[];
}
