// Ustawienia › Język (F-36, BR-ZAK-004, design-spec „Ustawienia › Język”), wiersz „Translation quality” (BR-DAN-010, ER-45, P-075 (2a))
// i ekran „Źródła wiedzy” (BR-KAL-008, design-spec „Ekran «Źródła wiedzy»”). Teksty z design-spec, tekst linii źródła dosłownie z BR-KAL-008.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Ustawienia, type PropsUstawien } from '../../src/ekrany/Ustawienia';
import { WyborJezyka } from '../../src/ekrany/Jezyk';
import { ZrodlaWiedzy } from '../../src/ekrany/ZrodlaWiedzy';
import { JEZYKI } from '../../src/i18n/jezyki';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const ADRESY = { polityka: 'https://example.invalid/oczko/privacy', recenzja: 'https://apps.apple.com/app/id0000000000?action=write-review' };
function ustawienia(jezyk: NonNullable<PropsUstawien['jezyk']>['stan']) {
  const w = { naJezyk: jest.fn(), naZglosTlumaczenie: jest.fn(), naZrodla: jest.fn() };
  render(<Ustawienia stan={{ pro: null, dni: null, wibracje: true }} t={t} system={atrapaSystemu()} adresy={ADRESY}
    naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()}
    jezyk={{ stan: jezyk, naJezyk: w.naJezyk, naZglosTlumaczenie: w.naZglosTlumaczenie }} naZrodla={w.naZrodla} />);
  return w;
}

describe('Ustawienia: język, jakość przekładu, źródła wiedzy', () => {
  test('BR-ZAK-004: wiersz „Language” z wartością „Same as phone” otwiera listę', () => {
    const w = ustawienia({ wartosc: 'auto', jezyk: 'en' });
    const wiersz = screen.getByRole('button', { name: 'Language' });
    expect(wiersz.props.accessibilityValue).toEqual({ text: 'Same as phone' }); // VoiceOver: „Language, Same as phone”
    expect(screen.getByText('Same as phone')).toBeTruthy();
    fireEvent.press(wiersz);
    expect(w.naJezyk).toHaveBeenCalledTimes(1);
  });

  test('BR-ZAK-004: wybrany język — wartość wiersza to nazwa własna („Deutsch”)', () => {
    ustawienia({ wartosc: 'de', jezyk: 'de' });
    expect(screen.getByRole('button', { name: 'Language' }).props.accessibilityValue).toEqual({ text: 'Deutsch' });
    expect(screen.getByText('Deutsch')).toBeTruthy();
  });

  test('BR-DAN-010 (ER-45): język inny niż angielski → „Translation quality” i „Report a translation problem” otwiera zgłoszenie', () => {
    const w = ustawienia({ wartosc: 'auto', jezyk: 'de' });
    expect(screen.getByText('Translation quality')).toBeTruthy();
    fireEvent.press(przycisk('Report a translation problem', 'link'));
    expect(w.naZglosTlumaczenie).toHaveBeenCalledTimes(1);
  });

  test('BR-DAN-010 (ER-45): angielski → bez wiersza o przekładzie, „Report a problem” jak zawsze', () => {
    ustawienia({ wartosc: 'en', jezyk: 'en' });
    expect(screen.queryByText('Translation quality')).toBeNull();
    expect(screen.queryByText('Report a translation problem')).toBeNull();
  });

  test('BR-KAL-008: wiersz „About our information” otwiera ekran źródeł', () => {
    const w = ustawienia({ wartosc: 'auto', jezyk: 'en' });
    fireEvent.press(screen.getByRole('button', { name: 'About our information' }));
    expect(w.naZrodla).toHaveBeenCalledTimes(1);
  });
});

describe('Lista języków (design-spec „Ustawienia › Język”)', () => {
  const pokaz = (wybrany: Parameters<typeof WyborJezyka>[0]['wybrany']) => {
    const w = { naWybierz: jest.fn(), naUstawieniaIos: jest.fn() };
    render(<WyborJezyka t={t} wybrany={wybrany} {...w} />);
    return w;
  };

  test('pierwsza pozycja „Same as phone”, potem 35 lokalizacji jako radio; po instalacji wybrane „Same as phone”', () => {
    pokaz('auto');
    const radia = screen.getAllByRole('radio');
    expect(radia).toHaveLength(1 + JEZYKI.length);
    expect(radia[0].props.accessibilityLabel).toBe('Same as phone, selected');
    expect(radia[0].props.accessibilityState).toEqual({ checked: true });
    expect(radia.filter((r) => r.props.accessibilityState?.checked)).toHaveLength(1);
  });

  test('nazwy we własnym języku, czytane głosem swojego języka (accessibilityLanguage = tag); wybrana z ✓ i „{name}, selected”', () => {
    pokaz('de');
    const de = screen.getByRole('radio', { name: 'Deutsch, selected' });
    expect(de.props.accessibilityLanguage).toBe('de');
    expect(de.props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByRole('radio', { name: '日本語' }).props.accessibilityLanguage).toBe('ja');
    expect(screen.getByRole('radio', { name: 'Same as phone' }).props.accessibilityState).toEqual({ checked: false });
    expect(screen.getAllByText('✓', { includeHiddenElements: true })).toHaveLength(1); // widoczny znak; VoiceOver dostaje stan z checked
  });

  test('stuknięcie w „Polski” wybiera pl; „Same as phone” wybiera auto', () => {
    const w = pokaz('de');
    fireEvent.press(screen.getByRole('radio', { name: 'Polski' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Same as phone' }));
    expect(w.naWybierz.mock.calls).toEqual([['pl'], ['auto']]);
  });

  test('„Change in iOS Settings” z opisem otwiera Ustawienia iOS', () => {
    const w = pokaz('auto');
    expect(screen.getByText('The app name under the icon and the camera permission text follow the language set for Oczko in iOS Settings.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Change in iOS Settings' }));
    expect(w.naUstawieniaIos).toHaveBeenCalledTimes(1);
  });
});

describe('Ekran „Źródła wiedzy” (BR-KAL-008)', () => {
  test('jedno ogólne zdanie i linia źródła dosłownie z BR-KAL-008; bez odnośników', () => {
    render(<ZrodlaWiedzy t={t} />);
    expect(screen.getByRole('header', { name: 'About our information' })).toBeTruthy();
    expect(screen.getByText('The tables and tips in Oczko are written in our own words, based on industry standards and guidance from craft organizations.')).toBeTruthy();
    expect(screen.getByText("Source: Craft Yarn Council's www.YarnStandards.com")).toBeTruthy();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});

describe('Zgłoszenie z językiem aplikacji (BR-DAN-010, ER-45)', () => {
  test('pole „Language” w diagnostyce przed wysyłką', () => {
    const { ZglosProblem } = jest.requireActual<typeof import('../../src/ekrany/ZglosProblem')>('../../src/ekrany/ZglosProblem');
    const system = atrapaSystemu();
    render(<ZglosProblem stan={{ diagnostyka: [{ pole: 'jezyk', wartosc: 'de' }] }} t={t} system={system} naAnuluj={jest.fn()} />);
    expect(screen.getByText('Language: de')).toBeTruthy();
  });
});

describe('Stan danych jako arkusz z Ustawień (F-58)', () => {
  test('przycisk „Close” zamyka arkusz (VoiceOver nie ma gestu przesunięcia w dół)', () => {
    const { StanDanych } = jest.requireActual<typeof import('../../src/ekrany/StanDanych')>('../../src/ekrany/StanDanych');
    const naZamknij = jest.fn();
    render(<StanDanych stan={{ synchronizacja: 'wylaczona', ostatniaUdana: null, czekaNaSiec: false, zegarek: null }} t={t} naZamknij={naZamknij} />);
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(naZamknij).toHaveBeenCalledTimes(1);
  });
});
