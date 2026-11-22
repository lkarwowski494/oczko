// Typy kontraktu karty (docs/atlas/kontrakt-krokow.md, wersja 0.1) i modelu rysunku (ADR-0022, ADR-0023).
import type { Bez, P } from './geometria.ts';

export type Strona = 'prawe' | 'lewe';
export type Operacja =
  | { typ: 'oczko'; strona: Strona; kolumna?: number }
  | { typ: 'scal'; zuzywa: number; strona: Strona; na_wierzchu: 'lewe' | 'prawe' | 'srodkowe'; kolumna?: number }
  | { typ: 'narzut'; kolumna?: number }
  | { typ: 'z_nitki_poziomej'; scianka: 'przednia' | 'tylna'; pochylenie: 'prawo' | 'lewo'; kolumna?: number }
  | { typ: 'scieg'; wzor: Strona[][] }
  | { typ: 'warkocz'; zuzywa: number; przekladane: number; pomocniczy: 'przod' | 'tyl'; kolumna?: number }
  | { typ: 'zamknij'; ile: number }
  | { typ: 'oczko_szydelkowe'; narzuty: number };

export type Faza = 'tkanina' | 'wklucie' | 'narzut' | 'przeciagniecie' | 'zdjecie' | 'wynik' | null;
export type Miejsce = { rzad: number; kolumna: number };

export interface Krok {
  faza: Faza;
  petle: Miejsce[];
  wyroznij: Miejsce[];
  kierunek: 'od_przodu' | 'od_tylu' | null;
  strzalka: null | { ruch: 'drut' | 'nitka'; od: string; do: string };
  /** faza „wklucie”: które narzędzie i w którą stronę rysunku wskazuje jego grot (wartości ze źródła roli 06) */
  drut?: { ktory: 'prawy' | 'lewy' | 'pomocniczy' | 'szydelko'; grot?: 'w_lewo' | 'w_prawo' };
  twierdzenia?: string[];
  nitka?: 'przod' | 'tyl';
  scianka?: 'przednia' | 'tylna';
  petle_na_narzedziu?: number;
  faza_opis?: string;
  klucz: string;
}

export interface Karta {
  format?: number;
  id: string;
  rzemioslo: 'druty' | 'szydelko' | 'oba';
  rodzaj: string;
  pozycje?: string[];
  klucze: { nazwa: string; podpis?: string; opis_alt?: string };
  klucze_dodatkowe?: string[];
  publikacja?: 'mvp' | 'po-generatorze';
  terminy: Record<string, { nazwa?: string | null; skrot: string | null; twierdzenie: string }[]>;
  twierdzenia: { id: string; wartosc: Record<string, string | number>; twierdzenia?: string[] }[];
  jezyki_gotowe: string[];
  rysunek?: {
    rodzina: 'siatka-petli' | 'graf-szydelkowy' | 'nabieranie';
    probka?: { kolumny: number; rzedy: number };
    tlo?: Strona;
    operacja: Operacja | null;
  };
  kroki?: Krok[];
}

export type RodzajCzesci = 'platyna_l' | 'noga_l' | 'glowa' | 'noga_p' | 'platyna_p' | 'drut';

/** Pętla: jedno oczko w jednym rzędzie. `rodzice` = pętle rzędu niżej, przez które ją przeciągnięto. */
export interface Petla {
  id: string;
  rzad: number;
  kolumna: number;
  x: number;
  typ: Strona;
  rodzice: string[];
  /** przesunięcie głowy względem podstawy (dodatnie = w prawo na stronie prawej) */
  nachylenie: number;
}

/** Część pętli rysowana jako jedna kreska; kolejność warstw dotyczy całej części. */
export interface Czesc {
  id: string;
  petla: string;
  rodzaj: RodzajCzesci;
  rzad: number;
  segmenty: Bez[];
}

export interface Skrzyzowanie {
  a: string;
  b: string;
  punkt: P;
  /** id części, która ma być na wierzchu według reguły przeplotu */
  nad: string;
}

export interface Rysunek {
  szer: number;
  wys: number;
  petle: Petla[];
  czesci: Czesc[];
  /** id części w kolejności rysowania warstwy bazowej; przeplot daje łatki na skrzyżowaniach (svg.ts `latki`) */
  kolejnosc: string[];
  /** dla każdego rzędu id części w kolejności biegu nitki */
  rzedy: string[][];
  skrzyzowania: Skrzyzowanie[];
  wyroznione: string[];
  /** strzałka kroku (od, do) w układzie rysunku; null = brak */
  strzalka: { od: P; do: P } | null;
  /** numer kroku rysowany glifem własnym (1–8); null = karta jednokrokowa */
  numer: number | null;
  /** operacja, z której wynika reguła „na wierzchu” przy ujęciu */
  scalenia: { dziecko: string; nad: string; pod: string[] }[];
  /** błędy budowy (np. cykl warstw, skrzyżowanie bez reguły); pusty = rysunek spójny */
  bledy: string[];
}
