## MODIFIED Requirements

### Requirement: Team page displays recent results
The system SHALL show the team's last 5 match results with opponent name, score, date, and competition, with expandable lineup cards.

#### Scenario: Recent results section
- **WHEN** a user views the team wiki page
- **THEN** the last 5 completed matches are displayed with home/away indicator, score, opponent, date, and league name

#### Scenario: Expanding match for lineup
- **WHEN** a user clicks on a match result card
- **THEN** the card expands to show the starting XI, formation, and substitutes

## ADDED Requirements

### Requirement: Team page displays transfer history
The system SHALL display a "Recent Transfers" section on team pages showing transfer activity for the current season.

#### Scenario: Transfers section on team page
- **WHEN** a user views a team page
- **THEN** a transfers section shows recent incoming and outgoing transfers with player names, fees, and dates

#### Scenario: Team with no transfers
- **WHEN** a team has no transfer records
- **THEN** the transfers section is hidden

### Requirement: Team page displays player count
The system SHALL show the total number of players in the squad on the team page.

#### Scenario: Player count display
- **WHEN** a user views a team page
- **THEN** the squad section header shows "Squad ({count} players)"
