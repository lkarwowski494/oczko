// Cienkie adaptery platformy (test roli 08 na wstrzykniętych modułach): Zegar (RD-16 przez domenę), Haptyka (wzorce tokenów 04), EkranAktywny (tag).
import { ekranAktywny } from '../../src/platforma/ekran-aktywny';
import { haptyka, ODSTEP_PRZYPOMNIENIA_MS } from '../../src/platforma/haptyka';
import { zegarSystemu } from '../../src/platforma/zegar';

test('Zegar: ms i strefa z systemu, dzień lokalny w strefie (RD-16-W1: 2023-06-04T01:30Z w New York → 2023-06-03); zła strefa = wyjątek', () => {
  const ms = Date.UTC(2023, 5, 4, 1, 30);
  expect(zegarSystemu(() => ms, () => 'America/New_York').teraz()).toEqual({ ms, strefa: 'America/New_York', dzien: '2023-06-03' });
  expect(() => zegarSystemu(() => ms, () => 'Nie/Istnieje').teraz()).toThrow('Zegar');
});

// 08 partia 4 (P-135 Q4a): zagraj(WzorzecHaptyki) zamiast rzad()/przypomnienie(); pełna wyrocznia tokenów: tests/adaptery/haptyka-wzorce.test.ts.
test('Haptyka: plus = jedno .light; rzadZInstrukcja = dwa .medium z odstępem 90 ms; błąd modułu bez wyjątku', async () => {
  const uderzenia: string[] = [];
  const czekania: number[] = [];
  const h = haptyka({ impactAsync: async (s) => { uderzenia.push(s); }, notificationAsync: async () => undefined }, async (ms) => { czekania.push(ms); });
  h.zagraj('plus');
  h.zagraj('rzadZInstrukcja');
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
  expect([uderzenia, czekania]).toEqual([['light', 'medium', 'medium'], [ODSTEP_PRZYPOMNIENIA_MS]]);
  expect(() => haptyka({ impactAsync: async () => { throw new Error('x'); }, notificationAsync: async () => { throw new Error('x'); } }).zagraj('bladZapisu')).not.toThrow();
});

test('EkranAktywny: włącz i wyłącz z tym samym tagiem (activateKeepAwakeAsync / deactivateKeepAwake)', () => {
  const w: string[] = [];
  const e = ekranAktywny({ activateKeepAwakeAsync: async (t) => { w.push(`+${t}`); }, deactivateKeepAwake: async (t) => { w.push(`-${t}`); } });
  e.wlacz('licznik'); e.wylacz('licznik');
  expect(w).toEqual(['+licznik', '-licznik']);
});
