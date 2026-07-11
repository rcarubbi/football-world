import { getTursoClient } from "../turso/client";

export interface Lineup {
  id: number;
  match_id: number;
  team_id: number | null;
  team_name: string | null;
  player_name: string | null;
  player_number: number | null;
  position: string | null;
  starter: number;
}

export async function upsertLineup(lineup: Partial<Lineup>): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO match_lineups (
      match_id, team_id, team_name, player_name, player_number, position, starter
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      lineup.match_id ?? 0,
      lineup.team_id ?? null,
      lineup.team_name ?? null,
      lineup.player_name ?? null,
      lineup.player_number ?? null,
      lineup.position ?? null,
      lineup.starter ?? 1,
    ],
  });
}

export async function findLineupsByMatch(matchId: number): Promise<Lineup[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM match_lineups WHERE match_id = ? ORDER BY team_name, position",
    args: [matchId],
  });
  return result.rows as unknown as Lineup[];
}

export async function findRecentByTeam(teamId: number, limit = 5): Promise<Lineup[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT ml.* FROM match_lineups ml
          JOIN matches m ON ml.match_id = m.id
          WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'FINISHED'
          ORDER BY m.match_date DESC, ml.match_id, ml.team_name, ml.position
          LIMIT ?`,
    args: [teamId, teamId, limit * 22],
  });
  return result.rows as unknown as Lineup[];
}
