import Link from "next/link";
import { LEAGUES } from "@/lib/leagues";
import { LeagueIcon } from "@/components/LeagueIcon";
import { Card } from "@/components/ui/Card";
import { HeroInteractive } from "@/components/three/HeroInteractive";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Trophy, Users, Star, Video, ChevronRight, Calendar, TrendingUp } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { countTeams } from "@/lib/db/teams";
import { countPlayers } from "@/lib/db/players";
import { countMatches } from "@/lib/db/matches";
import { countVideos } from "@/lib/db/videos";
import { findRecentFinishedMatchesWithBadges } from "@/lib/db/matches";
import { findTopTeamsWithPlayerCount } from "@/lib/db/teams";

async function getHomeData() {
  const [teamsCount, playersCount, matchesCount, videosCount, recentMatches, topTeams] = await Promise.all([
    countTeams(),
    countPlayers(),
    countMatches(),
    countVideos(),
    findRecentFinishedMatchesWithBadges(6),
    findTopTeamsWithPlayerCount(8),
  ]);

  return {
    stats: {
      teams: teamsCount,
      players: playersCount,
      matches: matchesCount,
      videos: videosCount,
    },
    recentMatches,
    topTeams,
  };
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[65vh] w-full overflow-hidden">
        <HeroInteractive />
        <div className="relative z-20 h-full flex flex-col justify-start max-w-7xl mx-auto px-4 sm:px-6 pt-16 md:pt-24">
          <GlassPanel className="p-6 sm:p-8 max-w-2xl" intensity="md">
            <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
              The World of{" "}
              <span className="gradient-text">Football</span>{" "}
              in one place
            </h1>
            <p className="text-lg sm:text-xl text-red-400 dark:text-red-300 max-w-lg">
              Teams, players, leagues, results, videos and much more.
              Explore the universe of world football.
            </p>
            <ShareButton title="Football World" text="Explore the universe of world football" />
            <div className="flex flex-wrap gap-4">
              <Link
                href="/leagues"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
              >
                Explore Leagues
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/teams"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-all"
              >
                View Teams
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {[
                { label: "Teams", value: data.stats.teams, icon: Users },
                { label: "Players", value: data.stats.players, icon: Star },
                { label: "Matches", value: data.stats.matches, icon: Calendar },
                { label: "Videos", value: data.stats.videos, icon: Video },
              ].map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <div className="text-xs text-red-400 dark:text-red-300 flex items-center justify-center sm:justify-start gap-1">
                    <stat.icon className="w-3 h-3" />
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 relative z-20">
        <GlassPanel className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            <TrendingUp className="w-6 h-6 inline-block mr-2 text-primary" />
            Available Leagues
          </h2>
          <Link href="/leagues" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEAGUES.map((league) => (
            <Link key={league.slug} href={`/leagues/${league.slug}`}>
              <Card hover className="p-4">
                <div className="flex items-center gap-3">
                  <LeagueIcon slug={league.slug} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{league.name}</div>
                    <div className="text-xs text-red-400 dark:text-red-300">{league.country}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        </GlassPanel>
      </section>

      {data.recentMatches.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <GlassPanel className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-6">
            <Calendar className="w-6 h-6 inline-block mr-2 text-primary" />
            Recent Results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentMatches.map((match) => (
              <Card key={match.id as number} hover className="p-4">
                <div className="text-xs text-red-400 dark:text-red-300 mb-2">
                  {match.league_slug as string} &middot; {match.match_date as string}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {match.home_badge ? (
                      <img src={match.home_badge as string} alt="" className="w-6 h-6 object-contain" loading="lazy" />
                    ) : null}
                    {match.home_team_slug ? (
                      <Link href={`/teams/${match.home_team_slug}`} className="text-sm font-medium truncate hover:opacity-80 transition-opacity">{match.home_team_name as string}</Link>
                    ) : (
                      <span className="text-sm font-medium truncate">{match.home_team_name as string}</span>
                    )}
                  </div>
                  <div className="px-3 font-bold text-lg shrink-0">
                    {match.home_score as number} - {match.away_score as number}
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    {match.away_team_slug ? (
                      <Link href={`/teams/${match.away_team_slug}`} className="text-sm font-medium truncate text-right hover:opacity-80 transition-opacity">{match.away_team_name as string}</Link>
                    ) : (
                      <span className="text-sm font-medium truncate text-right">{match.away_team_name as string}</span>
                    )}
                    {match.away_badge ? (
                      <img src={match.away_badge as string} alt="" className="w-6 h-6 object-contain" loading="lazy" />
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          </GlassPanel>
        </section>
      )}

      {data.topTeams.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <GlassPanel className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-6">
            <Star className="w-6 h-6 inline-block mr-2 text-accent" />
            Featured Teams
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.topTeams.map((team) => (
              <Link key={team.slug as string} href={`/teams/${team.slug}?from=/`}>
                <Card hover className="p-4 text-center">
                  {team.badge_url ? (
                    <img
                      src={team.badge_url as string}
                      alt={team.name as string}
                      className="w-16 h-16 object-contain mx-auto mb-3"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="font-medium text-sm truncate">{team.name as string}</div>
                  <div className="text-xs text-red-400 dark:text-red-300 mt-1">
                    {team.player_count as number} players
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          </GlassPanel>
        </section>
      )}
    </div>
  );
}
