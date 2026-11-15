// BY-002 (04-studio-projektowe-002, P2): data RRRR-MM-DD (nazwa zapasowa części roboczej) wychodziła na ekran jako nazwa części, gdy użytkowniczka nazwała tylko projekt
// (licznik, „Dziś”/lista, ekran projektu, pole części w arkuszu nazwy); odwrotnie: sama nazwa części bez projektu zapisywała się, ale licznik jej nie pokazywał.
// Dane z prawdziwej bazy (node:sqlite) przez modele odczytu i kompozycję, potem ekran; teksty z prawdziwego t() en. Raport: docs/design/audyt-przeplywow-2026-11-15.md.
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { Projekt } from '../../src/ekrany/Projekt';
import { Licznik } from '../../src/ekrany/Licznik';
import { stanProjektu } from '../../src/kompozycja/projekt';
import { stanListy } from '../../src/kompozycja/projekty';
import { stanEkranu } from '../../src/kompozycja/licznik';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { widokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { DOBA, T0, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaHaptyki, tEn, wywolaniaLicznika } from './pomoc';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({ rodzaj: 'nazwa' }), useIsFocused: () => true, useFocusEffect: (f: () => void) => { (require('react') as typeof import('react')).useEffect(f, [f]); } }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranFormularza = (require('../../app/formularz/[rodzaj]') as { default: React.ComponentType }).default;

let j: Jezyk;
beforeAll(async () => { j = { t: await tEn(), jezyk: () => 'en-US', zegar24h: () => false }; });
const TERAZ = T0 + 2 * DOBA, STREFA = 'Europe/Warsaw', DATA = /\d{4}-\d{2}-\d{2}/;

async function stanLicznikaZ(nazwaProjektu: string, nienazwany: boolean, nazwaCzesci: string) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', nazwaProjektu), ...(nienazwany ? [['UPDATE projekt SET nienazwany = 1 WHERE id = ?', ['p1']] as [string, unknown[]]] : []), czesc('c1', 'p1', nazwaCzesci, 1), ...licznik('l1', 'c1', 12, { kolejnosc: 0 }), ...licznik('l2', 'c1', 8, { kolejnosc: 1 })]);
  const w = await widokLicznika(s.z, { licznikId: 'l1' });
  if (!w.ok) throw new Error(w.powod);
  return stanEkranu(w.wartosc, { j, dzis: '2026-10-24', terazMs: TERAZ, strefa: STREFA, baner: null, wibracje: true });
}

test('BY-002: projekt nazwany, część z nazwą zapasową (data) → licznik nie pokazuje daty jako nazwy części (ani w „Whole piece”)', async () => {
  const stan = await stanLicznikaZ('Harbor', false, '2026-11-10');
  expect(stan.projekt).toBe('Harbor');
  expect(stan.czesc).toBeNull();
  expect(stan.calosc?.czesc).toBeNull();
  render(<Licznik stan={stan} t={j.t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(screen.queryByText(DATA)).toBeNull();
  expect(screen.getByText('Whole piece: 20 rows')).toBeTruthy();
});

test('BY-002 (skutek odwrotny): sama nazwa części wpisana bez nazwy projektu jest widoczna na liczniku', async () => {
  const stan = await stanLicznikaZ('2026-11-10', true, 'Sleeve');
  expect(stan.czesc).toBe('Sleeve');
  expect(stan.calosc?.czesc).toBe('Sleeve');
  render(<Licznik stan={stan} t={j.t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} />);
  expect(screen.getByText('Sleeve')).toBeTruthy();
});

test('BY-002: projekt roboczy z nazwą zapasową części dalej nie pokazuje jej (F-46 bez zmian), nazwa wpisana przy nazwanym projekcie bez zmian', async () => {
  expect((await stanLicznikaZ('2026-11-10', true, '2026-11-10')).czesc).toBeNull();
  expect((await stanLicznikaZ('Harbor', false, 'Sleeve')).czesc).toBe('Sleeve');
});

test('BY-002: ekran projektu nazywa część z nazwą zapasową „Part 1” (istniejący klucz formularz.nazwa_czesc_n), nie datą; części nazwane i pary bez zmian', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), czesc('c1', 'p1', '2026-11-10', 1), ...licznik('l1', 'c1', 5), czesc('c2', 'p1', 'Sleeve', 2, { paraZ: 'c1' }), ...licznik('l2', 'c2', 3)]);
  const w = await widokProjektu(s.z, { projektId: 'p1' });
  if (!w.ok) throw new Error(w.powod);
  const stan = stanProjektu(w.wartosc, { j, terazMs: TERAZ, strefa: STREFA });
  expect(stan.czesci.map((c) => c.nazwa)).toEqual(['Part 1', 'Sleeve']);
  expect(stan.czesci[1]?.paraNazwa).toBe('Part 1');
  render(<Projekt stan={stan} t={j.t} naOtworzCzesc={jest.fn()} />);
  expect(screen.queryByText(DATA)).toBeNull();
  expect(screen.getByText('Part 1')).toBeTruthy();
});

test('BY-002: wiersz projektu na liście („Dziś”, Projekty) bez daty: bez celu „Now working row N”, z celem „Part 1 · row N of C”', () => {
  const p = { id: 'p1', nazwa: 'Harbor', nienazwany: false, utworzonoMs: 0, ostatniaPracaMs: 0, ukonczonoDzien: null, czasPracyMs: null, dniOdPracy: 1, dzis: null };
  const wiersz = (cel: number | null) => stanListy({ wToku: [{ ...p, licznik: { id: 'l1', czesc: '2026-11-10', wartosc: 3, cel } }], ukonczone: [], dni: null, kosz: 0 }, { zapytanie: '', j, terazMs: TERAZ, strefa: STREFA }).wToku[0]?.opis;
  expect(wiersz(null)).toBe('Now working row 4');
  expect(wiersz(10)).toBe('Part 1 · row 3 of 10');
  const nazwana = stanListy({ wToku: [{ ...p, licznik: { id: 'l1', czesc: 'Sleeve', wartosc: 3, cel: null } }], ukonczone: [], dni: null, kosz: 0 }, { zapytanie: '', j, terazMs: TERAZ, strefa: STREFA }).wToku[0]?.opis;
  expect(nazwana).toBe('Sleeve · row 3');
});

test('BY-002: arkusz „Nazwij projekt i część” nie wpisuje nazwy zapasowej (daty) w pole części', async () => {
  const { s, k, j: jj } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), czesc('c1', 'p1', '2026-11-10', 1), ...licznik('l1', 'c1', 5)]);
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j: jj, porty: { haptyka: { zagraj: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: {} };
  render(<EkranFormularza />);
  await act(async () => { await new Promise((r) => setTimeout(r, 120)); });
  expect(screen.getByDisplayValue('Harbor')).toBeTruthy();
  expect(screen.queryByDisplayValue(DATA)).toBeNull();
});

test('BY-002: nazwa powtórzenia bez nazwy licznika nie wraca do daty — część zapasowa → nazwa projektu; nazwa części wpisana zostaje', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), czesc('c1', 'p1', '2026-11-10', 1), ...licznik('l1', 'c1', 12)]);
  const w = await widokLicznika(s.z, { licznikId: 'l1' });
  if (!w.ok) throw new Error(w.powod);
  const opcje = { j, dzis: '2026-10-24', terazMs: TERAZ, strefa: STREFA, baner: null, wibracje: true };
  const powt = { numer: 2, rzadW: 3, dlugosc: 8 };
  expect(stanEkranu({ ...w.wartosc, powtorzenie: powt }, opcje).powtorzenie?.nazwa).toBe('Harbor');
  expect(stanEkranu({ ...w.wartosc, powtorzenie: powt, czesc: { ...w.wartosc.czesc, nazwa: 'Sleeve' } }, opcje).powtorzenie?.nazwa).toBe('Sleeve');
});
