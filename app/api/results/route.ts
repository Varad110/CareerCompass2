import { NextRequest, NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";
import { computeAndPersistResults } from "@/lib/recommendation-engine";
import { getAuthenticatedUserId } from "@/lib/server-auth";

type ResultRow = {
  rank_position: number;
  career_key: string;
  career_title: string;
  match_score: number;
  analysis: string | null;
  required_traits: string | null;
};

type TraitRow = {
  trait: string;
  score: number;
};

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const pool = getDbPool();

  const [existingRows] = await pool.query(
    `SELECT r.rank_position, r.career_key, r.career_title, r.match_score, r.analysis, c.required_traits
     FROM results r
     LEFT JOIN career_profiles c ON c.career_key = r.career_key
     WHERE r.student_id = ?
     ORDER BY r.rank_position ASC`,
    [userId],
  );

  const hasResults = (existingRows as ResultRow[]).length > 0;

  if (!hasResults) {
    await computeAndPersistResults(userId);
  }

  const [rows] = await pool.query(
    `SELECT r.rank_position, r.career_key, r.career_title, r.match_score, r.analysis, c.required_traits
     FROM results r
     LEFT JOIN career_profiles c ON c.career_key = r.career_key
     WHERE r.student_id = ?
     ORDER BY r.rank_position ASC`,
    [userId],
  );

  const [traitRows] = await pool.query(
    `SELECT trait, score
     FROM trait_scores
     WHERE student_id = ?
     ORDER BY score DESC
     LIMIT 8`,
    [userId],
  );

  const results = (rows as ResultRow[]).map((row) => ({
    rank: row.rank_position,
    careerKey: row.career_key,
    title: row.career_title,
    match: Number(row.match_score),
    description:
      row.analysis ?? "Recommended based on your profile and quiz responses.",
    traits: row.required_traits
      ? (JSON.parse(row.required_traits) as string[])
      : [],
  }));

  const traits = (traitRows as TraitRow[]).map((row) => ({
    trait: row.trait,
    score: Number(row.score),
  }));

  return NextResponse.json({ ok: true, results, traits }, { status: 200 });
}
