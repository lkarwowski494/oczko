// Kompozycja ekranu „History” (P-191 P6a; design-spec „Stoper, sesje i Historia”): siatka miesiąca od poniedziałku (RD-20) z dniami z robótką,
// skróty dni i daty z Intl w języku aplikacji, linie dnia, tygodnia i miesiąca przez t(); czas jak na karcie (`czasPracy`).
import type { StanHistorii } from '../ekrany/HistoriaDni';
import type { WidokHistorii } from '../przypadki-uzycia/historia';
import { czasPracy } from './ukonczenie';
import { etykietaRobocza, type Jezyk } from './licznik';

const utc = (dzien: string) => new Date(Date.UTC(Number(dzien.slice(0, 4)), Number(dzien.slice(5, 7)) - 1, Number(dzien.slice(8, 10))));
const fmt = (j: string, o: Intl.DateTimeFormatOptions, dzien: string) => new Intl.DateTimeFormat(j, { ...o, timeZone: 'UTC' }).format(utc(dzien));

export function stanHistorii(w: WidokHistorii, o: { j: Jezyk; miesiac: string; wybrany: string; dzis: string; terazMs?: number; strefa?: string }): StanHistorii {
  const { t } = o.j, jz = o.j.jezyk();
  const pierwszy = `${o.miesiac}-01`;
  const dniMiesiaca = new Date(Date.UTC(Number(o.miesiac.slice(0, 4)), Number(o.miesiac.slice(5, 7)), 0)).getUTCDate();
  const puste = (utc(pierwszy).getUTCDay() + 6) % 7; // poniedziałek = 0
  const robotka = new Set(w.dniRobotki);
  const komorki = Array.from({ length: dniMiesiaca }, (_, i) => {
    const dzien = `${o.miesiac}-${String(i + 1).padStart(2, '0')}`;
    const etykieta = fmt(jz, { month: 'short', day: 'numeric' }, dzien);
    const r = robotka.has(dzien);
    // Rzędy znamy tylko dla wybranego dnia (szczegolyDnia); inne dni czytane etykietą (`dni.dzien_bez_a11y`) — zgłoszenie do 04 (klucz bez liczby).
    const rzedy = dzien === o.wybrany ? w.dzien.reduce((a, p) => a + p.rzedy, 0) : null;
    return { dzien, numer: i + 1, robotka: r, dzis: dzien === o.dzis, a11y: r && rzedy !== null ? t('dni.dzien', { etykieta, count: rzedy }) : t('dni.dzien_bez_a11y', { etykieta }) };
  });
  const skroty = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'].map((d) => fmt(jz, { weekday: 'narrow' }, d));
  const czasLinia = (rzedy: number, czasMs: number | null) => (czasMs === null ? t('dni.rzedy', { count: rzedy }) : t('dni.suma_czas', { rzedy: t('dni.rzedy', { count: rzedy }), czas: czasPracy(czasMs, o.j) }));
  const tydzienBiezacy = o.dzis >= w.tydzien.od && o.dzis <= w.tydzien.do;
  return {
    miesiac: fmt(jz, { month: 'long', year: 'numeric' }, pierwszy), skroty, puste, komorki, wybrany: o.wybrany,
    naglowekDnia: fmt(jz, { weekday: 'long', month: 'long', day: 'numeric' }, o.wybrany),
    projekty: w.dzien.map((p) => ({
      id: p.projektId, nazwa: p.nazwa,
      linia: p.rzedy === 0 && p.czasMs !== null ? czasPracy(p.czasMs, o.j) : p.czasMs !== null ? t('dni.rzedy_czas', { rzedy: t('dni.rzedy', { count: p.rzedy }), czas: czasPracy(p.czasMs, o.j) }) : t('dni.rzedy', { count: p.rzedy }),
    })),
    ukonczoneDnia: w.ukonczoneDnia.map((p) => (p.nienazwany && o.terazMs !== undefined && o.strefa !== undefined ? etykietaRobocza(p.utworzonoMs, o.terazMs, o.j, o.strefa) : p.nazwa)),
    tydzien: {
      naglowek: tydzienBiezacy ? t('dni.tydzien_biezacy') : t('dni.tydzien', { data: fmt(jz, { month: 'short', day: 'numeric' }, w.tydzien.od) }),
      linie: [czasLinia(w.tydzien.rzedy, w.tydzien.czasMs), ...(w.tydzien.ukonczone > 0 ? [t('dni.ukonczono', { count: w.tydzien.ukonczone })] : []), t('dni.tydzien_poprzedni', { count: w.tydzien.poprzednie.rzedy })],
      bezStopera: w.tydzien.czasMs === null,
    },
    miesiacBlok: {
      naglowek: fmt(jz, { month: 'long' }, pierwszy),
      linie: [czasLinia(w.miesiac.rzedy, w.miesiac.czasMs), ...(w.miesiac.ukonczone > 0 ? [t('dni.ukonczono', { count: w.miesiac.ukonczone })] : []), t('dni.dni_robotki', { count: w.miesiac.dni })],
      bezStopera: w.miesiac.czasMs === null,
    },
    pierwsze: w.pierwsze,
  };
}
