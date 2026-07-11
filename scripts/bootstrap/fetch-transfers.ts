import { getTransfers } from "../../src/lib/api/api-football";
import { LEAGUES } from "../../src/lib/leagues";
import { upsertTransfer } from "../../src/lib/db/transfers";

interface ApiFootballTransfer {
  player: {
    id: number;
    name: string;
  };
  update: string;
  transfers: Array<{
    date: string;
    type: string;
    teams: {
      in: { id: number; name: string };
      out: { id: number; name: string };
    };
    detail: string;
  }>;
}

export async function fetchTransfers(): Promise<void> {
  const currentSeason = new Date().getFullYear();

  for (const league of LEAGUES) {
    console.log(`  Fetching transfers for ${league.name}...`);

    try {
      const transfers = (await getTransfers(
        league.apiFootballId,
        currentSeason
      )) as ApiFootballTransfer[];

      let count = 0;
      for (const entry of transfers) {
        for (const transfer of entry.transfers) {
          await upsertTransfer({
            league_slug: league.slug,
            season: String(currentSeason),
            player_name: entry.player.name,
            from_team: transfer.teams.out?.name || null,
            to_team: transfer.teams.in?.name || null,
            transfer_type: transfer.type || null,
            transfer_date: transfer.date || null,
            transfer_fee: transfer.detail || null,
          });
          count++;
        }
      }

      console.log(`  Found ${count} transfers`);
    } catch (error) {
      console.error(`  Error fetching transfers for ${league.name}:`, error);
    }
  }
}
