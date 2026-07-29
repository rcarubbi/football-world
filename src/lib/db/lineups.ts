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

export async function findRecentByTeam(teamId: number, limit = 5): Promise<Lineup[]> {
  const client = getTursoClient();
  try {
    const result = await client.execute({
      sql: `SELECT ml.* FROM match_lineups ml
            JOIN matches m ON ml.match_id = m.id
            WHERE (m.home_team_id = ? OR m.away_team_id = ?) AND m.status = 'FINISHED'
            ORDER BY m.match_date DESC, ml.match_id, ml.team_name, ml.position
            LIMIT ?`,
      args: [teamId, teamId, limit * 22],
    });
    return result.rows as unknown as Lineup[];
  } catch {
    return [];
  }
}
