import { NextRequest, NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";
import { computeAndPersistResults } from "@/lib/recommendation-engine";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { broadcastUpdate } from "@/lib/sse-utils";

type QuizAnswer = {
  questionId: number;
  selectedOption: "a" | "b" | "c" | "d";
};

type SubmitBody = {
  answers?: QuizAnswer[];
};

type QuestionTraitRow = {
  id: number;
  trait_a: string;
  trait_b: string;
  trait_c: string;
  trait_d: string;
};

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as SubmitBody;
  const answers = body.answers ?? [];

  if (!answers.length) {
    return NextResponse.json(
      { ok: false, message: "No quiz answers submitted" },
      { status: 400 },
    );
  }

  const questionIds = answers.map((item) => item.questionId);
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [questionRows] = await connection.query(
      `SELECT id, trait_a, trait_b, trait_c, trait_d
       FROM quiz_questions
       WHERE id IN (${questionIds.map(() => "?").join(",")})`,
      questionIds,
    );

    const traitMap = new Map<number, QuestionTraitRow>();
    (questionRows as QuestionTraitRow[]).forEach((row) => {
      traitMap.set(row.id, row);
    });

    await connection.query(`DELETE FROM quiz_responses WHERE student_id = ?`, [
      userId,
    ]);
    await connection.query(`DELETE FROM trait_scores WHERE student_id = ?`, [
      userId,
    ]);

    const traitTotals = new Map<string, number>();

    for (const answer of answers) {
      const question = traitMap.get(answer.questionId);
      if (!question) {
        continue;
      }

      const trait =
        answer.selectedOption === "a"
          ? question.trait_a
          : answer.selectedOption === "b"
            ? question.trait_b
            : answer.selectedOption === "c"
              ? question.trait_c
              : question.trait_d;

      await connection.query(
        `INSERT INTO quiz_responses (student_id, question_id, selected_option, trait_scored)
         VALUES (?, ?, ?, ?)`,
        [userId, answer.questionId, answer.selectedOption, trait],
      );

      traitTotals.set(trait, (traitTotals.get(trait) ?? 0) + 1);
    }

    for (const [trait, count] of traitTotals.entries()) {
      const normalized = Math.min(100, count * 20);
      await connection.query(
        `INSERT INTO trait_scores (student_id, trait, score)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score)`,
        [userId, trait, normalized],
      );
    }

    const [attemptRows] = await connection.query(
      `SELECT COALESCE(MAX(attempt_number), 0) AS max_attempt
       FROM quiz_attempts
       WHERE student_id = ?`,
      [userId],
    );

    const attemptNumber =
      Number(
        (attemptRows as Array<{ max_attempt: number }>)[0]?.max_attempt ?? 0,
      ) + 1;

    await connection.query(
      `INSERT INTO quiz_attempts (student_id, attempt_number, total_score)
       VALUES (?, ?, ?)`,
      [userId, attemptNumber, answers.length],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    const message =
      error instanceof Error ? error.message : "Failed to save quiz";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  } finally {
    connection.release();
  }

  const results = await computeAndPersistResults(userId);

  // Broadcast real-time update with new results
  broadcastUpdate(userId, "quiz_completed", {
    message: "Quiz submitted successfully",
    results,
  });

  return NextResponse.json(
    { ok: true, message: "Quiz submitted", results },
    { status: 200 },
  );
}
