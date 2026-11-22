# Werdykt 07 — build 6 = 1.0.0 (1161), SHA 2ed5215a

**Dla właściciela (5 linii):**
1. Werdykt: **GOTOWY Z UWAGAMI** — wszystkie bramki CI na 2ed5215a zielone, build 1161 VALID, kontrola `.ipa` bez błędów, licencja OFL w paczce.
2. Do wysyłki brakuje dwóch rzeczy (warunki wysyłki, nie wady): Twój test na iPhonie (lista buildu 5 obowiązuje bez zmian, kod ten sam) i jeden pełny katalog E2E.
3. Integracja 1dfcf7ca nie zmienia niczego, co wchodzi do aplikacji (tylko skrypty ASC, testy, dokumenty i skrypt `jakosc:kontrole`), więc 1161 zostaje kandydatem.
4. Uwagi `kontrola-ipa.sh` (2 o manifeście prywatności rozszerzeń, 1277 heurystyk tłumaczeń) nie blokują; sprawdzone na próbkach.
5. Od Ciebie: test z `docs/wydanie/test-urzadzenia-build5.md` na buildzie 1161 (wersja krótka ok. 25 min, jeśli koordynator uzna pełny test buildu 4 za zrobiony).

Rola 07-jakosc, tryb audit (prompt roli z polecenia BJ @ 814a7093, od `=== PROMPT ROLI ===` do `=== KONIEC PROMPTU ROLI ===`). Data 2026-11-13. Gałąź `claude/bj-werdykt-1161-2026-11-13` od integracji @ 1dfcf7ca (HEAD zgodny z poleceniem). Środowisko: Linux, Node, git, MCP GitHub (odczyt), bez Xcode i symulatora. Dowody: `docs/jakosc/werdykt-1161/`.

## Bramki na SHA kandydata (2ed5215a) — wszystkie przebiegi tego samego SHA (JAK-16)
| Kontrola | Przebieg / komenda | Wynik |
|---|---|---|
| Jakość · Linux (verify, losowa kolejność, strefy, akceptacja) | run 43245531487 | success |
| Jakość · iOS (swift-test, build, zegarek, E2E pakiet podstawowy iPhone) | run 43245531497, attempt 2 | success; 13/13 scenariuszy bramki (cz. 1: 6, cz. 2: 7), bez awarii maszyny |
| TestFlight: bramka, verify, `swift test`, kontrola `.ipa`, wysyłka, VALID, tag | run 43383728558 | success; 606/606 zestawów, 7312 testów (26 pominiętych warunkowo), Swift 53/53, „Build 1161: VALID” |
| ci.yml | brak przebiegu na 2ed5215a | nie dotyczy: wyzwalacz tylko `main`/PR/ręcznie (`.github/workflows/ci.yml:3-7`); ten sam `npm run verify` biegł w Linux i TestFlight |
| `env -u NODE_PATH npm run verify` lokalnie (worktree 2ed5215a, po `npm ci` kod 0) | `docs/jakosc/werdykt-1161/verify-lokalnie-2ed5215a.txt` | kod 0; 606/606 zestawów, 7336/7336 testów (Linux) |

Szczegóły jobów, kroków i cytatów z logów: `docs/jakosc/werdykt-1161/ci-2ed5215a.txt`.

**„Scenariusze skipped” w cz. 3 iPhone i cz. 1 iPad — wzorzec zamierzony, nie luka bramki.** Plan części wypisuje „Pakiet: podstawowy. Część 3/2: 0 scenariuszy” (pakiet podstawowy ma 2 części, `e2e/czesci.json` `czesci_podstawowy: 2`) i „Pakiet: ipad. Część 1/0: 0 scenariuszy” (iPad tylko przy `[e2e-pelny]`/`[e2e-ipad]`, `.github/workflows/jakosc-ios.yml:264`). Wszystkie 13 scenariuszy z tagiem `podstawowy` przeszły w cz. 1–2. Skutek uboczny: iPad nie ma wyniku E2E na tym SHA — domyka to uwaga U1.
**`eksperymenty-wzoru` czerwony** (W1 Word→PDF, `testW1WordNaPdf`): informacyjny (`continue-on-error: true`, `.github/workflows/jakosc-ios.yml:85`), ten sam wynik od przebiegu #126 (`docs/programista/partia-6.md:10`). Nie wpływa na gotowość. **Attempt 1** (build anulowany) zastąpiony pełnym attempt 2 — jedno ponowienie zgodnie z zasadą CI z `CLAUDE.md`.

## UWAGI `kontrola-ipa.sh` (run 43383728558, krok 24) — „Wynik: błędów 0, uwag 2”
- **OFL:** brak noty i licencji Bree Serif w `main.jsbundle` byłby **błędem** (`scripts/wydanie/kontrola-ipa.sh:66-67`); błędów 0 → licencja OFL jest w paczce. Bajtkod Hermesa, bez śladów trybu testowego (12 wzorców), 35 katalogów `.lproj`, adres App Store `id6823678721` (nie zaślepka), uprawnienia wszystkich 4 pakietów z `get-task-allow: false`.
- **2 uwagi:** brak `PrivacyInfo.xcprivacy` w `OczkoUdostepnij.appex` i `OczkoWidget.appex`; skrypt sam podaje, że kod tych celów nie używa API z listy (`manifest-celow.mjs`). Realność: teoretyczny. Ocena zgodności z wytycznymi Apple należy do roli 10 (lista `sklep.md` §5a, pozycja F1).
- **1277 „UWAGA <język>”** (34 języki; 1071 „tekst taki sam jak w źródle”, 146 „brak liter pisma języka”, 60 „liczby inne niż w źródle”): heurystyki tłumaczeń, nie liczone do wyniku. Próbka: nazwy własne i jednostki („Oczko Pro”, „OK”, „{{wartosc}} m”), a „liczby inne” to zero zapisane słowem (en „Reset to 0…”, et „Lähtesta nulli…”). Realność: teoretyczny; właściciel obszaru: rola 09. Wyciąg: `docs/jakosc/werdykt-1161/kontrola-ipa-1161.txt`.

## Zadanie 2: 2ed5215a → 1dfcf7ca nie dotyka wejść binarki — POTWIERDZONE
`git diff --stat 2ed5215a 1dfcf7ca`: 39 plików, kod 0. Filtr na wejścia binarki (`app/ src/ assets/ ios/ android/ plugins/ app.json app.config package.json package-lock.json metro babel eas index tsconfig`) → jedno trafienie: `package.json`, zmieniony tylko skrypt `jakosc:kontrole` (dodane `node scripts/asc/kontrola-wycofane.mjs`); zależności, wersja i pola `expo` bez zmian. Reszta: `scripts/asc/`, `tests/wydanie/`, `.github/workflows/asc-iap-localizations.yml`, `docs/`. Dodatkowo 562dfc4 (build 1151) → 2ed5215a: zero plików z wejść binarki, więc kod 1161 = kod 1151. Dowód: `docs/jakosc/werdykt-1161/zad2-diff-2ed5215a-1dfcf7ca.txt`.

## Definicja ukończenia — plan wydania (`docs/jakosc/strategia.md` §11) na 2ed5215a
| Pozycja | Stan |
|---|---|
| Jeden SHA dla wszystkich przebiegów kandydata | tak: Linux, iOS, TestFlight → 2ed5215a, tag `v1.0.0-b1161` |
| Zielony `jakosc-ios` z pakietem podstawowym iPhone + bramka TestFlight | tak (43245531497, job bramka 131747214614) |
| Pełne `npm run verify` i `swift test` w buildzie TestFlight | tak (kroki 7 i 8) |
| Kontrola `.ipa` na podpisanym pakiecie; VALID w App Store Connect | tak (kroki 24 i 27) |
| Pełny katalog E2E raz przed App Store (P-091 9a) | **nie na tym SHA** — U1 |
| Lista §8 „tylko telefon” z wynikami | **brak wyniku** — U2 |
| XCTest UI; schemat CloudKit Production; test aktualizacji z danymi | plan, nie wykonano (strategia §10 #11) / poza 07 (rola 10, P-091 1) / nie dotyczy przed 1.0 (strategia §11, P-070) |
| Wersja i numer buildu | 1.0.0, numer 1161 > ostatni 1151 (log kroku 24: `BUILD_NUMBER: 1161`, `OSTATNI: 1151`) |

## Werdykt: **GOTOWY Z UWAGAMI**
Reguła roli 07: brak otwartych P0/P1 i czerwonych bramek na badanym SHA, ale są pozycje „nie sprawdzono”. Uwagi (właściciel, krok, realność):
- **U1 · Pełny katalog E2E nie biegł na kodzie kandydata** — ostatni na e270a07 (run 42899408194, `[e2e-pelny] [e2e-ciemny]`, success). Od tamtej pory zmieniły się `modules/oczko-wzor/ios/WidokWzoru.swift` (zakreślenie: 019 i krycie 0,45) i `app/(zakladki)/index.tsx` (07-jakosc-001); scenariusze zakreśleń (26, 47) i iPada nie są w pakiecie podstawowym. Częściowo pokrywają: zrzuty-sklepu 43139114751 (pasy widoczne w kadrze 04, recenzja `docs/wydanie/as-2026-11-12/10-wydanie-2026-11-12.md`) i pozycje Z-01…Z-06 listy buildu 5. Realność: **brzegowy**. Krok: koordynator — przebieg „Jakość · iOS” z `[e2e-pelny] [e2e-ciemny]` na integracji (commit bez zmian wejść binarki względem 2ed5215a; filtr `paths` workflowu wymaga zmiany np. w `e2e/` albo `scripts/ci/`, sam `docs/` przebiegu nie uruchamia; przebieg 43392775119 na 1dfcf7ca to pakiet podstawowy, bez znacznika); ok. 2 h macOS, 0 USD (repo publiczne). **Warunek wysyłki do App Store** (P-091 9a, P-796).
- **U2 · Test właściciela na urządzeniu bez wyniku** (A3/A4; `docs/wydanie/test-urzadzenia-build5.md` obowiązuje dla 1161, bo kod jest ten sam). Realność ryzyka: **brzegowy** (zegarek, ekran blokady, zakup i iCloud sprawdza tylko telefon). Krok: właściciel; wynik do koordynatora. **Warunek wysyłki.**
- **U3 · 2 uwagi manifestu prywatności rozszerzeń** — **teoretyczny**; rola 10 przy F1.
- **U4 · 1277 heurystyk tłumaczeń w kontroli `.ipa`** — **teoretyczny**; rola 09, bez działania przed wysyłką.
- **U5 · Brak dSYM `hermesvm.framework` i `OczkoUdostepnij.appex` przy wysyłce** (ostrzeżenie eksportu, krok 26) — **brzegowy** dla czytelności raportów awarii; rola 12, nie blokuje.

## Decyzje (tryb analogia, do weta; nie wpisane do `docs/decyzje.md`)
- **P-796** Pełny katalog E2E dla wydania można wykonać na późniejszym commicie integracji, jeśli `git diff` od 2ed5215a nie dotyka wejść binarki (filtr z zadania 2); wynik liczy się dla 1161. Źródło: P-091 9a (Oczko, „jak Trening”); w Treningu (`trening/CLAUDE.md`, 51 linii, odczyt 2026-11-13) reguły o SHA katalogu nie ma — decyzja według rekomendacji. Odrzucone: nowy build TestFlight (koszt kolejnego przebiegu i ponowny test właściciela bez zmiany kodu).
- **P-797** UWAGI kontroli `.ipa` (U3, U4) nie są warunkiem wysyłki; idą do ról 10 i 09. Źródło: skrypt liczy je jako uwagi, nie błędy (`scripts/wydanie/kontrola-ipa.sh:15`). Analogii w Treningu brak: jego `scripts/ci/waliduj-ipa.sh` (19 linii, odczyt 2026-11-13) to tylko walidacja Apple z `::error::`, bez kategorii uwag — decyzja według rekomendacji. Odrzucone: wstrzymanie wysyłki do uzupełnienia manifestów (teoretyczne ryzyko, koszt nowego buildu i testu).

## Nie sprawdzono
E2E na symulatorze i XCTest (brak macOS w kontenerze; wynik wzięty z CI); test na telefonie (U2); zgodność z wytycznymi App Store i metadane (rola 10); schemat CloudKit Production (rola 10/właściciel). Rola 10 nie powinna przyjmować tych pozycji za sprawdzone przez 07.
