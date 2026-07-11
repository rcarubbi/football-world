## Why

The football wiki portal has a solid foundation but several data gaps and rendering limitations reduce its value as a comprehensive reference. World Cup data is partially configured but not fully fetched, transfers and match lineups exist in the database but aren't displayed anywhere, player coverage is incomplete for some teams, and league icons rely solely on TheSportsDB badges which can be low quality or missing. Additionally, the enrichment pipeline only covers teams via Wikipedia — player profiles lack detailed career information. Addressing these gaps will make the portal significantly more useful for football fans seeking complete, accurate information.

## What Changes

- **World Cup data pipeline**: Complete the bootstrap and cron integration for FIFA World Cup data, including historical tournament results and national team information
- **Transfer history rendering**: Display recent transfers on team pages and league pages with player names, fee, date, and transfer type
- **Match lineup display**: Show starting XI and substitutes on team pages for recent matches
- **Player enrichment**: Add Wikipedia-sourced career summaries and biographical data for top players
- **League icon overhaul**: Replace TheSportsDB badges with higher-quality, consistently sized league logos (using football-data.org or custom assets)
- **Missing player recovery**: Improve squad fetching to capture players missed by TheSportsDB's limited free-tier search (supplement with API-Football squad data)
- **New data source**: Integrate football-data.org's player endpoint for detailed player statistics (appearances, goals, assists per season)
- **Data quality checks**: Add validation step to bootstrap that flags incomplete records (missing slugs, empty descriptions, orphaned foreign keys)

## Capabilities

### New Capabilities

- `transfer-history`: Display transfer records on team and league pages with filtering by season and transfer window
- `match-lineups`: Show match lineup data (starting XI, substitutes, formations) on team pages for recent fixtures
- `player-enrichment`: Wikipedia-sourced career summaries and biographical content for player profiles
- `league-icons`: High-quality, consistently styled league logos across the portal
- `world-cup-data`: Complete FIFA World Cup data pipeline including historical tournaments, groups, and knockout stages

### Modified Capabilities

- `data-pipeline`: Add player enrichment step, transfer/lineup fetching, World Cup bootstrap, and data validation
- `team-wiki`: Render transfer history and match lineup sections on team pages
- `league-overview`: Display transfer activity and improved league icon
- `player-profiles`: Enrich with Wikipedia career summaries and career statistics from football-data.org

## Impact

- **New API integration**: football-data.org player endpoints (within existing rate limit budget)
- **Schema additions**: `world_cups`, `world_cup_matches`, `world_cup_teams` tables; `career_summary` column on `players` table
- **Component updates**: Team page, league page, and player profile page receive new sections
- **New components**: `TransferHistory.tsx`, `MatchLineup.tsx`, `LeagueIcon.tsx`, `PlayerBiography.tsx`
- **Bootstrap script updates**: Add player enrichment, transfer fetching, World Cup data fetching, and validation step
- **Cron job expansion**: Add transfer refresh and World Cup data refresh (within existing API budget)
- **Dependency additions**: None — uses existing `cheerio` for Wikipedia scraping and existing API clients
