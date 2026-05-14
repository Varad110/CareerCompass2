import { NextRequest, NextResponse } from "next/server";

import { evaluatePredictiveModel } from "@/lib/recommendation-engine-predictive";
import { getAuthenticatedUserId } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const evaluation = await evaluatePredictiveModel();

  return NextResponse.json(
    {
      ok: true,
      algorithm: "predictive",
      evaluation,
    },
    { status: 200 },
  );
}
