# E0 Rozpoznanie (rola 09-lokalizacja, build, wejście wczesne) · 2026-10-22 · STOP E0 przyjęty (P-075: 1a 2a 3b 4a 5b)
Wejście: P-074; `docs/architektura/e4-przekazanie.md` („09”), `docs/adr/0016-…`, `docs/design/design-spec.md`, `docs/decyzje.md` (P-009), `docs/scope-contract.md`, `docs/monetyzacja.md`, `docs/brd/wymagania.md` (NFR-JEZ-001). Prompt: `oczko-warsztat/09-lokalizacja/2026-10-22-build/` (cf05c5d). Biblioteki zasad z Dysku nie czytano (polecenie właściciela).

## 1. Środowisko
| Sprawdzone | Wynik |
|---|---|
| System, Node, git | Linux x86_64, Node v22.22.0, gałąź `claude/jolly-thompson-paz6d8` @2501dc5, czysta |
| GitHub | narzędzia MCP; repo `oczko-warsztat` dodane z dostępem push (P-010) |
| Przeglądarka do zrzutów | Chromium z systemu (Playwright skonfigurowany); `npx playwright --version` nie zwróciło wersji w tej sesji [niesprawdzone] |
| Xcode / symulator iOS | brak (Linux): sprawdzenie `Intl` w aplikacji (E1 pkt 2) i Maestro iOS tylko w CI na macOS (rola 07; P-041) |
| Sieć | działa: developer.apple.com, docs.expo.dev, raw.githubusercontent.com (odczyty niżej) |
| Repo | publiczne: bez sekretów; materiały prywatne w `oczko-warsztat` |

## 2. Założenia z wejścia
Wpisane do `docs/zalozenia.md`: ZAL-031 (źródło `en`), ZAL-032 (zestaw 35), ZAL-033 (`Intl.PluralRules` w aplikacji), ZAL-034 (język tylko z ustawień systemu). Wszystkie: hipoteza.

## 3. Inwentarz tekstów (stan: kod nowej wersji nie istnieje)
Nowa aplikacja nie ma jeszcze ekranów (08 buduje je po E1), więc inwentarz jest szacunkiem z trzech źródeł, a nie liczbą z kodu:
| Źródło | Liczba | Uwaga |
|---|---|---|
| Stary kod 0.1.0 (materiał, P-004): `src/core/i18n.en.ts` | 306 kluczy, 6361 znaków, średnio 20,8 znaku (maks. 147); mechanizm: polski tekst jako klucz, 2 języki (pl, en), brak liczby mnogiej i `Intl` (`src/core/i18n.ts`) | do wyrzucenia, nie do migracji: klucz = tekst polski łamie zasadę „klucz ma kontekst” |
| Zakres wersji 1 (`scope-contract.md`) | 49 funkcji MVP, 8 PÓŹNIEJ | |
| Szacunek nowej wersji | **[OCENA] 400–700 kluczy** (49 funkcji × ok. 8–14 tekstów; stary kod miał 306 przy innym zakresie) | do zastąpienia liczbą z `sprawdz-i18n.mjs` po E2/08 |
Miejsca tekstu (wymiar „Miejsca tekstu”):
- ekrany, alerty, błędy, oferty i limit (`design-spec.md` „Limit dni na ekranach”, „Teksty ofert”) — po angielsku w makietach;
- komunikaty VoiceOver (`design-spec.md`, 8 chwil) — każdy z liczbą mnogą i parametrami („47 done. Now row 48.”, „Added 3 rows in 1 second”);
- nazwa pod ikoną i `NSCameraUsageDescription` (jedyne uprawnienie z tekstem, `prywatnosc.md`; brak powiadomień lokalnych) — pliki `locales` w 35 językach;
- cele natywne Swift (Live Activity F-11/F-21, zegarek F-12, rozszerzenie dziennika +1, ADR-0008): własne teksty poza JS — katalog wspólny z aplikacją **[do decyzji w E1, ADR]**;
- eksport/kopia, ekran „Dane wymagają naprawy” (rola 12, ekran awaryjny: teksty w każdym języku, E4);
- treści roli 06 (F-38 obliczenia, F-37 pielęgnacja): treść krytyczna, osobny próg (§7);
- opis sklepu: rola 10, tym samym procesem (E3/E4); audio: brak w wersji 1.
Poza zakresem 09: dane użytkownika (nazwy projektów, instrukcje, notatki — pisze użytkownik; aplikacja ich nie tłumaczy, `design-spec.md` „Głos”).

## 4. Dowody (odczyt 2026-10-22, surowy tekst, nie streszczenie narzędzia)
| Fakt | Źródło i cytat | Wniosek |
|---|---|---|
| Metadane sklepu w 50 językach/lokalizacjach, m.in. Spanish (Mexico), Spanish (Spain), Chinese (Simplified), Chinese (Traditional), Norwegian, „Slovenia” | developer.apple.com/help/app-store-connect/reference/app-store-localizations (strona przenosi pod `/reference/app-information/app-store-localizations`): „you can localize it in the following languages and locales: Arabic, Bangla, Catalan, Chinese (Simplified), …” | **5 z 35 języków nie ma metadanych w ASC: bg, et, lt, lv, sr** (tylko interfejs; strona sklepu po angielsku); es-419 → „Spanish (Mexico)” w sklepie |
| Zestaw nie obejmuje zh-Hans ani języków RTL, a ASC oferuje Chinese (Simplified), Arabic, Hebrew | tamże | ZAL-032; „szeroka” to decyzja właściciela (D-026), więc tylko sygnał: **zh-Hans poza zestawem, mimo storefrontu China mainland (domyślnie „Simplified Chinese”)**; poza 8 storefrontami z przesiewu 02 |
| Language per app: aplikacja deklaruje `supportedLocales` | docs.expo.dev/guides/localization: „Both Android and iOS allow users to choose a preferred language for individual apps via the system settings. To support this feature, your app must declare its supported locales to the system.” | pyt. 3 |
| Własny przełącznik jednostek zalecany, gdy aplikacja używa ich więcej niż umiarkowanie | tamże: „you should allow the user to change … Localized units if your app makes at least a moderate use of them” | pyt. 4 |
| Android: zmiana języka bez restartu aplikacji | tamże: „On Android, when a user changes the device's language, the app will not reset.” | odczyt przy powrocie na pierwszy plan (E1) |
| Biblioteki podane przez Expo: fbtee, React i18next, Intlayer | tamże | opcje do ADR w E1 |
| Hermes: brak `Intl.PluralRules` na liście | github.com/facebook/hermes `doc/IntlAPIs.md` (grep po `PluralRules`: 0 trafień) | ZAL-033, polyfill |
| Liczba lokalizacji konkurencji: My Row Counter 14, StashBot 12, Easy Knitty 11, Loopsy 11, LoopCraft 10, Loopy 9, YarnPal 18; reszta 1–5 | `docs/monetyzacja.md` „E1.1”, tabela konkurencji (odczyt 2026-10-21, `lookup`, pole języków) | 35 przewyższa każdą z 18 aplikacji; zasięg to wybór właściciela, nie wymóg rynku [OCENA: skutek dla widoczności nieznany] |
Nie odczytano w tej sesji (przy „szerokiej” niewymagane, ale zapisane): języki systemu iOS (`apple.com/ios/feature-availability`); lokalizacje ok. 10 aplikacji niszy w dniu pracy (użyto odczytu 02 z 2026-10-21).

## 5. Koszt (metoda: klucze × języki; [OCENA])
| Pozycja | Rachunek | Wynik |
|---|---|---|
| Przekład maszynowy, jedna fala | 400–700 kluczy × 20,8 znaku ≈ 8–15 tys. znaków źródła na język × 34 języki | 0,3–0,5 mln znaków; limit użycia modelu, nie koszt w zł (0 zł, NFR-KOS-001) |
| Drugi przegląd AI | te same teksty, świeży kontekst, 34 przeglądy | ok. 2× koszt przekładu; praca agenta 6–10 h na falę [OCENA] |
| Przegląd człowieka | tylko według progu (§7) i zasięgu recenzentów 0 zł; nikt nie jest wskazany | **[DO USTALENIA: kto]**; bez recenzenta język zostaje „maszynowy” |
| Zmiana tekstu | ×35 (kontrola (e)): partie na wydanie, nie na zmianę | reguła utrzymania w `jezyki.md` |
| Opinie i e-maile w języku | nieznane; Zgłoś problem (F-57) bez tłumaczenia | [DO USTALENIA] po wydaniu |

## 6. Warianty
Polityka „szeroka”: zestaw jest dany (35 ze wzorca, D-026), więc tabeli wariantów (min. dwa) nie ma; kolejność przeglądów z przesiewu 02 jest w `jezyki.md`. Nie ma tu wariantu „sam polski”: kontrakt wymaga mechanizmu i kluczy od razu (P-009), więc pytanie „budować od razu?” jest zamknięte.

## 7. Pytania produktowe do właściciela (każde: opcje, kompromis, rekomendacja)
1. **Język źródłowy tekstów (ZAL-031).**
   - (a) **angielski (en-US)** — rekomendacja: makiety 04, komunikaty VoiceOver i oferty są już po angielsku, listing na start `en-US`, rynek główny US; polski jest wtedy jednym z 34 przekładów (cztery formy liczby mnogiej z CLDR), a klucze znaczeniowe (`counter.add`) zastępują polski tekst jako klucz. Koszt: tłumaczenie en→pl maszynowe, przegląd właściciela (znasz język).
   - (b) polski jako źródło: wymaga przetłumaczenia gotowych tekstów 04 na polski i ich rozjazdu z angielską makietą; tłumaczenie pivotem pl→34 języków jest zwykle słabsze niż z angielskiego [OCENA, nie źródło].
2. **Oznaczenie przekładu maszynowego w aplikacji.**
   - (a) **w Ustawieniach wiersz „Translation quality” z odnośnikiem „Report a translation problem” (F-57)**, bez banera — rekomendacja: uczciwe, tanie, bez hałasu na ekranie licznika;
   - (b) baner w pierwszym uruchomieniu w języku zmapowanym jako „maszynowy”: widoczne, ale dodaje ekran do 04 i szum;
   - (c) tylko rejestr i opis sklepu: najtaniej, użytkownik nie wie.
3. **Wybór języka (ZAL-034).**
   - (a) **tylko ustawienia systemu (język per aplikacja)** — rekomendacja: jeden stan mniej, brak synchronizacji preferencji; wada: zmiana wymaga wyjścia do Ustawień iOS;
   - (b) także przełącznik w aplikacji: wygoda dla telefonu w innym języku niż pożądany; koszt: stan, testy zmiany w trakcie, ekran 04.
4. **Jednostki.**
   - (a) **domyślnie z systemu (`measurementSystem`), przełącznik w Ustawieniach** — rekomendacja: Expo zaleca przełącznik jednostek dla aplikacji z miarami; dziergający mieszają systemy niezależnie od języka (rozmiar drutu mm/US, długość m/yd); przeliczenia i zaokrąglenia ustala rola 06;
   - (b) tylko z systemu: mniej kodu, błędne dla osób z telefonem w jednym systemie, wzorami w drugim.
5. **Treści krytyczne (F-37 pielęgnacja, F-38 obliczenia: RD-01, RD-03, RD-04, RD-10) bez recenzenta w danym języku.**
   - (a) **do przeglądu rodzimego tekst zostaje po angielsku z informacją** (zasada roli 3): bezpiecznie, niekompletny przekład; przegląd zastępczy D-027 stosuje rola 06 [definicja D-027 jest w bibliotece `prompts`, której nie widzę — **[DO USTALENIA]**];
   - (b) tłumaczenie po przeglądzie zastępczym (D-027) w każdym języku: pełny zestaw od razu, ryzyko błędu w treści o skutkach praktycznych.
   Decyzja zależy od zakresu treści krytycznych w wersji 1 (rola 06); w MVP to F-37, F-38 (`scope-contract.md`, „Treści”).
6. **Teksty natywne (Swift): katalog wspólny z aplikacją czy osobne `.strings`** — rozstrzygam w ADR w E1 z rolą 05; brak pytania do właściciela, chyba że wybierzesz inaczej.

## 8. Szacunek czasu
| Co | Czas agenta | Czekanie | Czas właściciela |
|---|---|---|---|
| E1 (ADR, testy czerwone, `expo-localization`, polyfille, słownik źródłowy, skrypt) | 4–6 h [OCENA] | — | decyzje 1–5 (kilka minut); nic poza decyzjami (P-041: właściciel nie testuje ręcznie; test `Intl` w aplikacji to krok CI na macOS, rola 07) [poprawione po P-041] |
| E2–E4 (po 08 i audycie 04) | poza tą sesją | 08 | — |
| Fale tłumaczeń E3 | 6–10 h na falę [OCENA] | recenzenci | wskazanie recenzentów |

## 9. Zgłoszenia do innych ról (z E0)
- 04: zh-Hans i języki RTL poza zestawem; krój tytułowy Libre Franklin nie pokrywa greki ani CJK (P-064: tytuły wtedy w kroju systemowym) — test długości po polsku i niemieckim (P-061 (2a)) rozszerzyć o najdłuższy język; liczby mnogie w tekście limitu („{n} rows”).
- 06: lista treści krytycznych wersji 1 i ich próg przeglądu; OP-12 (terminologia w 35 językach) — bez źródeł szczebla 1–3 skróty zostają w języku źródłowym.
- 10: bg, et, lt, lv, sr bez metadanych w ASC; es-419 → es-MX; listing en-US na start.
- 07: samosprawdzenie `Intl` w aplikacji nie wykona się w Jest; potrzebny krok na symulatorze.
