// Luki pokrycia E3 (rola 07): rozmiar drutu w mm z numerem US (BR-PRJ-004/S1–S2, BR-ZAP-003/S1), włóczka w jardach (BR-ZAP-001/S1),
// stoper przy zablokowanym ekranie (BR-PRJ-008/S1) — poziom domena-Node, istniejące sygnatury.
// Wyrocznie: docs/tresci/wektory.json „druty” (DRT-M04000, DRT-M03000, DRT-M03250; rola 06), „jednostki” (JW-yd-437);
// scenariusze docs/brd/wymagania-projekt.md:40, :44, :80, docs/brd/wymagania-narzedzia.md:11, :33 (wartości w scenariuszu).
import fc from 'fast-check';
import { rozmiarUS } from '../../../src/domena/obliczenia/druty';
import { przelicz } from '../../../src/domena/obliczenia/jednostki';
import { czasSesjiMs, przejdzSesje, rozpocznijSesje } from '../../../src/domena/maszyny/sesja';
import { SESJA_MAKS_H } from '../../../src/konfiguracja';
import { WEKTORY_TRESCI, MIN, GODZ, opcjeWlasnosci } from '../../narzedzia/akceptacja';

function wektorDrutu(id: string) {
  const w = WEKTORY_TRESCI.druty.find((x) => x.id === id);
  if (!w) throw new Error(`Brak wektora ${id} w docs/tresci/wektory.json (druty)`);
  return w;
}

describe('RD-11 rozmiar drutu w projekcie i w narzędziach', () => {
  test('BR-PRJ-004/S1 RD-11-W1 DRT-M04000: drut 4 mm → numer US „6” (projekt pokazuje „4 mm (US 6)”, wymagania-projekt.md:40)', () => {
    const w = wektorDrutu('DRT-M04000');
    expect(w.mm).toBe(4);
    expect(rozmiarUS(w.mm, 'druty')).toBe(w.oczekiwane_us);
    expect(w.oczekiwane_us).toBe('6');
  });
  test('BR-PRJ-004/S2 RD-11-W3 DRT-M03000: drut 3 mm → brak numeru US (null, bez najbliższej wartości; wymagania-projekt.md:44)', () => {
    const w = wektorDrutu('DRT-M03000');
    expect(w.oczekiwane_us).toBeNull();
    expect(rozmiarUS(w.mm, 'druty')).toBeNull();
  });
  test('BR-ZAP-003/S1 RD-11-W2 DRT-M03250: drut 3,25 mm w zapasie narzędzi → „US 3” (lista „3,25 mm (US 3)”, wymagania-narzedzia.md:33)', () => {
    const w = wektorDrutu('DRT-M03250');
    expect(rozmiarUS(w.mm, 'druty')).toBe('3');
    expect(w.oczekiwane_us).toBe('3');
  });
});

describe('RD-03 włóczka z etykiety w jardach', () => {
  test('BR-ZAP-001/S1 RD-03-W1 JW-yd-437: 437 yd → 399,5928 m (tolerancja z wektora; zapas pokazuje 437 yd i 399,59 m, wymagania-narzedzia.md:11)', () => {
    const w = WEKTORY_TRESCI.jednostki.find((x) => x.id === 'JW-yd-437');
    if (!w || typeof w.oczekiwane !== 'number') throw new Error('Brak wektora JW-yd-437 w docs/tresci/wektory.json');
    const m = przelicz(437, 'yd→m');
    expect(Math.abs(m - w.oczekiwane)).toBeLessThanOrEqual(w.tolerancja ?? 1e-9);
    // Format „399,59” (2 miejsca, przecinek): [DO USTALENIA] RD — rachunek pokazu tu tylko jako kontrola wyroczni, nie kodu.
    expect(new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(w.oczekiwane)).toBe('399,59');
  });
});

describe('BR-PRJ-008 stoper sesji ze znaczników czasu (ADR-0013: czas ze znaczników, nie z odliczania)', () => {
  const T20 = Date.UTC(2026, 9, 22, 18, 0); // 20:00 Europe/Warsaw
  test('BR-PRJ-008/S1 start 20:00, blokada telefonu (brak zdarzeń między), zatrzymanie 20:45 → sesja 45 min (wymagania-projekt.md:80)', () => {
    const s = rozpocznijSesje(T20);
    const w = przejdzSesje(s, { rodzaj: 'zakoncz' }, T20 + 45 * MIN, SESJA_MAKS_H);
    if (!w.ok) throw new Error(`przejdzSesje: ${w.powod}`);
    expect(w.wartosc.stan).toBe('zakonczona');
    expect(czasSesjiMs(w.wartosc)).toBe(45 * MIN);
  });
  test('BR-PRJ-008/S1 własność: dowolny czas blokady d < SESJA_MAKS_H bez zdarzeń pośrednich → czas sesji = d (nic nie liczy w pamięci)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: SESJA_MAKS_H * GODZ - 1 }), (d) => {
        const w = przejdzSesje(rozpocznijSesje(T20), { rodzaj: 'zakoncz' }, T20 + d, SESJA_MAKS_H);
        expect(w.ok).toBe(true);
        if (w.ok) expect(czasSesjiMs(w.wartosc)).toBe(d);
      }),
      opcjeWlasnosci(),
    );
  });
});
