## ADDED Requirements

### Requirement: League zones on globe
Each league SHALL be represented as an interactive zone on the 3D globe.

#### Scenario: Zone visibility
- **WHEN** globe renders
- **THEN** each league's geographic region is highlighted as a clickable zone

#### Scenario: Zone hover
- **WHEN** user hovers over a league zone
- **THEN** zone glows and shows league name badge in 3D

### Requirement: Camera transition between zones
Clicking a league zone SHALL trigger a camera fly-to animation.

#### Scenario: Navigate to league
- **WHEN** user clicks a league zone on the globe
- **THEN** camera smoothly flies to that region, then navigates to the league page

### Requirement: Spatial navigation from league pages
League pages SHALL have a "Back to Globe" button that returns to the 3D view.

#### Scenario: Return to globe
- **WHEN** user clicks "Back to Globe" on a league page
- **THEN** app navigates to homepage with globe centered on the previously viewed region
