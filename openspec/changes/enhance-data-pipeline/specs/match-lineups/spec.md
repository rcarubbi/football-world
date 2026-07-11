## ADDED Requirements

### Requirement: Team page displays match lineups
The system SHALL show match lineups for the last 5 completed matches on team pages, displaying starting XI and substitutes.

#### Scenario: Lineup section on team page
- **WHEN** a user views a team page
- **THEN** the recent results section includes expandable lineup cards for each of the last 5 completed matches

#### Scenario: Expanding lineup card
- **WHEN** a user clicks on a match result card
- **THEN** the card expands to show the starting XI with player names, positions, and shirt numbers

### Requirement: Starting XI display
The system SHALL display the starting XI in formation layout (4-4-2, 4-3-3, etc.) with player names and shirt numbers.

#### Scenario: Formation visualization
- **WHEN** a match has lineup data
- **THEN** players are arranged in their tactical formation with shirt numbers displayed

### Requirement: Substitutes display
The system SHALL show substitutes on the bench with player names and shirt numbers.

#### Scenario: Bench players shown
- **WHEN** a match has lineup data with substitutes
- **THEN** substitutes are listed below the starting XI with "Sub" label

### Requirement: Lineup data from API-Football
The system SHALL fetch match lineups from API-Football during bootstrap and daily cron.

#### Scenario: Bootstrap fetches lineups
- **WHEN** the bootstrap script runs
- **THEN** lineups are fetched for all completed matches from the current season

#### Scenario: Daily cron refreshes lineups
- **WHEN** the daily cron job runs
- **THEN** lineups are fetched for any new completed matches

### Requirement: Lineup storage in database
The system SHALL store lineup data in the `match_lineups` table with match_id, team_id, player_name, player_number, position, and starter flag.

#### Scenario: Lineup data persisted
- **WHEN** a lineup is fetched from API-Football
- **THEN** it is stored in the `match_lineups` table with all required fields
