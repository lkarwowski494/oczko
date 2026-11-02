// Trasa „/oferty” (app/oferty.tsx) przez ekran, nie sam komponent (07-jakosc-032). 07-jakosc-002 (KP-07, MON-04, F-35): oczekujący zakup, błąd zakupu,
// anulowanie, nieudane i puste przywrócenie mają widoczny komunikat; anulowanie nie ma komunikatu ani sukcesu. P-330: po zatwierdzeniu poza aplikacją „Oczko Pro is on.”.
import React from 'react';
import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { Produkt, StatusZakupu } from '../../src/domena/porty';
import { tEn } from './pomoc';

const mockRouter = { back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) })); // E2-137-A2: oferty czytają parametr „skad”; tu otwarte bez niego
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: { zarzadzajSubskrypcja: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: null }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranOfert = (require('../../app/oferty') as { default: React.ComponentType }).default;

const odroczona = <T,>() => { let r!: (v: T) => void; const p = new Promise<T>((x) => (r = x)); return { p, r }; };
const PRODUKTY: Produkt[] = [{ id: 'oczko.pro.rok', okres: 'rok', cenaWyswietlana: '$19.99' }, { id: 'oczko.pro.miesiac', okres: 'miesiac', cenaWyswietlana: '$2.99' }] as unknown as Produkt[];
async function aplikacja(o: { kup?: StatusZakupu; przywroc?: { ok: boolean }; proPoPrzywroceniu?: boolean } = {}) {
  const t = await tEn();
  let aktywne: { rodzaj: 'dozywotni' } | null = null;
  const sluchacze = new Set<(s: unknown) => void>();
  const stan = () => ({ aktywne, pro: aktywne !== null });
  const dostep = {
    stan, naZmiane: (f: (s: unknown) => void) => { sluchacze.add(f); return () => void sluchacze.delete(f); },
    odswiez: jest.fn(async () => { if (o.proPoPrzywroceniu) aktywne = { rodzaj: 'dozywotni' }; sluchacze.forEach((f) => f(stan())); }),
  };
  const sklep = {
    produkty: async () => PRODUKTY, kup: jest.fn(async () => o.kup ?? 'sukces'),
    przywroc: jest.fn(async () => (o.przywroc?.ok === false ? { ok: false as const, powod: 'zapis' as const } : { ok: true as const, wartosc: undefined })),
  };
  mockAplikacja = { kontener: { j: { t }, porty: { sklep }, dostep }, licznik: { poZmianie: jest.fn(async () => undefined) }, preferencje: {} };
  return { sklep, dostep, wlacz: async () => { aktywne = { rodzaj: 'dozywotni' }; await act(async () => { sluchacze.forEach((f) => f(stan())); }); } };
}
const kup = async () => { await waitFor(() => expect(screen.getByTestId('oferty-kup')).toBeTruthy()); await userEvent.press(screen.getByTestId('oferty-kup')); };
const wszystkieLinie = ['oferty-czeka', 'oferty-blad', 'oferty-przywroc-nic', 'oferty-przywroc-blad', 'oferty-pro-wlaczone'];
const linie = () => wszystkieLinie.filter((id) => screen.queryByTestId(id) !== null);

beforeEach(() => { jest.clearAllMocks(); });

test('KP-07: zakup oczekujący (Ask to Buy) → linia „Waiting for approval…” i nieaktywny przycisk „Waiting for approval”', async () => {
  await aplikacja({ kup: 'oczekujacy' });
  render(<EkranOfert />);
  await kup();
  expect(await screen.findByText('Waiting for approval. Oczko Pro turns on as soon as it’s approved.')).toBeTruthy();
  expect(linie()).toEqual(['oferty-czeka']);
  expect(screen.getByRole('button', { name: 'Waiting for approval' }).props.accessibilityState).toMatchObject({ disabled: true });
});
test('KP-07: błąd zakupu → „The purchase didn’t go through…”', async () => {
  await aplikacja({ kup: 'blad' });
  render(<EkranOfert />);
  await kup();
  expect(await screen.findByText(/The purchase didn’t go through\. Check your connection and try again\./)).toBeTruthy();
  expect(linie()).toEqual(['oferty-blad']);
});
test('KP-07: zakup anulowany przez użytkowniczkę → bez komunikatu, bez sukcesu; sukces → bez komunikatu', async () => {
  const { sklep } = await aplikacja({ kup: 'anulowany' });
  render(<EkranOfert />);
  await kup();
  await waitFor(() => expect(sklep.kup).toHaveBeenCalledTimes(1));
  expect(linie()).toEqual([]);
  sklep.kup.mockResolvedValueOnce('sukces');
  await userEvent.press(screen.getByTestId('oferty-kup'));
  await waitFor(() => expect(sklep.kup).toHaveBeenCalledTimes(2));
  expect(linie()).toEqual([]);
});
test('KP-07: przywrócenie nieudane → „Couldn’t restore purchases…”; bez zakupu → „No Oczko Pro purchase found…”; z zakupem → bez komunikatu', async () => {
  await aplikacja({ przywroc: { ok: false } });
  const a = render(<EkranOfert />);
  await waitFor(() => expect(screen.getByTestId('oferty-przywroc')).toBeTruthy());
  await userEvent.press(screen.getByTestId('oferty-przywroc'));
  expect(await screen.findByText(/Couldn’t restore purchases\. Check your connection and try again\./)).toBeTruthy();
  expect(linie()).toEqual(['oferty-przywroc-blad']);
  a.unmount();
  await aplikacja({});
  render(<EkranOfert />);
  await waitFor(() => expect(screen.getByTestId('oferty-przywroc')).toBeTruthy());
  await userEvent.press(screen.getByTestId('oferty-przywroc'));
  expect(await screen.findByText(/No Oczko Pro purchase found for this Apple ID\./)).toBeTruthy();
  expect(linie()).toEqual(['oferty-przywroc-nic']);
});
test('KP-07: przywrócenie, które znalazło zakup → bez komunikatu o braku', async () => {
  const { sklep } = await aplikacja({ proPoPrzywroceniu: true });
  render(<EkranOfert />);
  await waitFor(() => expect(screen.getByTestId('oferty-przywroc')).toBeTruthy());
  await userEvent.press(screen.getByTestId('oferty-przywroc'));
  await waitFor(() => expect(sklep.przywroc).toHaveBeenCalledTimes(1));
  expect(linie()).toEqual([]);
});
test('P-330: po zatwierdzeniu poza aplikacją (Ask to Buy) pojawia się jednorazowo „Oczko Pro is on.”', async () => {
  const { wlacz } = await aplikacja({ kup: 'oczekujacy' });
  render(<EkranOfert />);
  await kup();
  await screen.findByText(/Waiting for approval\. Oczko Pro/);
  await wlacz();
  expect(await screen.findByText('Oczko Pro is on.')).toBeTruthy();
  expect(linie()).toEqual(['oferty-pro-wlaczone']);
});
test('P-330: Pro włączone bez oczekującego zakupu w tej sesji ekranu → bez komunikatu „Oczko Pro is on.”', async () => {
  const { wlacz } = await aplikacja({});
  render(<EkranOfert />);
  await waitFor(() => expect(screen.getByTestId('oferty-kup')).toBeTruthy());
  await wlacz();
  expect(linie()).toEqual([]);
});

// Przegląd subagenta (ścieżka wrażliwa, zakupy): P1-1 przywrócenie w trakcie oczekującego zakupu; P1-2 podwójne stuknięcie „kup” przed odpowiedzią sklepu.
test('przegląd P1-1: przywrócenie w trakcie oczekującego zakupu nie odblokowuje „kup”, nie gubi oczekiwania i nie mówi „No purchase found”', async () => {
  const { sklep, wlacz } = await aplikacja({ kup: 'oczekujacy' });
  render(<EkranOfert />);
  await kup();
  await screen.findByText(/Waiting for approval\. Oczko Pro/);
  await userEvent.press(screen.getByTestId('oferty-przywroc'));
  await waitFor(() => expect(sklep.przywroc).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: 'Waiting for approval' }).props.accessibilityState).toMatchObject({ disabled: true });
  expect(screen.queryByTestId('oferty-przywroc-nic')).toBeNull();
  await wlacz();
  expect(await screen.findByText('Oczko Pro is on.')).toBeTruthy();
});
test('przegląd P1-2: dwa szybkie stuknięcia „kup” przed odpowiedzią sklepu → jedno wywołanie sklep.kup', async () => {
  const { sklep } = await aplikacja({});
  const d = odroczona<StatusZakupu>();
  sklep.kup.mockImplementation(() => d.p);
  render(<EkranOfert />);
  await waitFor(() => expect(screen.getByTestId('oferty-kup')).toBeTruthy());
  await userEvent.press(screen.getByTestId('oferty-kup'));
  await userEvent.press(screen.getByTestId('oferty-kup'));
  expect(sklep.kup).toHaveBeenCalledTimes(1);
  await act(async () => { d.r('anulowany'); });
});
