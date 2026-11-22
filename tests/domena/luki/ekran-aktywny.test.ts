// Luki pokrycia E3 (rola 07): ekran nie gaśnie podczas liczenia (BR-LIC-013/S1–S2, docs/brd/wymagania-licznik.md:176, :180).
// Poziom: przypadek użycia z atrapą portu EkranAktywny (src/domena/porty.ts: „F-10, każdy tag wyłączany”, rejestr Expo 7).
// Realne niegaśnięcie ekranu: tylko urządzenie (ryzyko szczątkowe P-041, kryteria.json „tylko-urządzenie”).
import type { EkranAktywny } from '../../../src/domena/porty';
import { wejdzNaEkranLicznika } from '../../../src/przypadki-uzycia/ekran-aktywny';

/** Atrapa portu: dziennik wywołań i zbiór aktywnych tagów (wyłączenie tagu, którego nie włączono, to błąd w atrapie). */
function atrapa() {
  const wywolania: [string, string][] = [];
  const aktywne = new Set<string>();
  const ekran: EkranAktywny = {
    wlacz(tag) { wywolania.push(['wlacz', tag]); aktywne.add(tag); },
    wylacz(tag) { wywolania.push(['wylacz', tag]); if (!aktywne.delete(tag)) throw new Error(`wylacz(${tag}) bez wlacz`); },
  };
  return { ekran, wywolania, aktywne };
}

describe('BR-LIC-013 ekran nie gaśnie na ekranie licznika (F-10)', () => {
  test('BR-LIC-013/S1 opcja włączona: wejście → wlacz(tag) raz; wyjście → wylacz(ten sam tag), żaden tag nie zostaje aktywny', () => {
    const a = atrapa();
    const wyjdz = wejdzNaEkranLicznika({ ekran: a.ekran }, { opcjaWlaczona: true });
    expect(a.wywolania).toHaveLength(1);
    const [rodzaj, tag] = a.wywolania[0];
    expect(rodzaj).toBe('wlacz');
    expect(tag.length).toBeGreaterThan(0);
    expect([...a.aktywne]).toEqual([tag]);
    wyjdz();
    expect(a.wywolania).toEqual([['wlacz', tag], ['wylacz', tag]]);
    expect([...a.aktywne]).toEqual([]);
  });
  test('BR-LIC-013/S2 opcja wyłączona: ani wejście, ani wyjście nie wołają wlacz (telefon blokuje ekran jak zwykle)', () => {
    const a = atrapa();
    const wyjdz = wejdzNaEkranLicznika({ ekran: a.ekran }, { opcjaWlaczona: false });
    wyjdz();
    expect(a.wywolania.filter(([r]) => r === 'wlacz')).toEqual([]);
    expect([...a.aktywne]).toEqual([]);
  });
});
