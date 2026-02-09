import { Pool } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function checkSessionSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'session'
      ORDER BY ordinal_position;
    `)

    console.log("\n📋 Session Table Schema:")
    console.log("========================")
    result.rows.forEach((row) => {
      const nullable = row.is_nullable === "YES" ? "NULL" : "NOT NULL"
      console.log(`  ${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${nullable}`)
    })
    console.log()

    await pool.end()
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

checkSessionSchema()
