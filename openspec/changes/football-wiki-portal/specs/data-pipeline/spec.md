## ADDED Requirements

### Requirement: Bootstrap script fetches teams from TheSportsDB
The system SHALL include a local Node.js script that fetches all teams for the 8 target leagues from TheSportsDB using the `search_all_teams` endpoint, respecting the 30 req/min rate limit.

#### Scenario: Bootstrap fetches all teams
- **WHEN** the developer runs `npm run bootstrap`
- **THEN** the script fetches teams for all 8 leagues from TheSportsDB and stores them in Turso

#### Scenario: Rate limiting during bootstrap
- **WHEN** the bootstrap script makes API calls
- **THEN** calls are rate-limited to 30 per minute with automatic delays

### Requirement: Bootstrap script fetches team details from TheSportsDB
The system SHALL fetch detailed team information (description, stadium, kits, badge) for each team using the `lookupteam` endpoint.

#### Scenario: Team details are fetched
- **WHEN** the bootstrap script has a list of team IDs
- **THEN** it fetches detailed info for each team and writes to Turso

### Requirement: Bootstrap script fetches squads from TheSportsDB
The system SHALL fetch the player list for each team using the `lookup_all_players` endpoint.

#### Scenario: Squad data is fetched
- **WHEN** the bootstrap script has team IDs
- **THEN** it fetches all players per team and stores in Turso

### Requirement: Bootstrap script fetches standings from football-data.org
The system SHALL fetch current league standings for all 8 leagues from football-data.org using the `/v4/competitions/{code}/standings` endpoint.

#### Scenario: Standings are fetched
- **WHEN** the bootstrap script runs
- **THEN** it fetches standings for all 8 leagues from football-data.org and stores in Turso

### Requirement: Bootstrap script fetches fixtures from football-data.org
The system SHALL fetch current season fixtures for all 8 leagues from football-data.org using the `/v4/competitions/{code}/matches` endpoint.

#### Scenario: Fixtures are fetched
- **WHEN** the bootstrap script runs
- **THEN** it fetches fixtures for all 8 leagues and stores in Turso

### Requirement: Bootstrap script maps team IDs across APIs
The system SHALL map team identifiers across TheSportsDB, football-data.org, and API-Football using fuzzy name matching with a manual override file for edge cases.

#### Scenario: Fuzzy name matching
- **WHEN** the bootstrap script needs to find Arsenal's ID in football-data.org
- **THEN** it normalizes "Arsenal FC" and "Arsenal" to match successfully

#### Scenario: Override file for edge cases
- **WHEN** fuzzy matching fails for a team
- **THEN** the script checks `team-overrides.json` for a manual mapping

### Requirement: Daily cron refreshes standings and fixtures
The system SHALL include a Vercel cron function that runs daily at 6 AM UTC, fetching updated standings and fixtures from football-data.org for all 8 leagues.

#### Scenario: Daily cron runs successfully
- **WHEN** the cron job triggers at 6 AM UTC
- **THEN** standings and fixtures are fetched for all 8 leagues and written to Turso

#### Scenario: Cron stays within rate limits
- **WHEN** the cron function makes API calls
- **THEN** total calls do not exceed 48 per run (8 leagues × 3 endpoints × 2 APIs)

### Requirement: Daily cron refreshes top scorers and transfers
The system SHALL fetch top scorers, top assists, and recent transfers from API-Football for all 8 leagues during the daily cron.

#### Scenario: Top scorers are refreshed
- **WHEN** the cron job runs
- **THEN** top scorers and assists are fetched from API-Football for all 8 leagues and written to Turso

#### Scenario: API-Football budget respected
- **WHEN** the cron makes API-Football calls
- **THEN** total daily calls do not exceed 100 (cron ~24 + on-demand ~38 + buffer)

### Requirement: ISR revalidation for all pages
The system SHALL configure ISR revalidation: 24h for team and player pages, 6h for league pages, 1h for standings on matchdays.

#### Scenario: Revalidation settings
- **WHEN** a Next.js page is built
- **THEN** the revalidation interval matches the configured TTL for that page type

### Requirement: Turso schema supports all entities
The system SHALL define a Turso schema with tables for teams, players, player_honours, player_former_teams, league_standings, matches, match_lineups, top_scorers, and transfers.

#### Scenario: Schema creation
- **WHEN** the bootstrap script runs for the first time
- **THEN** all required tables are created in Turso if they don't exist

### Requirement: Bootstrap script is resumable
The system SHALL persist bootstrap progress so that if interrupted, re-running the script continues from where it left off rather than restarting.

#### Scenario: Interrupted bootstrap resumes
- **WHEN** the bootstrap script is interrupted at team 80 of 160
- **THEN** re-running it continues from team 81, skipping already-fetched teams
