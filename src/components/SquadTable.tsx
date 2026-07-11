import { Player } from "@/lib/db/players";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "./ui/Table";
import Image from "next/image";
import Link from "next/link";

interface SquadTableProps {
  players: Player[];
  teamSlug: string;
}

export function SquadTable({ players, teamSlug }: SquadTableProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No squad data available
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Current Squad
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="w-12"></TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Position</TableCell>
            <TableCell className="hidden sm:table-cell">Nationality</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell>
                {player.photo_url ? (
                  <div className="w-10 h-10 relative">
                    <Image
                      src={player.photo_url}
                      alt={player.name}
                      fill
                      className="rounded-full object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {player.name.charAt(0)}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Link
                  href={`/players/${player.slug}`}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {player.name}
                </Link>
              </TableCell>
              <TableCell>{player.position}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {player.nationality}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
