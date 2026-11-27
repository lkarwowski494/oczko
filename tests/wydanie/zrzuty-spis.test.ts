/*
 * ZR12 (KO-214, 2026-11-25; P-1060…P-1061): tryb „spis” scripts/asc/zrzuty.mjs — co NAPRAWDĘ jest na stronie produktu w App Store Connect (tylko odczyt).
 * Tło: apply zrzutów 1.0.1 zakończony (37 grup, 259 placementów `oczko-1.0/…` zdjętych), a właściciel w ASC widzi „złe” zrzuty także na iPhone; skrypt widzi tylko grupy z artefaktu.
 * Test PRZED kodem (zasada wspólna 11): atrapa serwera w pamięci (tests/wydanie/zrzuty-spis-driver.mjs), nic nie łączy się z Apple.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { YAML } from '../jakosc/maestro-runner'; // dist CommonJS (wejście „browser” pakietu yaml to ESM)

const korzen = join(__dirname, '..', '..');
const DRIVER = join(__dirname, 'zrzuty-spis-driver.mjs');
const czytaj = (p: string) => readFileSync(join(korzen, p), 'utf8');

type Plac = { id: string; grupa: string; typ?: string; zasob?: string; poz?: number; ref?: string; stan?: string; w?: number; h?: number; bezObrazu?: boolean };
type Lok = { kod: string; placementy: Plac[]; awaria?: number };
type Wersja = { id: string; wersja: string; stan: string; lokalizacje: Lok[] };
type Wiersz = { wersja: string; stan: string; typ: string; grupa: string; lokalizacji: number; placementow: number; prefiksy: Record<string, number>; stany: Record<string, number> };
type Wynik = { code: number; log: string[]; calls: { m: string; p: string; q: string }[]; podsumowanie: Wiersz[] };
const uruchom = (sc: Record<string, unknown>): Wynik => JSON.parse(execFileSync(process.execPath, [DRIVER, JSON.stringify(sc)], { encoding: 'utf8', maxBuffer: 1 << 26 }));

const SHA = 'abcdef012345';
const pl = (prefiks: string, n: number, grupa: string, jezyk: string, extra: Partial<Plac> = {}): Plac[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefiks}-${grupa}-${jezyk}-${i + 1}`, grupa, poz: i + 1, w: 1320, h: 2868, ...extra,
    ref: extra.ref ?? (prefiks === 'S' ? `oczko-1.0/iphone/${jezyk}/0${i + 1}-ekran.png` : `oczko/iphone/${jezyk}/0${i + 1}-ekran.png#${SHA}`) }));
/** 1.0 w sprzedaży: iPhone 7 + iPad 7 w pl, en-US i de-DE; 1.0.1 w przygotowaniu: iPhone 3 nowe (oczko/…#) w pl i en-US, de-DE bez zrzutów. */
const SCENARIUSZ = (): { wersje: Wersja[] } => ({ wersje: [
  { id: 'V0', wersja: '1.0', stan: 'READY_FOR_SALE', lokalizacje: ['pl', 'en-US', 'de-DE'].map(k => ({ kod: k, placementy: [...pl('S', 7, 'G-IPHONE', k), ...pl('S', 7, 'G-IPAD', k, { w: 2064, h: 2752 })] })) },
  { id: 'V1', wersja: '1.0.1', stan: 'PREPARE_FOR_SUBMISSION', lokalizacje: [
    { kod: 'pl', placementy: pl('N', 3, 'G-IPHONE', 'pl') }, { kod: 'en-US', placementy: pl('N', 3, 'G-IPHONE', 'en') }, { kod: 'de-DE', placementy: [] }] },
] });
const komorki = (w: Wynik, wersja: string, grupa: string) => {
  const linia = w.log.join('\n').split('\n').find(l => l.startsWith(`| ${wersja} |`) && l.includes(`| ${grupa} |`));
  return linia ? linia.split('|').slice(1, -1).map(c => c.trim()) : null;
};

describe('tryb spis: tylko odczyt', () => {
  test('0 żądań innych niż GET; kod 0; dotyka tylko aplikacji, wersji, lokalizacji i placementów', () => {
    const w = uruchom(SCENARIUSZ());
    expect(w.code).toBe(0);
    expect(w.calls.length).toBeGreaterThan(5);
    expect(w.calls.filter(c => c.m !== 'GET')).toEqual([]);
    for (const c of w.calls) expect(c.p).toMatch(/^\/v1\/(apps|apps\/APP1\/appStoreVersions|appStoreVersions\/V\d\/appStoreVersionLocalizations|appStoreVersionLocalizations\/V\d-[A-Za-z-]+\/placements)$/);
  });

  test('placementy bez filtra grupy i typu, z dołączonym obrazem (referenceName, stan, wymiary); lista wersji bez zawężenia do jednej', () => {
    const w = uruchom(SCENARIUSZ());
    const zapytania = w.calls.filter(c => c.p.endsWith('/placements'));
    expect(zapytania).toHaveLength(6); // 2 wersje × 3 lokalizacje
    for (const z of zapytania) {
      expect(z.q).not.toMatch(/filter\[/);
      expect(z.q).toContain('include=image');
      expect(z.q).toMatch(/fields\[appAssetLibraryImages\]=[^&]*referenceName/);
      expect(z.q).toMatch(/fields\[appAssetLibraryImages\]=[^&]*state/);
    }
  });
});

describe('tryb spis: tabela zbiorcza (wersja × grupa × lokalizacje × placementy × prefiks × stany)', () => {
  test('1.0: iPhone i iPad po 3 lokalizacje × 7 = 21 placementów `oczko-1.0/`; 1.0.1: iPhone 2 lokalizacje × 3 = 6 `oczko/…#`', () => {
    const w = uruchom(SCENARIUSZ());
    const s = (v: string, g: string) => w.podsumowanie.find(x => x.wersja === v && x.grupa === g);
    expect(s('1.0', 'G-IPHONE')).toMatchObject({ stan: 'READY_FOR_SALE', typ: 'APP_SCREENSHOT', lokalizacji: 3, placementow: 21, prefiksy: { 'oczko-1.0/': 21, 'oczko/…#': 0, inny: 0, pusty: 0 }, stany: { PREPARE_FOR_SUBMISSION: 21 } });
    expect(s('1.0', 'G-IPAD')).toMatchObject({ lokalizacji: 3, placementow: 21, prefiksy: { 'oczko-1.0/': 21 } });
    expect(s('1.0.1', 'G-IPHONE')).toMatchObject({ stan: 'PREPARE_FOR_SUBMISSION', lokalizacji: 2, placementow: 6, prefiksy: { 'oczko-1.0/': 0, 'oczko/…#': 6, inny: 0, pusty: 0 } });
    expect(s('1.0.1', 'G-IPAD')).toBeUndefined(); // 1.0.1 nie ma iPada — właśnie to ma być widoczne
    expect(w.podsumowanie).toHaveLength(3);
  });

  test('tabela w logu: wiersze zbiorcze z liczbami i nagłówkiem kolumn', () => {
    const w = uruchom(SCENARIUSZ()); const tekst = w.log.join('\n');
    expect(tekst).toMatch(/\| Wersja \| Stan wersji \| Typ \| Grupa \| Lokalizacji \| Placementów \| oczko-1\.0\/ \| oczko\/…# \| inny \| pusty \| Stany obrazów \|/);
    expect(komorki(w, '1.0', 'G-IPHONE')).toEqual(['1.0', 'READY_FOR_SALE', 'APP_SCREENSHOT', 'G-IPHONE', '3', '21', '21', '0', '0', '0', 'PREPARE_FOR_SUBMISSION×21']);
    expect(komorki(w, '1.0.1', 'G-IPHONE')).toEqual(['1.0.1', 'PREPARE_FOR_SUBMISSION', 'APP_SCREENSHOT', 'G-IPHONE', '2', '6', '0', '6', '0', '0', 'PREPARE_FOR_SUBMISSION×6']);
  });

  test('klasyfikacja prefiksu: oczko-1.0/, oczko/…#skrót, inny (np. bez skrótu), pusty (brak nazwy i brak obrazu); stany obrazów zliczone', () => {
    const w = uruchom({ wersje: [{ id: 'V1', wersja: '1.0.1', stan: 'PREPARE_FOR_SUBMISSION', lokalizacje: [{ kod: 'pl', placementy: [
      { id: 'P1', grupa: 'G-X', ref: 'oczko-1.0/iphone/pl/01.png' }, { id: 'P2', grupa: 'G-X', ref: `oczko/iphone/pl/01.png#${SHA}`, stan: 'FAILED' },
      { id: 'P3', grupa: 'G-X', ref: 'oczko/iphone/pl/01.png' }, { id: 'P4', grupa: 'G-X', ref: 'cos-innego.png' }, { id: 'P5', grupa: 'G-X', ref: '' }, { id: 'P6', grupa: 'G-X', bezObrazu: true },
    ] }] }] });
    expect(w.podsumowanie).toEqual([{ wersja: '1.0.1', stan: 'PREPARE_FOR_SUBMISSION', typ: 'APP_SCREENSHOT', grupa: 'G-X', lokalizacji: 1, placementow: 6,
      prefiksy: { 'oczko-1.0/': 1, 'oczko/…#': 1, inny: 2, pusty: 2 }, stany: { PREPARE_FOR_SUBMISSION: 4, FAILED: 1, '—': 1 } }]);
  });

  test('inny typ placementu w tej samej grupie (APP_PREVIEW) to osobny wiersz, nie jest wmieszany w zrzuty', () => {
    const w = uruchom({ wersje: [{ id: 'V1', wersja: '1.0.1', stan: 'PREPARE_FOR_SUBMISSION', lokalizacje: [{ kod: 'pl', placementy: [
      ...pl('N', 2, 'G-IPHONE', 'pl'), { id: 'PV', grupa: 'G-IPHONE', typ: 'APP_PREVIEW', ref: 'film.mov' }] }] }] });
    expect(w.podsumowanie.map(x => [x.typ, x.placementow])).toEqual([['APP_PREVIEW', 1], ['APP_SCREENSHOT', 2]]);
  });
});

describe('tryb spis: szczegóły per lokalizacja (en-US i pl)', () => {
  test('dla en-US i pl wszystkie placementy obu wersji: referenceName, stan obrazu, wymiary, typ zasobu, grupa, typ, pozycja; inne lokalizacje bez szczegółów', () => {
    const w = uruchom(SCENARIUSZ()); const tekst = w.log.join('\n');
    expect(tekst).toMatch(/### Szczegóły: pl/); expect(tekst).toMatch(/### Szczegóły: en-US/); expect(tekst).not.toMatch(/### Szczegóły: de-DE/);
    const wiersz = w.log.join('\n').split('\n').find(l => l.includes('oczko-1.0/iphone/pl/01-ekran.png'));
    expect(wiersz).toBeDefined();
    expect(wiersz).toContain('G-IPHONE'); expect(wiersz).toContain('APP_SCREENSHOT'); expect(wiersz).toContain('appAssetLibraryPlacements'); expect(wiersz).toContain('1320×2868'); expect(wiersz).toContain('PREPARE_FOR_SUBMISSION'); expect(wiersz).toMatch(/\| 1 \|/);
    expect(tekst).toContain(`oczko/iphone/en/03-ekran.png#${SHA}`);
    expect(tekst.split('\n').filter(l => l.includes('oczko-1.0/iphone/de-DE/'))).toEqual([]); // de-DE tylko w tabeli zbiorczej
    expect(tekst).toContain('2064×2752'); // iPad
  });

  test('lokalizacja bez placementów jest widoczna (0), a nie pominięta po cichu', () => {
    const w = uruchom({ wersje: [{ id: 'V1', wersja: '1.0.1', stan: 'PREPARE_FOR_SUBMISSION', lokalizacje: [{ kod: 'pl', placementy: [] }, { kod: 'en-US', placementy: pl('N', 1, 'G-IPHONE', 'en') }] }] });
    expect(w.log.join('\n')).toMatch(/### Szczegóły: pl[\s\S]*brak placementów/);
    expect(w.code).toBe(0);
  });
});

describe('tryb spis: stronicowanie (links.next) wersji, lokalizacji i placementów', () => {
  test('po 2 wpisy na stronę: 3 wersje, 3 lokalizacje, 5 placementów — wszystko policzone', () => {
    const sc = { strony: 2, wersje: [
      { id: 'V0', wersja: '1.0', stan: 'READY_FOR_SALE', lokalizacje: ['pl', 'en-US', 'de-DE'].map(k => ({ kod: k, placementy: pl('S', 5, 'G-IPHONE', k) })) },
      { id: 'V1', wersja: '1.0.1', stan: 'PREPARE_FOR_SUBMISSION', lokalizacje: ['pl', 'en-US', 'de-DE'].map(k => ({ kod: k, placementy: pl('N', 5, 'G-IPHONE', k) })) },
      { id: 'V2', wersja: '1.0.2', stan: 'WAITING_FOR_REVIEW', lokalizacje: ['pl', 'en-US', 'de-DE'].map(k => ({ kod: k, placementy: pl('N', 5, 'G-IPHONE', k) })) },
    ] };
    const w = uruchom(sc);
    expect(w.code).toBe(0);
    expect(w.podsumowanie.map(x => [x.wersja, x.lokalizacji, x.placementow])).toEqual([['1.0', 3, 15], ['1.0.1', 3, 15], ['1.0.2', 3, 15]]);
    // druga strona każdej listy była naprawdę pobrana
    expect(w.calls.filter(c => c.p === '/v1/apps/APP1/appStoreVersions')).toHaveLength(2);
    expect(w.calls.filter(c => c.p === '/v1/appStoreVersions/V0/appStoreVersionLocalizations')).toHaveLength(2);
    expect(w.calls.filter(c => c.p === '/v1/appStoreVersionLocalizations/V0-pl/placements')).toHaveLength(3);
    expect(w.calls.filter(c => c.m !== 'GET')).toEqual([]);
  });
});

describe('tryb spis: log bez sekretów i bez treści odpowiedzi', () => {
  test('log nie zawiera tokenu, nagłówka, adresu wgrywania, nazwy pliku ani nieznanych pól odpowiedzi', () => {
    const w = uruchom(SCENARIUSZ()); const tekst = w.log.join('\n');
    for (const zakazane of ['TOKEN-TESTOWY', 'Bearer', 'SEKRET-ADRES', 'SEKRET-PLIK', 'SEKRET-POLE', 'upload.example', 'uploadOperations', 'ASC_KEY', 'BEGIN PRIVATE']) expect(tekst).not.toContain(zakazane);
  });

  test('błąd odczytu jednej lokalizacji: kod 1, wiersz błędu z kodem HTTP bez treści odpowiedzi, reszta spisu mimo to powstaje', () => {
    const sc = SCENARIUSZ(); sc.wersje[0].lokalizacje[1].awaria = 500; // 1.0, en-US
    const w = uruchom(sc); const tekst = w.log.join('\n');
    expect(w.code).toBe(1);
    expect(tekst).toMatch(/BŁĄD odczytu placementów 1\.0 en-US: HTTP 500/);
    expect(tekst).not.toContain('SEKRET-TRESC-BLEDU'); expect(tekst).not.toContain('UNEXPECTED_ERROR');
    expect(w.podsumowanie.find(x => x.wersja === '1.0' && x.grupa === 'G-IPHONE')).toMatchObject({ lokalizacji: 2, placementow: 14 });
    expect(w.podsumowanie.find(x => x.wersja === '1.0.1' && x.grupa === 'G-IPHONE')).toMatchObject({ placementow: 6 });
    expect(tekst).toMatch(/odczyt niepełny/);
  });

  test('brak aplikacji → kod 1 i komunikat bez wyjątku', () => {
    const w = uruchom({ brakAplikacji: true, wersje: [] });
    expect(w.code).toBe(1);
    expect(w.log.join('\n')).toMatch(/BŁĄD: aplikacja .*znaleziono 0/);
  });
});

describe('tryb spis: wejście z linii poleceń i workflow', () => {
  test('`--spis` nie wymaga katalogów zrzutów (--iphone): bez kluczy kończy się komunikatem o kluczach (kod 2), nie o katalogu', () => {
    const r = spawnSync(process.execPath, [join(korzen, 'scripts/asc/zrzuty.mjs'), '--spis'], { encoding: 'utf8', env: { PATH: process.env.PATH ?? '' } });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/Brak ASC_KEY_ID/); expect(r.stderr).not.toMatch(/--iphone/);
  });

  test('`--spis` z `--apply`, `--zastap` albo `--dry-run` jest odrzucone (kod 2): spis nigdy nie zapisuje', () => {
    for (const dod of ['--apply', '--zastap', '--dry-run']) {
      const r = spawnSync(process.execPath, [join(korzen, 'scripts/asc/zrzuty.mjs'), '--spis', dod], { encoding: 'utf8', env: { PATH: process.env.PATH ?? '', ASC_KEY_ID: 'x', ASC_ISSUER_ID: 'x', ASC_KEY_PATH: '/nie/ma' } });
      expect(r.status).toBe(2);
      expect(r.stderr).toMatch(/spis/);
    }
  });

  type Krok = { name?: string; if?: string; uses?: string; run?: string; env?: Record<string, string> };
  const wf = YAML.parse(czytaj('.github/workflows/asc-zrzuty.yml')) as { on?: any; true?: any; jobs: { zrzuty: { environment: string; steps: Krok[] } } };
  const wej = (wf.on ?? wf.true).workflow_dispatch.inputs;
  const kroki = wf.jobs.zrzuty.steps;
  test('workflow: wybór `spis` obok dry-run i apply; domyślnie dry-run; artefakt zrzutów już nie jest wymagany wejściem', () => {
    expect(wej.tryb.options).toEqual(['dry-run', 'apply', 'spis']);
    expect(wej.tryb.default).toBe('dry-run');
    expect(wej.zrzuty_z_przebiegu.required).not.toBe(true);
  });
  test('workflow: pobieranie artefaktów (zrzuty i zegarek) pomijane w trybie spis; w pozostałych trybach brak numeru przebiegu zatrzymuje przed pobraniem', () => {
    const pobierania = kroki.filter(k => /^actions\/download-artifact/.test(k.uses ?? ''));
    expect(pobierania).toHaveLength(2);
    for (const k of pobierania) expect(k.if).toMatch(/inputs\.tryb != 'spis'/);
    const kontrola = kroki.findIndex(k => /zrzuty_z_przebiegu|ZRZUTY_Z_PRZEBIEGU/.test(JSON.stringify(k.env ?? {}) + (k.run ?? '')) && !/download-artifact/.test(k.uses ?? ''));
    expect(kontrola).toBeGreaterThanOrEqual(0);
    expect(kontrola).toBeLessThan(kroki.indexOf(pobierania[0]));
    expect(kroki[kontrola].if).toMatch(/inputs\.tryb != 'spis'/);
    expect(kroki[kontrola].run).toMatch(/exit 1/);
  });
  test('workflow: krok spisu tylko dla `spis`, uruchamia `--spis` bez --apply/--zastap, środowisko release; plan i apply go nie uruchamiają', () => {
    const spis = kroki.find(k => /--spis/.test(k.run ?? ''));
    expect(spis).toBeDefined();
    expect(spis?.if).toMatch(/inputs\.tryb == 'spis'/);
    expect(spis?.run).not.toMatch(/--apply|--zastap|--dry-run|--iphone/);
    expect(spis?.run).toContain('$GITHUB_STEP_SUMMARY');
    expect(wf.jobs.zrzuty.environment).toBe('release');
    const plan = kroki.find(k => k.name?.startsWith('Plan'));
    expect(plan?.if).toMatch(/inputs\.tryb != 'spis'/);
    const apply = kroki.find(k => /--apply/.test(k.run ?? ''));
    expect(apply?.if).toMatch(/inputs\.tryb == 'apply'/);
  });
});
