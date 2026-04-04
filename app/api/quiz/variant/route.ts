import { NextRequest, NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/server-auth";

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

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const variantIdParam = request.nextUrl.searchParams.get("variantId");
  const variantId = variantIdParam ? Number(variantIdParam) : null;

  if (
    variantIdParam &&
    (!Number.isFinite(variantId) || Number(variantId) <= 0)
  ) {
    return NextResponse.json(
      { ok: false, message: "Invalid variantId" },
      { status: 400 },
    );
  }

  const pool = getDbPool();

  const [rows] = await pool.query(
    variantId
      ? `SELECT id, variant_key, generation_mode, ai_provider, ai_model, ai_raw_response, seed_payload, question_count, created_at
         FROM quiz_variants
         WHERE id = ? AND student_id = ?
         LIMIT 1`
      : `SELECT id, variant_key, generation_mode, ai_provider, ai_model, ai_raw_response, seed_payload, question_count, created_at
         FROM quiz_variants
         WHERE student_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
    variantId ? [variantId, userId] : [userId],
  );

  const variant = (rows as VariantRow[])[0] ?? null;
  if (!variant) {
    return NextResponse.json(
      { ok: false, message: "Quiz variant not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      quizVariant: {
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
      },
    },
    { status: 200 },
  );
}
