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
  career_summary: string | null;
}

export async function upsertPlayer(player: Partial<Player>): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `INSERT INTO players (
      thesportsdb_id, apifootball_id, name, slug, team_id, position,
      nationality, date_of_birth, height, weight, photo_url, description, career_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      career_summary = COALESCE(excluded.career_summary, players.career_summary),
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
      player.career_summary ?? null,
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

export async function countPlayers(): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute("SELECT COUNT(*) as n FROM players");
  return Number(result.rows[0]?.n ?? 0);
}

export async function countPlayersWithFilters(
  filters: { query?: string; position?: string }
): Promise<number> {
  const client = getTursoClient();
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (filters.query) {
    conditions.push(`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(p.name),'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),'ñ','n') LIKE ?`);
    args.push(`%${filters.query.toLowerCase()}%`);
  }
  if (filters.position) {
    conditions.push("LOWER(p.position) = ?");
    args.push(filters.position.toLowerCase());
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const result = await client.execute({
    sql: `SELECT COUNT(*) as n FROM players p ${where}`,
    args,
  });
  return Number(result.rows[0]?.n ?? 0);
}

export async function findPlayersFiltered(
  filters: { query?: string; position?: string },
  limit = 30
): Promise<Array<Player & { team_name: string | null; team_badge: string | null }>> {
  const client = getTursoClient();
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (filters.query) {
    conditions.push(`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(p.name),'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),'ñ','n') LIKE ?`);
    args.push(`%${filters.query.toLowerCase()}%`);
  }
  if (filters.position) {
    conditions.push("LOWER(p.position) = ?");
    args.push(filters.position.toLowerCase());
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const result = await client.execute({
    sql: `
      SELECT p.id, p.name, p.slug, p.photo_url, p.position, p.nationality,
             t.name as team_name, t.badge_url as team_badge
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      ${where}
      ORDER BY p.name
      LIMIT ?
    `,
    args: [...args, limit],
  });
  return result.rows as unknown as Array<Player & { team_name: string | null; team_badge: string | null }>;
}

export async function findPlayersWithoutPhotosWithTeam(limit = 50): Promise<Array<{ id: number; name: string; thesportsdb_id: string | null; team_tsdb_id: string | null }>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT p.id, p.name, p.thesportsdb_id, t.thesportsdb_id AS team_tsdb_id
          FROM players p
          JOIN teams t ON p.team_id = t.id
          WHERE (p.photo_url IS NULL OR p.photo_url = '')
            AND t.thesportsdb_id IS NOT NULL
          LIMIT ?`,
    args: [limit],
  });
  return result.rows as unknown as Array<{ id: number; name: string; thesportsdb_id: string | null; team_tsdb_id: string | null }>;
}

export async function findPlayersWithoutPhotosNoTeam(limit = 20): Promise<Array<{ id: number; name: string; thesportsdb_id: string | null }>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT p.id, p.name, p.thesportsdb_id
          FROM players p
          WHERE (p.photo_url IS NULL OR p.photo_url = '')
            AND p.thesportsdb_id IS NULL
          LIMIT ?`,
    args: [limit],
  });
  return result.rows as unknown as Array<{ id: number; name: string; thesportsdb_id: string | null }>;
}

export async function updatePlayerPhoto(
  playerId: number,
  data: { photo_url?: string | null; thesportsdb_id?: string | null; description?: string | null }
): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `UPDATE players SET
      photo_url = COALESCE(NULLIF(photo_url, ''), ?),
      thesportsdb_id = COALESCE(NULLIF(thesportsdb_id, ''), ?),
      description = COALESCE(NULLIF(description, ''), ?),
      updated_at = datetime('now')
    WHERE id = ?`,
    args: [data.photo_url ?? null, data.thesportsdb_id ?? null, data.description ?? null, playerId],
  });
}

export async function upsertPlayerFromApiFootball(data: {
  apifootball_id: string;
  name: string;
  slug: string;
  team_id: number;
  position: string | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
  photo_url: string | null;
}): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO players (
      apifootball_id, name, slug, team_id, position,
      nationality, height, weight, photo_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      apifootball_id = COALESCE(excluded.apifootball_id, players.apifootball_id),
      team_id = COALESCE(excluded.team_id, players.team_id),
      position = COALESCE(excluded.position, players.position),
      nationality = COALESCE(excluded.nationality, players.nationality),
      height = COALESCE(excluded.height, players.height),
      weight = COALESCE(excluded.weight, players.weight),
      photo_url = COALESCE(excluded.photo_url, players.photo_url),
      updated_at = datetime('now')`,
    args: [
      data.apifootball_id,
      data.name,
      data.slug,
      data.team_id,
      data.position,
      data.nationality,
      data.height,
      data.weight,
      data.photo_url,
    ],
  });
}

export async function upsertPlayerFromSportsDB(data: {
  thesportsdb_id: string;
  name: string;
  slug: string;
  team_id: number;
  position: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  height: string | null;
  weight: string | null;
  photo_url: string | null;
  description: string | null;
}): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO players (
      thesportsdb_id, name, slug, team_id, position,
      nationality, date_of_birth, height, weight, photo_url, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      thesportsdb_id = COALESCE(excluded.thesportsdb_id, players.thesportsdb_id),
      position = COALESCE(excluded.position, players.position),
      nationality = COALESCE(excluded.nationality, players.nationality),
      date_of_birth = COALESCE(excluded.date_of_birth, players.date_of_birth),
      height = COALESCE(excluded.height, players.height),
      weight = COALESCE(excluded.weight, players.weight),
      photo_url = COALESCE(excluded.photo_url, players.photo_url),
      description = COALESCE(excluded.description, players.description),
      updated_at = datetime('now')`,
    args: [
      data.thesportsdb_id,
      data.name,
      data.slug,
      data.team_id,
      data.position,
      data.nationality,
      data.date_of_birth,
      data.height,
      data.weight,
      data.photo_url,
      data.description,
    ],
  });
}

export async function searchPlayersByName(pattern: string): Promise<Array<Player & { team_name: string | null; team_slug: string | null; team_badge: string | null }>> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT p.name, p.slug, p.photo_url, p.position, t.name as team_name, t.slug as team_slug, t.badge_url as team_badge
            FROM players p LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.name LIKE ? ORDER BY p.name LIMIT 10`,
    args: [pattern],
  });
  return result.rows as unknown as Array<Player & { team_name: string | null; team_slug: string | null; team_badge: string | null }>;
}
