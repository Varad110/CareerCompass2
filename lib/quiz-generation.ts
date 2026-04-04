import { randomInt, randomUUID } from "crypto";

import { getDbPool } from "@/lib/db";
import { ensureQuizSchema } from "@/lib/quiz-schema";

export type QuizGenerationSeed = {
  studentId: number;
  name: string;
  grade: string;
  stream: string;
  skills: string[];
  interests: string[];
};

export type QuizGenerationOption = {
  id: "a" | "b" | "c" | "d";
  text: string;
  trait: string;
};

export type QuizGenerationQuestion = {
  question: string;
  category: "interest" | "aptitude" | "personality";
  options: QuizGenerationOption[];
};

export type StoredQuizVariant = {
  id: number;
  variantKey: string;
  generationMode: "ai" | "fallback";
  questionCount: number;
};

const ALLOWED_TRAITS = new Set([
  "logical",
  "technical",
  "analytical",
  "creative",
  "leadership",
  "communication",
  "social",
  "empathy",
]);

const QUESTION_COUNT = 12;

function normalizeList(values: string[]): string[] {
  return Array.from(
    new Set(
      values.map((value) => value.trim()).filter((value) => value.length > 0),
    ),
  );
}

function pickTopic(seed: QuizGenerationSeed, index: number): string {
  const topics = normalizeList([
    ...seed.skills,
    ...seed.interests,
    seed.stream,
    seed.grade,
  ]);

  if (!topics.length) {
    return "future goals";
  }

  return topics[index % topics.length];
}

function shuffleOptions(
  options: QuizGenerationOption[],
): QuizGenerationOption[] {
  const cloned = [...options];

  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }

  return cloned;
}

function toQuestionSet(seed: QuizGenerationSeed): QuizGenerationQuestion[] {
  const templates: Array<{
    build: (topic: string) => QuizGenerationQuestion;
  }> = [
    {
      build: (topic) => ({
        question: `When you think about growing your ${topic} skill, what feels most natural?`,
        category: "interest",
        options: [
          {
            id: "a",
            text: "Build something practical and test it",
            trait: "technical",
          },
          {
            id: "b",
            text: "Break the problem into clear steps",
            trait: "logical",
          },
          {
            id: "c",
            text: "Try a new angle or original idea",
            trait: "creative",
          },
          {
            id: "d",
            text: "Discuss it with others and get feedback",
            trait: "communication",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `If a challenge appears in ${topic}, how do you usually respond?`,
        category: "aptitude",
        options: [
          {
            id: "a",
            text: "Analyze patterns before acting",
            trait: "analytical",
          },
          {
            id: "b",
            text: "Choose a hands-on solution quickly",
            trait: "technical",
          },
          {
            id: "c",
            text: "Look for a fresh solution nobody else tried",
            trait: "creative",
          },
          {
            id: "d",
            text: "Coordinate people and move everyone forward",
            trait: "leadership",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `In a team working on ${topic}, what role suits you best?`,
        category: "personality",
        options: [
          {
            id: "a",
            text: "The one checking details and consistency",
            trait: "logical",
          },
          {
            id: "b",
            text: "The one building and experimenting",
            trait: "technical",
          },
          {
            id: "c",
            text: "The one connecting ideas and people",
            trait: "social",
          },
          {
            id: "d",
            text: "The one supporting people and listening carefully",
            trait: "empathy",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `Which part of ${topic} would you be most excited to master?`,
        category: "interest",
        options: [
          {
            id: "a",
            text: "The technical setup and implementation",
            trait: "technical",
          },
          {
            id: "b",
            text: "The data and decision-making behind it",
            trait: "analytical",
          },
          {
            id: "c",
            text: "The visual or creative presentation",
            trait: "creative",
          },
          {
            id: "d",
            text: "The people and collaboration side",
            trait: "social",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `When you improve a ${topic}-related project, what do you focus on first?`,
        category: "aptitude",
        options: [
          { id: "a", text: "Performance and reliability", trait: "logical" },
          {
            id: "b",
            text: "New tools and technical quality",
            trait: "technical",
          },
          {
            id: "c",
            text: "User experience and originality",
            trait: "creative",
          },
          {
            id: "d",
            text: "Team alignment and ownership",
            trait: "leadership",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `How do you prefer to learn a new ${topic} concept?`,
        category: "personality",
        options: [
          {
            id: "a",
            text: "Read, compare, and organize the facts",
            trait: "analytical",
          },
          {
            id: "b",
            text: "Practice by doing and iterating",
            trait: "technical",
          },
          {
            id: "c",
            text: "Experiment and trust intuition",
            trait: "creative",
          },
          {
            id: "d",
            text: "Talk it through with a group",
            trait: "communication",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `Which outcome would make a ${topic} project feel successful to you?`,
        category: "interest",
        options: [
          { id: "a", text: "A clear and logical solution", trait: "logical" },
          { id: "b", text: "A working prototype or build", trait: "technical" },
          {
            id: "c",
            text: "A creative result that stands out",
            trait: "creative",
          },
          {
            id: "d",
            text: "People feeling supported and informed",
            trait: "empathy",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `When a ${topic} task becomes messy, what do you do first?`,
        category: "aptitude",
        options: [
          {
            id: "a",
            text: "Organize the information and simplify it",
            trait: "analytical",
          },
          {
            id: "b",
            text: "Start building a practical version",
            trait: "technical",
          },
          { id: "c", text: "Reframe it with a new idea", trait: "creative" },
          {
            id: "d",
            text: "Bring everyone together to reset priorities",
            trait: "leadership",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `What kind of role do you naturally take in ${topic} discussions?`,
        category: "personality",
        options: [
          {
            id: "a",
            text: "The one looking for the most accurate answer",
            trait: "logical",
          },
          {
            id: "b",
            text: "The one making sure ideas become reality",
            trait: "technical",
          },
          {
            id: "c",
            text: "The one suggesting bold alternatives",
            trait: "creative",
          },
          {
            id: "d",
            text: "The one helping others stay engaged",
            trait: "social",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `What part of ${topic} feels most rewarding to you?`,
        category: "interest",
        options: [
          {
            id: "a",
            text: "Solving a technical challenge",
            trait: "technical",
          },
          {
            id: "b",
            text: "Finding a useful pattern or insight",
            trait: "analytical",
          },
          { id: "c", text: "Designing something original", trait: "creative" },
          {
            id: "d",
            text: "Helping people understand and adopt it",
            trait: "communication",
          },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `Which strength do you rely on most when learning ${topic}?`,
        category: "aptitude",
        options: [
          { id: "a", text: "Careful logic and structure", trait: "logical" },
          { id: "b", text: "Hands-on problem solving", trait: "technical" },
          { id: "c", text: "Imagination and curiosity", trait: "creative" },
          { id: "d", text: "Listening and collaboration", trait: "empathy" },
        ],
      }),
    },
    {
      build: (topic) => ({
        question: `What type of ${topic} environment keeps you motivated?`,
        category: "personality",
        options: [
          {
            id: "a",
            text: "A structured and clearly defined one",
            trait: "logical",
          },
          {
            id: "b",
            text: "A fast-moving build-and-learn one",
            trait: "technical",
          },
          { id: "c", text: "A creative and flexible one", trait: "creative" },
          {
            id: "d",
            text: "A collaborative and people-focused one",
            trait: "social",
          },
        ],
      }),
    },
  ];

  const topicSource = normalizeList([
    ...seed.skills,
    ...seed.interests,
    seed.stream,
    seed.grade,
  ]);
  const safeTopicCount = Math.max(topicSource.length, 1);
  const topicOffset = randomInt(0, safeTopicCount);
  const templateOffset = randomInt(0, templates.length);

  return Array.from({ length: QUESTION_COUNT }, (_, index) => {
    const template = templates[(index + templateOffset) % templates.length];
    const topic = pickTopic(seed, index + topicOffset);
    const built = template.build(topic);

    return {
      ...built,
      options: shuffleOptions(built.options),
    };
  });
}

function sanitizeQuestion(
  question: QuizGenerationQuestion,
): QuizGenerationQuestion | null {
  if (!question.question.trim()) {
    return null;
  }

  if (!question.options || question.options.length !== 4) {
    return null;
  }

  const normalizedOptions = ["a", "b", "c", "d"].map((id, index) => {
    const option = question.options[index];
    if (!option) {
      return null;
    }

    const trait = option.trait.trim().toLowerCase();
    if (!ALLOWED_TRAITS.has(trait) || !option.text.trim()) {
      return null;
    }

    return {
      id: id as "a" | "b" | "c" | "d",
      text: option.text.trim(),
      trait,
    };
  });

  if (normalizedOptions.some((option) => option === null)) {
    return null;
  }

  return {
    question: question.question.trim(),
    category: question.category,
    options: normalizedOptions as QuizGenerationOption[],
  };
}

function sanitizeQuestions(
  questions: QuizGenerationQuestion[],
): QuizGenerationQuestion[] {
  return questions
    .map(sanitizeQuestion)
    .filter((question): question is QuizGenerationQuestion => Boolean(question))
    .slice(0, QUESTION_COUNT);
}

type AiProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: "google" | "grok" | "openai";
};

type AiGenerationOutput = {
  questions: QuizGenerationQuestion[];
  rawResponse: string;
  provider: AiProviderConfig["provider"];
  model: string;
};

function getAiProviderConfigs(): AiProviderConfig[] {
  const providerConfigs: AiProviderConfig[] = [];

  const googleKey =
    process.env.GOOGLE_AI_STUDIO_API_KEY?.trim() ??
    process.env.GOOGLE_API_KEY?.trim() ??
    process.env.GEMINI_API_KEY?.trim();
  if (googleKey) {
    providerConfigs.push({
      apiKey: googleKey,
      baseUrl: (
        process.env.GOOGLE_AI_STUDIO_BASE_URL ??
        process.env.GEMINI_BASE_URL ??
        "https://generativelanguage.googleapis.com/v1beta/openai"
      ).replace(/\/$/, ""),
      model:
        process.env.GOOGLE_AI_STUDIO_MODEL ??
        process.env.GEMINI_MODEL ??
        "gemini-2.5-flash",
      provider: "google",
    });
  }

  const grokKey = process.env.GROK_API_KEY?.trim();
  if (grokKey) {
    providerConfigs.push({
      apiKey: grokKey,
      baseUrl: (process.env.GROK_BASE_URL ?? "https://api.x.ai/v1").replace(
        /\/$/,
        "",
      ),
      model: process.env.GROK_MODEL ?? "grok-2-latest",
      provider: "grok",
    });
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    providerConfigs.push({
      apiKey: openAiKey,
      baseUrl: (
        process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
      ).replace(/\/$/, ""),
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      provider: "openai",
    });
  }

  return providerConfigs;
}

function buildAiPrompt(seed: QuizGenerationSeed): string {
  return [
    "Create exactly 12 multiple-choice career quiz questions for a student.",
    "Each question must have four options labeled a, b, c, d.",
    "Each option must map to one of these traits only: logical, technical, analytical, creative, leadership, communication, social, empathy.",
    `Name: ${seed.name}`,
    `Grade: ${seed.grade}`,
    `Stream: ${seed.stream}`,
    `Skills: ${normalizeList(seed.skills).join(", ") || "none"}`,
    `Interests: ${normalizeList(seed.interests).join(", ") || "none"}`,
    'Return valid JSON only using this shape: { "questions": [{ "question": string, "category": "interest" | "aptitude" | "personality", "options": [{ "id": "a" | "b" | "c" | "d", "text": string, "trait": string }] }] }',
  ].join("\n");
}

async function generateQuestionsWithProvider(
  providerConfig: AiProviderConfig,
  prompt: string,
): Promise<AiGenerationOutput | null> {
  if (providerConfig.provider === "google") {
    const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: providerConfig.model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You generate structured quiz questions for a career guidance platform. Output only JSON. Provider: ${providerConfig.provider}.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return null;
    }

    try {
      const parsed = JSON.parse(content) as {
        questions?: QuizGenerationQuestion[];
      };
      const sanitized = parsed.questions
        ? sanitizeQuestions(parsed.questions)
        : [];
      if (!sanitized.length) {
        return null;
      }

      return {
        questions: sanitized,
        rawResponse: content,
        provider: providerConfig.provider,
        model: providerConfig.model,
      };
    } catch {
      return null;
    }
  }

  const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${providerConfig.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: providerConfig.model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You generate structured quiz questions for a career guidance platform. Output only JSON. Provider: ${providerConfig.provider}.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content) as {
      questions?: QuizGenerationQuestion[];
    };
    const sanitized = parsed.questions
      ? sanitizeQuestions(parsed.questions)
      : [];
    if (!sanitized.length) {
      return null;
    }

    return {
      questions: sanitized,
      rawResponse: content,
      provider: providerConfig.provider,
      model: providerConfig.model,
    };
  } catch {
    return null;
  }
}

async function generateQuestionsWithAi(
  seed: QuizGenerationSeed,
): Promise<AiGenerationOutput | null> {
  const providerConfigs = getAiProviderConfigs();
  if (!providerConfigs.length) {
    return null;
  }

  const prompt = buildAiPrompt(seed);

  for (const providerConfig of providerConfigs) {
    try {
      const questions = await generateQuestionsWithProvider(
        providerConfig,
        prompt,
      );

      if (questions && questions.questions.length >= QUESTION_COUNT) {
        return {
          ...questions,
          questions: questions.questions.slice(0, QUESTION_COUNT),
        };
      }
    } catch {
      // Try the next provider.
    }
  }

  return null;
}

function buildFallbackQuestions(
  seed: QuizGenerationSeed,
): QuizGenerationQuestion[] {
  return sanitizeQuestions(toQuestionSet(seed));
}

export async function generateQuizQuestions(seed: QuizGenerationSeed): Promise<{
  questions: QuizGenerationQuestion[];
  generationMode: "ai" | "fallback";
  aiProvider: AiProviderConfig["provider"] | null;
  aiModel: string | null;
  aiRawResponse: string | null;
}> {
  const aiQuestions = await generateQuestionsWithAi(seed);

  if (aiQuestions && aiQuestions.questions.length >= QUESTION_COUNT) {
    return {
      questions: aiQuestions.questions.slice(0, QUESTION_COUNT),
      generationMode: "ai",
      aiProvider: aiQuestions.provider,
      aiModel: aiQuestions.model,
      aiRawResponse: aiQuestions.rawResponse,
    };
  }

  return {
    questions: buildFallbackQuestions(seed),
    generationMode: "fallback",
    aiProvider: null,
    aiModel: null,
    aiRawResponse: null,
  };
}

export async function createAndStoreQuizVariant(
  seed: QuizGenerationSeed,
): Promise<StoredQuizVariant> {
  await ensureQuizSchema();

  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    const { questions, generationMode, aiProvider, aiModel, aiRawResponse } =
      await generateQuizQuestions(seed);
    const variantKey = `quiz-${seed.studentId}-${Date.now()}-${randomUUID().slice(0, 8)}`;

    await connection.beginTransaction();

    const [variantResult] = await connection.query(
      `INSERT INTO quiz_variants (
         student_id,
         variant_key,
         generation_mode,
         ai_provider,
         ai_model,
         ai_raw_response,
         seed_payload,
         status,
         question_count
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [
        seed.studentId,
        variantKey,
        generationMode,
        aiProvider,
        aiModel,
        aiRawResponse,
        JSON.stringify({
          name: seed.name,
          grade: seed.grade,
          stream: seed.stream,
          skills: normalizeList(seed.skills),
          interests: normalizeList(seed.interests),
        }),
        questions.length,
      ],
    );

    const variantId = (variantResult as { insertId: number }).insertId;

    for (const [index, question] of questions.entries()) {
      await connection.query(
        `INSERT INTO quiz_questions (
           quiz_variant_id,
           question_order,
           question_text,
           option_a,
           option_b,
           option_c,
           option_d,
           trait_a,
           trait_b,
           trait_c,
           trait_d,
           category,
           ai_generated
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          variantId,
          index + 1,
          question.question,
          question.options[0].text,
          question.options[1].text,
          question.options[2].text,
          question.options[3].text,
          question.options[0].trait,
          question.options[1].trait,
          question.options[2].trait,
          question.options[3].trait,
          question.category,
          generationMode === "ai",
        ],
      );
    }

    await connection.query(
      `UPDATE quiz_variants
       SET question_count = ?
       WHERE id = ?`,
      [questions.length, variantId],
    );

    await connection.commit();

    return {
      id: variantId,
      variantKey,
      generationMode,
      questionCount: questions.length,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

type StudentSeedRow = {
  name: string;
  grade: string;
  stream: string;
};

type SkillRow = {
  skill_name: string;
};

type InterestRow = {
  interest_name: string;
};

export async function regenerateQuizVariantForStudent(
  studentId: number,
): Promise<StoredQuizVariant | null> {
  await ensureQuizSchema();

  const pool = getDbPool();

  const [studentRows] = await pool.query(
    `SELECT name, grade, stream
     FROM students
     WHERE id = ?
     LIMIT 1`,
    [studentId],
  );

  const student = (studentRows as StudentSeedRow[])[0];
  if (!student) {
    return null;
  }

  const [skillRows] = await pool.query(
    `SELECT skill_name
     FROM user_skills
     WHERE student_id = ?
     ORDER BY skill_name ASC`,
    [studentId],
  );

  const [interestRows] = await pool.query(
    `SELECT interest_name
     FROM user_interests
     WHERE student_id = ?
     ORDER BY interest_name ASC`,
    [studentId],
  );

  await pool.query(
    `UPDATE quiz_variants
     SET status = 'archived'
     WHERE student_id = ? AND status = 'active'`,
    [studentId],
  );

  return createAndStoreQuizVariant({
    studentId,
    name: student.name,
    grade: student.grade,
    stream: student.stream,
    skills: (skillRows as SkillRow[]).map((row) => row.skill_name),
    interests: (interestRows as InterestRow[]).map((row) => row.interest_name),
  });
}
