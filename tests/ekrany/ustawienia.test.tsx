// Ustawienia (BR-ZAK-004, BR-ZAK-006/S5, S7, BR-DAN-012/S3, KP-13, F-48, F-57). Ekran nienarysowany (design-spec.md:95):
// etykiety spoza design-spec są robocze (Z07-05) i czekają na audyt 04; etykiety z innych ekranów 04 cytowane z linią.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Ustawienia, type PropsUstawien } from '../../src/ekrany/Ustawienia';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
// [DO USTALENIA] id aplikacji w App Store (rola 10); adres polityki (rola 10/11)
const ADRESY = { polityka: 'https://example.invalid/oczko/privacy', recenzja: 'https://apps.apple.com/app/id0000000000?action=write-review' };
function pokaz(stan: Partial<PropsUstawien['stan']> = {}) {
  const system = atrapaSystemu();
  const w = { naOferty: jest.fn(), naWibracje: jest.fn(), naZglosProblem: jest.fn(), naStanDanych: jest.fn() };
  render(<Ustawienia stan={{ pro: null, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wibracje: true, ...stan }} t={t} system={system} adresy={ADRESY} {...w} />);
  return { system, w };
}

describe('Ustawienia', () => {
  test('BR-ZAK-004/S1: odnośnik do polityki prywatności ją otwiera (nazwa jak design-spec.md:68)', () => {
    const { system } = pokaz();
    fireEvent.press(przycisk('Privacy Policy', 'link'));
    expect(system.otworzAdres).toHaveBeenCalledWith(ADRESY.polityka);
  });

  test('BR-DAN-012/S3: „Oceń” otwiera stronę recenzji (action=write-review), nie systemową prośbę (Z07-05: „Rate Oczko”)', () => {
    const { system } = pokaz();
    fireEvent.press(screen.getByRole('button', { name: /^Rate/ }));
    expect(system.otworzAdres).toHaveBeenCalledWith(expect.stringContaining('action=write-review'));
    expect(system.prosbaOOcene).not.toHaveBeenCalled();
  });

  test('BR-ZAK-006/S5: Ustawienia pokazują „3 of 5 free crafting days left in November” (design-spec.md:18)', () => {
    pokaz();
    expect(screen.getByText('3 of 5 free crafting days left in November')).toBeTruthy();
  });

  test('BR-ZAK-006/S7: aktywna subskrypcja — stan Pro i „Manage subscription” (design-spec.md:19, :56)', () => {
    const { system, w } = pokaz({ pro: { rodzaj: 'subskrypcja', produkt: 'oczko.pro.rok' }, dni: null });
    expect(screen.getByText(/Oczko Pro/)).toBeTruthy();
    expect(screen.queryByText(/free crafting days? left/)).toBeNull();
    fireEvent.press(przycisk('Manage subscription', 'button'));
    expect(system.zarzadzajSubskrypcja).toHaveBeenCalledTimes(1);
    expect(w.naOferty).not.toHaveBeenCalled();
  });

  test('KP-13: Ustawienia to drugie miejsce wejścia do ofert (Z07-05: pozycja „Oczko Pro”)', () => {
    const { w } = pokaz();
    expect(w.naOferty).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: /Oczko Pro/ }));
    expect(w.naOferty).toHaveBeenCalledTimes(1);
  });

  test('BR-LIC-020/S3 [ustawienie]: przełącznik wibracji (Z07-05: „Vibration”)', () => {
    const { w } = pokaz();
    fireEvent(screen.getByRole('switch', { name: /Vibration|Haptics/i }), 'valueChange', false);
    expect(w.naWibracje).toHaveBeenCalledWith(false);
  });

  test('BR-DAN-010: „Zgłoś problem” w Ustawieniach (design-spec.md:95; Z07-05: „Report a problem”)', () => {
    const { w } = pokaz();
    fireEvent.press(screen.getByRole('button', { name: /Report a problem/i }));
    expect(w.naZglosProblem).toHaveBeenCalledTimes(1);
  });
});
