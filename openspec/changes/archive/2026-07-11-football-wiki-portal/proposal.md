## Why

Build a football wiki portal aggregating data from 4 APIs (TheSportsDB, football-data.org, API-Football, YouTube Data API v3) into a single Next.js application deployed on Vercel Hobby plan. Free API quotas are severely limited (API-Football: 100 req/day, TheSportsDB: search crippled on free tier, YouTube: 10,000 units/day), so the architecture must minimize API calls through aggressive caching in Turso and a local bootstrap script. The portal serves as a reference guide for the world's most popular football leagues with a vibrant, sports-focused UI design.

## What Changes

- **Next.js 14+ app** with App Router, deployed to Vercel Hobby plan
- **Turso (SQLite)** database storing all football data: teams, players, matches, standings, fixtures
- **Local bootstrap script** (Node.js) that fetches initial data from all 4 APIs + scrapes Wikipedia for team histories, writing everything to Turso
- **Daily Vercel cron job** refreshing standings, fixtures, top scorers, transfers, and video highlights (~56 API calls)
- **ISR pages** reading from Turso with 24h revalidation for team/player wiki content, 6h for fixtures
- **8 target leagues**: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, FIFA World Cup, Brasileirão Série A
- **Wikipedia-enriched content**: team histories, stadium info, and notable trophies scraped during bootstrap and stored as Markdown in Turso
- **YouTube video highlights**: match and team highlight videos embedded via YouTube iframe, stored in Turso
- **Vibrant sports UI design**: Barlow Condensed headings + Barlow body, blue/amber color palette, dark mode support, Lucide icons

## Capabilities

### New Capabilities

- `team-wiki`: Team detail pages with badge, description, stadium, kit history, current squad, recent results, upcoming fixtures, and honours — sourced from Turso
- `league-overview`: League hub pages showing standings table, top scorers, fixtures list — data from Turso, refreshed daily via cron
- `player-profiles`: Player detail pages with bio, career stats, honours, former teams timeline — data from Turso
- `data-pipeline`: Bootstrap script (local, one-time) + daily Vercel cron for fetching from TheSportsDB, football-data.org, and API-Football into Turso, respecting free-tier rate limits
- `wikipedia-enrichment`: Wikipedia scraper that runs during bootstrap to enrich team pages with histories and stadium descriptions, stored as Markdown in Turso
- `video-highlights`: YouTube video integration — team highlight reels on wiki pages, match highlights on league pages, stored in Turso and embedded via YouTube iframe
- `ui-design-system`: Vibrant sports-themed UI with Barlow typography, blue/amber palette, dark mode, Lucide icons, responsive design across 375px–1440px

### Modified Capabilities

(none — greenfield project)

## Impact

- **New codebase**: Next.js 14+ with TypeScript, App Router, Tailwind CSS
- **New database**: Turso (libSQL) with schema for teams, players, matches, standings, fixtures, transfers, lineups
- **New dependencies**: `@libsql/client`, `cheerio` (for Wikipedia scraping), `p-queue` (rate limiting in bootstrap), `lucide-react` (icons), `next-themes` (dark mode)
- **Vercel config**: Hobby plan, 1 cron job (daily), ISR revalidation
- **API keys**: TheSportsDB (free key `123`), football-data.org, API-Football, YouTube Data API v3 — stored as env vars, never committed
- **Local dev**: Bootstrap script requires Node.js + `.env.local` with all 4 API keys
