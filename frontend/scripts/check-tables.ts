import { Pool } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function checkTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    console.log("\n📋 Database Tables:")
    console.log("===================")
    result.rows.forEach((row) => {
      console.log(`✓ ${row.table_name}`)
    })
    console.log(`\nTotal: ${result.rows.length} tables\n`)

    await pool.end()
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

checkTables()
