import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Regression guard: Exolix has been fully removed as a swap supplier.
 * No frontend source file may reference it again (UI, state, API calls or
 * the retired `exolix_coins` table).
 */
const SRC = resolve(__dirname, '../..');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(full) ? [full] : [];
  });

describe('Exolix is fully removed', () => {
  it('has no Exolix references in src/', () => {
    const offenders = walk(SRC)
      .filter((file) => !file.endsWith('no-exolix.test.ts'))
      .filter((file) => /exolix/i.test(readFileSync(file, 'utf8')));

    expect(offenders).toEqual([]);
  });
});
