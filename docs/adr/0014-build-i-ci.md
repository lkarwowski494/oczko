# 0014. Build i CI: testy, symulatory i buildy do TestFlight na runnerze macOS GitHub Actions; sekrety podpisu tylko w chronionym środowisku
Data: 2026-10-22 · Status: **przyjęta** (P-071 (6b); uzupełniona 2026-10-25) · Rola: 05 (E1) · Zależy od: P-041, NFR-KOS-001, ADR-0007

## Kontekst i problem
Weryfikacja tylko automatem (P-041), w tym testy na symulatorze iOS i zegarka (NFR-SYS-001, NFR-ZEG-001, NFR-DOS-001). Standardowe runnery GitHub, w tym macOS, są „free and unlimited” w repozytoriach publicznych (rejestr Apple 12). EAS Free: 0 USD, 15 buildów iOS/mies., kolejka o niskim priorytecie, limit 45 min (rejestr Expo 12a). Oficjalnego przepisu Expo na GitHub Actions nie znaleziono (12b, [DO USTALENIA]); `eas build --local` i `prebuild` + Xcode są opisane.

## Czynniki decyzji
Koszt 0 zł · brak sekretów w publicznym repo · powtarzalność · liczba buildów.

## Rozważane opcje
A. Wszystko na GitHub Actions macOS: testy Node, `expo prebuild`, `xcodebuild test` na symulatorach, a build do TestFlight `xcodebuild archive` + wysyłka z kluczem App Store Connect w sekretach GitHub (repo publiczne: sekrety niewidoczne w logach, ale dostępne dla workflow — tylko na `main`/tagach, nie dla PR z forków).
B. Testy i symulatory na GitHub Actions; buildy do TestFlight w EAS Free (poświadczenia podpisu przechowuje Expo, 15 buildów/mies.).
C. Wszystko w EAS (testy jednostkowe też) — EAS nie uruchamia testów UI na symulatorze w darmowym planie [DO USTALENIA], więc odpada dla P-041.

## Decyzja
Opcja A = wariant (b) pytania Q6 (właściciel: „6b”, 2026-10-22; rekomendacja roli 05 była B — EAS). Zabezpieczenia, które zastępują „podpis poza repo” (zasada 7 właściciela, tańsza kontrola zamiast żadnej):
- Sekrety (klucz App Store Connect API: identyfikator, wystawca, treść `.p8`; ewentualnie certyfikat dystrybucji) tylko w **GitHub Environment `testflight`** z wymaganym zatwierdzającym (właściciel) i ograniczeniem do gałęzi `main` i tagów `v*` (rejestr Apple 18b); nigdy w sekretach repozytorium.
- Workflow wysyłki uruchamiany tylko przez tag albo ręcznie (`workflow_dispatch`), nigdy przez `pull_request`; sekrety nie trafiają do workflow z forków (18a).
- Klucz API z najniższą rolą, która pozwala wysłać build [DO USTALENIA: rola w App Store Connect — sprawdza rola 10 u źródła Apple]; rotacja klucza przy podejrzeniu wycieku (instrukcja: rola 10).
- Plik klucza zapisywany tylko w `$RUNNER_TEMP` i usuwany w kroku `always()`; logi bez `set -x`.
- Podpis: automatyczny przez `xcodebuild -allowProvisioningUpdates` z kluczem API albo certyfikat w sekrecie [DO USTALENIA: wariant wybiera rola 10 po próbie w CI].
- Testy (Node na Linuksie, `prebuild` + `xcodebuild test` na macOS) nie dostają żadnych sekretów.

### Konsekwencje
- Dobre: testy natywne bez kosztu; P-041 wykonalne.
- Złe: czas runnera macOS dłuższy niż Linux (testy Node na Linuksie, macOS tylko dla natywnych); w B zależność od konta Expo.

### Potwierdzenie
- Workflow (07/10): zadanie Linux `npm test` + `npm run verify`; zadanie macOS `prebuild` + `xcodebuild test` (iOS 18 i najnowszy symulator), bez `environment:` i bez sekretów.
- Kontrola w CI (skrypt roli 07): każde odwołanie `secrets.ASC_*` występuje tylko w zadaniu z `environment: testflight`; workflow z tym zadaniem nie ma wyzwalacza `pull_request` ani `pull_request_target`.
- Kontrola sekretów: `git diff --cached` przed commitem, skan sekretów w CI; brak plików `.p8`, `.mobileprovision`, `.env` w repo.

## Uzupełnienie 2026-10-25 (fix 05: Z07-19; decyzja A bez zmian)
Kontrole po `prebuild` nie wystarczą: sprawdzany jest artefakt, który idzie do Apple. Skrypt kontroli podpisanego `.ipa` (rola 10, krok workflow TestFlight przed wysyłką; ten sam skrypt na `.app` symulatora w `jakosc-ios.yml` informacyjnie) rozpakowuje archiwum i sprawdza każdy pakiet (aplikacja, `Watch/*.app`, `PlugIns/*.appex`):
- uprawnienia (`codesign -d --entitlements`) i ich wartości per pakiet zgodne z listą z `docs/architektura/prywatnosc.md` (iCloud/CloudKit, App Group tylko w rozszerzeniu udostępniania i aplikacji, ADR-0011; brak uprawnień nieużywanych);
- `main.jsbundle` jest bajtkodem Hermesa i build nie zawiera `EXDevLauncher` ani innych modułów deweloperskich;
- zegarek osadzony (`Watch/*.app`, `WKCompanionAppBundleIdentifier` = identyfikator aplikacji) i rozszerzenia obecne (`PlugIns/*.appex`: Live Activity, udostępnianie);
- `MinimumOSVersion` = 18.0 (aplikacja, rozszerzenia) i 10.0 (zegarek; od 2026-11-15, wcześniej 11.0), ADR-0006, P-819;
- `CFBundleVersion` równy we wszystkich pakietach, w formacie z rejestru Apple 21d, większy niż 1004 (TestFlight 0.1.0, P-070) i niż ostatni build w App Store Connect;
- `PrivacyInfo.xcprivacy` w każdym pakiecie z kodem, kategorie zgodne z `prywatnosc.md` i `privacy-pliki-e3.txt`;
- 35 katalogów `.lproj` (`CFBundleLocalizations` = lista języków, ADR-0017);
- `NSExtensionActivationRule` rozszerzenia udostępniania ≠ `TRUEPREDICATE` (ADR-0011);
- deklaracja typu `.oczko` (`UTExportedTypeDeclarations`, `CFBundleDocumentTypes`, ADR-0004);
- `ITSAppUsesNonExemptEncryption` obecny z wartością potwierdzoną przez rolę 10 (rejestr Apple 21e);
- orientacje iPada i `UIBackgroundModes` = tylko tryby z ADR (E3 §2 pkt 10).

**Numer buildu:** `CFBundleVersion` = `github.run_number × 10 + github.run_attempt + PRZESUNIECIE`, gdzie przesunięcie daje wynik > 1004 przy pierwszym przebiegu (wartość ustala rola 10 przy pierwszym buildzie); skrypt sprawdza przed wysyłką, że numer jest większy niż ostatni z App Store Connect API.
**Po wysyłce:** workflow odpytuje App Store Connect API o build do `processingState` = `VALID` (`FAILED` albo `INVALID` = czerwony przebieg z nazwą stanu; rejestr Apple 21f), z limitem czasu ustalonym przez rolę 10.
Adresy dokumentacji Apple, na które powołuje się zgłoszenie 07 (A1–A4), są w rejestrze: 21a (środowiska CloudKit), 21d (`CFBundleVersion`), 21e (szyfrowanie), 21f (stan przetwarzania); wydanie stopniowe dotyczy roli 12 (Z07-21).

## Opcje: zalety i wady
### A — zalety: jedno miejsce, bez limitu buildów · wady: klucz App Store Connect w sekretach publicznego repo, własny skrypt podpisu.
### B — zalety: podpis zarządzany, mało kodu · wady: limit 15/mies., kolejka niskiego priorytetu, konto Expo.
### C — zalety: jedno narzędzie · wady: brak testów UI na symulatorze w darmowym planie.
