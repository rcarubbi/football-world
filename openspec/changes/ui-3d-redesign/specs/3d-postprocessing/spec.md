## ADDED Requirements

### Requirement: Bloom post-processing
The 3D scene SHALL apply bloom/glow effects to bright elements (gold particles, highlights).

#### Scenario: Bloom renders
- **WHEN** the 3D scene is visible
- **THEN** bright elements (gold accents, light sources) have a subtle glow effect

### Requirement: Vignette effect
The 3D scene SHALL apply a vignette (darkened edges) for cinematic feel.

#### Scenario: Vignette renders
- **WHEN** the 3D scene is visible
- **THEN** screen edges are subtly darkened

### Requirement: Post-processing toggle
Post-processing effects SHALL be disabled when prefers-reduced-motion is active.

#### Scenario: Reduced motion
- **WHEN** user has prefers-reduced-motion enabled
- **THEN** no post-processing effects are applied
