// P-287 (15), BR-LIC-015/S2, scenariusz 15: udawany zegarek buildu E2E (EXPO_PUBLIC_WATCH_FAKE=1, e2e/README.md:37, :251) — `wyslijStan`
// zapisuje ostatni StanZegarka, panel `e2e-zegarek-stan` pokazuje go tekstem (bez t()): rząd roboczy i przypomnienia z instrukcją.
// BX-024 (PU-334, FX5, na końcu pliku): panel pokazuje też język wysłany do zegarka (` · lang {kod}`), z tego samego źródła co 3. argument `zegarekWyslij`
// (`src/platforma/zegarek.ts:16`; `src/kompozycja/kontener.ts:89`). Scenariusz PU-334: `assertVisible: { id: "e2e-zegarek-stan", text: ".*lang de.*" }`.
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { opisStanuZegarka, PanelZegarka, zegarekSztuczny, zegarekSztucznyZJezykiem, zerujZegarekSztuczny } from '../../src/kompozycja/e2e/panele';
import { zegarek } from '../../src/platforma/zegarek';
import type { StanZegarka } from '../../src/domena/porty';

const stan = (z: Partial<StanZegarka> = {}): StanZegarka => ({
  wersja: 3, licznikId: 'l1', nazwa: 'Sweater', wartosc: 11, znaczenie: 'skonczone', glowa: 'z11', ostatniPlusMs: 1, dzien: '2026-11-10',
  dzienDozwolony: true, sesjaStartMs: null, pro: false, proWaznoscDo: null, dniWMiesiacu: [], przypomnienia: [{ od: 12, co: 6, razy: 8, tekst: 'decrease at both ends' }],
  zablokowany: false, ...z,
});

// ZR2 (P-994, U3): stan modułu `panele.tsx` (ostatni wysłany stan) przeżywał testy; przy `--randomize` „przed pierwszym stanem” padał (CI 44505505468, 44533633202).
beforeEach(() => { zerujZegarekSztuczny(); });

test('opis: wartość, rząd roboczy i przypomnienia z planem i instrukcją', () => {
  expect(opisStanuZegarka(stan())).toBe('Watch state: Sweater · 11 done · row 12 · reminders: from 12 every 6 ×8: decrease at both ends');
  expect(opisStanuZegarka(stan({ przypomnienia: [], wartosc: 0 }))).toBe('Watch state: Sweater · 0 done · row 1');
});

test('panel: przed pierwszym stanem „no state”; po wyslijStan ostatni stan (scen. 15: „.*row 12.*decrease at both ends.*”)', async () => {
  render(<PanelZegarka />);
  expect(screen.getByTestId('e2e-zegarek-stan').props.children).toBe('Watch state: none');
  await act(async () => { await zegarekSztuczny.wyslijStan(stan()); });
  expect(String(screen.getByTestId('e2e-zegarek-stan').props.children)).toMatch(/.*row 12.*decrease at both ends.*/);
});

const tekstPanelu = () => String(screen.getByTestId('e2e-zegarek-stan').props.children);

test('opis: język na końcu („ · lang de”); brak źródła języka = „lang none” (adapter wysyła wtedy null); bez argumentu opis jak dotąd', () => {
  expect(opisStanuZegarka(stan({ przypomnienia: [] }), 'de')).toBe('Watch state: Sweater · 11 done · row 12 · lang de');
  expect(opisStanuZegarka(stan({ przypomnienia: [] }), null)).toBe('Watch state: Sweater · 11 done · row 12 · lang none');
  expect(opisStanuZegarka(stan({ przypomnienia: [] }))).toBe('Watch state: Sweater · 11 done · row 12');
});

test('panel po wyslijStan pokazuje język z `jezyk()` i nadąża za zmianą języka (scen. PU-334: „.*lang de.*”)', async () => {
  let kod = 'en';
  const z = zegarekSztucznyZJezykiem(() => kod);
  render(<PanelZegarka />);
  await act(async () => { await z.wyslijStan(stan()); });
  expect(tekstPanelu()).toMatch(/.*lang en.*/);
  kod = 'de';
  await act(async () => { await z.wyslijStan(stan({ wartosc: 12 })); });
  expect(tekstPanelu()).toMatch(/.*lang de.*/);
  expect(tekstPanelu()).toMatch(/12 done/);
});

test('bez źródła języka panel pokazuje „lang none”, jak adapter (null)', async () => {
  render(<PanelZegarka />);
  await act(async () => { await zegarekSztucznyZJezykiem(undefined).wyslijStan(stan()); });
  expect(tekstPanelu()).toMatch(/ · lang none$/);
});

test('to samo źródło co 3. argument zegarekWyslij: adapter i udawany zegarek dostają ten sam kod', async () => {
  const jezyk = () => 'de';
  const wyslane: unknown[][] = [];
  const natywny = { zegarekWyslij: async (...a: unknown[]) => { wyslane.push(a); }, addListener: () => ({ remove() {} }) };
  await zegarek(natywny, jezyk).wyslijStan(stan());
  render(<PanelZegarka />);
  await act(async () => { await zegarekSztucznyZJezykiem(jezyk).wyslijStan(stan()); });
  expect(wyslane[0]?.[2]).toBe('de');
  expect(tekstPanelu()).toMatch(new RegExp(` · lang ${String(wyslane[0]?.[2])}$`));
});
