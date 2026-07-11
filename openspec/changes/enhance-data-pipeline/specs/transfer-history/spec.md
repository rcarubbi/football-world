## ADDED Requirements

### Requirement: Team page displays transfer history
The system SHALL display a "Transfers" section on team pages showing recent transfer activity for that team, including player name, transfer type (in/out), destination/origin club, transfer fee, and date.

#### Scenario: Team page shows incoming transfers
- **WHEN** a user views a team page
- **THEN** the transfers section displays all incoming transfers for the current season, sorted by date (newest first)

#### Scenario: Team page shows outgoing transfers
- **WHEN** a user views a team page
- **THEN** the transfers section also displays outgoing transfers for the current season, visually distinguished from incoming transfers

#### Scenario: Team with no transfers
- **WHEN** a team has no transfer records in the database
- **THEN** the transfers section is hidden (not shown)

### Requirement: Transfer filtering by season
The system SHALL allow users to filter transfers by season on team pages.

#### Scenario: Season filter on team page
- **WHEN** a user selects a different season from the dropdown
- **THEN** the transfers section updates to show transfers for that season

### Requirement: League page displays transfer activity
The system SHALL display a "Transfers" section on league pages showing recent transfer activity across all teams in the league.

#### Scenario: League page shows transfers
- **WHEN** a user navigates to a league page
- **THEN** a transfers section displays recent transfers across all teams, with team badges and player names

#### Scenario: League transfer filtering
- **WHEN** a user filters by transfer type (in/out) or team
- **THEN** the transfers list updates accordingly

### Requirement: Transfer data includes fee information
The system SHALL display transfer fee when available from the API, or show "Undisclosed" when not available.

#### Scenario: Transfer with fee
- **WHEN** a transfer record has a fee value
- **THEN** the fee is displayed in the transfer card

#### Scenario: Transfer without fee
- **WHEN** a transfer record has no fee value
- **THEN** "Undisclosed" is displayed

### Requirement: Transfer records include transfer type
The system SHALL categorize transfers as "Permanent", "Loan", "Free", or "Unknown" based on API data.

#### Scenario: Permanent transfer display
- **WHEN** a transfer is permanent
- **THEN** the transfer type badge shows "Permanent"

#### Scenario: Loan transfer display
- **WHEN** a transfer is a loan
- **THEN** the transfer type badge shows "Loan"
