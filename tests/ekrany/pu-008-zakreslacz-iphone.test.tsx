// PU-008 (katalog przypadków użycia, „Zakreślanie na wzorze”): na ekranie wzoru na iPhonie (okno compact) nowe zakreślenie jest widać od razu w liczniku pasów, „Cofnij ostatnią kreskę”
// zgłasza JEDNO wywołanie (jedna kreska), a po cofnięciu licznik wraca o jeden. Prawdziwy ekran `PrzegladarkaWzoru` (widok strony PDF to slot — moduł natywny `oczko-wzor` poza Jest);
// siostra tests/ekrany/pu-012-ipad-zakreslanie.test.tsx (okno regular). Zapis i odczyt po restarcie: tests/dane/pu-008-zakreslenie-zapis-cofniecie.test.ts.
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ukladOkna } from '../../src/domena/uklad';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const stan = (z: Partial<StanPrzegladarki> = {}): StanPrzegladarki => ({
  nazwa: 'Highlight test', projekt: 'Highlight test', opis: 'PDF · 6 pages', czesc: 'Back', wzory: [{ wzorId: 'w1', nazwa: 'Highlight test' }], wzorId: 'w1',
  strona: { n: 1, razem: 6 }, zakreslenia: 0, narzedzie: 'brak', word: false,
  licznik: { liczba: 0, dziergany: 1, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 390, wysokosc: 844 }), ...z,
});
const wywolania = () => ({
  naWstecz: jest.fn(), naPrzelacz: jest.fn(), naNarzedzie: jest.fn(), naCofnij: jest.fn(), naZaznaczRzad: jest.fn(), naObroc: jest.fn(), naZmienNazwe: jest.fn(), naUsun: jest.fn(),
  potwierdz: jest.fn((_t: string, _o: string, _p: string, f: () => void) => f()),
  naPlus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })), naMinus: jest.fn(async () => ({ ok: true as const, wartosc: undefined })),
});
const widok = <Text testID="slot-widoku">PDF</Text>;

test('PU-008 · iPhone (compact): licznik pasów 1 → 2 widoczny od razu, jedno stuknięcie „Undo last stroke” = jedno wywołanie, po cofnięciu licznik wraca do 1', () => {
  const w = wywolania();
  const r = render(<PrzegladarkaWzoru stan={stan({ narzedzie: 'zakreslacz', zakreslenia: 1 })} t={t} widok={widok} {...w} />);
  expect(ukladOkna({ szerokosc: 390, wysokosc: 844 }).klasa).toBe('compact');
  expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('1 highlight');
  r.rerender(<PrzegladarkaWzoru stan={stan({ narzedzie: 'zakreslacz', zakreslenia: 2 })} t={t} widok={widok} {...w} />);
  expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('2 highlights'); // drugi pas od razu
  expect(w.naCofnij).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Undo last stroke'));
  expect(w.naCofnij).toHaveBeenCalledTimes(1);
  r.rerender(<PrzegladarkaWzoru stan={stan({ narzedzie: 'zakreslacz', zakreslenia: 1 })} t={t} widok={widok} {...w} />);
  expect(screen.getByTestId('wzor-zakreslenia').props.children).toBe('1 highlight');
});
