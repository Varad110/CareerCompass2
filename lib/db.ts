import mysql, { Pool } from "mysql2/promise";

declare global {
  // Reuse the pool across hot reloads in development.
  var __campusCompassDbPool: Pool | undefined;
  var __campusCompassDbUrl: string | undefined;
}

function getDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment variables.",
    );
  }

  return dbUrl;
}

export function getDbPool(): Pool {
  const dbUrl = getDatabaseUrl();

  if (
    global.__campusCompassDbPool &&
    global.__campusCompassDbUrl &&
    global.__campusCompassDbUrl !== dbUrl
  ) {
    // Recreate the pool when DATABASE_URL changes during development.
    void global.__campusCompassDbPool.end().catch(() => {
      // Ignore shutdown errors and continue with a fresh pool.
    });
    global.__campusCompassDbPool = undefined;
  }

  if (!global.__campusCompassDbPool) {
    global.__campusCompassDbPool = mysql.createPool(dbUrl);
    global.__campusCompassDbUrl = dbUrl;
  }

  return global.__campusCompassDbPool;
}

export async function testDatabaseConnection(): Promise<void> {
  const pool = getDbPool();
  const connection = await pool.getConnection();

  try {
    await connection.query("SELECT 1");
  } finally {
    connection.release();
  }
}
