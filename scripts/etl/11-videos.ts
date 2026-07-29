import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";

const log = (msg: string) => console.log(`[videos] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  const ytRes = await client.execute("SELECT video_id, entity_type, entity_id, query, published_at, raw_json, fetched_at FROM yt_videos");

  // YouTube already stored the videos; just populate the domain `videos` table
  let inserted = 0;
  for (const row of ytRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const snippet = raw.snippet || {};
    const stats = raw.statistics || {};

    // Support both YouTube API format (snippet.title) and custom format (raw.title)
    const title = snippet.title || raw.title || null;
    const description = snippet.description || raw.description || null;
    const channelName = snippet.channelTitle || raw.channelName || null;
    const channelId = snippet.channelId || null;
    const publishedAt = row.published_at || snippet.publishedAt || raw.publishedAt || null;
    const thumbnailUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || raw.thumbnailUrl || null;
    const duration = raw.contentDetails?.duration || raw.duration || null;
    const viewCount = toInt(stats.viewCount) || toInt(raw.viewCount);
    const likeCount = toInt(stats.likeCount) || toInt(raw.likeCount);
    const categoryId = snippet.categoryId || null;
    const tags = snippet.tags ? JSON.stringify(snippet.tags) : null;

    await client.execute({
      sql: `INSERT INTO videos (source, external_id, video_id, entity_type, entity_id, title, description, channel_name, channel_id, published_at, thumbnail_url, duration, view_count, like_count, category, league_slug, team_name, tags, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(video_id) DO UPDATE SET
              title=excluded.title, description=excluded.description,
              thumbnail_url=COALESCE(excluded.thumbnail_url, videos.thumbnail_url),
              channel_name=COALESCE(excluded.channel_name, videos.channel_name),
              published_at=COALESCE(excluded.published_at, videos.published_at),
              view_count=excluded.view_count, like_count=excluded.like_count,
              duration=excluded.duration, updated_at=datetime('now')`,
      args: [
        "youtube", row.video_id, row.video_id, row.entity_type || null, row.entity_id || null,
        title, description,
        channelName, channelId,
        publishedAt, thumbnailUrl,
        duration, viewCount, likeCount,
        categoryId, null, row.query || null,
        tags, row.fetched_at,
      ],
    });
    inserted++;
  }

  log(`Done: ${inserted} videos upserted`);
  return inserted;
}

function toInt(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}
