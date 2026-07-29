import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { getTursoClient } from "../src/lib/turso/client";

const log = (msg: string) => console.log(`[migrate] ${msg}`);

async function run(client: ReturnType<typeof getTursoClient>, sql: string, label: string) {
  try {
    await client.execute(sql);
    log(`  OK: ${label}`);
  } catch (e: any) {
    if (e.message?.includes("already exists") || e.message?.includes("no such table")) {
      log(`  SKIP: ${label} (${e.message.split("\n")[0]})`);
    } else {
      log(`  FAIL: ${label} — ${e.message}`);
    }
  }
}

async function main() {
  const client = getTursoClient();
  log("Starting one-time migration...\n");

  // ── 1. Truncate domain data ────────────────────────────────
  log("1. Truncating domain tables...");
  const domainTables = [
    "match_lineups",
    "top_scorers", "league_standings", "videos",
    "player_honours", "player_former_teams",
    "matches", "players", "teams",
    "world_cup_matches", "world_cup_teams", "world_cups",
  ];
  for (const t of domainTables) {
    await run(client, `DELETE FROM ${t}`, `DELETE FROM ${t}`);
  }

  // ── 2. Drop domain tables without staging source ───────────
  log("\n2. Dropping domain tables without staging source...");
  const dropDomain = [
    "match_lineups", "transfers",
    "fbdo_scorers", "fbdo_team_detail", "fbdo_match_detail",
    "fbdo_persons", "fbdo_competitions", "fbdo_teams", "fbdo_areas",
  ];
  for (const t of dropDomain) {
    await run(client, `DROP TABLE IF EXISTS ${t}`, `DROP ${t}`);
  }

  // ── 3. Drop empty staging tables ───────────────────────────
  log("\n3. Dropping empty staging tables...");
  const dropStaging = [
    "sap_match_detail", "sap_match_incidents", "sap_match_lineups",
    "sap_match_player_stats", "sap_match_shotmap", "sap_match_statistics",
    "sap_matches", "sap_player_statistics", "sap_players", "sap_team_transfers",
    "bbd_match_detail", "bbd_match_events", "bbd_match_odds", "bbd_match_stats",
    "bbd_player_career", "bbd_player_stats", "bbd_player_transfers",
    "bbd_player_trophies", "bbd_predictions", "bbd_team_elo",
    "bbd_team_form", "bbd_team_stats", "bbd_teams",
    "tsdb_event_stats", "tsdb_lineups",
  ];
  for (const t of dropStaging) {
    await run(client, `DROP TABLE IF EXISTS ${t}`, `DROP ${t}`);
  }

  // ── 4. Drop old raw_* tables ───────────────────────────────
  log("\n4. Dropping old raw_* tables...");
  const dropRaw = [
    "raw_fd_standings", "raw_fd_matches", "raw_tsdb_teams", "raw_tsdb_players", "raw_wiki_pages",
  ];
  for (const t of dropRaw) {
    await run(client, `DROP TABLE IF EXISTS ${t}`, `DROP ${t}`);
  }

  // ── 5. Create new domain tables ────────────────────────────
  log("\n5. Creating new domain tables...");

  await run(client, `CREATE TABLE IF NOT EXISTS leagues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    country TEXT,
    badge_url TEXT,
    logo_url TEXT,
    description TEXT,
    formed_year TEXT,
    current_season TEXT,
    sportsapipro_id INTEGER,
    thesportsdb_id TEXT,
    bbd_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`, "CREATE leagues");

  await run(client, `CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thesportsdb_id TEXT UNIQUE,
    name TEXT NOT NULL,
    alternate_name TEXT,
    capacity INTEGER,
    cost TEXT,
    country TEXT,
    location TEXT,
    timezone TEXT,
    formed_year TEXT,
    description TEXT,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`, "CREATE venues");

  await run(client, `CREATE TABLE IF NOT EXISTS match_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER,
    thesportsdb_event_id TEXT,
    event_type TEXT,
    event_subtype TEXT,
    event_time TEXT,
    event_description TEXT,
    player_id INTEGER,
    player_name TEXT,
    team_id INTEGER,
    team_name TEXT,
    detail TEXT,
    assist_player TEXT,
    related_player_id INTEGER,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  )`, "CREATE match_events");

  // ── 6. Alter existing domain tables ────────────────────────
  log("\n6. Altering existing domain tables...");

  const addColumns: [string, string][] = [
    ["teams", "ALTER TABLE teams ADD COLUMN primary_color TEXT"],
    ["teams", "ALTER TABLE teams ADD COLUMN secondary_color TEXT"],
    ["teams", "ALTER TABLE teams ADD COLUMN capacity INTEGER"],
    ["teams", "ALTER TABLE teams ADD COLUMN venue_id INTEGER REFERENCES venues(id)"],
    ["teams", "ALTER TABLE teams ADD COLUMN bbd_id TEXT"],
    ["teams", "ALTER TABLE teams ADD COLUMN description TEXT"],
    ["teams", "ALTER TABLE teams ADD COLUMN website TEXT"],
    ["teams", "ALTER TABLE teams ADD COLUMN banner_url TEXT"],
    ["teams", "ALTER TABLE teams ADD COLUMN equipment_url TEXT"],

    ["players", "ALTER TABLE players ADD COLUMN jersey_number TEXT"],
    ["players", "ALTER TABLE players ADD COLUMN bbd_id TEXT"],
    ["players", "ALTER TABLE players ADD COLUMN short_name TEXT"],
    ["players", "ALTER TABLE players ADD COLUMN date_of_death TEXT"],
    ["players", "ALTER TABLE players ADD COLUMN birth_location TEXT"],
    ["players", "ALTER TABLE players ADD COLUMN status TEXT"],
    ["players", "ALTER TABLE players ADD COLUMN cutout_url TEXT"],
    ["players", "ALTER TABLE players ADD COLUMN wikidata_id TEXT"],
    ["players", "ALTER TABLE players ADD COLUMN transfermarkt_id TEXT"],

    ["matches", "ALTER TABLE matches ADD COLUMN league_id INTEGER REFERENCES leagues(id)"],
    ["matches", "ALTER TABLE matches ADD COLUMN round INTEGER"],
    ["matches", "ALTER TABLE matches ADD COLUMN spectators INTEGER"],
    ["matches", "ALTER TABLE matches ADD COLUMN weather TEXT"],
    ["matches", "ALTER TABLE matches ADD COLUMN home_team_badge TEXT"],
    ["matches", "ALTER TABLE matches ADD COLUMN away_team_badge TEXT"],
    ["matches", "ALTER TABLE matches ADD COLUMN venue_id INTEGER REFERENCES venues(id)"],
    ["matches", "ALTER TABLE matches ADD COLUMN poster_url TEXT"],
    ["matches", "ALTER TABLE matches ADD COLUMN thumb_url TEXT"],
    ["matches", "ALTER TABLE matches ADD COLUMN banner_url TEXT"],
    ["matches", "ALTER TABLE matches ADD COLUMN square_url TEXT"],
    ["matches", "ALTER TABLE matches ADD COLUMN video_url TEXT"],
    ["matches", "ALTER TABLE matches ADD COLUMN thesportsdb_id TEXT"],
    ["matches", "ALTER TABLE matches ADD COLUMN api_football_id TEXT"],

    ["league_standings", "ALTER TABLE league_standings ADD COLUMN league_id INTEGER REFERENCES leagues(id)"],

    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN league_id INTEGER REFERENCES leagues(id)"],
    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN minutes INTEGER"],
    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN matches INTEGER"],
    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN appearances INTEGER"],
    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN position TEXT"],
    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN jersey_number INTEGER"],
    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN nationality TEXT"],
    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN photo_url TEXT"],
    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN player_id INTEGER"],
    ["top_scorers", "ALTER TABLE top_scorers ADD COLUMN player_id INTEGER"],

    ["player_honours", "ALTER TABLE player_honours ADD COLUMN team_badge TEXT"],
    ["player_honours", "ALTER TABLE player_honours ADD COLUMN honour_logo TEXT"],
    ["player_honours", "ALTER TABLE player_honours ADD COLUMN honour_trophy TEXT"],
    ["player_honours", "ALTER TABLE player_honours ADD COLUMN thesportsdb_id TEXT"],
    ["player_honours", "ALTER TABLE player_honours ADD COLUMN source TEXT DEFAULT 'legacy'"],
    ["player_honours", "ALTER TABLE player_honours ADD COLUMN player_name TEXT"],
    ["player_honours", "ALTER TABLE player_honours ADD COLUMN year TEXT"],

    ["player_former_teams", "ALTER TABLE player_former_teams ADD COLUMN move_type TEXT"],
    ["player_former_teams", "ALTER TABLE player_former_teams ADD COLUMN team_badge TEXT"],
    ["player_former_teams", "ALTER TABLE player_former_teams ADD COLUMN thesportsdb_id TEXT"],
    ["player_former_teams", "ALTER TABLE player_former_teams ADD COLUMN source TEXT DEFAULT 'legacy'"],
    ["player_former_teams", "ALTER TABLE player_former_teams ADD COLUMN player_name TEXT"],
    ["player_former_teams", "ALTER TABLE player_former_teams ADD COLUMN left_team TEXT"],

    ["videos", "ALTER TABLE videos ADD COLUMN view_count INTEGER"],
    ["videos", "ALTER TABLE videos ADD COLUMN like_count INTEGER"],
    ["videos", "ALTER TABLE videos ADD COLUMN channel_id TEXT"],
    ["videos", "ALTER TABLE videos ADD COLUMN team_name TEXT"],
    ["videos", "ALTER TABLE videos ADD COLUMN tags TEXT"],
    ["videos", "ALTER TABLE videos ADD COLUMN category TEXT"],
    ["videos", "ALTER TABLE videos ADD COLUMN description TEXT"],
    ["videos", "ALTER TABLE videos ADD COLUMN fetched_at TEXT"],
    ["videos", "ALTER TABLE videos ADD COLUMN updated_at TEXT"],
  ];

  for (const [table, sql] of addColumns) {
    await run(client, sql, `ALTER ${table}`);
  }

  // ── 7. Remove old indices ───────────────────────────────────
  log("\n7. Removing old indices...");
  const dropIndices = [
    `DROP INDEX IF EXISTS idx_transfers_league`,
    `DROP INDEX IF EXISTS idx_transfers_source`,
    `DROP INDEX IF EXISTS idx_transfers_unique`,
    `DROP INDEX IF EXISTS idx_fbdo_areas_fd_id`,
    `DROP INDEX IF EXISTS idx_fbdo_competitions_fd_id`,
    `DROP INDEX IF EXISTS idx_fbdo_teams_fd_id`,
    `DROP INDEX IF EXISTS idx_fbdo_teams_comp`,
    `DROP INDEX IF EXISTS idx_fbdo_scorers_fd_id`,
    `DROP INDEX IF EXISTS idx_fbdo_scorers_comp`,
    `DROP INDEX IF EXISTS idx_fbdo_team_detail_fd_id`,
    `DROP INDEX IF EXISTS idx_fbdo_match_detail_fd_id`,
    `DROP INDEX IF EXISTS idx_fbdo_match_detail_comp`,
    `DROP INDEX IF EXISTS idx_fbdo_persons_fd_id`,
    `DROP INDEX IF EXISTS idx_raw_fd_standings_comp`,
    `DROP INDEX IF EXISTS idx_raw_fd_matches_comp`,
    `DROP INDEX IF EXISTS idx_raw_tsdb_teams_name`,
    `DROP INDEX IF EXISTS idx_raw_tsdb_players_team`,
    `DROP INDEX IF EXISTS idx_players_slug_team`,
    `DROP INDEX IF EXISTS idx_matches_natural`,
    `DROP INDEX IF EXISTS idx_videos_source`,
    `DROP INDEX IF EXISTS idx_yt_videos_id`,
  ];
  for (const sql of dropIndices) {
    await run(client, sql, sql.match(/idx_\w+/)?.[0] || "drop index");
  }

  // ── 8. Create deduplication indices ────────────────────────
  log("\n8. Creating deduplication indices...");

  const indices = [
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_leagues_slug ON leagues(slug)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_venues_tsdb_id ON venues(thesportsdb_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_ext_id ON teams(external_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_players_ext_id ON players(external_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_natural ON matches(home_team_name, away_team_name, match_date, season)`,
    `CREATE INDEX IF NOT EXISTS idx_match_events_natural ON match_events(match_id, event_type, event_time, player_name)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_standings_natural ON league_standings(league_slug, season, team_id, source)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_scorers_natural ON top_scorers(player_name, league_slug, season)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_honours_natural ON player_honours(player_name, honour_name, year, source)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_former_teams_natural ON player_former_teams(player_name, team_name, source)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_source_ext ON videos(source, external_id)`,
    `CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id)`,
    `CREATE INDEX IF NOT EXISTS idx_leagues_sap_id ON leagues(sportsapipro_id)`,
    `CREATE INDEX IF NOT EXISTS idx_leagues_tsdb_id ON leagues(thesportsdb_id)`,
    `CREATE INDEX IF NOT EXISTS idx_teams_sap_id ON teams(sportsapipro_id)`,
    `CREATE INDEX IF NOT EXISTS idx_teams_tsdb_id ON teams(thesportsdb_id)`,
    `CREATE INDEX IF NOT EXISTS idx_players_tsdb_id ON players(thesportsdb_id)`,
    `CREATE INDEX IF NOT EXISTS idx_matches_tsdb_id ON matches(thesportsdb_id)`,
  ];

  for (const sql of indices) {
    await run(client, sql, sql.match(/idx_\w+/)?.[0] || "index");
  }

  log("\nMigration complete.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
