// Porty domeny: kopia sygnatur z docs/architektura/moduly.md („Porty domeny”), tylko typy. Zmiana = zmiana dokumentu roli 05
// (kontrola zgodności: docs/architektura/narzedzia/sprawdz-porty.mjs w `jakosc:kontrole`).
import type { Wynik } from './bledy';
export interface PortBazy {                       // ADR-0002; adaptery: expo-sqlite (kolejka) i node:sqlite (testy)
  run(sql: string, params?: unknown[]): Promise<{ zmiany: number }>;
  all<T>(sql: string, params?: unknown[]): Promise<T[]>;
  transakcja<T>(fn: (tx: PortBazy) => Promise<T>): Promise<T>;   // wchodzi do kolejki; BEGIN IMMEDIATE … COMMIT na połączeniu z foreign_keys = ON
}
export interface Zegar { teraz(): { ms: number; strefa: string; dzien: string } }  // RD-16: dzień = data lokalna w strefie urządzenia
export interface Identyfikatory { nowy(): string }                                // UUID v4
export interface MagazynPlikow {                                                  // ADR-0001
  zapisz(zrodlo: string, rozszerzenie: string): Promise<Wynik<{ sha256: string; bajty: number }>>;
  sciezka(sha256: string): string;
  usun(sha256: string): Promise<void>;
  wolneMiejsce(): Promise<number>;            // required reason E174.1 (rejestr Apple 11d)
}
export interface DziennikPlus {                                                   // ADR-0008 (moduł Swift)
  odczytaj(): Promise<ZdarzenieWejsciowe[]>;  // linie po ostatnim skróceniu; uszkodzona linia → pominięta + błąd w diagnostyce; zdarzenie ze sklejonej linii odzyskane (ADR-0008 (8R))
  skroc(doId: string): Promise<void>;         // do doId włącznie (także w linii sklejonej) + ucięty ogon bez \n za doId (ADR-0008 (8S)); zapis linii: (8A), tylko Swift
}
export interface LiveActivity { start(s: StanEkranuBlokady): Promise<Wynik<void>>; aktualizuj(s: StanEkranuBlokady): Promise<void>; zakoncz(): Promise<void> }
export interface Zegarek { wyslijStan(s: StanZegarka): Promise<void>; potwierdz(ids: readonly string[]): void; odbieraj(fn: (z: ZdarzenieWejsciowe[]) => void): () => void } // ADR-0009 (2026-10-26) pkt 3
export type WynikPartii = { scalono: number; pominieto: number; potwierdzone: string[] }; // scalDziennik: id linii zegarka w `zdarzenie` po COMMIT albo odrzucone na stałe
export interface Synchronizacja { wlacz(): Promise<Wynik<void>>; wylacz(): Promise<void>; stan(): StanSynchronizacji; statusKonta(): Promise<StatusKonta>; uruchom(stanSilnika: Uint8Array | null): Promise<void>; wyslij(zmiany: readonly ZmianaDoWyslania[]): Promise<void>; odbieraj(fn: (p: PartiaIcloud) => Promise<void>): () => void; wyslane(fn: (p: PotwierdzenieIcloud) => Promise<void>): () => void; zdarzeniaKonta(fn: (z: ZdarzenieKonta) => void): () => void; usunStrefe(): Promise<Wynik<void>> } // ADR-0005 (fix-7 2026-10-26, P-221 Q5a): skrzynka zmian w bazie zamiast zglosZmiane
// odbieraj/wyslane: obsługa w JS w jednej transakcji kolejki (partia + stanSilnika albo DELETE ze skrzynki z nr ≤ wysłanego + stanSilnika); Swift czeka na Promise przed potwierdzeniem silnikowi.
export type StatusZakupu = 'sukces' | 'oczekujacy' | 'anulowany' | 'blad'; // P-135 Q3a, ADR-0010: anulowanie i oczekiwanie nie są błędem (MON-04); adapter: statusZBledu
export interface Sklep { produkty(): Promise<Produkt[]>; kup(id: string): Promise<StatusZakupu>; przywroc(): Promise<Wynik<void>>; transakcje(): Promise<Transakcja[]>; obserwuj(fn: () => void): () => void } // ADR-0010
export type WzorzecHaptyki = 'plus' | 'piataKreska' | 'rzadZInstrukcja' | 'minus' | 'blokadaStukniecie' | 'bladZapisu'; // klucze tokenów 04 „haptyka” (P-135 Q4a)
export interface Haptyka { zagraj(w: WzorzecHaptyki): void } // F-48: rozpoznawalne tylko plus i rzadZInstrukcja, reszta systemowa; brak dźwięku (BR-LIC-005)
export interface EkranAktywny { wlacz(tag: string): void; wylacz(tag: string): void } // F-10, każdy tag wyłączany (rejestr Expo 7)
export interface CzasWTle { chron<T>(nazwa: string, fn: (s: SygnalCzasu) => Promise<T>): Promise<T> } // beginBackgroundTask (rejestr Apple 17); wygaśnięcie → sygnał (ADR-0002 (7))
export type SygnalCzasu = { wygaslo(): boolean };  // sprawdzany między instrukcjami długiej transakcji; true → wyjątek → ROLLBACK
// Siec (ADR-0031): podpowiedź o ścieżce sieciowej, nie gwarancja osiągalności serwera
export type StanSieci = 'jest' | 'brak' | 'nieznany';
export interface Siec { stan(): StanSieci; obserwuj(fn: (s: StanSieci) => void): () => void }
export interface SkrzynkaImportu { pobierz(): Promise<ZlecenieImportu[]>; usun(id: string): Promise<void> } // ADR-0011 (fix-7): App Group, rozszerzenie tylko kopiuje
export interface MigawkaProjektow { zapisz(projekty: readonly ProjektMigawki[], jezyk: string): Promise<void> } // P-220 R1a/N2: plik w App Group dla rozszerzenia; zapis atomowy, koperta z wersją i językiem aplikacji (P-248 D2a)
export interface KonwersjaWzoru { naPdf(z: ZrodloWzoru, sygnal?: SygnalCzasu): Promise<Wynik<{ sciezka: string; strony: number }>> } // ADR-0011 (fix-7, P-221 Q2a): WWW, Word, obrazy, skan → PDF; plik tymczasowy
export interface SkanerStron { skanuj(): Promise<Wynik<{ sciezki: string[] }>> } // P-220 W7a: skaner dokumentów systemu (VisionKit); jeden skan = jeden wzór (P-218 (1))
export type Orientacja = 'portrait_up' | 'all'; // P-221 Q3a; P-259 A: deklaracja dla nawigacji (react-native-screens), nie port z efektem — reguła `orientacjaEkranu` w domena/uklad.ts

export type PrzypomnienieStanu = { od: number; co: number; razy: number; tekst: string }; // plan RD-13; tekst ucięty do STAN_PRZYPOMNIENIE_TEKST_MAKS znaków
export type StanEkranuBlokady = { wersja: number; licznikId: string; nazwa: string; wartosc: number; znaczenie: 'skonczone' | 'w_trakcie'; glowa: string | null; ostatniPlusMs: number | null; dzien: string; dzienDozwolony: boolean; sesjaStartMs: number | null; pro: boolean; proWaznoscDo: number | null; dniWMiesiacu: { dzien: string; pro: boolean }[]; przypomnienia: PrzypomnienieStanu[]; zablokowany: boolean }; // wersja 3 (moduly.md „Stan Live Activity i zegarka”; N1 P-135 Q7a: zablokowany = licznik.zablokowany); < 4 KB (rejestr Apple 1b)
export type StanZegarka = StanEkranuBlokady; // ADR-0009: jeden ładunek dla obu celów
export type ZdarzenieWejsciowe = { id: string; licznikId: string; rodzaj: 'plus' | 'minus'; rodzice: string[]; czasMs: number; strefa: string; dzien: string; zrodlo: 'ekran_blokady' | 'zegarek'; urzadzenie: string; pro: boolean }; // pro: uprawnienie urządzenia w chwili stuknięcia (P-111 (2), ADR-0008 (6))

// Typy pomocnicze portów (zaproponowane przez 07 w E3, zatwierdzone w fix 05 2026-10-25, Z07-22).
export type StanSynchronizacji = 'wylaczona' | 'aktywna' | 'blad' | 'brak_konta' | 'konto_zmienione'; // konto_zmienione: ADR-0005, P-110 Q9a
export type Produkt = { id: string; cenaWyswietlana: string; okres: 'miesiac' | 'rok' | 'dozywotni' };
export type Transakcja = { produkt: string; wygasa: number | null; odebrane: boolean; karencjaDo?: number | null }; // = Uprawnienie z docs/monetyzacja/dostep.mjs; karencjaDo: ADR-0010, KP-06
export type PlikWejsciowy = { id: string; nazwa: string; sciezka: string; typ: string };
export type ZlecenieImportu = { id: string; rodzaj: 'plik' | 'adres' | 'film'; nazwa: string; sciezki: string[]; adres: string | null; typ: string; projektId: string | null; utworzonoMs: number }; // ADR-0011 fix-7: manifest zlecenia w skrzynce; `sciezki` = pliki jednego udostępnienia (kilka zdjęć = jeden wzór, P-248 D1a; adres/film: []); `film` = „Video link” z rozszerzenia → film projektu (P-246 S4a, do przeglądu 05)
export type ProjektMigawki = { id: string; nazwa: string; nienazwany: boolean; utworzonoMs: number; ostatniaPracaMs: number | null; wzory: number; film: boolean }; // tylko projekty w toku poza koszem (P-220 N2); ostatniaPracaMs i wzory (poza koszem): P-243 S1a, do przeglądu 05; film = projekt.film_adres IS NOT NULL (P-276)
export type ZrodloWzoru = { rodzaj: 'adres'; adres: string } | { rodzaj: 'word'; sciezka: string } | { rodzaj: 'obrazy'; sciezki: string[] }; // PDF bez konwersji (importujWzor)
export type StatusKonta = 'dostepne' | 'brak_konta' | 'ograniczone' | 'tymczasowo_niedostepne' | 'nieznany'; // CKAccountStatus (P-220 N3); iCloud wyłączony dla aplikacji: [DO USTALENIA] okno maszyn
export type ZdarzenieKonta = 'zalogowano' | 'wylogowano' | 'zmiana_konta'; // CKSyncEngine accountChange (rejestr Apple 21c)
export interface RekordIcloud { encja: string; klucz: string; pola: Record<string, string | number | null>; plik: string | null } // encja/klucz jak w zmiana_icloud; plik = ścieżka zasobu (tabela plik)
export interface ZmianaDoWyslania { encja: string; klucz: string; nr: number; rekord: RekordIcloud | null } // null = usunięcie (zmiana_icloud.usuniete = 1)
export interface PartiaIcloud { rekordy: readonly RekordIcloud[]; usuniete: readonly { encja: string; klucz: string }[]; stanSilnika: Uint8Array | null }
export interface PotwierdzenieIcloud { wyslane: readonly { encja: string; klucz: string; nr: number }[]; stanSilnika: Uint8Array | null }

// Archiwum, migracje i katalogi (ADR-0004, dane.md; przeniesione z src/przypadki-uzycia/porty-propozycja.ts, Z07-22).
export interface Licznosci { [tabela: string]: number }    // tabela → liczba wierszy
export interface Katalogi { kopie: string; kopiePrzed: string; tymczasowy: string } // Application Support/kopie (dane.md), Documents/Backup — kopie przed importem i przed usunięciem (ADR-0028), katalog tymczasowy importu
export interface Manifest { format: 'oczko'; wersja_formatu: number; wersja_schematu: number; aplikacja: string; utworzono: number; licznosci: Licznosci; pliki: { sha256: string; bajty: number }[] } // manifest.json archiwum `.oczko`
export type TrybImportu = 'scal' | 'zastap';
/** Kopia bezpieczeństwa w Documents/Backup: przed „Replace” (import) albo przed „Delete all data” (usunięcie), ADR-0028, P-328. */
export type RodzajKopiiPrzed = 'importem' | 'usunieciem';
export interface ArchiwumSprawdzone { manifest: Manifest; katalog: string } // rozpakowane i sprawdzone w katalogu tymczasowym
export interface WynikImportu { tryb: TrybImportu | 'anulowano'; kopiaPrzed: string | null; licznosci: Licznosci }
export type Migracja = { wersja: number; sql: string; przebudowa?: boolean };
export interface Migruj { (baza: PortBazy): Promise<Wynik<{ z: number; do: number }>> }
export interface PortArchiwum {                                                   // implementacja: src/dane/archiwum.ts
  zapisz(katalogDocelowy: string, opcje?: { przedrostek?: string }): Promise<Wynik<{ sciezka: string; manifest: Manifest }>>; // VACUUM INTO + pliki + manifest; przedrostek nazwy domyślnie 'oczko'
  sprawdz(sciezka: string): Promise<Wynik<ArchiwumSprawdzone>>;                              // manifest, wersje, SHA-256, miejsce; baza bez zmian
  kopiaPrzed(rodzaj?: RodzajKopiiPrzed): Promise<Wynik<{ sciezka: string }>>;                // pełne archiwum `.oczko` w Katalogi.kopiePrzed (ADR-0028); domyślnie przed importem
  wczytaj(a: ArchiwumSprawdzone, tryb: TrybImportu, sygnal?: SygnalCzasu): Promise<Wynik<{ licznosci: Licznosci }>>;
}
