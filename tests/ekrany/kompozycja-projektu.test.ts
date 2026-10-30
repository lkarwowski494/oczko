// Kompozycja partii 5: teksty listy i kosza z modeli odczytu (klucze 04 fix-5, liczba mnoga przez t(), daty krótkie w formacie języka).
import { liniaDzis, ostatniaPraca, stanKosza, krotkaData } from '../../src/kompozycja/projekt';
import { stanListy } from '../../src/kompozycja/projekty';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { tEn } from './pomoc';

let j: Jezyk;
beforeAll(async () => { const t = await tEn(); j = { t, jezyk: () => 'en-US', zegar24h: () => false }; });

test('„last worked …”: 0 → today, 1 → yesterday, 2 / 41 → liczba mnoga', () => {
  expect([0, 1, 2, 41].map((n) => ostatniaPraca(n, j.t))).toEqual(['last worked today', 'last worked yesterday', 'last worked 2 days ago', 'last worked 41 days ago']);
});
test('linia dziś na liście: cel, po terminie, osiągnięty; brak terminu → null', () => {
  expect(liniaDzis({ cel: { rodzaj: 'cel', rzedy: 10 }, zrobione: 3 }, j.t)).toBe('Today: 3 of 10 rows');
  expect(liniaDzis({ cel: { rodzaj: 'cel', rzedy: 1 }, zrobione: 0 }, j.t)).toBe('Today: 0 of 1 row');
  expect(liniaDzis({ cel: { rodzaj: 'po_terminie', zostalo: 50 }, zrobione: 0 }, j.t)).toBe('Past the due date · 50 rows to go');
  expect(liniaDzis({ cel: { rodzaj: 'osiagniety' }, zrobione: 0 }, j.t)).toBe('Goal reached');
  expect(liniaDzis(null, j.t)).toBeNull();
});
test('krótka data z dnia RRRR-MM-DD bez przesunięcia strefy', () => {
  expect(krotkaData('2026-11-21', 'en-US')).toBe('Nov 21');
});
test('kosz: podpisy z rodzicem i terminem; licznik bez nazwy dostaje nazwę rodzaju', () => {
  const s = stanKosza([
    { rodzaj: 'licznik', id: 'l2', nazwa: '', rodzajLicznika: 'oczka', projekt: 'Harbor', projektNienazwany: false, projektUtworzonoMs: 0, czesc: 'Back', usunietoMs: 0, doDnia: '2026-11-21' },
    { rodzaj: 'czesc', id: 'c2', nazwa: 'Sleeve', rodzajLicznika: null, projekt: 'Harbor', projektNienazwany: false, projektUtworzonoMs: 0, czesc: null, usunietoMs: 0, doDnia: '2026-11-22' },
    { rodzaj: 'projekt', id: 'p2', nazwa: 'Scarf', rodzajLicznika: null, projekt: 'Scarf', projektNienazwany: false, projektUtworzonoMs: 0, czesc: null, usunietoMs: 0, doDnia: '2026-11-23' },
  ], j, { terazMs: 0, strefa: 'UTC' });
  expect(s).toEqual({ dni: 30, pozycje: [
    { rodzaj: 'licznik', id: 'l2', nazwa: 'Stitches', podpis: 'Counter in Harbor, Back · until Nov 21' },
    { rodzaj: 'czesc', id: 'c2', nazwa: 'Sleeve', podpis: 'Part of Harbor · until Nov 22' },
    { rodzaj: 'projekt', id: 'p2', nazwa: 'Scarf', podpis: 'Project · until Nov 23' },
  ] });
});
test('kosz: wzór (partia 6, P-229) — nazwa wzoru i podpis z projektem i terminem (tekst roboczy 08 do zatwierdzenia przez 04)', () => {
  const s = stanKosza([
    { rodzaj: 'wzor', id: 'w1', nazwa: 'Harbor chart', rodzajLicznika: null, projekt: 'Harbor', projektNienazwany: false, projektUtworzonoMs: 0, czesc: null, usunietoMs: 0, doDnia: '2026-11-21' },
  ], j, { terazMs: 0, strefa: 'UTC' });
  expect(s.pozycje).toEqual([{ rodzaj: 'wzor', id: 'w1', nazwa: 'Harbor chart', podpis: 'Pattern in Harbor · until Nov 21' }]);
});
test('kosz: projekt roboczy (sam i jako rodzic części) → etykieta „Counter from …”, nie data zapasowa (05 fix-6, dane.md „Projekt roboczy”)', () => {
  const u = Date.UTC(2026, 9, 20, 9, 5);
  const s = stanKosza([
    { rodzaj: 'czesc', id: 'c1', nazwa: 'Sleeve', rodzajLicznika: null, projekt: '2026-10-20', projektNienazwany: true, projektUtworzonoMs: u, czesc: null, usunietoMs: 0, doDnia: '2026-11-22' },
    { rodzaj: 'projekt', id: 'p1', nazwa: '2026-10-20', rodzajLicznika: null, projekt: '2026-10-20', projektNienazwany: true, projektUtworzonoMs: u, czesc: null, usunietoMs: 0, doDnia: '2026-11-23' },
  ], j, { terazMs: Date.UTC(2026, 9, 22), strefa: 'UTC' });
  expect(s.pozycje.map((p) => [p.nazwa, p.podpis])).toEqual([
    ['Sleeve', 'Part of Counter from Oct 20, 9:05 AM · until Nov 22'],
    ['Counter from Oct 20, 9:05 AM', 'Project · until Nov 23'],
  ]);
});
test('stanListy: linie terminu i ostatniej pracy tylko w toku; liczba kosza', () => {
  const p = { id: 'p1', nazwa: 'Harbor', nienazwany: false, utworzonoMs: 0, ostatniaPracaMs: 0, licznik: null, dniOdPracy: 41, dzis: { cel: { rodzaj: 'cel' as const, rzedy: 10 }, zrobione: 3 } };
  const s = stanListy({ wToku: [p], ukonczone: [{ ...p, id: 'p2' }], dni: null, kosz: 2 }, { zapytanie: '', j, terazMs: 0, strefa: 'UTC' });
  expect([s.wToku[0].termin, s.wToku[0].ostatniaPraca, s.ukonczone[0].ostatniaPraca ?? null, s.kosz]).toEqual(['Today: 3 of 10 rows', 'last worked 41 days ago', null, 2]);
});

import type { WidokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { stanProjektu } from '../../src/kompozycja/projekt';
const W: WidokProjektu = {
  id: 'p1', nazwa: 'Harbor', nienazwany: false, stan: 'w_toku', utworzonoMs: Date.UTC(2026, 9, 1), zmienionoMs: Date.UTC(2026, 9, 20, 10), ostatniaPracaMs: Date.UTC(2026, 9, 22, 10),
  notatka: '', narzedzie: 'druty', drutMm: 4, drutUS: '6', terminDzien: '2026-10-31', celDnia: { rodzaj: 'cel', rzedy: 10 }, zrobioneDzis: 3,
  postep: { rodzaj: 'procent', wartosc: 51 }, ukonczonoDzien: null, probka: null, // probka: mechanicznie po D5 (U-10)
  czesci: [
    { id: 'c1', nazwa: 'Back', rzedy: 60, cel: 96, celZPary: false, paraZ: null, calosc: null, liczniki: [{ id: 'l1', nazwa: '', rodzaj: 'rzedy', wartosc: 60, znaczenie: 'skonczone' }] },
    { id: 'c2', nazwa: 'Blanket', rzedy: 20, cel: null, celZPary: false, paraZ: null, calosc: 20, liczniki: [
      { id: 'l2', nazwa: 'Square 1', rodzaj: 'rzedy', wartosc: 12, znaczenie: 'skonczone' }, { id: 'l3', nazwa: '', rodzaj: 'rzedy', wartosc: 8, znaczenie: 'skonczone' }] },
  ],
};
test('stanProjektu: termin, szczegóły z US, pusta notatka = null, liczniki z nazwą rodzaju, całość z modelu (`licznikCalosci`, P-199 Q1a)', () => {
  const s = stanProjektu(W, { j, terazMs: Date.UTC(2026, 9, 22, 12), strefa: 'UTC' });
  expect(s.termin).toBe('Done by Oct 31 · today 3 of 10 rows');
  expect(s.szczegoly).toEqual({ narzedzie: 'Needles', rozmiar: '4 mm (US 6)', termin: 'Oct 31', probka: null }); // probka: pole U-10 (D5), mechanicznie
  expect(s.notatka).toBeNull();
  expect(s.ostatniaZmiana).toBe('Oct 22');
  expect(s.czesci[0].liczniki).toEqual([{ id: 'l1', nazwa: 'Rows', opis: '60 rows' }]);
  expect([s.czesci[0].calosc, s.czesci[1].calosc, s.czesci[1].liczniki?.[1]?.nazwa]).toEqual([null, 20, 'Rows']);
});
test('stanProjektu: gałęzie terminu RD-15 i brak terminu', () => {
  const linia = (z: Partial<WidokProjektu>) => stanProjektu({ ...W, ...z }, { j, terazMs: 0, strefa: 'UTC' }).termin;
  expect(linia({ celDnia: { rodzaj: 'po_terminie', zostalo: 5 } })).toBe('The due date Oct 31 has passed · 5 rows to go');
  expect(linia({ celDnia: { rodzaj: 'osiagniety' } })).toBe('Done by Oct 31 · goal reached');
  expect(linia({ celDnia: null })).toBe('Done by Oct 31 · set a goal for a part to get a daily goal');
  expect(linia({ terminDzien: null, celDnia: null })).toBeNull();
  expect(stanProjektu({ ...W, drutMm: 6.5, drutUS: null, narzedzie: 'szydelko' }, { j, terazMs: 0, strefa: 'UTC' }).szczegoly).toEqual({ narzedzie: 'Hook', rozmiar: '6.5 mm', termin: 'Oct 31', probka: null });
});
test('stanProjektu: daty ukończonego projektu z rokiem (daty historii), zakres wyboru od dnia startu do dziś; w toku brak', () => {
  const s = stanProjektu({ ...W, stan: 'ukonczony', ukonczonoDzien: '2026-10-20' }, { j, terazMs: Date.UTC(2026, 9, 22, 12), strefa: 'UTC' });
  expect(s.daty).toEqual({ start: 'Oct 1, 2026', koniec: 'Oct 20, 2026', startDzien: '2026-10-01', koniecDzien: '2026-10-20', dzis: '2026-10-22' });
  expect(stanProjektu(W, { j, terazMs: 0, strefa: 'UTC' }).daty).toBeNull();
});

test('U-10: wiersz „Swatch” w szczegółach — 22 stitches / 10 cm, 20 stitches / 4 in, bez próbki brak wartości', () => {
  const opcje = { j, terazMs: Date.UTC(2026, 9, 22, 12), strefa: 'UTC' };
  expect(stanProjektu({ ...W, probka: { oczka: 22, naCm: 10 } }, opcje).szczegoly?.probka).toBe('22 stitches / 10 cm');
  expect(stanProjektu({ ...W, probka: { oczka: 20, naCm: 10.16 } }, opcje).szczegoly?.probka).toBe('20 stitches / 4 in');
  expect(stanProjektu(W, opcje).szczegoly?.probka).toBeNull();
});

test('P-209: kosz — włóczka z nazwą i podpisem „Yarn · until …”, narzędzie z rozmiarem (US) albo opisem i „Needles or hook · until …”', () => {
  const baza = { rodzajLicznika: null, projekt: '', projektNienazwany: false, projektUtworzonoMs: 0, czesc: null, usunietoMs: 0, doDnia: '2026-11-25' };
  const s = stanKosza([
    { ...baza, rodzaj: 'wloczka', id: 'w1', nazwa: 'Fjord' },
    { ...baza, rodzaj: 'narzedzie', id: 'n1', nazwa: '', narzedzie: { rodzaj: 'druty', rozmiarMm: 4, opis: '' } },
    { ...baza, rodzaj: 'narzedzie', id: 'n2', nazwa: 'cable needle', narzedzie: { rodzaj: 'inne', rozmiarMm: null, opis: 'cable needle' } },
  ], j, { terazMs: 0, strefa: 'UTC' });
  expect(s.pozycje.map((p) => [p.rodzaj, p.nazwa, p.podpis])).toEqual([
    ['wloczka', 'Fjord', 'Yarn · until Nov 25'],
    ['narzedzie', '4 mm (US 6)', 'Needles or hook · until Nov 25'],
    ['narzedzie', 'cable needle', 'Needles or hook · until Nov 25'],
  ]);
});

test('P-307: wiersz „Swatch” z liczbą 1 — „1 stitch / 10 cm” (forma liczby mnogiej wg liczby oczek)', () => {
  const opcje = { j, terazMs: Date.UTC(2026, 9, 22, 12), strefa: 'UTC' };
  expect(stanProjektu({ ...W, probka: { oczka: 1, naCm: 10 } }, opcje).szczegoly?.probka).toBe('1 stitch / 10 cm');
});

