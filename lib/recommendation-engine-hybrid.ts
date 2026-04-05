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

type SkillRow = {
  skill_name: string;
};

type InterestRow = {
  interest_name: string;
};

export type HybridComputedResult = {
  rank: number;
  careerKey: string;
  careerTitle: string;
  matchScore: number;
  classicScore: number;
  hybridScore: number;
  scoreDelta: number;
  description: string;
  traits: string[];
  factors: {
    academic: number;
    traits: number;
    skills: number;
    interests: number;
    demand: number;
  };
  confidence: number;
};

const CAREER_SKILL_MAP: Record<string, string[]> = {
  software_engineer: ["programming", "problem solving", "algorithms"],
  data_scientist: ["python", "statistics", "machine learning", "analysis"],
  product_manager: ["leadership", "communication", "strategy", "planning"],
  ux_designer: ["design", "research", "figma", "creativity"],
  data_analyst: ["sql", "excel", "analysis", "visualization"],
  cybersecurity_specialist: ["security", "network", "risk", "monitoring"],
  machine_learning_engineer: ["python", "ml", "deep learning", "models"],
  business_analyst: ["analysis", "communication", "requirements", "reporting"],
};

const CAREER_INTEREST_MAP: Record<string, string[]> = {
  software_engineer: ["technology", "coding", "software", "apps"],
  data_scientist: ["data", "research", "analytics", "ai"],
  product_manager: ["business", "product", "leadership", "management"],
  ux_designer: ["design", "ui", "ux", "creativity"],
  data_analyst: ["data", "dashboard", "analytics", "business"],
  cybersecurity_specialist: [
    "security",
    "network",
    "protection",
    "ethical hacking",
  ],
  machine_learning_engineer: ["ai", "ml", "models", "automation"],
  business_analyst: ["business", "operations", "process", "analysis"],
};

const CAREER_DEMAND_SCORE: Record<string, number> = {
  software_engineer: 92,
  data_scientist: 90,
  product_manager: 82,
  ux_designer: 78,
  data_analyst: 85,
  cybersecurity_specialist: 93,
  machine_learning_engineer: 95,
  business_analyst: 80,
};

const KEYWORD_SYNONYMS: Record<string, string[]> = {
  javascript: ["js"],
  typescript: ["ts"],
  "machine learning": ["ml"],
  "artificial intelligence": ["ai"],
  ui: ["user interface"],
  ux: ["user experience"],
  sql: ["structured query language"],
  cybersecurity: ["cyber security", "cybersec"],
  programming: ["coding", "development"],
  analytics: ["analysis"],
};

const SYNONYM_TO_CANONICAL = Object.entries(KEYWORD_SYNONYMS).reduce(
  (accumulator, [canonical, aliases]) => {
    aliases.forEach((alias) => {
      accumulator[alias] = canonical;
    });
    return accumulator;
  },
  {} as Record<string, string>,
);

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function applyScoreFloor(
  score: number,
  academic: number,
  traits: number,
  skills: number,
  interests: number,
): number {
  const coreFit =
    academic * 0.35 + traits * 0.3 + skills * 0.2 + interests * 0.15;

  if (coreFit >= 65 && score < 50) {
    return 50;
  }

  if (coreFit >= 58 && score < 45) {
    return 45;
  }

  return score;
}

function keywordVariants(keyword: string): string[] {
  const normalized = normalizeValue(keyword);
  const canonical = SYNONYM_TO_CANONICAL[normalized] ?? normalized;
  const aliases = KEYWORD_SYNONYMS[canonical] ?? [];

  return [canonical, ...aliases].map((entry) => normalizeValue(entry));
}

function hasKeywordMatch(value: string, keyword: string): boolean {
  const normalizedValue = normalizeValue(value);
  const variants = keywordVariants(keyword);

  return variants.some((variant) => normalizedValue.includes(variant));
}

function normalizeWeights(
  weights: Record<
    "academic" | "traits" | "skills" | "interests" | "demand",
    number
  >,
): Record<"academic" | "traits" | "skills" | "interests" | "demand", number> {
  const total =
    weights.academic +
    weights.traits +
    weights.skills +
    weights.interests +
    weights.demand;

  if (total <= 0) {
    return {
      academic: 0.5,
      traits: 0.5,
      skills: 0,
      interests: 0,
      demand: 0,
    };
  }

  return {
    academic: weights.academic / total,
    traits: weights.traits / total,
    skills: weights.skills / total,
    interests: weights.interests / total,
    demand: weights.demand / total,
  };
}

function keywordMatchScore(
  sourceValues: string[],
  targetKeywords: string[],
): number {
  if (!targetKeywords.length) {
    return 50;
  }

  const matched = targetKeywords.filter((keyword) =>
    sourceValues.some((value) => hasKeywordMatch(value, keyword)),
  ).length;

  return clampScore(Math.round((matched / targetKeywords.length) * 100));
}

function missingKeywordRatio(
  sourceValues: string[],
  targetKeywords: string[],
): number {
  if (!targetKeywords.length) {
    return 0;
  }

  const matched = targetKeywords.filter((keyword) =>
    sourceValues.some((value) => hasKeywordMatch(value, keyword)),
  ).length;

  return (targetKeywords.length - matched) / targetKeywords.length;
}

export async function computeHybridResults(
  studentId: number,
): Promise<HybridComputedResult[]> {
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

  const [skillRows] = await pool.query(
    `SELECT skill_name
     FROM user_skills
     WHERE student_id = ?`,
    [studentId],
  );

  const [interestRows] = await pool.query(
    `SELECT interest_name
     FROM user_interests
     WHERE student_id = ?`,
    [studentId],
  );

  const subjectScoreMap = new Map<string, number>();
  (scoreRows as ScoreRow[]).forEach((row) => {
    subjectScoreMap.set(normalizeValue(row.subject), Number(row.score));
  });

  const traitScoreMap = new Map<string, number>();
  (traitRows as TraitRow[]).forEach((row) => {
    traitScoreMap.set(normalizeValue(row.trait), Number(row.score));
  });

  const normalizedSkills = (skillRows as SkillRow[]).map((row) =>
    normalizeValue(row.skill_name),
  );
  const normalizedInterests = (interestRows as InterestRow[]).map((row) =>
    normalizeValue(row.interest_name),
  );

  const hasAcademic = subjectScoreMap.size > 0;
  const hasTraits = traitScoreMap.size > 0;
  const hasSkills = normalizedSkills.length > 0;
  const hasInterests = normalizedInterests.length > 0;

  const ranked = (careerRows as CareerRow[])
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
        const score = subjectScoreMap.get(normalizeValue(subject)) ?? 50;
        weightedTotal += score * weight;
        weightSum += weight;
      }

      const academicScore = weightSum > 0 ? weightedTotal / weightSum : 50;

      const traitScore = requiredTraits.length
        ? requiredTraits.reduce(
            (accumulator, trait) =>
              accumulator + (traitScoreMap.get(normalizeValue(trait)) ?? 40),
            0,
          ) / requiredTraits.length
        : 50;

      const requiredSkills = CAREER_SKILL_MAP[career.career_key] ?? [];
      const skillScore = keywordMatchScore(normalizedSkills, requiredSkills);

      const requiredInterests = CAREER_INTEREST_MAP[career.career_key] ?? [];
      const interestScore = keywordMatchScore(
        normalizedInterests,
        requiredInterests,
      );

      const demandScore = CAREER_DEMAND_SCORE[career.career_key] ?? 75;

      const classicScore = clampScore(
        Math.round(academicScore * 0.6 + traitScore * 0.4),
      );

      const tunedWeights = normalizeWeights({
        academic: hasAcademic ? 0.31 : 0,
        traits: hasTraits ? 0.31 : 0,
        skills: hasSkills ? 0.22 : 0,
        interests: hasInterests ? 0.11 : 0,
        demand: 0.05,
      });

      const missingSkillPenalty = hasSkills
        ? Math.round(missingKeywordRatio(normalizedSkills, requiredSkills) * 13)
        : 0;
      const missingInterestPenalty = hasInterests
        ? Math.round(
            missingKeywordRatio(normalizedInterests, requiredInterests) * 6,
          )
        : 0;

      const strongSkillBonus = skillScore >= 80 ? 5 : 0;
      const strongInterestBonus = interestScore >= 80 ? 3 : 0;

      const rawScore = clampScore(
        Math.round(
          academicScore * tunedWeights.academic +
            traitScore * tunedWeights.traits +
            skillScore * tunedWeights.skills +
            interestScore * tunedWeights.interests +
            demandScore * tunedWeights.demand -
            missingSkillPenalty -
            missingInterestPenalty +
            strongSkillBonus +
            strongInterestBonus,
        ),
      );

      const finalScore = applyScoreFloor(
        rawScore,
        academicScore,
        traitScore,
        skillScore,
        interestScore,
      );

      const scoreDelta = finalScore - classicScore;

      return {
        careerKey: career.career_key,
        careerTitle: career.career_title,
        description:
          career.description ??
          "Recommended by hybrid scoring from quiz, academics, skills and interests.",
        traits: requiredTraits,
        matchScore: finalScore,
        classicScore,
        hybridScore: finalScore,
        scoreDelta,
        factors: {
          academic: Math.round(academicScore),
          traits: Math.round(traitScore),
          skills: skillScore,
          interests: interestScore,
          demand: Math.round(demandScore),
        },
        skillPenalty: missingSkillPenalty,
        interestPenalty: missingInterestPenalty,
      };
    })
    .sort((left, right) => right.matchScore - left.matchScore);

  const topThree = ranked.slice(0, 3);
  const topGap =
    topThree.length > 1
      ? Math.max(0, topThree[0].matchScore - topThree[1].matchScore)
      : 0;

  const computed = topThree.map((row, index) => {
    const nextScore = topThree[index + 1]?.matchScore ?? row.matchScore;
    const localGap = Math.max(0, row.matchScore - nextScore);

    const dataCompleteness =
      (hasAcademic ? 25 : 0) +
      (hasTraits ? 35 : 0) +
      (hasSkills ? 20 : 0) +
      (hasInterests ? 20 : 0);

    const fitQuality = Math.round(
      row.factors.academic * 0.22 +
        row.factors.traits * 0.22 +
        row.factors.skills * 0.28 +
        row.factors.interests * 0.23 +
        row.factors.demand * 0.05,
    );

    const totalPenalty = row.skillPenalty + row.interestPenalty;
    const gapBoost =
      index === 0
        ? Math.min(15, Math.round(topGap * 1.5))
        : Math.min(8, Math.round(localGap));

    const confidence = clampScore(
      Math.round(
        dataCompleteness * 0.35 +
          fitQuality * 0.45 +
          gapBoost -
          totalPenalty * 0.8,
      ),
    );

    const factorSummary = `Hybrid factors -> academic:${row.factors.academic}, traits:${row.factors.traits}, skills:${row.factors.skills}, interests:${row.factors.interests}, demand:${row.factors.demand}, skillPenalty:${row.skillPenalty}, interestPenalty:${row.interestPenalty}, classic:${row.classicScore}, hybrid:${row.hybridScore}, delta:${row.scoreDelta}, confidence:${confidence}.`;

    return {
      rank: index + 1,
      careerKey: row.careerKey,
      careerTitle: row.careerTitle,
      matchScore: row.matchScore,
      classicScore: row.classicScore,
      hybridScore: row.hybridScore,
      scoreDelta: row.scoreDelta,
      description: `${row.description} ${factorSummary}`,
      traits: row.traits,
      factors: row.factors,
      confidence,
    };
  });

  return computed;
}

export async function computeAndPersistResultsHybrid(
  studentId: number,
): Promise<HybridComputedResult[]> {
  const pool = getDbPool();
  const computed = await computeHybridResults(studentId);

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
