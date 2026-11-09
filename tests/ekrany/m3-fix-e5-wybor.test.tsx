// M3 fix E5, 011 (P-614): wybór jednej opcji ma jeden wygląd — `ZnacznikRadio` (znaczniki.radio 28) także w jednostkach formularza włóczki
// (dotąd chipy z ramą); zaznaczony wzór w liście wzorów ▾ = symbol SF `checkmark` w `akcentTekst` (znaczniki.wyboruListy), nie glif „✓”.
import React from 'react';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { StyleSheet } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { FormularzWloczekProjektu } from '../../src/ekrany/FormularzeProjektu';
import { kolorJasny, PROG_KATEGORII_DOSTEPNOSCI } from '../../src/ekrany/motyw';
import { FormularzWloczki } from '../../src/ekrany/Zapas';
import { MenuWzorow } from '../../src/ekrany/WzorMenu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let mockSkala = 1;
afterEach(() => { mockSkala = 1; });
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('011: jednostki w formularzu włóczki — każda opcja ma ZnacznikRadio, wybrana jedna', () => {
  render(<FormularzWloczki t={t} poczatek={null} jednostki="metryczne" przelicz={() => null} bazowa={() => null} formatuj={(n) => String(n)} naZapisz={jest.fn()} naAnuluj={jest.fn()} />);
  for (const j of ['m', 'yd', 'g', 'oz']) {
    const opcja = screen.queryByTestId(`zapas-jednostka-${j}`);
    if (!opcja) continue;
    expect(opcja.findAll((n) => n.props.testID === 'znacznik-radio' && typeof n.type === 'string').length).toBe(1);
  }
  expect(screen.getAllByTestId('znacznik-radio', { includeHiddenElements: true }).length).toBeGreaterThanOrEqual(2);
});

test('011: lista wzorów ▾ — bieżący wzór z symbolem checkmark, bez glifu „✓” w tekście', () => {
  const st = { menuTlo: {}, menu: {}, pozycja: {}, tresc: {}, niszczaca: {} };
  render(<MenuWzorow st={st} t={t} wzory={[{ wzorId: 'w1', nazwa: 'Front' }, { wzorId: 'w2', nazwa: 'Back' }]} oczekujace={[]} wzorId="w1" zamknij={jest.fn()} naWybor={jest.fn()} naUsunOczekujacy={jest.fn()} />);
  expect(screen.queryByText(/✓/)).toBeNull();
  expect(screen.getByText('Front')).toBeTruthy();
  const symbole = screen.UNSAFE_root.findAll((n) => n.props.nazwa === 'checkmark');
  expect(symbole.length).toBe(1);
});

// 011 pole wyboru (P-619 wariant B): kwadrat `znaczniki.radio` 28 (od AX1 `radioAx5` 40) z promieniem `promienie.pole` — zastępczo, bo tokeny nie mają osobnego pola wyboru
// (04 oceni przy reaudycie); puste: obwódka 2 `tekst2`; zaznaczone: wypełnione `przycisk` z symbolem SF `checkmark` w `przyciskTekst` (jak `ZnacznikRadio`), bez glifu „✓”.
const zapasWloczek = [{ id: 'y1', nazwa: 'Merino', motki: 3 }, { id: 'y2', nazwa: 'Alpaka', motki: 0 }];
const pokazWloczki = () => render(<FormularzWloczekProjektu t={t} zapas={zapasWloczek} poczatkowe={['y1']}
  naZapisz={jest.fn(async () => ({ ok: true as const, wartosc: undefined }))} naAnuluj={jest.fn()} naDodajWloczke={jest.fn()} />);
const poleW = (id: string) => within(screen.getByTestId(`wloczka-wybor-${id}`)).getByTestId('pole-wyboru', { includeHiddenElements: true });

test('011 pole wyboru: kwadrat znaczniki.radio × znaczniki.radio, promień promienie.pole (zastępczo, P-619)', () => {
  pokazWloczki();
  for (const id of ['y1', 'y2']) {
    expect(StyleSheet.flatten(poleW(id).props.style)).toMatchObject({ width: tokeny.znaczniki.radio, height: tokeny.znaczniki.radio, borderRadius: tokeny.promienie.pole });
  }
});

test('011 pole wyboru od AX1: kwadrat znaczniki.radioAx5', () => {
  mockSkala = PROG_KATEGORII_DOSTEPNOSCI;
  pokazWloczki();
  expect(StyleSheet.flatten(poleW('y1').props.style)).toMatchObject({ width: tokeny.znaczniki.radioAx5, height: tokeny.znaczniki.radioAx5, borderRadius: tokeny.promienie.pole });
});

test('011 pole wyboru: zaznaczone = przycisk + checkmark, puste = obwódka tekst2 bez symbolu; bez glifu „✓”', () => {
  pokazWloczki();
  expect(StyleSheet.flatten(poleW('y1').props.style)).toMatchObject({ backgroundColor: kolorJasny.przycisk });
  expect(poleW('y1').findAll((n) => n.props.nazwa === 'checkmark').length).toBe(1);
  expect(StyleSheet.flatten(poleW('y2').props.style)).toMatchObject({ borderWidth: 2, borderColor: kolorJasny.tekst2 });
  expect(poleW('y2').findAll((n) => n.props.nazwa === 'checkmark').length).toBe(0);
  expect(screen.queryByText('✓', { includeHiddenElements: true })).toBeNull();
});

test('011 strażnik: w src/ekrany brak glifu „✓” w JSX (wybór = ZnacznikRadio / PoleWyboru / checkmark)', () => {
  const kat = join(__dirname, '../../src/ekrany');
  const trafienia = readdirSync(kat).filter((f) => f.endsWith('.tsx')).flatMap((f) => readFileSync(join(kat, f), 'utf8').split('\n')
    .flatMap((w, i) => (/'✓'|"✓"|>✓</.test(w) ? [`${f}:${i + 1}`] : [])));
  expect(trafienia).toEqual([]);
});
