// Chwila ukończenia (F-19, F-37, F-53; U-9; BR-PRJ-015, BR-DAN-012/S1; design-spec.md:57, :66; ekrany.html `ukonczenie`).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Ukonczenie, type StanUkonczenia } from '../../src/ekrany/Ukonczenie';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
// BR-PRJ-015/S1: 1–21 października, 640 rzędów, 18 godzin, włóczka i zdjęcie
const STAN: StanUkonczenia = { nazwa: 'Harbor Sweater', okres: 'Oct 1 – Oct 21', dni: 21, rzedy: 640, czas: '18 h', czesci: 4,
  wloczka: [{ id: 'w1', nazwa: 'Fjord Wool, Slate', motki: 2, zuzyto: null }], zdjecie: 'file:///zdjecie.jpg' };
const LICZBY = { formatuj: (n: number) => String(n), parsuj: (x: string) => (x.trim() === '' || Number.isNaN(Number(x)) ? null : Number(x)) };
function pokaz(s: Partial<StanUkonczenia> = {}) {
  const system = atrapaSystemu();
  const oglos = jest.fn();
  const w = { naUdostepnij: jest.fn(), naGotowe: jest.fn() };
  render(<Ukonczenie stan={{ ...STAN, ...s }} t={t} oglos={oglos} system={system} liczby={LICZBY} {...w} />);
  return { system, oglos, w };
}

describe('Ukonczenie', () => {
  test('BR-PRJ-015/S1: karta — dni, godziny, rzędy, włóczka, zdjęcie, udostępnienie (ekrany.html:197–209)', () => {
    const { w } = pokaz();
    expect(screen.getByText('640')).toBeTruthy();
    expect(screen.getByText(/18 h/)).toBeTruthy();
    expect(screen.getByText(/21 crafting days/)).toBeTruthy(); // ekrany.html:201 „… · 23 crafting days”
    expect(screen.getByText(/Fjord Wool, Slate/)).toBeTruthy();
    expect(screen.getAllByRole('image').length).toBeGreaterThan(0);
    fireEvent.press(przycisk('Share', 'button')); // ekrany.html:197 aria-label="Share"
    expect(w.naUdostepnij).toHaveBeenCalledTimes(1);
  });

  test('BR-PRJ-015/S3: bez stopera karta nie pokazuje czasu (zamiast 0 godzin)', () => {
    pokaz({ czas: null });
    expect(screen.queryByText(/\b0 h\b|\d+ h\b|\bmin\b/)).toBeNull();
  });

  // P-150 / P-160 (moduly.md „Prośba o ocenę”): „Done” woła przypadek użycia; wywołanie systemowe zależy od bramki czyProsicOOcene
  // (tests/domena/prosba-o-ocene.test.ts, tests/dane/prosba-o-ocene-zapis.test.ts), więc ekran sam go nie wykonuje (zmiana 08, odsyłacz P-150).
  test('BR-DAN-012/S1: po zamknięciu karty „Done” jedno wywołanie przypadku użycia, bez bezpośredniej prośby z ekranu (ekrany.html:209, P-150)', () => {
    const { system, w } = pokaz();
    fireEvent.press(przycisk('Done', 'button'));
    expect(w.naGotowe).toHaveBeenCalledTimes(1);
    expect(system.prosbaOOcene).not.toHaveBeenCalled();
  });

  test('BR-PRJ-015 / NFR-DOS-001: ogłoszenie „Harbor Sweater moved to Finished.” (design-spec.md:66)', () => {
    const { oglos } = pokaz();
    expect(oglos).toHaveBeenCalledWith('Harbor Sweater moved to Finished.');
  });

  // Zmiana 08 (partia 5, F-37): przycisk „Enter yarn left over for …” z ekrany.html:206 zastąpiła grupa „Yarn used” z krokowcem zużycia
  // (design-spec „Zużycie włóczki przy ukończeniu”, P-126 (2a): makieta ma pytać „zużyto motków” jak BR-ZAP-002). Sens bez zmian: pytanie
  // o każdą włóczkę projektu, bez włóczki — pominięte. Szczegóły krokowca: tests/ekrany/ukonczenie-zapas.test.tsx.
  test('BR-PRJ-015 [macierz 04]: pytanie o włóczkę; bez włóczki w zapasie pominięte (design-spec „Zużycie włóczki przy ukończeniu”)', () => {
    pokaz();
    expect(screen.getByText('Yarn used')).toBeTruthy();
    expect(screen.getByRole('adjustable', { name: 'Skeins of Fjord Wool, Slate used' })).toBeTruthy();
    screen.unmount();
    pokaz({ wloczka: [] });
    expect(screen.queryByText('Yarn used')).toBeNull();
    expect(screen.queryByRole('adjustable')).toBeNull();
  });
});
