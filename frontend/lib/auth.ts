import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "@neondatabase/serverless"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET,
  plugins: [
    jwt({
      jwt: {
        expirationTime: "7d",
        issuer: "better-auth",
        audience: "todo-app",
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
})

export type Session = typeof auth.$Infer.Session
