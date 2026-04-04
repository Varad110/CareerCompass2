# Career Compass 🧭

A professional career guidance and skill recommendation system built for students to discover their ideal career paths through aptitude testing and personalized recommendations.

## 🎯 Problem Statement

Students often lack proper guidance in choosing suitable career paths. This system analyzes student interests, academic performance, and skills to recommend suitable career options, including aptitude tests and learning resources.

## 🏗️ Project Structure

```
career-compass/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── layout.tsx                        # Root layout
│   ├── globals.css                       # Global styles & design tokens
│   ├── login/
│   │   └── page.tsx                     # Login page
│   ├── signup/
│   │   └── page.tsx                     # Signup page
│   └── dashboard/
│       ├── page.tsx                     # Main dashboard
│       ├── profile/
│       │   └── page.tsx                 # Student profile & academic scores
│       ├── quiz/
│       │   └── page.tsx                 # Aptitude quiz
│       ├── results/
│       │   └── page.tsx                 # Career recommendations & traits
│       └── resources/
│           └── page.tsx                 # Learning resources
├── components/
│   └── ui/                              # shadcn/ui components
├── scripts/
│   └── init-db.sql                      # Database schema
├── public/                              # Static assets
└── package.json                         # Dependencies

```

## 🗄️ Database Schema

### Core Tables

1. **students** - User registration and basic information
   - `id` (INT, PK)
   - `name`, `email`, `password`
   - `grade` (11, 12, Graduate)
   - `stream` (Science, Commerce, Arts, Other)
   - `created_at`, `updated_at`

2. **academic_scores** - Subject-wise academic performance
   - `id` (INT, PK)
   - `student_id` (FK)
   - `subject` (Mathematics, Physics, Chemistry, etc.)
   - `score` (0-100)

3. **quiz_questions** - Pre-seeded aptitude assessment questions
   - `id` (INT, PK)
   - `question_text`
   - `option_a/b/c/d`
   - `trait_a/b/c/d` (associated trait for each option)
   - `category` (interest, aptitude, personality)

4. **quiz_responses** - Student's quiz answers
   - `id` (INT, PK)
   - `student_id` (FK)
   - `question_id` (FK)
   - `selected_option` (a/b/c/d)
   - `trait_scored` (the trait earned)

5. **trait_scores** - Aggregated trait scores per student
   - `id` (INT, PK)
   - `student_id` (FK)
   - `trait` (logical, creative, empathy, leadership, etc.)
   - `score` (cumulative count)

6. **career_profiles** - Career option definitions
   - `id` (INT, PK)
   - `career_key` (software_engineer, data_scientist)
   - `career_title`
   - `description`
   - `required_traits` (JSON)
   - `subject_weights` (JSON)

7. **results** - Top 3 career matches per student
   - `id` (INT, PK)
   - `student_id` (FK)
   - `career_key`, `career_title`
   - `match_score` (0-100%)
   - `rank_position` (1-3)
   - `analysis`

8. **resources** - Learning materials for each career
   - `id` (INT, PK)
   - `career_key` (FK)
   - `resource_title`
   - `resource_type` (course, book, skill, certification)
   - `url`, `description`

## 🔧 How the Recommendation Engine Works

The system generates personalized career recommendations through this algorithm:

```
1. PROFILE ANALYSIS
   ├── Academic Scores → Subject Weights
   │   (Math: +High tech careers, Physics: +Engineering, Biology: +Medical)
   └── Quiz Responses → Trait Aggregation
       (Count occurrences of each trait)

2. CAREER MATCHING
   ├── For Each Career Profile:
   │   ├── Trait Compatibility = (traits_match / required_traits) × 60%
   │   ├── Subject Suitability = (academic_match) × 40%
   │   └── Final Score = Trait_Comp + Subject_Suit
   └── Rank by Score

3. RESULT GENERATION
   └── Save Top 3 Careers → Results Table
```

**Tracked Traits:**
- Technical, Logical, Analytical, Creative, Artistic
- Leadership, Communication, Empathy, Social, Patience

## 🎨 Design System

### Color Palette (Professional Blue Theme)
- **Primary**: Blue (`oklch(0.45 0.21 253.76)`) - Main CTA buttons, highlights
- **Accent**: Orange (`oklch(0.55 0.25 40)`) - Emphasis elements
- **Secondary**: Light Blue (`oklch(0.95 0.05 240)`) - Backgrounds
- **Neutral**: Grays - Text and borders

### Typography
- **Headings**: Geist (Bold)
- **Body**: Geist (Regular)
- **Mono**: Geist Mono (Code snippets)

### Components
All UI components from shadcn/ui with customized theming:
- Cards, Buttons, Inputs, Badges, Tabs
- Responsive design with Tailwind CSS
- Dark mode support via CSS variables

## 🚀 Pages Overview

### Public Pages
- **Home** (`/`) - Landing page with features and CTAs
- **Login** (`/login`) - Student authentication
- **Signup** (`/signup`) - Account creation

### Protected Dashboard
- **Dashboard** (`/dashboard`) - Overview and top career matches
- **Profile** (`/dashboard/profile`) - Student info and academic scores
- **Quiz** (`/dashboard/quiz`) - Interactive aptitude assessment
- **Results** (`/dashboard/results`) - Detailed career recommendations and traits
- **Resources** (`/dashboard/resources`) - Curated learning materials

## 🔐 Authentication Flow

```
SignUp → Email + Password (bcrypt hash)
   ↓
Login → Create Session/JWT
   ↓
Dashboard → Protected Routes
   ↓
Logout → Clear Session
```

## 📊 Data Flow

```
Student Profile
    ↓
Academic Scores (Subjects & Percentages)
    ↓
Aptitude Quiz (Interest, Aptitude, Personality)
    ↓
Trait Score Aggregation
    ↓
Career Recommendation Engine
    ↓
Top 3 Career Matches + Analysis
    ↓
Learning Resources & Next Steps
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15+ with App Router
- **UI Library**: React 19 with shadcn/ui
- **Styling**: Tailwind CSS + CSS Variables
- **Icons**: Lucide React

### Backend (To be implemented)
- **Runtime**: Node.js + Express
- **Database**: MySQL/PostgreSQL
- **Authentication**: JWT/Session-based
- **Password**: bcrypt hashing

### Deployment
- **Frontend**: Vercel
- **Backend**: Node.js server (can be Vercel Functions)
- **Database**: AWS RDS / Planetscale / Neon

## 📱 Responsive Design

- **Mobile First** approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px)
- **Fluid Typography** and spacing
- **Touch-friendly** components with adequate padding

## 🎯 Key Features

✅ User registration and authentication
✅ Academic profile management
✅ Interactive aptitude quiz (multi-category)
✅ Trait-based career recommendation engine
✅ Match scoring system (0-100%)
✅ Detailed career profiles and analysis
✅ Curated learning resources
✅ Skill gap analysis
✅ Progress tracking
✅ Responsive mobile design

## 📈 Future Enhancements

- [ ] AI-powered personality assessment
- [ ] Real-time career trend analysis
- [ ] Mentor matching system
- [ ] Interview preparation resources
- [ ] Salary predictions by region
- [ ] Job market insights
- [ ] Community forum
- [ ] Progress tracking & milestones
- [ ] Mobile app (React Native)
- [ ] Admin dashboard for career data management

## 🔗 API Endpoints (To be implemented)

```
Authentication
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

Profile
GET    /api/profile
PUT    /api/profile
GET    /api/academic-scores
POST   /api/academic-scores
DELETE /api/academic-scores/:id

Quiz
GET    /api/quiz/questions
POST   /api/quiz/responses
GET    /api/quiz/status

Results
GET    /api/results
GET    /api/results/:careerKey
GET    /api/traits

Resources
GET    /api/resources
GET    /api/resources/career/:careerKey
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm/pnpm/yarn
- MySQL/PostgreSQL database

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Setup database**
   ```bash
   # Create database
   mysql -u root -p < scripts/init-db.sql
   
   # Or if using PostgreSQL
   psql -f scripts/init-db.sql
   ```

3. **Environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in:
   # DATABASE_URL=mysql://user:password@localhost/career_compass
   # JWT_SECRET=your-secret-key
   # NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

5. **Open browser**
   ```
   http://localhost:3000
   ```

## 📝 License

This project is built for the Education Track hackathon.

## 👥 Team

Career Compass - A project by dedicated developers building the future of career guidance.

---

**Last Updated**: 2024
**Status**: Hackathon Project (MVP)
#   C a r e e r C o m p a s s 2  
 