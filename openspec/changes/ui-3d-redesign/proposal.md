## Why

The current site has placeholder league icons (text abbreviations), broken team links in rankings, and minimal 3D (a passive spinning globe). To match the quality of reference projects like Bruno Simon's portfolio and Three.js Journey, the site needs official league branding, working navigation, and an immersive interactive 3D experience as the primary interface.

## What Changes

- Replace text-abreviation league icons with official SVG logos from Wikimedia Commons
- Fix broken team links in league standings (inline query → JOIN with teams table)
- Upgrade Globe3D from passive spinner to interactive raycasted object with hover/click
- Add post-processing effects (bloom, vignette) for cinematic feel
- Animate particle systems with buffer geometry (thousands of points)
- Make hero section full-viewport with 3D as primary background
- Add scroll-driven camera animation synchronized with page content
- Integrate cannon-es physics for interactive football objects
- Create 3D spatial navigation between league "zones" on the globe

## Capabilities

### New Capabilities
- `league-logos`: Official SVG league logos, local storage, LeagueIcon component update
- `interactive-globe`: Raycasting, hover effects, click-to-navigate, animated particles, pulsing shader
- `3d-postprocessing`: Bloom, vignette, DOF via @react-three/postprocessing
- `scroll-3d-integration`: Scroll-driven camera paths, section-triggered 3D transitions
- `physics-interactions`: cannon-es physics for football objects, team badge animations
- `spatial-navigation`: 3D zone-based navigation between leagues

### Modified Capabilities
- `league-overview`: Standings query fix (JOIN with teams for slug)

## Impact

- **Files modified**: `src/components/LeagueIcon.tsx`, `src/lib/leagues.ts`, `src/app/ligas/[slug]/page.tsx`, `src/components/three/Globe3D.tsx`, `src/components/three/Globe3DClient.tsx`, `src/app/page.tsx`
- **New files**: `public/images/leagues/*.svg`, `src/components/three/PostProcessing.tsx`, `src/components/three/PhysicsScene.tsx`, `src/components/three/ScrollScene.tsx`
- **New dependencies**: `@react-three/postprocessing`, `postprocessing`, `cannon-es`, `@react-three/cannon`, `gsap`
- **APIs**: football-data.org (emblem URLs), Wikimedia Commons (SVG downloads)
- **Performance**: GPU-intensive 3D scenes require fallback for low-end devices, `prefers-reduced-motion` respect
