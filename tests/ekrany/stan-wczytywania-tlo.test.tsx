// M1-audytor-generalny-089 (źródło 04-studio-projektowe-503; DEC-24 a): „Loading…” i błąd odczytu z „Try again” stoją na tym samym tle
// co treść trasy po wczytaniu (design-spec, aneks M2 partia 2, „Tło StanWczytywania”): `tlo: 'papier' | 'arkusz' | 'czarne'`, domyślnie `papier`.
// Motyw ciemny, bo w jasnym `arkusz` = `papier` (#FCFCFA) i test nie odróżniłby tokenów. Trasy z `app/` z atrapą routera i kontenera
// (stan błędu odczytu jest trwały, więc tło widać bez wyścigu z odczytem).
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import * as RN from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { StanWczytywania } from '../../src/ekrany/StanWczytywania';
import { tEn } from './pomoc';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react') as typeof import('react');
  return { useRouter: () => mockRouter, useLocalSearchParams: () => ({ projekt: 'p1' }), useIsFocused: () => true, useFocusEffect: (f: () => void) => R.useEffect(f, [f]) };
});
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/przypadki-uzycia/zdjecia', () => ({ zdjecia: async () => ({ ok: false, powod: 'zapis' }), usunZdjecie: jest.fn() }));
/* eslint-disable @typescript-eslint/no-require-imports */
const trasa = (p: string) => (require(p) as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const C = tokeny.kolor.ciemny, CZ = tokeny.kolor.systemCzarny;
beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark'); });
afterEach(() => jest.restoreAllMocks());

describe('M1-089: StanWczytywania — tło i kolor podpisu według `tlo` (motyw ciemny)', () => {
  test.each([
    ['domyślne (bez tlo)', undefined, C.papier, C.olowek],
    ['papier', 'papier', C.papier, C.olowek],
    ['arkusz', 'arkusz', C.arkusz, C.olowek],
    ['czarne', 'czarne', CZ.tlo, CZ.olowek],
  ] as const)('%s: „Loading…” — tło i kolor podpisu z tokenów', async (_n, tlo, kolorTla, kolorPodpisu) => {
    const t = await tEn();
    render(<StanWczytywania stan="ladowanie" t={t} przedrostek="x" naPonow={() => undefined} {...(tlo ? { tlo } : {})} />);
    expect(screen.getByTestId('x-ladowanie')).toHaveStyle({ backgroundColor: kolorTla });
    expect(screen.getByText('Loading…')).toHaveStyle({ color: kolorPodpisu });
  });

  test('czarne: błąd odczytu — podpis i „Try again” z `systemCzarny` (podpis motywu na czerni 3,43:1)', async () => {
    const t = await tEn();
    render(<StanWczytywania stan="blad" t={t} przedrostek="x" naPonow={() => undefined} tlo="czarne" />);
    expect(screen.getByTestId('x-blad')).toHaveStyle({ backgroundColor: CZ.tlo });
    expect(screen.getByText('Couldn’t load this.')).toHaveStyle({ color: CZ.olowek });
    expect(screen.getByTestId('x-ponow')).toHaveStyle({ backgroundColor: CZ.przyciskTlo, borderColor: CZ.przyciskObrys });
    expect(screen.getByText('Try again')).toHaveStyle({ color: CZ.przyciskTekst });
  });
});

describe('M1-089: StanWczytywania na trasach arkuszowych ma tło `arkusz`, na zdjęciu ciemne', () => {
  async function zamontuj(plik: string): Promise<void> {
    const t = await tEn();
    mockAplikacja = { kontener: { j: { t }, z: {} }, licznik: { widok: async () => null } };
    const Ekran = trasa(plik);
    render(<Ekran />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  }
  test('/menu (arkusz): błąd odczytu na tle `arkusz` motywu', async () => {
    await zamontuj('../../app/menu');
    expect(screen.getByTestId('menu-blad')).toHaveStyle({ backgroundColor: C.arkusz });
  });
  test('/zdjecie (pełnoekranowa przeglądarka na czerni): błąd odczytu na tle `systemCzarny.tlo`', async () => {
    await zamontuj('../../app/zdjecie');
    expect(screen.getByTestId('zdjecie-blad')).toHaveStyle({ backgroundColor: CZ.tlo });
    expect(screen.getByText('Couldn’t load this.')).toHaveStyle({ color: CZ.olowek });
  });
});

describe('M1-089: trwała kontrola — trasa-arkusz z `StanWczytywania` podaje tlo="arkusz", zdjęcie tlo="czarne"', () => {
  const APP = path.join(__dirname, '..', '..', 'app');
  const uklad = fs.readFileSync(path.join(APP, '_layout.tsx'), 'utf8');
  const prezentacja = (r: string): string[] => [...uklad.matchAll(new RegExp(`<Stack\\.Screen name="([^"]+)" options=\\{\\{[^}]*presentation: '${r}'`, 'g'))].map((m) => m[1]);
  const pliki = (kat: string): string[] => fs.readdirSync(kat, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? pliki(path.join(kat, e.name)) : e.name.endsWith('.tsx') ? [path.join(kat, e.name)] : []));
  const zeStanem = pliki(APP).map((p) => ({ trasa: path.relative(APP, p).replace(/\.tsx$/, ''), zrodlo: fs.readFileSync(p, 'utf8') }))
    .filter((x) => x.zrodlo.includes('<StanWczytywania'));
  /** Wartości `tlo` przy każdym `<StanWczytywania …/>` w źródle trasy (brak = domyślne `papier`). */
  const tla = (zrodlo: string): string[] => [...zrodlo.matchAll(/<StanWczytywania\b([\s\S]*?)\/>/g)].map((m) => /\btlo="([a-z]+)"/.exec(m[1])?.[1] ?? 'papier');
  const ARKUSZE = new Set(prezentacja('modal'));

  test('lista tras z StanWczytywania obejmuje arkusze ze specyfikacji 04 (pułapka na zmianę zapisu)', () => {
    const arkuszowe = zeStanem.filter((x) => ARKUSZE.has(x.trasa)).map((x) => x.trasa).sort();
    expect(arkuszowe).toEqual(['drut', 'formularz/[rodzaj]', 'konflikt', 'menu', 'sesja-korekta', 'ukonczenie', 'wloczka', 'zglos']);
  });
  test.each([...ARKUSZE].filter((n) => zeStanem.some((x) => x.trasa === n)).sort())('arkusz %s: każdy StanWczytywania ma tlo="arkusz"', (n) => {
    const w = tla(zeStanem.find((x) => x.trasa === n)!.zrodlo);
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((x) => x === 'arkusz')).toBe(true);
  });
  test('zdjecie (fullScreenModal na czerni): tlo="czarne"; trasy w stosie: domyślne papier', () => {
    expect(prezentacja('fullScreenModal')).toContain('zdjecie');
    expect(tla(zeStanem.find((x) => x.trasa === 'zdjecie')!.zrodlo)).toEqual(['czarne']);
    const wStosie = zeStanem.filter((x) => !ARKUSZE.has(x.trasa) && x.trasa !== 'zdjecie');
    expect(wStosie.map((x) => x.trasa).sort()).toEqual(['dni', 'kosz', 'probka', 'projekt/[id]', 'projekty', 'sesje', 'wzor']);
    for (const x of wStosie) expect(tla(x.zrodlo).every((v) => v === 'papier')).toBe(true);
  });
});
