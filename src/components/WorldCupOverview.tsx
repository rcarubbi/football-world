import { Card, CardContent, CardHeader } from "./ui/Card";

interface WorldCupTournament {
  id: number;
  year: number;
  host_country: string | null;
  champion: string | null;
  runner_up: string | null;
  third_place: string | null;
  teams_count: number | null;
  matches_count: number | null;
  goals_scored: number | null;
}

interface WorldCupOverviewProps {
  tournaments: WorldCupTournament[];
}

export function WorldCupOverview({ tournaments }: WorldCupOverviewProps) {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No World Cup data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        FIFA World Cup History
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tournament.year}</h3>
              {tournament.host_country && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hosted by {tournament.host_country}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {tournament.champion && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Champion</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{tournament.champion}</dd>
                  </div>
                )}
                {tournament.runner_up && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Runner-up</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{tournament.runner_up}</dd>
                  </div>
                )}
                {tournament.teams_count && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Teams</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{tournament.teams_count}</dd>
                  </div>
                )}
                {tournament.goals_scored && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Goals</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{tournament.goals_scored}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
