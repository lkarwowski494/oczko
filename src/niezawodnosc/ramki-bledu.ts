// Ramki stosu JS w „Zgłoś problem” (M1-058, 12-niezawodnosc-006, DEC-19 a; ADR-0018: mapy źródeł Hermesa każdego buildu w CI, żeby ramki
// dało się odczytać). Tylko wpisy `js_*` i tylko „plik:linia:kolumna” z `blad.szczegoly.ramki` (zapis: src/kompozycja/bledy-js.ts, już
// przycięte) — bez treści komunikatu i nazw funkcji. Szczegóły innych kodów (np. tekst zatrutej linii dziennika) nie wychodzą (NFR-PRY-001).
// Odczyt z `unknown`: uszkodzony JSON, obcy kształt albo ramka spoza formatu = brak tej ramki, nie wyjątek (zgłoszenie ma powstać zawsze).
const RAMKA = /^[\w.@?=&-]{1,200}:\d{1,9}:\d{1,9}$/;

export function ramkiBledu(kod: string, szczegoly: unknown): string[] {
  if (!kod.startsWith('js_') || typeof szczegoly !== 'string') return [];
  let v: unknown;
  try { v = JSON.parse(szczegoly); } catch { return []; }
  const r = typeof v === 'object' && v !== null && 'ramki' in v ? v.ramki : undefined;
  return Array.isArray(r) ? r.filter((x): x is string => typeof x === 'string' && RAMKA.test(x)) : [];
}

/** Linie wpisu `blad` w treści zgłoszenia (technicznej, nie tekst interfejsu): czas UTC i kod, pod nim ramki „  at plik:linia:kolumna”. */
export function linieBledu(b: { czasMs: number; kod: string; szczegoly?: unknown }): string[] {
  return [`${new Date(b.czasMs).toISOString()} ${b.kod}`, ...ramkiBledu(b.kod, b.szczegoly).map((r) => `  at ${r}`)];
}
