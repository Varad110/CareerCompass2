import { getDbPool } from "@/lib/db";

type ScoreRow = {
  subject: string;
  score: number;
};

type CareerRow = {
  career_key: string;
  career_title: string;
  description: string | null;
  required_traits: string | null;
  subject_weights: string | null;
};

type TraitRow = {
  trait: string;
  score: number;
};

type ComputedResult = {
  rank: number;
  careerKey: string;
  careerTitle: string;
  matchScore: number;
  description: string;
  traits: string[];
};

function normalizeSubject(subject: string): string {
  return subject.trim().toLowerCase();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export async function computeAndPersistResults(
  studentId: number,
): Promise<ComputedResult[]> {
  const pool = getDbPool();

  const [scoreRows] = await pool.query(
    `SELECT subject, score
     FROM academic_scores
     WHERE student_id = ?`,
    [studentId],
  );

  const [careerRows] = await pool.query(
    `SELECT career_key, career_title, description, required_traits, subject_weights
     FROM career_profiles`,
    [],
  );

  const [traitRows] = await pool.query(
    `SELECT trait, score
     FROM trait_scores
     WHERE student_id = ?`,
    [studentId],
  );

  const subjectScoreMap = new Map<string, number>();

  (scoreRows as ScoreRow[]).forEach((row) => {
    subjectScoreMap.set(normalizeSubject(row.subject), Number(row.score));
  });

  const traitScoreMap = new Map<string, number>();
  (traitRows as TraitRow[]).forEach((row) => {
    traitScoreMap.set(row.trait.toLowerCase(), Number(row.score));
  });

  const computed = (careerRows as CareerRow[])
    .map((career) => {
      const subjectWeights = career.subject_weights
        ? (JSON.parse(career.subject_weights) as Record<string, number>)
        : {};
      const requiredTraits = career.required_traits
        ? (JSON.parse(career.required_traits) as string[])
        : [];

      let weightedTotal = 0;
      let weightSum = 0;

      for (const [subject, weight] of Object.entries(subjectWeights)) {
        const score = subjectScoreMap.get(normalizeSubject(subject)) ?? 50;
        weightedTotal += score * weight;
        weightSum += weight;
      }

      const academicScore = weightSum > 0 ? weightedTotal / weightSum : 50;

      const traitMatch = requiredTraits.length
        ? requiredTraits.reduce(
            (acc, trait) =>
              acc + (traitScoreMap.get(trait.toLowerCase()) ?? 40),
            0,
          ) / requiredTraits.length
        : 50;

      const finalScore = clampScore(
        Math.round(academicScore * 0.6 + traitMatch * 0.4),
      );

      return {
        careerKey: career.career_key,
        careerTitle: career.career_title,
        description:
          career.description ??
          "Recommended based on your profile and performance.",
        traits: requiredTraits,
        matchScore: finalScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)
    .map((row, index) => ({
      rank: index + 1,
      ...row,
    }));

  await pool.query(`DELETE FROM results WHERE student_id = ?`, [studentId]);

  for (const row of computed) {
    await pool.query(
      `INSERT INTO results (student_id, career_key, career_title, match_score, rank_position, analysis)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        row.careerKey,
        row.careerTitle,
        row.matchScore,
        row.rank,
        row.description,
      ],
    );
  }

  return computed;
}
