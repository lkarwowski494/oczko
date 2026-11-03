// 033-T1 (07-jakosc-033 B, lista dla 08 #1 i #3): testID przycisków na TRASIE „/ustawienia” (app/ustawienia.tsx), na prawdziwej bazie i archiwum — scenariusze E2E 63, 65 i 66
// stukają je zamiast etykiety (apostrof typograficzny w „Replace what’s here” jest kruchy). Zachowanie bez zmian: ten sam tekst/etykieta i ta sama akcja. P-377: test montuje trasę z `app/`.
import React from 'react';
import { join } from 'node:path';
import { render, screen, userEvent } from '@testing-library/react-native';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { archiwumWzorcowe, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { czasWTle, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { readFileSync } from 'node:fs';
import { tEn } from './pomoc';

const mockRouter = { push: jest.fn(), back: jest.fn() };
const mockParametry: { import?: string } = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useFocusEffect: (f: () => void) => R.useEffect(f, []), useLocalSearchParams: () => mockParametry }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
const mockSystem = { otworzAdres: jest.fn() };
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: mockSystem }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;


async function aplikacja(zImportem: boolean) {
  const t = await tEn();
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('stary', 'Stary sweter')]);
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  const kontener = {
    z: { ...s.z, archiwum, czasWTle }, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, icloud: null, katalogDanych: s.katalog,
    dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined },
  };
  mockAplikacja = { kontener, licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() } };
  mockParametry.import = zImportem ? archiwumWzorcowe(s.katalog, 'czapka', [projekt('cz', 'Czapka')]) : undefined;
}
beforeEach(() => { mockRouter.push.mockClear(); mockSystem.otworzAdres.mockClear(); });

describe('033-T1: testID na trasie „/ustawienia”', () => {
  test('ustawienia-zglos: wiersz „Report a problem” ma testID i otwiera /zglos', async () => {
    await aplikacja(false);
    render(<EkranUstawien />);
    const el = await screen.findByTestId('ustawienia-zglos');
    expect(el.props.accessibilityLabel).toBe('Report a problem');
    await userEvent.press(el);
    expect(mockRouter.push).toHaveBeenCalledWith('/zglos');
  });
  test('061 (DEC-22 a) ustawienia-pomoc: wiersz „Help” na trasie otwiera adres strony wsparcia z docs/wydanie/adres-strony.json', async () => {
    const strona = JSON.parse(readFileSync(join(__dirname, '../../docs/wydanie/adres-strony.json'), 'utf8')) as { baza: string; wsparcie: string };
    await aplikacja(false);
    render(<EkranUstawien />);
    const el = await screen.findByTestId('ustawienia-pomoc');
    expect(el.props.accessibilityLabel).toBe('Help');
    await userEvent.press(el);
    expect(mockSystem.otworzAdres).toHaveBeenCalledTimes(1);
    expect(mockSystem.otworzAdres).toHaveBeenCalledWith(strona.baza + strona.wsparcie);
  });
  test('ustawienia-ocen: wiersz „Rate Oczko” ma testID i otwiera adres recenzji', async () => {
    await aplikacja(false);
    render(<EkranUstawien />);
    const el = await screen.findByTestId('ustawienia-ocen');
    expect(el.props.accessibilityLabel).toBe('Rate Oczko');
    await userEvent.press(el);
    expect(mockSystem.otworzAdres).toHaveBeenCalledTimes(1);
  });
  test('import-zastap: przycisk „Replace what’s here” w oknie wyboru po imporcie ma testID', async () => {
    await aplikacja(true);
    render(<EkranUstawien />);
    const el = await screen.findByTestId('import-zastap');
    expect(el.props.accessibilityLabel).toBe('Replace what’s here');
  });
});
