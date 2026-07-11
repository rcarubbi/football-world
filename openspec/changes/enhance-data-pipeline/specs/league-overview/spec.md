## MODIFIED Requirements

### Requirement: League list page
The system SHALL serve a league list page at `/leagues` showing all 8 target leagues with name, country, high-quality icon, and links to each league's overview page.

#### Scenario: Browse all leagues
- **WHEN** a user navigates to `/leagues`
- **THEN** all 8 leagues are displayed with name, country, and consistent high-quality icons

### Requirement: League overview page displays standings
The system SHALL serve a league page at `/leagues/{slug}` showing the full league table with position, team name, badge, played, won, drawn, lost, goals for, goals against, goal difference, points, and form (last 5 results).

#### Scenario: League standings table
- **WHEN** a user navigates to `/leagues/premier-league`
- **THEN** the current season standings are displayed with all columns, sorted by position

#### Scenario: Form indicator
- **WHEN** a team's last 5 results are available
- **THEN** form is shown as 5 colored indicators (green=win, yellow=draw, red=loss)

## ADDED Requirements

### Requirement: League page displays transfer activity
The system SHALL display a "Recent Transfers" section on league pages showing transfer activity across all teams in the league.

#### Scenario: Transfers section on league page
- **WHEN** a user views a league page
- **THEN** a transfers section shows recent transfers across all teams with player names, team badges, and fees

#### Scenario: Transfer filtering
- **WHEN** a user filters by transfer type or team
- **THEN** the transfers list updates accordingly
