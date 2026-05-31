import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * UI regression check: the Exolix aggregator option has been removed from the
 * Swaps page. This test guards against accidentally re-introducing an Exolix
 * tab, ExolixWidget, or any other Exolix-specific UI control.
 *
 * Note: Exolix data-fetching/state code may still exist in Swaps.tsx as dead
 * code paths gated on `aggregator === 'exolix'`. Since the default aggregator
 * is 'trocador' and there is no UI to switch, those branches are unreachable.
 * This test only asserts that no Exolix UI is actually rendered.
 */
describe('Swaps page — Exolix UI is hidden', () => {
  const source = readFileSync(
    resolve(__dirname, '../Swaps.tsx'),
    'utf8',
  );

  // Strip line/block comments so we only inspect real JSX/code.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('does not render a <TabsTrigger> with value="exolix"', () => {
    expect(code).not.toMatch(/<TabsTrigger[^>]*value=["']exolix["']/i);
  });

  it('does not render the <TabsList> aggregator switcher', () => {
    // The aggregator switcher was the only TabsList on this page.
    expect(code).not.toMatch(/<TabsList[\s>]/);
  });

  it('does not render the <ExolixWidget /> component', () => {
    expect(code).not.toMatch(/<ExolixWidget[\s/>]/);
  });

  it('does not import ExolixWidget', () => {
    expect(code).not.toMatch(/from\s+['"][^'"]*ExolixWidget['"]/);
    expect(code).not.toMatch(/import\s+\{[^}]*\bExolixWidget\b[^}]*\}/);
  });

  it('does not surface visible "Exolix" label text in JSX', () => {
    // Catches things like >Exolix<, "Powered by Exolix", aria-label="Exolix…"
    const jsxTextMatches = code.match(/>\s*[^<]*Exolix[^<]*</g) ?? [];
    expect(jsxTextMatches).toEqual([]);

    const labelAttrMatches = code.match(
      /(aria-label|title|placeholder)\s*=\s*["'][^"']*Exolix[^"']*["']/gi,
    ) ?? [];
    expect(labelAttrMatches).toEqual([]);
  });
});
