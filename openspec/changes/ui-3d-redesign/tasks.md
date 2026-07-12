## 1. League Logos

- [ ] 1.1 Download SVG logos from Wikimedia Commons for all 8 leagues to `public/images/leagues/`
- [ ] 1.2 Add `logoUrl` field to `LeagueConfig` interface in `src/lib/leagues.ts`
- [ ] 1.3 Update `LeagueIcon.tsx` to render `<img>` with SVG logo, fallback to text abbreviation
- [ ] 1.4 Update `LeagueCard.tsx` and `LeagueBadge.tsx` to use new logos

## 2. Fix Team Links

- [ ] 2.1 Replace inline standings query in `ligas/[slug]/page.tsx` with `findStandingsByLeague()` function
- [ ] 2.2 Verify team links navigate correctly to `/times/{slug}`

## 3. Interactive Globe

- [ ] 3.1 Install `@react-three/postprocessing`, `postprocessing`, `cannon-es`, `@react-three/cannon`, `gsap`
- [ ] 3.2 Add raycasting to Globe3D with hover glow effect (custom shader or emissive material)
- [ ] 3.3 Add click-to-navigate: map country coordinates to league slugs
- [ ] 3.4 Upgrade particle system to buffer geometry with thousands of animated points
- [ ] 3.5 Add pulsing shader effect using uTime uniform
- [ ] 3.6 Implement performance tier detection (GPU capability, prefers-reduced-motion)

## 4. Post-Processing

- [ ] 4.1 Create PostProcessing component with Bloom + Vignette effects
- [ ] 4.2 Integrate into Globe3D scene
- [ ] 4.3 Add toggle for prefers-reduced-motion

## 5. Hero Full-Viewport

- [ ] 5.1 Restructure homepage hero to full-viewport with 3D as background
- [ ] 5.2 HTML content overlays 3D scene with proper z-indexing
- [ ] 5.3 Ensure responsive layout works on mobile (touch fallbacks)

## 6. Scroll-Driven 3D

- [ ] 6.1 Install GSAP and ScrollTrigger plugin
- [ ] 6.2 Create scroll timeline linking page scroll to camera position
- [ ] 6.3 Add section-triggered 3D transitions (globe → league zoom → content)
- [ ] 6.4 Test scroll performance on mobile devices

## 7. Physics Interactions

- [ ] 7.1 Create PhysicsScene component with cannon-es world
- [ ] 7.2 Add interactive football object on homepage with drag/click physics
- [ ] 7.3 Add team badge drop animation on team pages
- [ ] 7.4 Disable physics when prefers-reduced-motion is active

## 8. Spatial Navigation

- [ ] 8.1 Map league slugs to geographic coordinates on globe
- [ ] 8.2 Add interactive zones (hover glow + name badge)
- [ ] 8.3 Implement camera fly-to animation on zone click
- [ ] 8.4 Add "Back to Globe" navigation from league pages

## 9. Polish & Deploy

- [ ] 9.1 Test all pages render correctly with new 3D components
- [ ] 9.2 Verify performance on low-end devices
- [ ] 9.3 Run build and fix any TypeScript errors
- [ ] 9.4 Deploy to Vercel production
