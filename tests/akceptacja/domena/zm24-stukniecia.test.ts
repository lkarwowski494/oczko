// PU-Z03 (katalog: „Oczekujące 1.0.2”). ZM-24 (U6, ADR-0036, P-1097): krok „+2” = dwa zdarzenia `plus` grupowane w „stuknięcie”;
// strażnik tempa RD-17 na stuknięciach (SE), „Cofnij” cofa całe stuknięcie (CO), cel części i koniec powtórzenia przy skoku (SK).
// Wyrocznia: wektory ST-01…ST-08, SE-01…SE-04, CO-01…CO-04, SK-01…SK-09 roli 05 (docs/architektura/wektory-1-0-2.json); mapowanie
// wejścia jak w kontroli 05 (docs/architektura/eksperymenty/1-0-2/sprawdz.mjs:53-60). Miejsce (propozycja 07, P-1113): `src/domena/stukniecia.ts`
// z eksportami `stukniecia`, `serieStukniec`, `celCofnieciaStukniecia`, `sygnalySkoku`, `KROK_MAKS`.
import { join } from 'node:path';
import wektory from '../../../docs/architektura/wektory-1-0-2.json';
import { eksportLubZnacznik, modulLubZnacznik, rozpakuj } from '../../narzedzia/akceptacja';

type Zdarzenie = { id: string; rodzaj: string; czasMs: number; rodzice: string[]; zrodlo: string; urzadzenie: string; cofa?: string[] };
type Stukniecie = { ids: string[]; krok: number; czasMs: number; zrodlo: string; rodzaj: string };
type W = {
  stukniecia: { id: string; opis: string; zdarzenia: Zdarzenie[]; oczekiwane: { ids: string[][] } }[];
  serie: { id: string; opis: string; konf: { seria: number; oknoS: number }; stukniecia: { czasMs: number; krok: number }[]; oczekiwane: { stukniecia: number; rzedy: number; ids: number }[] }[];
  cofniecie: { id: string; opis: string; odNajnowszego: { id: string; rodzaj: string; cofa: string[] }[]; stukniecia: string[][]; oczekiwane: { cofa: string[]; przedId: string } | null }[];
  skok: { id: string; opis: string; przed: number; po: number; cel: number | null; dlugosc: number | null; oczekiwane: { celCzesci: boolean; koniecPowtorzenia: boolean } }[];
};
const V = wektory as unknown as W;
const mod = () => modulLubZnacznik(join(__dirname, '../../../src/domena/stukniecia'), 'ZM-24 stukniecia');
const f = <T>(nazwa: string) => eksportLubZnacznik<T>(mod(), nazwa, `ZM-24 ${nazwa}`);
type Mozliwie<T> = T | { ok: true; wartosc: T };

describe('ZM-24 stuknięcia z kroku (ADR-0036 „Stuknięcie”)', () => {
  test.each(V.stukniecia.map((w) => [w.id, w.opis, w] as const))('ZM-24 %s: %s', (_id, _o, w) => {
    const st = rozpakuj(f<(z: Zdarzenie[]) => Mozliwie<Stukniecie[]>>('stukniecia')(w.zdarzenia));
    expect(st.map((s) => s.ids)).toEqual(w.oczekiwane.ids);
  });
  test('ZM-24 KROK_MAKS = 2 — jedna definicja z CHECK (krok IN (1, 2)) migracji 0002 (ADR-0036, ARCH-02)', () => {
    expect(f<number>('KROK_MAKS')).toBe(2);
  });
});

describe('ZM-24 strażnik tempa na stuknięciach (RD-17, ADR-0036 kontrakt TS pkt 4)', () => {
  test.each(V.serie.map((w) => [w.id, w.opis, w] as const))('ZM-24 %s: %s', (_id, _o, w) => {
    let n = 0;
    const st: Stukniecie[] = w.stukniecia.map((s) => ({ ids: Array.from({ length: s.krok }, () => `e${n++}`), krok: s.krok, czasMs: s.czasMs, zrodlo: 'aplikacja', rodzaj: 'plus' }));
    const serie = rozpakuj(f<(s: Stukniecie[], k: { seria: number; oknoS: number }) => Mozliwie<{ stukniecia: number; rzedy: number; ids: string[] }[]>>('serieStukniec')(st, w.konf));
    expect(serie.map((s) => ({ stukniecia: s.stukniecia, rzedy: s.rzedy, ids: s.ids.length }))).toEqual(w.oczekiwane);
  });
});

describe('ZM-24 „Cofnij” cofa całe stuknięcie (ADR-0036 kontrakt TS pkt 3)', () => {
  test.each(V.cofniecie.map((w) => [w.id, w.opis, w] as const))('ZM-24 %s: %s', (_id, _o, w) => {
    const cel = rozpakuj(f<(o: W['cofniecie'][number]['odNajnowszego'], s: { ids: string[] }[]) => Mozliwie<{ cofa: string[]; przedId: string } | null>>('celCofnieciaStukniecia')(w.odNajnowszego, w.stukniecia.map((ids) => ({ ids }))));
    expect(cel).toEqual(w.oczekiwane);
  });
});

describe('ZM-24 sygnały przy skoku: cel części i koniec powtórzenia (F-08, BR-LIC-011, RD-12; ADR-0036 kontrakt TS pkt 5)', () => {
  test.each(V.skok.map((w) => [w.id, w.opis, w] as const))('ZM-24 %s: %s', (_id, _o, w) => {
    const s = rozpakuj(f<(a: number, b: number, k: { cel: number | null; dlugosc: number | null }) => Mozliwie<{ celCzesci: boolean; koniecPowtorzenia: boolean }>>('sygnalySkoku')(w.przed, w.po, { cel: w.cel, dlugosc: w.dlugosc }));
    expect(s).toEqual(w.oczekiwane);
  });
});
