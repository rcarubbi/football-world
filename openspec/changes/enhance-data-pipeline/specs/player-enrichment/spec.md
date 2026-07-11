## ADDED Requirements

### Requirement: Player profile includes Wikipedia career summary
The system SHALL display a Wikipedia-sourced career summary on player profile pages for notable players.

#### Scenario: Player with career summary
- **WHEN** a user views a player profile page
- **THEN** a "Career Summary" section displays the Wikipedia-sourced biography content rendered as Markdown

#### Scenario: Player without career summary
- **WHEN** a player has no career summary in the database
- **THEN** the "Career Summary" section is not displayed

### Requirement: Bootstrap fetches player Wikipedia content
The system SHALL scrape Wikipedia during bootstrap for players who are top scorers or have notable status, storing career summaries in the `players` table.

#### Scenario: Top scorer enrichment
- **WHEN** the bootstrap script runs
- **THEN** Wikipedia career summaries are fetched for all players in the top_scorers table

#### Scenario: Rate limiting for Wikipedia requests
- **WHEN** the bootstrap script fetches Wikipedia content
- **THEN** requests are rate-limited to 1 per second to avoid Wikipedia rate limits

### Requirement: Player career summary storage
The system SHALL add a `career_summary` column to the `players` table to store Wikipedia-sourced Markdown content.

#### Schema change
- **WHEN** the bootstrap runs for the first time after this change
- **THEN** the `career_summary` column is added to the `players` table if it doesn't exist

### Requirement: Player profile displays career statistics
The system SHALL show career statistics (appearances, goals, assists) for the current season on player profile pages.

#### Scenario: Career statistics section
- **WHEN** a user views a player profile
- **THEN** a statistics table shows appearances, goals, assists, and minutes played for the current season

#### Scenario: Player without statistics
- **WHEN** a player has no statistics in the database
- **THEN** the statistics section shows "No statistics available"
