// PU-Z08 (katalog: „Oczekujące 1.0.2”). ZM-23 (U5, P-1101): „Redeem code” na ekranie „Oczko Pro” między „Restore purchases” a „Not now”
// (`oferty-zrealizuj-kod`), wywołanie arkusza realizacji kodu przez port sklepu, bez sieci linia „!” „An internet connection is needed.”
// (role=alert). Wyrocznia: docs/design/1-0-2.md U5 i klucze `oferty.zrealizuj_kod`, `oferty.kod_bez_sieci` (z Treningu, P-315); test
// komponentu jak `tests/subscription-ui.test.tsx` w repo trening. Trasa `app/oferty` z atrapą kontenera jak tests/ekrany/oferty-panel-e2e.test.tsx.
// Nazwa metody portu `zrealizujKod` i powód `brak_sieci` — propozycja 07 (P-1113), do dopasowania przez 08 z portem sklepu (src/domena/porty.ts).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { tEn } from '../../ekrany/pomoc';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }), useLocalSearchParams: () => ({}) }));
jest.mock('../../../src/kompozycja/system', () => ({ systemAplikacji: { zarzadzajSubskrypcja: jest.fn(), otworzAdres: jest.fn() } }));
jest.mock('../../../src/platforma/tryb-e2e', () => ({ E2E: false, paneleE2e: {} }));
let mockAplikacja: unknown;
jest.mock('../../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranOfert = (require('../../../app/oferty') as { default: React.ComponentType }).default;

async function rysuj(zrealizujKod: jest.Mock) {
  const t = await tEn();
  const sklep = { produkty: async () => [], kup: jest.fn(), przywroc: jest.fn(), zrealizujKod };
  const dostep = { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined, odswiez: jest.fn(async () => undefined) };
  mockAplikacja = { kontener: { j: { t }, porty: { sklep }, dostep }, licznik: { poZmianie: jest.fn(async () => undefined) }, preferencje: {} };
  render(<EkranOfert />);
}

describe('ZM-23 „Redeem code” na ekranie Oczko Pro (U5)', () => {
  test('ZM-23 PU-Z08: przycisk „Redeem code” obok „Restore purchases”; stuknięcie woła realizację kodu w porcie sklepu', async () => {
    const zrealizujKod = jest.fn(async () => ({ ok: true }));
    await rysuj(zrealizujKod);
    const przycisk = await waitFor(() => screen.getByTestId('oferty-zrealizuj-kod'));
    expect(screen.getByText('Redeem code')).toBeTruthy();
    expect(screen.getByTestId('oferty-przywroc')).toBeTruthy();
    fireEvent.press(przycisk);
    await waitFor(() => expect(zrealizujKod).toHaveBeenCalledTimes(1));
  });

  test('ZM-23 PU-Z08: bez sieci → linia „An internet connection is needed.” w roli alertu', async () => {
    const zrealizujKod = jest.fn(async () => ({ ok: false, powod: 'brak_sieci' }));
    await rysuj(zrealizujKod);
    fireEvent.press(await waitFor(() => screen.getByTestId('oferty-zrealizuj-kod')));
    const linia = await waitFor(() => screen.getByText('An internet connection is needed.'));
    type Wezel = { props: { accessibilityRole?: string }; parent: Wezel | null };
    const role: (string | undefined)[] = [];
    for (let w: Wezel | null = linia as unknown as Wezel; w; w = w.parent) role.push(w.props.accessibilityRole);
    expect(role).toContain('alert');
  });
});
