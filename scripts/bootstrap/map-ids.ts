import * as fs from "fs";
import { findAllTeams, upsertTeam } from "../../src/lib/db/teams";

interface TeamOverrides {
  [key: string]: {
    football_data_id?: string;
    apifootball_id?: string;
  };
}

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(fc|cf|sc|ac|as|ss|rc|cd|ud|sd|sv|sk|hk|fk|pk|mk|ok|bk|ik|ff|if|gf|jf|kf|vf|wf|zf)\b/gi, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function loadOverrides(): TeamOverrides {
  try {
    if (fs.existsSync("team-overrides.json")) {
      return JSON.parse(fs.readFileSync("team-overrides.json", "utf-8"));
    }
  } catch {}
  return {};
}

export async function mapIds(): Promise<void> {
  const teams = await findAllTeams();
  const overrides = loadOverrides();

  // Group teams by normalized name for fuzzy matching
  const teamsByName = new Map<string, typeof teams>();
  for (const team of teams) {
    const normalizedName = normalizeTeamName(team.name);
    if (!teamsByName.has(normalizedName)) {
      teamsByName.set(normalizedName, []);
    }
    teamsByName.get(normalizedName)!.push(team);
  }

  // Apply overrides
  for (const [teamName, override] of Object.entries(overrides)) {
    const team = teams.find(
      (t) => t.name.toLowerCase() === teamName.toLowerCase()
    );
    if (team) {
      await upsertTeam({
        id: team.id,
        thesportsdb_id: team.thesportsdb_id,
        name: team.name,
        slug: team.slug,
        football_data_id: override.football_data_id || team.football_data_id,
        apifootball_id: override.apifootball_id || team.apifootball_id,
        league_slug: team.league_slug,
      });
    }
  }

  // Log unmatched teams for manual review
  const unmatchedTeams = teams.filter(
    (t) => !t.football_data_id && !t.apifootball_id
  );
  if (unmatchedTeams.length > 0) {
    console.log(`  ${unmatchedTeams.length} teams without cross-API IDs`);
    console.log("  Consider adding entries to team-overrides.json");
  }
}
