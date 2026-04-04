import { NextRequest, NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";
import { computeAndPersistResults } from "@/lib/recommendation-engine";
import { getAuthenticatedUserId } from "@/lib/server-auth";

type ProfileRow = {
  id: number;
  name: string;
  email: string;
  grade: string;
  stream: string;
};

type ResultRow = {
  rank_position: number;
  career_title: string;
  match_score: number;
};

type ActivityRow = {
  action: string;
  happened_at: string;
};

function toRelativeLabel(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours <= 1) {
    return "Today";
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }

  return `${diffDays} days ago`;
}

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const pool = getDbPool();

  const [profileRows] = await pool.query(
    `SELECT id, name, email, grade, stream
     FROM students
     WHERE id = ?
     LIMIT 1`,
    [userId],
  );

  const profile = (profileRows as ProfileRow[])[0];

  if (!profile) {
    return NextResponse.json(
      { ok: false, message: "Student not found" },
      { status: 404 },
    );
  }

  const [existingResultRows] = await pool.query(
    `SELECT rank_position, career_title, match_score
     FROM results
     WHERE student_id = ?
     ORDER BY rank_position ASC`,
    [userId],
  );

  if ((existingResultRows as ResultRow[]).length === 0) {
    await computeAndPersistResults(userId);
  }

  const [resultRows] = await pool.query(
    `SELECT rank_position, career_title, match_score
     FROM results
     WHERE student_id = ?
     ORDER BY rank_position ASC
     LIMIT 3`,
    [userId],
  );

  const [attemptRows] = await pool.query(
    `SELECT COUNT(*) AS total_attempts
     FROM quiz_attempts
     WHERE student_id = ?`,
    [userId],
  );

  const [activityRows] = await pool.query(
    `SELECT action, happened_at
     FROM (
       SELECT 'Completed aptitude quiz' AS action, completion_date AS happened_at
       FROM quiz_attempts
       WHERE student_id = ?
       UNION ALL
       SELECT CONCAT('Updated score: ', subject) AS action, created_at AS happened_at
       FROM academic_scores
       WHERE student_id = ?
       UNION ALL
       SELECT CONCAT('Generated result: ', career_title) AS action, generated_at AS happened_at
       FROM results
       WHERE student_id = ?
     ) activity
     ORDER BY happened_at DESC
     LIMIT 5`,
    [userId, userId, userId],
  );

  const matches = (resultRows as ResultRow[]).map((row) => ({
    rank: row.rank_position,
    title: row.career_title,
    match: Number(row.match_score),
    color:
      row.rank_position === 1
        ? "bg-green-500"
        : row.rank_position === 2
          ? "bg-blue-500"
          : "bg-purple-500",
  }));

  const bestMatch = matches[0]?.match ?? 0;
  const testsDone = Number(
    (attemptRows as Array<{ total_attempts: number }>)[0]?.total_attempts ?? 0,
  );

  const recentActivity = (activityRows as ActivityRow[]).map((row) => ({
    action: row.action,
    date: toRelativeLabel(row.happened_at),
    status: "completed",
  }));

  return NextResponse.json(
    {
      ok: true,
      profile,
      matches,
      stats: {
        grade: profile.grade,
        stream: profile.stream,
        testsDone,
        topMatchScore: bestMatch,
      },
      recentActivity,
    },
    { status: 200 },
  );
}
