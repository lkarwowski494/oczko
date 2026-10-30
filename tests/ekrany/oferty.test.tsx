// Ekran ofert (F-35; KP-03, KP-04, KP-08, KP-09, KP-14; P-089 (1), (2); P-065 (3a); design-spec.md:56, :68, :74, :77–80; ekrany.html `oferty`).
// Ceny w danych testu: ceny PL z P-089 (1) jako `cenaWyswietlana` atrapy sklepu. Ceny USD z makiety nie mogą się pojawić (KP-09, R-118).
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Oferty, type PropsOfert } from '../../src/ekrany/Oferty';
import type { Produkt } from '../../src/domena/porty';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const PRODUKTY: Produkt[] = [
  { id: 'oczko.pro.miesiac', cenaWyswietlana: '4,99 zł', okres: 'miesiac' },
  { id: 'oczko.pro.rok', cenaWyswietlana: '19,99 zł', okres: 'rok' },
  { id: 'oczko.pro.dozywotni', cenaWyswietlana: '59,99 zł', okres: 'dozywotni' },
];
const ADRESY = { polityka: 'https://example.invalid/oczko/privacy', warunki: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/' };
function pokaz(stan: Partial<PropsOfert['stan']> = {}) {
  const w = { naKup: jest.fn(), naPrzywroc: jest.fn(), naZarzadzaj: jest.fn(), naOtworzAdres: jest.fn(), naZamknij: jest.fn() };
  render(<Oferty stan={{ produkty: { rodzaj: 'gotowe', produkty: PRODUKTY }, aktywne: null, familySharing: true, ...stan }} t={t} adresy={ADRESY} {...w} />);
  return w;
}

describe('Oferty', () => {
  test('04-studio-projektowe-004: ✕ stoi w nagłówku arkusza (z tytułem „Oczko Pro”), po tytule w kolejności VoiceOver; zamyka i ma etykietę „Close”', () => {
    const w = pokaz();
    const naglowek = screen.getByTestId('arkusz-naglowek-decyzji');
    expect(within(naglowek).getByText('Oczko Pro')).toBeTruthy();
    const zamknij = within(naglowek).getByTestId('oferty-zamknij');
    expect(zamknij.props.accessibilityLabel).toBe('Close');
    fireEvent.press(zamknij);
    expect(w.naZamknij).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId('oferty-zamknij')).toHaveLength(1);
  });
  test('KP-09 / P-089 (1) / R-118: ceny tylko z produktu sklepu, żadnej kwoty z kodu', () => {
    pokaz();
    // design-spec.md:68 plany jako accessibilityRole="radio"; ekrany.html:163 radiogroup „Plans”
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /Monthly.*4,99 zł/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Yearly.*19,99 zł/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Lifetime.*59,99 zł/ })).toBeTruthy();
    expect(screen.queryByText(/\$\s?\d|0[.,]99|6[.,]99|14[.,]99/)).toBeNull();
  });

  test('P-065 (3a): wybór planu (radio + selected) i zakup wybranego produktu (design-spec.md:68, ekrany.html:169)', () => {
    const w = pokaz();
    expect(screen.getAllByRole('radio', { selected: true })).toHaveLength(1);
    fireEvent.press(screen.getByRole('radio', { name: /Monthly/ }));
    expect(screen.getByRole('radio', { name: /Monthly/, selected: true })).toBeTruthy();
    // ekrany.html:169 „Continue with Yearly” → po wyborze miesięcznego
    fireEvent.press(przycisk('Continue with Monthly', 'button'));
    expect(w.naKup).toHaveBeenCalledWith('oczko.pro.miesiac');
  });

  test('P-065 (3a) / P-054: teksty ofert wariantu 1, bez procentów i słów zakazanych (design-spec.md:74, :78)', () => {
    pokaz();
    expect(przycisk('Oczko Pro', 'header')).toBeTruthy();
    expect(screen.getByText('Count rows on as many days as you like. Everything else stays the same.')).toBeTruthy();
    expect(screen.getByText(/Without Pro: 5 crafting days every month, and all your projects and data, always\./)).toBeTruthy();
    expect(screen.queryByText(/%|free trial|Upgrade now|Unlock|Oops/i)).toBeNull();
  });

  test('KP-08: przywracanie tylko po stuknięciu „Restore purchases”', () => {
    const w = pokaz();
    expect(w.naPrzywroc).not.toHaveBeenCalled();
    fireEvent.press(przycisk('Restore purchases', 'button'));
    expect(w.naPrzywroc).toHaveBeenCalledTimes(1);
  });

  test('KP-04 / R-124: Privacy Policy i Terms of Use jako linki (design-spec.md:68, ekrany.html:171)', () => {
    const w = pokaz();
    fireEvent.press(przycisk('Privacy Policy', 'link'));
    fireEvent.press(przycisk('Terms of Use', 'link'));
    expect(w.naOtworzAdres.mock.calls).toEqual([[ADRESY.polityka], [ADRESY.warunki]]);
  });

  test('KP-03: przy aktywnej subskrypcji miesięcznej ekran jej nie oferuje; przy dożywotnim brak planów (Z07-05)', () => {
    pokaz({ aktywne: { rodzaj: 'subskrypcja', produkt: 'oczko.pro.miesiac' } });
    expect(screen.queryByRole('radio', { name: /Monthly/ })).toBeNull();
    // design-spec.md:56 „aktywna subskrypcja: stan Pro + „Manage subscription””
    expect(przycisk('Manage subscription', 'button')).toBeTruthy();
    screen.unmount();
    pokaz({ aktywne: { rodzaj: 'dozywotni' } });
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /^Continue with/ })).toBeNull();
  });

  test('KP-14: „Manage subscription” otwiera systemowe zarządzanie (design-spec.md:56)', () => {
    const w = pokaz({ aktywne: { rodzaj: 'subskrypcja', produkt: 'oczko.pro.rok' } });
    fireEvent.press(przycisk('Manage subscription', 'button'));
    expect(w.naZarzadzaj).toHaveBeenCalledTimes(1);
  });

  test('R-118 [macierz 04: brak sieci]: bez cen nie ma przycisku zakupu; „Restore purchases” zostaje (design-spec.md:56)', () => {
    pokaz({ produkty: { rodzaj: 'brak-sieci' } });
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /^Continue with/ })).toBeNull();
    expect(przycisk('Restore purchases', 'button')).toBeTruthy();
  });

  test('P-089 (2): zdanie o Family Sharing tylko, gdy włączone (design-spec.md:80, ekrany.html:168)', () => {
    pokaz({ familySharing: true });
    expect(screen.getByText(/Shared with your family through Family Sharing\./)).toBeTruthy();
    screen.unmount();
    pokaz({ familySharing: false });
    expect(screen.queryByText(/Family Sharing/)).toBeNull();
  });

  test('P-065 (3a) ujawnienie (6): zamknięcie „Close” (ekrany.html:160 aria-label)', () => {
    const w = pokaz();
    fireEvent.press(przycisk('Close', 'button'));
    expect(w.naZamknij).toHaveBeenCalledTimes(1);
    expect(w.naKup).not.toHaveBeenCalled();
  });
});
