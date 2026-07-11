## Context

Greenfield Next.js football wiki portal aggregating 4 APIs (TheSportsDB, football-data.org, API-Football, YouTube Data API v3) into a single application. The football APIs have severely limited free quotas: API-Football caps at 100 requests/day, TheSportsDB cripples search to a single hardcoded result, and football-data.org limits to 10 req/min with 12 competitions. YouTube Data API provides 10,000 units/day (100 units per search = 100 searches/day). The portal must serve rich wiki content while minimizing API consumption through aggressive caching in Turso (SQLite edge DB).

Vercel Hobby plan constraints: 10s serverless function timeout, 1 cron job, 100GB bandwidth/month, ISR revalidation supported.

Target leagues (8): Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League, FIFA World Cup, Brasileirão Série A.

## Goals / Non-Goals

**Goals:**
- Serve team wiki pages with enriched Wikipedia content from Turso with <200ms TTFB
- Never hit APIs from client-side; all data flows through Turso
- Stay within free-tier API quotas: ~56 calls/day for daily cron, 0 calls for page renders
- Bootstrap ~160 teams + squads + videos in a single local script run (~15 min)
- ISR revalidation: 24h for wiki content, 6h for fixtures, 1h for standings on matchdays
- Human-readable URLs: `/teams/arsenal`, `/players/bukayo-saka`, `/leagues/premier-league`
- Embed YouTube video highlights on team and league pages via iframe (no API call on page load)
- Vibrant sports-themed UI with dark mode, responsive across 375px–1440px

**Non-Goals:**
- Live scores or real-time match updates (free tiers don't support this)
- User authentication or personalization
- Mobile app (responsive web only)
- Admin CMS (content edited directly in Turso or via script)
- Multi-language support (English only for now)
- Betting odds or predictions display

## Decisions

### 1. Turso over Vercel KV or static JSON

**Decision**: Turso (libSQL) as sole data store for all content.

**Why**: Vercel KV free tier (30K commands/month) is too restrictive for a portal with multiple entities per page. Static JSON in the repo means content changes require git commits and redeploy. Turso free tier (1M reads/month, 100K writes/month) comfortably handles wiki traffic and allows content updates without code changes.

**Alternatives considered**:
- Vercel KV: rejected — 30K commands/month insufficient
- Static JSON files: rejected — no content updates without rebuild, repo bloat
- PlanetScale: rejected — no free tier anymore
- Supabase: considered — good free tier but Turso edge replication is faster globally

### 2. Local bootstrap script over Vercel API routes

**Decision**: Node.js script run locally on developer machine, not as Vercel serverless functions.

**Why**: Vercel Hobby has 10s function timeout. Bootstrap makes ~344 API calls sequentially (~3-5 min). Even chunked into steps, the orchestration complexity is unnecessary for a one-time operation. Local script has no timeout, full error handling, and API keys never leave the developer's machine.

**Alternatives considered**:
- Vercel API route with chunked calls: rejected — too complex, timeout constraints
- GitHub Actions: considered — could work but adds CI/CD complexity for a one-time run

### 3. Wikipedia scraping with cheerio over AI enrichment

**Decision**: Use cheerio to scrape Wikipedia pages for team histories, stadium descriptions, and trophy lists.

**Why**: Deterministic, free, no hallucination risk. Wikipedia has comprehensive coverage of all major football clubs. Content is stable (team histories don't change frequently). Cheerio is lightweight and fast for static HTML parsing.

**Alternatives considered**:
- AI-generated content: rejected — hallucination risk, ongoing API cost, review overhead
- Manual content: rejected — doesn't scale to 160 teams
- Wikidata API: considered — structured data but less narrative content

### 4. ISR over purely dynamic server components

**Decision**: ISR with edge caching for all pages. Team/wiki content revalidates every 24h, fixtures every 6h, standings hourly on matchdays.

**Why**: ISR serves pre-rendered HTML from Vercel's edge network, giving fast TTFB globally. Turso queries are still needed for dynamic data but ISR reduces the frequency. On Vercel Hobby, ISR is the recommended pattern for semi-dynamic content.

**Alternatives considered**:
- Pure server components: rejected — adds DB query latency to every request
- Static generation only: rejected — can't refresh without rebuild
- Edge Runtime: considered — Turso client works in Edge, but ISR is simpler

### 5. Single daily cron for all refresh tasks

**Decision**: One Vercel cron job at 6 AM UTC daily, fetching standings + fixtures + top scorers + transfers in a single function.

**Why**: Vercel Hobby allows only 1 cron job. The function can make ~48 API calls within the 10s timeout if we use parallel requests (football-data.org at 10/min, API-Football at 10/min = ~20 parallel). Single function is simpler to debug and deploy.

**Alternatives considered**:
- Multiple cron jobs: not possible on Hobby plan
- Spread across multiple functions: rejected — adds orchestration complexity

### 6. ID mapping via fuzzy name matching during bootstrap

**Decision**: During bootstrap, match team names across APIs using normalized string comparison (lowercase, strip accents, remove common suffixes like "FC", "CF", "SC").

**Why**: Each API uses different team identifiers. TheSportsDB has the richest wiki data but limited search. football-data.org has the most reliable league data. API-Football has the most detailed match data. Mapping IDs at bootstrap time means we only need to match once.

**Alternatives considered**:
- Manual ID mapping: rejected — tedious for 160 teams
- API-Football as primary source: rejected — 100/day limit makes it unsuitable for bootstrap

### 7. YouTube Data API v3 for video highlights

**Decision**: Use YouTube Data API v3 search endpoint to find match and team highlight videos, storing video IDs and metadata in Turso. Videos embedded via YouTube iframe (no API call on page load).

**Why**: TheSportsDB's free tier limits YouTube highlights to 2 calls/day. YouTube Data API v3 provides 10,000 units/day with search costing 100 units = 100 searches/day. This is sufficient for bootstrap (160 team searches over 2 days) and daily cron (8 league searches = 800 units). YouTube iframes are free and don't count against quotas.

**Alternatives considered**:
- TheSportsDB YouTube endpoint: rejected — only 2 calls/day on free tier
- Direct YouTube scraping: rejected — fragile, against ToS
- No video integration: rejected — poor user experience

### 8. Vibrant sports-themed UI design system

**Decision**: Use Barlow Condensed (headings) + Barlow (body) typography with blue/amber color palette, dark mode support, Lucide icons, and responsive design.

**Why**: Barlow is specifically designed for sports/athletic contexts — condensed headings save space in data-rich layouts. Blue primary (#1E40AF) conveys trust and data reliability. Amber accent (#D97706) provides energetic highlights for CTAs and interactive elements. Dark mode reduces eye strain for extended reading. Lucide icons are consistent, lightweight, and sports-appropriate.

**Design tokens**:
- Primary: `#1E40AF` (blue)
- Accent: `#D97706` (amber)
- Background: `#F8FAFC` (slate-50)
- Foreground: `#1E3A8A` (blue-900)
- Typography: Barlow Condensed 400-700 (headings), Barlow 300-700 (body)
- Icons: Lucide React (SVG)
- Spacing: 4/8pt grid system

**Alternatives considered**:
- shadcn/ui default styling: rejected — not sports-themed enough
- Custom CSS: rejected — Tailwind + design tokens is more maintainable
- Material Design: rejected — too generic for sports content

## Risks / Trade-offs

**[Risk] Wikipedia page structure changes** → Mitigation: Cheerio selectors are documented per scrape function. If Wikipedia changes layout, the bootstrap script fails gracefully and logs errors. Content in Turso remains until next successful scrape.

**[Risk] API rate limits change** → Mitigation: All API calls go through a centralized client with configurable rate limits. If limits tighten, we reduce daily cron scope (e.g., skip transfers).

**[Risk] Turso free tier exhaustion** → Mitigation: Monitor via Turso dashboard. ISR reduces read frequency. If approaching limit, increase revalidation intervals (24h → 48h for wiki content).

**[Risk] Team name fuzzy matching fails** → Mitigation: Bootstrap script outputs unmatched teams for manual review. A mapping override file (`team-overrides.json`) handles edge cases like "Man United" vs "Manchester United".

**[Trade-off] Content staleness** → 24h revalidation means data can be up to 1 day old. Acceptable for wiki content (team histories, player bios). Standings can be stale on matchdays if cron runs before matches finish — mitigated by scheduling cron at 6 AM UTC (after most evening matches).

**[Trade-off] Bootstrap runs locally** → Only the developer can refresh full team data. Mitigated by making the daily cron handle all routine updates; bootstrap is truly one-time.

**[Risk] YouTube API quota exhaustion** → Mitigation: Bootstrap spreads team video searches over 2 days (80/day). Daily cron uses ~800 units (8 leagues). On-demand match video searches are capped at 20/day. Monitor via YouTube API console.

**[Risk] YouTube search returns irrelevant videos** → Mitigation: Search queries include team name + "highlights" + season year. Filter results by duration (3-10 min for match highlights) and view count. Manual review of bootstrap results.

**[Risk] UI design system inconsistency** → Mitigation: All design tokens defined in Tailwind config. Components use semantic tokens (e.g., `bg-primary`, `text-accent`). No raw hex values in components. Design system documented in `design-system/MASTER.md`.
