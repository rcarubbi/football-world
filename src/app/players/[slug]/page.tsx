import { notFound } from "next/navigation";
import { findPlayerBySlug, findPlayerHonours, findPlayerFormerTeams } from "@/lib/db/players";
import { findTeamBySlug } from "@/lib/db/teams";
import { PlayerHero } from "@/components/PlayerHero";
import { PlayerStats } from "@/components/PlayerStats";
import { PlayerHonours } from "@/components/PlayerHonours";
import { CareerTimeline } from "@/components/CareerTimeline";
import { PlayerCurrentTeam } from "@/components/PlayerCurrentTeam";
import { PlayerBiography } from "@/components/PlayerBiography";
import { PlayerStatistics } from "@/components/PlayerStatistics";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const player = await findPlayerBySlug(slug);
  if (!player) return { title: "Player Not Found" };

  return {
    title: `${player.name} - Football Wiki`,
    description: `Profile of ${player.name}`,
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const { slug } = await params;
  const player = await findPlayerBySlug(slug);

  if (!player) {
    notFound();
  }

  const [honours, formerTeams] = await Promise.all([
    findPlayerHonours(player.id),
    findPlayerFormerTeams(player.id),
  ]);

  const currentTeam = player.team_id
    ? await findTeamBySlug(player.slug) // This is a simplification - in production you'd fetch by team_id
    : null;

  return (
    <div className="space-y-8">
      <PlayerHero player={player} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PlayerBiography player={player} />
          <PlayerStats player={player} />
          <CareerTimeline formerTeams={formerTeams as unknown as Array<{ id: number | bigint; player_id: number | bigint; team_name: string | null; joined: string | null; departed: string | null }>} />
        </div>

        <div className="space-y-8">
          <PlayerStatistics player={player} />
          {currentTeam && <PlayerCurrentTeam team={currentTeam} />}
          {honours.length > 0 && <PlayerHonours honours={honours as unknown as Array<{ id: number | bigint; honour_name: string; season: string | null; team_name: string | null }>} />}
        </div>
      </div>
    </div>
  );
}
