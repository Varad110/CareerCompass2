export type OfflineQuizOption = {
  id: "a" | "b" | "c" | "d";
  text: string;
  trait: string;
};

export type OfflineQuizQuestion = {
  id: number;
  question: string;
  category: string;
  options: OfflineQuizOption[];
};

export type OfflineTraitScore = {
  trait: string;
  score: number;
};

export type OfflineCareerResult = {
  rank: number;
  careerKey: string;
  title: string;
  match: number;
  description: string;
  traits: string[];
};

const OFFLINE_CAREERS = [
  {
    careerKey: "software_engineer",
    title: "Software Engineer",
    description:
      "Design and develop software applications using technical and analytical problem solving.",
    requiredTraits: ["logical", "technical", "analytical"],
  },
  {
    careerKey: "data_scientist",
    title: "Data Scientist",
    description:
      "Work with data, statistics, and machine learning to uncover insights.",
    requiredTraits: ["analytical", "logical", "technical"],
  },
  {
    careerKey: "product_manager",
    title: "Product Manager",
    description:
      "Lead product direction, coordinate teams, and make decisions with clarity.",
    requiredTraits: ["leadership", "communication", "analytical"],
  },
  {
    careerKey: "ux_designer",
    title: "UX/UI Designer",
    description:
      "Create intuitive, visual, and user-focused digital experiences.",
    requiredTraits: ["creative", "empathy", "communication"],
  },
  {
    careerKey: "data_analyst",
    title: "Data Analyst",
    description:
      "Transform raw data into decisions, reports, and actionable insights.",
    requiredTraits: ["analytical", "technical", "logical"],
  },
  {
    careerKey: "cybersecurity_specialist",
    title: "Cybersecurity Specialist",
    description:
      "Protect systems and data while identifying risks and strengthening defenses.",
    requiredTraits: ["logical", "technical", "analytical"],
  },
  {
    careerKey: "machine_learning_engineer",
    title: "Machine Learning Engineer",
    description:
      "Build and deploy models that solve real-world problems at scale.",
    requiredTraits: ["technical", "analytical", "logical"],
  },
  {
    careerKey: "business_analyst",
    title: "Business Analyst",
    description:
      "Bridge business needs and execution with structured, insight-driven thinking.",
    requiredTraits: ["analytical", "communication", "leadership"],
  },
] as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function calculateOfflineTraitScores(
  questions: OfflineQuizQuestion[],
  answers: Record<number, "a" | "b" | "c" | "d">,
): OfflineTraitScore[] {
  const counts = new Map<string, number>();

  for (const question of questions) {
    const selectedOption = answers[question.id];
    if (!selectedOption) {
      continue;
    }

    const option = question.options.find((item) => item.id === selectedOption);
    if (!option?.trait) {
      continue;
    }

    counts.set(option.trait, (counts.get(option.trait) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([trait, count]) => ({
      trait,
      score: Math.min(100, count * 20),
    }))
    .sort((a, b) => b.score - a.score);
}

export function computeOfflineCareerResults(
  questions: OfflineQuizQuestion[],
  answers: Record<number, "a" | "b" | "c" | "d">,
): { results: OfflineCareerResult[]; traits: OfflineTraitScore[] } {
  const traits = calculateOfflineTraitScores(questions, answers);
  const traitScoreMap = new Map(
    traits.map((item) => [item.trait.toLowerCase(), item.score]),
  );

  const results = OFFLINE_CAREERS.map((career) => {
    const traitMatch = career.requiredTraits.length
      ? career.requiredTraits.reduce(
          (accumulator, trait) =>
            accumulator + (traitScoreMap.get(trait.toLowerCase()) ?? 40),
          0,
        ) / career.requiredTraits.length
      : 50;

    const match = clampScore(Math.round(50 * 0.6 + traitMatch * 0.4));

    return {
      careerKey: career.careerKey,
      title: career.title,
      description: career.description,
      traits: [...career.requiredTraits],
      match,
    };
  })
    .sort((left, right) => right.match - left.match)
    .slice(0, 3)
    .map((career, index) => ({
      rank: index + 1,
      ...career,
    }));

  return { results, traits };
}
