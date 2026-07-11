import { getTursoClient } from "../turso/client";

export interface TopScorer {
  id: number;
  league_slug: string;
  season: string | null;
  apifootball_id: string | null;
  player_name: string | null;
  player_slug: string | null;
  team_name: string | null;
  team_badge: string | null;
  goals: number;
  assists: number;
  penalties: number;
}

export async function upsertTopScorer(
  scorer: Partial<TopScorer>
): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO top_scorers (
      league_slug, season, apifootball_id, player_name, player_slug,
      team_name, team_badge, goals, assists, penalties
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(league_slug, season, player_name) DO UPDATE SET
      apifootball_id = excluded.apifootball_id,
      player_slug = excluded.player_slug,
      team_name = excluded.team_name,
      team_badge = excluded.team_badge,
      goals = excluded.goals,
      assists = excluded.assists,
      penalties = excluded.penalties,
      updated_at = datetime('now')`,
    args: [
      scorer.league_slug ?? "",
      scorer.season ?? null,
      scorer.apifootball_id ?? null,
      scorer.player_name ?? null,
      scorer.player_slug ?? null,
      scorer.team_name ?? null,
      scorer.team_badge ?? null,
      scorer.goals ?? 0,
      scorer.assists ?? 0,
      scorer.penalties ?? 0,
    ],
  });
}

export async function findTopScorersByLeague(
  leagueSlug: string
): Promise<TopScorer[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM top_scorers WHERE league_slug = ? ORDER BY goals DESC LIMIT 10",
    args: [leagueSlug],
  });
  return result.rows as unknown as TopScorer[];
}
