// PU-352 (ex PU-352; katalog: docs/jakosc/przypadki-uzycia.md). ZM-20 (U2, ADR-0035, P-1096): rodzic linii ±1 z ekranu blokady albo
// zegarka przy scaleniu dziennika — `przesun` na bieżącą głowę, gdy zmiany po rodzicu są przemienne; inaczej `rozwidlenie` (konflikt PU-099).
// Wyrocznia: wektory PR-01…PR-18 roli 05 (docs/architektura/wektory-1-0-2.json), wartości z reguł ADR, nie z kodu; prototyp
// docs/architektura/eksperymenty/1-0-2/prototyp.mjs. Miejsce w kodzie (propozycja 07, P-1113): `src/domena/przesuniecie.ts`, eksport `przesuniecieRodzica`.
import { join } from 'node:path';
import wektory from '../../docs/architektura/wektory-1-0-2.json';
import * as konfiguracja from '../../src/konfiguracja';
import { eksportLubZnacznik, modulLubZnacznik, rozpakuj } from '../narzedzia/akceptacja';

type Wejscie = { linia: { rodzaj: string; czasMs: number; zrodlo: string; rodzic: string | null }; glowy: string[]; poRodzicu: { rodzaj: string; czasMs: number }[] | null; obcieto: boolean };
type Oczekiwane = { decyzja: 'bez_zmian' | 'przesun' | 'rozwidlenie'; rodzic: string | null };
type Wektor = { id: string; opis: string; wejscie: Wejscie; oczekiwane: Oczekiwane };
const PR = (wektory as unknown as { przesuniecie: Wektor[] }).przesuniecie;
const funkcja = () => eksportLubZnacznik<(w: Wejscie) => Oczekiwane | { ok: true; wartosc: Oczekiwane }>(
  modulLubZnacznik(join(__dirname, '../../src/domena/przesuniecie'), 'ZM-20 przesuniecieRodzica'), 'przesuniecieRodzica', 'ZM-20');

describe('ZM-20 przesunięcie rodzica linii dziennika (ADR-0035 reguły 1–6)', () => {
  test.each(PR.map((w) => [w.id, w.opis, w] as const))('ZM-20 %s: %s', (_id, _opis, w) => {
    expect(rozpakuj(funkcja()(w.wejscie))).toEqual(w.oczekiwane);
  });

  test('ZM-20 parametr DZIENNIK_PRZESUNIECIE_MAKS = 500 zdarzeń (P-1096, ADR-0035 „Parametr”, [OCENA] 05) w src/konfiguracja.ts', () => {
    const v = (konfiguracja as Record<string, unknown>).DZIENNIK_PRZESUNIECIE_MAKS;
    if (v === undefined) throw new Error('NIEZAIMPLEMENTOWANE: ZM-20 DZIENNIK_PRZESUNIECIE_MAKS w src/konfiguracja.ts');
    expect(v).toBe(500);
  });

  test('ZM-20 liczność wektorów PR: 18 (PR-01…PR-18; pusty albo obcięty plik = porażka)', () => {
    expect(PR.map((w) => w.id)).toEqual(Array.from({ length: 18 }, (_, i) => `PR-${String(i + 1).padStart(2, '0')}`));
    funkcja(); // znacznik do czasu implementacji: liczność sama nie zieleni zestawu przed kodem
  });
});
