import { Card, CardContent } from "./ui/Card";
import { Calendar } from "lucide-react";

interface CareerTimelineProps {
  formerTeams: Array<{
    id: number | bigint;
    player_id: number | bigint;
    team_name: string | null;
    joined: string | null;
    departed: string | null;
  }>;
}

export function CareerTimeline({ formerTeams }: CareerTimelineProps) {
  if (formerTeams.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Career Timeline
        </h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-6">
            {formerTeams.map((team, index) => (
              <div key={team.id} className="relative pl-10">
                <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-400 flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {team.team_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {team.joined && `Joined ${team.joined}`}
                    {team.departed && ` • Left ${team.departed}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
