// RD-17 strażnik stuknięć (BR-LIC-019, F-47) — poziom domena-Node. Parametry z src/konfiguracja.ts (P-047 (4)).
// Wyrocznia: tests/wektory/brd.json RD-17-W1…W6 (jedno źródło: aplikacja) i decyzja P-091 (4b): osobno dla każdego
// źródła, po czasie zdarzenia (`czasMs`), nigdy po czasie dostarczenia (R-009, ER-40 — wektory roli 01 jeszcze nie dopisane).
// Seria = wszystkie dodania z odstępem ≤ T od poprzedniego (RD-17 „Wzór”), więc oczekiwane `ids`, `odMs`, `doMs` wynikają z wektora.
import { serieDoSprawdzenia } from '../../../src/domena/straznik-tempa';
import type { Dodanie, Seria } from '../../../src/domena/straznik-tempa';
import type { ZrodloZdarzenia } from '../../../src/domena/stany';
import { STRAZNIK_SERIA_ZDARZEN, STRAZNIK_OKNO_S } from '../../../src/konfiguracja';
import { type WartoscBrd, wektoryReguly, licznikWektorow, BLAD_DANYCH } from '../../narzedzia/akceptacja';

const KONF = { seria: STRAZNIK_SERIA_ZDARZEN, oknoS: STRAZNIK_OKNO_S };
const KRYTERIA_RD17: Record<string, string> = {
  'RD-17-W1': 'BR-LIC-019/S1',
  'RD-17-W2': 'BR-LIC-019',
  'RD-17-W3': 'BR-LIC-019',
  'RD-17-W4': 'BR-LIC-019/S2',
  'RD-17-W5': 'BR-LIC-019',
  'RD-17-W6': 'BR-LIC-019',
  'RD-17-W7': 'BR-LIC-019',
};

/** Chwile w sekundach „0; 0,4; …” → ms całkowite (bez błędu 2,01 × 1000 = 2009,999…). */
function chwileMs(v: WartoscBrd): number[] {
  // Tablica z brd.json (P-097 1a; „brak” → NaN, RD-17-W7) albo dawny tekst „0; 0,4; …”.
  if (Array.isArray(v)) return v.map((s) => (s === 'brak' ? NaN : Math.round(Number(s) * 1000)));
  return String(v).split(';').map((s) => Math.round(Number(s.trim().replace(',', '.')) * 1000));
}
/** Źródło z wektora BRD („ekran blokady”) → wartość ze STANY['zdarzenie.zrodlo']. */
function zrodloZBrd(s: unknown): ZrodloZdarzenia {
  if (s === 'aplikacja') return 'aplikacja';
  if (s === 'ekran blokady') return 'ekran_blokady';
  if (s === 'zegarek') return 'zegarek';
  throw new Error(`RD-17: nieznane źródło ${String(s)}`);
}
function dodania(zrodlo: ZrodloZdarzenia, ms: number[], prefiks = zrodlo): Dodanie[] {
  return ms.map((czasMs, i) => ({ id: `${prefiks}-${i}`, czasMs, zrodlo }));
}
/** Zbiór serii porównywany jako zbiór (§3.3): kolejność serii w wyniku nie jest kontraktem. */
function posortowane(s: Seria[]): Seria[] {
  return [...s].sort((a, b) => a.zrodlo.localeCompare(b.zrodlo) || a.odMs - b.odMs);
}

test('BR-LIC-019 RD-17 parametry: seria 3 dodań w oknie 2 s (P-047 (4)) [ZIELONY-OK: parametry konfiguracji, nie zachowanie]', () => {
  expect(KONF).toEqual({ seria: 3, oknoS: 2 });
});

describe('RD-17 serieDoSprawdzenia: wektory BRD (źródło: aplikacja)', () => {
  const wektory = wektoryReguly('RD-17');
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${KRYTERIA_RD17[w.id] ?? 'RD-17'} ${w.id} (${w.rodzaj}) chwile [s]: ${w.wejscie['chwile dodań [s]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const ms = chwileMs(w.wejscie['chwile dodań [s]']);
      // NZ-05-01 (08): W8–W12 podają źródło każdego dodania; bez pola — aplikacja (W1–W7). Czas dostarczenia nie wchodzi (P-091 4b).
      const zr = w.wejscie['źródła [-]'];
      const wejscie: Dodanie[] = ms.map((czasMs, i) => ({ id: `d${i}`, czasMs, zrodlo: Array.isArray(zr) ? zrodloZBrd(zr[i]) : 'aplikacja' }));
      const wynik = serieDoSprawdzenia(wejscie, KONF);
      const o = w.oczekiwane['pytanie [-]'];
      if (o === BLAD_DANYCH) {
        // RD-17-W7: dodanie bez czasu zdarzenia.
        expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      } else if (o === true) {
        // Wektory „tak”: wszystkie dodania źródła pytania tworzą jedną serię; kolejność po czasie zdarzenia, przy równym czasie po id (W6, W12).
        const zp = w.oczekiwane['źródło pytania [-]'] === undefined ? 'aplikacja' : zrodloZBrd(w.oczekiwane['źródło pytania [-]']);
        const seria = wejscie.filter((d) => d.zrodlo === zp).sort((a, b) => a.czasMs - b.czasMs || (a.id < b.id ? -1 : 1));
        expect(wynik).toEqual({ ok: true, wartosc: [{ zrodlo: zp, ids: seria.map((d) => d.id), odMs: seria[0].czasMs, doMs: seria[seria.length - 1].czasMs }] });
      } else {
        expect(wynik).toEqual({ ok: true, wartosc: [] });
      }
    });
  });
  test(`RD-17 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(12); // W1–W12 po fixie 01 (P-091 4b, ER-40)
    licznik.wynik(wektory.length);
  });
});

describe('RD-17 P-091 (4b): osobno dla każdego źródła, po czasie zdarzenia (R-009, ER-40)', () => {
  test('P-091 R-009 BR-LIC-019 20 dodań z ekranu blokady co 60 s scalonych naraz po powrocie → brak serii (nie czas dostarczenia)', () => {
    const wejscie = dodania('ekran_blokady', Array.from({ length: 20 }, (_, i) => 1_800_000_000_000 + i * 60_000));
    expect(serieDoSprawdzenia(wejscie, KONF)).toEqual({ ok: true, wartosc: [] });
  });

  test('P-091 R-009 BR-LIC-019 seria z kieszeni przez ekran blokady (5 dodań w 1,6 s, RD-17-W1) → seria ze źródłem ekran_blokady', () => {
    const ms = [0, 400, 800, 1200, 1600].map((d) => 1_800_000_000_000 + d);
    const wejscie = dodania('ekran_blokady', ms);
    expect(serieDoSprawdzenia(wejscie, KONF)).toEqual({ ok: true, wartosc: [{ zrodlo: 'ekran_blokady', ids: wejscie.map((d) => d.id), odMs: ms[0], doMs: ms[4] }] });
  });

  test('P-091 BR-LIC-019 źródła się nie sumują: aplikacja 0 s i 1 s, ekran blokady 0,5 s → brak serii (każde źródło < 3 dodań)', () => {
    const wejscie = [...dodania('aplikacja', [0, 1000]), ...dodania('ekran_blokady', [500])];
    expect(serieDoSprawdzenia(wejscie, KONF)).toEqual({ ok: true, wartosc: [] });
  });

  test('P-091 ER-40 źródła przeplatane (globalnie niemonotoniczne, rosnące w każdym źródle) → nie błąd danych; seria tylko w aplikacji', () => {
    const app = dodania('aplikacja', [0, 500, 1000]);
    const zeg = dodania('zegarek', [100_000, 101_000]);
    const wejscie = [zeg[0], app[0], zeg[1], app[1], app[2]];
    const wynik = serieDoSprawdzenia(wejscie, KONF);
    expect(wynik.ok).toBe(true);
    if (wynik.ok) expect(posortowane(wynik.wartosc)).toEqual([{ zrodlo: 'aplikacja', ids: app.map((d) => d.id), odMs: 0, doMs: 1000 }]);
  });

  test('P-091 ER-40 dwie serie w dwóch źródłach w tym samym czasie → dwie osobne serie (zbiór), każda ze swoim źródłem', () => {
    const app = dodania('aplikacja', [0, 300, 600]);
    const blok = dodania('ekran_blokady', [100, 700, 1900]);
    const wynik = serieDoSprawdzenia([...blok, ...app], KONF);
    expect(wynik).toEqual({ ok: true, wartosc: expect.any(Array) });
    if (wynik.ok)
      expect(posortowane(wynik.wartosc)).toEqual([
        { zrodlo: 'aplikacja', ids: app.map((d) => d.id), odMs: 0, doMs: 600 },
        { zrodlo: 'ekran_blokady', ids: blok.map((d) => d.id), odMs: 100, doMs: 1900 },
      ]);
  });
});
