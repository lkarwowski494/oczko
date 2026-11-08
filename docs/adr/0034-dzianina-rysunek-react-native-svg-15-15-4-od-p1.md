# 0034. Element „dzianina” (redesign M3) rysowany w `react-native-svg` 15.15.4 (dokładnie, wersja SDK 57), zależność wchodzi w partii p1 1.0, nie dopiero z atlasem 1.1; zegarek i widżet bez zmian (SwiftUI)
Data: 2026-11-08 · Status: **proponowana** (P-563 (3a) właściciela: „`react-native-svg` z ADR roli 05”; przyjęcie wpisem koordynatora) · Rola: 05 (build wąski, przed p1) · Zależy od: P-036, P-553, P-554, P-562, P-563, ADR-0014, ADR-0016, ADR-0021, ADR-0024 · Uzupełnia ADR-0024: ta sama biblioteka i wersja, ale wchodzi w 1.0 (p1), więc zdanie ADR-0024 „zależność wchodzi dopiero z kodem 1.1” przestaje obowiązywać; reszta ADR-0024 bez zmian

## Kontekst i problem
System „Dzianina” (P-554) ma element firmowy „dzianina części”: kawałek dzianiny rośnie od nabrania do celu części, jaśniejszy pas to rzędy dziś, igła to bieżący rząd, ząbek to rząd przypomnienia; wzór oczek „V” jako `Pattern`, rysunek w `react-native-svg` (`docs/design/dzianina/design-spec.md:16–17`). Ten sam element jest na karcie „Kontynuuj” na „Dziś”, przy liczbie na liczniku, w miniaturze projektu i w dniach tygodnia i kalendarza (tamże). Biblioteki nie ma w `package.json` (0 trafień, 2026-11-08). Właściciel wybrał SVG zamiast zwykłych widoków (P-563 (3a); odrzucone (3b)).

## Czynniki decyzji
- **Wersja zgodna z SDK (odczyt 2026-11-08):** `"react-native-svg": "15.15.4"` w `expo/expo@sdk-57/packages/expo/bundledNativeModules.json:114` i w tym samym pliku opublikowanych paczek `expo@57.0.26` (zakres z `package.json:27`) oraz `expo@57.0.29` (wersja z `package-lock.json`) — `cdn.jsdelivr.net/npm/expo@<wersja>/bundledNativeModules.json`, linia 114 w obu. Dokumentacja Expo SDK 57 (`docs.expo.dev/versions/v57.0.0/sdk/svg/`): „Recommended version: 15.15.4”, „Included in Expo Go”, instalacja `npx expo install react-native-svg`. `npx expo install --check` nie uruchomione (brak `node_modules` w tej sesji) — kontrola przy instalacji w p1 (Potwierdzenie).
- **Wiek wersji (P-036 ≥ 14 dni):** 15.15.4 wydana 2026-03-18T09:09Z (`registry.npmjs.org/react-native-svg`, pole `time`), 235 dni. Najnowsza 15.16.1 (2026-11-05, 3 dni) — spoza SDK 57 i za młoda; nie bierzemy.
- **Licencja:** `MIT` (rejestr npm, `versions["15.15.4"].license`); na liście `DOZWOLONE` (`scripts/jakosc/licencje.mjs:10`). Zależności pakietu: `css-tree` ^1.1.3, `css-select` ^5.1.0, `warn-once` 0.1.1 — ich licencje sprawdza `licencje.mjs` po instalacji (w projekcie nie ma skryptu `check:licenses`; licencje sprawdza `npm run jakosc:kontrole`). Peer: `react` *, `react-native` *.
- **Build iOS:** moduł natywny (`RNSVG.podspec` w paczce; 212 plików źródeł `apple/`, 577 405 B źródeł — nie rozmiar binarny). Wymaga nowego `expo prebuild` i nowego buildu; bez OTA (ADR-0021), więc tylko nowym buildem TestFlight. CI: `prebuild` + `xcodebuild test` na macOS bez zmian w workflow (ADR-0014) — `ios/` nie jest w repo (`.gitignore:4`). Bez wtyczki konfiguracji (`app.plugin.js` w paczce: brak).
- **Manifest prywatności:** paczka 15.15.4 nie zawiera `PrivacyInfo.xcprivacy` (lista plików `data.jsdelivr.com/v1/packages/npm/react-native-svg@15.15.4?structure=flat`, 1480 plików, 0 trafień `xcprivacy`); API z listy „required reason” w źródłach `apple/` do sprawdzenia grepem po instalacji (wzorzec ADR-0016, `expo-symbols`).
- **Rozmiar:** przyrost pobrania nieznany `[DO USTALENIA: pomiar]` — wiersz „Rozmiar pobrania” w budżetach (`docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md:42`) mierzy App Store Connect po pierwszym buildzie p1 względem ostatniego buildu bez SVG.
- **Zegarek, widżet, ekran blokady:** cele w `targets/watch`, `targets/widget` są w Swift (SwiftUI), poza React Native; biblioteki nie widzą. W redesignie mają tylko barwy i ikonę (`design-spec.md:58`, partia p8). Nie dotyczy.
- **Testy w Jest:** `jest-expo` 57.0.6 (`package-lock.json`) atrapuje menedżery widoków RNSVG, m.in. `RNSVGPathManager`, `RNSVGPatternManager`, `RNSVGSvgViewManager` (`jest-expo@57.0.6/src/preset/moduleMocks/thirdPartyModules.js:148–184`), więc komponenty renderują się w `@testing-library/react-native` bez własnej atrapy. `jest.config.js` już przepuszcza `react-native-svg` przez transformację (`transformIgnorePatterns`, wpis `react-native-svg`). Własny `moduleNameMapper` niepotrzebny — sprawdzenie: pierwszy test komponentu w p1.
- **Ta sama wersja co atlas (ADR-0024) i Trening** (`trening/package.json:61` według rejestru ADR-0024 z 2026-10-26; dziś nie otwierane): jedna wersja do utrzymania.
- **Ruch (180 ms przy +1, „Ogranicz ruch” = natychmiast, `design-spec.md:17`):** bez nowej biblioteki animacji — `Animated` z React Native na widoku opakowującym rysunek albo przejście stanu bez animacji; `react-native-reanimated` nie wchodzi tym ADR.

## Rozważane opcje
A. `react-native-svg` 15.15.4 od p1: jeden komponent „dzianina” rysuje z danych części (rzędy gotowe, cel, rzędy dziś, bieżący rząd, przypomnienie) z barwami z motywu.
B. Zwykłe widoki React Native (`View` z obramowaniem i tłem, oczka jako powtarzane widoki albo obraz kafla) — P-563 (3b).
C. Gotowe obrazy (PNG/SVG przez `expo-image`) w kilku stanach wysokości.

## Decyzja
Opcja A (P-563 (3a)).
1. **Zależność (rola 08, p1):** `npx expo install react-native-svg` daje `15.15.4`; w `package.json` wersja dokładna `"15.15.4"` (bez `^`/`~`, wzór P-036 i ADR-0010); `react-native-svg` dopisany do `PRZYPIETE` w `scripts/jakosc/kontrole-repo.mjs:41` (kontrola `PRZYPIECIE`). Wiersz w tabeli „Decyzja” ADR-0016 w tym samym commicie co instalacja (kontrola `ZALEZNOSC-BEZ-ADR`): `react-native-svg` 15.15.4 | element „dzianina” (P-554, P-563 3a) i atlas 1.1 (ADR-0024) | zwykłe widoki, obrazy (ADR-0034). Szkic „Uzupełnienie 2026-10-26 (atlas 1.1)” w ADR-0016 zastępuje ten wiersz.
2. **Komponent (rola 08, p1; wygląd 04):** jeden komponent w `src/ekrany/` (wspólny, zamrożony po p1 jak `motyw.ts`) przyjmuje dane liczbowe i paletę z `motyw.ts`; liczy geometrię czystą funkcją w TS (testowalną bez renderera, zasada architekta 6); `Pattern` dla oczek, `Path`/`Rect` dla dzianiny, linii celu, igły i ząbka; bez `Text` z `react-native-svg` (tekst obok, dynamiczna czcionka).
3. **Dostępność:** jeden element (`accessible`, rola obrazu) z etykietą z `t()` według `design-spec.md:17`; części rysunku niedostępne osobno (jak ADR-0024 pkt 3).
4. **Wydajność:** geometria liczona raz na zmianę danych (memo po wartościach wejściowych); w kalendarzu i miniaturach ta sama funkcja z mniejszą szczegółowością (bez `Pattern` w komórce dnia, jeśli pomiar to wymusi). Liczby budżetu tylko po pomiarze na urządzeniu (zasada architekta 9).

### Konsekwencje
- Dobre: rysunek wierny makiecie (`ekrany.html`, skrypt `data-dz`); barwy z tokenów w obu motywach i w „Zwiększ kontrast” bez plików; ostre przy każdej skali; ta sama zależność służy atlasowi 1.1 (ADR-0024).
- Złe: nowa zależność natywna w 1.0 (prebuild, rozmiar, przegląd przy każdym SDK); dziesiątki rysunków na ekranie kalendarza do zmierzenia na urządzeniu; partia p1 wymaga pełnego E2E iOS (już w planie: `[e2e-pelny]` po p1).
- Od czego zależy (warunkowo): zmiana SDK Expo → wersja z nowego `bundledNativeModules.json` i nowy wiersz ADR-0016; pomiar renderowania kalendarza → ewentualna uproszczona komórka dnia (decyzja 04 wyglądu, nie nowa biblioteka).

### Potwierdzenie
- p1 (08): `npx expo install --check` kod 0 po instalacji; `package.json` ma `"react-native-svg": "15.15.4"`; `npm run jakosc:kontrole` kod 0 (licencje, `ZALEZNOSC-BEZ-ADR`, `PRZYPIECIE`); `find node_modules/react-native-svg -name PrivacyInfo.xcprivacy` i grep API „required reason” w `node_modules/react-native-svg/apple` — wynik w opisie partii.
- 07/08: test komponentu w Jest (render bez własnej atrapy; liczba elementów rysunku zgodna z danymi; etykieta dostępności z klucza; brak `Text` w drzewie rysunku); test czystej funkcji geometrii (0 rzędów = sama igła, bez celu = bez linii celu, cel osiągnięty, przypomnienie = ząbek).
- macOS CI: `prebuild` + `xcodebuild test` zielone po p1; rozmiar pobrania z App Store Connect zapisany w budżetach.

## Opcje: zalety i wady
### A — zalety: `Pattern` i ścieżki jak w makiecie; motywy z tokenów; jedna zależność z atlasem; atrapy w jest-expo gotowe · wady: moduł natywny (nowy build, rozmiar do zmierzenia), koszt renderowania wielu instancji.
### B — zalety: bez nowej zależności i bez nowego buildu natywnego · wady: oczka „V” i ząbek brzegu tylko przybliżone albo przez wiele widoków (gorsza wydajność w kalendarzu); odchodzi od zatwierdzonego projektu (P-554); odrzucone przez właściciela (P-563 3b).
### C — zalety: najprostszy kod · wady: wysokość zależy od danych (rzędy/cel), więc obrazów musiałoby być wiele albo skalowanie zniekształca oczka; motywy i kontrast to kolejne pliki; dekoder SVG iOS w `expo-image` z zastrzeżeniem (ADR-0024).
