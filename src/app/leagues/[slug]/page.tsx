import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { LEAGUES, getLeagueBySlug } from "@/lib/leagues";
import { LeagueIcon } from "@/components/LeagueIcon";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { VideoSection } from "@/components/VideoSection";
import { Trophy, TrendingUp, Calendar, Video, ArrowRight, Star } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { SeasonSelector } from "@/components/SeasonSelector";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Metadata } from "next";
import { findStandingsByLeagueAndSeason, findSeasonsByLeague } from "@/lib/db/standings";
import { findTopScorersByLeagueAndSeason } from "@/lib/db/top-scorers";
import { findRecentMatchesWithBadgesByLeague, findUpcomingMatchesWithBadgesByLeague } from "@/lib/db/matches";
import { findVideosByLeague } from "@/lib/db/videos";
import { findRecentByLeague } from "@/lib/db/transfers";
import { PlayerAvatar } from "@/components/PlayerAvatar";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string; from?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const league = getLeagueBySlug(slug);
  if (!league) return { title: "League not found" };
  return {
    title: `${league.name} | Football World`,
    description: `Standings, results and matches of ${league.name}`,
    openGraph: {
      title: `${league.name} | Football World`,
      description: `Standings, results and matches of ${league.name}`,
      images: [{ url: league.logoUrl, width: 200, height: 200 }],
    },
  };
}

export function generateStaticParams() {
  return LEAGUES.map((l) => ({ slug: l.slug }));
}

async function getLeagueData(slug: string, season: string) {
  const [standings, seasons, topScorers, upcomingMatches, recentMatches, videos, transfers] = await Promise.all([
    findStandingsByLeagueAndSeason(slug, season),
    findSeasonsByLeague(slug),
    findTopScorersByLeagueAndSeason(slug, season),
    findUpcomingMatchesWithBadgesByLeague(slug, 10),
    findRecentMatchesWithBadgesByLeague(slug, 10),
    findVideosByLeague(slug),
    findRecentByLeague(slug, 10),
  ]);

  return {
    standings,
    seasons,
    topScorers,
    upcomingMatches,
    recentMatches,
    videos,
    transfers,
  };
}

export default async function LigaDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { season: requestedSeason, from } = await searchParams;
  const league = getLeagueBySlug(slug);
  if (!league) notFound();

  const now = new Date();
  const defaultSeason = (now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1).toString();
  const season = requestedSeason || defaultSeason;
  const data = await getLeagueData(slug, season);
  const backHref = from || "/leagues";
  const backLabel = from ? "Back" : "Back to Leagues";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumb backHref={backHref} backLabel={backLabel} />
      <GlassPanel className="flex items-center gap-4 p-6 mb-8">
        <LeagueIcon slug={slug} className="w-16 h-16 text-xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold">{league.name}</h1>
          <p className="text-red-400 dark:text-red-300">{league.country}</p>
        </div>
        <ShareButton title={league.name} image={league.logoUrl} />
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {data.standings.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Standings
                  </h2>
                  <Suspense>
                    <SeasonSelector
                      seasons={data.seasons}
                      currentSeason={season}
                    />
                  </Suspense>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="w-10 px-2">#</TableCell>
                      <TableCell className="px-2">Team</TableCell>
                      <TableCell className="text-center px-2 hidden sm:table-cell">P</TableCell>
                      <TableCell className="text-center px-2 hidden sm:table-cell">W</TableCell>
                      <TableCell className="text-center px-2 hidden sm:table-cell">D</TableCell>
                      <TableCell className="text-center px-2 hidden sm:table-cell">L</TableCell>
                      <TableCell className="text-center font-bold px-2">Pts</TableCell>
                      <TableCell className="hidden md:table-cell px-2">Form</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.standings.map((row) => (
                      <TableRow key={row.id as number}>
                        <TableCell className="font-medium px-2">{row.position as number}</TableCell>
                        <TableCell className="px-2">
                          <Link href={`/teams/${row.team_slug}?from=/leagues/${slug}%3Fseason%3D${season}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            {(row.team_badge_resolved || row.team_badge) ? (
                              <img src={(row.team_badge_resolved || row.team_badge) as string} alt="" className="w-7 h-7 object-contain shrink-0" />
                            ) : null}
                            <span className="font-medium text-sm truncate max-w-[180px]">{row.team_name as string}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center text-red-400 dark:text-red-300 px-2 hidden sm:table-cell">{row.played as number}</TableCell>
                        <TableCell className="text-center text-success px-2 hidden sm:table-cell">{row.won as number}</TableCell>
                        <TableCell className="text-center text-red-400 dark:text-red-300 px-2 hidden sm:table-cell">{row.drawn as number}</TableCell>
                        <TableCell className="text-center text-destructive px-2 hidden sm:table-cell">{row.lost as number}</TableCell>
                        <TableCell className="text-center font-bold px-2">{row.points as number}</TableCell>
                        <TableCell className="hidden md:table-cell px-2">
                          <div className="flex gap-0.5">
                            {(row.form as string || "").split("").map((f: string, i: number) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                                  f === "W" ? "bg-success/20 text-success" :
                                  f === "D" ? "bg-muted text-foreground/60" :
                                  "bg-destructive/20 text-destructive"
                                }`}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.recentMatches.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  Recent Results
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentMatches.map((match) => (
                    <div key={match.id as number} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {match.home_badge ? <img src={match.home_badge as string} alt="" className="w-7 h-7 object-contain shrink-0" /> : null}
                        {match.home_team_slug ? (
                          <Link href={`/teams/${match.home_team_slug}?from=/leagues/${slug}%3Fseason%3D${season}`} className="text-sm font-medium truncate hover:opacity-80 transition-opacity">{match.home_team_name as string}</Link>
                        ) : (
                          <span className="text-sm font-medium truncate">{match.home_team_name as string}</span>
                        )}
                      </div>
                      <div className="px-4 font-bold shrink-0">
                        {match.home_score as number ?? "-"} - {match.away_score as number ?? "-"}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        {match.away_team_slug ? (
                          <Link href={`/teams/${match.away_team_slug}?from=/leagues/${slug}%3Fseason%3D${season}`} className="text-sm font-medium truncate text-right hover:opacity-80 transition-opacity">{match.away_team_name as string}</Link>
                        ) : (
                          <span className="text-sm font-medium truncate text-right">{match.away_team_name as string}</span>
                        )}
                        {match.away_badge ? <img src={match.away_badge as string} alt="" className="w-7 h-7 object-contain shrink-0" /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.upcomingMatches.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-accent" />
                  Upcoming Matches
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.upcomingMatches.map((match) => (
                    <div key={match.id as number} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {match.home_badge ? <img src={match.home_badge as string} alt="" className="w-7 h-7 object-contain shrink-0" /> : null}
                        {match.home_team_slug ? (
                          <Link href={`/teams/${match.home_team_slug}?from=/leagues/${slug}%3Fseason%3D${season}`} className="text-sm font-medium truncate hover:opacity-80 transition-opacity">{match.home_team_name as string}</Link>
                        ) : (
                          <span className="text-sm font-medium truncate">{match.home_team_name as string}</span>
                        )}
                      </div>
                      <div className="px-4 text-sm text-red-400 dark:text-red-300 shrink-0">
                        {match.match_date as string} {match.match_time ? `${match.match_time}` : ""}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        {match.away_team_slug ? (
                          <Link href={`/teams/${match.away_team_slug}?from=/leagues/${slug}%3Fseason%3D${season}`} className="text-sm font-medium truncate text-right hover:opacity-80 transition-opacity">{match.away_team_name as string}</Link>
                        ) : (
                          <span className="text-sm font-medium truncate text-right">{match.away_team_name as string}</span>
                        )}
                        {match.away_badge ? <img src={match.away_badge as string} alt="" className="w-7 h-7 object-contain shrink-0" /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {data.topScorers.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Star className="w-6 h-6 text-accent" />
                  Top Scorers
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topScorers.map((scorer, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                      <span className="text-base font-bold text-red-400 dark:text-red-300 w-7 text-center shrink-0">{i + 1}</span>
                      {scorer.player_slug ? (
                        <Link href={`/players/${scorer.player_slug}?from=/leagues/${slug}%3Fseason%3D${season}`}>
                          <PlayerAvatar photoUrl={scorer.photo_url as string} name={scorer.player_name as string} className="w-12 h-12 rounded-full object-cover shrink-0 hover:ring-2 hover:ring-primary/50 transition-all" />
                        </Link>
                      ) : (
                        <PlayerAvatar photoUrl={scorer.photo_url as string} name={scorer.player_name as string} className="w-12 h-12 rounded-full object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {scorer.player_slug ? (
                          <Link href={`/players/${scorer.player_slug}?from=/leagues/${slug}%3Fseason%3D${season}`} className="text-sm font-semibold truncate hover:opacity-80 transition-opacity block">{scorer.player_name as string}</Link>
                        ) : (
                          <div className="text-sm font-semibold truncate">{scorer.player_name as string}</div>
                        )}
                        <div className="text-xs text-red-400 dark:text-red-300">{scorer.team_name as string}</div>
                      </div>
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-400/30 text-yellow-600 dark:text-yellow-400 shrink-0">{scorer.goals as number} G</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.videos.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Video className="w-6 h-6 text-primary" />
                  Videos
                </h2>
              </CardHeader>
              <CardContent>
                <VideoSection
                  videos={data.videos.map((v) => ({
                    id: v.id as number,
                    video_id: v.video_id as string,
                    title: v.title as string,
                    thumbnail_url: v.thumbnail_url as string | null,
                    channel_name: v.channel_name as string | null,
                  }))}
                  limit={5}
                />
              </CardContent>
            </Card>
          )}

          {data.transfers.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ArrowRight className="w-6 h-6 text-primary" />
                  Transfers
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.transfers.slice(0, 5).map((transfer, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/30">
                      <div className="text-sm font-medium">{transfer.player_name as string}</div>
                      <div className="text-xs text-red-400 dark:text-red-300 mt-1">
                        {transfer.from_team as string} → {transfer.to_team as string}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{transfer.transfer_type as string}</Badge>
                        {transfer.transfer_fee ? (
                          <Badge variant="accent">{transfer.transfer_fee as string}</Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
