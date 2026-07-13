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
  team_badge_resolved: string | null;
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
    sql: `SELECT ls.*,
          COALESCE(t.slug, t2.slug) as team_slug,
          COALESCE(ls.team_badge, t.badge_url, t2.badge_url) as team_badge_resolved
          FROM league_standings ls
          LEFT JOIN teams t ON ls.team_id = t.id
          LEFT JOIN teams t2 ON t.id IS NULL AND (
            t2.name = ls.team_name
            OR t2.name = ls.team_name || ' FC'
            OR t2.name || ' FC' = ls.team_name
            OR t2.name = 'Manchester United FC' AND ls.team_name IN ('Man Utd', 'Manchester United')
            OR t2.name = 'Manchester City FC' AND ls.team_name IN ('Man City', 'Manchester City')
            OR t2.name = 'Tottenham Hotspur FC' AND ls.team_name IN ('Tottenham', 'Tottenham Hotspur')
            OR t2.name = 'Newcastle United FC' AND ls.team_name IN ('Newcastle', 'Newcastle Utd')
            OR t2.name = 'Nottingham Forest FC' AND ls.team_name IN ('Nottm Forest', 'Nottingham Forest')
            OR t2.name = 'Real Madrid CF' AND ls.team_name IN ('Real Madrid')
            OR t2.name = 'FC Barcelona' AND ls.team_name IN ('Barcelona')
            OR t2.name = 'FC Bayern München' AND ls.team_name IN ('Bayern Munich', 'Bayern München')
            OR t2.name = 'Borussia Dortmund' AND ls.team_name IN ('Dortmund', 'Borussia Dortmund')
            OR t2.name = 'Paris Saint-Germain FC' AND ls.team_name IN ('PSG', 'Paris Saint-Germain')
            OR t2.name = 'Inter Milan' AND ls.team_name IN ('Inter', 'Inter Milan')
            OR t2.name = 'AC Milan' AND ls.team_name IN ('Milan', 'AC Milan')
            OR t2.name = 'Juventus FC' AND ls.team_name IN ('Juventus')
            OR t2.name = 'Atlético de Madrid' AND ls.team_name IN ('Atlético Madrid', 'Atletico Madrid')
          )
          WHERE ls.league_slug = ?
          ORDER BY ls.position`,
    args: [leagueSlug],
  });
  return result.rows as unknown as Standing[];
}

export async function findStandingsByLeagueAndSeason(
  leagueSlug: string,
  season: string
): Promise<Standing[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT ls.*,
          COALESCE(t.slug, t2.slug) as team_slug,
          COALESCE(ls.team_badge, t.badge_url, t2.badge_url) as team_badge_resolved
          FROM league_standings ls
          LEFT JOIN teams t ON ls.team_id = t.id
          LEFT JOIN teams t2 ON t.id IS NULL AND (
            t2.name = ls.team_name
            OR t2.name = ls.team_name || ' FC'
            OR t2.name || ' FC' = ls.team_name
            OR t2.name = 'Manchester United FC' AND ls.team_name IN ('Man Utd', 'Manchester United')
            OR t2.name = 'Manchester City FC' AND ls.team_name IN ('Man City', 'Manchester City')
            OR t2.name = 'Tottenham Hotspur FC' AND ls.team_name IN ('Tottenham', 'Tottenham Hotspur', 'Spurs')
            OR t2.name = 'Newcastle United FC' AND ls.team_name IN ('Newcastle', 'Newcastle Utd')
            OR t2.name = 'Nottingham Forest FC' AND ls.team_name IN ('Nottm Forest', 'Nottingham Forest')
            OR t2.name = 'Wolverhampton Wanderers FC' AND ls.team_name IN ('Wolves', 'Wolverhampton')
            OR t2.name = 'Brighton & Hove Albion FC' AND ls.team_name IN ('Brighton')
            OR t2.name = 'West Ham United FC' AND ls.team_name IN ('West Ham')
            OR t2.name = 'Real Madrid CF' AND ls.team_name IN ('Real Madrid')
            OR t2.name = 'FC Barcelona' AND ls.team_name IN ('Barcelona')
            OR t2.name = 'FC Bayern München' AND ls.team_name IN ('Bayern Munich', 'Bayern München')
            OR t2.name = 'Borussia Dortmund' AND ls.team_name IN ('Dortmund')
            OR t2.name = 'Paris Saint-Germain FC' AND ls.team_name IN ('PSG', 'Paris Saint-Germain')
            OR t2.name = 'Inter Milan' AND ls.team_name IN ('Inter')
            OR t2.name = 'AC Milan' AND ls.team_name IN ('Milan')
            OR t2.name = 'Juventus FC' AND ls.team_name IN ('Juventus')
            OR t2.name = 'Atlético de Madrid' AND ls.team_name IN ('Atlético Madrid', 'Atletico Madrid')
          )
          WHERE ls.league_slug = ? AND ls.season = ? ORDER BY ls.position`,
    args: [leagueSlug, season],
  });
  return result.rows as unknown as Standing[];
}

export async function findSeasonsByLeague(leagueSlug: string): Promise<string[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT DISTINCT season FROM league_standings WHERE league_slug = ? ORDER BY season DESC`,
    args: [leagueSlug],
  });
  return result.rows.map((r) => r.season as string);
}
