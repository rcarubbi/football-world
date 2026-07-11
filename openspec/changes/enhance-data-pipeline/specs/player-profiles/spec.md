## MODIFIED Requirements

### Requirement: Player profile page displays player information
The system SHALL serve a player profile page at `/players/{slug}` containing the player's name, photo, position, nationality, date of birth, and current team.

#### Scenario: Player page renders with data
- **WHEN** a user navigates to `/players/bukayo-saka`
- **THEN** the page displays the player's name, photo, position, nationality, DOB, and current team badge

### Requirement: Player page displays career statistics
The system SHALL show career statistics (appearances, goals, assists) for the current season on player profile pages.

#### Scenario: Career statistics section
- **WHEN** a user views a player profile
- **THEN** a statistics table shows appearances, goals, assists, and minutes played

#### Scenario: Player without statistics
- **WHEN** a player has no statistics in the database
- **THEN** the statistics section shows "No statistics available"

## ADDED Requirements

### Requirement: Player profile includes Wikipedia career summary
The system SHALL display a Wikipedia-sourced career summary on player profile pages for notable players.

#### Scenario: Player with career summary
- **WHEN** a user views a player profile page
- **THEN** a "Career Summary" section displays the Wikipedia-sourced biography content rendered as Markdown

#### Scenario: Player without career summary
- **WHEN** a player has no career summary in the database
- **THEN** the "Career Summary" section is not displayed

### Requirement: Player profile displays honours
The system SHALL show the player's honours (trophies, awards) grouped by category on the player profile page.

#### Scenario: Honours section
- **WHEN** a user views a player profile
- **THEN** honours are displayed grouped by category (e.g., "League Titles", "Cups", "Individual Awards")

#### Scenario: Player without honours
- **WHEN** a player has no honours in the database
- **THEN** the honours section is not displayed

### Requirement: Player profile displays career timeline
The system SHALL show a visual timeline of the player's former teams with join/departure dates.

#### Scenario: Career timeline section
- **WHEN** a user views a player profile
- **THEN** a timeline displays former teams with badges and date ranges

#### Scenario: Player with no former teams
- **WHEN** a player has no former teams in the database
- **THEN** the timeline section shows "Career at current club only"
