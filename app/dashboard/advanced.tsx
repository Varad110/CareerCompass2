'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Target,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Brain,
  Award,
  Clock,
  Flame
} from 'lucide-react'
import Link from 'next/link'

interface SkillMetric {
  name: string
  current: number
  target: number
  resources: string
}

interface RoadmapMilestone {
  month: number
  title: string
  status: 'completed' | 'in_progress' | 'upcoming'
  skills: string[]
}

interface ProgressMetrics {
  overallScore: number
  skillsImproved: number
  milestonesCompleted: number
  hoursLearned: number
  activeCareerPath: string
  matchScore: number
}

export default function AdvancedDashboard() {
  // Mock data
  const studentName = 'Alex Johnson'
  const activeCareer = 'Software Engineer'
  const matchScore = 92

  const progressMetrics: ProgressMetrics = {
    overallScore: 78,
    skillsImproved: 3,
    milestonesCompleted: 2,
    hoursLearned: 24,
    activeCareerPath: 'Software Engineer',
    matchScore: 92
  }

  const skillMetrics: SkillMetric[] = [
    { name: 'Programming', current: 75, target: 90, resources: 'Codecademy' },
    { name: 'Problem Solving', current: 82, target: 95, resources: 'LeetCode' },
    { name: 'System Design', current: 45, target: 80, resources: 'Grokking' },
    { name: 'Communication', current: 68, target: 85, resources: 'Toastmasters' }
  ]

  const roadmapMilestones: RoadmapMilestone[] = [
    {
      month: 1,
      title: 'Master Core Programming Concepts',
      status: 'completed',
      skills: ['JavaScript', 'Data Structures', 'Algorithms']
    },
    {
      month: 2,
      title: 'Build 3 Portfolio Projects',
      status: 'in_progress',
      skills: ['React', 'Node.js', 'Git']
    },
    {
      month: 3,
      title: 'Learn Advanced System Design',
      status: 'upcoming',
      skills: ['Scalability', 'Database Design', 'Microservices']
    },
    {
      month: 4,
      title: 'Prepare for Interviews',
      status: 'upcoming',
      skills: ['Problem Solving', 'Communication', 'Negotiation']
    },
    {
      month: 5,
      title: 'Contribute to Open Source',
      status: 'upcoming',
      skills: ['Collaboration', 'Code Review', 'Best Practices']
    },
    {
      month: 6,
      title: 'Apply to Target Companies',
      status: 'upcoming',
      skills: ['Networking', 'Application Strategy', 'Negotiation']
    }
  ]

  const activityFeed = [
    { type: 'milestone', title: 'Completed: Core Programming Concepts', date: 'Today', icon: CheckCircle2 },
    { type: 'skill', title: 'Improved Problem Solving to 82%', date: 'Yesterday', icon: TrendingUp },
    { type: 'course', title: 'Completed: Data Structures Course', date: '2 days ago', icon: BookOpen },
    { type: 'resource', title: 'Added 4 new learning resources', date: '3 days ago', icon: Award }
  ]

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Progress', value: `${progressMetrics.overallScore}%`, icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
          { label: 'Skills Improved', value: progressMetrics.skillsImproved, icon: Zap, color: 'from-orange-500 to-orange-600' },
          { label: 'Milestones Done', value: progressMetrics.milestonesCompleted, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
          { label: 'Hours Learned', value: progressMetrics.hoursLearned, icon: Clock, color: 'from-purple-500 to-purple-600' }
        ].map((metric, i) => (
          <Card key={i} className="p-6 border-border/40 hover:border-primary/40 transition group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-2">{metric.label}</p>
                <p className="text-3xl font-bold text-foreground">{metric.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center group-hover:scale-110 transition`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Career Path */}
      <Card className="p-8 border-border/40 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Active Path</Badge>
              <h2 className="text-2xl font-bold text-foreground">{activeCareer}</h2>
            </div>
            <p className="text-muted-foreground">6-month personalized learning roadmap</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Career Match Score</p>
            <div className="relative w-20 h-20">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${(matchScore / 100) * 283} 283`}
                  className="text-primary transition-all"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-bold text-foreground">{matchScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Skills & Gaps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Your Skills & Growth</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skillMetrics.map((skill, i) => (
            <Card key={i} className="p-6 border-border/40 hover:border-primary/40 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{skill.name}</h3>
                    <p className="text-xs text-muted-foreground">{skill.resources}</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                    {skill.current}%
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current</span>
                    <span>Target: {skill.target}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                      style={{ width: `${(skill.current / skill.target) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Gap Info */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-amber-700 font-medium">
                    {skill.target - skill.current}% to go • {Math.ceil((skill.target - skill.current) / 5)} weeks estimated
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Learning Roadmap */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Your 6-Month Roadmap</h2>
        <div className="grid gap-4">
          {roadmapMilestones.map((milestone, i) => (
            <Card key={i} className={`p-6 border-2 transition ${
              milestone.status === 'completed'
                ? 'border-green-500/20 bg-green-500/5'
                : milestone.status === 'in_progress'
                ? 'border-primary/40 bg-primary/5'
                : 'border-border/40'
            }`}>
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {milestone.status === 'completed' && (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                  {milestone.status === 'in_progress' && (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  {milestone.status === 'upcoming' && (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                      {milestone.month}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">Month {milestone.month}: {milestone.title}</h3>
                    <Badge
                      variant="outline"
                      className={
                        milestone.status === 'completed'
                          ? 'bg-green-500/10 text-green-700 border-0'
                          : milestone.status === 'in_progress'
                          ? 'bg-primary/10 text-primary border-0'
                          : 'bg-muted text-muted-foreground border-0'
                      }
                    >
                      {milestone.status === 'completed' ? 'Completed' : milestone.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {milestone.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-secondary/50 text-secondary-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action */}
                {milestone.status === 'in_progress' && (
                  <Link href="/dashboard/resources" className="flex-shrink-0">
                    <Button size="sm" variant="outline">
                      View Resources
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Recent Activity</h2>
        <Card className="p-6 border-border/40">
          <div className="space-y-4">
            {activityFeed.map((activity, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 last:pb-0 last:border-0 border-b border-border/40">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <activity.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="p-8 border-border/40 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">Retake the Aptitude Quiz</h3>
            <p className="text-muted-foreground">Update your profile to get refined recommendations based on your latest progress</p>
          </div>
          <Link href="/dashboard/quiz" className="flex-shrink-0">
            <Button className="bg-primary hover:bg-primary/90">
              <Brain className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
