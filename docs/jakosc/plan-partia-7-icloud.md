# 07-jakosc: plan testów partii 7 — iCloud (grupa I) i „Udostępnij do Oczka” (grupa R) — 2026-10-26
Wejście: P-229 (04 fix-7, testID grup R i I w `e2e/README.md`), P-221 (Q5a skrzynka zmian wyzwalaczami w tej samej transakcji, flaga przeciw echu, stan silnika w bazie; Q4a), P-218 Q5a (ZM-06: przełącznik iCloud ukryty, jeśli „rekord z telefonu na iPadzie” nie przejdzie), P-226 (właściciel: iPhone i iPad, bez Pencil). BRD: BR-DAN-002 (`docs/brd/wymagania-dane.md:14`), BR-DAN-004 (:44), NFR-DAN-003 (`docs/brd/wymagania.md:81`), ADR-0005 „Potwierdzenie”. Plan, nie testy: kod powstaje w partii 7 (08), po fundamencie 05 (P-221 Q7a).

## Poziomy testów (od najtańszego)
| Ryzyko | Test | Poziom | Wyrocznia |
|---|---|---|---|
| Synchronizacja zmienia liczbę bez wiedzy użytkownika (NFR-DAN-003, RYZ-02, S1) | scalanie na wektorach `scal-wektory.json` + własność: dowolna permutacja i powtórzenie dostarczeń → ten sam wynik | domena (Node, fast-check) | wektory ADR-0005, relacja metamorficzna |
| j.w. na transporcie | adapter z **atrapą silnika** (dwie instancje magazynu `node:sqlite`, opóźnienie, przerwana sieć, odwrócona kolejność, duplikaty; metoda NFR-DAN-003) | dane (Node) | stan obu baz po wymianie = ten sam; konflikt widoczny, nie rozstrzygnięty po cichu |
| Okno utraty wysyłki (zmiana po COMMIT bez wpisu do wysłania, P-221) | każda zmiana tabeli objętej synchronizacją zostawia wpis w skrzynce w tej samej transakcji; przerwanie po COMMIT nie gubi wpisu; zmiana przychodząca (flaga echa) nie trafia do skrzynki | dane (Node) | schemat 05 (wyzwalacze) — test każdej tabeli z listy synchronizowanych (pułapka: tabela bez wyzwalacza → czerwone) |
| Nowe kolumny `zmieniono_ms`, `usunieto_ms` (P-221 Q6a) | zapis aktualizuje `zmieniono_ms`; usunięcie wzoru to nagrobek | dane | `dane.md` 05 |
| Wyłączona synchronizacja nic nie wysyła (BR-DAN-002/S3) | atrapa liczy wywołania wysyłki = 0 przy wyłączonym przełączniku, także po zmianach | dane + E2E | BRD S3 |
| Kontrola ADR-0005: moduł synchronizacji pisze do bazy tylko przez kolejkę ADR-0002 | kontrola repo (grep/granice) z pułapką | kontrole | ADR-0005 |
| Ekrany: przełącznik, stan, problemy, konflikty, „Also delete from iCloud” | RNTL na stanach z makiet 04 fix-7 | ekrany | design-spec / makiety 04 |

## E2E (symulator) — wymaga atrapy silnika w buildzie E2E (Q1)
| Scenariusz (tag) | Przepływ | testID |
|---|---|---|
| BR-DAN-002/S3 wyłączona | Data and sync → przełącznik wyłączony → zmiany → panel E2E „wysłane: 0” | `icloud-przelacznik`, `icloud-stan` |
| NFR-DAN-003 konflikt | argument E2E wstrzykuje drugą wersję licznika → `licznik-konflikt` „Choose” → wybór → wartość wybrana, nic po cichu | `licznik-konflikt`, `icloud-konflikty` |
| BR-DAN-002 problem konta | argument E2E „brak konta” / „brak miejsca” → `icloud-problem` z nagłówkiem | `icloud-problem` |
| „Delete all data” z iCloud | `usun-z-icloud` włączony → atrapa dostaje usunięcie strefy | `usun-z-icloud` |
| Grupa R: skrzynka | argument E2E wkłada testowy PDF do skrzynki App Group (jak `e2e-wzor-pdf`) → lista projektów → `skrzynka` → `skrzynka-projekt` → wzór w projekcie | `skrzynka`, `skrzynka-projekt` |
| Grupa R: arkusz rozszerzenia | [DO USTALENIA] czy Maestro/XCUITest otworzy arkusz udostępniania systemu z rozszerzeniem Oczka (Pliki/Safari) w symulatorze — pierwszy przebieg próbny; inaczej lista urządzenia | `udostepnij-*` |
Przełącznik atrapy (`EXPO_PUBLIC_ICLOUD_FAKE=1`) tylko w kroku buildu E2E, z kontrolą jak `SZTUCZNY-SKLEP` w `kontrole-repo.mjs` i `sprawdz-workflowy.mjs` (build wydania nie może go ustawić).

## Lista „tylko urządzenie” (strategia §8/§9; iPhone + iPad właściciela, P-226)
| Pozycja | Kroki (skrót) | Oczekiwane | Uwagi |
|---|---|---|---|
| BR-DAN-002/S1 „Drugie urządzenie” — **bramka ZM-06** (P-218 Q5a) | +1 na iPhonie, otwarcie iPada z tym samym kontem | iPad pokazuje tę samą wartość | niezaliczone → przełącznik iCloud ukryty w wydaniu |
| BR-DAN-002/S2 konflikt na urządzeniach | +1 offline na obu, potem sieć | „Two versions…”, nic po cichu | NFR-DAN-003, ryzyko szczątkowe P-041 |
| BR-DAN-004/S1 nowy telefon z kopii | odtworzenie z kopii urządzenia | wszystkie projekty i liczniki | bez opłaty |
| brak miejsca / wylogowane konto iCloud | ustawienia systemu | `icloud-problem`, dane lokalne nietknięte | |
| Rozszerzenie z Safari i Plików | Udostępnij → Oczko → projekt | wzór w projekcie albo w skrzynce | jeśli E2E arkusza się nie da (wyżej) |

## Pytania (do koordynatora, P-087)
- **Q1 Atrapa silnika iCloud w buildzie E2E.** (a) Tak: `EXPO_PUBLIC_ICLOUD_FAKE=1` + argumenty startu `oczkoE2eIcloud=wylaczony|brak-konta|brak-miejsca|konflikt` i panel `e2e-icloud-wyslane` (bez `t()`), wzór „sztucznego sklepu” (Trening `lib/store-fake.ts`, P-036); ekrany i przepływy sprawdzone w CI, prawdziwy transport tylko na urządzeniu. (b) Bez atrapy w E2E: tylko Node (adapter z atrapą) + RNTL + lista urządzenia — mniej kodu testowego w aplikacji, brak sprawdzenia połączenia ekranów w działającej aplikacji. **Rekomendacja: (a)** — ten sam wzorzec co sklep, który już działa w pakiecie podstawowym (06).
- **Q2 Rozszerzenie udostępniania w E2E.** (a) Skrzynka przez argument E2E (pewne) + jeden scenariusz próbny arkusza systemu w pełnym pakiecie; jeśli pierwszy przebieg pokaże, że się nie da — pozycja urządzenia. (b) Od razu tylko urządzenie dla arkusza. **Rekomendacja: (a).**

## Szacunek
Czas agenta: testy oczekujące Node/RNTL ok. 2 h po sygnaturach 05 (fundament P-221 Q7a); scenariusze E2E ok. 1,5 h po kodzie 08; lista urządzenia 30 min. Czekanie: fundament 05, kod 08 partii 7, okno maszyn. Od właściciela: przejście listy urządzenia (iPhone + iPad, jedno konto iCloud) przed wydaniem z iCloud.

## Decyzja i kontrakt atrapy iCloud (dla kontraktu partii 7)
**P-230** (koordynator wg P-087, 2026-10-26): Q1a, Q2a. Kontrakt poniżej przekazany 05 fix-7 przez koordynatora (zmiana nazwy = zmiana scenariuszy 07 i kontroli repo).
| Element | Kontrakt |
|---|---|
| Zmienna buildu | `EXPO_PUBLIC_ICLOUD_FAKE=1` — ustawiana **tylko** w kroku buildu E2E `jakosc-ios.yml` (obok `EXPO_PUBLIC_STORE_FAKE`); czytana wyłącznie przez adapter silnika synchronizacji (`src/platforma/…icloud*`, nazwa pliku — 05) i `src/platforma/tryb-e2e.ts`; bez niej atrapy nie ma w bundlu wydania |
| Atrapa | silnik w procesie z tym samym portem co prawdziwy (ADR-0005): pamięta wysłane rekordy i usunięcia strefy w pliku buildu E2E (przeżywa restart, jak transakcje sztucznego sklepu); nie wykonuje żadnej sieci |
| Argument startu `oczkoE2eIcloud` | `wlaczony` (konto dostępne), `wylaczony` (przełącznik off), `brak-konta`, `brak-miejsca`, `konflikt` (przy starcie wstrzykuje drugą wersję pierwszego licznika: wartość +5, urządzenie „iPad (test)”, godzina = teraz − 1 min); bez `EXPO_PUBLIC_E2E=1` ignorowany |
| Panele E2E (bez `t()`) | `e2e-icloud-wyslane` = liczba rekordów wysłanych przez atrapę od instalacji; `e2e-icloud-usuniete` = „tak”/„nie” (usunięcie strefy po „Also delete from iCloud”) — w Data and sync |
| Kontrole repo | nowa kontrola `ATRAPA-ICLOUD` w `scripts/jakosc/kontrole-repo.mjs` (zmienna poza dozwolonymi plikami → błąd, z pułapką), `sprawdz-workflowy.mjs`: workflow wydania nie ustawia `EXPO_PUBLIC_ICLOUD_FAKE`, `sprawdz-ipa.mjs`: brak napisu atrapy w buildzie wydania (jak `SZTUCZNY-SKLEP`) — pisze 07 przy partii 7 |
| Skrzynka (grupa R, Q2a) | argument `oczkoE2eSkrzynka=pdf` wkłada testowy PDF (ten sam co `e2e-wzor-pdf`) do skrzynki App Group przed pierwszym ekranem |
