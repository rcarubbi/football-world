import { getTursoClient } from "../turso/client";

export interface Player {
  id: number;
  thesportsdb_id: string | null;
  apifootball_id: string | null;
  name: string;
  slug: string;
  team_id: number | null;
  position: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  height: string | null;
  weight: string | null;
  photo_url: string | null;
  description: string | null;
}

export async function upsertPlayer(player: Partial<Player>): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `INSERT INTO players (
      thesportsdb_id, apifootball_id, name, slug, team_id, position,
      nationality, date_of_birth, height, weight, photo_url, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      thesportsdb_id = excluded.thesportsdb_id,
      apifootball_id = excluded.apifootball_id,
      name = excluded.name,
      team_id = excluded.team_id,
      position = excluded.position,
      nationality = excluded.nationality,
      date_of_birth = excluded.date_of_birth,
      height = excluded.height,
      weight = excluded.weight,
      photo_url = COALESCE(excluded.photo_url, players.photo_url),
      description = COALESCE(excluded.description, players.description),
      updated_at = datetime('now')
    RETURNING id`,
    args: [
      player.thesportsdb_id ?? null,
      player.apifootball_id ?? null,
      player.name ?? "",
      player.slug ?? "",
      player.team_id ?? null,
      player.position ?? null,
      player.nationality ?? null,
      player.date_of_birth ?? null,
      player.height ?? null,
      player.weight ?? null,
      player.photo_url ?? null,
      player.description ?? null,
    ],
  });
  return Number(result.rows[0]?.id);
}

export async function findPlayerBySlug(slug: string): Promise<Player | null> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM players WHERE slug = ?",
    args: [slug],
  });
  return (result.rows[0] as unknown as Player) ?? null;
}

export async function findPlayersByTeam(teamId: number): Promise<Player[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM players WHERE team_id = ? ORDER BY name",
    args: [teamId],
  });
  return result.rows as unknown as Player[];
}

export async function findAllPlayers(): Promise<Player[]> {
  const client = getTursoClient();
  const result = await client.execute("SELECT * FROM players ORDER BY name");
  return result.rows as unknown as Player[];
}

export async function addPlayerHonour(
  playerId: number,
  honourName: string,
  season: string | null,
  teamName: string | null
): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO player_honours (player_id, honour_name, season, team_name) VALUES (?, ?, ?, ?)`,
    args: [playerId, honourName, season, teamName],
  });
}

export async function addPlayerFormerTeam(
  playerId: number,
  teamName: string,
  joined: string | null,
  departed: string | null
): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO player_former_teams (player_id, team_name, joined, departed) VALUES (?, ?, ?, ?)`,
    args: [playerId, teamName, joined, departed],
  });
}

export async function findPlayerHonours(playerId: number) {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM player_honours WHERE player_id = ?",
    args: [playerId],
  });
  return result.rows;
}

export async function findPlayerFormerTeams(playerId: number) {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM player_former_teams WHERE player_id = ?",
    args: [playerId],
  });
  return result.rows;
}
