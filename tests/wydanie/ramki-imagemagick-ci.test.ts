/* 10-wydanie-003 + 10-wydanie-009 (recenzje AB i AD, 10.11.2026; decyzja koordynatora KO-035, P-724).
 * `ramki-sklepu.test.ts` ma część „działa na PNG w wymiarach ASC”, która wymaga ImageMagicka (`convert`).
 *  - 003: brak narzędzia nie może znikać po cichu (zasada wspólna 21).
 *  - 009: `jakosc-linux.yml` i `ci.yml` uruchamiają `npm run verify` na ubuntu-latest, który nie ma ImageMagicka, więc „czerwono przy CI=true” zepsułoby bramkę integracji.
 * Rozstrzygnięcie (analogia Trening: ImageMagick tylko w workflowie zrzutów, store-screenshots.yml:246-247; testy układu podpisów bez niego, store-caption-layout.test.ts:3):
 * `convert` jest wymagany wyłącznie, gdy ustawiona jest zmienna OCZKO_WYMAGAJ_IMAGEMAGICK (robi to tylko krok testów ramek w zadaniu `zbierz` workflowu zrzutów, po instalacji pakietu);
 * bez zmiennej część z ImageMagickiem jest pominięta GŁOŚNO (komunikat w wyniku Jesta), a część statyczna i test układu podpisów biegną zawsze.
 * Ten test uruchamia `ramki-sklepu.test.ts` w osobnym Jest na PATH bez `convert` i sprawdza oba tryby, a potem pilnuje układu workflowów. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { parse } from '../jakosc/jakosc-ios-pomoc';
import { YAML } from '../jakosc/maestro-runner';

const korzen = path.join(__dirname, '..', '..');
const ZMIENNA = 'OCZKO_WYMAGAJ_IMAGEMAGICK';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bez-convert-'));
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
fs.symlinkSync(process.execPath, path.join(tmp, 'node')); // PATH tylko z node: ani `convert`, ani `identify`

function jestBezConvert(env: Record<string, string | undefined>, plik = 'tests/wydanie/ramki-sklepu.test.ts') {
  const e: NodeJS.ProcessEnv = { PATH: tmp, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR };
  for (const [k, v] of Object.entries(env)) if (v !== undefined) e[k] = v;
  return spawnSync(process.execPath, [path.join(korzen, 'node_modules/jest/bin/jest.js'), plik, '--no-cache'], { encoding: 'utf8', cwd: korzen, env: e, timeout: 120000 });
}

describe('ramki-sklepu.test.ts bez ImageMagicka (KO-035)', () => {
  test(`ze zmienną ${ZMIENNA}=1 (krok testów ramek w zbierz) brak \`convert\` = test czerwony z komunikatem o ImageMagick`, () => {
    const r = jestBezConvert({ [ZMIENNA]: '1' }); // bez CI: zmienna sama wystarcza
    expect(r.status).toBe(1);
    expect(r.stdout + r.stderr).toMatch(/ImageMagick/);
  }, 150000);

  test.each([['CI=true (verify w jakosc-linux.yml i ci.yml)', { CI: 'true' }], ['bez CI (lokalnie)', {}], [`CI=true i ${ZMIENNA}=0`, { CI: 'true', [ZMIENNA]: '0' }], [`CI=true i ${ZMIENNA} puste`, { CI: 'true', [ZMIENNA]: '' }]])(
    'bez wymagania (%s) brak `convert` nie czerwieni, ale pominięcie jest GŁOŚNE (komunikat w wyniku Jesta), a część statyczna biegnie',
    (_nazwa, env) => {
      const r = jestBezConvert(env as Record<string, string>);
      const wynik = r.stdout + r.stderr;
      expect(r.status).toBe(0);
      expect(wynik).toMatch(/POMINIĘTE[^\n]*ImageMagick/); // komunikat o pominięciu, nie samo „skipped”
      expect(wynik).toContain(ZMIENNA); // mówi, jak włączyć kontrolę
      expect(wynik).toMatch(/passed/); // statyczny kontrakt skryptu ramek biegnie mimo braku narzędzia
    },
    150000,
  );

  test('test układu podpisów nie potrzebuje ImageMagicka: zielony na PATH bez `convert`, także ze zmienną wymagającą', () => {
    const r = jestBezConvert({ CI: 'true', [ZMIENNA]: '1' }, 'tests/wydanie/uklad-podpisow.test.ts');
    expect(r.status).toBe(0);
    expect(r.stdout + r.stderr).not.toMatch(/skipped/);
  }, 150000);
});

describe('workflowy: ImageMagick i zmienna wymagania tylko w zrzutach sklepu (KO-035; nie zmieniamy jakosc-linux.yml ani ci.yml)', () => {
  const czytaj = (p: string) => fs.readFileSync(path.join(korzen, p), 'utf8');
  const wf = (p: string) => { const t = czytaj(p); return { t, ...YAML.parse(t), ...parse(t) }; }; // eslint-disable-line @typescript-eslint/no-explicit-any
  test('zrzuty-sklepu.yml, zadanie zbierz: npm ci, potem instalacja ImageMagicka, potem krok testów ramek ze zmienną, wszystko przed krokiem ramek', () => {
    const kroki = (wf('.github/workflows/zrzuty-sklepu.yml') as any).jobs.zbierz.steps ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
    const idx = (re: RegExp) => kroki.findIndex((k: any) => re.test(k.run ?? '')); // eslint-disable-line @typescript-eslint/no-explicit-any
    const iNpm = idx(/^npm ci\b/);
    const iIm = idx(/apt-get install .*imagemagick/);
    const iTest = idx(/jest[^\n]*tests\/wydanie\/ramki-sklepu\.test\.ts/);
    const iRamki = idx(/scripts\/ci\/ramki-sklepu\.sh/);
    expect(iNpm).toBeGreaterThan(-1);
    expect(iIm).toBeGreaterThan(iNpm);
    expect(iTest).toBeGreaterThan(iIm);
    expect(iRamki).toBeGreaterThan(iTest);
    expect(String(kroki[iTest].env?.[ZMIENNA])).toBe('1');
    expect(kroki[iTest].run).toMatch(/--ci/);
    expect(kroki[iTest].if).toBeUndefined(); // porażka testu ma czerwienić zadanie, nie być pomijana
  });
  test.each(['.github/workflows/jakosc-linux.yml', '.github/workflows/ci.yml'])('%s nie instaluje ImageMagicka i nie ustawia zmiennej wymagania', (p) => {
    const t = czytaj(p);
    expect(t).not.toMatch(/imagemagick/i);
    expect(t).not.toContain(ZMIENNA);
  });
  test('zmienną ustawia wyłącznie zrzuty-sklepu.yml', () => {
    const z = fs.readdirSync(path.join(korzen, '.github/workflows')).filter((f) => czytaj(`.github/workflows/${f}`).includes(ZMIENNA));
    expect(z).toEqual(['zrzuty-sklepu.yml']);
  });
});
