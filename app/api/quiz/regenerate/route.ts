import { NextRequest, NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";
import { regenerateQuizVariantForStudent } from "@/lib/quiz-generation";
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

type VariantRow = {
  id: number;
  variant_key: string;
  generation_mode: string;
  ai_provider: string | null;
  ai_model: string | null;
  ai_raw_response: string | null;
  seed_payload: string | null;
  question_count: number;
  created_at: string;
};

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const pool = getDbPool();

  const generatedVariant = await regenerateQuizVariantForStudent(userId);
  if (!generatedVariant) {
    return NextResponse.json(
      { ok: false, message: "Unable to regenerate quiz variant" },
      { status: 404 },
    );
  }
  const [variantRows] = await pool.query(
    `SELECT id, variant_key, generation_mode, ai_provider, ai_model, ai_raw_response, seed_payload, question_count, created_at
     FROM quiz_variants
     WHERE id = ?
     LIMIT 1`,
    [generatedVariant.id],
  );

  const variant = (variantRows as VariantRow[])[0] ?? null;

  const [rows] = await pool.query(
    `SELECT id, question_text, option_a, option_b, option_c, option_d, trait_a, trait_b, trait_c, trait_d, category
     FROM quiz_questions
     WHERE quiz_variant_id = ?
     ORDER BY question_order ASC, id ASC`,
    [generatedVariant.id],
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

  return NextResponse.json(
    {
      ok: true,
      message: "Quiz regenerated",
      quizVariant: variant
        ? {
            id: variant.id,
            key: variant.variant_key,
            generationMode: variant.generation_mode,
            aiProvider: variant.ai_provider,
            aiModel: variant.ai_model,
            aiRawResponse: variant.ai_raw_response,
            questionCount: variant.question_count,
            createdAt: variant.created_at,
            seedPayload: variant.seed_payload
              ? JSON.parse(variant.seed_payload)
              : null,
          }
        : null,
      questions,
    },
    { status: 200 },
  );
}
