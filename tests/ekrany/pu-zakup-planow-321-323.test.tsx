// PU-122, PU-124, PU-321, PU-322, PU-323 („Limit i zakup”): zakup planów Oczko Pro na prawdziwym dostępie (`dostepPro`) i sztucznym sklepie E2E (`sklepSztuczny`), trasy „/oferty” i „/ustawienia”.
// Poziom: komponentowy, bez symulatora; ekrany, dostęp i sklep są prawdziwe, atrapy tylko systemowe (otwarcie adresu, zarządzanie subskrypcją) i router.
import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { dostepPro } from '../../src/kompozycja/dostep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';

const mockRouter = { push: jest.fn(), back: jest.fn(), dismissTo: jest.fn() };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => ({}), useFocusEffect: (f: () => void) => R.useEffect(f, []) }; // eslint-disable-line react-hooks/exhaustive-deps
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: { zarzadzajSubskrypcja: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranOfert = (require('../../app/oferty') as { default: React.ComponentType }).default;
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const TERAZ = Date.UTC(2026, 10, 10);
const plik = { tekst: null as string | null }; // „plik buildu E2E” sztucznego sklepu: zakupy przeżywają „restart”
async function aplikacja() {
  const { s, k, j } = await kompozycjaTestowa();
  const sklep = sklepSztuczny(() => TERAZ, { czytaj: () => plik.tekst, zapisz: (t) => { plik.tekst = t; } });
  const magazyn = { czytaj: async () => null, zapisz: async () => undefined };
  const dostep = dostepPro(sklep, magazyn, () => TERAZ);
  await dostep.odswiez();
  mockAplikacja = {
    kontener: { z: s.z, j: { ...j, preferencja: () => 'auto' as const }, porty: { sklep }, dostep, icloud: null, katalogDanych: s.katalog },
    licznik: { zresetuj: jest.fn(), poZmianie: jest.fn(async () => undefined) }, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() },
  };
  return { sklep, dostep };
}
beforeEach(() => { plik.tekst = null; jest.clearAllMocks(); });

const otworzOferty = async () => { const r = render(<EkranOfert />); await screen.findByTestId('oferty-plan-roczny'); return r; };
const wybrany = () => ['miesieczny', 'roczny', 'dozywotni'].filter((p) => screen.queryByTestId(`oferty-plan-${p}`)?.props.accessibilityState?.selected);
const kupPlan = async (plan: 'miesieczny' | 'roczny' | 'dozywotni') => {
  fireEvent.press(screen.getByTestId(`oferty-plan-${plan}`));
  fireEvent.press(screen.getByTestId('oferty-kup'));
  await screen.findByTestId('oferty-stan-pro');
};
const planow = () => screen.queryAllByTestId(/^oferty-plan-/).length;
const zarzadzajOferty = () => screen.queryByRole('button', { name: 'Manage subscription' });
async function ustawieniaZ() {
  render(<EkranUstawien />);
  await screen.findByTestId('ustawienia-oczko-pro');
  await waitFor(() => expect(screen.queryByTestId('ustawienia-pro')).not.toBeNull());
}

// PU-122: plan „Monthly” → „Continue with Monthly” → „You have Oczko Pro.” z „Manage subscription” i „Restore purchases”, „Privacy Policy”, „Terms of Use” na ofertach; w Ustawieniach „On” i „Manage subscription”.
test('PU-122: zakup miesięczny → „You have Oczko Pro.”, w Ustawieniach „On” i „Manage subscription”; na ofertach przywracanie, polityka i warunki', async () => {
  await aplikacja();
  const oferty = await otworzOferty();
  expect(screen.queryByTestId('oferty-stan-pro')).toBeNull();
  fireEvent.press(screen.getByTestId('oferty-plan-miesieczny'));
  expect(screen.getByTestId('oferty-kup')).toHaveTextContent('Continue with Monthly');
  fireEvent.press(screen.getByTestId('oferty-kup'));
  expect(await screen.findByTestId('oferty-stan-pro')).toHaveTextContent('You have Oczko Pro.');
  expect(screen.getByTestId('oferty-przywroc')).toHaveTextContent('Restore purchases');
  expect(screen.getByText('Privacy Policy')).toBeTruthy();
  expect(screen.getByText('Terms of Use')).toBeTruthy();
  expect(zarzadzajOferty()).toBeTruthy();
  oferty.unmount();
  await ustawieniaZ();
  expect(screen.getByTestId('ustawienia-pro')).toHaveTextContent('On');
  expect(screen.getByTestId('ustawienia-subskrypcja')).toBeTruthy();
});

// PU-321: roczny jest zaznaczony od razu („… / year”, „Renews every year…”), „Continue with Yearly” → „You have Oczko Pro.”, roczny znika z planów, „Manage subscription”, w Ustawieniach „On”.
test('PU-321: roczny zaznaczony od razu → zakup → „You have Oczko Pro.”, roczny znika z planów, „Manage subscription”, w Ustawieniach „On”', async () => {
  await aplikacja();
  const oferty = await otworzOferty();
  expect(wybrany()).toEqual(['roczny']);
  expect(screen.getByTestId('oferty-plan-roczny')).toHaveTextContent(/\/ year/);
  expect(screen.getByTestId('oferty-plan-roczny')).toHaveTextContent(/Renews every year/);
  expect(screen.getByTestId('oferty-kup')).toHaveTextContent('Continue with Yearly');
  fireEvent.press(screen.getByTestId('oferty-kup'));
  expect(await screen.findByTestId('oferty-stan-pro')).toHaveTextContent('You have Oczko Pro.');
  expect(screen.queryByTestId('oferty-plan-roczny')).toBeNull();
  expect(zarzadzajOferty()).toBeTruthy();
  oferty.unmount();
  await ustawieniaZ();
  expect(screen.getByTestId('ustawienia-pro')).toHaveTextContent('On');
});

// PU-322: „Lifetime” („… once”, „Pay once. Nothing renews.”) → zakup → brak planów i „Manage subscription”; po „restarcie” w Ustawieniach Pro „On”.
test('PU-322: dożywotni („… once”, „Pay once. Nothing renews.”) → brak planów i „Manage subscription”; po restarcie w Ustawieniach Pro „On”', async () => {
  await aplikacja();
  const oferty = await otworzOferty();
  expect(screen.getByTestId('oferty-plan-dozywotni')).toHaveTextContent(/once/);
  expect(screen.getByTestId('oferty-plan-dozywotni')).toHaveTextContent(/Pay once\. Nothing renews\./);
  await kupPlan('dozywotni');
  expect(planow()).toBe(0);
  expect(zarzadzajOferty()).toBeNull();
  oferty.unmount();
  await aplikacja(); // „restart”: nowy dostęp i nowy sklep z tego samego pliku zakupów
  await ustawieniaZ();
  expect(screen.getByTestId('ustawienia-pro')).toHaveTextContent('On');
  expect(screen.queryByTestId('ustawienia-subskrypcja')).toBeNull();
});

// PU-323: aktywna subskrypcja miesięczna → plan „Lifetime” z „Your subscription keeps renewing until you cancel it.” → zakup → „Manage subscription” zostaje w Ofertach i w Ustawieniach.
test('PU-323: subskrypcja + zakup dożywotni → ostrzeżenie „keeps renewing” przy planie, „Manage subscription” zostaje w Ofertach i Ustawieniach', async () => {
  await aplikacja();
  const pierwsza = await otworzOferty();
  await kupPlan('miesieczny');
  pierwsza.unmount();
  const oferty = render(<EkranOfert />);
  await screen.findByTestId('oferty-plan-dozywotni');
  expect(screen.queryByTestId('oferty-plan-miesieczny')).toBeNull();
  expect(screen.getByTestId('oferty-plan-dozywotni').props.accessibilityLabel).toMatch(/keeps renewing/);
  expect(screen.getByText('Your subscription keeps renewing until you cancel it.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('oferty-plan-dozywotni'));
  fireEvent.press(screen.getByTestId('oferty-kup'));
  await waitFor(() => expect(planow()).toBe(0));
  expect(screen.getByTestId('oferty-stan-pro')).toHaveTextContent('You have Oczko Pro.');
  expect(zarzadzajOferty()).toBeTruthy();
  oferty.unmount();
  await ustawieniaZ();
  expect(screen.getByTestId('ustawienia-pro')).toHaveTextContent('On');
  expect(screen.getByTestId('ustawienia-subskrypcja')).toBeTruthy();
});

// PU-124: przy aktywnym Pro „Restore purchases” → bez komunikatu i alertu, „You have Oczko Pro.” zostaje, subskrypcja bez zmian.
test('PU-124: przy aktywnym Pro „Restore purchases” → bez komunikatu i alertu, Pro bez zmian', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const { dostep } = await aplikacja();
  await otworzOferty();
  await kupPlan('miesieczny');
  const przed = dostep.stan();
  expect(przed.pro).toBe(true);
  await act(async () => { fireEvent.press(screen.getByTestId('oferty-przywroc')); await new Promise((r) => setTimeout(r, 50)); }); // przywrócenie kończy się odświeżeniem dostępu
  expect(screen.queryByTestId('oferty-przywroc-nic')).toBeNull();
  expect(screen.queryByTestId('oferty-przywroc-blad')).toBeNull();
  expect(alert).not.toHaveBeenCalled();
  expect(screen.getByTestId('oferty-stan-pro')).toHaveTextContent('You have Oczko Pro.');
  expect(dostep.stan()).toEqual(przed);
  alert.mockRestore();
});
