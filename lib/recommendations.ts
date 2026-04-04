export interface Career {
  id: string
  title: string
  description: string
  riasecProfile: { [key: string]: number }
  requiredSkills: string[]
  minScoreRequirement: number
  growthPotential: number
  averageSalary: string
  demandLevel: 'High' | 'Medium' | 'Low'
  requiredEducation: string[]
}

export interface CareerRecommendation {
  career: Career
  matchScore: number
  strengths: string[]
  skillGaps: string[]
  roadmap: RoadmapMilestone[]
}

export interface RoadmapMilestone {
  month: number
  title: string
  description: string
  resources: string[]
  skills: string[]
}

export interface SkillGapAnalysis {
  skillName: string
  currentLevel: number
  requiredLevel: number
  gap: number
  recommendedResources: string[]
}

// Career Profiles with RIASEC mapping
export const CAREERS: Career[] = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    description: 'Design, develop, and maintain software applications and systems',
    riasecProfile: {
      Realistic: 70,
      Investigative: 85,
      Artistic: 40,
      Social: 30,
      Enterprising: 50,
      Conventional: 60
    },
    requiredSkills: ['Programming', 'Problem Solving', 'System Design', 'Technical Communication'],
    minScoreRequirement: 75,
    growthPotential: 95,
    averageSalary: '₹8-15 LPA',
    demandLevel: 'High',
    requiredEducation: ['B.Tech', 'BCA', 'Computer Science']
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    description: 'Analyze complex datasets and develop predictive models',
    riasecProfile: {
      Realistic: 50,
      Investigative: 90,
      Artistic: 30,
      Social: 20,
      Enterprising: 40,
      Conventional: 50
    },
    requiredSkills: ['Mathematics', 'Statistics', 'Programming', 'Analytical Thinking'],
    minScoreRequirement: 80,
    growthPotential: 98,
    averageSalary: '₹10-18 LPA',
    demandLevel: 'High',
    requiredEducation: ['B.Tech', 'B.Sc (Statistics)', 'Data Science']
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    description: 'Lead product vision, strategy, and execution',
    riasecProfile: {
      Realistic: 40,
      Investigative: 70,
      Artistic: 50,
      Social: 70,
      Enterprising: 85,
      Conventional: 55
    },
    requiredSkills: ['Leadership', 'Strategic Thinking', 'Communication', 'Analytical'],
    minScoreRequirement: 70,
    growthPotential: 90,
    averageSalary: '₹10-20 LPA',
    demandLevel: 'High',
    requiredEducation: ['Any Bachelor\'s', 'MBA (preferred)']
  },
  {
    id: 'ux-designer',
    title: 'UX/UI Designer',
    description: 'Create intuitive and beautiful user experiences',
    riasecProfile: {
      Realistic: 45,
      Investigative: 60,
      Artistic: 85,
      Social: 65,
      Enterprising: 50,
      Conventional: 40
    },
    requiredSkills: ['Design Thinking', 'Creativity', 'User Research', 'Technical Design'],
    minScoreRequirement: 65,
    growthPotential: 85,
    averageSalary: '₹5-12 LPA',
    demandLevel: 'High',
    requiredEducation: ['Design School', 'Self-taught (portfolio)', 'Any degree + Design course']
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    description: 'Transform data into actionable business insights',
    riasecProfile: {
      Realistic: 60,
      Investigative: 75,
      Artistic: 25,
      Social: 40,
      Enterprising: 45,
      Conventional: 70
    },
    requiredSkills: ['SQL', 'Excel', 'Data Visualization', 'Problem Solving'],
    minScoreRequirement: 65,
    growthPotential: 80,
    averageSalary: '₹5-10 LPA',
    demandLevel: 'High',
    requiredEducation: ['B.Tech', 'Any degree + Analytics course']
  },
  {
    id: 'financial-analyst',
    title: 'Financial Analyst',
    description: 'Analyze financial data and provide investment recommendations',
    riasecProfile: {
      Realistic: 35,
      Investigative: 80,
      Artistic: 20,
      Social: 50,
      Enterprising: 75,
      Conventional: 85
    },
    requiredSkills: ['Financial Analysis', 'Excel', 'Business Acumen', 'Attention to Detail'],
    minScoreRequirement: 70,
    growthPotential: 85,
    averageSalary: '₹6-15 LPA',
    demandLevel: 'Medium',
    requiredEducation: ['B.Com', 'Finance degree', 'CFA/CA (preferred)']
  },
  {
    id: 'management-consultant',
    title: 'Management Consultant',
    description: 'Advise organizations on strategy and operations',
    riasecProfile: {
      Realistic: 40,
      Investigative: 75,
      Artistic: 45,
      Social: 75,
      Enterprising: 85,
      Conventional: 50
    },
    requiredSkills: ['Strategic Thinking', 'Communication', 'Leadership', 'Analytical'],
    minScoreRequirement: 75,
    growthPotential: 95,
    averageSalary: '₹8-20 LPA',
    demandLevel: 'Medium',
    requiredEducation: ['Any Bachelor\'s', 'MBA (preferred)', 'IIM/XLRI']
  },
  {
    id: 'civil-engineer',
    title: 'Civil Engineer',
    description: 'Design and build infrastructure projects',
    riasecProfile: {
      Realistic: 85,
      Investigative: 75,
      Artistic: 50,
      Social: 50,
      Enterprising: 55,
      Conventional: 70
    },
    requiredSkills: ['Technical Design', 'Project Management', 'Problem Solving', 'Technical Communication'],
    minScoreRequirement: 70,
    growthPotential: 80,
    averageSalary: '₹5-12 LPA',
    demandLevel: 'Medium',
    requiredEducation: ['B.Tech Civil', 'Architecture']
  }
]

// Generate personalized 6-12 month roadmap
export function generateRoadmap(
  career: Career,
  currentSkills: string[],
  durationMonths: number = 6
): RoadmapMilestone[] {
  const milestones: RoadmapMilestone[] = []
  const skillGaps = career.requiredSkills.filter(
    skill => !currentSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
  )

  const monthlyGoals = Math.ceil(skillGaps.length / (durationMonths / 2))

  for (let month = 1; month <= durationMonths; month++) {
    const skillIndex = Math.floor((month - 1) / monthlyGoals)
    const skill = skillGaps[skillIndex] || career.requiredSkills[0]

    milestones.push({
      month,
      title: `Master ${skill}`,
      description: `Complete comprehensive learning in ${skill} through courses and projects`,
      resources: getRecommendedResources(skill, career.title),
      skills: [skill]
    })
  }

  return milestones
}

// Analyze skill gaps
export function analyzeSkillGaps(
  userSkills: string[],
  careerRequiredSkills: string[]
): SkillGapAnalysis[] {
  return careerRequiredSkills.map(skill => ({
    skillName: skill,
    currentLevel: userSkills.includes(skill) ? 70 : 20,
    requiredLevel: 85,
    gap: userSkills.includes(skill) ? 15 : 65,
    recommendedResources: getRecommendedResources(skill, '')
  }))
}

// Get recommended resources for a skill
function getRecommendedResources(skill: string, careerTitle: string): string[] {
  const resourceMap: { [key: string]: string[] } = {
    'Programming': ['Codecademy', 'LeetCode', 'GitHub Projects', 'Coursera - Computer Science'],
    'Problem Solving': ['HackerRank', 'Project Euler', 'GeeksforGeeks', 'InterviewBit'],
    'Design Thinking': ['Coursera - Design Thinking', 'Nielsen Norman UX', 'Figma Tutorials'],
    'Leadership': ['Coursera - Leadership', 'LinkedIn Learning', 'Management books', 'Toastmasters'],
    'Data Visualization': ['Tableau', 'Power BI', 'D3.js Tutorials', 'Kaggle Competitions'],
    'Financial Analysis': ['CFA Institute', 'Bloomberg Terminal', 'Excel Advanced', 'Financial Modeling'],
    'System Design': ['System Design Primer', 'Grokking System Design', 'YouTube Channels'],
    'User Research': ['Nielsen Norman', 'UX Research Methods', 'User Testing Platforms'],
    'Excel': ['LinkedIn Learning Excel', 'Excel Advanced Tutorials', 'DataCamp'],
    'SQL': ['SQLZoo', 'Mode Analytics', 'HackerRank SQL', 'Udemy - SQL Course']
  }

  return resourceMap[skill] || ['Coursera', 'Udemy', 'LinkedIn Learning', 'YouTube Tutorials']
}

// Get top career matches
export function getTopCareerMatches(
  traitScores: { [key: string]: number },
  userSkills: string[],
  academicScore: number,
  limit: number = 5
): CareerRecommendation[] {
  const recommendations = CAREERS.map(career => {
    // Calculate trait match score
    let traitScore = 0
    let traitCount = 0

    Object.keys(career.riasecProfile).forEach(trait => {
      const userTraitScore = traitScores[trait] || 50
      const careerTraitScore = career.riasecProfile[trait]
      const difference = Math.abs(userTraitScore - careerTraitScore)
      traitScore += 100 - difference
      traitCount++
    })

    traitScore = traitScore / traitCount

    // Weight: 50% traits, 30% academic, 20% skills
    const skillMatch = (career.requiredSkills.filter(skill =>
      userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))
    ).length / career.requiredSkills.length) * 100

    const matchScore = Math.round(
      (traitScore * 0.5) +
      (Math.min(academicScore / career.minScoreRequirement * 100, 100) * 0.3) +
      (skillMatch * 0.2)
    )

    return {
      career,
      matchScore,
      strengths: career.requiredSkills.filter(skill =>
        userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))
      ),
      skillGaps: career.requiredSkills.filter(skill =>
        !userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))
      ),
      roadmap: generateRoadmap(career, userSkills)
    }
  })

  return recommendations
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit)
}
