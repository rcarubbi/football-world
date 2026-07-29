import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
config({ path: resolve(__dirname, "../../.env.local") });

import { searchVideos } from "../../src/lib/api/youtube";
import { getTursoClient } from "../../src/lib/turso/client";

async function ensureTable(client: ReturnType<typeof getTursoClient>) {
  await client.execute(`CREATE TABLE IF NOT EXISTS yt_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    query TEXT NOT NULL,
    published_at TEXT,
    raw_json TEXT NOT NULL,
    fetched_at TEXT DEFAULT (datetime('now'))
  )`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_yt_videos_entity ON yt_videos(entity_type, entity_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_yt_videos_published ON yt_videos(published_at)`);
}

interface ImportResult {
  teamId: string;
  teamName: string;
  videosFound: number;
  videosStored: number;
  error?: string;
}

function parseArgs(): { teamFilter?: string; maxResults?: number; league?: string; date?: string } {
  const args = process.argv.slice(2);
  const opts: { teamFilter?: string; maxResults?: number; league?: string; date?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--team" && args[i + 1]) opts.teamFilter = args[++i];
    if (args[i] === "--max-results" && args[i + 1]) opts.maxResults = parseInt(args[++i], 10);
    if (args[i] === "--league" && args[i + 1]) opts.league = args[++i];
    if (args[i] === "--date" && args[i + 1]) opts.date = args[++i];
  }
  return opts;
}

async function getTeams(client: ReturnType<typeof getTursoClient>, league?: string): Promise<{ id: string; name: string }[]> {
  let sql = "SELECT sap_id as id, raw_json FROM sap_teams";
  const args: string[] = [];

  if (league) {
    sql += " WHERE raw_json LIKE ?";
    args.push(`%"category":{%,"name":"%${league}%`);
  }

  sql += " ORDER BY sap_id";
  const result = await client.execute({ sql, args });

  return result.rows.map((row) => {
    const raw = JSON.parse(row.raw_json as string);
    return { id: row.id as string, name: raw.name || raw.team?.name || `Team ${row.id}` };
  });
}

async function teamHasVideos(client: ReturnType<typeof getTursoClient>, teamId: string): Promise<boolean> {
  const result = await client.execute({
    sql: "SELECT COUNT(*) as cnt FROM yt_videos WHERE entity_type = 'team' AND entity_id = ?",
    args: [teamId],
  });
  return (result.rows[0]?.cnt as number) > 0;
}

async function importVideosForTeam(
  client: ReturnType<typeof getTursoClient>,
  teamId: string,
  teamName: string,
  maxResults: number,
  publishedAfter?: string
): Promise<ImportResult> {
  const result: ImportResult = { teamId, teamName, videosFound: 0, videosStored: 0 };

  try {
    const query = `${teamName} football highlights`;
    const videos = await searchVideos(query, maxResults, publishedAfter);
    result.videosFound = videos.length;

    for (const video of videos) {
      try {
        await client.execute({
          sql: `INSERT OR IGNORE INTO yt_videos (video_id, entity_type, entity_id, query, published_at, raw_json)
                VALUES (?, 'team', ?, ?, ?, ?)`,
          args: [video.videoId, teamId, query, video.publishedAt, JSON.stringify(video)],
        });
        result.videosStored++;
      } catch (e: any) {
        console.error(`    Failed to store video ${video.videoId}: ${e.message}`);
      }
    }
  } catch (e: any) {
    result.error = e.message;
  }

  return result;
}

async function main() {
  const { teamFilter, maxResults = 10, league, date } = parseArgs();
  const client = getTursoClient();
  await ensureTable(client);

  const publishedAfter = date ? new Date(date).toISOString() : undefined;

  console.log("YouTube Video Importer");
  console.log(`Max results per team: ${maxResults}`);
  if (teamFilter) console.log(`Team filter: ${teamFilter}`);
  if (league) console.log(`League filter: ${league}`);
  if (publishedAfter) console.log(`Published after: ${publishedAfter}`);
  console.log("");

  const teams = await getTeams(client, league);
  console.log(`Found ${teams.length} teams in database`);

  if (teamFilter) {
    const filtered = teams.filter((t) => t.name.toLowerCase().includes(teamFilter.toLowerCase()));
    if (filtered.length === 0) {
      console.error(`No teams matching "${teamFilter}"`);
      process.exit(1);
    }
    const results: ImportResult[] = [];
    for (const team of filtered) {
      console.log(`\nImporting videos for ${team.name} (${team.id})...`);
      const r = await importVideosForTeam(client, team.id, team.name, maxResults, publishedAfter);
      results.push(r);
      console.log(`  Found: ${r.videosFound}, Stored: ${r.videosStored}${r.error ? ` Error: ${r.error}` : ""}`);
    }
    printSummary(results);
    return;
  }

  const results: ImportResult[] = [];
  let skipped = 0;

  for (const team of teams) {
    const hasVideos = await teamHasVideos(client, team.id);
    if (hasVideos) {
      skipped++;
      continue;
    }

    console.log(`Importing videos for ${team.name} (${team.id})...`);
    const r = await importVideosForTeam(client, team.id, team.name, maxResults, publishedAfter);
    results.push(r);
    console.log(`  Found: ${r.videosFound}, Stored: ${r.videosStored}${r.error ? ` Error: ${r.error}` : ""}`);
  }

  if (skipped > 0) console.log(`\nSkipped ${skipped} teams (already have videos)`);
  printSummary(results);
}

function printSummary(results: ImportResult[]) {
  const total = results.reduce((a, r) => a + r.videosFound, 0);
  const stored = results.reduce((a, r) => a + r.videosStored, 0);
  const errors = results.filter((r) => r.error).length;
  console.log(`\nDone: ${results.length} teams, ${total} videos found, ${stored} stored, ${errors} errors`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
