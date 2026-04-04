import { getDbPool } from "@/lib/db";

let quizSchemaReady: Promise<void> | null = null;

async function columnExists(
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );

  return Number((rows as Array<{ total: number }>)[0]?.total ?? 0) > 0;
}

async function ensureColumn(
  tableName: string,
  columnName: string,
  columnDefinition: string,
): Promise<void> {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    const exists = await columnExists(tableName, columnName);
    if (!exists) {
      await connection.query(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
      );
    }
  } finally {
    connection.release();
  }
}

export async function ensureQuizSchema(): Promise<void> {
  if (!quizSchemaReady) {
    quizSchemaReady = (async () => {
      const pool = getDbPool();
      const connection = await pool.getConnection();

      try {
        await connection.query(
          `CREATE TABLE IF NOT EXISTS quiz_variants (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_id INT NOT NULL,
            variant_key VARCHAR(120) NOT NULL UNIQUE,
            generation_mode VARCHAR(20) NOT NULL DEFAULT 'ai',
            ai_provider VARCHAR(30) NULL,
            ai_model VARCHAR(120) NULL,
            ai_raw_response LONGTEXT NULL,
            seed_payload JSON NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            question_count INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
          )`,
        );
      } finally {
        connection.release();
      }

      await ensureColumn("quiz_questions", "quiz_variant_id", "INT NULL");
      await ensureColumn("quiz_questions", "question_order", "INT NULL");
      await ensureColumn(
        "quiz_questions",
        "ai_generated",
        "BOOLEAN NOT NULL DEFAULT FALSE",
      );
      await ensureColumn("quiz_variants", "ai_provider", "VARCHAR(30) NULL");
      await ensureColumn("quiz_variants", "ai_model", "VARCHAR(120) NULL");
      await ensureColumn("quiz_variants", "ai_raw_response", "LONGTEXT NULL");
      await ensureColumn("quiz_responses", "quiz_variant_id", "INT NULL");
      await ensureColumn("quiz_attempts", "quiz_variant_id", "INT NULL");
    })();
  }

  return quizSchemaReady;
}
