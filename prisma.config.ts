import { defineConfig } from 'prisma/config'

// DATABASE_URL is only required for migration commands (prisma migrate deploy/dev).
// It is not needed for `prisma generate`, which runs at build time and only reads
// the schema to emit TypeScript types — no database connection is made.
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
