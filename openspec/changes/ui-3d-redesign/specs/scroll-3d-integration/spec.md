## ADDED Requirements

### Requirement: Full-viewport hero 3D
The homepage hero section SHALL display the 3D globe as a full-viewport background.

#### Scenario: Globe fills hero
- **WHEN** homepage loads
- **THEN** the 3D globe occupies the full viewport height, with HTML content overlaying it

### Requirement: Scroll-driven camera
Camera position SHALL animate based on scroll position.

#### Scenario: Scroll zoom
- **WHEN** user scrolls down from hero
- **THEN** camera zooms into the globe or transitions to next scene

#### Scenario: Section reveal
- **WHEN** user scrolls past a section boundary
- **THEN** 3D scene transitions (camera path, object visibility, lighting change)

### Requirement: GSAP ScrollTrigger integration
Scroll animations SHALL use GSAP ScrollTrigger for precise timing.

#### Scenario: Scroll timeline
- **WHEN** user scrolls through the page
- **THEN** 3D animations are synchronized with scroll position via GSAP timeline
