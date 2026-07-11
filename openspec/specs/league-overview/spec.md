# league-overview Specification

## Purpose
TBD - created by archiving change football-wiki-portal. Update Purpose after archive.
## Requirements
### Requirement: League overview page displays standings
The system SHALL serve a league page at `/leagues/{slug}` showing the full league table with position, team name, badge, played, won, drawn, lost, goals for, goals against, goal difference, points, and form (last 5 results).

#### Scenario: League standings table
- **WHEN** a user navigates to `/leagues/premier-league`
- **THEN** the current season standings are displayed with all columns, sorted by position

#### Scenario: Form indicator
- **WHEN** a team's last 5 results are available
- **THEN** form is shown as 5 colored indicators (green=win, yellow=draw, red=loss)

### Requirement: League page displays top scorers
The system SHALL show the top 10 scorers in the league with player name, team, goals, assists, and penalties.

#### Scenario: Top scorers section
- **WHEN** a user views the league page
- **THEN** the top 10 goal scorers are listed with rank, player name, team badge, goals, assists, and penalty count

### Requirement: League page displays upcoming fixtures
The system SHALL show the next 10 league fixtures with home team, away team, date, time, and matchday.

#### Scenario: Upcoming fixtures section
- **WHEN** a user views the league page
- **THEN** the next 10 scheduled league matches are displayed grouped by matchday

### Requirement: League page displays recent results
The system SHALL show the last 10 league results with home team, score, away team, and date.

#### Scenario: Recent results section
- **WHEN** a user views the league page
- **THEN** the last 10 completed league matches are displayed with scores and dates

### Requirement: League list page
The system SHALL serve a league list page at `/leagues` showing all 8 target leagues with name, country, badge, and links to each league's overview page.

#### Scenario: Browse all leagues
- **WHEN** a user navigates to `/leagues`
- **THEN** all 8 leagues are displayed with name, country flag, and badge

### Requirement: League standings use ISR with 24h revalidation
The system SHALL serve league pages via ISR with a 24-hour revalidation window. Standings data SHALL be updated daily by the cron job.

#### Scenario: Standings freshness
- **WHEN** the daily cron job completes
- **THEN** Turso contains updated standings for all 8 leagues

### Requirement: League slugs are human-readable
The system SHALL use slugs: `premier-league`, `la-liga`, `bundesliga`, `serie-a`, `ligue-1`, `champions-league`, `fifa-world-cup`, `brasileirao-serie-a`.

#### Scenario: Slug resolution
- **WHEN** a user navigates to `/leagues/brasileirao-serie-a`
- **THEN** the system resolves to Campeonato Brasileiro Série A

