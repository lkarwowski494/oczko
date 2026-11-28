// PU-358, PU-359, PU-360 (katalog przypadków użycia). ZM-24 (U6, P-1102) i ZM-25 (U7 forma A, P-1103): pole „Krok” w „Dodaj licznik”,
// pozycja „Ustawienia licznika” w •••, arkusz ustawień licznika (krok, „Podpowiedz, gdy zapomnę +1”), przycisk „+2” i stan podpowiedzi na liczniku.
// Wyrocznia: docs/design/1-0-2.md „Paczka dla 07 i 08” (testID-propozycje 04, teksty en z tabeli kluczy), makiety u6-*, u7-licznik-A.
// Kształt nowych pól stanu i propsów (krok, podpowiedz, naUstawienia, UstawieniaLicznika) to propozycja 07 (P-1113) — 08 może je nazwać inaczej
// i dopasować wywołanie w teście; asercje (testID, teksty, wynik zapisu) zostają.
import React from 'react';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Licznik, type StanEkranuLicznika } from '../../src/ekrany/Licznik';
import { FormularzLicznika } from '../../src/ekrany/FormularzeProjektu';
import { MenuProjektu, type PropsMenuProjektu } from '../../src/ekrany/MenuProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { eksportLubZnacznik, modulLubZnacznik } from '../narzedzia/akceptacja';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }) }));

const licznik = (stan: Record<string, unknown>) => render(<Licznik stan={stanLicznika({ skonczone: 42, dziergany: 43, ...stan } as Partial<StanEkranuLicznika>)} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()}
  {...wywolaniaLicznika()} naNotatka={jest.fn()} naCel={jest.fn()} naWzor={jest.fn()} naProjekt={jest.fn()} naWstecz={jest.fn()} />);
const menu = (extra: Record<string, unknown> = {}) => {
  const p = { stan: { projekt: 'Harbor', zablokowany: false, wartosc: 42 }, t, naNazwa: jest.fn(), naWpisz: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj: jest.fn(), naUkoncz: jest.fn(), naZnaczenie: jest.fn(), naZamknij: jest.fn(), naUstawienia: jest.fn(), ...extra };
  render(<MenuProjektu {...(p as unknown as PropsMenuProjektu)} />);
  return p;
};

describe('ZM-24 krok +2 (U6)', () => {
  test('ZM-24 PU-358: „Dodaj licznik” ma „Step” z +1 (domyślnie) i +2 (`dodaj-licznik-krok-2`); zapis z +2 przekazuje krok 2', async () => {
    const naZapisz = jest.fn(async () => ({ ok: true as const, wartosc: undefined }));
    render(<FormularzLicznika t={t} czesci={[{ id: 'c1', nazwa: 'Front' }]} domyslnaCzesc="c1" naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    expect(screen.getByText('Step')).toBeTruthy();
    expect(screen.getByText('How much one tap adds. −1 always subtracts 1.')).toBeTruthy();
    fireEvent.press(screen.getByTestId('dodaj-licznik-krok-2'));
    fireEvent.press(screen.getByTestId('formularz-zapisz'));
    expect(naZapisz).toHaveBeenCalledWith(expect.objectContaining({ krok: 2 }));
  });

  test('ZM-24 PU-358: licznik z krokiem 2 — przycisk „+2”, podpis „rows 43–44 done”, etykieta VoiceOver z dwoma rzędami', () => {
    licznik({ krok: 2 });
    const plus = screen.getByTestId('licznik-plus');
    expect(screen.getByText('+2')).toBeTruthy();
    expect(screen.getByText('rows 43–44 done')).toBeTruthy();
    expect(plus.props.accessibilityLabel).toBe('Add 2 rows, rows 43 and 44 done');
  });

  test('ZM-24 PU-359: ••• ma „Counter settings” (`licznik-menu-ustawienia`) na końcu pierwszej grupy; stuknięcie otwiera ustawienia', () => {
    const p = menu();
    const pozycja = screen.getByTestId('licznik-menu-ustawienia');
    expect(screen.getByText('Counter settings')).toBeTruthy();
    fireEvent.press(pozycja);
    expect(p.naUstawienia).toHaveBeenCalledTimes(1);
  });
});

describe('ZM-24 / ZM-25 arkusz „Counter settings” (P-1102, P-1103)', () => {
  const arkusz = () => eksportLubZnacznik<React.ComponentType<Record<string, unknown>>>(
    modulLubZnacznik(join(__dirname, '../../src/ekrany/UstawieniaLicznika'), 'ZM-24 UstawieniaLicznika'), 'UstawieniaLicznika', 'ZM-24 UstawieniaLicznika');

  test('ZM-24 PU-359: krok +2 (`ustawienia-licznika-krok-2`) → zapis z krokiem 2 i podpowiedzią wyłączoną', () => {
    const Ark = arkusz();
    const naZapisz = jest.fn();
    render(<Ark t={t} krok={1} podpowiedzMin={null} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    fireEvent.press(screen.getByTestId('ustawienia-licznika-krok-2'));
    fireEvent.press(screen.getByTestId('formularz-zapisz'));
    expect(naZapisz).toHaveBeenCalledWith(expect.objectContaining({ krok: 2, podpowiedzMin: null }));
  });

  test('ZM-25 PU-360: „Nudge me if I forget +1” domyślnie wyłączone, lista progu ukryta; po włączeniu 5/10/15/30 min z domyślnym 10', () => {
    const Ark = arkusz();
    const naZapisz = jest.fn();
    render(<Ark t={t} krok={1} podpowiedzMin={null} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    const przelacznik = screen.getByTestId('ustawienia-licznika-podpowiedz');
    expect(screen.getByText('Nudge me if I forget +1')).toBeTruthy();
    expect(przelacznik.props.value ?? przelacznik.props.accessibilityState?.checked).toBe(false);
    expect(screen.queryByText('After this long without +1')).toBeNull();
    fireEvent(przelacznik, 'valueChange', true);
    for (const m of ['5 min', '10 min', '15 min', '30 min']) expect(screen.getByText(m)).toBeTruthy();
    fireEvent.press(screen.getByTestId('formularz-zapisz'));
    expect(naZapisz).toHaveBeenCalledWith(expect.objectContaining({ podpowiedzMin: 10 }));
  });
});

describe('ZM-25 podpowiedź +1 na liczniku (forma A, P-1103)', () => {
  test('ZM-25 PU-360: stan podpowiedzi — `licznik-podpowiedz` z „10 min without +1” i „row 43 done?”; etykieta VoiceOver z pytaniem', () => {
    licznik({ podpowiedz: { minuty: 10 } });
    expect(screen.getByTestId('licznik-podpowiedz')).toBeTruthy();
    expect(screen.getByText('10 min without +1')).toBeTruthy();
    expect(screen.getByText('row 43 done?')).toBeTruthy();
    expect(screen.getByTestId('licznik-plus').props.accessibilityLabel).toBe('Add row. No +1 for 10 min. Row 43 done?');
  });
  test('ZM-25 PU-360: przy limicie i zablokowanym liczniku podpowiedzi nie ma, nawet gdy stan ją niesie (P-1103)', () => {
    licznik({ podpowiedz: { minuty: 10 }, zablokowany: true });
    expect(screen.queryByTestId('licznik-podpowiedz')).toBeNull();
    screen.unmount();
    licznik({ podpowiedz: { minuty: 10 }, limit: { rodzaj: 'osiagniety' } });
    expect(screen.queryByTestId('licznik-podpowiedz')).toBeNull();
    screen.unmount();
    licznik({ podpowiedz: { minuty: 10 } }); // kontrola: bez blokady i limitu podpowiedź jest (inaczej dwa powyższe przechodzą przed kodem)
    expect(screen.getByTestId('licznik-podpowiedz')).toBeTruthy();
  });
});
