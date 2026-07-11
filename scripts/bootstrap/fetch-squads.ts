import { lookupAllPlayers } from "../../src/lib/api/sportsdb";
import { findAllTeams, upsertTeam } from "../../src/lib/db/teams";
import { upsertPlayer } from "../../src/lib/db/players";
import { slugify } from "../../src/lib/slugify";

interface SportsDBPlayer {
  idPlayer: string;
  strPlayer: string;
  strPosition: string | null;
  strNationality: string | null;
  dateBorn: string | null;
  strHeight: string | null;
  strWeight: string | null;
  strThumb: string | null;
  strTeam: string | null;
}

export async function fetchSquads(): Promise<void> {
  const teams = await findAllTeams();

  for (const team of teams) {
    if (!team.thesportsdb_id) continue;

    console.log(`  Fetching squad for ${team.name}...`);

    const players = (await lookupAllPlayers(
      team.thesportsdb_id
    )) as SportsDBPlayer[];

    for (const player of players) {
      const slug = slugify(player.strPlayer);
      await upsertPlayer({
        thesportsdb_id: player.idPlayer,
        name: player.strPlayer,
        slug,
        team_id: team.id,
        position: player.strPosition,
        nationality: player.strNationality,
        date_of_birth: player.dateBorn,
        height: player.strHeight,
        weight: player.strWeight,
        photo_url: player.strThumb,
      });
    }
  }
}
