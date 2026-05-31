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

  it('only references "Exolix" in JSX inside aggregator === "exolix" branches', () => {
    // Residual Exolix labels/buttons may remain in the source, but they MUST
    // stay gated behind `aggregator === 'exolix'` — which is unreachable now
    // that the tab switcher is gone. Find every JSX-visible Exolix occurrence
    // and verify it sits inside such a guard.
    const visibleOccurrences: { index: number; snippet: string }[] = [];
    const patterns = [
      /[>\s][^<>{}\n]*Exolix[^<>{}\n]*[<{]/g,
      /(aria-label|title|placeholder)\s*=\s*["'][^"']*Exolix[^"']*["']/gi,
    ];
    for (const re of patterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(code)) !== null) {
        visibleOccurrences.push({ index: m.index, snippet: m[0] });
      }
    }

    const ungated = visibleOccurrences.filter(({ index }) => {
      // Walk backwards looking for the nearest `aggregator === 'exolix'` guard
      // within the enclosing JSX expression (cap at 2KB lookback).
      const window = code.slice(Math.max(0, index - 2000), index);
      return !/aggregator\s*===\s*['"]exolix['"]/.test(window);
    });

    expect(ungated).toEqual([]);
  });
});
