import { searchVideos, parseDuration } from "../../src/lib/api/youtube";
import { findAllTeams, upsertTeam } from "../../src/lib/db/teams";
import { upsertVideo } from "../../src/lib/db/videos";
import { LEAGUES } from "../../src/lib/leagues";

export async function fetchVideos(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const season = `${currentYear - 1}-${currentYear}`;

  // Fetch team highlight videos
  const teams = await findAllTeams();

  for (const team of teams) {
    console.log(`  Fetching videos for ${team.name}...`);

    try {
      const query = `${team.name} highlights ${currentYear}`;
      const videos = await searchVideos(query, 5);

      for (const video of videos) {
        const durationSeconds = parseDuration(video.duration);

        // Filter by duration (3-10 minutes)
        if (durationSeconds >= 180 && durationSeconds <= 600) {
          await upsertVideo({
            video_id: video.videoId,
            title: video.title,
            thumbnail_url: video.thumbnailUrl,
            channel_name: video.channelName,
            duration: durationSeconds,
            entity_type: "team",
            entity_id: team.id,
            league_slug: team.league_slug,
            season,
            published_at: video.publishedAt,
          });
        }
      }
    } catch (error) {
      console.error(`  Error fetching videos for ${team.name}:`, error);
    }
  }

  // Fetch league highlight videos
  for (const league of LEAGUES) {
    console.log(`  Fetching league videos for ${league.name}...`);

    try {
      const query = `${league.name} highlights ${currentYear}`;
      const videos = await searchVideos(query, 10);

      for (const video of videos) {
        const durationSeconds = parseDuration(video.duration);

        // Filter by duration (3-10 minutes)
        if (durationSeconds >= 180 && durationSeconds <= 600) {
          await upsertVideo({
            video_id: video.videoId,
            title: video.title,
            thumbnail_url: video.thumbnailUrl,
            channel_name: video.channelName,
            duration: durationSeconds,
            entity_type: "league",
            league_slug: league.slug,
            season,
            published_at: video.publishedAt,
          });
        }
      }
    } catch (error) {
      console.error(`  Error fetching league videos for ${league.name}:`, error);
    }
  }
}
