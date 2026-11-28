// BX16 / KO-121 (a), strona negatywna: bez `EXPO_PUBLIC_E2E=1` (build wydania, P-238) argument `oczkoE2eBezDiagnostykiLicznika` nic nie zmienia, a modułu paneli (napisy „counter input …”,
// testID `e2e-licznik-wejscia`) nie ma w kodzie ekranu. Do tego: skrypt śladów w bundlu wydania (scripts/wydanie/slady-testowe.mjs, JAK-15) odrzuca bundel z kluczem argumentu.
delete process.env.EXPO_PUBLIC_E2E;
import React from 'react';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Sklep, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki } from './pomoc';

const mockUstawienia: Record<string, string> = { oczkoE2eBezDiagnostykiLicznika: '1' }; // jakby ktoś podał argument builda wydania
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({ __esModule: true, default: { getConstants: () => ({ settings: mockUstawienia }), setValues: () => undefined, deleteValues: () => undefined } }));
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
const Tryb = require('../../src/platforma/tryb-e2e') as typeof import('../../src/platforma/tryb-e2e');
/* eslint-enable @typescript-eslint/no-require-imports */

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined, aktywna: () => false };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

test('poza buildem E2E: argument „1” jest ignorowany (bezDiagnostykiLicznika = false), ekran licznika bez paneli `e2e-`', async () => {
  expect(Tryb.paneleE2e).toBeNull();
  expect(Tryb.bezDiagnostykiLicznika()).toBe(false);
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
  expect(screen.queryByTestId('e2e-licznik-wejscia')).toBeNull();
});

test('bundel wydania z kluczem „oczkoE2eBezDiagnostykiLicznika” albo panelem „counter input” → skrypt śladów kończy się kodem 1', () => {
  const hermes = (...napisy: string[]) => Buffer.concat([Buffer.from('c61fbc03c103191f', 'hex'), Buffer.from(['zapas-lista', ...napisy].join('\0'))]);
  const skrypt = join(__dirname, '../../scripts/wydanie/slady-testowe.mjs');
  for (const napis of ['oczkoE2eBezDiagnostykiLicznika', 'e2e-licznik-wejscia']) {
    const p = join(mkdtempSync(join(tmpdir(), 'slady-bx16-')), 'main.jsbundle');
    writeFileSync(p, hermes(napis));
    const w = spawnSync(process.execPath, [skrypt, p], { encoding: 'utf8' });
    expect({ napis, kod: w.status }).toEqual({ napis, kod: 1 });
  }
});
