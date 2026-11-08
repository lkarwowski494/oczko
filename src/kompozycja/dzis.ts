// Kompozycja ekranu „Dziś” (M3 p2, ZM-01, ZM-18): model ekranu z istniejących odczytów — `widokHistorii` (dni z robótką miesiąca, rzędy dnia),
// `widokProjektow` (projekty w toku, wolne dni) i widoku licznika (plany przypomnień → „co dalej”, RD-13). Daty z Intl w języku aplikacji (jak historia.ts);
// tydzień od poniedziałku (RD-20, jak Historia).
import { coDalej } from '../domena/co-dalej';
import type { PlanPrzypomnienia } from '../domena/przypomnienia';
import type { DaneDzis } from '../ekrany/Dzis';
import type { Jezyk, MiejscePracy } from './licznik';

export type WejscieDzis = {
  dzis: string;                        // RRRR-MM-DD (zegar aplikacji)
  /** Odczyty `widokHistorii` dla miesięcy, przez które przechodzi bieżący tydzień (jeden albo dwa); `dzien` = rzędy projektów dnia `dzis`. */
  historia: { dniRobotki: readonly string[]; dzien: readonly { projektId: string; rzedy: number }[] }[];
  projekty: { wToku: number; dni: { zostalo: number; limit: number; dzis: string } | null };
  licznik: { projektId: string; dziergany: number; plany: readonly (PlanPrzypomnienia & { tekst: string })[] } | null;
  miejsce: MiejscePracy;
};

const utc = (dzien: string) => new Date(Date.UTC(Number(dzien.slice(0, 4)), Number(dzien.slice(5, 7)) - 1, Number(dzien.slice(8, 10))));
const fmt = (j: string, o: Intl.DateTimeFormatOptions, dzien: string) => new Intl.DateTimeFormat(j, { ...o, timeZone: 'UTC' }).format(utc(dzien));
const iso = (d: Date) => d.toISOString().slice(0, 10);
/** Poniedziałek tygodnia dnia `dzien` (RD-20) i sześć kolejnych dni. */
export function tydzienDnia(dzien: string): string[] {
  const d = utc(dzien);
  const pon = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86_400_000);
  return Array.from({ length: 7 }, (_, i) => iso(new Date(pon.getTime() + i * 86_400_000)));
}
/** Miesiące (RRRR-MM), przez które przechodzi tydzień dnia — dla odczytów `widokHistorii`. */
export const miesiaceTygodnia = (dzien: string): string[] => [...new Set(tydzienDnia(dzien).map((d) => d.slice(0, 7)))];

export function daneDzis(w: WejscieDzis, j: Jezyk): DaneDzis {
  const jz = j.jezyk();
  const robotka = new Set(w.historia.flatMap((h) => h.dniRobotki));
  const tydzien = tydzienDnia(w.dzis).map((dzien) => {
    const etykieta = fmt(jz, { weekday: 'long', month: 'long', day: 'numeric' }, dzien);
    const dziergany = robotka.has(dzien);
    return { dzien, skrot: fmt(jz, { weekday: 'short' }, dzien), dziergany, dzis: dzien === w.dzis, a11y: dziergany ? j.t('dzis.dzien_dziergany_a11y', { etykieta }) : j.t('dni.dzien_bez_a11y', { etykieta }) };
  });
  const dnia = w.historia.flatMap((h) => h.dzien);
  const cd = w.licznik ? coDalej(w.licznik.dziergany, w.licznik.plany) : null;
  return {
    data: fmt(jz, { weekday: 'long', month: 'long', day: 'numeric' }, w.dzis),
    tydzien,
    pustyTydzien: tydzien.every((d) => !d.dziergany),
    dni: w.projekty.dni && { zostalo: w.projekty.dni.zostalo, limit: w.projekty.dni.limit, miesiac: fmt(jz, { month: 'long' }, `${w.projekty.dni.dzis.slice(0, 7)}-01`) },
    wToku: w.projekty.wToku,
    miejsce: w.miejsce,
    rzedyDzis: w.licznik ? dnia.filter((p) => p.projektId === w.licznik?.projektId).reduce((a, p) => a + p.rzedy, 0) : 0,
    coDalej: cd && { za: cd.za, tekst: cd.tekst, ktory: cd.ktory, razy: cd.razy },
  };
}
