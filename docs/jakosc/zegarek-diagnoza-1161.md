# Diagnoza: aplikacji zegarka Oczka brak w „Dostępne aplikacje” (build 1161)

Rola 07-jakosc, tryb audit (diagnoza, bez zmian kodu) · 2026-11-15 · sesja BR.
Baza: integracja `claude/youthful-pasteur-kx83sn` @ 761b9551; kandydat 1161 z 2ed5215a (tag `v1.0.0-b1161`, TestFlight run 43383728558). Od 2ed5215a do 761b9551 bez zmian w `targets/watch`, `testflight.yml`, `kontrola-ipa.sh`, `src/konfiguracja.ts` (`git diff --stat` pusty).
Porównanie: `lkarwowski494/trening` @ 2d975814 (klon `--depth 1`).

Objaw (właściciel 15.11 ok. 08:55 UTC): „Oczka brak w watch. Dla porownania RepsGoat (trening) tam jest.”

## Wniosek

**Najbardziej prawdopodobna przyczyna:** minimalna wersja zegarka. Oczko wymaga **watchOS 11.0** (`targets/watch/expo-target.config.js:13`; w zbudowanym pakiecie `MinimumOSVersion = 11.0`), a zegarek właściciela według zapisu w Treningu to „starszy model, watchOS 10.6.2 — minimum aplikacji” (trening `docs/18-przekazanie.md:280`, 18.10.2026). Trening ma minimum 10.0 (trening `targets/watch-app/expo-target.config.js:7`) właśnie z tego powodu, dlatego RepsGoat jest na liście, a Oczko nie. Aplikacji z `MinimumOSVersion` wyższym niż system zegarka nie da się na nim zainstalować.

Pewność: wysoka co do niezgodności wersji, jeśli zegarek nadal ma watchOS 10.x. Nie potwierdziłem, czy model zegarka może dostać watchOS 11: lista zgodnych modeli watchOS 11 nie była osiągalna (strona watchOS 11 na apple.com pokazuje dziś watchOS 27) — [DO USTALENIA] u właściciela.

Pozostałe hipotezy obalone dowodami z buildu (niżej): zegarek jest w `.ipa`, identyfikatory są zgodne, `WKApplication = true`, build przeszedł przetwarzanie Apple (VALID).

## Hipotezy

| # | Hipoteza | Wynik | Dowód |
|---|---|---|---|
| a | `.ipa` 1161 bez `Watch/*.app` albo w złym miejscu | **NIE** | Log kroku „Kontrola .ipa” (run 43383728558, zadanie build, 07:35:28 UTC): „zegarek com.apps4brew.knitting.watchkitapp: CFBundleIcons › CFBundlePrimaryIcon › CFBundleIconName = AppIcon”, „- /Watch/OczkoZegarek.app: uprawnienia {… beta-reports-active: true, get-task-allow: false …}”, „Wynik: błędów 0, uwag 2” (obie uwagi: brak manifestu w widżecie i rozszerzeniu). Bez `Watch/*.app` skrypt zgłasza błąd (`scripts/wydanie/kontrola-ipa.sh:26-28`). Eksport z wysyłką: „Export Succeeded”, przetwarzanie: „Build 1161: VALID” (07:41:05). |
| b | `WKCompanionAppBundleIdentifier` / bundle ID zegarka niezgodne z aplikacją | **NIE** | `kontrola-ipa.sh:30` porównuje companion ID z `CFBundleIdentifier` aplikacji; w 1161 brak błędu. Zbudowany zegarek (jakosc-ios run 41987399061, zadanie zegarek-ikona, krok „Diagnostyka”, `plutil -p`): `CFBundleIdentifier = com.apps4brew.knitting.watchkitapp`, `WKCompanionAppBundleIdentifier = com.apps4brew.knitting`, `WKApplication = true`, `UIDeviceFamily = [4]`. Ustawienia celu z tego samego kroku: `INFOPLIST_KEY_WKApplication = YES`, `INFOPLIST_KEY_WKCompanionAppBundleIdentifier = com.apps4brew.knitting`. Konfiguracja celu od f330c311 do 2ed5215a zmieniła tylko barwy (`git diff f330c311 2ed5215a -- targets/watch/expo-target.config.js`). |
| c | `WKRunsIndependentlyOfCompanionApp` / aplikacja niezależna — inna droga instalacji | **NIE** (najpewniej) | Klucza nie ma w zbudowanym Info.plist (lista kluczy z `plutil -p` jak w b), więc aplikacja nie jest oznaczona jako niezależna. Trening ustawia jawnie `false` (trening `targets/watch-app/Info.plist:7-8`). Apple: klucz to „A Boolean value indicating whether the user can install and run the watchOS app independently of its iOS companion app” (developer.apple.com, JSON dokumentacji klucza, odczyt 2026-11-15); wartości domyślnej przy braku klucza strona nie podaje — dlatego „najpewniej”, nie pewne. Różnica nie tłumaczy objawu: aplikacja zależna jest właśnie tą, którą instaluje się z iPhone'a. |
| d | Minimalny watchOS wyższy niż na zegarku właściciela | **TAK (najbardziej prawdopodobne)** | Oczko: `deploymentTarget: '11.0'` (`targets/watch/expo-target.config.js:13`), `MIN_WATCHOS = '11.0'` (`src/konfiguracja.ts:36`), `MIN_WATCH=11.0` sprawdzane w `.ipa` (`scripts/wydanie/kontrola-ipa.sh:12`, `:31`), decyzja ADR-0006 / P-070 (iOS 18 → watchOS 11). Zegarek właściciela: watchOS 10.6.2 (trening `docs/18-przekazanie.md:280`). Wersję z dziś trzeba potwierdzić u właściciela. |
| e | Różnice wobec Treningu w projekcie zegarka, pluginie, Info.plist, workflow | **Jedna istotna różnica: minimum watchOS** | Tabela niżej. Ten sam plugin (`@bacons/apple-targets` 5.0.0 w obu `package-lock.json`), ten sam typ celu `watch`, ten sam wzór bundle ID, oba workflowy osadzają i sprawdzają zegarek. Różnice w Info.plist (`WKRunsIndependentlyOfCompanionApp`, HealthKit) nie wpływają na widoczność na liście. |
| f | Na telefonie inny build niż 1161 | **NIEROZSTRZYGNIĘTE** (nie zmienia wniosku) | Właściciel podał wcześniej „Na telefonie build 1061”; build 1061 nie trafił do Apple (P-540). Do Apple poszły 1071, 1101, 1111, 1131, 1141, 1151, 1161 (tagi `v1.0.0-b*`). Każdy z nich ma ten sam cel zegarka z minimum 11.0 (ADR-0006 od 22.10), więc numer buildu nie zmienia wniosku z d. Możliwa pomyłka odczytu 1061/1071 — [DO USTALENIA]. |

## Porównanie z Treningiem

| Ustawienie | Oczko (2ed5215a) | Trening (2d975814) |
|---|---|---|
| Plugin celu | `@bacons/apple-targets` 5.0.0 — `package-lock.json:1323-1324` | 5.0.0 — `trening:package-lock.json:1457-1458` |
| Typ i nazwa celu | `watch`, `OczkoZegarek` — `targets/watch/expo-target.config.js:9-10` | `watch`, `TreningWatch` — `trening:targets/watch-app/expo-target.config.js:3-4` |
| Bundle ID zegarka | `.watchkitapp` → `com.apps4brew.knitting.watchkitapp` — `targets/watch/expo-target.config.js:12` | `.watchkitapp` → `pl.lukasz.trening.watchkitapp` — `trening:targets/watch-app/expo-target.config.js:6` |
| **Minimum watchOS** | **11.0** — `targets/watch/expo-target.config.js:13` | **10.0** („minimum watchOS 10 (decyzja 14.10.2026)”) — `trening:targets/watch-app/expo-target.config.js:7` |
| Własny `Info.plist` celu | brak w repo; plugin tworzy pusty słownik przy prebuild (`getTargetInfoPlistForType('watch')` zwraca `{}`, apple-targets 5.0.0 `build/target.js:310-311`) | jest — `trening:targets/watch-app/Info.plist:1-56` |
| `WKApplication` | `true` (dokłada Xcode z `INFOPLIST_KEY_WKApplication = YES`; run 41987399061) | `true` — `trening:targets/watch-app/Info.plist:5-6` |
| `WKCompanionAppBundleIdentifier` | `com.apps4brew.knitting` (plugin: `INFOPLIST_KEY_WKCompanionAppBundleIdentifier` = bundle ID aplikacji, apple-targets `build/configuration-list.js:285`; kontrola `scripts/wydanie/kontrola-ipa.sh:30`) | `pl.lukasz.trening` (ten sam mechanizm pluginu; kontrola `trening:.github/workflows/testflight.yml:156`) |
| `WKRunsIndependentlyOfCompanionApp` | brak klucza | `false` — `trening:targets/watch-app/Info.plist:7-8` |
| Uprawnienia zegarka | tylko standardowe (log „Kontrola .ipa” 1161) | HealthKit — `trening:targets/watch-app/expo-target.config.js:10` |
| Ikona | `assets/watch.png` 1088 — `targets/watch/expo-target.config.js:14` | `assets/icon.png` — `trening:targets/watch-app/expo-target.config.js:8` |
| Osadzenie i kontrola w workflow | `Watch/*.app` podpisywany ad hoc w archiwum (`.github/workflows/testflight.yml:174`), kontrola `.ipa` (`.github/workflows/testflight.yml:217-220` → `kontrola-ipa.sh:26-37`) | `Watch/TreningWatch.app` (`trening:.github/workflows/testflight.yml:151-171`), kontrola uprawnień w `.ipa` (`:206`) |
| Kontrola minimum w `.ipa` | `MinimumOSVersion = 11.0` — `scripts/wydanie/kontrola-ipa.sh:31` | `WATCHOS_DEPLOYMENT_TARGET = 10.0` w projekcie — `trening:scripts/verify-native.mjs:67` |

## Pytania do właściciela

Jedno zadanie, ok. 2 min:
1. Na zegarku: **Ustawienia → Ogólne → To urządzenie (Informacje)** — podaj **Wersję** (np. 10.6.2) i **Model** (np. Series 5, SE).
2. W TestFlight na iPhonie: **Oczko → numer buildu** (np. 1.0.0 (1161)) i czy na stronie Oczka jest sekcja **Apple Watch** z przyciskiem „Zainstaluj”. TestFlight pokazuje zegarek na stronie aplikacji („install the iOS app first, then go to the App Details page in the Information section”, testflight.apple.com, odczyt 2026-11-15).

Gdzie szukałem przed pytaniem (P-315): `docs/fakty-wlasciciela.md` (jest „Ma iPhone'a i Apple Watch”, bez wersji), trening `docs/18-przekazanie.md:280` (watchOS 10.6.2 z 18.10.2026 — mogło się zmienić).

## Proponowana poprawka

| Opcja | Co | Kompromis | Koszt |
|---|---|---|---|
| **A (rekomendacja, analogia Trening)** | Minimum zegarka **watchOS 10.0**: `targets/watch/expo-target.config.js:13`, `src/konfiguracja.ts:36`, `scripts/wydanie/kontrola-ipa.sh:12`, `README.md:17`, wzorzec `tests/wydanie/dane/project.pbxproj:732`, `:855`; ADR-0006 uzupełniony przez rolę 05 (iOS zostaje 18). Grep znanych API spoza watchOS 10 w `targets/watch` (`#available`, `handGestureShortcut`, `MeshGradient` i in.) — 0 trafień; StoreKit `Transaction.currentEntitlements` i `WKInterfaceDevice.play` są starsze. Ostateczny dowód: kompilacja celu w „Jakość · iOS” z minimum 10.0 i lista API w testach jak trening `tests/watch-availability.test.ts`. | Właściciel testuje zegarek na swoim urządzeniu; zegarki z watchOS 10 w grupie odbiorców. Koszt: jedna wersja systemu więcej do utrzymania (bez wariantów kodu dziś). | Agent: ok. 1–1,5 h (05: ADR; 08: zmiana + test dostępności API; CI „Jakość · iOS” ok. 30 min). **Wymaga nowego buildu TestFlight (7) — zgoda właściciela (Approve).** |
| B | Bez zmiany (watchOS 11) | Zegarek na urządzeniu właściciela nie do sprawdzenia przed wydaniem; ryzyko nazwane jak w P-290 („nie sprawdzono”); posiadacze zegarków bez watchOS 11 bez funkcji zegarka. | 0 h, bez buildu |
| C | Właściciel aktualizuje zegarek do watchOS 11 | Możliwe tylko, jeśli model wspiera watchOS 11 — [DO USTALENIA] po odpowiedzi na pytanie 1. | Czas właściciela; bez buildu |

Jeśli odpowiedź na pytanie 1 pokaże watchOS ≥ 11, wniosek d upada; wtedy następny krok to pytanie 2 (sekcja Apple Watch w TestFlight) i diagnoza instalacji na urządzeniu.

## Decyzja (proponowana, do weta)

- **P-816 (proponowana, koordynator wg P-087, tryb analogii):** przyczyna braku Oczka w „Dostępne aplikacje” = minimum watchOS 11.0 przy zegarku właściciela z watchOS 10.6.2 (zapis Treningu); rekomendacja A (minimum zegarka 10.0 jak Trening, iOS 18 bez zmian) po potwierdzeniu wersji przez właściciela. Odrzucone: B (zegarek niesprawdzalny przed wydaniem), C (zależy od modelu). Zależy od: odpowiedź właściciela na pytanie 1, ADR-0006, P-070. Warunkowa.

## Uwagi poboczne

- `docs/decyzje.md` P-290 (3) mówi „Właściciel nie ma Apple Watch”, a `docs/fakty-wlasciciela.md` (P-316) i objaw z 15.11 mówią, że ma. Do sprostowania przez koordynatora.
- Ryzyko R-156 / WY-07 (`docs/jakosc/e1-ryzyka.md:307`) sprawdza minimum zegarka tylko jako zgodność z ADR, nie z urządzeniami odbiorców; kontrola `.ipa` nie mogła tego złapać.

## Czego nie sprawdzono

- Wersja i model zegarka dziś — krok właściciela (pytania wyżej).
- Lista modeli zgodnych z watchOS 11 — strony Apple dla watchOS 11 niedostępne w dniu odczytu (apple.com pokazuje watchOS 27).
- Kompilacja celu zegarka z minimum 10.0 — wymaga macOS (CI), poza zakresem diagnozy.
- Info.plist zegarka bezpośrednio z `.ipa` 1161 (kontrola wypisuje tylko wybrane pola); pełna lista kluczy pochodzi z buildu f330c311 z tą samą konfiguracją celu poza barwami.
