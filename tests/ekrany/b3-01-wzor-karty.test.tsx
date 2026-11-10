// B3-01 (P-662, fix11): karta Word (`wzor.word_podglad`) i pasek notatki bez znacznika nie miały limitu skali, a wskazówka znacznika ma ×1,8 (P-630/P-632).
// Przy AX5 (fontScale 3,571) karta ok. 790 pt zasłaniała wzór. Jest nie liczy układu: test sprawdza limit i brak ucinania (numberOfLines) na tekstach obu kart;
// widoczność `wzor-widok` przy AX5 potwierdza E2E 30.
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ukladOkna } from '../../src/domena/uklad';
import { PrzegladarkaWzoru, type StanPrzegladarki } from '../../src/ekrany/WzorPrzegladarka';
import { MAX_SKALA_TYTULOWA } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 3.571 }) }));
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const stan = (z: Partial<StanPrzegladarki> = {}): StanPrzegladarki => ({
  nazwa: 'Test pattern', opis: 'DOCX', czesc: null, wzory: [{ wzorId: 'w1', nazwa: 'Test pattern' }], wzorId: 'w1',
  strona: { n: 1, razem: 1 }, zakreslenia: 0, narzedzie: 'brak', word: false, wskazowka: false, kierunek: null,
  licznik: { liczba: 12345, dziergany: 12346, znaczenie: 'skonczone' }, uklad: ukladOkna({ szerokosc: 402, wysokosc: 874 }), ...z,
});
const nic = jest.fn();
const pokaz = (z: Partial<StanPrzegladarki> = {}) => render(<PrzegladarkaWzoru stan={stan(z)} t={t} widok={<Text testID="slot-widoku">DOC</Text>}
  naWstecz={nic} naPrzelacz={nic} naNarzedzie={nic} naCofnij={nic} naZaznaczRzad={nic} naObroc={nic} naZmienNazwe={nic} naUsun={nic} potwierdz={nic} naNotatka={nic}
  naPlus={async () => ({ ok: true as const, wartosc: undefined })} naMinus={async () => ({ ok: true as const, wartosc: undefined })} />);

const bezUcinania = (tekst: string) => {
  const el = screen.getByText(tekst);
  expect(el.props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
  expect(el.props.numberOfLines).toBeUndefined();
};

test('AX5: karta Word „wzor.word_podglad” z limitem skali tytułów, bez ucinania', () => {
  pokaz({ word: true });
  bezUcinania(t('wzor.word_podglad'));
});

test('AX5: pasek notatki bez znacznika — oba teksty i przyciski z limitem skali tytułów, bez ucinania', () => {
  pokaz();
  fireEvent.press(screen.getByRole('button', { name: t('wzor.dodaj_notatke') }));
  bezUcinania(t('wzor.notatka_bez_znacznika'));
  bezUcinania(t('wzor.notatka_zaznacz'));
  bezUcinania(t('wzor.zaznacz_rzad'));
  bezUcinania(t('wspolne.anuluj'));
});
