import { formatDate } from "@/lib/date-format";

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

interface WorldCupMatchProps {
  match: WorldCupMatchData;
  large?: boolean;
}

export function WorldCupMatch({ match, large = false }: WorldCupMatchProps) {
  const isFinished = match.status === "FINISHED";

  return (
    <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800 ${large ? "p-4" : ""}`}>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        {match.match_date ? formatDate(match.match_date) : ""}
        {match.venue && <span className="ml-2">• {match.venue}</span>}
      </div>
      <div className={`flex items-center justify-between ${large ? "text-lg" : "text-sm"}`}>
        <span className="font-medium text-gray-900 dark:text-white flex-1 truncate">
          {match.home_team_name}
        </span>
        <span className={`font-bold mx-2 ${isFinished ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}>
          {match.home_score} - {match.away_score}
        </span>
        <span className="font-medium text-gray-900 dark:text-white flex-1 truncate text-right">
          {match.away_team_name}
        </span>
      </div>
    </div>
  );
}
