import { Card, CardContent } from "./ui/Card";
import { Trophy } from "lucide-react";

interface PlayerHonoursProps {
  honours: Array<{
    id: number | bigint;
    honour_name: string;
    season: string | null;
    team_name: string | null;
  }>;
}

export function PlayerHonours({ honours }: PlayerHonoursProps) {
  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Honours
        </h2>
        <div className="space-y-3">
          {honours.map((honour) => (
            <div
              key={honour.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <Trophy className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {honour.honour_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {honour.season && `${honour.season}`}
                  {honour.team_name && ` • ${honour.team_name}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
