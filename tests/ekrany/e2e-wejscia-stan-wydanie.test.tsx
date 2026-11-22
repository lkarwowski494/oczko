// FX6b (P-909), strona negatywna: bez `EXPO_PUBLIC_E2E=1` (build wydania, P-238) ani ekran licznika, ani formularz nazwy nie mają paneli diagnostycznych,
// a wpisywanie w pole nazwy i stuknięcia „+1”/„−1” działają jak dotąd.
delete process.env.EXPO_PUBLIC_E2E;
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FormularzNazwy } from '../../src/ekrany/Formularze';
import { tEn } from './pomoc';

test('formularz nazwy bez diagnostyki: brak panelu, pole przyjmuje tekst', async () => {
  const t = await tEn();
  render(<FormularzNazwy t={t} stan={{ projekt: '', czesc: '' }} naZapisz={async () => ({ ok: true, wartosc: undefined })} naAnuluj={() => undefined} />);
  fireEvent.changeText(screen.getByTestId('formularz-nazwa-projektu'), 'Harbor');
  expect(screen.getByTestId('formularz-nazwa-projektu').props.value).toBe('Harbor');
  expect(screen.queryByTestId('e2e-nazwa-wejscia')).toBeNull();
});
test('moduł paneli E2E nie jest ładowany poza buildem E2E (`paneleE2e` = null)', () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { paneleE2e } = require('../../src/platforma/tryb-e2e') as typeof import('../../src/platforma/tryb-e2e');
    expect(paneleE2e).toBeNull();
  });
});
