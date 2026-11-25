/*
 * ZR11 (KO-213, 2026-11-25; P-1058, P-1059): tożsamość zrzutu po treści, nie po nazwie — scripts/asc/zrzuty.mjs.
 * Dry-run 45672598004 (zastap=true, en, artefakt 45633013976 = zrzuty 1.0.1) pominął wszystkie 8 grup jako „już zawiera te zrzuty (7) w tej kolejności”,
 * bo referenceName `oczko-1.0/<źródło>/<język>/<plik>` nie zależał od treści: zrzuty 1.0 i 1.0.1 miały identyczne nazwy. Apply nie zrobiłby nic (stare obrazy zostają) — fałszywy zielony.
 * Nowa postać: `oczko/<źródło>/<język>/<plik>#<12 znaków sha256 treści pliku>`.
 *  1. porównanie „już zawiera”, findReusable, obtainImage i mapa `planned` używają nowej nazwy; nazwy `oczko-1.0/…` są INNE niż nowe;
 *  2. tryb bez `zastap` (pusta grupa) — zachowanie bez zmian poza nową nazwą;
 *  3. (P2 recenzji ZR10b) ochrona wersji w sklepie: każda wersja inna niż edytowana i nie w PREPARE_FOR_SUBMISSION; brak wersji do sprawdzenia = odmowa;
 *  4. (P3 recenzji ZR10b) listPlacements odrzuca wpis o `type` ≠ appAssetLibraryPlacements (schemat AppAssetLibraryPlacement, developer.apple.com, odczyt 25.11.2026); stronicowanie.
 * Testy PRZED kodem (zasada wspólna 11), na atrapie serwera w pamięci (tests/wydanie/zrzuty-zastap-driver.mjs). Nic nie łączy się z Apple.
 */
import { join } from 'path';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';

const korzen = join(__dirname, '..', '..');
const DRIVER = join(__dirname, 'zrzuty-zastap-driver.mjs');
const ZRZUTY = JSON.stringify(join(korzen, 'scripts/asc/zrzuty.mjs'));

type Wiersz = { action: string; reason: string; error: string | null; written: boolean; remove: { id: string; ref: string }[] };
type Wywolanie = { m: string; p: string; tag: string; q: string };
type Krok = { code: number; rows: Wiersz[]; log: string[]; calls: Wywolanie[] };
type Wynik = { kroki: Krok[]; placementy: string[]; pozostale: string[]; obrazy: number; usunieteObrazy: number; wycieki: string[] };
const uruchom = (sc: Record<string, unknown>): Wynik => JSON.parse(execFileSync(process.execPath, [DRIVER, JSON.stringify(sc)], { encoding: 'utf8', maxBuffer: 1 << 26 }));
const kod = (src: string) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', src], { encoding: 'utf8', maxBuffer: 1 << 26 }));

/** Skrót liczony tu niezależnie od kodu skryptu; atrapa daje plikom 100 × znak treści. */
const sha12 = (tresc: string) => createHash('sha256').update(Buffer.alloc(100, tresc)).digest('hex').slice(0, 12);
const ref = (n: string, tresc = 'A') => `oczko/iphone/pl/${n}-ekran.png#${sha12(tresc)}`;
const nowe = (ile: number, tresc = 'A') => Array.from({ length: ile }, (_, i) => ref(`0${i + 1}`, tresc));
/** Nazwy zrzutów 1.0 (stary schemat, bez skrótu) — takie same nazwy plików jak w artefakcie 1.0.1. */
const STARE_10 = Array.from({ length: 7 }, (_, i) => `oczko-1.0/iphone/pl/0${i + 1}-ekran.png`);
const niepuste = (k: Krok) => k.calls.filter((c) => c.m !== 'GET');
const usuniete = (k: Krok) => k.calls.filter((c) => c.m === 'DELETE').map((c) => c.p.split('/').pop() as string);
const tekst = (k: Krok) => k.log.join('\n');

describe('ZR11-1: tożsamość zrzutu po treści (grupa z zrzutami 1.0, artefakt 1.0.1 o tych samych nazwach plików)', () => {
  test('referenceName 1.0 (`oczko-1.0/…`, bez skrótu) ≠ nowa nazwa: dry-run → 7 × „zastąp, zdejmę 7, wgram 7”, zero zapisów (dawniej fałszywe „pomiń — zastąpione wcześniej”)', () => {
    const w = uruchom({ stare: 7, stareNazwy: STARE_10, nowe: 7, kroki: [{ apply: false, zastap: true }] });
    const k = w.kroki[0];
    expect(k.code).toBe(0);
    expect(k.rows.map((r) => r.action)).toEqual(['zastąp']);
    expect(k.rows[0].reason).toMatch(/zdejmę 7 placementów, wgram 7/);
    expect(k.rows[0].remove.map((x) => x.ref)).toEqual(STARE_10);
    expect(tekst(k)).not.toMatch(/zastąpione wcześniej/);
    expect(niepuste(k)).toEqual([]);
  });

  test('apply po grupie z zrzutami 1.0: stare placementy zdjęte, nowe obrazy mają nazwę ze skrótem treści, stare obrazy zostają w bibliotece', () => {
    const w = uruchom({ stare: 7, stareNazwy: STARE_10, nowe: 7, kroki: [{ apply: true, zastap: true }] });
    const k = w.kroki[0];
    expect(k.code).toBe(0);
    expect(usuniete(k)).toHaveLength(7);
    expect(w.placementy).toEqual(nowe(7));
    for (const r of w.placementy) expect(r).toMatch(/^oczko\/iphone\/pl\/0\d-ekran\.png#[0-9a-f]{12}$/);
    expect(w.obrazy).toBe(14); // 7 z 1.0 + 7 nowych; żaden obraz nie usunięty
    expect(w.usunieteObrazy).toBe(0);
  });

  test('ta sama nazwa pliku, INNA treść niż w grupie (nowy schemat) → „zastąp”; ta sama treść drugi raz → „pomiń”; wrót do treści z biblioteki → „zastąp” bez nowego wgrania obrazów', () => {
    const w = uruchom({ stare: 3, stareNazwy: nowe(3, 'A'), nowe: 3, kroki: [
      { apply: false, zastap: true, tresc: 'B' }, // grupa ma A, artefakt B
      { apply: true, zastap: true, tresc: 'B' },
      { apply: false, zastap: true, tresc: 'B' }, // grupa ma już B
      { apply: true, zastap: true, tresc: 'B' },
      { apply: true, zastap: true, tresc: 'A' }, // wrót do A: obrazy A są w bibliotece (z nazwą z hasłem A)
    ] });
    const [a, b, c, d, e] = w.kroki;
    expect(a.rows.map((r) => r.action)).toEqual(['zastąp']);
    expect(a.rows[0].reason).toMatch(/zdejmę 3 placementów, wgram 3/);
    expect(niepuste(a)).toEqual([]);
    expect(b.code).toBe(0);
    expect(c.rows.map((r) => r.action)).toEqual(['pomiń']);
    expect(c.rows[0].reason).toMatch(/już zawiera te zrzuty/);
    expect(niepuste(c)).toEqual([]);
    expect(d.rows.map((r) => r.action)).toEqual(['pomiń']);
    expect(niepuste(d)).toEqual([]);
    expect(e.rows.map((r) => r.action)).toEqual(['zastąp']);
    expect(e.calls.filter((x) => x.tag === 'POST obraz')).toEqual([]); // obrazy A użyte ponownie (findReusable po nazwie ze skrótem)
    expect(w.placementy).toEqual(nowe(3, 'A'));
    expect(w.obrazy).toBe(6); // 3 (A) + 3 (B); żadnego duplikatu
    expect(w.usunieteObrazy).toBe(0);
  });

  test('findReusable/obtainImage: obraz o tej samej nazwie pliku, ale innej treści, nie jest brany za nowy (apply wgrywa NOWE obrazy: 3 × POST obraz)', () => {
    const w = uruchom({ stare: 3, stareNazwy: nowe(3, 'A'), nowe: 3, kroki: [{ apply: true, zastap: true, tresc: 'B' }] });
    expect(w.kroki[0].calls.filter((x) => x.tag === 'POST obraz')).toHaveLength(3);
    expect(w.kroki[0].calls.filter((x) => x.tag === 'PATCH uploaded')).toHaveLength(3);
    expect(w.placementy).toEqual(nowe(3, 'B'));
  });

  test('bajty wczytane przy wgrywaniu ≠ plik, z którego policzono skrót → błąd wiersza, 0 × DELETE, nic nie wgrane (plik zmienił się po planie)', () => {
    const w = uruchom({ stare: 7, stareNazwy: STARE_10, nowe: 3, kroki: [{ apply: true, zastap: true, tresc: 'B', trescOdczytu: 'C' }] });
    const k = w.kroki[0];
    expect(k.code).toBe(1);
    expect(usuniete(k)).toEqual([]);
    expect(k.rows[0].error).toMatch(/skrót|zmienił/i);
    expect(w.placementy).toHaveLength(7);
  });

  test('plan(): plik bez skrótu treści → błąd planu (fail-closed), nie wiersz „zastąp”/„wgraj” z nazwą bez skrótu', () => {
    const w = kod(`import * as Z from ${ZRZUTY};
      const M = await import(${JSON.stringify(join(korzen, 'scripts/asc/metadane.mjs'))});
      const f = (n) => ({ name: n, path: '/x/' + n, size: 100, width: 1320, height: 2868, alpha: false });
      const ref = { imageSpecs: [{ specId: 'S', alphaAllowed: false, dimensions: { minWidth: 1320, maxWidth: 1320, minHeight: 2868, maxHeight: 2868 } }],
        placementTypes: [{ placementTypeId: 'APP_SCREENSHOT', specMappings: [{ specs: ['S'], placementGroupId: 'G' }] }] };
      const p = await Z.plan({ shots: { iphone: new Map([['pl', [f('01-ekran.png')]]]) }, locs: new Map([[M.LOCALE_MAP.pl, 'LOC1']]), refData: ref, existing: async () => 0 });
      process.stdout.write(JSON.stringify({ rows: p.rows.map((r) => r.action), errors: p.errors }));`) as { rows: string[]; errors: string[] };
    expect(w.rows).toEqual([]);
    expect(w.errors.join('\n')).toMatch(/skrótu treści/);
  });

  test('readShots: skrót = pierwsze 12 znaków sha256 bajtów pliku (różne treści → różne skróty, ta sama treść → ten sam)', () => {
    const w = kod(`import * as Z from ${ZRZUTY};
      const png = (c) => { const b = Buffer.alloc(40, c); Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(b); b.writeUInt32BE(1320,16); b.writeUInt32BE(2868,20); b[25]=2; return b; };
      const pliki = { '/d/pl/a.png': png(1), '/d/pl/b.png': png(1), '/d/pl/c.png': png(2) };
      const fs = { existsSync: () => true, readdirSync: (p) => p === '/d' ? ['pl'] : ['a.png', 'b.png', 'c.png'], statSync: () => ({ isDirectory: () => true }), readFileSync: (p) => pliki[p] };
      const r = Z.readShots('/d', fs);
      process.stdout.write(JSON.stringify({ sha: r.shots.get('pl').map((f) => f.sha), problems: r.problems }));`) as { sha: string[]; problems: string[] };
    const png = (c: number) => { const b = Buffer.alloc(40, c); Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b); b.writeUInt32BE(1320, 16); b.writeUInt32BE(2868, 20); b[25] = 2; return b; };
    const oczekiwany = (c: number) => createHash('sha256').update(png(c)).digest('hex').slice(0, 12);
    expect(w.problems).toEqual([]);
    expect(w.sha).toEqual([oczekiwany(1), oczekiwany(1), oczekiwany(2)]);
    expect(w.sha[0]).not.toBe(w.sha[2]);
  });
});

describe('ZR11-2: tryb bez `zastap` — dopisywanie do pustych grup', () => {
  test('pusta grupa dostaje obrazy z nową referenceName (skrót treści), kod 0, 3 × POST placement; bez DELETE', () => {
    const w = uruchom({ stare: 0, nowe: 3, kroki: [{ apply: true }] });
    const k = w.kroki[0];
    expect(k.code).toBe(0);
    expect(k.rows.map((r) => r.action)).toEqual(['wgraj']);
    expect(w.placementy).toEqual(nowe(3));
    expect(k.calls.filter((c) => c.tag === 'POST obraz')).toHaveLength(3);
    expect(usuniete(k)).toEqual([]);
    expect(w.wycieki).toEqual([]);
  });

  test('grupa z zrzutami 1.0 bez `zastap` nadal „pomiń” (nic nie usuwam), także gdy artefakt ma inną treść', () => {
    const w = uruchom({ stare: 7, stareNazwy: STARE_10, nowe: 7, kroki: [{ apply: false }, { apply: true }] });
    for (const k of w.kroki) {
      expect(k.rows.map((r) => r.action)).toEqual(['pomiń']);
      expect(k.rows[0].reason).toBe('grupa ma już 7 zrzutów (nic nie usuwam)');
      expect(niepuste(k)).toEqual([]);
    }
    expect(w.placementy).toEqual(STARE_10);
  });

  test('dopisanie do pustej grupy dwa razy z tą samą treścią: drugi przebieg używa obrazów z biblioteki (0 × POST obraz) i „pomiń” bez zastap', () => {
    const w = uruchom({ stare: 0, nowe: 3, kroki: [{ apply: true }, { apply: true }] });
    expect(w.kroki[1].rows.map((r) => r.action)).toEqual(['pomiń']);
    expect(w.kroki[1].calls.filter((c) => c.tag === 'POST obraz')).toEqual([]);
    expect(w.obrazy).toBe(3);
  });
});

describe('ZR11-3: ochrona wersji w sklepie — każda inna wersja poza PREPARE_FOR_SUBMISSION', () => {
  test.each(['PENDING_DEVELOPER_RELEASE', 'PENDING_APPLE_RELEASE', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'PROCESSING_FOR_APP_STORE', 'READY_FOR_SALE', 'REPLACED_WITH_NEW_VERSION', 'DEVELOPER_REMOVED_FROM_SALE'])(
    'inna wersja w stanie %s ze wspólnym id placementu → dry-run i apply: kod 1, „rozłączne: nie”, 0 × DELETE, 0 zapisów, nic nie wgrano', (stan) => {
      const w = uruchom({ stare: 7, nowe: 3, stanSklepu: stan, sklep: { wspolne: 2 }, kroki: [{ apply: false, zastap: true }, { apply: true, zastap: true }] });
      for (const k of w.kroki) {
        expect(k.code).toBe(1);
        expect(tekst(k)).toMatch(/Placementy 1\.0 rozłączne: nie/);
        expect(tekst(k)).toMatch(/odmowa zastąpienia/);
        expect(k.rows.map((r) => r.action)).toEqual(['odmowa']);
        expect(usuniete(k)).toEqual([]);
        expect(niepuste(k)).toEqual([]);
      }
      expect(w.placementy).toHaveLength(7);
      expect(w.obrazy).toBe(7);
      expect(w.wycieki).toEqual([]);
    });

  test('inna wersja w oczekującym wydaniu (PENDING_DEVELOPER_RELEASE) z własnymi, rozłącznymi placementami → kontrola zaliczona, zastąpienie działa', () => {
    const w = uruchom({ stare: 7, nowe: 3, stanSklepu: 'PENDING_DEVELOPER_RELEASE', sklep: { wspolne: 0 }, kroki: [{ apply: false, zastap: true }, { apply: true, zastap: true }] });
    expect(w.kroki[0].code).toBe(0);
    expect(tekst(w.kroki[0])).toMatch(/Placementy 1\.0 rozłączne: tak/);
    expect(w.kroki[1].code).toBe(0);
    expect(w.placementy).toEqual(nowe(3));
  });

  test('dwie inne wersje: 1.0 w sprzedaży (rozłączna) i 1.0.2 w recenzji ze wspólnym id → odmowa, 0 × DELETE (sprawdzane są wszystkie, nie tylko READY_FOR_SALE)', () => {
    const w = uruchom({ stare: 7, nowe: 3, sklep: { wspolne: 0 }, dodatkowaWersja: { stan: 'WAITING_FOR_REVIEW', wspolne: 1 }, kroki: [{ apply: false, zastap: true }, { apply: true, zastap: true }] });
    for (const k of w.kroki) {
      expect(k.code).toBe(1);
      expect(tekst(k)).toMatch(/rozłączne: nie/);
      expect(tekst(k)).toMatch(/1\.0\.2/);
      expect(usuniete(k)).toEqual([]);
      expect(niepuste(k)).toEqual([]);
    }
    expect(w.placementy).toHaveLength(7);
  });

  test('nie da się odczytać placementów wersji w stanie innym niż READY_FOR_SALE → odmowa (fail-closed), 0 × DELETE', () => {
    const awaria = { m: 'GET', tag: 'GET /v1/appStoreVersionLocalizations/LOCPUB-pl/placements', nth: 1, status: 403 };
    const w = uruchom({ stare: 7, nowe: 3, stanSklepu: 'IN_REVIEW', kroki: [{ apply: true, zastap: true, awaria }] });
    expect(w.kroki[0].code).toBe(1);
    expect(tekst(w.kroki[0])).toMatch(/nie (da się|udało się) odczytać wersji w sklepie/);
    expect(usuniete(w.kroki[0])).toEqual([]);
    expect(w.placementy).toHaveLength(7);
  });

  test('brak wersji do sprawdzenia, a wersja edytowana NIE jest jedyną wersją aplikacji (druga wersja też w przygotowaniu) → odmowa z powodem, 0 zapisów', () => {
    const w = uruchom({ stare: 7, nowe: 3, sklep: null, dodatkowaWersja: { stan: 'PREPARE_FOR_SUBMISSION' }, kroki: [{ apply: false, zastap: true }, { apply: true, zastap: true }] });
    for (const k of w.kroki) {
      expect(k.code).toBe(1);
      expect(k.rows.map((r) => r.action)).toEqual(['odmowa']);
      expect(tekst(k)).toMatch(/odmowa zastąpienia/);
      expect(tekst(k)).toMatch(/brak wersji do sprawdzenia/);
      expect(niepuste(k)).toEqual([]);
    }
    expect(w.placementy).toHaveLength(7);
    expect(w.obrazy).toBe(7);
  });

  test('wersja edytowana jest jedyną wersją aplikacji (pierwsze wydanie) → bez odmowy, zastąpienie działa (jak dotąd)', () => {
    const w = uruchom({ stare: 7, nowe: 3, sklep: null, kroki: [{ apply: true, zastap: true }] });
    expect(w.kroki[0].code).toBe(0);
    expect(tekst(w.kroki[0])).toMatch(/jedyna wersja aplikacji/);
    expect(w.placementy).toEqual(nowe(3));
  });
});

describe('ZR11-4: listPlacements — typ zasobu i stronicowanie', () => {
  const lista = (data: unknown[], extra = '') => kod(`import * as Z from ${ZRZUTY};
    const wpis = (id, g, t, typ) => ({ id, ...(typ === null ? {} : { type: typ ?? 'appAssetLibraryPlacements' }), attributes: { placementGroup: g ?? 'G', placementType: t ?? 'APP_SCREENSHOT' }, relationships: { image: { data: { id: 'I' + id } } } });
    const klient = (data) => ({ call: async () => ({ data, included: data.map(x => ({ type: 'appAssetLibraryImages', id: 'I' + x.id, attributes: { referenceName: 'ref-' + x.id } })) }) });
    let blad = null; let wynik = null;
    try { wynik = await Z.listPlacements(klient(${JSON.stringify(data)}.map((d) => wpis(...d))), 'LOC', 'G'); } catch (e) { blad = { odmowa: e.odmowaZastapienia === true, msg: e.message }; }
    process.stdout.write(JSON.stringify({ id: wynik?.map(x => x.id) ?? null, odrzucone: wynik?.odrzucone ?? null, blad }));${extra}`) as { id: string[] | null; odrzucone: number | null; blad: { odmowa: boolean; msg: string } | null };

  test('wpis o `type` ≠ appAssetLibraryPlacements jest odrzucany (licznik `odrzucone`), nie trafia na listę do zdjęcia', () => {
    const w = lista([['A'], ['B', 'G', 'APP_SCREENSHOT', 'appStoreVersionLocalizations'], ['C', 'G', 'APP_SCREENSHOT', 'appAssetLibraryImages'], ['D']]);
    expect(w.blad).toBeNull();
    expect(w.id).toEqual(['A', 'D']);
    expect(w.odrzucone).toBe(2);
  });

  test('wpis BEZ `type` → odmowa zastąpienia (nie da się potwierdzić rodzaju zasobu), jak brak placementGroup/placementType', () => {
    const w = lista([['A'], ['B', 'G', 'APP_SCREENSHOT', null]]);
    expect(w.id).toBeNull();
    expect(w.blad?.odmowa).toBe(true);
    expect(w.blad?.msg).toMatch(/type/);
  });

  test('stronicowanie (links.next): dwie strony placementów → obie przeczytane, kolejność zachowana', () => {
    const w = kod(`import * as Z from ${ZRZUTY};
      const wpis = (id) => ({ id, type: 'appAssetLibraryPlacements', attributes: { placementGroup: 'G', placementType: 'APP_SCREENSHOT' }, relationships: { image: { data: { id: 'I' + id } } } });
      const inc = (ids) => ids.map(id => ({ type: 'appAssetLibraryImages', id: 'I' + id, attributes: { referenceName: 'ref-' + id } }));
      const adresy = [];
      const klient = { call: async (m, p) => { adresy.push(p); return p.includes('strona=2')
        ? { data: [wpis('C'), wpis('D')], included: inc(['C', 'D']) }
        : { data: [wpis('A'), wpis('B')], included: inc(['A', 'B']), links: { next: 'https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations/LOC/placements?strona=2' } }; } };
      const r = await Z.listPlacements(klient, 'LOC', 'G');
      process.stdout.write(JSON.stringify({ id: r.map(x => x.id), ref: r.map(x => x.ref), zapytan: adresy.length }));`) as { id: string[]; ref: string[]; zapytan: number };
    expect(w.id).toEqual(['A', 'B', 'C', 'D']);
    expect(w.ref).toEqual(['ref-A', 'ref-B', 'ref-C', 'ref-D']);
    expect(w.zapytan).toBe(2);
  });

  test('przebieg na atrapie z odpowiedzią w 4 stronach po 2 wpisy: wszystkie 7 placementów zdjętych i zastąpionych (żaden nie pominięty przez stronicowanie)', () => {
    const w = uruchom({ stare: 7, stareNazwy: STARE_10, nowe: 3, strony: 2, kroki: [{ apply: true, zastap: true }] });
    const k = w.kroki[0];
    expect(k.code).toBe(0);
    expect(k.rows[0].remove).toHaveLength(7);
    expect(usuniete(k)).toHaveLength(7);
    expect(w.placementy).toEqual(nowe(3));
    expect(k.calls.filter((c) => /^\/v1\/appStoreVersionLocalizations\/LOC-[^/]+\/placements$/.test(c.p)).length).toBeGreaterThanOrEqual(4);
  });
});
