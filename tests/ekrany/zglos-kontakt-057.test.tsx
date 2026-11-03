// M1-audytor-generalny-057 (11-wzrost-001, moduł roli 11 `pomiar-prywatny`, wiersz „Zgłoszenia w aplikacji”: e-mail bez konta): ekran „Report a problem”
// mówi, dokąd wysłać zgłoszenie — adres kontaktu widoczny przed „Share”, ten sam co na stronie wsparcia i w polityce (site/support.html, site/privacy.html).
// Wyjście nadal tylko arkuszem udostępniania (BR-DAN-010/S2): adres w tekście, bez mailto i bez sieci.
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react-native';
import { ADRES_WSPARCIA } from '../../src/kompozycja/adresy';
import { przygotuj } from '../dane/pomocnicze/srodowisko';
import { tEn } from './pomoc';

const mockRouter = { back: jest.fn() };
const mockSystem = { udostepnij: jest.fn(), otworzAdres: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: mockSystem }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0', ios: { buildNumber: '2001' } }, platform: { ios: { model: 'iPhone17,3' } }, deviceName: 'x' } }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranZgloszenia = (require('../../app/zglos') as { default: React.ComponentType }).default;

const KORZEN = join(__dirname, '..', '..');
const adresyZeStrony = (plik: string): string[] => [...readFileSync(join(KORZEN, 'site', plik), 'utf8').matchAll(/mailto:([^"?]+)/g)].map((m) => m[1]);

test('057: adres wsparcia na stronie jeden (support.html = privacy.html) — to on ma być w aplikacji', () => {
  const adresy = new Set([...adresyZeStrony('support.html'), ...adresyZeStrony('privacy.html')]);
  expect([...adresy]).toHaveLength(1);
  expect(ADRES_WSPARCIA).toBe([...adresy][0]); // stała aplikacji = adres ze strony, bez nowego adresu
});

test('057: „/zglos” pokazuje adres kontaktu ze strony wsparcia, zanim cokolwiek zostanie udostępnione', async () => {
  const [adres] = adresyZeStrony('support.html');
  const t = await tEn();
  const s = await przygotuj();
  mockAplikacja = { kontener: { z: s.z, j: { t, jezyk: () => 'en' } }, licznik: {}, preferencje: {} };
  render(<EkranZgloszenia />);
  await screen.findByText(/Watch/);
  expect(screen.getByText(new RegExp(adres.replace(/[.]/g, '\\.')))).toBeTruthy();
  expect(screen.getByRole('button', { name: /^Share/ })).toBeTruthy();
  expect(mockSystem.udostepnij).not.toHaveBeenCalled();
  expect(mockSystem.otworzAdres).not.toHaveBeenCalled();
});
