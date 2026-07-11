## MODIFIED Requirements

### Requirement: Bootstrap script fetches teams from TheSportsDB
The system SHALL include a local Node.js script that fetches all teams for the 8 target leagues from TheSportsDB using the `search_all_teams` endpoint, respecting the 30 req/min rate limit.

#### Scenario: Bootstrap fetches all teams
- **WHEN** the developer runs `npm run bootstrap`
- **THEN** the script fetches teams for all 8 leagues from TheSportsDB and stores them in Turso

#### Scenario: Rate limiting during bootstrap
- **WHEN** the bootstrap script makes API calls
- **THEN** calls are rate-limited to 30 per minute with automatic delays

## ADDED Requirements

### Requirement: Bootstrap fetches player supplements from API-Football
The system SHALL supplement TheSportsDB player data with API-Football's `/players` endpoint for teams with incomplete squads.

#### Scenario: Missing player supplementation
- **WHEN** a team has fewer than 15 players from TheSportsDB
- **THEN** the bootstrap script fetches additional players from API-Football for that team

#### Scenario: API-Football quota tracking
- **WHEN** the bootstrap script makes API-Football calls
- **THEN** calls are tracked and do not exceed 80 per day (leaving buffer for cron)

### Requirement: Bootstrap enriches players with Wikipedia content
The system SHALL fetch Wikipedia career summaries for top scorers and notable players during bootstrap.

#### Scenario: Player Wikipedia enrichment
- **WHEN** the bootstrap script runs
- **THEN** Wikipedia career summaries are fetched for players in the top_scorers table

#### Scenario: Wikipedia rate limiting
- **WHEN** the bootstrap script fetches Wikipedia content
- **THEN** requests are rate-limited to 1 per second

### Requirement: Bootstrap fetches transfer data
The system SHALL fetch recent transfer data from API-Football for all 8 leagues during bootstrap.

#### Scenario: Transfer data fetched
- **WHEN** the bootstrap script runs
- **THEN** transfers for the current season are fetched from API-Football and stored in the `transfers` table

### Requirement: Bootstrap fetches match lineups
The system SHALL fetch match lineups from API-Football for completed matches during bootstrap.

#### Scenario: Lineup data fetched
- **WHEN** the bootstrap script runs
- **THEN** lineups are fetched for all completed matches from the current season

### Requirement: Bootstrap validates data quality
The system SHALL run a validation step at the end of bootstrap that checks for data quality issues.

#### Scenario: Validation report generated
- **WHEN** the bootstrap script completes
- **THEN** a validation report is generated showing warnings (missing descriptions, incomplete data) and errors (orphaned foreign keys, duplicate records)

#### Scenario: Validation does not block bootstrap
- **WHEN** validation finds warnings
- **THEN** bootstrap completes successfully with warnings logged

#### Scenario: Validation catches critical errors
- **WHEN** validation finds errors (e.g., foreign key violations)
- **THEN** bootstrap logs errors and exits with non-zero status

### Requirement: Daily cron refreshes transfers
The system SHALL fetch recent transfers from API-Football for all 8 leagues during the daily cron job.

#### Scenario: Transfer refresh in cron
- **WHEN** the daily cron job runs
- **THEN** transfers from the last 7 days are fetched and upserted into the `transfers` table

### Requirement: Daily cron refreshes World Cup data
The system SHALL refresh World Cup data during the daily cron for current season tournaments.

#### Scenario: World Cup refresh in cron
- **WHEN** the daily cron job runs
- **THEN** World Cup standings and matches are updated if a World Cup is in progress

### Requirement: Data validation runs in CI
The system SHALL include a validation script that can be run independently to check data quality.

#### Scenario: Standalone validation
- **WHEN** the developer runs `npm run validate`
- **THEN** the validation script checks Turso data quality and outputs a report
