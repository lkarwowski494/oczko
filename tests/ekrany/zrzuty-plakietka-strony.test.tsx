// ZR2 / KO-179 (pkt 2): w trybie zrzutów sklepu (KontekstZrzutow = true, podaje go korzeń nawigacji z `ZRZUTY`) pigułka „Strona n z m” nie zasłania tekstu PDF w kadrze;
// w zwykłej aplikacji (kontekst domyślny false) pigułka jest jak dotąd. Prawdziwy ekran `PrzegladarkaWzoru` (widok strony PDF to slot — moduł natywny poza Jest).
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ukladOkna } from '../../src/domena/uklad';
import { KontekstZrzutow } from '../../src/ekrany/Pasek';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const stan = (): StanPrzegladarki => ({
  nazwa: 'Pattern', projekt: 'Pattern', opis: 'PDF · 1 page', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Pattern' }], wzorId: 'w1',
  strona: { n: 1, razem: 1 }, zakreslenia: 0, narzedzie: 'brak', word: false,
  licznik: { liczba: 0, dziergany: 1, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 1180, wysokosc: 820 }),
});
const wywolania = () => ({
  naWstecz: jest.fn(), naPrzelacz: jest.fn(), naNarzedzie: jest.fn(), naCofnij: jest.fn(), naZaznaczRzad: jest.fn(), naObroc: jest.fn(), naZmienNazwe: jest.fn(), naUsun: jest.fn(),
  potwierdz: jest.fn(), naPlus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })), naMinus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })),
});
const widok = <Text testID="slot-widoku">PDF</Text>;

test('zwykła aplikacja (iPad, okno regular): pigułka „Strona 1 z 1” jest', () => {
  render(<PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...wywolania()} />);
  expect(screen.getByTestId('wzor-strona')).toBeTruthy();
});

test('tryb zrzutów (KontekstZrzutow = true): pigułki nie ma, widok strony zostaje', () => {
  render(<KontekstZrzutow.Provider value><PrzegladarkaWzoru stan={stan()} t={t} widok={widok} {...wywolania()} /></KontekstZrzutow.Provider>);
  expect(screen.queryByTestId('wzor-strona')).toBeNull();
  expect(screen.getByTestId('slot-widoku')).toBeTruthy();
});

test('korzeń nawigacji podaje `ZRZUTY` do KontekstZrzutow', () => {
  const zrodlo = readFileSync(join(__dirname, '../../app/_layout.tsx'), 'utf8');
  expect(zrodlo).toMatch(/<KontekstZrzutow\.Provider value=\{ZRZUTY\}>/);
});
