import { Pool } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function addSessionToken() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    console.log("Adding token column to session table...")

    // Add token column if it doesn't exist
    await pool.query(`
      ALTER TABLE "session"
      ADD COLUMN IF NOT EXISTS "token" TEXT;
    `)

    // Make token unique and not null (if it was just added)
    await pool.query(`
      UPDATE "session" SET "token" = gen_random_uuid()::text WHERE "token" IS NULL;
    `)

    await pool.query(`
      ALTER TABLE "session"
      ALTER COLUMN "token" SET NOT NULL;
    `)

    // Add unique constraint if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'session_token_key'
        ) THEN
          ALTER TABLE "session" ADD CONSTRAINT "session_token_key" UNIQUE ("token");
        END IF;
      END $$;
    `)

    // Add index if it doesn't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session"("token");
    `)

    console.log("✅ Session table updated successfully!")
    console.log("   - Added 'token' column")
    console.log("   - Added unique constraint")
    console.log("   - Added index on token")

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error("❌ Migration failed:", error)
    await pool.end()
    process.exit(1)
  }
}

addSessionToken()
