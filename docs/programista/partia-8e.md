# Rola 08 (programista), fix, partia 8e: zegarek
Plik stanu sesji · start 2026-11-01 · gałąź kopii `claude/kopia-partia-8e-2026-11-01` (z kopii scalonej 82d4ed6) · polecenie: `oczko-warsztat` `koordynacja/role-2026-11-01/08-partia-8e.md` (ebe874d). Zatwierdzone ID: `07-jakosc-005`, kontrola L-021 (P-349, tylko sprawdzenie). Na gałąź roboczą nie pushowano (P-344).
Baza: `env -u NODE_PATH npm run verify` na 82d4ed6 = kod 0, 277 zestawów, 2851 testów. Środowisko: Linux, Node v22.23.4, bez Xcode i Swift (`which swift` pusto); `expo prebuild --platform ios --no-install` działa na Linuksie.

## Stan ID
| ID | Status | Commit | Test (czerwony przed → zielony po) |
|---|---|---|---|
| (strukturalnie) | zrobione | f7558d9 | przeniesienie `wejscie`, `zdarzeniaPlus`, `celDniaOsiagniety` do `src/kompozycja/licznik-zdarzenia.ts` bez zmiany treści; `licznik.ts` miał 19,6 KB, dodanie odbioru przekroczyłoby limit 20 KB (`granice.mjs`: ROZMIAR) |
| 07-jakosc-005 (F-12) | zrobione (K-05a–f w Node; K-05g w CI macOS; K-05h u właściciela) | 6e70076 | `tests/dane/kompozycja-zegarek-odbior.test.ts`: czerwony 7 z 10 (licznik zostawał 3, `subskrypcje` 0), zielony 10 z 10 × 3 uruchomienia; `tests/narzedzia/haptyka-zegarka-spojnosc.test.ts`: czerwony 5 z 6 na adapterze sprzed zmiany, zielony 6 z 6 |
| P-349 (L-021) | sprawdzone: ikona jest; dopisany strażnik | fe865ef | `tests/wydanie/ikona-zegarka.test.ts`: czerwony 1 z 3 (brak linii w skrypcie), zielony 3 z 3 |

| przegląd P1 (do 005) | zrobione | (commit „przegląd P1” niżej w `git log`) | `tests/dane/kompozycja-zegarek-odbior.test.ts` „przegląd P1 (ARCH-13)”: czerwony (domknięcie startowało po schowaniu aplikacji), zielony po dodaniu `o.aktywna()` do warunku pętli w `zegarek-odbior.ts` |

Dowód końcowy: `env -u NODE_PATH npm run verify` kod 0 po fe865ef: 280 zestawów, 2870 testów (przed partią: 277 / 2851); po poprawce przeglądu P1: kod 0, 280 zestawów, 2871 testów (plik odbioru: 11 testów).

## E0 (klasyfikacja)
| ID | Rodzaj | Co |
|---|---|---|
| 07-jakosc-005 | D | brak subskrybenta `Zegarek.odbieraj` (ADR-0030 pkt 1–3) i wzorca haptyki przypomnienia (pkt 4); wygląd i token są w specyfikacji 04 (`design-spec.md:915`, `tokeny.json:190`), więc bez wyboru produktowego |
| P-349 | kontrola | tylko sprawdzenie, grafiki nie tworzono |

Wszystkie wywołania zmienianych miejsc (zasada „minimalny zakres”): `Zegarek.odbieraj` — `src/przypadki-uzycia/synchronizacja.ts:121` to port iCloud (inny interfejs, `Synchronizacja.odbieraj`, nie ruszany), `src/kompozycja/e2e/panele.tsx:144` atrapa E2E (no-op, zgodna), `src/platforma/zegarek.ts:22` adapter (bez zmian). Dodany członek `poZegarku` interfejsu `KompozycjaLicznika`: atrapy w dwóch testach (`stoper-po-pierwszym-plusie`, `niezawodnosc-kamien`) dopełnione bez zmiany asercji.

## 07-jakosc-005: co zrobiono
- `src/kompozycja/zegarek-odbior.ts`: `odbiorZegarka` (jedno scalenie naraz + jedno domknięcie; seria N zdarzeń = najwyżej 2 przebiegi; poza `AppState` active nic, ARCH-13) i `odbiorZZegarka` (podpięcie `Zegarek.odbieraj` po danych startu, błąd scalenia = wpis `blad` z kodem `zegarek_scalenie` i powodem, bez treści projektów; odpięcie).
- `src/kompozycja/licznik.ts`: przebieg = `naPierwszyPlan` → `potwierdz` → `stanPoZapisie` → `wersja` + 1 → słuchacze → `poZapisie` (stan do zegarka z potwierdzonymi id). Opcja `aplikacjaAktywna`: bez niej brak subskrypcji (bezpieczny domyślny: żadnej transakcji w tle). Telefon nie wibruje (ADR-0030 pkt 5).
- `app/_layout.tsx`: `aplikacjaAktywna: () => AppState.currentState === 'active'` i `zamknij()` przy sprzątaniu efektu kontenera; `app/index.tsx`: `poZegarku` → `ustawWersje` (jak `naPartie` iCloud).
- Swift (nie do skompilowania tutaj): `modules/oczko-reguly/Sources/OczkoDziennik/Haptyka.swift` — `wzorzecHaptykiZegarka(rodzaj, przebieg)` zwraca `plus`, `przypomnienie`, `bladZapisu`, `blokadaStukniecie` albo `nil` (limit, −1 przy zerze); przypomnienie = `+1` i `pasPrzypomnienia(nowy) != nil` (ta sama reguła co pas; równoważna `sygnalZmiany` dla kroku +1, rozpisane w teście); kopia w `targets/watch/Wspolne/Haptyka.swift` (`scripts/natywne/kopie.json`, `kontrola-swift.mjs`: 0 błędów); adapter `targets/watch/Aplikacja.swift` (`zagraj`) mapuje na `WKHapticType` według tokenów (notification, retry, failure; zwykły rząd .click jak dotąd) i ma jedno wywołanie `play`.
- Testy Swift: `modules/oczko-reguly/Tests/OczkoRegulyTests/HaptykaZegarkaTests.swift` (K-05g): przypomnienie przy 46→47, 10→11, 52→53; plus przy 47→48, 11→12, 58→59; −1 zawsze plus; nieudany zapis; blokada przed przypomnieniem; `nil` bez zapisu. **Nie uruchomione:** brak Swift na Linuksie; uruchomi `swift test` w `jakosc-ios.yml` (krok macOS). Do czasu przebiegu to deklaracja, nie dowód. Zastępcza tańsza kontrola w Node: `tests/narzedzia/haptyka-zegarka-spojnosc.test.ts` (token `tokeny.json` ↔ mapowanie w adapterze ↔ cztery wyniki funkcji ↔ pokrycie w testach Swift).

## Kontrola L-021 (P-349): wynik z plik:linia
Lekcja: `lkarwowski494/trening` `docs/40-lekcje.md` L-021 (wiersz R-013 i sekcja L-021): bez pola `icon:` wtyczka nie ustawia `ASSETCATALOG_COMPILER_APPICON_NAME`, więc actool nie wpisuje `CFBundleIconName`, a Apple odrzuca wysyłkę. Odczyt 2026-11-01.
- Ikona i pole są: `targets/watch/expo-target.config.js:13` (`icon: '../../assets/icon.png'`); `assets/icon.png` = PNG 1024×1024, 8-bit RGB (`file`; IHDR: typ koloru 2, bez alfa).
- Wtyczka robi to, czego lekcja się obawia, tylko przy polu `icon`: `node_modules/@bacons/apple-targets/build/configuration-list.js:263` (`createWatchAppConfigurationList`), `:267-269` (komentarz i `...(icon && { ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon" })`); wersja 5.0.0 przypięta w `package.json:24`.
- Dowód z projektu po `npx expo prebuild --platform ios --no-install --clean` (kod 0, uruchomione tu na Linuksie): cel `com.apps4brew.knitting.watchkitapp` (`project.pbxproj:856`, `:1021`) ma `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;` w Debug (`:833`) i Release (`:998`); `targets/watch/Assets.xcassets/AppIcon.appiconset` z `App-Icon-1024x1024@1x.png` (platform `watchos`) istnieje. Katalog `ios/` i pliki wygenerowane w `targets/` usunięto po odczycie (nie są śledzone); kopia pbxproj: scratchpad sesji `project-po-prebuild.pbxproj`.
- Czego tu nie da się sprawdzić (Linux, bez Xcode): czy gotowy pakiet zegarka ma `CFBundleIconName` w Info.plist po `actool` — to wynik budowania na macOS. Wynik Treningu: build 1033 miał ikonę na zegarku (Trening `docs/40-lekcje.md` R-013).
- Strażniki przed zmianą: `scripts/verify-native.mjs:78-88` sprawdza tylko `assets/icon.png` aplikacji (nie ustawienie celu zegarka); `scripts/wydanie/kontrola-ipa.sh` — brak `CFBundleIconName` (grep `Icon` → 0 trafień); walidacja Apple `scripts/wydanie/waliduj-ipa.sh` biegnie tylko przy `bez_wysylki` (`.github/workflows/testflight.yml:213-214`), a przy wysyłce tę samą kontrolę robi eksport z wysyłką (Apple odrzuca po budowie).
- Dopisane (kilka linii z testem, zgodnie z P-349): `scripts/wydanie/kontrola-ipa.sh:31-32` (BŁĄD, gdy `Watch/*.app/Info.plist` bez `CFBundleIconName`) i `tests/wydanie/ikona-zegarka.test.ts`. Strażnik w projekcie po prebuild (jak `verify:native` w Treningu) nie dopisany: wymagałby kroku w `.github/workflows/` (ścieżka wrażliwa) albo większego skryptu — do decyzji koordynatora.

## Przegląd subagenta (ścieżka wrażliwa: zapis przez scalenie wyzwalane z zegarka)
Odbyty (subagent, tylko `git diff f7558d9..6e70076`, zasady 10–14, bez mojego rozumowania). Wynik: **jedno P1** — `zegarek-odbior.ts:30`, pętla domknięcia nie sprawdzała ponownie `aktywna()`, więc po schowaniu aplikacji w trakcie scalenia drugi przebieg zacząłby transakcję w tle (ARCH-13, `0xdead10cc`). Realność: brzegowy (wymaga stuknięcia w trakcie scalenia i schowania aplikacji w tym oknie), skutek: bezpieczeństwo danych, więc naprawione. Test czerwony → poprawka → zielony (wiersz „przegląd P1” w tabeli). Poza tym brak uwag (Swift: składnia i typy poprawne, reguła równoważna `sygnalZmiany`, atrapy bez osłabienia asercji, brak sekretów). Drugiego przeglądu nie ma (zasada trybu fix).

## Otwarte / do koordynatora
- K-05h na urządzeniu u właściciela (P-316; zawężona lista): telefon na pierwszym planie z licznikiem; 3 stuknięcia na zegarku → telefon pokazuje +3 bez ruchu w aplikacji; po 15 min zegarek nie pokazuje „iPhone not nearby…”; rząd z przypomnieniem na zegarku wibruje inaczej niż zwykły rząd; VoiceOver zegarka (ogłoszenia „nie dodano”/blokada) — bez zmian względem poprzedniej partii.
- `swift test` (K-05g) i kontrola `CFBundleIconName` w `kontrola-ipa.sh` uruchamia dopiero przebieg macOS po integracji (`jakosc-ios.yml`, `testflight.yml`).
- Kolejność scalania: zmiany w `src/kompozycja/licznik.ts` i `docs/jakosc/e4/tabela-08.md` mogą kolidować z gałęzią 8d (tabela regenerowana narzędziem `tabela-08.mjs`; `kopie.json` dostał jeden wpis).
