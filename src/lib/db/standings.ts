import { getTursoClient } from "../turso/client";

export interface Standing {
  id: number;
  league_slug: string;
  season: string;
  position: number | null;
  team_id: number | null;
  team_name: string | null;
  team_badge: string | null;
  team_slug: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form: string | null;
}

export async function upsertStanding(
  standing: Partial<Standing>
): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO league_standings (
      league_slug, season, position, team_id, team_name, team_badge,
      played, won, drawn, lost, goals_for, goals_against, goal_difference, points, form
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(league_slug, season, position) DO UPDATE SET
      team_id = excluded.team_id,
      team_name = excluded.team_name,
      team_badge = excluded.team_badge,
      played = excluded.played,
      won = excluded.won,
      drawn = excluded.drawn,
      lost = excluded.lost,
      goals_for = excluded.goals_for,
      goals_against = excluded.goals_against,
      goal_difference = excluded.goal_difference,
      points = excluded.points,
      form = excluded.form,
      updated_at = datetime('now')`,
    args: [
      standing.league_slug ?? "",
      standing.season ?? "",
      standing.position ?? null,
      standing.team_id ?? null,
      standing.team_name ?? null,
      standing.team_badge ?? null,
      standing.played ?? 0,
      standing.won ?? 0,
      standing.drawn ?? 0,
      standing.lost ?? 0,
      standing.goals_for ?? 0,
      standing.goals_against ?? 0,
      standing.goal_difference ?? 0,
      standing.points ?? 0,
      standing.form ?? null,
    ],
  });
}

export async function findStandingsByLeague(
  leagueSlug: string
): Promise<Standing[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT ls.*, t.slug as team_slug
          FROM league_standings ls
          LEFT JOIN teams t ON ls.team_id = t.id
          WHERE ls.league_slug = ?
          ORDER BY ls.position`,
    args: [leagueSlug],
  });
  return result.rows as unknown as Standing[];
}
