// Dowód WY1 (KO-203, P-1040): różnica względem bazowego commita wydania (domyślnie a830eb21 = tag v1.0.0-b1221) dotyczy wyłącznie pól wersji
// (app.json expo.version, package.json version, package-lock.json version × 2), testu wersji i dokumentów w docs/wydanie/.
// Kod aplikacji (app/, src/, modules/, targets/, plugins/, locales/, assets/, e2e/, cloudkit/, .github/, scripts/ poza tym plikiem) ma być bajt w bajt identyczny.
// Użycie: node scripts/wydanie/roznica-wersji.mjs [--baza <ref>] [--wersja 1.0.1] [--zapis <plik.md>]   Wyjście: 0 zgodne, 1 naruszenia, 2 zły argument.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

export const BAZA_DOMYSLNA = 'a830eb21';
export const WERSJA_DOMYSLNA = '1.0.1';
const TEN_PLIK = 'scripts/wydanie/roznica-wersji.mjs';
const TEST_PLIK = 'tests/wydanie/roznica-wersji.test.ts';
const POLA_WERSJI = [
  { plik: 'app.json', sciezka: ['expo', 'version'] },
  { plik: 'package.json', sciezka: ['version'] },
  { plik: 'package-lock.json', sciezka: ['version'] },
  { plik: 'package-lock.json', sciezka: ['packages', '', 'version'] },
];
// Poza polami wersji dozwolone: test wersji (zmiana oczekiwanej wartości), ten skrypt i jego test, dokumenty wydania oraz protokół F buildu 1221 (kopia z PF1, P-1009: kontrola 3 bramki przypadków).
const DOZWOLONE = [/^tests\/jakosc\/wersja-wydania\.test\.ts$/, /^docs\/wydanie\//, /^docs\/jakosc\/test-fizyczny\/1221\.md$/, /^docs\/sztafeta\.md$/, /^docs\/decyzje\.md$/, new RegExp(`^${TEN_PLIK.replace(/[.]/g, '\\.')}$`), new RegExp(`^${TEST_PLIK.replace(/[.]/g, '\\.')}$`)];

const ustaw = (o, sciezka, w) => {
  const k = structuredClone(o);
  let c = k;
  for (const s of sciezka.slice(0, -1)) c = c[s];
  c[sciezka.at(-1)] = w;
  return k;
};
const czytaj = (o, sciezka) => sciezka.reduce((c, s) => c?.[s], o);

/** Porównuje JSON bazy i głowy: jedyna różnica ma być w podanych polach wersji (baza → wersja docelowa). Zwraca listę naruszeń. */
export function porownajJson(plik, tekstBazy, tekstGlowy, wersja) {
  const baza = JSON.parse(tekstBazy), glowa = JSON.parse(tekstGlowy), naruszenia = [];
  let oczekiwana = baza;
  for (const p of POLA_WERSJI.filter((x) => x.plik === plik)) {
    if (czytaj(glowa, p.sciezka) !== wersja) naruszenia.push(`${plik}: ${p.sciezka.join('.')} = ${JSON.stringify(czytaj(glowa, p.sciezka))}, oczekiwano ${JSON.stringify(wersja)}`);
    oczekiwana = ustaw(oczekiwana, p.sciezka, wersja);
  }
  if (!isDeepStrictEqual(oczekiwana, glowa)) naruszenia.push(`${plik}: różnica wykracza poza pola wersji`);
  return naruszenia;
}

/** Ocena listy plików: ścieżka → status git (A/M/D/R). Pliki poza listą dozwolonych i poza polami wersji to naruszenie. */
export function ocenListe(pliki) {
  const naruszenia = [];
  for (const [plik, status] of pliki) {
    if (POLA_WERSJI.some((p) => p.plik === plik)) { if (status !== 'M') naruszenia.push(`${plik}: status ${status}, oczekiwano M`); continue; }
    if (!DOZWOLONE.some((r) => r.test(plik))) naruszenia.push(`${plik}: zmiana poza polami wersji i dokumentami wydania`);
  }
  for (const p of POLA_WERSJI) if (!pliki.some(([f]) => f === p.plik)) naruszenia.push(`${p.plik}: brak zmiany (pole ${p.sciezka.join('.')})`);
  return naruszenia;
}

function git(...a) { return execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 }); }

function main() {
  const arg = (n, d) => { const i = process.argv.indexOf(n); if (i < 0) return d; if (!process.argv[i + 1]) { console.error(`BŁĄD ARGUMENTU: brak wartości ${n}`); process.exit(2); } return process.argv[i + 1]; };
  const baza = arg('--baza', BAZA_DOMYSLNA), wersja = arg('--wersja', WERSJA_DOMYSLNA), zapis = arg('--zapis');
  const glowa = git('rev-parse', 'HEAD').trim();
  const pelnaBaza = git('rev-parse', `${baza}^{commit}`).trim();
  const pliki = git('diff', '--name-status', '--no-renames', `${pelnaBaza}..HEAD`).split('\n').filter(Boolean).map((l) => { const [s, ...r] = l.split('\t'); return [r.join('\t'), s]; });
  const naruszenia = ocenListe(pliki);
  for (const p of new Set(POLA_WERSJI.map((x) => x.plik))) {
    if (!pliki.some(([f]) => f === p)) continue;
    naruszenia.push(...porownajJson(p, git('show', `${pelnaBaza}:${p}`), git('show', `HEAD:${p}`), wersja));
  }
  const linie = [];
  const stat = git('diff', '--stat', `${pelnaBaza}..HEAD`).trimEnd();
  const wersjeLinii = git('diff', '-U0', '--no-color', `${pelnaBaza}..HEAD`, '--', 'app.json', 'package.json', 'package-lock.json', 'tests/jakosc/wersja-wydania.test.ts').split('\n').filter((l) => /^[+-][^+-]/.test(l));
  linie.push(`# Różnica 1.0.1 względem ${baza} (v1.0.0-b1221)`, '', `Baza: \`${pelnaBaza}\` · głowa: \`${glowa}\` · wersja docelowa: \`${wersja}\` · skrypt: \`node ${TEN_PLIK}\` (test: \`${TEST_PLIK}\`)`, '',
    `## Wynik: ${naruszenia.length ? `NARUSZENIA (${naruszenia.length})` : 'OK — różnica poza dokumentacją dotyczy tylko pól wersji'}`, '', ...naruszenia.map((n) => `- ${n}`), '',
    '## Pliki (git diff --name-status)', '', '```', ...pliki.map(([f, s]) => `${s}\t${f}`), '```', '',
    '## Linie wersji (app.json, package.json, package-lock.json, test wersji; git diff -U0)', '', '```', ...wersjeLinii, '```', '', '## git diff --stat', '', '```', stat, '```', '');
  const tekst = linie.join('\n');
  if (zapis) writeFileSync(zapis, tekst);
  console.log(tekst);
  process.exit(naruszenia.length ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
