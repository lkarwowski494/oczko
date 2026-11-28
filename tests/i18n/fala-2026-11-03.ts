// Wspólne dla testów „stanu po fali przekładu 2026-11-03” (P-474, P-481, P-486): 146 baz kluczy przełożonych na 33 języki (bez pl i en; pl przełożony wcześniej, P-469).
// Wcześniej te testy pilnowały stanu „przed falą” (klucz na liście oczekujących, brak przekładu w 33 słownikach); teraz pilnują, że przekład jest KOMPLETNY w każdym
// języku (formy CLDR języka, niepusty tekst), a lista oczekujących jest pusta. Zakres fali = docs/lokalizacja/zakres-fali-2026-11-03.json (kopia listy sprzed fali).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const KAT = join(KORZEN, 'src', 'i18n', 'slowniki');
const FORMA = /_(zero|one|two|few|many|other)$/;

const plaski = (o: Record<string, unknown>, p = '', w: Record<string, string> = {}): Record<string, string> => {
  for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? plaski(v as Record<string, unknown>, `${p}${k}.`, w) : (w[p + k] = String(v));
  return w;
};
const czytajSlownik = (kod: string): Record<string, string> => plaski(JSON.parse(readFileSync(join(KAT, `${kod}.json`), 'utf8')) as Record<string, unknown>);

export const ZAKRES_FALI: string[] = (JSON.parse(readFileSync(join(KORZEN, 'docs', 'lokalizacja', 'zakres-fali-2026-11-03.json'), 'utf8')) as { klucze: string[] }).klucze;
/** 33 języki fali: wszystkie słowniki poza en, pl i kontekstem (en.kontekst.json). */
export const JEZYKI_FALI: string[] = readdirSync(KAT)
  .filter((f) => /^[A-Za-z]{2,3}(-[A-Za-z0-9]+)?\.json$/.test(f) && !f.includes('.kontekst.'))
  .map((f) => f.slice(0, -5))
  .filter((j) => j !== 'en' && j !== 'pl')
  .sort();
export const OCZEKUJACE_FALI: string[] = (JSON.parse(readFileSync(join(KORZEN, 'docs', 'lokalizacja', 'oczekujace.json'), 'utf8')) as { klucze: string[] }).klucze;

const cache = new Map<string, Record<string, string>>();
/** Płaski słownik języka (z cache). */
export const slownikJezyka = (kod: string): Record<string, string> => { if (!cache.has(kod)) cache.set(kod, czytajSlownik(kod)); return cache.get(kod) as Record<string, string>; };

/** Przekład bazy klucza w języku: tekst, albo obiekt kategoria → tekst (formy CLDR języka), albo undefined przy braku/niekompletności. */
export function przeklad(kod: string, baza: string): string | Record<string, string> | undefined {
  const s = slownikJezyka(kod), pusty = (t: string | undefined) => typeof t !== 'string' || !t.trim();
  if (!pusty(s[baza])) return s[baza];
  const kat = new Intl.PluralRules(kod).resolvedOptions().pluralCategories;
  const formy = Object.fromEntries(kat.map((c) => [c, s[`${baza}_${c}`]]));
  return kat.length && kat.every((c) => !pusty(formy[c])) ? (formy as Record<string, string>) : undefined;
}
/** Języki fali bez kompletnego przekładu bazy (pusta lista = przekład jest). */
export const brakiPrzekladu = (baza: string, jezyki: string[] = JEZYKI_FALI): string[] => jezyki.filter((j) => przeklad(j, baza) === undefined);
/** Wszystkie teksty bazy w języku (jeden albo formy). */
export const teksty = (kod: string, baza: string): string[] => { const p = przeklad(kod, baza); return p === undefined ? [] : typeof p === 'string' ? [p] : Object.values(p); };
export const jestFormaKlucza = (k: string): boolean => FORMA.test(k);

/**
 * FB1 08-B i FA2 (P-1126, P-1133 — KO-239, wyjątek nazwany, 2026-11-28): klucze 1.0.2 dodane tylko w en i pl, czekające na falę przekładu 09. Dopóki lista oczekujących
 * ma tylko te klucze, testy „po fali” (pierwsze-w-fali-154, krytyczne) oczekują, że `--wydanie` odrzuca właśnie niepustą listę (bramka TestFlight
 * zostaje); klucz spoza tej listy w `oczekujace.json` jest błędem. Po fali 09 lista jest pusta i testy wracają do stanu „po fali” bez zmian.
 */
export const OCZEKUJACE_DO_FALI_1_0_2: string[] = [
  'aktywnosc.plus2',
  'aktywnosc.stuknij_dwa',
  'aktywnosc.teraz_dwa',
  'dane.konflikt_a11y_zrodlo',
  'dane.konflikt_z_aplikacji',
  'dane.konflikt_z_ekranu_blokady',
  'dane.konflikt_z_zegarka',
  'formularz.krok',
  'formularz.krok_opis',
  'formularz.podpowiedz_minuty',
  'formularz.podpowiedz_opis',
  'formularz.podpowiedz_plus',
  'formularz.podpowiedz_prog',
  'formularz.rodzaj_oczka_opis',
  'licznik.menu_ustawienia',
  'licznik.menu_zdejmij_blokada',
  'licznik.menu_zdejmij_blokada_opis',
  'licznik.menu_zdejmij_blokada_stoper',
  'licznik.plus2_etykieta',
  'licznik.plus2_oczka',
  'licznik.plus2_podpis',
  'licznik.podpowiedz_czas',
  'licznik.podpowiedz_etykieta',
  'licznik.podpowiedz_pytanie',
  'licznik.zdjeto_z_blokady_a11y',
  'oferty.kod_bez_sieci',
  'oferty.zrealizuj_kod',
  'wzor.podpowiedz_tekst',
];
