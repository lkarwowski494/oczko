// Test 08 (partia 4, P-136, P-134 Q1a, NZ-RD15): „który projekt dziś” po terminie liczy „zostało” na bieżąco (Z_teraz z `licznik.wartosc`),
// nie z końca wczoraj. Wyrocznia: BR-DNI-006 „Po terminie, ale wszystko zrobione” (docs/brd/wymagania-dni.md), RD-15-W13, RD-15-W14.
import { kolejnoscProjektow } from '../../src/dane/repozytoria/kalendarz';
import { czesc, licznik, projekt, ustawGlowe, zdarzenie, type Instr } from './pomocnicze/dane-wejsciowe';
import { GODZ, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const DZIS = '2026-10-22';
/** Chwila UTC dla czasu lokalnego Europe/Warsaw w październiku 2026 przed 25.10 (CEST, UTC+2). */
const waw = (dzien: number, h: number, m = 0) => Date.UTC(2026, 9, dzien, h - 2, m);
/** Szal: cel 320 rzędów, termin 21.10 (wczoraj), 300 rzędów do wczoraj, dziś `dzis` rzędów +1. */
function szal(dzis: number): Instr[] {
  const w: Instr[] = [
    projekt('szal', 'Szal', T0, { ostatnia: T0 }), czesc('szal-c', 'szal', 'Część', 1, { cel: 320 }),
    ...licznik('ls', 'szal-c', 300, { t: waw(20, 8) }), ['UPDATE projekt SET termin_dzien = ? WHERE id = ?', ['2026-10-21', 'szal']],
  ];
  for (let i = 1; i <= dzis; i++) w.push(zdarzenie(`d${i}`, 'ls', 'plus', 300 + i, [i > 1 ? `d${i - 1}` : 'ls-z300'], waw(22, 9, i)));
  if (dzis > 0) w.push(ustawGlowe('ls', 300 + dzis, `d${dzis}`));
  return w;
}
const czapka: Instr[] = [
  projekt('czapka', 'Czapka', T0, { ostatnia: T0 + GODZ }), czesc('czapka-c', 'czapka', 'Część', 1, { cel: 120 }),
  ...licznik('lc', 'czapka-c', 20, { t: waw(20, 10) }), ['UPDATE projekt SET termin_dzien = ? WHERE id = ?', ['2026-10-26', 'czapka']],
];

describe('BR-DNI-006 RD-15 po terminie z Z_teraz (P-134 Q1a)', () => {
  test('RD-15-W13 dziś +10 po terminie → „termin minął, zostało 10” (nie 20 z końca wczoraj), Szal na górze', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [...szal(10), ...czapka]);
    expect(await kolejnoscProjektow(s.baza, DZIS)).toEqual([
      { id: 'szal', nazwa: 'Szal', cel: { rodzaj: 'po_terminie', zostalo: 10 } },
      { id: 'czapka', nazwa: 'Czapka', cel: { rodzaj: 'cel', rzedy: 20 } },
    ]);
  });

  test('RD-15-W14 BR-DNI-006 „Po terminie, ale wszystko zrobione”: dziś +20 → „cel osiągnięty”, Szal za Czapką', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [...szal(20), ...czapka]);
    expect(await kolejnoscProjektow(s.baza, DZIS)).toEqual([
      { id: 'czapka', nazwa: 'Czapka', cel: { rodzaj: 'cel', rzedy: 20 } },
      { id: 'szal', nazwa: 'Szal', cel: { rodzaj: 'osiagniety' } },
    ]);
  });
});
