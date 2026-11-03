# Inwentarz prywatności i required reason API (rola 05, E3, 2026-10-22) · wejście dla roli 10
Zasada: aplikacja zbiera tylko to, czego wymaga przepływ z kontraktu (zasada architekta 10); próg NFR-PRY-001 „Data Not Collected”, zero SDK reklamowych i analitycznych. Formularz App Privacy i plik manifestu przygotowuje rola 10; ten inwentarz opisuje kod i zależności z ADR 0001–0016.

## Inwentarz danych
| Dane | Skąd | Gdzie trzymane | Czy opuszczają urządzenie (dokąd, kiedy) | Cel | Czas życia |
|---|---|---|---|---|---|
| Projekty, części, liczniki, historia zmian, notatki, przypomnienia, sesje stopera, zapas, obliczenia | użytkownik | `Application Support/oczko.db` (ADR-0001) | tylko na żądanie użytkownika: (1) iCloud **użytkownika**, prywatna baza CloudKit, gdy włączy synchronizację (ADR-0005); (2) archiwum `.oczko` zapisane tam, gdzie wskaże (ADR-0004); (3) kopia urządzenia (system) | działanie aplikacji | do usunięcia przez użytkownika (+30 dni „Ostatnio usunięte”); „Usuń wszystko” F-34 |
| Identyfikator instalacji (losowy UUID w `urzadzenie.txt` obok bazy, nie IDFV) i rodzaj urządzenia (`iphone` \| `ipad`, P-247 U6a) w każdym zdarzeniu historii (`zdarzenie.urzadzenie`, `urzadzenie_rodzaj`) | aplikacja | baza (zdarzenie); UUID także w pliku poza bazą, poza kopią i archiwum | razem z historią: iCloud **użytkownika** (gdy włączy synchronizację), archiwum `.oczko` | wybór wersji licznika przy konflikcie („iPhone” / „iPad”, F-58); bez śledzenia i bez łączenia z innymi danymi | jak historia zmian |
| Wzory (PDF, obraz, strona WWW, Word), rysunki PencilKit | użytkownik (import, rysik) | `Application Support/pliki/` | jak wyżej (CloudKit jako `CKAsset`, archiwum, kopia urządzenia); adres strony WWW pobierany raz przy imporcie (sieć do tej strony, ADR-0011) | praca ze wzorem | jak wyżej |
| Zdjęcia projektu i etykiet | aparat albo systemowy wybór zdjęć | `Application Support/pliki/` | jak wyżej; karta ukończenia (F-53) udostępniana arkuszem systemowym tylko na żądanie | dokumentacja projektu | jak wyżej |
| Metadane zdjęć (w tym lokalizacja EXIF) | plik zdjęcia | w pliku zdjęcia | **karta ukończenia i każde udostępnienie zdjęcia z aplikacji bez metadanych lokalizacji** (NFR-PRY-001, F-53, P-073 (10a)); oryginał w kopii użytkownika bez zmian [DO USTALENIA: czy `expo-image-picker` usuwa EXIF przy `exif: false` — test 07; zabezpieczenie: karta renderowana od nowa, bez EXIF] | — | jak zdjęcie |
| Dni limitu | aplikacja (pierwsze +1 dnia) | baza | iCloud użytkownika (KP-15) | limit V4 | do „Usuń wszystko” |
| Uprawnienie Pro | App Store | StoreKit (system); pamięć ostatniego stanu (ID produktów, data wygaśnięcia; KP-06) w `pamiec-pro.json` obok bazy, poza bazą, archiwum i iCloud (M1-195) | między urządzeniami użytkownika (StoreKit, WatchConnectivity) | dostęp Pro | system; plik zostaje po „Usuń wszystkie dane” (stan urządzenia) |
| Pliki stanu urządzenia obok bazy: `stan-startu.json` i `stan-startu-etap.json` (strażnik startu, ADR-0019), `jezyk.json` (lustro wybranego języka dla ekranu awaryjnego, P-455), `pamiec-pro.json` i `urzadzenie.txt` (wiersze wyżej) | aplikacja | `Application Support/` obok `oczko.db`; opis jednym źródłem: `dane.md` „Pliki stanu urządzenia poza bazą” (M1-195) | nie; tylko kopia urządzenia (system); poza archiwum `.oczko`, iCloud i kopią ratunkową | start, ekran awaryjny, dostęp Pro | zostają po „Usuń wszystkie dane”; do usunięcia aplikacji |
| Stan licznika dla ekranu blokady i zegarka | aplikacja | Live Activity (system, ≤ 4 KB), kontekst WatchConnectivity | zegarek użytkownika (sparowany) | F-11, F-12 | do końca Live Activity / następnego stanu |
| Dziennik +1 z ekranu blokady | intencja | `Application Support/dziennik-plus.jsonl` | nie | ADR-0008 | do scalenia |
| Skrzynka importu (plik wzoru albo adres strony, manifest zlecenia z wybranym projektem) | rozszerzenie udostępniania | kontener App Group `skrzynka/` | nie | ADR-0011 | do importu; porzucone zlecenie bez manifestu po `SKRZYNKA_PORZUCONE_H` |
| Migawka projektów w toku (id, nazwa, flaga „nienazwany”, data utworzenia, ostatnia praca, liczba wzorów — P-243 S1a; flaga „ma link do filmu” — P-276) | aplikacja | kontener App Group `projekty-migawka.json` (fix-7, P-220 N2) | nie (czyta tylko rozszerzenie Oczka na tym urządzeniu) | wybór projektu w arkuszu „Udostępnij do Oczka” | nadpisywana po każdej zmianie listy; pusta po „Usuń wszystkie dane” |
| Skan stron wzoru | systemowy skaner dokumentów (aparat) | katalog tymczasowy → PDF w `Application Support/pliki/` | jak wzory | F-24 (P-220 W7a) | pliki tymczasowe usuwane po imporcie |
| Diagnostyka (błędy: kod, czas, wersje, liczności; bez nazw, notatek, wzorów, zdjęć) | aplikacja | tabela `blad` (≤ 200 wierszy) | tylko gdy użytkownik wybierze „Zgłoś problem” i kanał w arkuszu udostępniania, po podglądzie (F-57) — **OP-25** (czy to „optional disclosure”, S-37): rola 10 | wsparcie | przycinane do 200 wierszy |
| Prośba o ocenę | system (`SKStoreReview` przez `expo-store-review`) | system | system Apple | BR-DAN-012 | system |
| Lokalizacja, kontakty, mikrofon, zdrowie, identyfikator reklamowy | — | **nie zbierane** | — | — | — |

Usługi zewnętrzne: brak serwera i konta (P-021, NFR-KOS-001). Sieć: App Store (zakupy), CloudKit (opcjonalnie), strona WWW wskazana przez użytkownika przy imporcie. Do oceny roli 10: czy prywatna baza CloudKit użytkownika i archiwum zapisane przez użytkownika liczą się jako „collected” w rozumieniu App Privacy [DO USTALENIA, rola 10 u źródła Apple].

## Uprawnienia i tryby (Info.plist, entitlements)
| Pozycja | Po co (przepływ) | Źródło |
|---|---|---|
| `NSCameraUsageDescription` | zdjęcie wzoru, projektu, etykiety (F-16, F-24) przez `expo-image-picker` (`launchCameraAsync`); prośba w chwili pierwszego „Zrób zdjęcie” (P-073 (9a)) | rejestr Expo 8 |
| bez `NSPhotoLibraryUsageDescription` dla wyboru zdjęć | systemowy wybór zdjęć bez uprawnienia (wyjątki: wideo z `allowsEditing: false` i `Passthrough` — nieużywane) | rejestr Expo 8 |
| `NSSupportsLiveActivities = true` | F-11, F-21 | rejestr Apple 19d |
| `UIBackgroundModes: remote-notification` + `aps-environment` + iCloud (CloudKit) | **tylko** synchronizacja F-27: „`CKSyncEngine` requires the CloudKit and Remote notifications entitlements”; „To receive background notifications, you must add the remote notifications background mode to your app.” (rejestr Apple 19a, 19b) | App Review 2.5.4 (rejestr Apple 10a): cel zgodny z przeznaczeniem; bez prośby o zgodę na powiadomienia (zgoda tylko dla alertów i dźwięków, rejestr Apple 19c) |
| App Group (wspólny kontener) | skrzynka importu i migawka projektów dla rozszerzenia udostępniania (ADR-0011, uzupełnienie fix-7); baza **nie** w App Group; widżet bez grupy (biblioteka celów kopiuje ją tylko do celu z kluczem `entitlements`) | rejestr Apple 2a |
| Inne `UIBackgroundModes` (location, audio, fetch, processing) | **brak** — żaden przepływ kontraktu ich nie wymaga | zasada 7 modułu tła |
| Powiadomienia lokalne | **brak** (przypomnienie F-06 na ekranie licznika; 04 nie użyło powiadomień) | design-spec |

## Required reason API (aplikacja i zależności)
Zależności: instalacja w katalogu roboczym 2026-10-22 (`expo@57.0.31`, `expo-sqlite@57.0.4`, `expo-file-system@57.0.7`, `expo-haptics@57.0.3`, `expo-keep-awake@57.0.2`, `expo-image-picker@57.0.20`, `expo-document-picker@57.0.3`, `expo-sharing@57.0.24`, `expo-store-review@57.0.3`, `expo-localization@57.0.2`, `expo-crypto@57.0.4`, `expo-iap@5.8.1`, `react-native@0.86.3`), potem `find node_modules -name PrivacyInfo.xcprivacy -not -path '*/example/*'` → 9 plików (`narzedzia/privacy-pliki-e3.txt`), odczyt `plistlib`. Żaden nie deklaruje `NSPrivacyTracking` ani `NSPrivacyCollectedDataTypes`. Ponowny odczyt 2026-11-03 (fix p3c2, ta sama komenda po `npm ci`): 10 plików — doszedł `react-native-view-shot` (bez kategorii); `expo-document-picker@57.0.3` nie ma własnego manifestu, a czyta `contentModificationDateKey` i `fileSizeKey` wybranego pliku (`ios/DocumentPickerModule.swift`).

Zasada kolumny „Do `app.json`” (P-453, rejestr Apple 11f–11g, odczyt 2026-11-03): powody, które opisują rzeczywiste użycie w pliku wykonywalnym aplikacji — kod aplikacji i zależności, bo Apple nie zawsze czyta ich manifesty (rejestr Expo 11). Apple: powody mają „accurately reflect your use”. Dlatego kolumna nie bierze automatycznie wszystkich kodów zależności. Odpadają powody tylko dla SDK (0A2A.1, C56D.1: „This reason may only be declared by third-party SDKs”) i powody zależności, których aplikacja nie używa (85F4.1). Test zgodności `app.json` → `ios.privacyManifests` z tą kolumną: M1-audytor-generalny-083 (rola 08).

| Kategoria | Kody z zależności | Kod aplikacji (JS przez `expo-*`, moduły Swift ADR-0007) | Do `app.json` → `ios.privacyManifests` (Expo: Apple nie zawsze czyta manifesty zależności, rejestr Expo 11) |
|---|---|---|---|
| UserDefaults | CA92.1 (`expo-constants`, `expo-localization`, `react-native`) | nie używa (ustawienia w bazie); **nie** współdzieli UserDefaults przez App Group (inaczej 1C8F.1, rejestr Apple 11b) | CA92.1 |
| FileTimestamp | C617.1 (`react-native`, Folly, boost, glog); 0A2A.1, 3B52.1 (`expo-file-system`); `expo-document-picker` bez manifestu (wyżej) | czas zmiany i rozmiar plików w kontenerze aplikacji i App Group (skrzynka importu, sprzątanie kopii i plików tymczasowych, rysunki oczekujące; `fstat` dziennika w `oczko-dziennik-plus`): C617.1 (rejestr Apple 11c). Metadane pliku wybranego w wyborze dokumentów (`expo-document-picker`, import archiwum i wzoru): 3B52.1 (rejestr Apple 11f). Dat plików aplikacja nie pokazuje (daty kopii z nazwy pliku albo z bazy), więc DDA9.1 nie pasuje | C617.1, 3B52.1 |
| SystemBootTime | 35F9.1 (`react-native`, boost) | nie (czas ze znaczników `Date`) | 35F9.1 |
| DiskSpace | E174.1, 85F4.1 (`expo-file-system`) | `wolneMiejsce()` (`Paths.availableDiskSpace`) przed eksportem i importem, przy błędzie otwarcia bazy i przed rysowaniem; zmienia zachowanie widoczne dla użytkownika (komunikat braku miejsca, ostrzeżenie): E174.1 (rejestr Apple 11d). Liczby wolnego miejsca aplikacja nie pokazuje i nie dołącza do zgłoszenia problemu (F-57), więc bez 85F4.1 i 7D9E.1 | E174.1 |
| ActiveKeyboards | — | — | — |

Powód DDA9.1 (FileTimestamp) pochodzi ze starego `app.json` 0.1.0. Opisuje pokazywanie dat plików użytkownikowi (rejestr Apple 11f), a aplikacja tego nie robi; zastępują go C617.1 i 3B52.1 z tabeli. Listę trzeba wygenerować ponownie po każdej zmianie pliku blokady (rola 07: kontrola w CI).

Pliki stanu urządzenia obok bazy (M1-195, 2026-11-03): `stan-startu.json`, `stan-startu-etap.json`, `jezyk.json`, `pamiec-pro.json` i `urzadzenie.txt` są tylko zapisywane i czytane jako tekst przez `expo-file-system` (`zapiszAtomowo`, `czytajAtomowo`: zapis, odczyt, `exists`, przeniesienie, usunięcie — `src/dane/pliki/system.ts:63-89`), bez czasu zmiany, rozmiaru i wolnego miejsca, więc nie dodają kategorii ani powodu. Gdyby kiedyś czytały metadane, mieści się to w C617.1: „Declare this reason to access the timestamps, size, or other metadata of files inside the app container” (rejestr Apple 11c). Kolumna „Do `app.json`” bez zmian; zgodność z `app.json` sprawdza `tests/wydanie/manifest-app-json.test.ts`.

### Cele `@bacons/apple-targets` (osobne pliki wykonywalne, własny manifest — rejestr Apple 11g)
Grep symboli z listy Apple (rejestr Apple 11a) w `targets/`, 2026-11-03.

| Cel | Kategoria | Użycie w kodzie celu | Manifest celu |
|---|---|---|---|
| zegarek (`targets/watch`) | UserDefaults | `UserDefaults.standard` (`Aplikacja.swift`): kopia kontekstu telefonu, kolejka sprzed partii 3, identyfikator instalacji zegarka; bez App Group (cel bez `entitlements`) | CA92.1 (`targets/watch/PrivacyInfo.xcprivacy`) |
| zegarek (`targets/watch`) | FileTimestamp | `fstat` dziennika w `Application Support` zegarka (`Wspolne/Dziennik.swift`) — kontener aplikacji | C617.1 (`targets/watch/PrivacyInfo.xcprivacy`) |
| widżet / Live Activity (`targets/widget`) | — | brak symboli z listy; `LiveActivityIntent` działa w procesie aplikacji (rejestr Apple 1f) | brak (niepotrzebny) |
| rozszerzenie udostępniania (`targets/share`) | — | brak symboli z listy; rozmiar pliku przez `attributesOfItem` z kluczem `.size`, a Apple wymienia tylko klucze `creationDate` i `modificationDate` | brak (niepotrzebny według listy Apple; potwierdza kontrola `.ipa`, rola 10) |

## Sekrety (ADR-0014)
Repo publiczne: brak kluczy w kodzie i w `EXPO_PUBLIC_` (Expo: „Do not store sensitive info … in `EXPO_PUBLIC_` variables”); klucz App Store Connect tylko w środowisku `testflight` GitHub (P-071 (6b)). Aplikacja nie ma własnych kluczy API (brak usług).
