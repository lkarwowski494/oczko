# Monetyzacja: Oczko
Stan: **fix 2026-10-25 (Z07-07–Z07-09, L-19, Z07-01, Z07-02): STOP E2** (E0: P-103) · fix 2026-10-22 (NZ-01, NZ-02, P-065): zakończony (E0: P-067, E2: P-068) · sesja 3 zakończona 2026-10-22: model V4 bez próby (P-057; STOP E3 przyjęty: P-058) (V1/V2 odrzucone: P-056; STOP E0: P-054) · sesja 2 zakończona 2026-10-22 (STOP E3 przyjęty: P-036, P-037; po zamknięciu P-038; STOP E2: P-029–P-035; STOP E1: P-027, P-028) · krok 0 zakończony (sesja 1: bramka „budować”, P-013) · Aktualizacja: 2026-10-22 · Wejście sesji 2: BRD `docs/brd/` (E4, 2026-10-21), ZAL-001–024, P-001–P-026

Rola 02-monetyzacja, tryb build, moduły `oplacalnosc,cena-i-rachunek` (prompt z biblioteki `prompts` @97ec212, 65 593 znaków). Kwarantanna P-003: nie czytano `archiwum/`, kodu ani historii git sprzed 2026-10-21. Niezależność D-023: nie otwierano repo `portfel-aplikacji`; `find` po nazwach `monetyzacja*`, `prognoz*`, `rachunek*`, `portfel*`, `wycena*`, `*forecast*`, `*oplacalnosc*` w repo Oczko (bez `node_modules`): brak trafień.

## Fix 2026-10-25: Z07-07, Z07-08, Z07-09, L-19 · E0 plan (STOP)
Rola 02-monetyzacja, tryb fix (prompt `prompts` @97ec212, 4 moduły: audyt-paywalla, cena-i-rachunek, rachunek, storekit-expo; 58 001 znaków; promptu nie commituję). Zlecenie: sesja koordynująca wg P-087 (poprawki przed rolą 08, P-091 11a, P-100). Wejście: `docs/jakosc/e1/zgloszenia-e1.md:18–20`, `docs/jakosc/e1-ryzyka.md` (R-031, R-048, R-098–R-106, R-111–R-116, R-120, R-178), `docs/jakosc/e4/tabela-08.md:20–25`, P-057, P-065, P-067, P-089, P-091 (7b), BR-LIC-019 „Cofnięcie serii zwraca dzień limitu” (`docs/brd/wymagania-licznik.md:345–349`), ADR-0009. Kwarantanna (CLAUDE.md, P-003): nie czytano `archiwum/`, `src/`, `tests/` poza `tests/wektory/` ani historii sprzed 2026-10-21. Analogie z Treningu (P-087; repo publiczne, odczyt 2026-10-25): `lib/access.ts` @c403843 (`main`), `lib/store-native.ts:63–77`, `lib/store-adapter.ts:26–27`, `docs/27-subskrypcja-spec.md:33`, gałąź `monetyzacja-1-0` @1f679b2 `docs/monetyzacja.md:27–32`, `lib/fairrules.ts`.

**Środowisko (ETAP 0, 2026-10-25):** Linux 6.18, Node v22.22.0, git na `claude/jolly-thompson-paz6d8` (równolegle sesja 03 fix: `git pull --rebase` przed pushem); GitHub przez proxy i MCP, push na gałąź; Xcode brak (scenariusze StoreKit = krok właściciela w TestFlight). Stan przed: `node docs/monetyzacja/limit-test.mjs` „zgodne 35 z 35 wektorów”, `node docs/monetyzacja/dostep-test.mjs` „zgodne 24 z 24 wektorów”, oba kod 0; `mutanty-e1.mjs` (07): 7 z 18 mutantów przeżywa.

| ID | Rodzaj | Co | Plan (test czerwony → poprawka → pełny zestaw → commit z ID) |
|---|---|---|---|
| Z07-07 | **D** (siła wektorów, 2 zmiany zachowania) + jedno pytanie (1) | 5 mutantów `limit.mjs` przeżywa; świat wektorów niemożliwy (`teraz` = 2027-01-15 przy `dzis` 2026-11, R-101); duplikat daty liczy się dwa razy (R-102); dowolny wyjątek spełnia „błąd danych” (R-178); brak daty wznowienia w grudniu (R-105) | wektory L-04c (dokładnie 3 600 000 ms → nowy dzień), L-04d (3 599 999 ms → praca w toku), L-04e (różnica 0), L-21 (dzień zaczęty z Pro, Pro wygasło tego dnia, 5 z 5 → dozwolone), L-22 (inne `limit`, `przerwa`), L-23 (duplikat daty), błędy `teraz: NaN` i nieznany rodzaj z kodem `BLAD_DANYCH` (klasa `BladDanych` zamiast `Error`), Z-09 (`pro`, 4 z 5 → bez `ostatniDarmowy`) + własność w teście „przy `pro` nigdy `ostatniDarmowy` ani `limitZawczasu`”; `strefa` w wektorach i kontrola `dzis` = data lokalna `teraz` (wszystkie `teraz`/`ostatniPlus` przeliczone z zachowaniem różnic); nowa funkcja `wznowienieLimitu(dzis)` z wektorami Z-10 (31 grudnia → `RRRR+1-01-01`); dowód siły: `mutanty-e1.mjs` przed/po |
| Z07-08 | **D** (wektory) + **P** (2), (3), (4) | 3 mutanty `dostep.mjs` przeżywają; brak W-19 (dwie subskrypcje), styku `wygasa = teraz`, pamięci bez klucza `wygasa`, karencji, zakupu oczekującego, zegara w przód offline i reguły Pro zegarka | W-19a/b (miesięczna + roczna, obie kolejności → `wygasa` = późniejsza), W-20 (`wygasa = teraz` → brak, sklep i pamięć), W-21 (`teraz + 1` → jest), P-07 (pamięć bez klucza `wygasa` → `null`, zachowanie bez zmian: uszkodzony zapis nie daje Pro bez końca); karencja według (2); W-22 zakup oczekujący (sklep bez uprawnienia → brak dostępu, powód `brak`, nie `blad`; po zatwierdzeniu → dostęp) i funkcja `komunikatZakupu(status)` (`oczekujacy` → „czeka”, nie błąd; `anulowany` → bez komunikatu, bez fałszywego sukcesu; MON-04); okno offline według (3); `proZegarka()` i wektory „Pro zegarka” w jednym JSON dla TS i Swift według (4) |
| Z07-09 | **P** (5), (6) + **D** L-19 | okno „Uczciwe zasady” bez definicji „ukończonego dnia” (P-089 (3a), R-120); `pro` przy scaleniu tego samego dnia z dwóch urządzeń bez reguły (R-048); seria RD-17 a dzień limitu (R-106) | funkcja `oknoUczciweZasady()` z wektorami O-* według (5); `scalDni()` z wektorami L-20 według (6) (wzorzec dla `scal` roli 05, ADR-0005); L-19 według P-091 (7b) niżej |
| L-19 | **D** (decyzja jest: P-091 (7b), BR-LIC-019) | „Cofnij” z pytania o serię RD-17 zwraca dzień limitu, gdy seria zaczęła dzień i dziś nie zostało inne dodanie; cofnięcie z historii nie zwraca (L-06) | funkcja `cofniecieSerii({ dni, dzienSerii, seriaZaczelaDzien, inneDodaniaDnia, zrodlo })` → `{ dni, zwrocono }`; wektory L-19a (zwraca), L-19b (wcześniejsze +1 dziś, nawet cofnięte −1 → nie zwraca; L-06), L-19c (seria w pracy po północy nie zaczęła dnia → bez zmian), L-19d (z historii → nie zwraca); KP-12 dopisane |

Typu **M** brak: limit dni to limit użyć, nie okres próbny (MON-01 bez zmian); karencję i jej długość w App Store Connect sprawdzę u źródła w dniu wdrożenia, jeśli (2) wybierze włączenie. Nowe znaleziska poza zleceniem (nie naprawiam): Z07-01 i Z07-02 (02, otwarte) — do następnej sesji 02 albo do decyzji koordynatora, czy dołączyć.

### Decyzje (STOP E0; P-087: najpierw Trening)
1. **Duplikat daty w liście dni (R-102).** (a) idempotentnie: liczą się różne daty, a data jest dniem z Pro, gdy którykolwiek wpis tej daty ma `pro` (spójne z (6a)); (b) warunek wstępny: duplikat to `BladDanych`. Kompromis: (b) wymusza porządek na wołającym, ale błąd w danych synchronizacji blokuje liczenie. **Rekomendacja: (a)** (Trening `recordLiveDay` trzyma jeden wpis na dzień, `lib/access.ts`, „jeden wpis na dzień”).
2. **Karencja płatności subskrypcji (R-112).** (a) jak Trening P7 A: Billing Grace Period włączony w App Store Connect (krok właściciela; długość sprawdzona u Apple w dniu konfiguracji), w `Uprawnienie` pole `karencjaDo`, dostęp do późniejszej z dat `wygasa`/`karencjaDo` (Trening `entitlementEnd`, `graceUntil`); adapter czyta `renewalInfo.gracePeriodExpirationDate` (Trening `store-native.ts:63–77`); (b) adapter wpisuje koniec karencji w `wygasa`, logika bez zmian (mniej kodu, ale reguła tylko w kodzie natywnym, bez testu w Node); (c) bez karencji. **Rekomendacja: (a).**
3. **Brak sieci po końcu opłaconego okresu, także zegar w przód (R-116).** (a) jak Trening P6 A: pamięć subskrypcji ważna jeszcze 7 dni po `wygasa`, gdy sklep nie odpowiada (`LASKA_OFFLINE_DNI = 7`, jedno miejsce); wyjątek nazwany od MON-08 „nie dłużej niż opłacony okres”, tańsza kontrola: tylko ścieżka błędu odczytu, udany odczyt sklepu zawsze rozstrzyga (zwrot nadal zabiera od razu); W-12 przesunięty na T−8 dni, nowy W-12b (T−1 ms → dostęp z pamięci); (b) 72 h (propozycja 07); (c) bez okna (dziś). **Rekomendacja: (a).**
4. **Pro na zegarku (ADR-0009 D, R-031).** (a) `proZegarka(zrodla, teraz)`: Pro, gdy którekolwiek źródło je potwierdza — kontekst z telefonu oceniany jak pamięć (`pro: true` i `wygasa` `null` = dożywotni albo w przyszłości, z oknem z (3)), StoreKit zegarka jak odczyt sklepu; `pro: false` nigdy nie daje Pro, także przy `wygasa: null`; (b) tylko daty, bez okna offline na zegarku. **Rekomendacja: (a)** (spójność z telefonem: zegarek bez telefonu to ten sam „brak sieci”).
5. **„Ukończony dzień” dla okna „Uczciwe zasady” (P-089 (3a), R-120).** (a) dzień z robótką jest ukończony, gdy jego data minęła: okno przy pierwszym otwarciu aplikacji w późniejszej dacie niż dzień bez Pro z ≥ 1 +1, raz (flaga w danych użytkownika i w kopii, jak `seenFairRulesManifest`), tylko wersja darmowa z pewnym stanem (bez „nieznany bez pamięci”), nigdy na ekranie licznika (najbliższe wejście na listę projektów); (b) propozycja 07: także pierwsze przejście w tło po dniu z +1 — okno pojawia się po powrocie tego samego wieczoru, w trakcie dziergania; (c) po pierwszej przerwie ≥ 60 min (D3) tego samego dnia — jak (b), szybciej, ale dzień nie musi być skończony. Trening pokazuje okno na podsumowaniu zakończonego treningu (jawny koniec); Oczko nie ma jawnego końca dnia, więc najbliższy odpowiednik to minięcie daty. **Rekomendacja: (a).**
6. **`pro` przy scaleniu tego samego dnia z dwóch urządzeń (R-048).** (a) OR: dzień raz zaczęty z Pro zostaje dniem z Pro (D5: Pro było aktywne); (b) AND: liczy się, jeśli którekolwiek urządzenie zaczęło go bez Pro; (c) wcześniejszy zapis wygrywa (wymaga czasu startu w danych). **Rekomendacja: (a)** (na korzyść użytkownika, bez obejścia: `pro: true` wymaga aktywnego Pro).
7. **L-19, interpretacja do weta (bez wyboru, P-091 (7b)):** „inne dodanie dziś” liczy każde zdarzenie zaczynające dzień (`wolaStraznika` = true) spoza serii, także później cofnięte −1 (L-06 bez zmian); dzień wraca tylko z pytania strażnika RD-17, nigdy z historii.

### Czas (zasada 9)
Agent: ok. 2,5–3 h (4 commity z ID, testy czerwone, mutanty przed/po, KP, E2). Oczekiwanie: brak. Koordynator: 6 wyborów + weto 7 (ok. 5 min). Właściciel: przy konfiguracji App Store Connect włączenie karencji, jeśli (2a).

### E2 dowody (STOP, 2026-10-25)
Decyzje E0: P-103 (1a–6a, weto 7 przyjęte, Z07-01 i Z07-02 dołączone). Dowody: `oczko-warsztat/02-monetyzacja/2026-10-25-fix-z07/E2-dowody.md` (`sprawdz-raport` kod 0). Jeden commit na ID: Z07-07 cb9f702, L-19 3bc0a14, Z07-09 33b830c, Z07-08 b8d7cd6, Z07-02 bfc1689 (+ 872ca55), Z07-01 9071049.
| Kontrola | Przed | Po |
|---|---|---|
| `node docs/monetyzacja/limit-test.mjs` | 35/35 (słabe: 7 mutantów przeżywa) | 77/77 + własności (strefa, Pro, duplikaty, przemienność scalenia, cytaty BRD) |
| `node docs/monetyzacja/dostep-test.mjs` | 24/24 (3 mutanty przeżywają) | 56/56 |
| mutanty limit + dostęp (07 i dodatkowe) | 12 przeżywa | 0 przeżywa (28/28 dodatkowych zabitych) |
| `npx jest`, typecheck, lint, `jakosc:kontrole` | 1080/1080 | 1080/1080, kod 0 |
Nowe w wzorcach: `BladDanych`, `wznowienieLimitu`, `cofniecieSerii` (L-19), `scalDni` (L-20), `oknoUczciweZasady` (O-*), `LASKA_OFFLINE_MS`, `karencjaDo`, `komunikatZakupu` (K-*), `proZegarka` (PZ-*). Kontrakt: KP-06, KP-07, KP-12, KP-15 dopisane, KP-16, KP-17 nowe; krok właściciela 6 (Billing Grace Period 3 dni, All Renewals). Polecenia dla 05, 07, 08, 04: w raporcie E2. „Zweryfikowane” nadaje reaudit.

## Fix 2026-10-22: NZ-01, NZ-02, P-065 (1a) · E0 plan (STOP)
Rola 02-monetyzacja, tryb fix (prompt `prompts` @97ec212, kopia: `oczko-warsztat/02-monetyzacja/2026-10-22-fix-nz/02-fix-prompt-2026-10-22.md`). **Wyjątek nazwany (zasada 19):** ta sama sesja co role 01 i 04, polecenie właściciela „Działaj” (2026-10-22); tańsza kontrola: stan z plików, punkt czyszczenia na STOP. Wejście: P-060 (5b), P-065, P-066, NZ-01–NZ-03 (`oczko-warsztat/01-odkrywanie/fix-2026-10-22-er25-28/E0-plan.md`), OP-32, `docs/design/przejscie/wynik.md`. Stan przed: `node docs/monetyzacja/limit-test.mjs` „zgodne 14 z 14 wektorów”, kod 0.

| ID | Rodzaj | Co | Plan |
|---|---|---|---|
| NZ-01 | **P** (reguła limitu) | KP-12 i D4 mówią tylko o „+1 i ręcznym wpisaniu numeru rzędu”; nie wiadomo, czy strażnik dotyczy zerowania, −1, liczników innych niż rzędy oraz +1 z zegarka i ekranu blokady | decyzje 1–4 niżej; potem wektory L-16–L-19 (test czerwony przed zmianą), `limit.mjs` bez zmian albo z polem rodzaju zdarzenia, KP-12 dopisane; ER-30 do 01 (BR-ZAK-005, OP-32) |
| NZ-02 | **P** (przypadek brzegowy) | nowe urządzenie z iCloud: pierwsze +1, zanim synchronizacja przyniesie dni, może dać 6. dzień w miesiącu | decyzja 5; wektor L-20 dokumentuje zachowanie po scaleniu |
| P-065 (1a) | **D** (zgodność kontraktu) | limit pokazany zawczasu wymaga sprawdzenia „czy start dnia byłby dozwolony” bez zapisu dnia; KP-12 mówi o strażniku przy +1, KP-13 o ekranie zakupu tylko przy próbie startu i w Ustawieniach | nowa czysta funkcja `mozeZaczacDzien()` w `limit.mjs` (ta sama reguła co `startDnia`, bez zapisu; L-04: praca w toku nie pokazuje limitu) z wektorami Z-01–Z-05 (czerwone przed dodaniem funkcji); KP-12 i KP-13 dopisane: komunikat na liczniku przed pierwszym rzędem dnia nie jest ekranem zakupu, ekran zakupu otwiera się tylko z odnośnika w nim i z Ustawień; potwierdzenie P-066 (BR-ZAK-006, commit 3d64639) |

Typu M brak (żadna stawka ani reguła sklepu się nie zmienia; limit liczony w dniach z robótką to limit użyć, nie okres próbny: MON-01 bez zmian).

### Decyzje (STOP E0)
1. **Zerowanie licznika w nowym dniu ponad limit.** (a) dozwolone, nie zaczyna dnia: zerowanie nie dodaje pracy, a następne +1 i tak zatrzyma strażnik, więc nie otwiera obejścia; (b) blokowane jak wpisanie (D4). **Rekomendacja: (a)**: dane i korekty zawsze wolne (KP-02, L-07).
2. **−1 w nowym dniu ponad limit.** (a) dozwolone, nie zaczyna dnia (korekta, zmniejsza liczbę; w stanie zawczasu ukryte razem z +1, ale dostępne z historii); (b) blokowane. **Rekomendacja: (a)**.
3. **Liczniki inne niż rzędy (oczka; powtórzenia, jeśli liczone osobno).** (a) każde +1 na dowolnym liczniku zaczyna dzień (to też praca przy robótce); (b) tylko liczniki rzędów (słowa P-058: „liczenie rzędów”), ale typ licznika wybiera użytkownik (BR-LIC-006), więc licznik „oczka” byłby darmowym licznikiem rzędów. **Rekomendacja: (a)**: bez obejścia; interpretuje P-058 („praca przy robótce”) szerzej, do weta.
4. **+1 z zegarka i z ekranu blokady (Live Activity).** (a) ta sama reguła na każdym urządzeniu, liczona z ostatnio zsynchronizowanej listy dni (P-039 dla Pro bez telefonu); na limicie zegarek pokazuje stan zawczasu bez +1 („No free crafting days left. See your iPhone.”), ekran blokady nie pokazuje +1; (b) zegarek i ekran blokady zawsze dozwolone (obejście limitu). **Rekomendacja: (a)**.
5. **NZ-02: nowe urządzenie przed synchronizacją.** (a) akceptujemy brzegowo jak L-14: lokalnie liczy się według tego, co urządzenie wie; po scaleniu lista może mieć 6 dni w miesiącu, wszystkie zostają (rozpoczęty dzień nigdy nie jest odbierany), następny nowy dzień jest blokowany; (b) na nowym urządzeniu pierwsze +1 czeka na synchronizację iCloud: przeczy NFR-PIE-001 (bez sieci) i blokuje liczenie offline. **Rekomendacja: (a)**.

### Czas (zasada 9)
Agent: ok. 1–1,5 h (wektory i testy czerwone, `limit.mjs`, KP-12, KP-13, E2). Oczekiwanie: brak. Właściciel: 5 odpowiedzi (ok. 3 min).

### Potwierdzenie P-065 (1a) i P-066 (rola 02, 2026-10-22)
Limit pokazany zawczasu jest zgodny z kontraktem po dopisaniu KP-12 i KP-13 (wyżej): strażnik pozostaje jedną regułą (`startDnia`), stan zawczasu to jej odczyt bez zapisu (`mozeZaczacDzien`, wektory Z-01–Z-08), komunikat nie jest ekranem zakupu, a limit dni to limit użyć, nie okres próbny (MON-01 bez zmian). BR-ZAK-006 po ER-29 (commit 3d64639) jest zgodne z KP-12, KP-13, Z-02, Z-03, Z-06: warunek „zależy od” z P-066 spełniony. Nowe znalezisko dla roli 01 (ER-30): BR-ZAK-006 „zamiast przycisków +1 i −1” a P-067 (2a) (−1 dozwolone): dopisać, że −1, zerowanie i cofnięcie z historii działają na limicie (z historii albo menu); BR-ZAK-005 i OP-32 według P-067 (NZ-01, NZ-02).

## Sesja 3, E3: Kontrakt płatności V4 (2026-10-22)
Model: **V4 „wzorzec Treningu” bez próby** (P-057): cała aplikacja darmowa, limit **5 dni z robótką w miesiącu**, Pro zdejmuje limit. Zastępuje kontrakt sesji 2 (model B) w częściach: produkty, podział darmowe/Pro, okres próbny, KP-01–KP-03; KP-04–KP-11 obowiązują z dopiskami niżej. Wektory i wzorce: `docs/monetyzacja/limit.mjs` + `wektory-limitu.json` (`node docs/monetyzacja/limit-test.mjs`: „zgodne 14 z 14 wektorów”, kod 0, `dowody/limit-2026-10-22.txt`; kontrola: kopia bez reguły D5 i kopia bez reguły przerwy D3 dają kod 1), `dostep.mjs` + `wektory-dostepu.json` (W-15–W-18 dla subskrypcji; „zgodne 24 z 24 wektorów”, kod 0, `dowody/dostep-s3-2026-10-22.txt`).

### Produkty
| Produkt (ID tymczasowe, P-038, OP-24) | Typ | Cena (kraj bazowy USA) | Oferta wprowadzająca | Family Sharing (nieodwracalne, MS-18) | Odblokowuje |
|---|---|---|---|---|---|
| `oczko.pro.monthly` | subskrypcja odnawiana, grupa „Oczko Pro” | 0,99 USD / 1 mies. | **brak** (P-057) | kierunek: włączone (D6), włączenie przy konfiguracji | brak limitu dni |
| `oczko.pro.yearly` | subskrypcja odnawiana, ta sama grupa | 6,99 USD / 1 rok | **brak** | jw. | jw. |
| `oczko.pro.lifetime` (albo ID istniejącego produktu Oczka, P-038) | Non-Consumable | 14,99 USD | — | jw. | jw. |

### Dostęp i limit
| Sytuacja | Co działa | Co blokuje strażnik |
|---|---|---|
| Dni w limicie albo Pro | cała aplikacja | nic |
| Na limicie (5 z 5), nowy dzień, bez Pro | podgląd projektów, historia, kalendarz, dopisanie wstecz, edycja historii i notatek, zerowanie, −1, eksport, kopia, synchronizacja iCloud (P-031, P-054), usunięcie danych, ustawienia, „Przywróć zakupy”, „Zarządzaj subskrypcją”, polityka prywatności, kalkulatory i słownik (nie są „pracą przy robótce”) | pierwsze +1 nowego dnia na dowolnym liczniku i urządzeniu oraz ręczne wpisanie wartości (D4, P-067); rozpoczęty dzień i praca w toku nigdy (L-02, L-04) |
| Pro wygasa (subskrypcja bez odnowienia, zwrot) | jak wyżej; do limitu liczą się tylko dni bez Pro (D5, L-09) | jak wyżej |

### Wymagania kontraktu (KP; zmiany wobec sesji 2)
| ID | Wymaganie | Dlaczego / źródło |
|---|---|---|
| KP-01 (zmienione) | Limit darmowy raz wydany tylko się luzuje (N rośnie, nigdy nie maleje; nic darmowego nie przechodzi za zaporę); kontrola przed każdym wydaniem: `LIMIT_DNI` i lista „zawsze działa” wobec poprzedniego wydania (07) | ZAL-025 |
| KP-02 (zmienione) | Utrata Pro (wygaśnięcie, zwrot, odebranie z rodziny): wraca limit dni; dane, historia, eksport i kopia zawsze dostępne | zasada roli 6; MS-27 |
| KP-03 (pełne) | Przy aktywnej subskrypcji ekran zakupu nie oferuje tej samej subskrypcji; dożywotni tylko z informacją, że subskrypcję trzeba anulować samemu, i z przyciskiem „Zarządzaj subskrypcją”; przy dożywotnim stan „Masz Pro” | MS-22 (3.1.2(b)) |
| KP-04 (zmienione) | Polityka prywatności i Terms of Use (standardowa EULA Apple) w aplikacji i w metadanych: przy subskrypcji wymagane | MS-02a, MS-32 |
| KP-12 (nowe; fix 2026-10-22) | Strażnik limitu tylko w `startDnia()` (wzorzec `limit.mjs`), wołany przy zdarzeniach, dla których `wolaStraznika()` daje true: każde +1 na dowolnym liczniku (rzędy, oczka, powtórzenia) i z każdego urządzenia (telefon, zegarek, ekran blokady; zegarek liczy z ostatnio zsynchronizowanej listy dni) oraz ręczne wpisanie wartości; zerowanie, −1 i edycja historii nie wołają strażnika (wektory S-01–S-10); nigdy przed licznikiem przy pierwszym uruchomieniu (NFR-PIE-001). **L-19 (fix 2026-10-25):** „Cofnij” w pytaniu o serię przypadkowych stuknięć (RD-17) zwraca dzień limitu (`cofniecieSerii()`), gdy seria zaczęła dzień i dziś nie było innego zdarzenia zaczynającego dzień, także później cofniętego; cofnięcie z historii nie zwraca (L-06; wektory L-19–L-19i) | P-053, P-057 D3–D5, P-067 (NZ-01), P-091 (7b), P-103 (7) |
| KP-13 (nowe; fix 2026-10-22) | Ekran zakupu tylko z odnośnika w komunikacie limitu i z Ustawień. Komunikat limitu to nie ekran zakupu: pokazywany zawczasu na ekranie licznika zamiast +1, gdy `mozeZaczacDzien().limitZawczasu` (nowy dzień ponad limit, nie praca w toku; Z-02, Z-03), a w przypadku brzegowym po zatrzymanym stuknięciu (L-03). Licznik dni (`zostalo`) na liście projektów i w Ustawieniach; na ekranie licznika tylko linia o ostatnim darmowym dniu (`ostatniDarmowy`, Z-06; wyjątek od P-046) | P-055, KP-10, P-065 (1a), (2a) |
| KP-14 (nowe) | „Zarządzaj subskrypcją” w aplikacji (`showManageSubscriptions`) | strona subskrypcji Apple (wzorce, „Etyka”) |
| KP-15 (nowe; fix 2026-10-22) | Dni z robótką zapisane w danych użytkownika (synchronizowane iCloud, jedna data = jeden dzień, L-11), nie w pamięci podręcznej uprawnień; scalenie z innym urządzeniem nigdy nie odbiera rozpoczętego dnia, nawet gdy w miesiącu jest wtedy więcej dni niż limit (L-16), a następny nowy dzień jest blokowany (L-17); zegarek bez telefonu liczy z ostatnio zsynchronizowanej listy (L-18). **Fix 2026-10-25 (Z07-09, Z07-07):** scalenie = suma po dacie, `pro` = OR (dzień raz zaczęty z Pro zostaje dniem z Pro; `scalDni()`, L-20–L-20e, wzorzec dla `scal` roli 05); duplikat daty liczy się raz (L-23, L-23b) | P-021, L-11, L-14, P-067 (NZ-02), P-103 (1a), (6a) |
| KP-16 (nowe; fix 2026-10-25, Z07-09) | Okno „Uczciwe zasady” (P-089 (3a)): raz, gdy minął co najmniej jeden dzień z robótką bez Pro (data dnia < dziś), przy pierwszym ekranie innym niż licznik; tylko w pewnym stanie darmowym (sklep odpowiedział: brak Pro), nie przy błędzie sklepu bez pamięci; flaga „widziane” w danych użytkownika i w kopii zapasowej, każde zamknięcie ją ustawia (jak Trening `seenFairRulesManifest`); okno nie dotyka limitu ani dni (`oknoUczciweZasady()`, wektory O-01–O-11) | P-089, P-103 (5a); Trening `monetyzacja-1-0` `docs/monetyzacja.md:31–32` |
| KP-06 (dopisane; fix 2026-10-25, Z07-08) | Jak w sesji 2, a ponadto: subskrypcja w karencji płatności ma dostęp do późniejszej z dat `wygasa` i `karencjaDo` (adapter z `renewalInfo.gracePeriodExpirationDate`; W-23–W-23e; Billing Grace Period włącza właściciel, krok 6 niżej); przy błędzie odczytu sklepu pamięć subskrypcji działa jeszcze 7 dni po `wygasa` (`LASKA_OFFLINE_MS`; W-12, W-12b, W-20b, W-21b) — wyjątek nazwany od MON-08, udany odczyt sklepu zawsze rozstrzyga; koniec wyłączny (`wygasa = teraz` → brak, W-20, W-21); zapis pamięci bez klucza `wygasa` jest uszkodzony (P-07) | P-103 (2a), (3a); Trening `lib/access.ts` (`entitlementEnd`, `OFFLINE_GRACE_DAYS = 7`), `store-native.ts:63–77`; Apple „Enable Billing Grace Period” (odczyt 2026-10-25): „select a period of 3, 16, or 28 days” |
| KP-07 (dopisane; fix 2026-10-25, Z07-08) | Jak w sesji 2, a ponadto: zakup oczekujący (Ask to Buy, odroczona płatność) daje komunikat „czeka”, nie błąd, i bez dostępu, dopóki nasłuch nie przyniesie transakcji (`komunikatZakupu`, K-01–K-05; W-22, W-22b); anulowany bez komunikatu i bez fałszywego sukcesu | MON-04; Trening `store-adapter.ts:26–27` |
| KP-17 (nowe; fix 2026-10-25, Z07-08) | Pro na zegarku (ADR-0009 D): `proZegarka()` — Pro, gdy którekolwiek źródło je potwierdza; kontekst z telefonu oceniany jak pamięć (`wygasa: null` = dożywotni, okno 7 dni), StoreKit zegarka jak odczyt sklepu; `pro: false` nigdy nie daje Pro; wektory PZ-01–PZ-11 w `wektory-dostepu.json` wspólne dla TS i Swift | P-103 (4a), ADR-0009 D, R-031 |
| KP-05–KP-11 | bez zmian (sesja 2) poza KP-06 i KP-07 wyżej; KP-10 zawężone przez KP-13 | — |

### Ujawnienia dla roli 04 (ekran ofert)
(1) nazwa planu, długość okresu i cena ze sklepu jako najwyraźniejszy element ceny (MS-02, KP-09); bez procentów i porównań (P-054); opisy bez liczb; (2) przy subskrypcji: „odnawia się automatycznie, anulujesz w ustawieniach Apple ID” i przycisk „Zarządzaj subskrypcją” (MS-02a, KP-14); **hasło z P-054 „No subscriptions. Nothing renews by itself…” odpada** (w V4 są subskrypcje odnawiane); (3) „Przywróć zakupy”; (4) linki do polityki prywatności i warunków (KP-04); (5) co daje Pro: brak limitu dni; co zostaje bez Pro: limit 5 dni i wszystkie dane; (6) widoczne zamknięcie, neutralna odmowa, bez fałszywej pilności i zawstydzania (wzorce, „Etyka”); (7) Family Sharing na ekranie tylko, gdy włączone w App Store Connect.

**Opis w sklepie (dla 11 i 09):** „Free for 5 crafting days every month. Pro removes the limit.”; bez „free app” bez zastrzeżenia i bez „free trial” (MS-47, 2.3.2).

### Test modelu (zastępuje test P-029)
| Element | Ustalenie |
|---|---|
| Miara | konwersja = zakupy Pro (wszystkie produkty, Sales and Trends) / pierwsze pobrania (App Analytics), te same storefronty i okres |
| Próg | **4,53%**: przy nim V4 daje tyle co B (rachunek: 3,0% × 14,99 / 9,92 USD brutto na płacącego z odnowieniami) |
| Kiedy | odświeżenie 04.2027 (P-016) albo 3000 pierwszych pobrań, co nastąpi później |
| Reguła | < 3,79%: decyzja właściciela (opcje: oferta wprowadzająca jak V3, wyższy limit nie, bo KP-01 pozwala tylko luzować, albo powrót do B); > 5,27%: V4 potwierdzone; pomiędzy: pomiar do następnego odświeżenia |
| Skąd 3,79 / 5,27 | 95% przedział przybliżenia normalnego wokół 4,53% przy n = 3000: ±1,96 × √(0,0453 × 0,9547 / 3000) = ±0,74 pp |
| Dodatkowo | średnia ocen w sklepie i odsetek recenzji o limicie (AK-05), po 3 miesiącach |

### Zgłoszenia do roli 01 (ER, do poprawki BRD)
| ID | Zgłoszenie | Dowód |
|---|---|---|
| ER-26 | Model z P-057: BRD opisuje model B (wstęp „Zakup (ZAK)”, H-01, H-02, OG-03 „dotyczy tylko powrotu do A albo C”, README). Nowe BR: limit dni z robótką (strażnik startu dnia, KP-12; reguła z wektorami `wektory-limitu.json`), komunikat na limicie (licznik dni, oferta, dane dostępne), wygaśnięcie subskrypcji (KP-02); OG-03 znowu obowiązuje (subskrypcja na wszystkich urządzeniach) | P-057; MS-01b |
| ER-27 | BR-LIC-017 („wpisanie i zerowanie nie są pracą”, P-048 (3)) dotyczy statystyk; dla limitu ręczne wpisanie numeru rzędu w nowym dniu woła strażnika (D4). Rozdzielić „praca” w statystykach i „start dnia” w limicie, żeby nie było sprzeczności | P-057 D4 |
| ER-28 | NFR-PIE-001: dopisać, że strażnik limitu nie działa przy pierwszym +1 świeżej instalacji (miesiąc zaczyna się od 5 dni) — zgodność już wynika z reguły, ale kryterium powinno to nazwać | KP-12 |

### Uwaga dla roli 03
Kolumna „Dostęp” kontraktu zakresu: **wszystkie funkcje darmowe w limicie 5 dni** (nie ma już podziału darmowe/Pro z P-032); funkcje „Pro” z W1 nie są zaporą. Zasada 18 bez zmian (wartość i intuicyjność). Kalkulatory, słownik i zapas nie są „pracą przy robótce” (nie zużywają dni) — jeśli 03 widzi to inaczej, ER do roli 02.

### Przekazanie (kolejne role)
- **04:** ekran ofert (ujawnienia 1–7), licznik dni (KP-13) zgodny z P-046, komunikat na limicie przy starcie dnia (bez przerywania pracy), stan „Masz Pro”, wpis „Zarządzaj subskrypcją”.
- **05:** ADR biblioteki: `expo-iap` jak Trening (P-036), z subskrypcjami bez oferty wprowadzającej; KP-06–KP-09, KP-14, KP-15 (dni z robótką w danych synchronizowanych); czy Trening liczy D5 tak samo [DO USTALENIA] (spójność portfela).
- **07:** wektory `wektory-limitu.json` i `wektory-dostepu.json`; kontrola KP-01 przed wydaniem; scenariusze automatyczne (P-041). Stan po fixie 2026-10-25 (Z07-02): limit 77 wektorów (`startDnia` 28: L-01–L-25 bez L-19/L-20; `wolaStraznika` 11: S-01–S-10, L-07; `mozeZaczacDzien` 9: Z-01–Z-09; `wznowienieLimitu` 4; `cofniecieSerii` 9: L-19*; `scalDni` 5: L-20*; `oknoUczciweZasady` 11: O-*), `node docs/monetyzacja/limit-test.mjs` „zgodne 77 z 77”; dostęp 56 (`node docs/monetyzacja/dostep-test.mjs`). Test limitu sprawdza też, że każdy L-/Z- cytowany w BRD ma wektor.
- **08:** `limit.mjs` i `dostep.mjs` jako wzorce; KP-01–KP-15.
- **Właściciel (App Store Connect, po ADR 05):** grupa subskrypcji „Oczko Pro” z `monthly` 0,99 i `yearly` 6,99 USD **bez ofert wprowadzających**; dożywotni 14,99 USD (sprawdzić istniejący produkt Oczka, OP-24); Family Sharing (D6); konto testowe piaskownicy.

### Definicja ukończenia (build, sesja 3)
| Punkt kontraktu | Stan | Dowód |
|---|---|---|
| ceny, stawki i reguły sklepu z adresem, cytatem i datą | spełnione | „Sesja 3, E0/E1”: MS-39–MS-47 (odczyt 2026-10-22), soczewki z tabelami źródeł |
| co najmniej dwa modele z regułą, kompromisem, ryzykiem etycznym i rachunkiem; wybór słowami właściciela | spełnione | E2 (V3, V4, B; V1/V2 odrzucone P-056); P-057 |
| rachunek kod 0, liczby ze źródłem albo [OCENA] z metodą | spełnione | `dowody/s3-porownanie-2026-10-22.txt`, `dowody/s3-odnowienia-2026-10-22.txt` |
| kontrakt: produkty, uprawnienia, bramki przy przepływach, przywracanie, bez sieci, okres próbny, Family Sharing, ujawnienia | spełnione | ta sekcja; okres próbny: brak (P-057) |
| H i ZAL ze statusem; sprzeczności jako ER | spełnione | `docs/zalozenia.md` (ZAL-002, 017, 025, 026, 028, 029); ER-26–ER-28 |
| WTP nowych funkcji | nie dotyczy po P-057 (wszystko darmowe w limicie) | — |

## Sesja 3, E2: Porównanie V3, V4 i B (2026-10-22)
**Wyjątek nazwany (zasada wspólna 7):** STOP E1 połączony z STOP E2. Właściciel po raporcie E1: „V1 v2 odrzucamy” (P-056), potem „A to ciekawe, zrób porównanie.” Interpretacja roli 02 (do weta): zgoda na wariant (a), czyli jeden przystanek. Tańsza kontrola zamiast osobnego STOP E1: dowody E1 są zapisane (sekcja niżej) i przywołane przy każdej liczbie.

### Czym różnią się warianty
| | B (obowiązuje, P-029) | V3 (P-053) | V4 „wzorzec Treningu” (P-055) |
|---|---|---|---|
| Pierwsze uruchomienie | licznik, darmowy rdzeń bez limitu | licznik, cała aplikacja | licznik, cała aplikacja |
| Co jest ograniczone | funkcje Pro (zegarek, wzór z narzędziami, przypomnienia, zapas, kalkulatory) | liczba dni z robótką w miesiącu (N) | jak V3 |
| Pro | dożywotni 14,99 USD | subskrypcja 0,99 / 6,99 USD (odnawiana) **z ofertą wprowadzającą 14 dni** + dożywotni 14,99 | subskrypcja 0,99 / 6,99 USD (odnawiana) **bez próby** + dożywotni 14,99 |
| Pierwszy zakup | świadomy | często zapis na próbę, która po 14 dniach sama staje się płatna | świadomy |
| Reguła sklepu | 3.1.1 (MS-01g) | 3.1.2(a), oferta wprowadzająca (MS-46), metered paywall (MS-45) | 3.1.2(a), metered paywall (MS-45) |

### Rachunek (`node oplacalnosc.mjs warianty-s3/*.json`, kod 0: `dowody/s3-porownanie-2026-10-22.txt`; odnowienia: `dowody/s3-odnowienia-2026-10-22.mjs`, kod 0)
Ta sama metoda i dane co bramka i sesja 2 (8 storefrontów, instalacje z ocen konkurentów N, prowizja 15%, VAT krajów, kursy NBP 205/A z 2026-10-21). Zmieniają się tylko konwersja, podział planów i wpływ zapory na widoczność; każda zmiana to [OCENA] z metodą w polu `zrodlo` pliku.

| Wariant | 1. rok, zł netto (pes. / norm. / opt.) | Stan ustalony z odnowieniami rocznej, norm. | Wobec B (norm., z odnowieniami) |
|---|---|---|---|
| B | 835 / **26 715** / 616 852 | 26 715 | — |
| V4, limit 4 dni | 480 / 27 706 / 696 015 | 32 804 | +23% |
| **V4, limit 5 dni** | 459 / **26 477** / 696 015 | **31 348** | **+17%** |
| V4, limit 6 dni | 436 / 25 058 / 696 015 | 29 669 | +11% |
| V3, limit 5 dni | 404 / **31 676** / 656 664 | 37 884 | +42% |

Próg opłacalności: 1944 zł/rok (P-013). Wszystkie warianty normalnie ok. 13–19× nad progiem, pesymistycznie wszystkie poniżej (jak w bramce).

**Założenia [OCENA] (metoda):**
- Konwersja V4 = konwersja planu mieszanego z darmowym rdzeniem z sesji 2 (1,3% / 2,8% / 5,0%) × mnożnik limitu **1,2 / 2,0 / 3,0** × udział trafiających na limit H(N)/H(5) (V3-3: 0,775 / 0,74 / 0,70). Mnożnik: limit to wzór pośredni między freemium 2,1% a twardą zaporą 10,7% („Hard paywalls convert five times better than freemium”, MS-12, szczebel 4); norm. ≈ √5,1 ≈ 2,3, zaokrąglone ostrożnie do 2,0; opt. ograniczony do 10% (dlatego opt. V4 jest równe dla N = 4, 5, 6).
- V3 = V4 × mnożnik oferty wprowadzającej **1,0 / 1,3 / 1,6**; podział planów przesunięty o 5 pp. z dożywotniego do miesięcznej (próba prowadzi do subskrypcji). Dla tej kategorii brak danych o konwersji z próby.
- Wpływ zapory na oceny i widoczność (udział nowej aplikacji): B ×1; V4 ×0,85 / 0,95 / 1,0; V3 ×0,80 / 0,93 / 1,0 (AK-05: Knitandnote po zaporze średnia recenzji 1,5–1,6; skargi „free trial charged me”, ZAL-009).
- Odnowienia: roczna z retencją 36% przez 2 kolejne lata (MS-12a, górna granica), jak w sesji 2; mnożnik V4 1,184, V3 1,196, B 1,0.

**Jak czytać:**
1. **V4 wobec B:** w pierwszym roku równo (−1%), z odnowieniami +17%. Różnica mieści się w rozrzucie założeń. V4 wygrywa z B, gdy limit konwertuje co najmniej **1,7×** lepiej niż darmowy rdzeń (próg zrównania z odnowieniami; bez odnowień 2,0×). B ma za to najwyższy wynik pesymistyczny (835 zł wobec 459 zł): mniej zależy od tego, czy zapora zadziała.
2. **V3 wobec V4:** V3 daje więcej (norm. +21%), jeśli próba doda co najmniej ok. **8%** płacących (próg zrównania 1,08 przy założonym 1,3). Część tej przewagi pochodzi od osób, które zapomniały anulować; to dokładnie mechanizm, który właściciel nazwał „największym red flag” (P-055), i źródło skarg 1★ (ZAL-009).
3. **N = 4 / 5 / 6:** różnica ±5–6% wobec N = 5, mniejsza niż rozrzut każdego założenia. N wybiera się z uzasadnienia dla użytkownika, nie z rachunku: przy N = 5 dzierganie raz w tygodniu jest zawsze darmowe (V3-2), tak jak w Treningu.
4. Największa niewiadoma dla V3/V4: konwersja limitu dni w tej kategorii (brak danych, AK-03, V3-3). Pomiar po wydaniu: App Analytics i Sales and Trends (jak test P-029).

### Reguła liczenia dla V4 (propozycja; wektory do `docs/monetyzacja/wektory-limitu.json` w E3)
Jednostka: **dzień z robótką** = data (strefa urządzenia w chwili zdarzenia, RD-16), w której użytkownik zaczął pracę pierwszym +1. Miesiąc kalendarzowy według telefonu; licznik od zera 1. dnia o północy. Strażnik sprawdza limit **tylko przy pierwszym +1 nowego dnia** (NFR-PIE-001: bez ekranu przed licznikiem; doprecyzowanie właściciela z P-053). Pro (subskrypcja aktywna albo dożywotni) zdejmuje limit. Zmiana tekstu 2026-10-30 (P-302, rola 04; zasady limitu bez zmian): angielska nazwa jednostki to „crafting day” (była „knitting day”, bo pomijała szydełko; P-101); dotyczy interfejsu, opisu sklepu i zegarka. Wartości limitu, definicja dnia i reguły (P-039, P-065, RD-16) bez zmian; rola 02 może je przejrzeć przy kolejnym odświeżeniu.

| Wektor | Sytuacja | Oczekiwane |
|---|---|---|
| L-01 | 1. dzień miesiąca, 0 dni użytych, pierwsze +1 | dozwolone; dzień 1 z 5 |
| L-02 | dzień już policzony (np. 5. z 5), kolejne +1 tego dnia, inny projekt | dozwolone; bez nowego dnia |
| L-03 | 5 z 5 dni, nowy dzień, pierwsze +1, bez Pro | zablokowane; komunikat z licznikiem i ofertą; projekt, historia, eksport działają |
| L-04 | praca od 23:40, kolejne +1 o 00:10 bez przerwy | dozwolone; bez nowego dnia (sesja w toku; definicja przerwy: decyzja D3) |
| L-05 | 1. dzień nowego miesiąca o 00:00 po miesiącu 5 z 5 | licznik 0 z 5; +1 dozwolone |
| L-06 | +1, potem cofnięcie (−1) tego samego dnia | dzień zostaje policzony (cofnięcie nie zwraca dnia; bez obejścia limitu) |
| L-07 | dopisanie wstecz, edycja historii, zmiana notatki, eksport | nie liczą się i nie są blokowane (dane zawsze dostępne) |
| L-08 | ręczne wpisanie numeru rzędu w nowym dniu ponad limit | decyzja D4 |
| L-09 | Pro wygasa 20. dnia, w miesiącu już 12 dni z robótką | decyzja D5 |
| L-10 | Pro aktywne (subskrypcja albo dożywotni) | brak limitu; dni nadal zapisywane w kalendarzu (F-59) |
| L-11 | ten sam dzień na iPhonie i zegarku | jeden dzień (synchronizacja łączy po dacie) |
| L-12 | cofnięcie zegara telefonu na wcześniejszy dzień | dzień już policzony się nie dubluje; nowy dzień liczy się według zapisanej daty (ryzyko brzegowe: obejście przez zmianę daty, zysk mały) |
| L-13 | brak sieci, Pro z pamięci podręcznej | jak W-03 (KP-06); limit liczony lokalnie |
| L-14 | ponowna instalacja bez iCloud w trakcie miesiąca | licznik od zera (brzegowe obejście; akceptowane, bo dane i tak giną bez kopii) |

### Co się zmienia przy V4 (lista; nic nie wdrażam przed wyborem)
| Obszar | Zmiana | Kto | Czas agenta |
|---|---|---|---|
| Rejestr decyzji | V4 zastępuje P-029 (model B), P-030 (zapora na funkcjach), P-033/P-050 (próba), zmienia P-031/P-032 (podział darmowe/Pro znika: wszystko darmowe w limicie) | 02 | 0,3 h |
| Kontrakt płatności (`docs/monetyzacja.md`, E3) | produkty: grupa subskrypcji (mies., rok) + dożywotni; KP-01 → „limit raz wydany tylko luzowany” (ZAL-025); KP-02, KP-03 w pełnej wersji (dożywotni przy aktywnej subskrypcji, MS-22); zarządzanie subskrypcją w aplikacji; ujawnienia 3.1.2(a); `dostep.mjs` + funkcja limitu, wektory W i L | 02 | 2–3 h |
| BRD (ER do roli 01) | nowe BR-ZAK: limit dni, strażnik startu, komunikat na limicie, wygaśnięcie subskrypcji; OG-03 wraca (subskrypcja na wszystkich urządzeniach) | 01 | sesja fix ok. 1–2 h |
| Kontrakt zakresu (03) | kolumna „Dostęp”: wszystko darmowe w limicie; funkcje Pro w W1 przestają być zaporą | 03 | ok. 0,5–1 h |
| Projekt (04) | licznik dni na ekranie startu („Zostały 3 z 5 dni w tym miesiącu”), ekran ofert tylko na limicie i w Ustawieniach, teksty bez procentów (P-054) | 04 | w ramach roli 04 |
| ADR (05) | `expo-iap` z subskrypcjami (jak Trening), bez oferty wprowadzającej | 05 | w ramach roli 05 |
| App Store Connect (właściciel) | grupa subskrypcji z 2 produktami (0,99 / 6,99 USD), dożywotni 14,99 USD (P-038, OP-24), bez ofert wprowadzających, Family Sharing (D6) | właściciel | ok. 30–45 min, po ADR 05 |
| Opis w sklepie (11) | „Free for N crafting days a month. Pro: no limit.”; bez „free app” bez zastrzeżenia (MS-47) | 11, 09 | później |

Kod Oczka nie istnieje jeszcze w nowej wersji (przebudowa, P-001), więc zmiana modelu teraz nie kosztuje przepisywania kodu. Oczekiwanie: brak (bez pytania do App Review: V4 nie używa 3.1.1 ani nieodnawialnych).

### Decyzje dla właściciela
| # | Decyzja | Opcje (kompromis) | Rekomendacja |
|---|---|---|---|
| D1 | Model | **V4** (bez próby; świadomy zakup; jak Trening; +17% wobec B w normalnym z odnowieniami, ale najniższy pesymistyczny) · **V3** (najwyższy wynik, +42%, częściowo z zapomnianych anulowań; „red flag”) · **B** (bez zmian; najbezpieczniejszy pesymistycznie; obawa „Pro nikt nie kupi”, P-050) | **V4**: spójny z Treningiem, uczciwy, bez ryzyk regułowych; przewaga nad B w granicach rozrzutu, więc decyduje zasada, nie liczba |
| D2 | Limit N | **4** (więcej konwersji, ale raz w tygodniu trafia na limit w ok. 35% miesięcy) · **5** (raz w tygodniu zawsze darmowe) · **6** (najłagodniejszy) | **5**: jedno zdanie dla użytkownika i to samo co w Treningu |
| D3 | Kiedy zaczyna się nowy dzień przy pracy po północy | **a** +1 po północy otwiera nowy dzień tylko po przerwie ≥ 60 min od poprzedniego +1 (parametr [OCENA]) · **b** zawsze o północy | **a**: wieczór nie zjada dwóch dni |
| D4 | Ręczne wpisanie numeru rzędu w nowym dniu ponad limit | **a** traktowane jak +1 (blokada) · **b** dozwolone jako edycja danych (furtka do obejścia limitu) | **a**: dopisywanie wstecz i edycja historii zostają wolne, zmiana bieżącej liczby to praca |
| D5 | Pro wygasa w trakcie miesiąca | **a** liczą się wszystkie dni z robótką w miesiącu (proste; po wygaśnięciu zwykle limit już wyczerpany) · **b** liczą się tylko dni bez Pro | **b**: kto płacił, nie traci od razu darmowych dni; [DO USTALENIA], jak robi Trening, żeby było spójnie |
| D6 | Family Sharing (nieodwracalne, MS-18) | **a** dożywotni i subskrypcje (jak Trening, P-038) · **b** tylko dożywotni | **a**: spójnie z Treningiem i P-038 |
| D7 | Ceny | **a** 0,99 / 6,99 / 14,99 USD (P-019; poniżej całego przedziału N, AK-02) · **b** ceny rynkowe (mediany N: 2,52 / 19,49 / 32,49 USD) | **a**: decyzja portfela i test; podnieść później można (subskrypcje: zgoda w DE i PL, MS-20) |

## Sesja 3, E1: Dowody (2026-10-22)
Warianty: **V1/V2** (P-051: próba „14-day Trial” → nieodnawialne 30 dni / [3 mies.] / rok + dożywotni, potem blokada z podłogą danych), **V3** (P-053: pełne Oczko z limitem dni z robótką w miesiącu, subskrypcja odnawiana z ofertą wprowadzającą 14 dni + dożywotni), **V4** (P-055, wzorzec Treningu: jak V3, ale bez oferty wprowadzającej), **B** (P-029, obowiązuje). Metoda: dwa niezależne spojrzenia (analityk konkurencji, recenzent App Store) i badanie V3 jako osobni agenci (P-054, 1A); StoreKit rola 02. Kluczowe cytaty sprawdzone przez rolę 02 na surowym tekście (`curl` + `grep`). Raporty i surowe dane: `oczko-warsztat/02-monetyzacja/2026-10-22-sesja3/` (`soczewki/recenzent.md`, `soczewki/analityk.md`, `soczewki/v3.md`, `E1-2-storekit.md`, `E1-v3-reguly.md`).

### Reguły sklepu (odczyt 2026-10-22)
| ID | Reguła (cytat) | Źródło | Skutek |
|---|---|---|---|
| MS-39 | „Content and services may be offered through the In-App Purchase API on a subscription basis (…). Other than specific approved rental content such as films, television programs, music, books, rentals of content, services or functionality through the In-App Purchase API are not allowed (e.g., use of particular content may not be restricted to a pre-determined, limited period of time).” | umowa PLA, Attachment 2 §2.3 (developer.apple.com/support/terms/apple-developer-program-license-agreement/) | V1/V2: dostęp na 30 dni do funkcji działających offline może zostać uznany za „rental of functionality”; nieodnawialna subskrypcja to typ Apple („subscription basis”), więc rozstrzyga App Review [DO USTALENIA] |
| MS-40 | „(iii) Disabling access to specific approved rental content (…) after the rental period has expired; all other items and services may not expire.” | wytyczne 3.2.1(iii), „Last Updated: October 16, 2026” | jw. |
| MS-41 | „…any such content, services or functionality must be available to all of the devices associated with an end user’s account” | PLA Attachment 2 §2.6 | V1/V2: plan czasowy na wszystkich urządzeniach (iPad) |
| MS-42 | „Your app uses non-renewing subscriptions — Your app is responsible for the restoration process.” | dokumentacja StoreKit (Original API), „Restoring purchased products” | V1/V2: przywracanie i sumowanie okresów po stronie aplikacji |
| MS-43 | „Demos, betas, and trial versions of your app don’t belong on the App Store – use TestFlight instead.” | wytyczne 2.2 | próba licząca się sama od instalacji (bez IAP 3.1.1) odpada |
| MS-44 | „Family Sharing is a feature supported only by apps that offer auto-renewable subscriptions and non-consumable In-App Purchases” | pomoc App Store Connect (MS-18, potwierdzone dziś) | V1/V2: plany czasowe nie są rodzinne; dożywotni tak (P-038) |
| MS-45 | „Offer a metered paywall. A metered paywall allows access to a finite amount of content for a specified duration before needing to make a purchase — for example, viewing 10 full articles per month for free in a news app.” | developer.apple.com/app-store/subscriptions/ | V3/V4: limit dni w miesiącu to wzór opisany przez Apple, nie okres próbny 3.1.1 |
| MS-46 | tabela ofert wprowadzających: „Free Trial … 3 Days. 1 or 2 Weeks. 1, 2, 3, or 6 Months. 1 Year.”; „each person is only eligible to redeem one introductory offer per subscription group” | pomoc App Store Connect, oferty wprowadzające | V3: próba 2 tygodnie dostępna; V4 jej nie używa |
| MS-47 | zał. I pkt 20 dyrektywy 2005/29/WE (MS w „Etyce”) i wytyczne KE 2021/C 526/01 pkt 4.2.9: „a game cannot be marketed as ‘free’ if the consumer cannot play the game in a way that can be reasonably expected without making in-app purchases” | publications.europa.eu (CELEX 02005L0029-20220528; 52021XC1229(05)) | V1/V2: opis w sklepie bez „free/darmowa”; V3/V4: „darmowe do N dni w miesiącu” z zastrzeżeniem |

**Otwarte po E1:** OP-27 (czy „non-subscription app” obejmuje aplikację z subskrypcjami nieodnawialnymi): źródła nie rozstrzygają, [DO USTALENIA] → pytanie do App Review (treść gotowa: `soczewki/recenzent.md` §7; kanał: rozmowa 1:1 „Meet with Apple”; „App Review cannot preapprove apps”). Mechanizm 3.1.1 to zakup za 0, który użytkownik uruchamia sam po ekranie ujawnień, więc próba V1/V2 nie może startować przy instalacji (zgodność z NFR-PIE-001 tylko wtedy, gdy próba startuje później, np. przy pierwszym ponowieniu albo w ustawieniach). „No subscriptions” wobec typu „Non-Renewing Subscription”: bezpieczniej „No auto-renewing subscriptions” (OP-31).

### StoreKit (E1.2)
`currentEntitlements` daje „The latest transaction for each non-renewing subscription, including finished ones”; `currentEntitlements(for:)` „will contain no more than one transaction”; lista `Transaction.all` nie wymienia nieodnawialnych. Skutek (OP-29): przy dokupieniu tego samego planu przed końcem urządzenie po ponownej instalacji widzi tylko ostatni zakup; bez serwera trzeba (a) dopuszczać przed końcem tylko inny plan (łańcuch okresów), (b) przedłużanie dopiero po końcu albo (c) własną księgę w iCloud (sprzeczne z KP-06). `expo-iap` 6.1.1 zna `non-renewing-subscription`; warstwa OpenIAP 4.0.3 przy `onlyIncludeActiveItemsIOS: true` czyta `currentEntitlements` i odrzuca tylko transakcje z `expirationDate <= now` (`OpenIapStoreKitModule.swift:650–658`). V3/V4 (subskrypcja odnawiana) i B nie mają tego problemu.

### Rynek i recenzje (odczyt 2026-10-22)
| ID | Wniosek | Status | Dowód |
|---|---|---|---|
| AK-01 | Ceny narzędzi N bez zmian od 2026-10-21 | potwierdzone (R) | 0 zmian w 17 parach aplikacja–sklep |
| AK-02 | Ceny P-051 są poniżej całego przedziału N w każdym okresie | potwierdzone (R) | mies. 1,49–4,99; rok 9,99–29,99; dożywotni 24,99–44,99 USD |
| AK-03 | Dostęp czasowy bez odnawiania w kategorii nie występuje albo nie jest widoczny | hipoteza (R częściowo) | 0 z 483 opisów deklaruje brak odnawiania; oferty 3 mies. 17 z 340 aplikacji z zakupami, zwykle obok odnawialnej |
| AK-04 | „Bez odnawiania” ma wartość dla części klientów | hipoteza (R słabe) | 3 cytaty pośrednie; 0 recenzji o nieodnawialnych passach |
| AK-05 | Twarda blokada w narzędziu do długich projektów grozi 1★ od wracających po przerwie | hipoteza (R analogia) | Knitandnote po przeniesieniu funkcji za zaporę: średnia recenzji 1,60 (2025 H2) i 1,53 (2026 H1) wobec 2,5–3,75 wcześniej; skargi na zaporę: 78% to 1–2★ (46 z 439 niskich ocen w 2368 recenzjach N) |
| AK-06 | Etykieta „Free” przy twardej próbie daje skargi „not free” | hipoteza (R) | 5 cytatów 1★ w 4 aplikacjach |
| AK-07 | Podłoga danych łagodzi skargę „can’t get my data out” | hipoteza | 1 cytat |
| V3-1 | Osoby dziergające regularnie dziergają kilka razy w tygodniu | potwierdzone (R, próbki zapalonych, samozgłoszenie) | Riley i in. 2013 (rękopis Stitchlinks): „The majority of respondents (72%) reported knitting more than three times per week”; CYC 2014: „84% say they crochet or knit at least 3 to 4 times a week; 58% claim they crochet or knit daily” |
| V3-2 | Limit 5 dni: raz w tygodniu nigdy nie trafia na limit (najwyżej 5 takich dni w miesiącu), dwa razy w tygodniu zawsze | rachunek kalendarza | `soczewki/v3.md` |
| V3-3 | Limit przekracza w miesiącu ok. 55–90% aktywnych; różnica 4 a 6 dni to 3–13 pp. | [OCENA] (Monte Carlo na rozkładach ankiet; nieznany odsetek dni z robótką, w których ktoś dodaje rząd: 0,3–1,0) | `soczewki/v3.md`, `v3-dane/model-wynik.json` |
| V3-4 | Limit dzienny bez przerywania pracy nie zbiera ostrych skarg | hipoteza (R słabe) | Ribblr (5 wzorów dziennie): 9 z 205 recenzji o limicie, średnio 3,7★, 0 × 1★; Duolingo: skargi dotyczą przerwanej lekcji (5 z 43 o „energy”), czego V3/V4 unika |
| TR-1 | Trening (ta sama ocena modelu V1/V2, 2026-10-22): normalny wynik V1/V2 z blokadą −5…−7% wobec modelu z próbą odnawianą, w granicach rozrzutu; skargi na twardą blokadę 2,10★; aplikacja po przejściu na blokadę z odcięciem historii spadła z 4,4–4,6 do ok. 2★ | punkt odniesienia z innej kategorii | `lkarwowski494/trening` @1ddd3b1, `docs/monetyzacja-badanie-2026-10.md` rozdz. 4–5 |

### Wnioski E1 dla E2 (hipotezy)
- **V1/V2** mają trzy ryzyka regułowe naraz (OP-27, MS-39/MS-40 „rental of functionality”, start próby wobec NFR-PIE-001) oraz koszt techniczny OP-29. Brak precedensu rynkowego (AK-03), więc udział planów to czysta [OCENA].
- **V3/V4** to wzór opisany przez Apple (MS-45); blokada tylko na starcie dnia (doprecyzowanie właściciela). Ryzyko z AK-05 dotyczy wracających po przerwie: limit miesięczny jest łagodniejszy niż blokada po próbie, bo co miesiąc wraca N dni.
- **B** pozostaje bez ryzyk regułowych; jego słabość to obawa właściciela, że darmowy rdzeń nie skłania do zakupu (P-050).
- Rachunek E2 dla V1–V4 i B: wspólna kohorta, scenariusze pes./norm./opt., [OCENA] z metodą dla konwersji (brak danych o próbie bez opłaty i o limicie dni w kategorii).

## Sesja 3, E0: Rama (2026-10-22)
Rola 02-monetyzacja, tryb build, moduły `cena-i-rachunek,storekit-expo` (prompt `prompts` @97ec212; zlecenie: `oczko-warsztat/03-zakres/2026-10-22-build/02-sesja3-prompt-2026-10-22.md`, cb97008). Zadanie: P-051, czyli V1 i V2 wobec modelu B (P-029). Kwarantanna P-003 i P-015 obowiązuje. Surowe teksty źródeł z dziś: `oczko-warsztat/02-monetyzacja/2026-10-22-sesja3/zrodla/e0/`.

### Środowisko (2026-10-22)
| Sprawdzenie | Wynik | Skutek |
|---|---|---|
| System, Node, git | Linux x86_64 w chmurze (`CLAUDE_CODE_REMOTE=true`), Node v22.22.0, npm 10.9.4. Lokalna gałąź `claude/jolly-thompson-paz6d8` była nieaktualna (płytki klon, „ahead 50, behind 50”), więc ustawiłem ją na `origin` (76c0ec0, P-051). Drzewo było czyste, nic nie przepadło | praca na stanie z `origin` |
| GitHub | push przez git na gałąź roboczą; `oczko-warsztat` dołączone z prawem zapisu (P-010) | — |
| Sieć | 200: `developer.apple.com` (wytyczne, subskrypcje, pomoc App Store Connect, StoreKit JSON), `itunes.apple.com/search`, `api.nbp.pl` | odczyty z dnia możliwe |
| Kurs | NBP 206/A/NBP/2026 z 2026-10-22: USD 3,8886 | rachunek E2 |
| Playwright | 1.56.1 | zrzuty niepotrzebne w tej roli |
| Mac z Xcode | brak (OP-03); właściciel nie robi testów ręcznych (P-041) | StoreKit tylko przez wektory w Node i testy automatyczne (05, 07) |
| App Store Connect | konto, umowa Paid Apps i Small Business Program są (OP-01, OP-20); produkty nie istnieją (OP-24) | dokładny próg 2,49 USD i ceny w storefrontach odczyta właściciel albo dam przybliżenie z rynku |
| Wysiłek sesji | nie da się go sprawdzić narzędziem | właściciel może wpisać `/effort high` |

### Wejście jako hipotezy
| Wejście | Status dziś | Co z nim zrobię |
|---|---|---|
| P-051: próba 14 dni (Non-Consumable „14-day Trial”) → zakupy nieodnawialne 0,99 / [2,49] / 6,99 USD + dożywotni 14,99 USD, potem blokada z podłogą danych | kierunek właściciela, warunkowy do wyniku tej sesji | badam V1 i V2 wobec B; nie zmieniam P-029, dopóki nie wybierzesz na STOP E2 |
| P-029 model B, ZAL-026 (konwersja B ≥ 1,85%) | obowiązuje; hipoteza bez pomiaru | punkt odniesienia rachunku |
| ZAL-017, ZAL-025, P-030, P-031 (darmowy rdzeń; granica nie przesuwa się w stronę płatną) | ZAL-025 hipoteza (R). P-051 nie łamie KP-01, bo nic nie jest jeszcze wydane, ale łamie kierunek z E1 sesji 2 („skąpe zapory dostają 1★”) | E1: recenzje modeli z twardą zaporą po próbie |
| ZAL-013 konwersja 2,1% (freemium), MS-12 „Hard paywalls convert five times better than freemium (10.7% vs 2.1%)” | hipoteza, szczebel 4; liczba 10,7% dotyczy subskrypcji odnawialnych z RevenueCat | E1: czy da się ją przenieść na próbę bez odnawiania; w rachunku tylko jako [OCENA] z metodą |
| ZAL-014 widoczność jako pierwsze ryzyko | hipoteza (R częściowo) | E2: wpływ twardej zapory na oceny i widoczność |
| ZAL-018 płacący wolą zakup jednorazowy | potwierdzone (R) | E2: udział dożywotniego w V1 i V2 |
| NFR-PIE-001, BR-ZAK-001, KP-01–KP-11 | obowiązują | E3: nowe scenariusze wygaśnięcia |

**Próbka tabeli rynku:** odczyt cen narzędzi N z dziś zrobię w E1.3 (P-051 każe zestawić dane z 2026-10-21 z odczytem z dziś).

### Reguły sklepu na dziś (odczyt 2026-10-22, pierwsze ustalenia)
Wytyczne App Review: „Last Updated: October 16, 2026”, bez zmian od sesji 2.

| Temat | Reguła (cytat, źródło) | Wstępny skutek dla V1/V2 |
|---|---|---|
| Okres próbny bez subskrypcji | 3.1.1: „Non-subscription apps may offer a free time-based trial period before presenting a full unlock option by setting up a Non-Consumable IAP item at Price Tier 0 that follows the naming convention: “XX-day Trial.” Prior to the start of the trial, your app must clearly identify its duration, the content or services that will no longer be accessible when the trial ends, and any downstream charges the user would need to pay for full functionality.” Zdanie dalej: „Learn more about managing content access and the duration of the trial period using Receipts and DeviceCheck.” | **Otwarte pytanie (E1.1):** czy aplikacja z subskrypcjami nieodnawialnymi to „non-subscription app”. Za: wytyczne 3.1.2 dotyczą tylko odnawialnych („Apps may offer auto-renewable in-app purchase subscriptions…”). Przeciw: Apple nazywa ten typ „Non-Renewing Subscription”, a „full unlock option” brzmi jak dożywotni. Jeśli źródło tego nie rozstrzygnie: `[DO USTALENIA]` i krok właściciela (pytanie do App Review) |
| Typ produktu | „Non-Renewing Subscription: A product that allows users to purchase a service with a limited duration. The content of this In-App Purchase can be static. This type of Subscription does not renew automatically.” (App Store Connect, „In-App Purchase types”) | typ pasuje do dostępu na 1, 3 albo 12 miesięcy przy statycznej treści |
| 3.1.2 (stała wartość, ≥ 7 dni, wszystkie urządzenia) | „Apps may offer auto-renewable in-app purchase subscriptions… When incorporating auto-renewable subscriptions into your app, be sure to follow the guidelines below.” | dosłownie 3.1.2(a) dotyczy subskrypcji odnawialnych. Do sprawdzenia w E1: czy Apple wymaga dostępu na wszystkich urządzeniach także przy nieodnawialnych |
| Family Sharing | „Family Sharing is a feature supported only by apps that offer auto-renewable subscriptions and non-consumable In-App Purchases” (pomoc App Store Connect, odczyt dziś) | **Nowe:** zakupów czasowych 1/3/12 mies. nie da się udostępnić rodzinie, dożywotni (Non-Consumable) tak. P-038 („włączamy”) obejmie tylko dożywotni. Różnica do ujawnienia (E3) |
| StoreKit: bieżące uprawnienia | `Transaction.currentEntitlements`: „The latest transaction for each non-renewing subscription, including finished ones” | **Nowe:** zwraca tylko *ostatnią* transakcję każdego produktu nieodnawialnego. Gdy ktoś kupi „1 miesiąc” dwa razy, koniec dostępu policzony z samej ostatniej transakcji może skrócić opłacony okres. E1.2: `Transaction.all` i reguła sumowania okresów |
| Ekran zakupu | strona subskrypcji: „In the purchase flow for a free trial, clearly indicate how long the free trial lasts and the price billed once the free trial is over.”; „the amount that will be billed must be the most prominent pricing element in the layout” | ujawnienia przed próbą (3.1.1) i na ekranie zakupu (E3, rola 04) |
| Prowizja | strona subskrypcji: 85% po roku dotyczy „auto-renewable subscriptions”; Small Business Program 15% (MS-03) | nieodnawialne: 15% (program). Przewaga roku z 85% nie dotyczy V1/V2 i nie ma znaczenia przy 15% |
| 4.2, 5.6 | „lasting entertainment value or adequate utility”; „Repeated manipulative or misleading behavior…” | bez zmian; twarda blokada sama w sobie nie łamie 4.2, ryzyko jest w ujawnieniach (E1) |

### Plan sesji 3 (zasada 9)
| Etap | Co | Czas agenta | Na co się czeka | Właściciel |
|---|---|---|---|---|
| E1.1 Reguły | pełne strony Apple o subskrypcjach nieodnawialnych (tworzenie, przywracanie, dostęp na urządzeniach, zwrot), zakres próby z 3.1.1, ujawnienia, progi cen (2,49 USD: rynek albo App Store Connect), Family Sharing; cytaty z surowego tekstu | 1–1,5 h | — | ewentualnie pytanie do App Review (dni czekania) |
| E1.2 StoreKit | `currentEntitlements`, `Transaction.all`, `purchaseDate`, `revocationDate`, kolejne zakupy przed końcem okresu, przywracanie na innym urządzeniu; `expo-iap` (typy OpenIAP dla nieodnawialnych, wersja) i wzorzec Treningu (tylko odczyt) | 1 h | npm, dokumentacja | — |
| E1.3 Rynek | ceny narzędzi N dziś wobec 2026-10-21; kto sprzedaje 3 miesiące i dostęp bez odnawiania; aplikacje z twardą zaporą po próbie i ich recenzje (cytaty, „n z m”) | 1–1,5 h | limity iTunes API (ok. 20 wywołań/min) | — |
| STOP E1 | raport dowodów, statusy ZAL, sprzeczności (ER) | 0,3 h | — | ok. 10–15 min |
| E2 | rachunek V1, V2, B w trzech scenariuszach z wrażliwością (próba → zakup, podział planów, kotwica 3 mies., powtórne zakupy, udział dożywotniego, wpływ zapory na oceny); `rachunek.mjs` bez zmian, nowe pliki wejściowe `docs/monetyzacja/warianty-s3/`, horyzont 1 i 3 lata; etyka i ryzyka; rekomendacja | 2–2,5 h | — | STOP E2: wybór modelu, ok. 20–30 min |
| E3 | kontrakt płatności, wektory dostępu (wygaśnięcie, kumulacja, próba), ER do 01, uwaga dla 03, sztafeta | 2–3 h (dla B 0,5 h) | — | STOP E3, ok. 10 min |

**Rozszerzenie zakresu (P-053, 2026-10-22, przez rolę 03):** dochodzi wariant **V3**: pełne Oczko z limitem 4–6 dni z robótką w miesiącu (4, 5 i 6 liczone osobno), potem subskrypcja odnawiana 0,99 USD/mies. i 6,99 USD/rok z ofertą wprowadzającą 14 dni włączaną przez użytkownika oraz dożywotni 14,99 USD. Do E1 dochodzi: ile dni w miesiącu dzierga osoba regularna i okazjonalna (źródło albo [OCENA] z metodą), recenzje limitów dziennych i liczonych (metered) w narzędziach, reguły oferty wprowadzającej (3.1.2(a), MS-23) i ujawnień subskrypcji odnawialnej; do E2 rachunek V3 obok V1, V2 i B. Dodatkowy czas agenta: ok. 1,5–2 h.

**Rozszerzenie zakresu (P-055, 2026-10-22, notatka właściciela):** dochodzi wariant **V4 „wzorzec Treningu”**: cała aplikacja darmowa, limit dni z robótką w miesiącu (jednostka i N do propozycji: 4, 5, 6), Pro jako subskrypcja odnawiana 0,99 / 6,99 USD i dożywotni 14,99 USD **bez oferty wprowadzającej**. Na STOP E2: jednostka i N, rachunek wobec B, reguła liczenia z wektorami brzegowymi, lista zmian, decyzje.

Razem ok. 8–10 h pracy agenta; od Ciebie 3 odpowiedzi (40–60 min) i być może pytanie do App Review. E1b (bramka) nie powtarzam: V1 i V2 to warianty ceny i modelu tej samej aplikacji, a wynik bramki był odporny na każde pojedyncze założenie; wrócę do niej, jeśli rachunek E2 da wynik normalny poniżej progu 1944 zł.

### Otwarte pytania sesji 3 (stan E0)
| ID | Pytanie | Rozstrzyga | Dotyczy |
|---|---|---|---|
| OP-27 | [DO USTALENIA] Czy próba 0 zł z 3.1.1 („Non-subscription apps…”) obejmuje aplikację, która sprzedaje subskrypcje nieodnawialne | E1.1 u źródła; jeśli źródło milczy: App Review (krok właściciela) | V1, V2 |
| OP-28 | [DO USTALENIA] Czy zakup nieodnawialny musi działać na wszystkich urządzeniach użytkownika i kto za to odpowiada (sklep czy aplikacja) | E1.1, E1.2 | V1, V2, BR-ZAK-001 |
| OP-29 | [DO USTALENIA] Jak liczyć koniec dostępu przy kolejnych zakupach przed końcem okresu, skoro `currentEntitlements` daje tylko ostatnią transakcję | E1.2 | V1, V2, wektory |
| OP-31 | Tekst ekranu ofert: **rozstrzygnięte** (P-054): nazwy planów z ceną, bez procentów i porównań; nagłówek „No subscriptions. Nothing renews by itself. You'll never be charged for something you forgot to cancel.” i tytuły planów z wariantu 1 właściciela (kopia: `oczko-warsztat/03-zakres/2026-10-22-build/oferty-tekst-wlasciciela.md`). Zostaje do sprawdzenia w E1.1: czy „No subscriptions” zgadza się z typem produktu Apple „Non-Renewing Subscription” (wprowadzenie w błąd?) i trwałość obietnicy „never charged” | 02 w E1.1 | ujawnienia, 04, 09 |
| OP-30 | Synchronizacja iCloud po blokadzie: **działa** (P-054, 2a) | zamknięte | V1, V2, KP-02 |

## Sesja 2, E0: Rama (2026-10-21)
Rola 02-monetyzacja, tryb build bez `--moduly` (moduły domyślne: `cena-i-rachunek`, `rachunek`, `storekit-expo`, `audyt-paywalla`; prompt `prompts` @97ec212, 58 354 znaków). Kwarantanna P-003 i P-015 jak w sesji 1. Surowe teksty źródeł z dziś: `oczko-warsztat/02-monetyzacja/2026-10-21-sesja2/zrodla/`.

### Środowisko (2026-10-21)
| Sprawdzenie | Wynik | Skutek |
|---|---|---|
| System, Node, git | Linux x86_64 w chmurze, Node v22.22.0; gałąź `claude/jolly-thompson-paz6d8` zgodna z `origin` (62e58b8) | — |
| GitHub | push przez git na gałąź roboczą; `oczko-warsztat` dołączone z prawem zapisu (P-010) | — |
| Sieć | 200: `developer.apple.com` (wytyczne, subskrypcje, pomoc App Store Connect), `apps.apple.com` | — |
| Mac z Xcode | brak (OP-03) | testy StoreKit tylko w piaskownicy przez TestFlight na telefonie właściciela; plik `.storekit` w Xcode niedostępny |
| App Store Connect | konto jest, umowa Paid Apps i Small Business Program: tak (OP-01, sesja 1). Produkty jeszcze nie istnieją | dokładne ceny progów i wpływ w storefrontach odczyta właściciel (OP-19) |
| Wysiłek sesji | nie da się sprawdzić narzędziem (`get_session` podaje tylko model `claude-opus-5-5`) | właściciel może wpisać `/effort high` |

Rozbieżność do poprawy przez właściciela albo rolę 01: karta „Stan projektu” w `CLAUDE.md` ma „umowa Paid Apps i produkty: [DO USTALENIA]”, a OP-01 z sesji 1 zamyka umowę odpowiedzią „tak”. Linia nie należy do roli 02, więc jej nie zmieniam.

### Wejście jako hipotezy
| Wejście | Status dziś | Co z nim zrobię |
|---|---|---|
| P-019 ceny 0,99 USD/mies., 6,99 USD/rok, 14,99 USD dożywotnio | decyzja właściciela; stoi na ZAL-016 (hipoteza) | biorę jako ceny wyjściowe; w E2 pokazuję skutki (rachunek, podwyżki, progi) bez zmiany decyzji |
| H-01 / ZAL-017 darmowy pierwszy projekt bez okresu próbnego | hipoteza (R) | rozstrzygam w E2: opcje zakresu darmowego i okresu próbnego |
| H-02 / ZAL-018 zakup jednorazowy, dane i eksport nigdy za paywallem | hipoteza (R) | dane i eksport poza paywallem to zasada roli 6, nie opcja; w E2 rozstrzygam resztę (opłacona funkcja nie znika: BR-ZAK-003) |
| H-03 / ZAL-009 uczciwość jako wyróżnik | potwierdzone (R) | podstawa ujawnień i zakazanych wzorców dla roli 04 |
| ZAL-002 wartość stała | częściowo potwierdzone (R) | warunek subskrypcji („ongoing value”, MS-01b); sprawdzę na liście BR w E1.3 |
| ZAL-003 koszt 0 zł | potwierdzone dla iCloud (OG-09) | zegarek, widżet i ekran blokady bez usług: bez kosztu (sprawdzi rola 05) |
| ZAL-005 nikt nie zapłacił za poprzednią wersję | potwierdzone | model wybieram swobodnie |
| ZAL-013 konwersja 2,1% | hipoteza, szczebel 4 | rachunek E2 w wariantach |
| ZAL-015 spadek cen rynku | hipoteza | wariant cen w E2 |
| OG-02 przywracanie, OG-03 subskrypcja na wszystkich urządzeniach | fakty S-03, S-04; dziś potwierdzone w MS-01 i MS-01b | kontrakt płatności E3 |
| P-021 synchronizacja iCloud | decyzja warunkowa | pytanie w E2: czy synchronizacja to dane (zawsze darmowe), czy płatna wygoda |

**Próbka tabeli rynku (2026-10-21, `apps.apple.com/us`):** StitchTally 0,99 / 1,99 / 9,99 / 24,99 USD; YarnBuddy 1,99 / 14,99 / 44,99 USD; Knitting Chart 19,99 USD. Zgodne z tabelą sesji 1.

### Reguły sklepu na dziś
Wytyczne App Review: „Last Updated: October 16, 2026”, bez zmian wobec sesji 1 (MS-01–MS-01f). Nowe odczyty: MS-02a, MS-18–MS-21.
| Temat | Reguła (cytat, ID) | Skutek dla Oczka |
|---|---|---|
| Zakup w aplikacji, przywracanie | 3.1.1: „you should make sure you have a restore mechanism for any restorable in-app purchases” (MS-01g) | przycisk przywracania (BR-ZAK-001) |
| Okres próbny bez subskrypcji | 3.1.1: produkt Non-Consumable „at Price Tier 0” o nazwie „XX-day Trial”, przed startem: długość, co przestanie działać, dalsze opłaty (MS-01) | jedyny dozwolony okres próbny dla dożywotniego |
| Okres próbny subskrypcji | 3.1.2(a): „by providing the relevant information set forth in App Store Connect” (MS-01h) | oferta wprowadzająca w App Store Connect, nie licznik w aplikacji |
| Subskrypcja obok zakupu jednorazowego | 3.1.2(a): „Subscriptions may be offered alongside à la carte offerings” (MS-01h) | trzy produkty P-019 są dozwolone |
| Stała wartość | 3.1.2(a): „ongoing value”, okres ≥ 7 dni, „available across all of the user’s devices” (MS-01b) | subskrypcja wymaga planu aktualizacji (ZAL-002) |
| Ekran zakupu | „Full renewal price, shown clearly and prominently”; „A way for current subscribers to sign in or restore purchases”; kwota do zapłaty „most prominent pricing element” (MS-02, MS-02a) | wymagania dla roli 04 |
| Uczciwość | 5.6: nie „trick them into making unwanted purchases”, nie „raise prices in a tricky manner” (MS-01f) | zakazane wzorce; zmiany cen jawnie |
| Family Sharing | „supported only by apps that offer auto-renewable subscriptions and non-consumable In-App Purchases”; „once you turn on Family Sharing … you can't turn it off” (MS-18) | decyzja właściciela w E2, nieodwracalna |
| Progi cenowe | „Choose from up to 800 price points by default”; ceny w 174 innych storefrontach generowane z kraju bazowego (MS-19) | ceny z progów, kraj bazowy USA |
| Obniżka i podwyżka subskrypcji | obniżka: „You don’t have the option to preserve the higher price for existing subscribers”; podwyżka powyżej progu wymaga zgody; US 5 USD (nie-roczne) / 50 USD (roczne), GB 5 / 50 GBP, JP 800 / 8000 JPY, NO 60 / 600 NOK, AU 8 / 80 AUD, CA 7 / 70 CAD, FR 5 / 50 EUR; DE i PL: „Consent required” (MS-20, MS-21) | niska cena startowa daje się podnieść bez zgody w większości listy krótkiej, ale nie w DE i PL; decyzja o zachowaniu ceny dla obecnych w E2 |
| Podział darmowe/płatne | Apple nazywa „freemium” i „metered paywall” jako wzory (MS-02b) | obie formy dozwolone; limit użyć to nie okres próbny (kalibracja) |

### Plan sesji 2 (zasada 9)
| Etap | Co | Czas agenta | Na co się czeka | Właściciel |
|---|---|---|---|---|
| E1.3 | klasa WTP i poziom dowodu dla 59 BR (i NFR, które ktoś sprzedaje: eksport, synchronizacja, zegarek); dowody R z macierzy roli 01 i cen sesji 1; cztery soczewki z kontraktu jako niezależni subagenci (bez wglądu w siebie), potem porównanie | 1,5–2,5 h | — | — |
| E1.4 | raport: WTP-X dla 03, statusy H-01/H-02/ZAL, ER do 01 przy sprzeczności | 0,5 h | — | STOP E1, ok. 10 min |
| E2 | co najmniej dwa modele (np. A: darmowy rdzeń + 3 produkty P-019; B: darmowy rdzeń + tylko dożywotni; C: subskrypcja z okresem próbnym), reguły, ryzyko etyczne, koszt utrzymania; `rachunek.mjs` z dzisiejszym kursem; decyzje: zakres darmowy, okres próbny, Family Sharing, synchronizacja, zachowanie ceny | 1,5–2 h | — | STOP E2, 4–6 decyzji, ok. 20–30 min |
| E3 | kontrakt płatności, szkic ADR biblioteki (expo-iap / RevenueCat / własny moduł; wersje npm z dziś), wektory dostępu, przekazanie 03/04/05/07/08, sztafeta | 2–3 h | npm i dokumentacja Expo | STOP E3, ok. 10 min; potem kroki w App Store Connect |

Razem ok. 6–8 h pracy agenta (punkty czyszczenia na każdym STOP); od właściciela 3 odpowiedzi, ok. 45–60 min, i kroki w App Store Connect po E3.

### Otwarte pytania sesji 2
| ID | Pytanie | Rozstrzyga | Dotyczy |
|---|---|---|---|
| OP-19 | Progi 0,99 / 6,99 / 14,99 USD dla subskrypcji i dożywotniego: **dostępne** (właściciel, 2026-10-22: „tak, mam to w innej aplikacji, mix subskrypcji i lifetime access w tych cenach. Dozwolone przez apple. Nie musimy tego badac ponownie.”). Wpływ w rachunku zostaje szacunkiem ze stawek (OP-05 bez zmian) | zamknięte | rachunek E2, kontrakt E3 |
| OP-20 | Umowa Paid Apps i formalności: **załatwione** (właściciel, 2026-10-22: „umowa paid apps i wszystkie formalnosci juz zalatwione”). Linię karty w `CLAUDE.md` poprawia właściciel albo rola 01 | zamknięte | `CLAUDE.md` |

## Sesja 2, E1: Wartość funkcji (2026-10-22)
Metoda: cztery soczewki z kontraktu (oszczędny użytkownik, pasjonat po roku, recenzent App Store, analityk konkurencji) jako niezależni subagenci na wspólnym briefie, każdy bez wglądu w pozostałych (decyzja właściciela na STOP E0: „A”). Dowody: macierz 14 aplikacji roli 01 (`oczko-warsztat/01-odkrywanie/soczewki/konkurencja.md`; „✓$” = funkcja płatna u konkurenta), 4682 recenzje roli 01, listingi US odczytane 2026-10-22. Pełne tabele soczewek i skrypty: `oczko-warsztat/02-monetyzacja/2026-10-21-sesja2/soczewki/`. **Kontrola cytatów (skrypt `cyt-rec.py`):** 190 cytatów zgodnych z recenzją o podanym id, 195 zgodnych z innym źródłem (listing, wytyczne, BRD), 6 sprawdzonych ręcznie na listingach z 2026-10-22 i w polach tytuł + treść recenzji; zero zmyślonych. Pozostałe „braki” skryptu to polskie propozycje tekstów, nie cytaty.

**Zgodność soczewek:** 46 z 59 BR ma tę samą propozycję u wszystkich czterech; 13 rozbieżnych oznaczam „→ E2” (decyzja właściciela) albo „→ 03”.

### Wartość funkcji
Kolumna „Dowód”: liczba aplikacji z funkcją płatną (✓$) i darmową (✓) w macierzy 14 aplikacji, id recenzji (sklep US, chyba że podano inaczej). „Dane” = dane użytkownika, zawsze darmowe (zasada roli 6), bez klasy WTP.

| BR | Funkcja | WTP | Dowód | Propozycja |
|---|---|---|---|---|
| LIC-001 | licznik od pierwszego uruchomienia | WTP-0 · R | ✓ bez opłaty u 12 z 14 | darmowa |
| LIC-002 | dodawanie i odejmowanie | WTP-0 · B | J-01 | darmowa |
| LIC-003 | historia z godziną i cofnięciem | WTP-1 · R (słaby) | ✓$ 1 (Strikketeller), ✓ 2 | darmowa: chroni liczbę, a bez niej darmowa część to „simple timer” (4.3(b), soczewka recenzenta) |
| LIC-004 | blokada przed stuknięciem | WTP-2 · B | ✓ 2; 24 z 47 recenzji o stuknięciu ≤3★ | darmowa |
| LIC-005 | potwierdzenie bez przerywania dźwięku | WTP-0 · B | J-01 | darmowa |
| LIC-006 | kilka liczników w projekcie | WTP-1 · R | ✓$ 3, ✓ 10; „Paid for premium for 2nd counter and stopwatch function.” (Easy Knitty, id13261592468) | darmowa (3 z 4); limit liczników → E2 (zapora) |
| LIC-007 | licznik powtórzeń | WTP-1 · R | ✓$ 1 (knitCompanion), ✓ 6 (YarnBuddy za darmo) | płatna (3 z 4) |
| LIC-008 | zmiana ustawień licznika | WTP-0 · B | skarga na płatną zmianę: knitCompanion CA id2371488304 | darmowa |
| LIC-009 | przypomnienie „co N rzędów, M razy” | WTP-1 · R | ✓$ 2 (knitCompanion, YarnBuddy) | płatna |
| LIC-010 | plan rzędów z instrukcji | WTP-2 · H | luka rynku (nikt nie ma) | płatna z LIC-009 |
| LIC-011 | cel rzędów i jego osiągnięcie | WTP-2 · B | StitchTally za darmo | darmowa |
| LIC-012 | znaczenie liczby (rząd skończony / w trakcie) | WTP-2 · B | 編み物カウンター２ id12699699581 | darmowa |
| LIC-013 | ekran nie gaśnie | WTP-0 · R | ✓$ 0, ✓ 6 | darmowa |
| LIC-014 | liczenie z ekranu blokady | WTP-1 · R (słaby) | ✓$ 1 (Strikketeller), ✓ 1 | płatna |
| LIC-015 | zegarek | WTP-1 · R (mocny) | ✓$ 3, ✓ 4; „I absolutely love the Apple Watch feature … Worth every penny!” (My Row Counter, id14675500870) | płatna |
| LIC-016 | rząd głosem | WTP-1 · R | ✓$ 2, ✓ 1; „I would happily pay $4.99 for it if it would work with Siri!” (Knit Row Counter, id4845413552) | płatna |
| PRJ-001 | projekt z częściami | WTP-1 · R | ✓$ 1, ✓ 8 | darmowa (3 z 4) |
| PRJ-002 | notatka przy liczniku | WTP-1 · R (słaby) | ✓$ 2, ✓ 9 | darmowa (tekst) |
| PRJ-003 | zdjęcia projektu i etykiety | WTP-1 · R | YarnBuddy za darmo | → E2 (2: płatne dodawanie, 2: darmowe); oglądanie i eksport zawsze darmowe |
| PRJ-004 | dane techniczne projektu | WTP-2 · B | YarnBuddy, Easy Knitty za darmo | darmowa |
| PRJ-005 | powrót po przerwie | WTP-0 · R | obietnica darmowej wersji YarnBuddy | darmowa (dane) |
| PRJ-006 | stan projektu, archiwum | WTP-2 · R | antywzór: archiwum płatne w Easy Knitty, „Now I cannot access the details of my completed projects.” (id11131506863) | darmowa (dane) |
| PRJ-007 | zrób ponownie (kopia) | WTP-2 · B | ✓$ 0 | → E2 (2: płatna, 1: darmowa, 1: do 03) |
| PRJ-008 | stoper przy zablokowanym ekranie | WTP-1 · R | ✓$ 1, ✓ 7; „I needed the timer feature, so I paid for it.” (Easy Knitty, id9819100347) | płatna |
| PRJ-009 | postęp i szacowany czas | WTP-2 · H | jeden płacący chwali statystyki (My Row Counter, id12140475342) | płatna z PRJ-008 |
| PRJ-010 | przypomnienie o przerwie | WTP-2 · B | ✓$ 0; zależy od OP-15 | → 03 |
| WZR-001 | import wzoru z pliku | WTP-1 · R | ✓$ 3 (w tym knitCompanion „Add PDF” w pakiecie płatnym), ✓ 8 | → E2 (2: darmowy, 2: płatny); otwieranie już zaimportowanych zawsze darmowe |
| WZR-002 | wzór ze zdjęcia | WTP-1 · R | ✓$ 3, ✓ 3 | → E2 (jak WZR-001) |
| WZR-003 | znacznik rzędu we wzorze | WTP-1 · R (mocny) | „I upgraded for 2.99 for the highlight tool. Very worth it.” (My Row Counter, id12653275134) | płatna |
| WZR-004 | pisanie po wzorze | WTP-1 · R (najmocniejszy) | ✓$ 5 z 7 aplikacji, które to mają | płatna |
| WZR-005 | wzór i licznik razem | WTP-2 · B | YarnBuddy za darmo | → E2 (z WZR-001) |
| WZR-006 | siatka co 10 oczek | WTP-2 · B (pojedynczy) | ✓$ 0 | płatna z wzorem albo → 03 |
| DAN-001 | baza na urządzeniu | — | J-07 | dane |
| DAN-002 | synchronizacja iCloud | WTP-1 · R | ✓$ 3 (My Row Counter, Crochet row & stitch counter, Strikketeller), ✓ 7 (knitCompanion w „Free Basics”) | → E2 (3: płatna, 1: dane, darmowa) |
| DAN-003–006 | aktualizacja, nowy telefon, eksport, import | — | antywzór: „This app wants $10 just to see my patterns on my new phone.” (id10843107781) | dane |
| DAN-007 | import od konkurencji | WTP-2 · H | ✓$ 0 | darmowa (4 z 4): dane użytkownika na wejściu |
| DAN-008–009 | kosz 30 dni, usunięcie wszystkiego | — | J-07, ZP-03 | dane |
| ZAK-001–004 | przywracanie, bez reklam, opłacone nie znika, polityka | — | wymagania sklepu i uczciwości | dla wszystkich |
| ZAP-001 | włóczka w zapasie | WTP-1 · R | ✓$ 1, ✓ 4; „yarn warehouse is premium” (Crochet row & stitch counter GB, id7646956808) | płatna (moduł); wpisy zawsze widoczne i w eksporcie |
| ZAP-002–004 | zużycie, narzędzia, wyszukiwanie | WTP-1/2 · R/B | ✓$ 2 dla narzędzi | płatne z ZAP-001 |
| KAL-001 | oczka z próbki | WTP-1 · R | ✓$ 2, ✓ 7 | darmowa (4 z 4) |
| KAL-002 | przeliczenie wzoru na próbkę | WTP-1 · R (słaby) | Knitting Chart Pro „Adjust the gauge” | płatna (3 z 4) |
| KAL-003 | jednostki, cale | WTP-0 · R | YarnBuddy za darmo | darmowa |
| KAL-004 | równomierne dodawanie | WTP-1 · B | opis Knitandnote | płatna (3 z 4) |
| KAL-005 | zużycie z wagi próbki | WTP-1 · R | StashBot płatny 4,99 USD | płatna (3 z 4) |
| KAL-006 | długość po blokowaniu | WTP-2 · B | brak na rynku | → 03 |
| KAL-007 | luz w obwodzie | WTP-2 · B (1 soczewka: WTP-X) | brak śladu potrzeby w recenzjach (H-05) | → 03 jako kandydat na odcięcie |
| KAL-008 | grubość z próbki | WTP-2 · B | YarnPal id14529076820 | darmowa |
| SLO-001 | skróty z systemem US/UK | WTP-2 · R | StitchTally i Crochet row & stitch counter za darmo | darmowa (bezpieczeństwo terminologii, RYZ-03) |
| SLO-002 | słownik offline | WTP-2 · B | NFR-OFF-001 | darmowa |

**Zestawienie (59 BR):** WTP-0: 7, WTP-1: 22, WTP-2: 19, ścisłe WTP-X: 0 (KAL-007 graniczne), dane i warunki bez klasy: 11 (DAN-001, DAN-003–006, DAN-008–009, ZAK-001–004). Płatne w zgodzie soczewek: liczenie bez telefonu (LIC-014–016), przypomnienia i plan rzędów (LIC-007, LIC-009, LIC-010), wzór z narzędziami (WZR-003, WZR-004), stoper i statystyki (PRJ-008, PRJ-009), zapas (ZAP-001–004), kalkulatory projektowe (KAL-002, KAL-004, KAL-005).

### Zapory konkurencji (odczyt 2026-10-22, US; szczegóły w `soczewki/analityk.md`)
| Typ zapory | Kto | Skutek w recenzjach |
|---|---|---|
| limit projektów lub plików | YarnBuddy („Add up to 10 projects in free version.”), Knitting Chart (1–2 pliki), Easy Knitty | YarnBuddy: długoletni darmowi przechodzą na płatną; Knitting Chart i Easy Knitty: 1★ za skąpą wersję darmową |
| limit liczników | Easy Knitty (1) | „You start out with only one counter” (id9352595843) |
| funkcja za zaporą | knitCompanion („Free Basics” z dowolną liczbą projektów i iCloud), zegarek, adnotacje, głos | pochwały płacących za konkretne funkcje (LIC-015, WZR-003) |
| odebranie darmowej funkcji | My Row Counter, CozyKnit | „Don’t take away the features I already had and put them behind a paywall.” (My Row Counter, id14209707875) |
| dane za zaporą | My Row Counter „Restore Backup” 9,99 USD, archiwum Easy Knitty | najostrzejsze 1★ (J-07) |

### Wnioski E1 jako hipotezy
| ID | Wniosek | Status | Dowód |
|---|---|---|---|
| H-01 / ZAL-017 | Kierunek potwierdzony: darmowy rdzeń bez wymuszonego okresu próbnego. Forma „jeden projekt za darmo” **podważona**: trzy soczewki proponują brak limitu liczby projektów (zapora na funkcjach), jedna limit 3–5 aktywnych projektów; skąpe zapory (1–2 pliki, 1 licznik) dostają 1★ | częściowo potwierdzone (R) | tabela zapór; oszczędny: limity uznawane za przynętę |
| H-02 / ZAL-018 | Dane i eksport poza zaporą oraz „opłacona funkcja nie znika”: potwierdzone; płacący przechodzą na dożywotni („Just switched to lifetime subscription because I can’t live without it.”, YarnBuddy, id14628479189) | potwierdzone (R) | J-07, tabela zapór |
| ZAL-002 | Wartość stała dotyczy funkcji używanych w każdej sesji (liczenie bez telefonu, przypomnienia, wzór, stoper, synchronizacja); kalkulatory i import dają wartość jednorazową. Subskrypcja spełnia 3.1.2(a), gdy otwiera funkcje sesyjne | potwierdzone dla zakresu płatnego (R) | soczewka recenzenta, MS-01b |
| ZAL-025 (nowe) | Granica darmowe/płatne, raz opublikowana, nie przesuwa się w stronę płatną; odbieranie darmowych funkcji daje 1★ | hipoteza (R) | My Row Counter id14209707875, CozyKnit id13862846807 |

**WTP-X dla roli 03:** brak ścisłych; KAL-007 (luz w obwodzie) jako kandydat na odcięcie (1 z 4 soczewek: WTP-X; H-05); graniczne: KAL-006, PRJ-010 (OP-15), WZR-006.

### Zgłoszenia do roli 01 (ER, sprzeczności i luki BRD)
| ID | Zgłoszenie | Dowód |
|---|---|---|
| ER-01 | BR-ZAK-003 obejmuje funkcje opłacone, ale nie darmowe: brak wymagania „funkcja darmowa nie staje się płatna” (ZAL-025) | tabela zapór |
| ER-02 | Brak scenariusza „subskrypcja wygasła”: dane widoczne i w eksporcie, darmowy licznik działa, płatne funkcje tylko do odczytu | soczewki oszczędnego i pasjonata |
| ER-03 | Brak wymagania przeciw podwójnej opłacie: zakup dożywotni przy aktywnej subskrypcji (3.1.2(b) „should not be able to inadvertently subscribe to multiple variations”) | soczewka recenzenta; Loopsy id13204972143 |
| ER-04 | BR-ZAK-004 wymaga tylko polityki prywatności; strona subskrypcji Apple wymaga też Terms of Use („your app and App Store metadata must include links to your Terms of Use and Privacy Policy”) | MS-02a |
| ER-05 | BR-DAN-009: usunięcie danych nie anuluje subskrypcji; użytkownik powinien to wiedzieć | soczewka recenzenta |
| ER-06 | Brak scenariuszy iPad, zegarek i Family Sharing dla uprawnień (OG-03: „available across all of the user’s devices”) | soczewka pasjonata, MS-01b |
| ER-07 | H-06 „żadna nie ma dowodu zakupu” jest za ostre: zegarek ma dowód R (✓$ 3, pochwały płacących); macierz: knitCompanion „Add PDF” jest w pakiecie płatnym, komórka „wzór PDF” bez $ | soczewka analityka, listing 2026-10-22 |

### Do decyzji w E2 (zapowiedź)
Rodzaj zapory (funkcje albo limit projektów), synchronizacja iCloud (dane czy płatna), import wzoru i zdjęcia (darmowe czy płatne), okres próbny (brak, „XX-day Trial”, oferta wprowadzająca), Family Sharing, zachowanie ceny dla obecnych przy podwyżce.

**Decyzje na STOP E1 (2026-10-22):** „1A 2A”: tabela WTP przyjęta (P-027); ER-01–ER-05 wchodzą w E3 do kontraktu płatności, ER-06 i ER-07 czekają na poprawkę zbiorczą roli 01 przed rolą 03 (P-028).

## Sesja 2, E2: Modele i rachunek (2026-10-22)
**Odczyty z dziś** (surowe teksty: `oczko-warsztat/02-monetyzacja/2026-10-21-sesja2/zrodla/2026-10-22/`): wytyczne „Last Updated: October 16, 2026”, cytaty MS-01, MS-01b, MS-01h, 3.1.2(a) o odbieraniu funkcji bez zmian; nowe MS-22 (3.1.2(b)), MS-23 (oferty wprowadzające); strona subskrypcji (MS-02, MS-02a, MS-21), Family Sharing (MS-18) i Small Business Program (MS-03) bez zmian. Kurs: NBP nie opublikował jeszcze tabeli z 2026-10-22 (odczyt 06:30 UTC), najnowsza to 205/A/NBP/2026 z 2026-10-21 (USD 3,8889).

### Opcje modelu
Wspólne dla wszystkich opcji: darmowy rdzeń według tabeli WTP (P-027), jedno uprawnienie „Pro” (te same funkcje bez względu na produkt), dane i eksport zawsze darmowe, opłacona i darmowa funkcja nie znika (ER-01, ZAL-025), przywracanie na ekranie zakupu i w ustawieniach (MS-01g, MS-02a). Ceny w USD, kraj bazowy USA (MS-19).

| | A: trzy produkty (P-019) | B: tylko dożywotni | C: tylko subskrypcja |
|---|---|---|---|
| Produkty | mies. 0,99 · rok 6,99 (subskrypcje, jedna grupa) · dożywotni 14,99 (Non-Consumable) | dożywotni 14,99 (Non-Consumable) | mies. 0,99 · rok 6,99 |
| Reguła sklepu | 3.1.2(a): „Subscriptions may be offered alongside à la carte offerings” (MS-01h); „ongoing value … available across all of the user’s devices” (MS-01b); 3.1.2(b): „should not be able to inadvertently subscribe to multiple variations of the same thing” (MS-22) | 3.1.1: zakup w aplikacji z „restore mechanism” (MS-01g); okres próbny tylko „XX-day Trial” za Price Tier 0 (MS-01) | jak A bez dożywotniego |
| Okres próbny (mechanizm) | oferta wprowadzająca subskrypcji w App Store Connect (MS-01h, MS-23: „each person is only eligible to redeem one introductory offer per subscription group”); dożywotni bez | „7-day Trial” 3.1.1 albo brak | oferta wprowadzająca |
| Rachunek, 1. rok, 8 sklepów (zł netto, pes. / norm. / opt.) | 450 / 13 935 / 348 007 | 835 / **26 715** / 616 852 | 319 / 9169 / 239 948 |
| Rachunek US, norm. (`rachunek.mjs`) | 2250 USD/rok: 95 mies. + 142 rok + 79 dożywotni płacących | 4313 USD/rok: 339 płacących | — |
| Płacących do progu 500 USD (US, jeden produkt) | mies. 119 · rok 85 · dożywotni 40 | 40 | mies. 119 · rok 85 |
| Ryzyko etyczne | podwójna opłata: dożywotni przy aktywnej subskrypcji (ER-03, MS-22); okres próbny zamieniany w opłatę to najczęstsza skarga (ZAL-009); podwyżka subskrypcji w DE i PL wymaga zgody (MS-20) | najmniejsze: jedna cena, brak odnowień; ryzyko tylko przy „7-day Trial” (ujawnienia 3.1.1) | jak A plus brak wyjścia dla osób, które chcą zapłacić raz (H-02, ZAL-018) |
| Koszt utrzymania | zobowiązanie do stałej wartości (MS-01b), obsługa odnowień, karencji, anulowania, zarządzania subskrypcją w aplikacji, wektory dla 3 produktów | najniższy: jeden produkt, brak odnowień i stanu „subskrypcja wygasła” (ER-02 znika) | jak A |
| Dla kogo dobra | ktoś chce wejść za 0,99 bez decyzji na lata | większość płacących w tej kategorii (H-02 potwierdzone) | stały przychód, ale wbrew dowodom H-02 |

**Odrzucone na starcie (wynik bramki z 2026-10-21, `dowody/oplacalnosc-2026-10-21.txt`):** bez opłat (wpływ 0, koszt programu zostaje); napiwek 2,99 USD (1066 zł norm., poniżej progu 1944 zł: „odłożyć”); płatna z góry (4449 zł, wszyscy konkurenci N mają darmowe pobranie, bariera wypróbowania); reklamy (standard marki wysoki, P-009).

**Jak czytać rachunek.** Liczby to [OCENA] z bramki, nie prognoza (wynik: `dowody/e2-modele-2026-10-22.txt` i `dowody/rachunek-2026-10-22.txt`, oba kod 0; pliki `warianty-e2/*.json`, `rachunek.json`). Przewaga B zależy od jednego założenia: konwersji dożywotniego 14,99 USD (3,0%, interpolacja między jednorazowym 9,99 i 19,99 z bramki) wobec planu A (2,8%). Rachunek progowy: A daje 8,38 USD brutto na płacącego w 1. roku (0,30 × 5 × 0,99 + 0,45 × 6,99 + 0,25 × 14,99), z odnowieniami rocznej przez 3 lata ok. 9,92 USD (retencja 36% po roku, górna granica z MS-12a „up to 36.0%”). B wygrywa, dopóki jego konwersja przekracza 2,8% × 9,92 / 14,99 ≈ **1,85%**, czyli gdy dożywotni bez tańszych planów traci mniej niż ⅓ płacących z A. Wynik A różni się od bramki (13 941 zł) o 6 zł, bo oceny na rok liczone są od dzisiejszej daty.

### Decyzje dla właściciela
| # | Decyzja | Opcje (kompromis) | Rekomendacja |
|---|---|---|---|
| D1 | Model | **A** trzy produkty P-019 (decyzja właściciela; niski próg wejścia 0,99; więcej kodu, ryzyk i ujawnień) · **B** tylko dożywotni 14,99 (najwyższy wynik, najmniej utrzymania; zmienia P-019; brak wejścia za 0,99) · **C** tylko subskrypcja (najniższy wynik, wbrew H-02) | **B**: wynik ok. 1,9× A przy tych samych założeniach, najmniejsze ryzyko etyczne i koszt utrzymania jednej osoby w 35 językach. A zostaje rozsądne, jeśli zależy Ci na wejściu za 0,99 |
| D2 | Zapora | **a** tylko funkcje Pro, bez limitu projektów (3 z 4 soczewek; brak 1★ za skąpą wersję) · **b** funkcje + limit 3–5 aktywnych projektów (silniejszy bodziec, YarnBuddy: limit 10 przenosi długoletnich na płatną; limit raz ustalony nie może spaść, ZAL-025) | **a**; limitu nie da się później zaostrzyć, a poluzować można zawsze |
| D3 | Synchronizacja iCloud (DAN-002) | **a** darmowa jako ochrona danych (ZP-09, P-021, antywzór „$10 just to see my patterns on my new phone”) · **b** w Pro (✓$ u 3 konkurentów; 3 z 4 soczewek) | **a**: dotyczy bezpieczeństwa danych (zasada 5), a nowy telefon i iPad bez opłaty to wyróżnik uczciwości (ZAL-009) |
| D4 | Import wzoru (WZR-001, 002, 005), zdjęcia projektu (PRJ-003), kopia projektu (PRJ-007) | **a** darmowe; płatne narzędzia na wzorze (znacznik, pisanie: najmocniejsze WTP-1) · **b** import i zdjęcia w Pro | **a**: główna praca widoczna przed zakupem (kontrakt E1.3), a płaci się za narzędzia, nie za wejście danych |
| D5 | Okres próbny | **a** brak (darmowy rdzeń pokazuje wartość; brak skarg typu „charged me for a free trial”) · **b** „7-day Trial” 3.1.1 dla Pro (B) albo oferta wprowadzająca (A, C) z ujawnieniami | **a**; przy cenie 14,99 i darmowym rdzeniu okres próbny dodaje kod i ryzyko skarg, a mało wartości |
| D6 | Family Sharing (nieodwracalne, MS-18) | **a** wyłączone na start, decyzja przy odświeżeniu 04.2027 (P-016) · **b** włączone od startu (gest uczciwości; utracony przychód nieznany) | **a**: włączyć można zawsze, wyłączyć nigdy |
| D7 | Zachowanie ceny (tylko A i C) | **a** przy podwyżce obecni zostają przy swojej cenie (MS-21: „unlimited number of active subscribers at their existing price”) · **b** podwyżka dla wszystkich (zgoda w DE, PL i powyżej progów, MS-20) | **a** |

Po odpowiedzi: wpis w rejestrze decyzji Twoimi słowami; statusy ZAL-002, ZAL-016, ZAL-017 i H-01 w rejestrze założeń.

**Decyzje na STOP E2 (2026-10-22):** „Ok sprobujemy tutaj z Twoimi rekomendacjami jako test modelu w jednej aplikacji. Wszystkie decyzje zgodnie z twoim reko.” D1 B (P-029), D2a (P-030), D3a (P-031), D4a (P-032), D5a (P-033), D6a (P-034), D7a warunkowo (P-035, tylko przy powrocie do A albo C).

## Sesja 2, E3: Kontrakt płatności (2026-10-22)
Model: **B, darmowy rdzeń + Pro dożywotni 14,99 USD** jako test modelu w jednej aplikacji (P-029). Odczyty z dziś (surowe teksty: `oczko-warsztat/02-monetyzacja/2026-10-21-sesja2/zrodla/2026-10-22/e3/`): StoreKit MS-24–MS-27, App Store Connect MS-28–MS-30, prywatność MS-31, umowa licencyjna MS-32, Expo, npm i OpenIAP MS-33–MS-38. Wytyczne z 2026-10-22 („Last Updated: October 16, 2026”) bez ponownego odczytu w E3.

### Test modelu (P-029, ZAL-026)
| Element | Ustalenie |
|---|---|
| Miara | konwersja = zakupy Pro (Sales and Trends) / pierwsze pobrania (App Analytics) w tym samym okresie i storefrontach; dane od właściciela, poza publicznym repo |
| Próg | 1,85%: przy nim B daje tyle co A z odnowieniami (E2, „Jak czytać rachunek”) |
| Kiedy | odświeżenie 04.2027 (P-016) albo 3000 pierwszych pobrań, co nastąpi później |
| Reguła | < 1,37%: powrót do A (ceny P-019, zachowanie ceny P-035); > 2,33%: B potwierdzone; pomiędzy: pomiar do następnego odświeżenia |
| Skąd 1,37 / 2,33 | rachunek: 95% przedział przybliżenia normalnego wokół 1,85% przy n = 3000, ±1,96 × √(0,0185 × 0,9815 / 3000) = ±0,48 pp; przy n = 1000 aż ±0,84 pp, dlatego nie wcześniej |
| Ograniczenie | druga aplikacja właściciela ma model mieszany (OP-19); porównanie z nią to punkt odniesienia z innej kategorii, nie dowód przyczynowy |
| Powrót do A | dożywotni `oczko.pro.lifetime` zostaje (nabywcy nie tracą niczego, BR-ZAK-003); dochodzą subskrypcje w jednej grupie i KP-03 w pełnej wersji |

### Podział darmowe / Pro (propozycja dla roli 03; zakres rozstrzyga 03 z właścicielem)
| Część | Wymagania | Podstawa |
|---|---|---|
| Darmowe, bez limitu projektów i liczników | LIC-001–006, LIC-008, LIC-011–013; PRJ-001–007; WZR-001, WZR-002, WZR-005; KAL-001, KAL-003, KAL-008; SLO-001, SLO-002; DAN-002 (synchronizacja iCloud), DAN-007 (import od konkurencji) | P-027, P-030, P-031, P-032 |
| Dane i warunki, zawsze dla wszystkich | DAN-001, DAN-003–006, DAN-008–009; ZAK-001–004 | zasada roli 6, BR-ZAK-003 |
| Pro (jedno uprawnienie) | liczenie bez telefonu: LIC-014, LIC-015, LIC-016 · przypomnienia i plan rzędów: LIC-007, LIC-009, LIC-010 · narzędzia na wzorze: WZR-003, WZR-004, WZR-006 · stoper i postęp: PRJ-008, PRJ-009 · zapas: ZAP-001–004 · kalkulatory projektowe: KAL-002, KAL-004, KAL-005 | P-027 (zgoda soczewek), P-032 |
| Do roli 03 | PRJ-010 (OP-15), KAL-006, KAL-007 (kandydat na odcięcie, H-05), WZR-006 (czy w ogóle) | E1, „WTP-X dla roli 03” |

**Zasada dla 03:** usunięcie funkcji z Pro w zakresie MVP jest swobodne; przeniesienie funkcji z części darmowej do Pro po wydaniu jest zakazane (KP-01). Lista darmowa w pierwszym wydaniu to zobowiązanie, więc 03 może ją zawęzić **przed** wydaniem.

### Kontrakt płatności
| Produkt (ID) | Typ | Cena (próg, kraj bazowy) | Family Sharing | Odblokowuje |
|---|---|---|---|---|
| `oczko.pro.lifetime` albo ID istniejącego produktu Oczka (rozstrzyga właściciel przy konfiguracji App Store Connect, P-038; ID nieodwracalne, MS-28) | Non-Consumable | 14,99 USD, kraj bazowy USA, ceny w pozostałych storefrontach generowane przez Apple (MS-19) | kierunek: włączone; włączenie przy konfiguracji App Store Connect (P-038) | uprawnienie „Pro”: wszystkie funkcje z wiersza „Pro” powyżej |

| Przepływ (PR) | Akcja Pro | Bez dostępu (co widzi użytkownik) | Dane zawsze dostępne |
|---|---|---|---|
| PR-01, PR-02 | — | wszystko działa; ekran zakupu nigdy nie przerywa liczenia | — |
| PR-03 | licznik powtórzeń (LIC-007) | liczniki części działają; przy liczniku powtórzeń znak Pro, stuknięcie otwiera opis i ekran zakupu | liczniki i historia |
| PR-04 | przypomnienie „co N rzędów”, plan rzędów (LIC-009, LIC-010) | jak wyżej | wpisane instrukcje jako tekst notatki |
| PR-05 | zegarek, ekran blokady, głos (LIC-014–016) | ekran nie gaśnie (LIC-013, darmowe); opis funkcji Pro w ustawieniach liczenia | — |
| PR-06 | znacznik rzędu, pisanie po wzorze (WZR-003, WZR-004, WZR-006) | import i czytanie wzoru działają (P-032); narzędzia ze znakiem Pro | zaimportowane wzory, wcześniejsze adnotacje (do odczytu) |
| PR-07, PR-08, PR-12, PR-13 | — | wszystko działa (P-031, P-032) | wszystko |
| PR-09 | zakup, przywrócenie | ekran zakupu jako stan przepływu (rola 04); przywracanie na ekranie zakupu i w ustawieniach | wszystko |
| PR-10 | zapas (ZAP-001–004) | moduł ze znakiem Pro i opisem | wpisy zapasu widoczne i w eksporcie zawsze (KP-02) |
| PR-11 | KAL-002, KAL-004, KAL-005 | KAL-001, 003, 008 działają; pozostałe ze znakiem Pro | zapisane wyniki w projekcie |
| PR-14 | stoper i postęp (PRJ-008, PRJ-009) | znak Pro | zapisane czasy sesji (do odczytu) |

**Wymagania kontraktu (KP).** KP-01–KP-05 to ER-01–ER-05 wpisane tu zgodnie z P-028; BRD odsyła do tej tabeli (ER-08).
| ID | Wymaganie | Dlaczego / źródło |
|---|---|---|
| KP-01 (ER-01) | Funkcja darmowa w wydanej wersji nie staje się płatna; kontrola przed każdym wydaniem: lista darmowa z tej sekcji wobec poprzedniego wydania (07) | ZAL-025, P-030 |
| KP-02 (ER-02) | Utrata Pro (zwrot): dane utworzone funkcjami Pro zostają widoczne i w eksporcie, funkcje Pro przechodzą w tryb do odczytu, darmowe działają; przy powrocie do A to samo dla wygasłej subskrypcji | zasada roli 6; MS-27: „The date that the App Store refunded the transaction or revoked it from Family Sharing.” |
| KP-03 (ER-03) | Przy aktywnym Pro ekran zakupu nie oferuje zakupu (stan „Masz Pro” z przywracaniem); przy powrocie do A: dożywotni przy aktywnej subskrypcji tylko z ostrzeżeniem i drogą do anulowania subskrypcji | MS-22 (3.1.2(b)) |
| KP-04 (ER-04) | Polityka prywatności w aplikacji i w metadanych (BR-ZAK-004); umowa licencyjna: standardowa EULA Apple, bez własnej. Odnośnik do Terms of Use na ekranie zakupu wymagany przy subskrypcji (MS-02a), przy B nie | MS-32: „If you don’t provide a custom EULA, the standard EULA is applied to your app” |
| KP-05 (ER-05) | „Usuń wszystkie dane” (BR-DAN-009) nie usuwa zakupu; potwierdzenie mówi, że Pro wraca przez przywracanie | MS-26 |
| KP-06 | Źródłem dostępu są transakcje sklepu na każdym urządzeniu; pamięć podręczna tylko jako ostatni udany odczyt, poza danymi synchronizowanymi przez iCloud | zasada roli 7; MS-24: „Products that the App Store has refunded or revoked don’t appear in the current entitlements.” |
| KP-07 | Nasłuch transakcji od startu aplikacji, nie tylko na ekranie zakupu | MS-25: „Without the Task to listen for these transactions, your app may miss them.” |
| KP-08 | Przywracanie (synchronizacja ze sklepem) tylko po stuknięciu użytkownika; przy starcie wystarczają bieżące uprawnienia | MS-26: „Call this function only in response to an explicit user action”; „When users reinstall your app or download it on a new device, the app automatically has all transactions available to it upon initial launch.” |
| KP-09 | Cena na ekranie z obiektu produktu sklepu (waluta storefrontu), nigdy wpisana w kod ani w tłumaczenia | MS-19: ceny w 174 storefrontach generowane z kraju bazowego |
| KP-10 | Ekran zakupu tylko po działaniu użytkownika (znak Pro, ustawienia); nigdy w trakcie PR-02 i PR-05, nigdy przy pierwszym uruchomieniu | wzorce „Etyka”; 5.6 (MS-01f) |
| KP-11 | Bez SDK analityki i usług zewnętrznych w ścieżce zakupu | BR-ZAK-002, NFR-PRY-001, zasada roli 8 |

- **Źródło dostępu:** transakcje sklepu (MS-24); pamięć podręczna: JSON `{ produkty, wygasa }` z ostatniego udanego odczytu, bez końca dla dożywotniego; miejsce wybiera 05 (poza synchronizowaną bazą, KP-06).
- **Bez sieci:** po zakupie Pro działa z pamięci (W-03); przed pierwszym udanym odczytem albo przy uszkodzonej pamięci brak Pro do odczytu ze sklepu (W-04, P-02): przypadek brzegowy, bo zakup i tak wymaga sieci.
- **Przywracanie:** na ekranie zakupu i w ustawieniach (MS-01g, BR-ZAK-001); bez zakupu: komunikat „nie znaleziono zakupu na tym koncie App Store”, nigdy dostęp (W-07).
- **Okres próbny:** brak (P-033). Darmowy rdzeń bez limitu czasu ani użyć, więc nie ma „okresu próbnego” w rozumieniu 3.1.1 (wzorce, „Kalibracja”).
- **Ujawnienia dla roli 04 (ekran zakupu):** (1) kwota 14,99 USD w walucie storefrontu jako najwyraźniejszy element ceny (wymóg strony subskrypcji MS-02, stosowany też do zakupu jednorazowego) i słowa „jednorazowo, bez subskrypcji”; (2) lista funkcji Pro zgodna z tym kontraktem i zdanie, że darmowe zostaje darmowe, a dane i eksport są zawsze dostępne; (3) „Przywróć zakupy” na ekranie i w ustawieniach; (4) widoczne zamknięcie i neutralna odmowa; (5) zakup działa na urządzeniach z tym samym kontem App Store przez przywracanie (MS-26); o rodzinie mówi tylko, gdy Family Sharing jest włączone w App Store Connect (P-038); (6) odnośnik do polityki prywatności; (7) zakazane wzorce z tabeli „Etyka” (fałszywa pilność, „najpopularniejszy”, zawstydzanie, ekran w głównej pracy).

### Logika dostępu i wektory (dla 07 i 08)
Wzorzec z modułu `storekit-expo` przeniesiony 1:1 do `docs/monetyzacja/dostep.mjs` (JavaScript, żeby dało się go sprawdzić bez kompilacji); 08 przepisuje go na TypeScript w kodzie aplikacji. Wektory: `docs/monetyzacja/wektory-dostepu.json` (14 scenariuszy decyzji W-01–W-14, 6 odczytu pamięci P-01–P-06). Wynik `node docs/monetyzacja/dostep-test.mjs`: „zgodne 20 z 20 wektorów”, kod 0 (`dowody/dostep-2026-10-22.txt`). Kontrola testu: kopia funkcji bez sprawdzenia `odebrane` daje „NIEZGODNE 2 z 20” (W-05, W-14) i kod 1. Wektory są kontraktem: 07 i 08 czytają, zmienia rola 02 (ER).

### Szkic ADR: biblioteka płatności (dla roli 05, decyzja w `docs/adr/`)
Przewodnik Expo „Using in-app purchases” („Last updated on September 25, 2026”, MS-33) wymienia `expo-iap` i `react-native-purchases`; „Native code is not configurable when using Expo Go.” Wersje z npm z 2026-10-22; `expo` latest 58.0.17, projekt na SDK 57 (CLAUDE.md, stan poprzedniej wersji): zgodność sprawdza 05.
| Opcja | Koszt i prywatność | Bez sieci, przywracanie, nasłuch | Ryzyko | Ocena roli 02 |
|---|---|---|---|---|
| `expo-iap` (jak Trening, P-036) 6.1.1, MIT (MS-34; wydana 2026-10-18, wcześniej 6.0.3 z 16.10 i 6.1.0 z 17.10) | bez usługi i opłat; dane zakupu tylko między urządzeniem a Apple | `getAvailablePurchases`, `restorePurchases`, `purchaseUpdatedListener`, `finishTransaction` (specyfikacja OpenIAP, MS-38, szczebel 4) | szybkie wydania (3 w 3 dni): przypiąć dokładną wersję, aktualizować świadomie | **rekomendacja** |
| `react-native-purchases` 10.15.0, MIT (MS-35) | RevenueCat: „Pay nothing for up to $2,500 in monthly tracked revenue. Then pay 1%” (MS-36); dane o zakupach wychodzą do usługi, więc wpis w App Privacy (MS-31) | usługa trzyma stan zakupów | sprzeczne z KP-11, ZP-03 i H-03 (uczciwość, brak śledzenia); zależność od firmy trzeciej | odrzucić |
| własny moduł StoreKit 2 (Expo Modules API) | bez opłat i zależności | pełna kontrola (MS-24–MS-26) | kod Swift bez Maca (OP-03): budowanie tylko w CI, trudne debugowanie | zapasowa, gdy `expo-iap` zawiedzie |

**Decyzja właściciela na STOP E3 (P-036):** „Chce zeby platnosci byly jak w innych moich aplikacjach - w treningu chyba mam store kit?” Trening (repo `lkarwowski494/trening` @8b2c14c, odczyt 2026-10-22) ma StoreKit 2 przez `expo-iap` **5.8.1** przypiętą dokładnie (`package.json`), wybraną opcją A spośród `expo-iap`, `react-native-iap` i własnego modułu (`docs/30-storekit-etap0.md`, decyzja S1 z 12.10.2026). Wzorzec do przeniesienia przez 05 i 08:
| Element Treningu | Miejsce | Dla Oczka |
|---|---|---|
| dostęp wyłącznie z `getAvailablePurchases({ onlyIncludeActiveItemsIOS: true })` (= `Transaction.currentEntitlements`) | `lib/store-native.ts:6–7` | zgodne z KP-06 |
| bez `verifyPurchaseWithProvider`, `kitApi`, `iapkit*` (jedyne wywołanie sieciowe biblioteki poza StoreKit), pilnowane testem | `lib/store-native.ts:8–9`; `docs/30-storekit-etap0.md:185` | zgodne z KP-11; rozstrzyga OP-23 w stronę „bez wysyłki poza Apple” |
| błąd odczytu sklepu = stan „nieznany”, nigdy „darmowy” | `lib/store-adapter.ts:5–6` | zgodne z `Odczyt` `blad` (W-03, W-04) |
| adapter sklepu z dwiema implementacjami: natywną i sztuczną (Jest i E2E na symulatorze) | `lib/store-adapter.ts:2–4` | test bez Maca (OP-03); sztuczny sklep tylko w buildzie E2E |
| wersja co najmniej 14 dni od wydania, przypięta dokładnie | `docs/30-storekit-etap0.md:185` | 6.1.1 ma dziś 4 dni: 05 wybiera wersję w dniu wdrożenia, najlepiej wspólną z Treningiem |
| cena tylko z App Store (`displayPrice`) | `lib/store-adapter.ts:13–18` | zgodne z KP-09 |

Różnice nazwane: Family Sharing: kierunek jak w Treningu (S5), włączenie przy konfiguracji (P-038); Trening ma subskrypcje i okres próbny, Oczko jeden zakup jednorazowy (P-029, P-033), więc z adaptera odpadają oferty wprowadzające, karencja i zarządzanie subskrypcją. Kodu Treningu nie kopiuje rola 02; decyzję o ponownym użyciu podejmuje 05.

Wymagania danych dla 05: pamięć podręczna uprawnień (JSON `Pamiec`, KP-06); licznik limitu: brak (P-030). Wpis do inwentarza prywatności: zakup przez StoreKit bez SDK zewnętrznego; czy transakcja obsługiwana przez Apple jest „collect” w rozumieniu App Privacy (MS-31: „transmitting data off the device in a way that allows you and/or your third-party partners to access it…”): [DO USTALENIA] przez 05 (OP-23). „Potwierdzenie” ADR: wektory w Node (kod 0) i scenariusze na telefonie niżej. Adapter izoluje bibliotekę za `Uprawnienie[]`, więc zamiana na własny moduł nie zmienia logiki dostępu.

### Testy, których nie zrobi Node (krok właściciela, dla strategii 07)
**Fix 2026-10-25 (Z07-01):** tabela modelu B (P-029) zastąpiona; obowiązuje jedna lista kontrolna z telefonu przy TestFlight wewnętrznym (P-090 Q1a, P-091 (2a)) w `docs/jakosc/strategia.md` §8 (TT-01–TT-11, prowadzi rola 07). Po utracie Pro (zwrot, wygaśnięcie, odebranie z rodziny) wraca limit dni, a dane, historia, eksport i kopia działają w pełni (KP-02 V4) — nie „tryb do odczytu” z modelu B.
Bez Maca (OP-03) testy StoreKit tylko przez TestFlight: „Apps downloaded from TestFlight will automatically operate in a sandbox environment.” (MS-29); piaskownica pozwala testować zakupy „using test accounts without incurring charges” (MS-30).
| Scenariusz V4 | Oczekiwane | Wektor | Na liście P-090 |
|---|---|---|---|
| zakup subskrypcji miesięcznej albo rocznej w TestFlight | Pro od razu, licznik bez limitu dni | W-01, W-15 | TT-01 |
| zakup dożywotniego przy aktywnej subskrypcji | Pro bez końca; ekran zakupu informuje o samodzielnym anulowaniu subskrypcji (KP-03) | W-17 | „Nie sprawdzono” (wektor + E2E na sztucznym sklepie) |
| usunięcie i ponowna instalacja, start bez „Przywróć” | Pro działa (bieżące uprawnienia) | W-02 | TT-02 |
| tryb samolotowy po zakupie, zabicie i start | Pro działa z pamięci; subskrypcja jeszcze 7 dni po końcu okresu bez sieci (P-103 (3a)) | W-03, W-18, W-12b | TT-03 |
| subskrypcja wygasa bez odnowienia (piaskownica skraca okresy) | Pro znika, wraca limit dni; dane, historia, eksport działają | W-16 | „Nie sprawdzono” (wektor; czas właściciela bez nowej informacji) |
| problem z płatnością przy odnowieniu, karencja 3 dni (krok właściciela 6) | Pro trwa do końca karencji, potem jak wyżej | W-23, W-23b | „Nie sprawdzono” (Trening: pozycja do piaskownicy, `docs/30-storekit-etap0.md` pkt 4) |
| zakup oczekujący (Ask to Buy) | komunikat „czeka”, bez Pro i bez błędu; po zgodzie Pro bez restartu | W-22, W-22b, K-02 | „Nie sprawdzono” (wymaga konta dziecka; E2E na sztucznym sklepie) |
| iPad z tym samym kontem App Store, „Przywróć” | Pro działa | W-09 | TT-10 |
| inne konto piaskownicy bez zakupu, „Przywróć” | komunikat, brak Pro | W-07 | „Nie sprawdzono” (strategia §8) |
| „Usuń wszystkie dane”, potem „Przywróć” | dane puste, Pro wraca (KP-05) | W-02 | TT-11 |
| członek rodziny po włączeniu Family Sharing; potem odebranie | Pro działa; po odebraniu wraca limit dni, dane w pełni dostępne (KP-02) | W-10, W-14 | TT-04 |
| zwrot | jak odebranie z rodziny | W-05, W-06 | TT-05 (sposób w piaskownicy: [DO USTALENIA], OP-21, rola 10) |
| zegarek bez telefonu w pobliżu | Pro według `proZegarka()` (ADR-0009 D, KP-17) | PZ-01–PZ-11 | „Nie sprawdzono” (brak Apple Watch u właściciela; strategia §8) |

### Zgłoszenie do roli 01 (do poprawki zbiorczej z ER-06 i ER-07, P-028)
| ID | Zgłoszenie | Dowód |
|---|---|---|
| ER-08 | BRD opisuje trzy produkty P-019: H-02 („zgodnie z P-019 dożywotni 14,99 USD obok subskrypcji”), OG-03 („Dotyczy P-019”), `docs/brd/README.md` (ceny P-019). Po P-029: jeden produkt Pro; H-01 i H-02 rozstrzygnięte (niżej); BR-ZAK powinny odsyłać do KP-01–KP-05 | P-029–P-033 |

### Statusy H i ZAL po roli 02
| ID | Status | Dowód |
|---|---|---|
| H-01 / ZAL-017 | rozstrzygnięta: darmowy rdzeń bez limitu projektów i bez okresu próbnego (forma „jeden projekt” zastąpiona) | P-030, P-033 |
| H-02 / ZAL-018 | rozstrzygnięta: zakup jednorazowy jako jedyny produkt; dane i eksport poza zaporą; KP-01, KP-02 | P-029 |
| H-03 / ZAL-009 | potwierdzone (R); w kontrakcie: KP-10, KP-11, ujawnienia; przekaz sklepu dla roli 11 | E1 sesji 1 |
| ZAL-002 | bez zmian; przy B nie jest warunkiem | P-029 |
| ZAL-016 | hipoteza, teraz tylko dla 14,99 USD | test P-029 |
| ZAL-025 | hipoteza (R), podstawa KP-01 | E1 |
| ZAL-026 (nowe) | hipoteza: konwersja B ≥ 1,85% | test P-029 |
| ZAL-003 | potwierdzone dla płatności przy `expo-iap` (bez opłat); RevenueCat do 2500 USD MTR też 0 zł, ale odrzucony z powodu prywatności | MS-34, MS-36 |

### Kroki właściciela w App Store Connect (po decyzji 05 i przed pierwszym buildem z zakupem)
1. Sprawdzić, czy jest już produkt Oczka (typ, ID, cena, Family Sharing, stan; OP-24). Jeśli jest Non-Consumable do użycia dla Pro: zostaje jego ID i rola 08 wpisuje je do `ODBLOKOWUJA`. Jeśli nie: utworzyć Non-Consumable „Oczko Pro”, ID `oczko.pro.lifetime` (ID nie da się zmienić ani użyć ponownie, MS-28) (P-038).
2. Cena: 14,99 USD, kraj bazowy USA; pozostałe storefronty automatycznie (MS-19).
3. Family Sharing: **włączyć** (P-038; nieodwracalne, MS-18).
4. Opis i nazwa wyświetlana: na start en-US; pozostałe języki z rolą 09.
5. Konto testowe piaskownicy (Sandbox Apple Account) do scenariuszy wyżej.
6. **Billing Grace Period** (P-103 (2a), fix 2026-10-25; jak Trening 14.10.2026): włączyć dla subskrypcji Oczko Pro, okres **3 dni**, typ odnowień **All Renewals** (App Store Connect → aplikacja → Subscriptions → Billing Grace Period). Źródło (odczyt 2026-10-25, developer.apple.com/help/app-store-connect/manage-subscriptions/enable-billing-grace-period-for-auto-renewable-subscriptions): „select a period of 3, 16, or 28 days to apply across all subscription products in your app”; „All Renewals: Billing Grace Period applies to all renewals, including free introductory offers and free subscription offers transitioning to paid subscriptions.” Nie wykonuje agent (zasada wspólna 12). Uwaga: kroki 1–3 pochodzą z modelu B; produkty V4 (dwie subskrypcje i dożywotni) według tabeli „Produkty” w sesji 3.
Umowa Paid Apps i Small Business Program: załatwione (OP-01, OP-20).

### Przekazanie
- **03:** tabela „Wartość funkcji” (E1, P-027) i „Podział darmowe / Pro”; WTP-X: brak ścisłych, KAL-007 kandydat na odcięcie; KP-01 jako ograniczenie zakresu.
- **04:** ekran zakupu jako stan przepływu PR-09, wejścia tylko według KP-10, ujawnienia (1)–(7), stan „Masz Pro” (KP-03), tryb do odczytu po utracie Pro (KP-02), zakazane wzorce z „Etyki”.
- **05:** szkic ADR (rekomendacja `expo-iap`, przypięta wersja), KP-06–KP-09, pamięć podręczna poza synchronizacją, OP-22 (zegarek), OP-23 (App Privacy).
- **07:** wektory `docs/monetyzacja/wektory-dostepu.json`, scenariusze „tylko telefon”, kontrola KP-01 przed wydaniem.
- **08:** `docs/monetyzacja/dostep.mjs` jako wzorzec logiki dostępu, kontrakt KP-01–KP-11.
- **Właściciel:** kroki w App Store Connect; dane do testu P-029 po wydaniu.

### Definicja ukończenia (build, sesja 2)
| Punkt kontraktu | Stan | Dowód |
|---|---|---|
| ceny, stawki, kurs i reguły sklepu z adresem, cytatem i datą | spełnione | „Źródła” MS-01–MS-38; OP-05 (VAT US, CA) otwarte |
| co najmniej dwa modele z regułą, kompromisem, ryzykiem etycznym i rachunkiem; rekomendacja; wybór słowami właściciela z datą | spełnione | E2 (A, B, C); P-029 |
| `rachunek.mjs` kod 0, liczby ze źródłem albo [OCENA] | spełnione | powtórzone 2026-10-22 w E3: wynik identyczny z `dowody/rachunek-2026-10-22.txt` i `dowody/e2-modele-2026-10-22.txt`, kod 0 |
| każda funkcja BR z klasą WTP i poziomem dowodu; WTP-X do 03 | spełnione | E1 (59 BR), P-027 |
| kontrakt: produkty, uprawnienia, bramki przy przepływach, przywracanie, bez sieci, okres próbny, Family Sharing, ujawnienia | spełnione | „Kontrakt płatności” |
| H i ZAL ze statusem; sprzeczności jako ER | spełnione | „Statusy H i ZAL”; ER-01–ER-08 |
| bramka (krok 0) | spełnione w sesji 1 | P-013 |


## Sesja 1, E0: Rama

### Środowisko (2026-10-21)
| Sprawdzenie | Wynik |
|---|---|
| System, Node, git | Linux x86_64 (chmura, `CLAUDE_CODE_REMOTE=true`), Node v22.22.0, git 2.43.0 |
| GitHub | push na gałąź roboczą przez git; narzędzia MCP GitHub dostępne |
| Sieć | 200: `itunes.apple.com/search`, `developer.apple.com`, `api.nbp.pl`, `gs.statcounter.com`, `play.google.com`; 403: `reddit.com/…/about.json` (sygnał społeczności trzeba wziąć inaczej); Google Trends wymaga JS (301) |
| Mac z Xcode, symulator iOS | brak w chmurze; testy StoreKit to krok właściciela (dotyczy sesji 2) |
| App Store Connect, umowa Paid Apps, Small Business Program | [DO USTALENIA] u właściciela (OP-01) |
| Widoczność repo | publiczne: dane z App Store Connect poza gitem (P-006; `oczko-warsztat` jeszcze nie istnieje) |

### Wejście jako hipotezy (ZAL)
Nie ma jeszcze BRD ani rejestru założeń; to założenia z opisu pomysłu i karty, na których stoi bramka. Rejestr `docs/zalozenia.md` założę w E1b z wynikami.

| ID | Założenie | Źródło | Status po E0 | Sprawdzenie |
|---|---|---|---|---|
| ZAL-001 | Osoby dziergające na iPhonie płacą za aplikacje-pomocników (licznik, wzory, magazyn) | pomysł | hipoteza | E1.1 ceny i modele konkurencji |
| ZAL-002 | Wartość jest stała (kolejne robótki, praca codzienna), nie jednorazowa | pomysł („towarzysz pracy przy robótce”) | hipoteza | E1.2 recenzje, warianty w E1b |
| ZAL-003 | Bez konta, sieci i usług: koszt pieniężny samej aplikacji 0 zł/rok (Apple Developer to koszt portfela, D-024) | pomysł, karta | hipoteza | obszar 11 (Garmin) może dodać koszt: E1b |
| ZAL-004 | Platforma: tylko iOS (iPhone, opcjonalnie zegarek) | pomysł; decyzja P-011 (2026-10-21) | potwierdzone decyzją | — |
| ZAL-005 | Nikt poza właścicielem nie zapłacił za poprzednią wersję (tylko TestFlight), więc 3.1.2(a) „should not take away the primary functionality existing users have already paid for” nie wiąże modelu | karta; właściciel 2026-10-21 (OP-02: „nie”) | potwierdzone | — |
| ZAL-006 | Popyt jest globalny; kolejność storefrontów wynika z sygnałów popytu, nie z lokalnej podaży | karta, P-009 | hipoteza | przesiew w E1b |
| ZAL-007 | Obszary 1–12 to mapa fraz do wyszukania konkurentów, nie wymagania; klasy WTP dopiero w sesji 2 na BRD | pomysł, prompt roli (E1.3 w sesji 2) | ustalenie procesu | — |

### Reguły sklepu i stawki na dziś
Cytaty w tabeli „Źródła” (MS-01–MS-12). Najważniejsze dla bramki:
- **Wytyczne App Review „Last Updated: October 16, 2026”** (MS-01): bez zmian wobec kalibracji biblioteki z 18.10.2026 w 3.1.1 (okres próbny „XX-day Trial” za Price Tier 0, napiwek), 3.1.2(a), 3.2.2(x), 4.2, 4.3(b), 5.6.
- **4.3(b)** wymienia „simple timers” jako nasycone; sam licznik rzędów to ryzyko podobne (wniosek, nie cytat): wartość musi wykraczać poza licznik.
- **Subskrypcja** wymaga „ongoing value” (3.1.2(a)); plan rozwoju z aktualizacjami ją spełnia (D-028 biblioteki), więc warianty subskrypcyjne wchodzą do macierzy.
- **Prowizja:** 15% w Small Business Program (MS-03), w sklepach UE także 15% dla uczestników programu (MS-05); bez programu 30% poza UE (Schedule 2 DPLA, [DO SPRAWDZENIA dosłownie w E1b]) i 26% w UE (MS-05). Liczę oba warianty, dopóki zapis do programu jest niepewny (OP-01).
- **Kurs NBP USD/PLN 3,8889** (tabela 205/A/NBP/2026 z 2026-10-21, MS-07). Próg z karty: 500 USD netto/rok = **1944,45 zł** (rachunek: 500 × 3,8889).
- **VAT:** rachunek globalny wymaga stawek kraju kupującego dla rynku głównego i listy krótkiej; źródło zbiorcze dla UE: Your Europe („Last checked: 13/07/2026”, MS-08); USA i Kanada: ceny w App Store bez podatku (do potwierdzenia w E1b), pozostałe kraje listy krótkiej ze źródeł urzędowych.

### Plan sesji 1 (zasada 9)
| Krok | Co | Czas agenta | Na co się czeka |
|---|---|---|---|
| E1.1 Konkurencja | wyszukiwanie fraz (dzierganie, szydełko, licznik rzędów, wzory, magazyn włóczek) w języku storefrontu i po angielsku; model, cena pobrania, ceny zakupów w aplikacji z datą; 8–12 aplikacji kategorii i 2–3 spoza niej (np. ogólne liczniki, czytniki PDF z adnotacją) | 45–70 min | limit iTunes ok. 20 zapytań/min |
| E1.2 Recenzje o cenie | RSS recenzji 6–8 wiodących aplikacji (us, gb, pl; inne przy pustej próbce), cytaty z adresem, „n z m w próbce” | 25–40 min | jw. |
| STOP E1 | tabele z datami, hipotezy ZAL ze statusem | — | odpowiedź właściciela (ok. 10 min) |
| E1b Przesiew | wszystkie storefronty × języki: oceny na rok wiodących aplikacji, udział iOS (StatCounter), luka lokalizacji; rynek główny + 5–8 par | 40–60 min | — |
| E1b Rachunek | `rachunek.mjs`, `oplacalnosc.mjs`, JSON dla każdego wariantu D-028 (jednorazowy w ≥3 cenach, mies., roczna, mies.+roczna, mies.+roczna+dożywotni, płatna z góry, napiwek, wariant właściciela 0,99/6,99/14,99 USD); reklamy pominięte: standard marki wysoki | 60–90 min | — |
| STOP E1b | werdykt budować / odłożyć / porzucić, wrażliwość, model optymalny | — | decyzja właściciela (ok. 15 min) |

Razem: ok. 3–4,5 h pracy agenta; od właściciela 3 odpowiedzi (E0, E1, E1b), łącznie ok. 30–40 min.

## Sesja 1, E1: Dowody (odczyt 2026-10-21)

Metoda: `itunes.apple.com/search` (22 frazy po angielsku, storefront US, po 25 wyników), `lookup` (oceny, wydanie, języki), strona `apps.apple.com/<kraj>/app/id<id>` (ceny zakupów w aplikacji: Apple pokazuje najwyżej 10 pozycji, bez okresu, więc okres biorę z nazwy produktu albo opisu), RSS recenzji (do 500 najnowszych na sklep). Odrzucone z wyników: gry „yarn puzzle” (inna praca), kalkulatory ogólne, haft i sklepy z włóczką (poza jedną aplikacją spoza kategorii). Surowe dane i skrypty zbierające: `oczko-warsztat/02-monetyzacja/2026-10-21-bramka/` (commit 85d2ab2).

### Rynek: aplikacje kategorii i spoza niej (US, ceny w USD)
Oceny/rok = oceny ÷ lata od wydania (min. 1). Kolumna „Typ”: N narzędzie do własnych robótek (licznik, wzór, projekty, magazyn), W wzory i nauka z treścią od twórcy (często generowaną AI), S spoza kategorii.

| Aplikacja (id) | Typ | Model | Pobranie | Zakupy w aplikacji (nazwa: cena) | Oceny US (śr.) | Oceny/rok | Języki |
|---|---|---|---|---|---|---|---|
| My Row Counter (1342608792) | N | subskrypcja + reklamy | darmowa | Premium 1 Month 2,99; Premium 1 Year 12,99; Row Counter Premium – Yearly 9,99 / 12,99 / 14,99; No Ads 2,99; Restore Backup 9,99 | 3863 (4,83) | 443 | 14 |
| knitCompanion (1058142783) | N | subskrypcja roczna | darmowa | Essentials 29,99; Setup + Essentials 29,99 (roczna: recenzja id12156949431 „renewed my essentials subscription”) | 6899 (4,83) | 801 | 1 |
| YarnBuddy (1267678125) | N | subskrypcja albo dożywotni | darmowa (do 10 projektów) | Pro Monthly 1,99; Pro Annual 14,99; Pro No Expiration 44,99 | 793 (4,46) | 126 | 1 |
| Knitting Chart (1251317736) | N | jednorazowy | darmowa | Knitting Chart Pro 19,99 („Pay only once … no subscriptions!”) | 1298 (4,35) | 140 | 2 |
| Crochet row & stitch counter (1545599414) | N+W | subskrypcja albo dożywotni | darmowa | Monthly 1,49–4,99; Three months 5,49; One Year 17,99 / 29,99; Lifetime 39,99 | 1208 (4,66) | 207 | 1 |
| StitchTally (6738016114) | N | subskrypcja albo dożywotni | darmowa | Weekly 0,99; Monthly 1,99; Annual 9,99; Lifetime 24,99 | 286 (4,85) | 148 | 3 |
| Easy Knitty Row Counter (1557552992) | N | jednorazowy | darmowa | Unlimited Version 3,99 | 420 (4,12) | 75 | 11 |
| Crochet and Knit Counter (1103338573) | N | płatna + napiwek | 1,99 | „Support for less then a yarn.” 0,99 | 326 (4,79) | 31 | 2 |
| StashBot (928131718) | N (kalkulator włóczki) | płatna | 4,99 | — | 325 (4,76) | 27 | 12 |
| Ravit (1234214894) | N (klient Ravelry) | płatna | 6,99 | — | 6023 (4,83) | 650 | 1 |
| kntd:discover (1572271760) | N (klient Ravelry) | reklamy + subskrypcja bez reklam | darmowa | AdFree Monthly 2,29; AdFree Annually 6,49 | 5224 (4,79) | 1005 | 5 |
| Crochet Studio (1619485014) | N | subskrypcja | darmowa | Plus Monthly 2,99; Plus Annual 29,49 | 579 (4,65) | 142 | 1 |
| YarnPal (6738537088) | W | subskrypcja | darmowa | Yarnpal/Knitpal Premium 3,99; 29,99; 39,99; 49,99 (okres z nazwy niejasny; recenzja id14637433694: „$40 yearly subscription”) | 34 254 (4,71) | 18 643 | 18 |
| Loopsy (6745416564) | N+W | subskrypcja | darmowa | Loopsy Pro 4,99; 9,99; 19,99; 29,99; 39,99; 49,99; 99,99 | 16 787 (4,75) | 11 881 | 11 |
| LoopCraft (6752294439) | W | subskrypcja | darmowa | Weekly Premium 3,99; Yearly Pro 39,99; Yearly Premium 49,99; „7-Day Trial” 34,99 | 5390 (4,70) | 5390 | 10 |
| Woolsy (6759599166) | W | subskrypcja | darmowa | Weekly 3,99; Monthly 8,99; Yearly 39,99; Annual Pro (Special Offer) 19,99 | 230 (4,59) | 230 | 1 |
| Loopy (6756133891) | W | subskrypcja | darmowa | Weekly 3,99; Monthly 9,99; Yearly 39,99 | 286 (4,58) | 286 | 9 |
| CraftBook (6759407166) | W | subskrypcja | darmowa | Unlimited 9,99–49,99; Pro 19,99–59,99 | 945 (4,70) | 945 | 1 |
| Cozyarn (6756036357) | W | subskrypcja | darmowa | Pro 3,99; 5,99; 7,99; 39,99 | 896 (4,72) | 896 | 1 |
| Knitandnote (1634163608) | N | subskrypcja | darmowa | Premium 11,90; 14,99; 107,99 | 181 (3,88) | 48 | 2 |
| Ribblr (1529605339) | W (sklep wzorów) | sprzedaż wzorów | darmowa | — | 552 (4,22) | 91 | 1 |
| Amigurumi Today (1139466041) | W | reklamy | darmowa | Turn off ads 1,99 | 752 (4,39) | 74 | 1 |
| LooseLoop (6756404492) | N+W | subskrypcja + kredyty | darmowa | Premium 4,99 / 49,99 / 99,99; 5–20 Credits 9,99–19,99 | 240 (4,50) | 240 | 7 |
| Counter Tally Count (1144352844) | S (licznik ogólny) | reklamy | darmowa | Remove Ads 19,99 | 14 009 (4,80) | 1385 | 30 |
| Stitchly: Cross stitch (1467867656) | S (haft) | jednorazowy | darmowa | Full Version 75,00; Special Offer 39,99 | 2291 (4,78) | 312 | 33 |

**Ceny regionalne (próbka 13 aplikacji N/W):** GB w funtach w tych samych liczbach co US (np. YarnBuddy £1,99 / £12,99 / £44,99; Knitting Chart £19,99). PL: My Row Counter 9,99–14,99 zł/mies., 49,99 zł/rok; YarnBuddy 9,99 / 72,99 / 199,99 zł; Knitting Chart 99,99 zł; StitchTally 9,99 / 49,99 / 99,99 zł; Easy Knitty 14,99–19,99 zł; płatne z góry: Ravit 29,99 zł, StashBot 24,99 zł, Crochet and Knit Counter 9,99 zł. DE: liczby ocen odczytane, ceny nie (inna etykieta strony, „In-App-Käufe”); uzupełnię w E1b, jeśli DE wejdzie na listę krótką.

**Oceny w storefrontach (ta sama próbka):** US i GB mają setki do tysięcy ocen na aplikację (GB: My Row Counter 502, YarnBuddy 92, Knitting Chart 200). PL: 0–47 ocen dla narzędzi (My Row Counter 41, Knitting Chart 12, YarnBuddy 2), więc w bramce PL wymaga interpretacji B (< 50 ocen). DE: My Row Counter (jako „Zähl Mich”) 364, knitCompanion 141, Knitting Chart 115.

**Przedziały cen narzędzi N (US):** subskrypcja miesięczna 1,49–4,99, mediana 2,52 (n = 6: My Row Counter, YarnBuddy, Crochet counter, StitchTally, Crochet Studio, kntd); roczna 9,99–29,99, mediana 19,49 (n = 6: bez kntd, które sprzedaje tylko brak reklam); dożywotni / jednorazowy pełnego narzędzia 19,99–44,99, mediana 32,49 (n = 4); małe narzędzia jednorazowe albo płatne z góry 1,99–6,99. Aplikacje W: roczna zwykle 39,99, tygodniowa 3,99. (Rachunek: aplikacja z kilkoma cenami jednego okresu wchodzi medianą swoich cen; okresy z nazw produktów.)

### Recenzje o cenie i modelu
Próbka: 2026-10-21, do 500 najnowszych recenzji na sklep, US i GB, 11 aplikacji (razem 2818 recenzji). Liczby to automatyczna klasyfikacja słowami kluczowymi: przybliżenie, które łapie też wpisy nie na temat. Cytaty sprawdziłem ręcznie; adres: `itunes.apple.com/us/rss/customerreviews/id=<aplikacja>/sortby=mostrecent/json`, id recenzji w nawiasie.

| Motyw | Wynik (n z m) | Cytaty |
|---|---|---|
| Płacący chwalą narzędzie do własnych robótek | knitCompanion US: 36 z 342 recenzji w motywie „jednorazowy/warto”; YarnBuddy US: 21 z 243; My Row Counter US: 12 z 500 | „the $10/year for premium is so well worth it!” (My Row Counter, 5★, id14685334270); „I’ve been using the paid version for over four years and find it’s worth every penny.” (knitCompanion, 5★, id13111866440); „Just switched to lifetime subscription because I can’t live without it.” (YarnBuddy, 5★, id14628479189); „I bought the full version because it is SO worth the money.” (Knitting Chart, 5★, id13583431468) |
| Skarga na cenę subskrypcji | YarnPal US 19 z 500; Loopsy US 17 z 388; LoopCraft GB 5 z 27 | „YarnPal is really good at teaching, but the subscription is very expensive” (4★, id14617296521); „Too expensive most of this you can find on you tube” (LoopCraft GB, 2★, id13616625627) |
| Okres próbny zamieniony w opłatę, opłata od razu | Loopsy US 20 z 388; YarnPal US 12 z 500; w aplikacjach N 0–3 | „Literally charged me $20 for a "free 7 day trial" ???” (YarnPal, 2★, id14369060598); „This app charged me as soon as I started the 7 day trial.” (Loopsy, 1★, id14686498977); „Loopsy is free forever with no indication of conditions. Then at the end of the set up it forces you into trying the 7 day free trial” (3★, id14666887433) |
| Zakup dożywotni odebrany albo funkcja zabrana po zapłacie | pojedyncze, ale 1★ | „I paid for the lifetime version, and now they’ve made enough changes where that version isn’t available anymore.” (knitCompanion, 1★, id14338808883); „Purchased the annual subscription for the Smart Pattern feature … The update took out that tool.” (Loopsy, 1★, id14598505817) |
| Utracony zakup albo dane po ponownej instalacji | Easy Knitty US: 22 z 115 recenzji (część nie na temat) | „now I see ads, and there is no option to restore my purchase. All notes on completed projects gone!” (1★, id13952013102); „it didn’t register that I had purchased the premium version. With deleting it I lost all my previously logged projects data.” (3★, id13590518451) |
| Reklamy | My Row Counter US 18 z 500, głównie neutralne | „There are ads but they are not distracting.” (5★, id14412297462); „not full of ads or stuff you don’t really need” (5★, id14610525135) |

### Wnioski E1 jako hipotezy
| ID | Wniosek | Status | Dowód |
|---|---|---|---|
| ZAL-001 | Dziergający płacą za narzędzie do własnych robótek | **potwierdzone (R)** dla US/GB | 12 płatnych narzędzi N z cenami; cytaty płacących wyżej |
| ZAL-002 | Wartość stała | **częściowo potwierdzone (R):** płacący używają „every day, on every project” (knitCompanion, id12420374408) i odnawiają subskrypcje roczne 10–30 USD; jednocześnie rynek ma jednorazowe 4–45 USD i prośby o zakup jednorazowy („I’d like to change my subscription to the one time payment”, YarnBuddy, id13777337543). Rozstrzyga macierz wariantów w E1b | jw. |
| ZAL-008 (nowe) | Rynek dzieli się na narzędzia N (setki ocen/rok, ceny 10–30 USD/rok albo 20–45 USD raz) i aplikacje W z treścią i reklamą płatną (tysiące–dziesiątki tysięcy ocen/rok, 40 USD/rok, agresywne okresy próbne). Oczko to N; do bramki biorę oceny konkurentów N, nie W | hipoteza (ocena roli 02) | tabela rynku |
| ZAL-009 (nowe) | Przewaga uczciwości jest realna: najczęstsze skargi płacących dotyczą okresu próbnego, zabranej funkcji i utraty zakupu albo danych, czyli tego, czego zasady 6–7 roli zabraniają | hipoteza (R) | tabela recenzji |
| ZAL-010 (nowe) | PL to rynek z małą liczbą ocen (< 50 dla narzędzi): w bramce interpretacja A (mały popyt) i B (nisza bez lokalizacji) | hipoteza | oceny PL |

Sprzeczności z rolą 01: brak (roli 01 jeszcze nie było). Klasy WTP funkcji: w sesji 2 na BRD (ZAL-007); już teraz widać dowody R dla obszarów: licznik wielu projektów, wzór PDF ze znacznikiem, zegarek, magazyn i projekty (płatne funkcje u My Row Counter, knitCompanion, YarnBuddy).

## Opłacalność (2026-10-21, próg: 500 USD netto/rok = 1944,45 zł, D-024)

**Werdykt: budować.** Wynik normalny przekracza próg w 9 z 10 wariantów modelu, najmniej o 2,3× (płatna z góry), w wariancie odniesienia (roczna 19,99 USD) 12,8×. Żadne pojedyncze założenie przesunięte do wartości pesymistycznej nie odwraca werdyktu. Wynik pesymistyczny jest poniżej progu we wszystkich wariantach. Tylko iOS (P-011), popyt z narzędzi N (P-012), 8 storefrontów; reszta świata pominięta, więc wynik jest ostrożny.

### Przesiew storefrontów
Sygnały popytu: (1) oceny na rok 13 narzędzi N z E1 w każdym storefroncie (`lookup`), (2) oceny na rok lokalnych narzędzi N z wyszukiwania w języku kraju (bez aplikacji W, P-012), (3) użytkownicy iOS = ludność (Bank Światowy, `SP.POP.TOTL`, 2025) × udział iOS (StatCounter, mobile OS, wrzesień 2026). Luka lokalizacji: ile z 13 narzędzi N ma język kraju (mnożnik szansy, nie popyt). Odczyt 2026-10-21; Tajwan bez danych ludności w API Banku Światowego.

| Storefront | Język | Oceny/rok N globalne | Oceny/rok N lokalne | Razem | Użytkownicy iOS (mln) | Oceny/rok na mln iOS | N z językiem kraju | Oceny łącznie |
|---|---|---|---|---|---|---|---|---|
| us | EN | 3846 | 73 | 3918 | 182.9 | 21.42 | 13/13 | 27632 |
| ca | EN | 502 | 7 | 509 | 27.0 | 18.84 | 13/13 | 3618 |
| gb | EN | 453 | 6 | 459 | 32.6 | 14.06 | 13/13 | 2875 |
| jp | JA | 29 | 396 | 424 | 74.6 | 5.69 | 3/13 | 1581 |
| no | NB | 238 | 146 | 384 | 3.3 | 117.57 | 3/13 | 1794 |
| au | EN | 229 | 5 | 234 | 17.3 | 13.55 | 13/13 | 1630 |
| de | DE | 179 | 3 | 182 | 23.1 | 7.86 | 4/13 | 1223 |
| fr | FR | 122 | 11 | 133 | 23.8 | 5.59 | 4/13 | 874 |
| nl | NL | 79 | 20 | 98 | 5.8 | 17.04 | 4/13 | 632 |
| se | SV | 87 | 4 | 91 | 5.9 | 15.37 | 3/13 | 604 |
| dk | DA | 70 | 1 | 72 | 3.8 | 18.97 | 3/13 | 481 |
| kr | KO | 38 | 10 | 48 | 19.6 | 2.43 | 1/13 | 323 |
| es | ES | 41 | 5 | 46 | 13.3 | 3.47 | 4/13 | 261 |
| ru | RU | 14 | 29 | 42 | 38.0 | 1.11 | 2/12 | 305 |
| nz | EN | 37 | 1 | 38 | 2.6 | 14.31 | 13/13 | 267 |
| be | FR | 27 | 9 | 36 | 5.1 | 7.05 | 4/13 | 213 |

Pozostałe (oceny/rok razem): IT 36, MX 32, FI 31, TW 30, CH 28, PT 26, CZ 25, CL 21, PL 21, VN 19, AT 18, IE 16, AR 16, CO 15, BR 14, UA 14, LV 11, HK 7, HU 6, TR 6, RO 4, EE 4, ID 4, MY 4, SK 3, BG 3, GR 2, SI 2, LT 2, HR 1, RS 1.

- **Lista krótka do rachunku:** US (rynek główny), CA, GB, JP, NO, AU, DE, FR: 8 najwyższych sygnałów popytu (razem 6243 oceny/rok N, 87,5% sumy 7136 z 47 storefrontów).
- **Wnioski:** JP i NO mają silne lokalne narzędzia (JP: 編み物カウンター２ 844 oceny; NO: KNIT – Knitting journal 527, Strikketeller 125) i słabą obecność globalnych narzędzi w swoim języku (3 z 13), więc lokalizacja jest tam warunkiem wejścia. NO, DK, FI, NL, SE mają najwyższą intensywność (oceny na mln użytkowników iOS), ale małą skalę.
- **Języki (D-026 „szeroka”: 35 lokalizacji to dane, przesiew daje kolejność przeglądu rodzimego dla roli 09):** 1) EN, 2) JA, 3) NB, 4) DE, 5) FR, 6) NL, 7) SV, 8) DA, 9) KO, ES, RU, IT, FI; pozostałe po nich. Odrzuconych języków brak (polityka szeroka).
- **Interpretacja B (< 50 ocen):** nie dotyczy listy krótkiej (najmniej FR: 874 oceny łącznie). PL (130 ocen, 21/rok) poza listą krótką.

### Ceny konkurencji per storefront (D-028, odczyt 2026-10-21)
| Aplikacja | Plan | US | CA | GB | JP | NO | AU | DE | FR |
|---|---|---|---|---|---|---|---|---|---|
| StitchTally | mies. | $1.99 | $2.99 | £1.99 | — | 29,00 kr | $2.99 | 1,99 € | 1,99 € |
| StitchTally | rok | $9.99 | $12.99 | £9.99 | — | 129,00 kr | $14.99 | 9,99 € | 9,99 € |
| StitchTally | dożywotni | $24.99 | $34.99 | £24.99 | ¥4,000 | 299,00 kr | $39.99 | 29,99 € | 29,99 € |
| YarnBuddy | mies. | $1.99 | $2.99 | £1.99 | ¥300 | 29,00 kr | $2.99 | 1,99 € | 1,99 € |
| YarnBuddy | rok | $14.99 | $18.99 | £12.99 | ¥1,650 | 159,00 kr | $22.99 | 15,49 € | 15,49 € |
| YarnBuddy | dożywotni | $44.99 | $59.99 | £44.99 | ¥7,000 | 599,00 kr | $69.99 | 49,99 € | 49,99 € |
| Knitting Chart | jednorazowy | $19.99 | $24.99 | £19.99 | ¥3,000 | 249,00 kr | $29.99 | 22,99 € | 22,99 € |
| Easy Knitty | jednorazowy | $3.99 | $3.99 | £1.99 | — | 39,00 kr | $5.99 | — | — |
| StashBot | płatna z góry | $4.99 | $6.99 | £4.99 | ¥800 | 59,00 kr | $7.99 | 5,99 € | 5,99 € |
| Ravit | płatna z góry | $6.99 | $9.99 | £6.99 | ¥1,100 | 89,00 kr | $9.99 | 7,99 € | 7,99 € |

Mediany US z E1: miesięczna 2,52, roczna 19,49, dożywotni 32,49 USD. Ceny wariantów Oczka w storefrontach: cena USD × mediana stosunku cen lokalnych do USD z tej tabeli (CA 1,367; GB 1,000; JP 153,2; NO 12,59; AU 1,503; DE/FR 1,033), czyli przybliżenie progów cenowych Apple; dokładne ceny i wpływ da App Store Connect przy wyborze progu.

### Założenia rachunku
Płacący w sklepie = oceny na rok konkurentów N (globalne + lokalne) × instalacje na ocenę × udział nowej aplikacji × darmowa alternatywa × język × konwersja. Pliki: `docs/monetyzacja/warianty/*.json`, odniesienie `docs/monetyzacja/oplacalnosc-wlasna.json`; skrypty `rachunek.mjs`, `oplacalnosc.mjs` (z biblioteki `prompts` @97ec212).

| Założenie | pes. / norm. / opt. | Źródło |
|---|---|---|
| instalacje na ocenę | 20 / 60 / 200 | [ZAŁOŻENIE], brak przeczytanego benchmarku; rozrzut 10× |
| udział nowej aplikacji w instalacjach narzędzi N | 0,02 / 0,06 / 0,20 | [ZAŁOŻENIE], bez płatnej reklamy; rozrzut 10× |
| darmowa alternatywa (część niezatrzymana) | 0,6 / 0,8 / 0,95 | [ZAŁOŻENIE] |
| język | 0,9 / 1 / 1 | [ZAŁOŻENIE], 35 lokalizacji (D-026) |
| konwersja pobranie → płacący, subskrypcja | 0,010 / 0,021 / 0,040 | MS-12 RevenueCat 2026: freemium „2.1% download-to-paid by day 35”, Ameryka Płn. 2,6% |
| konwersja: jednorazowy 9,99 / 19,99 / 29,99; plan mieszany; wariant właściciela; płatna z góry; napiwek | w plikach wariantów | [ZAŁOŻENIE] względem MS-12, metoda w polu `zrodlo` |
| opłacone miesiące w roku (miesięczna) | 5 | [ZAŁOŻENIE]; odnowienia z kolejnych lat pominięte we wszystkich subskrypcjach (ostrożnie) |
| VAT | US 0, CA 0, GB 20%, JP 10%, NO 25%, AU 10%, DE 19%, FR 20% | MS-08, MS-13–MS-16; US i CA [ZAŁOŻENIE] (OP-05) |
| prowizja | 15% | MS-03, MS-05; zapis do programu potwierdzony (OP-01) |
| koszty roczne aplikacji | 0 zł | D-024 (Apple Developer to koszt portfela), ZAL-003 |
| kursy | NBP 205/A/NBP/2026 z 2026-10-21 | MS-07 |

### Macierz wariantów (wynik `node oplacalnosc.mjs warianty/*.json`, kod 0, `docs/monetyzacja/dowody/oplacalnosc-2026-10-21.txt`)
| Wariant | Razem pes. / norm. / opt. (zł netto/rok) | Werdykt | Założenie, które samo zmienia werdykt |
|---|---|---|---|
| jednorazowy 29,99 USD | 1069 / 35 648 / 823 116 | budować | żadne |
| miesięczna 2,99 + roczna 19,99 + dożywotni 39,99 USD | 1077 / 32 094 / 853 290 | budować | żadne |
| jednorazowy 19,99 USD | 891 / 29 702 / 705 415 | budować | żadne |
| subskrypcja roczna 19,99 USD (odniesienie) | 891 / 24 949 / 627 035 | budować | żadne |
| miesięczna 2,99 + roczna 19,99 USD | 779 / 22 434 / 579 614 | budować | żadne |
| jednorazowy 9,99 USD | 668 / 20 780 / 470 015 | budować | żadne |
| subskrypcja miesięczna 2,99 USD | 666 / 18 660 / 468 965 | budować | żadne |
| właściciel 0,99 / 6,99 / 14,99 USD (D-029) | 450 / 13 941 / 348 164 | budować | żadne |
| płatna z góry 4,99 USD | 111 / 4449 / 117 394 | budować | instalacje na ocenę, udział, konwersja (każde) |
| napiwek 2,99 USD | 27 / 1066 / 35 172 | odłożyć | — |
| reklamy | nie liczone | — | standard marki wysoki (karta, P-009) |

Podział wariantu odniesienia (norm.): US 15 658 zł (237 płacących/rok), GB 2048, CA 1980, NO 1649, JP 1493, AU 898, DE 708, FR 514 zł.

### Wrażliwość
- Wynik normalny jest 12,8× nad progiem; odwrócenie wymaga kilku założeń pesymistycznych naraz (np. instalacje na ocenę 20 i udział 0,02 dają 1/9 wyniku, czyli wciąż ok. 2770 zł; dopiero z konwersją 1% spada poniżej progu).
- **Próg w liczbach (rachunek pomocniczy, roczna 19,99 USD w US):** 29,4 płacących/rok, czyli ok. 1750 instalacji/rok przy konwersji 2,1% (ok. 5 dziennie na świecie), 3680 przy 1%. Założenia normalne dają ok. 22 500 instalacji/rok w 8 sklepach.
- **Najtańsze sprawdzenie:** stosunek instalacji do ocen w App Analytics innych aplikacji właściciela (np. Trening) zamiast [ZAŁOŻENIE] 60; po wydaniu: instalacje z pierwszych 3 miesięcy.
- VAT w US/CA (OP-05): gdyby cena zawierała ok. 7% podatku, wynik US spada o ok. 7%; werdykt bez zmian.

### Model optymalny
Najwyższy wynik normalny w podłodze (bez ciemnych wzorców, zgodny z 3.1.1/3.1.2(a), zasada 18): **jednorazowy 29,99 USD**. Cztery pierwsze warianty różnią się o mniej niż rozrzut moich założeń konwersji, a subskrypcje są zaniżone o odnowienia, więc bramka nie rozstrzyga modelu: rozstrzyga go E2 w sesji 2 (na BRD i klasach WTP). Pewne jest tyle: warianty z cenami rynkowymi (mediany 19,49 USD/rok, 32,49 USD jednorazowo) dają 1,3–2,6× więcej niż wariant właściciela 0,99/6,99/14,99 USD, który też przechodzi bramkę.

**Standard marki:** wysoki (karta): bez reklam i SDK śledzących; wariant reklamowy nie liczony.

### Presja AI: spadek kosztów tworzenia aplikacji (pytanie właściciela, 2026-10-21)
**Co już było w rachunku:** strona kosztów. Aplikacja ma koszt 0 zł, bo prowadzi ją jedna osoba z AI, więc próg to tylko 500 USD. Konkurenci z zespołami potrzebują wielokrotnie więcej. **Czego nie było:** wpływu taniego tworzenia aplikacji na ceny i na liczbę konkurentów. Biorę go teraz jako scenariusz.

**Dowody trendu (odczyt 2026-10-21):**
- RevenueCat 2026 (MS-12): „monthly new subscription app launches increased from ~2,000 in January 2022 to 14,700+ by January 2026”.
- Ta kategoria: ze 100 lokalnych narzędzi N znalezionych w przesiewie 63 wydano w 2026, a 10 w 2025. 72 z 73 nowych ma mniej niż 10 ocen (`oczko-warsztat/…/lokalne-N.json`).
- Ceny jeszcze nie spadły: nowe aplikacje W biorą 39,99 USD/rok. Jedyne nowe narzędzie N z ocenami (StitchTally, 11.2024) jest tańsze od median: 9,99 USD/rok, 24,99 USD dożywotnio. To tylko jeden przypadek, więc nie dowód spadku cen.
- Wniosek (hipoteza ZAL-014): tanie tworzenie aplikacji uderza najpierw w widoczność. Nowych aplikacji przybywa, ale prawie żadna nie zdobywa użytkowników. W cenę uderzy później.

**Scenariusze** (wynik `node oplacalnosc.mjs warianty-ai/*.json`, kod 0, `dowody/oplacalnosc-presja-ai-2026-10-21.txt`; ceny i udział nowej aplikacji przemnożone):
| Wariant | Bez presji (norm.) | A: ceny ×0,5, udział ×0,5 | B: ceny ×0,3, udział ×0,3 |
|---|---|---|---|
| jednorazowy 29,99 USD | 35 648 zł | 8914 zł · budować | 3209 zł · budować |
| mies. 2,99 + roczna 19,99 + dożywotni 39,99 USD | 32 094 zł | 8027 zł · budować | 2891 zł · budować |
| jednorazowy 19,99 USD | 29 702 zł | 7423 zł · budować | 2674 zł · budować |
| roczna 19,99 USD | 24 949 zł | 6235 zł · budować | 2246 zł · budować |
| właściciel 0,99 / 6,99 / 14,99 USD | 13 941 zł | 3493 zł · budować | 1258 zł · **odłożyć** |

Próg: 1944,45 zł. Wynik zależy od ceny i udziału liniowo (konwersję przy niższej cenie zostawiłem bez zmian, ostrożnie). Werdykt „budować” przy cenach rynkowych wytrzymuje spadek cen i udziału o 70% naraz. **Korekta (2026-10-21, po pytaniu właściciela):** w wierszu „właściciel” scenariusz B obniża o 70% cenę, która już jest na poziomie rynku po takim spadku (19,49 USD/rok × 0,3 ≈ 5,85 USD wobec 6,99 USD), więc zaniża ten wariant. Bez obniżki jego ceny wynik B to 4182 zł (budować), więcej niż warianty rynkowe w B (2246–3209 zł). Szczegóły niżej.

**Skutki dla dalszej pracy:**
- Odświeżenie bramki co 6 miesięcy zamiast 12 (D-025 pozwala odświeżyć „na żądanie właściciela”): następne w 04.2027 (6 miesięcy od 2026-10-21) albo wcześniej, przy pierwszym spadku median cen narzędzi N o ponad 25%. Decyzja właściciela.
- Największe ryzyko to widoczność (udział), nie cena. Dla roli 01 i M5: wyróżnik musi być widoczny w sklepie, np. uczciwy model (ZAL-009) i 35 języków. Większość konkurentów ma 1–3 języki (E1).
- Jedna osoba to też ograniczenie: obsługa zgłoszeń i aktualizacje w 35 językach. Dla roli 03: mały zakres; model bez zobowiązania do stałych nowych treści jest tańszy w utrzymaniu niż subskrypcja (sesja 2, E2).

### Cena właściciela a konwersja (pytanie właściciela, 2026-10-21)
Teza właściciela: niska cena podniesie konwersję, ludzie przejdą z droższych aplikacji, a nowi wybiorą tańszą.

**Co mówią dane (RevenueCat, szczebel 4; porównanie między aplikacjami, nie eksperyment cenowy):**
| Za tezą | Przeciw tezie |
|---|---|
| 2025: „While lower-priced apps attract more downloads” | 2025: „2.66% median Download-to-Paying for high-priced apps versus 1.49% for low-priced” |
| 2025: „lower price points are actually showing stronger trial-to-paid conversion (47.8% versus 28.4% for high-priced)” | 2026: „High-priced apps generate $35.89 monthly RLTV median, 5.4× higher than low-priced apps at $6.67” |
| 2025: „Most apps with cheap annual plans keep up to 36.0% of users subscribed after a year. High-priced monthly plans? Just 6.7%” | 2026: D14 przychód na instalację „High-priced median: $0.61” wobec „Low-priced median: $0.08” |

Wniosek: tania aplikacja zdobywa więcej pobrań i lepiej utrzymuje płacących, ale przy medianie zarabia mniej na instalacji. Dane mieszają różne aplikacje (tanie bywają słabsze), więc nie rozstrzygają tego dla Oczka. Recenzje z E1 dają słaby sygnał przejść z powodu ceny: w narzędziach N płacący chwalą ceny 10–30 USD/rok, a skargi na cenę dotyczą głównie aplikacji W (39,99 USD/rok). Przejście z innej aplikacji hamują też dane zostawione u konkurenta (projekty, wzory), więc pomógłby import.

**Ile musiałaby urosnąć konwersja i udział** (`dowody/oplacalnosc-cena-wlasciciela-2026-10-21.txt`, kod 0; wariant właściciela ma już konwersję +20% wobec planu mieszanego):
| Wariant | Wynik norm. (zł netto/rok) |
|---|---|
| właściciel, konwersja ×2 i udział ×1,5 | 41 824 |
| jednorazowy 29,99 USD | 35 648 |
| mies. + roczna + dożywotni (ceny rynkowe) | 32 094 |
| **właściciel, konwersja ×1,5 i udział ×1,5** | **31 368** |
| roczna 19,99 USD | 24 949 |
| właściciel, konwersja ×1,5 | 20 912 |
| właściciel (jak w macierzy) | 13 941 |
| presja AI B: właściciel bez obniżki ceny, udział ×0,3 | 4182 |
| presja AI B: jednorazowy 29,99 / roczna 19,99 | 3209 / 2246 |

- Wariant właściciela dogania plan z cenami rynkowymi, gdy konwersja i udział rosną jednocześnie o ok. 50%. Taki wzrost jest możliwy, ale dziś nie ma na niego dowodu ([ZAŁOŻENIE], ZAL-016).
- Przy spadku cen rynku (presja AI) wariant właściciela wygrywa, bo nie musi obniżać ceny. To zabezpieczenie na przyszłość, nie koszt.
- Asymetria: obniżka ceny nikomu nie szkodzi. Podwyżka zraża użytkowników, a przy subskrypcjach wymaga zasad Apple, których dziś nie czytałem [DO SPRAWDZENIA w sesji 2]. Start od wyższej ceny zostawia więc więcej możliwości. Za startem od niskiej ceny przemawia z kolei szybsze zdobycie ocen i widoczności (ZAL-014).
- Wybór ceny należy do sesji 2 (E2); bramka przechodzi w obu kierunkach.

### Rozbieżności z portfelem (D-023; `portfel-aplikacji` otwarty po zapisaniu własnego rachunku, karta `karty/24-oczko.md`, `dane/ranking.json`, commit e3cc4bb)
| Wielkość | Moja | Portfel | Przyczyna |
|---|---|---|---|
| Werdykt | budować | miejsce 6 z 247 | zgodne |
| Model optymalny | jednorazowy 29,99 USD (nierozstrzygnięty w szumie) | pojedynczy zakup 14,99 USD | zgodny kierunek; cena: moja z median rynku N |
| Przychód norm. | 24 949 zł ≈ 6415 USD/rok (roczna 19,99); 35 648 zł ≈ 9167 USD (jednorazowy 29,99) | 2991 USD (3. rok, 16 sklepów) | wyższa cena; portfel liczy 3. rok z rampą i niższą ceną |
| Płacący/rok norm. | 378 (8 sklepów) | 589 | moja ostrożniejsza konwersja i mniej sklepów |
| Instalacje/rok norm. | ok. 22 500 | 14 734 | portfel: benchmark młodych aplikacji z YarnPal (W); ja: tylko N (P-012) |
| Wariant właściciela norm. | 13 941 zł ≈ 3585 USD | 2029 USD | jak wyżej |
| Rynek | oceny narzędzi N w 47 storefrontach | subreddity i CYC 38 mln | inna metoda; liczby CYC portfel oznacza do sprawdzenia |

## Źródła
| ID | Adres | Miejsce | Cytat | Odczyt | Szczebel |
|---|---|---|---|---|---|
| MS-01 | developer.apple.com/app-store/review/guidelines/ | nagłówek; 3.1.1 | „Last Updated: October 16, 2026”; „Non-subscription apps may offer a free time-based trial period before presenting a full unlock option by setting up a Non-Consumable IAP item at Price Tier 0 that follows the naming convention: “XX-day Trial.”” | 2026-10-21 | 1 |
| MS-01a | jw. | 3.1.1 | „Apps may use in-app purchase currencies to enable customers to “tip” the developer or digital content providers in the app.” | 2026-10-21 | 1 |
| MS-01b | jw. | 3.1.2(a) | „you must provide ongoing value to the customer, and the subscription period must last at least seven days and be available across all of the user’s devices” | 2026-10-21 | 1 |
| MS-01c | jw. | 3.2.2(x) | „Apps must not force users to rate the app, review the app, download other apps, or other store-related actions in order to access functionality” | 2026-10-21 | 1 |
| MS-01d | jw. | 4.2 | „If your App doesn’t provide some sort of lasting entertainment value or adequate utility, it may not be accepted.” | 2026-10-21 | 1 |
| MS-01e | jw. | 4.3(b) | „Certain kinds of apps, such as dating, flashlight, sound effects, wallpaper, simple timers, and fortune telling, are well established on the App Store” | 2026-10-21 | 1 |
| MS-01f | jw. | 5.6 | „Apps should never prey on users or attempt to rip off customers, trick them into making unwanted purchases” | 2026-10-21 | 1 |
| MS-02 | developer.apple.com/app-store/subscriptions/ | wymagania ekranu zakupu (surowy tekst strony, l. 199–204) | „In the purchase flow for a free trial, clearly indicate how long the free trial lasts and the price billed once the free trial is over.”; „the amount that will be billed must be the most prominent pricing element in the layout” | 2026-10-21 | 1 |
| MS-03 | developer.apple.com/app-store/small-business-program/ | opis programu | „a reduced commission rate of 15% on paid apps and Apple In-App Purchases”; „developers who made up to 1 million USD in proceeds in the prior calendar year … as well as developers new to the App Store, can qualify” | 2026-10-21 | 1 |
| MS-04 | developer.apple.com/programs/enroll/ | członkostwo | „The Apple Developer Program is 99 USD per membership year.” (koszt portfela, poza rachunkiem aplikacji, D-024) | 2026-10-21 | 1 |
| MS-05 | developer.apple.com/support/dma-and-apps-in-the-eu/ | „Business terms for the App Store in the EU” | 26%: „Sales processed by Apple In-App Purchase.”; 15%: „Sales processed by Apple In-App Purchase from participants in the App Store Small Business Program … and sales of auto-renewable subscriptions after their first year.” | 2026-10-21 | 1 |
| MS-07 | api.nbp.pl/api/exchangerates/rates/a/usd/?format=json | tabela A | „205/A/NBP/2026”, „2026-10-21”, „mid”: 3.8889 | 2026-10-21 | 1 |
| MS-08 | europa.eu/youreurope/business/taxation/vat/vat-rules-rates/index_en.htm | stawki VAT UE | „Last checked: 13/07/2026” (stawki krajów wypiszę w E1b) | 2026-10-21 | 3 |
| MS-10 | itunes.apple.com/search, /lookup; apps.apple.com/{us,gb,pl,de}/app/id… | tabela rynku E1 | liczby i ceny jak w tabeli | 2026-10-21 | 1 (dane sklepu) |
| MS-11 | itunes.apple.com/{us,gb}/rss/customerreviews/…/json | recenzje E1 (id w tabeli) | cytaty jak w tabeli | 2026-10-21 | 5 (opinie: dowód R płacenia, nie fakt) |
| MS-12 | revenuecat.com/state-of-subscription-apps (State of Subscription Apps 2026) | definicje, „Hard paywalls…”, geografia | „Hard paywalls convert five times better than freemium (10.7% vs 2.1% download-to-paid by day 35)”; „North America’s median D35 download-to-paid rate is 2.6%” | 2026-10-21 | 4 (raport branżowy, próbka aplikacji RevenueCat) |
| MS-12a | revenuecat.com/state-of-subscription-apps-2025 | „By price point”, retencja | cytaty w sekcji „Cena właściciela a konwersja” | 2026-10-21 | 4 |
| MS-13 | gov.uk/vat-rates | tabela | „Standard rate 20%” | 2026-10-21 | 1 |
| MS-14 | skatteetaten.no/en/rates/value-added-tax/ | tabela | „Normal rate 25 %” | 2026-10-21 | 1 |
| MS-15 | taxsummaries.pwc.com/japan/corporate/other-taxes | Consumption tax („Last reviewed - 07 August 2026”) | „The general rate is 10%” | 2026-10-21 | 4 (jedno źródło) |
| MS-16 | taxsummaries.pwc.com/australia/corporate/other-taxes | GST („Last reviewed - 12 October 2026”) | „The Federal Government levies GST at a rate of 10%” | 2026-10-21 | 4 (jedno źródło) |
| MS-17 | gs.statcounter.com/os-market-share/mobile/… (CSV, wrzesień 2026); api.worldbank.org SP.POP.TOTL (2025) | przesiew | np. US: „iOS”,53.51; ludność 341 784 857 | 2026-10-21 | 3 (StatCounter: ruch w sieci) / 1 |
| MS-09 | biblioteka `prompts`, `role/09-lokalizacja/wzorce.md:27` | 35 lokalizacji (D-026) | „bg, cs, da, de, el, en, es-419, es, et, fi, fr, hr, hu, id, it, ja, ko, lt, lv, ms, nb, nl, pl, pt-BR, pt, ro, ru, sk, sl, sr, sv, tr, uk, vi, zh-Hant” | 2026-10-21 | decyzja portfela |
| MS-01g | developer.apple.com/app-store/review/guidelines/ | 3.1.1 | „you should make sure you have a restore mechanism for any restorable in-app purchases” | 2026-10-21 | 1 |
| MS-01h | jw. | 3.1.2(a) | „Subscriptions may be offered alongside à la carte offerings”; „Auto-renewable subscription apps may offer a free trial period to customers by providing the relevant information set forth in App Store Connect.” | 2026-10-21 | 1 |
| MS-02a | developer.apple.com/app-store/subscriptions/ | „Clearly describing subscriptions” | „Full renewal price, shown clearly and prominently, and localized in available currencies”; „A way for current subscribers to sign in or restore purchases” | 2026-10-21 | 1 |
| MS-02b | jw. | freemium, metered paywall | „A freemium app allows customers to use the app at no cost, with the option to subscribe if they want to enhance their experience or engage more deeply.” | 2026-10-21 | 1 |
| MS-18 | developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/turn-on-family-sharing-for-in-app-purchases | całość | „Family Sharing is a feature supported only by apps that offer auto-renewable subscriptions and non-consumable In-App Purchases”; „Keep in mind that once you turn on Family Sharing for an In-App Purchases in App Store Connect, you can't turn it off.” | 2026-10-21 | 1 |
| MS-19 | developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-a-price-for-an-in-app-purchase | całość | „Choose from up to 800 price points by default”; „Automatically generated prices account for foreign exchange rates and certain taxes” | 2026-10-21 | 1 |
| MS-20 | developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/auto-renewable-subscription-price-increase-thresholds | tabela | „Increases in auto-renewable subscription prices that exceed the below thresholds in each App Store country or region result in a request for subscribers to consent to the new price.”; wiersze USA, GBR, JPN, NOR, AUS, CAN, FRA, DEU, POL jak w E0 sesji 2 | 2026-10-21 | 1 |
| MS-21 | developer.apple.com/app-store/subscriptions/ | „Price decreases”, „Price increases” | „You don’t have the option to preserve the higher price for existing subscribers.”; „You can keep an unlimited number of active subscribers at their existing price while increasing the price for new subscribers.” | 2026-10-21 | 1 |
| MS-22 | developer.apple.com/app-store/review/guidelines/ | 3.1.2(b) | „Users should have a seamless upgrade/downgrade experience and should not be able to inadvertently subscribe to multiple variations of the same thing.” | 2026-10-22 | 1 |
| MS-23 | developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions | całość | „There are three types of introductory offers: free trial, pay up front, and pay as you go.”; „each person is only eligible to redeem one introductory offer per subscription group” | 2026-10-22 | 1 |
| MS-24 | developer.apple.com/documentation/storekit/transaction/currententitlements (surowy tekst: `/tutorials/data/documentation/storekit/transaction/currententitlements.json`) | opis | „A transaction for each non-consumable Apple In-App Purchase”; „Products that the App Store has refunded or revoked don’t appear in the current entitlements.” | 2026-10-22 | 1 |
| MS-25 | jw. `transaction/updates` | opis | „Without the Task to listen for these transactions, your app may miss them.” | 2026-10-22 | 1 |
| MS-26 | jw. `appstore/sync()` | opis | „Call this function only in response to an explicit user action, like tapping or clicking a button.”; „When users reinstall your app or download it on a new device, the app automatically has all transactions available to it upon initial launch.” | 2026-10-22 | 1 |
| MS-27 | jw. `transaction/revocationdate` | opis | „The date that the App Store refunded the transaction or revoked it from Family Sharing.” | 2026-10-22 | 1 |
| MS-28 | developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information | Product ID | „The product ID can contain letters, numbers, hyphens, periods, and underscores, and can be as long as 100 characters.”; „Once a product ID is assigned to an In-App Purchase, it can't be reused for another In-App Purchase within the same app, even if you delete the original In-App Purchase with that ID.” | 2026-10-22 | 1 |
| MS-29 | developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight | całość | „Apps downloaded from TestFlight will automatically operate in a sandbox environment.” | 2026-10-22 | 1 |
| MS-30 | developer.apple.com/help/app-store-connect/test-in-app-purchases/overview-of-testing-in-sandbox | pierwsze zdanie | „Apple provides a sandbox environment that lets you test In-App Purchases and Apple Pay transactions using test accounts without incurring charges.” | 2026-10-22 | 1 |
| MS-31 | developer.apple.com/app-store/app-privacy-details/ | definicja „collect”; „Purchases” | „“Collect” refers to transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time.”; „Purchase History”: „An account’s or individual’s purchases or purchase tendencies” | 2026-10-22 | 1 |
| MS-32 | developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement | całość | „Apple provides a standard end-user license agreement (EULA) that applies in all countries and regions.”; „If you don’t provide a custom EULA, the standard EULA is applied to your app” | 2026-10-22 | 1 |
| MS-33 | docs.expo.dev/guides/in-app-purchases/ | całość | „Last updated on September 25, 2026”; „expo-iap A React Native library for in-app purchases that conforms to the OpenIAP specification and works with development builds.”; „Native code is not configurable when using Expo Go.” | 2026-10-22 | 1 |
| MS-34 | registry.npmjs.org/expo-iap | `latest`, `time` | 6.1.1, MIT, wydana 2026-10-18T14:34:56Z; 6.0.3 z 2026-10-16, 6.1.0 z 2026-10-17; peer `expo: *`, pakiety Amazon opcjonalne | 2026-10-22 | 1 (rejestr) |
| MS-35 | registry.npmjs.org/react-native-purchases/latest | `version`, `license` | 10.15.0, MIT | 2026-10-22 | 1 (rejestr) |
| MS-36 | revenuecat.com/pricing/ | Pro | „Pay nothing for up to $2,500 in monthly tracked revenue.”; „Then pay 1% of what you track once you hit $2,500 in MTR.” | 2026-10-22 | 1 (cennik dostawcy) |
| MS-37 | registry.npmjs.org/expo/latest | `version` | 58.0.17 | 2026-10-22 | 1 (rejestr) |
| MS-38 | openiap.dev/llms.txt | „OpenIAP Quick Reference” | `restorePurchases()`, `getAvailablePurchases()`, `purchaseUpdatedListener`, `finishTransaction` | 2026-10-22 | 4 (dokumentacja projektu biblioteki) |

## Otwarte pytania
| ID | Pytanie | Rozstrzyga | Dotyczy |
|---|---|---|---|
| OP-01 | Small Business Program i umowa Paid Apps: **tak** (właściciel, 2026-10-21). Prowizja bazowa 15% (MS-03, MS-05); 26–30% tylko jako wrażliwość | zamknięte | prowizja |
| OP-02 | Inni użytkownicy TestFlight: **nie** (właściciel, 2026-10-21) | zamknięte | ZAL-005 |
| OP-03 | Mac z Xcode: **nie** (właściciel, 2026-10-21). Testy zakupów w sesji 2 trzeba zaplanować bez Xcode (np. build w chmurze, piaskownica na telefonie przez TestFlight) [DO SPRAWDZENIA w sesji 2] | 02 sesja 2, 05 | kontrakt płatności |
| OP-04 | 30% poza UE (Schedule 2 DPLA): niepotrzebne po OP-01 (program aktywny) | zamknięte | — |
| OP-05 | [DO SPRAWDZENIA] Czy ceny App Store w US i CA są bez podatku (przyjęte VAT 0)? Sprawdzenie: wpływ (`proceeds`) progu w App Store Connect | właściciel / 02 sesja 2 | VAT US, CA |
| OP-06 | [DO USTALENIA] Stosunek instalacji do ocen w App Analytics innych aplikacji właściciela (zastąpi [ZAŁOŻENIE] 60) | właściciel | wrażliwość bramki |
| OP-21 | [DO USTALENIA] Jak wywołać zwrot zakupu w piaskownicy przez TestFlight bez Xcode (scenariusz KP-02) | 07 / właściciel | testy „tylko telefon” |
| OP-22 | [DO USTALENIA] Jak aplikacja na zegarku odczytuje uprawnienie Pro bez telefonu w pobliżu | 05 | LIC-015, kontrakt płatności |
| OP-23 | [DO USTALENIA] Czy zakup przez StoreKit bez SDK zewnętrznego wymaga wpisu „Purchases” w App Privacy (definicja „collect”, MS-31) | 05 | etykieta prywatności |
| OP-24 | [DO USTALENIA] Czy w App Store Connect jest już produkt Oczka (typ, ID, cena, Family Sharing, stan) i czy da się go użyć dla Pro (P-038) | właściciel przy konfiguracji App Store Connect | ID w `ODBLOKOWUJA`, Family Sharing |
