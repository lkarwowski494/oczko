// PU-132 („VoiceOver”): Ustawienia, Oczko Pro, Projekty i Historia — wiersze i przyciski mają etykiety, na „Oczko Pro” ceny i okresy w całości, dni kalendarza z datą (wybrany z liczbą rzędów).
// Poziom: komponentowy — cztery prawdziwe trasy (`/ustawienia`, `/oferty`, `/projekty`, `/dni`) na prawdziwej bazie, kompozycji dostępu i sztucznym sklepie; przegląd elementów dostępnych dla VoiceOver.
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react-native';
import { dostepPro } from '../../src/kompozycja/dostep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { GODZ, T0, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => ({}), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: { zarzadzajSubskrypcja: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;
const EkranOfert = (require('../../app/oferty') as { default: React.ComponentType }).default;
const EkranProjektow = (require('../../app/(zakladki)/projekty') as { default: React.ComponentType }).default;
const EkranDni = (require('../../app/(zakladki)/dni') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const nazwa = (el: { props: { accessibilityLabel?: string }; children: unknown[] }): string =>
  el.props.accessibilityLabel ?? el.children.map((c) => (typeof c === 'string' ? c : '')).join('');
/** Przyciski, linki, radia i przełączniki bez nazwy dla VoiceOver: bez jawnej etykiety i bez żadnego tekstu w środku. */
function bezNazwy(): string[] {
  const maTekst = (e: { findAll(p: (n: { type: unknown; props: { children?: unknown } }) => boolean): unknown[] }) =>
    e.findAll((n) => typeof n.type === 'string' && typeof n.props.children === 'string' && n.props.children.trim() !== '').length > 0;
  return [...screen.queryAllByRole('button'), ...screen.queryAllByRole('link'), ...screen.queryAllByRole('radio'), ...screen.queryAllByRole('switch')]
    .filter((e) => (e.props.accessibilityLabel ?? '').trim() === '' && !maTekst(e))
    .map((e) => String(e.props.testID));
}

// PU-132: Ustawienia, Oczko Pro, Projekty i Historia — każdy przycisk/wiersz ma nazwę; plany z ceną i okresem w całości; wiersz projektu z nazwą; wybrany dzień z pracą „Oct 22 · 5 rows”.
test('PU-132: Ustawienia, Oczko Pro, Projekty i Historia — wiersze i przyciski mają etykiety; plany z cenami i okresami w całości', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód', 1), ...licznik('l1', 'c1', 5, { t: T0 })]);
  await k.otworz('l1');
  s.zegar.ustaw(T0 + GODZ);
  const sklep = sklepSztuczny(() => T0, { czytaj: () => null, zapisz: () => undefined });
  const dostep = dostepPro(sklep, { czytaj: async () => null, zapisz: async () => undefined }, () => T0);
  await dostep.odswiez();
  mockAplikacja = {
    kontener: { z: s.z, j: { ...j, preferencja: () => 'auto' as const }, porty: { sklep }, dostep: Object.assign(dostep, { poziom: 'darmowa' }), icloud: null, katalogDanych: s.katalog, wzor: { k: {} } },
    licznik: Object.assign(k, { otworz: jest.fn(async () => undefined) }), preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() },
  };

  const ustawienia = render(<EkranUstawien />);
  await screen.findByTestId('ustawienia-oczko-pro');
  expect(nazwa(screen.getByTestId('ustawienia-eksport'))).toBe('Export all data');
  expect(nazwa(screen.getByTestId('ustawienia-oczko-pro'))).toMatch(/^Oczko Pro/);
  expect(screen.getAllByRole('button').length).toBeGreaterThan(8);
  expect(bezNazwy()).toEqual([]);
  ustawienia.unmount();

  const oferty = render(<EkranOfert />);
  await screen.findByTestId('oferty-plan-roczny');
  expect(screen.getByTestId('oferty-plan-miesieczny').props.accessibilityLabel).toMatch(/\$0\.99 \/ month.*Renews every month/);
  expect(screen.getByTestId('oferty-plan-roczny').props.accessibilityLabel).toMatch(/\$6\.99 \/ year.*Renews every year/);
  expect(screen.getByTestId('oferty-plan-dozywotni').props.accessibilityLabel).toMatch(/\$14\.99 once\. Pay once\. Nothing renews\./);
  expect(bezNazwy()).toEqual([]);
  oferty.unmount();

  const projekty = render(<EkranProjektow />);
  await waitFor(() => expect(screen.getByTestId('projekty-lista')).toBeTruthy());
  expect(within(screen.getByTestId('projekty-wiersz')).getByText('Sweter')).toBeTruthy(); // wiersz w toku: VoiceOver czyta nazwę i opis z treści (etykieta jawna tylko dla ukończonych)
  expect(bezNazwy()).toEqual([]);
  projekty.unmount();

  render(<EkranDni />);
  await screen.findByText('October 2026');
  expect(screen.getByTestId('historia-dzien-2026-10-22').props.accessibilityLabel).toBe('Oct 22 · 5 rows'); // wybrany dzień z pracą: data i liczba rzędów
  expect(screen.getByTestId('historia-dzien-2026-10-21').props.accessibilityLabel).toBe('Oct 21'); // każda komórka kalendarza ma etykietę z datą
  expect(screen.getByRole('button', { name: 'Previous month' })).toBeTruthy();
  expect(bezNazwy()).toEqual([]);
});
