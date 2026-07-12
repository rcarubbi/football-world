## Context

The football-world site is a Next.js 16 app with Turso DB, R3F (Three.js React Fiber), and Tailwind CSS. Current state:
- League icons: text abbreviations (PL, LL) in colored boxes, no real logos
- Team links in rankings: broken due to missing JOIN in inline query
- 3D: single passive spinning globe (Globe3D.tsx) with 200 static particles, no interaction
- Design system: Vibrant & Block-based, Russo One + Chakra Petch fonts

Reference projects: Bruno Simon (physics-driven car portfolio), Three.js Journey (scroll animations, shaders, post-processing).

## Goals / Non-Goals

**Goals:**
- Official SVG league logos replacing text abbreviations
- Working team links from league standings to team pages
- Interactive 3D globe with raycasting, hover effects, click-to-navigate
- Animated particle systems (thousands of points via buffer geometry)
- Post-processing effects (bloom, vignette) for cinematic quality
- Full-viewport hero with 3D as primary background
- Scroll-driven camera animation synchronized with HTML content
- Physics-based interactive objects (football, team badges)
- 3D spatial navigation between league zones

**Non-Goals:**
- Multiplayer/real-time features (Bruno Simon 2025)
- Custom GLSL shaders (Three.js Journey advanced) — use R3F materials + postprocessing
- Blender model pipeline — use procedural geometry + existing assets
- Mobile app — web only, with touch fallbacks

## Decisions

### D1: League logos — Download SVGs from Wikimedia Commons, store locally
**Why**: SVGs are vector (crisp at any size), tiny (3-30KB), no runtime API dependency, no rate limits.
**Alternatives considered**:
- football-data.org PNG URLs: simpler but PNG-only, external dependency
- TheSportsDB URLs: hash-based opaque URLs, CDN dependency
- Generate SVGs programmatically: too complex for 8 leagues

### D2: Team links — Use findStandingsByLeague() function
**Why**: Already implements the correct JOIN query. Inline query in page.tsx duplicates logic without the JOIN.
**Alternatives considered**:
- Fix inline query directly: works but creates duplicate query maintenance

### D3: 3D stack — R3F + cannon-es + postprocessing + GSAP
**Why**: R3F already in use. cannon-es is the standard physics engine for R3F. postprocessing integrates seamlessly. GSAP is the gold standard for scroll animations.
**Alternatives considered**:
- Rapier (WASM physics): faster but more complex setup, cannon-es sufficient for this scope
- Three.js native ScrollControls: less control than GSAP ScrollTrigger

### D4: Globe interaction — Raycaster with custom hover shader
**Why**: R3F's built-in pointer events + raycasting is the simplest path. Custom shader for glow effect on hover.
**Alternatives considered**:
- HTML overlay for hover info: breaks immersion
- Full 3D UI (Bruno Simon style): too complex for first iteration

### D5: Performance — Feature detection + reduced motion respect
**Why**: 3D scenes are GPU-intensive. Must degrade gracefully on low-end devices.
**Approach**: 
- Check `prefers-reduced-motion` → disable animations
- Check GPU capability → reduce particle count, disable postprocessing
- Lazy load 3D components with `next/dynamic`

## Risks / Trade-offs

- **[Performance on low-end devices]** → Implement quality tiers (low/medium/high), auto-detect, allow manual override
- **[Wikimedia URLs may change]** → Download and store locally, not hotlink
- **[cannon-es bundle size]** → ~50KB gzipped, lazy load only when physics needed
- **[GSAP license]** → Free for non-commercial, check license for production
- **[Scroll jank]** → Use requestAnimationFrame, throttle scroll handlers, test on mobile
- **[Accessibility]** → Respect prefers-reduced-motion, provide non-3D fallbacks, ensure keyboard navigation
