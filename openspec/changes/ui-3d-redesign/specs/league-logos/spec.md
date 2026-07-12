## ADDED Requirements

### Requirement: Official league logo display
The LeagueIcon component SHALL render official SVG league logos instead of text abbreviations.

#### Scenario: Logo renders for known league
- **WHEN** LeagueIcon receives a valid league slug (e.g., "premier-league")
- **THEN** it renders the official SVG logo from `public/images/leagues/{slug}.svg`

#### Scenario: Fallback for unknown league
- **WHEN** LeagueIcon receives an unrecognized slug
- **THEN** it renders a default football icon or the text abbreviation fallback

### Requirement: Logo file storage
All league SVG logos SHALL be stored locally in `public/images/leagues/`.

#### Scenario: Logo files exist
- **WHEN** the build completes
- **THEN** `public/images/leagues/` contains SVG files for all 8 configured leagues

### Requirement: League config includes logo path
The LeagueConfig interface SHALL include a `logoUrl` field pointing to the local SVG.

#### Scenario: Logo URL in config
- **WHEN** code accesses `LEAGUES` array
- **THEN** each entry has a `logoUrl` property like `/images/leagues/premier-league.svg`
