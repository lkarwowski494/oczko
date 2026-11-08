// Testy przed kodem p3a (rola 07 cz. 2, 2026-11-08): kontrakt testID licznika TO BE — docs/design/testid.md M3-TESTID-02 (ZM-04, ZM-05),
// P-580 (a) „Projekt ›” = `licznik-projekt-wejscie`, `licznik-projekt` zostaje na nazwie; P-581 (a) akcja „Cel”; P-583 powrót `nav-wstecz`.
// Wyrocznia: kontrakt testID (decyzje z ID), nie kod. Tylko id i kolejność akcji — bez wartości wyglądu (polecenie 07-menu). Wzorzec renderu: tests/ekrany/licznik-ax5.test.tsx.
// Czerwień na 767add4e: „Unable to find an element with testID …” / asercja obecności `nav-projekty` (pasek AS IS). 08 przenosi do tests/ekrany w commicie p3a.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Licznik } from '../../../src/ekrany/Licznik';
import type { Tlumacz } from '../../../src/ekrany/wspolne';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from '../../ekrany/pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const rysuj = () => render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
const kolejnosc = (ids: string[]) => {
  const wszystkie = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
  return ids.map((id) => wszystkie.indexOf(id));
};

test('ZM-04 / P-580: pięć akcji pod liczbą w kolejności makiety (Notatka, Wzór, Cel, Stoper, Historia) — „Wzór” także bez wzoru', () => {
  rysuj();
  const poz = kolejnosc(['licznik-akcja-notatka', 'licznik-wzor', 'licznik-cel', 'licznik-stoper', 'licznik-historia']);
  expect(poz.every((p) => p >= 0)).toBe(true);
  expect([...poz].sort((a, b) => a - b)).toEqual(poz);
  // akcje leżą pod liczbą (dzianina/ekrany.html, ekran „licznik”)
  const [wartosc] = kolejnosc(['licznik-wartosc']);
  expect(wartosc).toBeLessThan(poz[0]);
});

test('P-580 (a): „Projekt ›” (`licznik-projekt-wejscie`) to osobny przycisk nad nazwą; `licznik-projekt` niesie nazwę', () => {
  rysuj();
  expect(screen.getByTestId('licznik-projekt-wejscie')).toBeTruthy();
  expect(screen.getByTestId('licznik-projekt')).toHaveTextContent('Harbor');
  const [wejscie, nazwa] = kolejnosc(['licznik-projekt-wejscie', 'licznik-projekt']);
  expect(wejscie).toBeLessThan(nazwa);
});

test('P-583: na liczniku wstecz `nav-wstecz`, bez wejścia do listy `nav-projekty`', () => {
  rysuj();
  expect(screen.queryByTestId('nav-projekty')).toBeNull();
  expect(screen.getByTestId('nav-wstecz')).toBeTruthy();
});
