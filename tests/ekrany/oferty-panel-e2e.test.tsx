// Scenariusz 06 (przebieg 7, run 42712789199, krok 53): panel `e2e-sklep-wygas` buildu E2E był rodzeństwem arkusza ofert — poza przewijaną
// treścią, pod przyklejonym `arkusz-przyciski` ([0,833][402,874]), więc `scrollUntilVisible` go nie odsłaniał. Panel ma leżeć w ScrollView arkusza.
import React from 'react';
import { ScrollView } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { Oferty } from '../../src/ekrany/Oferty';
import { tEn } from './pomoc';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }), useLocalSearchParams: () => ({}) }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: { zarzadzajSubskrypcja: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('../../src/platforma/tryb-e2e', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const rn = require('react-native') as typeof import('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  const PanelSklepu = ({ naWygas }: { naWygas(): void }) =>
    R.createElement(rn.Pressable, { accessibilityRole: 'button', onPress: naWygas, testID: 'e2e-sklep-wygas' }, R.createElement(rn.Text, null, 'Test store: expire access'));
  return { E2E: true, paneleE2e: { PanelSklepu } };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranOfert = (require('../../app/oferty') as { default: React.ComponentType }).default;

const przodkowie = (w: ReactTestInstance): ReactTestInstance[] => (w.parent ? [w.parent, ...przodkowie(w.parent)] : []);

test('06: panel E2E „Test store: expire access” leży w przewijanej treści arkusza ofert, nie pod paskiem przycisków', async () => {
  const t = await tEn();
  const sklep = { produkty: async () => [], kup: jest.fn(), przywroc: jest.fn(), wygas: jest.fn() };
  const dostep = { stan: () => ({ aktywne: { rodzaj: 'dozywotni' }, pro: true }), naZmiane: () => () => undefined, odswiez: jest.fn(async () => undefined) };
  mockAplikacja = { kontener: { j: { t }, porty: { sklep }, dostep }, licznik: { poZmianie: jest.fn(async () => undefined) }, preferencje: {} };
  render(<EkranOfert />);
  const panel = await waitFor(() => screen.getByTestId('e2e-sklep-wygas'));
  const p = przodkowie(panel);
  const arkusz = screen.getByTestId('oferty-ekran');
  expect(p).toContain(arkusz);
  expect(p.some((x) => x.type === ScrollView && przodkowie(x).includes(arkusz))).toBe(true);
  expect(p).not.toContain(screen.getByTestId('arkusz-przyciski'));
});

test('06: bez `panelE2e` (build wydania) arkusz ofert nie ma panelu E2E — produkcja bez zmian', async () => {
  const t = await tEn();
  const nic = () => undefined;
  render(<Oferty stan={{ produkty: { rodzaj: 'ladowanie' }, aktywne: null, familySharing: true }} t={t} adresy={{ polityka: 'https://example.com/p', warunki: 'https://example.com/w' }}
    naKup={nic} naPrzywroc={nic} naZarzadzaj={nic} naOtworzAdres={nic} naZamknij={nic} />);
  expect(screen.getByTestId('oferty-ekran')).toBeTruthy();
  expect(screen.queryByTestId('e2e-sklep-wygas')).toBeNull();
});
