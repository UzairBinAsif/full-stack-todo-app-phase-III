import { Pool } from "@neondatabase/serverless"
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"

// Load environment variables
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function runMigration() {
  try {
    console.log("Starting Better Auth database migration...")
    console.log(`Database URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`)

    const pool = new Pool({ connectionString: process.env.DATABASE_URL })

    // Create auth instance
    const auth = betterAuth({
      database: pool,
      plugins: [jwt()],
      emailAndPassword: {
        enabled: true,
      },
    })

    // Generate SQL schema
    console.log("\nGenerating schema SQL...")

    // Better Auth schema with JWT plugin support
    const createUserTableSQL = `
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "name" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "image" TEXT
      );

      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "activeOrganizationId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "expiresAt" TIMESTAMP,
        "password" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "jwks" (
        "id" TEXT PRIMARY KEY,
        "publicKey" TEXT NOT NULL,
        "privateKey" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
      CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session"("token");
      CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
    `

    console.log("\nExecuting schema creation...")
    await pool.query(createUserTableSQL)

    console.log("\n✅ Database tables created successfully!")
    console.log("\nCreated tables:")
    console.log("  - user")
    console.log("  - session")
    console.log("  - account")
    console.log("  - verification")
    console.log("  - jwks")

    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error("\n❌ Migration failed:", error)
    process.exit(1)
  }
}

runMigration()
