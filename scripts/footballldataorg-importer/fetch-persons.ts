import { getTursoClient } from "../../src/lib/turso/client";
import { getPersonDetail } from "../../src/lib/api/football-data";

interface FdPerson {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  position: string;
  shirtNumber: number;
  currentTeam: { id: number } | null;
}

export async function fetchPersonDetail(
  personId: number,
  alreadyFetched: Set<number>
): Promise<boolean> {
  if (alreadyFetched.has(personId)) return false;

  const client = getTursoClient();

  try {
    const person = (await getPersonDetail(personId)) as FdPerson;
    if (!person || !person.id) return false;

    await client.execute({
      sql: `INSERT OR REPLACE INTO fbdo_persons (fd_id, name, first_name, last_name, date_of_birth, nationality, position, shirt_number, current_team_id, raw_json, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        person.id,
        person.name || "",
        person.firstName || "",
        person.lastName || "",
        person.dateOfBirth || "",
        person.nationality || "",
        person.position || "",
        person.shirtNumber || null,
        person.currentTeam?.id || null,
        JSON.stringify(person),
      ],
    });
    alreadyFetched.add(personId);
    return true;
  } catch (e: any) {
    console.error(`      Error fetching person ${personId}: ${e.message}`);
    return false;
  }
}
