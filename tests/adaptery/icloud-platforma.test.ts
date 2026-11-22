// Adapter iCloud platformy i atrapa E2E (moduly.md „Kontrakt partii 7”, „Atrapa silnika w E2E”; P-230 Q1a, P-242): wybór adaptera,
// most do modułu Swift (JSON, base64, kod błędu wysyłki, potwierdzenie partii po obsłudze), tryby atrapy i scenariusze 48–51 na poziomie danych.
import type { PartiaIcloud } from '../../src/domena/porty';
import { naBase64, silnikNatywny, zBase64, type OczkoIcloudNatywny } from '../../src/platforma/icloud';
import { atrapaIcloud, ID_KONFLIKTU } from '../../src/platforma/icloud-atrapa';
import { dodajRzad, utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { kandydaciKonfliktu, sterownikSynchronizacji } from '../../src/przypadki-uzycia/synchronizacja';
import { przygotuj, MIN } from '../dane/pomocnicze/srodowisko';

describe('wybór adaptera (P-242)', () => {
  const zmienna = 'EXPO_PUBLIC_ICLOUD_FAKE';
  afterEach(() => { delete process.env[zmienna]; });
  test('bez atrapy: wiersz ukryty (ICLOUD_W_1_0 = false), brak modułu Swift → brak silnika', () => {
    jest.isolateModules(() => {
      const m = require('../../src/platforma/icloud') as typeof import('../../src/platforma/icloud');
      expect(m.przelacznikIcloudWidoczny()).toBe(false);
      expect(m.silnikIcloud({ tryb: null, baza: {} as never, zegar: {} as never, plik: { czytaj: () => null, zapisz: () => undefined } })).toBeNull();
    });
  });
  test('z atrapą: wiersz widoczny, silnik = atrapa z panelami e2e', () => {
    process.env[zmienna] = '1';
    jest.isolateModules(() => {
      const m = require('../../src/platforma/icloud') as typeof import('../../src/platforma/icloud');
      expect(m.przelacznikIcloudWidoczny()).toBe(true);
      expect(m.silnikIcloud({ tryb: 'wlaczony', baza: {} as never, zegar: {} as never, plik: { czytaj: () => null, zapisz: () => undefined } })?.e2e?.stan()).toEqual({ wyslane: 0, usuniete: false });
    });
  });
});

describe('most do modułu Swift', () => {
  function natywny() {
    const s: Record<string, (e: unknown) => void> = {};
    const zakonczone: [string, boolean][] = [];
    const n: OczkoIcloudNatywny & { zakonczone: [string, boolean][]; emituj(nazwa: string, e: unknown): void; blad: unknown } = {
      zakonczone, blad: null,
      statusKonta: async () => 'restricted-nieznany',
      uruchom: async () => undefined,
      wyslij: async () => { if (n.blad) throw n.blad; },
      wylacz: async () => undefined,
      usunStrefe: async () => { throw new Error('sieć'); },
      zakonczonoPartie: (id, ok) => { zakonczone.push([id, ok]); },
      addListener: ((nazwa: string, fn: (e: unknown) => void) => { s[nazwa] = fn; return { remove: () => { delete s[nazwa]; } }; }) as OczkoIcloudNatywny['addListener'],
      emituj: (nazwa, e) => s[nazwa]?.(e),
    };
    return n;
  }
  test('base64 stanu silnika w obie strony; null zostaje null', () => {
    const b = new Uint8Array([0, 1, 255, 128]);
    expect(zBase64(naBase64(b))).toEqual(b);
    expect(zBase64(null)).toBeNull();
  });
  test('nieznany status konta → nieznany; błąd wysyłki z code → {kod}; usunięcie strefy z błędem → Wynik zapis', async () => {
    const n = natywny();
    const s = silnikNatywny(n);
    expect(await s.statusKonta()).toBe('nieznany');
    n.blad = { code: 'brak_miejsca' };
    await expect(s.wyslij([])).rejects.toEqual({ kod: 'brak_miejsca' });
    n.blad = { code: 'COŚ' };
    await expect(s.wyslij([])).rejects.toEqual({ kod: 'inny' });
    expect(await s.usunStrefe()).toEqual({ ok: false, powod: 'zapis' });
  });
  test('partia: JSON → PartiaIcloud, potwierdzenie do Swift dopiero po obsłudze (ok albo błąd)', async () => {
    const n = natywny();
    const s = silnikNatywny(n);
    const odebrane: PartiaIcloud[] = [];
    let wynik: 'ok' | 'blad' = 'ok';
    s.odbieraj(async (p) => { odebrane.push(p); if (wynik === 'blad') throw new Error('x'); });
    n.emituj('partia', { id: 'p1', rekordy: JSON.stringify([{ encja: 'projekt', klucz: 'a', pola: { id: 'a' }, plik: null }]), usuniete: '[]', stanSilnika: naBase64(new Uint8Array([9])) });
    await new Promise((r) => setTimeout(r, 0));
    wynik = 'blad';
    n.emituj('partia', { id: 'p2', rekordy: '[]', usuniete: '[]', stanSilnika: null });
    await new Promise((r) => setTimeout(r, 0));
    expect(odebrane[0]).toEqual({ rekordy: [{ encja: 'projekt', klucz: 'a', pola: { id: 'a' }, plik: null }], usuniete: [], stanSilnika: new Uint8Array([9]) });
    expect(n.zakonczone).toEqual([['p1', true], ['p2', false]]);
  });
  test('pobranie (M1-117): faza do JS, potwierdzenie do Swift po obsłudze; nieznana faza nic nie wywołuje i kończy się błędem', async () => {
    const n = natywny();
    const s = silnikNatywny(n);
    const fazy: string[] = [];
    s.pobieranie(async (f) => { fazy.push(f); if (fazy.length === 2) throw new Error('x'); });
    n.emituj('pobranie', { id: 'f1', faza: 'poczatek' });
    n.emituj('pobranie', { id: 'f2', faza: 'koniec' });
    n.emituj('pobranie', { id: 'f3', faza: 'srodek' });
    await new Promise((r) => setTimeout(r, 0));
    expect(fazy).toEqual(['poczatek', 'koniec']);
    expect(n.zakonczone).toEqual([['f3', false], ['f1', true], ['f2', false]]);
  });
});

describe('most do modułu Swift: dane z granicy', () => {
  test('partia z błędnymi elementami: do JS idą tylko poprawne rekordy i klucze; zły JSON → potwierdzenie z błędem', async () => {
    const s: Record<string, (e: unknown) => void> = {};
    const zakonczone: [string, boolean][] = [];
    const n = {
      statusKonta: async () => 'available', uruchom: async () => undefined, wyslij: async () => undefined, wylacz: async () => undefined, usunStrefe: async () => undefined,
      zakonczonoPartie: (id: string, ok: boolean) => { zakonczone.push([id, ok]); },
      addListener: ((nazwa: string, fn: (e: unknown) => void) => { s[nazwa] = fn; return { remove: () => undefined }; }) as OczkoIcloudNatywny['addListener'],
    } satisfies OczkoIcloudNatywny;
    const odebrane: PartiaIcloud[] = [];
    silnikNatywny(n).odbieraj(async (p) => { odebrane.push(p); });
    s.partia({ id: 'p1', rekordy: JSON.stringify([{ encja: 'projekt', klucz: 'a', pola: { id: 'a' }, plik: null }, { encja: 7 }]), usuniete: JSON.stringify([{ encja: 'projekt', klucz: 'b' }, 3]), stanSilnika: null });
    s.partia({ id: 'p2', rekordy: '{zly', usuniete: '[]', stanSilnika: null });
    await new Promise((r) => setTimeout(r, 0));
    expect(odebrane).toEqual([{ rekordy: [{ encja: 'projekt', klucz: 'a', pola: { id: 'a' }, plik: null }], usuniete: [{ encja: 'projekt', klucz: 'b' }], stanSilnika: null }]);
    expect([...zakonczone].sort()).toEqual([['p1', true], ['p2', false]]); // potwierdzenia po id — kolejność dowolna
  });
});

describe('atrapa E2E (oczkoE2eIcloud) na prawdziwej bazie', () => {
  async function srodowisko(tryb: string, plik = { t: null as string | null }) {
    const s = await przygotuj();
    const a = atrapaIcloud({ tryb, baza: s.baza, zegar: s.zegar, plik: { czytaj: () => plik.t, zapisz: (t) => { plik.t = t; } } });
    const st = sterownikSynchronizacji({ ...s.z, synchronizacja: a, magazyn: s.magazyn });
    return { s, a, st, plik };
  }
  test('48: wyłączona → 0 wysłanych; po włączeniu > 0, skrzynka pusta; liczba w pliku przetrwa restart', async () => {
    const { s, a, st, plik } = await srodowisko('wlaczony');
    await st.start();
    const l = await utworzSzybkiLicznik(s.z);
    if (!l.ok) throw new Error(l.powod);
    await dodajRzad(s.z, { licznikId: l.wartosc.licznikId });
    expect(a.e2e?.stan().wyslane).toBe(0);
    expect((await st.wlacz()).stan).toBe('aktywna');
    expect(a.e2e?.stan().wyslane).toBeGreaterThan(0);
    expect(await s.baza.all('SELECT count(*) AS n FROM zmiana_icloud WHERE wyslano_nr IS NULL OR wyslano_nr < nr')).toEqual([{ n: 0 }]); // brak oczekujących (M1-117)
    expect(atrapaIcloud({ tryb: 'wlaczony', baza: s.baza, zegar: s.zegar, plik: { czytaj: () => plik.t, zapisz: () => undefined } }).e2e?.stan().wyslane).toBe(a.e2e?.stan().wyslane);
  });
  test('49: konflikt przy starcie — druga wersja pierwszego licznika (+5, „iPad (test)”, minutę wcześniej) → kandydaci 6 i 1', async () => {
    const pierwszy = await srodowisko('wlaczony');
    await pierwszy.st.start();
    const l = await utworzSzybkiLicznik(pierwszy.s.z);
    if (!l.ok) throw new Error(l.powod);
    await dodajRzad(pierwszy.s.z, { licznikId: l.wartosc.licznikId });
    await pierwszy.st.wlacz();
    pierwszy.s.zegar.przesun(10 * MIN);
    const a = atrapaIcloud({ tryb: 'konflikt', baza: pierwszy.s.baza, zegar: pierwszy.s.zegar, plik: { czytaj: () => null, zapisz: () => undefined } });
    const st = sterownikSynchronizacji({ ...pierwszy.s.z, synchronizacja: a, magazyn: pierwszy.s.magazyn });
    await st.start();
    expect(await pierwszy.s.baza.all('SELECT wartosc, konflikt FROM licznik WHERE id = ?', [l.wartosc.licznikId])).toEqual([{ wartosc: 1, konflikt: 1 }]);
    const k = await kandydaciKonfliktu(pierwszy.s.z, l.wartosc.licznikId);
    expect(k?.map((x) => [x.wartosc, x.urzadzenie, x.glowa === ID_KONFLIKTU])).toEqual([[6, 'iPad (test)', true], [1, 'iphone-test', false]]);
  });
  test('50: brak-konta → stan brak_konta; brak-miejsca → blad z przyczyną brak_miejsca', async () => {
    const bk = await srodowisko('brak-konta');
    await bk.st.start();
    expect((await bk.st.wlacz()).stan).toBe('brak_konta');
    const bm = await srodowisko('brak-miejsca');
    await bm.st.start();
    await utworzSzybkiLicznik(bm.s.z);
    expect(await bm.st.wlacz()).toMatchObject({ stan: 'blad', przyczyna: 'brak_miejsca' });
  });
  test('50 na świeżej instalacji (pusta skrzynka): włączenie i tak wysyła (utworzenie strefy to zapis) → brak miejsca widoczny', async () => {
    const bm = await srodowisko('brak-miejsca');
    await bm.st.start();
    expect(await bm.st.wlacz()).toMatchObject({ stan: 'blad', przyczyna: 'brak_miejsca' });
    const ok = await srodowisko('wlaczony');
    await ok.st.start();
    expect((await ok.st.wlacz()).stan).toBe('aktywna');
    expect(ok.a.e2e?.stan().wyslane).toBe(0);
  });
  test('51: usunięcie strefy zapisane w pliku buildu E2E', async () => {
    const { st, a, plik } = await srodowisko('wlaczony');
    await st.start();
    await st.wlacz();
    expect(a.e2e?.stan().usuniete).toBe(false);
    expect((await st.usunZIcloud()).ok).toBe(true);
    expect(JSON.parse(plik.t ?? '{}')).toMatchObject({ usuniete: true });
  });
});
