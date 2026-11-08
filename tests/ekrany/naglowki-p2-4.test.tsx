// P2-4 (04, Aneks P2, poz. 7; P-368): nagłówki bez własnych wag i krojów.
// Wartości wyglądu z tokenów Dzianiny (P-553): `drobny`→`typografia.mala.pt`, `olowek`→`kolory.<motyw>.tekst2`, `odstep.xl`→`odstepy.xl`; intencja testu bez zmian.
// (a) „Tools”: `.naglowek-grupy` (`docs/design/fix6-2026-10-26/narzedzia-zdjecia.html`, `sesje-historia.html:75`) to 13 pt `olowek` BEZ wagi 700.
// (b) Historia dni: nagłówki dnia, tygodnia i miesiąca jak `.naglowek-grupy` (13 pt, `olowek`, bez wagi), 20 pt nad blokiem (`margin: 20px …`, `sesje-historia.html:75`).
// (c) Menu stopera: nagłówek „Session started {{godzina}}” (design-spec Aneks P2 poz. 7c; `stoper.menu_naglowek`) w stylu systemu — krój systemowy, bez wagi i bez Libre Franklin.
import React from 'react';
import * as RN from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Narzedzia } from '../../src/ekrany/Narzedzia';
import { HistoriaDni } from '../../src/ekrany/HistoriaDni';
import { Stoper } from '../../src/ekrany/Stoper';
import { stanHistorii } from '../../src/kompozycja/historia';
import type { WidokHistorii } from '../../src/przypadki-uzycia/historia';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => jest.restoreAllMocks());

const styl = (el: { props: { style?: unknown } }) => RN.StyleSheet.flatten(el.props.style as RN.TextStyle);
const olowek = (schemat: 'light' | 'dark') => (schemat === 'dark' ? tokeny.kolory.ciemny : tokeny.kolory.jasny).tekst2;

describe.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s', (_m, schemat) => {
  beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat); });

  test('(a) Narzędzia: „Stash” i „Calculations” — 13 pt, olowek, bez wagi 700', () => {
    render(<Narzedzia stan={{ wloczki: 7, druty: 9 }} t={t} naWloczki={jest.fn()} naDruty={jest.fn()} naProbke={jest.fn()} />);
    for (const nazwa of ['Stash', 'Calculations']) {
      const s = styl(screen.getByRole('header', { name: nazwa }));
      expect({ nazwa, rozmiar: s.fontSize, kolor: s.color, waga: s.fontWeight }).toEqual({ nazwa, rozmiar: tokeny.typografia.mala.pt, kolor: olowek(schemat), waga: undefined });
    }
  });

  test('(b) Historia dni: nagłówki dnia, tygodnia i miesiąca — 13 pt, olowek, bez wagi, 20 pt nad blokiem', () => {
    const w: WidokHistorii = {
      dniRobotki: ['2026-10-22'], ukonczoneDnia: [],
      dzien: [{ projektId: 'p1', nazwa: 'Sweater', rzedy: 5, czasMs: null }],
      tydzien: { od: '2026-10-19', do: '2026-10-25', rzedy: 5, czasMs: null, ukonczone: 0, poprzednie: { rzedy: 12 } },
      miesiac: { rzedy: 5, czasMs: null, ukonczone: 1, dni: 2 }, pierwsze: false,
    };
    const j = { t, jezyk: () => 'en', zegar24h: () => true };
    const f = { naWybierz: jest.fn(), naPoprzedni: jest.fn(), naNastepny: jest.fn(), naProjekt: jest.fn() };
    render(<HistoriaDni stan={stanHistorii(w, { j, miesiac: '2026-10', wybrany: '2026-10-22', dzis: '2026-10-26' })} t={t} {...f} />);
    const przewijany = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && n.type.includes('ScrollView'))[0];
    const odstepMiedzyBlokami = RN.StyleSheet.flatten(przewijany!.props.contentContainerStyle).gap as number;
    for (const id of ['historia-dzien', 'historia-tydzien', 'historia-miesiac']) {
      const naglowek = within(screen.getByTestId(id)).getAllByRole('header')[0]!;
      const s = styl(naglowek);
      expect({ id, rozmiar: s.fontSize, kolor: s.color, waga: s.fontWeight, nadBlokiem: odstepMiedzyBlokami + Number(s.marginTop ?? 0) })
        .toEqual({ id, rozmiar: tokeny.typografia.mala.pt, kolor: olowek(schemat), waga: undefined, nadBlokiem: tokeny.odstepy.xl });
    }
  });

  test('(c) menu stopera: nagłówek „Session started 8:14 AM” — krój systemowy, bez wagi (nie nagłówek grupy ani Libre Franklin)', () => {
    render(<Stoper stan={{ rodzaj: 'trwa', znacznikMs: 0, startGodzina: '8:14 AM' }} inny={null} t={t} teraz={() => 5000}
      naStart={jest.fn()} naWstrzymaj={jest.fn()} naWznow={jest.fn()} naZatrzymaj={jest.fn()} naInnyPotwierdz={jest.fn()} naInnyAnuluj={jest.fn()} />);
    fireEvent.press(screen.getByTestId('licznik-stoper'));
    const s = styl(within(screen.getByTestId('licznik-stoper-menu')).getByText('Session started 8:14 AM'));
    expect({ krój: s.fontFamily, waga: s.fontWeight, kolor: s.color }).toEqual({ krój: undefined, waga: undefined, kolor: olowek(schemat) });
  });
});
