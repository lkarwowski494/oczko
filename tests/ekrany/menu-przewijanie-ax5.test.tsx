// P2-6 (04, Aneks P2, poz. 9; P-366 uwaga S3): przy AX5 lista akcji menu ••• nie mieści się w arkuszu. Decyzja 04 (opcja A): ostatni widoczny wiersz jest
// przycięty i to jest wskazówka przewijania — bez cienia, bez gradientu, bez przyciągania do wiersza i bez wskaźnika przewijania (Trening: wzorzec 31, S18 —
// `showsVerticalScrollIndicator={false}`, brak `flashScrollIndicators`). Ten test: układ w RNTL nie jest liczony, więc sprawdza właściwości przewijanej listy;
// że ostatni wiersz faktycznie wystaje, potwierdzi scenariusz 30 (krok menu AX5) w przebiegu macOS.
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Arkusz, Przycisk } from '../../src/ekrany/Arkusz';
import { MenuProjektu } from '../../src/ekrany/MenuProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const przewijane = () => screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && n.type.includes('ScrollView'));
const wywolania = () => ({ naNazwa: jest.fn(), naCel: jest.fn(), naPrzypomnienie: jest.fn(), naPowtorzenie: jest.fn(), naWpisz: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj: jest.fn(), naUkoncz: jest.fn(), naZamknij: jest.fn() });
const PRZYCIAGANIE = ['snapToInterval', 'snapToOffsets', 'snapToStart', 'snapToEnd', 'snapToAlignment', 'pagingEnabled', 'persistentScrollbar'];

test('menu •••: lista akcji bez wskaźnika przewijania i bez przyciągania do wiersza (ostatni wiersz może być przycięty)', () => {
  render(<MenuProjektu stan={{ projekt: 'Harbor Sweater', zablokowany: false, wartosc: 3 }} t={t} {...wywolania()} />);
  const lista = przewijane()[0]!;
  expect(lista.props.showsVerticalScrollIndicator).toBe(false);
  expect(PRZYCIAGANIE.filter((p) => lista.props[p] !== undefined)).toEqual([]);
});

test('arkusz decyzji z ✕ i bez ✕: ta sama lista bez wskaźnika przewijania', () => {
  const { unmount } = render(<Arkusz tytul="Bez ✕"><Przycisk tekst="x" onPress={jest.fn()} /></Arkusz>);
  expect(przewijane()[0]!.props.showsVerticalScrollIndicator).toBe(false);
  unmount();
  render(<Arkusz tytul="Z ✕" zamknij={{ etykieta: 'Close', naZamknij: jest.fn() }}><Przycisk tekst="x" onPress={jest.fn()} /></Arkusz>);
  expect(przewijane()[0]!.props.showsVerticalScrollIndicator).toBe(false);
});

test('arkusz nie rysuje cienia ani gradientu pod listą (kolejny element po liście to pasek przycisków z linią, nie nakładka)', () => {
  render(<MenuProjektu stan={{ projekt: 'Harbor Sweater', zablokowany: false, wartosc: 3 }} t={t} {...wywolania()} />);
  const arkusz = screen.UNSAFE_root; // całe drzewo arkusza: lista akcji + pasek przycisków
  const naklady = arkusz.findAll((n) => typeof n.type === 'string' && n.props.style !== undefined)
    .map((n) => RN.StyleSheet.flatten(n.props.style) as Record<string, unknown>)
    .filter((s) => ['shadowOpacity', 'shadowColor', 'shadowRadius', 'elevation', 'boxShadow', 'experimental_backgroundImage', 'backgroundImage'].some((k) => s[k] !== undefined));
  expect(naklady).toEqual([]);
});

test('kod aplikacji nie wywołuje flashScrollIndicators ani nie włącza persistentScrollbar (S18 Treningu)', () => {
  const pliki = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? pliki(path.join(d, e.name)) : /\.(tsx?|jsx?)$/.test(e.name) ? [path.join(d, e.name)] : []));
  const trafienia = [...pliki('src'), ...pliki('app')].filter((f) => /flashScrollIndicators|persistentScrollbar/.test(fs.readFileSync(f, 'utf8')));
  expect(trafienia).toEqual([]);
});
