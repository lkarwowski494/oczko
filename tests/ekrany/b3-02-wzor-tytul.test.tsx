// B3-02 (P-663, fix11): tytuł wzoru z przełącznikiem ▾ miał numberOfLines 2, ale nie miał limitu skali (gałąź bez ▾ ma ×1,8). Przy ≥ 2 wzorach i AX5
// (fontScale 3,571) nazwa zajmowała 2 × ok. 79 pt. Jest nie liczy układu: test sprawdza limit na tekście obu gałęzi, 2 linie i ▾ z limitem, który się nie kurczy.
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { TytulWzoru } from '../../src/ekrany/WzorTytul';
import { MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU_TRESCI } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 3.571 }) }));
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const nic = jest.fn();
const pokaz = (przelacza: boolean) => render(<TytulWzoru t={t} nazwa="Sleeve chart" opis="PDF · 6 pages" przelacza={przelacza} naPrzelacz={nic} />);

test.each([[true], [false]])('AX5, przelacza=%s: tekst tytułu ma limit MAX_SKALA_TYTULOWA i najwyżej 2 linie', (przelacza) => {
  pokaz(przelacza);
  const tytul = screen.getByText('Sleeve chart');
  expect(tytul.props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
  expect(tytul.props.numberOfLines).toBe(2);
});

test('AX5, tytuł z ▾: znak ▾ rośnie najwyżej ×1,8 i nigdy nie jest kurczony (flexShrink 0)', () => {
  pokaz(true);
  const znak = screen.getByTestId('symbol-chevron.down', { includeHiddenElements: true });
  let rodzic = znak.parent; // najbliższy przodek ze stylem (dalej wrapper z flexShrink)
  while (rodzic && StyleSheet.flatten(rodzic.props.style)?.flexShrink === undefined) rodzic = rodzic.parent;
  expect(StyleSheet.flatten(rodzic?.props.style).flexShrink).toBe(0);
  expect(StyleSheet.flatten(znak.props.style).width).toBe(Math.round(ROZMIAR_SYMBOLU_TRESCI * MAX_SKALA_TYTULOWA));
});
