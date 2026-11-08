// P-578 (wyjątek nazwany M3, redesign „Dzianina”): klucze partii M3 tylko en i pl, 33 języki falą 09 po ostatniej partii (P-559). Do fali lista
// docs/lokalizacja/oczekujace.json może zawierać WYŁĄCZNIE klucze o prefiksach z tej stałej; bramka --wydanie dalej pada przy niepustej liście.
// Jedno miejsce dla tests/i18n/pierwsze-w-fali-154.test.ts i tests/i18n/krytyczne.test.ts — każda partia dopisuje tylko swoje prefiksy.
// Usunąć po fali 09 (P-578).
export const PREFIKSY_M3: readonly string[] = [
  'dzis.', 'zakladki.', // p2
  'licznik.akcja_', 'licznik.projekt_wejscie', 'licznik.menu_wiecej_a11y', 'licznik.dzianina_a11y', // p3a
];
/** Klucz należy do partii M3 (dozwolony w liście oczekujących do fali 09, P-578). */
export const kluczM3 = (klucz: string): boolean => PREFIKSY_M3.some((p) => klucz.startsWith(p));
