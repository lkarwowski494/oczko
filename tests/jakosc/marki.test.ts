// Nazwy konkurencji w repo (F07-05; P-105, P-107 (2), P-117 Q2a): skróty w tests/jakosc/marki-skroty.json, zapadka w marki-stan.json.
// Pułapki na zmyślonych nazwach (skróty liczone tu), żeby ten plik nie zawierał żadnej prawdziwej nazwy.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const KORZEN = join(__dirname, '../..');
const MARKI = join(KORZEN, 'scripts/jakosc/marki.mjs');
const skrot = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const ZMYSLONE = ['wloczkomat', 'pętla dziewiarza pro']; // znormalizowane: małe litery, słowa złączone spacją
const SKROTY = JSON.stringify({ maxSlow: 3, pierwsze: ZMYSLONE.map((n) => skrot(n.split(' ')[0])), nazwy: ZMYSLONE.map(skrot) });

function repo(pliki: Record<string, string>, stan: Record<string, number> = {}): string {
  const k = mkdtempSync(join(tmpdir(), 'marki-'));
  const wszystkie = { 'tests/jakosc/marki-skroty.json': SKROTY, 'tests/jakosc/marki-stan.json': JSON.stringify({ pliki: stan }), ...pliki };
  for (const [p, t] of Object.entries(wszystkie)) { mkdirSync(dirname(join(k, p)), { recursive: true }); writeFileSync(join(k, p), t); }
  return k;
}
/** Środowisko procesu potomnego bez zmiennych repozytorium git: hook pre-push z git worktree podaje `GIT_DIR` (P-362), a skrypt woła `git ls-files` w katalogu tymczasowym
 * i wtedy listowałby pliki repozytorium z hooka zamiast katalogu testu. Dlaczego tu: test ma być niezależny od środowiska, z którego go uruchomiono (JAK-05). */
const ZMIENNE_GIT = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_PREFIX', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_NAMESPACE'];
const envBezGit = (): NodeJS.ProcessEnv => { const e = { ...process.env }; for (const z of ZMIENNE_GIT) delete e[z]; return e; };
const uruchom = (k: string, ...arg: string[]) => spawnSync('node', [MARKI, '--katalog', k, ...arg], { encoding: 'utf8', env: envBezGit() });

describe('marki.mjs: nazwy konkurencji (P-107, P-117 Q2a)', () => {
  test('P-362 środowisko procesów potomnych jest bez zmiennych repozytorium git (hook z git worktree podaje GIT_DIR)', () => {
    const stare = process.env.GIT_DIR;
    process.env.GIT_DIR = join(KORZEN, '.git');
    try { const e = envBezGit(); for (const z of ZMIENNE_GIT) expect(e[z]).toBeUndefined(); expect(e.PATH).toBeDefined(); }
    finally { if (stare === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = stare; }
  });
  test('F07-05 repo zgodne ze stanem zapadki: bez nowych plików z nazwami i bez wzrostu (kod 0)', () => {
    const w = uruchom(KORZEN);
    expect(w.stdout).toContain('naruszeń 0');
    expect(w.status).toBe(0);
  });
  test('F07-05 normalizacja: wielkość liter, NFKC, znaki między słowami frazy', () => {
    const k = repo({ 'docs/a.md': 'WŁOCZKOMAT, Wloczkomat… ale „Pętla—dziewiarza  PRO” i ｗｌｏｃｚｋｏｍａｔ' }, { 'docs/a.md': 3 });
    expect(uruchom(k).status).toBe(0); // 3 trafienia: „Wloczkomat” (WŁOCZKOMAT to inne słowo: ł ≠ l), fraza, pełna szerokość po NFKC
  });
  test('F07-05 pułapka: nazwa w nowym dokumencie pada (MARKA-NOWY-PLIK)', () => {
    const w = uruchom(repo({ 'docs/nowy.md': 'Jak w aplikacji Wloczkomat.' }));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('MARKA-NOWY-PLIK docs/nowy.md: 1');
  });
  test('F07-05 pułapka: wzrost liczby w pliku ze stanu pada (MARKA-WZROST)', () => {
    const w = uruchom(repo({ 'docs/stary.md': 'wloczkomat i pętla dziewiarza pro' }, { 'docs/stary.md': 1 }));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('MARKA-WZROST docs/stary.md: 1 → 2');
  });
  test('F07-05 pułapka: spadek bez zmniejszenia stanu pada; --stan zapisuje bieżący stan i potem kod 0', () => {
    const k = repo({ 'docs/stary.md': 'opis zamiast nazwy' }, { 'docs/stary.md': 2 });
    const w = uruchom(k);
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('MARKA-STAN-DO-ZMNIEJSZENIA docs/stary.md: 2 → 0');
    expect(uruchom(k, '--stan').status).toBe(0);
    expect(uruchom(k).status).toBe(0);
  });
  test.each(['src/ekrany/Licznik.tsx', 'app/_layout.tsx', 'src/i18n/slowniki/en.json', 'e2e/scenariusze/01.yaml', 'app.json', 'site/index.html'])(
    'F07-05 pułapka: nazwa w kodzie, tekstach aplikacji albo metadanych (%s) pada nawet ze stanem (MARKA-W-PRODUKCIE)', (plik) => {
      const w = uruchom(repo({ [plik]: 'Wloczkomat' }, { [plik]: 1 }));
      expect(w.status).toBe(1);
      expect(w.stdout).toContain(`MARKA-W-PRODUKCIE ${plik}`);
    });
  test('F07-05 słowo zawierające nazwę albo nazwa bez wszystkich słów frazy nie jest trafieniem', () => {
    expect(uruchom(repo({ 'docs/a.md': 'superwloczkomaty, pętla dziewiarza (bez trzeciego słowa)' })).status).toBe(0);
  });
});
