## ADDED Requirements

### Requirement: Interactive globe with raycasting
The Globe3D component SHALL respond to mouse/touch interactions via raycasting.

#### Scenario: Hover effect
- **WHEN** user hovers over the globe
- **THEN** a glow/highlight effect appears under the cursor position on the globe surface

#### Scenario: Click to navigate
- **WHEN** user clicks on a country/region on the globe
- **THEN** the app navigates to the corresponding league page (e.g., England → Premier League)

### Requirement: Animated particle system
The globe scene SHALL include thousands of animated particles using buffer geometry.

#### Scenario: Particle animation
- **WHEN** the globe scene renders
- **THEN** particles orbit the globe with organic sine-wave movement

#### Scenario: Reduced particles on low-end devices
- **WHEN** device GPU capability is low or prefers-reduced-motion is active
- **THEN** particle count reduces to 200 or fewer

### Requirement: Pulsing globe shader
The globe surface SHALL have a pulsing/breathing effect using the time uniform.

#### Scenario: Surface animation
- **WHEN** the globe renders
- **THEN** the surface material subtly pulses (opacity/color variation) driven by uTime

### Requirement: Performance tier detection
The 3D scene SHALL auto-detect device capability and adjust quality.

#### Scenario: Low-end device
- **WHEN** device has low GPU capability or prefers-reduced-motion
- **THEN** disable post-processing, reduce particles, disable auto-rotate

#### Scenario: High-end device
- **WHEN** device has strong GPU
- **THEN** enable full quality: bloom, thousands of particles, smooth animations
