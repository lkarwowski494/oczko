// M1-audytor-generalny-007 (źródło 08-programista-002; P-374): nieudany odczyt na trasie nie zostawia pustej planszy na stałe. Odczyt zwracający
// `{ ok: false }` albo odrzucona obietnica → stan błędu `StanWczytywania` („Couldn’t load this.”, testID `<trasa>-blad`) z „Try again”
// (`<trasa>-ponow`), który ponawia odczyt. Trasy z `app/` na prawdziwej bazie (node:sqlite) i prawdziwym t() en; psuty jest tylko jeden
// odczyt (przypadek użycia podmieniony w module przez `jest.requireActual`, jak M1-006). Start aplikacji (`app/index.tsx`, `app/_layout.tsx`):
// odrzucona obietnica startu → istniejący ekran awaryjny ADR-0019 (testID `tryb-awaryjny`, „Try normally” = ponowienie startu).
import React from 'react';
import { AppState, View } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { czesc, licznik, projekt, wloczka } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0, czasWTle, wykonaj } from '../dane/pomocnicze/srodowisko';
import { preferencje } from '../../src/kompozycja/preferencje';
import { tEn } from './pomoc';

type Awaria = 'wynik' | 'wyjatek';
/** Psuty odczyt: nazwa funkcji przypadku użycia → rodzaj awarii (brak = prawdziwa funkcja). */
const mockAwaria: Record<string, Awaria | undefined> = {};
/** Moduł prawdziwy, a wskazane funkcje: `{ ok: false, powod: 'zapis' }` albo wyjątek, gdy test tak ustawi; inaczej prawdziwe wywołanie. */
function mockOdczyty(modul: string, nazwy: string[]): Record<string, unknown> {
  const r = jest.requireActual<Record<string, unknown>>(modul);
  const podmienione: Record<string, unknown> = {};
  for (const n of nazwy) {
    const f = r[n];
    if (typeof f !== 'function') throw new Error(`brak funkcji ${n} w ${modul}`);
    podmienione[n] = async (...a: unknown[]): Promise<unknown> => {
      const x = mockAwaria[n];
      if (x === 'wynik') return { ok: false, powod: 'zapis' };
      if (x === 'wyjatek') throw new Error('baza zajęta');
      return f(...a);
    };
  }
  return { ...r, ...podmienione };
}

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]), Stack: Object.assign(() => null, { Screen: () => null }) };
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
// Odczyty psute w testach (reszta modułów prawdziwa).
jest.mock('../../src/przypadki-uzycia/sesja', () => mockOdczyty('../../src/przypadki-uzycia/sesja', ['sesjeProjektu']));
jest.mock('../../src/przypadki-uzycia/historia', () => mockOdczyty('../../src/przypadki-uzycia/historia', ['widokHistorii']));
jest.mock('../../src/przypadki-uzycia/widok-ukonczenia', () => mockOdczyty('../../src/przypadki-uzycia/widok-ukonczenia', ['kartaUkonczenia']));
jest.mock('../../src/przypadki-uzycia/zapas', () => mockOdczyty('../../src/przypadki-uzycia/zapas', ['narzedzia', 'wloczka']));
jest.mock('../../src/przypadki-uzycia/zgloszenie', () => mockOdczyty('../../src/przypadki-uzycia/zgloszenie', ['przygotujZgloszenie']));
jest.mock('../../src/przypadki-uzycia/zdjecia', () => mockOdczyty('../../src/przypadki-uzycia/zdjecia', ['zdjecia']));
jest.mock('../../src/przypadki-uzycia/widok-licznika', () => mockOdczyty('../../src/przypadki-uzycia/widok-licznika', ['widokLicznika']));
jest.mock('../../src/przypadki-uzycia/widok-kosza', () => mockOdczyty('../../src/przypadki-uzycia/widok-kosza', ['widokKosza']));
jest.mock('../../src/przypadki-uzycia/widok-projektu', () => mockOdczyty('../../src/przypadki-uzycia/widok-projektu', ['widokProjektu']));
// Start aplikacji: strażnik i kontener podmienione (bez dysku i modułów natywnych); ekran awaryjny prawdziwy.
const mockStart: { rozpocznij: () => Promise<unknown>; kontener: () => Promise<unknown> } = { rozpocznij: async () => ({ tryb: 'normalny' }), kontener: async () => ({ ok: false, powod: 'zapis' }) };
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: () => mockStart.rozpocznij(), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined, zapiszKamien: async () => undefined,
  sprobujNormalnieTeraz: async () => undefined, trybAwaryjny: () => ({ kopia: Promise.resolve(null) }),
}));
jest.mock('../../src/kompozycja/kontener', () => ({ utworzKontener: () => mockStart.kontener() }));
jest.mock('../../src/kompozycja/bledy-js', () => ({ zainstalujObslugeBledow: () => ({ ustawZapis: () => undefined }) }));
let mockT: unknown;
jest.mock('../../src/kompozycja/jezyk-awaryjny', () => ({ tAwaryjny: async () => mockT }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const BLAD = 'Couldn’t load this.';
const PONOW = 'Try again';

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
beforeEach(() => {
  for (const n of Object.keys(mockAwaria)) mockAwaria[n] = undefined;
  Object.values(mockRouter).forEach((f) => { if (typeof f === 'function' && 'mockClear' in f) f.mockClear(); });
});

type Przypadek = { trasa: string; plik: string; przedrostek: string; odczyt: string; params?: Record<string, string>; dane?: [string, unknown[]][]; awarie?: Awaria[] };
const PRZYPADKI: Przypadek[] = [
  { trasa: '/sesje', plik: '../../app/sesje', przedrostek: 'sesje', odczyt: 'sesjeProjektu', params: { projekt: 'p1' } },
  { trasa: '/dni', plik: '../../app/dni', przedrostek: 'dni', odczyt: 'widokHistorii' },
  { trasa: '/ukonczenie', plik: '../../app/ukonczenie', przedrostek: 'ukonczenie', odczyt: 'kartaUkonczenia', params: { projekt: 'p1' } },
  { trasa: '/sesja-korekta', plik: '../../app/sesja-korekta', przedrostek: 'sesja-korekta', odczyt: 'sesjeProjektu', params: { sesja: 's1', projekt: 'p1' }, dane: [["INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, strefa, dzien) VALUES ('s1', 'p1', 'zakonczona', ?, ?, 'Europe/Warsaw', ?)", [T0, T0 + 3_600_000, new Date(T0).toISOString().slice(0, 10)]]] },
  { trasa: '/drut', plik: '../../app/drut', przedrostek: 'drut', odczyt: 'narzedzia', params: { id: 'n1' } },
  // „{ ok: false }” przy diagnostyce zostaje myślnikiem w polu błędów (ekran zgłoszenia ma działać i bez rejestru) — tu tylko wyjątek.
  { trasa: '/zglos', plik: '../../app/zglos', przedrostek: 'zglos', odczyt: 'przygotujZgloszenie', awarie: ['wyjatek'] },
  { trasa: '/zdjecie', plik: '../../app/zdjecie', przedrostek: 'zdjecie', odczyt: 'zdjecia', params: { projekt: 'p1' } },
  { trasa: '/menu', plik: '../../app/menu', przedrostek: 'menu', odczyt: 'widokLicznika' },
  { trasa: '/konflikt', plik: '../../app/konflikt', przedrostek: 'konflikt', odczyt: 'widokLicznika' },
  { trasa: '/kosz', plik: '../../app/kosz', przedrostek: 'kosz', odczyt: 'widokKosza' },
  { trasa: '/probka', plik: '../../app/probka', przedrostek: 'probka', odczyt: 'widokProjektu', params: { projekt: 'p1' } },
  { trasa: '/wloczka', plik: '../../app/wloczka', przedrostek: 'wloczka', odczyt: 'wloczka', params: { id: 'y1' }, dane: [wloczka('y1', 'Merino')] },
  { trasa: '/wzor', plik: '../../app/wzor', przedrostek: 'wzor', odczyt: 'widokLicznika' },
  { trasa: '/formularz/notatka', plik: '../../app/formularz/[rodzaj]', przedrostek: 'formularz', odczyt: 'widokProjektu', params: { rodzaj: 'notatka', projekt: 'p1' } },
  { trasa: '/formularz/nazwa', plik: '../../app/formularz/[rodzaj]', przedrostek: 'formularz', odczyt: 'widokLicznika', params: { rodzaj: 'nazwa' } },
];
const ZESTAW = PRZYPADKI.flatMap((p) => (p.awarie ?? ['wynik', 'wyjatek']).map((a): [string, Awaria, string, Przypadek] => [p.trasa, a, p.przedrostek, p]));
/** Render i chwila na odczyty po zamontowaniu (aktualizacje stanu w act). */
async function zamontuj(Ekran: React.ComponentType): Promise<void> {
  render(<Ekran />);
  await act(async () => { await new Promise((r) => setTimeout(r, 100)); });
}

describe('M1-007: trasy — nieudany odczyt daje stan błędu z „Try again”, nie pustą planszę', () => {
  test.each(ZESTAW)('M1-007: %s, odczyt %s → „%s-blad” z „Try again”; ponowienie czyta od nowa', async (_nazwa, awaria, _przedrostek, p) => {
    await srodowisko(p.dane);
    mockParams = p.params ?? {};
    mockAwaria[p.odczyt] = awaria;
    await zamontuj(trasa(p.plik));
    await waitFor(() => expect(screen.getByTestId(`${p.przedrostek}-blad`)).toBeTruthy());
    expect(screen.getByText(BLAD)).toBeTruthy();
    const ponow = screen.getByTestId(`${p.przedrostek}-ponow`);
    expect(screen.getByText(PONOW)).toBeTruthy();
    // Ponowienie: odczyt wraca do prawdziwego → ekran z danymi albo wyjście (np. konflikt rozstrzygnięty, brak zdjęć), bez stanu błędu.
    mockAwaria[p.odczyt] = undefined;
    await act(async () => { fireEvent.press(ponow); await new Promise((r) => setTimeout(r, 100)); });
    await waitFor(() => expect(screen.queryByTestId(`${p.przedrostek}-blad`)).toBeNull());
    expect(screen.queryByTestId(`${p.przedrostek}-ladowanie`) === null || mockRouter.back.mock.calls.length > 0).toBe(true);
  });
});

describe('M1-007: start aplikacji — odrzucona obietnica startu daje ekran awaryjny (ADR-0019), nie pustą planszę', () => {
  const LICZNIK_BAZA = { wersja: () => 0, biezacy: () => null, poZegarku: () => () => undefined, widok: async () => null };
  async function ekranLicznika(przygotuj: () => Promise<unknown>) {
    const t = await tEn();
    mockAplikacja = { kontener: { z: {}, j: { t, jezyk: () => 'en-US', zegar24h: () => false }, porty: {}, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: { ...LICZNIK_BAZA, przygotuj }, preferencje: {} };
    await zamontuj(trasa('../../app/index'));
  }
  test('M1-007: „/” — `przygotuj()` zwraca { ok: false } → ekran awaryjny z „Try normally” [kontrola: tak było i zostaje]', async () => {
    await ekranLicznika(async () => ({ ok: false, powod: 'zapis' }));
    await waitFor(() => expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy());
    expect(screen.getByTestId('awaryjny-sprobuj-normalnie')).toBeTruthy();
  });
  test('M1-007: „/” — `przygotuj()` odrzuca obietnicę → ekran awaryjny z „Try normally” zamiast pustej planszy', async () => {
    await ekranLicznika(async () => { throw new Error('baza zajęta'); });
    await waitFor(() => expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy());
    expect(screen.getByTestId('awaryjny-sprobuj-normalnie')).toBeTruthy();
  });

  async function korzen() {
    mockT = await tEn();
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true }); // start na pierwszym planie (ADR-0019)
    await zamontuj(trasa('../../app/_layout'));
  }
  test('M1-007: korzeń — strażnik startu (`rozpocznijStart`) odrzuca obietnicę → ekran awaryjny z „Try normally”', async () => {
    mockStart.rozpocznij = async () => { throw new Error('dysk'); };
    await korzen();
    await waitFor(() => expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy());
    expect(screen.getByTestId('awaryjny-sprobuj-normalnie')).toBeTruthy();
  });
  test('M1-007: korzeń — po utworzeniu kontenera odczyt startu (`dostep.odswiez`) odrzuca obietnicę → ekran awaryjny', async () => {
    mockStart.rozpocznij = async () => ({ tryb: 'normalny' });
    mockStart.kontener = async () => ({
      ok: true,
      wartosc: { dostep: { nasluchuj: () => () => undefined, odswiez: async () => { throw new Error('baza zajęta'); } }, wzor: { k: { obserwujSiec: () => () => undefined } }, porty: { siec: {} } },
    });
    await korzen();
    await waitFor(() => expect(screen.getByTestId('tryb-awaryjny')).toBeTruthy());
    expect(screen.getByTestId('awaryjny-sprobuj-normalnie')).toBeTruthy();
  });
});
