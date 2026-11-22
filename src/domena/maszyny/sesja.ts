// Maszyna sesji stopera (moduly.md, „Sesja stopera (F-21, F-51)”; P-072). Formuła czasu z 0.1.0 (koniec − start − przerwy, docs/porownanie-kodu.md F-21).
import type { Wynik } from '../bledy';
import type { StanSesji } from '../stany';

export type Sesja = { stan: StanSesji; startMs: number; wstrzymanoMs: number | null; przerwyMs: number; koniecMs: number | null; skorygowano: boolean; doSprawdzenia: boolean };
export type ZdarzenieSesji = { rodzaj: 'wstrzymaj' | 'wznow' | 'zakoncz' } | { rodzaj: 'koryguj'; startMs: number; koniecMs: number } | { rodzaj: 'start_aplikacji' };
const NIEDOZWOLONE = { ok: false, powod: 'niedozwolone_przejscie' } as const;

export function rozpocznijSesje(terazMs: number): Sesja {
  return { stan: 'trwa', startMs: terazMs, wstrzymanoMs: null, przerwyMs: 0, koniecMs: null, skorygowano: false, doSprawdzenia: false };
}
export function przejdzSesje(s: Sesja, z: ZdarzenieSesji, terazMs: number, maksH: number): Wynik<Sesja> {
  switch (z.rodzaj) {
    case 'wstrzymaj':
      return s.stan === 'trwa' ? { ok: true, wartosc: { ...s, stan: 'wstrzymana', wstrzymanoMs: terazMs } } : NIEDOZWOLONE;
    case 'wznow':
      if (s.stan !== 'wstrzymana' || s.wstrzymanoMs === null) return NIEDOZWOLONE;
      return { ok: true, wartosc: { ...s, stan: 'trwa', przerwyMs: s.przerwyMs + (terazMs - s.wstrzymanoMs), wstrzymanoMs: null } };
    case 'zakoncz': {
      if (s.stan === 'zakonczona') return NIEDOZWOLONE;
      // Koniec w pauzie: przerwa do końca liczy się jako przerwa (czas pauzy to nie dzierganie) — [DO USTALENIA] 05, wybór 08.
      const przerwyMs = s.stan === 'wstrzymana' && s.wstrzymanoMs !== null ? s.przerwyMs + (terazMs - s.wstrzymanoMs) : s.przerwyMs;
      return { ok: true, wartosc: { ...s, stan: 'zakonczona', koniecMs: terazMs, przerwyMs, wstrzymanoMs: null } };
    }
    case 'koryguj':
      if (s.stan !== 'zakonczona') return NIEDOZWOLONE;
      if (!Number.isFinite(z.startMs) || !Number.isFinite(z.koniecMs) || z.koniecMs < z.startMs) return { ok: false, powod: 'bledne_dane' }; // BR-PRJ-013/S3
      return { ok: true, wartosc: { ...s, startMs: z.startMs, koniecMs: z.koniecMs, przerwyMs: 0, skorygowano: true } }; // P-195 Q2a, P-199 Q4a: czas = koniec − start
    case 'start_aplikacji': {
      const maksMs = maksH * 3_600_000;
      // Zapomniany stoper (P-072 (7a)): sesja trwająca co najmniej SESJA_MAKS_H kończy się na start + SESJA_MAKS_H, do sprawdzenia.
      if (s.stan === 'trwa' && terazMs - s.startMs >= maksMs) return { ok: true, wartosc: { ...s, stan: 'zakonczona', koniecMs: s.startMs + maksMs, doSprawdzenia: true } };
      return { ok: true, wartosc: s };
    }
  }
}
/** Czas sesji = koniec − start − przerwy; sesja otwarta → 0 (czas trwającej liczy ekran z `teraz`, poza tą funkcją). */
export function czasSesjiMs(s: Sesja): number {
  if (s.koniecMs === null) return 0;
  return Math.max(0, s.koniecMs - s.startMs - s.przerwyMs);
}
