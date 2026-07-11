## ADDED Requirements

### Requirement: World Cup data pipeline fetches historical tournaments
The system SHALL fetch FIFA World Cup data from football-data.org for available seasons (2006-present) during bootstrap.

#### Scenario: Bootstrap fetches World Cup data
- **WHEN** the bootstrap script runs
- **THEN** World Cup standings, matches, and results are fetched for all available seasons from football-data.org

#### Scenario: World Cup data stored in dedicated tables
- **WHEN** World Cup data is fetched
- **THEN** it is stored in `world_cups`, `world_cup_matches`, and `world_cup_teams` tables

### Requirement: World Cup teams stored with national team details
The system SHALL fetch national team details from TheSportsDB and store them in the `world_cup_teams` table.

#### Scenario: National team details fetched
- **WHEN** the bootstrap script processes World Cup data
- **THEN** national team details (name, badge, FIFA code) are fetched from TheSportsDB

### Requirement: World Cup page displays tournament overview
The system SHALL serve a World Cup overview page at `/leagues/fifa-world-cup` showing tournament history, participating teams, and key statistics.

#### Scenario: World Cup overview page
- **WHEN** a user navigates to `/leagues/fifa-world-cup`
- **THEN** the page displays a list of World Cup tournaments with year, host, winner, and runner-up

#### Scenario: World Cup tournament detail
- **WHEN** a user clicks on a specific World Cup year
- **THEN** the page shows groups, knockout bracket, and final standings

### Requirement: World Cup matches display with group stage
The system SHALL display World Cup matches organized by group stage and knockout rounds.

#### Scenario: Group stage matches
- **WHEN** a user views World Cup matches
- **THEN** matches are grouped by group (A-H) with team badges and scores

#### Scenario: Knockout stage matches
- **WHEN** a user views knockout round matches
- **THEN** matches are displayed with round labels (Round of 16, Quarter-finals, Semi-finals, Final)

### Requirement: World Cup data includes historical results
The system SHALL store and display historical World Cup results including final scores, venues, and key moments.

#### Scenario: Historical results display
- **WHEN** a user views a World Cup tournament
- **THEN** the page shows all matches with scores, dates, and venues

### Requirement: World Cup cron refresh
The system SHALL refresh World Cup data during the daily cron job for any ongoing or recently completed tournaments.

#### Scenario: Cron refreshes World Cup data
- **WHEN** the daily cron job runs
- **THEN** World Cup standings and matches are updated for current season if applicable
