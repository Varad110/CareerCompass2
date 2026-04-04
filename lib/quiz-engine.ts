// RIASEC Trait Mapping
export const TRAITS = ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional']

export const ADAPTIVE_QUESTIONS = [
  {
    id: 1,
    text: 'I enjoy working with hands and tools',
    traits: ['Realistic'],
    difficulty: 'easy'
  },
  {
    id: 2,
    text: 'I like solving complex problems and understanding how things work',
    traits: ['Investigative'],
    difficulty: 'medium'
  },
  {
    id: 3,
    text: 'I prefer creative and artistic activities',
    traits: ['Artistic'],
    difficulty: 'easy'
  },
  {
    id: 4,
    text: 'I enjoy helping and supporting others',
    traits: ['Social'],
    difficulty: 'easy'
  },
  {
    id: 5,
    text: 'I like leading teams and managing projects',
    traits: ['Enterprising'],
    difficulty: 'medium'
  },
  {
    id: 6,
    text: 'I prefer organized systems and following procedures',
    traits: ['Conventional'],
    difficulty: 'easy'
  },
  {
    id: 7,
    text: 'I excel at detailed technical work',
    traits: ['Investigative', 'Conventional'],
    difficulty: 'medium'
  },
  {
    id: 8,
    text: 'I want to make a positive impact on society',
    traits: ['Social', 'Artistic'],
    difficulty: 'medium'
  },
  {
    id: 9,
    text: 'I am driven by business and financial success',
    traits: ['Enterprising'],
    difficulty: 'hard'
  },
  {
    id: 10,
    text: 'I enjoy experimentation and innovation',
    traits: ['Artistic', 'Investigative'],
    difficulty: 'hard'
  },
  {
    id: 11,
    text: 'I like working independently on projects',
    traits: ['Realistic', 'Investigative'],
    difficulty: 'medium'
  },
  {
    id: 12,
    text: 'I prefer structured work environments',
    traits: ['Conventional', 'Social'],
    difficulty: 'easy'
  },
  {
    id: 13,
    text: 'I enjoy public speaking and presentations',
    traits: ['Enterprising', 'Social'],
    difficulty: 'medium'
  },
  {
    id: 14,
    text: 'I excel at strategic planning and analysis',
    traits: ['Investigative', 'Enterprising'],
    difficulty: 'hard'
  },
  {
    id: 15,
    text: 'I am passionate about learning new technologies',
    traits: ['Investigative'],
    difficulty: 'medium'
  },
  {
    id: 16,
    text: 'I enjoy expressing ideas through various mediums',
    traits: ['Artistic'],
    difficulty: 'medium'
  },
  {
    id: 17,
    text: 'I like mentoring and teaching others',
    traits: ['Social', 'Enterprising'],
    difficulty: 'medium'
  },
  {
    id: 18,
    text: 'I prefer roles with clear responsibilities and outcomes',
    traits: ['Conventional'],
    difficulty: 'easy'
  },
  {
    id: 19,
    text: 'I enjoy building and constructing things',
    traits: ['Realistic'],
    difficulty: 'easy'
  },
  {
    id: 20,
    text: 'I am motivated by continuous improvement and excellence',
    traits: ['Investigative', 'Enterprising'],
    difficulty: 'hard'
  }
]

interface QuizResponse {
  questionId: number
  score: number // 1-5 scale
  timestamp: number
}

interface TraitScores {
  [key: string]: number
}

// Calculate trait scores based on responses
export function calculateTraitScores(responses: QuizResponse[]): TraitScores {
  const scores: TraitScores = {}
  
  TRAITS.forEach(trait => {
    scores[trait] = 0
  })

  responses.forEach(response => {
    const question = ADAPTIVE_QUESTIONS.find(q => q.id === response.questionId)
    if (question) {
      question.traits.forEach(trait => {
        scores[trait] += response.score
      })
    }
  })

  // Normalize scores to 0-100
  const maxScore = responses.length * 5
  Object.keys(scores).forEach(trait => {
    scores[trait] = Math.round((scores[trait] / maxScore) * 100)
  })

  return scores
}

// Get next adaptive question based on profile and current responses
export function getAdaptiveQuestion(
  userProfile: {
    interests: string[]
    skills: string[]
    grade: string
  },
  answeredQuestionIds: number[]
): typeof ADAPTIVE_QUESTIONS[0] | null {
  const unanswered = ADAPTIVE_QUESTIONS.filter(
    q => !answeredQuestionIds.includes(q.id)
  )

  if (unanswered.length === 0) return null

  // Prioritize questions matching user's profile
  const matchingQuestions = unanswered.filter(q => {
    const matchesInterests = userProfile.interests.some(interest =>
      q.text.toLowerCase().includes(interest.toLowerCase())
    )
    return matchesInterests
  })

  return matchingQuestions.length > 0
    ? matchingQuestions[0]
    : unanswered[0]
}

// Calculate career compatibility
export function calculateCareerMatch(
  traitScores: TraitScores,
  careerTraits: { [key: string]: number }
): number {
  let totalDifference = 0
  let count = 0

  Object.keys(careerTraits).forEach(trait => {
    const userScore = traitScores[trait] || 0
    const careerScore = careerTraits[trait] || 0
    totalDifference += Math.abs(userScore - careerScore)
    count++
  })

  const avgDifference = count > 0 ? totalDifference / count : 0
  return Math.round(100 - avgDifference)
}
