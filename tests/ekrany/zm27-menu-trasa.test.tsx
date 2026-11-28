// PU-355, PU-356 (trasa app/menu, ZM-27 (b), ADR-0037 (5)): pozycja „Remove from Lock Screen” tylko, gdy port Live Activity ma aktywność (stan natywny);
// stuknięcie kończy aktywność, ogłasza „Removed from Lock Screen” (VoiceOver), zamyka arkusz, bez potwierdzenia; dopisek o stoperze przy sesji `trwa`.
// Prawdziwa baza (node:sqlite) i kompozycja licznika; atrapy tylko na granicy platformy (router, ogłoszenie, port Live Activity).
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { oglos } from '../../src/kompozycja/system';
import { czesc, licznik, projekt, sesja } from '../dane/pomocnicze/dane-wejsciowe';
import { MIN, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ usePathname: () => '/menu', useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn() }));
const mockApp: { biezaca: unknown } = { biezaca: null };
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockApp.biezaca }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranMenu = (require('../../app/menu') as { default: React.ComponentType }).default;

async function trasa(aktywnoscNaStarcie: boolean, stoper: boolean) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), ...(stoper ? [sesja('s1', 'p1', T0 - 10 * MIN)] : [])]);
  let aktywna = aktywnoscNaStarcie;
  const wywolania: string[] = [];
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => { aktywna = false; wywolania.push('zakoncz'); }, aktywna: () => aktywna };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true });
  await k.przygotuj();
  await k.otworz('l1');
  mockApp.biezaca = { kontener: { z: s.z, j: { t: i.t, jezyk: i.jezyk }, porty: {} }, licznik: k, preferencje: {} };
  return { wywolania };
}
beforeEach(() => { Object.values(mockRouter).forEach((f) => f.mockReset()); (oglos as jest.Mock).mockReset(); });

describe('ZM-27 (b) trasa „/menu”: zdjęcie z ekranu blokady', () => {
  test('ZM-27 PU-355: aktywność jest → pozycja z podpisem; stuknięcie: port `zakoncz`, ogłoszenie „Removed from Lock Screen”, zamknięcie arkusza, bez potwierdzenia', async () => {
    const { wywolania } = await trasa(true, false);
    const ekran = render(<EkranMenu />);
    const pozycja = await ekran.findByTestId('licznik-menu-zdejmij-blokada', {}, { timeout: 10_000 });
    expect(ekran.getByText('It comes back when you count again.')).toBeTruthy();
    expect(ekran.queryByText('The timer keeps running.')).toBeNull();
    fireEvent.press(pozycja);
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
    expect(wywolania).toEqual(['zakoncz']);
    expect(oglos).toHaveBeenCalledWith('Removed from Lock Screen');
  });

  test('ZM-27 PU-356: brak aktywności → pozycji nie ma (ukryta, nie wyszarzona); aktywność i stoper `trwa` → dopisek „The timer keeps running.”', async () => {
    await trasa(false, true);
    const bez = render(<EkranMenu />);
    await bez.findByTestId('menu-zablokuj', {}, { timeout: 10_000 });
    expect(bez.queryByTestId('licznik-menu-zdejmij-blokada')).toBeNull();
    bez.unmount();
    await trasa(true, true);
    const ze = render(<EkranMenu />);
    await ze.findByTestId('licznik-menu-zdejmij-blokada', {}, { timeout: 10_000 });
    expect(ze.getByText('The timer keeps running.')).toBeTruthy();
  });
});
