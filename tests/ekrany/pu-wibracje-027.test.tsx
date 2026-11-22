// PU-027 (katalog przypadków użycia, „Licznik”): „Wibracje” wył. → +1 nie woła portu haptyki; wł. → woła. Stan przełącznika po restarcie: tests/dane/preferencje.test.ts (zapis → nowy obiekt → odczyt).
// Poziom: komponentowy (Licznik z atrapą portu haptyki), bez symulatora — wynik PU to wywołanie portu, którego Maestro nie zobaczy.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, plusOk, stanLicznika, tEn, wywolaniaLicznika, zagrane } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

async function plusZWibracjami(wibracje: boolean) {
  const w = wywolaniaLicznika(async () => plusOk(1));
  const haptyka = atrapaHaptyki();
  const oglos = jest.fn();
  render(<Licznik stan={stanLicznika({ wibracje })} t={t} oglos={oglos} haptyka={haptyka} {...w} />);
  fireEvent.press(screen.getByTestId('licznik-plus'));
  await waitFor(() => expect(oglos).toHaveBeenCalledTimes(1)); // wynik ok dotarł do ekranu: haptyka i ogłoszenie idą razem (R-148)
  return haptyka;
}

test('PU-027: „Wibracje” wyłączone → +1 zapisuje i ogłasza, ale nie woła portu haptyki', async () => {
  const haptyka = await plusZWibracjami(false);
  expect(haptyka.zagraj).not.toHaveBeenCalled();
});

test('PU-027: „Wibracje” włączone → +1 woła port haptyki wzorcem „plus”', async () => {
  const haptyka = await plusZWibracjami(true);
  expect(zagrane(haptyka, 'plus')).toBe(1);
});
