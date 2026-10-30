// Granice brakujące w wektorach roli 02 (zgłoszenia Z07-07, Z07-08; strategia §3.5: poniżej, na, powyżej).
// Wyrocznia: decyzje z ID w komentarzu każdego bloku. Tam, gdzie decyzja nie rozstrzyga, test sprawdza tylko część
// rozstrzygniętą, a reszta jest w raporcie roli 07 jako [DO USTALENIA] (np. `zostalo` u Pro).
import { startDnia, mozeZaczacDzien } from '../../../src/domena/limit';
import { decyzja } from '../../../src/domena/dostep';
import type { Odczyt } from '../../../src/domena/dostep';
import { PRODUKTY_PRO, PRZERWA_NOWEGO_DNIA_MS, OKNO_OFFLINE_PRO_MS } from '../../../src/konfiguracja';
import { TERAZ, GODZ, DZIEN, dniListopada } from './pomocnicze';

const DZIS = '2026-11-08';
const PELNY = dniListopada(1, 2, 3, 4, 5); // 5 z 5 dni bez Pro (P-057 D2)
const TRZY = dniListopada(1, 2, 3); // 3 z 5
const wejscie = (dni: { data: string; pro: boolean }[], ostatniPlus: number | null, pro = false) => ({ dni, dzis: DZIS, teraz: TERAZ, ostatniPlus, pro });

// P-057 (D3): „+1 po północy otwiera nowy dzień tylko po przerwie ≥ 60 min od poprzedniego +1”.
// Przerwa < 60 min → praca w toku (bez nowego dnia, L-04); przerwa ≥ 60 min → start nowego dnia (blokada na limicie, L-04b).
describe('R-098 / Z07-07 przerwa 60 min na styku (P-057 D3)', () => {
  test('R-098 / Z07-07 stała przerwy = 60 min (P-057 D3) i 5 z 5, przerwa dokładnie 60 min → nowy dzień ponad limit: blokada', () => {
    expect(PRZERWA_NOWEGO_DNIA_MS).toBe(GODZ);
    expect(startDnia(wejscie(PELNY, TERAZ - GODZ))).toEqual({ dozwolone: false, zapis: null, zostalo: 0 });
  });
  test('R-098 / Z07-07 5 z 5, przerwa 59:59,999 → praca w toku: dozwolone bez nowego dnia', () => {
    expect(startDnia(wejscie(PELNY, TERAZ - GODZ + 1))).toEqual({ dozwolone: true, zapis: null, zostalo: 0 });
  });
  test('R-098 / Z07-07 5 z 5, przerwa 60 min + 1 ms → nowy dzień ponad limit: blokada', () => {
    expect(startDnia(wejscie(PELNY, TERAZ - GODZ - 1))).toEqual({ dozwolone: false, zapis: null, zostalo: 0 });
  });
  test('R-098 / Z07-07 3 z 5, przerwa dokładnie 60 min → nowy darmowy dzień zapisany', () => {
    expect(startDnia(wejscie(TRZY, TERAZ - GODZ))).toEqual({ dozwolone: true, zapis: { data: DZIS, pro: false }, zostalo: 1 });
  });
  test('R-098 / Z07-07 3 z 5, przerwa 59:59,999 → praca w toku: dzień nie zapisany, zostało 2', () => {
    expect(startDnia(wejscie(TRZY, TERAZ - GODZ + 1))).toEqual({ dozwolone: true, zapis: null, zostalo: 2 });
  });
  test('R-098 / Z07-07 KP-13 mozeZaczacDzien: 5 z 5, przerwa dokładnie 60 min → limit zawczasu', () => {
    expect(mozeZaczacDzien(wejscie(PELNY, TERAZ - GODZ))).toEqual({ limitZawczasu: true, ostatniDarmowy: false, zostalo: 0 });
  });
  test('R-098 / Z07-07 KP-13 mozeZaczacDzien: 5 z 5, przerwa 59:59,999 → bez komunikatu (praca w toku)', () => {
    expect(mozeZaczacDzien(wejscie(PELNY, TERAZ - GODZ + 1))).toEqual({ limitZawczasu: false, ostatniDarmowy: false, zostalo: 0 });
  });
});

// Różnica 0 i czas z przyszłości: D3 (przerwa 0 < 60 min → praca w toku); L-15 (ostatnie +1 z przyszłości to nie praca w toku).
describe('R-098 / Z07-07 różnica czasu 0 (P-057 D3, wektor L-15)', () => {
  test('R-098 / Z07-07 5 z 5, ostatnie +1 w tej samej milisekundzie (różnica 0) → praca w toku', () => {
    expect(startDnia(wejscie(PELNY, TERAZ))).toEqual({ dozwolone: true, zapis: null, zostalo: 0 });
  });
  test('R-098 / Z07-07 5 z 5, różnica 1 ms → praca w toku', () => {
    expect(startDnia(wejscie(PELNY, TERAZ - 1))).toEqual({ dozwolone: true, zapis: null, zostalo: 0 });
  });
  test('R-098 / Z07-07 5 z 5, ostatnie +1 1 ms w przyszłości → nie praca w toku (L-15): blokada', () => {
    expect(startDnia(wejscie(PELNY, TERAZ + 1))).toEqual({ dozwolone: false, zapis: null, zostalo: 0 });
  });
});

// P-065 (2a): linia „1 free crafting day left in {month}” tylko w wersji darmowej (Pro = bez limitu, P-057 D1); KP-13.
// `zostalo` u Pro: decyzja mówi tylko, że Pro nie widzi licznika dni (Z-04) — wartość pola [DO USTALENIA].
describe('Z07-07 / R-099 ostatniDarmowy u Pro (P-065 (2a))', () => {
  test('Z07-07 R-099 KP-13 Pro, 4 z 5 dni bez Pro, nowy dzień → bez linii o ostatnim darmowym dniu i bez limitu', () => {
    expect(mozeZaczacDzien(wejscie(dniListopada(1, 2, 3, 4), TERAZ - 2 * GODZ, true))).toMatchObject({ limitZawczasu: false, ostatniDarmowy: false });
  });
  test('Z07-07 R-099 KP-13 ta sama sytuacja bez Pro → linia o ostatnim darmowym dniu (kontrola trójki, Z-06)', () => {
    expect(mozeZaczacDzien(wejscie(dniListopada(1, 2, 3, 4), TERAZ - 2 * GODZ, false))).toEqual({ limitZawczasu: false, ostatniDarmowy: true, zostalo: 1 });
  });
});

// KP-15 + L-02: rozpoczęty dzień trwa do końca; P-057 D5: dzień z Pro nie liczy się do limitu. Pro wygasa w trakcie dnia.
describe('Z07-07 / R-100 dzień zaczęty z Pro, Pro wygasło tego dnia (KP-15, L-02, D5)', () => {
  const dni = [...PELNY, { data: DZIS, pro: true }];
  test('Z07-07 R-100 KP-15 5 z 5 bez Pro + dziś dzień z Pro, teraz bez Pro → dalej dozwolone, bez nowego zapisu', () => {
    expect(startDnia(wejscie(dni, TERAZ - 2 * GODZ, false))).toEqual({ dozwolone: true, zapis: null, zostalo: 0 });
  });
  test('Z07-07 R-100 KP-13 ten sam dzień: bez limitu zawczasu', () => {
    expect(mozeZaczacDzien(wejscie(dni, TERAZ - 2 * GODZ, false))).toEqual({ limitZawczasu: false, ostatniDarmowy: false, zostalo: 0 });
  });
});

// NFR-PIE-001 (kryteria.json: „z datą 1. i ostatniego dnia miesiąca”), KP-12 („nigdy przed licznikiem przy pierwszym
// uruchomieniu”), P-057 D2 (miesiąc kalendarzowy): świeża instalacja liczy bez przeszkód także w ostatnim dniu miesiąca.
describe('NFR-PIE-001 / R-108 pierwsze +1 świeżej instalacji na granicy miesiąca', () => {
  test.each([['2026-11-30'], ['2026-12-31'], ['2027-02-28'], ['2028-02-29']] as const)('NFR-PIE-001 KP-12 świeża instalacja, pierwsze +1 w dniu %s', (dzis) => {
    const w = { dni: [], dzis, teraz: TERAZ, ostatniPlus: null, pro: false };
    expect(startDnia(w)).toEqual({ dozwolone: true, zapis: { data: dzis, pro: false }, zostalo: 4 });
    expect(mozeZaczacDzien(w)).toEqual({ limitZawczasu: false, ostatniDarmowy: false, zostalo: 5 });
  });
});

// KP-01: limit raz wydany tylko się luzuje (N rośnie) — parametr `limit` musi działać (R-103: wymuszona stała przechodzi).
describe('KP-01 / R-103 parametr limit', () => {
  test('KP-01 R-103 limit podniesiony do 6: przy 5 użytych dniach szósty nowy dzień jest darmowy', () => {
    expect(startDnia({ ...wejscie(PELNY, null), limit: 6 })).toEqual({ dozwolone: true, zapis: { data: DZIS, pro: false }, zostalo: 0 });
  });
});

// Dostęp (KP-06; dostep.mjs: „ostatni znany stan, ale nie dłużej niż do końca opłaconego okresu”).
const MIES = 'oczko.pro.monthly';
const ROK = 'oczko.pro.yearly';
const sklep = (...u: { produkt: string; wygasa: number | null }[]): Odczyt => ({ zrodlo: 'sklep', uprawnienia: u.map((x) => ({ ...x, odebrane: false })) });

// R-113: dwie subskrypcje naraz — opłacony okres kończy się z późniejszą (Z07-08, W-19 w propozycji).
describe('Z07-08 / R-113 dwie aktywne subskrypcje (KP-06)', () => {
  test.each([
    ['miesięczna, potem roczna', [{ produkt: MIES, wygasa: TERAZ + DZIEN }, { produkt: ROK, wygasa: TERAZ + 30 * DZIEN }]],
    ['roczna, potem miesięczna', [{ produkt: ROK, wygasa: TERAZ + 30 * DZIEN }, { produkt: MIES, wygasa: TERAZ + DZIEN }]],
  ] as const)('Z07-08 R-113 KP-06 %s → dostęp ze sklepu, pamięć do późniejszej ważności', (_n, u) => {
    const d = decyzja(sklep(...u), null, TERAZ, PRODUKTY_PRO);
    expect({ dostep: d.dostep, powod: d.powod, wygasa: d.pamiec?.wygasa, produkty: [...(d.pamiec?.produkty ?? [])].sort() }).toEqual({
      dostep: true, powod: 'sklep', wygasa: TERAZ + 30 * DZIEN, produkty: [MIES, ROK].sort(),
    });
  });
  test('Z07-08 R-113 KP-06 brak sieci po końcu krótszej, przed końcem dłuższej → dostęp z pamięci', () => {
    const d = decyzja(sklep({ produkt: MIES, wygasa: TERAZ + DZIEN }, { produkt: ROK, wygasa: TERAZ + 30 * DZIEN }), null, TERAZ, PRODUKTY_PRO);
    const pozniej = TERAZ + 2 * DZIEN;
    expect(decyzja({ zrodlo: 'blad' }, d.pamiec, pozniej, PRODUKTY_PRO)).toEqual({ dostep: true, powod: 'pamiec', pamiec: d.pamiec });
  });
});

// R-114: styk `wygasa` z `teraz`. 1 ms przed końcem okresu Pro trwa; po końcu nie (W-12, W-16); sam styk niżej (P-103 (3a)).
describe('Z07-08 / R-114 wygasa wobec teraz (KP-06)', () => {
  test('Z07-08 R-114 KP-06 sklep: wygasa = teraz + 1 ms → dostęp', () => {
    expect(decyzja(sklep({ produkt: MIES, wygasa: TERAZ + 1 }), null, TERAZ, PRODUKTY_PRO)).toEqual({
      dostep: true, powod: 'sklep', pamiec: { produkty: [MIES], wygasa: TERAZ + 1 },
    });
  });
  test('Z07-08 R-114 KP-06 pamięć bez sieci: wygasa = teraz + 1 ms → dostęp z pamięci', () => {
    const pamiec = { produkty: [MIES], wygasa: TERAZ + 1 };
    expect(decyzja({ zrodlo: 'blad' }, pamiec, TERAZ, PRODUKTY_PRO)).toEqual({ dostep: true, powod: 'pamiec', pamiec });
  });
  test('Z07-08 R-114 KP-06 sklep: wygasa = teraz − 1 ms → brak dostępu (jak W-16)', () => {
    expect(decyzja(sklep({ produkt: MIES, wygasa: TERAZ - 1 }), null, TERAZ, PRODUKTY_PRO)).toEqual({ dostep: false, powod: 'brak', pamiec: null });
  });
});

// R-114, styk `wygasa === teraz` (F07-01, P-116 (1)): rozstrzygnięte w P-103 (3a) i wektorach 02 W-20, W-20b, W-21b.
// Koniec okresu jest wyłączny w obu źródłach, ale pamięć (ścieżka błędu sklepu) ma okno offline 7 dni po `wygasa`,
// więc w tej samej chwili sklep daje brak dostępu, a pamięć dostęp. Poprzedni test „sklep = pamięć” przeczył P-103 (3a).
describe('Z07-08 / R-114 styk wygasa === teraz (P-103 (3a), W-20, W-20b, W-21b)', () => {
  const OKNO = 7 * DZIEN; // P-103 (3a): „pamięć ważna 7 dni po `wygasa`” (jak Trening OFFLINE_GRACE_DAYS=7)
  test('Z07-08 R-114 P-103 (3a) stała okna offline = 7 dni', () => {
    expect(OKNO_OFFLINE_PRO_MS).toBe(OKNO);
  });
  test('Z07-08 R-114 W-20 sklep: wygasa = teraz → brak dostępu (koniec wyłączny)', () => {
    expect(decyzja(sklep({ produkt: MIES, wygasa: TERAZ }), { produkty: [MIES], wygasa: TERAZ + DZIEN }, TERAZ, PRODUKTY_PRO)).toEqual({ dostep: false, powod: 'brak', pamiec: null });
  });
  test('Z07-08 R-114 P-103 (3a) pamięć bez sieci: wygasa = teraz → dostęp z pamięci (okno offline), inaczej niż sklep', () => {
    const pamiec = { produkty: [MIES], wygasa: TERAZ };
    expect(decyzja({ zrodlo: 'blad' }, pamiec, TERAZ, PRODUKTY_PRO)).toEqual({ dostep: true, powod: 'pamiec', pamiec });
  });
  test('Z07-08 R-114 W-20b pamięć bez sieci: wygasa = teraz − 7 dni → brak dostępu (koniec okna wyłączny)', () => {
    const pamiec = { produkty: [MIES], wygasa: TERAZ - OKNO };
    expect(decyzja({ zrodlo: 'blad' }, pamiec, TERAZ, PRODUKTY_PRO)).toEqual({ dostep: false, powod: 'brak', pamiec });
  });
  test('Z07-08 R-114 W-21b pamięć bez sieci: wygasa = teraz − 7 dni + 1 ms → dostęp z pamięci', () => {
    const pamiec = { produkty: [MIES], wygasa: TERAZ - OKNO + 1 };
    expect(decyzja({ zrodlo: 'blad' }, pamiec, TERAZ, PRODUKTY_PRO)).toEqual({ dostep: true, powod: 'pamiec', pamiec });
  });
});
