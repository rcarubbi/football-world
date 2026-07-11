import { slugify } from "../../src/lib/slugify";
import { upsertTeam } from "../../src/lib/db/teams";
import { LeagueConfig } from "../../src/lib/leagues";

const BASE_URL = "https://api.football-data.org/v4";

async function fetchWithRetry(url: string, retries = 3): Promise<unknown> {
  const apiKey = process.env.FOOTBALLDATA_API_KEY;
  console.log(`    Using API key: ${apiKey?.substring(0, 5)}...`);
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          "X-Auth-Token": apiKey || "",
          "User-Agent": "FootballWiki/1.0",
        },
      });
      if (response.status === 429) {
        const waitTime = Math.pow(2, i) * 60000;
        console.log(`    Rate limited, waiting ${waitTime / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body}`);
      }
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 2000));
    }
  }
  throw new Error("Max retries exceeded");
}

interface FootballDataTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export async function fetchTeamsFromFootballData(league: LeagueConfig): Promise<void> {
  const data = (await fetchWithRetry(
    `${BASE_URL}/competitions/${league.footballDataCode}/standings`
  )) as {
    standings: Array<{
      table: Array<{
        team: FootballDataTeam;
      }>;
    }>;
  };

  const teams = data.standings?.[0]?.table || [];

  for (const entry of teams) {
    const team = entry.team;
    const slug = slugify(team.name);
    await upsertTeam({
      football_data_id: team.id.toString(),
      name: team.name,
      slug,
      short_name: team.shortName,
      badge_url: team.crest,
      league_slug: league.slug,
    });
  }

  console.log(`    Found ${teams.length} teams`);
}
