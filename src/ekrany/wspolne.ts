// Typy wspólne ekranów (rola 07, E3: zaślepki tylko sygnatury, P-090 Q2a). Propozycja 07; teksty i stany do zatwierdzenia przez 04; granice i porty zatwierdzone przez 05 (fix 2026-10-25, Z07-22).
// Ekrany nie importują src/dane ani src/przypadki-uzycia: dostają stan i wywołania przez propsy (kierunek zależności z docs/architektura/moduly.md:33).
import type { Klucz } from '../i18n/typy';
import type { Parametry } from '../i18n/i18n';

/** Tłumaczenie: `t()` z `utworzI18n` (ADR-0017). Każdy tekst ekranu idzie przez klucz (DEV-12, `npm run i18n:kod`). */
export type Tlumacz = (klucz: Klucz, p?: Parametry & { count?: number }) => string;

/** Kształt jak `Wynik<T>` z src/domena/bledy.ts (kopia, bo ekrany w E3 nie importują domeny poza portami; 08 zamienia na import typu). */
export type PowodEkranu =
  | 'zablokowany' | 'limit' | 'zapis' | 'bledne_dane' | 'niedozwolone_przejscie'
  | 'brak_miejsca' | 'wersja_nowsza' | 'uszkodzony' | 'konflikt';
export type WynikEkranu<T> = { ok: true; wartosc: T } | { ok: false; powod: PowodEkranu };

/** Ogłoszenie VoiceOver (`AccessibilityInfo.announceForAccessibility`), wstrzyknięte, żeby test widział kolejność (R-148). */
export type Oglos = (tekst: string, opcje?: { readonly queue?: boolean }) => void; // queue: kolejka po trwającym ogłoszeniu (I-001); iOS, gdzie indziej zwykłe ogłoszenie

/** Cykl życia aplikacji (`AppState`), wstrzyknięty (R-010, R-020, R-091). */
export type StanCyklu = 'active' | 'background' | 'inactive';
export interface CyklAplikacji { naZmiane(fn: (s: StanCyklu) => void): () => void }

/** Otwieranie adresów (`Linking.openURL`) i system (prośba o ocenę, zarządzanie subskrypcją, arkusz udostępniania). */
export interface System {
  otworzAdres(url: string): void;                       // BR-DAN-012/S3, BR-ZAK-004, KP-04
  prosbaOOcene(): void;                                 // StoreReview.requestReview (BR-DAN-012/S1, S-39)
  zarzadzajSubskrypcja(): void;                         // showManageSubscriptions (KP-14)
  udostepnij(plik: { nazwa: string; tresc: string }): void; // arkusz udostępniania (BR-DAN-010/S2)
}
