// M1-audytor-generalny-068 (źródło 08-programista-006; DEC-10 (a), P-418; ADR-0002 bez zmian): odczyty ekranów idą w kolejce przypadków użycia,
// więc w czasie długiej pozycji kolejki (import, eksport, partia iCloud) ekran nie może być pustą planszą: do końca odczytu pokazuje stan
// ładowania `StanWczytywania` (SYS-01, testID `<trasa>-ladowanie`, „Loading…”), a po zwolnieniu kolejki dane. Prawdziwa baza (node:sqlite),
// prawdziwa kolejka (`wKolejce`), prawdziwe odczyty; długą pozycję udaje obietnica trzymana w kolejce. Test 002 (blad-odczytu-trasy.test.tsx) pilnuje błędu.
import React from 'react';
import { View } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, wykonaj } from '../dane/pomocnicze/srodowisko';
import { preferencje } from '../../src/kompozycja/preferencje';
import { wKolejce } from '../../src/przypadki-uzycia/kolejka';
import { odroczona, tEn } from './pomoc';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), usePathname: () => '/', useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]), Stack: Object.assign(() => null, { Screen: () => null }) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja, DostawcaAplikacji: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), portOceny: {}, systemAplikacji: {}, cyklAplikacji: { naZmiane: () => () => undefined } }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
jest.mock('../../src/przypadki-uzycia/ocena', () => ({ prosbaPoUkonczeniu: jest.fn(async () => undefined) }));
jest.mock('../../src/ekrany/ObrazKarty', () => ({ ObrazKarty: () => null }));
jest.mock('../../src/platforma/zrzut', () => ({ zrzutKarty: jest.fn() }));
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: () => null }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
const mockReact = React; // fabryka jest.mock idzie nad importy: odwołania z prefiksem mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'), zapiszKamien: async () => undefined })); // bez dysku platformy
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

async function srodowisko(dane: [string, unknown[]][] = []) {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), ...dane]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = {
    kontener: {
      z: s.z, j, dostep: { stan: () => ({ poziom: 'darmowa' }) },
      porty: { haptyka: { zagraj: jest.fn() }, siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null, wklej: async () => null } },
    },
    licznik: k, preferencje: preferencje(),
  };
  return { s, k, j };
}
beforeEach(() => { Object.values(mockRouter).forEach((f) => { if (typeof f === 'function' && 'mockClear' in f) f.mockClear(); }); });

/** `port`: odczyt trasy idzie prosto przez kolejkę portu bazy (bez `wKolejce` przypadków użycia), więc długa pozycja to transakcja portu (np. partia iCloud). */
type Przypadek = { trasa: string; plik: string; przedrostek: string; params?: Record<string, string>; dane?: [string, unknown[]][]; kolejka?: 'port' };
const PRZYPADKI: Przypadek[] = [
  { trasa: '/projekty', plik: '../../app/(zakladki)/projekty', przedrostek: 'projekty' },
  { trasa: '/projekt/[id]', plik: '../../app/projekt/[id]', przedrostek: 'projekt', params: { id: 'p1' } },
  { trasa: '/sesje', plik: '../../app/sesje', przedrostek: 'sesje', params: { projekt: 'p1' } },
  { trasa: '/dni', plik: '../../app/(zakladki)/dni', przedrostek: 'dni' },
  { trasa: '/ukonczenie', plik: '../../app/ukonczenie', przedrostek: 'ukonczenie', params: { projekt: 'p1' } },
  { trasa: '/drut', plik: '../../app/drut', przedrostek: 'drut', params: { id: 'n1' } },
  { trasa: '/zdjecie', plik: '../../app/zdjecie', przedrostek: 'zdjecie', params: { projekt: 'p1' } },
  { trasa: '/menu', plik: '../../app/menu', przedrostek: 'menu' },
  { trasa: '/konflikt', plik: '../../app/konflikt', przedrostek: 'konflikt' },
  { trasa: '/kosz', plik: '../../app/kosz', przedrostek: 'kosz' },
  { trasa: '/probka', plik: '../../app/probka', przedrostek: 'probka', params: { projekt: 'p1' } },
  { trasa: '/wzor', plik: '../../app/wzor', przedrostek: 'wzor' },
  { trasa: '/formularz/nazwa', plik: '../../app/formularz/[rodzaj]', przedrostek: 'formularz', params: { rodzaj: 'nazwa' } },
  { trasa: '/formularz/notatka', plik: '../../app/formularz/[rodzaj]', przedrostek: 'formularz', params: { rodzaj: 'notatka', projekt: 'p1' } },
  // M1-audytor-generalny-152 (08-programista-521): zapas, druty, Narzędzia i historia licznika — w czasie długiej pozycji kolejki „Loading…”, nie pusty zapas ani „0”.
  { trasa: '/zapas', plik: '../../app/zapas', przedrostek: 'zapas', kolejka: 'port' },
  { trasa: '/druty', plik: '../../app/druty', przedrostek: 'druty', kolejka: 'port' },
  { trasa: '/narzedzia', plik: '../../app/(zakladki)/narzedzia', przedrostek: 'narzedzia', kolejka: 'port' },
  { trasa: '/historia', plik: '../../app/historia', przedrostek: 'historia' },
];

describe('M1-068: długa pozycja kolejki przypadków użycia — trasa pokazuje „Loading…”, nie pustą planszę (DEC-10 (a))', () => {
  test.each(PRZYPADKI.map((p): [string, Przypadek] => [p.trasa, p]))('M1-068: %s — do końca długiej pozycji kolejki „<trasa>-ladowanie”, potem dane', async (_n, p) => {
    const { s } = await srodowisko(p.dane);
    mockParams = p.params ?? {};
    const dluga = odroczona<void>();
    const pozycja = p.kolejka === 'port'
      ? s.z.baza.transakcja(() => dluga.obietnica) // transakcja portu (partia iCloud, import): odczyty portu czekają za nią
      : wKolejce(s.z.baza, () => dluga.obietnica); // np. eksport: scalenie dziennika, VACUUM INTO, zapis ZIP
    render(React.createElement(trasa(p.plik)));
    await act(async () => { await new Promise((r) => setTimeout(r, 150)); }); // odczyt czeka za długą pozycją
    expect(screen.getByTestId(`${p.przedrostek}-ladowanie`)).toBeTruthy();
    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByTestId(`${p.przedrostek}-blad`)).toBeNull();
    await act(async () => { dluga.rozwiaz(); await pozycja; await new Promise((r) => setTimeout(r, 150)); });
    // Po zwolnieniu kolejki: dane albo wyjście (brak zdjęć, konflikt rozstrzygnięty, brak druta w danych testowych), bez stanu błędu.
    await waitFor(() => expect(screen.queryByTestId(`${p.przedrostek}-ladowanie`) === null || mockRouter.back.mock.calls.length > 0 || mockRouter.replace.mock.calls.length > 0).toBe(true));
    expect(screen.queryByTestId(`${p.przedrostek}-blad`)).toBeNull();
  });

  test('M1-068: „/” (licznik) — do końca `przygotuj()` stan ładowania „licznik-ladowanie”, nie pusta plansza', async () => {
    const t = await tEn();
    const dane = odroczona<unknown>();
    mockAplikacja = {
      kontener: { z: {}, j: { t, jezyk: () => 'en-US', zegar24h: () => false }, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) } },
      licznik: { wersja: () => 0, biezacy: () => null, poZegarku: () => () => undefined, poDostepie: () => () => undefined, widok: async () => null, przygotuj: () => dane.obietnica }, preferencje: {}, naAwarie: jest.fn(),
    };
    mockParams = {};
    render(React.createElement(trasa('../../app/(zakladki)/index')));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(screen.getByTestId('licznik-ladowanie')).toBeTruthy();
    expect(screen.getByText('Loading…')).toBeTruthy();
    await act(async () => { dane.rozwiaz({ ok: true, wartosc: { cel: 'licznik' } }); });
    await waitFor(() => expect(screen.queryByTestId('licznik-ladowanie')).toBeNull());
  });
});
