// M1-audytor-generalny-063 (02-monetyzacja-002, MON-05, wzorzec „zamrożony stan po zakupie”): ekran licznika na TRASIE „/” (app/index.tsx) na
// prawdziwej bazie i prawdziwym `dostepPro` na sztucznym sklepie. Pro nadane poza ekranem ofert (zdarzenie sklepu: Ask to Buy, zakup na innym
// urządzeniu) zdejmuje limit z otwartego licznika bez nawigacji; powrót na pierwszy plan woła ponowną decyzję dostępu, więc subskrypcja, która
// wygasła przy aplikacji w pamięci, nie trwa do restartu.
import React from 'react';
import { View } from 'react-native';
import { act, render, screen, waitFor, within } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { dostepPro } from '../../src/kompozycja/dostep';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { czesc, dzienLimitu, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki } from './pomoc';

jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ usePathname: () => '/', useRouter: () => mockRouter, useFocusEffect: () => undefined }));
const mockCykl: { przejdz: (s: 'active' | 'background' | 'inactive') => void } = { przejdz: () => undefined };
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  const c = p.atrapaCyklu();
  mockCykl.przejdz = c.przejdz;
  return { cyklAplikacji: c.cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
const mockApp: { biezaca: unknown } = { biezaca: null };
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockApp.biezaca }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
// M3 p2: cykl życia (powrót na pierwszy plan → scalenie i decyzja dostępu) ma korzeń „Dziś” pod licznikiem w stosie; test 2 składa oba jak stos nawigacji.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranDzis = (require('../../app/(zakladki)/index') as { default: React.ComponentType }).default;

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };

/** Licznik po 5 darmowych dniach października (dziś nie zaczęty, P-065) → „limit zawczasu”; dostęp z prawdziwego `dostepPro` (teraz sterowane). */
async function trasaNaLimicie(stos = false) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const dni = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'].map((d, n) => dzienLimitu(d, `l1-z${n + 1}`));
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5, { t: T0 - 3 * DOBA }), ...dni]);
  const czas = { ms: T0 };
  const sklep = sklepSztuczny(() => T0);
  const transakcje = jest.spyOn(sklep, 'transakcje');
  const plik = { tekst: null as string | null };
  const dostep = dostepPro(sklep, { czytaj: async () => plik.tekst, zapisz: async (t) => { plik.tekst = t; } }, () => czas.ms);
  const koniecNasluchu = dostep.nasluchuj(); // KP-07: jak korzeń app/_layout.tsx
  await dostep.odswiez();
  const k = kompozycjaLicznika({ ...s.z, pro: () => dostep.stan().pro, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true, dostep }); // jak korzeń app/_layout.tsx
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  mockApp.biezaca = { naAwarie: jest.fn(), kontener: { z: s.z, j: { t: i.t, jezyk: i.jezyk }, icloud: null, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka: atrapaHaptyki() } }, licznik: k, preferencje: {} };
  render(stos ? <><EkranDzis /><View testID="trasa-licznika"><EkranLicznika /></View></> : <EkranLicznika />);
  expect(await (stos ? within(await screen.findByTestId('trasa-licznika')) : screen).findByTestId('limit-zawczasu')).toBeTruthy();
  return { sklep, dostep, czas, transakcje, koniecNasluchu };
}

beforeEach(() => { mockRouter.push.mockClear(); });

test('M1-063: Pro ze zdarzenia sklepu przy otwartym liczniku → limit znika bez nawigacji', async () => {
  const t = await trasaNaLimicie();
  await act(async () => { await t.sklep.kup('oczko.pro.yearly'); }); // zakup zatwierdzony poza ekranem ofert → nasłuch → nowa decyzja
  await waitFor(() => expect(t.dostep.stan().pro).toBe(true));
  await waitFor(() => expect(screen.queryByTestId('limit-zawczasu')).toBeNull());
  expect(mockRouter.push).not.toHaveBeenCalled();
  t.koniecNasluchu();
});

test('M1-063: subskrypcja wygasła przy aplikacji w pamięci → powrót na pierwszy plan woła decyzję dostępu i limit wraca', async () => {
  const t = await trasaNaLimicie(true);
  const licznikNaWierzchu = within(screen.getByTestId('trasa-licznika'));
  await act(async () => { await t.sklep.kup('oczko.pro.yearly'); });
  await waitFor(() => expect(licznikNaWierzchu.queryByTestId('limit-zawczasu')).toBeNull());
  t.czas.ms = T0 + 31 * DOBA; // koniec okresu (sztuczny sklep: 30 dni) minął, nikt nie wywołał odczytu
  const przed = t.transakcje.mock.calls.length;
  await act(async () => { mockCykl.przejdz('background'); mockCykl.przejdz('active'); });
  await waitFor(() => expect(t.transakcje.mock.calls.length).toBeGreaterThan(przed));
  await waitFor(() => expect(t.dostep.stan().pro).toBe(false));
  expect(await licznikNaWierzchu.findByTestId('limit-zawczasu')).toBeTruthy();
  expect(mockRouter.push).not.toHaveBeenCalled();
  t.koniecNasluchu();
});
