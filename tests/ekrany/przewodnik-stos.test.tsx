// 08-programista-001 (recenzja U, KO-031): „Show” funkcji Ustawień w przewodniku sprawdzane na STANIE STOSU, nie na wywołaniu atrapy routera.
// Router testowy przepuszcza `push` i `dismissTo` przez prawdziwy reduktor `StackRouter` pakietu expo-router (akcje PUSH i POP_TO, jak `linkTo`);
// ekrany `app/ustawienia` i `app/przewodnik` to prawdziwe trasy, więc przejście „Ustawienia → Guide” i parametr wejścia powstają w kodzie aplikacji.
// Wejście „Dziś” → Guide to `router.push('/przewodnik')` (app/(zakladki)/index.tsx:96), tu odtworzone tym samym wywołaniem.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { WEJSCIE_Z_USTAWIEN } from '../../src/domena/przewodnik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { migawka, wykonaj } from '../dane/pomocnicze/srodowisko';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { StackRouter } = require('expo-router/build/react-navigation/routers/StackRouter') as { StackRouter: (o: object) => { getStateForAction: (s: Stos, a: object, o: object) => Stos | null } };

interface Trasa { key: string; name: string; params?: Record<string, unknown> }
interface Stos { stale: false; type: 'stack'; key: string; index: number; routeNames: string[]; preloadedRoutes: Trasa[]; routes: Trasa[] }
type Href = string | { pathname: string; params?: Record<string, unknown> };

const NAZWY = ['(zakladki)', 'przewodnik', 'ustawienia', 'licznik', 'miary', 'projekt/[id]', 'projekty'];
const reduktor = StackRouter({});
let licznikKluczy = 0;
let mockStos: Stos;

const nazwa = (h: Href): string => (typeof h === 'string' ? h : h.pathname).replace(/^\//, '').split('?')[0] ?? '';
const parametry = (h: Href): Record<string, unknown> | undefined => (typeof h === 'string' ? undefined : h.params);

function zacznij(nazwy: readonly string[]): void {
  mockStos = { stale: false, type: 'stack', key: 'root', index: nazwy.length - 1, routeNames: NAZWY, preloadedRoutes: [], routes: nazwy.map((n) => ({ key: `${n}-${licznikKluczy++}`, name: n })) };
}
function wykonajAkcje(typ: 'PUSH' | 'POP_TO', h: Href): void {
  const nowy = reduktor.getStateForAction(mockStos, { type: typ, payload: { name: nazwa(h) || '(zakladki)', params: parametry(h) } }, { routeNames: NAZWY, routeParamList: {}, routeGetIdList: {} });
  if (nowy === null) throw new Error(`reduktor odrzucił ${typ} ${nazwa(h)}`);
  mockStos = nowy;
}
const widokStosu = (): string => mockStos.routes.map((r) => r.name).join(' > ');

const mockRouter = {
  push: (h: Href) => wykonajAkcje('PUSH', h),
  navigate: (h: Href) => wykonajAkcje('PUSH', h),
  dismissTo: (h: Href) => wykonajAkcje('POP_TO', h),
  dismissAll: () => undefined,
  canDismiss: () => true,
  back: () => { mockStos = { ...mockStos, index: mockStos.index - 1, routes: mockStos.routes.slice(0, -1) }; },
};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return {
    useRouter: () => mockRouter,
    useFocusEffect: (f: () => void) => R.useEffect(f, []), // eslint-disable-line react-hooks/exhaustive-deps
    useLocalSearchParams: () => mockStos.routes[mockStos.index]?.params ?? {}, // parametry trasy na wierzchu stosu, jak w expo-router
  };
});
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }) }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ systemAplikacji: {} }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;
const EkranPrzewodnika = (require('../../app/przewodnik') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

beforeAll(async () => {
  const { s, k, j } = await kompozycjaTestowa();
  const kontener = {
    z: s.z, j: { ...j, preferencja: () => 'auto' as const }, icloud: null, katalogDanych: s.katalog,
    dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined },
  };
  mockAplikacja = { kontener, licznik: k, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() } };
});

async function pokazFunkcje(id: string): Promise<void> {
  render(<EkranPrzewodnika />);
  await screen.findByTestId('przewodnik');
  fireEvent.press(screen.getByTestId(`przewodnik-f-${id}`));
  fireEvent.press(await screen.findByTestId(`przewodnik-f-${id}-pokaz`));
}

const FUNKCJE_USTAWIEN = ['wibracje', 'ekran', 'eksport', 'usun', 'pro'];

describe('08-programista-001: stos po „Show” funkcji Ustawień', () => {
  test('wejście z „Dziś”: przewodnik zostaje na stosie, Ustawienia nad nim („Back” wraca do przewodnika)', async () => {
    for (const id of FUNKCJE_USTAWIEN) {
      zacznij(['(zakladki)']);
      mockRouter.push('/przewodnik'); // „Dziś” → Guide
      expect(widokStosu()).toBe('(zakladki) > przewodnik');
      await pokazFunkcje(id);
      await waitFor(() => expect(widokStosu()).toBe('(zakladki) > przewodnik > ustawienia'));
      mockRouter.back();
      expect(widokStosu()).toBe('(zakladki) > przewodnik');
      screen.unmount();
    }
  });

  test('wejście z Ustawień (wiersz „Guide”): Ustawienia zastępują przewodnik, bez drugiej kopii na stosie', async () => {
    for (const id of FUNKCJE_USTAWIEN) {
      zacznij(['(zakladki)', 'ustawienia']);
      render(<EkranUstawien />);
      fireEvent.press(await screen.findByTestId('ustawienia-przewodnik')); // prawdziwy wiersz trasy /ustawienia
      expect(widokStosu()).toBe('(zakladki) > ustawienia > przewodnik');
      expect(mockStos.routes.at(-1)?.params).toEqual({ z: WEJSCIE_Z_USTAWIEN }); // wiersz „Guide” oznacza wejście parametrem trasy
      screen.unmount();
      await pokazFunkcje(id);
      await waitFor(() => expect(widokStosu()).toBe('(zakladki) > ustawienia'));
      screen.unmount();
    }
  });

  test('inny ekran z Ustawień (Units → /miary) z obu wejść zostaje pchnięty nad przewodnikiem', async () => {
    zacznij(['(zakladki)', 'ustawienia']);
    render(<EkranUstawien />);
    fireEvent.press(await screen.findByTestId('ustawienia-przewodnik'));
    screen.unmount();
    await pokazFunkcje('jednostki');
    await waitFor(() => expect(widokStosu()).toBe('(zakladki) > ustawienia > przewodnik > miary'));
    screen.unmount();
    zacznij(['(zakladki)']);
    mockRouter.push('/przewodnik');
    await pokazFunkcje('jednostki');
    await waitFor(() => expect(widokStosu()).toBe('(zakladki) > przewodnik > miary'));
  });
});

describe('PU-110 i PU-113: stos po „Show” (własne dane; kontekst pozostałych testów przywracany)', () => {
  let zapisana: unknown;
  beforeEach(() => { zapisana = mockAplikacja; });
  afterEach(() => { mockAplikacja = zapisana; });

  // PU-110: „Show” przy „Vibration” i „Oczko Pro” kładzie na stos Ustawienia (nigdy ofert), „Units” — ekran Jednostek; „Back” wraca do przewodnika; dane bez zmian, brak wyniku eksportu.
  test('PU-110: „Show” przy Wibracjach i Oczko Pro otwiera Ustawienia (nie oferty), Jednostki otwierają „/miary”, powrót na przewodnik; dane bez zmian', async () => {
    const { s, k, j } = await kompozycjaTestowa();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
    mockAplikacja = { kontener: { z: s.z, j: { ...j, preferencja: () => 'auto' as const }, icloud: null, katalogDanych: s.katalog, dostep: { stan: () => ({ aktywne: null, pro: false }), naZmiane: () => () => undefined } }, licznik: k, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() } };
    const przed = await migawka(s.baza, ['ustawienie']); // przewodnik zapisuje tylko „przeczytane” w `ustawienie`
    const historia: string[] = [];
    for (const [id, oczekiwany] of [['wibracje', '(zakladki) > przewodnik > ustawienia'], ['pro', '(zakladki) > przewodnik > ustawienia'], ['jednostki', '(zakladki) > przewodnik > miary']] as const) {
      zacznij(['(zakladki)']);
      mockRouter.push('/przewodnik'); // „Dziś” → Guide
      await pokazFunkcje(id);
      await waitFor(() => expect(widokStosu()).toBe(oczekiwany));
      historia.push(widokStosu());
      expect(screen.queryByTestId('eksport-wynik')).toBeNull();
      mockRouter.back();
      expect(widokStosu()).toBe('(zakladki) > przewodnik');
      screen.unmount();
    }
    expect(historia.join(' ')).not.toMatch(/oferty/);
    expect(await migawka(s.baza, ['ustawienie'])).toBe(przed);
  });

  // PU-113: „Apple Watch” rozwija opis bez „Show”; „Lock Screen” → „Show” otwiera licznik bieżącej pracy nad przewodnikiem, „Back” wraca do przewodnika.
  test('PU-113: „Apple Watch” bez „Show”; „Lock Screen” → „Show” otwiera licznik nad przewodnikiem, powrót na przewodnik', async () => {
    const { s, k, j } = await kompozycjaTestowa();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
    await k.otworz('l1');
    mockAplikacja = { kontener: { z: s.z, j }, licznik: k };
    zacznij(['(zakladki)']);
    mockRouter.push('/przewodnik');
    render(<EkranPrzewodnika />);
    await screen.findByTestId('przewodnik');
    expect(screen.getByRole('header', { name: 'Apple Watch and Lock Screen' })).toBeTruthy();
    fireEvent.press(screen.getByTestId('przewodnik-f-zegarek'));
    expect(await screen.findByTestId('przewodnik-f-zegarek-opis')).toHaveTextContent(/Count rows on your watch/);
    expect(screen.queryByTestId('przewodnik-f-zegarek-pokaz')).toBeNull();
    fireEvent.press(screen.getByTestId('przewodnik-f-ekran-blokady'));
    fireEvent.press(await screen.findByTestId('przewodnik-f-ekran-blokady-pokaz'));
    await waitFor(() => expect(widokStosu()).toBe('(zakladki) > przewodnik > licznik'));
    mockRouter.back();
    expect(widokStosu()).toBe('(zakladki) > przewodnik');
  });
});
