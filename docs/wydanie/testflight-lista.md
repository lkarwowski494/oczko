# Lista kontrolna TestFlight — co jest potrzebne i od kogo (rola 10, 2026-10-30)
Plan: `docs/plan-prac.md` etap 3 (3.1 właściciel, 3.2 rola 10, 3.3 test właściciela). Plan testu na urządzeniu: `docs/jakosc/testflight-na-urzadzeniu.md` (07, P-290). Kroki sekretów i workflow: `sklep.md` §1–2. Nic z tej listy nie zostało wykonane ani wysłane; wiersze „Stan” to stan dokumentów z 2026-10-30, nie dowód wykonania.

## A. Przed pierwszym przebiegiem dowodowym (właściciel, ok. 30 min; P-233, plan 3.1)
| # | Krok | Gdzie | Stan | Dlaczego |
|---|---|---|---|---|
| A1 | Zarejestrować identyfikator App Group `group.com.apps4brew.knitting` | Apple Developer → Identifiers → App Groups | brak dowodu wykonania | `app.json` (entitlements), skrzynka importu i migawka projektów rozszerzenia „Udostępnij” (ADR-0011, fix-7) |
| A2 | Zarejestrować kontener iCloud `iCloud.com.apps4brew.knitting` | Identifiers → iCloud Containers | brak dowodu | `app.json`: `icloud-container-identifiers`; bez niego build z CloudKit się nie podpisze |
| A3 | Włączyć na App ID `com.apps4brew.knitting` możliwości iCloud (CloudKit) i App Groups; sprawdzić Push Notifications (`aps-environment` jest w entitlements, bo CKSyncEngine potrzebuje powiadomień o zmianach) | Identifiers → App ID → Capabilities | [DO USTALENIA: czy podpis ad hoc w `testflight.yml` wymaga zmiany profilu; sprawdza pierwszy przebieg dowodowy] | `docs/architektura/prywatnosc.md` (tryby i uprawnienia) |
| A4 | Identyfikatory celów (`.share`, `.widget`, `.watchkitapp`): sprawdzić, czy trzeba je rejestrować osobno | Identifiers | [DO USTALENIA] — zależy od ścieżki podpisu (P-233/P-234: podpis ad hoc każdego celu własnym plikiem uprawnień, `scripts/wydanie/uprawnienia-celow.mjs`) | pierwszy przebieg dowodowy pokaże błąd walidacji, jeśli czegoś brakuje |
| A5 | Klucz API App Store Connect (Admin, „GitHub Oczko”), środowisko `testflight` z trzema sekretami i recenzentem | `sklep.md` §1 | brak dowodu | podpis chmurowy; **wartości nigdy w czacie ani repo** |
| A6 | Token CloudKit i wdrożenie schematu Development → Production | CloudKit Console | brak dowodu (P-091) | bez wdrożenia do Production iCloud nie zadziała w TestFlight/App Store [DO USTALENIA: czy TestFlight używa Production — sprawdza rola 10 u źródła Apple przed krokiem] |

## B. Produkty i umowy (właściciel; blokuje tylko blok E testu i wysyłkę do recenzji)
| # | Krok | Stan | Uwaga |
|---|---|---|---|
| B1 | Umowa „Paid Apps” (dane podatkowe i bankowe) | `CLAUDE.md`: [DO USTALENIA] | bez niej produkty nie są dostępne, a pierwszy zakup każdego typu wysyła się z wersją (App Store Connect Help, „Submit an In-App Purchase”) |
| B2 | Produkty V4: `oczko.pro.monthly` (0,99), `oczko.pro.yearly` (6,99), `oczko.pro.lifetime` (14,99 USD), grupa „Oczko Pro”, bez oferty wprowadzającej | `sklep.md` §3 krok 1 | ID nie da się zmienić ani użyć ponownie |
| B3 | Zakup w TestFlight: czy działa bez konta Sandbox i czy jest bezpłatny | [DO USTALENIA] — rola 10 potwierdza u źródła Apple przed blokiem E (P-290 (2); lekcja L-028 Treningu) | do tego czasu blok E testu „nie sprawdzono” |

## C. Wysłanie buildu (rola 10, za zgodą na ten build; okno macOS do ok. 14:00 UTC, P-187)
1. Commit z zielonym „Jakość · iOS” i werdyktem 07 (raport 07 jeszcze nie istnieje: audyt 2.4 trwa) — bez raportu nic nie wysyłam.
2. Przebieg dowodowy `bez_wysylki = true`: budowa, podpis, kontrola `.ipa`, walidacja. UWAGI kontroli `.ipa` do rozstrzygnięcia w `sklep.md` §5.
3. Zgoda → przebieg z wysyłką → grupa wewnętrzna → zaproszenie właściciela.
4. Wersja przed kandydatem: `app.json` `version` `0.1.0` → `1.0.0` (zgłoszenie dla 08, jeszcze nie wykonane; sprawdzone w pliku 2026-10-30). Numer buildu: przesunięcie 1000 → pierwszy build 1011 > 1004 z 0.1.0.
5. Zmiana przełącznika `ICLOUD_W_1_0 = true` dla buildu TestFlight (P-290 (1)): robi 08/koordynator w osobnym commicie; build App Store ma `false`, dopóki ZM-06 nie przejdzie.
6. Kontrola `.ipa` po zmianach 08 z 2026-10-30 (`scripts/wydanie/kontrola-ipa.sh` wymaga `.ipa` i PlistBuddy — na Linuksie nie do uruchomienia, **nie sprawdzono**; sprawdza przebieg dowodowy `bez_wysylki = true` na macOS):
   - tryby tła i uprawnienia (P-300 (b), `plugins/icloud-tlo.js`): build z `ICLOUD_W_1_0 = false` → w `Info.plist` brak `UIBackgroundModes`, w entitlements brak `aps-environment`; build TestFlight z `true` → `UIBackgroundModes = [remote-notification]` i `aps-environment` obecne (pętla `UIBackgroundModes` w skrypcie przy braku klucza nic nie sprawdza i nie zgłasza błędu);
   - krój tytułowy (P1-001, plan B): `UIAppFonts` w `Info.plist` zawiera `LibreFranklin-Bold.ttf`, plik jest w paczce aplikacji; zrzut licznika pokazuje Libre Franklin Bold (cyfra „4”, tytuł), ekran z grecką nazwą projektu — krój systemowy bez pustych glifów.

## D. Test właściciela (plan 07; część obowiązkowa ok. 70 min)
Bez zegarka: testy zegarka „nie sprawdzono” (P-290 (3)). iPad bez Pencil (P-226). Blok E tylko po B1–B3. Zasada z planu 07: TT-07 (instalacja nad 0.1.0) jako pierwsze.

## E. Ryzyka do rozstrzygnięcia przed wysyłką do App Store (zgłoszenia, jeszcze bez wykonania)
| # | Ryzyko | Realność | Opcje | Rekomendacja |
|---|---|---|---|---|
| R1 | Tryb tła `remote-notification` i `aps-environment` są w `app.json` bezwarunkowo, a przełącznik iCloud może być ukryty w wydaniu (`ICLOUD_W_1_0 = false`): 2.5.4 dopuszcza tryb tła tylko do użytego celu | realna, jeśli ZM-06 nie przejdzie | **Decyzja koordynatora P-300 (2026-10-30):** tryb tła i `aps-environment` warunkowe od flagi iCloud w konfiguracji buildu; zmianę robi 08, nie rola 10 | do tego czasu notatka dla recenzji (`metadane/notatka-recenzja.txt`) opisuje tryb tła jako używany tylko przez opcjonalną synchronizację; po zmianie 08 usunąć zdanie w buildzie bez iCloud |
| R2 | `NSCameraUsageDescription` w `app.json` jest po angielsku i opisuje zdjęcia wzoru, projektu i etykiety; skaner stron („Scan pages”) też używa aparatu | brzegowa | tekst zostaje (zgodny z 5.1.1(ii)); do sprawdzenia przez 04/08, czy obejmuje skan | zgłosić 08 |
