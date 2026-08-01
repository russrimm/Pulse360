#!/usr/bin/env node
/**
 * Verifies npm registry provenance for the pnpm lockfile.
 *
 * A machine-level ~/.npmrc pointing at an internal Microsoft package proxy
 * silently rewrites every `tarball:` URL during install. That corrupts
 * provenance for this public repository and breaks installs for outside
 * contributors, who cannot reach the internal feed. The repository .npmrc
 * declares the public registry explicitly; this check fails if that protection
 * is lost or a contaminated lockfile is committed.
 *
 * Run with:  node scripts/check-lockfile.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const INTERNAL_FEED =
  /ms-feed-\d+\.pkgs\.visualstudio\.com|packagefeedproxy\.microsoft\.io|pkgs\.dev\.azure\.com/gi;
const PUBLIC_REGISTRY = /^\s*registry\s*=\s*https:\/\/registry\.npmjs\.org\/?\s*$/m;

const failures = [];
const lockfile = join(repoRoot, 'pnpm-lock.yaml');

if (!existsSync(lockfile)) {
  failures.push('pnpm-lock.yaml is missing.');
} else {
  const contents = readFileSync(lockfile, 'utf8');
  const matches = contents.match(INTERNAL_FEED) ?? [];
  if (matches.length > 0) {
    const hosts = [...new Set(matches)].join(', ');
    failures.push(
      `pnpm-lock.yaml: ${matches.length} internal package-feed URL(s) (${hosts}). ` +
        'Reinstall with the public registry to restore provenance.',
    );
  }
  if (!/tarball:\s*https:/.test(contents)) {
    failures.push(
      'pnpm-lock.yaml has no tarball URLs, so this check would pass vacuously. ' +
        'The lockfile format changed and this script needs updating.',
    );
  }
}

const npmrc = join(repoRoot, '.npmrc');
if (!existsSync(npmrc)) {
  failures.push('No .npmrc at the repository root to pin the public registry.');
} else if (!PUBLIC_REGISTRY.test(readFileSync(npmrc, 'utf8'))) {
  failures.push('.npmrc does not pin registry.npmjs.org');
}

if (failures.length > 0) {
  console.error('Lockfile provenance check failed:\n');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Lockfile provenance OK.');
