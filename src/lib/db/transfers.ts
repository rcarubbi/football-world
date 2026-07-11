import { getTursoClient } from "../turso/client";

export interface Transfer {
  id: number;
  league_slug: string;
  season: string | null;
  player_name: string | null;
  player_slug: string | null;
  from_team: string | null;
  to_team: string | null;
  transfer_type: string | null;
  transfer_date: string | null;
  transfer_fee: string | null;
}

export async function upsertTransfer(transfer: Partial<Transfer>): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO transfers (
      league_slug, season, player_name, player_slug, from_team, to_team,
      transfer_type, transfer_date, transfer_fee
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(league_slug, season, player_name) DO UPDATE SET
      player_slug = excluded.player_slug,
      from_team = excluded.from_team,
      to_team = excluded.to_team,
      transfer_type = excluded.transfer_type,
      transfer_date = excluded.transfer_date,
      transfer_fee = excluded.transfer_fee`,
    args: [
      transfer.league_slug ?? "",
      transfer.season ?? null,
      transfer.player_name ?? null,
      transfer.player_slug ?? null,
      transfer.from_team ?? null,
      transfer.to_team ?? null,
      transfer.transfer_type ?? null,
      transfer.transfer_date ?? null,
      transfer.transfer_fee ?? null,
    ],
  });
}

export async function findRecentTransfers(limit = 20): Promise<Transfer[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM transfers ORDER BY transfer_date DESC LIMIT ?",
    args: [limit],
  });
  return result.rows as unknown as Transfer[];
}

export async function findRecentByTeam(teamName: string, limit = 10): Promise<Transfer[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT * FROM transfers 
          WHERE from_team = ? OR to_team = ? 
          ORDER BY transfer_date DESC LIMIT ?`,
    args: [teamName, teamName, limit],
  });
  return result.rows as unknown as Transfer[];
}

export async function findRecentByLeague(leagueSlug: string, limit = 20): Promise<Transfer[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM transfers WHERE league_slug = ? ORDER BY transfer_date DESC LIMIT ?",
    args: [leagueSlug, limit],
  });
  return result.rows as unknown as Transfer[];
}

export async function findBySeason(leagueSlug: string, season: string): Promise<Transfer[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM transfers WHERE league_slug = ? AND season = ? ORDER BY transfer_date DESC",
    args: [leagueSlug, season],
  });
  return result.rows as unknown as Transfer[];
}
