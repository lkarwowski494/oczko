// Mechanizm i18n (ADR-0017), wzór z Treningu: własne t() bez biblioteki, słowniki JSON, liczba mnoga z plural.ts.
// Klucze znaczeniowe, źródło en; wybór języka z ustawień aplikacji ('auto' = za systemem).
import { ZRODLO, JEZYKI, jestJezykiem, lancuchZastepczy, wybierzJezyk, type PreferencjaJezyka } from './jezyki';
import { kategoriaLiczby } from './plural';
import type { Klucz } from './typy';

export type Zasoby = Record<string, { translation: Record<string, unknown> }>;
/** Port na tabelę `ustawienie` (klucze `jezyk`, `uklad_miar`); adapter w src/dane/repozytoria (rola 08). */
export interface MagazynPreferencji {
  odczytaj(klucz: string): Promise<string | null>;
  zapisz(klucz: string, wartosc: string): Promise<void>;
}
export const JEZYK_PSEUDO = 'en-XA';
export type Parametry = Record<string, string | number>;

export interface OpcjeI18n {
  magazyn: MagazynPreferencji;
  /** Tagi języków urządzenia w kolejności preferencji (expo-localization `getLocales`). */
  systemowe: () => string[];
  zasoby: Zasoby;
  /** Pseudolokalizacja: tylko build deweloperski (EXPO_PUBLIC_PSEUDO), nigdy w supportedLocales. */
  pseudo?: Zasoby[string];
}

type Plaski = Record<string, string>;
const splaszcz = (o: Record<string, unknown>, p = '', w: Plaski = {}): Plaski => {
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object') splaszcz(v as Record<string, unknown>, `${p}${k}.`, w);
    else if (v !== null && v !== undefined) w[p + k] = String(v);
  }
  return w;
};
const wlasny = (d: Plaski | undefined, k: string): string | undefined =>
  d && Object.prototype.hasOwnProperty.call(d, k) ? d[k] : undefined;
const wstaw = (tekst: string, p?: Parametry) =>
  p ? Object.keys(p).reduce((s, k) => s.split(`{{${k}}}`).join(String(p[k])), tekst) : tekst;

async function bezpiecznyOdczyt(m: MagazynPreferencji, klucz: string): Promise<string | null> {
  try {
    return await m.odczytaj(klucz);
  } catch {
    return null; // uszkodzone ustawienia nie blokują startu aplikacji
  }
}

export async function utworzI18n(opcje: OpcjeI18n) {
  const slowniki: Record<string, Plaski> = {};
  for (const [j, z] of Object.entries(opcje.zasoby)) slowniki[j] = splaszcz(z.translation);
  if (opcje.pseudo) slowniki[JEZYK_PSEUDO] = splaszcz(opcje.pseudo.translation);
  const nasluchujacy = new Set<(j: string) => void>();
  let preferencja: string | null = await bezpiecznyOdczyt(opcje.magazyn, 'jezyk');
  const wybierz = (): string => (opcje.pseudo ? JEZYK_PSEUDO : wybierzJezyk(preferencja, opcje.systemowe()));
  let biezacy = wybierz();

  const lancuch = (j: string): string[] =>
    j === JEZYK_PSEUDO ? [j, ZRODLO] : (JEZYKI as readonly string[]).includes(j) ? lancuchZastepczy(j as never) : [j, ZRODLO];

  /** Klucz → tekst: język, język bazowy, źródło; przy `count` forma wg CLDR języka, w którym znaleziono tekst, potem `_other`. */
  function t(klucz: Klucz | string, p?: Parametry & { count?: number }): string {
    for (const j of lancuch(biezacy)) {
      const s = slowniki[j];
      if (!s) continue;
      const tekst = p && typeof p.count === 'number'
        ? wlasny(s, `${klucz}_${kategoriaLiczby(j === JEZYK_PSEUDO ? ZRODLO : j, p.count)}`) ?? wlasny(s, `${klucz}_other`) ?? wlasny(s, klucz)
        : wlasny(s, klucz);
      if (tekst !== undefined && tekst !== '') return wstaw(tekst, p);
    }
    return klucz;
  }

  const zmien = async () => {
    const j = wybierz();
    if (j !== biezacy) {
      biezacy = j;
      nasluchujacy.forEach((f) => f(j));
    }
  };

  return {
    t,
    jezyk: () => biezacy,
    /** Wybrana pozycja listy języków; uszkodzony albo nieznany zapis = 'auto' (BR-ZAK-004 S5). */
    preferencja: (): PreferencjaJezyka => (preferencja && jestJezykiem(preferencja) ? preferencja : 'auto'),
    /** `'auto'` = za systemem; zapis w ustawieniach przed zmianą (P-075, 3b). */
    async ustawJezyk(p: PreferencjaJezyka) {
      await opcje.magazyn.zapisz('jezyk', p);
      preferencja = p;
      await zmien();
    },
    /** Android: zmiana języka systemu nie restartuje aplikacji; wołane przy powrocie na pierwszy plan. */
    odswiezJezykSystemowy: zmien,
    naZmiane(f: (j: string) => void) {
      nasluchujacy.add(f);
      return () => void nasluchujacy.delete(f);
    },
  };
}
