// 033-T1 (07-jakosc-033 A, lista dla 08 #2): testID tekstów wyniku na TRASIE „/” (app/index.tsx), na prawdziwej bazie — scenariusze E2E 55, 58 i 57 czytają je zamiast tekstu
// zależnego od brzmienia i locale. Elementy: `licznik-powtorzenie` (RD-12), `licznik-calosc` (BR-LIC-018/S1), `licznik-notatka` (BR-PRJ-002/S1). P-377: test montuje trasę z `app/`.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Sklep, Zegarek, ZdarzenieWejsciowe } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki } from './pomoc';

jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ usePathname: () => '/', useRouter: () => mockRouter, useFocusEffect: () => undefined }));
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
  const zegarek: Zegarek = {
    potwierdz: () => undefined, wyslijStan: async () => undefined,
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

const dane = (...u: Parameters<typeof wykonaj>[1]) => [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 17), ...u];

describe('033-T1: testID tekstów wyniku licznika na trasie „/”', () => {
  test('licznik-powtorzenie: długość 8, 17 skończonych → element z tekstem „repeat 3, row 1 of 8”', async () => {
    await trasa(dane(['UPDATE licznik SET dlugosc_powtorzenia = 8 WHERE id = ?', ['l1']]));
    const el = await screen.findByTestId('licznik-powtorzenie');
    expect(JSON.stringify(el.props.children)).toMatch(/repeat 3, row 1 of 8/);
  });
  test('licznik-calosc: część z dwoma licznikami (17 + 3) → element z tekstem całości (np. „Przód in total: 20 rows”)', async () => {
    await trasa(dane(...licznik('l2', 'c1', 3, { kolejnosc: 2 })));
    const el = await screen.findByTestId('licznik-calosc');
    expect(JSON.stringify(el.props.children)).toMatch(/20/);
  });
  test('licznik-notatka: notatka projektu → nagłówek „Note” i treść mają testID (nagłówek: licznik-notatka)', async () => {
    await trasa(dane(['UPDATE projekt SET notatka = ? WHERE id = ?', ['ujmowanie co 4 rzędy', 'p1']]));
    const el = await screen.findByTestId('licznik-notatka');
    expect(JSON.stringify(el.props.children)).toMatch(/Note/);
    expect(await screen.findByText('ujmowanie co 4 rzędy')).toBeTruthy();
  });
});
