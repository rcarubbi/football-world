import { FormationView } from "./FormationView";
import { PlayerBench } from "./PlayerBench";
import type { Lineup } from "@/lib/db/lineups";

interface MatchLineupProps {
  lineups: Lineup[];
}

export function MatchLineup({ lineups }: MatchLineupProps) {
  if (!lineups || lineups.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No lineup data available
      </div>
    );
  }

  const teams = Array.from(new Set(lineups.map((l) => l.team_name)));

  return (
    <div className="p-4 space-y-4">
      {teams.map((teamName) => {
        const teamLineups = lineups.filter((l) => l.team_name === teamName);
        const starters = teamLineups.filter((l) => l.starter === 1);
        const subs = teamLineups.filter((l) => l.starter === 0);

        return (
          <div key={teamName} className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {teamName}
            </h4>
            <FormationView players={starters} />
            {subs.length > 0 && <PlayerBench players={subs} />}
          </div>
        );
      })}
    </div>
  );
}
