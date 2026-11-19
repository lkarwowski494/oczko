// ZR2 (KO-179, P-993; werdykt 07 U2/U4 `docs/jakosc/werdykt-build-1221.md`): build zrzutów sklepu (`EXPO_PUBLIC_E2E=1` + `EXPO_PUBLIC_ZRZUTY=1`) nie ma żadnej nakładki ani napisu diagnostycznego E2E
// (`window: …`, `taps accepted: …`, `touch: …`, `notes: …`, `pattern presses: …`, `counter input: …`, `p95 …`), a przyciski sterujące scenariuszy zrzutów (`e2e-sklep-wygas`, `e2e-wzor-sklep-*`) zostają.
// Trzy warstwy: (1) bramka `diagnostykaE2e` w tryb-e2e.ts, (2) render korzenia nawigacji i ekranu licznika w trybie zrzutów, (3) skan źródeł: każdy panel z `app/` poza listą sterujących idzie przez `diagnostykaE2e`,
// więc nowa nakładka dodana na skróty przez `paneleE2e` zrobi ten test czerwonym. Zwykły build E2E (jakosc-ios) bez zmian: `diagnostykaE2e === paneleE2e` (testy `e2e-*-stan` obok).
process.env.EXPO_PUBLIC_E2E = '1';
process.env.EXPO_PUBLIC_ZRZUTY = '1';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AppState } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Sklep, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki } from './pomoc';

const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({ __esModule: true, default: { getConstants: () => ({ settings: {} }), setValues: () => undefined, deleteValues: () => undefined } }));
const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => {
  const Stack = ({ children }: { children: React.ReactNode }) => mockReact.createElement(mockRn.View, { testID: 'stos' }, children);
  Stack.Screen = () => null;
  return { Stack, usePathname: () => '/', useRouter: () => mockRouter, useFocusEffect: () => undefined };
});
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: async () => ({ tryb: 'normalny' }), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined, zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony',
}));
jest.mock('../../src/kompozycja/kontener', () => ({
  utworzKontener: async () => ({
    ok: true,
    wartosc: {
      dostep: { nasluchuj: () => () => undefined, odswiez: async () => undefined, stan: () => ({ pro: false }), naZmiane: () => () => undefined },
      z: {}, j: {}, icloud: null, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { k: { obserwujSiec: () => () => undefined, poStarcie: async () => undefined, odswiezMigawke: async () => undefined } },
    },
  }),
}));
jest.mock('../../src/kompozycja/bledy-js', () => ({ zainstalujObslugeBledow: () => ({ ustawZapis: () => undefined }) }));
jest.mock('../../src/kompozycja/licznik', () => {
  const rzecz = jest.requireActual<typeof import('../../src/kompozycja/licznik')>('../../src/kompozycja/licznik');
  return { ...rzecz, kompozycjaLicznika: (...a: Parameters<typeof rzecz.kompozycjaLicznika>) => (mockUzyjPrawdziwego.tak ? rzecz.kompozycjaLicznika(...a) : { zamknij: jest.fn(), poZmianie: jest.fn(async () => undefined) }) };
});
const mockUzyjPrawdziwego = { tak: false };
jest.mock('../../src/kompozycja/preferencje', () => ({ preferencje: () => ({ wczytaj: async () => undefined, stan: () => ({ wibracje: true, ekranNieGasnie: false }) }) }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu(), portOceny: { popros: jest.fn() }, otworzAdres: jest.fn() };
});
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
const mockApp: { biezaca: unknown } = { biezaca: null };
jest.mock('../../src/kompozycja/Kontekst', () => ({
  DostawcaAplikacji: ({ children }: { children: React.ReactNode }) => children,
  useAplikacja: () => mockApp.biezaca,
}));

/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
const Tryb = require('../../src/platforma/tryb-e2e') as typeof import('../../src/platforma/tryb-e2e');
/* eslint-enable @typescript-eslint/no-require-imports */

/** Wszystkie testID diagnostyczne E2E, które nie mogą trafić do kadru sklepu (napisy w rogach i pod kreskami licznika). */
const DIAGNOSTYCZNE = ['e2e-okno', 'e2e-nacisniecia', 'e2e-dotyk', 'e2e-wzor-notatki', 'e2e-nawigacje', 'e2e-licznik-wejscia', 'e2e-pomiar-plus', 'e2e-pomiar-ladowania', 'e2e-nazwa-wejscia', 'e2e-zegarek-stan'];

describe('bramka trybu zrzutów (tryb-e2e.ts)', () => {
  test('w buildzie zrzutów: ZRZUTY = true, diagnostykaE2e = null, a paneleE2e zostaje (przyciski sterujące scenariuszy zrzutów)', () => {
    expect(Tryb.ZRZUTY).toBe(true);
    expect(Tryb.diagnostykaE2e).toBeNull();
    expect(Tryb.paneleE2e).not.toBeNull();
    expect(typeof Tryb.paneleE2e?.PanelSklepu).toBe('function'); // e2e-sklep-wygas (99-zakup.yaml)
    expect(typeof Tryb.paneleE2e?.PanelWzoru).toBe('function'); // e2e-wzor-sklep-* (00-przygotuj.yaml)
  });
  test('zwykły build E2E (bez EXPO_PUBLIC_ZRZUTY): diagnostykaE2e = paneleE2e, ZRZUTY = false (jakosc-ios bez zmian)', () => {
    const bylo = process.env.EXPO_PUBLIC_ZRZUTY;
    delete process.env.EXPO_PUBLIC_ZRZUTY;
    try {
      jest.isolateModules(() => {
        const t = require('../../src/platforma/tryb-e2e') as typeof import('../../src/platforma/tryb-e2e'); // eslint-disable-line @typescript-eslint/no-require-imports
        expect(t.ZRZUTY).toBe(false);
        expect(t.paneleE2e).not.toBeNull();
        expect(t.diagnostykaE2e).toBe(t.paneleE2e);
      });
    } finally { process.env.EXPO_PUBLIC_ZRZUTY = bylo; }
  });
  test('bez EXPO_PUBLIC_E2E sam EXPO_PUBLIC_ZRZUTY niczego nie włącza (ZRZUTY = false, panele null)', () => {
    const bylo = process.env.EXPO_PUBLIC_E2E;
    delete process.env.EXPO_PUBLIC_E2E;
    try {
      jest.isolateModules(() => {
        const t = require('../../src/platforma/tryb-e2e') as typeof import('../../src/platforma/tryb-e2e'); // eslint-disable-line @typescript-eslint/no-require-imports
        expect(t.ZRZUTY).toBe(false);
        expect(t.paneleE2e).toBeNull();
        expect(t.diagnostykaE2e).toBeNull();
      });
    } finally { process.env.EXPO_PUBLIC_E2E = bylo; }
  });
});

describe('render w trybie zrzutów', () => {
  test('korzeń nawigacji: stos jest, żadnej nakładki diagnostycznej (`window: …`, `taps accepted: …`, `touch: …`)', async () => {
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
    render(<Korzen />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(screen.getByTestId('stos')).toBeTruthy();
    for (const id of DIAGNOSTYCZNE) expect({ id, jest: screen.queryByTestId(id) !== null }).toEqual({ id, jest: false });
    expect(screen.queryByText(/^window: /)).toBeNull();
    expect(screen.queryByText(/^taps accepted: /)).toBeNull();
    expect(screen.queryByText(/^touch: /)).toBeNull();
  });

  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
  const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;
  test('ekran licznika: licznik działa, bez paneli wejść, nawigacji, pomiaru i zegarka', async () => {
    mockUzyjPrawdziwego.tak = true;
    const s = await przygotuj();
    const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
    const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 17)]);
    const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true, aplikacjaAktywna: () => true });
    expect((await k.przygotuj()).ok).toBe(true);
    await k.otworz('l1');
    mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t, jezyk: i.jezyk }, porty: { sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka: atrapaHaptyki() } }, licznik: k, preferencje: {} };
    render(<EkranLicznika />);
    await screen.findByTestId('licznik-plus');
    for (const id of DIAGNOSTYCZNE) expect({ id, jest: screen.queryByTestId(id) !== null }).toEqual({ id, jest: false });
    expect(screen.queryByText(/^(pattern presses|counter input|p95|Watch state)/)).toBeNull();
  });
});

describe('skan źródeł: panele diagnostyczne tylko przez `diagnostykaE2e`', () => {
  // Elementy `paneleE2e` wolno brać wprost tylko dla: przycisków sterujących scenariuszy (sklep, wzór, zdjęcie, Ustawienia, iCloud), trybu awaryjnego i atrap bez napisu na ekranie (hak oceny, adresu, udawany zegarek).
  const STERUJACE = new Set(['PanelSklepu', 'PanelWzoru', 'PanelZdjecia', 'PanelUstawien', 'PanelIcloud', 'PanelAwaryjny', 'ZnacznikAwarii', 'zapamietajAdres', 'zliczajProsby', 'zegarekSztucznyZJezykiem']);
  const KORZEN = path.join(__dirname, '..', '..');
  const pliki = (kat: string): string[] => fs.readdirSync(kat, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? pliki(path.join(kat, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(kat, e.name)] : []));
  const zrodla = [...pliki(path.join(KORZEN, 'app')), ...pliki(path.join(KORZEN, 'src', 'ekrany')), ...pliki(path.join(KORZEN, 'src', 'kompozycja'))].filter((p) => !p.includes(`${path.sep}e2e${path.sep}`));

  test('każde użycie `paneleE2e.<element>` w app/, src/ekrany i src/kompozycja dotyczy elementu sterującego', () => {
    const obce: string[] = [];
    for (const p of zrodla) {
      const tekst = fs.readFileSync(p, 'utf8');
      for (const m of tekst.matchAll(/\bpaneleE2e\??\.(\w+)/g)) if (!STERUJACE.has(m[1])) obce.push(`${path.relative(KORZEN, p)}: paneleE2e.${m[1]}`);
    }
    expect(obce).toEqual([]);
  });
  test('rozpoznanie działa: skan widzi użycia elementów sterujących (test nie jest pusty)', () => {
    const uzyte = new Set<string>();
    for (const p of zrodla) for (const m of fs.readFileSync(p, 'utf8').matchAll(/\bpaneleE2e\??\.(\w+)/g)) uzyte.add(m[1]);
    expect(uzyte.has('PanelSklepu') && uzyte.has('PanelWzoru')).toBe(true);
  });
  test('workflow zrzutów ustawia EXPO_PUBLIC_ZRZUTY, a jakosc-ios.yml nie', () => {
    const zrzuty = fs.readFileSync(path.join(KORZEN, '.github/workflows/zrzuty-sklepu.yml'), 'utf8');
    const jakosc = fs.readFileSync(path.join(KORZEN, '.github/workflows/jakosc-ios.yml'), 'utf8');
    expect(zrzuty).toMatch(/^\s+EXPO_PUBLIC_ZRZUTY: '1'/m);
    expect(jakosc).not.toContain('EXPO_PUBLIC_ZRZUTY');
  });
});
