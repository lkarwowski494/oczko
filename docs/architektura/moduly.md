# Moduły, porty, maszyny stanów i konfiguracja (rola 05, E2, 2026-10-22)
Źródło decyzji: ADR-0002 (kolejka zapisów), ADR-0003 (granice), ADR-0007 (cele natywne), ADR-0008 (dziennik +1), ADR-0013 (maszyny stanów). Sygnatury są kontraktem dla roli 07 (testy) i 08 (kod); nie są kodem.

## Drzewo katalogów
```
src/
  domena/                 czysty TS: bez react, react-native, expo-*, src/dane, src/platforma (granice.mjs)
    limit.ts              startDnia, wolaStraznika, mozeZaczacDzien (z docs/monetyzacja/limit.mjs, wektory L-*, S-*, Z-*)
    dostep.ts             uprawnienia Pro z bieżących transakcji (z docs/monetyzacja/dostep.mjs, wektory W-*)
    scal.ts               scalanie zdarzeń licznika (z eksperymenty/e1/scal.mjs, iteracyjnie; wektory M-01–M-17; wynik zgodny | konflikt | czeka | blad)
    licznik.ts            wartość wyświetlana (skończone / w trakcie, RD-12 powtórzenia, licznik całości BR-LIC-018)
    straznik-tempa.ts     seria dodań RD-17
    przypomnienia.ts      plan rzędów i wyzwolenie RD-13 (F-06)
    postep.ts             procent F-60 (RD-14), termin i cel dzienny F-61 (RD-15), kalendarz F-59 (RD-16)
    obliczenia/           F-38: reguły z rejestru roli 06 (RD-01, RD-03, RD-04, RD-10), rozmiar drutu RD-11
    maszyny/              projekt.ts, sesja.ts, synchronizacja.ts, import.ts (tabele przejść niżej)
    stany.ts              typy z docs/architektura/stany.json (jedna definicja z CHECK bazy)
    porty.ts              interfejsy portów (niżej), tylko typy
    bledy.ts              Wynik<T> = { ok: true, wartosc: T } | { ok: false, powod: Powod }
  przypadki-uzycia/       dodajRzad, cofnijSerie, wpiszWartosc, zakonczProjekt, importuj, eksportuj, … (domena + porty)
  konfiguracja.ts         jedyne miejsce liczb (tabela „Konfiguracja”)
  dane/
    baza/                 jedyne miejsce importu expo-sqlite: polaczenie.ts (pragma, migracje), kolejka.ts (ADR-0002), adapter-node.ts (testy)
    migracje/             0001.sql (= docs/architektura/schemat.sql v1), runner migruj.ts
    repozytoria/          projekty, liczniki, zdarzenia, sesje, wzory, zapas, dni-limitu, ustawienia (przyjmują PortBazy)
    pliki.ts              magazyn plików po SHA-256 (ADR-0001)
    archiwum.ts           eksport/import .oczko (ADR-0004)
  platforma/              adaptery: sklep (expo-iap 5.8.1), haptyka, ekran-aktywny, live-activity, zegarek, icloud, dziennik-plus, udostepnianie, czas-w-tle, zegar
  ekrany/, komponenty/    interfejs (04 projekt, 08 kod); wołają przypadki użycia lub hooki nad nimi
modules/                  Swift (stan 2026-10-26, fix-4 05; P-129 Q2a, Q3a):
  oczko-reguly/           pakiet Swift (nie moduł Expo): OczkoReguly (limit, dostęp, stan, dzień) + OczkoDziennik (rdzeń pliku +1, intencja, skrzynka zegarka); `swift test`; cele i moduły dostają kopie źródeł (scripts/natywne/kopie.json)
  oczko-dziennik-plus/    moduł Expo: jedyny pisarz dziennika +1, Live Activity (ActivityKit) i intencja ±1, SHA-256 plików (CryptoKit), łącze zegarka po stronie telefonu (WCSessionDelegate) — bez osobnego modułu zegarka i Live Activity
  oczko-czas-w-tle/       moduł Expo: beginBackgroundTask z sygnałem wygaśnięcia (CzasWTle)
  oczko-wzor/             moduł Expo (partia 6, fix-7): PDFKit + PencilKit (widok WidokWzoru), WebKit (WWW, Word → PDF), VisionKit (skaner), migawka projektów i skrzynka w App Group
  oczko-icloud/           moduł Expo (partia 7, fix-7): CKSyncEngine, port Synchronizacja v2
targets/                  cele @bacons/apple-targets: widget (Live Activity + LiveActivityIntent), watch, share
```
Kierunek zależności: `ekrany → przypadki-uzycia → domena ← dane, platforma`; `konfiguracja.ts` importują wszyscy, sam nie importuje nic. Swift w `targets/` i `modules/` nie importuje `SQLite3` (ADR-0008). Kontrola: `docs/architektura/narzedzia/granice.mjs` (fix 2026-10-25, Z07-16: importy rozwiązywane kompilatorem TS z `tsconfig.json`; reguły DOMENA, KONFIGURACJA, SQLITE, EKRANY, IOS, SWIFT, ROZMIAR, CYKL, PUSTO; fikstury negatywne `granice-test/obejscia/` w `jakosc:kontrole`). Na `src` jest bramką dopiero po usunięciu kodu 0.1.0 (partia porządkowa 08, P-099 D1a); dziś informacyjnie w `jakosc:info` (14 naruszeń, wszystkie w `core/`, `components/`, `screens/`).

## Porty domeny (sygnatury)
Zatwierdzone w fix 05 2026-10-25 (Z07-22) razem z sygnaturami przypadków użycia, danych i ekranów zaproponowanymi przez 07 w E3 (`src/przypadki-uzycia/**`, `src/dane/**`, `src/ekrany/**`). Ten blok jest równy deklaracjom `src/domena/porty.ts`; kontrola: `node docs/architektura/narzedzia/sprawdz-porty.mjs` (w `jakosc:kontrole`).
```ts
// src/domena/porty.ts — tylko typy
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
// (e) kolejka zegarka (08 partia 4: przeniesione z „Kontrakt partii 4”) — ADR-0009, uzupełnienie 2026-10-26 pkt 3: potwierdzenia jadą w kontekście aplikacji obok stanu
export interface Zegarek { wyslijStan(s: StanZegarka): Promise<void>; potwierdz(ids: readonly string[]): void; odbieraj(fn: (z: ZdarzenieWejsciowe[]) => void): () => void } // ADR-0009 (2026-10-26) pkt 3
// potwierdz: dopisuje id do listy ostatnich ZEGAREK_POTWIERDZENIA_MAKS (bez powtórzeń; ponowne id przechodzi na koniec, najstarsze wypadają; pamięć procesu);
// wyslijStan: moduł natywny dostaje (stanJson, lista) i wysyła updateApplicationContext({ stan, potwierdzone }) — oba klucze zawsze razem.
export type WynikPartii = { scalono: number; pominieto: number; potwierdzone: string[] }; // scalDziennik: id linii zegarka w `zdarzenie` po COMMIT albo odrzucone na stałe
// potwierdzone: id linii zrodlo 'zegarek' z partii, które po COMMIT są w `zdarzenie` (nowe albo powtórzone, M-02) albo odrzucone na stałe (brak licznika, R-021);
// poczekalnia — nie; kolejność pierwszego wystąpienia, bez powtórzeń. Wołający (start, naPierwszyPlan, eksport, odbiór z zegarka) woła
// zegarek.potwierdz(w.potwierdzone) przed odswiezEkranBlokady, więc lista jedzie z ładunkiem, który już uwzględnia te zdarzenia.
export interface Synchronizacja { wlacz(): Promise<Wynik<void>>; wylacz(): Promise<void>; stan(): StanSynchronizacji; statusKonta(): Promise<StatusKonta>; uruchom(stanSilnika: Uint8Array | null): Promise<void>; wyslij(zmiany: readonly ZmianaDoWyslania[]): Promise<void>; odbieraj(fn: (p: PartiaIcloud) => Promise<void>): () => void; wyslane(fn: (p: PotwierdzenieIcloud) => Promise<void>): () => void; zdarzeniaKonta(fn: (z: ZdarzenieKonta) => void): () => void; usunStrefe(): Promise<Wynik<void>> } // ADR-0005 (fix-7 2026-10-26, P-221 Q5a): skrzynka zmian w bazie zamiast zglosZmiane
// odbieraj/wyslane: obsługa w JS w jednej transakcji kolejki (partia + stanSilnika albo DELETE ze skrzynki z nr ≤ wysłanego + stanSilnika); Swift czeka na Promise przed potwierdzeniem silnikowi.
export type StatusZakupu = 'sukces' | 'oczekujacy' | 'anulowany' | 'blad'; // P-135 Q3a, ADR-0010: anulowanie i oczekiwanie nie są błędem (MON-04); adapter: statusZBledu
export interface Sklep { produkty(): Promise<Produkt[]>; kup(id: string): Promise<StatusZakupu>; przywroc(): Promise<Wynik<void>>; transakcje(): Promise<Transakcja[]>; obserwuj(fn: () => void): () => void } // ADR-0010
export type WzorzecHaptyki = 'plus' | 'piataKreska' | 'rzadZInstrukcja' | 'minus' | 'blokadaStukniecie' | 'bladZapisu'; // klucze tokenów 04 „haptyka” (P-135 Q4a)
export interface Haptyka { zagraj(w: WzorzecHaptyki): void } // F-48: rozpoznawalne tylko plus i rzadZInstrukcja, reszta systemowa; brak dźwięku (BR-LIC-005)
export interface EkranAktywny { wlacz(tag: string): void; wylacz(tag: string): void } // F-10, każdy tag wyłączany (rejestr Expo 7)
export interface CzasWTle { chron<T>(nazwa: string, fn: (s: SygnalCzasu) => Promise<T>): Promise<T> } // beginBackgroundTask (rejestr Apple 17); wygaśnięcie → sygnał (ADR-0002 (7))
export type SygnalCzasu = { wygaslo(): boolean };  // sprawdzany między instrukcjami długiej transakcji; true → wyjątek → ROLLBACK
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
```

## Funkcje domeny (sygnatury)
Zatwierdzone w fix-2 05 2026-10-25 (NZ-08-P1-05, P-118 S1): sygnatury dopisane przez 08 w partii 1 (P-114 Q2a). Nazwy i kształt wejścia funkcji limitu i dostępu = prototypy roli 02 (`docs/monetyzacja/limit.mjs`, `dostep.mjs`; wyrocznia: ich wektory); pozostałe = reguły BRD (RD-13, RD-15, RD-20). Kolumna „Błąd” mówi, jak funkcja zgłasza złe wejście.
| Funkcja (plik w `src/domena`) | Sygnatura | Błąd | Wyrocznia |
|---|---|---|---|
| `limit.ts` | `wznowienieLimitu(w: { dzis: string }): string` | `BladDanych` | wektory `wznowienieLimitu` (02), R-105 |
| `limit.ts` | `cofniecieSerii(w: { dni: DzienLimitu[]; dzienSerii: string; seriaZaczelaDzien: boolean; inneDodaniaDnia: number; zrodlo: 'pytanie-serii' \| 'historia' }): { dni: DzienLimitu[]; zwrocono: boolean }` | `BladDanych` | wektory `cofniecieSerii` (02), L-19 |
| `limit.ts` | `scalDni(w: { a: DzienLimitu[]; b: DzienLimitu[] }): DzienLimitu[]` | `BladDanych` | wektory `scalDni` (02), L-20 |
| `limit.ts` | `oknoUczciweZasady(w: { dni: DzienLimitu[]; dzis: string; widziane: boolean; poziom: 'darmowa' \| 'pro' \| 'niepewny'; ekran: string }): boolean` | `BladDanych` | wektory `oknoUczciweZasady` (02), KP-16 |
| `dostep.ts` | `komunikatZakupu(status: string): 'sukces' \| 'czeka' \| 'blad' \| null` | `BladDanych` (nieznany status) | wektory K-* (02) |
| `przypomnienia.ts` | `przypomnienieWpisania(a: number, b: number, plan: PlanPrzypomnienia): Wynik<number \| null>` | `Wynik` (`bledne_dane`) | RD-13-W6–W10 |
| `przypomnienia.ts` | `planPrzypomnien(plan: PlanPrzypomnienia): Wynik<number[]>` | `Wynik` (`bledne_dane`) | RD-13-W1–W5 (F-06) |
| `postep.ts` | `dniDoTerminu(dzis: string, termin: string): Wynik<number>` | `Wynik` (`bledne_dane`) | RD-15-W8–W10 |
| `postep.ts` | `poczatekTygodnia(dzien: string): Wynik<string>` | `Wynik` (`bledne_dane`) | RD-20 |
| `licznik.ts` | `powtorzenieLicznika(skonczone: number, znaczenie: ZnaczenieLicznika, n: number): Wynik<{ powtorzenie: number; rzadW: number }>` = `powtorzenie(r, n)` z r = `skonczone` przy `'skonczone'` i `skonczone + 1` przy `'w_trakcie'` (RD-12 „r to liczba pokazana na liczniku”, BR-LIC-012, ER-40); fix-3 05 2026-10-26, P-121 (1): wybór r przechodzi z testu do domeny, wdraża 08 (ekrany wołają tylko tę funkcję) | `Wynik` (`bledne_dane`, jak `powtorzenie`) | RD-12-W7–W9 (test `tests/domena/licznik/tryb-licznika.test.ts` woła tę funkcję zamiast wybierać r sam; mutant „bez + 1 w trybie w trakcie” → W7, W8 czerwone) |
| `ocena.ts` | `czyProsicOOcene(w: WejscieProsby): boolean` | wartość: złe wejście → `false` (nie prosimy przy wątpliwości) | `docs/architektura/wektory-prosby-o-ocene.json` (PO-01–PO-11, P-150); kontrakt: „Prośba o ocenę” |

**Zasada błędów (P-118 Q1a, polityka: `e3-tlo-bledy-prywatnosc-wydajnosc.md` §2):** wejście, które może być złe w normalnym działaniu → wartość; wejście z kontraktu poprawne → `BladDanych`. Przypisanie funkcji domeny partii 1:
| Funkcja | Skąd wejście | Styl |
|---|---|---|
| `startDnia`, `mozeZaczacDzien`, `wolaStraznika`, `rodzajStraznika`, `wznowienieLimitu`, `cofniecieSerii`, `scalDni`, `oknoUczciweZasady` | wiersze `dzien_limitu` i `zdarzenie` pod CHECK, `Zegar`, rodzaj zdarzenia z listy `stany.json` | `BladDanych` (bez zmian) |
| `komunikatZakupu` | status zmapowany przez adapter sklepu z wyliczenia biblioteki | `BladDanych` (bez zmian) |
| `odczytajPamiec` | plik pamięci uprawnień (może być uszkodzony) | wartość: `null` = brak ważnej pamięci (bez zmian) |
| `scal` | zdarzenia z synchronizacji, importu i dziennika | wariant `blad` (W1: także `zla_wartosc` zamiast wyjątku) |
| `klasyfikujGrubosc` | próbka wpisana przez użytkowniczkę | wariant `blad_danych` (bez zmian) |
| `przelicz`, `rozmiarUS` | liczba wpisana w kalkulatorze F-38 | **`Wynik<number>` / `Wynik<string \| null>` z `bledne_dane`** — zmiana kontraktu: 08 z 07 w partii ekranu narzędzi (dziś `BladDanych`) |
| funkcje z `Wynik` (`przypomnienia.ts`, `postep.ts`, `licznik.ts`, `obliczenia/oczka.ts`, maszyny stanów) | wpis użytkowniczki albo dane z bazy | `Wynik` (bez zmian; dopuszczalne także przy wejściu z bazy) |

**Informowanie o Pro (fix-2, P-118 I1; P-113 Q2a, P-117 Q1a):**
- `pokazOknoUczciweZasady` (`src/domena/informacje-pro.ts`) dubluje `oknoUczciweZasady` z `limit.ts` (dwie implementacje jednej odpowiedzialności, ARCH-02): w 1.0 zostaje jedna funkcja `oknoUczciweZasady` (wyrocznia: wektory `oknoUczciweZasady` roli 02, KP-16); „dzień ukończony” liczy ona sama z listy dni.
- `pokazKartePoImporcie` i ekran `KartaPoImporcie` (`src/ekrany/InformacjePro.tsx`): **poza 1.0** — karta planów Pro tylko po imporcie z innej aplikacji (BR-DAN-007, F-29 PÓŹNIEJ), nie po przywróceniu własnej kopii; w 1.0 nie ma wywołującego, więc funkcja byłaby atrapą (zasada 18). 08 usuwa `informacje-pro.ts` i `KartaPoImporcie` w partii 2, 07 przenosi testy karty na listę „poza 1.0 (F-29)”. Kontrakt na F-29 (po decyzji o imporcie z innych aplikacji): `pokazKartePoImporcie(w: { pro: boolean; importUdany: boolean; zrodlo: 'inna_aplikacja' | 'kopia_oczka' }): boolean` = `!pro && importUdany && zrodlo === 'inna_aplikacja'`.

`BladDanych` (`src/domena/bledy.ts`): klasa wyjątku z polem `kod = 'BLAD_DANYCH'`; wołający rozpoznaje ją po `kod`, nie po dowolnym wyjątku. Wariant `blad` w `WynikScalenia` (P-111 (4)) — sekcja „Scalanie”.

## Scalanie (`scal`, fix 2026-10-25, Z07-13)
Prototyp i wyrocznia: `eksperymenty/e1/scal.mjs`, `scal-wektory.json` (M-01–M-17), `scal-test.mjs` (każda permutacja wejścia, 150 000 zdarzeń), `mutanty-scal.mjs` (w `jakosc:kontrole`).
- Iteracyjnie (kolejność topologiczna), bez rekurencji; budżet: łańcuch 150 000 zdarzeń (szacunek 3 lat, ADR-0005) w jednym wywołaniu.
- Wynik: `zgodny { wartosc, glowy }` | `konflikt { glowy, kandydaci: [{ glowa, wartosc }] }` | `czeka { brakujacy }` | `blad { powod, id }`. Typ TS dostaje wariant `blad` w commicie 08, który wdraża `scal.ts` (razem z dopasowaniem pomocnika testów 07).
- `blad` (dane, których nie da się scalić bez zgadywania; zawsze ten sam wynik dla każdej kolejności wejścia, `id` = najmniejsze winne): `kolizja_id` (to samo `id`, inna treść; identyczny duplikat = idempotencja, M-02), `nieznany_rodzaj` (M-15), `wiele_rodzicow` (zmiana inna niż `rozstrzygniecie` z > 1 rodzicem, M-09; tylko rozstrzygnięcie łączy gałęzie), `cykl` (M-12, M-13), `zla_wartosc` (fix-2, P-118 W1, M-18–M-20 w `eksperymenty/e1/scal-wektory-fix2.json` (08 przenosi je do `scal-wektory.json` razem ze zmianą `scal.ts`): zdarzenie łamiące niezmiennik `schemat.sql` — ustawienie bez nieujemnej liczby całkowitej, ±1 albo zerowanie z wartością; rekord z synchronizacji lub importu, więc wynik zamiast wyjątku, zasada błędów §2 E3). Kolejność kontroli: `kolizja_id` → `nieznany_rodzaj` → `zla_wartosc` → `wiele_rodzicow` → `czeka` → `cykl`. Przypadek użycia: licznik pokazuje ostatnią zapisaną wartość (`licznik.wartosc`), wpis w `blad` (F-57), bez zapisu wyniku.
- `czeka`: przypadek użycia nie woła `scal` z niekompletną historią. Zdarzenia bez rodzica (albo bez encji licznika) trafiają do poczekalni (ADR-0005, uzupełnienie), a `scal` dostaje tylko zdarzenia z kompletnymi przodkami (P-110 Q1a).
- Cofnięcie (P-091 (3a), ER-41): `cofniecie` dotyczy ostatniej zmiany albo serii na końcu historii; pomyłkę ze środka historii poprawia się wpisaniem wartości (M-08b).
- Import „scal” (ER-42): zdarzenia z archiwum to kolejne dostarczenia — ten sam `id` = jedno zdarzenie, rozbieżna gałąź = konflikt jak przy iCloud, drugi import tego samego pliku nic nie zmienia (M-16).

## Stan Live Activity i zegarka, wersja 2 (fix 2026-10-25, Z07-12)
Wersja 1 (`StanEkranuBlokady`, `StanZegarka` w „Porty domeny”) nie wystarcza intencji i zegarkowi bez JS: brak dni limitu i Pro na ekranie blokady (po północy intencja liczy nowy dzień sama, ADR-0008 (6)), brak czasu ostatniego +1 (przerwa nowego dnia, `PRZERWA_NOWEGO_DNIA_MS`), znaczenia licznika (RD-12), przypomnień (RD-13) i wersji ładunku. Wersja 2 (jeden ładunek dla obu celów, jeden dekoder Swift):
**Stan 2026-10-26: przełączone (08 partia 3, krok D1; P-111 (3), P-129 Q7a); wersja 3 (08 partia 4, N1, P-135 Q7a): `StanEkranuBlokady` w „Porty domeny” ma na końcu `zablokowany` (`WERSJA_STANU` = 3), wersja 2 zostaje jako typ plików zgodności `tests/wspolne/*-v2.json`, wersja 1 — `*-v1.json`:**
```ts
export type StanEkranuBlokadyV2 = { wersja: number; licznikId: string; nazwa: string; wartosc: number; znaczenie: 'skonczone' | 'w_trakcie'; glowa: string | null; ostatniPlusMs: number | null; dzien: string; dzienDozwolony: boolean; sesjaStartMs: number | null; pro: boolean; proWaznoscDo: number | null; dniWMiesiacu: { dzien: string; pro: boolean }[]; przypomnienia: PrzypomnienieStanu[] }; // wersja 2 (pliki *-v2.json; dekoder Swift: zablokowany = false)
export type StanZegarkaV2 = StanEkranuBlokadyV2;
export type StanEkranuBlokadyV1 = { licznikId: string; nazwa: string; wartosc: number; glowa: string | null; dzien: string; dzienDozwolony: boolean; sesjaStartMs: number | null }; // wersja 1 (pliki *-v1.json)
export type StanZegarkaV1 = StanEkranuBlokadyV1 & { pro: boolean; proWaznoscDo: number | null; dniWMiesiacu: { dzien: string; pro: boolean }[] };
```
- `zablokowany` (wersja 3, N1 z P-133, P-135 Q7a, ADR-0008 2026-10-26; przeniesione z „Kontrakt partii 4” przez 08): `licznik.zablokowany` (F-03, BR-LIC-004) w chwili odczytu stanu — `stanEkranuBlokady` dostaje je w `WejscieStanuZegarka.licznik`, `licznikEkranuBlokady` czyta kolumnę; przełączenie blokady woła `odswiezEkranBlokady` po COMMIT. Pliki `tests/wspolne/stan-*.json` z generatora w wersji 3, wersja 2 jako `*-v2.json`; `wzorce.json` `wersja_kontraktu: 3`. Swift (`OczkoReguly`): dekoder przyjmuje wersję 2 bez pola jako `zablokowany = false`, wersję 3 tylko z polem (X-ST-01), wersję > 3 odrzuca; `stuknij` (intencja i zegarek): `zablokowany` → `WynikIntencji.zablokowany` przed limitem, bez linii; scalenie na telefonie nie odrzuca linii zapisanych przed blokadą.
- `pro`, `proWaznoscDo`: dostęp z `docs/monetyzacja/dostep.mjs` w chwili wysłania; `proWaznoscDo` = koniec uprawnienia (późniejsza z dat `wygasa` i `karencjaDo`, ADR-0010), `null` = bez końca (dożywotni), nie „wygasło” (R-031). Na zegarku i w intencji ocenia je `proZegarka` (KP-17) w pakiecie Swift reguł (ADR-0007, uzupełnienie).
- `dniWMiesiacu`: wiersze `dzien_limitu` z miesiąca dnia `dzien`, rosnąco (wejście `mozeZaczacDzien` w Swift); `ostatniPlusMs`: czas ostatniego +1 w dowolnym projekcie (zdarzenie `rodzaj = 'plus'`, nie tylko tego licznika; okno od dnia `dzien` − 2, jak wejście `ostatniPlus` limitu — `src/przypadki-uzycia/ekran-blokady.ts:24`, `ostatniPlus` w `src/dane/repozytoria/liczniki.ts`; P-132 (2c), fix-4 05 (g)), `null` bez takiego zdarzenia; intencja i zegarek liczą z niego przerwę nowego dnia (`PRZERWA_NOWEGO_DNIA_MS`) i po swoim +1 ustawiają go na czas stuknięcia (ADR-0008 (1)); −1, wpisanie i zerowanie go nie zmieniają (dziś Swift `StanEkranuBlokady.po` ustawia go także po −1 — `modules/oczko-reguly/Sources/OczkoReguly/Stan.swift:79`; nowe znalezisko fix-4 dla 08, brzegowe, na korzyść użytkowniczki).
- `nazwa` ucięta do `STAN_NAZWA_MAKS_ZNAKOW` znaków, najwyżej `STAN_PRZYPOMNIENIA_MAKS` przypomnień: ładunek < 4 KB (rejestr Apple 1b) także dla nazwy z 3-bajtowych znaków UTF-8.
- Czytelnik pomija nieznane pola (vN czyta vN+1); dekoder Swift odrzuca ładunek z `wersja` większą niż znana i bez wymaganego pola (bez wartości domyślnych, X-ST-01), a Live Activity pokazuje wtedy ostatni poprawny stan.
- **Przełączenie v1 → v2** (jeden commit 07 + 08, kolejność z `tests/wspolne/README.md`): typy v2 zastępują v1 w „Porty domeny” (`porty.ts`), pliki `tests/wspolne/stan-*.json` i `wzorce.json` (`wersja_kontraktu: 2`, pliki v1 jako `*-v1.json` dla zgodności) uzupełnione, listy pól w `tests/jakosc/zlote-pliki.test.ts` i wejście `stanZegarka` w `tests/akceptacja/domena/luki/zegarek.test.ts` dopasowane; złote pliki stanu od tej chwili tworzy generator z kodu TS (`stanZegarka`, jak generator tekstów Swift w ADR-0017), a test pilnuje, że generator i pliki się zgadzają.

## Kontrakt partii 4 (fix-4 2026-10-26, NZ-08-P3-05, P-135)
Zmiany sygnatur portów i typów, które wdraża 08 na początku partii 4 (przed ekranami) **razem z adapterami i wywołaniami**. Do tego czasu `src/domena/porty.ts` i blok „Porty domeny” zostają bez zmian (zmiana typu bez adaptera nie przechodzi `typecheck`), a ten blok jest kontraktem docelowym. **Wyjątek nazwany (P-135):** `sprawdz-porty.mjs` porównuje tylko blok „Porty domeny”; rozjazd z tym blokiem jest zamierzony do commitu 08, który przenosi te deklaracje do „Porty domeny” i `porty.ts` i usuwa je stąd. Kontrola dokumentu: `docs/architektura/narzedzia/kontrola-fix4.mjs`.
```ts


// Pora ukończenia (P-137, 04 fix-2: ekran wybiera tylko datę, od startu projektu do dziś) — src/przypadki-uzycia/projekt.ts
function zmienDateUkonczenia(z: Zaleznosci, w: { projektId: string; ukonczonoDzien: string }): Promise<Wynik<void>>;
// ukonczono_dzien = ukonczonoDzien; ukonczono_ms = chwila dnia ukonczonoDzien w strefie Zegar.teraz().strefa o tej samej porze lokalnej
// (godz., min., s, ms) co dotychczasowe ukonczono_ms w tej strefie — ta sama pora, zmienia się tylko data; pora w luce zmiany czasu → przesunięta
// o długość luki (02:30 → 03:30), pora podwójna → wcześniejsza chwila; wynik późniejszy niż teraz (dziś, pora jeszcze nie nadeszła) → teraz.
// Rachunek w domenie z Intl (jak dzienLokalny), bez pakietu; test oczekujący: tests/akceptacja/dane/ukonczenie-pora.test.ts (wyrocznia: zoneinfo).

// RD-15 z Z_teraz (P-136, łatka 01 NZ-RD15 nakładana przez 08 na start partii 4) — src/domena/postep.ts
function celDzienny(w: { suma: number; przedDzis: number; zrobioneTeraz: number; termin: string; dzis: string }): Wynik<CelDnia>;
// zrobioneTeraz = Z_teraz = Σ min(r_i, c_i) teraz (całkowite ≥ 0, inaczej bledne_dane); gałęzie w kolejności RD-15: (1) d ≥ 1 i R ≤ 0 albo
// d < 1 i R_teraz ≤ 0 → { rodzaj: 'osiagniety' }; (2) d < 1 i R_teraz > 0 → { rodzaj: 'po_terminie', zostalo: R_teraz }; (3) → { rodzaj: 'cel',
// rzedy: ⌈R / d⌉ } (R z przedDzis, cel stały w dniu, P-047). Wyrocznia: RD-15-W1–W16 (brd.json po łatce).

// RD-21 „przed schematem” (P-134 Q3a) — src/domena/znacznik-wzoru.ts; ADR-0011 (2026-10-26 fix-4)
function polozenieZnacznika(z: ZnacznikWzoru, wartoscLicznika: number): Wynik<{ strona: number; rzad: number; y: number; pozaStrona: boolean; przedSchematem: boolean; rzadNotatki: number | null }>;
// wartoscLicznika = s (skończone rzędy); s < 0 albo niecałkowite → bledne_dane (RD-21-W7). rzad = rzadBazowy + (s − wartoscPrzyUstawieniu).
// rzad < 1 → przedSchematem: true, pozaStrona: false, y = położenie rzędu 1 schematu przycięte do strony, rzadNotatki: null (notatki brak);
// w przeciwnym razie przedSchematem: false, rzadNotatki = s + 1, a krawędź strony jak dotąd (pozaStrona). Domyślnie przy ustawieniu
// rzadBazowy = s_ust + 1 niezależnie od trybu licznika (RD-21-W1–W3). Wyrocznia: RD-21-W1–W9 (tests/wektory/brd.json).
```
- **Moduł natywny** (`modules/oczko-dziennik-plus/ios/Zegarek.swift`, `index.ts`): `zegarekWyslij(stanJson: string, potwierdzone: string[])`; `didReceiveUserInfo` przy błędzie `dopisz` nie woła `poZapisie` i niczego nie potwierdza (e1, zegarek ponowi).
- **Zegarek** (`targets/watch/Aplikacja.swift`, `SkrzynkaZegarka` w pakiecie): kolejka w pliku, kolejność stuknięcia, usuwanie i ponowienie według ADR-0009 (2026-10-26) pkt 1–5; testy X-ZG (`xctest-specyfikacja.md` §4).
- **Sklep (a):** test oczekujący `tests/akceptacja/dane/sklep-status.test.ts`; `tests/adaptery/sklep.test.ts` (asercje `kup` → `{ ok }` i `kupZeStatusem`) przechodzą na status.
- **Haptyka (b):** test oczekujący `tests/akceptacja/dane/haptyka-wzorce.test.ts` (wyrocznia: tokeny 04; zmiana tokenów w 04 czerwieni test, nie przechodzi po cichu).
- **Blokada (N1):** test oczekujący `tests/akceptacja/dane/stan-blokada.test.ts`; Swift: X-ST-07, X-DZ-15, X-ZG-11 (`xctest-specyfikacja.md`); teksty stanu blokady na ekranie blokady i zegarku: 04.
- **Pora ukończenia, RD-15, RD-21 (dopiski P-136, P-137):** `tests/dane/projekt-fix3.test.ts` (wywołanie z `ukonczonoMs`) przechodzi na nową sygnaturę; RD-15 z łatką 01 (`postep.test.ts`, P-136); RD-21: testy 07 na wektorach W1–W9; wołający `polozenieZnacznika` (`src/dane/repozytoria/wzory.ts:41`) obsługuje `Wynik`.
- **Testy do zmiany mechanicznej przez 08** (asercje bez zmiany sensu): `toEqual({ ok: true, wartosc: { scalono, pominieto } })` w `tests/dane/dziennik*.test.ts` dostaje `potwierdzone`; test oczekujący `tests/akceptacja/dane/zegarek-potwierdzenia.test.ts` przenieść do `tests/dane/` w commicie, który go zazielenia.

## Prośba o ocenę (fix-5 2026-10-26, NZ-08-P4-05; P-150 E2-1a, P-156)
Chwila bez zmian (BR-DAN-012: zamknięcie karty ukończenia), do tego własny limit jak w Treningu (`lib/review.ts` `reviewDecision`, `lib/review-run.ts` `maybeRequestReview`): odstęp ≥ `ODSTEP_PROSBY_DNI` i najwyżej `PROSB_NA_WERSJE` prośba na wersję aplikacji. Okno jest systemowe: system sam ogranicza je do 3 w 365 dniach na urządzeniu, w TestFlight nic nie pokazuje i aplikacja nie wie, czy się pokazało (`docs/wzrost.md`, reguły z dnia pracy) — dlatego liczy się chwila wywołania, nie pokazania.
```ts
// src/domena/ocena.ts — typy są w pliku (fix-5); funkcję dopisuje 08
function czyProsicOOcene(w: WejscieProsby): boolean;
// WejscieProsby = { zdarzenie: ZdarzenieProsby; wersja: string; ostatniaProsba?: unknown; dzis: string; dostepna: boolean }
// true ⇔ wszystkie: zdarzenie === 'zamknieto_karte_ukonczenia' (PO-01, PO-06, PO-07); dostepna (PO-08); wersja niepusta (PO-08b); dzis to data RRRR-MM-DD;
//   oraz ostatniaProsba nie jest poprawnym { wersja: niepusty napis, dzien: istniejąca data RRRR-MM-DD } (brak, null, zły kształt → jak brak, PO-02, PO-11)
//   albo: ostatniaProsba.wersja ≠ wersja (PROSB_NA_WERSJE = 1; PO-03, PO-10) i 0 ≤ dni(ostatniaProsba.dzien → dzis) i dni ≥ ODSTEP_PROSBY_DNI (PO-04, PO-05, PO-09).
// dni = różnica dat kalendarzowych (dzień lokalny RD-16 z Zegar.teraz().dzien), bez godzin i bez strefy; zegar cofnięty (dzis < dzien) → false (PO-09).
```
- **Zapis** (P-156 Q1a): klucz `ustawienie` `ostatnia_prosba_o_ocene` = `{ wersja, dzien }` (dane.md), stan urządzenia — bez iCloud, pomijany przy imporcie i przeniesieniu (`KLUCZE_URZADZENIA`), bo limit Apple liczy się na urządzeniu („on this device”, RequestReviewAction). Odstępstwo od Treningu nazwane (P-156): Trening trzyma pole w `Settings`, które wraca z kopią — Oczko ma osobną kategorię stanu urządzenia; logika bramki jak w Treningu. Bez zmiany schematu i bez migracji (tabela `ustawienie` bez zmian).
- **Przypadek użycia** (08, `src/przypadki-uzycia/`; wołany z ekranu `Ukonczenie` po „Done”): odczyt klucza (`odczytajUstawienie`, bez walidacji — waliduje bramka), `Zegar.teraz().dzien`, wersja aplikacji (`CFBundleShortVersionString` przez adapter platformy), `dostepna` = `StoreReview.isAvailableAsync()`; przy `true` → `StoreReview.requestReview()`, a **po udanym wywołaniu** zapis `{ wersja, dzien: dzis }` przez kolejkę (`zapiszUstawienie`, UPSERT). Wyjątek modułu (np. brak aktywnej sceny) albo `dostepna = false` → bez zapisu (prośby nie było; jak Trening `review-run.ts:37-41`). Nieudany zapis klucza → wpis w `blad`, bez komunikatu: to nie dane użytkowniczki, skutek to najwyżej jedna prośba więcej, którą i tak ogranicza system (ARCH-18 nie dotyczy).
- **Port** `System.prosbaOOcene()` (`src/ekrany/wspolne.ts:25`) zostaje wywołaniem systemowym; decyzję podejmuje bramka, nie ekran. Dochodzi odczyt dostępności (`ocenaDostepna(): Promise<boolean>`) i wersji aplikacji — kształt portu ustala 08 (typy w `wspolne.ts` albo w portach przypadku użycia).
- **Testy:** domena — `tests/akceptacja/domena/prosba-o-ocene.test.ts` (wektory; test oczekujący, P-156 Q2a); ekran — test 07 `tests/akceptacja/ekrany/ukonczenie.test.tsx:38` („jedna prośba przy każdym zamknięciu”) do zmiany: zamknięcie karty woła przypadek użycia, a wywołanie systemowe zależy od bramki (prośba przy `true`, brak przy `false`); dane — zapis klucza tylko po udanym wywołaniu, klucz pomijany przy imporcie.
- Kontrola dokumentu: `docs/architektura/narzedzia/kontrola-fix5.mjs --id po` (wzorzec bramki liczy wektory niezależnie od kodu).

## Kontrakt partii 5 (fix-6 2026-10-26, NZ-P5-PRZEGLAD; P-182 Q3a, P-188, P-191, P-199)
Sygnatury przypadków użycia, które 08 dopisało w partii 5 i wypisało do przeglądu 05 (precedens partii 4). Przejrzane: wzorzec ADR-0002 bez nowych granic — każdy zapis to jedna instrukcja `UPDATE`/`INSERT` (albo kilka w jednej transakcji) w `operacjaZapisu` (kolejka, transakcja, błąd SQLite → `zapis` i wpis `blad`), walidacja wejścia przed kolejką, wynik `Wynik`; kolumna w `zmienProjekt` z zamkniętej listy (ARCH-17). **Odczyty ekranów idą przez tę samą kolejkę** (`operacjaZapisu`, precedens `widokLicznika`): odczyt nie widzi połowy cudzej operacji; koszt nazwany — błąd odczytu ma w `blad` kod `zapis_<operacja>` i powód `zapis`.
```ts
// src/przypadki-uzycia/projekt.ts
function dodajCzescProjektu(z: Zaleznosci, w: { projektId: string; nazwa: string; cel: number | null }): Promise<Wynik<{ czescId: string; licznikId: string }>>; // BR-PRJ-001, U-5; część z licznikiem rzędów na końcu kolejności
function ustawDrut(z: Zaleznosci, w: { projektId: string; drutMm: number | null; narzedzie: NarzedzieProjektu }): Promise<Wynik<void>>; // P-184; obie kolumny jedną instrukcją
function ustawTermin(z: Zaleznosci, w: { projektId: string; terminDzien: string | null }): Promise<Wynik<void>>;                       // BR-DNI-005, F-61; `ostatnia_praca_ms` bez zmian
// src/przypadki-uzycia/czesc.ts
function ustawZnaczenie(z: Zaleznosci, w: { licznikId: string; znaczenie: 'skonczone' | 'w_trakcie' }): Promise<Wynik<void>>;           // BR-LIC-012; wołający odświeża stan ekranu blokady (`znaczenie` jest w stanie v3)
function nastepnaCzesc(z: Zaleznosci, w: { licznikId: string }): Promise<Wynik<NastepnaCzesc>>;                                         // BR-LIC-011/S1, P-182 Q4a; tylko odczyt
// src/przypadki-uzycia/widok-projektu.ts, widok-kosza.ts
function widokProjektu(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<WidokProjektu>>;                                       // projekt w koszu albo brak → bledne_dane
function podgladTerminu(z: Zaleznosci, w: { projektId: string; terminDzien: string }): Promise<Wynik<CelDnia | null>>;                 // RD-15 bez zapisu
function widokKosza(z: Zaleznosci): Promise<Wynik<ElementKosza[]>>;                                                                    // F-33, BR-DAN-008
// src/przypadki-uzycia/sesja.ts — stoper (F-21, F-51; maszyna „Sesja stopera”)
function startSesji(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<{ sesjaId: string }>>;   // projekt w toku poza koszem; inna otwarta sesja → niedozwolone_przejscie
function wstrzymajSesje(z: Zaleznosci, w: { sesjaId: string }): Promise<Wynik<void>>;
function wznowSesje(z: Zaleznosci, w: { sesjaId: string }): Promise<Wynik<void>>;
function zakonczSesje(z: Zaleznosci, w: { sesjaId: string }): Promise<Wynik<{ czasMs: number }>>;
function korygujSesje(z: Zaleznosci, w: { sesjaId: string; startMs: number; koniecMs: number }): Promise<Wynik<void>>;               // przerwy_ms = 0 (P-199 Q4a)
function otwartaSesja(z: Zaleznosci): Promise<Wynik<SesjaNaEkranie | null>>;
function sesjeProjektu(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<SesjaNaEkranie[]>>;
// src/domena/licznik-calosci.ts — P-199 Q1a (łatka A)
function licznikCalosci(liczniki: readonly LicznikKawalka[], czescId: string): number | null; // LicznikKawalka = { id, czescId, rodzaj, wartosc }
// src/domena/cel-pary.ts — P-199 Q2a (łatka B)
function celZPary(w: { cel: number | null; paraZ: string | null; rzedyPary: number }): number | null;
```
- **„Stop it and start here?” (P-191 P3a):** `zakonczSesje` innej sesji, potem `startSesji` — dwie pozycje kolejki. Przerwa między nimi nie traci danych (pierwsza sesja zapisana); nieudany start pokazuje błąd i niczego nie cofa. Jedna transakcja nie jest potrzebna (realność: teoretyczna).
- **Licznik całości (P-199 Q1a; F-46 „bez ustawienia”, propozycja 04 z P-183):** każdy nieusunięty licznik rzędów części jest sekcją; `licznikCalosci` zwraca ich sumę, gdy są ≥ 2, inaczej `null`; liczniki oczek i innych części nie wchodzą (BR-LIC-018 S1–S4). Jedna funkcja dla `widokProjektu` (`calosc`) i `caloscCzesci` (ekran licznika); kompozycja nie liczy własnej reguły (dziś trzy miejsca, ARCH-02). Kolumna `licznik.sekcja` znika z v1: z `schemat.sql` i `0001.sql` razem (v1 niewydany, precedens P-184), z `zrobPonownie` i z typów — nikt jej nie ustawiał, więc nie niesie danych.
- **Cel części pary (P-199 Q2a; BR-PRJ-014 S1, S3):** cel części = własny `cel_rzedow` albo, w części pary bez własnego, rzędy pierwszej części (`celZPary`) liczone przy każdym odczycie — pojawia się, gdy pierwsza ma rzędy (S3), i idzie za rzędami, nie za celem pierwszej (S1). `dodajCzescPara` nie kopiuje celu (bez kopii `cel_rzedow`, druga część ma `NULL`); własny cel ustawiony później przez `ustawCel` wygrywa. Jedno miejsce reguły: `celZPary` w `widokProjektu`, `celCzesci` (ekran licznika) i `nastepnaCzesc` (`celDrugiej` = rzędy bieżącej części albo `null`). `zrobPonownie` przepisuje `para_z` na id części kopii w tej samej transakcji (para z częścią w koszu, której kopia nie ma, zostaje bez pary) — bez tego „Make another” (J-05, druga skarpeta) gubi parę.
- **Stoper na ekranie blokady i zegarku (P-199 Q3c, 04-fix6-N1):** stan v3 bez zmian; `sesjaStartMs` = `start_ms + przerwy_ms` sesji projektu licznika w stanie `trwa`, `null` w pauzie i bez sesji (`startSesjiEkranu`, `src/dane/repozytoria/ekran-blokady.ts:20`) — w pauzie czas znika zamiast biec. Każde przejście sesji (start, pauza, wznowienie, koniec, korekta, zamknięcie zapomnianej przy starcie) woła po COMMIT `odswiezEkranBlokady`, inaczej Live Activity zostaje z biegnącym czasem do następnego +1. Widok pauzy (symbol i stały czas) — 1.1, ADR-0008 (fix-6).
- **Kosz:** `ElementKosza` niesie `projektNienazwany` i `projektUtworzonoMs` rodzica (łatka D); kompozycja pokazuje etykietę projektu roboczego zamiast daty zapasowej, także w podpisie części i licznika (dane.md „Projekt roboczy”).
- **Łatki dla 08** (P-136, P-199): `oczko-warsztat/05-architekt/2026-10-26-fix6/latki/` — A (licznik całości i kolumna), B (cel pary, `zrobPonownie`), C (N12-07, N12-08, dane.md), D (kosz); każda z testem czerwonym przed i zielonym po.

## Fundament partii 6 i 7 (fix-7 2026-10-26, NZ-P217-05; P-217, P-218, P-220, P-221)
Wiąże obie partie. Ograniczenia patentowe P-218 (1)–(6) są warunkami każdej funkcji wzoru (`docs/architektura/fix-7-2026-10-26.md`, „Patenty”).
- **Łatki do nałożenia przez 08 po zamknięciu partii 5, przed startem partii 6 i 7, w tej kolejności** (`git am`, `oczko-warsztat/05-architekt/2026-10-26-fix7/latki/`; sprawdzone 2026-10-26: nakładają się czysto na 86e33c7, verify kod 0 po L1 i po całości; konflikt w generowanym `docs/jakosc/e4/tabela-08.md` = wygeneruj od nowa, nie scalaj ręcznie):
  1. `L1-schemat-skrzynka-icloud.patch` — schemat v1: `synchronizacja`, `zmiana_icloud` (z `nr`), 51 wyzwalaczy z `icloud-tabele.json`, `sesja.zmieniono_ms`, `wzor.usunieto_ms`; runner dzieli `CREATE TRIGGER … END` jako jedną instrukcję (`parametry.ts`); przeniesienie i „Usuń wszystkie dane” znają nowe tabele (usunięcie wszystkiego najpierw wyłącza synchronizację, więc usunięcia nie idą do iCloud). Testy oczekujące `tests/akceptacja/dane/{icloud-skrzynka,instrukcje-wyzwalacze}.test.ts` przechodzą do `tests/dane` (11 czerwonych na asercji → 12 zielonych). Verify 2308/2308.
  2. `L2-sesja-zmieniono.patch` — `zmieniono_ms` przy każdym przejściu sesji, import „scal” scala sesję po czasie (test 3 × czerwony → zielony). Verify 2311/2311 po L1–L3c.
  3. `L3a-ipad-orientacja.patch` — `supportsTablet: true`, `orientation: "default"`, bez `UIRequiresFullScreen` (P-221 Q3a).
  4. `L3b-app-group.patch` — App Group aplikacji `group.com.apps4brew.knitting` (identyfikator rejestruje właściciel przed pierwszym buildem z rozszerzeniem).
  5. `L3c-icloud-uprawnienia.patch` — CloudKit, kontener `iCloud.com.apps4brew.knitting`, `aps-environment`, `UIBackgroundModes: ["remote-notification"]` (kontener rejestruje właściciel; wartość `aps-environment` przy podpisie: [DO USTALENIA] rola 10).
- **Porty** (blok „Porty domeny”, `src/domena/porty.ts`, zamrożone w tym fixie): `SkrzynkaImportu` z `ZlecenieImportu`, `MigawkaProjektow`, `KonwersjaWzoru`, `SkanerStron`, `Orientacja` (partia 6); `Synchronizacja` w wersji 2 bez `zglosZmiane` (partia 7). Zmiana sygnatury portu = zgłoszenie do 05, nie zmiana w partii.
- **Nowe powody `Powod`** (`src/domena/bledy.ts`, dopisuje 08 w partii 6 razem z kluczami 04): `brak_sieci`, `odmowa` (401/403), `pusty` (PDF bez tekstu i obrazu, BR-WZR-007 S3), `anulowano` (skaner, wybór pliku). `za_duze` już jest (`WZOR_MAKS_MB`).
- **Stałe** (tabela „Konfiguracja”; do `src/konfiguracja.ts` dopisuje partia, która ich używa): `WZOR_MAKS_MB` i `RYSUNEK_ZAPIS_MS` (w tabeli od Z07-17, w kodzie jeszcze ich nie ma), nowe `SKRZYNKA_PORZUCONE_H`, `MIGAWKA_WERSJA`, `ICLOUD_W_1_0`.
- **Pliki wspólne obu partii** (tylko dopisywanie we własnym bloku; `git pull --rebase` przed pushem; plik generowany po rebase generować od nowa, nie scalać ręcznie):

| Plik | Partia 6 | Partia 7 |
|---|---|---|
| `src/i18n/slowniki/en.json`, `en.kontekst.json`, `pseudo/en-XA.json` | klucze `wzor.*`, `import.*`, `rozszerzenie.*` | klucze `icloud.*` |
| `src/kompozycja/kontener.ts`, `src/przypadki-uzycia/zaleznosci.ts` | pola `skrzynka`, `migawka`, `konwersja`, `skaner`, `orientacja` | pole `synchronizacja` (już jest, opcjonalne) |
| `src/przypadki-uzycia/start.ts` | krok „skrzynka importu” po `sprzatnijKosz` | krok „uruchom silnik” po kroku partii 6 |
| `src/przypadki-uzycia/kosz.ts`, `src/dane/repozytoria/kosz.ts`, `src/przypadki-uzycia/widok-kosza.ts` | wzór w koszu (rodzaj `'wzor'`, przywrócenie, sprzątanie) | — |
| `src/ekrany/Licznik.tsx` | ikona „Pattern” (P-220 W2a) | linia konfliktu (P-220 I1a) |
| `src/ekrany/Ustawienia.tsx`, `src/ekrany/StanDanych.tsx` | — (iPad: zegarek nieobsługiwany) | wiersz iCloud, stany F-58 |
| `src/konfiguracja.ts`, `docs/architektura/moduly.md` „Konfiguracja” | stałe wzoru | stałe iCloud |
| `docs/adr/0016-zaleznosci-wersji-1.md` | wiersz `expo-screen-orientation` 57.0.3 | — |
| `package.json`, `package-lock.json` | `expo-screen-orientation` (tylko partia 6; lock z `npm install`, nie ręcznie) | — |
| `docs/jakosc/e4/tabela-08.md` | generowana | generowana |
| `src/platforma/tryb-e2e.ts` | argument `oczkoE2eSkrzynka` | argument `oczkoE2eIcloud`, panele iCloud |
| `.github/workflows/jakosc-ios.yml` | zadanie iPad (Q4a) | — |
| `.github/workflows/testflight.yml` | podpis `.appex` według celu (niżej, „Podpis rozszerzenia”) | — |

## Kontrakt partii 6: wzory, rysik, iPad, rozszerzenie (fix-7 2026-10-26)
Funkcje: F-24, F-25, F-26, F-28, F-55, F-56, rozszerzenie „Udostępnij do Oczka”, iPad (NFR-UKL-001, P-218 Q3a), kilka wzorów w projekcie (P-220 W9b). Pliki na własność: `modules/oczko-wzor/**`, `targets/share/**`, `src/przypadki-uzycia/wzor.ts`, `src/dane/repozytoria/wzory.ts`, `src/platforma/{wzor,skrzynka,migawka,skaner,orientacja}.ts`, `src/kompozycja/wzor.ts`, `src/ekrany/Wzor*.tsx`, `app/**/wzor*`, testy i scenariusze `*wzor*`, `*ipad*`, `*rozszerzenie*`.

**Moduł Swift `modules/oczko-wzor`** (Expo Modules API; ADR-0011, ADR-0012, P-221 Q1a, Q2a; jedyny kod PDFKit, PencilKit, WebKit i VisionKit):
- Widok `WidokWzoru`: `PDFView` z `PKCanvasView` nad każdą stroną przez `pageOverlayViewProvider` (`PDFPageOverlayViewProvider`, iOS 16+). Właściwości: `plikPdf: string`, `strona: number`, `rysunki: { strona: number; plik: string }[]`, `znacznik: { strona: number; y: number; wysokosc: number; pozaStrona: boolean; przedSchematem: boolean } | null` (wynik `polozenieZnacznika`; widok tylko rysuje), `narzedzie: 'brak' | 'zakreslacz' | 'pioro' | 'gumka'`, `tylkoRysik: boolean`. Zdarzenia: `onRysunek({ strona, plikTymczasowy })` po `RYSUNEK_ZAPIS_MS` od ostatniej kreski, przy zmianie strony, zamknięciu i przejściu w tło; `onStukniecie({ strona, y })` (y = ułamek wysokości strony 0–1 w układzie strony bez `/Rotate`, ADR-0011 Z07-17); `onStrona({ strona, stron })`; `onPierwszyRysik()` (P-218 Q2a: od tej chwili `tylkoRysik = true` i polityka `pencilOnly`; to stan ekranu, nie ustawienie — przy kolejnym otwarciu wzoru pierwsze dotknięcie rysikiem włącza go znowu).
- `narzedzie = 'brak'`: palec przewija, nic się nie rysuje (BR-WZR-008 S3); zakreślacz palcem: polityka `anyInput` tylko przy aktywnym narzędziu; kolor zakreślacza = token 04 `kolor.zakreslacz` (P-220 W6a). Cofnij: `undoManager` płótna bieżącej strony.
- Adnotacje to osobna warstwa (`rysunek`, `znacznik`, `notatka_rzedu`); widok nigdy nie zapisuje do pliku PDF (P-218 (2)). Bez OCR, bez wycinania, bez łączenia stron kilku wzorów (P-218 (1), (3)).
- Funkcje: `naPdf(zrodlo)` = `KonwersjaWzoru` — `adres` i `word`: `WKWebView` poza ekranem, po `didFinish` (kod HTTP 401/403 → `odmowa`, brak sieci → `brak_sieci`) renderer stron druku (`UIPrintPageRenderer` z `viewPrintFormatter()`), papier Letter dla regionu US i CA, A4 dla pozostałych [OCENA 05]; `obrazy` i skan: jedna strona PDF na obraz, orientacja z EXIF. Po konwersji kontrola: `PDFDocument(url)` otwiera plik, ≥ 1 strona, tekst albo obraz na stronie, inaczej `pusty`. `sprawdzPdf(sciezka): Promise<Wynik<{ strony: number }>>` — pełne otwarcie PDFKit zamiast dzisiejszej kontroli nagłówka i końca (zamyka `[DO USTALENIA 08]` z `src/przypadki-uzycia/wzor.ts:15`); PDF zaszyfrowany bez hasła → `uszkodzony` (tekst: 04).
- `skanuj()` = `SkanerStron`: `VNDocumentCameraViewController` (iOS 13+; `isSupported` false → przycisk skanera ukryty); wynik: pliki JPEG stron w katalogu tymczasowym → `naPdf({ rodzaj: 'obrazy' })`. Uprawnienie aparatu: istniejący tekst `cameraPermission` (`app.json`, „photo of a pattern”) obejmuje skan; nowego klucza nie ma. Prostowanie wykonuje skaner (P-218 (2) dozwala).
- Eksperymenty w oknie maszyn (P-187) przed kodem ekranu: (W1) render `.docx` z korpusu (3 pliki: tekst, tabela, obraz) w `WKWebView` → PDF: tekst obecny, liczba stron ≥ 1; porażka = podgląd systemowy bez znacznika i rysika (5a, `wzor.pdf_sha256 = NULL`, `zrodlo = 'word'`); (W2) PDF 100 MB i 300 stron: przewijanie i pamięć w Instruments [DO ZMIERZENIA]; (W3) `pencilOnly`: przeciągnięcie palcem nie zmienia `drawing.strokes.count` (XCTest, ADR-0012).

**Cel `targets/share`** (`@bacons/apple-targets` typ `share`; ADR-0011):
- Reguła aktywacji bez `TRUEPREDICATE`: PDF (`com.adobe.pdf`) 1, obrazy (`public.image`) do 20 [OCENA 05], adres (`public.url`) 1, Word (`org.openxmlformats.wordprocessingml.document`) 1. Konfiguracja celu podaje `entitlements` z grupą aplikacji jawnie (bez klucza biblioteka nie kopiuje grupy, prebuild 2026-10-26). **Warunek P-234:** `targets/share/expo-target.config.js` ma klucz `entitlements` z `com.apple.security.application-groups: ['group.com.apps4brew.knitting']` — podpis TestFlight bierze plik uprawnień celu z `CODE_SIGN_ENTITLEMENTS` (`scripts/wydanie/uprawnienia-celow.mjs`); bez klucza rozszerzenie dostałoby podpis bez grupy i nie zapisze do skrzynki.
- Wybór projektu z migawki (P-220 R1a, N2): plik `<App Group>/projekty-migawka.json` = koperta `{ format: 'oczko-migawka', wersja: MIGAWKA_WERSJA, utworzono, jezyk, projekty: ProjektMigawki[] }` (`jezyk` = język aplikacji, P-248 D2a); brak pliku, wersja nowsza albo plik uszkodzony → tylko „Choose in Oczko” (`projektId = null`, stan zastępczy). Rozszerzenie niczego nie zapisuje do migawki.
  - **Rozwój koperty (przegląd 05 2026-10-27, P-243 S1a):** pola `ProjektMigawki` (`ostatniaPracaMs`, `wzory`) przyjęte; `ostatniaPracaMs` zostaje `number | null`, choć kolumna jest `NOT NULL` (czytnik tolerancyjny). Nowe pole koperty albo projektu: w dekoderze Swift opcjonalne (`targets/share/Wspolne/Skrzynka.swift` dekoduje pola wymagane — brak pola = stan zastępczy), albo nowa `MIGAWKA_WERSJA`. *Dlaczego:* rozszerzenie z nowej wersji czyta migawkę zapisaną przez starszą aplikację, zanim ta uruchomi się po aktualizacji.
  - **Flaga `film` (P-276, 2026-10-27):** `ProjektMigawki` dostaje `film: boolean` = `projekt.film_adres IS NOT NULL` (ten sam odczyt co `odswiezMigawke`, bez nowej kolumny); rozszerzenie pokazuje przy „Video link” linię `udostepnij.film_zastapi` (04 fix-8), gdy wybrany projekt ma już film. Skrzynka (`przypiszZlecenie`) pokazuje tę samą linię przed zastąpieniem — tekst i przepływ: 04. Migawka nie jest jeszcze wydana, więc pole wymagane i `MIGAWKA_WERSJA` = 1 bez zmian; po 1.0 obowiązuje reguła wyżej. Wykonanie: 08 p6 — `porty.ts` i blok „Porty domeny” w tym pliku w jednym commicie (kontrola `sprawdz-porty.mjs` wymaga równości), `odswiezMigawke`, dekoder Swift (`targets/share/Wspolne/Skrzynka.swift`), wiersz `prywatnosc.md` (05 dopisał); test przed kodem: migawka projektu z filmem ma `film: true`, bez filmu `false`.
- Zapis zlecenia: katalog `<App Group>/skrzynka/<uuid>/`, plik kopiowany strumieniowo (`FileManager.copyItem` albo strumień, bez wczytania do pamięci); plik > `WZOR_MAKS_MB` → jedno zdanie (04), bez kopii; manifest `zlecenie.json` (`ZlecenieImportu`) zapisany **na końcu** przez plik tymczasowy i `rename`. Katalog bez manifestu = niepełne zlecenie: aplikacja usuwa je po `SKRZYNKA_PORZUCONE_H` (domyślnie 1 h [OCENA 05]), nigdy wcześniej (rozszerzenie może jeszcze kopiować).
  - **Format manifestu (przegląd 05 2026-10-27, P-246 S4a, P-248 D1a, P-274 Q4a):** `rodzaj: 'film'` i `sciezki` przyjęte. `zlecenie.json` nie ma pola wersji i zmienia się tylko dodająco: nowe pola opcjonalne, czytnik (`src/platforma/skrzynka.ts`) toleruje ich brak, a walidacji istniejących pól nie zaostrzamy. Zmiana niezgodna = najpierw pole `wersja` (brak = 1) i czytnik obu wersji. *Dlaczego:* zlecenie zapisane przed aktualizacją aplikacji czeka w skrzynce (wybór projektu, sieć); manifest, którego nowy czytnik nie uzna, jest traktowany jak niepełny i po `SKRZYNKA_PORZUCONE_H` znika razem z udostępnionym plikiem.
- Rozszerzenie nie otwiera bazy i nie importuje `SQLite3` (granice: SWIFT); nie dekoduje pliku.

**Aplikacja (TS)**:
- `MigawkaProjektow.zapisz` (moduł `oczko-wzor`): koperta jak wyżej, zapis atomowy (plik tymczasowy → odczyt kontrolny → `rename`, ARCH-22); wołana po COMMIT każdej operacji, która zmienia listę projektów w toku (utworzenie, nazwa, ukończenie, wznowienie, usunięcie, przywrócenie, sprzątanie kosza, import, „Usuń wszystkie dane” → pusta lista) i przy starcie. Błąd zapisu migawki nie cofa operacji: wpis w `blad` (`migawka_zapis`), rozszerzenie pokaże stan zastępczy. Dane: nazwy projektów (dane użytkownika) na urządzeniu we wspólnym kontenerze — wiersz w `prywatnosc.md`.
- `przetworzSkrzynke(z): Promise<Wynik<{ zaimportowano: number; doWyboru: ZlecenieImportu[] }>>` — przy starcie (krok po `sprzatnijKosz`) i przy `AppState → active`: dla każdego zlecenia z manifestem: projekt istnieje, w toku i poza koszem → `dodajWzor`, potem `usun(id)`; `projektId = null` albo projekt niedostępny → `doWyboru` (ekran wyboru projektu, 04), zlecenie zostaje do wyboru albo odrzucenia przez użytkowniczkę. Błąd importu → zlecenie zostaje, wpis w `blad`, komunikat (04); nic nie ginie po cichu.
- `dodajWzor(z, w: { projektId: string; nazwa: string; zrodlo: { rodzaj: 'pdf'; plik: PlikWejsciowy } | { rodzaj: 'word'; plik: PlikWejsciowy } | { rodzaj: 'obrazy'; sciezki: readonly string[] } | { rodzaj: 'adres'; adres: string } }): Promise<Wynik<{ wzorId: string }>>` zastępuje `importujWzor` (nazwa zostaje jako alias dla PDF do przeniesienia testów). Kolejność: konwersja i `sprawdzPdf` **przed** kolejką i poza transakcją (sieć, ARCH-13) pod `CzasWTle.chron('import-wzoru', …)`; potem `magazyn.zapisz` (PDF, a dla Worda także oryginał); potem jedna transakcja: `plik` (UPSERT `DO NOTHING`), `wzor` (`zrodlo`, `pdf_sha256`, `oryginal_sha256` tylko dla Worda, `adres` dla strony). Jeden import = jeden wzór (P-218 (1), Q6a): bez funkcji dopisania stron do istniejącego wzoru. Projekt w koszu → `niedozwolone_przejscie`.
- `listaWzorow(z, { projektId }): Promise<Wynik<{ wzorId: string; nazwa: string; zrodlo: string; maZnacznik: boolean }[]>>` — `usunieto_ms IS NULL`, `ORDER BY nazwa COLLATE NOCASE, id`. Ekran licznika pokazuje ikonę „Pattern”, gdy lista niepusta (P-220 W2a). Otwiera się ostatni oglądany wzór (`ustawienie.ostatnie_miejsce = { ekran: 'wzor', id }`, F-49), inaczej pierwszy z listy; jeden widoczny naraz (P-218 (3), P-220 W9b).
- `usunWzor(z, { wzorId }): Promise<Wynik<void>>` i `przywrocWzor(z, { wzorId }): Promise<Wynik<void>>` (P-220 N4; **kosz według zalecenia koordynatora w P-229**, wzorem P-209): `UPDATE wzor SET usunieto_ms = teraz, zmieniono_ms = teraz`; wzór znika od razu z listy i z ekranu i jest w „Ostatnio usuniętych” z terminem (`elementyKosza` dostaje rodzaj `'wzor'`, nazwa wzoru i nazwa projektu; teksty i podpis `kosz.wzor`: 04); ponowne usunięcie → `niedozwolone_przejscie` (termin się nie przesuwa); przywrócenie = `usunieto_ms = NULL` z rysunkami i znacznikiem. Wzór projektu w koszu idzie z projektem (przywrócenie projektu przywraca jego wzory bez zmiany ich `usunieto_ms`). Trwałe usunięcie (wiersz, kaskada `rysunek`, pliki bez odwołań po COMMIT) robi `sprzatnijKosz` tym samym warunkiem `doSprzatniecia` (dwa starty po `KOSZ_DNI`). **Ocena utraty danych (N4):** z koszem pomyłka nie traci rysunków ani znacznika przez `KOSZ_DNI`; 30 dni w bazie chroni też kolejność nagrobka przy iCloud (rysunek z drugiego urządzenia, który dotrze po usunięciu, nie wskrzesza wzoru — reguła nagrobków ADR-0005). Kilka wzorów w projekcie (W9b) nie zmienia oceny: każdy wzór to osobny wiersz i osobne usunięcie.
- `zapiszRysunek(z, { wzorId, strona, plikTymczasowy }): Promise<Wynik<void>>`: `magazyn.zapisz(plikTymczasowy, 'pkdrawing')` przed kolejką, potem `INSERT INTO rysunek … ON CONFLICT (wzor_id, strona) DO UPDATE SET plik_sha256 = excluded.plik_sha256, zmieniono_ms = excluded.zmieniono_ms`; poprzedni plik bez odwołań usuwany po COMMIT (ADR-0012 uzupełnienie). Wzór usunięty → `niedozwolone_przejscie`, plik tymczasowy usunięty.
- `ustawZnacznik`, `dodajNotatkeWzoru`, `polozenieZnacznika` bez zmian; wzór usunięty → `niedozwolone_przejscie` (dopisać warunek `usunieto_ms IS NULL`).
- Link do filmu (F-55, P-218 (4)): `wzor.adres` dla strony WWW to adres źródła; film to osobny link projektu poza wzorem — miejsce zapisu: notatka projektu z linkiem (dzisiejszy `LinkFilmu` z adresem) → **P-246 S4a:** kolumny `projekt.film_adres` (tylko http(s)) i `projekt.film_nazwa`, jeden film na projekt (`ustawFilm`, `usunFilm` w `src/przypadki-uzycia/wzor.ts`); „Video link” z rozszerzenia = zlecenie `rodzaj: 'film'` → film projektu, bez konwersji. Liczba stron (**P-252**): `wzor.strony` z `sprawdzPdf` przy imporcie (NULL = nieznana), w `listaWzorow`. Obrót strony (**P-246 S3a**): `wzor.obroty` (JSON strona → 90/180/270; `ustawObrot`, `obrotyWzoru`), synchronizowany z wierszem wzoru (wyzwalacze tabeli i odczyt kolumn z `pragma_table_info` — bez zmian w `icloud-tabele.json`).

**iPad i orientacja** (ADR-0026):
- **Orientacja (P-259 A, przegląd 05 2026-10-27):** typ `Orientacja = 'portrait_up' | 'all'` dla opcji `orientation` ekranów react-native-screens; reguła `orientacjaEkranu(ekran, ipad)` w `src/domena/uklad.ts`, deklaracja w `app/_layout.tsx` (Stack: `portrait_up` na iPhonie, `/wzor`: `all`; iPad: `all` wszędzie — multitasking nie dopuszcza blokady). Pakietu `expo-screen-orientation` i adaptera nie ma (ADR-0016). react-native-screens 4.26.2 żąda obrotu tylko, gdy orientacja interfejsu jest poza maską ekranu albo gdy urządzenie i interfejs są w masce w różnych orientacjach (`node_modules/react-native-screens/ios/RNSScreenWindowTraits.mm:100-125`), więc start w pionie nie wysyła żądania (P-258). Z ekranu wzoru na iPhonie nie otwiera się żaden modal (`app/wzor.tsx`: tylko powrót), więc maska innych ekranów nie obraca wzoru w trakcie; nowy modal otwierany z wzoru musi dostać `orientacjaEkranu('wzor', …)`. Układ według szerokości okna, nie orientacji: szerokość compact → układ telefonu; regular → kolumna maks. 640 pt (P-220), na wzorze w poziomie wzór i licznik obok siebie (W4b). Bez założeń o pełnym ekranie (wąskie okno, P-218 Q3a).
  - Adnotacja 08 z 2026-10-27 (P-259) przejrzana przez 05 i włączona do punktu wyżej.
- Zegarek na iPadzie: `WCSession.isSupported() == false` → moduł `oczko-dziennik-plus` nie aktywuje sesji, `Zegarek.wyslijStan`/`potwierdz` są no-op, `odbieraj` nic nie zgłasza; Stan danych nie pokazuje wiersza zegarka (tekst 04). Live Activity działa (ekran blokady iPada), Dynamic Island brak.
- Ekrany istniejące (lista, projekt, licznik, kosz, ustawienia, arkusze) muszą działać w szerokości regular i w poziomie na iPadzie: NFR-UKL-001 (0 obciętych i nakładających się elementów PR-01–PR-06). Test: zrzuty E2E iPada, pakiet niżej.

**Podpis rozszerzenia (dla 10 i 08):** krok „Uprawnienia w archiwum” w `.github/workflows/testflight.yml:157` podpisuje każdy `.appex` plikiem uprawnień widżetu (`grep -m1 -e widget`). Po dodaniu celu `share` rozszerzenie dostałoby uprawnienia widżetu bez grupy, więc nie zapisze do skrzynki (realny, P1 dla TestFlight). Kontrakt: każdy `.appex` podpisany plikiem `generated.entitlements` swojego celu (mapowanie po nazwie produktu), test: lista par `.appex → plik` w podsumowaniu kroku i porażka, gdy cel nie ma pliku.

**Skrzynka w E2E (P-230 Q2a):** argument startu `oczkoE2eSkrzynka=pdf` (tylko przy `EXPO_PUBLIC_E2E=1`) wkłada przed pierwszym ekranem testowy PDF (ten sam co `e2e-wzor-pdf`) jako zlecenie z manifestem do skrzynki App Group; obsługa w `src/platforma/tryb-e2e.ts`. Zlecenie zapisuje moduł ładowany warunkowo `src/kompozycja/e2e/skrzynka.ts` (P-238), tak jak rozszerzenie: plik, potem manifest przez plik tymczasowy i `rename`, `projektId = null`. **Wąskie okno w E2E (P-225 Q2a, P-237 (1)):** argument `oczkoE2eSzerokoscOkna=<pt>` (tylko przy `EXPO_PUBLIC_E2E=1`, liczba 200–2000, inaczej ignorowany; `szerokoscOknaE2e()` w `tryb-e2e.ts`) — korzeń aplikacji rysuje się w kontenerze tej szerokości, a `ukladOkna` (`src/domena/uklad.ts`) dostaje tę szerokość zamiast szerokości okna; nazwany wyjątek: bez klasy rozmiaru systemu. Znacznik rzędu na wzorze: testID `wzor-znacznik`, etykieta `wzor.znacznik_a11y_gora` / `_dol` (P-237 (2)).

**E2E iPada (P-221 Q4a):** osobne zadanie nocne w `jakosc-ios.yml` na symulatorze iPada (model z `xcrun simctl list` na runnerze, [DO USTALENIA] przy pierwszym przebiegu), pakiet `ipad`: start bez zegarka, lista i licznik w pionie i poziomie (zrzuty), import PDF z fikstury, znacznik idzie z licznikiem (BR-WZR-003 S1), wzór obok licznika w poziomie (BR-WZR-005). Wąskie okno (Split View) nie jest do zasymulowania w Maestro: ryzyko szczątkowe, sprawdzenie na iPadzie przy TestFlight (lista TT).

**Testy oczekujące dla 07** (pliki w `tests/akceptacja/`, przed kodem; wyrocznie z BR i tego kontraktu): `dane/wzor-dodaj.test.ts` (PDF, Word z oryginałem, obrazy → 1 wzór, adres; projekt w koszu; konwersja poza transakcją — tryb deweloperski portu), `dane/wzor-usun.test.ts` (usunięcie do kosza z terminem, przywrócenie z rysunkami i znacznikiem, ponowne usunięcie nie przesuwa terminu, sprzątanie po dwóch startach, rysunek z iCloud po nagrobku nie wskrzesza), `dane/wzor-rysunek.test.ts` (UPSERT strony, sprzątanie starego pliku), `dane/skrzynka-importu.test.ts` (manifest na końcu, porzucone po `SKRZYNKA_PORZUCONE_H`, projekt niedostępny → do wyboru, błąd importu zostawia zlecenie), `dane/migawka-projektow.test.ts` (koperta, zapis atomowy, „Usuń wszystkie dane” → pusta lista), `ekrany/wzor-ipad.test.tsx` (układ według szerokości, ikona „Pattern” tylko z wzorem). Swift (XCTest po prebuild, okno maszyn): W1–W3 wyżej, reguła aktywacji rozszerzenia bez `TRUEPREDICATE`, kopia 100 MB bez wczytania do pamięci.

## Kontrakt partii 7: iCloud (fix-7 2026-10-26)
Funkcje: F-27, F-58 (część synchronizacji), BR-DAN-002 S1–S3. Pliki na własność: `modules/oczko-icloud/**`, `cloudkit/schemat.ckdb`, `src/domena/icloud/**` (odwzorowanie, czyste funkcje), `src/dane/repozytoria/icloud.ts`, `src/przypadki-uzycia/synchronizacja.ts`, `src/platforma/icloud.ts`, `src/platforma/icloud-atrapa.ts`, `src/ekrany/Icloud*.tsx`, testy `*icloud*`. Bezpiecznik ZM-06 (P-218 Q5a): przełącznik pokazany w 1.0 tylko przy `ICLOUD_W_1_0 = true`; wartość zmienia koordynator po zaliczonym teście „rekord z telefonu widoczny na iPadzie” (TestFlight, krok właściciela); do tego czasu `false`, a kod i testy partii 7 działają niezależnie od tej flagi.

**Dane** (L1; `dane.md` „Synchronizacja iCloud”): `synchronizacja` (jeden wiersz: `wlaczona`, `wejscie`, `stan_silnika`, `nr_zmiany`) i `zmiana_icloud` (`encja`, `klucz`, `usuniete`, `nr`) wypełniana wyzwalaczami tylko przy `wlaczona = 1 AND wejscie = 0`. Tabele, typy rekordów, klucze i scalanie: `docs/architektura/icloud-tabele.json` (jedno źródło dla schematu, odwzorowania i `schemat.ckdb`).

**Moduł Swift `modules/oczko-icloud`** (jedyny kod CloudKit; implementuje port `Synchronizacja`): `CKSyncEngine` na prywatnej bazie, jedna strefa rekordów `Oczko`; `recordName = "<encja>:<klucz>"`, typ rekordu = `typ` z kontraktu, pola = `RekordIcloud.pola`, plik (`encja = 'plik'`) jako `CKAsset` w polu `dane`. Silnik trzyma w pamięci tylko rekordy przekazane przez `wyslij` do chwili potwierdzenia; źródłem prawdy o zaległej wysyłce jest `zmiana_icloud`. `serverRecordChanged` → rekord serwera trafia do `odbieraj` (scalenie w JS), zmiana lokalna zostaje w skrzynce do następnej wysyłki. `statusKonta()` mapuje `CKAccountStatus` (`available`, `noAccount`, `restricted`, `temporarilyUnavailable`, `couldNotDetermine`). Bez `SQLite3` (granice: SWIFT).

**Przypadki użycia** (`src/przypadki-uzycia/synchronizacja.ts`, wszystkie zapisy przez kolejkę ADR-0002):
- `wlaczSynchronizacje(z)`: `statusKonta()`; ≠ `dostepne` → stan `brak_konta` (P-220 N3: `ograniczone` i „iCloud wyłączony dla Oczka” mają osobny tekst 04; czy wyłączenie iCloud dla samej aplikacji daje `noAccount`, `restricted` czy błąd zapytania: [DO USTALENIA] okno maszyn albo urządzenie — kontrakt obsługuje wszystkie trzy jako `brak_konta`). `dostepne` → jedna transakcja: `wlaczona = 1`, pełne wpisanie do skrzynki (`INSERT INTO zmiana_icloud SELECT … FROM <tabela>` dla każdej tabeli z kontraktu, `nr` = `nr_zmiany + 1`, potem `nr_zmiany += 1`); po COMMIT `uruchom(stan_silnika)` i `wyslij`.
- `wylaczSynchronizacje(z)`: jedna transakcja `wlaczona = 0`, `DELETE FROM zmiana_icloud` (dane lokalne zostają, BR-DAN-002); `stan_silnika` zostaje (ponowne włączenie i tak wpisuje wszystko).
- `wyslijZaleglosci(z)` (start, `AppState → active`, po każdym COMMIT, który mógł zmienić skrzynkę — wołany z kompozycji, nie z repozytoriów): odczyt skrzynki partiami `PARTIA_SYNCHRONIZACJI`, odwzorowanie `rekordZWiersza` (pomija kolumny `pomin`; `licznik.wartosc`, `glowa`, `konflikt` liczone u odbiorcy przez `scal`), `wyslij`.
- Obsługa `wyslane` (jedna transakcja): `DELETE FROM zmiana_icloud WHERE encja = ? AND klucz = ? AND nr <= ?` dla każdego potwierdzenia, `stan_silnika = ?`. Zmiana po wysłaniu ma większy `nr` i zostaje (test L1).
- Obsługa `odbieraj` (jedna transakcja, w kolejności tabel z kontraktu, partie po `PARTIA_SYNCHRONIZACJI`): `wejscie = 1` na początku; zasoby plików pobrane przez CloudKit są kopiowane do magazynu **przed** transakcją (SHA-256 = klucz, inaczej rekord do `poczekalnia`, `nowsza_wersja` nie; wpis `blad`); `zmieniono_ms` → UPSERT `WHERE excluded.zmieniono_ms > <tabela>.zmieniono_ms` (jak `scalZKopia`); `tylko_dopisywane` → `ON CONFLICT DO NOTHING`, a dla zdarzeń kolizja treści → `blad` (M-14); `dni_limitu` → `zapis-dnia-limitu.sql`; `ustawienie_or` → OR; brak rodzica albo encji → `poczekalnia` (sprawdzenie istnienia przed INSERT, nie odroczone klucze, bo naruszenie przy COMMIT odrzuciłoby całą partię); usunięcia → `DELETE` (kaskada); potem `przeliczLicznik` dla liczników ze zdarzeniami z partii (`scal`: `konflikt` → `licznik.konflikt = 1`); ponowienie rekordów z `poczekalnia`; `stan_silnika = ?`; `wejscie = 0`; COMMIT. Po COMMIT: odświeżenie ekranu, Live Activity i zegarka.
- Konto: `zmiana_konta` → `konto_zmienione` (wysyłka zatrzymana: `wyslijZaleglosci` nic nie robi); `polacz` → jak `wlaczSynchronizacje` z `stan_silnika = NULL`; `nie_synchronizuj` → `wylaczSynchronizacje`. `wylogowano` → `brak_konta`.
- „Usuń też z iCloud” → `usunStrefe()` po „Usuń wszystkie dane” (L1: skrzynka pusta i synchronizacja wyłączona przed usunięciem wierszy).
- Licznik w konflikcie (P-220 N5): +1, −1, wpisanie i zerowanie działają (kontrakt fix-3, P-124 Q4a, „Ścieżka zapisu +1”); kandydaci liczeni przy pokazaniu; linia na liczniku i wpis w „Data and sync” (P-220 I1a, tekst 04).
- „Zastąp” i przywrócenie kopii tylko przy `wylaczona` (ADR-0005, bez zmian); `synchronizacja` i `zmiana_icloud` to stan urządzenia: przeniesienie ich nie dotyka (L1).

**Atrapa silnika w E2E (P-230 Q1a, kontrakt 07 `docs/jakosc/plan-partia-7-icloud.md`):** `src/platforma/icloud.ts` wybiera adapter: prawdziwy moduł `oczko-icloud` albo `src/platforma/icloud-atrapa.ts` przy `EXPO_PUBLIC_ICLOUD_FAKE=1` (zmienną czytają tylko te dwa pliki i `tryb-e2e.ts`; ustawia ją tylko krok buildu E2E). Atrapa implementuje ten sam port `Synchronizacja` w procesie, bez sieci: pamięta wysłane rekordy i usunięcie strefy w pliku buildu E2E; potwierdza każdą wysyłkę (`wyslane`) jak serwer, więc skrzynka zmian pustoszeje tak jak z CloudKit. Argument `oczkoE2eIcloud` = `wlaczony` | `wylaczony` | `brak-konta` (`statusKonta` → `brak_konta`) | `brak-miejsca` (wysyłka → stan `blad` z przyczyną limitu) | `konflikt` (przy starcie `odbieraj` dostaje drugą wersję pierwszego licznika: wartość +5, urządzenie „iPad (test)”, czas = teraz − 1 min, rodzic = głowa sprzed ostatniej zmiany, więc `scal` daje konflikt). Panele `e2e-icloud-wyslane`, `e2e-icloud-usuniete` (bez `t()`). Kontrole repo `ATRAPA-ICLOUD`: 07.

**Schemat CloudKit** (`cloudkit/schemat.ckdb`): generowany skryptem z `icloud-tabele.json` i `schemat.sql` (każda kolumna synchronizowanej tabeli poza `pomin` = pole; `plik.dane` = asset), test: plik w repo = wynik generatora; zmiany tylko dodające (ADR-0005, P-091). Wgranie do Development i wdrożenie do Production: krok właściciela (P-217).

**Testy oczekujące dla 07**: `domena/icloud-odwzorowanie.test.ts` (dla każdej tabeli z kontraktu: wiersz → rekord → wiersz bez zmian, kolumny `pomin` nie jadą, klucz złożony jako `json_array`), `dane/icloud-dwa-urzadzenia.test.ts` (dwie bazy A i B, sztuczny serwer przekazuje skrzynkę A do `odbieraj` B: BR-DAN-002 S1 wartość licznika, S2 konflikt z kandydatami i godziną, S3 wyłączona = pusta skrzynka; usunięcie projektu z kaskadą; zmiana po wysłaniu nie ginie; echo nie wraca; dowolna permutacja i powtórzenie dostarczeń → ten sam stan po opróżnieniu poczekalni — własność, ADR-0005), `dane/icloud-konto.test.ts` (zmiana konta, `polacz` wpisuje wszystko, `nie_synchronizuj`), `dane/icloud-pliki.test.ts` (zasób z innym SHA-256 nie trafia do magazynu). Swift (XCTest po prebuild, okno maszyn): odwzorowanie `RekordIcloud` ↔ `CKRecord` na tych samych wektorach JSON co TS.

### Przegląd 05 partii 7 (2026-10-27; P-245, P-247, P-264, P-274)
- **U1 — kontrakt błędu wysyłki (przyjęty, P-245):** `Synchronizacja.wyslij` bez zmiany sygnatury odrzuca obiektem `{ kod: 'brak_miejsca' | 'siec' | 'inny' }`. Moduł Swift zgłasza `Exception(code:)` (`BladWysylki`), adapter `src/platforma/icloud.ts` przepisuje `code` na `kod` (nieznany = `inny`), sterownik mapuje `kod` na `przyczyna` stanu `blad`. Atrapa E2E odrzuca tym samym kształtem. Zmiana listy kodów = zmiana kontraktu (05) i tekstów 04. [DO POTWIERDZENIA, okno maszyn / ZM-06]: `brak_miejsca` ustawia zdarzenie `sentRecordZoneChanges` silnika; czy przychodzi przed powrotem `sendChanges()`, dokumentacja nie mówi — jeśli później, pierwsza wysyłka przy pełnym iCloud nie zgłosi błędu, zrobi to następna.
- **U3 — wyzwalacz UPDATE tylko dla kolumn synchronizowanych (P-274 Q1a):** dla tabel z `pomin` (dziś tylko `licznik`) wyzwalacz `<tabela>_icloud_u` ma postać `AFTER UPDATE OF <kolumny tabeli poza pomin> ON <tabela>`, w `schemat.sql` i `0001.sql` razem (v1 niewydany, P-184). Zapis pamięci podręcznej po każdym +1 (`UPDATE licznik SET wartosc, glowa[, konflikt]`) nie dopisuje licznika do skrzynki; UPSERT z `DO UPDATE SET <kolumna synchronizowana>` dopisuje (sprawdzone na SQLite 3.50.4). SQLite nie sprawdza nazw w `UPDATE OF` („columns named in the "UPDATE OF" clause do not actually have to exist”, sqlite.org/lang_createtrigger.html, 2026-10-27), więc test musi dla każdej kolumny synchronizowanej sprawdzić, że jej zmiana dopisuje do skrzynki. Nowa kolumna tabeli z `pomin` trafia też na listę `UPDATE OF`.
- **U4 — kolumny nieznane i `pomin` w rekordzie z sieci (P-274 Q3a):** odbiór pomija kolumny, których tabela nie ma (zmiany schematu tylko dodające), oraz kolumny z `pomin` (liczone lokalnie) — rekord zostaje przyjęty bez nich, nie odrzucony jako `bledne_dane`. Reguła wersji pól przy migracji schematu: ADR-0027.
- **U7 — start silnika w kompozycji (przyjęty, P-247; uzupełnienie P-274 Q2a):** sterownik startuje po `uruchomDane`, poza pozycją kolejki startu, i **bez czekania**: `przygotuj()` nie czeka na `statusKonta()`, `uruchom()` ani `wyslij()` (jak skrzynka partii 6). *Dlaczego:* wysyłka czeka na sieć, a pierwszy ekran ma budżet startu (NFR-PIE-001).
- **U6a — rodzaj urządzenia w zdarzeniu (przyjęty, P-247):** `zdarzenie.urzadzenie_rodzaj` (`iphone` | `ipad`, NULL = nieznany) nie wchodzi do porównania kolizji M-14 (dobrze: ta sama treść zdarzenia z różnym opisem urządzenia to nie kolizja); wiersz inwentarza: `prywatnosc.md`.
- **U8:** podział `Licznik.tsx` przed kolejną zmianą — plan-prac 1.6 (P-268).

## Czas w przypadkach użycia (fix 2026-10-25, Z07-18)
- **Jedno źródło czasu:** port `Zegar` (`teraz(): { ms, strefa, dzien }`); domena i przypadki użycia nie wołają `Date.now()` ani `new Date()` bez argumentu. Adapter produkcyjny: zegar systemu i strefa urządzenia. Build E2E (`EXPO_PUBLIC_E2E=1`): adapter z `src/platforma/tryb-e2e.ts` czyta argument startu `oczkoE2eTeraz` (e2e/README.md) i zwraca podaną chwilę plus czas, który upłynął od startu procesu (zegar biegnie, RD-17 liczy odstępy); w buildzie wydania argument jest ignorowany (kontrola `TRYB-E2E`, `sprawdz-workflowy.mjs`). Dzięki temu granica miesiąca, północ i nowy dzień limitu są scenariuszami E2E bez zmiany zegara symulatora.
- **Przeliczenie przy zmianie daty:** przy `AppState → active` i przy powiadomieniu o istotnej zmianie czasu (`significantTimeChange`: północ, zmiana strefy, ręczna zmiana zegara) aplikacja liczy od nowa: dzień (RD-16), stan limitu i strażnika (`mozeZaczacDzien`), cel dzienny i postęp (F-61), bieżący tydzień i miesiąc (F-59, BR-DNI-003), stan Live Activity (ADR-0008 (7)) i stan zegarka. Nic nie odlicza czasu `setInterval`; aplikacja otwarta przez północ przelicza się na tym powiadomieniu.
- **Zimny start:** kolejność `migruj → scalDziennik → domknięcie zapomnianych sesji → sprzatnijKosz` (start.ts), a pierwsze +1 czeka na odczyt pamięci uprawnień Pro z pliku (KP-06; synchronicznie przy starcie, bez sieci) — bez niego strażnik nie wie, czy dzień zaczyna się z Pro. Odczyt sklepu (sieć) aktualizuje stan później, nie blokuje +1.
- **Tydzień od poniedziałku dla wszystkich języków** (P-110 Q7, jak Trening): `PIERWSZY_DZIEN_TYGODNIA = 1`; podsumowanie tygodnia i kalendarz pokazują podpis „Weeks start on Monday” (tekst i tłumaczenia: 04, 09); bez modułu natywnego i bez danych CLDR o tygodniu. Parametr `pierwszyDzienTygodnia` w `podsumowanieTygodnia` (`src/dane/repozytoria/kalendarz.ts`) jest zawsze tą stałą.
- **Ukończone w tygodniu liczone po dacie lokalnej (fix-3 2026-10-26, P-123 pkt 4, P-124 Q5a; wdraża 08 w partii 3):** `podsumowanieTygodnia` liczy dziś `ukonczono_ms` w granicach dni UTC (`src/dane/repozytoria/kalendarz.ts:63-64`), więc w strefie ≠ UTC ukończenie blisko północy trafia do złego tygodnia (np. poniedziałek 01:30 w UTC+3 = niedziela 22:30 UTC → liczone w tygodniu poprzednim). Kontrakt: nowa kolumna `projekt.ukonczono_dzien TEXT` (data lokalna z `Zegar.teraz().dzien` w chwili ukończenia, jak `zdarzenie.dzien`, RD-16 — nie przeliczana później), SQL w `dane.md` „Data ukończenia”; zapytanie: `… AND ukonczono_dzien >= ? AND ukonczono_dzien < ?` z `[od, doWyl]`. `zmienDateUkonczenia` przyjmuje `ukonczonoDzien` obok `ukonczonoMs` (ekran wybiera datę lokalną; 04). Wyrocznia testu: poniedziałek 01:30 w UTC+3 (`ukonczono_dzien` = ten poniedziałek) → tydzień od tego poniedziałku; niedziela 23:30 w UTC−5 (poniedziałek 04:30 UTC) → tydzień tej niedzieli.

## Ścieżka zapisu +1 (przypadek użycia `dodajRzad`)
Jedna transakcja w kolejce (ADR-0002), bez `await` na nic poza bazą:
1. odczyt licznika (`wartosc`, `glowa`, `zablokowany`, `konflikt`) i dni limitu miesiąca;
2. `zablokowany` → `{ ok: false, powod: 'zablokowany' }` (F-03); `wolaStraznika({ rodzaj })` → jeśli `true`, `startDnia(...)`; niedozwolone → `{ ok: false, powod: 'limit' }` (ekran pokazuje limit zawczasu, więc w praktyce dotyczy wyścigu o północy, L-04);
   `konflikt = 1` nie blokuje zmiany (fix-3 2026-10-26, P-123 pkt 10, P-124 Q4a): +1, −1, wpisanie i zerowanie idą jak zwykle z rodzicem = `glowa` (lokalna gałąź), więc liczenie nie staje; krok 3 bez zmian (`UPDATE licznik SET wartosc, glowa`, kolumny `konflikt` nie dotyka — tak robi `src/przypadki-uzycia/licznik.ts:49` przez `ustawStan` bez pola `konflikt`), `konflikt` zostaje 1, a kandydaci do wyboru (`scal` → `konflikt.kandydaci`) liczeni przy pokazaniu konfliktu zawierają nową wartość lokalnej gałęzi obok drugiej; nic nie wybiera się po cichu (BR-DAN-002 „Konflikt”, NFR-DAN-003). Konflikt zamyka tylko `rozstrzygniecie` (jedyne zdarzenie z > 1 rodzicem, M-09). Wyrocznia: licznik w konflikcie 20 | 18 (lokalna głowa 20) → +1 → kandydaci {21, 18}, `konflikt = 1`, `wartosc = 21`.
3. `INSERT zdarzenie` (rodzice = `[glowa]`), `UPDATE licznik SET wartosc, glowa`, zapis `dzien_limitu` instrukcją `zapis-dnia-limitu.sql` z `dane.md` (gdy dzień się zaczął; UPSERT z `pro = max(pro, excluded.pro)`, P-109), `UPDATE projekt SET ostatnia_praca_ms`;
4. `COMMIT`; dopiero potem haptyka, odświeżenie ekranu, `LiveActivity.aktualizuj`, `Zegarek.wyslijStan`.
Błąd w kroku 3: `ROLLBACK`, `{ ok: false, powod: 'zapis' }`, ekran pokazuje „Couldn’t save that row…” z ponowieniem (design-spec), wpis w `blad`.

Mapowanie rodzaju zdarzenia na `wolaStraznika` (P-067): `plus` → `plus`; `wpisanie` → `wpisanie`; `minus` → `minus`; `zerowanie` → `zerowanie`; `cofniecie`, `rozstrzygniecie` → `edycja-historii` (nie zaczynają dnia).

## Maszyny stanów (tabele przejść; stany z `stany.json`)
### Projekt (F-19, F-33)
| Stan | Zdarzenie | Nowy stan | Warunek / skutek |
|---|---|---|---|
| w_toku | ukoncz | ukonczony | `ukonczono_ms = teraz`; pytanie o zużycie włóczki (U-9); karta (F-53) |
| ukonczony | wznow | w_toku | `ukonczono_ms = NULL` |
| dowolny, nieusunięty | usun | (ten sam) + `usunieto_ms` | widoczny w „Ostatnio usunięte” 30 dni (`KOSZ_DNI`) |
| usunięty | przywroc | (ten sam), `usunieto_ms = NULL` | |
| usunięty, `teraz − usunieto_ms ≥ KOSZ_DNI` i `ostatni_start_ms − usunieto_ms ≥ KOSZ_DNI` (poprzedni start też po terminie; zegar cofnięty, `teraz < usunieto_ms`, niczego nie usuwa) | sprzatanie przy starcie | — (DELETE, kaskada) | dwa kolejne starty potwierdzają datę, więc jednorazowy skok zegara w przód nie kasuje (P-110 Q5a, Z07-15); `ostatni_start_ms` (ustawienie) zapisywany na końcu każdego startu; pliki bez odwołań usuwane w tej samej operacji kolejki (niżej) |
Niedozwolone (błąd domeny): `ukoncz` z `ukonczony`, `wznow` z `w_toku`, każda zmiana licznika w projekcie usuniętym. Projekt w koszu: `ukoncz`, `wznow` i ponowne `usun` niedozwolone (`niedozwolone_przejscie`), jedyne dozwolone przejście to `przywroc`; ponowne `usun` nie przesuwa terminu `usunieto_ms`, a trwałego usunięcia z kosza w 1.0 nie ma (BR-DAN-008) (fix-2, P-118 W8).

**Funkcja sprzątania kosza** (fix-2 2026-10-25, P-118 W2): warunek dwóch startów należy do domeny, bo chroni przed utratą danych i ma być testowany w Node (ARCH-03). Sygnatura: `doSprzatniecia(p, terazMs, ostatniStartMs: number | null, koszDni): boolean`; przypadek użycia startu czyta `ostatni_start_ms` z `ustawienie` (dane.md) **przed** sprzątaniem i zapisuje nowy na końcu startu. `true` tylko, gdy wszystkie warunki: projekt usunięty, `usunietoMs ≤ ostatniStartMs ≤ terazMs`, `terazMs − usunietoMs ≥ koszDni × 86 400 000` i `ostatniStartMs − usunietoMs ≥ koszDni × 86 400 000`. Wyrocznia (D = `koszDni × 86 400 000`, `u` = `usunietoMs`):
| Przypadek | `terazMs` | `ostatniStartMs` | Wynik |
|---|---|---|---|
| projekt nieusunięty | dowolny | dowolny | `false` |
| pierwszy start po aktualizacji / brak klucza | `u + 2D` | `null` | `false` (czeka na następny start) |
| dwa starty po terminie | `u + D + 1` | `u + D` | `true` (granica: równość daje `true`) |
| jednorazowy skok zegara w przód | `u + 60 dni` | `u + 1 dzień` | `false` |
| zegar cofnięty między startami | `u + D` | `u + 2D` (> `terazMs`) | `false` |
| zegar cofnięty przed usunięcie | `u − 1` | `u + D` | `false` |

**Sprzątanie plików** (ADR-0001, fix 2026-10-25, Z07-15): plik bez odwołań usuwa ta sama operacja kolejki zapisów, która usunęła ostatnie odwołanie (po `COMMIT`, przed następną operacją kolejki); sprzątanie przy starcie pomija pliki z `plik.utworzono_ms` młodszym niż `PLIKI_OCHRONA_MIN` i nie działa, gdy maszyna importu jest w stanie innym niż bezczynny (plik zapisany do magazynu przed wierszem, który go wskaże — import archiwum, import wzoru).

**Powrót do miejsca** (F-49): gdy `ostatnie_miejsce` wskazuje obiekt usunięty albo w koszu, aplikacja otwiera listę projektów i usuwa klucz `ostatnie_miejsce` (bez komunikatu; fix 2026-10-25, Z07-15).

### Sesja stopera (F-21, F-51)
| Stan | Zdarzenie | Nowy stan | Skutek |
|---|---|---|---|
| (brak) | start | trwa | `start_ms`; Live Activity z `sesjaStartMs`; jedna otwarta sesja (UNIQUE) |
| trwa | wstrzymaj | wstrzymana | `wstrzymano_ms` |
| wstrzymana | wznow | trwa | `przerwy_ms += teraz − wstrzymano_ms`, `wstrzymano_ms = NULL` |
| trwa / wstrzymana | zakoncz | zakonczona | `koniec_ms`; czas = `koniec − start − przerwy` |
| wstrzymana | zakoncz | zakonczona | jak wyżej, a najpierw `przerwy_ms += teraz − wstrzymano_ms`, `wstrzymano_ms = NULL`: koniec w pauzie dolicza bieżącą przerwę, bo czas pauzy nie jest dzierganiem (fix-2, P-118 W6; jedyna reguła zgodna z formułą P-072) |
| zakonczona | koryguj | zakonczona | `skorygowano = 1`, nowe `start_ms`/`koniec_ms` (`koniec ≥ start`), `przerwy_ms = 0`: czas = `koniec − start` wybrany w formularzu, pauzy przestają się liczyć (arkusz mówi to przed zapisem, tekst 04) — fix-6 2026-10-26, P-199 Q4a, P-195 Q2a (BR-PRJ-013, ER-54); Oczko trzyma sumę pauz, nie przedziały, więc przycięcie sumy zgadywałoby |
| trwa, `teraz − start_ms ≥ SESJA_MAKS_H` | start aplikacji | zakonczona | `koniec_ms = start + SESJA_MAKS_H`, `do_korekty = 1` (zapomniany stoper) |
| trwa / wstrzymana | scalenie przynosi otwartą sesję z wcześniejszym `start_ms` | zakonczona | `koniec_ms = start_ms`, `do_korekty = 1` (ADR-0005, uzupełnienie) |
Po zabiciu procesu sesja „trwa” odtwarza się ze znacznika (zasada 4 modułu tła).

### Synchronizacja iCloud (F-27, F-58)
| Stan | Zdarzenie | Nowy stan |
|---|---|---|
| wylaczona | wlacz (przełącznik) | aktywna albo brak_konta |
| aktywna | błąd sieci / limit iCloud | blad (komunikat jednym zdaniem, ponowienie systemowe) |
| aktywna | konto wylogowane | brak_konta |
| blad / brak_konta | ustąpienie przyczyny | aktywna |
| dowolny ≠ wylaczona | wylacz | wylaczona (dane lokalne zostają) |
| aktywna / blad / brak_konta | zmiana konta (`switchAccounts` albo `signIn` innego użytkownika, rejestr Apple 21c) | konto_zmienione (wysyłka zatrzymana, pytanie; ADR-0005, P-110 Q9a) |
| konto_zmienione | polacz | aktywna (pełne ponowne wysłanie lokalnych rekordów, scalenie przez `scal`) |
| konto_zmienione | nie_synchronizuj | wylaczona (dane lokalne zostają) |
Stany tej maszyny nie są w bazie (stan modułu natywnego), więc nie mają CHECK. Zdarzenie spoza tabeli → stan bez zmian (fix-2 2026-10-25, P-118 W5): zdarzenia przychodzą z modułu natywnego i mogą się powtarzać (np. drugie „ustąpienie przyczyny”), więc idempotentny brak zmiany, a nie błąd — inaczej niż w maszynach projektu i importu, gdzie przejście wywołuje użytkowniczka.

### Import archiwum (ADR-0004)
`sprawdzanie` (manifest, wersja, SHA-256, miejsce) → `odrzucony` (powód) | `gotowy` → wybór `scal` / `zastap` → `kopia_przed` (`VACUUM INTO`) → `wczytywanie` (krótkie transakcje w kolejce) → `gotowe` | `wycofany` (przywrócenie kopii przed). Na każdym etapie przed `wczytywanie` baza bez zmian. `blad` przed `wczytywanie` (np. `VACUUM INTO` bez miejsca w `kopia_przed`) → `odrzucony` z powodem; ten sam krok usuwa niepełny plik kopii przed (fix-2 2026-10-25, P-118 W3). `bazaZmieniona(s)` = „ta operacja zmieniała bazę”: `false` przed `wczytywanie`, `true` w `wczytywanie`, `gotowe` i `wycofany` — po wycofaniu dane równe kopii przed, ale przypadek użycia i tak odświeża odczyty ekranów, stan Live Activity i zegarka (P-118 W4).

## Konfiguracja (`src/konfiguracja.ts`)
| Nazwa (jednostka) | Wartość | Źródło |
|---|---|---|
| `LIMIT_DNI_W_MIESIACU` (dni) | 5 | P-057 (D2), `limit.mjs` |
| `PRZERWA_NOWEGO_DNIA_MS` (ms) | 3 600 000 | P-057 (D3), `limit.mjs` |
| `OKNO_OFFLINE_PRO_MS` (ms) | 604 800 000 (7 dni) | P-103 (3a), `dostep.mjs` `LASKA_OFFLINE_MS` (jak Trening `OFFLINE_GRACE_DAYS = 7`): pamięć Pro przy błędzie sklepu działa do `wygasa` + ta wartość; ta sama liczba w stałych Swift `proZegarka` (KP-17, generator stałych z JSON, Z07-12) |
| `STRAZNIK_SERIA_ZDARZEN` (liczba dodań) | 3 | RD-17, P-047 |
| `STRAZNIK_OKNO_S` (s) | 2 | RD-17, P-047 |
| `KOSZ_DNI` (dni) | 30 | P-026 |
| `SKRZYNKA_PORZUCONE_H` (h) | 1 [OCENA 05, fix-7] | katalog zlecenia bez manifestu usuwany po tym czasie (rozszerzenie mogło jeszcze kopiować) |
| `MIGAWKA_WERSJA` (wersja formatu) | 1 | koperta migawki projektów w App Group (P-220 N2) |
| `ICLOUD_W_1_0` (flaga) | `false` do zaliczonego testu „rekord z telefonu widoczny na iPadzie” | ZM-06, P-091 (1), P-218 Q5a; zmienia koordynator |
| `KOPIA_PRZED_IMPORTEM_DNI` (dni) | 30 | ADR-0004 (jak F-33) |
| `STAN_NAZWA_MAKS_ZNAKOW` (znaki) | 60 | [OCENA] roli 05 (Z07-12): nazwa na ekranie blokady i zegarku; ładunek < 4 KB (rejestr Apple 1b) |
| `STAN_PRZYPOMNIENIA_MAKS` (liczba) / `STAN_PRZYPOMNIENIE_TEKST_MAKS` (znaki) | 3 / 40 | [OCENA] roli 05 (Z07-12): plan przypomnień w stanie Live Activity i zegarka |
| `SESJA_MAKS_H` (h) | 8 | P-072 (7a); limit Live Activity 8 h (rejestr Apple 1a) |
| `PROG_NIEUDANYCH_STARTOW` (starty) | 2 | P-080 (interpretacja do weta), ADR-0019 (strażnik startu, rola 12) |
| `KOPIE_RATUNKOWE_DNI` (dni) | 30 | P-080, ADR-0020 (kopia ratunkowa, rola 12) |
| `WERSJA_SCHEMATU` (-) | 1 | `schemat.sql` |
| `WERSJA_FORMATU_ARCHIWUM` (-) | 1 | ADR-0004 |
| `ROZSZERZENIE_ARCHIWUM` | `.oczko` | ADR-0004 |
| `ZAPAS_MIEJSCA_EKSPORTU` (×rozmiar) | 2 | [OCENA] roli 05: archiwum + plik tymczasowy; do korekty po pomiarze |
| `BLEDY_MAKS_WIERSZY` (wiersze) | 200 | [OCENA] roli 05 (F-57: ostatnie błędy bez treści) |
| `DZIENNIK_BLAD_TEKST_MAKS` (znaki) | 4096 | ADR-0008 (3′) (fix-3 05, P-124): najdłuższy tekst uszkodzonej linii dziennika +1 w `blad` (linia ma tylko identyfikatory, czas i strefę, NFR-PRY-001) |
| `PLIKI_OCHRONA_MIN` (min) | 10 | [OCENA] roli 05 (Z07-15): plik młodszy niż to nie jest sprzątany przy starcie (zapis pliku przed wierszem odwołania) |
| `RYSUNEK_ZAPIS_MS` (ms) | 1000 | ADR-0012 (uzupełnienie, Z07-17): najdłuższe opóźnienie zapisu rysunku |
| `WZOR_MAKS_MB` (MB) | 200 | [OCENA] roli 05 (Z07-17): największy plik przyjmowany przez rozszerzenie udostępniania; do korekty po pomiarze |
| `PIERWSZY_DZIEN_TYGODNIA` (1 = poniedziałek) | 1 | P-110 (Q7): tydzień od poniedziałku dla wszystkich języków, jak Trening |
| `POCZEKALNIA_DNI` (dni) | 7 | P-110 (Q1a): po tym czasie „niepełna historia” w Stanie danych, rekord zostaje |
| `ZEGAREK_PONOWIENIE_MS` (ms) | 900 000 (15 min) | [OCENA] roli 05 (fix-4, P-135 Q2a): ponowna wysyłka niepotwierdzonej linii z kolejki zegarka (ADR-0009, 2026-10-26 pkt 5); ta sama liczba w stałych Swift (`zegarekPonowienieMs`, generator) i w wektorach `zegarek_skrzynka` |
| `ZEGAREK_POTWIERDZENIA_MAKS` (id) | 256 | [OCENA] roli 05 (fix-4, P-135 Q2a): ostatnie potwierdzone id zegarka w kontekście aplikacji (ok. 9 KB); nadmiar wraca ponowieniem i potwierdza się w następnej partii |
| `ODSTEP_PROSBY_DNI` (dni) | 14 | P-150 E2-1a, jak Trening (`REVIEW.MIN_GAP_DAYS`); HIG „Ratings and reviews”: „Consider allowing at least a week or two between requests” (`docs/wzrost.md`) |
| `PROSB_NA_WERSJE` (prośby na wersję) | 1 | P-150 E2-1a, jak Trening; wartość > 1 wymaga licznika w kluczu `ostatnia_prosba_o_ocene` (zmiana kontraktu) |
| `PARTIA_SYNCHRONIZACJI` (wiersze na transakcję) | 200 | [OCENA] roli 05: krótkie transakcje przy scalaniu iCloud i importu (E3 §1); do korekty po pomiarze |
| `MIN_IOS` / `MIN_WATCHOS` | 18.0 / 11.0 | P-070, ADR-0006 |
| `PRODUKTY_PRO` (ID) | [DO USTALENIA] | P-038 (przy konfiguracji App Store Connect) |
| `CENY` | z App Store (StoreKit), nie z kodu | P-057, KP-* |
| Liczby obliczeń F-38, tabele drutów i szydełek RD-11/RD-19, kategorie grubości RD-10 | `docs/tresci/parametry.json` (rola 06) → kopia `src/domena/obliczenia/parametry.ts` | rejestr merytoryczny roli 06 (D-027); kopię tworzy `node scripts/domena/generuj-parametry.mjs` (ręcznie nie edytować), zgodność pilnuje `tests/domena/obliczenia/parametry-kopia.test.ts` w `verify` (P-118 S4) |
