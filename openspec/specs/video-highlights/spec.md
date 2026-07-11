# video-highlights Specification

## Purpose
TBD - created by archiving change football-wiki-portal. Update Purpose after archive.
## Requirements
### Requirement: Team pages display highlight videos
The system SHALL display up to 5 YouTube highlight videos on the team wiki page, showing video thumbnail, title, and duration. Videos SHALL be embedded via YouTube iframe on click, not auto-loaded.

#### Scenario: Team page shows videos
- **WHEN** a user views the team wiki page
- **THEN** up to 5 YouTube highlight videos are displayed as a grid with thumbnail, title, and duration

#### Scenario: Team with no videos
- **WHEN** a team has no videos stored in Turso
- **THEN** the video section is hidden (not shown as empty)

#### Scenario: Video embed on click
- **WHEN** a user clicks a video thumbnail
- **THEN** a YouTube iframe modal opens playing the video

### Requirement: League pages display match highlights
The system SHALL display recent match highlight videos on the league overview page, showing the top 10 most recent highlights with match context (teams, score, date).

#### Scenario: League page shows highlights
- **WHEN** a user views the league overview page
- **THEN** up to 10 recent match highlight videos are displayed with match context

### Requirement: YouTube videos are stored in Turso
The system SHALL store YouTube video data in a `videos` table with columns: id, video_id, title, thumbnail_url, channel_name, duration, entity_type (team/match), entity_id (team_id or match_id), league_slug, season, published_at.

#### Scenario: Video data persisted
- **WHEN** the bootstrap script or cron fetches a video
- **THEN** the video metadata is written to the `videos` table in Turso

### Requirement: Bootstrap fetches team highlight videos
The system SHALL search YouTube for each team's highlight videos during bootstrap using the query pattern "{team name} highlights {season year}", storing the top 5 results per team.

#### Scenario: Bootstrap fetches videos
- **WHEN** the bootstrap script processes a team
- **THEN** it searches YouTube for team highlights and stores top 5 results in Turso

#### Scenario: YouTube quota management
- **WHEN** the bootstrap makes YouTube API calls
- **THEN** calls are limited to 80 per day (8,000 units) to stay within free tier

### Requirement: Daily cron fetches recent match highlights
The system SHALL search YouTube for recent match highlights during the daily cron using the query pattern "{league name} highlights {date}", storing top results per league.

#### Scenario: Cron fetches highlights
- **WHEN** the daily cron job runs
- **THEN** it searches YouTube for recent match highlights for all 8 leagues and stores in Turso

### Requirement: Videos use YouTube iframe embeds
The system SHALL embed YouTube videos using the standard YouTube iframe embed URL (`https://www.youtube.com/embed/{video_id}`), loaded only when the user clicks to play.

#### Scenario: Lazy video loading
- **WHEN** a video thumbnail is displayed
- **THEN** no YouTube iframe is loaded until the user clicks to play

### Requirement: Video sections are responsive
The system SHALL display video grids responsively: 1 column on mobile, 2 columns on tablet, 3 columns on desktop.

#### Scenario: Mobile video layout
- **WHEN** a user views a page with videos on a 375px viewport
- **THEN** videos are displayed in a single column

#### Scenario: Desktop video layout
- **WHEN** a user views a page with videos on a 1440px viewport
- **THEN** videos are displayed in a 3-column grid

