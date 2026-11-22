// Postęp projektu (RD-14, F-60), cel dzienny do terminu (RD-15, F-61), dzień lokalny (RD-16, F-59), początek tygodnia (RD-20).
// Daty RRRR-MM-DD liczone na kalendarzu (dzień od 1970-01-01 w UTC), nigdy z różnicy chwil (doba 23/25 h, ER-38).
import type { Wynik } from './bledy';

export type CzescPostepu = { rzedy: number; cel: number | null };
export type CelDnia = { rodzaj: 'cel'; rzedy: number } | { rodzaj: 'osiagniety' } | { rodzaj: 'po_terminie'; zostalo: number };

const BLAD = { ok: false, powod: 'bledne_dane' } as const;
const calkowita = (n: number): boolean => Number.isInteger(n) && n >= 0;

/** Σ min(r_i, c_i) i Σ c_i po częściach z celem (RD-14); część bez celu nie wchodzi. */
function sumy(czesci: readonly CzescPostepu[]): { zrobione: number; cel: number } | null {
  let zrobione = 0;
  let cel = 0;
  for (const c of czesci) {
    if (!calkowita(c.rzedy) || (c.cel !== null && !(Number.isInteger(c.cel) && c.cel > 0))) return null;
    if (c.cel === null) continue;
    zrobione += Math.min(c.rzedy, c.cel);
    cel += c.cel;
  }
  return { zrobione, cel };
}

export function postepProcent(czesci: CzescPostepu[]): Wynik<number> {
  const s = sumy(czesci);
  if (!s || s.cel === 0) return BLAD; // RD-14-W6: Σ c_i = 0
  // ⌊100 × Z / C⌋ na liczbach całkowitych (ER-38, R-127: 100 × 0,29 daje 28,999…).
  const licznik = 100 * s.zrobione;
  return { ok: true, wartosc: (licznik - (licznik % s.cel)) / s.cel };
}

/** Numer dnia kalendarzowego (dni od 1970-01-01) dla RRRR-MM-DD; data spoza kalendarza (2026-02-30) → null. */
function numerDnia(data: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!m) return null;
  const [r, mies, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(r, mies - 1, d);
  const t = new Date(ms);
  if (t.getUTCFullYear() !== r || t.getUTCMonth() !== mies - 1 || t.getUTCDate() !== d) return null;
  return Math.round(ms / 86_400_000);
}
function dataZNumeru(n: number): string {
  return new Date(n * 86_400_000).toISOString().slice(0, 10);
}

/** RD-15 (W8–W10, ER-38): d = (termin − dziś) + 1 na datach kalendarzowych RRRR-MM-DD, nie z różnicy chwil. Sygnatura 08 (P-114 Q2a). */
export function dniDoTerminu(dzis: string, termin: string): Wynik<number> {
  const a = numerDnia(dzis);
  const b = numerDnia(termin);
  if (a === null || b === null) return BLAD;
  return { ok: true, wartosc: b - a + 1 };
}

/** RD-15: C = suma celów, przedDzis = Z_przed (rzędy na koniec wczoraj, min z celem), zrobioneTeraz = Z_teraz (teraz), daty lokalne RRRR-MM-DD. */
export function celDzienny(w: { suma: number; przedDzis: number; zrobioneTeraz: number; termin: string; dzis: string }): Wynik<CelDnia> {
  if (!(Number.isInteger(w.suma) && w.suma > 0) || !calkowita(w.przedDzis) || !calkowita(w.zrobioneTeraz)) return BLAD; // RD-15-W7: C > 0 (ostre)
  const d = dniDoTerminu(w.dzis, w.termin);
  if (!d.ok) return d;
  const reszta = w.suma - Math.min(w.przedDzis, w.suma);
  const resztaTeraz = w.suma - Math.min(w.zrobioneTeraz, w.suma);
  // Gałęzie w kolejności RD-15 (P-134 Q1a): (1) brak rzędów do zrobienia przed terminem; (2) po terminie „zostało” na bieżąco; (3) cel stały w dniu (P-047).
  if (d.wartosc >= 1 ? reszta <= 0 : resztaTeraz <= 0) return { ok: true, wartosc: { rodzaj: 'osiagniety' } };
  if (d.wartosc < 1) return { ok: true, wartosc: { rodzaj: 'po_terminie', zostalo: resztaTeraz } };
  return { ok: true, wartosc: { rodzaj: 'cel', rzedy: Math.ceil(reszta / d.wartosc) } };
}

const formaty = new Map<string, Intl.DateTimeFormat>();
/** RD-16: data lokalna RRRR-MM-DD (kalendarz gregoriański, cyfry ASCII) w strefie IANA w chwili ms; język urządzenia nie wpływa (R-134). */
export function dzienLokalny(ms: number, strefa: string): Wynik<string> {
  if (!Number.isFinite(ms)) return BLAD; // RD-16-W6: brak chwili
  let f = formaty.get(strefa);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', { timeZone: strefa, year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return BLAD; // nieznana strefa IANA (RangeError)
    }
    formaty.set(strefa, f);
  }
  const czesci: Record<string, string> = {};
  for (const p of f.formatToParts(new Date(ms))) czesci[p.type] = p.value;
  const { year, month, day } = czesci;
  if (!year || !month || !day) return BLAD;
  return { ok: true, wartosc: `${year.padStart(4, '0')}-${month}-${day}` };
}

const formatyChwili = new Map<string, Intl.DateTimeFormat>();
/** Czas ścienny chwili `ms` w strefie IANA jako „ms UTC” tej samej daty i godziny (różnica z `ms` = przesunięcie strefy); zła strefa → null. */
function scienny(ms: number, strefa: string): number | null {
  let f = formatyChwili.get(strefa);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', { timeZone: strefa, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return null;
    }
    formatyChwili.set(strefa, f);
  }
  const c: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(ms))) if (p.type !== 'literal') c[p.type] = Number(p.value);
  const { year, month, day, hour, minute, second } = c;
  if (year === undefined || month === undefined || day === undefined || hour === undefined || minute === undefined || second === undefined) return null;
  return Date.UTC(year, month - 1, day, hour, minute, second, ((ms % 1000) + 1000) % 1000);
}
/**
 * Chwila dnia `dzien` (RRRR-MM-DD) w strefie o tej samej porze lokalnej (godz., min., s, ms) co chwila `wzorMs` (P-137: zmiana daty ukończenia).
 * Pora w luce zmiany czasu → przesunięta o długość luki (02:30 → 03:30); pora podwójna → wcześniejsza chwila. Sygnatura 08 (P-114 Q2a).
 */
export function chwilaOPorze(w: { dzien: string; wzorMs: number; strefa: string }): Wynik<number> {
  const n = numerDnia(w.dzien);
  const wzor = Number.isFinite(w.wzorMs) ? scienny(w.wzorMs, w.strefa) : null;
  if (n === null || wzor === null) return BLAD;
  return { ok: true, wartosc: chwilaScienna(n * 86_400_000 + (((wzor % 86_400_000) + 86_400_000) % 86_400_000), w.strefa) };
}
/** Czas ścienny jako „ms UTC” → chwila w strefie; luka → pora przesunięta o długość luki, pora podwójna → wcześniejsza chwila. */
function chwilaScienna(lokalnie: number, strefa: string): number {
  const przesuniecie = (ms: number) => (scienny(ms, strefa) ?? ms) - ms;
  const przed = lokalnie - przesuniecie(lokalnie - 43_200_000), po = lokalnie - przesuniecie(lokalnie + 43_200_000);
  const trafione = [przed, po].filter((c) => scienny(c, strefa) === lokalnie);
  // Luka: żadna chwila nie ma tej pory — przesunięcie sprzed zmiany daje porę przesuniętą o długość luki.
  return trafione.length ? Math.min(...trafione) : przed;
}
/** Chwila czasu lokalnego „RRRR-MM-DDTgg:mm[:ss]” bez strefy w strefie IANA (argument startu `oczkoE2eTeraz`, e2e/README.md); reguły luki jak chwilaOPorze. */
export function chwilaLokalna(w: { lokalnie: string; strefa: string }): Wynik<number> {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(w.lokalnie);
  const n = m ? numerDnia(m[1]) : null;
  if (!m || n === null || Number(m[2]) > 23 || Number(m[3]) > 59 || Number(m[4] ?? 0) > 59 || scienny(0, w.strefa) === null) return BLAD;
  return { ok: true, wartosc: chwilaScienna(n * 86_400_000 + ((Number(m[2]) * 60 + Number(m[3])) * 60 + Number(m[4] ?? 0)) * 1000, w.strefa) };
}

/** RD-20 (P-110 Q7, jak Trening `thisMonday`): poniedziałek tygodnia dnia RRRR-MM-DD, dla każdego regionu. Sygnatura 08 (P-114 Q2a). */
export function poczatekTygodnia(dzien: string): Wynik<string> {
  const n = numerDnia(dzien);
  if (n === null) return BLAD; // RD-20-W9: data spoza kalendarza
  const dzienTygodnia = (new Date(n * 86_400_000).getUTCDay() + 6) % 7; // poniedziałek = 0 … niedziela = 6
  return { ok: true, wartosc: dataZNumeru(n - dzienTygodnia) };
}
