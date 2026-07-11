## ADDED Requirements

### Requirement: Team wiki page displays team information
The system SHALL serve a team wiki page at `/teams/{slug}` containing the team's name, badge image, description (from Wikipedia), founded year, stadium name, stadium description, location, and capacity.

#### Scenario: Team page renders with wiki content
- **WHEN** a user navigates to `/teams/arsenal`
- **THEN** the page displays Arsenal's name, badge, Wikipedia-enriched description, founded year (1886), stadium (Emirates Stadium), stadium description, location (London, England), and capacity

#### Scenario: Team page with missing content
- **WHEN** a team has no Wikipedia content in Turso
- **THEN** the page renders with data from TheSportsDB only (name, badge, basic info) and shows no description section

### Requirement: Team page displays current squad
The system SHALL display the team's current squad as a table with player name, position, nationality, photo, and appearances/goals for the current season.

#### Scenario: Squad table shows current players
- **WHEN** a user views the team wiki page
- **THEN** a squad table lists all current players with name, position, nationality, photo thumbnail, appearances, and goals

#### Scenario: Squad links to player profiles
- **WHEN** a user clicks a player name in the squad table
- **THEN** the browser navigates to `/players/{player-slug}`

### Requirement: Team page displays recent results
The system SHALL show the team's last 5 match results with opponent name, score, date, and competition.

#### Scenario: Recent results section
- **WHEN** a user views the team wiki page
- **THEN** the last 5 completed matches are displayed with home/away indicator, score, opponent, date, and league name

### Requirement: Team page displays upcoming fixtures
The system SHALL show the team's next 5 scheduled matches with opponent, date, time, venue, and competition.

#### Scenario: Upcoming fixtures section
- **WHEN** a user views the team wiki page
- **THEN** the next 5 scheduled matches are displayed with opponent, date/time, venue, and league name

### Requirement: Team page displays honours
The system SHALL list the team's major honours (league titles, domestic cups, international trophies) grouped by category.

#### Scenario: Honours section
- **WHEN** a user views the team wiki page
- **THEN** honours are displayed grouped by category (e.g., "League Titles", "Domestic Cups", "European Trophies") with count and seasons

### Requirement: Team page displays kit history
The system SHALL show the team's current home, away, and third kit images when available.

#### Scenario: Kit images display
- **WHEN** a user views the team wiki page
- **THEN** home, away, and third kit images are displayed if available from TheSportsDB

### Requirement: Team pages use ISR with 24h revalidation
The system SHALL serve team pages via ISR with a 24-hour revalidation window. Pages SHALL be pre-rendered at build time and refreshed in the background after revalidation expires.

#### Scenario: First visit after revalidation
- **WHEN** a user visits a team page more than 24h after the last revalidation
- **THEN** the page is served with cached content immediately while Turso is queried in the background for fresh data

### Requirement: Team list page with league filter
The system SHALL serve a team list page at `/teams` showing all teams across the 8 target leagues, filterable by league.

#### Scenario: Browse all teams
- **WHEN** a user navigates to `/teams`
- **THEN** all teams are displayed with name, badge, and league, filterable by league dropdown

### Requirement: Team slugs are human-readable
The system SHALL use human-readable slugs derived from team names (lowercased, special characters removed, spaces replaced with hyphens).

#### Scenario: Slug resolution
- **WHEN** a user navigates to `/teams/manchester-united`
- **THEN** the system resolves the slug to the correct team (Manchester United)
