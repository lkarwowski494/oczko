// PU-007 (katalog przypadków użycia, „Instalacja i pierwszy start”): telefon po polsku → Ustawienia › Język › „English” → teksty po angielsku; po restarcie (nowy i18n na tej samej bazie,
// system nadal „pl”) „English” jest nadal wybrany, a ekran i tytuł „Settings” po angielsku. Trasa app/jezyk na prawdziwym mechanizmie i18n i zapisie w bazie (node:sqlite).
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { magazynJezyka } from '../../src/przypadki-uzycia/jezyk';
import { odczytajUstawienie } from '../../src/dane/repozytoria/ustawienia';
import { przygotuj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ otworzUstawieniaSystemu: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranJezyka = (require('../../app/jezyk') as { default: React.ComponentType }).default;

test('PU-007: „English” wybrany przy telefonie po polsku zapisuje się i przeżywa restart: „English, selected”, teksty po angielsku, tytuł „Settings”', async () => {
  const s = await przygotuj();
  const uruchom = () => utworzI18n({ magazyn: magazynJezyka(s.z), systemowe: () => ['pl-PL'], zasoby: ZASOBY }); // „start aplikacji” na tej samej bazie, system po polsku

  const pierwszy = await uruchom();
  expect(pierwszy.jezyk()).toBe('pl');
  expect(pierwszy.t('ustawienia.tytul')).not.toBe('Settings'); // przed wyborem: po polsku
  mockAplikacja = { kontener: { j: pierwszy } };
  const przed = render(<EkranJezyka />);
  await act(async () => { fireEvent.press(screen.getByTestId('jezyk-en')); await new Promise((r) => setTimeout(r, 100)); });
  expect(await odczytajUstawienie(s.baza, 'jezyk')).toBe('en');
  expect(pierwszy.t('ustawienia.tytul')).toBe('Settings'); // działa od razu
  expect(mockRouter.back).toHaveBeenCalled();
  przed.unmount();

  const poRestarcie = await uruchom();
  expect(poRestarcie.jezyk()).toBe('en'); // mimo systemu po polsku
  expect(poRestarcie.t('ustawienia.tytul')).toBe('Settings');
  mockAplikacja = { kontener: { j: poRestarcie } };
  render(<EkranJezyka />);
  expect(screen.getByText('Language')).toBeTruthy(); // tytuł ekranu po angielsku
  const english = screen.getByTestId('jezyk-en');
  expect(english.props.accessibilityLabel).toBe('English, selected');
  expect(english.props.accessibilityState).toMatchObject({ checked: true });
  expect(screen.getByTestId('jezyk-auto').props.accessibilityState).toMatchObject({ checked: false });
});
