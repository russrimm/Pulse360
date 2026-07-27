import { spawnSync } from 'node:child_process';

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

if (!hasDatabaseUrl) {
  console.log('DATABASE_URL is not set; skipping Prisma migrations.');
  process.exit(0);
}

const prismaCommand = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';
const result = spawnSync(prismaCommand, ['migrate', 'deploy'], {
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
