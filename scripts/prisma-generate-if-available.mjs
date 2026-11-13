import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// `prisma` is a devDependency, so `pnpm install --prod` (production packaging)
// does not have the CLI. Skip quietly there; the build step generates the client.
try {
  require.resolve('prisma/package.json');
} catch {
  console.log('Prisma CLI not installed; skipping prisma generate.');
  process.exit(0);
}

const prismaCommand = process.platform === 'win32' ? 'prisma.cmd' : 'prisma';
const result = spawnSync(prismaCommand, ['generate'], {
  stdio: 'inherit',
  // Node refuses to spawn .cmd files without a shell on Windows (EINVAL).
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
