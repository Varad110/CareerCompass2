import { NextResponse } from "next/server";

import { testDatabaseConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await testDatabaseConnection();

    return NextResponse.json(
      {
        ok: true,
        message: "Database connection successful",
        checkedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        ok: false,
        message: "Database connection failed",
        error: message,
      },
      { status: 500 },
    );
  }
}
