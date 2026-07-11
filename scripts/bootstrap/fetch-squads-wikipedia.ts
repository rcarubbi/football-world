import { getTursoClient } from "../../src/lib/turso/client";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const COUNTRY_MAP: Record<string, string> = {
  ALB: "Albania", AND: "Andorra", ARG: "Argentina", ARM: "Armenia",
  AUS: "Australia", AUT: "Austria", AZE: "Azerbaijan", BEL: "Belgium",
  BIH: "Bosnia and Herzegovina", BLR: "Belarus", BOL: "Bolivia",
  BRA: "Brazil", BUL: "Bulgaria", CAN: "Canada", CHI: "Chile",
  CHN: "China", COL: "Colombia", CRC: "Costa Rica", CRO: "Croatia",
  CUB: "Cuba", CYP: "Cyprus", CZE: "Czech Republic", DEN: "Denmark",
  ECU: "Ecuador", EGY: "Egypt", ENG: "England", ESP: "Spain",
  EST: "Estonia", FIN: "Finland", FRA: "France", GEO: "Georgia",
  GER: "Germany", GHA: "Ghana", GRE: "Greece", GUA: "Guatemala",
  HAI: "Haiti", HON: "Honduras", HUN: "Hungary", IDN: "Indonesia",
  IRL: "Republic of Ireland", IRN: "Iran", IRQ: "Iraq", ISL: "Iceland",
  ISR: "Israel", ITA: "Italy", JAM: "Jamaica", JPN: "Japan",
  KAZ: "Kazakhstan", KOR: "South Korea", KOS: "Kosovo", LAT: "Latvia",
  LIT: "Lithuania", LUX: "Luxembourg", MAR: "Morocco", MEX: "Mexico",
  MLI: "Mali", MNE: "Montenegro", NED: "Netherlands", NGA: "Nigeria",
  NIR: "Northern Ireland", NOR: "Norway", PAN: "Panama", PAR: "Paraguay",
  PER: "Peru", PHI: "Philippines", POL: "Poland", POR: "Portugal",
  QAT: "Qatar", ROU: "Romania", RUS: "Russia", KSA: "Saudi Arabia",
  SCO: "Scotland", SEN: "Senegal", SRB: "Serbia", SVK: "Slovakia",
  SVN: "Slovenia", SWE: "Sweden", SWI: "Switzerland", TUR: "Turkey",
  UKR: "Ukraine", URU: "Uruguay", USA: "United States", UZB: "Uzbekistan",
  VEN: "Venezuela", WAL: "Wales", ZAM: "Zambia",
  // common Wikipedia variants
  "GBR": "England",
};

function parseFsPlayers(wikitext: string): Array<{
  no: string; pos: string; nat: string; name: string;
}> {
  const players: Array<{ no: string; pos: string; nat: string; name: string }> = [];
  const regex = /\{\{Fs player\|([^}]*)\}\}/gi;
  let match;
  while ((match = regex.exec(wikitext)) !== null) {
    const params: Record<string, string> = {};
    for (const part of match[1].split("|")) {
      const eq = part.indexOf("=");
      if (eq > 0) {
        params[part.substring(0, eq).trim()] = part.substring(eq + 1).trim();
      }
    }
    let name = params.name || "";
    // strip wiki links: [[Target|Display]] → Display, [[Name]] → Name
    name = name.replace(/\[\[[^\]]*\|([^\]]*)\]\]/g, "$1");
    name = name.replace(/\[\[([^\]]*)\]\]/g, "$1");
    name = name.trim();
    if (!name) continue;

    players.push({
      no: params.no || "",
      pos: params.pos || "",
      nat: params.nat || "",
      name,
    });
  }
  return players;
}

function normalizePos(pos: string): string {
  const p = pos.toUpperCase();
  if (p === "GK") return "Goalkeeper";
  if (p === "DF") return "Defender";
  if (p === "MF") return "Midfielder";
  if (p === "FW") return "Attacker";
  return pos;
}

async function fetchJson(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    const r = await fetch(url);
    if (r.status === 429) {
      const wait = Math.pow(2, i + 1) * 5000; // 10s, 20s, 40s
      console.log(`      Rate limited, waiting ${wait / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, wait));
      continue;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }
  throw new Error("Max retries exceeded");
}

async function searchWikipediaSeasonPage(teamName: string): Promise<string | null> {
  const year = new Date().getFullYear();
  // Try current season first, then previous
  for (const suffix of [`${year-1}\u2013${year % 100}`, `${year}\u2013${(year+1) % 100}`]) {
    for (const teamVariant of [teamName, teamName.replace(/ FC$/, "").replace(/ CF$/, "")]) {
      const pageTitle = `${suffix} ${teamVariant} season`;
      const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json`;
      const d = await fetchJson(url);
      if (d.parse?.sections) {
        const hasPlayers = d.parse.sections.some((s: any) =>
          s.line?.toLowerCase() === "players" || s.line?.toLowerCase() === "squad"
        );
        if (hasPlayers) {
          // Find the players section index
          const playerSection = d.parse.sections.find((s: any) =>
            s.line?.toLowerCase() === "players" || s.line?.toLowerCase() === "squad"
          );
          return `${suffix} ${teamVariant} season|${playerSection.index}`;
        }
      }
    }
  }
  return null;
}

async function fetchPlayersFromWikipedia(
  client: ReturnType<typeof getTursoClient>,
  team: { id: number | bigint; name: string },
  playersSaved: { value: number }
): Promise<boolean> {
  console.log(`    Searching Wikipedia for ${team.name} squad...`);

  const pageResult = await searchWikipediaSeasonPage(team.name);
  if (!pageResult) {
    console.log(`    No season page found`);
    return false;
  }

  const [pageTitle, sectionIndex] = pageResult.split("|");
  console.log(`    Found page: ${pageTitle}, section: ${sectionIndex}`);

  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&section=${sectionIndex}&format=json`;
  const d = await fetchJson(url);
  const wikitext = d.parse?.wikitext?.["*"] || "";

  const players = parseFsPlayers(wikitext);
  if (players.length === 0) {
    console.log(`    No players found in section`);
    return false;
  }

  for (const p of players) {
    const nationality = COUNTRY_MAP[p.nat] || p.nat;
    await client.execute({
      sql: `INSERT INTO players (
        name, slug, team_id, position, nationality
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        position = COALESCE(excluded.position, players.position),
        nationality = COALESCE(excluded.nationality, players.nationality),
        updated_at = datetime('now')`,
      args: [
        p.name,
        slugify(p.name),
        team.id,
        normalizePos(p.pos),
        nationality,
      ],
    });
    playersSaved.value++;
  }

  console.log(`    ${players.length} players saved from Wikipedia`);
  return true;
}

export async function fetchSquadsWikipedia(): Promise<void> {
  const client = getTursoClient();
  const teams = await client.execute({
    sql: `SELECT id, name, league_slug FROM teams ORDER BY league_slug, name`,
    args: [],
  });

  let teamsProcessed = 0;
  const playersSaved = { value: 0 };
  let skipped = 0;
  let failed = 0;

  for (const team of teams.rows) {
    // Skip teams that already have players
    const existing = await client.execute({
      sql: `SELECT COUNT(*) as n FROM players WHERE team_id = ?`,
      args: [team.id],
    });
    if ((existing.rows[0].n as number) > 0) {
      skipped++;
      continue;
    }

    try {
      const success = await fetchPlayersFromWikipedia(
        client,
        { id: team.id as number, name: team.name as string },
        playersSaved
      );
      if (success) teamsProcessed++;
      else failed++;
    } catch (error) {
      console.error(`    Error: ${(error as Error).message}`);
      failed++;
    }

    // Delay between requests to be polite (1s base + random jitter)
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));
  }

  console.log(
    `\n  Done: ${teamsProcessed} teams with players, ${failed} failed, ${skipped} skipped, ${playersSaved.value} total players saved`
  );
}
