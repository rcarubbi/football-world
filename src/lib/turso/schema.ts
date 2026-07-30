export const SCHEMA = `
CREATE TABLE IF NOT EXISTS leagues (
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
  football_data_code TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS venues (
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
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT DEFAULT 'legacy',
  external_id TEXT,
  thesportsdb_id TEXT,
  football_data_id TEXT,
  sportsapipro_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  short_name TEXT,
  badge_url TEXT,
  kit_home_url TEXT,
  kit_away_url TEXT,
  kit_third_url TEXT,
  founded TEXT,
  stadium TEXT,
  location TEXT,
  league_slug TEXT,
  wikipedia_content TEXT,
  stadium_content TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  capacity INTEGER,
  venue_id INTEGER REFERENCES venues(id),
  bbd_id TEXT,
  description TEXT,
  website TEXT,
  banner_url TEXT,
  equipment_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT DEFAULT 'legacy',
  external_id TEXT,
  thesportsdb_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  team_id INTEGER,
  position TEXT,
  nationality TEXT,
  date_of_birth TEXT,
  height TEXT,
  weight TEXT,
  photo_url TEXT,
  description TEXT,
  career_summary TEXT,
  jersey_number TEXT,
  bbd_id TEXT,
  short_name TEXT,
  date_of_death TEXT,
  birth_location TEXT,
  status TEXT,
  cutout_url TEXT,
  wikidata_id TEXT,
  transfermarkt_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS player_honours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,
  honour_name TEXT NOT NULL,
  season TEXT,
  team_name TEXT,
  team_badge TEXT,
  honour_logo TEXT,
  honour_trophy TEXT,
  thesportsdb_id TEXT,
  source TEXT DEFAULT 'legacy',
  player_name TEXT,
  year TEXT
);

CREATE TABLE IF NOT EXISTS player_former_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,
  team_name TEXT NOT NULL,
  joined TEXT,
  departed TEXT,
  move_type TEXT,
  team_badge TEXT,
  thesportsdb_id TEXT,
  source TEXT DEFAULT 'legacy',
  player_name TEXT,
  left_team TEXT
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
  source TEXT DEFAULT 'legacy',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS league_standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT DEFAULT 'legacy',
  external_id TEXT,
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
  league_id INTEGER REFERENCES leagues(id),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT DEFAULT 'legacy',
  external_id TEXT,
  football_data_id TEXT,
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
  league_id INTEGER REFERENCES leagues(id),
  round INTEGER,
  spectators INTEGER,
  weather TEXT,
  home_team_badge TEXT,
  away_team_badge TEXT,
  venue_id INTEGER REFERENCES venues(id),
  poster_url TEXT,
  thumb_url TEXT,
  banner_url TEXT,
  square_url TEXT,
  video_url TEXT,
  thesportsdb_id TEXT,
  api_football_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (home_team_id) REFERENCES teams(id),
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS match_events (
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
);

CREATE TABLE IF NOT EXISTS top_scorers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT DEFAULT 'legacy',
  external_id TEXT,
  league_slug TEXT NOT NULL,
  season TEXT,
  player_name TEXT,
  player_slug TEXT,
  team_name TEXT,
  team_badge TEXT,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  penalties INTEGER DEFAULT 0,
  league_id INTEGER REFERENCES leagues(id),
  minutes INTEGER,
  matches INTEGER,
  appearances INTEGER,
  position TEXT,
  jersey_number INTEGER,
  nationality TEXT,
  photo_url TEXT,
  player_id INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT DEFAULT 'legacy',
  external_id TEXT,
  video_id TEXT NOT NULL,
  title TEXT,
  thumbnail_url TEXT,
  channel_name TEXT,
  duration INTEGER,
  entity_type TEXT,
  entity_id INTEGER,
  league_slug TEXT,
  season TEXT,
  published_at TEXT,
  view_count INTEGER,
  like_count INTEGER,
  channel_id TEXT,
  team_name TEXT,
  tags TEXT,
  category TEXT,
  description TEXT,
  fetched_at TEXT,
  updated_at TEXT,
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

CREATE TABLE IF NOT EXISTS world_cup_squads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  world_cup_id INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  player_name TEXT NOT NULL,
  position TEXT,
  club TEXT,
  shirt_number INTEGER,
  FOREIGN KEY (world_cup_id) REFERENCES world_cups(id)
);
CREATE INDEX IF NOT EXISTS idx_wcsquads_wcid ON world_cup_squads(world_cup_id);
CREATE INDEX IF NOT EXISTS idx_wcsquads_team ON world_cup_squads(world_cup_id, team_name);

-- Staging: SportsAPI Pro
CREATE TABLE IF NOT EXISTS sap_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_id TEXT NOT NULL UNIQUE,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_squads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_team_id TEXT NOT NULL UNIQUE,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_tournament_seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  season_id INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_top_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  season_id INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

-- Staging: Big Balls Data
CREATE TABLE IF NOT EXISTS bbd_sports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_leagues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  league_id TEXT NOT NULL,
  season TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_scorers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  league_id TEXT NOT NULL,
  season TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'goals',
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_injuries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_team_id TEXT NOT NULL,
  league_id TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  league_id TEXT NOT NULL,
  season TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_player_id TEXT NOT NULL,
  league_id TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_player_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_player_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_player_trophies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_player_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

-- Staging: TheSportsDB
CREATE TABLE IF NOT EXISTS tsdb_leagues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  name TEXT,
  sport TEXT,
  country TEXT,
  badge_url TEXT,
  formed_year TEXT,
  gender TEXT,
  description TEXT,
  raw_json TEXT,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tsdb_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  league_tsdb_id TEXT,
  name TEXT,
  short_name TEXT,
  badge_url TEXT,
  kit_home_url TEXT,
  kit_away_url TEXT,
  kit_third_url TEXT,
  founded TEXT,
  stadium TEXT,
  location TEXT,
  description TEXT,
  website TEXT,
  raw_json TEXT,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tsdb_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  team_tsdb_id TEXT,
  name TEXT,
  slug TEXT,
  position TEXT,
  nationality TEXT,
  date_of_birth TEXT,
  height TEXT,
  weight TEXT,
  photo_url TEXT,
  thumb_url TEXT,
  render_url TEXT,
  cutout_url TEXT,
  description TEXT,
  raw_json TEXT,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tsdb_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tsdb_timelines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tsdb_former_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tsdb_player_honours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tsdb_team_equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tsdb_venues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tsdb_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tsdb_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

-- Staging: SAP (additional)
CREATE TABLE IF NOT EXISTS sap_team_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_team_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  season_id INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_match_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_match_lineups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_match_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_match_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_match_shotmap (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_id TEXT NOT NULL UNIQUE,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sap_player_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sap_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

-- Staging: BBD (additional)
CREATE TABLE IF NOT EXISTS bbd_team_form (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_team_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_team_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_team_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_team_elo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_team_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_match_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_match_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_match_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_match_odds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_player_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_player_id TEXT NOT NULL,
  league_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_player_career (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_player_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bbd_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bbd_match_id TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

-- Staging: Football-Data.org
CREATE TABLE IF NOT EXISTS fbdo_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fd_id INTEGER NOT NULL UNIQUE,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fbdo_competitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fd_id INTEGER NOT NULL UNIQUE,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fbdo_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fd_id INTEGER NOT NULL,
  competition_code TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fbdo_team_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fd_id INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fbdo_scorers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fd_id INTEGER NOT NULL,
  competition_code TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fbdo_persons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fd_id INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fbdo_match_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fd_id INTEGER NOT NULL,
  competition_code TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);

-- Staging: YouTube
CREATE TABLE IF NOT EXISTS yt_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  query TEXT NOT NULL,
  published_at TEXT,
  raw_json TEXT NOT NULL,
  fetched_at TEXT DEFAULT (datetime('now'))
);
`;

export const INDICES = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_leagues_slug ON leagues(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_venues_tsdb_id ON venues(thesportsdb_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_ext_id ON teams(external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_ext_id ON players(external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_natural ON matches(home_team_name, away_team_name, match_date, season);
CREATE UNIQUE INDEX IF NOT EXISTS idx_standings_natural ON league_standings(league_slug, season, team_id, source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scorers_natural ON top_scorers(player_name, league_slug, season);
CREATE UNIQUE INDEX IF NOT EXISTS idx_honours_natural ON player_honours(player_name, honour_name, year, source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transfers_natural ON transfers(league_slug, season, player_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_former_teams_natural ON player_former_teams(player_name, team_name, source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_source_ext ON videos(source, external_id);
CREATE INDEX IF NOT EXISTS idx_match_events_natural ON match_events(match_id, event_type, event_time, player_name);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug_league ON teams(slug, league_slug);
CREATE INDEX IF NOT EXISTS idx_players_name_team ON players(name, team_id);
CREATE INDEX IF NOT EXISTS idx_leagues_sap_id ON leagues(sportsapipro_id);
CREATE INDEX IF NOT EXISTS idx_leagues_tsdb_id ON leagues(thesportsdb_id);
CREATE INDEX IF NOT EXISTS idx_teams_sap_id ON teams(sportsapipro_id);
CREATE INDEX IF NOT EXISTS idx_teams_tsdb_id ON teams(thesportsdb_id);
CREATE INDEX IF NOT EXISTS idx_players_tsdb_id ON players(thesportsdb_id);
CREATE INDEX IF NOT EXISTS idx_matches_tsdb_id ON matches(thesportsdb_id);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league_slug);
CREATE INDEX IF NOT EXISTS idx_matches_home ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_football_data_id ON matches(football_data_id);
CREATE INDEX IF NOT EXISTS idx_matches_source ON matches(source, external_id);
CREATE INDEX IF NOT EXISTS idx_players_slug ON players(slug);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_source ON players(source, external_id);
CREATE INDEX IF NOT EXISTS idx_standings_league ON league_standings(league_slug);
CREATE INDEX IF NOT EXISTS idx_top_scorers_league ON top_scorers(league_slug);
CREATE INDEX IF NOT EXISTS idx_videos_entity ON videos(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_videos_league ON videos(league_slug);
CREATE INDEX IF NOT EXISTS idx_videos_source ON videos(source, external_id);
CREATE INDEX IF NOT EXISTS idx_world_cup_matches_world_cup ON world_cup_matches(world_cup_id);
CREATE INDEX IF NOT EXISTS idx_world_cup_teams_world_cup ON world_cup_teams(world_cup_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sap_teams_sap_id ON sap_teams(sap_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sap_squads_sap_id ON sap_squads(sap_team_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sap_tournament_seasons_tid ON sap_tournament_seasons(tournament_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sap_standings_tid_sid ON sap_standings(tournament_id, season_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sap_top_players_tid_sid ON sap_top_players(tournament_id, season_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bbd_standings_unique ON bbd_standings(league_id, season);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bbd_scorers_unique ON bbd_scorers(league_id, season, category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bbd_matches_unique ON bbd_matches(league_id, season);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bbd_players_id ON bbd_players(bbd_player_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tsdb_leagues_tsdb_id ON tsdb_leagues(tsdb_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tsdb_teams_tsdb_id ON tsdb_teams(tsdb_id);
CREATE INDEX IF NOT EXISTS idx_tsdb_teams_league ON tsdb_teams(league_tsdb_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tsdb_players_tsdb_id ON tsdb_players(tsdb_id);
CREATE INDEX IF NOT EXISTS idx_tsdb_players_team ON tsdb_players(team_tsdb_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_entity ON yt_videos(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_yt_videos_published ON yt_videos(published_at);

CREATE TABLE IF NOT EXISTS team_leagues (
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  league_slug TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (team_id, league_slug)
);
CREATE INDEX IF NOT EXISTS idx_team_leagues_team ON team_leagues(team_id);
CREATE INDEX IF NOT EXISTS idx_team_leagues_league ON team_leagues(league_slug);
`;
