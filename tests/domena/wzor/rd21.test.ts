// Test 08 (partia 4; P-134 Q2a, Q3a; aneks 05 fix-4, P-139): RD-21 rząd wskazany znacznikiem wzoru = rząd w robocie, stan „przed schematem”,
// rząd notatki = s + 1. Wyrocznia: tests/wektory/brd.json RD-21-W1…W9 (07 nie dała testu tej reguły; DS-02: test z wektora BRD).
import { wartoscWyswietlana } from '../../../src/domena/licznik';
import { domyslnyRzadBazowy, polozenieZnacznika, type ZnacznikWzoru } from '../../../src/domena/znacznik-wzoru';
import { BLAD_DANYCH, liczba, licznikWektorow, wektoryReguly } from '../../narzedzia/akceptacja';

const Z: ZnacznikWzoru = { strona: 1, y: 0.5, wysokoscRzedu: 0.02, kierunek: 1, rzadBazowy: 1, wartoscPrzyUstawieniu: 0 };

describe('RD-21 ustawienie znacznika: rząd_bazowy = s_ust + 1 niezależnie od trybu (W1–W3)', () => {
  const wektory = wektoryReguly('RD-21').filter((w) => 'tryb [-]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-WZR-003 ${w.id} s_ust=${w.wejscie['s_ust [rz.]']} ${w.wejscie['tryb [-]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const s = liczba(w.wejscie['s_ust [rz.]']);
      const p = wartoscWyswietlana(s, w.wejscie['tryb [-]'] === 'rząd w trakcie' ? 'w_trakcie' : 'skonczone');
      const naLiczniku = w.wejscie['tryb [-]'] === 'rząd w trakcie' ? p.dziergany : p.skonczone;
      expect([naLiczniku, domyslnyRzadBazowy(s)]).toEqual([liczba(w.oczekiwane['liczba na liczniku [rz.]']), liczba(w.oczekiwane['rząd_bazowy [rz.]'])]);
    });
  });
  test('RD-21 liczność ustawienia: 3 wektory', () => { expect(wektory.length).toBe(3); licznik.wynik(wektory.length); });
});

describe('RD-21 znacznik po zmianach licznika (W4–W9)', () => {
  const wektory = wektoryReguly('RD-21').filter((w) => 's [rz.]' in w.wejscie);
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-WZR-003 ${w.id} (${w.rodzaj}) bazowy=${w.wejscie['rząd_bazowy [rz.]']} s_ust=${w.wejscie['s_ust [rz.]']} s=${w.wejscie['s [rz.]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const z = { ...Z, rzadBazowy: liczba(w.wejscie['rząd_bazowy [rz.]']), wartoscPrzyUstawieniu: liczba(w.wejscie['s_ust [rz.]']) };
      const wynik = polozenieZnacznika(z, liczba(w.wejscie['s [rz.]']));
      if (w.oczekiwane['rząd_z [rz.]'] === BLAD_DANYCH) return expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      expect(wynik.ok).toBe(true);
      if (!wynik.ok) return;
      const notatka = w.oczekiwane['rząd notatki [rz.]'];
      expect([wynik.wartosc.rzad, wynik.wartosc.przedSchematem, wynik.wartosc.rzadNotatki])
        .toEqual([liczba(w.oczekiwane['rząd_z [rz.]']), w.oczekiwane['stan [-]'] === 'przed schematem', notatka === null ? null : liczba(notatka)]);
    });
  });
  test('RD-21 liczność zmian: 6 wektorów; razem cała reguła (9)', () => {
    expect(wektory.length).toBe(6);
    expect(wektoryReguly('RD-21').length).toBe(9);
    licznik.wynik(wektory.length);
  });
  test('P-134 Q3a przed schematem: znacznik na rzędzie 1 schematu przyciętym do strony, nie „poza stroną”; ułamek s → bledne_dane', () => {
    // rzadBazowy 1, s_ust 40, s 38 → rząd −1; rząd 1 leży przy y = 0,5 (krok 0), więc znacznik stoi tam z oznaczeniem.
    const w = polozenieZnacznika({ ...Z, wartoscPrzyUstawieniu: 40 }, 38);
    expect(w).toEqual({ ok: true, wartosc: { strona: 1, rzad: -1, y: 0.5, pozaStrona: false, przedSchematem: true, rzadNotatki: null } });
    expect(polozenieZnacznika(Z, 1.5)).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});
