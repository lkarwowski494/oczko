/*
 * ZR10b (KO-212, 2026-11-25; P-1055…P-1057): uwagi RZ4 do trybu „zastąp” w scripts/asc/zrzuty.mjs — fail-closed.
 *  - RZ4-01: lista do zdjęcia weryfikuje grupę i typ po stronie klienta (serwer może zignorować filtry); brak atrybutu = odmowa zastąpienia tej grupy.
 *  - RZ4-07: przed jakimkolwiek DELETE porównanie z placementami wersji w sprzedaży (READY_FOR_SALE); współdzielenie albo brak odczytu = odmowa.
 *  - RZ4-02: nowy obraz FAILED / nieprzetworzony → 0 DELETE (luka testowa; kod był poprawny).
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
const SHA = createHash('sha256').update(Buffer.alloc(100, 'A')).digest('hex').slice(0, 12); // ZR11 (KO-213): skrót treści w referenceName, liczony niezależnie od kodu
const NOWE = ['01', '02', '03'].map((n) => `oczko/iphone/pl/${n}-ekran.png#${SHA}`);
const niepuste = (k: Krok) => k.calls.filter((c) => c.m !== 'GET');
const usuniete = (k: Krok) => k.calls.filter((c) => c.m === 'DELETE').map((c) => c.p.split('/').pop() as string);
const tekst = (k: Krok) => k.log.join('\n');
const tagi = (k: Krok) => k.calls.map((c) => c.tag);

describe('RZ4-01: lista do zdjęcia weryfikuje grupę i typ po stronie klienta', () => {
  test('serwer ignoruje filtry, w lokalizacji jest druga grupa (G-IPAD): apply+zastąp → 0 × DELETE poza własną grupą, placementy iPada zostają', () => {
    const w = uruchom({ stare: 7, nowe: 3, ignorujFiltry: true, inne: [{ group: 'G-IPAD', n: 2 }], kroki: [{ apply: true, zastap: true }] });
    const k = w.kroki[0];
    expect(k.code).toBe(0);
    expect(usuniete(k)).toHaveLength(7); // dokładnie 7 własnych; nie 9
    expect(w.pozostale).toHaveLength(2); // oba placementy G-IPAD nietknięte
    expect(w.placementy).toEqual(NOWE);
    expect(w.wycieki).toEqual([]);
  });

  test('serwer ignoruje filtry, w tej samej grupie jest placement innego typu (APP_PREVIEW): nie trafia na listę do zdjęcia', () => {
    const w = uruchom({ stare: 7, nowe: 3, ignorujFiltry: true, inne: [{ group: 'G-IPHONE', type: 'APP_PREVIEW', n: 1 }], kroki: [{ apply: true, zastap: true }] });
    expect(usuniete(w.kroki[0])).toHaveLength(7);
    expect(w.pozostale).toHaveLength(1);
    expect(w.kroki[0].code).toBe(0);
  });

  test('dry-run pokazuje, że wpisy innej grupy/typu odrzucono (wiersz „zastąp” z liczbą odrzuconych), bez zapisów', () => {
    const w = uruchom({ stare: 7, nowe: 3, ignorujFiltry: true, inne: [{ group: 'G-IPAD', n: 2 }, { group: 'G-IPHONE', type: 'APP_PREVIEW', n: 1 }], kroki: [{ apply: false, zastap: true }] });
    const k = w.kroki[0];
    expect(k.code).toBe(0);
    expect(k.rows[0].action).toBe('zastąp');
    expect(k.rows[0].remove).toHaveLength(7);
    expect(k.rows[0].reason).toMatch(/zdejmę 7 placementów, wgram 3/);
    expect(k.rows[0].reason).toMatch(/pominięto wpisów innej grupy lub typu: 3/);
    expect(niepuste(k)).toEqual([]);
  });

  test.each([['grupa', 'placementGroup'], ['typ', 'placementType']])('odpowiedź bez atrybutu %s → odmowa zastąpienia tej grupy: wiersz „odmowa” z powodem, kod 1 w dry-runie i w apply', (brak, atrybut) => {
    const w = uruchom({ stare: 7, nowe: 3, bezAtrybutow: brak, kroki: [{ apply: false, zastap: true }, { apply: true, zastap: true }] });
    for (const k of w.kroki) {
      expect(k.code).toBe(1);
      expect(k.rows.map((r) => r.action)).toEqual(['odmowa']);
      expect(k.rows[0].reason).toMatch(/odmowa zastąpienia/);
      expect(k.rows[0].reason).toContain(atrybut);
      expect(k.rows[0].reason).toMatch(/G-IPHONE/);
      expect(tekst(k)).toMatch(/odmowa zastąpienia/);
      expect(niepuste(k)).toEqual([]); // także apply: żadnego wgrania ani zdjęcia
    }
    expect(w.placementy).toHaveLength(7);
    expect(w.obrazy).toBe(7); // żaden nowy obraz nie powstał
    expect(w.wycieki).toEqual([]);
  });

  test('zapytanie o placementy niesie filtry grupy i typu (filtr po stronie serwera zostaje jako pierwsza linia obrony)', () => {
    const k = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: false, zastap: true }] }).kroki[0];
    const zapytania = k.calls.filter((c) => /^\/v1\/appStoreVersionLocalizations\/LOC-[^/]+\/placements$/.test(c.p));
    expect(zapytania.length).toBeGreaterThan(0);
    for (const z of zapytania) {
      expect(decodeURIComponent(z.q)).toContain('filter[placementGroup]=G-IPHONE');
      expect(decodeURIComponent(z.q)).toContain('filter[placementType]=APP_SCREENSHOT');
    }
  });

  test('listPlacements: odrzuca wpisy innej grupy i typu (licznik `odrzucone`), brak atrybutu → wyjątek z `odmowaZastapienia`', () => {
    const w = kod(`import * as Z from ${ZRZUTY};
      const wpis = (id, g, t) => ({ id, type: 'appAssetLibraryPlacements', attributes: { ...(g ? { placementGroup: g } : {}), ...(t ? { placementType: t } : {}) }, relationships: { image: { data: { id: 'I' + id } } } });
      const klient = (data) => ({ call: async () => ({ data, included: data.map(x => ({ type: 'appAssetLibraryImages', id: 'I' + x.id, attributes: { referenceName: 'ref-' + x.id } })) }) });
      const dobre = await Z.listPlacements(klient([wpis('A', 'G', 'APP_SCREENSHOT'), wpis('B', 'H', 'APP_SCREENSHOT'), wpis('C', 'G', 'APP_PREVIEW'), wpis('D', 'G', 'APP_SCREENSHOT')]), 'LOC', 'G');
      let blad = null; try { await Z.listPlacements(klient([wpis('A', 'G', 'APP_SCREENSHOT'), wpis('B', null, 'APP_SCREENSHOT')]), 'LOC', 'G'); } catch (e) { blad = { odmowa: e.odmowaZastapienia === true, msg: e.message }; }
      process.stdout.write(JSON.stringify({ id: dobre.map(x => x.id), ref: dobre.map(x => x.ref), odrzucone: dobre.odrzucone, blad }));`) as {
      id: string[]; ref: string[]; odrzucone: number; blad: { odmowa: boolean; msg: string } | null };
    expect(w.id).toEqual(['A', 'D']);
    expect(w.ref).toEqual(['ref-A', 'ref-D']);
    expect(w.odrzucone).toBe(2);
    expect(w.blad?.odmowa).toBe(true);
    expect(w.blad?.msg).toMatch(/placementGroup/);
  });
});

describe('RZ4-07: ochrona wersji w sklepie (placementy 1.0 rozłączne ze zdejmowanymi)', () => {
  test('wersja 1.0 ma własne placementy (rozłączne): dry-run wypisuje „Placementy 1.0 rozłączne: tak”, kod 0, zero zapisów', () => {
    const k = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: false, zastap: true }] }).kroki[0];
    expect(k.code).toBe(0);
    expect(tekst(k)).toMatch(/Placementy 1\.0 rozłączne: tak/);
    expect(niepuste(k)).toEqual([]);
  });

  test('apply: odczyt placementów wersji w sklepie poprzedza pierwszy zapis (obrazy, DELETE), a wynik końcowy jak dotąd', () => {
    const w = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: true, zastap: true }] });
    const k = w.kroki[0]; const t = tagi(k);
    expect(k.code).toBe(0);
    const sklep = k.calls.findIndex((c) => /^\/v1\/appStoreVersionLocalizations\/LOCPUB-[^/]+\/placements$/.test(c.p));
    expect(sklep).toBeGreaterThanOrEqual(0);
    expect(sklep).toBeLessThan(k.calls.findIndex((c) => c.m !== 'GET'));
    expect(sklep).toBeLessThan(t.indexOf('DELETE placement'));
    expect(w.placementy).toEqual(NOWE);
  });

  test.each([1, 7])('wspólny id (%i z 7 zdejmowanych jest też w wersji 1.0): dry-run kod 1 i „rozłączne: nie” z id; apply kod 1, 0 × DELETE, 0 zapisów, nic nie wgrano', (wspolne) => {
    const w = uruchom({ stare: 7, nowe: 3, sklep: { wspolne }, kroki: [{ apply: false, zastap: true }, { apply: true, zastap: true }] });
    for (const k of w.kroki) {
      expect(k.code).toBe(1);
      expect(tekst(k)).toMatch(/Placementy 1\.0 rozłączne: nie/);
      expect(tekst(k)).toMatch(/odmowa zastąpienia/);
      expect(tekst(k)).toMatch(/PLC-\d+/); // wspólne id w raporcie
      expect(k.rows.map((r) => r.action)).toEqual(['odmowa']);
      expect(usuniete(k)).toEqual([]);
      expect(niepuste(k)).toEqual([]);
    }
    expect(w.placementy).toHaveLength(7);
    expect(w.obrazy).toBe(7); // nowe obrazy nie zostały nawet wgrane
    expect(w.wycieki).toEqual([]);
  });

  test.each([
    ['lista lokalizacji wersji w sklepie', { m: 'GET', tag: 'GET /v1/appStoreVersions/V0/appStoreVersionLocalizations', nth: 1, status: 500 }],
    ['lista placementów wersji w sklepie', { m: 'GET', tag: 'GET /v1/appStoreVersionLocalizations/LOCPUB-pl/placements', nth: 1, status: 403 }],
  ])('nie da się odczytać wersji w sklepie (%s) → odmowa: kod 1, 0 × DELETE, 0 zapisów, raport mówi, czego nie sprawdzono', (_nazwa, awaria) => {
    const w = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: false, zastap: true, awaria }, { apply: true, zastap: true, awaria }] });
    for (const k of w.kroki) {
      expect(k.code).toBe(1);
      expect(tekst(k)).toMatch(/odmowa zastąpienia/);
      expect(tekst(k)).toMatch(/nie (da się|udało się) odczytać wersji w sklepie/);
      expect(tekst(k)).not.toMatch(/rozłączne: tak/);
      expect(usuniete(k)).toEqual([]);
      expect(niepuste(k)).toEqual([]);
    }
    expect(w.placementy).toHaveLength(7);
  });

  test('brak wersji w sprzedaży (aplikacja jeszcze nie wydana) → nie ma z czym porównać: kontrola zaliczona z adnotacją, zastąpienie działa', () => {
    const w = uruchom({ stare: 7, nowe: 3, sklep: null, kroki: [{ apply: false, zastap: true }, { apply: true, zastap: true }] });
    expect(w.kroki[0].code).toBe(0);
    expect(tekst(w.kroki[0])).toMatch(/Placementy wersji w sklepie rozłączne: tak \(brak wersji w sprzedaży/);
    expect(w.kroki[1].code).toBe(0);
    expect(w.placementy).toEqual(NOWE);
  });

  test('bez flagi zastąp kontrola nie biegnie (zachowanie bez zmian: zero odczytów wersji w sklepie)', () => {
    const k = uruchom({ stare: 7, kroki: [{ apply: false }] }).kroki[0];
    expect(k.calls.filter((c) => /LOCPUB|\/V0\//.test(c.p))).toEqual([]);
    expect(tekst(k)).not.toMatch(/rozłączne/);
  });
});

describe('RZ4-02: zdejmowanie czeka na przetworzenie nowych obrazów', () => {
  test.each(['FAILED'])('nowy obraz kończy jako %s → kod 1, 0 × DELETE, 0 nowych placementów, 7 starych zostaje, komunikat „nic nie zdjęto”', (stan) => {
    const w = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: true, zastap: true, przetwarzanie: { stan } }] });
    const k = w.kroki[0];
    expect(k.code).toBe(1);
    expect(usuniete(k)).toEqual([]);
    expect(tagi(k).filter((t) => t === 'POST placement')).toEqual([]);
    expect(w.placementy).toHaveLength(7);
    expect(k.rows[0].error).toMatch(/nie powiodło się/);
    expect(k.rows[0].error).toMatch(/nic nie zdjęto, strona bez zmian/);
  });

  test('po FAILED ponowny przebieg (obraz przetworzony) kończy zadanie: stan końcowy = nowe zrzuty, stare obrazy nadal w bibliotece', () => {
    const w = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: true, zastap: true, przetwarzanie: { stan: 'FAILED' } }, { apply: true, zastap: true }] });
    expect(w.kroki[0].code).toBe(1);
    expect(w.kroki[1].code).toBe(0);
    expect(w.placementy).toEqual(NOWE);
    expect(w.usunieteObrazy).toBe(0);
  });

  test('obraz przechodzi UPLOAD_COMPLETE przez 2 odczyty stanu: DELETE dopiero po ostatnim odczycie stanu obrazu, potem normalny stan końcowy', () => {
    const w = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: true, zastap: true, przetwarzanie: { stan: 'UPLOAD_COMPLETE', czytania: 2 } }] });
    const k = w.kroki[0]; const t = tagi(k);
    expect(k.code).toBe(0);
    const odczytyObrazow = t.map((x, i) => (x === 'GET /v1/appAssetLibraryImages/{id}' ? i : -1)).filter((i) => i >= 0);
    expect(odczytyObrazow.length).toBeGreaterThanOrEqual(3 * 3); // 3 obrazy × (2 stany pośrednie + gotowy)
    expect(Math.max(...odczytyObrazow)).toBeLessThan(t.indexOf('DELETE placement'));
    expect(w.placementy).toEqual(NOWE);
  });

  test.each(['UPLOAD_COMPLETE', 'AWAITING_UPLOAD'])('obraz nigdy nie wychodzi ze stanu %s (do limitu czekania) → kod 1, 0 × DELETE, 7 starych zostaje, „trwa zbyt długo”', (stan) => {
    const w = uruchom({ stare: 7, nowe: 3, kroki: [{ apply: true, zastap: true, przetwarzanie: { stan } }] });
    const k = w.kroki[0];
    expect(k.code).toBe(1);
    expect(usuniete(k)).toEqual([]);
    expect(tagi(k).filter((t) => t === 'POST placement')).toEqual([]);
    expect(w.placementy).toHaveLength(7);
    expect(k.rows[0].error).toMatch(/trwa zbyt długo/);
    expect(k.rows[0].error).toMatch(/nic nie zdjęto/);
  });
});
