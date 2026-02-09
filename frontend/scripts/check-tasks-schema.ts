import { Pool } from "@neondatabase/serverless"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env.local") })

async function checkTasksSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `)

    console.log("\n📋 Tasks Table Schema:")
    console.log("======================")

    if (result.rows.length === 0) {
      console.log("❌ Tasks table does not exist!")
    } else {
      result.rows.forEach((row) => {
        const nullable = row.is_nullable === "YES" ? "NULL" : "NOT NULL"
        const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : ""
        console.log(`  ${row.column_name.padEnd(20)} ${row.data_type.padEnd(25)} ${nullable}${defaultVal}`)
      })
    }
    console.log()

    await pool.end()
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

checkTasksSchema()
