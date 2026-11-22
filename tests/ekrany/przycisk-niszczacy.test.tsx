// P-275 (2), 04 fix-8: przycisk niszczący (arkusz decyzji o nieodwracalnym usunięciu) z tokenów przyciskNiszczacyTlo / przyciskNiszczacyTekst
// w motywie jasnym i ciemnym (kontrast 6,36:1 i 9,98:1, docs/design/kontrast-tabela.txt); wcześniej tło `blad` i tekst `papier` (P-268).
// Test podmienia tokeny na odróżnialne — sprawdza, którego tokenu używa przycisk, nie przypadek wartości.
// P-553 (Dzianina): `kolor.<motyw>.przyciskNiszczacyTlo/Tekst` → `kolory.<motyw>.niszczacy/niszczacyTekst`, `przyciskNieaktywnyTlo` → `przyciskNieaktywny`.
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';

jest.mock('../../docs/design/tokeny.json', () => {
  const t = jest.requireActual('../../docs/design/tokeny.json');
  const odroznij = (k: Record<string, string>) => ({ ...k, niszczacy: '#010203', niszczacyTekst: '#040506', przyciskNieaktywny: '#0a0b0c', przyciskNieaktywnyTekst: '#0d0e0f' });
  return { ...t, kolory: { ...t.kolory, jasny: odroznij(t.kolory.jasny), ciemny: { ...odroznij(t.kolory.ciemny), niszczacy: '#070809' } } };
});
import { Przycisk } from '../../src/ekrany/Arkusz';

afterEach(() => jest.restoreAllMocks());

test.each([['jasny', 'light', '#010203'], ['ciemny', 'dark', '#070809']] as const)('motyw %s: tło i tekst z tokenów przycisku niszczącego', (_m, schemat, tlo) => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat);
  render(<Przycisk tekst="Delete everything" onPress={() => undefined} rodzaj="niszczacy" testID="p" />);
  expect(screen.getByTestId('p')).toHaveStyle({ backgroundColor: tlo });
  expect(screen.getByText('Delete everything')).toHaveStyle({ color: '#040506' });
});

test('nieaktywny (także niszczący): tokeny przyciskNieaktywny / przyciskNieaktywnyTekst (design-spec R1, komponent niszczący)', () => {
  render(<Przycisk tekst="Delete everything" onPress={() => undefined} rodzaj="niszczacy" wylaczony testID="p" />);
  expect(screen.getByTestId('p')).toHaveStyle({ backgroundColor: '#0a0b0c' });
  expect(screen.getByText('Delete everything')).toHaveStyle({ color: '#0d0e0f' });
});
