/*
 * ZR10b (KO-212, 2026-11-25; P-1055): uwagi RZ4 do trybu „zastąp” w scripts/asc/zrzuty.mjs — fail-closed.
 *  - RZ4-01: lista do zdjęcia weryfikuje grupę i typ po stronie klienta (serwer może zignorować filtry); brak atrybutu = odmowa zastąpienia tej grupy.
 * Testy PRZED kodem (zasada wspólna 11), na atrapie serwera w pamięci (tests/wydanie/zrzuty-zastap-driver.mjs). Nic nie łączy się z Apple.
 */
import { join } from 'path';
import { execFileSync } from 'child_process';

const korzen = join(__dirname, '..', '..');
const DRIVER = join(__dirname, 'zrzuty-zastap-driver.mjs');
const ZRZUTY = JSON.stringify(join(korzen, 'scripts/asc/zrzuty.mjs'));

type Wiersz = { action: string; reason: string; error: string | null; written: boolean; remove: { id: string; ref: string }[] };
type Wywolanie = { m: string; p: string; tag: string; q: string };
type Krok = { code: number; rows: Wiersz[]; log: string[]; calls: Wywolanie[] };
type Wynik = { kroki: Krok[]; placementy: string[]; pozostale: string[]; obrazy: number; usunieteObrazy: number; wycieki: string[] };
const uruchom = (sc: Record<string, unknown>): Wynik => JSON.parse(execFileSync(process.execPath, [DRIVER, JSON.stringify(sc)], { encoding: 'utf8', maxBuffer: 1 << 26 }));
const kod = (src: string) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', src], { encoding: 'utf8', maxBuffer: 1 << 26 }));
const NOWE = ['01', '02', '03'].map((n) => `oczko-1.0/iphone/pl/${n}-ekran.png`);
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
      const wpis = (id, g, t) => ({ id, attributes: { ...(g ? { placementGroup: g } : {}), ...(t ? { placementType: t } : {}) }, relationships: { image: { data: { id: 'I' + id } } } });
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
