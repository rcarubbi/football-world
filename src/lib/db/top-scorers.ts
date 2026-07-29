import { getTursoClient } from "../turso/client";

export interface TopScorer {
  id: number;
  league_slug: string;
  season: string | null;
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
      league_slug, season, player_name, player_slug,
      team_name, team_badge, goals, assists, penalties
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(league_slug, season, player_name) DO UPDATE SET
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

export async function findTopScorersByLeagueAndSeason(
  leagueSlug: string,
  season: string
): Promise<Array<TopScorer & { photo_url: string | null; player_slug_resolved: string | null; team_slug: string | null }>> {
  const client = getTursoClient();

  // First, get top scorers (deduplicated via subquery)
  // Team JOIN uses COALESCE to prefer exact name match over FC/CF suffix match
  const scorerResult = await client.execute({
    sql: `SELECT ts.id,
            ts.player_name, ts.player_slug, ts.team_name, ts.team_badge, ts.league_slug, ts.season,
            ts.goals, ts.assists, ts.penalties,
            COALESCE(
              (SELECT p.photo_url FROM players p WHERE p.slug = ts.player_slug AND p.photo_url IS NOT NULL AND p.photo_url != '' LIMIT 1),
              ts.photo_url
            ) as photo_url,
            (SELECT p.slug FROM players p WHERE p.slug = ts.player_slug LIMIT 1) as player_slug_resolved,
            COALESCE(
              (SELECT t.slug FROM teams t WHERE t.name = ts.team_name LIMIT 1),
              (SELECT t.slug FROM teams t WHERE REPLACE(t.name, ' FC', '') = REPLACE(ts.team_name, ' FC', '') LIMIT 1),
              (SELECT t.slug FROM teams t WHERE REPLACE(t.name, ' CF', '') = REPLACE(ts.team_name, ' CF', '') LIMIT 1)
            ) as team_slug
          FROM top_scorers ts
          WHERE ts.league_slug = ? AND ts.season = ? AND ts.goals > 0
          ORDER BY ts.goals DESC LIMIT 10`,
    args: [leagueSlug, season],
  });

  return scorerResult.rows as unknown as Array<TopScorer & { photo_url: string | null; player_slug_resolved: string | null; team_slug: string | null }>;
}
