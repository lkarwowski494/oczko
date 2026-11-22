// Kompozycja listy sesji i grupy „Time” projektu (P-191 P4a–P5a; design-spec „Stoper, sesje i Historia”): daty i godziny z Intl w języku
// aplikacji i strefie urządzenia (RD-16), czas jak na karcie ukończenia (`czasPracy`); suma tylko zakończonych sesji (BR-PRJ-015/S3).
import type { WierszSesji, DrugaLiniaSesji } from '../ekrany/Sesje';
import { formatujGodzine } from '../i18n/format';
import { SESJA_MAKS_H } from '../konfiguracja';
import type { SesjaNaEkranie } from '../przypadki-uzycia/sesja';
import { czasPracy } from './ukonczenie';
import type { Jezyk } from './licznik';

const dzienLokalny = (ms: number, strefa: string): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: strefa, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));

export function stanCzasu(sesje: readonly SesjaNaEkranie[], j: Jezyk): { suma: string | null; sesje: number; doSprawdzenia: number } {
  if (sesje.length === 0) return { suma: null, sesje: 0, doSprawdzenia: 0 };
  const ms = sesje.filter((s) => s.stan === 'zakonczona').reduce((a, s) => a + s.czasMs, 0);
  return { suma: czasPracy(ms, j), sesje: sesje.length, doSprawdzenia: sesje.filter((s) => s.doKorekty).length };
}

export function stanSesji(sesje: readonly SesjaNaEkranie[], o: { j: Jezyk; terazMs: number; strefa: string }): { podsumowanie: { czas: string; liczba: number }; sesje: WierszSesji[] } {
  const { j } = o;
  const rok = new Date(o.terazMs).getUTCFullYear();
  const data = (ms: number) => new Intl.DateTimeFormat(j.jezyk(), { month: 'short', day: 'numeric', ...(new Date(ms).getUTCFullYear() !== rok ? { year: 'numeric' } : {}), timeZone: o.strefa }).format(new Date(ms));
  const godzina = (ms: number) => formatujGodzine(new Date(ms), j.jezyk(), { uses24h: j.zegar24h(), strefa: o.strefa });
  const wiersze = [...sesje].sort((a, b) => b.startMs - a.startMs).map((s): WierszSesji => {
    const czasMs = s.stan === 'zakonczona' ? s.czasMs : (s.stan === 'wstrzymana' && s.wstrzymanoMs !== null ? s.wstrzymanoMs : o.terazMs) - s.startMs - s.przerwyMs;
    const koniec = s.koniecMs;
    const nastepny = koniec !== null && dzienLokalny(koniec, o.strefa) !== dzienLokalny(s.startMs, o.strefa);
    const wiersz = koniec === null ? `${godzina(s.startMs)}–` : j.t(nastepny ? 'sesje.wiersz_nastepny_dzien' : 'sesje.wiersz', { start: godzina(s.startMs), koniec: godzina(koniec) });
    const druga: DrugaLiniaSesji = s.stan === 'trwa' ? { rodzaj: 'trwa' } : s.stan === 'wstrzymana' ? { rodzaj: 'wstrzymana' }
      : s.doKorekty ? { rodzaj: 'do_sprawdzenia', godziny: SESJA_MAKS_H } : s.skorygowano ? { rodzaj: 'skorygowana' }
      : s.przerwyMs > 0 ? { rodzaj: 'pauzy', czas: czasPracy(s.przerwyMs, j) } : { rodzaj: 'brak' };
    const czas = czasPracy(Math.max(0, czasMs), j);
    return {
      id: s.id, dzien: data(s.startMs), wiersz, czas, druga, edytowalna: s.stan === 'zakonczona',
      a11y: koniec === null ? `${data(s.startMs)}, ${godzina(s.startMs)}, ${czas}` : j.t('sesje.wiersz_a11y', { data: data(s.startMs), start: godzina(s.startMs), koniec: godzina(koniec), czas }),
    };
  });
  const c = stanCzasu(sesje, j);
  return { podsumowanie: { czas: c.suma ?? czasPracy(0, j), liczba: sesje.length }, sesje: wiersze };
}
