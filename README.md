# Football World

A football wiki built with Next.js 16, React 19, Three.js, and Turso (libSQL). Features a 3D animated stadium background, real-time data from multiple football APIs, and a prioritized cron pipeline that keeps everything fresh.

**Live:** [football-world.vercel.app](https://football-world.vercel.app)

---

## Features

### Pages

| Route | Description |
|---|---|
| `/` | Home — 3D hero, stats counters, recent results, top teams |
| `/leagues` | All leagues grid (Premier League, La Liga, Bundesliga, Serie A, Ligue 1, UCL, World Cup, Brasileirao) |
| `/leagues/[slug]` | League detail — standings with season selector, recent results, upcoming fixtures, top scorers, transfers, videos |
| `/teams` | Searchable team grid |
| `/teams/[slug]` | Team detail — badge, squad with photos, recent results, videos |
| `/players` | Searchable player grid with accent-insensitive search |
| `/players/[slug]` | Player detail — photo, bio, career summary, national team, former clubs, honour |
| `/world-cup` | World Cup hub — year dropdown, group stage tables (A–L), knockout bracket (R32 → Final), podium |
| `/search` | Global search across teams, players, leagues |

### 3D Background

- `ThreeBackground` component using React Three Fiber + Drei + postprocessing
- Animated stadium with rotating ball, goal posts, corner flags, and stadium lights
- Camera presets per route stored in session-only `useRef<Map>` (not persisted)
- WYSIWYG camera editor in dev mode — what you configure is what routes use
- `useRotation` toggle: when true, uses `rotation.set()` + lerp position; when false, uses `lookAt()`

### UI

- Glass morphism design system (`GlassPanel` component, `bg-background/10` opacity)
- Dark/light theme via `next-themes`
- Accent-insensitive search (diacritics stripped via `stripAccents()` + `sqlStripAccents()`)
- Debounced navbar search (400ms, fires on input, no enter required)
- Share button on all pages (Web Share API + clipboard fallback)
- SEO: OG metadata with player photos, team badges, league logos; SVG favicon + PWA manifest

---

## Data Pipeline

### APIs Used

| API | What | Key |
|---|---|---|
| [football-data.org](https://www.football-data.org) | Standings, fixtures, teams, World Cup data | `FOOTBALL_DATA_API_KEY` |
| [API-Football](https://www.api-football.com) | Squads, top scorers, transfers, lineups | `APIFOOTBALL_KEY` |
| [TheSportsDB](https://www.thesportsdb.com) | Player photos, team details, team badges | `THESPORTSDB_API_KEY` |
| [SportsAPIPro](https://sportsapipro.com) | Squad fallback | `SPORTS_API_PRO_KEY` |
| [YouTube Data API](https://developers.google.com/youtube) | Team/league highlight videos | `YOUTUBE_API_KEY` (+ 4 rotation keys) |
| Wikipedia | Player bios, career summaries | (scraped via Cheerio) |

### Bootstrap (`npm run bootstrap`)

Full one-time data import. Runs 15 phases sequentially with progress tracking (`bootstrap-progress.json`):

1. **Teams** — football-data.org standings → `teams` table
2. **Standings** — league tables with season info
3. **Fixtures** — upcoming and recent matches
4. **Wikipedia** — player bios and career summaries (scraped)
5. **Videos** — YouTube highlights per team (F1-filtered, duration-gated)
6. **Squads** — API-Football player rosters
7. **Team details** — TheSportsDB badges, stadiums, locations
8. **Squads (SportsDB)** — TheSportsDB player fallback
9. **Squads (SportsAPIPro)** — SportsAPIPro player fallback
10. **Transfers** — API-Football transfer records
11. **Lineups** — match starting XI and substitutes
12. **Player enrichment** — Wikipedia bios + TheSportsDB photos
13. **Player supplement** — API-Football missing fields
14. **World Cup matches** — football-data.org WC endpoint
15. **World Cup teams** — football-data.org standings → `world_cup_teams`

Each phase saves progress, so re-running resumes from where it left off.

### Cron Refresh (`/api/cron/refresh`)

Runs daily at 06:00 UTC via Vercel Cron. Prioritized pipeline that fills gaps before updating existing data:

| Phase | What | Source |
|---|---|---|
| 1 | Leagues missing teams | football-data.org |
| 2 | Teams missing players | API-Football → TheSportsDB cascading |
| 3 | Players missing photos | TheSportsDB lookup |
| 4 | Players missing bio | Wikipedia via `enrichPlayers()` |
| 5 | Teams missing videos | YouTube highlights |
| 6 | Update existing records | Standings, fixtures, top scorers, transfers, lineups, league videos, World Cup |

Auth: `Bearer ${CRON_SECRET}` header. In dev, set `CRON_SECRET=undefined` to pass auth.

### Data Validation (`npm run validate`)

Checks for missing data: teams without players, players without photos, leagues without standings, etc.

---

## Database

**Turso** (libSQL) — hosted SQLite at `libsql://football-world-rcarubbi.aws-eu-west-1.turso.io`.

### Schema

| Table | Purpose |
|---|---|
| `teams` | Team info (name, slug, badge, stadium, league) |
| `players` | Player info (name, slug, position, nationality, photo, bio) |
| `player_honours` | Individual awards per player |
| `player_former_teams` | Career history per player |
| `league_standings` | Season standings per league |
| `matches` | Fixtures and results |
| `match_lineups` | Starting XI and substitutes per match |
| `top_scorers` | Golden boot rankings per league |
| `transfers` | Transfer records per league |
| `videos` | YouTube videos linked to teams/leagues |
| `world_cups` | World Cup tournament info (year, host, podium) |
| `world_cup_matches` | World Cup fixtures (group stage + knockout) |
| `world_cup_teams` | Participating teams per World Cup edition |

### Indices

Unique constraints on: `league_standings(league_slug, season, position)`, `matches(football_data_id)`, `top_scorers(league_slug, season, player_name)`, `transfers(league_slug, season, player_name)`, `videos(video_id)`.

---

## Project Structure

```
football-world/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/
│   │   │   ├── cron/refresh/   # Daily cron pipeline
│   │   │   ├── players/        # Player search API
│   │   │   └── search/         # Global search API
│   │   ├── leagues/            # League list + detail
│   │   ├── players/            # Player list + detail
│   │   ├── teams/              # Team list + detail
│   │   ├── world-cup/          # World Cup hub with year selector
│   │   ├── search/             # Search page
│   │   ├── page.tsx            # Home page
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Tailwind + theme variables
│   ├── components/
│   │   ├── three/              # Three.js scene, camera, interactions
│   │   ├── ui/                 # GlassPanel, Card, Badge, Table, etc.
│   │   ├── Navbar.tsx          # Debounced search, theme toggle
│   │   ├── Footer.tsx
│   │   ├── ShareButton.tsx     # Web Share API / clipboard
│   │   ├── SeasonSelector.tsx  # League season dropdown
│   │   ├── WorldCupYearSelector.tsx
│   │   └── VideoSection.tsx
│   └── lib/
│       ├── api/                # API clients (football-data, api-football, sportsdb, youtube, bigballs)
│       ├── db/                 # Database helpers (standings, matches, players, etc.)
│       ├── turso/              # Turso client, schema, seed
│       ├── leagues.ts          # League configuration
│       ├── utils.ts            # stripAccents, sqlStripAccents
│       ├── slugify.ts
│       ├── flags.ts            # Country → flag emoji mapping
│       └── date-format.ts
├── scripts/
│   └── bootstrap/              # Full data import pipeline (15 phases)
├── public/                     # Static assets, favicon.svg, manifest.json
├── vercel.json                 # Cron schedule: daily at 06:00 UTC
└── .env.local                  # API keys (not committed)
```

---

## Environment Variables

```env
# Database
TURSO_DATABASE_URL=libsql://football-world-rcarubbi.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=your-turso-token

# Football APIs
FOOTBALL_DATA_API_KEY=your-football-data-key
APIFOOTBALL_KEY=your-api-football-key
THESPORTSDB_API_KEY=1
SPORTS_API_PRO_KEY=your-sportsapipro-key

# YouTube (5 keys for rotation)
YOUTUBE_API_KEY=your-youtube-key
YOUTUBE_API_KEY_2=your-youtube-key-2
YOUTUBE_API_KEY_3=your-youtube-key-3
YOUTUBE_API_KEY_4=your-youtube-key-4
YOUTUBE_API_KEY_5=your-youtube-key-5

# Cron
CRON_SECRET=your-cron-secret
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local   # fill in API keys

# Initialize database schema
npm run bootstrap

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Development server with Turbopack |
| `npm run build` | Production build |
| `npm run bootstrap` | Full data import (resumable) |
| `npm run validate` | Check for missing data |
| `npm run lint` | ESLint |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19, Tailwind CSS 4, shadcn-inspired components
- **3D:** Three.js, React Three Fiber, Drei, postprocessing
- **Database:** Turso (libSQL), `@libsql/client`
- **Deployment:** Vercel (cron jobs, edge functions)
- **Animations:** GSAP
- **Search:** Accent-insensitive, debounced, client + server side

---

## License

Private — not for redistribution.
