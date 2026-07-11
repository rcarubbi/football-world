import { notFound } from "next/navigation";
import { getTursoClient } from "@/lib/turso/client";
import { WorldCupTournament } from "@/components/WorldCupTournament";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;
  return {
    title: `FIFA World Cup ${year} - Football Wiki`,
    description: `FIFA World Cup ${year} tournament details`,
  };
}

export default async function WorldCupYearPage({ params }: PageProps) {
  const { year } = await params;
  const yearNum = parseInt(year);

  if (isNaN(yearNum) || yearNum < 1930 || yearNum > 2030) {
    notFound();
  }

  const client = getTursoClient();
  const result = await client.execute({
    sql: "SELECT * FROM world_cup_matches WHERE match_date LIKE ? ORDER BY matchday",
    args: [`${yearNum}%`],
  });

  const matches = result.rows;

  if (matches.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <WorldCupTournament year={yearNum} matches={matches as never[]} />
    </div>
  );
}
