import { getTursoClient } from "../turso/client";

export interface Match {
  id: number;
  football_data_id: string | null;
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

export async function countMatches(): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute("SELECT COUNT(*) as n FROM matches");
  return Number(result.rows[0]?.n ?? 0);
}

export async function upsertMatch(match: Partial<Match>): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `INSERT INTO matches (
      football_data_id, league_slug, season, matchday, status,
      home_team_id, home_team_name, home_score, away_team_id, away_team_name,
      away_score, match_date, match_time, venue
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(football_data_id) DO UPDATE SET
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

export async function findRecentFinishedMatchesWithBadges(limit = 6): Promise<Array<Match & { home_badge: string | null; home_team_slug: string | null; away_badge: string | null; away_team_slug: string | null }>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT m.*, t1.badge_url as home_badge, t1.slug as home_team_slug, t2.badge_url as away_badge, t2.slug as away_team_slug
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_name = t1.name
      LEFT JOIN teams t2 ON m.away_team_name = t2.name
      WHERE m.status = 'FINISHED'
      ORDER BY m.match_date DESC LIMIT ?`,
    args: [limit],
  });
  return result.rows as unknown as Array<Match & { home_badge: string | null; home_team_slug: string | null; away_badge: string | null; away_team_slug: string | null }>;
}

export async function findRecentMatchesWithBadgesByLeague(leagueSlug: string, limit = 10): Promise<Array<Match & { home_badge: string | null; home_team_slug: string | null; away_badge: string | null; away_team_slug: string | null }>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT m.*,
      COALESCE(t1.badge_url, t3.badge_url) as home_badge,
      COALESCE(t1.slug, t3.slug) as home_team_slug,
      COALESCE(t2.badge_url, t4.badge_url) as away_badge,
      COALESCE(t2.slug, t4.slug) as away_team_slug
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_name = t1.name
      LEFT JOIN teams t3 ON t1.id IS NULL AND (
        REPLACE(REPLACE(REPLACE(REPLACE(m.home_team_name, ' FC', ''), ' CF', ''), ' AFC', ''), ' & ', ' and ') = REPLACE(REPLACE(REPLACE(REPLACE(t3.name, ' FC', ''), ' CF', ''), ' AFC', ''), ' & ', ' and ')
        OR m.home_team_name LIKE t3.name || ' %'
        OR t3.name LIKE m.home_team_name || ' %'
      )
      LEFT JOIN teams t2 ON m.away_team_name = t2.name
      LEFT JOIN teams t4 ON t2.id IS NULL AND (
        REPLACE(REPLACE(REPLACE(REPLACE(m.away_team_name, ' FC', ''), ' CF', ''), ' AFC', ''), ' & ', ' and ') = REPLACE(REPLACE(REPLACE(REPLACE(t4.name, ' FC', ''), ' CF', ''), ' AFC', ''), ' & ', ' and ')
        OR m.away_team_name LIKE t4.name || ' %'
        OR t4.name LIKE m.away_team_name || ' %'
      )
      WHERE m.league_slug = ? AND m.match_date < date('now') ORDER BY m.match_date DESC LIMIT ?`,
    args: [leagueSlug, limit],
  });
  return result.rows as unknown as Array<Match & { home_badge: string | null; home_team_slug: string | null; away_badge: string | null; away_team_slug: string | null }>;
}

export async function findUpcomingMatchesWithBadgesByLeague(leagueSlug: string, limit = 10): Promise<Array<Match & { home_badge: string | null; home_team_slug: string | null; away_badge: string | null; away_team_slug: string | null }>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT m.*,
      COALESCE(t1.badge_url, t3.badge_url) as home_badge,
      COALESCE(t1.slug, t3.slug) as home_team_slug,
      COALESCE(t2.badge_url, t4.badge_url) as away_badge,
      COALESCE(t2.slug, t4.slug) as away_team_slug
      FROM matches m
      LEFT JOIN teams t1 ON m.home_team_name = t1.name
      LEFT JOIN teams t3 ON t1.id IS NULL AND (
        REPLACE(REPLACE(REPLACE(REPLACE(m.home_team_name, ' FC', ''), ' CF', ''), ' AFC', ''), ' & ', ' and ') = REPLACE(REPLACE(REPLACE(REPLACE(t3.name, ' FC', ''), ' CF', ''), ' AFC', ''), ' & ', ' and ')
        OR m.home_team_name LIKE t3.name || ' %'
        OR t3.name LIKE m.home_team_name || ' %'
      )
      LEFT JOIN teams t2 ON m.away_team_name = t2.name
      LEFT JOIN teams t4 ON t2.id IS NULL AND (
        REPLACE(REPLACE(REPLACE(REPLACE(m.away_team_name, ' FC', ''), ' CF', ''), ' AFC', ''), ' & ', ' and ') = REPLACE(REPLACE(REPLACE(REPLACE(t4.name, ' FC', ''), ' CF', ''), ' AFC', ''), ' & ', ' and ')
        OR m.away_team_name LIKE t4.name || ' %'
        OR t4.name LIKE m.away_team_name || ' %'
      )
      WHERE m.league_slug = ? AND m.match_date >= date('now') ORDER BY m.match_date ASC LIMIT ?`,
    args: [leagueSlug, limit],
  });
  return result.rows as unknown as Array<Match & { home_badge: string | null; home_team_slug: string | null; away_badge: string | null; away_team_slug: string | null }>;
}

export async function findMatchesWithBadgesByTeamName(teamName: string, limit = 10): Promise<Array<Match & { home_badge: string | null; away_badge: string | null }>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT m.*, t1.badge_url as home_badge, t2.badge_url as away_badge
            FROM matches m
            LEFT JOIN teams t1 ON m.home_team_name = t1.name
            LEFT JOIN teams t2 ON m.away_team_name = t2.name
            WHERE m.home_team_name = ? OR m.away_team_name = ?
            ORDER BY m.match_date DESC LIMIT ?`,
    args: [teamName, teamName, limit],
  });
  return result.rows as unknown as Array<Match & { home_badge: string | null; away_badge: string | null }>;
}
