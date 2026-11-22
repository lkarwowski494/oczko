/**
 * Kontrakt czystości marek i znaków towarowych (NFR-SEC-011).
 * Weryfikuje brak cudzych znaków towarowych i nazw komercyjnych (Yahtzee, Hasbro, Kniffel, itp.)
 * oraz poprawność zapisu znaków Apple w materiałach zewnętrznych i tłumaczeniach.
 * Nazwy aplikacji i serwisów konkurencji (także w docs/, zapadka P-107): tests/jakosc/marki.test.ts, scripts/jakosc/marki.mjs (F07-05).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const root = join(__dirname, '..');

const FORBIDDEN_BRANDS = [
  'yahtzee',
  'hasbro',
  'kniffel',
  'todoist',
  'crossfit',
  'ikea',
  'trello',
  'evernote',
];

const BRAND_PATTERN = new RegExp(
  `(?<![\\p{L}\\d_])(?:${FORBIDDEN_BRANDS.join('|')})[\\p{L}]*`,
  'giu'
);

const SCANNED_ROOTS = [
  'src',
  'site',
  'scripts',
  'docs',
  'tests',
  '.github',
  'app',
  'app.json',
  'package.json',
  'README.md',
  'archiwum',
];

const SKIP_DIRS = new Set(['node_modules', '.git', 'coverage', '.expo', 'dist']);
const TEXT_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yaml',
  '.yml',
  '.html',
  '.txt',
]);

const ALLOWED_FILES = new Set([
  'tests/brands.contract.test.ts',
  'archiwum/stara-wersja/docs/25-audyt-brd-qa-rel.md',
]);

function getFiles(relPath: string): string[] {
  const abs = join(root, relPath);
  if (!existsSync(abs)) return [];
  const st = statSync(abs);
  if (st.isFile()) {
    return TEXT_EXTS.has(extname(relPath)) ? [relPath] : [];
  }
  return readdirSync(abs)
    .filter((n) => !SKIP_DIRS.has(n))
    .flatMap((n) => getFiles(join(relPath, n)));
}

describe('Kontrakt czystości marek i znaków towarowych (NFR-SEC-011)', () => {
  it('wzorzec wykrywa zabronione marki', () => {
    expect('Gra w Yahtzee oraz KNIFFEL z Hasbro'.match(BRAND_PATTERN)).toEqual([
      'Yahtzee',
      'KNIFFEL',
      'Hasbro',
    ]);
  });

  it('żaden plik projektu nie zawiera cudzych znaków towarowych', () => {
    const allFiles = SCANNED_ROOTS.flatMap(getFiles);
    expect(allFiles.length).toBeGreaterThan(20);

    const violations: string[] = [];
    for (const f of allFiles) {
      if (ALLOWED_FILES.has(f.replace(/\\/g, '/'))) continue;
      const content = readFileSync(join(root, f), 'utf8');
      const matches = content.match(BRAND_PATTERN);
      if (matches) {
        violations.push(`${f}: ${matches.join(', ')}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('znaki towarowe Apple w materiałach publicznych i tłumaczeniach są zapisywane poprawnie', () => {
    // Słowniki ADR-0017 zastępują i18n 0.1.0 (src/core/i18n*.ts, usunięte w partii porządkowej roli 08).
    const publicFiles = ['site', 'src/i18n/slowniki'].flatMap(getFiles);
    const badAppleMentions: string[] = [];

    const BAD_APPLE_CASES = [
      /\biphone\b/g, // Should be iPhone
      /\bipad\b/g, // Should be iPad
      /\bappstore\b/gi, // Should be App Store
    ];

    for (const f of publicFiles) {
      const content = readFileSync(join(root, f), 'utf8');
      for (const re of BAD_APPLE_CASES) {
        if (re.test(content)) {
          badAppleMentions.push(`${f} matching ${re}`);
        }
      }
    }

    expect(badAppleMentions).toEqual([]);
  });
});
