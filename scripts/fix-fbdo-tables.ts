import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });
import { getTursoClient } from "../src/lib/turso/client";

async function fix() {
  const client = getTursoClient();
  const tables = ["fbdo_areas","fbdo_competitions","fbdo_teams","fbdo_scorers","fbdo_team_detail","fbdo_persons","fbdo_match_detail"];
  for (const t of tables) {
    try { await client.execute("DROP TABLE IF EXISTS " + t); } catch {}
  }
  console.log("Dropped old fbdo_* tables");
  await client.execute("CREATE TABLE IF NOT EXISTS fbdo_areas (id INTEGER PRIMARY KEY AUTOINCREMENT, fd_id INTEGER NOT NULL UNIQUE, name TEXT, code TEXT, flag_url TEXT, parent_area_id INTEGER, raw_json TEXT NOT NULL, fetched_at TEXT DEFAULT (datetime('now')))");
  await client.execute("CREATE TABLE IF NOT EXISTS fbdo_competitions (id INTEGER PRIMARY KEY AUTOINCREMENT, fd_id INTEGER NOT NULL UNIQUE, area_id INTEGER, name TEXT, code TEXT, type TEXT, emblem_url TEXT, plan TEXT, current_season INTEGER, raw_json TEXT NOT NULL, fetched_at TEXT DEFAULT (datetime('now')))");
  await client.execute("CREATE TABLE IF NOT EXISTS fbdo_teams (id INTEGER PRIMARY KEY AUTOINCREMENT, fd_id INTEGER NOT NULL, competition_code TEXT NOT NULL, name TEXT, short_name TEXT, tla TEXT, crest_url TEXT, address TEXT, founded INTEGER, club_colors TEXT, venue TEXT, coach_name TEXT, raw_json TEXT NOT NULL, fetched_at TEXT DEFAULT (datetime('now')))");
  await client.execute("CREATE TABLE IF NOT EXISTS fbdo_scorers (id INTEGER PRIMARY KEY AUTOINCREMENT, fd_id INTEGER NOT NULL, competition_code TEXT NOT NULL, season TEXT, player_name TEXT, player_id INTEGER, team_name TEXT, goals INTEGER, assists INTEGER, penalties INTEGER, raw_json TEXT NOT NULL, fetched_at TEXT DEFAULT (datetime('now')))");
  await client.execute("CREATE TABLE IF NOT EXISTS fbdo_team_detail (id INTEGER PRIMARY KEY AUTOINCREMENT, fd_id INTEGER NOT NULL UNIQUE, name TEXT, crest_url TEXT, venue TEXT, club_colors TEXT, founded INTEGER, coach_name TEXT, address TEXT, website TEXT, squad_json TEXT, raw_json TEXT NOT NULL, fetched_at TEXT DEFAULT (datetime('now')))");
  await client.execute("CREATE TABLE IF NOT EXISTS fbdo_persons (id INTEGER PRIMARY KEY AUTOINCREMENT, fd_id INTEGER NOT NULL UNIQUE, name TEXT, first_name TEXT, last_name TEXT, date_of_birth TEXT, nationality TEXT, position TEXT, shirt_number INTEGER, current_team_id INTEGER, raw_json TEXT NOT NULL, fetched_at TEXT DEFAULT (datetime('now')))");
  await client.execute("CREATE TABLE IF NOT EXISTS fbdo_match_detail (id INTEGER PRIMARY KEY AUTOINCREMENT, fd_id INTEGER NOT NULL, competition_code TEXT NOT NULL, season TEXT, matchday INTEGER, status TEXT, home_team_name TEXT, away_team_name TEXT, home_score INTEGER, away_score INTEGER, match_date TEXT, match_time TEXT, venue TEXT, attendance INTEGER, lineups_json TEXT, raw_json TEXT NOT NULL, fetched_at TEXT DEFAULT (datetime('now')))");
  console.log("Recreated fbdo_* tables with correct columns");
}
fix().catch(console.error);
