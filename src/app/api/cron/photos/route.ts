import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth, sleep } from "../auth";
import { searchTeams, lookupAllPlayers } from "../../../../lib/api/sportsdb";
import { findPlayersWithoutPhotosWithTeam, updatePlayerPhoto, findPlayersWithoutPhotosNoTeam } from "../../../../lib/db/players";

interface SportsDBPlayer {
  idPlayer: string;
  strPlayer: string;
  strThumb: string;
  strCutout: string;
  strRender: string;
  strDescriptionEN: string;
}

interface SportsDBTeam {
  idTeam: string;
}

const BATCH_SIZE = 20;

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  let photosEnriched = 0;

  // Players with TSDB team link
  const playersWithTeam = await findPlayersWithoutPhotosWithTeam(BATCH_SIZE);
  console.log(`Processing ${playersWithTeam.length} players with TSDB teams`);

  for (const player of playersWithTeam) {
    try {
      const teamTsdbId = player.team_tsdb_id;
      if (!teamTsdbId) continue;

      const players = (await lookupAllPlayers(teamTsdbId)) as SportsDBPlayer[];
      const match = players.find(
        (p) =>
          p.strPlayer.toLowerCase() === player.name.toLowerCase() ||
          p.strPlayer.toLowerCase().includes(player.name.toLowerCase().split(" ").pop() || "")
      );

      if (match) {
        const photo = match.strCutout || match.strThumb || match.strRender || null;
        if (photo) {
          await updatePlayerPhoto(player.id, {
            photo_url: photo,
            thesportsdb_id: match.idPlayer || null,
            description: match.strDescriptionEN || null,
          });
          photosEnriched++;
        }
      }
    } catch (error) {
      if ((error as Error).message === "RATE_LIMITED") break;
    }
    await sleep(600);
  }

  // Players without TSDB team link
  const playersNoTeam = await findPlayersWithoutPhotosNoTeam(10);
  console.log(`Processing ${playersNoTeam.length} players without TSDB teams`);

  for (const player of playersNoTeam) {
    try {
      const searchResults = (await searchTeams(player.name as string)) as SportsDBTeam[];
      if (searchResults.length === 0) continue;

      const tsdbId = searchResults[0].idTeam;
      const players = (await lookupAllPlayers(tsdbId)) as SportsDBPlayer[];
      const match = players.find(
        (p) =>
          p.strPlayer.toLowerCase() === (player.name as string).toLowerCase()
      );

      if (match) {
        const photo = match.strCutout || match.strThumb || match.strRender || null;
        await updatePlayerPhoto(player.id, {
          photo_url: photo,
          thesportsdb_id: match.idPlayer || null,
          description: match.strDescriptionEN || null,
        });
        if (photo) photosEnriched++;
      }
    } catch (error) {
      if ((error as Error).message === "RATE_LIMITED") break;
    }
    await sleep(600);
  }

  return NextResponse.json({
    success: true,
    photosEnriched,
    timestamp: new Date().toISOString(),
  });
}
