// Odwzorowanie wiersz ↔ RekordIcloud (moduly.md „Kontrakt partii 7”; czyste funkcje, bez bazy). Rekord z sieci nie jest zaufany:
// encja tylko z kontraktu, nazwy pól tylko jako identyfikatory SQL, wartości tylko tekst, liczba albo null, klucz zgodny z polami.
import type { Wynik } from '../bledy';
import type { RekordIcloud } from '../porty';
import { tabelaIcloud, type TabelaIcloud } from './kontrakt';

export type WartoscPola = string | number | null;
export type Wiersz = Record<string, WartoscPola>;
const NAZWA_KOLUMNY = /^[a-z][a-z0-9_]*$/;

/** Klucz jak w wyzwalaczach `zmiana_icloud`: pojedynczy = wartość tekstem, złożony = json_array(kolumny) (np. ["w1",0]). */
export function kluczWiersza(t: TabelaIcloud, w: Readonly<Wiersz>): string {
  if (t.klucz.length === 1) return String(w[t.klucz[0]]);
  return JSON.stringify(t.klucz.map((k) => w[k] ?? null));
}
/** Wartości kolumn klucza w kolejności kontraktu (do WHERE / DELETE). */
export function wartosciKlucza(t: TabelaIcloud, klucz: string): Wynik<(string | number)[]> {
  if (t.klucz.length === 1) return { ok: true, wartosc: [klucz] };
  let v: unknown;
  try { v = JSON.parse(klucz); } catch { return { ok: false, powod: 'bledne_dane' }; }
  if (!Array.isArray(v) || v.length !== t.klucz.length) return { ok: false, powod: 'bledne_dane' };
  const wartosci = v.filter((x: unknown): x is string | number => typeof x === 'string' || (typeof x === 'number' && Number.isFinite(x)));
  return wartosci.length === t.klucz.length ? { ok: true, wartosc: wartosci } : { ok: false, powod: 'bledne_dane' };
}

/** recordName CloudKit = "<encja>:<klucz>"; encja nie ma dwukropka, więc rozbiór po pierwszym. */
export const nazwaRekordu = (encja: string, klucz: string): string => `${encja}:${klucz}`;
export function rozbierzNazwe(nazwa: string): { encja: string; klucz: string } | null {
  const i = nazwa.indexOf(':');
  return i > 0 ? { encja: nazwa.slice(0, i), klucz: nazwa.slice(i + 1) } : null;
}

/** Wiersz bazy → rekord do wysłania; kolumny `pomin` nie jadą (licznik: wartość i głowa liczone u odbiorcy przez `scal`). */
export function rekordZWiersza(t: TabelaIcloud, w: Readonly<Wiersz>, sciezkaPliku: string | null): RekordIcloud {
  const pola: Wiersz = {};
  for (const [k, v] of Object.entries(w)) if (!t.pomin.includes(k)) pola[k] = v;
  return { encja: t.tabela, klucz: kluczWiersza(t, w), pola, plik: t.zasob ? sciezkaPliku : null };
}

/** Rekord z iCloud → tabela i wiersz do zapisu; kolumny `pomin` pominięte; każde inne odstępstwo od kontraktu = `bledne_dane` (wpis w `blad`, rekord pominięty). */
export function wierszZRekordu(r: RekordIcloud): Wynik<{ tabela: TabelaIcloud; wiersz: Wiersz }> {
  const t = tabelaIcloud(r.encja);
  if (!t || typeof r.pola !== 'object' || r.pola === null) return { ok: false, powod: 'bledne_dane' };
  const wiersz: Wiersz = {};
  for (const [k, v] of Object.entries(r.pola)) {
    if (!NAZWA_KOLUMNY.test(k)) return { ok: false, powod: 'bledne_dane' };
    if (t.pomin.includes(k)) continue; // liczona lokalnie; pominięta jak kolumna nieznana (P-274 Q3a: nowsza wersja może ją synchronizować)
    if (!(v === null || typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)))) return { ok: false, powod: 'bledne_dane' };
    wiersz[k] = v;
  }
  if (t.klucz.some((k) => wiersz[k] === undefined || wiersz[k] === null) || kluczWiersza(t, wiersz) !== r.klucz) return { ok: false, powod: 'bledne_dane' };
  if (t.tylkoKlucze && !t.tylkoKlucze.includes(String(wiersz[t.klucz[0]]))) return { ok: false, powod: 'bledne_dane' };
  return { ok: true, wartosc: { tabela: t, wiersz } };
}

// Granica: JSON z modułu Swift i z poczekalni (moduly.md „Kontrakt partii 7”) — z `unknown`, bez rzutowań; zły element odrzucony, nie zgadywany.
const obiekt = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const wartoscPola = (v: unknown): v is WartoscPola => v === null || typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v));

export function rekordZJson(v: unknown): RekordIcloud | null {
  if (!obiekt(v) || typeof v.encja !== 'string' || typeof v.klucz !== 'string' || !obiekt(v.pola)) return null;
  if (!(v.plik === null || v.plik === undefined || typeof v.plik === 'string')) return null;
  const pola: Wiersz = {};
  for (const [k, x] of Object.entries(v.pola)) { if (!wartoscPola(x)) return null; pola[k] = x; }
  return { encja: v.encja, klucz: v.klucz, pola, plik: typeof v.plik === 'string' ? v.plik : null };
}
export function rekordyZJson(v: unknown): { rekordy: RekordIcloud[]; odrzucone: number } {
  if (!Array.isArray(v)) return { rekordy: [], odrzucone: 1 };
  const rekordy: RekordIcloud[] = [];
  for (const x of v) { const r = rekordZJson(x); if (r) rekordy.push(r); }
  return { rekordy, odrzucone: v.length - rekordy.length };
}
export function kluczeZJson(v: unknown): { encja: string; klucz: string }[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x: unknown) => (obiekt(x) && typeof x.encja === 'string' && typeof x.klucz === 'string' ? [{ encja: x.encja, klucz: x.klucz }] : []));
}
export function potwierdzeniaZJson(v: unknown): { encja: string; klucz: string; nr: number }[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x: unknown) => (obiekt(x) && typeof x.encja === 'string' && typeof x.klucz === 'string' && typeof x.nr === 'number' && Number.isInteger(x.nr) ? [{ encja: x.encja, klucz: x.klucz, nr: x.nr }] : []));
}
