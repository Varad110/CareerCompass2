CREATE TABLE IF NOT EXISTS quiz_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  variant_key VARCHAR(120) NOT NULL UNIQUE,
  generation_mode VARCHAR(20) NOT NULL DEFAULT 'ai',
  seed_payload JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  question_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

ALTER TABLE quiz_questions
  ADD COLUMN quiz_variant_id INT NULL,
  ADD COLUMN question_order INT NULL,
  ADD COLUMN ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD CONSTRAINT fk_quiz_questions_variant
    FOREIGN KEY (quiz_variant_id) REFERENCES quiz_variants(id) ON DELETE CASCADE;

ALTER TABLE quiz_responses
  ADD COLUMN quiz_variant_id INT NULL,
  ADD CONSTRAINT fk_quiz_responses_variant
    FOREIGN KEY (quiz_variant_id) REFERENCES quiz_variants(id) ON DELETE SET NULL;

ALTER TABLE quiz_attempts
  ADD COLUMN quiz_variant_id INT NULL,
  ADD CONSTRAINT fk_quiz_attempts_variant
    FOREIGN KEY (quiz_variant_id) REFERENCES quiz_variants(id) ON DELETE SET NULL;

CREATE INDEX idx_quiz_response_variant ON quiz_responses(quiz_variant_id);
CREATE INDEX idx_quiz_variant_student ON quiz_variants(student_id, status, created_at);
CREATE INDEX idx_quiz_questions_variant ON quiz_questions(quiz_variant_id, question_order, id);
CREATE INDEX idx_quiz_attempts_variant ON quiz_attempts(quiz_variant_id);