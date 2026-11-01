/* Zrzuty sklepu (P-319): spójność przepływów Maestro `e2e/zrzuty-sklepu/`, generatora danych i workflowów — bez macOS.
 * Co to sprawdza: przepływy używają tylko id z tabeli testID (`e2e/README.md`) lub istniejącego w kodzie, ich oczekiwane wartości zgadzają się z danymi z generatora,
 * workflow wywołuje skrypt z właściwymi argumentami, a znacznik `[zrzuty-sklepu]` dodaje zadanie i nie rozszerza pakietu E2E. Czego to NIE sprawdza: jak ekrany wyglądają
 * i czy gesty trafiają (to pierwszy przebieg na macOS; „nie sprawdzono”, e2e/zrzuty-sklepu/README.md).
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { identyfikatory, opisyIdentyfikatorow, problemySkladni, wczytaj, YAML } from './maestro-runner';
import { parse, wyzwalacze } from './jakosc-ios-pomoc';
import { zbudujDaneSklepu, type Podsumowanie } from '../narzedzia/zrzuty-sklepu-ziarno';

const ROOT = path.join(__dirname, '..', '..');
const KAT = path.join(ROOT, 'e2e/zrzuty-sklepu');
const KADRY = ['01-licznik', '02-wzor', '03-zakreslenie', '04-projekty', '05-historia', '06-kalendarz'];
const PRZEPLYWY = [...KADRY.map((k) => `${k}.yaml`), 'subflows/start.yaml', 'subflows/otworz-wzor.yaml'];
const czytaj = (rel: string): string => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const opisy = opisyIdentyfikatorow(czytaj('e2e/README.md'));
const DZIEN_W_KODZIE = /^historia-dzien-\d{4}-\d{2}-\d{2}$/; // komórka kalendarza: src/ekrany/HistoriaDni.tsx (README opisuje tylko grupę dnia `historia-dzien`)

describe('przepływy zrzutów · składnia i selektory', () => {
  test('katalog ma sześć kadrów z planu i dwa podprzepływy; nie leży w e2e/scenariusze (nie wchodzi do pakietów ani bramki)', () => {
    expect(fs.readdirSync(KAT).filter((f) => f.endsWith('.yaml')).sort()).toEqual(KADRY.map((k) => `${k}.yaml`));
    expect(fs.readdirSync(path.join(KAT, 'subflows')).sort()).toEqual(['otworz-wzor.yaml', 'start.yaml']);
    expect(fs.readdirSync(path.join(ROOT, 'e2e/scenariusze')).filter((f) => /zrzut/.test(f))).toEqual([]);
  });

  test.each(PRZEPLYWY)('%s: poprawna składnia Maestro (polecenia znane, selektory dozwolone)', (f) => {
    const s = wczytaj(path.join(KAT, f));
    expect(s.naglowek.appId).toBe('com.apps4brew.knitting');
    expect(problemySkladni(s).filter((p) => !/tags|name|ID kryterium|nazw/i.test(p))).toEqual([]);
  });

  test('każde id w przepływach ma wiersz w tabeli testID albo jest komórką kalendarza z kodu', () => {
    const zrodloKalendarza = czytaj('src/ekrany/HistoriaDni.tsx');
    expect(zrodloKalendarza).toContain('testID={`historia-dzien-${d.dzien}`}');
    const obce: string[] = [];
    for (const f of PRZEPLYWY) for (const id of identyfikatory(wczytaj(path.join(KAT, f)))) for (const a of id.split('|')) if (!opisy.has(a) && !DZIEN_W_KODZIE.test(a)) obce.push(`${f}: ${a}`);
    expect(obce).toEqual([]);
  });

  test('jedyna etykieta tekstowa poza id to „Previous month” i pochodzi z en.json (dni.poprzedni_miesiac_a11y)', () => {
    const en = JSON.parse(czytaj('src/i18n/slowniki/en.json')) as { dni: Record<string, string> };
    expect(en.dni.poprzedni_miesiac_a11y).toBe('Previous month');
    const teksty = PRZEPLYWY.flatMap((f) => [...czytaj(`e2e/zrzuty-sklepu/${f}`).matchAll(/^- tapOn: "([^"]+)"/gm)].map((m) => m[1]));
    expect(teksty).toEqual(['Previous month']);
  });

  test.each(KADRY)('%s: kończy się asercją stanu docelowego (kadr nie powstaje „w ciemno”)', (k) => {
    const polecenia = wczytaj(path.join(KAT, `${k}.yaml`)).polecenia.map((p) => (typeof p === 'string' ? p : Object.keys(p)[0]));
    const ostatnie = polecenia.filter((p) => p !== 'waitForAnimationToEnd').at(-1);
    expect(['assertVisible', 'extendedWaitUntil']).toContain(ostatnie);
    expect(polecenia).not.toContain('takeScreenshot'); // zrzut robi skrypt (simctl), natywny rozmiar
  });
});

describe('przepływy zrzutów · zgodność z danymi z generatora', () => {
  let p: Podsumowanie;
  let tekstPrzeplywow: Record<string, string>;
  beforeAll(async () => {
    p = await zbudujDaneSklepu(fs.mkdtempSync(path.join(os.tmpdir(), 'zrzuty-spojnosc-')));
    tekstPrzeplywow = Object.fromEntries(PRZEPLYWY.map((f) => [f, czytaj(`e2e/zrzuty-sklepu/${f}`)]));
  }, 120_000);

  test('kadr 1: oczekiwany numer rzędu i rząd z przypomnieniem wynikają z licznika w danych (47 → „Row 48”)', () => {
    const rzedy = p.projekty.find((x) => x.nazwa === 'Harbor Sweater')?.rzedy;
    expect(tekstPrzeplywow['01-licznik.yaml']).toContain(`text: "${rzedy}"`);
    expect(tekstPrzeplywow['01-licznik.yaml']).toContain(`when row ${(rzedy ?? 0) + 1} is done`);
    expect(tekstPrzeplywow['01-licznik.yaml']).toContain(`Row ${(rzedy ?? 0) + 1}: decrease at both ends`);
  });

  test('kadr 4: „3 of 5 free knitting days left in November” = 5 − dni listopada z danych', () => {
    expect(tekstPrzeplywow['04-projekty.yaml']).toContain(`${5 - p.dniListopada} of 5 free knitting days left in November`);
  });

  test('kadr 6: wybrany dzień kalendarza (22.10) ma w danych pracę trzech projektów i ukończenie rękawiczek', () => {
    expect(tekstPrzeplywow['06-kalendarz.yaml']).toContain('historia-dzien-2026-10-22');
    expect(p.dniPazdziernika).toBe(10);
  });

  test('kadry 2–3: strona „Page 1 of 3” = trzy strony wzoru w danych; zakreślacz startuje od 0 zakreśleń', () => {
    expect(tekstPrzeplywow['subflows/otworz-wzor.yaml']).toContain('[Pp]age 1 of 3');
    expect(tekstPrzeplywow['03-zakreslenie.yaml']).toContain('text: "0 highlights"');
  });

  test('zegar: przepływy przekazują TERAZ jako oczkoE2eTeraz, a podsumowanie ma ten sam napis co plan (czwartek 12.11.2026 09:41)', () => {
    expect(tekstPrzeplywow['subflows/start.yaml']).toContain('oczkoE2eTeraz: ${TERAZ}');
    expect(p.teraz).toBe('2026-11-12T09:41:00');
  });
});

describe('workflowy zrzutów', () => {
  const sw = czytaj('.github/workflows/store-screenshots.yml');
  const ios = czytaj('.github/workflows/jakosc-ios.yml');
  type Zadanie = { needs?: unknown; if?: string; uses?: string; permissions?: Record<string, string>; strategy?: { matrix: { klasa: string[] } }; 'runs-on'?: string; steps?: { name?: string; run?: string; env?: Record<string, string> }[] };
  const zadaniaSw = (YAML.parse(sw) as { jobs: Record<string, Zadanie> }).jobs;

  test('store-screenshots.yml: wyzwalacze workflow_dispatch (numer przebiegu wymagany) i workflow_call (pusty = ten sam przebieg)', () => {
    const on = wyzwalacze(sw) as { workflow_dispatch: { inputs: Record<string, { required?: boolean }> }; workflow_call: { inputs: Record<string, { default?: string }> } };
    expect(on.workflow_dispatch.inputs.aplikacja_z_przebiegu.required).toBe(true);
    expect(on.workflow_call.inputs.aplikacja_z_przebiegu.default).toBe('');
    expect(Object.keys(on.workflow_call.inputs).sort()).toEqual(['aplikacja_z_przebiegu', 'kadry']);
  });

  test('zadanie zrzuty: macierz iphone + ipad na macos-26; dane z zadania dane; skrypt dostaje argumenty przez env (nie wprost z inputs w run)', () => {
    expect(zadaniaSw.zrzuty.strategy?.matrix.klasa).toEqual(['iphone', 'ipad']);
    expect(zadaniaSw.zrzuty['runs-on']).toBe('macos-26');
    expect(zadaniaSw.zrzuty.needs).toBe('dane');
    const krok = zadaniaSw.zrzuty.steps?.find((s) => s.name === 'Zrzuty ekranu');
    expect(krok?.run).toBe('bash scripts/ci/zrzuty-sklepu.sh "$SIM" "$KLASA" sklep-dane sklep-zrzuty "$KADRY"');
    expect(krok?.env).toMatchObject({ KLASA: '${{ matrix.klasa }}', KADRY: '${{ inputs.kadry }}' });
    for (const z of Object.values(zadaniaSw)) for (const s of z.steps ?? []) expect(s.run ?? '').not.toMatch(/\$\{\{\s*(inputs|github\.event)/);
  });

  test('zadanie dane uruchamia test generatora z ZRZUTY_DANE_OUT i wysyła artefakt sklep-dane', () => {
    const krok = zadaniaSw.dane.steps?.find((s) => s.name?.startsWith('Dane pokazowe'));
    expect(krok?.run).toBe('npx jest tests/jakosc/zrzuty-sklepu-dane.test.ts');
    expect(krok?.env?.ZRZUTY_DANE_OUT).toBe('${{ github.workspace }}/sklep-dane');
    expect(sw).toMatch(/name: sklep-dane\n\s+path: sklep-dane/);
  });

  test('jakosc-ios.yml: zadanie zrzuty-sklepu po build, tylko ze znacznikiem [zrzuty-sklepu] (commit albo wejście znacznik), wywołuje store-screenshots.yml', () => {
    const z = parse(ios).jobs['zrzuty-sklepu'] as unknown as Zadanie;
    expect(z.uses).toBe('./.github/workflows/store-screenshots.yml');
    expect(z.needs).toBe('build');
    expect(z.if).toContain("contains(github.event.head_commit.message || inputs.znacznik, '[zrzuty-sklepu]')");
    expect(z.permissions).toEqual({ contents: 'read', actions: 'read' });
    expect(ios).toContain("- '.github/workflows/store-screenshots.yml'");
    expect(ios).toContain("- 'tests/narzedzia/zrzuty-sklepu-ziarno.ts'");
  });

  test('znacznik [zrzuty-sklepu] nie rozszerza pakietu E2E: plan części z samym znacznikiem = pakiet podstawowy, jak bez znacznika', () => {
    const plan = (msg: string): string => execFileSync('node', [path.join(ROOT, 'scripts/ci/e2e-czesci.mjs'), 'czesc', '1', '--out', fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-czesc-'))],
      { encoding: 'utf8', env: { ...process.env, ONLY: '', PAKIET: '', COMMIT_MSG: msg, GITHUB_OUTPUT: '' } });
    expect(plan('P-319: zrzuty [zrzuty-sklepu]')).toBe(plan('P-319: zrzuty')); // identyczny plan części z markerem i bez
    expect(plan('P-319: zrzuty [zrzuty-sklepu]')).toMatch(/Pakiet: podstawowy\./);
    expect(plan('P-319: zrzuty [zrzuty-sklepu] [e2e-pelny]')).toMatch(/Pakiet: pelny\./);
  });
});
