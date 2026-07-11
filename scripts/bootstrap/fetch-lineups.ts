import { getFixtures } from "../../src/lib/api/api-football";
import { LEAGUES } from "../../src/lib/leagues";
import { upsertLineup } from "../../src/lib/db/lineups";
import { getTursoClient } from "../../src/lib/turso/client";

interface ApiFootballFixture {
  fixture: {
    id: number;
    status: { short: string };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  lineups: Array<{
    team: { id: number; name: string };
    formation: string;
    startXI: Array<{
      player: { id: number; name: string; number: number; pos: string };
    }>;
    substitutes: Array<{
      player: { id: number; name: string; number: number; pos: string };
    }>;
  }>;
}

export async function fetchLineups(): Promise<void> {
  const client = getTursoClient();
  const currentSeason = new Date().getFullYear();

  for (const league of LEAGUES) {
    console.log(`  Fetching lineups for ${league.name}...`);

    try {
      const fixtures = (await getFixtures(
        league.apiFootballId,
        currentSeason
      )) as ApiFootballFixture[];

      const finishedFixtures = fixtures.filter(
        (f) => f.fixture.status.short === "FT"
      );

      let count = 0;
      for (const fixture of finishedFixtures.slice(0, 10)) {
        const matchResult = await client.execute({
          sql: "SELECT id FROM matches WHERE apifootball_id = ?",
          args: [fixture.fixture.id.toString()],
        });

        if (matchResult.rows.length === 0) continue;
        const matchId = matchResult.rows[0].id as number;

        for (const lineup of fixture.lineups) {
          for (const player of lineup.startXI) {
            await upsertLineup({
              match_id: matchId,
              team_name: lineup.team.name,
              player_name: player.player.name,
              player_number: player.player.number,
              position: player.player.pos,
              starter: 1,
            });
            count++;
          }

          for (const sub of lineup.substitutes) {
            await upsertLineup({
              match_id: matchId,
              team_name: lineup.team.name,
              player_name: sub.player.name,
              player_number: sub.player.number,
              position: sub.player.pos,
              starter: 0,
            });
            count++;
          }
        }
      }

      console.log(`  Found ${count} lineup entries`);
    } catch (error) {
      console.error(`  Error fetching lineups for ${league.name}:`, error);
    }
  }
}
