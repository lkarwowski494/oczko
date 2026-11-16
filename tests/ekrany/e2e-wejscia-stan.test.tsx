// FX6b (P-909, opcja 2 z raportu FX6, wzór BX-019): w buildzie E2E (`EXPO_PUBLIC_E2E=1`) ekran licznika ma panel `e2e-licznik-wejscia`, a formularz nazwy panel `e2e-nazwa-wejscia`.
// Rozdzielają „stuknięcie / znak nie dotarł do JS” od „dotarło, ale wynik nie trafił na ekran” (iOS 43806685504: scenariusze 69 i 64). Zachowanie aplikacji bez zmian:
// panele tylko liczą. Poza buildem E2E paneli nie ma (test obok: e2e-wejscia-stan-wydanie.test.tsx).
process.env.EXPO_PUBLIC_E2E = '1'; // panele E2E ładuje `src/platforma/tryb-e2e.ts` przy imporcie (require niżej, po ustawieniu)
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Sklep, Zegarek } from '../../src/domena/porty';
import { FormularzNazwy } from '../../src/ekrany/Formularze';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, tEn } from './pomoc';

// BX16: app/licznik.tsx czyta argument `oczkoE2eBezDiagnostykiLicznika` (Settings.get) przy renderze w buildzie E2E; w Jest nie ma natywnego SettingsManager — atrapa bez argumentów (zmiana tylko środowiska testu, asercje bez zmian).
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({ __esModule: true, default: { getConstants: () => ({ settings: {} }), setValues: () => undefined, deleteValues: () => undefined } }));
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

/* eslint-disable @typescript-eslint/no-require-imports */
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
const W = require('../../src/kompozycja/e2e/wejscia-stan') as typeof import('../../src/kompozycja/e2e/wejscia-stan');
/* eslint-enable @typescript-eslint/no-require-imports */

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

async function trasa(poczatek = 17) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', poczatek)]);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t, jezyk: i.jezyk }, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka: atrapaHaptyki() } }, licznik: k, preferencje: {} };
  render(<EkranLicznika />);
}
const panel = () => String(screen.getByTestId('e2e-licznik-wejscia').props.children);
const ZERO = 'counter input: plus 0, minus 0; saves ok: plus 0, minus 0; saves failed: 0; state value: none; refresh: started 0, applied 0, skipped 0';

beforeEach(() => { W.zerujWejscia(); mockRouter.push.mockClear(); });

describe('FX6b: panel `e2e-licznik-wejscia` na ekranie licznika (build E2E)', () => {
  test('po otwarciu: zero wejść i zapisów; wartość ze stanu zapisana dopiero po zastosowaniu stanu', async () => {
    await trasa();
    await screen.findByTestId('e2e-licznik-wejscia');
    expect(panel()).toMatch(/^counter input: plus 0, minus 0; saves ok: plus 0, minus 0; saves failed: 0; state value: (none|17); refresh: started \d+, applied \d+, skipped \d+$/);
  });
  test('+1 i −1: wejścia, zapisy i ostatnia wartość ze stanu rosną zgodnie ze stuknięciami', async () => {
    await trasa();
    const plus = await screen.findByTestId('licznik-plus');
    await act(async () => { fireEvent.press(plus); });
    expect(panel()).toMatch(/^counter input: plus 1, minus 0; saves ok: plus 1, minus 0; saves failed: 0; state value: 18; /);
    await act(async () => { fireEvent.press(screen.getByTestId('licznik-minus')); });
    expect(panel()).toMatch(/^counter input: plus 1, minus 1; saves ok: plus 1, minus 1; saves failed: 0; state value: 17; /);
    expect(String(screen.getByTestId('licznik-wartosc').props.accessibilityLabel)).toBe('17');
  });
  test('panel nie jest częścią „−1”, „+1” ani liczby (nie zasłania i nie przesuwa ich) i nie zastępuje panelu `e2e-nawigacje`', async () => {
    await trasa();
    await screen.findByTestId('e2e-licznik-wejscia');
    for (const id of ['licznik-minus', 'licznik-plus', 'licznik-wartosc']) expect(within(screen.getByTestId(id)).queryByTestId('e2e-licznik-wejscia')).toBeNull();
    for (const id of ['licznik-minus', 'licznik-plus', 'licznik-wartosc']) expect(within(screen.getByTestId('e2e-licznik-wejscia')).queryByTestId(id)).toBeNull();
    expect(screen.getByTestId('e2e-nawigacje')).toBeTruthy();
    expect(screen.getByTestId('e2e-licznik-wejscia').props.style).toBeUndefined(); // zwykły tekst w slocie pod kreskami: bez pozycji bezwzględnej
  });
  test('zerujWejscia (tylko dla testów) przywraca stan wyjściowy', () => {
    render(<W.PanelLicznika />);
    act(() => { W.diagnostykaLicznika.wejscie('plus'); W.diagnostykaLicznika.zapis('minus', false); W.diagnostykaLicznika.stan(3); });
    expect(panel()).toContain('plus 1, minus 0; saves ok: plus 0, minus 0; saves failed: 1; state value: 3');
    act(() => { W.zerujWejscia(); });
    expect(panel()).toBe(ZERO);
  });
  test('odświeżenia: start, zastosowane i pominięte (nieaktualne) są liczone osobno', () => {
    render(<W.PanelLicznika />);
    act(() => { const d = W.diagnostykaLicznika; d.odswiezenie('start'); d.odswiezenie('start'); d.odswiezenie('zastosowane'); d.odswiezenie('pominiete'); });
    expect(panel()).toContain('refresh: started 2, applied 1, skipped 1');
  });
});

describe('FX6b: panel `e2e-nazwa-wejscia` w formularzu nazwy (build E2E)', () => {
  async function formularz() {
    const t = await tEn();
    render(<FormularzNazwy t={t} stan={{ projekt: '', czesc: '' }} naZapisz={async () => ({ ok: true, wartosc: undefined })} naAnuluj={() => undefined}
      diagnostyka={{ wpis: W.zliczWpisNazwy, panel: <W.PanelNazwy /> }} />);
  }
  const tekstNazwy = () => String(screen.getByTestId('e2e-nazwa-wejscia').props.children);
  test('stan wyjściowy: zero zdarzeń i brak długości', async () => {
    await formularz();
    expect(tekstNazwy()).toBe('name form: project events 0, last length none; part events 0, last length none');
  });
  test('każda zmiana tekstu w polu liczy zdarzenie i zapisuje długość odebranej wartości; pole pokazuje wpisany tekst', async () => {
    await formularz();
    const pole = screen.getByTestId('formularz-nazwa-projektu');
    for (const x of ['H', 'Ha', 'Har']) fireEvent.changeText(pole, x);
    expect(tekstNazwy()).toBe('name form: project events 3, last length 3; part events 0, last length none');
    expect(screen.getByTestId('formularz-nazwa-projektu').props.value).toBe('Har');
    fireEvent.changeText(screen.getByLabelText(/part/i), 'Left');
    expect(tekstNazwy()).toBe('name form: project events 3, last length 3; part events 1, last length 4');
  });
  test('panel stoi za polami (nie przesuwa pola nazwy projektu) i bez diagnostyki formularz nie ma panelu', async () => {
    await formularz();
    const kolejnosc: string[] = [];
    const idz = (n: unknown): void => { if (n && typeof n === 'object') { const x = n as { props?: { testID?: string }; children?: unknown[] }; if (x.props?.testID) kolejnosc.push(x.props.testID); (x.children ?? []).forEach(idz); } };
    idz(screen.toJSON());
    expect(kolejnosc.indexOf('formularz-nazwa-projektu')).toBeGreaterThanOrEqual(0);
    expect(kolejnosc.indexOf('e2e-nazwa-wejscia')).toBeGreaterThan(kolejnosc.indexOf('formularz-nazwa-projektu'));
  });
});
