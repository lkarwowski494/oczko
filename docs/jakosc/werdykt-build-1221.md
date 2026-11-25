# Werdykt 07 — build 1.0.0 (1221), SHA a830eb21

**Dla właściciela (5 linii):**
1. Werdykt: **GOTOWY Z UWAGAMI** — wszystkie bramki CI na a830eb21 zielone (Linux, iOS z pełnym katalogiem E2E, TestFlight), build 1221 VALID, kontrola `.ipa` bez błędów.
2. Do wysyłki do App Store brakuje jednej rzeczy z Twojej strony: test na urządzeniu — **na iPhonie i na zegarku z watchOS 10.6.2** — tylko tego, co zmieniło się od buildu 1161 (lista w `docs/wydanie/do-app-store-1221.md`, pytanie 1). Pełny katalog E2E, który przy 1161 był otwarty, jest zamknięty.
3. [Zaktualizowane 2026-11-20: patrz „Zrzuty sklepu — ponowny przegląd, P-992” na końcu; werdykt zrzutów DO SKLEPU Z UWAGAMI.] Zrzuty sklepu **nie nadają się do wysłania w obecnej postaci**: mają w kadrze napisy diagnostyczne trybu E2E (wszystkie 28 plików) i na iPadzie pigułka „Strona 1 z 1” zasłania tekst wzoru. To wada zrzutów, nie aplikacji; trzeba je zrobić od nowa.
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

## Zrzuty sklepu — ponowny przegląd, P-992 (WR2, 2026-11-20)
Rola 07, tryb audit (polecenie WR2 @ dc18f6b2, gałąź `koordynacja`). Gałąź `claude/wr2-zrzuty-2026-11-20` od 4e46688c. Materiał: przebieg „Zrzuty sklepu” #39, run 44677685872 (success), SHA 4e46688c, build z `EXPO_PUBLIC_ZRZUTY=1` (P-993); artefakty `sklep-zrzuty-ramki` i `sklep-zrzuty-surowe`, 28 + 28 plików (iPhone 6.9″ i iPad 13″ × en, pl × 7 scen), wszystkie obejrzane. Dowody: `docs/jakosc/werdykt-1221/og07-zrzuty-wr2.md`, zestawienia `wr2-ramki-*.jpg`, sumy plików `wr2-manifest-sha256.txt`. Ta sekcja zastępuje punkty 3–4 nagłówka i U2/U4 powyżej dla zrzutów.

**Werdykt zrzutów: DO SKLEPU Z UWAGAMI** (KO-183, do weta). Brak P0/P1: żadnych nakładek E2E ani pigułki w 56 plikach, OG-07 dla 03/04 w granicach. Zostaje jedna uwaga P2 (spójność danych znacznika) i uwagi P3.

| Pytanie z polecenia | Wynik |
|---|---|
| 1. Nakładki E2E (`dow:`, `touch:`, panele) i pigułka „Strona n z m” | **brak w 28 surowych i 28 w ramkach**; pigułki nie ma na żadnym z 16 kadrów 03/04. **U2 zamknięte** dla zrzutów |
| 2. OG-07 sceny 03/04 (P-218 1–6, P-224) | **TAK, w granicach** na nowych plikach (ogr. 1–5 zgodne; 6 = ten przegląd, na kadrach, nie na urządzeniu); zakreślenia 03→04: 1→2 w każdym z 4 wariantów |
| 3. Kadr a aplikacja 1221, podpisy a kadry | różnice kodu 1221 → 4e46688c w wejściach binarki: 9 plików, tylko P-993; podpisy zgodne z kadrami z jednym wyjątkiem: **U4 utrzymane (P3)** — „notuj/write” bez notatki w kadrze 04 |
| 4a. Zakreślenia od połowy wiersza na iPadzie 03/04 | potwierdzone; **P3** — nie myli co do funkcji (zakreślenie od ręki), wygląda niechlujnie; przyczyna: swipe od 20% szerokości; do poprawy w scenach przy następnej powtórce |
| 4b. „Row 48 ↓” przy linii PDF „Row 21”, licznik 47 / „Now working row 48” | **P2** — zgodne z regułą RD-21 (rząd w robocie = licznik + 1), niezgodne z odbiorem: wzór ma 23 rzędy, znacznik „48” stoi na wierszu „Row 21”; wygląda jak błąd aplikacji w kadrze głównej przewagi. Nie przeczy literalnie opisowi funkcji, ale osłabia jej wiarygodność (plan zrzutów: dane fikcyjne mają być wiarygodne, 2.3.9) |

**Uwagi (priorytet, właściciel, krok):**
- **U2 · zamknięte dla zrzutów.** Osobno, dla aplikacji: pigułka „Strona n z m” poza trybem zrzutów zostaje; P-993 nazywa możliwe zasłonięcie dolnego wiersza na iPadzie poziomo „P2 brzegowy”. Utrzymane jako uwaga o aplikacji (rola 08, nie blokuje 1221 ani zrzutów); w działaniu jej nie widziałem.
- **Z1 · P2 · znacznik „48” na wierszu „Row 21”.** Rola 08 (dane sceny): wzór sklepu z numeracją obejmującą rząd 48 albo znacznik postawiony na wierszu o numerze zgodnym z etykietą; wymaga powtórki zrzutów (build zrzutów, macOS, bez TestFlight i bez testu właściciela).
- **Z2 · P3 · zakreślenia** (swipe od 10% zamiast 20%, wysokość pod wiersz; w pl iPhone pas kończy się w środku słowa, drugi pas w 04 stoi między wierszami). Rola 08, ta sama powtórka co Z1.
- **U4 · P3 · podpis 04 bez notatki w kadrze.** Rola 10/11: podpis bez „notuj/write” (tylko metadane, bez powtórki) albo kadr z notatką (powtórka).
- **Z3 · P3:** linia znacznika przechodzi przez górę liter wiersza (wygląda jak przekreślenie); godziny w Historii różnią się o kilka minut między iPhonem a iPadem; puste obszary iPada na 01, 02, 05, 06, 07 (znane z `zrzuty-plan.md`).

## Decyzje (tryb analogia, do weta; nie wpisane do `docs/decyzje.md`, bo polecenie dopuszcza tylko `docs/jakosc/`)
Analogia: Trening poza zakresem sesji; `docs/fakty-wlasciciela.md` sprawdzony — bez wpisu o zrzutach. Według rekomendacji.
- **P-996** Zrzuty z przebiegu 44677685872 spełniają wymagania P-992: werdykt **DO SKLEPU Z UWAGAMI**; U2 zamknięte dla zrzutów; OG-07 dla 03/04 spełnione na tych plikach (wynik WR1 potwierdzony). Odrzucone: DO POWTÓRZENIA (nie ma P0/P1; Z1 jest kosztownym w poprawie, ale nie błędem produktu).
- **P-997** Wysyłka do App Store Connect: dwie opcje do decyzji koordynatora. **(A) Wysłać te pliki** po zmianie podpisu 04 (U4) i przyjęciu Z1 jako znanego P2; koszt: zero powtórek; ryzyko: kadr 03/04 (iPad) z niewiarygodnym znacznikiem w głównym zrzucie wzoru. **(B) Jedna zbiorcza powtórka** z poprawką wzoru/znacznika (Z1), swipe'ów (Z2) i opcjonalnie kadru z notatką (U4); koszt: jeden przebieg zrzutów (build ≈ 40 min, macOS bywa niedostępny ok. 14:00–23:00 UTC wg faktów właściciela) i ponowny przegląd 03/04 przez 07 (P-218 (6)); bez TestFlight i bez testu właściciela. **Rekomendacja: (B)**, o ile powtórka mieści się w czasie do wysyłki; jeśli nie, (A) z jawnie przyjętym Z1. Do ponownego przeglądu po (B) 07 obejrzy znowu 03/04 (OG-07 (6)).

## Nie sprawdzono (zrzuty)
Aplikacji na symulatorze i urządzeniu (kadry z CI); maszynowa detekcja napisów (OCR niedostępny — przegląd wzrokowy 56 plików, plus testy 4e46688c, których nie uruchamiałem); zachowania pigułki w zwykłej aplikacji; podpisów w 33 pozostałych językach (tylko en i pl); zgodności z wytycznymi App Store i metadanych (rola 10).

## Zrzuty sklepu — 27 języków iPhone 6.9″, WR4 (2026-11-22)
Rola 07, tryb audit (polecenie WR4 @ d6eb6c5d, KO-194). Gałąź `claude/wr4-zrzuty-jezyki-2026-11-22` od 5310ea0b. Materiał: przebieg „Zrzuty sklepu” **45021511463** (SHA 5310ea0b, gałąź ZR6; aplikacja z przebiegu 44697325331 = build 1221), artefakty `sklep-zrzuty-ramki` (id 14762870556) i `sklep-zrzuty-surowe` (id 14762785642), po 189 plików (27 języków × 7 scen); sumy zipów równe digestom artefaktów. Wzorzec: en/pl z WR3 (przebieg 44758366101, artefakt 14640946446). Dowody: `docs/jakosc/werdykt-1221/wr4/` (`tabela-pomiarow.md` — język × scena, `pasy-ramki-pomiar.txt`, `pasy-pomiar.py`, `podpisy-bbox.txt`, `kontrola-przebiegu-45021511463.txt`, `wr4-04-pasy-wycinek.jpg`). Wszystkie 189 ramek obejrzane; surowe — te same piksele plus próbka 4 plików.

**Werdykt łączny: DO POWTÓRZENIA** — wyłącznie scena **04-zakreslenie** w 10 językach: **de, el, fr, id, ja, ms, nl, ro, ru, uk**. Pozostałe sceny tych języków i wszystkie 7 scen 17 pozostałych języków: **DO SKLEPU Z UWAGAMI** (cs, da, es, es-419, fi, hr, hu, it, ko, nb, pt, pt-BR, sk, sv, tr, vi, zh-Hant). Brak P0/P1.

| Pytanie z polecenia | Wynik |
|---|---|
| 1. Komplet | **tak**: 27 × 7 plików w surowych i w ramkach, nazwy jak w en (`01-dzis`…`07-kalendarz`), wszystkie 1320×2868 (`identify`, bez błędów) |
| 2. Język | interfejs i podpis ramki w języku katalogu w 27/27; znaki diakrytyczne (cs, hr, hu, ro, tr, vi, el, ru, uk) i CJK (ja, ko, zh-Hant) bez „tofu”. Zawartość użytkownika (PDF „Cable Hat”, notatka „next: 3 knit, then cable”, nazwy projektów) jest po angielsku we wszystkich językach (P3, jak we wzorcu en) |
| 3. Tekst | podpisy mieszczą się w ramce (obwiednia 94–1223 px z 1320, `podpisy-bbox.txt`; dolna krawędź ≤ 467 px, urządzenie od ok. 555 px); brak wielokropków i zachodzenia na urządzenie, w tym de, fi, el, hu, ru, uk, pt-BR, fr. Uwagi P3: pt 02 (podpis przycisku zawija się i dotyka krawędzi), id/ms 03–04 (pasek licznika w 3 liniach), ja 04 (osierocone „す。”), el/ru/ms/fr 06 (nagłówek „listopad” pod paskiem kart ucięty do resztki) |
| 4. Stan sceny | 02/03/04/06 pokazują właściwy ekran w 27/27, w tym hu, pt, vi i każdy język po pierwszym w swojej części (P-1011/P-1012 — nie wróciło): notatka i licznik 20, PDF z 1 zakreśleniem (03), 2 zakreśleniami (04) i znacznikiem „Row 21”, Historia z 8 wpisami. **04: drugi pas zakreślenia poza wierszem Row 13 w 10 językach** (niżej) |
| 5. Nakładki | brak nakładek diagnostycznych E2E, pigułki „Strona n z m”, panelu „Test store”, klawiatury i alertów w 189 kadrach |
| 6. OG-07, 03/04, zgodność z 1221 | ograniczenia P-218 (1)–(5) zgodne jak w WR3 (jeden PDF „Cable Hat”, 1 strona, 1 znacznik rzędu i licznik, brak filmu, zakreślenia osobną warstwą, znacznik z licznika); kontrola przebiegu 03=1 i 04=2 pasy w 27/27; (6) wykonane na kadrach. Kod aplikacji: `git diff 4e46688c 5310ea0b -- src app modules ios assets package.json` pusty, a od 1221 (a830eb21) 9 plików, 44+/25−, jak w WR2 (P-993) |
| 7. Kontrola przebiegu | zadania iphone 1–8, plan i komplet: success (build pominięty); „Test ramek i podpisów”: 27 testów PASS; `wymiary-asc` OK (189 plików, surowe i ramki); `komplet-zrzutow` KOMPLET; `kontrola-zakreslen` „OK (27 par)”; „Ramki: 189 plików”. Pełna końcówka: `kontrola-przebiegu-45021511463.txt` |

**Wada (rodzaj D, P2, realna, pewność wysoka): drugi pas zakreślenia w scenie 04 trafia w złe miejsce w 10 językach.** Wzorzec en: drugi pas podkreśla Row 13. W de, el, fr, ja, nl, ro, ru, uk podpowiedź nad PDF zawija się do 2 linii, strona PDF schodzi o 35 px, a pas stoi na stałej wysokości ekranu — podkreśla Rows 10-12; w id i ms strona jest 23 px wyżej i pas wisi między Row 13 a Rows 14-20 (`wr4-04-pasy-wycinek.jpg`: en, de, id, nl; pomiar `pasy-ramki-pomiar.txt`: kolumna `lines`, puste = poza wierszem). Mechanizm: współrzędna swipe'a w scenie 04 jest stała, położenie PDF zależy od liczby linii podpowiedzi i tytułu; w 17 językach z jedną linią (pagetop 1034–1046) trafia w Row 13. Kontrola `kontrola-zakreslen.mjs` liczy pasy, nie wiersze, więc przeszła mimo wady. Wpływ: główny kadr przewagi (zakreślanie na wzorze) pokazuje zakreślenie niezgodne z opisem „zakreśla wiersz” i niezgodne z en/pl zaakceptowanymi w WR3; nie myli co do funkcji, osłabia wiarygodność (jak Z2 z WR2, tu bez wyjątku na układ). Powtórka tych scen bez zmiany sceny da ten sam wynik (układ deterministyczny od liczby linii).

**Do powtórzenia:** 04-zakreslenie × {de, el, fr, id, ja, ms, nl, ro, ru, uk} (10 plików, surowych i w ramkach), po poprawie sceny (rola 10/08, poza zakresem WR4): swipe liczony od położenia wiersza albo stała liczba linii podpowiedzi. Mechanizm uzupełnienia pojedynczych scen jest w workflowie (`uzupelnij_z_przebiegu=45021511463`, krok „Nałożenie poprzednich zrzutów na nowe”) — nie uruchamiałem go. Do rozszerzenia kontroli: sprawdzenie, że pas 2 nakłada się na wiersz tekstu (`pasy-pomiar.py` jest gotowym rachunkiem).
**ZR7 (rola 10 fix, KO-195, P-1016–P-1018; 2026-11-22):** scena 04 poprawiona (drugi swipe per grupa języków: 47% de/el/fr/ja/nl/ro/ru/uk, 45% id/ms, 46% pozostałe) i kontrola zakreśleń mierzy położenie pasa względem wiersza 13 (test na prawdziwych kadrach: 10 języków BŁĄD, 19 + iPad OK). Powtórka sceny 04 na macOS jeszcze nie odbyła się; wejścia uzupełnienia: P-1017. Status zrzutów 10 języków: nadal DO POWTÓRZENIA do czasu ponownego przeglądu 07 na nowych kadrach.

**Uwagi P3 (nie blokują):**
- **W-1 · wszystkie 27:** podpis 04 obiecuje pisanie/notatki, kadr notatki nie pokazuje (U4 z WR2).
- **W-2 · wszystkie 27:** scena 06 pokazuje godziny w 12 godzinach także w językach z zegarem 24 h (de, fr, ru…) — region symulatora.
- **W-3 · nl:** podpisy ramek w Noto Sans Bold (`scripts/ci/ramki-sklepu.sh:12`, „kroj.systemowy: bg, el, nl, ru, sr, uk, vi”), inne języki łacińskie w Bree — niespójna czcionka; sprawdzić, czy celowe.
- **W-4 · it:** „ferro 21 / ferri finiti” (01) a „riga 21” (02) — nazewnictwo aplikacji (rola 06/08).
- **W-5 · pt, id/ms, ja, el/ru/ms/fr:** jak w wierszu 3 tabeli.

## Nie sprawdzono (WR4)
- iPad 13″ i 33 pozostałe języki (poza zakresem WR4); en/pl z WR3 użyte tylko jako wzorzec (pliki ponownie nieoceniane).
- Poprawności tłumaczeń (znaczenie, terminologia) — rola 06; wytycznych App Store i metadanych — rola 10; aplikacji na symulatorze/urządzeniu (kadry z CI).
- OCR niedostępny: przegląd tekstu wzrokowy na zestawieniach 360–400 px na kadr (drobne etykiety w tabbarze czytelne, mniejsze znaki — dla pewności zwiększałem tylko wycinek 04); 189 surowych plików nie oglądałem pojedynczo (te same piksele co w ramce plus próbka 4).
- Kroków przebiegu nie uruchamiałem — wynik przepisany z dziennika (`get_job_logs`).

## Zrzuty sklepu — scena 04 po ZR7, WR5 (2026-11-22)
Rola 07 (audit), polecenie WR5, KO-196 (do weta koordynatora); tylko `docs/jakosc/`. Przebieg „Zrzuty sklepu” **45049417804**, SHA 6632982a, gałąź `claude/zr7-scena04-2026-11-22`, `workflow_dispatch`, success; uzupełnienie z 45021511463 (krok „Nałożenie…”: 169 plików z poprzedniego przebiegu, 20 scen zrobionych od nowa: 03 i 04 × 10 języków; 3 zadania macOS: de,id,nl,uk · el,ja,ro · fr,ms,ru). Artefakty pobrane `curl`, sumy zipów równe `digest` z listy artefaktów (`werdykt-1221/wr5/sumy-zipow.txt`): `sklep-zrzuty-ramki` 14767465954, `sklep-zrzuty-surowe` 14767610848. Rachunek pasów: ten sam skrypt co WR4 (`werdykt-1221/wr4/pasy-pomiar.py`) na ramkach; kadry obejrzane na zestawieniach (`wr5/wr5-04-pas2-10-jezykow.jpg`, `wr5/wr5-03-10-jezykow.jpg`).

**Werdykt kadrów: DO SKLEPU Z UWAGAMI** (27 języków, 189 kadrów). Scena 04 w de, el, fr, id, ja, ms, nl, ro, ru, uk: **DO SKLEPU** (wada z WR4 usunięta); brak P0/P1; uwagi P3 W-1…W-5 z WR4 pozostają (poza sceną 04 ZR7 ich nie dotyczył).

**A1 · scena 04, 10 języków** (pas 1 = linia 4 = „Row 9”, pas 2 = linia 6 = „Row 13”; położenie w ramce 1320×2868, `rel` = od góry strony PDF; odchylenie = wynik kontroli z dziennika, w wysokościach wiersza, próg 0,9):

| Język | góra strony | pas 1 (rel, linia) | pas 2 (rel, linia) | odchylenie CI | było w WR4 (45021511463) |
|---|---|---|---|---|---|
| de, el | 1069 | 403, linia 4 | 525, linia 6 | 0,10 | pas 2 na „Rows 10-12” |
| fr, ja, nl, ro, ru, uk | 1069 | 403, linia 4 | 525, linia 6 | 0,06 | pas 2 na „Rows 10-12” |
| id, ms | 1011 | 402, linia 4 | 538, linia 6 | 0,67 | pas 2 między Row 13 a Rows 14-20 |

Żaden pas nie dotyka sąsiedniego wiersza (każdy pas nakłada się na dokładnie jedną linię tekstu: `lines[4]`, `lines[6]`). Pozostałych 17 języków: pas 1 na linii 4, pas 2 na linii 6 (rel 524–536), jak przed ZR7. Pełna tabela 27 języków: `wr5/pasy-04-nowe-ramki.txt`. Obserwacja bez wpływu na werdykt: pas 2 jest cienki (9–10 px) w cs, da, de, el, es, a w pozostałych 22 językach gruby (23–24 px); en (wzorzec WR3) jest cienki, a w 17 niezmienionych językach różnica istniała już w WR4.
**A2 · scena 03, 10 języków:** jeden pas na linii 4 („Row 9”, rel 402–403) w 27/27 (`wr5/pasy-03-nowe-ramki.txt`); 03 wróciła razem z 04 (zadanie robi obie), różnice względem 45021511463 to szum antyaliasingu (≤ 1596 px z 3,8 mln, maks. różnica kanału 18/255), wizualnie bez zmian.
**A3 · komplet i brak regresji:** 27 języków × 7 scen = 189 plików, każdy 1320×2868, RGB, w surowych i w ramkach (`identify` lokalnie). Względem 45021511463 **piksele identyczne (maks. różnica kanału 0) w 169 z 189 plików** (17 języków × 7 scen oraz sceny 01, 02, 05–07 w 10 językach); pliki nie są identyczne bajtowo (ponowne kodowanie PNG w kroku „Kanał alfa precz” — pikselowo bez różnic), dlatego porównanie robiłem na pikselach (`wr5/roznice-pikseli-*.txt`). Zmienione: 03 i 04 × 10 języków, dokładnie te 20 plików z listy `powtorz`; w 04 zmiana tylko w pasie y 1272–1364 (surowe), reszta kadru bez zmian.
**A4 · kontrola przebiegu** (zadanie „komplet”, id 137306186917, dziennik z `get_job_logs`, kroki success): test ramek i podpisów 30/30 (2 zestawy); „Surowe zrzuty: 189 plików”; `wymiary-asc.mjs` → OK (189 plików); `komplet-zrzutow.mjs` → KOMPLET; `kontrola-zakreslen.mjs` → 27 × „OK 6.9/<język>: 03=1, 04=2 pasów zakreślenia” oraz 27 × „POŁOŻENIE OK … pas 2 na wierszu 13” (odchylenia 0,06–0,67, próg 0,9) i „Kontrola zakreśleń: OK (27 par)”; ramki: 189 plików, wymiary OK, 27 języków. Wynik kontroli zgadza się z moim pomiarem na pikselach (kontrola i rachunek `pasy-pomiar.py` są niezależnymi implementacjami).

**Nie sprawdzono (WR5, A):** iPad 13″ (przebieg tylko iPhone, `urzadzenia=iphone`); 8 lokalizacji spoza 27 języków; poprawności tłumaczeń (06) i metadanych sklepu (10); kroków przebiegu nie uruchamiałem, wynik z dziennika. Pozostałe uwagi P3 z WR4 (W-1…W-5) nie zmieniły się.

### Recenzja niezależna kodu ZR7 (`git diff 1402e7f4 6632982a`, bez raportu autora)
**Werdykt recenzji: PRZYJĄĆ Z UWAGAMI** (brak znalezisk P0/P1; trzy P2 w testach i dokumentacji, żadne nie zmienia wyniku kadrów). Zakres: `e2e/zrzuty-sklepu/04-zakreslenie.yaml`, `scripts/ci/kontrola-zakreslen.mjs`, testy w `tests/wydanie/`. Dowody: `wr5/jest-zr7-testy.txt` (6 zestawów, 149 testów, kod 0), `wr5/dowod-czerwony-powtorzony.txt`, `wr5/mut-*.txt`, `wr5/kontrola-na-wycinkach-baza.txt`.

| Pytanie z polecenia | Wynik |
|---|---|
| Dokładnie jedna gałąź `runFlow when` na język | **Tak.** Trzy gałęzie iPhone/en (`e2e/zrzuty-sklepu/04-zakreslenie.yaml:37-48`) tworzą podział: grupa 8 języków, grupa `id`/`ms`, dopełnienie `!includes` (en i 17 pozostałych); pl i iPad bez zmian (diff dotyka tylko jednego bloku). Test `zrzuty-zakreslenie-jezyki.test.ts` wylicza warunki prawdziwym `new Function` dla 29 języków × iPhone i wymaga dokładnie jednej prawdziwej gałęzi; przebieg 45049417804 wykonał obie sceny w 10 językach z pasem na wierszu 13, więc warunek działa na silniku Maestro. Mutanty sceny: 47→46 (9 czerwonych), `ms` poza grupą (4), podwójne pokrycie `ms` (4), `uk` poza grupą (4) — wszystkie wykryte; 45→44 dla id/ms przeżył, bo 44% nadal mieści się w kryterium 0,9 (model 0,59), więc to mutant równoważny, nie luka. |
| Progi kontroli nazwane i uzasadnione | **Tak, z zastrzeżeniem.** Stałe nazwane (`scripts/ci/kontrola-zakreslen.mjs:58-66`: `PROG_CIEMNY` 140, `MIN_CIEMNYCH` 3, `CIEMNE_OD/DO`, `MAX_PRZERWA_TEKSTU`, `ODCHYLENIE_MAX` 0,9) z komentarzem i pomiarem; 0,9 = środek luki między poprawnymi a błędnymi kadrami. Uzasadnienie `PROG_CIEMNY`/`MIN_CIEMNYCH` to jedno zdanie bez pomiaru czułości; mutanty `PROG_CIEMNY=255` i `MIN_CIEMNYCH=400` wykryte. Zastrzeżenie: R-1. |
| Kontrola nie słabsza niż przed ZR7 | **Tak.** `liczPasy` zachowuje tę samą logikę (refaktor do `zakresyPasow`, `jestZolty`, progi i warunek „04 > 03” bez zmian), nowe sprawdzenie jest dodatkiem; test `kontrola-zakreslen.test.ts` zmienia tylko pomocnika `zrzut()` (dodaje wiersze tekstu) i dopisuje przypadki, żadnej asercji nie osłabiono. Nowa kontrola wykrywa 10 błędnych kadrów z 45021511463, stara kontrola na tych wycinkach: „OK (0 par)”, kod 0. |
| Testy nie dopasowane do wyniku (czerwone przed poprawką) | **Tak, powtórzone przeze mnie.** Kontrola z 1402e7f4 + test z 6632982a: 32 z 33 padło na asercji („Expected pattern … BŁĄD … pas 2 poza wierszem 13”, „Received … POMINIĘTO”), nie na imporcie; scena z 1402e7f4 + test `zrzuty-zakreslenie-jezyki`: 11 z 62 czerwone (10 języków + „języki bez przesunięcia”), jak w `docs/jakosc/zr7-dowod-czerwony.txt`. Oracle położenia wiersza 13 to piksele prawdziwych kadrów z przebiegów (nie kod), a swipe → pas w modelu opiera się na zmierzonym przesunięciu. Mutanty kontroli: próg 1,3; wiersz 12/14 zamiast 13; `ok: true`; pas 1 zamiast 2; `PROG_CIEMNY`; `MIN_CIEMNYCH` — wszystkie wykryte; próg 0,5 **przeżył** (R-1). |
| Wycinki w `tests/wydanie/dane/` bez danych osobowych | **Tak.** 31 PNG 500 px (przycięte do y ≥ 1000, bez paska statusu iPhone; iPad bez przycięcia pokazuje wbudowany pasek symulatora „9:41 AM Fri Nov 20”), bez chunków tekstowych/EXIF (`strings` po `tEXt|iTXt|eXIf|zTXt`: 0 w 31 plikach), treść: wzór „Cable Hat” z danych sklepu; JSON zawiera tylko współrzędne i sumy SHA-256. |

**Znaleziska recenzji** (rodzaj D; poziom według skali roli; żadne nie blokuje):
- **R-1 · P2 · brzegowy · pewność wysoka · JAK-04.** Test kontroli na wycinkach nie odtwarza liczb z przebiegu, więc słabo chroni próg: wycinki 500 px (przycięcie `+0+1000` zmienia siatkę próbkowania) dają odchylenie poprawnych kadrów ≤ 0,50 (`wr5/kontrola-na-wycinkach-baza.txt`: cs, da, en, es, hr, it, nb, pt, pt-BR, sk, tr = 0,50), a pełne kadry w CI dają 0,56 (cs, da, es), 0,61 (hr, it, nb, pt, pt-BR, sk, tr) i 0,67 (id, ms). Mutant `ODCHYLENIE_MAX = 0.5` przechodzi testy (10 BŁĄD, 21 OK jak baza), a w CI zaczerwieniłby co najmniej 12 poprawnych kadrów. Mechanizm: `grep -n "ODCHYLENIE_MAX" -r scripts tests` → `scripts/ci/kontrola-zakreslen.mjs:66`, `tests/wydanie/zrzuty-zakreslenie-jezyki.test.ts:15` (osobna kopia stałej, nie import). Skutek dla użytkownika: żaden (kontrola kadrów, nie funkcja aplikacji); ryzyko: ktoś zaostrzy próg „dla pewności” i dowie się dopiero z czerwonego przebiegu macOS. Opcje: (a) test na wycinkach bez przycięcia pionowego (siatka jak w CI) albo oczekiwane odchylenia z przebiegu jako wartości z tolerancją — rekomendowana; (b) zostawić, bo przebieg CI jest właściwą bramką. Test akceptacyjny: mutant 0,5 (i 0,6) czerwony.
- **R-2 · P2 · pewność wysoka · JAK-15.** Liczby w opisie P-1016/P-1018 i w komentarzu kodu są obalone przebiegiem 45049417804: „model daje odchylenie ≤ 0,48 we wszystkich 29 językach” (`docs/decyzje.md:863`) — w CI id i ms mają 0,67; „poprawne 0,06–0,61” i margines „0,29 i 0,30” (`scripts/ci/kontrola-zakreslen.mjs:64`) — poprawny zakres to 0,06–0,67, margines od dołu 0,23; „wynik na pełnych kadrach jest ten sam … identyczne do 0,01” (`docs/decyzje.md:865`) — różnice do 0,11 (hr: 0,50 vs 0,61). Wniosek: 0,9 nadal leży w luce (0,67 … 1,20), ale margines jest mniejszy niż zapisany; model sceny zaniża id/ms o ≈ 0,2 (45%: model 0,47, kadr 0,67). Opcje: (a) poprawić liczby w komentarzu i rejestrze — rekomendowana; (b) zostawić. Nie dotyka kadrów.
- **R-3 · P2 · brzegowy · pewność wysoka · JAK-17.** Komentarz „za mało pasów zgłasza kontrola liczby pasów powyżej” (`scripts/ci/kontrola-zakreslen.mjs:146`) jest fałszywy dla kadru 04 bez pary 03: gałąź „POMINIĘTO” (`:133`) pomija liczenie, a `continue` w `:146` pomija pozycję. Próba: katalog z jednym kadrem 04 z jednym żółtym pasem, bez 03, kod 0, „OK (0 par)” (`wr5/dowod-czerwony-powtorzony.txt`). Stara kontrola robiła to samo (nie jest regresją), a brak 03 zgłasza `komplet-zrzutow.mjs` w tym samym kroku (przebieg czerwony), więc realne ryzyko jest niskie. Opcje: (a) BŁĄD przy < 2 pasach także bez 03 (`:146`) — rekomendowana, jedna linia i test; (b) poprawić komentarz.

Uwaga bez poziomu: nowy język spoza 29 trafi do gałęzi „pozostałe” (46%); to jawne ryzyko z P-1016 i ono jest przykryte kontrolą kadrów (BŁĄD przy złym położeniu), więc nie jest znaleziskiem.

**Nie sprawdzono (recenzja):** pełny `npm run verify` (autor: kod 0, 733 zestawy, 8114 testów, `docs/jakosc/zr7-verify.txt`); wykonania sceny na symulatorze poza dziennikiem przebiegu; `zr7-maestro.txt` (parsowanie Maestro CLI 2.12.1) — nie powtarzałem, ale sam przebieg 45049417804 wykonał scenę z nowymi gałęziami.
