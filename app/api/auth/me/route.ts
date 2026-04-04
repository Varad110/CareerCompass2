import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

type MeRow = {
  id: number;
  name: string;
  email: string;
  grade: string;
  stream: string;
};

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return NextResponse.json(
      { ok: false, message: "Invalid session" },
      { status: 401 },
    );
  }

  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT id, name, email, grade, stream
     FROM students
     WHERE id = ?
     LIMIT 1`,
    [payload.userId],
  );

  const users = rows as MeRow[];
  const user = users[0];

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "User not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, user }, { status: 200 });
}
