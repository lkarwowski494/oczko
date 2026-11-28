// PU-Z09, PU-Z10 (katalog: „Oczekujące 1.0.2”). ZM-27 (b) (KO-234, P-1107, ADR-0037 (5)): pozycja „Remove from Lock Screen” w •••, tylko gdy
// Live Activity pokazuje ten licznik; pierwsza w drugiej grupie; podpis zawsze, dopisek o stoperze przy sesji `trwa`; stuknięcie bez potwierdzenia.
// Wyrocznia: docs/design/1-0-2.md § ZM-27 i „Paczka dla 07 i 08” (testID `licznik-menu-zdejmij-blokada`, teksty en), makiety z27-menu*.
// Pola `naEkranieBlokady`, `stoperTrwa`, `naZdejmijZBlokady` — propozycja 07 (P-1113); wywołanie portu `zakoncz` i ogłoszenie VoiceOver sprawdza 08 na trasie `app/menu`.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MenuProjektu, type PropsMenuProjektu } from '../../../src/ekrany/MenuProjektu';
import type { Tlumacz } from '../../../src/ekrany/wspolne';
import { tEn } from '../../ekrany/pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const menu = (stan: Record<string, unknown>) => {
  const p = { stan: { projekt: 'Harbor', zablokowany: false, wartosc: 42, ...stan }, t, naNazwa: jest.fn(), naWpisz: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj: jest.fn(), naUkoncz: jest.fn(), naZnaczenie: jest.fn(), naZamknij: jest.fn(), naZdejmijZBlokady: jest.fn() };
  render(<MenuProjektu {...(p as unknown as PropsMenuProjektu)} />);
  return p;
};
const kolejnosc = (ids: string[]) => {
  const wszystkie = screen.UNSAFE_root.findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
  return ids.map((id) => wszystkie.indexOf(id));
};

describe('ZM-27 (b) „Remove from Lock Screen” w ••• licznika', () => {
  test('ZM-27 PU-Z09: aktywność pokazuje ten licznik → pozycja z podpisem, pierwsza w drugiej grupie (przed „Lock counter”); stuknięcie woła zdjęcie i zamyka arkusz', () => {
    const p = menu({ naEkranieBlokady: true, stoperTrwa: false });
    const pozycja = screen.getByTestId('licznik-menu-zdejmij-blokada');
    expect(screen.getByText('Remove from Lock Screen')).toBeTruthy();
    expect(screen.getByText('It comes back when you count again.')).toBeTruthy();
    expect(screen.queryByText('The timer keeps running.')).toBeNull();
    const [zdejmij, zablokuj, znaczenie] = kolejnosc(['licznik-menu-zdejmij-blokada', 'menu-zablokuj', 'menu-znaczenie']);
    expect(zdejmij).toBeGreaterThan(znaczenie);
    expect(zdejmij).toBeLessThan(zablokuj);
    fireEvent.press(pozycja);
    expect(p.naZdejmijZBlokady).toHaveBeenCalledTimes(1);
    expect(p.naZeruj).not.toHaveBeenCalled();
  });

  test('ZM-27 PU-Z10: stoper `trwa` → dopisek „The timer keeps running.”; bez aktywności tego licznika pozycja ukryta (nie wyszarzona)', () => {
    menu({ naEkranieBlokady: true, stoperTrwa: true });
    expect(screen.getByText('The timer keeps running.')).toBeTruthy();
    screen.unmount();
    menu({ naEkranieBlokady: false, stoperTrwa: true });
    expect(screen.queryByTestId('licznik-menu-zdejmij-blokada')).toBeNull();
    expect(screen.queryByText('Remove from Lock Screen')).toBeNull();
  });
});
