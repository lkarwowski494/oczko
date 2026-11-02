# 0016. Zależności wersji 1: tylko pakiety Expo SDK 57 dla przepływów z kontraktu, `expo-iap` 5.8.1, `@bacons/apple-targets`; resztę piszemy jako moduły Swift
Data: 2026-10-22 · Status: **przyjęta** (P-073) · Rola: 05 (E3) · Zależy od: ADR-0001–0015, P-036, NFR-PRY-001, NFR-KOS-001

## Kontekst i problem
Każda biblioteka natywna to utrzymanie, rozmiar i manifest prywatności (obszar „Zależności zewnętrzne”). Poprzednia wersja miała m.in. `qrcode`, `react-native-svg`, `expo-router` (`package.json`, materiał P-004). Manifesty kandydatów odczytane 2026-10-22 (`docs/architektura/prywatnosc.md`): żaden nie deklaruje śledzenia ani zbierania danych.

## Czynniki decyzji
Każda zależność wynika z przepływu kontraktu · pakiety Expo w wersji z tagiem `sdk-57` · przypięcie dokładne · reguła wieku ≥ 14 dni (P-036) · brak SDK analitycznych i reklamowych.

## Rozważane opcje
A. Lista minimalna (niżej) + własne moduły Swift dla CloudKit, PencilKit, dziennika +1, zegarka, ochrony czasu w tle.
B. Biblioteki społeczności zamiast modułów Swift (np. `expo-cloudkit`, `react-native-pdf`, biblioteki rysowania).
C. Szeroki zestaw jak poprzednia wersja (router, SVG, QR).

## Decyzja
Opcja A.
| Pakiet (wersja 2026-10-22) | Przepływ | Alternatywa odrzucona |
|---|---|---|
| `expo` 57.0.31, `react-native` 0.86.3, `react` 19.2.3 | podstawa (stos `CLAUDE.md`) | — |
| `expo-sqlite` 57.0.4 | F-31 (ADR-0001, ADR-0002) | `op-sqlite` (poza Expo, bez potrzeby) |
| `expo-file-system` 57.0.7 | pliki (ADR-0001), archiwum (ADR-0004) | — |
| `expo-crypto` 57.0.4 | SHA-256 plików, UUID | własny moduł |
| `expo-haptics` 57.0.3 | F-01, F-48 | Core Haptics w Swift |
| `expo-keep-awake` 57.0.2 | F-10 | `isIdleTimerDisabled` w Swift |
| `expo-image-picker` 57.0.20 | F-16, F-24 (aparat, zdjęcia) | `expo-camera` (własny ekran aparatu — niepotrzebny) |
| `expo-document-picker` 57.0.3 | F-24 (Pliki), F-32 (import archiwum) | — |
| `expo-sharing` 57.0.23 (08 partia 4, 2026-10-26: 57.0.24 z 2026-10-21 miała < 14 dni, P-036; 57.0.23 z 2026-10-12 = `bundledNativeModules` SDK 57) | F-32 eksport, F-53 karta, F-57 zgłoszenie | — |
| `@react-native-community/datetimepicker` 9.1.0 (08 partia 5, 2026-10-26, P-186: wersja z `bundledNativeModules` SDK 57, wydana 2026-03-17 — ≥ 14 dni, P-036; licencja MIT, `licencje.mjs` bez naruszeń; 9.2.2 z 2026-10-21 za młoda; pakiet bez `PrivacyInfo.xcprivacy`, kod iOS (`ios/*.m`) bez API z listy required reason — grep po `npm ci`; wtyczka `app.plugin.js` zmienia tylko style Androida i nie jest w `app.json`; przejrzane 05 fix-6, P-199) | F-61 termin „Done by”, później F-51 data ukończenia (systemowy wybór daty, design-spec arkusz terminu) | wybór dnia przyciskami ‹ › (odstępstwo od makiety 04, słabszy dla VoiceOver) |
| `expo-image-manipulator` 57.0.21 (08 partia 5, 2026-10-26, P-219 (2A) właściciela: wersja z `bundledNativeModules` SDK 57, wydana 2026-10-06 — ≥ 14 dni, P-036; MIT, `licencje.mjs` bez naruszeń; bez `PrivacyInfo.xcprivacy` i bez API z listy required reason w `ios/*.swift` — grep po `npm install`; bez wtyczki w `app.json`; zapis `UIImage.jpegData`, `ImageManipulatorUtils.swift:76`; do przeglądu 05) | F-16 zdjęcia projektu i etykiety, F-53 karta: przekodowanie do JPEG bez EXIF/GPS przy zapisie i przed udostępnieniem (druga kontrola segmentów APPn w JS, `src/dane/pliki/jpeg.ts`) | samo usuwanie segmentów w JS (nie obsługuje HEIC z aparatu) |
| ~~`expo-screen-orientation` 57.0.3~~ **usunięta 2026-10-27 (P-258, P-259 A: przy każdym starcie żądała obrotu — `requestGeometryUpdate` + `UIDevice.setValue(orientation)` — co w E2E zbiega się z utratą drzewa widoków XCUITest; orientację deklaruje nawigacja, react-native-screens, ADR-0026)**; wpis pierwotny: (08 partia 6, 2026-10-26, P-221 Q3a: wersja z `bundledNativeModules` SDK 57 (`~57.0.3`), wydana 2026-10-12 — 14 dni, P-036; MIT, `licencje.mjs` bez naruszeń; bez `PrivacyInfo.xcprivacy` i bez API z listy required reason w `ios/*.swift` — grep po `npm install`; bez wtyczki w `app.json` (domyślnie wszystkie orientacje, L3a); do przeglądu 05) | ADR-0026: na iPhonie pion poza ekranem wzoru, dowolna na wzorze (F-25); na iPadzie bez blokady (adapter `src/platforma/orientacja.ts`) | własny moduł Swift (więcej kodu natywnego bez zysku) |
| `react-native-view-shot` 5.1.0 (08 partia 5, 2026-10-26, P-219 (2A): wersja z `bundledNativeModules` SDK 57, wydana 2026-05-03 — ≥ 14 dni; MIT, zależności tylko dla web (`html2canvas`, `css-line-break`, `text-segmentation`, `base64-arraybuffer`, `utrie` — MIT); pakiet ma `ios/PrivacyInfo.xcprivacy` bez kategorii required reason; do przeglądu 05) | F-53 obraz karty ukończenia 1080 × 1350 (BR-PRJ-015, P-191 P10a) | rysowanie karty w Swift (moduł natywny), Skia |
| `expo-store-review` 57.0.3 | BR-DAN-012 (prośba o ocenę) | własny `SKStoreReview` w Swift |
| `expo-localization` 57.0.2 | 35 lokalizacji (NFR-JEZ-001; mechanizm bez biblioteki: ADR-0017, wzór z Treningu) | — |
| `expo-router` 57.0.24 z wymaganymi `react-native-screens` 4.26, `react-native-safe-area-context` 5.7, `expo-linking` 57.0.11, `expo-constants` 57.0.20 (wiersz roli 08, P-114 Q1a) | nawigacja ekranów (warstwa 4); do niej korzeń `app/_layout.tsx` bez treści | `index.ts` z `registerRootComponent` i decyzja przy ekranach (odrzucone: jak Trening i zielony build iOS) |
| `expo-iap` 5.8.1 | F-35 (ADR-0010) | 6.x, własny StoreKit |
| `@bacons/apple-targets` 5.0.0 (narzędzie buildu) | cele Live Activity, zegarek, rozszerzenie (ADR-0007) | `expo-widgets` (bez intencji, rejestr Expo 6d) |
| `expo-symbols` ~57.0.3 (2026-11-02, 08 sesja S, P-374 wariant A, wpis koordynatora — nazwany wyjątek P-376; przegląd 05 w audycie M1): wersja z `bundledNativeModules` SDK 57, wydana 2026-09-11 (52 dni ≥ 14, P-036); MIT; już przechodnia zależność `expo-router`; bez `PrivacyInfo.xcprivacy`, `ios/*.swift` bez API z listy required reason (grep: 0 trafień); bez wtyczki w `app.json` | symbole SF w pasku wzoru i kapsule stopera (Aneks P2 poz. 2) | własne widoki Swift `UIImageView(systemName:)` (dubluje pakiet Expo); własne SVG (bez wagi z tekstem i Dynamic Type); `react-native-svg` jak w Treningu — odrzucone przez 04 (poz. 2, wariant B) |
| `expo-splash-screen` ~57.0.9, lock 57.0.10 (2026-11-02, 08 fix M1-audytor-generalny-015, specyfikacja wersji jak Trening `package.json:53`, P-315; do przeglądu 05): 57.0.10 = `bundledNativeModules` SDK 57 (`~57.0.10`), wydana 2026-10-12 (21 dni ≥ 14, P-036); MIT, zależności `xml2js` 0.6.0 (MIT), `sax` (BlueOak-1.0.0), `@expo/image-utils` i `@expo/config-plugins` już w drzewie — `licencje.mjs` bez naruszeń; bez `PrivacyInfo.xcprivacy`, `ios/*.swift` bez API z listy required reason (grep: 0 trafień); wtyczka w `app.json` (obraz i kolory tła z design-spec „Ikona: wpisy konfiguracji”) | ekran startowy z projektu 04 (jasny i ciemny, tokeny `papier`); w SDK 57 klucz `expo.splash` nie ma już wtyczki w `@expo/prebuild-config` | klucz `expo.splash` (martwy w SDK 57); własny `SplashScreen.storyboard` (plik w `ios/`, które generuje prebuild) |
| Moduły Swift w `modules/` | CloudKit (ADR-0005), PencilKit + PDFKit (ADR-0011, ADR-0012), dziennik +1 (ADR-0008), WatchConnectivity (ADR-0009), `beginBackgroundTask` (ADR-0004) | biblioteki społeczności (opcja B) |
| Archiwum ZIP: **własny kod w TS** (`src/dane/archiwum/zip.ts`, `sha256.ts`; P-120 Q2a, zatwierdzone przez 05 w fix-3 2026-10-26) — bez zależności | ADR-0004, ADR-0020 | biblioteka natywna albo moduł Swift (odrzucone: zależność i manifest bez potrzeby). Warunki: metoda 0 (stored; PDF i JPEG już skompresowane), **bez ZIP64** — eksport odmawia czytelnym błędem, gdy archiwum albo wpis przekroczyłby 4 GiB − 1 B albo wpisów byłoby > 65 535 (szacunek ok. 415 MB, E0 §3); deskryptor danych (bit 3) przy zapisie strumieniowym kawałkami 1 MiB przez `FileHandle`; nazwy wpisów UTF-8 (bit 11); odczyt tylko przez katalog centralny, wpis innej metody, szyfrowany albo z ZIP64 → archiwum odrzucone bez zmian w danych. Stan kodu 2026-10-26 (`zip.ts:32`, `:43`, `:108`): bity 3 i 11, kontrola 4 GiB i metody są; **dla 08 (partia 3):** kontrola liczby wpisów i bitu szyfrowania (bit 0), błąd 4 GiB jako `Wynik` zamiast wyjątku z usunięciem niepełnego pliku. Ryzyko nazwane: czas CRC-32 i SHA-256 w JS dla 400 MB na Hermes — pomiar w partii 3 na najstarszym urządzeniu; budżet: **do ustalenia po pomiarze na urządzeniu** (nazwany stan, fix-4 05 (h); wiersz „Sprawdzenie archiwum” w `docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md` §3, plan `pomiary-3E.md` pkt 1–2); przy przekroczeniu budżetu wraca opcja natywna (nowy wiersz). |
| **SHA-256 plików natywnie, strumieniowo** — CryptoKit (systemowa biblioteka kryptograficzna Apple, bez zależności) w module Swift `oczko-dziennik-plus` (`Skrot.sha256Pliku`, kawałki 1 MiB przez `FileHandle`); wiersz roli 08, **zatwierdzony przez koordynatora w miejsce 05 (P-130, 2026-10-26)** | ADR-0004, ADR-0020 (sprawdzenie archiwum i magazyn plików) | SHA-256 w TS (`src/dane/archiwum/sha256.ts`) — zostaje jako wzorzec testowy i ścieżka w Node; pomiar referencyjny 400 MB w Node (V8): 16–17 s, Hermes bez JIT wolniejszy, czas w tle kilkadziesiąt sekund (oczko-warsztat `08-programista/2026-10-26-partia3/punkt-kontrolny-3A.md`). CRC-32 zostaje w TS (2,1–2,5 s w Node); natywnie, jeśli pomiar na symulatorze przekroczy budżet (P-130). |
| Wyjątek licencji: `lightningcss` 1.33.0 i jego pakiety platformowe (MPL-2.0; zależność przechodnia `expo` → `@expo/metro-config`, narzędzie przekształcania CSS w czasie budowania pakietu JS) — **wyjątek nazwany, potwierdzony przez 05** (P-121 (2), fix-3 2026-10-26) | budowanie (Metro), bez przepływu w aplikacji | brak: pakiet wymagany przez `expo`. Warunek: kod MPL nie trafia do pakietu aplikacji — obowiązki MPL-2.0 dotyczą dystrybucji „Covered Software” (§3.1, §3.2: „If You distribute Covered Software in Executable Form then: (a) such Covered Software must also be made available in Source Code Form”, mozilla.org/media/MPL/2.0/index.txt, odczyt 2026-10-26), a narzędzie budowania nie jest dystrybuowane; nie modyfikujemy jego plików. Pakiet MPL wśród zależności uruchomieniowych = nowa decyzja. Kontrola: `scripts/jakosc/licencje.mjs` (`WYJATKI`) i sprawdzenie zawartości `.ipa` przez rolę 10 (ADR-0014). |

Nawigacja (np. `expo-router`) i `react-native-svg`: decyzja roli 08 przy ekranach, jeśli projekt 04 ich wymaga (nowy wiersz tej tabeli). Bez `qrcode`, bez SDK analityki, raportowania awarii (rola 12 decyduje osobno) i reklam.

### Konsekwencje
- Dobre: 14 pakietów runtime, wszystkie z Expo SDK albo P-036; manifesty znane.
- Złe: pięć modułów Swift do utrzymania; ZIP nierozstrzygnięty do próby.

### Potwierdzenie
- CI (07): `package.json` bez `^`/`~` dla `expo-iap` i `@bacons/apple-targets`; pakiety `expo-*` zgodne z `npx expo install --check`; każda nowa zależność wymaga wiersza w tej tabeli (kontrola listy w CI); ponowne `find node_modules -name PrivacyInfo.xcprivacy` porównane z `docs/architektura/narzedzia/privacy-pliki-e3.txt`.
- Grep: brak pakietów z listy zakazanej (analityka, reklamy, `IAPKit`).

## Opcje: zalety i wady
### A — zalety: mało zależności, znane manifesty · wady: kod Swift.
### B — zalety: mniej własnego kodu · wady: młode lub nieutrzymywane paczki w krytycznych miejscach (rejestr Expo 10).
### C — zalety: kod poprzedniej wersji do ponownego użycia · wady: zależności bez przepływu w kontrakcie (zasada architekta 1).

## Uzupełnienie 2026-10-26 (atlas 1.1, rola 05; nie dotyczy 1.0)
Szkic wiersza do tabeli „Decyzja” przy wdrożeniu atlasu (P-179, ADR-0024, P-201 Q1a); wpisuje go rola 08 razem z instalacją: `react-native-svg` 15.15.4 (dokładnie; `bundledNativeModules.json` SDK 57; wydana 2026-03-18, ≥ 14 dni wg P-036; MIT) | atlas A2–A3 (`docs/atlas/e0-rozpoznanie.md` §3) | `expo-image` z plikiem SVG, PNG (ADR-0024). Do tego czasu pakietu nie ma w `package.json` (kontrola `ZALEZNOSC-BEZ-ADR` sprawdza kierunek zależność → wiersz).

## Uzupełnienie 2026-10-26 (fix-7 05, NZ-P217-05; P-221 Q1a, Q3a)
- Wiersz „Moduły Swift w `modules/`” obejmuje w 1.0 dwa nowe moduły: `oczko-wzor` (PDFKit, PencilKit, WebKit, VisionKit — biblioteki systemowe, bez pakietów; ADR-0011, ADR-0012) i `oczko-icloud` (CloudKit; ADR-0005). Pakiet PDF dla React Native odrzucony (P-221 Q1b).
- Szkic wiersza dla partii 6 (wpisuje go 08 razem z instalacją, po sprawdzeniu wieku ≥ 14 dni, licencji i `PrivacyInfo.xcprivacy` po `npm ci`): `expo-screen-orientation` 57.0.3 (dokładnie; zgodna z `bundledNativeModules.json` SDK 57 `~57.0.3`; wydana 2026-10-12 według rejestru npm, odczyt 2026-10-26; MIT) | F-25 (pion na iPhonie poza ekranem wzoru, ADR-0026) | wszystkie ekrany w obu orientacjach (ADR-0026 B).
