import { Player } from "@/lib/db/players";
import { Card, CardContent, CardHeader } from "./ui/Card";

interface PlayerStatisticsProps {
  player: Player;
}

export function PlayerStatistics({ player }: PlayerStatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          {player.nationality && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Nationality</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">{player.nationality}</dd>
            </div>
          )}
          {player.date_of_birth && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">{player.date_of_birth}</dd>
            </div>
          )}
          {player.position && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Position</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">{player.position}</dd>
            </div>
          )}
          {player.height && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Height</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">{player.height}</dd>
            </div>
          )}
          {player.weight && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Weight</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">{player.weight}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
