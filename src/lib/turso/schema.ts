export const SCHEMA = `
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thesportsdb_id TEXT,
  football_data_id TEXT,
  apifootball_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_name TEXT,
  badge_url TEXT,
  kit_home_url TEXT,
  kit_away_url TEXT,
  kit_third_url TEXT,
  founded TEXT,
  stadium TEXT,
  location TEXT,
  league_slug TEXT NOT NULL,
  wikipedia_content TEXT,
  stadium_content TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thesportsdb_id TEXT,
  apifootball_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  team_id INTEGER,
  position TEXT,
  nationality TEXT,
  date_of_birth TEXT,
  height TEXT,
  weight TEXT,
  photo_url TEXT,
  description TEXT,
  career_summary TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS player_honours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  honour_name TEXT NOT NULL,
  season TEXT,
  team_name TEXT,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS player_former_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  joined TEXT,
  departed TEXT,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS league_standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  league_slug TEXT NOT NULL,
  season TEXT NOT NULL,
  position INTEGER,
  team_id INTEGER,
  team_name TEXT,
  team_badge TEXT,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  form TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  football_data_id TEXT,
  apifootball_id TEXT,
  league_slug TEXT NOT NULL,
  season TEXT,
  matchday INTEGER,
  status TEXT,
  home_team_id INTEGER,
  home_team_name TEXT,
  home_score INTEGER,
  away_team_id INTEGER,
  away_team_name TEXT,
  away_score INTEGER,
  match_date TEXT,
  match_time TEXT,
  venue TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (home_team_id) REFERENCES teams(id),
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS match_lineups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL,
  team_id INTEGER,
  team_name TEXT,
  player_name TEXT,
  player_number INTEGER,
  position TEXT,
  starter INTEGER DEFAULT 1,
  FOREIGN KEY (match_id) REFERENCES matches(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS top_scorers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  league_slug TEXT NOT NULL,
  season TEXT,
  apifootball_id TEXT,
  player_name TEXT,
  player_slug TEXT,
  team_name TEXT,
  team_badge TEXT,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  penalties INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  league_slug TEXT NOT NULL,
  season TEXT,
  player_name TEXT,
  player_slug TEXT,
  from_team TEXT,
  to_team TEXT,
  transfer_type TEXT,
  transfer_date TEXT,
  transfer_fee TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT,
  thumbnail_url TEXT,
  channel_name TEXT,
  duration INTEGER,
  entity_type TEXT,
  entity_id INTEGER,
  league_slug TEXT,
  season TEXT,
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS world_cups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  host_country TEXT,
  winner TEXT,
  runner_up TEXT,
  third_place TEXT,
  fourth_place TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS world_cup_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  world_cup_id INTEGER NOT NULL,
  stage TEXT,
  group_name TEXT,
  home_team TEXT,
  away_team TEXT,
  home_score INTEGER,
  away_score INTEGER,
  venue TEXT,
  match_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (world_cup_id) REFERENCES world_cups(id)
);

CREATE TABLE IF NOT EXISTS world_cup_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  world_cup_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  fifa_code TEXT,
  badge_url TEXT,
  group_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (world_cup_id) REFERENCES world_cups(id)
);
`;

export const INDICES = `
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league_slug);
CREATE INDEX IF NOT EXISTS idx_players_slug ON players(slug);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_standings_league ON league_standings(league_slug);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league_slug);
CREATE INDEX IF NOT EXISTS idx_matches_home ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_top_scorers_league ON top_scorers(league_slug);
CREATE INDEX IF NOT EXISTS idx_transfers_league ON transfers(league_slug);
CREATE INDEX IF NOT EXISTS idx_videos_entity ON videos(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_videos_league ON videos(league_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_standings_unique ON league_standings(league_slug, season, position);
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_football_data_id ON matches(football_data_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_top_scorers_unique ON top_scorers(league_slug, season, player_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transfers_unique ON transfers(league_slug, season, player_name);
CREATE INDEX IF NOT EXISTS idx_world_cup_matches_world_cup ON world_cup_matches(world_cup_id);
CREATE INDEX IF NOT EXISTS idx_world_cup_teams_world_cup ON world_cup_teams(world_cup_id);
`;
