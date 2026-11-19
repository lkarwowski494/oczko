# Werdykt 07 — build 1.0.0 (1221), SHA a830eb21

**Dla właściciela (5 linii):**
1. Werdykt: **GOTOWY Z UWAGAMI** — wszystkie bramki CI na a830eb21 zielone (Linux, iOS z pełnym katalogiem E2E, TestFlight), build 1221 VALID, kontrola `.ipa` bez błędów.
2. Do wysyłki do App Store brakuje jednej rzeczy z Twojej strony: test na urządzeniu — **na iPhonie i na zegarku z watchOS 10.6.2** — tylko tego, co zmieniło się od buildu 1161 (lista w `docs/wydanie/do-app-store-1221.md`, pytanie 1). Pełny katalog E2E, który przy 1161 był otwarty, jest zamknięty.
3. Zrzuty sklepu **nie nadają się do wysłania w obecnej postaci**: mają w kadrze napisy diagnostyczne trybu E2E (wszystkie 28 plików) i na iPadzie pigułka „Strona 1 z 1” zasłania tekst wzoru. To wada zrzutów, nie aplikacji; trzeba je zrobić od nowa.
4. OG-07 (ograniczenia P-218 1–6): **treść scen 03 i 04 mieści się w ograniczeniach — tak**, ale te konkretne pliki nie mogą iść do sklepu (punkt 3); po ponownym wykonaniu 07 jeszcze raz obejrzy 03/04.
5. Po 1221 na integracji znalazłem czerwony krok „Kolejność testów losowa” w Linuxie (test panelu zegarka, tylko testowy, produktu nie dotyka). Nie dotyczy binarki 1221, ale blokuje bramkę PR — do naprawy przez rolę 08.

Rola 07-jakosc, tryb audit (polecenie WR1 @ f4f3b557, gałąź `koordynacja`). Data 2026-11-19. Gałąź `claude/wr1-werdykt-1221-2026-11-19` od integracji @ b106e210 (HEAD zgodny z poleceniem). Środowisko: Linux, Node, git, MCP GitHub (odczyt), bez Xcode i symulatora. Dowody: `docs/jakosc/werdykt-1221/`.

## Bramki na SHA kandydata (a830eb21)
| Kontrola | Przebieg / komenda | Wynik |
|---|---|---|
| Jakość · Linux (verify, losowa kolejność, strefy, akceptacja) | #783, run 44266291602 | success |
| Jakość · iOS (build, swift-test, zegarek-ikona, E2E cz. 1–4 iPhone + cz. 1 iPad) | #217, run 44296519874, attempt 2 | success; `eksperymenty-wzoru` czerwony — informacyjny (`continue-on-error`) |
| TestFlight: bramka, PU, verify, `swift test`, kontrola `.ipa`, wysyłka, VALID, tag | #22, run 44353461752 | success; 726/726 zestawów, 7929 testów + 26 pominiętych warunkowo, „Build 1221: VALID”, tag `v1.0.0-b1221` |
| ci.yml | brak przebiegu na a830eb21 | nie dotyczy: wyzwalacz tylko `main`/PR/ręcznie; ten sam `npm run verify` biegł w Linux i TestFlight |
| `npm run verify` lokalnie (b106e210) | `docs/jakosc/werdykt-1221/verify-lokalnie-b106e210.txt` | kod 0; 726 zestawów, 7961 testów (Linux; CI 7929 + 26 pominiętych) |

Szczegóły i godziny jobów: `docs/jakosc/werdykt-1221/ci-a830eb21.txt`.

**Pełny katalog E2E — zamknięte (dawne U1).** Od P-834 każdy przebieg „Jakość · iOS” uruchamia wszystkie scenariusze poza tagiem `oczekujacy` (`.github/workflows/jakosc-ios.yml:259-261`), więc cz. 1–4 iPhone + iPad cz. 1 w #217 to pełny katalog na kodzie kandydata. Wynik zielony.
**Attempt 1 (#216, run 44266309347)** zakończył się porażką; przyczyny nie badałem. Zasada CI z `CLAUDE.md` dopuszcza jedno ponowienie, attempt 2 jest zielony na tym samym SHA. Realność: teoretyczny (maszyna), ale to jest „nie sprawdzono” (patrz niżej).

## UWAGI `kontrola-ipa.sh` (run 44353461752) — „Wynik: błędów 0, uwag 2”
- Bez błędów: bajtkod Hermesa, bez śladów trybu testowego (12 wzorców), 35 katalogów `.lproj`, adres App Store `id6823678721` (nie zaślepka), uprawnienia pakietów z `get-task-allow: false`.
- **2 uwagi:** brak `PrivacyInfo.xcprivacy` w `OczkoUdostepnij.appex` i `OczkoWidget.appex` (jak przy 1161; skrypt sam podaje, że kod tych celów nie używa API z listy). Realność: teoretyczny; rola 10 przy F1.
- **1277 „UWAGA <język>”**: heurystyki tłumaczeń, nie liczone do wyniku (jak 1161, bez zmiany). Realność: teoretyczny; rola 09.
- Wyciąg: `docs/jakosc/werdykt-1221/kontrola-ipa-1221.txt` (z wycięciem uprawnień i identyfikatora zespołu — repo publiczne).

## Audyt zmian 2ed5215a (werdykt 1161) → a830eb21
Dowód: `docs/jakosc/werdykt-1221/zad-diff-2ed5215a-a830eb21.txt`. 230 commitów, 513 plików; z wejść binarki (`src app modules ios assets package.json`) 40 plików, 595 dodanych / 129 usuniętych linii. Testy: 129 nowych plików testowych i 216 zmienionych w `tests/`. Zmiany produktowe pogrupowane według przyczyny:

| Grupa | Co się zmieniło (pliki) | Pokrycie | Realność ryzyka |
|---|---|---|---|
| Licznik: założenie licznika roboczego i „+” z ekranu | `src/kompozycja/licznik.ts` (`zalozRoboczyGdyPusto` z jednym wspólnym zadaniem, `plusZEkranu` czeka na stan), `app/licznik.tsx`, `src/ekrany/Aplikacja.tsx` | testy ekranu licznika i luk licznika (`tests/domena/luki/licznik.test.ts` i testy ekranów); pełny E2E #217 zielony | brzegowy: wyścig dwóch szybkich „+” przy pustej bazie — do potwierdzenia na urządzeniu |
| BY-001: bezpieczny powrót z ekranów (wzór, zdjęcie, formularz) | `src/kompozycja/bezpieczny-powrot.ts`, `app/wzor.tsx`, `app/zdjecie.tsx`, `app/formularz/[rodzaj].tsx`, `src/ekrany/WzorMenu.tsx`, `WzorPrzegladarka.tsx`, `WzorZrodla.tsx` | `tests/ekrany/wzor-dodaj-wyjscie-by001.test.tsx`, `tests/jakosc/wyjscia-tras.test.ts`; sam hak `useBezpiecznyPowrot` nie ma testu pod własną nazwą — pokryty pośrednio przez testy wyjść | brzegowy |
| BY-002: nazwa zapasowa części na liczniku | `src/domena/nazwa-czesci.ts` (`jestNazwaZapasowaCzesci`, `czescNaLiczniku`) | `tests/domena/nazwa-czesci.test.ts`, `tests/ekrany/czesc-nazwa-zapasowa-by002.test.tsx` | brzegowy |
| Anulowanie importu trasy wzoru | `src/kompozycja/wzor-import-trasy.ts` (`anulowano`) | `tests/ekrany/wzor-dodawanie.test.ts`, `tests/adaptery/wzor-adapter.test.ts` | brzegowy |
| Panele diagnostyczne E2E (nowe) | `src/kompozycja/e2e/*-stan.tsx`, `panele.tsx`; w wydaniu `paneleE2e` = `null` (`src/platforma/tryb-e2e.ts`, wejście przez `process.env.EXPO_PUBLIC_E2E === '1'`) | testy `tests/ekrany/*panel*`, kontrola `.ipa` „bez śladów trybu testowego (12 wzorców)” | teoretyczny dla produktu (w wydaniu usunięte; potwierdzone na podpisanej `.ipa`) |
| Minimum zegarka watchOS 10.0 (KO-061, P-819; fakt właściciela: watchOS 10.6.2, bez aktualizacji) | `src/konfiguracja.ts` `MIN_WATCHOS = '10.0'`, cel zegarka, `kontrola-ipa.sh`, README | `tests/wydanie/zegarek-minimum-watchos.test.ts` (źródło, skrypt, README, wzorzec pbxproj); skaner API watchOS 11 (1d236402) | **brzegowy** — patrz „Nie sprawdzono”: zbudowany cel 10.0 nie jest potwierdzony w logu CI, a na zegarku 10.6.2 zadziała dopiero test właściciela |
| Pozostałe (`Dzis`, `Formularze`, `Pasek`, `LicznikTypy`, `konflikt`, `ustawienia`, `kontener`, korpus Word, `Package.swift`) | drobne poprawki zgodne z opisanymi grupami; `ZegarekSkrzynkaTests.swift` dodany | testy w katalogu `tests/` i Swift (swift-test zielony w #217 i TestFlight) | teoretyczny |

**Binarka po a830eb21 się nie zmieniła.** `git diff a830eb21 b106e210 -- src app modules ios assets package.json` jest pusty; jedyne zmiany poza dokumentami to `zrzuty-sklepu.yml`, `scripts/ci/zrzuty-uzupelnij.mjs` i testy wydania. Werdykt przenosi się na każdy późniejszy commit integracji aż do b106e210.

## Wada bramki po 1221: krok „Kolejność testów losowa” czerwony
Dowód: `docs/jakosc/werdykt-1221/kolejnosc-losowa.txt`. Run 44505505468 (e3e7fe9e) i 44533633202 (b106e210) padają na `tests/ekrany/e2e-zegarek-stan.test.tsx:22-24`: oczekiwane „Watch state: none”, otrzymany stan z wcześniejszego testu. Przyczyna: wspólny singleton `zegarekSztuczny` (`src/kompozycja/e2e/panele.tsx`) trzyma stan między testami pliku. Ziarno kolejności to pierwsze 7 znaków SHA, więc na a830eb21 (ziarno 176361138) jest zielono, na e3e7fe9e (238977001) i b106e210 (185626145) czerwono; odtworzone lokalnie (`npx jest tests/ekrany/e2e-zegarek-stan.test.tsx --randomize --seed=185626145`). Realność: **realny dla bramki** (blokuje PR D1 na „pechowych” SHA), teoretyczny dla produktu (panel tylko w buildzie E2E). Naprawa tylko testowa: reset singletona w `beforeEach` — rola 08. To jest uwaga P2.

## OG-07: ekrany wzoru w zrzutach sklepu (P-218 ograniczenia 1–6, P-224)
Dowód: `docs/jakosc/werdykt-1221/og07-zrzuty.md`, zestawienia `og07-sceny-03-04-pl.jpg`, `og07-sceny-01-02-05-07-en.jpg`. Próbka: artefakt `sklep-zrzuty-ramki` (id 14535281849) z run 44533640642 (b106e210), katalog `warunek-og07/`, 8 plików (03-wzor, 04-zakreslenie × iPhone 6.9″, iPad 13″ × en, pl); surowe kadry z run 44505569101 (e3e7fe9e, kod aplikacji identyczny z a830eb21).

- **Ograniczenia (1)–(6): zgodne dla obu scen** — jeden wzór = jedno źródło („Strona 1 z 1”); treść PDF nietknięta, zakreślenia jako osobna warstwa; jeden znacznik rzędu i licznik (na iPadzie licznik obok wzoru); brak filmu; znacznik z licznika, zakreślenia od użytkownika; przegląd (6) wykonany na kadrach, nie na urządzeniu. Brak E3 (edycja części) i E5 (złożenie w jeden zestaw). To ocena projektu, nie opinia prawna.
- **Odpowiedź: sceny 03 i 04 — TAK pod względem OG-07; obecne pliki — NIE.** Pliki nie mogą pójść do sklepu z innych powodów niż patent:
  1. napisy diagnostyczne E2E w kadrze we wszystkich 28 plikach (np. „window: portrait (440 x 956)”, „touch: …”, „notes: none” nad podpisem). Przyczyna: build zrzutów ma `EXPO_PUBLIC_E2E=1` (`zrzuty-sklepu.yml:242`), a wyłączony jest tylko panel zegarka; argument gaszący panele licznika nie jest ustawiany w scenach `e2e/zrzuty-sklepu/*.yaml`. Binarka 1221 tego nie zawiera;
  2. iPad 13″ (03 i 04, en i pl): pigułka „Strona 1 z 1” zasłania dolny fragment tekstu PDF (nakładanie, NFR-UKL-001 PR-01…06);
  3. podpis 04 „Zakreślaj i notuj na wzorze” obiecuje notatkę, której kadr nie pokazuje (P3, role 10/11).

## Definicja ukończenia — plan wydania (`docs/jakosc/strategia.md` §11) na a830eb21
| Pozycja | Stan |
|---|---|
| Jeden SHA dla wszystkich przebiegów kandydata | tak: Linux #783, iOS #217, TestFlight #22 → a830eb21, tag `v1.0.0-b1221` |
| Zielony `jakosc-ios` + bramka TestFlight | tak (#217 attempt 2; TestFlight #22) |
| Pełne `npm run verify` i `swift test` w buildzie TestFlight | tak (726/726 zestawów, 7929 testów) |
| Kontrola `.ipa` na podpisanym pakiecie; VALID w App Store Connect | tak (błędów 0, uwag 2; „Build 1221: VALID”) |
| Pełny katalog E2E raz przed App Store (P-091 9a) | **tak, na tym SHA** (#217) |
| Lista „tylko telefon” / zegarek z wynikami | **brak wyniku** — U1 |
| Zrzuty sklepu przeglądnięte (OG-07, układ) | **nie — do ponowienia** (U2) |
| XCTest UI; schemat CloudKit Production; test aktualizacji z danymi | plan, nie wykonano (strategia §10 #11) / poza 07 (rola 10) / nie dotyczy przed 1.0 (P-070) |
| Wersja i numer buildu | 1.0.0, numer 1221 > ostatni 1201 (log TestFlight: `BUILD_NUMBER 1221`, `OSTATNI 1201`) |

## Werdykt: **GOTOWY Z UWAGAMI** (KO-178, do weta)
Reguła roli 07: brak otwartych P0/P1 dla binarki i czerwonych bramek na badanym SHA; są pozycje „nie sprawdzono” i uwagi do zrzutów. Uwagi (priorytet, właściciel, krok, realność):
- **U1 · P1 (warunek wysyłki) · Test właściciela na urządzeniu bez wyniku.** Właściciel testuje tylko zmiany od 1161 (fakt: pierwszy test telefonu to było 1161), w tym **zegarek z watchOS 10.6.2** (nowe minimum 10.0) i licznik („+” z ekranu, BY-001/BY-002, anulowanie importu). Realność: brzegowy. Krok: właściciel wg `docs/wydanie/do-app-store-1221.md`; jeśli `docs/jakosc/test-fizyczny/1221.md` ma powstać, to po jego słowie (D-2 pyt. 1) — tego pliku nie zakładam.
- **U2 · P1 dla kroku sklepu (nie dla binarki) · Zrzuty sklepu do powtórzenia.** Przebieg zrzutów z czystym trybem prezentacji (wszystkie panele `e2e-*` wyłączone poza potrzebnymi flow; build zrzutów bez diagnostyki albo wspólny argument startowy), poprawka pigułki „Strona 1 z 1” na iPadzie, potem ponowny przegląd 03/04 przez 07 (P-218 (6)). Realność: **realny** dla zrzutów, bez wpływu na 1221. Krok: koordynator → role 08/11; nic z tego nie wymaga nowego buildu TestFlight.
- **U3 · P2 · Test „Kolejność testów losowa” czerwony na SHA po 1221** (sekcja wyżej). Krok: rola 08; poprawka tylko testowa, bez nowego buildu.
- **U4 · P3 · Podpis 04 „…notuj…” bez notatki w kadrze** — albo kadr z notatką, albo podpis bez „notuj”. Role 10/11.
- **U5 · P3 · 2 uwagi manifestu prywatności rozszerzeń i 1277 heurystyk tłumaczeń** — jak przy 1161, teoretyczne; role 10 i 09.
- **U6 · P3 · Zbudowany cel zegarka 10.0** nie potwierdzony w logu CI (patrz „Nie sprawdzono”) — rola 10/08 może dodać do kontroli `.ipa` odczyt `MinimumOSVersion` zegarka; do czasu testu U1 nie jest to blokada.

## Decyzje (tryb analogia, do weta; nie wpisane do `docs/decyzje.md`)
Analogia: repo `lkarwowski494/trening` — próba odczytu `CLAUDE.md` przez MCP odrzucona (repo poza zakresem sesji: dozwolone tylko `oczko`), `docs/fakty-wlasciciela.md` w Oczku sprawdzony (hak startu, bez wpisu o zrzutach i o kolejności losowej). Decyzje według rekomendacji.
- **P-991** Czerwony krok losowej kolejności na b106e210 nie wymaga nowego buildu TestFlight: kod po a830eb21 nie zmienia wejść binarki, poprawka jest tylko w teście (`beforeEach` resetujący `zegarekSztuczny`), a 1221 pozostaje kandydatem. Odrzucone: nowy build 1231 „dla porządku” (koszt przebiegu i ponownego testu właściciela bez zmiany produktu).
- **P-992** Zrzuty sklepu scen 01–07 powtarza się przed jakimkolwiek wysłaniem do App Store Connect; OG-07 dla scen 03/04 uznane za spełnione co do treści, ponowny przegląd wzrokowy 07 na nowych kadrach jest obowiązkowy (P-218 (6)). Odrzucone: przycięcie kadrów (napisy E2E są w rogach i nad podpisem, a zasłonięcie tekstu na iPadzie przycięciem się nie naprawia) oraz wysyłka zrzutów „jak są” (napisy diagnostyczne i nakładanie w sklepie).

## Nie sprawdzono
E2E na symulatorze, XCTest i zegarek (brak macOS w kontenerze; wynik z CI); test na telefonie i zegarku z watchOS 10.6.2 (U1); czy zbudowany cel zegarka ma `WATCHOS_DEPLOYMENT_TARGET = 10.0` (log TestFlight nie zawiera tego wzorca; sprawdzone tylko testem źródła); przyczyna porażki attempt 1 przebiegu iOS #216; przegląd OG-07 na urządzeniu (tylko na kadrach); zgodność z wytycznymi App Store i metadane (rola 10); schemat CloudKit Production (rola 10/właściciel); ocena prawna patentów (poza 07, P-218). Rola 10 nie powinna przyjmować tych pozycji za sprawdzone przez 07.
