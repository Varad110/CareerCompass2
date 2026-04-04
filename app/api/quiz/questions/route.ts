import { NextRequest, NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/server-auth";

type QuestionRow = {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  trait_a: string;
  trait_b: string;
  trait_c: string;
  trait_d: string;
  category: string;
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
  const [rows] = await pool.query(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, trait_a, trait_b, trait_c, trait_d, category
     FROM quiz_questions
     ORDER BY id ASC`,
    [],
  );

  const questions = (rows as QuestionRow[]).map((row) => ({
    id: row.id,
    question: row.question_text,
    category: row.category,
    options: [
      { id: "a", text: row.option_a, trait: row.trait_a },
      { id: "b", text: row.option_b, trait: row.trait_b },
      { id: "c", text: row.option_c, trait: row.trait_c },
      { id: "d", text: row.option_d, trait: row.trait_d },
    ],
  }));

  return NextResponse.json({ ok: true, questions }, { status: 200 });
}
