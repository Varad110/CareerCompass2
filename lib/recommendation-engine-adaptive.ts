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
  proficiency_level: number;
};

type InterestRow = {
  interest_name: string;
};

type AttemptStatsRow = {
  attempts: number;
};

type CohortCareerRow = {
  career_key: string;
  avg_match: number;
  sample_count: number;
};

type WeightedKeyword = {
  value: string;
  weight: number;
};

export type AdaptiveComputedResult = {
  rank: number;
  careerKey: string;
  careerTitle: string;
  matchScore: number;
  classicScore: number;
  hybridScore: number;
  adaptiveScore: number;
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
  adaptiveDetails: {
    weights: {
      academic: number;
      traits: number;
      skills: number;
      interests: number;
      demand: number;
    };
    penalties: {
      skill: number;
      interest: number;
      academics: number;
      traits: number;
      consistency: number;
    };
    bonuses: {
      consistency: number;
      skillInterest: number;
      academicSkill: number;
    };
    calibration: {
      cohortShift: number;
      cohortSampleCount: number;
      attemptReliability: number;
    };
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

function weightedKeywordMatchScore(
  sourceValues: WeightedKeyword[],
  targetKeywords: string[],
): number {
  if (!targetKeywords.length) {
    return 50;
  }

  const weightedMatched = targetKeywords.reduce((total, keyword) => {
    const bestWeight = sourceValues.reduce((best, source) => {
      if (!hasKeywordMatch(source.value, keyword)) {
        return best;
      }

      return Math.max(best, source.weight);
    }, 0);

    return total + bestWeight;
  }, 0);

  return clampScore(
    Math.round((weightedMatched / targetKeywords.length) * 100),
  );
}

function missingKeywordRatio(
  sourceValues: WeightedKeyword[],
  targetKeywords: string[],
): number {
  if (!targetKeywords.length) {
    return 0;
  }

  const weightedMissing = targetKeywords.reduce((total, keyword) => {
    const bestWeight = sourceValues.reduce((best, source) => {
      if (!hasKeywordMatch(source.value, keyword)) {
        return best;
      }

      return Math.max(best, source.weight);
    }, 0);

    return total + (1 - bestWeight);
  }, 0);

  return weightedMissing / targetKeywords.length;
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
      academic: 0.34,
      traits: 0.33,
      skills: 0.18,
      interests: 0.1,
      demand: 0.05,
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

function standardDeviation(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

export async function computeAdaptiveResults(
  studentId: number,
): Promise<AdaptiveComputedResult[]> {
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
    `SELECT skill_name, proficiency_level
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

  const [attemptRows] = await pool.query(
    `SELECT COUNT(*) AS attempts
     FROM quiz_attempts
     WHERE student_id = ?`,
    [studentId],
  );

  const [cohortRows] = await pool.query(
    `SELECT career_key, AVG(match_score) AS avg_match, COUNT(*) AS sample_count
     FROM results
     GROUP BY career_key`,
    [],
  );

  const subjectScoreMap = new Map<string, number>();
  (scoreRows as ScoreRow[]).forEach((row) => {
    subjectScoreMap.set(normalizeValue(row.subject), Number(row.score));
  });

  const traitScoreMap = new Map<string, number>();
  (traitRows as TraitRow[]).forEach((row) => {
    traitScoreMap.set(normalizeValue(row.trait), Number(row.score));
  });

  const normalizedSkills = (skillRows as SkillRow[]).map((row) => ({
    value: normalizeValue(row.skill_name),
    weight: clampScore(Number(row.proficiency_level) * 20) / 100,
  }));
  const normalizedInterests = (interestRows as InterestRow[]).map((row) => ({
    value: normalizeValue(row.interest_name),
    weight: 1,
  }));

  const hasAcademic = subjectScoreMap.size > 0;
  const hasTraits = traitScoreMap.size > 0;
  const hasSkills = normalizedSkills.length > 0;
  const hasInterests = normalizedInterests.length > 0;

  const coverageAcademic = Math.min(1, subjectScoreMap.size / 4);
  const coverageTraits = Math.min(1, traitScoreMap.size / 6);
  const coverageSkills = Math.min(1, normalizedSkills.length / 5);
  const coverageInterests = Math.min(1, normalizedInterests.length / 5);

  const attemptCount = Number(
    (attemptRows as AttemptStatsRow[])[0]?.attempts ?? 0,
  );
  const attemptReliability = Math.min(1, attemptCount / 4);

  const cohortMap = new Map<
    string,
    { avgMatch: number; sampleCount: number }
  >();
  (cohortRows as CohortCareerRow[]).forEach((row) => {
    cohortMap.set(row.career_key, {
      avgMatch: Number(row.avg_match),
      sampleCount: Number(row.sample_count),
    });
  });

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
      const skillScore = weightedKeywordMatchScore(
        normalizedSkills,
        requiredSkills,
      );

      const requiredInterests = CAREER_INTEREST_MAP[career.career_key] ?? [];
      const interestScore = weightedKeywordMatchScore(
        normalizedInterests,
        requiredInterests,
      );

      const demandScore = CAREER_DEMAND_SCORE[career.career_key] ?? 75;

      const classicScore = clampScore(
        Math.round(academicScore * 0.6 + traitScore * 0.4),
      );

      const hybridBaseline = clampScore(
        Math.round(
          academicScore * 0.25 +
            traitScore * 0.25 +
            skillScore * 0.25 +
            interestScore * 0.2 +
            demandScore * 0.05,
        ),
      );

      const tunedWeights = normalizeWeights({
        academic: hasAcademic ? 0.27 + coverageAcademic * 0.08 : 0,
        traits: hasTraits ? 0.25 + coverageTraits * 0.06 : 0,
        skills: hasSkills ? 0.25 + coverageSkills * 0.1 : 0,
        interests: hasInterests ? 0.18 + coverageInterests * 0.08 : 0,
        demand: 0.06 + (1 - Math.max(coverageSkills, coverageInterests)) * 0.04,
      });

      const weightedCore =
        academicScore * tunedWeights.academic +
        traitScore * tunedWeights.traits +
        skillScore * tunedWeights.skills +
        interestScore * tunedWeights.interests +
        demandScore * tunedWeights.demand;

      const cohort = cohortMap.get(career.career_key);
      const cohortSample = cohort?.sampleCount ?? 0;
      const cohortConfidence = Math.min(1, cohortSample / 30);
      const cohortShift = cohort
        ? Math.max(
            -4,
            Math.min(7, (cohort.avgMatch - 50) * 0.18 * cohortConfidence),
          )
        : 0;

      const criticalSkillPenalty = hasSkills
        ? Math.round(missingKeywordRatio(normalizedSkills, requiredSkills) * 19)
        : 0;
      const interestMismatchPenalty = hasInterests
        ? Math.round(
            missingKeywordRatio(normalizedInterests, requiredInterests) * 8,
          )
        : 0;
      const lowAcademicPenalty =
        academicScore < 45 && demandScore >= 85 ? 5 : 0;
      const lowTraitPenalty =
        traitScore < 45 && requiredTraits.length >= 2 ? 4 : 0;

      const coherenceStd = standardDeviation([
        academicScore,
        traitScore,
        skillScore,
        interestScore,
      ]);
      const consistencyBonus = Math.max(
        0,
        Math.round((32 - coherenceStd) * 0.25),
      );
      const consistencyPenalty =
        coherenceStd > 30 ? Math.round((coherenceStd - 30) * 0.25) : 0;

      const skillInterestSynergy =
        skillScore >= 70 && interestScore >= 70
          ? Math.min(8, Math.round((skillScore + interestScore - 140) / 6))
          : 0;
      const academicSkillSynergy =
        academicScore >= 75 && skillScore >= 70 ? 4 : 0;

      const adaptiveRawScore = clampScore(
        Math.round(
          weightedCore +
            cohortShift +
            consistencyBonus +
            skillInterestSynergy +
            academicSkillSynergy -
            criticalSkillPenalty -
            interestMismatchPenalty -
            lowAcademicPenalty -
            lowTraitPenalty -
            consistencyPenalty,
        ),
      );

      const adaptiveScore = applyScoreFloor(
        adaptiveRawScore,
        academicScore,
        traitScore,
        skillScore,
        interestScore,
      );

      const scoreDelta = adaptiveScore - hybridBaseline;

      return {
        careerKey: career.career_key,
        careerTitle: career.career_title,
        description:
          career.description ??
          "Recommended by adaptive ensemble scoring from academics, traits, skills and interests.",
        traits: requiredTraits,
        matchScore: adaptiveScore,
        classicScore,
        hybridScore: hybridBaseline,
        adaptiveScore,
        scoreDelta,
        factors: {
          academic: Math.round(academicScore),
          traits: Math.round(traitScore),
          skills: skillScore,
          interests: interestScore,
          demand: Math.round(demandScore),
        },
        penalties: {
          skill: criticalSkillPenalty,
          interest: interestMismatchPenalty,
          academics: lowAcademicPenalty,
          traits: lowTraitPenalty,
          consistency: consistencyPenalty,
        },
        bonuses: {
          consistency: consistencyBonus,
          skillInterest: skillInterestSynergy,
          academicSkill: academicSkillSynergy,
        },
        tunedWeights,
        calibration: {
          cohortShift,
          cohortSampleCount: cohortSample,
        },
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

    const completeness = Math.round(
      coverageAcademic * 25 +
        coverageTraits * 30 +
        coverageSkills * 25 +
        coverageInterests * 20,
    );

    const evidenceStrength = Math.round(
      row.factors.academic * 0.24 +
        row.factors.traits * 0.24 +
        row.factors.skills * 0.24 +
        row.factors.interests * 0.2 +
        row.factors.demand * 0.08,
    );

    const totalPenalty =
      row.penalties.skill +
      row.penalties.interest +
      row.penalties.academics +
      row.penalties.traits;

    const gapBoost =
      index === 0
        ? Math.min(18, Math.round(topGap * 1.8))
        : Math.min(10, Math.round(localGap * 1.2));

    const confidence = clampScore(
      Math.round(
        completeness * 0.35 +
          evidenceStrength * 0.48 +
          gapBoost +
          attemptReliability * 8 +
          row.bonuses.consistency * 0.9 +
          row.bonuses.skillInterest * 0.9 +
          row.bonuses.academicSkill * 0.8 -
          totalPenalty,
      ),
    );

    const factorSummary = `Adaptive factors -> academic:${row.factors.academic}, traits:${row.factors.traits}, skills:${row.factors.skills}, interests:${row.factors.interests}, demand:${row.factors.demand}, classic:${row.classicScore}, hybridBaseline:${row.hybridScore}, adaptive:${row.adaptiveScore}, delta:${row.scoreDelta}, confidence:${confidence}.`;

    return {
      rank: index + 1,
      careerKey: row.careerKey,
      careerTitle: row.careerTitle,
      matchScore: row.matchScore,
      classicScore: row.classicScore,
      hybridScore: row.hybridScore,
      adaptiveScore: row.adaptiveScore,
      scoreDelta: row.scoreDelta,
      description: `${row.description} ${factorSummary}`,
      traits: row.traits,
      factors: row.factors,
      adaptiveDetails: {
        weights: {
          academic: Math.round(row.tunedWeights.academic * 100),
          traits: Math.round(row.tunedWeights.traits * 100),
          skills: Math.round(row.tunedWeights.skills * 100),
          interests: Math.round(row.tunedWeights.interests * 100),
          demand: Math.round(row.tunedWeights.demand * 100),
        },
        penalties: {
          skill: row.penalties.skill,
          interest: row.penalties.interest,
          academics: row.penalties.academics,
          traits: row.penalties.traits,
          consistency: row.penalties.consistency,
        },
        bonuses: {
          consistency: row.bonuses.consistency,
          skillInterest: row.bonuses.skillInterest,
          academicSkill: row.bonuses.academicSkill,
        },
        calibration: {
          cohortShift: row.calibration.cohortShift,
          cohortSampleCount: row.calibration.cohortSampleCount,
          attemptReliability: Math.round(attemptReliability * 100),
        },
      },
      confidence,
    };
  });

  return computed;
}
