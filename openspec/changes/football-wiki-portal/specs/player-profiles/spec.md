## ADDED Requirements

### Requirement: Player profile page displays biography
The system SHALL serve a player profile page at `/players/{slug}` containing the player's name, photo, position, nationality, date of birth, height, weight, and a brief description.

#### Scenario: Player page renders with profile data
- **WHEN** a user navigates to `/players/bukayo-saka`
- **THEN** the page displays Saka's photo, position (Right Winger), nationality (England), DOB, height, weight, and Wikipedia-enriched description

#### Scenario: Player page with missing description
- **WHEN** a player has no Wikipedia content in Turso
- **THEN** the page renders with TheSportsDB data only and no description section

### Requirement: Player page displays career statistics
The system SHALL show the player's career statistics including total appearances, goals, assists, and clean sheets (for goalkeepers), broken down by season when available.

#### Scenario: Career stats table
- **WHEN** a user views the player page
- **THEN** a stats table shows season-by-season appearances, goals, assists, and other relevant stats

### Requirement: Player page displays honours
The system SHALL list the player's honours (league titles, cups, individual awards) with the season and team.

#### Scenario: Honours section
- **WHEN** a user views the player page
- **THEN** honours are listed with trophy name, season, and winning team

### Requirement: Player page displays former teams
The system SHALL show a timeline of the player's career history with former teams, joined date, and departed date.

#### Scenario: Career timeline
- **WHEN** a user views the player page
- **THEN** a visual timeline shows the player's career path with team logos, joined/departed dates

### Requirement: Player page displays current team context
The system SHALL show the player's current team with badge and link to the team wiki page.

#### Scenario: Current team link
- **WHEN** a user views a player page
- **THEN** the current team is displayed with badge and links to `/teams/{team-slug}`

### Requirement: Player pages use ISR with 24h revalidation
The system SHALL serve player pages via ISR with a 24-hour revalidation window.

#### Scenario: Player page freshness
- **WHEN** a user visits a player page
- **THEN** the page is served from ISR cache, refreshed in background if stale

### Requirement: Player slugs are human-readable
The system SHALL use slugs derived from player names (lowercased, special characters removed, spaces replaced with hyphens).

#### Scenario: Slug resolution
- **WHEN** a user navigates to `/players/lionel-messi`
- **THEN** the system resolves to Lionel Messi's profile
