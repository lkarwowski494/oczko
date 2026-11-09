// 04-studio-projektowe-024, diagnoza (P-629, polecenie 08 build 2 zad. 2): na iPadzie poziomo kolumna `wzor-kolumna-licznika` pokazuje liczbę i podpis,
// ale bez `wzor-kolumna-przyciski` (przebieg 5, scen. 44). Jest nie liczy układu Yoga, więc ramki mierzy urządzenie: w buildzie E2E (P-238) kolumna
// zapisuje `onLayout` kolumny, karty liczby, grupy przycisków, −1 i „+1” do tekstu `e2e-ramki-kolumny` (x,y,w,h; współrzędne względem
// rodzica), plus okno i skalę tekstu. Scenariusz 44 czyta go `copyTextFrom` przed stuknięciem „+1”. Poza buildem E2E — brak tekstu i brak `onLayout`.
process.env.EXPO_PUBLIC_E2E = '1'; // panele E2E ładuje `src/platforma/tryb-e2e.ts` przy imporcie (require niżej, po ustawieniu); przypadek bez E2E: m3-fix-reaudit-024-ipad-kolumna.test.tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { tEn } from './pomoc';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { LicznikWzoru } = require('../../src/ekrany/WzorLicznik') as typeof import('../../src/ekrany/WzorLicznik');
const PW = tokeny.cele.paskaWzoru;
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 1194, height: 834, scale: 2, fontScale: 1 }) }));

const pokaz = () => render(<LicznikWzoru t={t} licznik={{ liczba: 0, dziergany: 1, znaczenie: 'skonczone', cel: null }} obok
  szerokoscKolumny={PW.kolumna.szerokosc} blad={false} naPlus={jest.fn()} naMinus={jest.fn()} />);
const uklad = (id: string, x: number, y: number, width: number, height: number) =>
  fireEvent(screen.getByTestId(id), 'layout', { nativeEvent: { layout: { x, y, width, height } } });

test('024 build E2E: e2e-ramki-kolumny podaje ramki kolumny, karty liczby, pary przycisków, −1, „+1”, okno i skalę (zaokrąglone)', () => {
  pokaz();
  expect(screen.getByTestId('e2e-ramki-kolumny').props.children).toBe(
    'kolumna -; blok -; przyciski -; minus -; plus -; okno 1194x834 fs 1');
  uklad('wzor-kolumna-licznika', 914, 0, 280, 760.4);
  uklad('wzor-liczba-blok', 16, 16, 248, 180);
  uklad('wzor-kolumna-przyciski', 16, 212, 248, 200);
  uklad('licznik-minus', 0, 128, 72, 72);
  uklad('licznik-plus', 88, 0, 160, 200.6);
  expect(screen.getByTestId('e2e-ramki-kolumny').props.children).toBe(
    'kolumna 914,0,280,760; blok 16,16,248,180; przyciski 16,212,248,200; minus 0,128,72,72; plus 88,0,160,201; okno 1194x834 fs 1');
});

// 024 runda 1 (run 42678725514, scen. 44, device-simulator.log 19:26:09): po obrocie pion → poziom `obok` zmienia się z false na true; hak ramek wołany
// tylko przy `obok` dawał „Rendered more hooks than during the previous render” w LicznikWzoru i zamykał aplikację przed odczytem ramek.
const elementy = (obok: boolean) => <LicznikWzoru t={t} licznik={{ liczba: 0, dziergany: 1, znaczenie: 'skonczone', cel: null }} obok={obok}
  szerokoscKolumny={obok ? PW.kolumna.szerokosc : null} blad={false} naPlus={jest.fn()} naMinus={jest.fn()} />;

test('024 build E2E: obrót pion → poziom → pion (obok false → true → false) nie zmienia liczby haków LicznikWzoru', () => {
  const r = render(elementy(false));
  expect(() => r.rerender(elementy(true))).not.toThrow();
  expect(screen.getByTestId('e2e-ramki-kolumny').props.children).toBe(
    'kolumna -; blok -; przyciski -; minus -; plus -; okno 1194x834 fs 1');
  expect(() => r.rerender(elementy(false))).not.toThrow();
  expect(screen.queryByTestId('e2e-ramki-kolumny')).toBeNull();
});

test('024 build E2E: ramki tylko z bieżącej kolumny — pomiary z paska i z wcześniejszej kolumny nie przechodzą przez obrót', () => {
  const r = render(elementy(true));
  uklad('wzor-kolumna-licznika', 914, 0, 280, 760);
  uklad('licznik-plus', 88, 0, 160, 200);
  r.rerender(elementy(false));
  uklad('licznik-minus', 16, 8, 72, 64); // pasek pod wzorem: nie mierzony
  r.rerender(elementy(true));
  expect(screen.getByTestId('e2e-ramki-kolumny').props.children).toBe(
    'kolumna -; blok -; przyciski -; minus -; plus -; okno 1194x834 fs 1');
});
