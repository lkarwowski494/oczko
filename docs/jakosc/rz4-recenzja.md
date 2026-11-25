# RZ4 — niezależna recenzja ZR10 (tryb „zastąp” w `asc-zrzuty`)

Rola 07-jakosc, tryb audit · 2026-11-25 · zakres: `git diff f0b28df6..9869751a` (1 commit, 11 plików) · KO-210, P-1048…P-1050.
Żadne wywołanie App Store Connect nie było wykonane (zakaz RZ4). Kodu nie poprawiałem; mutacje i sondy tylko na kopiach w katalogu roboczym sesji (`git worktree` na f0b28df6 i 9869751a), przywróconych po każdej próbie.

## Werdykt: PRZYJĄĆ Z UWAGAMI

- **P1: 0 · P2: 2 · P3: 5.**
- Granica usuwania jest szczelna tam, gdzie ją zbudowano (klient + strażnik ścieżki + bramka stanu wersji), a kolejność i ponowienia zbiegają do stanu docelowego (sondy A i B poniżej). Nie znalazłem ścieżki, która usunęłaby cokolwiek poza placementem.
- Dwie rzeczy zostają po stronie operatora, bo kod ich nie pilnuje, a atrapa ich nie modeluje: (1) lista do zdjęcia opiera się wyłącznie na filtrach po stronie serwera (RZ4-01); (2) test nie sprawdza, że stare placementy zostają, dopóki nowy obraz nie jest przetworzony (RZ4-02). Do pierwszego `apply` wystarczy lista kontrolna dry-runu z końca tego pliku; poprawkę RZ4-01 polecam przed `apply` na wielu językach.

## Znaleziska

### RZ4-01 · P2 · lista do zdjęcia nie weryfikuje grupy ani typu po stronie klienta (utrata danych w sklepie, odwracalna)

- **Gdzie:** `scripts/asc/zrzuty.mjs:197-205` (`listPlacements` mapuje całe `data` na `{id, ref}`, nie czyta `attributes.placementGroup` ani `placementType`), `:182` (`remove: list.map(...)`), `:313-314` (pętla DELETE).
- **Dowód (sonda C, zmodyfikowana atrapa):** serwer ignoruje `filter[placementGroup]`, a w tej samej lokalizacji jest placement grupy `G-IPAD` → przebieg `apply + zastap` kończy się kodem 0, wiersz „zastąp: 8”, **8 × DELETE** (7 własnych + 1 z innej grupy), po przebiegu zostają tylko 3 nowe placementy `G-IPHONE`; placement iPada znika.
- **Testy tego nie widzą:** mutant M11 (usunięty filtr grupy w `listPlacements`) i M12 (usunięty filtr typu) przeżywają wszystkie testy z `tests/wydanie`. Atrapa (`tests/wydanie/zrzuty-zastap-driver.mjs:57`) ma jedną grupę, jeden typ i jedną wersję, i nie czyta `filter[placementType]`.
- **Realność:** brzegowa. Filtry są udokumentowane przez Apple (artykuł „Placing assets on your App Store surfaces”, przykład z `filter[placementType]=APP_SCREENSHOT&filter[placementGroup]=…`; strona GET: „Filter the returned app asset library placements by placement group.”), więc serwer musiałby je zignorować. Skutek, gdyby tak było: zniknięcie zrzutów innej grupy (np. iPada albo Zegarka) z wersji 1.0.1; odwracalne (obrazy zostają w bibliotece, id i `referenceName` są w raporcie).
- **Opcje (decyzja koordynatora):**
  1. *Weryfikacja po stronie klienta w `listPlacements`* (odrzucenie wpisu, gdy `attributes.placementGroup !== group` lub `placementType !== APP_SCREENSHOT`; brak atrybutu → odmowa) + test z drugą grupą i atrapą ignorującą filtry. Koszt: kilka linii i 2 testy; ryzyko: jeśli prawdziwa odpowiedź nie zwraca tych atrybutów, `zastap` odmówi, co wyjdzie dopiero w dry-runie `[DO USTALENIA]` — to bezpieczny kierunek błędu. **Rekomendacja.**
  2. *Wariant łagodniejszy:* odrzucać tylko przy jawnej niezgodności, brak atrybutu przepuszczać. Mniej ochrony, brak ryzyka odmowy.
  3. *Zostawić kod, polegać na liście kontrolnej dry-runu* (liczba do zdjęcia na grupę = 7 wg P-1048). Najtańsze, ale ochrona jest ręczna.

### RZ4-02 · P2 · brak testu, że DELETE czeka na przetworzenie nowych obrazów (luka testowa; kod poprawny)

- **Gdzie:** `scripts/asc/zrzuty.mjs:306` (`waitForImages`) → `:311` (`bad` blokuje) → `:312-314` (DELETE). P-1049 (3) obiecuje „nowe obrazy wgrane i przetworzone → zdjęcie”.
- **Dowód:** mutant M13 (usunięty `await waitForImages(...)`) przeżywa wszystkie testy. Atrapa ustawia `state` obrazu na „gotowy” już przy `PATCH uploaded:true` (`driver:68`), więc stan przetwarzania i `FAILED` nigdy nie występują; w `zrzuty-zastap.test.ts` nie ma słowa `FAILED`.
- **Kod jest poprawny (sonda A):** atrapa, w której obraz po commicie kończy jako `FAILED` → kod 1, **0 × DELETE**, 0 nowych placementów, 7 starych zostaje, komunikat „nic nie zdjęto, strona bez zmian; ponów przebieg”. To wynik sondy, nie testu repo.
- **Rekomendacja:** opcja atrapy „obraz kończy jako FAILED” i „obraz przechodzi UPLOAD_COMPLETE przez n odczytów” + asercja zero DELETE w pierwszym i DELETE dopiero po przetworzeniu w drugim. Zgłaszam jako P2, bo to jedyny punkt, w którym zapowiedziana gwarancja kolejności (obraz przed zdjęciem) nie ma testu.

### RZ4-03 · P3 · ponowny przebieg przy braku `referenceName` w `included` (otwarte P-1050 (a)) — zachowanie opisane i zmierzone

- **Sonda B** (atrapa zwraca `included` bez `referenceName`): przebieg 1 → 7 DELETE + 3 POST placement; przebieg 2 → znowu „zastąp”, 3 DELETE + 3 POST; dry-run po sukcesie nadal pokazuje „zastąp”, nie „pomiń”. Stan końcowy za każdym razem identyczny (3 placementy, 10 obrazów — obrazy ponownie użyte, bez przyrostu). Zbiega, ale każdy przebieg zostawia chwilowo pustą grupę między DELETE a POST (dla wersji w przygotowaniu bez znaczenia). Zgodne z opisem w P-1050 (a). Wniosek do listy kontrolnej: dry-run **po** pierwszym `apply` musi pokazać „pomiń”; jeśli pokaże „zastąp”, odpowiedź nie niesie nazw.

### RZ4-04 · P3 · warstwy dodatkowe bez testu (mutanty równoważne w obecnym kodzie)

- M10 (`allowDelete: true` zawsze w `main`, `zrzuty.mjs:357`) i M14 (`c = client` zamiast `readOnlyClient` w dry-runie, `:272`) przeżywają. Dziś nie da się z nich wyciągnąć DELETE: pętla zdejmowania wymaga `r.remove`, a to wymaga `zastap` w planie; dry-run nie wchodzi do gałęzi `apply`. To druga i trzecia linia obrony, bez testu — jeśli ktoś kiedyś rozluźni plan, nic ich nie zatrzyma. Test mógłby wywołać `main` z atrapą `fetch` albo sprawdzić tekst wiązania.
- M1 (usunięcie `[?#%\\]|\.\.` w `isPlacementDeletePath`) też przeżywa: równoważny, bo regex `PLACEMENT_PATH` (`iap-localizations.mjs:41`, `[A-Za-z0-9_-]+$`) już wyklucza te znaki. Redundancja, nie błąd.

### RZ4-05 · P3 · dowód czerwieni: 30 czerwonych w pliku ZR10 przy deklarowanych 29

- Na f0b28df6 z nowymi testami: 31 nieudanych z 68 w dwóch plikach = 30 w `zrzuty-zastap.test.ts` + 1 w `asc-metadane.test.ts`. `docs/jakosc/zr10-dowod-czerwony.txt` ma 29 ✕ i 7 ✓. Różnica to test „inne skrypty … tworzą klienta bez allowDelete” (`zrzuty-zastap.test.ts:158`): u mnie czerwony (kończy asercją na `iap-localizations.mjs`, `:164`), w dowodzie ZR10 zielony. Powód czerwieni jest właściwy (brak `allowDelete` w starym kodzie), więc nie osłabia dowodu; to rozbieżność w sprawozdaniu, nie w kodzie. Wszystkie pozostałe 29 nazw testów czerwonych zgadzają się z dowodem co do jednego.
- Powody czerwieni sprawdziłem na próbce: „bez flagi zachowanie bez zmian” (stary kod dostaje tablicę z `existing`, `Expected: pomiń / Received: wgraj`), „z allowDelete: DELETE na ścieżce placementu przechodzi” (stary klient odrzuca: `false, 0` zamiast `true, 1`), flaga i wejście workflow (brak w pliku). Właściwe powody.

### RZ4-06 · P3 · zmiana `asc-metadane.test.ts` nie osłabia kontroli, ale jej asercja o obrazach jest słaba

- Stara: `not.toMatch(/'DELETE'|"DELETE"/)` (zero literałów). Nowa: dokładnie jeden literał `DELETE`, dokładny tekst wywołania na placemencie, brak `DELETE`+`appAssetLibraryImages` w literale. Zakaz usuwania obrazów wynika jednak z klienta (M4: usunięcie strażnika → test pada; M15: dopisany DELETE obrazu → pada), nie z tej asercji — asercja łapie tylko dosłowny zapis ścieżki. Ocena: wyjątek nazwany w P-1049, wzmocnienie netto; bez zastrzeżeń.

### RZ4-07 · P3 · odpowiedź DELETE na wersji nieedytowalnej i współdzielenie placementów między wersjami: nieznane

- Strona operacji DELETE nie opisuje stanu wersji i nie wymienia 409 (zgodnie z `zr10-api.md`); skrypt odmawia sam (`REPLACE_STATES`, bramka w `plan` `:154` i `run` `:275`; mutanty M5, M6, M7 zabite). Nie znalazłem w dokumentacji, czy placementy odziedziczone w 1.0.1 są osobnymi zasobami względem placementów wersji 1.0 (wystawionej w sklepie). Lista pochodzi z `GET …/appStoreVersionLocalizations/{id}/placements` lokalizacji wersji w przygotowaniu, więc id są tej lokalizacji; skutek DELETE na wersji 1.0 `[DO USTALENIA]` — pierwszy przebieg najlepiej dla jednego języka (wejście `jezyki`) i sprawdzenie w App Store Connect, że 1.0 jest nietknięta.

## 1. Granica usuwania (zadanie 1)

- **Jedyne miejsce DELETE w repo:** `scripts/asc/zrzuty.mjs:314` (`grep DELETE` po `scripts/` i `.github/workflows/`: poza tym tylko komentarze i strażnik w `iap-localizations.mjs:63-64`). Inne skrypty (`metadane`, `produkty`, IAP) nie przekazują `allowDelete` (test `zrzuty-zastap.test.ts:158`, plus mój odczyt: `produkty.mjs:8` „NIGDY DELETE”).
- **`allowDelete` włącza się tylko przy `--zastap`:** `zrzuty.mjs:357` (`allowDelete: zastap`); `--zastap` dodaje workflow wyłącznie przy `ZASTAP = "true"` (`asc-zrzuty.yml`, oba kroki; wartość przez zmienną środowiska, nie przez wstawienie wyrażenia do powłoki — brak wstrzyknięcia). Domyślnie `false`. Wykonanie jest jednak możliwe tylko w trybie `apply`: gałąź zapisu `:298`, a dry-run używa `readOnlyClient` (`:272`, `metadane.mjs:117`, blokuje wszystko poza GET).
- **Strażnik ścieżki (`iap-localizations.mjs:41-47`, wywołanie `:63-64`):** `isPlacementDeletePath` — regex `^/v1/appAssetLibraryPlacements/[A-Za-z0-9_-]+$` plus odrzucenie `[?#%\\]` i `..`; akceptuje też pełny adres tylko z prefiksem `https://api.appstoreconnect.apple.com`. Sonda na 25 wejściach (`isPlacementDeletePath`, wynik prawda/fałsz):
  - **tak:** `/v1/appAssetLibraryPlacements/abc-1`, `…/ABC_def-9`, to samo z pełnym adresem API;
  - **nie:** końcowy `\n`, końcowy `/`, pusty id, spacja, tabulator, mała litera w `appassetlibraryplacements`, `/V1/`, podścieżka `…/relationships/image`, `%61bc`, `..%2F…`, `?x=1`, `/../x`, znak spoza ASCII, brak wiodącego `/`, `//evil/…`, `http://` (nie https), `api.appstoreconnect.apple.com.evil.test`, `…apple.com@evil.test`, `/v1/appAssetLibraryImages/abc`, liczba, `null`.
  - Po normalizacji WHATWG zaakceptowane wejścia dają dokładnie `https://api.appstoreconnect.apple.com/v1/appAssetLibraryPlacements/<id>`.
  - `id` w pętli zdejmowania pochodzi z odpowiedzi serwera (`data[].id`), więc jest daną niezaufaną; strażnik odrzuci id zawierające znaki specjalne (żądanie nie wyjdzie, błąd trafi do wiersza).
- **Klient:** bez `allowDelete` DELETE odrzucone przed `fetch` (test `:118`); z `allowDelete` tylko ścieżka placementu (test `:124-129`); PUT i inne metody nadal odrzucone (`:150`). `links.next` w stronicowaniu przechodzi sprawdzenie hosta (`API + '/'`) jak dotąd; DELETE nie korzysta z `links.next`.
- **Stan wersji:** `REPLACE_STATES = {PREPARE_FOR_SUBMISSION}` (`:44`), węższy niż `EDITABLE_STATES`; odmowa w `plan` (`:154`, błąd) i wcześniej w `run` (`:275`, kod 1, także w dry-runie, zero zapisów). Mutanty M5 (usunięta bramka w `run`), M6 (w `plan`) i M7 (dodany `REJECTED`) zabite.
- **Luka:** zakres tego, *co* trafia na listę do zdjęcia (grupa, typ) nie jest pilnowany po stronie klienta — RZ4-01.

## 2. Kolejność i ponowienia (zadanie 2)

Kolejność w `run` (`:298-327`): wszystkie obrazy (`obtainImage`: rezerwacja → PUT → PATCH `uploaded:true`, lub ponowne użycie) → `waitForImages` → dla każdego wiersza: błąd któregokolwiek obrazu wiersza przerywa **przed** pierwszym DELETE (`:311`) → DELETE starych → POST nowych → kolejność. Stare obrazy nie są nigdy usuwane.

| Awaria | Stan strony po awarii | Ponowienie |
|---|---|---|
| wgranie/przetwarzanie obrazu (też `FAILED`) | bez zmian (sonda A: 0 × DELETE) | to samo polecenie; obrazy już w bibliotece są użyte ponownie (`findReusable`) |
| DELETE nr k z m | zdjęto k−1, reszta starych zostaje; komunikat „zdjęto k−1 z m” | plan widzi pozostałe stare → „zastąp” z krótszą listą; zbiega |
| wszystkie stare zdjęte, awaria przy POST placementu j | j−1 nowych, brak starych; komunikat „zdjęto m z m, ułożono j−1 z n” | lista ma j−1 nowych (nazwy `oczko-1.0/…`) → długość ≠ n → „zastąp”, zdejmuje j−1, tworzy n; zbiega |
| wszystko zdjęte i położone, awaria przy kolejności | n nowych w kolejności serwera; komunikat „(kolejność nie ustawiona)” | porównanie `ref` w kolejności wyświetlania: zgodna → „pomiń”, niezgodna → „zastąp”; zbiega |
| brak `referenceName` w `included` | stan docelowy poprawny | każdy przebieg robi „zastąp” (RZ4-03); zbiega, bez „pomiń” |

Zbieżność potwierdzają testy ZR10 (`zrzuty-zastap.test.ts`: awaria przy 3. zdjęciu, przy 2. nowym placemencie, przy wgrywaniu obrazu, ponowny przebieg = „pomiń”), a w `P-1049` (4) opisano ten sam mechanizm. Moje sondy A i B dodają przypadek `FAILED` i brak nazw.

Uwaga do założenia „drugi przebieg to »pomiń«”: dotyczy tylko sytuacji, gdy serwer zwraca nazwy (P-1050 (a)).

## 3. Zgodność z dokumentacją Apple (zadanie 3)

Odczyt 2026-11-25 (UTC ok. 17:00–17:20), surowy JSON stron `https://developer.apple.com/tutorials/data/documentation/appstoreconnectapi/<strona>.json`, pole tekstu; cytaty dosłowne. Strony: `delete-v1-appassetlibraryplacements-_id_`, `get-v1-appstoreversionlocalizations-_id_-placements`, `post-v1-appassetlibraryplacements`, `post-v1-appassetlibraryplacementorderingrequests`, `placing-assets-on-your-app-store-surfaces`.

| Element skryptu | Źródło Apple | Zgodność |
|---|---|---|
| `DELETE /v1/appAssetLibraryPlacements/{id}` → 204 | https://developer.apple.com/documentation/appstoreconnectapi/delete-v1-appassetlibraryplacements-_id_ — „Delete an app asset library placement.”; artykuł: „Remove a placement with `DELETE /v1/appAssetLibraryPlacements/{id}`, which returns `204 No Content`.” | tak |
| zdjęcie placementu zostawia obraz | artykuł https://developer.apple.com/documentation/appstoreconnectapi/placing-assets-on-your-app-store-surfaces: „This removes the asset from that surface but leaves the underlying asset in your library, along with any other placements that reuse it.” | tak |
| zamiana = usuń placement, utwórz nowy, ułóż kolejność | tamże: „You can’t change a placement after you create it. […] To show a different asset in the same spot, delete the placement, create a new one that relates to the new asset, and then reorder the group so the new placement takes the old one’s position.” | tak (dokładnie ten przepis) |
| odczyt placementów grupy | tamże: `GET /v1/appStoreVersionLocalizations/{id}/placements?filter[placementType]=APP_SCREENSHOT&filter[placementGroup]=…&sort=placementGroupPosition&include=image&fields[appAssetLibraryImages]=referenceName,state,imageAsset`; „Sorting by placementGroupPosition returns the placements in the order they display.”; strona GET: „Filter the returned app asset library placements by placement type.” / „…by placement group.” | tak (zapytanie z artykułu, plus `limit=200` — parametr listy, nie sprawdzałem górnej granicy `limit` `[DO USTALENIA]`) |
| limit grupy | artykuł: „for App Store versions that’s 10 screenshots, 3 app previews, and 1 product page header asset per group.”; skrypt czyta `groupLimits` z danych referencyjnych | tak; usunięcie starych przed dodaniem nowych jest wręcz konieczne (7 + n > 10) |
| nieedytowalna wersja | artykuł: „The parent surface has to be editable. You can’t add a placement to … App Store version that’s already approved” (przykład `409 STATE_ERROR.INVALID_STATE`); strona DELETE: lista odpowiedzi bez 409, stan wersji nie opisany | częściowo — DELETE: `[DO USTALENIA]`; skrypt odmawia sam, węziej niż Apple (tylko `PREPARE_FOR_SUBMISSION`) |
| kolejność | artykuł: „Provide the placementGroup you’re ordering, list the placement IDs in orderedPlacements in the sequence you want, and relate the request to the target localization”; „Ordering is scoped to one placement group within one localization, so reorder each group separately.” | tak (POST na `/v1/appAssetLibraryPlacementOrderingRequests`, grupa w atrybutach, `orderedPlacements` i `appStoreVersionLocalization` w relacjach) |

Rozbieżności z dokumentacją: brak. Ograniczenie: przykłady Apple nie pokazują ciała odpowiedzi `GET …/placements` w całości, więc to, czy `attributes` placementu zawiera `placementGroup`/`placementType` i czy `included` niesie `referenceName`, jest nieznane do dry-runu (RZ4-01, RZ4-03).

## 4. Testy (zadanie 4)

- **Czerwień przed kodem:** nowe testy na kopii f0b28df6: 31 nieudanych / 37 zaliczonych z 68 (dwa pliki: `zrzuty-zastap.test.ts`, `asc-metadane.test.ts`); powody właściwe (brak `allowDelete`, brak flagi, brak wejścia workflow, stary `existing` zwraca liczbę). 29 z 30 nazw zgodnych z `zr10-dowod-czerwony.txt`, szczegóły w RZ4-05. Zielone po zmianie: 68/68.
- **Mutanty (JAK-04)**, 15 zmian pojedynczych na kopii 9869751a; cały katalog `tests/wydanie` jako detektor:

| # | Mutacja | Wynik |
|---|---|---|
| M1 | strażnik: usunięty zakaz `? # % \ ..` | przeżył (równoważny: regex już to wyklucza) |
| M2 | strażnik: regex bez kotwicy końca | zabity |
| M3 | `allowDelete` domyślnie `true` | zabity |
| M4 | DELETE wolno na każdej ścieżce | zabity |
| M5 | `run` bez bramki stanu wersji | zabity |
| M6 | `plan` bez bramki stanu wersji | zabity |
| M7 | `REPLACE_STATES` + `REJECTED` | zabity |
| M8 | błąd obrazu nie blokuje zdejmowania | zabity |
| M9 | idempotencja bez porównania długości | zabity |
| M10 | `main`: `allowDelete: true` zawsze | **przeżył** (RZ4-04) |
| M11 | `listPlacements` bez filtra grupy | **przeżył** (RZ4-01) |
| M12 | `listPlacements` bez filtra typu | **przeżył** (RZ4-01) |
| M13 | brak `waitForImages` przed zdejmowaniem | **przeżył** (RZ4-02) |
| M14 | dry-run bez `readOnlyClient` | przeżył (równoważny dziś, RZ4-04) |
| M15 | dopisany DELETE obrazu biblioteki | zabity |

  Zabite: 9 z 15; z sześciu przeżywających trzy to realne luki testowe (M11, M12 — RZ4-01; M13 — RZ4-02), trzy to warstwy zapasowe (M1 równoważny, M10 i M14 bez ścieżki do DELETE w dzisiejszym planie).
- **Zmiana `asc-metadane.test.ts`:** ocena w RZ4-06 (nie osłabia).
- **Przypadki brzegowe z punktów 1–2 a testy:** bramka stanu (6 stanów w planie, 3 w `run`) — jest; błąd obrazu → zero DELETE — jest (wgrywanie), `FAILED` przetwarzania — **brak** (RZ4-02); awarie w środku i zbieżność — są; grupa/typ w liście do zdjęcia — **brak** (RZ4-01); brak `referenceName` — brak testu (zachowanie zmierzone sondą B, RZ4-03); strażnik ścieżki — testy dla obrazu i innych zasobów, brak dla kodowania/`..` (równoważne dzięki regexowi).

## 5. Bramka (zadanie 5)

`npm ci` (exit 0) i `npm run verify` na 9869751a: **exit 0, 741 zestawów, 8314 testów, wszystkie zielone** — zgodnie z `docs/jakosc/zr10-verify.txt`. Pełny zapis: `docs/jakosc/rz4-verify.txt`. Pierwszy przebieg odpaliłem za wcześnie, w trakcie `npm ci` (≈185 błędów TS z niekompletnych `node_modules`); odrzucony, powtórzony po `npm ci`.

## 6. Lista kontrolna pierwszego dry-runu na prawdziwym ASC

Dry-run z `zastap=true`, tryb `dry-run`, najlepiej `jezyki=en` (jedna lokalizacja). Zero zapisów gwarantuje `readOnlyClient`.

1. Kod wyjścia 0 i brak „Odmowa zastąpienia”; stan wersji w logu = `PREPARE_FOR_SUBMISSION` (inaczej skrypt odmówi).
2. Dla każdej grupy wiersz „zastąp — zdejmę 7 placementów, wgram n” (7 wg P-1048, n = liczba plików); **liczba do zdjęcia musi być równa liczbie odziedziczonych w tej grupie** (kontrola RZ4-01). Liczba inna niż 7 → stop i pytanie do koordynatora.
3. Lista „Placementy do zdjęcia”: id i `referenceName` każdego; żaden wpis nie może wyglądać na zrzut innej grupy (iPad w grupie iPhone’a i odwrotnie) ani innego typu.
4. `referenceName` niepuste przy każdym placemencie (odpowiedź niesie nazwy — P-1050 (a)). Wiele wpisów „bez nazwy” → idempotencja nie zadziała (RZ4-03).
5. „W bibliotece już x z y obrazów planu” — wartość wiarygodna względem poprzednich przebiegów.
6. Lokalizacje z „pomiń — brak lokalizacji wersji” — zgodne z oczekiwaniem (nie ma być ich dla języków, które mają mieć zrzuty).
7. Sekcja raportu kończy się „Dry-run zakończony — nic nie zapisano i nie zdjęto”; w logu brak tokenu i adresów wgrywania.

Po pierwszym `apply` (jeden język):
8. W App Store Connect: wersja **1.0 w sklepie nietknięta** (RZ4-07), wersja 1.0.1 ma w grupach dokładnie nowe zrzuty w kolejności artefaktu, obrazy odziedziczone nadal są w bibliotece.
9. Dry-run po `apply` z tym samym wejściem pokazuje „pomiń — grupa już zawiera te zrzuty” (jeśli „zastąp”: RZ4-03).
10. Dopiero potem pozostałe języki.

## 7. Czego nie sprawdziłem

- Prawdziwego serwera (zakaz); wszystkie sondy i atrapa modelują dokumentację, nie ASC.
- Górnej granicy parametru `limit=200` w `GET …/placements`.
- Zachowania DELETE na wersji nieedytowalnej (strona milczy) i współdzielenia placementów między wersjami.
- Treści workflowu poza różnicą (inne kroki, artefakt zrzutów) — nie były w zakresie.

## 8. Odtworzenie sond

Sondy A, B, C: kopie `tests/wydanie/zrzuty-zastap-driver.mjs` z jedną zmianą w atrapie, uruchamiane `node <sterownik> '<JSON scenariusza>'`:
- A: `if (a.uploaded) o.state = 'PREPARE_FOR_SUBMISSION';` → `… = 'FAILED';`; scenariusz `{"stare":7,"nowe":3,"kroki":[{"apply":true,"zastap":true}]}`.
- B: `attributes: { referenceName: obrazy.get(x.image)?.referenceName }` → `attributes: {}`; scenariusz z dwoma `apply+zastap` i dry-runem.
- C: `(!grupa || x.group === grupa)` → `true`, plus dodany placement `{ group: 'G-IPAD' }` w tej samej lokalizacji.
Mutanty M1–M15: zamiana ciągów w `scripts/asc/zrzuty.mjs` i `iap-localizations.mjs` na kopii, `npx jest tests/wydanie`, przywrócenie pliku po każdej próbie.
