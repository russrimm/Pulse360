import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Prisma 7 moved the datasource `url` out of the schema.
// See: https://pris.ly/d/config-datasource
// Prisma CLI auto-loads .env from the project root, so process.env.DATABASE_URL
// is populated by the time this file runs.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
