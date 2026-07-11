## 1. Project Setup

- [x] 1.1 Initialize Next.js 14+ project with TypeScript, App Router, Tailwind CSS
- [x] 1.2 Install dependencies: `@libsql/client`, `cheerio`, `p-queue`, `lucide-react`, `next-themes`, `marked`
- [x] 1.3 Configure `.env.local` with API keys: `THESPORTSDB_API_KEY`, `FOOTBALLDATA_API_KEY`, `APIFOOTBALL_KEY`, `YOUTUBE_API_KEY`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- [x] 1.4 Create `turso/client.ts` — Turso connection singleton
- [x] 1.5 Create `turso/schema.ts` — SQL schema definitions (teams, players, player_honours, player_former_teams, league_standings, matches, match_lineups, top_scorers, transfers, videos)
- [x] 1.6 Create `turso/seed.ts` — Schema initialization function (CREATE TABLE IF NOT EXISTS)
- [x] 1.7 Define league constants: league slugs, API IDs for all 4 APIs, football-data.org codes

## 2. API Clients

- [x] 2.1 Create `lib/api/sportsdb.ts` — TheSportsDB client with rate limiting (30 req/min), retry logic
- [x] 2.2 Create `lib/api/football-data.ts` — football-data.org client with rate limiting (10 req/min), auth header
- [x] 2.3 Create `lib/api/api-football.ts` — API-Football client with rate limiting (10 req/min, 100/day counter)
- [x] 2.4 Create `lib/api/youtube.ts` — YouTube Data API v3 client with rate limiting (100 units/day budget), search endpoint
- [x] 2.5 Create `lib/api/rate-limiter.ts` — Shared rate limiter using p-queue

## 3. Turso Data Layer

- [x] 3.1 Create `lib/db/teams.ts` — CRUD for teams table (upsert, findBySlug, findByLeague, findAll)
- [x] 3.2 Create `lib/db/players.ts` — CRUD for players table (upsert, findBySlug, findByTeam, findAll)
- [x] 3.3 Create `lib/db/standings.ts` — CRUD for league_standings (upsert, findByLeague)
- [x] 3.4 Create `lib/db/matches.ts` — CRUD for matches (upsert, findByTeam, findByLeague, findUpcoming, findRecent)
- [x] 3.5 Create `lib/db/top-scorers.ts` — CRUD for top_scorers (upsert, findByLeague)
- [x] 3.6 Create `lib/db/transfers.ts` — CRUD for transfers (upsert, findRecent)
- [x] 3.7 Create `lib/db/lineups.ts` — CRUD for match_lineups (upsert, findByMatch)
- [x] 3.8 Create `lib/db/videos.ts` — CRUD for videos table (upsert, findByTeam, findByLeague, findRecent)

## 4. Bootstrap Script — TheSportsDB

- [x] 4.1 Create `scripts/bootstrap/index.ts` — Main orchestrator with progress tracking and resumability
- [x] 4.2 Create `scripts/bootstrap/fetch-teams.ts` — Fetch all teams per league from TheSportsDB (`search_all_teams`)
- [x] 4.3 Create `scripts/bootstrap/fetch-team-details.ts` — Fetch team details (`lookupteam`) for each team
- [x] 4.4 Create `scripts/bootstrap/fetch-squads.ts` — Fetch player lists (`lookup_all_players`) for each team
- [x] 4.5 Create `scripts/bootstrap/map-ids.ts` — Fuzzy name matching to map team IDs across APIs
- [x] 4.6 Create `scripts/bootstrap/team-overrides.json` — Manual ID mapping for edge cases

## 5. Bootstrap Script — football-data.org

- [x] 5.1 Create `scripts/bootstrap/fetch-standings.ts` — Fetch standings for all 8 leagues
- [x] 5.2 Create `scripts/bootstrap/fetch-fixtures.ts` — Fetch fixtures for all 8 leagues

## 6. Bootstrap Script — Wikipedia

- [x] 6.1 Create `scripts/bootstrap/scrape-wikipedia.ts` — Cheerio-based Wikipedia scraper for team history
- [x] 6.2 Create `scripts/bootstrap/wiki-selectors.ts` — CSS selectors for Wikipedia page parsing (history section, stadium info)
- [x] 6.3 Implement HTML-to-Markdown conversion for scraped content
- [x] 6.4 Implement disambiguation page detection and resolution

## 7. Bootstrap Script — YouTube

- [x] 7.1 Create `scripts/bootstrap/fetch-videos.ts` — Search YouTube for team highlight videos (top 5 per team)
- [x] 7.2 Implement YouTube quota management (80 searches/day spread over 2 days)
- [x] 7.3 Filter results by duration (3-10 min) and view count

## 8. Bootstrap Script — Write to Turso

- [x] 8.1 Create `scripts/bootstrap/seed-turso.ts` — Write all fetched data to Turso (teams, players, standings, fixtures, Wikipedia content, videos)
- [x] 8.2 Add `npm run bootstrap` script to package.json
- [x] 8.3 Test full bootstrap run end-to-end

## 9. Daily Cron Job

- [x] 9.1 Create `app/api/cron/refresh/route.ts` — Vercel cron endpoint
- [x] 9.2 Implement standings refresh (football-data.org, 8 leagues)
- [x] 9.3 Implement fixtures refresh (football-data.org, 8 leagues)
- [x] 9.4 Implement top scorers refresh (API-Football, 8 leagues)
- [x] 9.5 Implement transfers refresh (API-Football, 8 leagues)
- [x] 9.6 Implement video highlights refresh (YouTube, 8 leagues)
- [x] 9.7 Add cron schedule to `vercel.json` (6 AM UTC daily)

## 10. Layout and Navigation

- [x] 10.1 Create `app/layout.tsx` — Root layout with header, nav, footer, ThemeProvider
- [x] 10.2 Create `components/Navbar.tsx` — Navigation bar with links to Leagues, Teams, dark mode toggle
- [x] 10.3 Create `components/Footer.tsx` — Footer with API attribution
- [x] 10.4 Create `components/LeagueBadge.tsx` — Reusable league badge component
- [x] 10.5 Create `components/TeamBadge.tsx` — Reusable team badge component
- [x] 10.6 Create `components/ui/Button.tsx` — Button component with design tokens
- [x] 10.7 Create `components/ui/Card.tsx` — Card component with design tokens
- [x] 10.8 Create `components/ui/Table.tsx` — Table component with design tokens
- [x] 10.9 Create `components/ui/Badge.tsx` — Badge component with design tokens
- [x] 10.10 Create `components/ui/Modal.tsx` — Modal component for video embeds

## 11. Design System Setup

- [x] 11.1 Install Google Fonts (Barlow + Barlow Condensed) in `app/layout.tsx`
- [x] 11.2 Configure Tailwind with design tokens: colors (primary, accent, background, foreground), typography scale, spacing scale
- [x] 11.3 Create `tailwind.config.ts` with extended theme (Barlow fonts, blue/amber palette)
- [x] 11.4 Create `components/ThemeProvider.tsx` — next-themes provider with system/light/dark modes
- [x] 11.5 Create `components/ThemeToggle.tsx` — Dark mode toggle button
- [x] 11.6 Ensure all components use semantic color tokens (no raw hex)
- [x] 11.7 Add `prefers-reduced-motion` support to animations
- [x] 11.8 Test responsive layouts at 375px, 768px, 1024px, 1440px

## 12. Home Page

- [x] 12.1 Create `app/page.tsx` — Homepage with featured leagues grid, latest results, upcoming highlights
- [x] 12.2 Create `components/LeagueCard.tsx` — League card with badge, name, link to overview

## 13. Team Pages

- [x] 13.1 Create `app/teams/page.tsx` — Team list page with league filter
- [x] 13.2 Create `app/teams/[slug]/page.tsx` — Team wiki page with ISR (24h revalidation)
- [x] 13.3 Create `components/TeamHero.tsx` — Hero section with badge, name, stadium, founded year
- [x] 13.4 Create `components/TeamDescription.tsx` — Wikipedia-enriched content renderer (Markdown to HTML)
- [x] 13.5 Create `components/SquadTable.tsx` — Current squad table with player links
- [x] 13.6 Create `components/RecentResults.tsx` — Last 5 match results
- [x] 13.7 Create `components/UpcomingFixtures.tsx` — Next 5 fixtures
- [x] 13.8 Create `components/TeamHonours.tsx` — Honours grouped by category
- [x] 13.9 Create `components/KitDisplay.tsx` — Home/away/third kit images
- [x] 13.10 Create `components/VideoGrid.tsx` — YouTube video grid (responsive: 1/2/3 columns)
- [x] 13.11 Create `components/VideoModal.tsx` — YouTube iframe modal for video playback

## 14. League Pages

- [x] 14.1 Create `app/leagues/page.tsx` — League list page (all 8 leagues)
- [x] 14.2 Create `app/leagues/[slug]/page.tsx` — League overview page with ISR (24h revalidation)
- [x] 14.3 Create `components/StandingsTable.tsx` — Full league standings table with form indicators
- [x] 14.4 Create `components/TopScorers.tsx` — Top 10 scorers list
- [x] 14.5 Create `components/LeagueFixtures.tsx` — Upcoming fixtures grouped by matchday
- [x] 14.6 Create `components/LeagueResults.tsx` — Recent results
- [x] 14.7 Create `components/LeagueHighlights.tsx` — Recent match highlight videos

## 15. Player Pages

- [x] 15.1 Create `app/players/[slug]/page.tsx` — Player profile page with ISR (24h revalidation)
- [x] 15.2 Create `components/PlayerHero.tsx` — Photo, name, position, nationality, DOB
- [x] 15.3 Create `components/PlayerStats.tsx` — Career statistics table
- [x] 15.4 Create `components/PlayerHonours.tsx` — Honours list
- [x] 15.5 Create `components/CareerTimeline.tsx` — Visual timeline of former teams
- [x] 15.6 Create `components/PlayerCurrentTeam.tsx` — Current team badge with link

## 16. Utilities and Shared Components

- [x] 16.1 Create `lib/slugify.ts` — Slug generation from team/player names
- [x] 16.2 Create `lib/markdown.ts` — Markdown to HTML renderer (using marked)
- [x] 16.3 Create `lib/date-format.ts` — Date formatting utilities
- [x] 16.4 Create `components/LoadingState.tsx` — Skeleton loading states
- [x] 16.5 Create `components/NotFound.tsx` — Custom 404 page

## 17. Deployment

- [x] 17.1 Configure `vercel.json` with cron schedule
- [ ] 17.2 Set environment variables in Vercel dashboard
- [ ] 17.3 Run bootstrap locally and verify Turso data
- [ ] 17.4 Deploy to Vercel and verify all pages render
- [ ] 17.5 Verify ISR revalidation works correctly
- [ ] 17.6 Verify cron job runs successfully on Vercel
