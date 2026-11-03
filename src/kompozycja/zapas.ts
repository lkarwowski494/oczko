// Zapas włóczki i druty na ekranach „Tools” (F-37, BR-ZAP-001/003/004; P-191 P8a; design-spec „Zapas”, makiety fix6 `zapas`, `zapas-filtr`,
// `zapas-pusty`, `wloczka`, `druty-lista`, `drut`): wiersze, chipy kategorii, wyszukiwanie po nazwie i przeliczenia RD-03 pod polem.
// Jednostki: zapis w bazie m i g (ADR-0017). Wpisanej jednostki schemat nie przechowuje — lista pokazuje układ miar urządzenia:
// imperialny „437 yd (399.59 m)”, metryczny „399.59 m” (odstępstwo od makiety nazwane w raporcie partii 5, pytanie do 04/05).
import type { Tlumacz } from '../ekrany/wspolne';
import type { Narzedzie, WierszZapasu } from '../przypadki-uzycia/zapas';
import { rozmiarUS } from '../domena/obliczenia/druty';
import { przelicz } from '../domena/obliczenia/jednostki';
import { formatujLiczbe, parsujLiczbe } from '../i18n/format';
import { MM_NARZEDZIA_MIEJSCA } from '../konfiguracja';

export type FiltrZapasu = 'wszystkie' | 'brak' | number;
export type StanZapasu = {
  chipy: { wartosc: FiltrZapasu; tekst: string }[];
  wiersze: { id: string; nazwa: string; linia: string; motek: string | null; zdjecieSha: string | null }[];
  pusto: null | { rodzaj: 'zapas' | 'filtr' | 'szukaj'; tekst: string };
};
type J = { t: Tlumacz; jezyk(): string };
type Jednostka = 'm' | 'yd' | 'g' | 'oz';
const MIEJSCA = 2; // RD-03-W1: 399,59 m

const f = (x: number, j: J) => formatujLiczbe(Math.round(x * 10 ** MIEJSCA) / 10 ** MIEJSCA, j.jezyk(), { maks: MIEJSCA });

export function stanZapasu(l: WierszZapasu[], o: { zapytanie: string; filtr: FiltrZapasu; imperialny: boolean; j: J }): StanZapasu {
  const { t } = o.j;
  if (l.length === 0) return { chipy: [], wiersze: [], pusto: { rodzaj: 'zapas', tekst: t('zapas.pusto') } };
  const kategorie = [...new Set(l.flatMap((w) => (w.kategoria === null ? [] : [w.kategoria])))].sort((a, b) => a - b);
  const chipy: StanZapasu['chipy'] = [
    { wartosc: 'wszystkie', tekst: t('zapas.wszystkie') },
    ...kategorie.map((n) => ({ wartosc: n, tekst: t('zapas.kategoria', { n }) })),
    ...(l.some((w) => w.kategoria === null) ? [{ wartosc: 'brak' as const, tekst: t('zapas.kategoria_brak') }] : []),
  ];
  const q = o.zapytanie.trim().toLocaleLowerCase(o.j.jezyk());
  const wiersze = l
    .filter((w) => o.filtr === 'wszystkie' || (o.filtr === 'brak' ? w.kategoria === null : w.kategoria === o.filtr))
    .filter((w) => q === '' || w.nazwa.toLocaleLowerCase(o.j.jezyk()).includes(q))
    .map((w) => ({
      id: w.id,
      nazwa: w.nazwa,
      linia: `${w.kategoria === null ? t('zapas.kategoria_brak') : t('zapas.kategoria', { n: w.kategoria })} · ${t('zapas.motki', { count: w.motki }).replace(String(w.motki), f(w.motki, o.j))}`,
      motek: w.dlugoscMotkaM !== null && w.wagaMotkaG !== null
        ? t('zapas.motek', { dlugosc: wartoscMotka(w.dlugoscMotkaM, 'm', o.imperialny, o.j), waga: wartoscMotka(w.wagaMotkaG, 'g', o.imperialny, o.j) })
        : w.dlugoscMotkaM !== null ? t('zapas.motek_dlugosc', { dlugosc: wartoscMotka(w.dlugoscMotkaM, 'm', o.imperialny, o.j) }) // P-277 (A), teksty robocze
        : w.wagaMotkaG !== null ? t('zapas.motek_waga', { waga: wartoscMotka(w.wagaMotkaG, 'g', o.imperialny, o.j) })
        : null,
      zdjecieSha: w.zdjecieSha,
    }));
  const pusto: StanZapasu['pusto'] = wiersze.length > 0 ? null
    : q !== '' ? { rodzaj: 'szukaj', tekst: t('zapas.brak_wynikow', { zapytanie: o.zapytanie.trim() }) }
    : { rodzaj: 'filtr', tekst: o.filtr === 'brak' ? t('zapas.kategoria_brak') : t('zapas.filtr_pusto', { n: typeof o.filtr === 'number' ? o.filtr : '' }) };
  return { chipy, wiersze, pusto };
}

/** Liczba z symbolem jednostki ze słownika (`jednostka.*`, M1-audytor-generalny-052): symbol i odstęp według języka, nie doklejane w kodzie. */
const zJednostka = (x: number, jednostka: Jednostka, j: J): string => j.t(`jednostka.${jednostka}`, { wartosc: f(x, j) });

function wartoscMotka(bazowa: number, jednostka: 'm' | 'g', imperialny: boolean, j: J): string {
  const metr = zJednostka(bazowa, jednostka, j);
  if (!imperialny) return metr;
  const imp = jednostka === 'm' ? zJednostka(przelicz(bazowa, 'm→yd'), 'yd', j) : zJednostka(przelicz(bazowa, 'g→oz'), 'oz', j);
  return j.t('zapas.dlugosc_obie', { wpisane: imp, przeliczone: metr });
}

/** Wartość pola w jednostce bazowej (m, g); pusty wpis → null, zły albo ≤ 0 → 'zly'. */
export function bazowa(tekst: string, jednostka: Jednostka, jezyk: string): number | null | 'zly' {
  if (tekst.trim() === '') return null;
  const n = parsujLiczbe(tekst, jezyk);
  if (n === null || n <= 0) return 'zly';
  return jednostka === 'yd' ? przelicz(n, 'yd→m') : jednostka === 'oz' ? przelicz(n, 'oz→g') : n;
}
/** Linia pod polem długości albo wagi (RD-03): „= {przeliczone}” w drugiej jednostce; zły albo pusty wpis → null. */
export function przeliczenie(tekst: string, jednostka: Jednostka, j: J): string | null {
  const b = bazowa(tekst, jednostka, j.jezyk());
  if (b === null || b === 'zly') return null;
  const wynik = jednostka === 'yd' ? zJednostka(b, 'm', j) : jednostka === 'oz' ? zJednostka(b, 'g', j)
    : jednostka === 'm' ? zJednostka(przelicz(b, 'm→yd'), 'yd', j) : zJednostka(przelicz(b, 'g→oz'), 'oz', j);
  return j.t('zapas.przeliczone', { wartosc: wynik });
}

const GRUPY: { rodzaj: Narzedzie['rodzaj']; klucz: 'druty.igly' | 'druty.szydelka' | 'druty.inne' }[] = [
  { rodzaj: 'druty', klucz: 'druty.igly' }, { rodzaj: 'szydelko', klucz: 'druty.szydelka' }, { rodzaj: 'inne', klucz: 'druty.inne' },
];
function rozmiar(mm: number | null, rodzaj: Narzedzie['rodzaj'], j: J): { tekst: string; us: boolean } {
  if (mm === null) return { tekst: '', us: false };
  const us = rodzaj === 'inne' ? null : rozmiarUS(mm, rodzaj);
  const m = formatujLiczbe(mm, j.jezyk(), { maks: MM_NARZEDZIA_MIEJSCA });
  return us === null ? { tekst: j.t('projekt.rozmiar_mm', { mm: m }), us: false } : { tekst: j.t('projekt.rozmiar_us', { mm: m, us }), us: true };
}
export type StanDrutow = { grupy: { naglowek: string; wiersze: { id: string; rozmiar: string; opis: string }[] }[] };
export function stanDrutow(l: Narzedzie[], j: J): StanDrutow {
  return {
    grupy: GRUPY.map((g) => ({
      naglowek: j.t(g.klucz),
      wiersze: l.filter((n) => n.rodzaj === g.rodzaj).map((n) => ({ id: n.id, rozmiar: rozmiar(n.rozmiarMm, n.rodzaj, j).tekst, opis: n.opis })),
    })).filter((g) => g.wiersze.length > 0),
  };
}
/** Podgląd rozmiaru w arkuszu drutu (RD-11, RD-19): „Shows as: 4 mm (US 6)”; bez numeru US — z uwagą `druty.bez_us`; zły wpis → null. */
export function podgladRozmiaru(tekst: string, rodzaj: Narzedzie['rodzaj'], j: J): string | null {
  const mm = parsujLiczbe(tekst, j.jezyk());
  if (mm === null || mm <= 0) return null;
  const r = rozmiar(mm, rodzaj, j);
  const podglad = j.t('formularz.narzedzie_podglad', { rozmiar: r.tekst });
  return r.us || rodzaj === 'inne' ? podglad : `${podglad}. ${j.t('druty.bez_us')}`; // dwa zdania jak w makiecie `drut`
}
