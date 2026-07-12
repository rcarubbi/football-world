import { notFound } from "next/navigation";
import Link from "next/link";
import { getTursoClient } from "@/lib/turso/client";
import { stripWikiMarkup } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LeagueIcon } from "@/components/LeagueIcon";
import { VideoSection } from "@/components/VideoSection";
import { Users, MapPin, Calendar, Video, Trophy, ArrowLeft } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = getTursoClient();
  const result = await client.execute({ sql: "SELECT name, badge_url FROM teams WHERE slug = ?", args: [slug] });
  const team = result.rows[0];
  if (!team) return { title: "Team not found" };
  return {
    title: `${team.name} | Football World`,
    description: `Squad, formation, results and videos of ${team.name}`,
    openGraph: {
      title: `${team.name} | Football World`,
      description: `Squad, formation, results and videos of ${team.name}`,
      images: team.badge_url ? [{ url: team.badge_url as string, width: 200, height: 200 }] : undefined,
    },
  };
}

async function getTeamData(slug: string) {
  const client = getTursoClient();

  const teamResult = await client.execute({ sql: "SELECT * FROM teams WHERE slug = ?", args: [slug] });
  if (teamResult.rows.length === 0) return null;
  const team = teamResult.rows[0];

  const [players, matches, videos, lineups] = await Promise.all([
    client.execute({ sql: "SELECT * FROM players WHERE team_id = ? ORDER BY position, name", args: [team.id as number] }),
    client.execute({
      sql: `SELECT m.*, t1.badge_url as home_badge, t2.badge_url as away_badge
            FROM matches m
            LEFT JOIN teams t1 ON m.home_team_name = t1.name
            LEFT JOIN teams t2 ON m.away_team_name = t2.name
            WHERE m.home_team_name = ? OR m.away_team_name = ?
            ORDER BY m.match_date DESC LIMIT 10`,
      args: [team.name as string, team.name as string],
    }),
    client.execute({ sql: "SELECT * FROM videos WHERE entity_type = 'team' AND entity_id = ? ORDER BY published_at DESC LIMIT 10", args: [team.id as number] }),
    client.execute({
      sql: `SELECT ml.*, m.match_date, m.home_team_name, m.away_team_name
            FROM match_lineups ml
            JOIN matches m ON ml.match_id = m.id
            WHERE ml.team_id = ?
            ORDER BY m.match_date DESC, ml.position`,
      args: [team.id as number],
    }),
  ]);

  return {
    team,
    players: players.rows,
    matches: matches.rows,
    videos: videos.rows,
    lineups: lineups.rows,
  };
}

function FormationPitch({ players }: { players: Record<string, unknown>[] }) {
  const positionMap: Record<string, { x: number; y: number }> = {
    "Goalkeeper": { x: 50, y: 90 },
    "Defender": { x: 50, y: 70 },
    "Midfielder": { x: 50, y: 50 },
    "Forward": { x: 50, y: 30 },
    "Attacker": { x: 50, y: 30 },
  };

  const starters = players.filter((p) => p.starter === 1);
  const posCount: Record<string, number> = {};

  const positions = starters.map((p) => {
    const pos = (p.position as string) || "Midfielder";
    posCount[pos] = (posCount[pos] || 0) + 1;
    const base = positionMap[pos] || positionMap["Midfielder"];
    const offset = (posCount[pos] - 1) * 15 - (posCount[pos] > 1 ? 7.5 : 0);
    return {
      ...p,
      x: Math.max(10, Math.min(90, base.x + offset)),
      y: base.y + (Math.random() * 6 - 3),
    };
  });

  return (
    <div className="relative w-full aspect-[68/105] max-w-md mx-auto">
      <svg viewBox="0 0 680 1050" className="w-full h-full">
        <rect x="0" y="0" width="680" height="1050" rx="8" fill="#1a5e1a" />

        <line x1="0" y1="525" x2="680" y2="525" stroke="white" strokeWidth="3" opacity="0.6" />
        <circle cx="340" cy="525" r="91.5" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <circle cx="340" cy="525" r="5" fill="white" opacity="0.6" />

        <rect x="0" y="0" width="680" height="180" rx="0" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <rect x="170" y="0" width="340" height="180" rx="0" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <path d="M 170 180 A 91.5 91.5 0 0 0 510 180" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />

        <rect x="0" y="870" width="680" height="180" rx="0" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <rect x="170" y="870" width="340" height="180" rx="0" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <path d="M 170 870 A 91.5 91.5 0 0 1 510 870" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />

        {positions.map((p: Record<string, unknown> & { x: number; y: number }, i) => {
          const cx = (p.x / 100) * 680;
          const cy = (p.y / 100) * 1050;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="32" fill="#DC2626" stroke="white" strokeWidth="2" />
              <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                {(p.player_number as number) || ""}
              </text>
              <text x={cx} y={cy + 48} textAnchor="middle" fill="white" fontSize="14" fontWeight="500">
                {(p.player_name as string || "").split(" ").pop()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getTeamData(slug);
  if (!data) notFound();

  const { team, players, matches, videos, lineups } = data;
  const leagueSlug = team.league_slug as string;

  const starters = lineups.filter((l: Record<string, unknown>) => l.starter === 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/teams" className="inline-flex items-center gap-1 text-sm text-red-400 dark:text-red-300 hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Teams
      </Link>

      <GlassPanel className="flex flex-col sm:flex-row items-start gap-6 p-6 mb-8">
        {team.badge_url ? (
          <img src={team.badge_url as string} alt={team.name as string} className="w-24 h-24 object-contain" />
        ) : null}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold flex-1">{team.name as string}</h1>
            <ShareButton title={team.name as string} image={team.badge_url as string | undefined} />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-red-400 dark:text-red-300">
            <Link href={`/leagues/${leagueSlug}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <LeagueIcon slug={leagueSlug} className="w-5 h-5 text-[10px]" />
              {leagueSlug}
            </Link>
            {team.stadium ? (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {team.stadium as string}</span>
            ) : null}
            {team.founded ? (
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Founded {team.founded as string}</span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          {team.kit_home_url ? <img src={team.kit_home_url as string} alt="Home kit" className="h-20 object-contain" /> : null}
          {team.kit_away_url ? <img src={team.kit_away_url as string} alt="Away kit" className="h-20 object-contain" /> : null}
          {team.kit_third_url ? <img src={team.kit_third_url as string} alt="Third kit" className="h-20 object-contain" /> : null}
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {team.wikipedia_content ? (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">About the Team</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-400 dark:text-red-300 leading-relaxed line-clamp-6">
                  {stripWikiMarkup(team.wikipedia_content as string)}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {players.length > 0 && (
            <Card>
              <CardHeader>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    Squad ({players.length})
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {players.map((player) => (
                    <Link
                      key={player.slug as string}
                      href={`/players/${player.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      {player.photo_url ? (
                        <img src={player.photo_url as string} alt={player.name as string} className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                          {(player.name as string).split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{player.name as string}</div>
                        <div className="text-xs text-red-400 dark:text-red-300">{player.position as string || "N/A"}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {matches.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-accent" />
                  Results
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {matches.map((match: Record<string, unknown>) => (
                    <div key={match.id as number} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {match.home_badge ? <img src={match.home_badge as string} alt="" className="w-6 h-6 object-contain shrink-0" /> : null}
                        <span className="text-sm font-medium truncate">{match.home_team_name as string}</span>
                      </div>
                      <div className="px-4 font-bold shrink-0">
                        {match.home_score as number ?? "-"} - {match.away_score as number ?? "-"}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium truncate text-right">{match.away_team_name as string}</span>
                        {match.away_badge ? <img src={match.away_badge as string} alt="" className="w-6 h-6 object-contain shrink-0" /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {starters.length > 0 && (
            <Card>
              <CardHeader>
                  <h2 className="text-xl font-bold">Formation</h2>
              </CardHeader>
              <CardContent>
                <FormationPitch players={starters} />
              </CardContent>
            </Card>
          )}

          {videos.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Video className="w-6 h-6 text-primary" />
                  Videos
                </h2>
              </CardHeader>
              <CardContent>
                <VideoSection
                  videos={videos.map((v) => ({
                    id: v.id as number,
                    video_id: v.video_id as string,
                    title: v.title as string,
                    thumbnail_url: v.thumbnail_url as string | null,
                    channel_name: v.channel_name as string | null,
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
