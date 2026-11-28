// PU-Z09, PU-Z11 (katalog: „Oczekujące 1.0.2”). ZM-27 (KO-234, ADR-0037, P-1099): decyzja o Live Activity po zdarzeniu w aplikacji
// (start tylko przy liczeniu, odświeżenie nigdy nie startuje, koniec po LIVE_KONIEC_PO_MS bez liczenia, menu → zakończ) i `staleDate`.
// Wyrocznia: wektory AK-01…AK-11 i SD-01…SD-04 roli 05 (docs/architektura/wektory-1-0-2.json). Miejsce (propozycja 07, P-1113):
// `src/domena/aktywnosc.ts` z eksportami `decyzjaAktywnosci`, `dataNieaktualnosci`; parametr `LIVE_KONIEC_PO_MS` w src/konfiguracja.ts.
import { join } from 'node:path';
import wektory from '../../docs/architektura/wektory-1-0-2.json';
import * as konfiguracja from '../../src/konfiguracja';
import { eksportLubZnacznik, modulLubZnacznik, rozpakuj } from '../narzedzia/akceptacja';

type WejscieAK = { zdarzenie: 'liczenie' | 'odswiezenie' | 'menu_zakoncz' | 'reset'; aktywna: boolean; systemWlaczone: boolean; ostatniaZmianaMs: number | null; teraz: number; koniecPoMs: number };
type WejscieSD = { ostatniaZmianaMs: number | null; przypominaczMs: number | null; koniecPoMs: number };
const V = wektory as unknown as { aktywnosc: { id: string; opis: string; wejscie: WejscieAK; oczekiwane: string }[]; data_nieaktualnosci: { id: string; opis: string; wejscie: WejscieSD; oczekiwane: number | null }[] };
const mod = () => modulLubZnacznik(join(__dirname, '../../src/domena/aktywnosc'), 'ZM-27 aktywnosc');

describe('ZM-27 decyzja o Live Activity (ADR-0037 reguły 1–5)', () => {
  test.each(V.aktywnosc.map((w) => [w.id, w.opis, w] as const))('ZM-27 %s: %s', (_id, _o, w) => {
    const f = eksportLubZnacznik<(x: WejscieAK) => string | { ok: true; wartosc: string }>(mod(), 'decyzjaAktywnosci', 'ZM-27 decyzjaAktywnosci');
    expect(rozpakuj(f(w.wejscie))).toBe(w.oczekiwane);
  });
});

describe('ZM-27 staleDate = ostatnia zmiana + min(próg podpowiedzi, koniec) (ADR-0037 reguła 4, P-1110)', () => {
  test.each(V.data_nieaktualnosci.map((w) => [w.id, w.opis, w] as const))('ZM-27 %s: %s', (_id, _o, w) => {
    const f = eksportLubZnacznik<(x: WejscieSD) => number | null | { ok: true; wartosc: number | null }>(mod(), 'dataNieaktualnosci', 'ZM-27 dataNieaktualnosci');
    expect(rozpakuj(f(w.wejscie))).toBe(w.oczekiwane);
  });
  test('ZM-27 parametr LIVE_KONIEC_PO_MS = 7 200 000 (2 h; P-1099, ADR-0037 „Parametr produktowy”, [OCENA]) w src/konfiguracja.ts', () => {
    const v = (konfiguracja as Record<string, unknown>).LIVE_KONIEC_PO_MS;
    if (v === undefined) throw new Error('NIEZAIMPLEMENTOWANE: ZM-27 LIVE_KONIEC_PO_MS w src/konfiguracja.ts');
    expect(v).toBe(7_200_000);
  });
});
