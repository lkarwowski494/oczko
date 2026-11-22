// PU-290 — nagłówek listy „Patterns in …” renderowany od BX-005 (FX5, asercja niżej). Katalog „Wzory”: projekt z dwoma wzorami (zdjęcie strony i PDF) → tytuł wzoru z ▾ → lista „Patterns in …” z ✓ przy bieżącym → wybór PDF: widok PDF z jego
// rysunkami (zakreśleniami) → restart: otwiera się ostatnio wybrany wzór → ekran projektu ma grupę „Patterns” z dwoma wierszami.
// Trasy „/wzor” i „/projekt/[id]” na prawdziwej bazie, prawdziwych przypadkach użycia i prawdziwym t() z en.json; widok strony PDF to atrapa modułu natywnego (Swift),
// która zapisuje propsy (dokument z rysunkami). „Restart” to odmontowanie i ponowne zamontowanie trasy na tej samej bazie.
import React from 'react';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { View } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { czesc, licznik, plik, projekt, rysunek, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { T0, czasWTle, ile, jeden, sha256, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import type { PortBazy } from '../../src/domena/porty';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn(), navigate: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, useIsFocused: () => true, useFocusEffect: (f: () => void) => (require('react') as typeof import('react')).useEffect(f, [f]) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/system', () => ({ oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
type ZdarzenieRysunku = { nativeEvent: { wzorId: string; strona: number; plikTymczasowy: string; oczekujace?: number } };
type PropsWidoku = { dokument?: { wzorId: string; rysunki: { strona: number; plik: string }[] }; onRysunek?: (e: ZdarzenieRysunku) => void; onZakreslenia?: (e: { nativeEvent: { liczba: number } }) => void };
let mockWidok: PropsWidoku = {};
const mockReact = React; // jest.mock podnosi fabrykę nad importy: odwołania muszą mieć prefiks mock
const mockRn = { View };
jest.mock('../../modules/oczko-wzor', () => ({
  WidokWzoruNatywny: (p: PropsWidoku) => { mockWidok = p; return mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }); },
}));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;
const EkranProjektu = (require('../../app/projekt/[id]') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const SKAN = Buffer.from('%PDF-1.4\n% skan strony\n%%EOF\n');
const RYS = Buffer.from('pkdrawing-zakreslenie');

async function zasiej() {
  const { s, k, j } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf'), hSkan = wlozPlik(s.magazyn, SKAN, 'pdf'), r = wlozPlik(s.magazyn, RYS, 'pkdrawing');
  await wykonaj((s.baza satisfies PortBazy), [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Back', 1), ...licznik('l1', 'c1', 5), plik(h, 'pdf', PDF.length), plik(hSkan, 'pdf', SKAN.length), plik(r, 'pkdrawing', RYS.length),
    wzor('w1', 'p1', h), ["UPDATE wzor SET nazwa = 'Sleeve chart' WHERE id = 'w1'", []], rysunek('w1', 0, r),
    ["INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, zmieniono_ms) VALUES ('w2', 'p1', 'Page photo', 'obraz', ?, ?)", [hSkan, T0]]]);
  await k.otworz('l1');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle };
  mockAplikacja = { kontener: { z: s.z, j, dostep: { stan: () => ({ poziom: 'darmowa' }) }, porty: { haptyka: { zagraj: jest.fn() }, siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
    wzor: { z: zw, k: { odswiezMigawke: async () => undefined, stan: () => ({ czekaSiec: [] }), naZmiane: () => () => undefined }, platforma: { skanerDostepny: () => false, miniatura: async () => null, wklej: async () => null } } }, licznik: k, preferencje: { stan: () => ({ wibracje: false }) } };
  return s;
}
const otworzWzor = async () => { mockWidok = {}; render(<EkranWzoru />); await waitFor(() => expect(mockWidok.dokument).toBeDefined()); };

test('PU-290 (część): ▾ → lista wzorów z ✓ → wybór „Sleeve chart” (PDF z rysunkiem) → po restarcie ten sam wzór; projekt ma dwa wzory w grupie „Patterns”', async () => {
  await zasiej();
  mockParams = {};

  await otworzWzor(); // bez zapamiętanego wzoru: pierwszy z listy (po nazwie) — zdjęcie strony
  expect(mockWidok.dokument?.wzorId).toBe('w2');
  fireEvent.press(await screen.findByTestId('wzor-przelacz'));
  expect(screen.getByText('Patterns in Sweter')).toBeTruthy(); // BX-005: nagłówek menu `wzor.przelacz_naglowek` z nazwą projektu (design-spec Kreski :671, :958 „A”)
  expect(screen.getByRole('menuitem', { name: 'Page photo' }).props.accessibilityState).toMatchObject({ selected: true }); // ✓ przy bieżącym
  fireEvent.press(screen.getByRole('menuitem', { name: 'Sleeve chart' }));
  await waitFor(() => expect(mockWidok.dokument?.wzorId).toBe('w1'));
  expect(mockWidok.dokument?.rysunki).toHaveLength(1); // widok PDF z jego zakreśleniami
  expect(screen.getByTestId('wzor-zrodlo')).toHaveTextContent(/^PDF/);
  await act(async () => { await new Promise((x) => setTimeout(x, 100)); }); // zapis ostatnio wybranego wzoru

  screen.unmount(); // „zabij aplikację → Kontynuuj”
  await otworzWzor();
  expect(mockWidok.dokument?.wzorId).toBe('w1');
  expect(screen.getByTestId('wzor-zrodlo')).toHaveTextContent(/^PDF/);

  screen.unmount();
  mockParams = { id: 'p1' };
  render(<EkranProjektu />);
  await waitFor(() => expect(screen.getAllByTestId('projekt-wzor')).toHaveLength(2));
  expect(within(screen.getAllByTestId('projekt-wzor')[0]!).getByText('Page photo')).toBeTruthy();
  expect(within(screen.getAllByTestId('projekt-wzor')[1]!).getByText('Sleeve chart')).toBeTruthy();
});

// PU-290 (stan zaznaczenia, BX28): ✓ w liście wzorów jest przy WYBRANYM wzorze i tylko przy nim (po wyborze ✓ przechodzi z „Page photo” na „Sleeve chart”);
// przycisk narzędzia „Highlighter” w pasku wzoru niesie stan zaznaczenia (wybrane → `selected: true`, drugie stuknięcie → `false`). Mutacje: `selected: !(…)` w `WzorMenu.tsx` i `WzorPrzegladarka.tsx`.
test('PU-290 (stan): po wyborze „Sleeve chart” ✓ stoi tylko przy nim; zakreślacz po stuknięciu jest zaznaczony, po drugim — nie', async () => {
  await zasiej();
  mockParams = {};
  await otworzWzor(); // „Page photo”
  const wybrany = (nazwa: string) => screen.getByRole('menuitem', { name: nazwa }).props.accessibilityState.selected;
  fireEvent.press(await screen.findByTestId('wzor-przelacz'));
  expect(wybrany('Page photo')).toBe(true);
  expect(wybrany('Sleeve chart')).toBe(false);
  fireEvent.press(screen.getByRole('menuitem', { name: 'Sleeve chart' }));
  await waitFor(() => expect(mockWidok.dokument?.wzorId).toBe('w1'));
  fireEvent.press(await screen.findByTestId('wzor-przelacz')); // lista otwarta ponownie: ✓ przeszło na wybrany wzór
  expect(wybrany('Sleeve chart')).toBe(true);
  expect(wybrany('Page photo')).toBe(false);
  fireEvent.press(screen.getByRole('menuitem', { name: 'Sleeve chart' })); // zamknięcie listy
  const zakreslacz = () => screen.getByTestId('wzor-zakreslacz').props.accessibilityState.selected;
  expect(zakreslacz()).toBe(false);
  fireEvent.press(screen.getByTestId('wzor-zakreslacz'));
  await waitFor(() => expect(zakreslacz()).toBe(true));
  fireEvent.press(screen.getByTestId('wzor-zakreslacz'));
  await waitFor(() => expect(zakreslacz()).toBe(false));
});

// PU-291 — CZĘŚCIOWO (zob. raport): „Rename” → nowa nazwa: tytuł przełącznika i grupa „Patterns” projektu mają nową nazwę; pusta nazwa nie zmienia nazwy.
// Część „krok Udostępnij (migawka)” nie jest sprawdzana: migawka niesie tylko liczbę wzorów projektu (src/przypadki-uzycia/migawka.ts:17).
test('PU-291 (część): ••• → „Rename” → „Front chart” → tytuł i grupa „Patterns” projektu z nową nazwą; pusta nazwa nie zapisuje', async () => {
  await zasiej();
  mockParams = {};
  await otworzWzor(); // otwiera „Page photo” (pierwszy po nazwie)
  fireEvent.press(screen.getByTestId('wzor-menu'));
  fireEvent.press(screen.getByTestId('wzor-zmien-nazwe'));
  fireEvent.changeText(screen.getByTestId('wzor-nazwa-pole'), '   ');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  expect(screen.getByTestId('wzor-nazwa-pole')).toBeTruthy(); // pusta nazwa: arkusz zostaje, nazwa bez zmiany
  fireEvent.changeText(screen.getByTestId('wzor-nazwa-pole'), 'Front chart');
  await act(async () => { fireEvent.press(screen.getByTestId('formularz-zapisz')); await new Promise((x) => setTimeout(x, 100)); });
  await waitFor(() => expect(screen.getByTestId('wzor-przelacz').props.accessibilityLabel).toBe('Pattern: Front chart. Switch pattern'));
  screen.unmount();
  mockParams = { id: 'p1' };
  render(<EkranProjektu />);
  await waitFor(() => expect(screen.getAllByTestId('projekt-wzor')).toHaveLength(2));
  expect(screen.getByText('Front chart')).toBeTruthy();
  expect(screen.queryByText('Page photo')).toBeNull();
});

// PU-011 / BX-029 (FX5): dwa szybkie zakreślenia jedno po drugim nie giną. Widok natywny wysyła przy każdym pociągnięciu CAŁY rysunek strony (`onRysunek`,
// M1-084/105); zdarzenia przychodzą jedno za drugim (≤ 1 s, tu bez przerwy), a zapis strony idzie po kolei w kolejności wywołań (`zapiszRysunek`, kolejka klucza).
// Oczekiwany wynik: oba pasy od razu (liczba „4 highlights” po dwóch zdarzeniach z licznikiem 3 → 4), po restarcie wszystkie 4 (w bazie rysunek z drugiego zdarzenia, nie z pierwszego).
test('PU-011 (BX-029): dwa pociągnięcia w odstępie ≤ 1 s — oba zapisane: ostatni rysunek strony w bazie, licznik „4 highlights”, po restarcie wszystkie 4', async () => {
  const s = await zasiej();
  mockParams = {};
  await otworzWzor(); // „Page photo” (zdjęcie strony), bez rysunku
  const k = s.z.katalogi.tymczasowy;
  mkdirSync(k, { recursive: true });
  const f3 = join(k, 'w2__0__trzy.pkdrawing'), f4 = join(k, 'w2__0__cztery.pkdrawing');
  writeFileSync(f3, 'zakreslenia:3');
  writeFileSync(f4, 'zakreslenia:4');
  const zdarzenie = (plikTymczasowy: string): ZdarzenieRysunku => ({ nativeEvent: { wzorId: 'w2', strona: 0, plikTymczasowy, oczekujace: 0 } });
  await act(async () => { // oba pociągnięcia w jednej chwili: drugie przychodzi, zanim pierwszy zapis się skończy
    mockWidok.onZakreslenia?.({ nativeEvent: { liczba: 3 } });
    mockWidok.onRysunek?.(zdarzenie(f3));
    mockWidok.onZakreslenia?.({ nativeEvent: { liczba: 4 } });
    mockWidok.onRysunek?.(zdarzenie(f4));
    await new Promise((x) => setTimeout(x, 200));
  });
  expect(screen.getByTestId('wzor-zakreslenia')).toHaveTextContent('4 highlights'); // oba pasy od razu
  expect(await ile(s.baza, 'rysunek', "wzor_id = 'w2' AND strona = 0")).toBe(1); // jeden rysunek strony (cały, nie dwa kawałki)
  expect(await jeden(s.baza, "SELECT plik_sha256 FROM rysunek WHERE wzor_id = 'w2' AND strona = 0")).toEqual({ plik_sha256: sha256('zakreslenia:4') }); // ostatni, nie pierwszy
  expect(await ile(s.baza, 'plik', `sha256 = '${sha256('zakreslenia:3')}'`)).toBe(0); // pierwszy plik nie zostaje jako sierota
  screen.unmount(); // „zabij aplikację → otwórz wzór”
  await otworzWzor();
  expect(mockWidok.dokument?.wzorId).toBe('w2');
  expect(mockWidok.dokument?.rysunki).toHaveLength(1);
  expect(readFileSync(String(mockWidok.dokument?.rysunki[0]?.plik).replace(/^file:\/\//, ''), 'utf8')).toBe('zakreslenia:4'); // po restarcie wszystkie 4
});

// PU-148 (KO-105, „iPad”: „nie tracić kresek”): kreska zapisana przy zamykaniu ekranu wzoru trafia do pliku oczekującego (zdarzenie nie ma już odbiorcy). Po ponownym otwarciu wzoru trasa odzyskuje plik:
// rysunek strony jest w bazie, w dokumencie przekazanym widokowi, a plik oczekujący znika. Poza Jest (częściowo): sama kreska PencilKit palcem i cofanie w widoku natywnym (BX-041) — scenariusz 116 (oczekujący);
// zapis i odzysk plików (kolejność, błędy zapisu): tests/dane/wzor-rysunki-odzysk.test.ts.
test('PU-148 (część): plik oczekujący z kreską (zamknięcie ekranu przed zapisem) wraca przy ponownym otwarciu wzoru: rysunek w bazie i w widoku, plik zdjęty', async () => {
  const s = await zasiej();
  mockParams = {};
  const k = join(s.z.katalogi.tymczasowy, 'rysunki-wzoru');
  mkdirSync(k, { recursive: true });
  const f = join(k, 'w2__0__kreska.pkdrawing');
  writeFileSync(f, 'zakreslenia:7');
  expect(await ile(s.baza, 'rysunek', "wzor_id = 'w2' AND strona = 0")).toBe(0); // przed otwarciem kreska jest tylko w pliku
  await otworzWzor(); // „Page photo” (w2) — pierwszy po nazwie
  expect(mockWidok.dokument?.wzorId).toBe('w2');
  expect(mockWidok.dokument?.rysunki).toHaveLength(1); // odzysk wykonany przed pierwszym odczytem widoku
  expect(readFileSync(String(mockWidok.dokument?.rysunki[0]?.plik).replace(/^file:\/\//, ''), 'utf8')).toBe('zakreslenia:7');
  expect(await jeden(s.baza, "SELECT plik_sha256 FROM rysunek WHERE wzor_id = 'w2' AND strona = 0")).toEqual({ plik_sha256: sha256('zakreslenia:7') });
  expect(existsSync(f)).toBe(false); // plik oczekujący zdjęty po zapisie
});
