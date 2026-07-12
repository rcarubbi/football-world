import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTursoClient } from "@/lib/turso/client";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Globe, Trophy } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { WorldCupYearSelector } from "@/components/WorldCupYearSelector";
import { getWorldCupEdition } from "@/lib/world-cup-data";
import { getFlagUrl } from "@/lib/flags";
import type { Metadata } from "next";

function FlagImg({ team, size = 20 }: { team: string; size?: number }) {
  const flagUrl = getFlagUrl(team);
  if (!flagUrl) return null;
  return <img src={flagUrl} alt="" width={size} height={Math.round(size * 0.67)} className="rounded-[2px] shrink-0" loading="lazy" />;
}

export const metadata: Metadata = {
  title: "World Cup | Football World",
  description: "FIFA World Cup history, results and bracket",
  openGraph: {
    title: "World Cup | Football World",
    description: "FIFA World Cup history, results and bracket",
  },
};

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

interface MatchRow {
  id: number;
  world_cup_id: number;
  stage: string | null;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  match_date: string | null;
}

async function getAllWorldCups() {
  const client = getTursoClient();
  const result = await client.execute("SELECT * FROM world_cups ORDER BY year DESC");
  return result.rows;
}

async function getWorldCupData(year: number) {
  const client = getTursoClient();

  const cupResult = await client.execute({
    sql: "SELECT * FROM world_cups WHERE year = ?",
    args: [year],
  });
  if (cupResult.rows.length === 0) return null;
  const cup = cupResult.rows[0];

  const [matchesResult, teamsResult] = await Promise.all([
    client.execute({
      sql: "SELECT * FROM world_cup_matches WHERE world_cup_id = ? ORDER BY match_date",
      args: [cup.id as number],
    }),
    client.execute({
      sql: "SELECT * FROM world_cup_teams WHERE world_cup_id = ? ORDER BY team_name",
      args: [cup.id as number],
    }),
  ]);

  return {
    cup,
    matches: matchesResult.rows as unknown as MatchRow[],
    teams: teamsResult.rows,
  };
}

function MatchCard({ match }: { match: MatchRow }) {
  const homeWin = match.home_score !== null && match.away_score !== null && match.home_score > match.away_score;
  const awayWin = match.home_score !== null && match.away_score !== null && match.away_score > match.home_score;

  return (
    <div className="bg-card/80 backdrop-blur-md border border-white/10 shadow-lg rounded-xl p-3">
      <div className={`flex items-center gap-2 p-1.5 rounded-lg ${homeWin ? "bg-success/10" : ""}`}>
        <FlagImg team={match.home_team} />
        <span className="text-sm font-medium truncate flex-1">{match.home_team}</span>
        {match.home_score !== null && (
          <span className={`text-sm font-bold ml-2 ${homeWin ? "text-success" : ""}`}>{match.home_score}</span>
        )}
      </div>
      <div className="h-px bg-border my-1" />
      <div className={`flex items-center gap-2 p-1.5 rounded-lg ${awayWin ? "bg-success/10" : ""}`}>
        <FlagImg team={match.away_team} />
        <span className="text-sm font-medium truncate flex-1">{match.away_team}</span>
        {match.away_score !== null && (
          <span className={`text-sm font-bold ml-2 ${awayWin ? "text-success" : ""}`}>{match.away_score}</span>
        )}
      </div>
      {match.venue && (
        <div className="text-[10px] text-muted-foreground mt-1.5 truncate">{match.venue}</div>
      )}
    </div>
  );
}

function GroupTable({ groupName, matches }: { groupName: string; matches: MatchRow[] }) {
  const teamStats: Record<string, { p: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number }> = {};

  for (const m of matches) {
    if (m.home_score === null || m.away_score === null) continue;

    if (!teamStats[m.home_team]) teamStats[m.home_team] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    if (!teamStats[m.away_team]) teamStats[m.away_team] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };

    const home = teamStats[m.home_team];
    const away = teamStats[m.away_team];

    home.p++; away.p++;
    home.gf += m.home_score; home.ga += m.away_score;
    away.gf += m.away_score; away.ga += m.home_score;

    if (m.home_score > m.away_score) { home.w++; home.pts += 3; away.l++; }
    else if (m.home_score < m.away_score) { away.w++; away.pts += 3; home.l++; }
    else { home.d++; away.d++; home.pts += 1; away.pts += 1; }
  }

  const sorted = Object.entries(teamStats)
    .map(([name, s]) => ({ name, ...s, gd: s.gf - s.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  const label = groupName.replace("GROUP_", "");

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold">
          <Badge variant="accent">{label}</Badge>
        </h3>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="px-1">#</TableCell>
              <TableCell className="px-1">Team</TableCell>
              <TableCell className="text-center px-1 hidden sm:table-cell">P</TableCell>
              <TableCell className="text-center px-1 hidden sm:table-cell">W</TableCell>
              <TableCell className="text-center px-1 hidden sm:table-cell">D</TableCell>
              <TableCell className="text-center px-1 hidden sm:table-cell">L</TableCell>
              <TableCell className="text-center px-1 hidden sm:table-cell">GF</TableCell>
              <TableCell className="text-center px-1 hidden sm:table-cell">GA</TableCell>
              <TableCell className="text-center px-1 hidden sm:table-cell">GD</TableCell>
              <TableCell className="text-center font-bold px-1">Pts</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row, i) => (
              <TableRow key={row.name}>
                <TableCell className="px-1 text-xs">{i + 1}</TableCell>
                <TableCell className="px-1 text-xs font-medium truncate max-w-[100px]">
                  <span className="inline-flex items-center gap-1.5">
                    <FlagImg team={row.name} size={16} />
                    {row.name}
                  </span>
                </TableCell>
                <TableCell className="text-center text-xs px-1 hidden sm:table-cell">{row.p}</TableCell>
                <TableCell className="text-center text-xs text-success px-1 hidden sm:table-cell">{row.w}</TableCell>
                <TableCell className="text-center text-xs text-muted-foreground px-1 hidden sm:table-cell">{row.d}</TableCell>
                <TableCell className="text-center text-xs text-destructive px-1 hidden sm:table-cell">{row.l}</TableCell>
                <TableCell className="text-center text-xs px-1 hidden sm:table-cell">{row.gf}</TableCell>
                <TableCell className="text-center text-xs px-1 hidden sm:table-cell">{row.ga}</TableCell>
                <TableCell className="text-center text-xs px-1 hidden sm:table-cell">{row.gd > 0 ? `+${row.gd}` : row.gd}</TableCell>
                <TableCell className="text-center text-xs font-bold px-1">{row.pts}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-3 space-y-2">
          {matches.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs px-1">
              <span className="truncate flex-1 inline-flex items-center gap-1.5">
                <FlagImg team={m.home_team} size={14} />
                {m.home_team}
              </span>
              <span className="font-bold px-2">
                {m.home_score !== null ? `${m.home_score} - ${m.away_score}` : "TBD"}
              </span>
              <span className="truncate flex-1 text-right inline-flex items-center gap-1.5 justify-end">
                {m.away_team}
                <FlagImg team={m.away_team} size={14} />
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KnockoutRound({ title, matches, icon }: { title: string; matches: MatchRow[]; icon: React.ReactNode }) {
  if (matches.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        {icon}
        <Badge variant="accent">{title}</Badge>
        <span className="text-muted-foreground text-sm font-normal">({matches.length} match{matches.length > 1 ? "es" : ""})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

export default async function WorldCupPage({ searchParams }: PageProps) {
  const { year: requestedYear } = await searchParams;
  const allCups = await getAllWorldCups();

  if (allCups.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <GlassPanel className="p-6 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold flex-1">
              <Globe className="w-8 h-8 inline-block mr-2 text-success" />
              World Cup
            </h1>
            <ShareButton title="World Cup | Football World" />
          </div>
        </GlassPanel>
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No World Cup data found</p>
        </div>
      </div>
    );
  }

  const years = allCups.map((c) => c.year as number);
  const currentYear = requestedYear ? parseInt(requestedYear) : years[0];
  const data = await getWorldCupData(currentYear);

  if (!data) notFound();

  const { cup, matches, teams } = data;

  const groupMatches = matches.filter((m) => m.stage === "GROUP_STAGE");
  const last32 = matches.filter((m) => m.stage === "LAST_32");
  const last16 = matches.filter((m) => m.stage === "LAST_16");
  const quarterFinals = matches.filter((m) => m.stage === "QUARTER_FINALS");
  const semiFinals = matches.filter((m) => m.stage === "SEMI_FINALS");
  const thirdPlace = matches.filter((m) => m.stage === "THIRD_PLACE");
  const finalMatch = matches.filter((m) => m.stage === "FINAL");

  const groupNames = [...new Set(groupMatches.map((m) => m.group_name).filter((g): g is string => !!g))].sort();
  const groupedMatches: Record<string, MatchRow[]> = {};
  for (const gn of groupNames) {
    groupedMatches[gn] = groupMatches.filter((m) => m.group_name === gn);
  }

  const hasKnockout = last32.length + last16.length + quarterFinals.length + semiFinals.length + thirdPlace.length + finalMatch.length > 0;

  const edition = getWorldCupEdition(currentYear);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <GlassPanel className="p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold flex-1">World Cup {currentYear}</h1>
              <ShareButton title={`World Cup ${currentYear}`} />
            </div>
            {edition && (
              <div className="mt-2 text-muted-foreground">
                Hosted in <span className="text-foreground font-medium">{edition.host}</span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <Suspense>
                <WorldCupYearSelector years={years} currentYear={currentYear} />
              </Suspense>
            </div>
          </div>
          {edition && (
            <img
              src={edition.logoUrl}
              alt={`World Cup ${currentYear} logo`}
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0"
            />
          )}
        </div>
        {edition?.mascot && (
          <div className="mt-5 pt-5 border-t border-border">
            <div className="font-semibold text-sm">{edition.mascot.name}</div>
            <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">{edition.mascot.description}</div>
          </div>
        )}
      </GlassPanel>

      {/* Podium */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 text-center">
          <Trophy className="w-6 h-6 text-accent mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">Champion</div>
          <div className="font-bold">{cup.winner as string}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-muted-foreground">Runner-up</div>
          <div className="font-bold">{cup.runner_up as string}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-muted-foreground">3rd Place</div>
          <div className="font-bold">{cup.third_place as string}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-muted-foreground">4th Place</div>
          <div className="font-bold">{cup.fourth_place as string}</div>
        </Card>
      </div>

      {/* Teams */}
      {teams.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-success" />
              Participating Teams ({teams.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {teams.map((team: Record<string, unknown>) => (
                <div key={team.id as number} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  {team.badge_url ? (
                    <img src={team.badge_url as string} alt="" className="w-6 h-6 object-contain" />
                  ) : null}
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{team.team_name as string}</div>
                    {team.group_name ? (
                      <div className="text-[10px] text-muted-foreground">{(team.group_name as string).replace("GROUP_", "Group ")}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Stage */}
      {groupNames.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Badge>Group Stage</Badge>
            <span className="text-muted-foreground text-sm font-normal">({groupMatches.length} matches)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupNames.map((gn) => (
              <GroupTable key={gn} groupName={gn} matches={groupedMatches[gn]} />
            ))}
          </div>
        </div>
      )}

      {/* Knockout Stage */}
      {hasKnockout && (
        <GlassPanel className="p-6 mb-10 space-y-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-accent" />
            Knockout Stage
          </h2>
          <KnockoutRound title="Round of 32" matches={last32} icon={<Badge>1/32</Badge>} />
          <KnockoutRound title="Round of 16" matches={last16} icon={<Badge>1/16</Badge>} />
          <KnockoutRound title="Quarter-Finals" matches={quarterFinals} icon={<Badge>1/4</Badge>} />
          <KnockoutRound title="Semi-Finals" matches={semiFinals} icon={<Badge>1/2</Badge>} />
          {thirdPlace.length > 0 && (
            <KnockoutRound title="Third Place" matches={thirdPlace} icon={<Badge variant="outline">3rd</Badge>} />
          )}
          {finalMatch.length > 0 && (
            <KnockoutRound title="Final" matches={finalMatch} icon={<Trophy className="w-5 h-5 text-accent" />} />
          )}
        </GlassPanel>
      )}

      {matches.length === 0 && (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No match data available for {currentYear}</p>
        </div>
      )}
    </div>
  );
}
