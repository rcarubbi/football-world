import { Card, CardContent, CardHeader } from "./ui/Card";
import { WorldCupMatch } from "./WorldCupMatch";

interface WorldCupMatchData {
  id: number;
  matchday: number | null;
  stage: string | null;
  status: string | null;
  match_date: string | null;
  home_team_name: string | null;
  home_score: number | null;
  away_team_name: string | null;
  away_score: number | null;
  venue: string | null;
}

interface WorldCupTournamentProps {
  year: number;
  matches: WorldCupMatchData[];
}

export function WorldCupTournament({ year, matches }: WorldCupTournamentProps) {
  const groupStage = matches.filter((m) => m.stage === "GROUP_STAGE");
  const roundOf16 = matches.filter((m) => m.stage === "ROUND_OF_16");
  const quarterFinals = matches.filter((m) => m.stage === "QUARTER_FINALS");
  const semiFinals = matches.filter((m) => m.stage === "SEMI_FINALS");
  const final = matches.filter((m) => m.stage === "FINAL");

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {year} FIFA World Cup
      </h2>

      {groupStage.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Group Stage</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupStage.map((match) => (
                <WorldCupMatch key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {roundOf16.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Round of 16</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundOf16.map((match) => (
                <WorldCupMatch key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {quarterFinals.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quarter-Finals</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quarterFinals.map((match) => (
                <WorldCupMatch key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {semiFinals.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Semi-Finals</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {semiFinals.map((match) => (
                <WorldCupMatch key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {final.length > 0 && (
        <Card className="border-2 border-yellow-500">
          <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Final</h3>
          </CardHeader>
          <CardContent>
            {final.map((match) => (
              <WorldCupMatch key={match.id} match={match} large />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
