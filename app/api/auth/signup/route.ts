import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, createAuthToken, hashPassword } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { createAndStoreQuizVariant } from "@/lib/quiz-generation";
import { ensureQuizSchema } from "@/lib/quiz-schema";

type SignupRequestBody = {
  name?: string;
  email?: string;
  password?: string;
  grade?: string;
  stream?: string;
  academicScores?: Record<string, number>;
  skills?: string[];
  interests?: string[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SignupRequestBody;

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const grade = body.grade?.trim();
  const stream = body.stream?.trim();
  const academicScores = body.academicScores ?? {};
  const skills = Array.isArray(body.skills) ? body.skills : [];
  const interests = Array.isArray(body.interests) ? body.interests : [];

  if (!name || !email || !grade || !stream || !password) {
    return NextResponse.json(
      { ok: false, message: "Missing required fields" },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, message: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const scoreEntries = Object.entries(academicScores);
  if (scoreEntries.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Academic scores are required" },
      { status: 400 },
    );
  }

  for (const [, score] of scoreEntries) {
    if (
      typeof score !== "number" ||
      Number.isNaN(score) ||
      score < 0 ||
      score > 100
    ) {
      return NextResponse.json(
        { ok: false, message: "Scores must be numbers between 0 and 100" },
        { status: 400 },
      );
    }
  }

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const passwordHash = await hashPassword(password);

    const [studentResult] = await connection.query(
      `INSERT INTO students (name, email, password, grade, stream)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, passwordHash, grade, stream],
    );

    const studentInsert = studentResult as { insertId: number };
    const studentId = studentInsert.insertId;

    for (const [subject, score] of scoreEntries) {
      await connection.query(
        `INSERT INTO academic_scores (student_id, subject, score)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score)`,
        [studentId, subject, score],
      );
    }

    for (const skill of skills) {
      const normalizedSkill = skill.trim();
      if (!normalizedSkill) {
        continue;
      }

      await connection.query(
        `INSERT INTO user_skills (student_id, skill_name, proficiency_level)
         VALUES (?, ?, 3)
         ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level)`,
        [studentId, normalizedSkill],
      );
    }

    for (const interest of interests) {
      const normalizedInterest = interest.trim();
      if (!normalizedInterest) {
        continue;
      }

      await connection.query(
        `INSERT INTO user_interests (student_id, interest_name)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE interest_name = VALUES(interest_name)`,
        [studentId, normalizedInterest],
      );
    }

    await connection.commit();

    try {
      await ensureQuizSchema();
      await createAndStoreQuizVariant({
        studentId,
        name,
        grade,
        stream,
        skills,
        interests,
      });
    } catch {
      // Keep account creation resilient if quiz generation or persistence fails.
    }

    const token = createAuthToken({
      userId: studentId,
      email,
      name,
    });

    const response = NextResponse.json(
      {
        ok: true,
        message: "Account created successfully",
        user: {
          id: studentId,
          name,
          email,
          grade,
          stream,
        },
      },
      { status: 201 },
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
  } catch (error) {
    await connection.rollback();

    const sqlError = error as { code?: string; message?: string };

    if (sqlError.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { ok: false, message: "Email is already registered" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, message: sqlError.message ?? "Failed to create account" },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
