## Context

The football wiki portal currently aggregates data from 4 APIs (TheSportsDB, football-data.org, API-Football, YouTube) into Turso, serving team, league, and player pages via Next.js ISR. The data pipeline consists of a local bootstrap script and a daily Vercel cron job.

Current limitations:
- World Cup data is configured in `LEAGUES` but the bootstrap script skips international leagues (lines 6-64 of `fetch-teams.ts` check `INTERNATIONAL_LEAGUES` set)
- Transfers table exists in schema with data but no UI renders it
- Match lineups table exists but isn't displayed
- Player data relies solely on TheSportsDB's free tier, which has limited search (returns single hardcoded result)
- League icons use `badge_url` from TheSportsDB which can be missing or low-resolution
- Wikipedia enrichment only covers teams, not players
- No data validation step means incomplete records silently propagate

Vercel Hobby constraints remain: 10s function timeout, 1 cron job, 100GB bandwidth. API rate limits unchanged (football-data.org: 10 req/min, API-Football: 100 req/day, YouTube: 100 searches/day).

## Goals / Non-Goals

**Goals:**
- Render transfer history on team and league pages with season/filter controls
- Display match lineups (starting XI, formation, substitutes) for recent team matches
- Enrich player profiles with Wikipedia career summaries
- Replace TheSportsDB league badges with consistent, high-quality icons
- Complete World Cup data fetching (historical tournaments, national teams)
- Improve player coverage by supplementing TheSportsDB with API-Football squad data
- Add data validation to bootstrap to catch incomplete records early
- Keep all changes within existing API rate limit budgets

**Non-Goals:**
- Real-time transfer news or breaking transfer alerts
- Historical match lineup data (only current season)
- Player statistics from multiple leagues (only current team context)
- Custom image generation for league icons (use existing high-quality sources)
- Migration of existing data (bootstrap re-runs will populate new fields)

## Decisions

### 1. Transfer rendering approach

**Decision**: Show transfers on team pages (bottom section) and a dedicated "Transfers" tab on league pages with season filtering.

**Why**: Transfers are most relevant in team context (fans want to know who joined/left their team). League-level transfers provide market overview. A dedicated tab avoids cluttering the existing standings/top-scorers layout.

**Alternatives considered**:
- Separate `/transfers` page: rejected — adds navigation complexity, transfers are contextual
- Modal popup: rejected — poor mobile UX, no URL sharing

### 2. Match lineup display

**Decision**: Show lineups for last 5 matches in team page's "Recent Results" section as expandable cards.

**Why**: Lineups are directly tied to specific matches fans just viewed. Expandable cards keep the default view clean while making detailed data accessible. Limiting to 5 matches avoids excessive API calls and DB queries.

**Alternatives considered**:
- Dedicated lineups section: rejected — duplicates match information
- Separate `/matches/{id}` pages: rejected — adds routing complexity for minimal benefit
- Show all match lineups: rejected — too much data, performance impact

### 3. Player Wikipedia enrichment

**Decision**: Scrape Wikipedia during bootstrap for players who are top scorers or have 50+ appearances, storing career summary as Markdown in a new `career_summary` column on `players` table.

**Why**: Full Wikipedia scraping for all 3000+ players would be too slow and hit Wikipedia's rate limits. Focusing on notable players (top scorers, high-appearance) provides the most value. Career summary (not full article) keeps storage manageable.

**Alternatives considered**:
- Scrape all players: rejected — 3000+ Wikipedia requests, rate limiting issues
- Use TheSportsDB descriptions: rejected — often missing or low quality
- AI-generated summaries: rejected — hallucination risk, ongoing cost

### 4. League icon strategy

**Decision**: Create a `league-icons.ts` mapping with curated icon URLs from official league sources or Wikipedia Commons, with fallback to TheSportsDB badge.

**Why**: TheSportsDB badges are inconsistently sized and sometimes missing. Official league icons from Wikipedia Commons are high-quality, consistently styled, and freely available. Hardcoded mapping is simpler than dynamic fetching and ensures consistency.

**Alternatives considered**):
- Fetch from football-data.org: rejected — doesn't provide league logos
- Generate SVG icons: rejected — design effort outside scope
- Use only TheSportsDB: rejected — quality too inconsistent

### 5. World Cup data pipeline

**Decision**: Extend bootstrap to fetch World Cup data from football-data.org (historical seasons) and TheSportsDB (national teams), storing in dedicated tables (`world_cups`, `world_cup_matches`, `world_cup_teams`).

**Why**: football-data.org has historical World Cup data going back to 2006. TheSportsDB has national team details. Dedicated tables avoid polluting the domestic league schema. The bootstrap already handles multiple data sources sequentially.

**Alternatives considered**:
- Use API-Football: rejected — 100 req/day limit makes bulk historical fetch impossible
- Manual data entry: rejected — doesn't scale
- Skip historical data: rejected — World Cup history is major fan interest

### 6. Player data supplement

**Decision**: During bootstrap, after fetching from TheSportsDB, use API-Football's `/players` endpoint to fill missing player data (photo, nationality, position) for teams where TheSportsDB returned incomplete squads.

**Why**: API-Football has the most complete player database but is limited to 100 req/day. Using it only as a fallback for missing data keeps within budget while improving coverage. The bootstrap runs locally so quota management is straightforward.

**Alternatives considered**):
- Use API-Football as primary source: rejected — 100 req/day insufficient for 160 teams
- Skip missing players: rejected — leaves gaps in squad tables
- Use football-data.org player endpoint: rejected — limited player data on free tier

### 7. Data validation approach

**Decision**: Add a `validate.ts` step at the end of bootstrap that checks for: missing slugs, empty descriptions, orphaned foreign keys, duplicate records, and teams with zero players. Output a validation report with warnings and errors.

**Why**: Silent data quality issues compound over time. A validation step catches problems early before they affect users. Running at bootstrap end ensures all data is present for cross-table checks. Warnings don't block bootstrap (some data gaps are expected) but errors indicate real problems.

**Alternatives considered**):
- Skip validation: rejected — data quality issues accumulate
- Validate on read: rejected — adds latency to page renders
- External validation tool: rejected — adds complexity for minimal benefit

## Risks / Trade-offs

**[Risk] API-Football quota exhaustion during bootstrap** → Mitigation: Track API-Football calls in bootstrap; if approaching 80/day limit, skip player supplementation and log for next day. Bootstrap is resumable.

**[Risk] Wikipedia rate limiting during player enrichment** → Mitigation: Add 1-second delay between Wikipedia requests. Focus only on top 50 players per league (max 400 total). If rate limited, skip remaining and continue.

**[Risk] League icon URLs become stale** → Mitigation: Use Wikipedia Commons URLs which are stable. Add fallback chain: custom URL → TheSportsDB badge → placeholder icon. Monitor via validation step.

**[Risk] World Cup historical data incomplete** → Mitigation: football-data.org only has data from 2006. Document this limitation. Fetch all available seasons, don't attempt to fill gaps.

**[Risk] Transfer data accuracy** → Mitigation: API-Football transfer data is crowd-sourced and can have errors. Display transfer type (loan/permanent/free) and fee (when available) without verifying accuracy. Add "last updated" timestamp.

**[Trade-off] Player enrichment limited to notable players** → 3000+ players won't get Wikipedia content. Acceptable because casual fans primarily care about star players. Can expand coverage later.

**[Trade-off] World Cup data only from 2006** → Historical data before 2006 not available from free APIs. Documented limitation. Fans wanting pre-2006 data must use other sources.

**[Trade-off] Lineups only for last 5 matches** → Older match lineups not displayed. Acceptable because lineups change frequently and recent matches are most relevant.
