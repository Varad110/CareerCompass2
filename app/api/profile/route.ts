import { NextRequest, NextResponse } from "next/server";

import { getDbPool } from "@/lib/db";
import { getAuthenticatedUserId } from "@/lib/server-auth";
import { broadcastUpdate } from "@/lib/sse-utils";

type ProfileRow = {
  id: number;
  name: string;
  email: string;
  grade: string;
  stream: string;
};

type ScoreRow = {
  id: number;
  subject: string;
  score: number;
};

type SkillRow = {
  skill_name: string;
  proficiency_level: number;
};

type InterestRow = {
  interest_name: string;
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

  const [profileRows] = await pool.query(
    `SELECT id, name, email, grade, stream
     FROM students
     WHERE id = ?
     LIMIT 1`,
    [userId],
  );

  const profile = (profileRows as ProfileRow[])[0];

  if (!profile) {
    return NextResponse.json(
      { ok: false, message: "Student not found" },
      { status: 404 },
    );
  }

  const [scoreRows] = await pool.query(
    `SELECT id, subject, score
     FROM academic_scores
     WHERE student_id = ?
     ORDER BY subject ASC`,
    [userId],
  );

  const [skillRows] = await pool.query(
    `SELECT skill_name, proficiency_level
     FROM user_skills
     WHERE student_id = ?
     ORDER BY skill_name ASC`,
    [userId],
  );

  const [interestRows] = await pool.query(
    `SELECT interest_name
     FROM user_interests
     WHERE student_id = ?
     ORDER BY interest_name ASC`,
    [userId],
  );

  return NextResponse.json(
    {
      ok: true,
      profile,
      scores: scoreRows as ScoreRow[],
      skills: (skillRows as SkillRow[]).map((row) => ({
        name: row.skill_name,
        level: row.proficiency_level,
      })),
      interests: (interestRows as InterestRow[]).map(
        (row) => row.interest_name,
      ),
    },
    { status: 200 },
  );
}

type UpdateProfileBody = {
  name?: string;
  email?: string;
  grade?: string;
  stream?: string;
};

export async function PUT(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as UpdateProfileBody;

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const grade = body.grade?.trim();
  const stream = body.stream?.trim();

  if (!name || !email || !grade || !stream) {
    return NextResponse.json(
      { ok: false, message: "All profile fields are required" },
      { status: 400 },
    );
  }

  const pool = getDbPool();

  try {
    await pool.query(
      `UPDATE students
       SET name = ?, email = ?, grade = ?, stream = ?
       WHERE id = ?`,
      [name, email, grade, stream, userId],
    );

    // Broadcast the update
    broadcastUpdate(userId, "profile_updated", {
      name,
      email,
      grade,
      stream,
    });
  } catch (error) {
    const sqlError = error as { code?: string };
    if (sqlError.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { ok: false, message: "Email is already in use" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { ok: false, message: "Failed to update profile" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, message: "Profile updated successfully" },
    { status: 200 },
  );
}

// Broadcast the update after returning response
export async function putWithBroadcast(request: NextRequest) {
  const userId = getAuthenticatedUserId(request);
  const body = (await request.json()) as UpdateProfileBody;

  broadcastUpdate(userId!, "profile_updated", {
    name: body.name,
    email: body.email,
    grade: body.grade,
    stream: body.stream,
  });
}
