import { getDbPool } from "@/lib/db";
import { computeAdaptiveResults } from "@/lib/recommendation-engine-adaptive";

type LabelRow = {
  student_id: number;
  career_key: string;
};

type CareerRow = {
  career_key: string;
  career_title: string;
  description: string | null;
  required_traits: string | null;
  subject_weights: string | null;
};

type ScoreRow = {
  student_id: number;
  subject: string;
  score: number;
};

type TraitRow = {
  student_id: number;
  trait: string;
  score: number;
};

type SkillRow = {
  student_id: number;
  skill_name: string;
};

type InterestRow = {
  student_id: number;
  interest_name: string;
};

type AttemptRow = {
  student_id: number;
  attempts: number;
};

type StudentProfile = {
  subjects: Map<string, number>;
  traits: Map<string, number>;
  skills: string[];
  interests: string[];
  attempts: number;
};

type StudentSample = {
  studentId: number;
  labelCareerKey: string;
  vector: number[];
};

export type PredictiveComputedResult = {
  rank: number;
  careerKey: string;
  careerTitle: string;
  matchScore: number;
  predictedProbability: number;
  description: string;
  traits: string[];
  confidence: number;
  predictiveDetails: {
    model: "knn-bayes-ensemble";
    trainingSamples: number;
    neighborsUsed: number;
    neighborAgreement: number;
    priorProbability: number;
    knnProbability: number;
    ensembleProbability: number;
  };
};

export type PredictiveEvaluation = {
  model: "knn-bayes-ensemble";
  validation: "leave-one-out";
  sampleCount: number;
  classCount: number;
  accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  baselineMajorityAccuracy: number;
  confusionMatrix: Array<{
    actual: string;
    predicted: string;
    count: number;
  }>;
  perCareer: Array<{
    careerKey: string;
    support: number;
    precision: number;
    recall: number;
    f1: number;
  }>;
};

const SUBJECT_KEYS = [
  "mathematics",
  "math",
  "science",
  "english",
  "physics",
  "chemistry",
  "biology",
  "computer",
  "economics",
];

const TRAIT_KEYS = [
  "logical",
  "creative",
  "leadership",
  "analytical",
  "communication",
  "empathy",
  "problem solving",
  "teamwork",
];

const KEYWORD_BUCKETS = {
  technology: ["technology", "coding", "software", "programming", "ai", "ml"],
  business: ["business", "management", "finance", "operations", "product"],
  design: ["design", "ui", "ux", "creativity", "figma"],
  data: ["data", "analytics", "analysis", "statistics", "sql"],
  security: ["security", "network", "cyber", "risk"],
} as const;

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function cosineSimilarity(left: number[], right: number[]): number {
  let dot = 0;
  let leftMag = 0;
  let rightMag = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMag += left[index] * left[index];
    rightMag += right[index] * right[index];
  }

  if (leftMag === 0 || rightMag === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMag) * Math.sqrt(rightMag));
}

function containsKeyword(
  values: string[],
  keywords: readonly string[],
): boolean {
  return values.some((value) =>
    keywords.some((keyword) => normalizeValue(value).includes(keyword)),
  );
}

function buildFeatureVector(profile: StudentProfile): number[] {
  const subjectValues = SUBJECT_KEYS.map((subjectKey) => {
    for (const [subject, score] of profile.subjects.entries()) {
      if (subject.includes(subjectKey)) {
        return score / 100;
      }
    }

    return 0.5;
  });

  const traitValues = TRAIT_KEYS.map((traitKey) => {
    for (const [trait, score] of profile.traits.entries()) {
      if (trait.includes(traitKey)) {
        return score / 100;
      }
    }

    return 0.4;
  });

  const combinedKeywords = [...profile.skills, ...profile.interests].map(
    (value) => normalizeValue(value),
  );

  const bucketValues = Object.values(KEYWORD_BUCKETS).map((keywords) =>
    containsKeyword(combinedKeywords, keywords) ? 1 : 0,
  );

  const averageAcademic =
    profile.subjects.size > 0
      ? Array.from(profile.subjects.values()).reduce(
          (sum, score) => sum + score,
          0,
        ) /
        profile.subjects.size /
        100
      : 0.5;

  const averageTrait =
    profile.traits.size > 0
      ? Array.from(profile.traits.values()).reduce(
          (sum, score) => sum + score,
          0,
        ) /
        profile.traits.size /
        100
      : 0.4;

  const skillsCount = Math.min(1, profile.skills.length / 8);
  const interestsCount = Math.min(1, profile.interests.length / 8);
  const attemptsSignal = Math.min(1, profile.attempts / 5);

  return [
    averageAcademic,
    averageTrait,
    skillsCount,
    interestsCount,
    attemptsSignal,
    ...subjectValues,
    ...traitValues,
    ...bucketValues,
  ];
}

function createEmptyProfile(): StudentProfile {
  return {
    subjects: new Map<string, number>(),
    traits: new Map<string, number>(),
    skills: [],
    interests: [],
    attempts: 0,
  };
}

function getOrCreateProfile(
  profiles: Map<number, StudentProfile>,
  studentId: number,
): StudentProfile {
  const existing = profiles.get(studentId);
  if (existing) {
    return existing;
  }

  const created = createEmptyProfile();
  profiles.set(studentId, created);
  return created;
}

export async function computePredictiveResults(
  studentId: number,
): Promise<PredictiveComputedResult[]> {
  const pool = getDbPool();

  const [labelRows] = await pool.query(
    `SELECT student_id, career_key
     FROM results
     WHERE rank_position = 1`,
    [],
  );

  const [careerRows] = await pool.query(
    `SELECT career_key, career_title, description, required_traits, subject_weights
     FROM career_profiles`,
    [],
  );

  const labels = labelRows as LabelRow[];
  const careers = careerRows as CareerRow[];

  const historicalStudentIds = Array.from(
    new Set(
      labels
        .map((row) => Number(row.student_id))
        .filter((id) => id !== studentId),
    ),
  );

  if (historicalStudentIds.length < 6) {
    const fallback = await computeAdaptiveResults(studentId);
    return fallback.slice(0, 3).map((row, index) => ({
      rank: index + 1,
      careerKey: row.careerKey,
      careerTitle: row.careerTitle,
      matchScore: row.matchScore,
      predictedProbability: row.matchScore,
      description:
        "Predictive model fallback used due to insufficient historical labels. " +
        row.description,
      traits: row.traits,
      confidence: row.confidence,
      predictiveDetails: {
        model: "knn-bayes-ensemble",
        trainingSamples: historicalStudentIds.length,
        neighborsUsed: 0,
        neighborAgreement: 0,
        priorProbability: 0,
        knnProbability: 0,
        ensembleProbability: row.matchScore,
      },
    }));
  }

  const idsForProfiles = Array.from(
    new Set([...historicalStudentIds, studentId]),
  );
  const placeholders = idsForProfiles.map(() => "?").join(",");

  const [scoreRows] = await pool.query(
    `SELECT student_id, subject, score
     FROM academic_scores
     WHERE student_id IN (${placeholders})`,
    idsForProfiles,
  );

  const [traitRows] = await pool.query(
    `SELECT student_id, trait, score
     FROM trait_scores
     WHERE student_id IN (${placeholders})`,
    idsForProfiles,
  );

  const [skillRows] = await pool.query(
    `SELECT student_id, skill_name
     FROM user_skills
     WHERE student_id IN (${placeholders})`,
    idsForProfiles,
  );

  const [interestRows] = await pool.query(
    `SELECT student_id, interest_name
     FROM user_interests
     WHERE student_id IN (${placeholders})`,
    idsForProfiles,
  );

  const [attemptRows] = await pool.query(
    `SELECT student_id, COUNT(*) AS attempts
     FROM quiz_attempts
     WHERE student_id IN (${placeholders})
     GROUP BY student_id`,
    idsForProfiles,
  );

  const profiles = new Map<number, StudentProfile>();

  (scoreRows as ScoreRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.subjects.set(normalizeValue(row.subject), Number(row.score));
  });

  (traitRows as TraitRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.traits.set(normalizeValue(row.trait), Number(row.score));
  });

  (skillRows as SkillRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.skills.push(normalizeValue(row.skill_name));
  });

  (interestRows as InterestRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.interests.push(normalizeValue(row.interest_name));
  });

  (attemptRows as AttemptRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.attempts = Number(row.attempts);
  });

  const currentProfile = profiles.get(studentId) ?? createEmptyProfile();
  const currentVector = buildFeatureVector(currentProfile);

  const labeledByStudent = new Map<number, string>();
  labels.forEach((row) => {
    if (!labeledByStudent.has(Number(row.student_id))) {
      labeledByStudent.set(Number(row.student_id), row.career_key);
    }
  });

  const samples: StudentSample[] = historicalStudentIds
    .map((id) => {
      const profile = profiles.get(id);
      const label = labeledByStudent.get(id);
      if (!profile || !label) {
        return null;
      }

      return {
        studentId: id,
        labelCareerKey: label,
        vector: buildFeatureVector(profile),
      };
    })
    .filter((sample): sample is StudentSample => sample !== null);

  const priorCounts = new Map<string, number>();
  samples.forEach((sample) => {
    priorCounts.set(
      sample.labelCareerKey,
      (priorCounts.get(sample.labelCareerKey) ?? 0) + 1,
    );
  });

  const totalSamples = samples.length;
  const k = Math.max(5, Math.min(17, Math.round(Math.sqrt(totalSamples))));

  const neighbors = samples
    .map((sample) => ({
      labelCareerKey: sample.labelCareerKey,
      similarity: Math.max(0, cosineSimilarity(currentVector, sample.vector)),
    }))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, k);

  const voteTotals = new Map<string, number>();
  let voteSum = 0;

  neighbors.forEach((neighbor) => {
    const voteWeight = neighbor.similarity + 0.02;
    voteTotals.set(
      neighbor.labelCareerKey,
      (voteTotals.get(neighbor.labelCareerKey) ?? 0) + voteWeight,
    );
    voteSum += voteWeight;
  });

  const careerCatalog = new Map<string, CareerRow>();
  careers.forEach((career) => {
    careerCatalog.set(career.career_key, career);
  });

  const ranked = careers
    .map((career) => {
      const prior =
        (priorCounts.get(career.career_key) ?? 0) / Math.max(1, totalSamples);
      const knn =
        (voteTotals.get(career.career_key) ?? 0) / Math.max(1e-6, voteSum);
      const ensemble = prior * 0.25 + knn * 0.75;

      const matchScore = clampScore(Math.round(ensemble * 100));
      const requiredTraits = career.required_traits
        ? (JSON.parse(career.required_traits) as string[])
        : [];

      return {
        careerKey: career.career_key,
        careerTitle: career.career_title,
        description:
          career.description ??
          "Predicted by historical similarity model trained on past student outcomes.",
        traits: requiredTraits,
        prior,
        knn,
        ensemble,
        matchScore,
      };
    })
    .sort((left, right) => right.ensemble - left.ensemble)
    .slice(0, 3);

  const topGap =
    ranked.length > 1
      ? Math.max(0, ranked[0].matchScore - ranked[1].matchScore)
      : 0;
  const avgSimilarity =
    neighbors.length > 0
      ? neighbors.reduce((sum, neighbor) => sum + neighbor.similarity, 0) /
        neighbors.length
      : 0;

  return ranked.map((row, index) => {
    const confidence = clampScore(
      Math.round(
        avgSimilarity * 55 +
          Math.min(20, topGap * 1.2) +
          Math.min(20, totalSamples / 6) +
          row.ensemble * 10,
      ),
    );

    return {
      rank: index + 1,
      careerKey: row.careerKey,
      careerTitle: row.careerTitle,
      matchScore: row.matchScore,
      predictedProbability: row.matchScore,
      description:
        `${row.description} Predictive model -> prior:${(row.prior * 100).toFixed(1)}%, ` +
        `knn:${(row.knn * 100).toFixed(1)}%, ensemble:${(row.ensemble * 100).toFixed(1)}%.`,
      traits: row.traits,
      confidence,
      predictiveDetails: {
        model: "knn-bayes-ensemble",
        trainingSamples: totalSamples,
        neighborsUsed: neighbors.length,
        neighborAgreement: Math.round(avgSimilarity * 100),
        priorProbability: Math.round(row.prior * 100),
        knnProbability: Math.round(row.knn * 100),
        ensembleProbability: Math.round(row.ensemble * 100),
      },
    };
  });
}

export async function evaluatePredictiveModel(): Promise<PredictiveEvaluation> {
  const pool = getDbPool();

  const [labelRows] = await pool.query(
    `SELECT student_id, career_key
     FROM results
     WHERE rank_position = 1`,
    [],
  );

  const labels = labelRows as LabelRow[];
  const studentIds = Array.from(
    new Set(labels.map((row) => Number(row.student_id))),
  );

  if (studentIds.length < 8) {
    return {
      model: "knn-bayes-ensemble",
      validation: "leave-one-out",
      sampleCount: studentIds.length,
      classCount: 0,
      accuracy: 0,
      macroPrecision: 0,
      macroRecall: 0,
      macroF1: 0,
      baselineMajorityAccuracy: 0,
      confusionMatrix: [],
      perCareer: [],
    };
  }

  const placeholders = studentIds.map(() => "?").join(",");

  const [scoreRows] = await pool.query(
    `SELECT student_id, subject, score
     FROM academic_scores
     WHERE student_id IN (${placeholders})`,
    studentIds,
  );

  const [traitRows] = await pool.query(
    `SELECT student_id, trait, score
     FROM trait_scores
     WHERE student_id IN (${placeholders})`,
    studentIds,
  );

  const [skillRows] = await pool.query(
    `SELECT student_id, skill_name
     FROM user_skills
     WHERE student_id IN (${placeholders})`,
    studentIds,
  );

  const [interestRows] = await pool.query(
    `SELECT student_id, interest_name
     FROM user_interests
     WHERE student_id IN (${placeholders})`,
    studentIds,
  );

  const [attemptRows] = await pool.query(
    `SELECT student_id, COUNT(*) AS attempts
     FROM quiz_attempts
     WHERE student_id IN (${placeholders})
     GROUP BY student_id`,
    studentIds,
  );

  const profiles = new Map<number, StudentProfile>();

  (scoreRows as ScoreRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.subjects.set(normalizeValue(row.subject), Number(row.score));
  });

  (traitRows as TraitRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.traits.set(normalizeValue(row.trait), Number(row.score));
  });

  (skillRows as SkillRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.skills.push(normalizeValue(row.skill_name));
  });

  (interestRows as InterestRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.interests.push(normalizeValue(row.interest_name));
  });

  (attemptRows as AttemptRow[]).forEach((row) => {
    const profile = getOrCreateProfile(profiles, Number(row.student_id));
    profile.attempts = Number(row.attempts);
  });

  const labeledByStudent = new Map<number, string>();
  labels.forEach((row) => {
    if (!labeledByStudent.has(Number(row.student_id))) {
      labeledByStudent.set(Number(row.student_id), row.career_key);
    }
  });

  const samples: StudentSample[] = studentIds
    .map((id) => {
      const profile = profiles.get(id);
      const label = labeledByStudent.get(id);
      if (!profile || !label) {
        return null;
      }

      return {
        studentId: id,
        labelCareerKey: label,
        vector: buildFeatureVector(profile),
      };
    })
    .filter((sample): sample is StudentSample => sample !== null);

  const careerKeys = Array.from(
    new Set(samples.map((sample) => sample.labelCareerKey)),
  );

  if (samples.length < 8 || careerKeys.length < 2) {
    return {
      model: "knn-bayes-ensemble",
      validation: "leave-one-out",
      sampleCount: samples.length,
      classCount: careerKeys.length,
      accuracy: 0,
      macroPrecision: 0,
      macroRecall: 0,
      macroF1: 0,
      baselineMajorityAccuracy: 0,
      confusionMatrix: [],
      perCareer: [],
    };
  }

  const confusion = new Map<string, number>();
  const support = new Map<string, number>();
  const predictedCount = new Map<string, number>();
  const truePositive = new Map<string, number>();

  let correct = 0;

  for (const testSample of samples) {
    const trainSamples = samples.filter(
      (sample) => sample.studentId !== testSample.studentId,
    );

    const priorCounts = new Map<string, number>();
    trainSamples.forEach((sample) => {
      priorCounts.set(
        sample.labelCareerKey,
        (priorCounts.get(sample.labelCareerKey) ?? 0) + 1,
      );
    });

    const totalTrain = Math.max(1, trainSamples.length);
    const k = Math.max(5, Math.min(17, Math.round(Math.sqrt(totalTrain))));

    const neighbors = trainSamples
      .map((sample) => ({
        labelCareerKey: sample.labelCareerKey,
        similarity: Math.max(
          0,
          cosineSimilarity(testSample.vector, sample.vector),
        ),
      }))
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, k);

    const voteTotals = new Map<string, number>();
    let voteSum = 0;

    neighbors.forEach((neighbor) => {
      const voteWeight = neighbor.similarity + 0.02;
      voteTotals.set(
        neighbor.labelCareerKey,
        (voteTotals.get(neighbor.labelCareerKey) ?? 0) + voteWeight,
      );
      voteSum += voteWeight;
    });

    const ranked = careerKeys
      .map((careerKey) => {
        const prior = (priorCounts.get(careerKey) ?? 0) / totalTrain;
        const knn = (voteTotals.get(careerKey) ?? 0) / Math.max(1e-6, voteSum);
        const ensemble = prior * 0.25 + knn * 0.75;
        return { careerKey, ensemble };
      })
      .sort((left, right) => right.ensemble - left.ensemble);

    const predictedCareer = ranked[0]?.careerKey ?? careerKeys[0];
    const actualCareer = testSample.labelCareerKey;

    if (predictedCareer === actualCareer) {
      correct += 1;
      truePositive.set(actualCareer, (truePositive.get(actualCareer) ?? 0) + 1);
    }

    support.set(actualCareer, (support.get(actualCareer) ?? 0) + 1);
    predictedCount.set(
      predictedCareer,
      (predictedCount.get(predictedCareer) ?? 0) + 1,
    );

    const confusionKey = `${actualCareer}::${predictedCareer}`;
    confusion.set(confusionKey, (confusion.get(confusionKey) ?? 0) + 1);
  }

  const sampleCount = samples.length;
  const accuracy = Math.round((correct / sampleCount) * 10000) / 100;

  const majorityClassCount = Math.max(
    1,
    ...Array.from(support.values()).map((count) => Number(count)),
  );
  const baselineMajorityAccuracy =
    Math.round((majorityClassCount / sampleCount) * 10000) / 100;

  const perCareer = careerKeys.map((careerKey) => {
    const tp = truePositive.get(careerKey) ?? 0;
    const fp = (predictedCount.get(careerKey) ?? 0) - tp;
    const fn = (support.get(careerKey) ?? 0) - tp;

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    return {
      careerKey,
      support: support.get(careerKey) ?? 0,
      precision: Math.round(precision * 10000) / 100,
      recall: Math.round(recall * 10000) / 100,
      f1: Math.round(f1 * 10000) / 100,
    };
  });

  const macroPrecision =
    Math.round(
      (perCareer.reduce((sum, row) => sum + row.precision, 0) /
        Math.max(1, perCareer.length)) *
        100,
    ) / 100;
  const macroRecall =
    Math.round(
      (perCareer.reduce((sum, row) => sum + row.recall, 0) /
        Math.max(1, perCareer.length)) *
        100,
    ) / 100;
  const macroF1 =
    Math.round(
      (perCareer.reduce((sum, row) => sum + row.f1, 0) /
        Math.max(1, perCareer.length)) *
        100,
    ) / 100;

  const confusionMatrix = Array.from(confusion.entries())
    .map(([key, count]) => {
      const [actual, predicted] = key.split("::");
      return {
        actual,
        predicted,
        count,
      };
    })
    .sort((left, right) => right.count - left.count);

  return {
    model: "knn-bayes-ensemble",
    validation: "leave-one-out",
    sampleCount,
    classCount: careerKeys.length,
    accuracy,
    macroPrecision,
    macroRecall,
    macroF1,
    baselineMajorityAccuracy,
    confusionMatrix,
    perCareer,
  };
}
