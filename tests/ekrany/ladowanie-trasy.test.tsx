// E2-137-A1 (scenariusz 34, powtórka E2-A2 z #135; S2): trasy „/projekty” i „/projekt/[id]” do końca odczytu pokazywały pusty `View` bez testID,
// a wyjątek odczytu zostawiał pusty ekran na zawsze. Teraz: stan ładowania (`*-ladowanie`), a przy błędzie odczytu stan błędu z ponowieniem
// (`*-blad`, `*-ponow`). Na prawdziwej bazie (node:sqlite) i prawdziwym t() en; odczyt (`widokProjektow`, `widokProjektu`) tylko opóźniany albo psuty.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { odroczona, tEn } from './pomoc';

type Odczyt = (...a: unknown[]) => Promise<unknown>;
const mock: { kontener?: unknown; widokProjektow: Odczyt; widokProjektu: Odczyt; router: Record<string, jest.Mock | (() => boolean)> } = {
  widokProjektow: async () => undefined, widokProjektu: async () => undefined,
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => true },
};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mock.router, useLocalSearchParams: () => ({ id: 'p1' }), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
jest.mock('../../src/kompozycja/Kontekst', () => ({
  useAplikacja: () => ({ kontener: mock.kontener, licznik: { biezacy: () => null, otworz: async () => undefined, poZmianie: async () => undefined, poUsunieciu: async () => undefined } }),
}));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
jest.mock('../../src/przypadki-uzycia/widok-projektow', () => ({
  ...jest.requireActual<object>('../../src/przypadki-uzycia/widok-projektow'),
  widokProjektow: (...a: unknown[]) => mock.widokProjektow(...a),
}));
jest.mock('../../src/przypadki-uzycia/widok-projektu', () => ({
  ...jest.requireActual<object>('../../src/przypadki-uzycia/widok-projektu'),
  widokProjektu: (...a: unknown[]) => mock.widokProjektu(...a),
}));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranProjektow = (require('../../app/projekty') as { default: React.ComponentType }).default;
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
const prawdziwe = {
  widokProjektow: jest.requireActual<typeof import('../../src/przypadki-uzycia/widok-projektow')>('../../src/przypadki-uzycia/widok-projektow').widokProjektow,
  widokProjektu: jest.requireActual<typeof import('../../src/przypadki-uzycia/widok-projektu')>('../../src/przypadki-uzycia/widok-projektu').widokProjektu,
};
/* eslint-enable @typescript-eslint/no-require-imports */

async function srodowisko() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5)]);
  s.zegar.ustaw(T0);
  const j: Jezyk = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false };
  mock.kontener = {
    z: s.z, j, dostep: { stan: () => ({ poziom: 'darmowy' }) }, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
    wzor: { k: { stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null } },
  };
  mock.widokProjektow = (...a) => (prawdziwe.widokProjektow as Odczyt)(...a);
  mock.widokProjektu = (...a) => (prawdziwe.widokProjektu as Odczyt)(...a);
  return s;
}
beforeEach(() => { jest.clearAllMocks(); });

/** Odczyt, który czeka na `rozwiaz()`, a potem robi to, co prawdziwy. */
function opozniony(prawdziwy: Odczyt) {
  const o = odroczona<void>();
  return { rozwiaz: () => o.rozwiaz(), odczyt: (async (...a: unknown[]) => { await o.obietnica; return prawdziwy(...a); }) as Odczyt };
}
/** Odczyt, który pierwsze `razy` wywołań kończy wyjątkiem, a potem robi to, co prawdziwy. */
function psujacySie(prawdziwy: Odczyt, razy: number) {
  const licznikWywolan = { n: 0 };
  return { licznikWywolan, odczyt: (async (...a: unknown[]) => { licznikWywolan.n += 1; if (licznikWywolan.n <= razy) throw new Error('baza zajęta'); return prawdziwy(...a); }) as Odczyt };
}

describe('E2-137-A1 · lista projektów (app/projekty.tsx)', () => {
  test('do końca odczytu: stan ładowania z testID „projekty-ladowanie”, potem lista', async () => {
    await srodowisko();
    const o = opozniony(prawdziwe.widokProjektow as Odczyt);
    mock.widokProjektow = o.odczyt;
    render(<EkranProjektow />);
    expect(screen.getByTestId('projekty-ladowanie')).toBeTruthy();
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByTestId('projekty-lista')).toBeNull();
    await act(async () => { o.rozwiaz(); });
    await waitFor(() => expect(screen.getByTestId('projekty-lista')).toBeTruthy());
    expect(screen.queryByTestId('projekty-ladowanie')).toBeNull();
  });
  test('wyjątek odczytu: stan błędu „projekty-blad” z przyciskiem „Try again”; ponowienie wczytuje listę', async () => {
    await srodowisko();
    const p = psujacySie(prawdziwe.widokProjektow as Odczyt, 1);
    mock.widokProjektow = p.odczyt;
    render(<EkranProjektow />);
    await waitFor(() => expect(screen.getByTestId('projekty-blad')).toBeTruthy());
    expect(screen.getByText('Couldn’t load this.')).toBeTruthy();
    expect(screen.queryByTestId('projekty-ladowanie')).toBeNull();
    fireEvent.press(screen.getByTestId('projekty-ponow'));
    await waitFor(() => expect(screen.getByTestId('projekty-lista')).toBeTruthy());
    expect(screen.queryByTestId('projekty-blad')).toBeNull();
    expect(p.licznikWywolan.n).toBe(2);
  });
  test('odczyt zwraca błąd (wynik „nie ok”, np. zapis): ten sam stan błędu, nie pusty ekran', async () => {
    await srodowisko();
    mock.widokProjektow = async () => ({ ok: false, powod: 'zapis' });
    render(<EkranProjektow />);
    await waitFor(() => expect(screen.getByTestId('projekty-blad')).toBeTruthy());
  });
});

describe('E2-137-A1 · ekran projektu (app/projekt/[id].tsx)', () => {
  test('do końca odczytu: stan ładowania z testID „projekt-ladowanie”, potem ekran projektu', async () => {
    await srodowisko();
    const o = opozniony(prawdziwe.widokProjektu as Odczyt);
    mock.widokProjektu = o.odczyt;
    render(<EkranProjektu />);
    expect(screen.getByTestId('projekt-ladowanie')).toBeTruthy();
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByTestId('projekt-dodaj')).toBeNull();
    await act(async () => { o.rozwiaz(); });
    await waitFor(() => expect(screen.getByTestId('projekt-dodaj')).toBeTruthy());
    expect(screen.queryByTestId('projekt-ladowanie')).toBeNull();
    expect(screen.queryByTestId('e2e-pomiar-ladowania')).toBeNull(); // poza buildem E2E panelu pomiaru nie ma
  });
  test('wyjątek odczytu: stan błędu „projekt-blad” z „Try again”; ponowienie otwiera ekran projektu', async () => {
    await srodowisko();
    const p = psujacySie(prawdziwe.widokProjektu as Odczyt, 1);
    mock.widokProjektu = p.odczyt;
    render(<EkranProjektu />);
    await waitFor(() => expect(screen.getByTestId('projekt-blad')).toBeTruthy());
    expect(screen.queryByTestId('projekt-ladowanie')).toBeNull();
    fireEvent.press(screen.getByTestId('projekt-ponow'));
    await waitFor(() => expect(screen.getByTestId('projekt-dodaj')).toBeTruthy());
    expect(screen.queryByTestId('projekt-blad')).toBeNull();
  });
  test('projekt w koszu albo nieistniejący (bledne_dane) nadal przekierowuje na listę, bez stanu błędu', async () => {
    await srodowisko();
    mock.widokProjektu = async () => ({ ok: false, powod: 'bledne_dane' });
    render(<EkranProjektu />);
    await waitFor(() => expect(mock.router.replace).toHaveBeenCalledWith('/projekty'));
    expect(screen.queryByTestId('projekt-blad')).toBeNull();
  });
  test('inny błąd odczytu (wynik „nie ok”, np. zapis): stan błędu, bez przekierowania', async () => {
    await srodowisko();
    mock.widokProjektu = async () => ({ ok: false, powod: 'zapis' });
    render(<EkranProjektu />);
    await waitFor(() => expect(screen.getByTestId('projekt-blad')).toBeTruthy());
    expect(mock.router.replace).not.toHaveBeenCalled();
  });
});
