## ADDED Requirements

### Requirement: League icons use high-quality sources
The system SHALL display consistent, high-quality league icons across all pages instead of TheSportsDB badges.

#### Scenario: League list page icons
- **WHEN** a user navigates to the league list page
- **THEN** each league displays a consistently sized, high-quality icon

#### Scenario: League overview page icon
- **WHEN** a user views a league overview page
- **THEN** the league icon is displayed prominently in the header

#### Scenario: Team page league badge
- **WHEN** a team page shows the team's league
- **THEN** the league icon is displayed with consistent styling

### Requirement: League icon mapping
The system SHALL maintain a mapping of league slugs to curated icon URLs from official sources or Wikipedia Commons.

#### Scenario: Icon URL resolution
- **WHEN** a component requests a league icon
- **THEN** the system returns the curated URL from the mapping

#### Scenario: Fallback for missing icon
- **WHEN** a league has no curated icon URL
- **THEN** the system falls back to TheSportsDB badge URL

### Requirement: League icon component
The system SHALL provide a reusable `LeagueIcon` component that renders league icons at specified sizes.

#### Scenario: League icon component usage
- **WHEN** a developer uses the `LeagueIcon` component
- **THEN** the icon renders at the specified size with consistent styling

#### Scenario: League icon sizes
- **WHEN** the component is used with size prop "sm" | "md" | "lg"
- **THEN** the icon renders at 24px, 48px, or 96px respectively

### Requirement: League icons stored in configuration
The system SHALL store league icon URLs in a TypeScript configuration file (`lib/league-icons.ts`) rather than in the database.

#### Scenario: Icon configuration
- **WHEN** the application needs to display a league icon
- **THEN** it reads the URL from the static configuration file
