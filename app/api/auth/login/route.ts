import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, createAuthToken, verifyPassword } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

type UserRow = {
  id: number;
  name: string;
  email: string;
  password: string;
  grade: string;
  stream: string;
};

export async function POST(request: NextRequest) {
  let body: LoginRequestBody;
  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request payload" },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: "Email and password are required" },
      { status: 400 },
    );
  }

  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT id, name, email, password, grade, stream
     FROM students
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  const users = rows as UserRow[];
  const user = users[0];

  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Invalid email or password" },
      { status: 401 },
    );
  }

  // Support both bcrypt hashes and legacy plaintext passwords.
  const isBcryptHash =
    user.password.startsWith("$2a$") ||
    user.password.startsWith("$2b$") ||
    user.password.startsWith("$2y$");
  const isPasswordValid = isBcryptHash
    ? await verifyPassword(password, user.password)
    : password === user.password;

  if (!isPasswordValid) {
    return NextResponse.json(
      { ok: false, message: "Invalid email or password" },
      { status: 401 },
    );
  }

  // If user had a legacy plaintext password, migrate it to bcrypt after successful login.
  if (!isBcryptHash) {
    const { hashPassword } = await import("@/lib/auth");
    const migratedHash = await hashPassword(password);
    await pool.query(`UPDATE students SET password = ? WHERE id = ?`, [
      migratedHash,
      user.id,
    ]);
  }

  const token = createAuthToken({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  const response = NextResponse.json(
    {
      ok: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        stream: user.stream,
      },
    },
    { status: 200 },
  );

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
