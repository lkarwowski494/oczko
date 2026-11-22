# E0 Rozpoznanie (rola 05-architekt, build) · 2026-10-22 · STOP E0 przyjęty (P-070: Q1 a, Q2 c, Q3 a)
Prompt: `prompts` @97ec212, `node tools/assemble.mjs 05-architekt --tryb build` (kopia: `oczko-warsztat/05-architekt/2026-10-22-build/05-build-prompt-2026-10-22.md`). Wejście: `docs/scope-contract.md` (P-052), `docs/design/design-spec.md` (04 E4), BRD `docs/brd/wymagania.md` (NFR), `docs/monetyzacja.md` (V4, P-057–P-068), `docs/decyzje.md` do P-069.

## 1. Środowisko (ETAP 0)
| Sprawdzenie | Wynik |
|---|---|
| System, Node, git | Linux x86_64 (chmura), Node v22.22.0; gałąź `claude/jolly-thompson-paz6d8` czysta na `cdc1b99` |
| Gałęzie zdalne (`git ls-remote --heads origin`) | `main` ad8d6b0, `claude/jolly-thompson-paz6d8` cdc1b99, `claude/bold-meitner-5psv0z`, `claude/compassionate-shannon-ug7tqb` (poprzednie sesje) |
| GitHub | push działa (gałąź robocza, `oczko-warsztat` na `main`, P-010) |
| Przeglądarka | Playwright 1.56.1 + Chromium (zrzuty roli 04) |
| Xcode, symulator iOS | brak (Linux): wszystko natywne (Live Activity, zegarek, PencilKit, rozszerzenie) sprawdzalne dopiero w CI na runnerze macOS (rejestr Apple, wiersz 12: darmowy w repo publicznym) |
| SQLite do eksperymentów | `node:sqlite` 3.50.4 (brak `sqlite3` CLI) |
| Sieć | docs.expo.dev, developer.apple.com, sqlite.org, registry.npmjs.org: 200 |
| Widoczność repo | `oczko` publiczne, `oczko-warsztat` prywatne |
| Wyjątek nazwany od zasady 19 | ta sama sesja co role 01, 02 i 04 (fix) — właściciel kazał „działaj dalej” (P-069); kontekst po streszczeniu |

Istniejący kod (P-004, materiał do decyzji o ponownym użyciu, nie dowód działania): `src/core/database.ts` i `database-schema.ts` (10 tabel: `projects`, `project_parts`, `counters`, `counter_events`, `stash_yarns`, `stash_tools`, `pattern_documents`, `project_time_sessions`, `app_entitlements`, `app_settings`), baza w `Library/SQLite/oczko.db` (`db-path.ts`); zapis przez `withTransactionAsync`, **bez `PRAGMA foreign_keys` i bez `user_version`** (grep: 0 trafień). `app.json`: bundle `com.apps4brew.knitting`, `supportsTablet: false`, tylko pion. Wniosek: wersja 0.1.0 (TestFlight 1004) mogła zostawić na urządzeniu bazę bez numeru wersji schematu — pytanie Q2.

## 2. Przepływ → technika
Przepływy w zakresie według kontraktu (`docs/scope-contract.md`, „Kolejność i przekazanie”, 05): PR-01–PR-11, PR-13 (tylko wpisanie wartości trwającej robótki, BR-LIC-017), PR-14, PR-15, PR-16 bez BR-DNI-007. PR-12 (słownik) poza zakresem. Stany z projektu: `docs/design/design-spec.md` (macierz stanów) i `docs/design/ekrany.html`.

| Przepływ (F) | Dane czytane / zapisywane | Zdarzenia | Praca w tle | Offline | Uprawnienia | Stany z projektu wymagające techniki |
|---|---|---|---|---|---|---|
| PR-01 pierwsze liczenie (F-01, F-10, F-14, F-31; NFR-PIE-001) | zapis: projekt i licznik tworzone przy pierwszym +1, zdarzenie licznika, dzień limitu (`startDnia`); odczyt: stan limitu (`mozeZaczacDzien`) | stuknięcie; data i godzina (dzień, północ L-04) | brak | 100% | brak (żadnej prośby przed licznikiem) | `licznik-start`; błąd zapisu („Couldn’t save that row…”); pierwsze +1 bez ekranów |
| PR-02 liczenie w sesji (F-01–F-03, F-45, F-47, F-49, F-10) | zapis każdego +1/−1/wpisania/zerowania jako zdarzenia z godziną (BR-LIC-003), cofnięcie; odczyt historii; ostatnie miejsce (F-49) | stuknięcie, seria stuknięć (strażnik tempa RD-17), czas | brak; ekran nie gaśnie (`isIdleTimerDisabled`) | 100% | brak | zablokowany licznik, baner „Cofnąć?”, `limit-zawczasu`, błąd zapisu |
| PR-03 powtórzenia i części (F-04, F-05, F-08, F-46, F-52) | liczniki projektu, długość powtórzenia, cel części, licznik całości, bliźniak | stuknięcie | brak | 100% | brak | osiągnięty cel („Następna część / Druga taka sama”) |
| PR-04 „co N rzędów” (F-06, F-48) | reguła przypomnienia (od, co N, M razy), plan rzędów liczony czystą funkcją | stuknięcie przy rzędzie z przypomnieniem; dwa wzorce wibracji | brak (przypomnienie na ekranie licznika, nie powiadomienie; 04 nie użyło powiadomień) | 100% | brak (bez powiadomień) | przypomnienie zmienia cały ekran |
| PR-05 bez sięgania po telefon (F-11, F-12, F-21; F-13 PÓŹNIEJ) | ten sam licznik z ekranu blokady i zegarka; zdarzenia z innego procesu/urządzenia; dzień limitu (P-067: +1 z każdego urządzenia zaczyna dzień) | stuknięcie w Live Activity / na zegarku; przerwana łączność telefon–zegarek | **tak**: akcja +1 w Live Activity przy zablokowanym ekranie (App Intent), aplikacja na zegarku, synchronizacja telefon–zegarek | 100% (zegarek bez telefonu w pobliżu, P-039) | brak próśb; Live Activity włączana przez użytkownika w Ustawieniach systemu | stan zegarka (F-58), limit zawczasu na zegarku i ekranie blokady (KP-12, KP-13) |
| PR-06 praca ze wzorem (F-24–F-26, F-28, F-55, F-56) | pliki wzorów (PDF, zdjęcie, strona WWW zapisana offline, Word), znacznik rzędu, zakreślenia i rysunki (PencilKit); notatki | import z arkusza udostępniania, z Plików, aparatem; rysik; obrót telefonu | rozszerzenie udostępniania (osobny proces, kopiuje plik do aplikacji) | 100% po imporcie; pobranie strony WWW wymaga sieci w chwili udostępnienia | aparat (zdjęcie wzoru); zdjęcia przez systemowy wybór bez uprawnienia [do potwierdzenia w rejestrze] | poziomo wzór + licznik; import nieudany; plik za duży; brak miejsca |
| PR-07 projekt do archiwum (F-14–F-20, F-33, F-37, F-50–F-54, F-60) | projekt, części, notatka, zdjęcia, druty i próbka, stan, ukończenie, zużycie włóczki, „Ostatnio usunięte” 30 dni, karta ukończenia (obraz) | stuknięcia; upływ 30 dni (czyszczenie przy uruchomieniu, nie w tle) | brak | 100% | aparat, zdjęcia | ukończenie, karta, prośba o ocenę (BR-DAN-012, rola 11) |
| PR-08 nowy telefon, iPad (F-27, F-31–F-33, F-58) | cała baza i pliki: eksport do pliku, import „scal / zastąp”, kopia urządzenia, opcjonalna synchronizacja iCloud | włączenie przełącznika; sieć; konto iCloud wylogowane / pełne | synchronizacja iCloud (system wznawia; nie w krytycznej ścieżce zapisu) | lokalnie 100%; synchronizacja po powrocie sieci | brak próśb (iCloud to uprawnienie aplikacji w podpisie, nie prośba) | stan synchronizacji jednym zdaniem (F-58), konflikt (NFR-DAN-003), plik nowszej wersji odrzucony |
| PR-09 zakup i przywrócenie (F-35, KP-01–KP-15) | uprawnienie Pro z bieżących transakcji (P-036), dni limitu; bez własnego serwera | zakup, przywrócenie, zmiana transakcji, Family Sharing, wygaśnięcie | nasłuch aktualizacji transakcji przy uruchomieniu | Pro działa bez sieci po potwierdzeniu (BR-ZAK-001); zakup wymaga sieci | brak | `oferty`, `limit`, `limit-zawczasu`, „Przywróć zakupy” |
| PR-10 zapas (F-37) | włóczki, narzędzia, zdjęcie etykiety, przypisanie do projektu, zużycie | stuknięcia | brak | 100% | aparat, zdjęcia | zużycie pytane przy ukończeniu |
| PR-11 obliczenia (F-38) | dane wejściowe i wynik zapisany w projekcie; liczby z rejestru roli 06 | stuknięcia | brak | 100% | brak | wynik z danymi wejściowymi |
| PR-13 przeniesienie trwającej robótki (F-45) | wpisanie wartości jako zdarzenie; zaczyna dzień limitu jak +1 (D4, P-067 `wolaStraznika`) | stuknięcie w liczbę | brak | 100% | brak | pole wartości |
| PR-14 czas i postęp (F-21, F-51, F-60) | sesje stopera ze znacznikami początku/końca (czas z zapisanych znaczników, nie odliczanie), korekta, procent z celów | start/stop, zablokowanie ekranu, zabicie procesu w trakcie sesji | stoper widoczny w Live Activity (system liczy czas od znacznika) | 100% | brak | sesja w toku po ponownym uruchomieniu |
| PR-15 zgłoszenie, ocena, stan danych (F-57, F-58, BR-DAN-012) | diagnostyka lokalna (wersje, liczności, błędy bez treści projektów), stan synchronizacji i zegarka | stuknięcie; ukończenie projektu → prośba o ocenę | brak | podgląd offline; wysyłka arkuszem systemowym | brak | podgląd tego, co zostanie wysłane |
| PR-16 dni, postęp, termin (F-59–F-61) | agregaty z historii zdarzeń i sesji po dniach (strefa czasowa urządzenia), termin, cel dzienny | upływ dnia, zmiana strefy | brak | 100% | brak | kalendarz bez danych; projekt bez celu |

Wniosek dla modułów: dane użytkownika relacyjne z historią i agregatami po dniach → `dane-lokalne-sqlite`; ekran blokady, zegarek, rozszerzenie udostępniania i iCloud → `tlo-i-sensory-ios` w części „zadania poza aplikacją, zawieszenie z blokadą pliku, wspólny kontener”; brak treści wersjonowanych osobno od kodu (słownik PÓŹNIEJ, liczby obliczeń w kodzie z rejestru 06) → `pakiety-tresci` nie.

## 3. Skala danych ([OCENA]; skrypt `eksperymenty/e0/skala.mjs`, kod wyjścia 0)
Założenia: profil darmowy 60 dni z robótką/rok × 80 zdarzeń/dzień, 4 projekty, 3 wzory; intensywny (Pro) 250 dni × 200 zdarzeń, 15 projektów, 20 wzorów, 8 zdjęć/projekt; wiersz zdarzenia ≈ 120 B z indeksem (szacunek 2026-10, zaniżony ok. 3×: pomiar na schemacie aplikacji daje ok. 384 B na zdarzenie, ADR-0001); PDF ≈ 3 MB, zdjęcie ≈ 0,6 MB, strona rysunku ≈ 40 KB.

| Profil | Zdarzenia licznika | Projekty | Baza — dawny szacunek 2026-10 | Baza — pomiar `VACUUM INTO` (ADR-0033, 2026-11-03) | Pliki (wzory, zdjęcia, rysunki) |
|---|---|---|---|---|---|
| darmowy, 1 rok | 4 800 | 4 | ≈ 0,6 MB (dawny szacunek) | 2,1 MB | ≈ 19 MB |
| darmowy, 3 lata | 14 400 | 12 | ≈ 1,8 MB (dawny szacunek) | 5,9 MB | ≈ 57 MB |
| intensywny, 1 rok | 50 000 | 15 | ≈ 6,1 MB (dawny szacunek) | 19,6 MB | ≈ 138 MB |
| intensywny, 3 lata | 150 000 | 45 | ≈ 18,4 MB (dawny szacunek) | 58,4 MB (57,6 MB w pomiarze samych zdarzeń, ADR-0001) | ≈ 415 MB |

Wnioski: (1) baza jest mniejsza od plików: według pomiaru pliki to ok. 88–91% objętości (dawny szacunek: 96–98%) → pliki poza bazą, w bazie tylko odwołanie, rozmiar i SHA-256; (2) historia zdarzeń to jedyna duża tabela → zapytania licznika i kalendarza po indeksie `(licznik, czas)` i agregatach dnia, `EXPLAIN QUERY PLAN` na 150 000 zdarzeń w E2; (3) eksport z plikami może mieć setki MB → zapis strumieniowy, sprawdzenie miejsca przed zapisem (required reason E174.1), praca na pierwszym planie albo z ochroną czasu w tle (0xdead10cc); (4) synchronizacja plików przez iCloud zużywa miejsce użytkownika (rejestr Apple 8a), nie nasze pieniądze. Pakietów treści brak.

## 4. Rejestr ograniczeń platformy
Pełne tabele z adresem, cytatem i datą odczytu 2026-10-22: [`rejestr/apple.md`](rejestr/apple.md) (44 wiersze), [`rejestr/expo.md`](rejestr/expo.md) (32), [`rejestr/sqlite.md`](rejestr/sqlite.md) (23 + 4 eksperymenty z kodem wyjścia 0, `eksperymenty/e0/`). Kopie pobranych stron: `oczko-warsztat/05-architekt/2026-10-22-build/e0-zrodla/`. Zebrane przez trzech subagentów; tezy decydujące sprawdziła rola 05 w pobranych plikach (oznaczone ✔).

Ograniczenia, które zmieniają decyzje:
| # | Ograniczenie | Skutek dla architektury |
|---|---|---|
| G-01 ✔ | Expo SDK 57: iOS **16.4+**, Xcode 26.4+ (expo 1a) | dolna granica OP-26; wyżej, jeśli wymaga tego funkcja |
| G-02 ✔ | Przycisk w Live Activity = `LiveActivityIntent`, **iOS 17.0+**; `perform()` działa „in the app’s process” i system uruchamia aplikację „without opening the app” (apple 1e, 1f) | +1 z ekranu blokady (F-11) to kod natywny w procesie aplikacji, bez gwarancji działającego JS |
| G-03 ✔ | Sprzeczność Apple: WidgetKit „On a locked device, buttons and toggles are inactive … unless a person authenticates”; App Intents `alwaysAllowed` „including when the device is locked” (apple 1g) | czy +1 działa bez odblokowania, nie da się rozstrzygnąć z dokumentacji ani automatem w CI (P-041) → Q3 |
| G-04 ✔ | Plik z klasą `Complete` „cannot be read from or written to while the device is locked”; domyślna klasa to „until first user authentication” (apple 3a, 3b) | baza i dziennik +1 w klasie domyślnej; po restarcie przed pierwszym odblokowaniem +1 niemożliwe (stan do obsłużenia) |
| G-05 ✔ | `0xdead10cc`: „held on to a file lock or SQLite database lock during suspension” (apple 2b) | każdy zapis krótki i zamknięty przed końcem `perform()` i przed zawieszeniem; dłuższe operacje z ochroną czasu |
| G-06 ✔ | `expo-sqlite` kompiluje własne `sqlite3.c` (expo 13); sqlite.org: dwie kopie SQLite w jednej aplikacji mogą uszkodzić bazę (sqlite 9c) | natywna intencja nie może pisać do tej samej bazy systemową `libsqlite3` → osobny dziennik albo ten sam moduł (ADR-0008) |
| G-07 ✔ | `withExclusiveTransactionAsync` otwiera **nowe połączenie** (`expo-sqlite@57.0.4`, `src/SQLiteDatabase.ts:789` `useNewConnection: true`); klucze obce są wyłączone domyślnie na każdym połączeniu (sqlite 1a) | kalibracja biblioteki potwierdzona: jedna kolejka zapisów na połączeniu z `foreign_keys = ON`, bez wariantu wyłącznego |
| G-08 ✔ | `INSERT OR REPLACE` skasował dzieci (2 → 0), UPSERT zachował (2 → 2); `PRAGMA foreign_keys=OFF` w transakcji bez skutku; kopia samego `.db` w WAL: 0 ze 100 wierszy przy `integrity_check = ok`, `VACUUM INTO`: 100 (eksperymenty A, B, D) | UPSERT, 12 kroków z `OFF` przed `BEGIN`, kopia przez `VACUUM INTO`; `integrity_check` nie wykrywa utraty — test liczności |
| G-09 ✔ | `expo-widgets` (oficjalny, SDK 57): przycisk widżetu zwraca nowe właściwości „with no running app process required”, iOS 17+ (expo 6d) | wygodny do wyświetlania, ale +1 z niego nie trafia do bazy aplikacji → do porównania w ADR-0007/0008 |
| G-10 | Zegarek i rozszerzenie udostępniania: brak wsparcia Expo pierwszej klasy („experimental”, expo 6b); `@bacons/apple-targets` 5.0.0: „I haven't tested all of these” | aplikacja na zegarku i rozszerzenie to własny kod Swift w osobnych celach → ADR-0007 |
| G-11 | `expo-iap`: przypięta w Treningu 5.8.1 (2026-09-26), najnowsza 6.1.1 (2026-10-18), **bez watchOS** (podspec: iOS, tvOS) (expo 5) | Pro na zegarku natywnym StoreKit 2 (`currentEntitlements`, watchOS 8+) albo stanem z telefonu (OP-22) → ADR-0009, ADR-0010 |
| G-12 | WatchConnectivity: `transferUserInfo` kolejkuje i dostarcza wszystko po kolei (symulator nie obsługuje); `updateApplicationContext` tylko ostatni stan (apple 4a–4c) | zdarzenia +1 z zegarka kolejką `transferUserInfo`, stan (wartość, Pro, limit) przez kontekst; test automatyczny tylko na symulowanym transporcie (NFR-ZEG-001) |
| G-13 | CloudKit: prywatna baza liczy się do iCloud użytkownika (apple 8a); `CKSyncEngine` iOS 17 / watchOS 10 (8c); KVS 1 MB (8b); brak oficjalnego modułu Expo, `expo-cloudkit` 0.20.8, `react-native-cloud-store` ostatnio 2024-04-11 (expo 10) | iCloud = własny moduł natywny; koszt 0 zł (ZAL-003 utrzymane) → ADR-0005 |
| G-14 | Wersje iOS na iPhone'ach (7.06.2026): iOS 26 79%, iOS 18 14%, wcześniejsze 7% (apple 14) | minimalna wersja 17 albo 18 traci ≤ 7% urządzeń → Q1 |
| G-15 | Haptyka nie działa w trybie niskiego zasilania, przy aparacie i dyktowaniu (expo 7); Core Haptics zatrzymuje silnik w tle (apple 13a) | +1 zawsze z potwierdzeniem wizualnym (już w projekcie 04); wibracji nie traktujemy jako dowodu zapisu |
| G-16 | Required reason API: dysk przed zapisem E174.1 (nie 85F4.1), UserDefaults wspólne z rozszerzeniem przez App Group 1C8F.1, nie CA92.1 (apple 11) | stary `app.json` ma CA92.1 i DDA9.1 — do inwentarza roli 10 po ADR o App Group |
| G-17 | Runnery macOS GitHub „free and unlimited” w repo publicznym; EAS Free 15 buildów iOS/mies. (apple 12, expo 12a) | build i testy natywne bez kosztu → ADR-0014 |
| G-18 | Review 3.1.1 przywracanie, 3.1.2 subskrypcja ≥ 7 dni na wszystkich urządzeniach użytkownika, 2.5.4 tło zgodnie z przeznaczeniem (apple 10a–10c) | Pro także na iPadzie i zegarku (zgodne z PR-09) |

Otwarte w rejestrze ([DO USTALENIA]): App Group w kopii zapasowej (apple 9b), widoczność zakupu z iPhone'a na zegarku bez telefonu (4e), haptyka z Live Activity (13b), watchOS w tabeli Expo (expo 1c), oficjalny przepis CI na GitHub Actions (expo 12b). Każde ma w E1 eksperyment w CI albo wariant, który od niego nie zależy.

## 5. Stosowalność modułów
| Moduł | Decyzja | Powód |
|---|---|---|
| `dane-lokalne-sqlite` | **tak** | relacyjne dane użytkownika z historią zmian (BR-LIC-003), agregaty po dniach (F-59), kaskady części → liczników → zdarzeń, „Ostatnio usunięte” 30 dni (F-33); ok. 58 MB po 3 latach (pomiar, ADR-0001, ADR-0033; dawny szacunek 18 MB) |
| `tlo-i-sensory-ios` | **tak, w części** | bez lokalizacji i dźwięku; dotyczy: intencja +1 w procesie uruchomionym bez interfejsu (G-02), zawieszenie z blokadą pliku (G-05), wspólny kontener (App Group) z osobnym ADR (zasada 5 modułu), stoper ze znaczników czasu (zasada 4), zegarek i transport, tryby tła tylko dla przepływów z kontraktu (2.5.4) |
| `pakiety-tresci` | **nie** | brak treści wersjonowanych osobno od kodu: słownik F-44 PÓŹNIEJ, liczby obliczeń F-38 z rejestru roli 06 trafiają do `konfiguracja.ts`; wzory to pliki użytkownika, nie pakiety |
| kod z innych aplikacji | **tylko wskazany** | P-036 wskazuje wzorzec zakupów z Treningu (`lkarwowski494/trening` @8b2c14c); innego repo właściciel nie wskazał, więc z nich nie biorę |

## 6. Założenia z wejścia (rejestr `docs/zalozenia.md`)
| ID | Na czym stoi E0 | Stan po E0 |
|---|---|---|
| ZAL-003 | koszt 0 zł bez konta i usług | utrzymane: CloudKit liczy się do iCloud użytkownika (G-13), CI macOS darmowe (G-17); zegarek bez usług |
| ZAL-005 | nikt poza właścicielem nie płacił | bez wpływu na dane; czy ktoś poza właścicielem ma dane w 0.1.0 — Q2 |
| ZAL-030 (nowe, 05) | +1 z ekranu blokady działa bez odblokowania telefonu | **hipoteza z dokumentacją sprzeczną** (G-03); zależy od niej F-11, BR-LIC-014, U-4 → Q3 |

## 7. ADR do podjęcia w E1 (każdy ≥ 2 opcje, „Potwierdzenie”)
| ADR | Problem | Opcje (wstępnie) | Eksperyment |
|---|---|---|---|
| 0001 | Przechowywanie danych użytkownika | SQLite (`expo-sqlite`) · pliki JSON z wersją formatu · magazyn klucz-wartość; pliki wzorów i zdjęć poza bazą | zapis 150 000 zdarzeń i zapytanie dnia w `node:sqlite` |
| 0002 | Ścieżka zapisu i transakcje | jedna kolejka na połączeniu z `foreign_keys = ON` · `withTransactionAsync` bez kolejki · `withExclusiveTransactionAsync` (odrzucane, G-07) | test kolejki na atrapie portu |
| 0003 | Granice modułów i stan interfejsu | domena w czystym TS + porty · logika w komponentach; stan: komponenty i kontekst · zewnętrzny magazyn | `granice.mjs` na szkielecie drzewa |
| 0004 | Kopia, eksport, import „scal / zastąp” | plik archiwum (baza z `VACUUM INTO` + pliki + manifest z wersją i SHA-256) · JSON + pliki · tylko kopia systemowa | odrzucenie pliku nowszej wersji |
| 0005 | Synchronizacja iCloud (F-27, NFR-DAN-003) | CloudKit prywatny z dziennikiem zdarzeń (`CKSyncEngine`, iOS 17+) · plik w iCloud Drive (ostatni zapis wygrywa) · bez synchronizacji (P-021 warunek powrotu) | scalenie dwóch dzienników z odwróconą kolejnością (czysta funkcja) |
| 0006 | Minimalne wersje iOS i watchOS (OP-26) | 16.4 · 17 · 18 | — (Q1) |
| 0007 | Budowa celów natywnych (Live Activity, zegarek, rozszerzenie) | `expo-widgets` + własne cele · `@bacons/apple-targets` · własny config plugin | `expo prebuild` w CI |
| 0008 | +1 i stoper z ekranu blokady (F-11, F-21) | intencja zapisuje do dziennika w App Group, aplikacja scala przy uruchomieniu · intencja zapisuje do bazy tym samym SQLite · przycisk otwiera aplikację, Live Activity tylko pokazuje | test scalenia dziennika (idempotencja po UUID) |
| 0009 | Zegarek: transport, limit i Pro bez telefonu (F-12, P-039, OP-22) | zdarzenia `transferUserInfo` + stan kontekstem · zegarek z własną bazą i synchronizacją przez iCloud; Pro: stan z telefonu · StoreKit na zegarku · oba | symulowany transport (NFR-ZEG-001) |
| 0010 | Zakupy (P-036) | `expo-iap` 5.8.1 jak Trening · 6.1.1 · własny moduł StoreKit 2 | — |
| 0011 | Import wzorów (F-24, F-55) | rozszerzenie udostępniania kopiujące plik · tylko „Otwórz w” i Pliki; WWW i Word: zapis do PDF na urządzeniu · zapis źródła | — |
| 0012 | Rysik i zakreślacz (F-28, F-56) | PencilKit w widoku natywnym (Expo Modules API) · rysowanie w RN (SVG) dla palca i rysika | — |
| 0013 | Maszyny stanów (projekt, sesja stopera, limit dnia) | maszyna w domenie z tabelą przejść · flagi | „stany ⊆ CHECK” |
| 0014 | Build i CI | runner macOS GitHub (`prebuild` + `xcodebuild`) · EAS Free (15/mies.) | jeden build w CI |
| 0015 | Dane wersji 0.1.0 (TestFlight) | migracja starej bazy · import z pliku eksportu starej wersji · świadomy czysty start | test na bazie zbudowanej ze starego schematu |

Poza ADR roli 05: raportowanie awarii (rola 12), manifest i etykieta (rola 10), wygląd stanów (rola 04).

## 8. Pytania produktowe (rozstrzyga właściciel)
**Q1. Minimalna wersja iOS (OP-26, NFR-SYS-001)**
- (a) **iOS 18** (watchOS 11): wszystkie potrzebne API (przycisk Live Activity, `CKSyncEngine`) bez wariantów; traci ≤ 7% iPhone'ów (G-14); mniej symulatorów w CI. **Rekomendacja.**
- (b) iOS 17 (watchOS 10): te same API; część z owych 7% wraca, ale dokładnego udziału iOS 17 Apple nie podaje [DO USTALENIA]; jedna wersja systemu więcej do testów.
- (c) iOS 16.4 (minimum Expo): +1 z ekranu blokady i iCloud wymagają wariantu zastępczego na 16.x (dwie ścieżki kodu, więcej testów).

**Q2. Dane z wersji 0.1.0 (TestFlight build 1004, bundle `com.apps4brew.knitting`)**
- (a) **Migracja starej bazy przy pierwszym uruchomieniu nowej wersji**, w transakcji, z testem na bazie zbudowanej ze starego schematu (`src/core/database-schema.ts`) i porównaniem liczności (NFR-DAN-001). Kosztuje ADR-0015 i jeden test. Bezpieczne, nawet jeśli dane ma tylko właściciel. **Rekomendacja.**
- (b) Import z pliku eksportu starej wersji (`backup-service.ts`): mniej kodu w ścieżce startu, ale kto nie zrobi eksportu, ten traci dane.
- (c) Świadomy czysty start: najmniej pracy, dopuszczalny tylko jeśli potwierdzisz, że danych w 0.1.0 nie ma nikt poza Tobą i ich nie potrzebujesz (wyjątek nazwany od „Zero utraty danych”).
- Pytanie pomocnicze: czy ktoś poza Tobą ma 0.1.0 z TestFlight? [DO USTALENIA]

**Q3. +1 z ekranu blokady, którego nie da się sprawdzić automatem (F-11, G-03, ZAL-030, P-041)**
- (a) **Budujemy przycisk +1 w Live Activity (ADR-0008, dziennik w App Group) i stoper; zachowanie przy zablokowanym telefonie to ryzyko szczątkowe**, zapisane w kontrakcie, sprawdzane po wydaniu przez F-57 i recenzje; jeśli system wymaga odblokowania, użytkownik zobaczy systemowe uwierzytelnienie, a liczba się zapisze po nim. **Rekomendacja.**
- (b) Live Activity tylko pokazuje rząd i czas; +1 otwiera aplikację: zero ryzyka zapisu, ale F-11 traci sens (U-4 „rząd (+1) i czas razem”) → zmiana zakresu przez rolę 03.
- (c) Jak (a), ale po jednym teście na Twoim iPhonie przed wydaniem (5 minut, wyjątek od P-041).

## 9. Plan i szacunek czasu
| Etap | Praca agenta | Oczekiwanie | Czas właściciela |
|---|---|---|---|
| E1 decyzje: 15 ADR + 4 eksperymenty (`node:sqlite`, czyste funkcje) | ok. 2–3 h | brak | ok. 15 min (pytania E1, głównie techniczne z rekomendacją) |
| E2 moduły, dane, konfiguracja: drzewo, porty, ERD, `schemat.sql` z dowodem, ścieżki utraty danych | ok. 2 h | brak | ok. 10 min |
| E3 tło, błędy, prywatność, budżety, lista kontroli dla 07, `granice.mjs` | ok. 1,5 h | brak | ok. 10 min |
| E4 README architektury, definicja ukończenia z dowodami | ok. 1 h | brak | ok. 10 min |
| Build natywny w CI (ADR-0014, ADR-0007) | eksperyment dopiero po roli 08 | kolejka runnera macOS | 0 (sekrety podpisu: krok właściciela przy konfiguracji App Store Connect, P-038) |

## 10. Zgłoszenia od poprzednich ról (przyjęte do E1–E3)
- 02, sesja 2: RYZ-05 (Expo a CloudKit, zegarek, widżety, Live Activity; Foundation Models bez funkcji w wersji 1, ZAL-024) → ADR-0005, 0007–0009; OG-09, OG-11; NFR-WYD-001 (OP-17) → E3; NFR-KOS-001 → G-13, G-17.
- 01, fix ER-09–ER-24: OP-25 (z rolą 10) → E3 prywatność; OP-26 → Q1; wykonalność BR-WZR-007 (Word, strona offline) → ADR-0011; RD-16 (strefa czasowa dnia) → E2 dane; audyt dostępności S-36 w CI → lista dla 07 (E3).
- 01, fix ER-25–ER-28: prośba o ocenę w Expo (BR-DAN-012), NZ-02, NZ-03 → E1/E3; limit dnia `startDnia`, `wolaStraznika`, `mozeZaczacDzien` (`docs/monetyzacja/limit.mjs`, P-067, P-068) → port domeny w E2, zapis dnia w tej samej transakcji co zdarzenie.
- 04: stan „błąd zapisu” (design-spec, macierz stanów) → polityka błędów E3.
