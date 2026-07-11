import { Standing } from "@/lib/db/standings";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "./ui/Table";
import { TeamBadge } from "./TeamBadge";
import Link from "next/link";

function teamSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface StandingsTableProps {
  standings: Standing[];
}

export function StandingsTable({ standings }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No standings available
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Standings
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="w-12">#</TableCell>
            <TableCell>Team</TableCell>
            <TableCell className="text-center">P</TableCell>
            <TableCell className="text-center">W</TableCell>
            <TableCell className="text-center">D</TableCell>
            <TableCell className="text-center">L</TableCell>
            <TableCell className="text-center">GD</TableCell>
            <TableCell className="text-center">PTS</TableCell>
            <TableCell className="hidden sm:table-cell">Form</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((standing) => (
            <TableRow key={standing.id}>
              <TableCell className="font-medium">{standing.position}</TableCell>
              <TableCell>
                <Link
                  href={`/teams/${teamSlug(standing.team_name || "")}`}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                >
                  <TeamBadge
                    badgeUrl={standing.team_badge}
                    teamName={standing.team_name || ""}
                    size="sm"
                  />
                  <span className="font-medium">{standing.team_name}</span>
                </Link>
              </TableCell>
              <TableCell className="text-center">{standing.played}</TableCell>
              <TableCell className="text-center">{standing.won}</TableCell>
              <TableCell className="text-center">{standing.drawn}</TableCell>
              <TableCell className="text-center">{standing.lost}</TableCell>
              <TableCell className="text-center">
                {standing.goal_difference > 0 ? "+" : ""}
                {standing.goal_difference}
              </TableCell>
              <TableCell className="text-center font-bold">
                {standing.points}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {standing.form && (
                  <div className="flex space-x-1">
                    {standing.form.split(",").map((result, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          result.trim() === "W"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : result.trim() === "D"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {result.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
