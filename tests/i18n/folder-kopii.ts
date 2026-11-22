// M1-audytor-generalny-055 (09-lokalizacja-010): jedno zdanie kontekstu o folderze kopii w Plikach, wspólne dla trzech kluczy, które go wymieniają.
// Wspólne dla testu kontraktu (folder-kopii-055.test.ts) i wyroczni 04 (klucze-fix15-p3c1.test.ts), które porównują resztę kontekstu bez tego zdania.
export const KLUCZE_FOLDERU = ['dane.zastapiono', 'stan_danych.kopie_opis', 'ustawienia.usun_kopia'] as const;
export const ZDANIE_FOLDERU =
  '„Oczko › Backup” = ścieżka folderu w aplikacji Pliki: „Oczko” to nazwa aplikacji pod ikoną w danym języku (locales/systemowe/<język>.json, CFBundleDisplayName), „Backup” to stała nazwa folderu na dysku (Documents/Backup, src/dane/baza/sciezki.ts) — obie zostają dokładnie tak, bez tłumaczenia, odmiany i cudzysłowów, z „›” między nimi; użytkownik szuka tego folderu w Plikach (M1-audytor-generalny-055).';
