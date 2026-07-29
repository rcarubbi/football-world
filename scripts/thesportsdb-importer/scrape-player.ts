import * as cheerio from "cheerio";
import {
  fetchHtml,
  extractField,
  extractDescription,
  extractSocialLinks,
  extractExternalIds,
  extractTeamLink,
  extractLeagueLink,
  extractBirthInfo,
  extractUrlFromSection,
  upsertStagingRow,
} from "./scrape-helpers";

interface PlayerData {
  [key: string]: string;
}

function scrapePlayerPage(
  html: string,
  playerId: string,
  teamId: string
): PlayerData {
  const data: PlayerData = {};
  data.idPlayer = playerId;
  data.idTeam = teamId;

  const $ = cheerio.load(html);
  const h1 = $("h1").first();
  data.strPlayer = h1.find("a").first().text().trim() || h1.text().trim();

  data.strPosition = extractField(html, "Position");
  data.strNumber = extractField(html, "Team Number");
  data.strStatus = extractField(html, "Status");
  data.strSide = extractField(html, "Side");
  data.strEthnicity = extractField(html, "Ethnicity");
  data.strHeight = extractField(html, "Height");
  data.strWeight = extractField(html, "Weight");
  data.strAgent = extractField(html, "Agent");
  data.strOutfitter = extractField(html, "Outfitter");
  data.strWage = extractField(html, "Wage Year");

  const birth = extractBirthInfo(html);
  data.dateBorn = birth.year;
  data.strBirthLocation = birth.location;

  const team = extractTeamLink(html, "Team");
  data.idTeam = team.id || teamId;
  data.strTeam = team.name;
  const team2 = extractTeamLink(html, "2nd Team");
  data.idTeam2 = team2.id;
  data.strTeam2 = team2.name;
  const league = extractLeagueLink(html);
  data.idLeague = league.id;
  data.strLeague = league.name;

  data.strSport = extractField(html, "Sport");

  data.strThumb = extractUrlFromSection(html, "Thumb", "thumb/");
  data.strCutout = extractUrlFromSection(html, "Player Cutout", "cutout/");
  data.strCartoon = extractUrlFromSection(html, "Player Cartoon", "cartoon/");
  data.strRender = extractUrlFromSection(
    html,
    "Full Body Render",
    "render/"
  );

  data.strDescriptionEN = extractDescription(html, [
    "<b>0 goals scored",
    "<b>Trophies</b>",
    "<b>Milestones</b>",
    "<b>Former Youth Teams</b>",
  ]);

  Object.assign(data, extractSocialLinks(html));
  Object.assign(data, extractExternalIds(html));

  return data;
}

export async function getPlayerLinks(teamSlug: string): Promise<string[]> {
  const html = await fetchHtml(
    `https://www.thesportsdb.com/team/${teamSlug}`
  );
  const regex = /\/player\/(\d+-[a-z0-9-]+)/g;
  const slugs: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    if (!slugs.includes(m[1])) slugs.push(m[1]);
  }
  return slugs;
}

export async function scrapePlayer(
  playerSlug: string,
  teamId: string
): Promise<{ slug: string; ok: boolean; data?: PlayerData; error?: string }> {
  const playerUrl = `https://www.thesportsdb.com/player/${playerSlug}`;
  const m = playerSlug.match(/^(\d+)/);
  if (!m) return { slug: playerSlug, ok: false, error: "Invalid slug" };
  const playerId = m[1];

  console.error(`  [${playerSlug}] Fetching...`);
  const html = await fetchHtml(playerUrl);
  const data = scrapePlayerPage(html, playerId, teamId);

  return { slug: playerSlug, ok: true, data };
}

export async function upsertPlayerToStaging(player: PlayerData): Promise<void> {
  const now = new Date().toISOString();
  await upsertStagingRow(
    "tsdb_players",
    [
      "tsdb_id",
      "team_tsdb_id",
      "name",
      "slug",
      "position",
      "nationality",
      "date_of_birth",
      "height",
      "weight",
      "photo_url",
      "thumb_url",
      "render_url",
      "cutout_url",
      "description",
      "raw_json",
      "fetched_at",
    ],
    [
      player.idPlayer || "",
      player.idTeam || "",
      player.strPlayer || "",
      "",
      player.strPosition || "",
      player.strNationality || player.strEthnicity || "",
      player.dateBorn || "",
      player.strHeight || "",
      player.strWeight || "",
      "",
      player.strThumb || "",
      player.strRender || "",
      player.strCutout || "",
      player.strDescriptionEN || "",
      JSON.stringify(player),
      now,
    ]
  );
}
