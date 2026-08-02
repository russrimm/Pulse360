import assert from 'node:assert/strict';
import test from 'node:test';
import { getLockfileFailures } from '../scripts/check-lockfile.mjs';

test('accepts canonical SHA-512 integrity metadata', () => {
  assert.deepEqual(getLockfileFailures('integrity: sha512-canonical'), []);
});

test('rejects SHA-1 integrity metadata', () => {
  assert.match(getLockfileFailures('integrity: sha1-weak').join('\n'), /SHA-1/);
});

test('rejects internal package feeds', () => {
  const failures = getLockfileFailures(
    'integrity: sha512-canonical\n' +
      'tarball: https://pkgs.dev.azure.com/example/_packaging/feed/npm/registry/pkg.tgz',
  );
  assert.match(failures.join('\n'), /internal package-feed/);
});
