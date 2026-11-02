// M1-audytor-generalny-021 (źródło 06-tresci-001, P1): rozmiar 3,125 mm (tabele CYC: drut US 3, szydełko US D; DRT-M03125, SZD-M03125)
// nie może się zmienić przy edycji samego opisu ani znikać z listy. Wcześniej pole i lista formatowały mm do 2 miejsc („3.13”),
// a zapis parsował pole, więc narzędzie dostawało 3.13 mm i traciło numer US.
// Trasy z `app/` na prawdziwej bazie (node:sqlite) i prawdziwym t() en; atrapa tylko routera i opakowań platformy (jak M1-016).
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { preferencje } from '../../src/kompozycja/preferencje';
import { narzedzia, zapiszNarzedzie } from '../../src/przypadki-uzycia/zapas';
import { FormularzDrutu } from '../../src/ekrany/Zapas';
import { tEn } from './pomoc';
import type { Zaleznosci } from '../../src/przypadki-uzycia/zaleznosci';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

async function srodowisko(): Promise<Zaleznosci> {
  const { s, k, j } = await kompozycjaTestowa();
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k, preferencje: preferencje() };
  return s.z;
}
async function zamontuj(Ekran: React.ComponentType): Promise<void> {
  render(<Ekran />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}
beforeEach(() => {
  mockParams = {};
  Object.values(mockRouter).forEach((f) => { if (typeof f === 'function' && 'mockClear' in f) f.mockClear(); });
});

const PRZYPADKI: [string, 'druty' | 'szydelko', string][] = [
  ['DRT-M03125: drut 3,125 mm = US 3', 'druty', '3.125 mm (US 3)'],
  ['SZD-M03125: szydełko 3,125 mm = US D', 'szydelko', '3.125 mm (US D)'],
];

describe('M1-021: rozmiar 3,125 mm przez warstwę formularza', () => {
  test.each(PRZYPADKI)('%s — edycja samego opisu zapisuje 3.125; pole i podgląd pokazują 3.125 z numerem US', async (_n, rodzaj, tekst) => {
    const z = await srodowisko();
    const w = await zapiszNarzedzie(z, { rodzaj, rozmiarMm: 3.125, opis: '' });
    if (!w.ok) throw new Error(w.powod);
    mockParams = { id: w.wartosc.id };
    await zamontuj(trasa('../../app/drut'));
    expect(screen.getByTestId('formularz-rozmiar-mm').props.value).toBe('3.125');
    expect(screen.getByText(`Shows as: ${tekst}`)).toBeTruthy();
    const pola = screen.getAllByDisplayValue('');
    fireEvent.changeText(pola[pola.length - 1], 'circular, 80 cm'); // pole „Notes” (opis)
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Save' })); await new Promise((r) => setTimeout(r, 50)); });
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    const po = await narzedzia(z);
    if (!po.ok) throw new Error(po.powod);
    expect(po.wartosc.map((n) => [n.rodzaj, n.rozmiarMm, n.opis])).toEqual([[rodzaj, 3.125, 'circular, 80 cm']]);
  });

  test('formularz: pole mm niezmienione → zapis bierze wartość z bazy, nie zaokrągloną z ekranu (jak włóczka)', async () => {
    const naZapisz = jest.fn(async () => ({ ok: true as const, wartosc: undefined }));
    const t = await tEn();
    render(<FormularzDrutu t={t} poczatek={{ rodzaj: 'druty', rozmiarMm: 3.125, opis: '' }} podglad={() => null}
      parsuj={(x) => Number(x)} formatuj={(n) => n.toFixed(1)} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Save' })); await new Promise((r) => setTimeout(r, 10)); });
    expect(naZapisz).toHaveBeenCalledWith({ rodzaj: 'druty', rozmiarMm: 3.125, opis: '' });
  });

  test('lista „Needles and hooks” pokazuje 3.125 mm z numerem US (nie 3.13 mm)', async () => {
    const z = await srodowisko();
    for (const rodzaj of ['druty', 'szydelko'] as const) {
      const w = await zapiszNarzedzie(z, { rodzaj, rozmiarMm: 3.125, opis: '' });
      if (!w.ok) throw new Error(w.powod);
    }
    await zamontuj(trasa('../../app/druty'));
    expect(screen.getByText('3.125 mm (US 3)')).toBeTruthy();
    expect(screen.getByText('3.125 mm (US D)')).toBeTruthy();
    expect(screen.queryByText(/3\.13 mm/)).toBeNull();
  });
});
