#!/usr/bin/env node
/**
 * Verifies npm registry provenance for the pnpm lockfile.
 *
 * A machine-level ~/.npmrc pointing at an internal Microsoft package proxy can
 * silently rewrite package URLs and downgrade integrity metadata to SHA-1. That
 * corrupts provenance for this public repository. The repository .npmrc pins
 * the public registry; this check rejects contaminated lockfiles.
 *
 * Run with:  node scripts/check-lockfile.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const INTERNAL_FEED =
  /ms-feed-\d+\.pkgs\.visualstudio\.com|packagefeedproxy\.microsoft\.io|pkgs\.dev\.azure\.com/gi;
const PUBLIC_REGISTRY = /^\s*registry\s*=\s*https:\/\/registry\.npmjs\.org\/?\s*$/m;

const lockfile = join(repoRoot, 'pnpm-lock.yaml');

export function getLockfileFailures(contents) {
  const failures = [];
  const matches = contents.match(INTERNAL_FEED) ?? [];
  if (matches.length > 0) {
    const hosts = [...new Set(matches)].join(', ');
    failures.push(
      `pnpm-lock.yaml: ${matches.length} internal package-feed URL(s) (${hosts}). ` +
        'Reinstall with the public registry to restore provenance.',
    );
  }

  const weakIntegrityHashes = contents.match(/integrity:\s*sha1-/g) ?? [];
  if (weakIntegrityHashes.length > 0) {
    failures.push(
      `pnpm-lock.yaml: ${weakIntegrityHashes.length} SHA-1 integrity hash(es). ` +
        'Reinstall against registry.npmjs.org to restore SHA-512 provenance.',
    );
  }

  if (!/integrity:\s*sha512-/.test(contents)) {
    failures.push(
      'pnpm-lock.yaml has no SHA-512 integrity hashes, so provenance cannot be verified.',
    );
  }

  return failures;
}

function main() {
  const failures = [];
  if (!existsSync(lockfile)) {
    failures.push('pnpm-lock.yaml is missing.');
  } else {
    const contents = readFileSync(lockfile, 'utf8');
    failures.push(...getLockfileFailures(contents));
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
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
