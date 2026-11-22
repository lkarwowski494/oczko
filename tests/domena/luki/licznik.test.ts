// Luki pokrycia E3 (rola 07), moduł licznik — poziom domena-Node.
// BR-LIC-017/S4–S5 (wpisanie w nowym dniu a limit, ER-27): wyrocznia wektory S-06, L-08 (docs/monetyzacja/wektory-limitu.json),
//   P-057 D4 (wpisanie zaczyna dzień limitu), moduly.md:77 (mapowanie rodzaju), RD-15 (wpisanie nie jest pracą), P-059 (2a).
// BR-LIC-018/S1–S3 (licznik całości z sekcji), BR-LIC-019/S3 (strażnik tylko dla rzędów, RD-17, ER-24),
// BR-WZR-003/S1 (znacznik idzie z licznikiem), BR-DNI-005/S2–S3 (cel stały, prucie dziś, RD-15) — wartości w scenariuszach BRD.
import fc from 'fast-check';
import { rodzajStraznika, startDnia, wolaStraznika } from '../../../src/domena/limit';
import { licznikCalosci } from '../../../src/domena/licznik-calosci';
import type { LicznikKawalka } from '../../../src/domena/licznik-calosci';
import { serieLicznika } from '../../../src/domena/straznik-rodzaj';
import { polozenieZnacznika } from '../../../src/domena/znacznik-wzoru';
import { stanDnia, wykonanieDnia } from '../../../src/domena/postep-dnia';
import type { ZmianaDnia } from '../../../src/domena/postep-dnia';
import { LIMIT_DNI_W_MIESIACU, STRAZNIK_OKNO_S, STRAZNIK_SERIA_ZDARZEN } from '../../../src/konfiguracja';
import { WEKTORY_LIMITU, dniListopada, TERAZ } from '../zakup/pomocnicze';
import { opcjeWlasnosci } from '../../narzedzia/akceptacja';

const wektorL = (id: string) => {
  const w = WEKTORY_LIMITU.startDnia.find((x) => x.id === id);
  if (!w) throw new Error(`Brak wektora ${id} w wektory-limitu.json`);
  return w;
};
const wektorS = (id: string) => {
  const w = WEKTORY_LIMITU.wolaStraznika.find((x) => x.id === id);
  if (!w) throw new Error(`Brak wektora ${id} w wektory-limitu.json`);
  return w;
};

describe('BR-LIC-017 wpisanie wartości w nowym dniu a limit (ER-27, P-057 D4, KP-12) — docs/brd/wymagania-licznik.md:232, :237', () => {
  test('BR-LIC-017/S4 2 z 5 dni użyte, dziś nic → wpisanie 57 zaczyna dzień limitu (zostały 2 z 5), a dziś nie jest dniem z robótką (RD-15)', () => {
    expect(wektorS('S-06').oczekiwane).toBe(true); // wyrocznia: wpisanie woła strażnika
    const rodzaj = rodzajStraznika('wpisanie');
    expect(rodzaj).toBe('wpisanie');
    expect(wolaStraznika({ rodzaj })).toBe(true);
    const dzis = '2026-11-09';
    const w = startDnia({ dni: dniListopada(1, 2), dzis, teraz: TERAZ, ostatniPlus: null, pro: false });
    expect(w).toEqual({ dozwolone: true, zapis: { data: dzis, pro: false }, zostalo: LIMIT_DNI_W_MIESIACU - 3 });
    expect(w.zostalo).toBe(2);
    const wpisanie: ZmianaDnia = { id: 'w1', rodzaj: 'wpisanie', dzien: dzis, rodzajLicznika: 'rzedy', cofa: [] };
    expect(wykonanieDnia([wpisanie], dzis)).toBe(0); // kalendarz: brak znacznika dnia z robótką (BR-DNI-001, P-059 (2a))
  });
  test('BR-LIC-017/S5 L-08 5 z 5 dni, dziś nic → wpisanie odrzucone przez strażnika (dozwolone: false, bez zapisu dnia)', () => {
    const l08 = wektorL('L-08');
    expect(wolaStraznika({ rodzaj: rodzajStraznika('wpisanie') })).toBe(true);
    expect(startDnia(l08.wejscie)).toEqual(l08.oczekiwane);
    expect(l08.oczekiwane).toEqual({ dozwolone: false, zapis: null, zostalo: 0 });
  });
});

describe('BR-LIC-018 licznik całości z sekcji jednego kawałka — docs/brd/wymagania-licznik.md:254–265', () => {
  const korpus = (gladki: number): LicznikKawalka[] => [
    { id: 'sciagacz', czescId: 'korpus', rodzaj: 'rzedy', wartosc: 20 },
    { id: 'gladki', czescId: 'korpus', rodzaj: 'rzedy', wartosc: gladki },
  ];
  test('BR-LIC-018/S1 ściągacz 20 + gładki 5 = 25; +1 w „gładki” (6) → całość 26', () => {
    expect(licznikCalosci(korpus(5), 'korpus')).toBe(25);
    expect(licznikCalosci(korpus(6), 'korpus')).toBe(26);
  });
  test('BR-LIC-018/S2 prucie w sekcji: gładki 5 → 4, całość 25 → 24', () => {
    expect(licznikCalosci(korpus(5), 'korpus')).toBe(25);
    expect(licznikCalosci(korpus(4), 'korpus')).toBe(24);
  });
  test('BR-LIC-018/S3 osobne kawałki „przód” i „rękaw lewy”: +1 w rękawie nie zmienia całości przodu', () => {
    const sweter = (rekaw: number): LicznikKawalka[] => [
      { id: 'p1', czescId: 'przod', rodzaj: 'rzedy', wartosc: 30 },
      { id: 'p2', czescId: 'przod', rodzaj: 'rzedy', wartosc: 12 },
      { id: 'r1', czescId: 'rekaw-lewy', rodzaj: 'rzedy', wartosc: rekaw },
    ];
    expect(licznikCalosci(sweter(10), 'przod')).toBe(42);
    expect(licznikCalosci(sweter(11), 'przod')).toBe(42);
    expect(licznikCalosci(sweter(11), 'rekaw-lewy')).toBeNull(); // jeden licznik rzędów: bez całości (P-199 Q1a, zmiana 05 fix-6 — wyjątek nazwany jak P-176)
  });
});

describe('BR-LIC-019 strażnik tylko dla liczników rzędów (RD-17, ER-24) — docs/brd/wymagania-licznik.md:279', () => {
  const konf = { seria: STRAZNIK_SERIA_ZDARZEN, oknoS: STRAZNIK_OKNO_S };
  const piecW16s = [0, 400, 800, 1200, 1600].map((t, i) => ({ id: `d${i + 1}`, czasMs: 1_000_000 + t, zrodlo: 'aplikacja' as const })); // RD-17-W1
  test('BR-LIC-019/S3 licznik oczek: 5 dodań w 1,6 s → brak serii do pytania (ok, [])', () => {
    expect(serieLicznika({ rodzajLicznika: 'oczka', dodania: piecW16s, konf })).toEqual({ ok: true, wartosc: [] });
  });
  test('BR-LIC-019/S3 kontrola: ten sam ciąg w liczniku rzędów daje jedną serię z 5 dodaniami (RD-17-W1)', () => {
    const w = serieLicznika({ rodzajLicznika: 'rzedy', dodania: piecW16s, konf });
    if (!w.ok) throw new Error(w.powod);
    expect(w.wartosc.map((s) => [...s.ids].sort())).toEqual([['d1', 'd2', 'd3', 'd4', 'd5']]);
  });
});

describe('BR-WZR-003 znacznik bieżącego rzędu idzie z licznikiem — docs/brd/wymagania-projekt.md:234', () => {
  // Jednostki według ADR-0011 (uzupełnienie Z07-17, fix-2 W7): y i wysokość rzędu jako ułamek strony, kierunek w znaczniku (P-120 Q4a).
  const z = { strona: 2, y: 0.5, wysokoscRzedu: 0.1, rzadBazowy: 12, wartoscPrzyUstawieniu: 12, kierunek: -1 as const };
  test('BR-WZR-003/S1 znacznik na rzędzie 12 przy liczniku 12; +1 → rząd 13, przesunięcie o jedną wysokość rzędu, ta sama strona', () => {
    // 08 partia 4 (P-139, RD-21): wynik w Wynik z polami przedSchematem i rzadNotatki — te same asercje rzędu, strony i przesunięcia.
    const p0 = polozenieZnacznika(z, 12), p1 = polozenieZnacznika(z, 13);
    if (!p0.ok || !p1.ok) throw new Error('polozenieZnacznika: bledne_dane');
    const przed = p0.wartosc, po = p1.wartosc;
    expect(przed).toEqual({ strona: 2, rzad: 12, y: 0.5, pozaStrona: false, przedSchematem: false, rzadNotatki: 13 });
    expect(po.rzad).toBe(13);
    expect(po.strona).toBe(2);
    expect(Math.abs(po.y - przed.y)).toBeCloseTo(0.1, 9); // kierunek w znaczniku (P-118 Q2a); wyrocznia kierunku: znacznik-kierunek.test.ts
  });
  test('BR-WZR-003/S1 własność: rząd znacznika − rzadBazowy = wartość licznika − wartość przy ustawieniu', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 500 }), fc.integer({ min: 0, max: 500 }), fc.integer({ min: 0, max: 50 }), (bazowy, przyUst, krok) => {
        const p = polozenieZnacznika({ ...z, rzadBazowy: bazowy, wartoscPrzyUstawieniu: przyUst }, przyUst + krok);
        expect(p.ok && p.wartosc.rzad).toBe(bazowy + krok);
      }),
      opcjeWlasnosci(),
    );
  });
});

describe('BR-DNI-005 cel stały w ciągu dnia i wykonanie (RD-15, P-047) — docs/brd/wymagania-dni.md:79, :83', () => {
  const DZIS = '2026-10-22';
  const projekt = { suma: 320, przedDzis: 140, zrobioneTeraz: 140, termin: '2026-11-04', dzis: DZIS }; // RD-15-W1: cel 13 (zrobioneTeraz: P-136, sygnatura RD-15 z Z_teraz)
  const plus = (n: number, od = 1): ZmianaDnia[] => Array.from({ length: n }, (_, i) => ({ id: `p${od + i}`, rodzaj: 'plus', dzien: DZIS, rodzajLicznika: 'rzedy', cofa: [] }));
  test('BR-DNI-005/S2 5 rzędów dziś → cel nadal 13, wykonanie 5 z 13 (cel nie zależy od dzisiejszej pracy)', () => {
    expect(stanDnia({ ...projekt, zmiany: [] })).toEqual({ ok: true, wartosc: { cel: { rodzaj: 'cel', rzedy: 13 }, wykonanie: 0 } });
    expect(stanDnia({ ...projekt, zmiany: plus(5) })).toEqual({ ok: true, wartosc: { cel: { rodzaj: 'cel', rzedy: 13 }, wykonanie: 5 } });
  });
  test('BR-DNI-005/S3 5 rzędów dziś, prucie 2 → wykonanie 3 z 13', () => {
    const zmiany: ZmianaDnia[] = [...plus(5), { id: 'm1', rodzaj: 'minus', dzien: DZIS, rodzajLicznika: 'rzedy', cofa: [] }, { id: 'm2', rodzaj: 'minus', dzien: DZIS, rodzajLicznika: 'rzedy', cofa: [] }];
    expect(stanDnia({ ...projekt, zmiany })).toEqual({ ok: true, wartosc: { cel: { rodzaj: 'cel', rzedy: 13 }, wykonanie: 3 } });
  });
  test('BR-DNI-005/S3 RD-15 wykonanie bez cofniętych, bez wpisań, bez innych dni i bez liczników oczek', () => {
    const zmiany: ZmianaDnia[] = [
      ...plus(5),
      { id: 'u1', rodzaj: 'cofniecie', dzien: DZIS, rodzajLicznika: 'rzedy', cofa: ['p4', 'p5'] }, // cofnięte z historii
      { id: 'w1', rodzaj: 'wpisanie', dzien: DZIS, rodzajLicznika: 'rzedy', cofa: [] },
      { id: 'x1', rodzaj: 'plus', dzien: '2026-10-21', rodzajLicznika: 'rzedy', cofa: [] },
      { id: 'o1', rodzaj: 'plus', dzien: DZIS, rodzajLicznika: 'oczka', cofa: [] },
    ];
    expect(wykonanieDnia(zmiany, DZIS)).toBe(3);
  });
});
