import { NextRequest, NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";
import { regenerateQuizVariantForStudent } from "@/lib/quiz-generation";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { broadcastUpdate } from "@/lib/sse-utils";

type CreateScoreBody = {
  subject?: string;
  score?: number;
};

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as CreateScoreBody;
  const subject = body.subject?.trim();
  const score = Number(body.score);

  if (!subject || Number.isNaN(score) || score < 0 || score > 100) {
    return NextResponse.json(
      { ok: false, message: "Provide a valid subject and score (0-100)" },
      { status: 400 },
    );
  }

  const pool = getDbPool();

  await pool.query(
    `INSERT INTO academic_scores (student_id, subject, score)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE score = VALUES(score)`,
    [userId, subject, score],
  );

  try {
    await regenerateQuizVariantForStudent(userId);
  } catch {
    // Keep score update resilient if quiz regeneration fails.
  }

  // Broadcast real-time update
  broadcastUpdate(userId, "score_added", { subject, score });

  return NextResponse.json(
    { ok: true, message: "Score saved" },
    { status: 200 },
  );
}

type DeleteScoreBody = {
  scoreId?: number;
};

export async function DELETE(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as DeleteScoreBody;
  const scoreId = Number(body.scoreId);

  if (!scoreId) {
    return NextResponse.json(
      { ok: false, message: "scoreId is required" },
      { status: 400 },
    );
  }

  const pool = getDbPool();

  await pool.query(
    `DELETE FROM academic_scores
     WHERE id = ? AND student_id = ?`,
    [scoreId, userId],
  );

  try {
    await regenerateQuizVariantForStudent(userId);
  } catch {
    // Keep score delete resilient if quiz regeneration fails.
  }

  // Broadcast real-time update
  broadcastUpdate(userId, "score_removed", { scoreId });

  return NextResponse.json(
    { ok: true, message: "Score removed" },
    { status: 200 },
  );
}
