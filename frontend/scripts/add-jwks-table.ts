import { Pool } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function addJwksTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    console.log("Creating jwks table for Better Auth JWT plugin...")

    // Create jwks table for storing JSON Web Key Sets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "jwks" (
        "id" TEXT PRIMARY KEY,
        "publicKey" TEXT NOT NULL,
        "privateKey" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    console.log("✅ JWKS table created successfully!")
    console.log("   - id (PRIMARY KEY)")
    console.log("   - publicKey (for token verification)")
    console.log("   - privateKey (for token signing)")
    console.log("   - createdAt (timestamp)")

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error("❌ Failed to create jwks table:", error)
    await pool.end()
    process.exit(1)
  }
}

addJwksTable()
