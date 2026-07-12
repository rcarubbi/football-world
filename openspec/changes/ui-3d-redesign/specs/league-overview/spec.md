## MODIFIED Requirements

### Requirement: Standings query includes team slug
The league standings query SHALL JOIN with the teams table to return team_slug for navigation links.

#### Scenario: Team link in standings
- **WHEN** league standings are displayed
- **THEN** each team name links to `/times/{team_slug}` via the joined team_slug field

#### Scenario: Team with no slug
- **WHEN** a team in standings has no matching team record
- **THEN** the team name renders as plain text without a link
