// Kalkulator „Swatch” (F-38; BR-KAL-001, BR-KAL-003, BR-KAL-008; design-spec „Kalkulator Swatch”, P-191): stan ekranu liczony na żywo z pól.
// RD-01 (oczka na szerokość), RD-04 (4 in → 10 cm), RD-10 (kategoria grubości, P-084) z domeny; wpis liczby w zapisie regionu (P-097 (5a)).
// Wyniki do 3 miejsc (BR-KAL-003 S1), bez zaokrąglania do całości (BR-KAL-001 S4).
import type { Tlumacz } from '../ekrany/wspolne';
import { klasyfikujGrubosc } from '../domena/obliczenia/grubosc';
import { CAL_W_CM, CZTERY_CALE_W_CM, GRUBOSC } from '../domena/obliczenia/parametry';
import { formatujLiczbe, parsujLiczbe } from '../i18n/format';

// narzedzie: z projektu (/probka?projekt=…); brak = kalkulator samodzielny. Zakresy kategorii grubości (GRUBOSC, CYC „Knit Gauge Range”) dotyczą
// próbki z drutów: CYC podaje dla szydełka inne zakresy (kat. 4 = 11–14 zamiast 16–20 o./4 in), więc w projekcie szydełkowym kategorii nie ma (P-304 (3)).
export type WejscieProbki = { oczka: string; na: '10cm' | '4in'; szerokosc: string; jednostka: 'cm' | 'in'; narzedzie?: 'druty' | 'szydelko' };
export type StanProbki = {
  bladOczka: string | null;
  przeliczona: string | null;          // „= {p} stitches per 10 cm” (próbka na 4 in)
  uwaga4in: string | null;
  bladSzerokosci: string | null;
  wynik: { liczba: string; zDanych: string; uwaga: string } | null;
  grubosc: { linie: string[]; dokladnie: string | null; uwagi: string[] } | null;
};

const NAZWY = ['kategoria.nazwa_0', 'kategoria.nazwa_1', 'kategoria.nazwa_2', 'kategoria.nazwa_3', 'kategoria.nazwa_4', 'kategoria.nazwa_5', 'kategoria.nazwa_6', 'kategoria.nazwa_7'] as const;
const MIEJSCA = 3;
const zaokr = (x: number) => Math.round(x * 10 ** MIEJSCA) / 10 ** MIEJSCA;

type Pole = { rodzaj: 'puste' } | { rodzaj: 'liczba'; wartosc: number } | { rodzaj: 'blad'; tekst: string };
function pole(tekst: string, j: { t: Tlumacz; jezyk(): string }): Pole {
  if (tekst.trim() === '') return { rodzaj: 'puste' };
  const n = parsujLiczbe(tekst, j.jezyk());
  if (n === null) return { rodzaj: 'blad', tekst: j.t('probka.blad_zapis', { przyklad: formatujLiczbe(21.5, j.jezyk()) }) };
  return n > 0 ? { rodzaj: 'liczba', wartosc: n } : { rodzaj: 'blad', tekst: j.t('probka.blad_wartosc') };
}

export function stanProbki(w: WejscieProbki, j: { t: Tlumacz; jezyk(): string }): StanProbki {
  const t = j.t, f = (x: number) => formatujLiczbe(zaokr(x), j.jezyk(), { maks: MIEJSCA });
  const o = pole(w.oczka, j), s = pole(w.szerokosc, j);
  const stan: StanProbki = { bladOczka: null, przeliczona: null, uwaga4in: null, bladSzerokosci: null, wynik: null, grubosc: null };
  if (o.rodzaj === 'blad') stan.bladOczka = o.tekst;
  else if (o.rodzaj === 'puste' && s.rodzaj !== 'puste') stan.bladOczka = t('probka.blad_brak'); // RD-01-W5
  if (s.rodzaj === 'blad') stan.bladSzerokosci = s.tekst;
  if (o.rodzaj !== 'liczba') return stan;

  const p = o.wartosc;
  const naCm = w.na === '10cm' ? p / 10 : p / CZTERY_CALE_W_CM; // oczka na 1 cm
  if (w.na === '4in') { stan.przeliczona = t('probka.przeliczona', { p: f(naCm * 10) }); stan.uwaga4in = t('probka.uwaga_4in'); }

  if (s.rodzaj === 'liczba') {
    const szer = s.wartosc;
    const n = zaokr((w.jednostka === 'cm' ? szer : szer * CAL_W_CM) * naCm); // RD-01: N = W × P / 10 (W w cm)
    const pWJednostce = w.jednostka === 'cm' ? (w.na === '10cm' ? p : naCm * 10) : (w.na === '4in' ? p : naCm * CZTERY_CALE_W_CM);
    stan.wynik = {
      // {{count}} wybiera formę liczby mnogiej; w tekście liczba w zapisie regionu (t wstawia surową wartość count).
      liczba: t('probka.oczka_wynik', { count: n }).replace(String(n), f(n)),
      zDanych: t(w.jednostka === 'cm' ? 'probka.z_danych_cm' : 'probka.z_danych_in', { p: f(pWJednostce), w: f(szer) }),
      uwaga: t('probka.uwaga_oczka'),
    };
  }

  if (w.narzedzie === 'szydelko') return stan; // bez kategorii; wynik szerokości i przeliczenie zostają
  const k = klasyfikujGrubosc({ oczka: p, na: w.na });
  const linia = (n: number): string => {
    const g = GRUBOSC.find((x) => x.kategoria === n);
    const nazwa = t(NAZWY[n] ?? 'kategoria.nazwa_0');
    return g?.min === null || g?.min === undefined
      ? t('probka.kategoria_otwarta', { n, nazwa, max: g?.max ?? '' })
      : t('probka.kategoria', { n, nazwa, min: g.min, max: g.max ?? '' });
  };
  const linie: string[] = [];
  const uwagi: string[] = [];
  if (k.wynik === 'kategorie') {
    if (k.kategorie.length > 1) linie.push(t('probka.kategoria_obie', { a: k.kategorie[0] ?? '', b: k.kategorie[1] ?? '' }));
    linie.push(...k.kategorie.map(linia));
    if (k.kategorie.includes(0)) uwagi.push(t('probka.uwaga_koronka'));
  } else if (k.wynik === 'miedzy') {
    linie.push(t('probka.kategoria_miedzy', { a: k.kategorie[0], b: k.kategorie[1] }));
  } else if (k.wynik === 'powyzej_tabeli') {
    linie.push(t('probka.kategoria_powyzej', { max: Math.max(...GRUBOSC.map((g) => g.max ?? 0)) }));
    uwagi.push(t('probka.uwaga_koronka'));
  }
  const p4 = w.na === '4in' ? p : (p * CZTERY_CALE_W_CM) / 10;
  const calaAlboPolowka = Number.isInteger(p4 * 2);
  if (!calaAlboPolowka) uwagi.unshift(t('probka.uwaga_zaokraglenie'));
  uwagi.push(t('probka.uwaga_kategoria'));
  stan.grubosc = { linie, dokladnie: w.na === '10cm' ? t('probka.na_4in_dokladnie', { p: f(p4) }) : null, uwagi };
  return stan;
}
