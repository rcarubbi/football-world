"use client";

import { useState } from "react";
import { TransferCard } from "./TransferCard";
import type { Transfer } from "@/lib/db/transfers";

interface TransferHistoryProps {
  transfers: Transfer[];
  showSeasonFilter?: boolean;
  showTeamFilter?: boolean;
}

export function TransferHistory({
  transfers,
  showSeasonFilter = false,
  showTeamFilter = false,
}: TransferHistoryProps) {
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  const seasons = Array.from(new Set(transfers.map((t) => t.season).filter(Boolean))) as string[];
  const teams = Array.from(
    new Set(
      transfers.flatMap((t) => [t.from_team, t.to_team]).filter(Boolean)
    )
  ) as string[];

  const filteredTransfers = transfers.filter((t) => {
    if (selectedSeason !== "all" && t.season !== selectedSeason) return false;
    if (
      selectedTeam !== "all" &&
      t.from_team !== selectedTeam &&
      t.to_team !== selectedTeam
    )
      return false;
    return true;
  });

  if (transfers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Recent Transfers
        </h2>
        <div className="flex gap-2">
          {showSeasonFilter && seasons.length > 0 && (
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Seasons</option>
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          )}
          {showTeamFilter && teams.length > 0 && (
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {filteredTransfers.slice(0, 10).map((transfer, index) => (
          <TransferCard key={transfer.id || index} transfer={transfer} />
        ))}
      </div>
    </div>
  );
}
