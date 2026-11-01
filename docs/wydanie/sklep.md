# Wydanie Oczka: sekrety, TestFlight, App Store Connect (rola 10, build E2, 2026-10-26)

Decyzje: P-196 (D3a–D9a; D1 i D2 czekają na właściciela). Każdy krok w App Store Connect, w GitHubie i każdy przebieg workflow wykonuje właściciel albo agent za zgodą na to jedno działanie (zasada roli 10 nr 2). Zgody trafiają do `docs/wydanie/dziennik.md`. **Żadnych wartości sekretów w repo, w raportach ani w czacie.**

Reguły Apple i GitHuba niżej przeczytano 2026-10-26 na surowym tekście stron (kopie w scratchpadzie sesji, bez commitu).

## 1. Sekrety podpisu (właściciel, ok. 20 min)
**Zmiana 2026-11-01 (P-316, P-315):** środowisko nazywa się `release` (jak w Treningu), nie `testflight`; klucz API zespołu istnieje (Trening), więc nie tworzysz nowego, tylko kopiujesz trzy wartości — kroki A5 w `kroki-wlasciciela-testflight.md`. Poniższy opis z 2026-10-26 jest historią w części „nowy klucz” i „nazwa środowiska”.
1. **Klucz API.** Otwórz https://appstoreconnect.apple.com/access/integrations/api, potem kolejno:
   - zakładka **Team Keys** → **Generate API Key** (albo „+”);
   - nazwa „GitHub Oczko”;
   - **Access: Admin** → **Generate**.

   Rola Admin jest jak w Treningu (`docs/15-app-store.md:339` tamtego repo): eksport podpisuje certyfikatem zarządzanym w chmurze, a z rolą App Manager Trening dostał „Cloud signing permission error”. Apple: „keys with the Admin role have broad permissions and can do things like create new users and delete users”. Węższa rola (Developer) jest niesprawdzona [DO USTALENIA: próba w przebiegu dowodowym, jeśli właściciel chce].

   ~~Klucz osobny od klucza Treningu~~ — **zastąpione P-316:** klucz jest kluczem zespołu (jeden dla obu aplikacji); wyciek albo unieważnienie dotyczy obu aplikacji.
2. **Pobierz plik.** Kliknij **Download API Key** przy nowym kluczu. Apple: „The private key is available for download a single time”; „Apple doesn’t keep a copy of the private key”.
   - Zapisz plik `AuthKey_….p8` w menedżerze haseł, poza repo i poza folderem Pobrane.
   - Zanotuj z tej samej strony **Key ID** i **Issuer ID**.
3. **Środowisko w GitHubie.** Otwórz https://github.com/lkarwowski494/Oczko/settings/environments → **New environment** → nazwa `release` (dawniej `testflight`). Jeśli środowisko już jest, sprawdź jego ustawienia. Ustaw:
   - **Required reviewers:** Ty. Opcję „Prevent self-review” zostaw wyłączoną, bo inaczej nie zatwierdzisz własnego przebiegu. Według GitHuba sekrety środowiska są dostępne dopiero, gdy „configured rules (for example, required reviewers) pass”.
   - **Deployment branches:** „Selected branches and tags”, a w nim reguły `main` i `claude/jolly-thompson-paz6d8`. Druga to wyjątek nazwany do scalenia (D4a); usuń ją po scaleniu.
   - **Environment secrets** → **Add secret**, trzy sekrety:
     - `ASC_KEY_ID` — Key ID;
     - `ASC_ISSUER_ID` — Issuer ID;
     - `ASC_KEY_P8` — cała treść pliku `.p8`, razem z pierwszą i ostatnią linią (nagłówek BEGIN i stopka END klucza).
4. **Zmienna (opcjonalnie).** Otwórz https://github.com/lkarwowski494/Oczko/settings/variables/actions i ustaw `PRZESUNIECIE`. Domyślnie jest 1000, co daje pierwszy build 1011, większy od 1004 z 0.1.0. Podnieś ją tylko wtedy, gdy workflow sam to zaleci.
5. **Po pierwszym zielonym przebiegu dowodowym** usuń stare sekrety repozytorium z 0.1.0: https://github.com/lkarwowski494/Oczko/settings/secrets/actions (`ASC_KEY_P8_BASE64`, `APPLE_TEAM_ID` oraz `ASC_KEY_ID` i `ASC_ISSUER_ID` na poziomie repozytorium, jeśli są). Jeśli klucz 0.1.0 nie jest używany gdzie indziej, unieważnij go w App Store Connect (ta sama strona, **Revoke**).
6. **Wyciek albo podejrzenie:** natychmiast **Revoke** (Apple: „If you suspect a private key is compromised, immediately revoke the key”), potem nowy klucz i punkt 3.

## 2a. Strona (GitHub Pages; P-219: D1 repo „oczko”, D2 publikacja z gałęzi roboczej przed TestFlight)
1. Właściciel zmienia nazwę repo: https://github.com/lkarwowski494/Oczko/settings → **Repository name**: `oczko` → **Rename**. Według GitHuba stare adresy git i API są przekierowywane.
2. Właściciel ustawia źródło Pages: https://github.com/lkarwowski494/oczko/settings/pages → **Build and deployment** → **Source: GitHub Actions**. Domeny własnej w tym repo nie ustawia: dziedziczy ją z apps4brew.com.
3. Właściciel dopuszcza gałąź roboczą do wdrożeń Pages: https://github.com/lkarwowski494/oczko/settings/environments → `github-pages` → **Deployment branches and tags** → **Add deployment branch or tag rule** → `claude/jolly-thompson-paz6d8`. Regułę usuwa po scaleniu.
4. Po potwierdzeniu nowej nazwy rola 10 uruchamia ręcznie Actions → „Pages” → Run workflow na gałęzi roboczej. Potem sprawdza `curl` dla `baza`, `baza + polityka` i `baza + wsparcie` (oczekiwane 200) i zapisuje wynik w dzienniku.

**Wynik 2026-10-26:** Pages repo `oczko` działa pod `https://lkarwowski494.github.io/oczko/`; `apps4brew.com/oczko/` daje 404, bo apps4brew.com publikuje repo `apps4brew-www` (Trening ma tam `trening/` z kopią swoich stron). Wybór drogi (D10, koordynator 2026-10-26): strona pod apps4brew.com/oczko/ odłożona — `apps4brew-www` to osobny projekt, publikację zleci właściciel. Łatka gotowa: `oczko-warsztat/10-wydanie/apps4brew-www-oczko/` (node --test 61/61). Do tego czasu adres polityki: `https://lkarwowski494.github.io/oczko/privacy.html` (200) — zmiana dla 08: `oczko-warsztat/10-wydanie/adres-polityki-github-io/`.

## 2. TestFlight (workflow `.github/workflows/testflight.yml`)
- Uruchamia się tylko ręcznie: Actions → „TestFlight (testy wewnętrzne)” → Run workflow. Działa tylko w oknie maszyn macOS, od północy do ok. 15:00 (P-187), i tylko za zgodą na ten build.
- Domyślnie `bez_wysylki = true`. Taki przebieg dowodowy robi pełną budowę, podpis, kontrolę `.ipa` i walidację Apple, ale niczego nie wysyła i nie tworzy tagu. Wysyłka wymaga świadomego odznaczenia tego pola.
- **Commit:** taki, na którym „Jakość · iOS” jest zielony (pakiet podstawowy, każde zadanie success albo skipped). Commit z samą dokumentacją go nie uruchamia.
- **Kolejność:** przebieg dowodowy → zgoda → przebieg z wysyłką (workflow czeka na stan `VALID`) → grupa wewnętrzna w TestFlight → lista TT z `docs/jakosc/strategia.md` §8 (rola 07).
- **Wyniki kontroli `.ipa`:**
  - **BŁĄD** zatrzymuje wysyłkę.
  - **UWAGA** nie zatrzymuje buildu TestFlight. Dotyczy typu `.oczko`, katalogów `.lproj`, manifestu w celach i listy uprawnień. Przed wysyłką do App Store każdą UWAGĘ rozstrzygam w tym pliku (§5).
- Nie uruchamiano jeszcze nic. Kroki macOS (archiwum, podpis ad hoc, eksport, `kontrola-ipa.sh`) sprawdzi dopiero pierwszy przebieg dowodowy. Logika bramki, numeru i API ma test na Linuksie: `tests/wydanie/potok-testflight.test.ts`.

### Uruchamianie z gałęzi roboczej (P-319; sprawdzone 2026-11-01)
- **Reguła GitHuba** (docs.github.com, „Events that trigger workflows”, odczyt 2026-11-01): „This event will only trigger a workflow run if the workflow file exists on the default branch. … the "Run workflow" button will be present if the workflow file exists on the default branch.” (też „Manually running a workflow”: „To trigger the workflow_dispatch event, your workflow must be in the default branch.”). Wybór gałęzi: „Select the Branch dropdown menu and click a branch to run the workflow on.” REST („Create a workflow dispatch event”): `ref` — „The reference can be a branch or tag name.”
- **Dowód z tego repo (przebieg, nie deklaracja):** Pages przebieg `40366704274` (2026-10-26) miał `event: workflow_dispatch` i `head_branch: claude/jolly-thompson-paz6d8`; `main` ma `pages.yml` z `actions/checkout@v4` i `upload-pages-artifact@v3`, a gałąź robocza z `@v5` i `@v4`. Zadanie tego przebiegu wykonało `Run actions/checkout@v5` i `Run actions/upload-pages-artifact@v4` (`list_workflow_jobs`), czyli **GitHub uruchomił treść pliku z wybranej gałęzi**, choć plik na `main` miał inną treść. Wniosek: `testflight.yml` z gałęzi roboczej da się uruchomić, bo `main` ma plik o tej ścieżce z `workflow_dispatch` (nazwa w pasku bocznym Actions to nazwa z `main`: „Build & Upload to TestFlight (iOS)”).
- **Niesprawdzone [DO USTALENIA]:** (a) czy formularz „Run workflow” pokazuje wejścia (`bez_wysylki`, `pomin_bramke_e2e`, `powod`) z pliku wybranej gałęzi, czy z `main` (pliku `main` bez tych wejść) — dlatego uruchamiamy przez REST/`gh workflow run -f` z `ref` roboczą; bezpieczny domyślny `bez_wysylki = true` zadziała nawet wtedy, gdy wejścia zostaną zignorowane; (b) reguła gałęzi środowiska `release` musi dopuszczać gałąź roboczą (krok A5).
- **Skutek dla `asc-*.yml` i `jakosc-*.yml`:** nie mają odpowiednika na `main`, więc **nie da się ich uruchomić ręcznie przed scaleniem** (plik musi być na gałęzi domyślnej). Workflowy ASC działają więc dopiero po scaleniu roboczej do `main` — plan-prac krok 11.

## 3. App Store Connect — kroki w kolejności (właściciel; przed wysyłką 1.0, plan ~7–8.11)
| Nr | Krok | Gdzie | Reguła Apple (cytat, odczyt 2026-10-26) |
|---|---|---|---|
| 0 | **Sprawdź rekord aplikacji 0.1.0** (bundle `com.apps4brew.knitting`, build 1004) i zapisz w `oczko-warsztat` (nie tutaj): nazwę z App Information → Localizable Information, język główny, SKU, **Apple ID** (liczba), istniejące produkty (typ, ID, cena, Family Sharing, stan; OP-24). Do zmiany: Name według kroku 8 (dziś prawdopodobnie nazwa z 0.1.0 [DO USTALENIA]); jeśli jest Non-Consumable do użycia jako Pro, zostaje jego ID (P-038) | https://appstoreconnect.apple.com/apps | Name: „You can edit it until you submit the app to App Review” |
| 1 | **Produkty V4** (`docs/monetyzacja.md`, „Produkty”): grupa subskrypcji „Oczko Pro”, w niej `oczko.pro.monthly` (1 miesiąc, 0,99 USD) i `oczko.pro.yearly` (1 rok, 6,99 USD), **bez oferty wprowadzającej** (P-057). Osobno Non-Consumable `oczko.pro.lifetime` (14,99 USD) albo ID z kroku 0. Kraj bazowy USA, pozostałe storefronty automatycznie (MS-19). Nazwy i opisy produktów: teksty 04 i przekład 09 [DO USTALENIA]. Zrzut do recenzji produktu: po przeglądzie zakresu | aplikacja → Monetization → Subscriptions / In-App Purchases | „Enter the subscription’s reference name and Product ID”; ID nie da się zmienić ani użyć ponownie (MS-28); „The first … non-consumable, auto-renewable subscription … In-App Purchase of each type must be submitted with a new app version” — produkty idą razem z wersją 1.0 |
| 2 | **Family Sharing** włączyć dla trzech produktów (P-038, D6 z P-057). Potem 08 zmienia `FAMILY_SHARING` na `true` w `src/kompozycja/adresy.ts` | produkt → sekcja Family Sharing → Turn On → Confirm | „once you turn on Family Sharing for an In-App Purchases in App Store Connect, you can't turn it off” |
| 3 | **Billing Grace Period:** 3 dni, **All Renewals** (KP-06, P-103 (2a)) | aplikacja → Subscriptions → Billing Grace Period → Set Up | „select a period of 3, 16, or 28 days to apply across all subscription products in your app”; „Your selection will only apply to subscription products in production” |
| 4 | **App Privacy:** Get Started → „No, we do not collect data from this app” → Save. **Privacy Policy URL** = `baza` + `polityka` z `docs/wydanie/adres-strony.json`, po D1 i D2 i po sprawdzeniu, że adres odpowiada 200 | aplikacja → App Privacy | „If the answer is no, select "No, we do not collect data from this app" and then click Save. You don’t need to answer any further questions.” Podstawa w §4 |
| 5 | **Ocena wieku:** odpowiedzi według §4. Oczekiwany wynik: 4+ [DO USTALENIA po kwestionariuszu] | aplikacja → General → App Information → Age Ratings → Set Up Age Ratings | 2.3.6: „Answer the age rating questions in App Store Connect honestly” |
| 6 | **Kontakt dla recenzenta:** imię, nazwisko, e-mail, telefon w formacie międzynarodowym (+48 …). Wpisuje właściciel, nie trafia do repo. „Sign-in required”: wyłączone (brak konta). Notatka: §6 | wersja → App Review Information | „Enter the phone number in international format, including a plus sign (+)”; Notes „can contain up to 4000 bytes” |
| 7 | **Support URL** = `baza` + `wsparcie`. **Copyright:** „2026 Łukasz Karwowski” (D7a; symbol dopisuje Apple) | wersja → App Information / Version Information | Support URL „must lead to actual contact information”; Copyright „The copyright symbol is added automatically” |
| 8 | **Name w 33 lokalizacjach** (tabela niżej; dane: `docs/wydanie/metadane/nazwy.store.json`; `sprawdz-wydanie.mjs metadane` → OK, kod 0). Podtytuł, słowa kluczowe i opis: po przeglądzie zakresu | App Information → Localizable Information (lista języków) | „The name must be at least two characters and no more than 30 characters” |
| 9 | **Szyfrowanie:** bez pytania przy wysyłce, bo `ITSAppUsesNonExemptEncryption = false` w `app.json`. Podstawa: aplikacja i biblioteki szyfrują tylko mechanizmami systemu (HTTPS do App Store, a w 1.1 CloudKit); `expo-crypto` liczy skróty SHA kopii, czyli integralność, nie szyfrowanie danych [OCENA] | — | „Set the value to NO if your app … doesn’t use encryption, or if it only uses forms of encryption that are exempt”; „you might alternatively be required to submit a year-end self-classification report” [DO USTALENIA: jak w Treningu] |
| 10 | **Status tradera (DSA):** ustawiany dla konta, wspólnego z Treningiem — sprawdź, że jest ustawiony [DO USTALENIA] | Business → Digital Services Act | — |

### Pole Name (P-174; część po dwukropku z `docs/wzrost.md`)
| Język aplikacji | Lokalizacja App Store | Pole Name | Znaki |
|---|---|---|---|
| pl | pl | Oczko: Licznik rzędów | 21 |
| en | en-US, en-GB, en-AU, en-CA | Oczko: Row Counter | 18 |
| cs | cs | Oczko: počítadlo řad | 20 |
| sk | sk | Oczko: počítadlo radov | 22 |
| hr | hr | Očica: brojač redova | 20 |
| sl | sl | Oczko: števec vrst | 18 |
| uk | uk | Петля: лічильник рядів | 22 |
| ru | ru | Петля: счётчик рядов | 20 |
| hu | hu | Szem: sorszámláló | 17 |
| ro | ro | Ochi: numărător de rânduri | 26 |
| de | de-DE | Masche: Reihenzähler | 20 |
| fr | fr-FR | Oczko: Compteur de rangs | 24 |
| it | it | Oczko: contagiri per maglia | 27 |
| es | es-ES | Oczko: contador de vueltas | 26 |
| es-419 | es-MX | Oczko: contador de vueltas | 26 |
| pt | pt-PT | Malha: contador de carreiras | 28 |
| pt-BR | pt-BR | Oczko: contador de carreiras | 28 |
| nl | nl-NL | Oczko: toerenteller | 19 |
| sv | sv | Maska: varvräknare | 18 |
| da | da | Oczko: pindetæller | 18 |
| nb | no | Oczko: Strikk og hekle | 22 |
| fi | fi | Silmukka: kerroslaskuri | 23 |
| tr | tr | Oczko: sıra sayacı | 18 |
| el | el | Oczko: μετρητής σειρών | 22 |
| id | id | Oczko: penghitung baris rajut | 29 |
| ms | ms | Gelungan: pembilang baris kait | 30 |
| vi | vi | Oczko: đếm hàng đan móc | 23 |
| ja | ja | 編み目: 編み物カウンター | 13 |
| ko | ko | Oczko: 뜨개질 단수 카운터 | 17 |
| zh-Hant | zh-Hant | 針目: 編織段數計數器 | 11 |

- Języki sr, bg, lt, lv i et nie mają lokalizacji w App Store Connect, więc mają tylko nazwę pod ikoną.
- Słowo marki według P-174: sk, sl, fr, da, nb i el mają „Oczko”. Tabela w `docs/wzrost.md` (kolumny „Pod ikoną” i „Pełna nazwa”) ma tam jeszcze stan sprzed P-174 (np. sk „Očko”, fr „Maille”) — zgłoszenie dla 11 i 09 (§7).
- Części po dwukropku poza 7 lokalizacjami z badania fraz to przekład roboczy (P-145 D2a). Badanie fraz i przegląd tłumacza: zadanie 10 przy ASO, po przeglądzie zakresu.

## 3a. Szkic metadanych en (2026-11-01; **bez zamrożenia** — P-320)
Koordynator (P-320, właściciel 2026-11-01): wszystko, co powstaje z gotowej aplikacji, robimy z buildu kandydata po audycie. Metadane en są więc **szkicem do wyniku audytu**: bez sum kontrolnych, bez przekazania 09 do przekładu, bez zamrożenia (ten punkt planu dla 09 odpada do audytu). Zmiany względem szkicu z 2026-10-30, zgodne z już przyjętymi decyzjami: opis „a calendar of **your crafting days**” zamiast „the days you knit” (P-302: „crafting days” wszędzie; P-304: „knit” tylko tam, gdzie mowa o drutach — tytuł i opis mówią „knitting and crochet”, podtytuł „Knit & crochet”, słowa kluczowe mają obie techniki); en-AU i en-CA dopisane (= en-GB i en-US jak Trening, decyzja tamtego repo 21.10.2026); nic o zegarku ani iCloud (P-300; P-316: właściciel ma zegarek, test będzie — zdanie dopiero po jego wyniku). Walidacja: `tests/wydanie/asc-metadane.test.ts` (limity, zgodność z P-302/P-304/P-300, adresy), `sprawdz-wydanie.mjs metadane` OK.

**Kontrakt formatu dla roli 09** (obowiązuje, gdy 09 ruszy po audycie; metadane 33 lokalizacji ASC): jeden plik `docs/wydanie/metadane/<kod>.store.json` na język (np. `de.store.json`), format EAS Metadata jak `en.store.json`: `apple.info.<kod lokalizacji ASC>` z polami `title`, `subtitle`, `description`, `keywords` (tablica; razem ≤ 100 **bajtów** po złączeniu przecinkami), `promoText`, `supportUrl`, `privacyPolicyUrl`, bez `releaseNotes` (pierwsza wersja). Kody lokalizacji ASC to klucze `nazwy.store.json` (`no`, `es-MX`, `de-DE`… — nie kody interfejsu `nb`, `es-419`); `title` identyczny z `nazwy.store.json` (skrypt zgłasza sprzeczność); `sl` bez wpisu (ASC go nie przyjął w Treningu, L-003). Walidację limitów robi `scripts/asc/metadane.mjs` (podgląd) i `sprawdz-wydanie.mjs metadane`.

## 3b. Workflowy App Store Connect z Treningu (2026-11-01, P-316 (4); nic nie uruchomiono)
| Workflow | Skrypt | Dane | Tryb domyślny | Zapis |
|---|---|---|---|---|
| `asc-metadane.yml` | `scripts/asc/metadane.mjs` | `docs/wydanie/metadane/*.store.json` | `podglad` | `zapis`; wejście `tylko` (np. `en-US`) = jedna lokalizacja |
| `asc-iap-localizations.yml` | `scripts/asc/iap-localizations.mjs` | `metadane/produkty.store.json` | `dry-run` | `apply` (nie rusza en-US wpisanego przez właściciela) |
| `asc-zrzuty.yml` | `scripts/asc/zrzuty.mjs` | artefakt zrzutów: `<6.9|6.3>/<język>/NN-*.png`, `ipad-13/<język>/NN-*.png` | `dry-run` | `apply` |
| `asc-kontrola.yml` | narzędzie studia (SHA jak Trening) | `docs/wydanie/asc-kontrola.json`, `asc-kontrola-oczekiwane.json` (generowany) | tylko odczyt | — |

- **Nigdy nie usuwają** (klient: GET, POST, PATCH); zapis tylko do edytowalnej wersji; dziennik bez identyfikatorów klucza.
- **Zasada Treningu (pierwszy zapis na jednym elemencie):** `asc-metadane` z `tryb = zapis`, `tylko = en-US` → sprawdzenie w App Store Connect (nazwa, podtytuł, opis, słowa kluczowe en-U.S.) → dopiero potem reszta. Pełny zapis jest blokowany walidacją, dopóki 09 nie dostarczy kompletu pól wszystkich lokalizacji (test: „pola puste”).
- **Różnice względem Treningu (nazwane, zasada 7):** (1) jedno zadanie w środowisku `release` zamiast pary „podgląd bez środowiska” + „zapis w release”, bo sekrety Oczka są sekretami środowiska (strażnik `SEKRET-BEZ-SRODOWISKA`, ADR-0014), a zadanie bez środowiska ich nie widzi; koszt: zatwierdzenie właściciela także dla samego podglądu (jedno na przebieg); (2) źródłem metadanych są pliki EAS `*.store.json` (jedno źródło ze skryptem `sprawdz-wydanie.mjs`), nie trzy pliki `store/app-store-*.json`; (3) grupa subskrypcji znajdowana po nazwie referencyjnej „Oczko Pro”, nie po numerze; (4) trzecie źródło zrzutów: `--ipad` (Oczko ma `supportsTablet`).
- **Działają dopiero po scaleniu do `main`** (§2: `workflow_dispatch` tylko z plikiem na gałęzi domyślnej). Do scalenia: `testflight.yml` (ścieżka istnieje na `main`).
- **Decyzja dla koordynatora D-ASC-K (P-087): `asc-kontrola.yml` i poziom sekretów.** Workflow wielokrotnego użytku nie może mieć `environment`, więc potrzebuje sekretów REPOZYTORIUM (Trening: kontrola 41026478207 przebiegła bez środowiska, czyli Trening ma sekrety na poziomie repozytorium). Opcje: **(a)** właściciel dodaje te same trzy sekrety także w „Repository secrets” Oczka — kontrola działa jak w Treningu, ale sekrety są widoczne dla każdego workflowu na gałęziach z zapisem (repo publiczne: tylko współpracownicy; mniejsza izolacja niż w ADR-0014) · **(b)** workflow zostaje nieużywany (kontrola jest tylko do odczytu), sprawdzenia ustawień robi rola 10 ręcznie z listy przed wysyłką · **(c)** własna kontrola w zadaniu `release` (praca: nowy skrypt; narzędzie studia nie było czytane). Rekomendacja: **(b)** do 1.0, bo (a) osłabia ADR-0014 dla kontroli, którą można zrobić ręcznie raz; wyjątek w `scripts/jakosc/wyjatki.json` istnieje do decyzji. Narzędzie `apps4brew-narzedzia` nie jest w zakresie tej sesji (nieczytane); czy repo jest dostępne dla wywołań z Oczka [DO USTALENIA].
- **Kontrakt z 07 (zrzuty):** artefakt `sklep-zrzuty-ramki` z katalogami `6.9/`, opcjonalnie `6.3/`, `ipad-13/`; w każdym `<język aplikacji>/NN-<ekran>.png` (kody języków jak w `SHOT_LOCALES`: `en`, `nb`, `es-419`…); PNG bez alfy (`file`: „RGB”, nie „RGBA”).

## 4. Formularze — odpowiedzi z podstawą
| Formularz | Odpowiedź | Podstawa |
|---|---|---|
| App Privacy | **Data Not Collected** | Apple: „Collect” to „transmitting data off the device in a way that allows you and/or your third-party partners to access it” (app-privacy-details, odczyt 2026-10-26). Inwentarz 05: brak serwera, SDK reklamowych i analitycznych. Manifesty zależności bez `NSPrivacyCollectedDataTypes` (`sprawdz-wydanie.mjs prywatnosc app.json node_modules` → OK, kod 0). **OP-25 („Zgłoś problem”) rozstrzygnięte:** tekst wysyła użytkownik sam, z podglądem, kanałem, który wybierze; aplikacja nic nie transmituje. Nawet gdyby to liczyć, spełnia „Optional disclosure”: „infrequent cases that are not part of your app’s primary functionality, and which are optional for the user”, „the user affirmatively chooses to provide the data for collection each time”. Jak Trening (właściciel 21.10.2026, Q9 A). Zmiana na „collected” przy włączeniu synchronizacji iCloud: nie, bo prywatna baza CloudKit użytkownika jest niedostępna dla twórcy [OCENA, sprawdzić przy 1.1] |
| Szyfrowanie | NO | §3, krok 9 |
| Wiek | wszystkie kategorie treści: „None”. Brak nieograniczonego dostępu do sieci (import strony WWW jest w 1.1, P-093). Brak treści od innych użytkowników, czatu, mediów społecznościowych, hazardu i kontroli rodzicielskiej. Zakupy w aplikacji: tak | treść aplikacji: liczniki i dane użytkownika, bez treści od innych osób; pytania od 31.01.2026 i o media społecznościowe (Apple Developer News, odczyt 20.10.2026 w module roli) [DO USTALENIA: przejście kwestionariusza przy wpisie] |
| Dostępność (Accessibility Nutrition Labels) | nie deklarować przed audytem 04 | moduł roli: deklaracja tylko z dowodem z audytu 04 (wspólne zadania przechodzą) |
| DSA | §3, krok 10 | — |

### Uzupełnienie E2 (2026-10-30): App Privacy a iCloud, wiek, dostępność
- **Odczyt źródła 2026-10-30** (developer.apple.com/app-store/app-privacy-details/, surowy tekst): „“Collect” refers to transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time.” Zdanie przy „Apple frameworks or services, such as MapKit, CloudKit, or App Analytics”: „If you collect data about your app from Apple frameworks or services, you should indicate what data you collect and how you use it. You are not responsible for disclosing data collected by Apple.” Strona nie rozstrzyga wprost prywatnej bazy CloudKit użytkownika.
- **Dokumentacja CloudKit, odczyt 2026-10-30** (surowy JSON DocC `developer.apple.com/tutorials/data/documentation/cloudkit/ckcontainer/privateclouddatabase.json`, strona `documentation/cloudkit/ckcontainer/privateclouddatabase`): „Only the user can access their private database, by default. They own all of the database’s content and can view and modify that content. Data in the private database isn’t visible in the developer portal.” oraz „Data in the private database counts toward the user’s iCloud storage quota.” Strona produktu (developer.apple.com/icloud/cloudkit/): „Store private data securely in your users’ iCloud accounts”.
- **„Optional disclosure” (ta sama strona App Privacy Details, 2026-10-30):** zwolnienie wymaga spełnienia wszystkich kryteriów, m.in. zbieranie „only in infrequent cases that are not part of your app’s primary functionality” i wprowadzanie danych przez formularz z widoczną nazwą konta. Synchronizacja nie spełnia ich (jest stałą funkcją), więc **na zwolnieniu nie opieramy** deklaracji iCloud; opieramy się na definicji „collect”.
- **Decyzja D-M1 (koordynator P-300: tymczasowo (a); rozstrzygnięcie z dowodem — rola 10, 2026-10-30):**
  | Wariant buildu | Odpowiedź | Podstawa |
  |---|---|---|
  | iCloud **ukryty** (App Store bez ZM-06; `ICLOUD_W_1_0 = false`) | **Data Not Collected** | żadna dana nie opuszcza urządzenia poza działaniami użytkownika (eksport, arkusz udostępniania, pobranie strony wskazanej przez użytkownika) |
  | iCloud **widoczny** (build TestFlight, P-290; App Store po zaliczonym ZM-06) | **Data Not Collected** — przy warunkach niżej | definicja „collect” wymaga, by dane były dostępne dla „you and/or your third-party partners”; dokumentacja CloudKit: tylko użytkownik ma dostęp do prywatnej bazy, a dane „isn’t visible in the developer portal”. Aplikacja nie ma serwera ani SDK, które odczytałyby te dane (inwentarz 05) |
  **Warunki ważności (jeśli którykolwiek upadnie, przejść na deklarację „User Content”, niepowiązaną z tożsamością, bez śledzenia, cel „App Functionality”):** (1) kontener używa wyłącznie `privateCloudDatabase`, bez bazy publicznej i bez udostępniania innym osobom (`CKShare`) — do potwierdzenia przez 08 w kodzie modułu `oczko-icloud` [DO USTALENIA, kod nieczytany w tej sesji]; (2) nie dodajemy analityki CloudKit ani CloudKit Console Telemetry opartej o dane użytkownika. **Ocena, nie norma:** Apple nie mówi wprost „CloudKit private database = nie collected”; wniosek wynika z definicji i dokumentacji. Rozstrzygnięcie nie zmienia się między wariantami buildu, więc formularz nie musi być przepisywany po ZM-06; zmienia się tylko polityka prywatności (sekcja iCloud przy widocznym przełączniku) i notatka dla recenzji.
- **Skan stron („Scan pages”) i aparat:** przetwarzane na urządzeniu (inwentarz 05); bez wpisu w App Privacy. Pobranie strony WWW wskazanej przez użytkownika przy imporcie: sieć do tej strony, bez serwera twórcy; nie jest „collect” w rozumieniu powyżej [OCENA].
- **Wiek:** odpowiedzi jak w tabeli wyżej, a oczekiwany wynik 4+ nadal [DO USTALENIA] do przejścia kwestionariusza przy wpisie przez właściciela (pytanie o nieograniczony dostęp do sieci: import strony WWW pobiera adres wskazany przez użytkownika; czytać pytanie dosłownie przy wpisie i zapisać odpowiedź tu [DO USTALENIA]).
- **Dostępność:** nadal bez deklaracji; po audycie 04 (2.1) wolno deklarować tylko to, co przejdzie wspólne zadania.

## 5. Lista przed wysyłką do App Store (szkielet; dowody przy wysyłce)
1. Build = SHA z werdyktu 07 (brak raportu 07 → nic nie wysyłam). Wersja w `app.json`: dziś `0.1.0`, do zmiany na `1.0.0` (zgłoszenie dla 08, §7). Numer z workflow (D3a).
2. `sprawdz-wydanie.mjs` z kodem 0:
   - `metadane`: OK dla nazw, opisy po przeglądzie zakresu;
   - `prywatnosc`: OK;
   - `sekrety`: **1 BŁĄD rozstrzygnięty — fałszywy alarm**: `.gitleaks.toml:9` to wzorzec reguły gitleaks wykrywającej klucze `.p8` (wyrażenie regularne z nagłówkiem bloku klucza), nie klucz;
   - historii nie sprawdzono, bo klon jest płytki. Siatka asekuracyjna: GitHub sam skanuje sekrety w repo publicznym.
3. UWAGI z `kontrola-ipa.sh` rozstrzygnięte tutaj (lista po pierwszym przebiegu dowodowym).
4. Produkty z kroku 1 w stanie „Ready to Submit” i dołączone do wersji 1.0; Family Sharing i karencja zrobione (kroki 2–3).
5. Adres polityki i wsparcia odpowiada 200, a treść polityki zgadza się z buildem (synchronizacja iCloud ukryta w 1.0, P-091 (1); jej włączenie wymaga zmiany strony).
6. Notatka dla recenzenta (§6) uzupełniona o ścieżki ekranów po przeglądzie zakresu; ≤ 4000 bajtów.
7. Sposób wydania: ręcznie, bez wydania stopniowego na start (D5a); zgody właściciela w dzienniku.

## 6. Notatka dla App Review
**Aktualny tekst (E2, 2026-10-30, 2354 bajty, bez konta demo): `docs/wydanie/metadane/notatka-recenzja.txt`.** Szkic niżej to wersja z 2026-10-26, zachowana jako historia; ścieżki ekranów uzupełnione po przeglądzie zakresu. Do potwierdzenia przez 08 przed wysyłką: zakup dostępny z Ustawień bez wyczerpania limitu (P-206), obecność celu zegarka w buildzie 1.0, brzmienie nazw ekranów.
```text
Purpose: Oczko is a row counter for knitting and crochet projects; all data stays on the device.
Account: none needed. The app has no sign-in and no server.
Main flow: [paths after scope review] 1. Create a project. 2. Tap + on the counter to add rows. 3. Open the project history.
New in this version: first release.
Non-obvious features: Live Activity on the Lock Screen with +1/−1 for the active counter; Apple Watch app with the same counter (works offline and syncs with the phone over WatchConnectivity). No background modes for location or audio.
In-App Purchases: the app is free for 5 knitting days per calendar month (a day counts at the first row added that day). Oczko Pro (monthly and yearly auto-renewable subscriptions, lifetime non-consumable) removes the limit. The purchase screen opens from Settings and from the limit message; Restore purchases and Manage subscription are in Settings. To reach the limit quickly in review: [after scope review].
Data: nothing leaves the device. "Report a problem" shows a preview of a technical text (error codes, record counts) that the user may send themselves via the share sheet. App Privacy: Data Not Collected.
```
Jak zobaczyć limit bez czekania 5 dni (np. ustawienie testowe) — pytanie dla 08 i 07 przed wysyłką; bez tego recenzent nie zobaczy zakupu w naturalnym przepływie (2.1(b): zakupy „visible to the reviewer”).

## 7. Zgłoszenia dla innych ról
| Dla | Zgłoszenie |
|---|---|
| 08 | (1) `ADRESY.polityka` → `https://lkarwowski494.github.io/oczko/privacy.html` razem z `docs/wydanie/adres-strony.json` i testem bazy — gotowa łatka `oczko-warsztat/10-wydanie/adres-polityki-github-io/adres-github-io.patch` (verify 2280/2280); po publikacji w apps4brew-www odwrotnie. (2) `ADRESY.recenzja`: Apple ID z kroku 0. (3) `app.json`: `version` 1.0.0 przed kandydatem; usunąć stary `description` z nazwą 0.1.0; brak `NSCameraUsageDescription` mimo aparatu w inwentarzu 05; typ `.oczko` (ADR-0004). (4) `FAMILY_SHARING = true` po kroku 2. (5) Ustawienie albo scenariusz pokazujący limit recenzentowi (§6) |
| 09 | Polskie nazwy przycisków użyte na stronie (`site/support.html`, `site/privacy.html`): „Zgłoś problem”, „Przywróć zakupy”, „Zarządzaj subskrypcją”, „Importuj kopię”, „Usuń wszystkie dane”, „Ostatnio usunięte” — przekład pl ma je potwierdzić albo podać właściwe; strona dostosuje się do przekładu |
| 11 / 09 | `docs/wzrost.md`, tabela „Nazwa w sklepie”: kolumny „Pod ikoną” i „Pełna nazwa w sklepie” bez zmian z P-174 (sk, sl, fr, da, nb, el: „Oczko”) |
| 05 | OP-25 rozstrzygnięte (Data Not Collected, §4). Inwentarz: dopisać, że „Zgłoś problem” dziś nie zawiera wersji systemu ani modelu urządzenia (kod `src/przypadki-uzycia/zgloszenie.ts`), w odróżnieniu od opisu MetricKit w ADR-0018 |
| 07 | Po pierwszym przebiegu dowodowym: UWAGI `kontrola-ipa.sh` do strategii (które przejdą w BŁĄD przed App Store) |
