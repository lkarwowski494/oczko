// Kompozycja karty ukończenia (ekrany.html `ukonczenie`): okres „Oct 1 – Nov 21” i czas „18 h 10 min” w języku aplikacji (ADR-0017).
import type { StanUkonczenia } from '../ekrany/Ukonczenie';
import type { KartaUkonczenia } from '../przypadki-uzycia/widok-ukonczenia';
import { etykietaRobocza, type Jezyk } from './licznik';

export function czasPracy(ms: number, j: Jezyk): string {
  const min = Math.round(ms / 60_000), h = Math.floor(min / 60), m = min % 60;
  return h === 0 ? j.t('ukonczenie.czas_min', { min: m }) : m === 0 ? j.t('ukonczenie.czas_h', { h }) : j.t('ukonczenie.czas_hmin', { h, min: m });
}
export function stanUkonczenia(k: KartaUkonczenia, o: { j: Jezyk; terazMs: number; strefa: string; zdjecie: (sha: string) => string }): StanUkonczenia {
  const data = new Intl.DateTimeFormat(o.j.jezyk(), { month: 'short', day: 'numeric', timeZone: o.strefa });
  return {
    nazwa: k.nienazwany ? etykietaRobocza(k.utworzonoMs, o.terazMs, o.j, o.strefa) : k.nazwa,
    okres: `${data.format(new Date(k.startMs))} – ${data.format(new Date(k.ukonczonoMs ?? o.terazMs))}`,
    dni: k.dni, rzedy: k.rzedy, czas: k.czasMs === null ? null : czasPracy(k.czasMs, o.j), czesci: k.czesci,
    wloczka: k.wloczka, wybierzWloczke: k.wloczka.length === 0 && k.maZapas, zdjecie: k.zdjecieSha ? `file://${o.zdjecie(k.zdjecieSha)}` : null,
  };
}
