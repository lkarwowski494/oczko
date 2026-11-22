// PU-178 (katalog przypadków użycia, „Języki”): „Język” → „Jak w telefonie” (po polsku) → restart → aplikacja w języku telefonu (en), a lista na trasie „/jezyk” ma
// wybraną pozycję „Same as phone”. Poziom: trasa „/jezyk” (app/jezyk.tsx) na prawdziwym i18n z magazynem `magazynJezyka` w bazie (node:sqlite); „restart” = nowy `utworzI18n` na tej samej bazie.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { odczytajUstawienie } from '../../src/dane/repozytoria/ustawienia';
import { magazynJezyka } from '../../src/przypadki-uzycia/jezyk';
import { przygotuj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ otworzUstawieniaSystemu: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranJezyka = (require('../../app/jezyk') as { default: React.ComponentType }).default;

// PU-178: pl → „Jak w telefonie” na trasie /jezyk zapisuje auto; po restarcie język telefonu (en) i „Same as phone, selected” na liście.
test('PU-178: „Jak w telefonie” zapisuje auto; po restarcie aplikacja w języku telefonu, a „Same as phone, selected” na liście języków', async () => {
  const s = await przygotuj();
  const start = () => utworzI18n({ magazyn: magazynJezyka(s.z), systemowe: () => ['en-US'], zasoby: ZASOBY });
  const pierwszy = await start();
  await pierwszy.ustawJezyk('pl');
  expect(pierwszy.t('ustawienia.jezyk')).toBe('Język');
  mockAplikacja = { kontener: { j: pierwszy } };
  render(<EkranJezyka />);
  fireEvent.press(screen.getByRole('radio', { name: 'Jak w telefonie' }));
  await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
  expect(await odczytajUstawienie(s.baza, 'jezyk')).toBe('auto');
  screen.unmount();
  const poRestarcie = await start(); // zabicie aplikacji i start na tej samej bazie
  expect(poRestarcie.jezyk()).toBe('en');
  expect(poRestarcie.t('ustawienia.jezyk')).toBe('Language');
  mockAplikacja = { kontener: { j: poRestarcie } };
  render(<EkranJezyka />);
  const radio = screen.getByRole('radio', { name: 'Same as phone, selected' });
  expect(radio.props.accessibilityState).toEqual({ checked: true });
});
