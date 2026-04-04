-- Career Compass Database Schema

CREATE DATABASE IF NOT EXISTS career_compass;
USE career_compass;

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  grade VARCHAR(20) NOT NULL COMMENT 'e.g. "11", "12", "Graduate"',
  stream VARCHAR(50) NOT NULL COMMENT 'Science / Commerce / Arts / Other',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Academic Scores Table
CREATE TABLE IF NOT EXISTS academic_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL COMMENT 'e.g. Mathematics, Biology, English',
  score DECIMAL(5,2) NOT NULL COMMENT '0-100 percentage',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_subject (student_id, subject)
);

-- Quiz Variants Table
CREATE TABLE IF NOT EXISTS quiz_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  variant_key VARCHAR(120) NOT NULL UNIQUE,
  generation_mode VARCHAR(20) NOT NULL DEFAULT 'ai' COMMENT 'ai or fallback',
  ai_provider VARCHAR(30) NULL COMMENT 'google, grok, openai',
  ai_model VARCHAR(120) NULL,
  ai_raw_response LONGTEXT NULL COMMENT 'raw model JSON/text response',
  seed_payload JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, archived',
  question_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Quiz Questions Table (seeded once)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quiz_variant_id INT NULL,
  question_order INT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(255) NOT NULL,
  option_b VARCHAR(255) NOT NULL,
  option_c VARCHAR(255) NOT NULL,
  option_d VARCHAR(255) NOT NULL,
  trait_a VARCHAR(50) NOT NULL COMMENT 'Trait tag for option A',
  trait_b VARCHAR(50) NOT NULL COMMENT 'Trait tag for option B',
  trait_c VARCHAR(50) NOT NULL COMMENT 'Trait tag for option C',
  trait_d VARCHAR(50) NOT NULL COMMENT 'Trait tag for option D',
  category VARCHAR(50) NOT NULL COMMENT '"interest" / "aptitude" / "personality"',
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_variant_id) REFERENCES quiz_variants(id) ON DELETE CASCADE
);

-- Quiz Responses Table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  quiz_variant_id INT NULL,
  question_id INT NOT NULL,
  selected_option CHAR(1) NOT NULL COMMENT 'a, b, c, or d',
  trait_scored VARCHAR(50) NOT NULL COMMENT 'The trait earned by that answer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_variant_id) REFERENCES quiz_variants(id) ON DELETE SET NULL,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

-- Trait Scores Table
CREATE TABLE IF NOT EXISTS trait_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  trait VARCHAR(50) NOT NULL COMMENT 'e.g. logical, creative, empathy',
  score INT NOT NULL DEFAULT 0 COMMENT 'Cumulative count of that trait',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_trait (student_id, trait)
);

-- Career Profiles Table
CREATE TABLE IF NOT EXISTS career_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  career_key VARCHAR(100) NOT NULL UNIQUE,
  career_title VARCHAR(150) NOT NULL,
  description TEXT,
  required_traits JSON COMMENT 'JSON array of required traits',
  subject_weights JSON COMMENT 'JSON object with subject weights',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Results Table
CREATE TABLE IF NOT EXISTS results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  career_key VARCHAR(100) NOT NULL,
  career_title VARCHAR(150) NOT NULL,
  match_score DECIMAL(5,2) NOT NULL COMMENT '0-100% match',
  rank_position INT NOT NULL COMMENT '1 = best match',
  analysis TEXT COMMENT 'Detailed analysis',
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_career_rank (student_id, rank_position)
);

-- Recommended Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  career_key VARCHAR(100) NOT NULL,
  resource_title VARCHAR(150) NOT NULL,
  resource_type VARCHAR(50) NOT NULL COMMENT 'course, book, skill, certification',
  url VARCHAR(500),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (career_key) REFERENCES career_profiles(career_key) ON DELETE CASCADE
);

-- User Skills & Interests Table
CREATE TABLE IF NOT EXISTS user_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level INT NOT NULL DEFAULT 1 COMMENT '1-5 scale',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_skill (student_id, skill_name)
);

-- User Interests Table
CREATE TABLE IF NOT EXISTS user_interests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  interest_name VARCHAR(100) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_interest (student_id, interest_name)
);

-- Quiz Attempts Table (for tracking multiple attempts)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  quiz_variant_id INT NULL,
  attempt_number INT NOT NULL,
  total_score INT NOT NULL,
  completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_variant_id) REFERENCES quiz_variants(id) ON DELETE SET NULL
);

-- Learning Roadmap Table
CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  career_id VARCHAR(100) NOT NULL,
  career_title VARCHAR(150) NOT NULL,
  duration_months INT NOT NULL DEFAULT 6,
  status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, completed, paused',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Roadmap Milestones Table
CREATE TABLE IF NOT EXISTS roadmap_milestones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  roadmap_id INT NOT NULL,
  month_number INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, in_progress, completed',
  completion_date TIMESTAMP NULL,
  FOREIGN KEY (roadmap_id) REFERENCES learning_roadmaps(id) ON DELETE CASCADE
);

-- Skill Gap Analysis Table
CREATE TABLE IF NOT EXISTS skill_gaps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  career_id VARCHAR(100) NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  current_level INT NOT NULL DEFAULT 0 COMMENT '0-100 scale',
  required_level INT NOT NULL DEFAULT 85,
  gap_size INT GENERATED ALWAYS AS (required_level - current_level) STORED,
  recommended_resources JSON COMMENT 'JSON array of resource URLs/names',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Career Strength Analysis Table
CREATE TABLE IF NOT EXISTS career_strengths (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  career_id VARCHAR(100) NOT NULL,
  strength_name VARCHAR(100) NOT NULL,
  relevance_score INT NOT NULL DEFAULT 0 COMMENT '0-100 scale',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Progress Tracking Table
CREATE TABLE IF NOT EXISTS progress_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  milestone_id INT,
  activity_type VARCHAR(50) NOT NULL COMMENT 'course_completed, skill_improved, milestone_achieved',
  activity_description VARCHAR(255),
  progress_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (milestone_id) REFERENCES roadmap_milestones(id) ON DELETE SET NULL
);

-- Create Indexes for Performance
CREATE INDEX idx_student_email ON students(email);
CREATE INDEX idx_academic_student ON academic_scores(student_id);
CREATE INDEX idx_quiz_response_student ON quiz_responses(student_id);
CREATE INDEX idx_quiz_response_variant ON quiz_responses(quiz_variant_id);
CREATE INDEX idx_trait_score_student ON trait_scores(student_id);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_rank ON results(student_id, rank_position);
CREATE INDEX idx_quiz_variant_student ON quiz_variants(student_id, status, created_at);
CREATE INDEX idx_quiz_questions_variant ON quiz_questions(quiz_variant_id, question_order, id);
CREATE INDEX idx_resources_career ON resources(career_key);
CREATE INDEX idx_user_skills_student ON user_skills(student_id);
CREATE INDEX idx_user_interests_student ON user_interests(student_id);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_variant ON quiz_attempts(quiz_variant_id);
CREATE INDEX idx_roadmap_student ON learning_roadmaps(student_id);
CREATE INDEX idx_milestones_roadmap ON roadmap_milestones(roadmap_id);
CREATE INDEX idx_skill_gaps_student ON skill_gaps(student_id);
CREATE INDEX idx_career_strengths_student ON career_strengths(student_id);
CREATE INDEX idx_progress_tracking ON progress_tracking(student_id);
