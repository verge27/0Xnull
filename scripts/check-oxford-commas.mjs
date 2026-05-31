#!/usr/bin/env node
/**
 * Oxford comma checker.
 *
 * Flags occurrences of `, and ` / `, or ` that follow another comma in the
 * same clause (i.e. a list of 3+ items) across user-facing text files.
 *
 * Usage:
 *   node scripts/check-oxford-commas.mjs           # scan default roots
 *   node scripts/check-oxford-commas.mjs --fix     # auto-remove offending commas
 *   node scripts/check-oxford-commas.mjs file1 ... # scan specific files (used by lint-staged / CI)
 *
 * Exits 1 when violations are found (unless --fix is passed).
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const explicit = args.filter((a) => !a.startsWith('--'));

const DEFAULT_ROOTS = ['src', 'public', 'supabase/functions', 'index.html'];
const EXTS = new Set(['.tsx', '.ts', '.jsx', '.js', '.md', '.mdx', '.txt', '.html']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '__tests__', 'coverage']);
const SKIP_FILES = new Set([
  'package.json',
  'package-lock.json',
  'bun.lockb',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'components.json',
]);

// Oxford comma: requires another comma earlier in the same clause.
// Clause boundary chars: . ! ? ; : \n " ` > {
const OXFORD_RE = /([^.!?;:\n"`>{]*,[^.!?;:\n"`>{]*),( (?:and|or) )/gi;

function walk(p, out) {
  let st;
  try {
    st = fs.statSync(p);
  } catch {
    return;
  }
  if (st.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(p))) return;
    for (const f of fs.readdirSync(p)) walk(path.join(p, f), out);
  } else {
    if (SKIP_FILES.has(path.basename(p))) return;
    if (!EXTS.has(path.extname(p))) return;
    out.push(p);
  }
}

const files = [];
if (explicit.length) {
  for (const f of explicit) walk(f, files);
} else {
  for (const r of DEFAULT_ROOTS) walk(r, files);
}

let violationCount = 0;
let fixedCount = 0;
const report = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (fix) {
    let count = 0;
    const next = src.replace(OXFORD_RE, (_m, pre, tail) => {
      count++;
      return pre + tail;
    });
    if (count > 0) {
      fs.writeFileSync(file, next);
      fixedCount += count;
      report.push(`  fixed ${count}\t${file}`);
    }
  } else {
    // Iterate matches and compute line numbers.
    OXFORD_RE.lastIndex = 0;
    let m;
    const lineStarts = [0];
    for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1);
    while ((m = OXFORD_RE.exec(src)) !== null) {
      // Position of the offending comma is at m.index + m[1].length.
      const offset = m.index + m[1].length;
      let lo = 0;
      let hi = lineStarts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStarts[mid] <= offset) lo = mid;
        else hi = mid - 1;
      }
      const line = lo + 1;
      const lineText = src.slice(lineStarts[lo], src.indexOf('\n', lineStarts[lo]) === -1 ? src.length : src.indexOf('\n', lineStarts[lo]));
      const snippet = lineText.trim().slice(0, 160);
      report.push(`  ${file}:${line}\n    ${snippet}`);
      violationCount++;
    }
  }
}

if (fix) {
  console.log(`Oxford comma autofix: removed ${fixedCount} comma(s) across ${report.length} file(s).`);
  if (report.length) console.log(report.join('\n'));
  process.exit(0);
} else if (violationCount > 0) {
  console.error(`\n✖ Found ${violationCount} Oxford comma(s) in user-facing text:\n`);
  console.error(report.join('\n'));
  console.error(`\nRun \`node scripts/check-oxford-commas.mjs --fix\` (or \`npm run lint:oxford -- --fix\`) to auto-remove.`);
  process.exit(1);
} else {
  console.log('✓ No Oxford commas found.');
  process.exit(0);
}
