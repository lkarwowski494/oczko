// M1-audytor-generalny-016 (źródło 04-studio-projektowe-002, P1): ekrany warstwy „Tools” (Narzędzia, Zapas, Druty, Próbka) mają przycisk
// „‹ Back” (`nav-wstecz`), a nie tylko gest od krawędzi — Switch Control i część użytkowników VoiceOver nie wykona gestu (HIG Gestures).
// Pasek rysuje ekran (`app/_layout.tsx`: `headerShown: false`), więc każda trasa push woła `router.back()` z własnego przycisku.
// Trasy z `app/` na prawdziwej bazie (node:sqlite) i prawdziwym t() en; atrapa tylko routera i opakowań platformy (jak M1-007).
// Trwała kontrola: każda trasa push z `app/` (bez arkuszy z `_layout.tsx`, które mają własne zamknięcie, i bez licznika `index`) woła `router.back()`.
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { wykonaj } from '../dane/pomocnicze/srodowisko';
import { preferencje } from '../../src/kompozycja/preferencje';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

async function srodowisko(): Promise<void> {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5)]);
  mockAplikacja = { kontener: { z: s.z, j }, licznik: k, preferencje: preferencje() };
}
beforeEach(() => {
  mockParams = {};
  Object.values(mockRouter).forEach((f) => { if (typeof f === 'function' && 'mockClear' in f) f.mockClear(); });
});
async function zamontuj(Ekran: React.ComponentType): Promise<void> {
  render(<Ekran />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}

const TRASY: [string, string, Record<string, string>][] = [
  // 006 (P-614 (1) A): '/narzedzia' usunięte jawnie — korzeń zakładki bez „wstecz” (m3-fix-e5-zastapione-testy.md; kontrola: m3-fix-e5-006.test.tsx).
  ['/zapas', '../../app/zapas', {}],
  ['/druty', '../../app/druty', {}],
  ['/probka', '../../app/probka', {}],
  ['/probka?projekt=p1 (z projektu, U-10)', '../../app/probka', { projekt: 'p1' }],
];

describe('M1-016: warstwa „Tools” — „‹ Back” (nav-wstecz) wraca przez router.back()', () => {
  test.each(TRASY)('%s: przycisk „Back” z testID nav-wstecz; stuknięcie = router.back()', async (_nazwa, plik, params) => {
    await srodowisko();
    mockParams = params;
    await zamontuj(trasa(plik));
    const wstecz = screen.getByTestId('nav-wstecz');
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    fireEvent.press(wstecz);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

describe('M1-016: trwała kontrola — każda trasa push z app/ ma powrót przyciskiem', () => {
  const APP = path.join(__dirname, '..', '..', 'app');
  const uklad = fs.readFileSync(path.join(APP, '_layout.tsx'), 'utf8');
  /** Arkusze i pełnoekranowe modale z `_layout.tsx` (własne „Cancel”/„Close”/„Done”) — poza tą kontrolą. */
  const ARKUSZE = new Set([...uklad.matchAll(/<Stack\.Screen name="([^"]+)" options=\{\{[^}]*presentation: '(?:modal|fullScreenModal|formSheet)'/g)].map((m) => m[1]));
  /** Poza kontrolą z nazwy: licznik (pierwszy ekran, korzeń stosu), układ i przekierowanie intencji (nie ekrany). */
  const POZA = new Set(['index', '_layout', '+native-intent',
    // M3 p2 (WD-1): korzenie zakładek i układ grupy; 006 (P-614 (1) A): także Narzędzia i Historia bez „Back” (zmienione jawnie, było: zachowują „Back”);
    // licznik wraca „‹ Projects” (`nav-projekty`, router.navigate do zakładki) do p3a („Projekt ›”).
    '(zakladki)/_layout', '(zakladki)/index', '(zakladki)/projekty', '(zakladki)/narzedzia', '(zakladki)/dni', 'licznik']);
  const pliki = (kat: string): string[] => fs.readdirSync(kat, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? pliki(path.join(kat, e.name)) : e.name.endsWith('.tsx') ? [path.join(kat, e.name)] : []));
  const pushPliki = pliki(APP).map((p) => path.relative(APP, p).replace(/\.tsx$/, '')).filter((n) => !ARKUSZE.has(n) && !POZA.has(n)).sort();
  const push = pushPliki.map((n) => n.replace(/\([^)]+\)\//g, '')); // grupa tras „(…)/” nie zmienia adresu (expo-router)

  test('lista tras push i arkuszy nie jest pusta (pułapka na zmianę zapisu w _layout.tsx)', () => {
    expect(ARKUSZE.size).toBeGreaterThanOrEqual(10);
    expect(push).toEqual(expect.arrayContaining(['zapas', 'druty', 'probka', 'ustawienia'])); // 006: 'narzedzia' to korzeń zakładki (było na liście)
  });
  /** Znane trasy push bez przycisku powrotu — zgłoszone w M1-016, poza jego zakresem (do decyzji 04); lista ma się kurczyć, nie rosnąć. */
  const ZNANE_BEZ_PRZYCISKU: string[] = []; // M1-094 (04-studio-projektowe-501, DEC-26 a): lista projektów dostała „Back” — lista pusta, nowe trasy bez przycisku nie przejdą
  test('każda trasa push przekazuje ekranowi naWstecz z router.back() (przycisk „‹ Back”, nie tylko gest od krawędzi)', () => {
    const bez = pushPliki.filter((n) => !/naWstecz=\{[^}]*router\.back\(\)/.test(fs.readFileSync(path.join(APP, `${n}.tsx`), 'utf8')));
    expect(bez).toEqual(ZNANE_BEZ_PRZYCISKU);
  });
});

// M3 fix E5, poz. 17 (P-617 A): na liczniku wyłączony pełnoekranowy gest „wstecz” iOS 26; zostaje gest od lewej krawędzi.
// Źródło: react-native-screens 4.26.2 `src/types.tsx:182-189` — `fullScreenSwipeEnabled`: „For iOS 26 and up, native `interactiveContentPopGestureRecognizer`
// is used, and this prop controls whether it should be enabled or not. When not set, it defaults to `false` on iOS < 26 and `true` for iOS >= 26.”
// Opcja ekranu expo-router `fullScreenGestureEnabled` → `fullScreenSwipeEnabled` (expo-router build/react-navigation/native-stack/views/NativeStackView.native.js:210).
// `gestureEnabled` (gest od krawędzi) zostaje domyślny (true). Kontrola źródła jak narzedzia-wstecz-trasa.test.tsx (Jest nie uruchamia natywnego stosu).
const ekranLicznika = fs.readFileSync(path.join(__dirname, '../../app/_layout.tsx'), 'utf8').match(/<Stack\.Screen name="licznik"[^>]*\/>/)?.[0] ?? '';

test('P-617 A: ekran „licznik” ma fullScreenGestureEnabled: false, bez wyłączania gestu od krawędzi', () => {
  expect(ekranLicznika).toMatch(/fullScreenGestureEnabled: false/);
  expect(ekranLicznika).not.toMatch(/[^n]gestureEnabled: false/);
});

test('P-617 A: zainstalowana wersja react-native-screens ma opisaną opcję (inna wersja → sprawdź źródło od nowa)', () => {
  const typy = fs.readFileSync(require.resolve('react-native-screens/src/types.tsx'), 'utf8');
  expect(typy).toContain('For iOS 26 and up, native `interactiveContentPopGestureRecognizer` is used, and this prop controls whether it should');
  const widok = fs.readFileSync(require.resolve('expo-router/build/react-navigation/native-stack/views/NativeStackView.native.js'), 'utf8');
  expect(widok).toContain('fullScreenSwipeEnabled: fullScreenGestureEnabled');
});
