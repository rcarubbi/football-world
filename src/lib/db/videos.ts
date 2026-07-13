import { getTursoClient } from "../turso/client";

export interface Video {
  id: number;
  video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  channel_name: string | null;
  duration: number | null;
  entity_type: string | null;
  entity_id: number | null;
  league_slug: string | null;
  season: string | null;
  published_at: string | null;
}

export async function upsertVideo(video: Partial<Video>): Promise<void> {
  const client = getTursoClient();
  await client.execute({
    sql: `INSERT INTO videos (
      video_id, title, thumbnail_url, channel_name, duration,
      entity_type, entity_id, league_slug, season, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(video_id) DO UPDATE SET
      title = excluded.title,
      thumbnail_url = excluded.thumbnail_url,
      channel_name = excluded.channel_name,
      duration = excluded.duration,
      entity_type = excluded.entity_type,
      entity_id = excluded.entity_id,
      league_slug = excluded.league_slug,
      season = excluded.season,
      published_at = excluded.published_at`,
    args: [
      video.video_id ?? "",
      video.title ?? null,
      video.thumbnail_url ?? null,
      video.channel_name ?? null,
      video.duration ?? null,
      video.entity_type ?? null,
      video.entity_id ?? null,
      video.league_slug ?? null,
      video.season ?? null,
      video.published_at ?? null,
    ],
  });
}

export async function findVideosByTeam(teamId: number): Promise<Video[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM videos WHERE entity_type = 'team' AND entity_id = ? ORDER BY published_at DESC LIMIT 5",
    args: [teamId],
  });
  return result.rows as unknown as Video[];
}

export async function findVideosByLeague(
  leagueSlug: string
): Promise<Video[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM videos WHERE league_slug = ? ORDER BY published_at DESC LIMIT 10",
    args: [leagueSlug],
  });
  return result.rows as unknown as Video[];
}

export async function findRecentVideos(limit = 20): Promise<Video[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM videos ORDER BY published_at DESC LIMIT ?",
    args: [limit],
  });
  return result.rows as unknown as Video[];
}

export async function countVideos(): Promise<number> {
  const client = getTursoClient();
  const result = await client.execute("SELECT COUNT(*) as n FROM videos");
  return Number(result.rows[0]?.n ?? 0);
}
