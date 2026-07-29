import { getTursoClient } from "../turso/client";

// Lazy client access — env vars may not be loaded at module import time
function client() { return getTursoClient(); }

// ── SportsAPI Pro ───────────────────────────────────────────

export async function storeSAPTeam(
  sapId: string,
  rawJson: unknown
) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_teams (sap_id, raw_json)
          VALUES (?, ?)`,
    args: [sapId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPSquad(
  sapTeamId: string,
  rawJson: unknown
) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_squads (sap_team_id, raw_json)
          VALUES (?, ?)`,
    args: [sapTeamId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPCountries(rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_countries (id, raw_json) VALUES (1, ?)`,
    args: [JSON.stringify(rawJson)],
  });
}

export async function storeSAPTournaments(rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_tournaments (id, raw_json) VALUES (1, ?)`,
    args: [JSON.stringify(rawJson)],
  });
}

export async function storeSAPTournamentSeasons(tournamentId: number, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_tournament_seasons (tournament_id, raw_json)
          VALUES (?, ?)`,
    args: [tournamentId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPStandings(tournamentId: number, seasonId: number, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_standings (tournament_id, season_id, raw_json)
          VALUES (?, ?, ?)`,
    args: [tournamentId, seasonId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPTopPlayers(tournamentId: number, seasonId: number, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_top_players (tournament_id, season_id, raw_json)
          VALUES (?, ?, ?)`,
    args: [tournamentId, seasonId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPTeamTransfers(sapTeamId: string, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_team_transfers (sap_team_id, raw_json)
          VALUES (?, ?)`,
    args: [sapTeamId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPMatches(tournamentId: number, seasonId: number, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_matches (tournament_id, season_id, raw_json)
          VALUES (?, ?, ?)`,
    args: [tournamentId, seasonId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPMatchDetail(sapMatchId: string, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_match_detail (sap_match_id, raw_json)
          VALUES (?, ?)`,
    args: [sapMatchId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPMatchLineups(sapMatchId: string, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_match_lineups (sap_match_id, raw_json)
          VALUES (?, ?)`,
    args: [sapMatchId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPMatchStatistics(sapMatchId: string, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_match_statistics (sap_match_id, raw_json)
          VALUES (?, ?)`,
    args: [sapMatchId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPMatchIncidents(sapMatchId: string, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_match_incidents (sap_match_id, raw_json)
          VALUES (?, ?)`,
    args: [sapMatchId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPMatchShotmap(sapMatchId: string, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_match_shotmap (sap_match_id, raw_json)
          VALUES (?, ?)`,
    args: [sapMatchId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPPlayer(sapId: string, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_players (sap_id, raw_json)
          VALUES (?, ?)`,
    args: [sapId, JSON.stringify(rawJson)],
  });
}

export async function storeSAPPlayerStatistics(sapId: string, rawJson: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO sap_player_statistics (sap_id, raw_json)
          VALUES (?, ?)`,
    args: [sapId, JSON.stringify(rawJson)],
  });
}

// ── Big Balls Data ───────────────────────────────────────────

export async function storeBBDSports(sports: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_sports (id, raw_json) VALUES (1, ?)`,
    args: [JSON.stringify(sports)],
  });
}

export async function storeBBDLeagues(leagues: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_leagues (id, raw_json) VALUES (1, ?)`,
    args: [JSON.stringify(leagues)],
  });
}

export async function storeBBDStandings(
  leagueId: string,
  season: string,
  standings: unknown
) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_standings (league_id, season, raw_json)
          VALUES (?, ?, ?)`,
    args: [leagueId, season, JSON.stringify(standings)],
  });
}

export async function storeBBDScorers(
  leagueId: string,
  season: string,
  category: string,
  scorers: unknown
) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_scorers (league_id, season, category, raw_json)
          VALUES (?, ?, ?, ?)`,
    args: [leagueId, season, category, JSON.stringify(scorers)],
  });
}

export async function storeBBDInjuries(injuries: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_injuries (id, raw_json) VALUES (1, ?)`,
    args: [JSON.stringify(injuries)],
  });
}

export async function storeBBDTeams(teamId: string, leagueId: string, team: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_teams (bbd_team_id, league_id, raw_json)
          VALUES (?, ?, ?)`,
    args: [teamId, leagueId, JSON.stringify(team)],
  });
}

export async function storeBBDTeamForm(teamId: string, form: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_team_form (bbd_team_id, raw_json)
          VALUES (?, ?)`,
    args: [teamId, JSON.stringify(form)],
  });
}

export async function storeBBDTeamStats(teamId: string, stats: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_team_stats (bbd_team_id, raw_json)
          VALUES (?, ?)`,
    args: [teamId, JSON.stringify(stats)],
  });
}

export async function storeBBDTeamElo(teamId: string, elo: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_team_elo (bbd_team_id, raw_json)
          VALUES (?, ?)`,
    args: [teamId, JSON.stringify(elo)],
  });
}

export async function storeBBDMatches(
  leagueId: string,
  season: string,
  matches: unknown
) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_matches (league_id, season, raw_json)
          VALUES (?, ?, ?)`,
    args: [leagueId, season, JSON.stringify(matches)],
  });
}

export async function storeBBDMatchDetail(matchId: string, detail: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_match_detail (bbd_match_id, raw_json)
          VALUES (?, ?)`,
    args: [matchId, JSON.stringify(detail)],
  });
}

export async function storeBBDMatchEvents(matchId: string, events: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_match_events (bbd_match_id, raw_json)
          VALUES (?, ?)`,
    args: [matchId, JSON.stringify(events)],
  });
}

export async function storeBBDMatchStats(matchId: string, stats: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_match_stats (bbd_match_id, raw_json)
          VALUES (?, ?)`,
    args: [matchId, JSON.stringify(stats)],
  });
}

export async function storeBBDMatchOdds(matchId: string, odds: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_match_odds (bbd_match_id, raw_json)
          VALUES (?, ?)`,
    args: [matchId, JSON.stringify(odds)],
  });
}

export async function storeBBDPlayers(playerId: string, leagueId: string, player: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_players (bbd_player_id, league_id, raw_json)
          VALUES (?, ?, ?)`,
    args: [playerId, leagueId, JSON.stringify(player)],
  });
}

export async function storeBBDPlayerStats(
  playerId: string,
  leagueId: string,
  season: number,
  stats: unknown
) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_player_stats (bbd_player_id, league_id, season, raw_json)
          VALUES (?, ?, ?, ?)`,
    args: [playerId, leagueId, season, JSON.stringify(stats)],
  });
}

export async function storeBBDPlayerCareer(playerId: string, career: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_player_career (bbd_player_id, raw_json)
          VALUES (?, ?)`,
    args: [playerId, JSON.stringify(career)],
  });
}

export async function storeBBDPlayerTransfers(playerId: string, transfers: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_player_transfers (bbd_player_id, raw_json)
          VALUES (?, ?)`,
    args: [playerId, JSON.stringify(transfers)],
  });
}

export async function storeBBDPlayerTrophies(playerId: string, trophies: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_player_trophies (bbd_player_id, raw_json)
          VALUES (?, ?)`,
    args: [playerId, JSON.stringify(trophies)],
  });
}

export async function storeBBDPredictions(matchId: string, predictions: unknown) {
  await client().execute({
    sql: `INSERT OR REPLACE INTO bbd_predictions (bbd_match_id, raw_json)
          VALUES (?, ?)`,
    args: [matchId, JSON.stringify(predictions)],
  });
}


