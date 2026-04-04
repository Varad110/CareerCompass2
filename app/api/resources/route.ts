import { NextRequest, NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/server-auth";

type ResourceRow = {
  id: number;
  resource_title: string;
  resource_type: "course" | "book" | "skill" | "certification";
  description: string | null;
  url: string | null;
  career_key: string;
  career_title: string | null;
};

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const careerKey = searchParams.get("careerKey");

  const pool = getDbPool();

  const [resultRows] = await pool.query(
    `SELECT career_key
     FROM results
     WHERE student_id = ?
     ORDER BY rank_position ASC
     LIMIT 3`,
    [userId],
  );

  const recommendedKeys = (resultRows as Array<{ career_key: string }>).map(
    (row) => row.career_key,
  );

  const filters: string[] = [];
  const params: Array<string | number> = [];

  if (careerKey) {
    filters.push("r.career_key = ?");
    params.push(careerKey);
  } else if (recommendedKeys.length > 0) {
    filters.push(
      `r.career_key IN (${recommendedKeys.map(() => "?").join(",")})`,
    );
    params.push(...recommendedKeys);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT r.id, r.resource_title, r.resource_type, r.description, r.url, r.career_key, c.career_title
     FROM resources r
     LEFT JOIN career_profiles c ON c.career_key = r.career_key
     ${whereClause}
     ORDER BY r.created_at DESC`,
    params,
  );

  const resources = (rows as ResourceRow[]).map((row) => ({
    id: row.id,
    title: row.resource_title,
    type: row.resource_type,
    career: row.career_title ?? row.career_key,
    description: row.description ?? "",
    url: row.url ?? "#",
  }));

  return NextResponse.json(
    { ok: true, resources, recommendedKeys },
    { status: 200 },
  );
}
