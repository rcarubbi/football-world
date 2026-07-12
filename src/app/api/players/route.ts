import { NextRequest, NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso/client";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(60, Math.max(1, parseInt(url.searchParams.get("limit") || "30", 10)));
  const q = url.searchParams.get("q") || "";
  const position = url.searchParams.get("position") || "";

  const client = getTursoClient();

  let sql = `
    SELECT p.id, p.name, p.slug, p.photo_url, p.position, p.nationality,
           t.name as team_name, t.badge_url as team_badge
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
  `;
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (q) {
    conditions.push("LOWER(p.name) LIKE ?");
    args.push(`%${q.toLowerCase()}%`);
  }
  if (position) {
    conditions.push("LOWER(p.position) = ?");
    args.push(position.toLowerCase());
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY p.name";

  const offset = (page - 1) * limit;
  sql += ` LIMIT ? OFFSET ?`;
  args.push(limit, offset);

  const result = await client.execute({ sql, args });

  let countSql = "SELECT COUNT(*) as n FROM players p";
  if (conditions.length > 0) {
    countSql += " WHERE " + conditions.join(" AND ");
  }
  const countResult = await client.execute({ sql: countSql, args: args.slice(0, conditions.length) });
  const total = countResult.rows[0].n as number;

  return NextResponse.json({
    players: result.rows,
    total,
    page,
    hasMore: offset + limit < total,
  });
}
