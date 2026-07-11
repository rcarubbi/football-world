## 1. Schema and Database Updates

- [x] 1.1 Add `career_summary` column to `players` table in schema
- [x] 1.2 Create `world_cups` table (id, year, host_country, winner, runner_up, third_place, fourth_place)
- [x] 1.3 Create `world_cup_matches` table (id, world_cup_id, stage, group_name, home_team, away_team, home_score, away_score, venue, match_date)
- [x] 1.4 Create `world_cup_teams` table (id, world_cup_id, team_name, fifa_code, badge_url, group_name)
- [x] 1.5 Add indices for new tables (world_cup_matches by world_cup_id, world_cup_teams by world_cup_id)

## 2. League Icons Configuration

- [x] 2.1 Create `lib/league-icons.ts` with curated icon URLs for all 8 leagues
- [x] 2.2 Create `LeagueIcon` component with sm/md/lg size props
- [x] 2.3 Update `LeagueBadge` component to use `LeagueIcon` internally
- [x] 2.4 Update league list page to use `LeagueIcon`
- [x] 2.5 Update league overview page header to use `LeagueIcon`

## 3. Transfer History - Data Layer

- [x] 3.1 Create `lib/db/transfers.ts` CRUD functions (findRecentByTeam, findRecentByLeague, findBySeason)
- [x] 3.2 Create `scripts/bootstrap/fetch-transfers.ts` to fetch transfers from API-Football
- [x] 3.3 Add transfer fetch step to bootstrap orchestrator
- [x] 3.4 Add transfer refresh to daily cron job

## 4. Transfer History - UI Components

- [x] 4.1 Create `TransferHistory.tsx` component with season filter
- [x] 4.2 Create `TransferCard.tsx` component showing player, type, fee, date
- [x] 4.3 Add transfer section to team page
- [x] 4.4 Add transfer section to league page with team filter
- [x] 4.5 Style transfer type badges (Permanent/Loan/Free)

## 5. Match Lineups - Data Layer

- [x] 5.1 Create `lib/db/lineups.ts` CRUD functions (findByMatch, findRecentByTeam)
- [x] 5.2 Create `scripts/bootstrap/fetch-lineups.ts` to fetch lineups from API-Football
- [x] 5.3 Add lineup fetch step to bootstrap orchestrator
- [x] 5.4 Add lineup refresh to daily cron job

## 6. Match Lineups - UI Components

- [x] 6.1 Create `MatchLineup.tsx` component with formation display
- [x] 6.2 Create `FormationView.tsx` component arranging players by position
- [x] 6.3 Create `PlayerBench.tsx` component for substitutes
- [x] 6.4 Make `RecentResults.tsx` cards expandable to show lineups
- [x] 6.5 Add lineup data fetching to team page

## 7. Player Enrichment - Data Layer

- [x] 7.1 Create `scripts/bootstrap/enrich-players.ts` for Wikipedia scraping
- [x] 7.2 Add player enrichment step to bootstrap orchestrator
- [x] 7.3 Add player enrichment to daily cron for new top scorers
- [x] 7.4 Update `lib/db/players.ts` to handle career_summary field

## 8. Player Enrichment - UI Components

- [x] 8.1 Create `PlayerBiography.tsx` component rendering Markdown career summary
- [x] 8.2 Create `PlayerStatistics.tsx` component showing season stats
- [x] 8.3 Update player profile page to include biography section
- [x] 8.4 Update player profile page to include statistics section

## 9. World Cup Data - Pipeline

- [x] 9.1 Create `scripts/bootstrap/fetch-world-cup.ts` for football-data.org
- [x] 9.2 Create `scripts/bootstrap/fetch-world-cup-teams.ts` for TheSportsDB
- [x] 9.3 Add World Cup fetch steps to bootstrap orchestrator
- [x] 9.4 Add World Cup refresh to daily cron job

## 10. World Cup Data - UI Components

- [x] 10.1 Create `WorldCupOverview.tsx` component showing tournament history
- [x] 10.2 Create `WorldCupTournament.tsx` component with groups and knockout
- [x] 10.3 Create `WorldCupMatch.tsx` component for individual matches
- [x] 10.4 Update World Cup league page to use new components
- [x] 10.5 Create `/leagues/fifa-world-cup/[year]` dynamic route

## 11. Data Pipeline Validation

- [x] 11.1 Create `scripts/validate.ts` with data quality checks
- [x] 11.2 Add validation step to bootstrap orchestrator
- [x] 11.3 Add `npm run validate` script to package.json
- [x] 11.4 Add validation output formatting (warnings/errors)

## 12. Player Data Supplement

- [x] 12.1 Create `scripts/bootstrap/supplement-players.ts` for API-Football
- [x] 12.2 Add player supplement step to bootstrap orchestrator
- [x] 12.3 Track API-Football quota during supplement
- [x] 12.4 Skip supplementation if quota approaching limit

## 13. Integration and Testing

- [x] 13.1 Update bootstrap orchestrator to include all new steps
- [x] 13.2 Update daily cron to include all new refresh tasks
- [x] 13.3 Test bootstrap end-to-end with new steps
- [x] 13.4 Test cron job with new refresh tasks
- [x] 13.5 Verify all pages render correctly with new data
- [x] 13.6 Test transfer filtering by season and team
- [x] 13.7 Test lineup expansion on team pages
- [x] 13.8 Test World Cup page navigation
