// 07-jakosc-032 (raport zgodności 1.0, JAK-04): testy TRASY „/” (app/index.tsx) dla luk, które miały tylko test komponentu z podanymi propsami
// albo test kompozycji bez ekranu. Trasa jest prawdziwa (Aplikacja + Licznik + kompozycja licznika) na prawdziwej bazie (node:sqlite);
// atrapy tylko na granicy platformy: router, haptyka, zegarek, Live Activity, sklep, stoper (osobne testy).
// Każdy test ma dowód mutacji (cofnięcie poprawki w kopii kodu → czerwony): docs/jakosc/stan.md, sekcja „032 · 2026-11-02”.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Sklep, StanZegarka, Zegarek, ZdarzenieWejsciowe } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { ile, jeden, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, zagrane } from './pomoc';

jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useFocusEffect: () => undefined }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
const mockApp: { biezaca: unknown } = { biezaca: null };
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockApp.biezaca }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranLicznika = (require('../../app/index') as { default: React.ComponentType }).default;

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

/** Trasa „/” na prawdziwej bazie: `seed` zakłada dane przed otwarciem ekranu; `z.zdarzenie(linie)` to zdarzenie z zegarka (granica platformy). */
async function trasa(seed: Parameters<typeof wykonaj>[1]) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const haptyka = atrapaHaptyki();
  let odbior: ((z: ZdarzenieWejsciowe[]) => void) | null = null;
  const stany: StanZegarka[] = [];
  const zegarek: Zegarek = {
    potwierdz: () => undefined, wyslijStan: async (st) => { stany.push(st); },
    odbieraj: (fn) => { odbior = fn; return () => { odbior = null; }; },
  };
  await wykonaj(s.baza, seed);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1'); // zapamiętuje „ostatnie miejsce”: trasa „/” startuje na tym liczniku (BR-PRJ-011)
  mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t }, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka } }, licznik: k, preferencje: {} };
  render(<EkranLicznika />);
  return { s, k, haptyka, zdarzenie: (linie: ZdarzenieWejsciowe[]) => { s.dziennik.linie.push(...linie); odbior?.(linie); } };
}
const liczba = () => screen.getByTestId('licznik-wartosc').children.join('');

/** Domyka asynchroniczne aktualizacje stanu trasy po zapisie (efekty po +1) wewnątrz `act` — repozytorium nie dopuszcza ostrzeżeń act (BR-TEST-018). Nie jest asercją czasu. */
const ustabilizuj = () => act(async () => { await new Promise((r) => setTimeout(r, 40)); });
const czekajNa = async (n: string) => { await waitFor(() => expect(liczba()).toBe(n), { timeout: 10_000 }); await ustabilizuj(); };
const plus = async () => { fireEvent.press(await screen.findByTestId('licznik-plus')); };
const dane = (n: number, o: { rodzaj?: string } = {}) => [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', n, o)];

beforeEach(() => { mockRouter.push.mockClear(); });

describe('07-jakosc-032: trasa „/” (app/index.tsx) na prawdziwej bazie', () => {
  test('032-020 (F-05, RD-12-W1/W3): 17 skończonych rzędów, powtórzenie co 8 → na ekranie „repeat 3 · row 1 of 8”, po +1 „row 2 of 8” (wektory: docs/brd/reguly.md RD-12)', async () => {
    await trasa([...dane(17), ['UPDATE licznik SET dlugosc_powtorzenia = 8 WHERE id = ?', ['l1']]]);
    await czekajNa('17');
    expect(await screen.findByText(/repeat 3 · row 1 of 8/)).toBeTruthy();
    await plus();
    await czekajNa('18');
    expect(await screen.findByText(/repeat 3 · row 2 of 8/)).toBeTruthy();
  });

  test('032-009 (F-48, BR-LIC-020 S2, RD-15): przy celu dnia 10 dziesiąte +1 wibruje wzorem przypomnienia, rzędy 1–9 wzorem rzędu', async () => {
    // Cel części 100 rzędów, termin 2026-10-31, dziś 2026-10-22 (d = 10) → cel na dziś ⌈100 / 10⌉ = 10 (RD-15, rachunek).
    const u = await trasa([...dane(0), ['UPDATE projekt SET termin_dzien = ? WHERE id = ?', ['2026-10-31', 'p1']], ['UPDATE czesc SET cel_rzedow = 100 WHERE id = ?', ['c1']]]);
    await czekajNa('0');
    for (let n = 1; n <= 9; n++) { await plus(); await czekajNa(String(n)); }
    expect([zagrane(u.haptyka, 'plus'), zagrane(u.haptyka, 'rzadZInstrukcja')]).toEqual([9, 0]);
    await plus();
    await czekajNa('10');
    await waitFor(() => expect(zagrane(u.haptyka, 'rzadZInstrukcja')).toBe(1));
    expect(zagrane(u.haptyka, 'plus')).toBe(9);
  });

  test('032-005 (F-12, ADR-0030): +1 z zegarka przy otwartej aplikacji → licznik na ekranie rośnie bez ponownego otwarcia (trasa podpina poZegarku)', async () => {
    const u = await trasa(dane(3));
    await czekajNa('3');
    const l = await jeden<{ glowa: string }>(u.s.baza, 'SELECT glowa FROM licznik WHERE id = ?', ['l1']);
    const teraz = u.s.zegar.teraz();
    u.zdarzenie([{ id: 'zeg1', licznikId: 'l1', rodzaj: 'plus', rodzice: [l.glowa], czasMs: teraz.ms + 1000, strefa: teraz.strefa, dzien: teraz.dzien, zrodlo: 'zegarek', urzadzenie: 'zegarek-test', pro: false }]);
    await czekajNa('4');
    expect(await ile(u.s.baza, 'zdarzenie', 'licznik_id = ?', ['l1'])).toBe(4);
  });

  test('032-029 (F-01, BR-LIC-002 S3): −1 przy 0 w projekcie nie zmienia ekranu i nie zapisuje zdarzenia; +1 po nim daje 1', async () => {
    const u = await trasa(dane(0));
    await czekajNa('0');
    fireEvent.press(await screen.findByTestId('licznik-minus'));
    await czekajNa('0');
    await waitFor(async () => expect(await ile(u.s.baza, 'zdarzenie', 'licznik_id = ?', ['l1'])).toBe(0));
    await plus();
    await czekajNa('1');
    expect(await ile(u.s.baza, 'zdarzenie', 'licznik_id = ?', ['l1'])).toBe(1);
  });

  test('032-014 (F-02, F-47, BR-LIC-019 S3): trzy szybkie +1 → baner serii z „Undo 3 rows”; stuknięcie cofa serię do 0 i ekran mówi „Removed 3 rows. Back to 0.”', async () => {
    const u = await trasa(dane(0));
    await czekajNa('0');
    for (let n = 1; n <= 3; n++) { await plus(); await czekajNa(String(n)); }
    expect(String(screen.getByTestId('baner-serii').props.children)).toMatch(/^Added 3 rows/);
    fireEvent.press(screen.getByRole('button', { name: 'Undo 3 rows' }));
    await czekajNa('0');
    expect(await screen.findByText('Removed 3 rows. Back to 0.')).toBeTruthy();
    expect(screen.queryByTestId('baner-serii')).toBeNull();
    expect(await jeden<{ wartosc: number }>(u.s.baza, 'SELECT wartosc FROM licznik WHERE id = ?', ['l1'])).toEqual({ wartosc: 0 });
  });

  test('032-F09 (F-09, BR-LIC-012): tryb „rząd w trakcie” — podpis „current row”, bez linii „Now working row n”', async () => {
    await trasa([...dane(5), ['UPDATE licznik SET znaczenie = ? WHERE id = ?', ['w_trakcie', 'l1']]]);
    await screen.findByTestId('licznik-wartosc');
    expect(screen.getByText('current row')).toBeTruthy();
    expect(screen.queryByTestId('licznik-teraz-rzad')).toBeNull();
    expect(screen.queryByText(/Now working row/)).toBeNull();
  });

  test('032-025 (F-04, BR-LIC-006): licznik oczek — „stitches” i „Add stitch”, bez linii „Now working row n” i bez celu rzędów', async () => {
    await trasa([...dane(5, { rodzaj: 'oczka' }), ['UPDATE czesc SET cel_rzedow = 96 WHERE id = ?', ['c1']]]);
    await screen.findByTestId('licznik-wartosc');
    expect(screen.getByText('stitches')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add stitch' })).toBeTruthy();
    expect(screen.queryByTestId('licznik-teraz-rzad')).toBeNull();
    expect(screen.queryByText(/of 96/)).toBeNull();
  });
});
