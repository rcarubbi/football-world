import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth, getCurrentSeason, sleep } from "../auth";
import { LEAGUES } from "../../../../lib/leagues";
import { searchVideos, parseDuration } from "../../../../lib/api/youtube";
import { upsertVideo } from "../../../../lib/db/videos";
import { findTeamsWithoutVideos } from "../../../../lib/db/teams";

const F1_KEYWORDS = /\b(f1|formula\s*1|formula\s*one|grand\s*prix|fp[123]|qualifying|lap|grid|pole\s*position|race\s*result|driver|car\s*reveal|oracle\s*red\s*bull|racing\s*point)\b/i;

function isVideoAboutTeam(title: string, teamName: string): boolean {
  if (F1_KEYWORDS.test(title)) return false;
  const normalised = title.toLowerCase();
  const words = teamName
    .toLowerCase()
    .replace(/fc$|cf$|ac$|sc$|bk$/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return words.some((w) => normalised.includes(w));
}

const TEAM_BATCH = 20;

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  const currentYear = now.getFullYear();
  const season = getCurrentSeason();
  const currentSeasonStr = `${currentYear - 1}-${currentYear}`;
  let teamVideos = 0;
  let leagueVideos = 0;

  // Team videos
  const teamsWithoutVideos = await findTeamsWithoutVideos(TEAM_BATCH);
  console.log(`Processing ${teamsWithoutVideos.length} teams without videos`);

  for (const team of teamsWithoutVideos) {
    const teamId = team.id as number;
    const teamName = team.name as string;
    const leagueSlug = team.league_slug as string;

    try {
      const query = `${teamName} football highlights ${currentYear} -formula1 -"formula 1" -F1`;
      const videos = await searchVideos(query, 10);

      for (const video of videos) {
        const durationSeconds = parseDuration(video.duration);

        if (
          durationSeconds >= 120 &&
          durationSeconds <= 900 &&
          isVideoAboutTeam(video.title, teamName)
        ) {
          await upsertVideo({
            video_id: video.videoId,
            title: video.title,
            thumbnail_url: video.thumbnailUrl,
            channel_name: video.channelName,
            duration: durationSeconds,
            entity_type: "team",
            entity_id: teamId,
            league_slug: leagueSlug,
            season: currentSeasonStr,
            published_at: video.publishedAt,
          });
          teamVideos++;
        }
      }
    } catch (error) {
      console.error(`Error fetching videos for ${teamName}:`, error);
    }
    await sleep(300);
  }

  // League videos
  for (const league of LEAGUES) {
    try {
      const query = `${league.name} football highlights ${season}`;
      const videos = await searchVideos(query, 5);

      for (const video of videos) {
        const durationSeconds = parseDuration(video.duration);

        if (durationSeconds >= 120 && durationSeconds <= 900) {
          await upsertVideo({
            video_id: video.videoId,
            title: video.title,
            thumbnail_url: video.thumbnailUrl,
            channel_name: video.channelName,
            duration: durationSeconds,
            entity_type: "league",
            league_slug: league.slug,
            season: season.toString(),
            published_at: video.publishedAt,
          });
          leagueVideos++;
        }
      }
    } catch (error) {
      console.error(`Error refreshing videos for ${league.name}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    teamVideos,
    leagueVideos,
    timestamp: new Date().toISOString(),
  });
}
