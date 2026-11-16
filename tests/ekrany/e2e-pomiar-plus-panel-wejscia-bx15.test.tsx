// BX15 / zad. 5 (scenariusz 31, NFR-WYD-001, p95 170 ms przy progu 100 ms): czy panel `e2e-licznik-wejscia` (FX6b) dokłada pracę do mierzonej ścieżki?
// Okno pomiaru (app/licznik.tsx:24-31): t0 na początku `uslugi.dodajRzad` → zapis → dwie klatki (rAF×2) po powrocie z zapisu. Haki `diagnostyka?.*` z `useStanLicznika`
// (src/ekrany/Aplikacja.tsx:75-83) wołane po zapisie (`zapis`, `stan`) i po `odswiez` (`odswiezenie`, `stan`) przepisują stan panelu → render `PanelLicznika`.
// Test odtwarza kolejność wywołań jednego „+1” i liczy zatwierdzenia (commit) panelu w oknie (po t0). To liczba, nie milisekundy urządzenia: Jest nie mierzy klatek.
import React, { Profiler } from 'react';
import { act, render } from '@testing-library/react-native';
import { diagnostykaLicznika, PanelLicznika, zerujWejscia } from '../../src/kompozycja/e2e/panele';

const mikro = () => new Promise<void>((r) => setTimeout(r, 0));

test('jedno „+1”: ile zatwierdzeń panelu e2e-licznik-wejscia wypada w oknie pomiaru (od t0 w dodajRzad do drugiej klatki)', async () => {
  zerujWejscia();
  let wOknie = false;
  let przedOknem = 0; let wOknieLiczba = 0; // przedOknem zostaje 0: wejście i t0 są w jednym tyku
  render(<Profiler id="p" onRender={() => { if (wOknie) wOknieLiczba += 1; else przedOknem += 1; }}><PanelLicznika /></Profiler>);
  przedOknem = 0; // pierwszy render to montowanie
  const d = diagnostykaLicznika;
  await act(async () => {
    d.wejscie('plus'); // naPlus (Aplikacja.tsx:75): bez `await` do t0 — render zlecony tym wywołaniem (uSES, pilny) idzie po t0, czyli w oknie
    wOknie = true; // t0 = początek `dodajRzad` (app/licznik.tsx:25), ten sam tyk synchroniczny; potem zapis do SQLite
    await mikro();
    d.zapis('plus', true); d.stan(1); // po zapisie, przed rAF×2
    await mikro(); // `await odswiez()` — odczyt stanu z kompozycji
    d.odswiezenie('start');
    await mikro();
    d.odswiezenie('zastosowane'); d.stan(1);
  });
  // eslint-disable-next-line no-console
  console.log(`BX15 pomiar: zatwierdzenia panelu przed oknem = ${przedOknem}, w oknie (po t0) = ${wOknieLiczba}`);
  expect(przedOknem).toBe(0);
  expect(wOknieLiczba).toBe(4); // wejście, zapis+stan (jedna partia), odswiezenie(start), odswiezenie(zastosowane)+stan
});
