/*
 * ZR10 (KO-210, 2026-11-25): tryb „zastąp” w scripts/asc/zrzuty.mjs — wersja 1.0.1 odziedziczyła z 1.0 po 7 zrzutów w każdej grupie, a skrypt pomijał grupę, która ma zrzuty
 * (dry-runy 45656564391, 45657338616). Zdjęcie placementu: DELETE /v1/appAssetLibraryPlacements/{id}, obraz zostaje w bibliotece (docs/jakosc/zr10-api.md, cytaty Apple).
 * Testy PRZED kodem (zasada wspólna 11). Skrypty są ESM, więc w procesie potomnym; atrapa serwera w pamięci: tests/wydanie/zrzuty-zastap-driver.mjs. Nic nie łączy się z Apple.
 */
import { join } from 'path';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';

const korzen = join(__dirname, '..', '..');
const DRIVER = join(__dirname, 'zrzuty-zastap-driver.mjs');
const ZRZUTY = JSON.stringify(join(korzen, 'scripts/asc/zrzuty.mjs'));
const KLIENT = JSON.stringify(join(korzen, 'scripts/asc/iap-localizations.mjs'));

type Wiersz = { action: string; reason: string; error: string | null; written: boolean; remove: { id: string; ref: string }[] };
type Krok = { code: number; rows: Wiersz[]; log: string[]; calls: { m: string; p: string; tag: string }[] };
type Wynik = { kroki: Krok[]; placementy: string[]; obrazy: number; usunieteObrazy: number; wycieki: string[] };
const uruchom = (sc: Record<string, unknown>): Wynik => JSON.parse(execFileSync(process.execPath, [DRIVER, JSON.stringify(sc)], { encoding: 'utf8', maxBuffer: 1 << 26 }));
const kod = (src: string) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', src], { encoding: 'utf8', maxBuffer: 1 << 26 }));
/** ZR11 (KO-213): referenceName = oczko/<źródło>/<język>/<plik>#<12 znaków sha256 treści>; atrapa (driver) daje plikom 100 × 'A', skrót liczony tu niezależnie od kodu skryptu. */
const sha12 = (tresc: string) => createHash('sha256').update(Buffer.alloc(100, tresc)).digest('hex').slice(0, 12);
const NOWE = ['01', '02', '03'].map((n) => `oczko/iphone/pl/${n}-ekran.png#${sha12('A')}`);
const SHA_PLAN = 'aabbccddeeff'; // skrót w plikach fikcyjnych helpera plan()
const NOWE_PLAN = ['01', '02', '03'].map((n) => `oczko/iphone/pl/${n}-ekran.png#${SHA_PLAN}`);
const niepuste = (k: Krok) => k.calls.filter((c) => c.m !== 'GET');
const tagi = (k: Krok) => k.calls.map((c) => c.tag);

/** plan() na atrapie: `existing` zwraca tablicę placementów { id, ref } (albo liczbę) dla grupy G; 3 pliki w jednym języku. */
function plan(o: { zastap?: boolean; stare?: number; stan?: string | null; refyStare?: string[]; jakoLiczba?: boolean }) {
  return kod(`import * as Z from ${ZRZUTY};
    const M = await import(${JSON.stringify(join(korzen, 'scripts/asc/metadane.mjs'))});
    const f = (n) => ({ name: n, path: '/x/' + n, size: 100, width: 1320, height: 2868, alpha: false, sha: ${JSON.stringify(SHA_PLAN)} });
    const ref = { imageSpecs: [{ specId: 'S', alphaAllowed: false, dimensions: { minWidth: 1320, maxWidth: 1320, minHeight: 2868, maxHeight: 2868 } }],
      placementTypes: [{ placementTypeId: 'APP_SCREENSHOT', specMappings: [{ specs: ['S'], placementGroupId: 'G' }] }] };
    const refy = ${JSON.stringify(o.refyStare ?? null)};
    const lista = Array.from({ length: ${o.stare ?? 0} }, (_, i) => ({ id: 'PLC-' + (i + 1), ref: refy ? refy[i] : 'stare/0' + (i + 1) }));
    const existing = async () => ${o.jakoLiczba ? o.stare ?? 0 : 'lista'};
    const argumenty = { shots: { iphone: new Map([['pl', ['01-ekran.png', '02-ekran.png', '03-ekran.png'].map(f)]]) }, locs: new Map([[M.LOCALE_MAP.pl, 'LOC1']]), refData: ref, existing };
    ${o.zastap ? 'argumenty.zastap = true;' : ''}
    ${o.stan === null ? '' : `argumenty.versionState = ${JSON.stringify(o.stan ?? 'PREPARE_FOR_SUBMISSION')};`}
    const p = await Z.plan(argumenty);
    process.stdout.write(JSON.stringify({ rows: p.rows.map((r) => ({ action: r.action, reason: r.reason, remove: r.remove, plikow: r.files?.length ?? 0 })), errors: p.errors }));`) as {
    rows: { action: string; reason: string; remove?: { id: string; ref: string }[]; plikow: number }[]; errors: string[] };
}

describe('plan(): działanie „zastąp”', () => {
  test('flaga zastąp i grupa ma 7 placementów → „zastąp”: lista 7 do zdjęcia (id + referenceName) i 3 pliki do wgrania', () => {
    const p = plan({ zastap: true, stare: 7 });
    expect(p.errors).toEqual([]);
    expect(p.rows).toHaveLength(1);
    expect(p.rows[0].action).toBe('zastąp');
    expect(p.rows[0].reason).toBe('zdejmę 7 placementów, wgram 3');
    expect(p.rows[0].plikow).toBe(3);
    expect(p.rows[0].remove?.map((x) => x.id)).toEqual(['PLC-1', 'PLC-2', 'PLC-3', 'PLC-4', 'PLC-5', 'PLC-6', 'PLC-7']);
    expect(p.rows[0].remove?.[0].ref).toBe('stare/01');
  });

  test('bez flagi zachowanie bez zmian: „pomiń” z tym samym tekstem powodu, nic do zdjęcia', () => {
    const p = plan({ stare: 7 });
    expect(p.rows[0].action).toBe('pomiń');
    expect(p.rows[0].reason).toBe('grupa ma już 7 zrzutów (nic nie usuwam)');
    expect(p.rows[0].remove).toBeUndefined();
    const k = plan({ stare: 2 }); // mniej placementów niż plików: ostrzeżenie „niekompletna” jak dotąd
    expect(k.rows[0].reason).toMatch(/^grupa ma już 2 zrzutów \(nic nie usuwam\) — niekompletna: 2 z 3 zrzutów/);
  });

  test('bez flagi liczba zamiast listy nadal działa (zgodność wsteczna `existing`)', () => {
    const p = plan({ stare: 7, jakoLiczba: true });
    expect(p.rows[0].action).toBe('pomiń');
    expect(p.rows[0].reason).toBe('grupa ma już 7 zrzutów (nic nie usuwam)');
  });

  test('flaga zastąp, ale grupa pusta → zwykłe „wgraj” (nic do zdjęcia)', () => {
    const p = plan({ zastap: true, stare: 0 });
    expect(p.rows[0].action).toBe('wgraj');
    expect(p.rows[0].remove).toBeUndefined();
  });

  test('flaga zastąp i `existing` zwraca tylko liczbę (brak id placementów do zdjęcia) → błąd planu, nie „zastąp” z pustą listą', () => {
    const p = plan({ zastap: true, stare: 7, jakoLiczba: true });
    expect(p.rows.filter((r) => r.action === 'zastąp')).toEqual([]);
    expect(p.errors.join('\n')).toMatch(/brak identyfikatorów placementów/);
  });

  test('idempotencja: grupa już ma dokładnie te zrzuty w tej kolejności → „pomiń” (nie zdejmuje i nie wgrywa drugi raz)', () => {
    const p = plan({ zastap: true, stare: 3, refyStare: NOWE_PLAN });
    expect(p.rows[0].action).toBe('pomiń');
    expect(p.rows[0].reason).toMatch(/już zawiera te zrzuty/);
    expect(p.rows[0].remove).toBeUndefined();
  });

  test('te same obrazy w innej kolejności albo jeden inny → „zastąp” (cel to kolejność z artefaktu)', () => {
    const p = plan({ zastap: true, stare: 3, refyStare: [NOWE_PLAN[1], NOWE_PLAN[0], NOWE_PLAN[2]] });
    expect(p.rows[0].action).toBe('zastąp');
  });

  test.each(['READY_FOR_SALE', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'PENDING_DEVELOPER_RELEASE', 'REJECTED', null])(
    'odmowa zastąpienia, gdy wersja nie jest „w przygotowaniu” (stan %s): błąd planu, żadnego wiersza „zastąp”', (stan) => {
      const p = plan({ zastap: true, stare: 7, stan });
      expect(p.rows.filter((r) => r.action === 'zastąp')).toEqual([]);
      expect(p.errors.join('\n')).toMatch(/odmowa zastąpienia/);
    });

  test('stan wersji nie wpływa na zwykły plan bez flagi (READY_FOR_SALE → nadal „pomiń”, bez błędu)', () => {
    const p = plan({ stare: 7, stan: 'READY_FOR_SALE' });
    expect(p.errors).toEqual([]);
    expect(p.rows[0].action).toBe('pomiń');
  });
});

describe('klient HTTP: DELETE tylko na placemencie', () => {
  /** Atrapa fetch zlicza wywołania; klient z `allowDelete` (albo bez) próbuje DELETE na podanych ścieżkach. */
  function proby(allowDelete: boolean, sciezki: string[]) {
    return kod(`import { makeClient } from ${KLIENT};
      let fetchy = 0; const fetchFn = async () => { fetchy++; return { status: 204, ok: true, json: async () => { throw new Error('puste'); } }; };
      const c = makeClient({ fetchFn, token: 'T', sleep: async () => {}, ${allowDelete ? 'allowDelete: true' : ''} });
      const wyniki = [];
      for (const p of ${JSON.stringify(sciezki)}) { const przed = fetchy; try { await c.call('DELETE', p); wyniki.push({ p, ok: true, fetch: fetchy - przed }); } catch (e) { wyniki.push({ p, ok: false, fetch: fetchy - przed, msg: e.message }); } }
      process.stdout.write(JSON.stringify(wyniki));`) as { p: string; ok: boolean; fetch: number; msg?: string }[];
  }
  const PLC = '/v1/appAssetLibraryPlacements/2e000005-e036-8f0b-8f25-6dbc2baa784a';

  test('domyślnie (bez allowDelete) DELETE odrzucony przed fetch — także na placemencie', () => {
    const w = proby(false, [PLC]);
    expect(w[0]).toMatchObject({ ok: false, fetch: 0 });
    expect(w[0].msg).toMatch(/nigdy nie usuwa/);
  });

  test('z allowDelete: DELETE na ścieżce placementu przechodzi (1 żądanie, 204 bez treści nie jest błędem)', () => {
    const w = proby(true, [PLC, 'https://api.appstoreconnect.apple.com' + PLC]);
    expect(w.map((x) => [x.ok, x.fetch])).toEqual([[true, 1], [true, 1]]);
  });

  test('z allowDelete: DELETE na obrazie biblioteki i na każdym innym zasobie odrzucony przed fetch', () => {
    const zle = [
      '/v1/appAssetLibraryImages/2e000005-e036-8f0b-8f25-6dbc2baa784a',
      '/v1/appAssetLibraries/2e000005-e036-8f0b-8f25-6dbc2baa784a',
      '/v1/appStoreVersions/2e000005-e036-8f0b-8f25-6dbc2baa784a',
      '/v1/appStoreVersionLocalizations/2e000005-e036-8f0b-8f25-6dbc2baa784a',
      '/v1/inAppPurchasesV2/2e000005-e036-8f0b-8f25-6dbc2baa784a',
      '/v1/apps/2e000005-e036-8f0b-8f25-6dbc2baa784a',
      '/v1/appAssetLibraryPlacements', // bez id: kolekcja
      '/v1/appAssetLibraryPlacements/', // pusty id
      PLC + '/relationships/image', // relacja placementu
      PLC + '?include=image', // zapytanie doklejone do ścieżki
      '/v1/appAssetLibraryPlacements/../appAssetLibraryImages/2e000005-e036-8f0b-8f25-6dbc2baa784a', // wyjście z ścieżki
      '/v1/appAssetLibraryPlacements/%2e%2e/appAssetLibraryImages/X',
      'https://api.appstoreconnect.apple.com/v1/appAssetLibraryImages/2e000005-e036-8f0b-8f25-6dbc2baa784a',
      'https://example.com' + PLC, // obcy host
    ];
    const w = proby(true, zle);
    for (const x of w) expect({ p: x.p, ok: x.ok, fetch: x.fetch }).toEqual({ p: x.p, ok: false, fetch: 0 });
  });

  test('allowDelete nie rozszerza innych metod: PUT i inne nadal odrzucone', () => {
    const w = kod(`import { makeClient } from ${KLIENT};
      let fetchy = 0; const c = makeClient({ fetchFn: async () => { fetchy++; return { status: 200, ok: true, json: async () => ({}) }; }, token: 'T', sleep: async () => {}, allowDelete: true });
      const w = []; for (const m of ['PUT', 'HEAD', 'OPTIONS']) { try { await c.call(m, '/v1/appAssetLibraryPlacements/ABCDEFGH'); w.push(true); } catch { w.push(false); } }
      process.stdout.write(JSON.stringify({ w, fetchy }));`);
    expect(w).toEqual({ w: [false, false, false], fetchy: 0 });
  });

  test('inne skrypty (metadane, produkty, IAP) tworzą klienta bez allowDelete — brak przekazania opcji w ich kodzie', () => {
    const fs = require('fs') as typeof import('fs');
    const katalog = join(korzen, 'scripts/asc');
    const inne = fs.readdirSync(katalog).filter((f) => f.endsWith('.mjs') && !['zrzuty.mjs', 'iap-localizations.mjs'].includes(f));
    expect(inne.length).toBeGreaterThanOrEqual(3);
    for (const f of inne) expect(fs.readFileSync(join(katalog, f), 'utf8')).not.toMatch(/allowDelete/);
    const iap = fs.readFileSync(join(katalog, 'iap-localizations.mjs'), 'utf8');
    expect(iap).toMatch(/allowDelete = false/); // domyślnie wyłączone w samym kliencie
  });
});

describe('run(): dry-run z zastąp', () => {
  const w = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: false, zastap: true }] });
  const k = w.kroki[0];

  test('wiersz „zastąp — zdejmę 7 placementów, wgram 3”, kod 0, nic nie zapisano (same GET)', () => {
    expect(k.code).toBe(0);
    expect(k.rows.map((r) => r.action)).toEqual(['zastąp']);
    expect(k.log.join('\n')).toMatch(/zastąp — zdejmę 7 placementów, wgram 3/);
    expect(niepuste(k)).toEqual([]);
    expect(w.placementy).toHaveLength(7);
  });

  test('raport wypisuje referenceName i id każdego placementu do zdjęcia (do odtworzenia ręcznego); obrazy zostają', () => {
    const t = k.log.join('\n');
    for (let i = 1; i <= 7; i++) expect(t).toMatch(new RegExp(`PLC-\\d+[^\\n]*stare/0${i}\\.png|stare/0${i}\\.png[^\\n]*PLC-\\d+`));
    expect(t).toMatch(/obrazy (zostają|pozostają) w bibliotece/);
  });
});

describe('run(): bez flagi nic się nie zmienia', () => {
  test('dry-run i apply z istniejącymi 7 placementami → „pomiń”, zero zapisów i zero DELETE, placementy nietknięte', () => {
    const w = uruchom({ stare: 7, kroki: [{ apply: false }, { apply: true }] });
    for (const k of w.kroki) {
      expect(k.rows.map((r) => r.action)).toEqual(['pomiń']);
      expect(k.rows[0].reason).toBe('grupa ma już 7 zrzutów (nic nie usuwam)');
      expect(k.calls.filter((c) => c.m === 'DELETE')).toEqual([]);
      expect(niepuste(k)).toEqual([]);
    }
    expect(w.placementy).toHaveLength(7);
    expect(w.wycieki).toEqual([]);
  });
});

describe('run(): apply z zastąp', () => {
  const w = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: true, zastap: true }] });
  const k = w.kroki[0];

  test('stan końcowy: grupa ma dokładnie 3 nowe zrzuty w kolejności artefaktu; kod 0; wiersz zapisany', () => {
    expect(k.code).toBe(0);
    expect(w.placementy).toEqual(NOWE);
    expect(k.rows[0]).toMatchObject({ action: 'zastąp', written: true, error: null });
  });

  test('KOLEJNOŚĆ: najpierw nowe obrazy wgrane (uploaded: true), dopiero potem DELETE starych placementów, potem nowe placementy i kolejność', () => {
    const t = tagi(k);
    const ostatniUpload = t.lastIndexOf('PATCH uploaded');
    const pierwszyDelete = t.indexOf('DELETE placement');
    const ostatniDelete = t.lastIndexOf('DELETE placement');
    const pierwszyNowy = t.indexOf('POST placement');
    expect(t.filter((x) => x === 'PATCH uploaded')).toHaveLength(3);
    expect(t.filter((x) => x === 'DELETE placement')).toHaveLength(7);
    expect(t.filter((x) => x === 'POST placement')).toHaveLength(3);
    expect(ostatniUpload).toBeGreaterThanOrEqual(0);
    expect(pierwszyDelete).toBeGreaterThan(ostatniUpload);
    expect(pierwszyNowy).toBeGreaterThan(ostatniDelete);
    expect(t.lastIndexOf('POST placement')).toBeLessThan(t.indexOf('POST kolejność'));
  });

  test('obrazy biblioteki nigdy nie są usuwane: 7 starych + 3 nowe nadal w bibliotece; żaden DELETE poza placementami', () => {
    expect(w.obrazy).toBe(10);
    expect(w.usunieteObrazy).toBe(0);
    expect(w.wycieki).toEqual([]);
    expect(k.calls.filter((c) => c.m === 'DELETE').every((c) => c.tag === 'DELETE placement')).toBe(true);
  });

  test('raport przebiegu: referenceName i id zdejmowanych placementów; w logu nie ma tokenu', () => {
    const t = k.log.join('\n');
    expect(t).toMatch(/zdjęto placement PLC-\d+ \(stare\/01\.png\)/);
    expect(t).not.toMatch(/TOKEN-TESTOWY|Bearer/);
  });

  test('ponowny przebieg po sukcesie (zastąp=true) → „pomiń”, zero zapisów (idempotencja)', () => {
    const r = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: true, zastap: true }, { apply: true, zastap: true }] });
    expect(r.kroki[1].code).toBe(0);
    expect(r.kroki[1].rows.map((x) => x.action)).toEqual(['pomiń']);
    expect(niepuste(r.kroki[1])).toEqual([]);
    expect(r.placementy).toEqual(NOWE);
  });
});

describe('run(): odmowa przy wersji nieedytowalnej', () => {
  test.each(['READY_FOR_SALE', 'IN_REVIEW', 'WAITING_FOR_REVIEW'])('wersja %s: dry-run i apply z zastąp → kod 1, „odmowa zastąpienia”, zero zapisów, placementy nietknięte', (stanWersji) => {
    const w = uruchom({ stanWersji, stare: 7, kroki: [{ apply: false, zastap: true }, { apply: true, zastap: true }] });
    for (const k of w.kroki) {
      expect(k.code).toBe(1);
      expect(k.log.join('\n')).toMatch(/odmowa zastąpienia/i);
      expect(niepuste(k)).toEqual([]);
    }
    expect(w.placementy).toHaveLength(7);
    expect(w.wycieki).toEqual([]);
  });
});

describe('run(): błąd w środku — jasny stan i ponowienie dochodzi do celu', () => {
  test('awaria wgrywania obrazu → żaden placement nie zdjęty (stare zrzuty zostają na stronie), kod 1, ponowienie kończy zadanie', () => {
    const w = uruchom({ stare: 7, nowe: 3, kroki: [
      { apply: true, zastap: true, awaria: { m: 'PATCH', tag: 'PATCH uploaded', nth: 2, status: 500 } },
      { apply: true, zastap: true }] });
    expect(w.kroki[0].code).toBe(1);
    expect(w.kroki[0].calls.filter((c) => c.m === 'DELETE')).toEqual([]);
    expect(w.kroki[0].rows[0].error).toBeTruthy();
    expect(w.kroki[1].code).toBe(0);
    expect(w.placementy).toEqual(NOWE);
  });

  test('awaria przy 2. nowym placemencie (po zdjęciu starych) → wiersz z jasnym stanem i instrukcją ponowienia; drugi przebieg dochodzi do stanu docelowego; trzeci = „pomiń”', () => {
    const w = uruchom({ stare: 7, nowe: 3, kroki: [
      { apply: true, zastap: true, awaria: { m: 'POST', tag: 'POST placement', nth: 2, status: 500 } },
      { apply: true, zastap: true },
      { apply: true, zastap: true }] });
    const [a, b, c] = w.kroki;
    expect(a.code).toBe(1);
    expect(a.rows[0].error).toMatch(/zdjęto 7 z 7 placementów/);
    expect(a.rows[0].error).toMatch(/ułożono 1 z 3/);
    expect(a.rows[0].error).toMatch(/ponów.*zastap/i);
    expect(a.log.join('\n')).toMatch(/ponów.*zastap/i);
    expect(b.code).toBe(0);
    expect(w.placementy).toEqual(NOWE);
    expect(c.rows.map((x) => x.action)).toEqual(['pomiń']);
    expect(w.usunieteObrazy).toBe(0);
    expect(w.obrazy).toBe(10);
  });

  test('awaria przy 3. zdjęciu placementu → wiersz mówi „zdjęto 2 z 7”, nowe placementy nie powstają, ponowienie kończy zadanie', () => {
    const w = uruchom({ stare: 7, nowe: 3, kroki: [
      { apply: true, zastap: true, awaria: { m: 'DELETE', tag: 'DELETE placement', nth: 3, status: 500 } },
      { apply: true, zastap: true }] });
    expect(w.kroki[0].code).toBe(1);
    expect(w.kroki[0].rows[0].error).toMatch(/zdjęto 2 z 7 placementów/);
    expect(w.kroki[0].calls.filter((c) => c.tag === 'POST placement')).toEqual([]);
    expect(w.kroki[1].code).toBe(0);
    expect(w.placementy).toEqual(NOWE);
  });
});

describe('workflow i dokumentacja', () => {
  const fs = require('fs') as typeof import('fs');
  const wf = fs.readFileSync(join(korzen, '.github/workflows/asc-zrzuty.yml'), 'utf8');
  const skrypt = fs.readFileSync(join(korzen, 'scripts/asc/zrzuty.mjs'), 'utf8');

  test('wejście `zastap`: boolean, domyślnie false, opis po polsku', () => {
    const blok = wf.match(/\n {6}zastap:\n((?: {8}.+\n)+)/);
    expect(blok).not.toBeNull();
    expect(blok![1]).toMatch(/type: boolean/);
    expect(blok![1]).toMatch(/default: false/);
    expect(blok![1]).toMatch(/description: .*(zdejm|zastąp|placement)/i);
  });

  test('flaga --zastap przekazana do skryptu w kroku planu i zapisu, przez zmienną środowiska (nie przez wstawienie wejścia do powłoki)', () => {
    expect(wf).toMatch(/ZASTAP: \$\{\{ inputs\.zastap \}\}/);
    expect((wf.match(/--zastap/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(wf).not.toMatch(/run:[^\n]*\$\{\{ inputs\.zastap \}\}/);
  });

  test('nagłówek skryptu i workflowu: „nigdy nie usuwa” zastąpione zasadą z KO-210', () => {
    for (const t of [skrypt, wf]) {
      expect(t).toMatch(/KO-210/);
      expect(t).toMatch(/obrazów biblioteki nigdy/);
    }
    expect(skrypt).not.toMatch(/Zasady: NIGDY nie usuwa \(klient: tylko GET, POST, PATCH/);
  });
});
