## ADDED Requirements

### Requirement: Physics-based football object
The homepage SHALL include an interactive football that responds to physics.

#### Scenario: Ball interaction
- **WHEN** user clicks/drags the football
- **THEN** it rolls, bounces, and collides with other objects realistically

#### Scenario: Ball idle animation
- **WHEN** no interaction
- **THEN** the football gently bounces or rolls on a surface

### Requirement: Team badge physics
Team badges on the team page SHALL animate with physics when the page loads.

#### Scenario: Badge drop animation
- **WHEN** team page loads
- **THEN** squad member badges drop from above and land in grid positions with realistic physics

### Requirement: Physics performance
Physics simulation SHALL be disabled when prefers-reduced-motion is active.

#### Scenario: Reduced motion
- **WHEN** user has prefers-reduced-motion
- **THEN** objects appear in final positions without physics animation
