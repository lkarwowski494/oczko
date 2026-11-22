# Co naprawdę zostało do App Store po buildzie 1221 (rola 10 · ZS1 · 2026-11-19)

Polecenie: `docs/koordynacja/polecenia/ZS1.md` (koordynator M9; słowa właściciela: „A - wiele rzeczy jest załatwionych. Sprawdź z ASC i repo trening.”). Ta sesja **tylko czytała** ASC (odczyt wyniku `asc-kontrola` z 19.11 i historii przebiegów przez API GitHub) i repo `lkarwowski494/trening`. Nie zapisano niczego do ASC i nie uruchomiono żadnego workflowu. Pełna lista kroków: `docs/wydanie/lista-1-0.md` (poprawiona w tym samym commicie: 1211 → **1221**, SHA **a830eb21**). Czego z repo nie da się stwierdzić: **[DO USTALENIA]** z jednym zdaniem, jak to sprawdzić.

## 1. Odpowiedź w trzech zdaniach

1. Build **1221 jest VALID w TestFlight** (run 44353461752, tag `v1.0.0-b1221` → a830eb21). Numeru 1211 nigdy nie było (run #21 = failure).
2. W ASC jest dużo więcej zrobione, niż mówiła lista z 18.11: `asc-kontrola` z 19.11 (run 44502801993): OK 16, RÓŻNICA 1, BRAK DANYCH 0, TYLKO RĘCZNIE 1, BŁĄD 0 — ceny, Family Sharing, metadane i adresy w 32 lokalizacjach, kategoria, ocena wieku, dostępność, kontakt recenzenta są zgodne z repo.
3. **Dowodnie brakuje** (a nie „może brakuje”): (i) werdykt 07 i protokół testu fizycznego dla 1221 — bramka `recenzja 1221` jest **CZERWONA** (uruchomiona 19.11: `brak docs/jakosc/test-fizyczny/1221.md`); (ii) zrzuty sklepu w ASC — `asc-zrzuty` nigdy nie wykonał zapisu; (iii) notatka dla recenzenta różni się od pliku (RÓŻNICA w `asc-kontrola`); (iv) lokalizacje 3 produktów w modelu v2 — żadnego przebiegu v2. Reszta (Grace, Copyright, wygaszenie starszych buildów, wybór builda, Submit) to kroki ręczne właściciela bez śladu w repo.

## 2. Stan ASC z dowodem (odczyt 19.11.2026)

Źródło: `asc-kontrola.yml` run [44502801993](https://github.com/lkarwowski494/oczko/actions/runs/44502801993) (19.11, 10:08 UTC, SHA a830eb21, gałąź integracji; konkluzja `failure` tylko dlatego, że skrypt kończy kodem 1 przy RÓŻNICY), log przez `get_job_logs`.

| Obszar | Wynik w ASC | Dowód / uwaga |
|---|---|---|
| Umowa Paid Apps | aktywna (konto wspólne z Treningiem) | Trening `docs/48-zgloszenie-1-0.md:105`; `docs/fakty-wlasciciela.md`; produkty V4 istnieją i mają ceny, więc umowa nie blokuje (inaczej ceny nie dałyby się ustawić) — to wniosek, nie odczyt umowy |
| Produkty IAP (3) | istnieją, ceny USA 0,99 / 6,99 / 14,99 **OK**; brak ofert wprowadzających **OK**; Family Sharing **OK** (3 z 3) | `asc-kontrola` 44502801993; `asc-produkty` runs 41607917964, 41636438130 (3.11, success, 174 kraje) |
| Terytoria | dostępność 174 z 175 krajów (INFO; CHN wykluczone, P-479) | `asc-kontrola` 44502801993 |
| Lokalizacje produktów | **[DO USTALENIA]** — `asc-kontrola` ich nie sprawdza; v1 zapisano 3.11 (runs 41669987521, 41682467953, success), od migracji do v2 (KO-056) żaden przebieg | czy v1 widać w v2 — pokaże dry-run `asc-iap-localizations` (tylko odczyt, ale wymaga Approve `release`) |
| Metadane (nazwa, podtytuł, słowa kluczowe, lista lokalizacji) | 32 lokalizacje zgodne z repo | `asc-kontrola` 44502801993; zapis `asc-metadane` run 41843551731 (4.11, success, 32 zapisane) |
| Privacy Policy URL, Support URL | 32 lokalizacje zgodne | `asc-kontrola` 44502801993 |
| Kategoria | główna LIFESTYLE **OK**; dodatkowa: brak (INFO) | `asc-kontrola` |
| Ocena wiekowa | `SEVENTEEN_PLUS`, `unrestrictedWebAccess=true` (INFO) — zgodne z P-464 i `sklep.md:235` (16+ dla OS 26, 17+ dla starszych) | `asc-kontrola` |
| App Privacy | **TYLKO RĘCZNIE** (API nie udostępnia); „Data Not Collected” wpisane ręcznie 3.11 (P-536) | `asc-kontrola`; lista E4 |
| Kontakt recenzenta | OK; konto demo niewymagane (INFO) | `asc-kontrola` |
| **Notatka dla recenzenta** | **RÓŻNICA** — „różnią się od pliku” (3544 B, zmiana 86021dbd z 10.11) | `asc-kontrola` 44502801993; więc nie wklejona po 10.11 |
| **Zrzuty sklepu w ASC** | **nigdy nie wgrane**: jedyny wpis `asc-zrzuty` to failure po pushu stubu (run 41601040443); zrzuty z `zrzuty-sklepu.yml` run 43396191411 (13.11, success) są tylko artefaktami (ważne do 2026-11-27, surowe do 2026-11-20) na starszym kodzie (39 plików `app/src/modules/assets` zmienionych do builda) | `actions_list` 19.11; lista C1 |
| Build | 1221 VALID, tag `v1.0.0-b1221` | run 44353461752 (#22) success; #21 (44236845571) failure |
| Build wybrany do wersji, Billing Grace, Copyright, kategoria podatkowa, zrzuty recenzji produktów | **`asc-kontrola` tego nie sprawdza** → [DO USTALENIA] (odczyt tylko w ASC, właściciel) | `asc-kontrola` nie ma takich kontroli |

## 3. Trening jako wzór (repo `lkarwowski494/trening`, HEAD 2d97581; wiersze Z-xx w `docs/48-zgloszenie-1-0.md`, numer linii = numer wiersza tabeli)

| Krok | Jak w Treningu | Kto | Dowód |
|---|---|---|---|
| Umowy, DSA | konto wspólne, zweryfikowane | właściciel | `:105` (Z-11), `:117` |
| Metadane | workflow `asc-metadane` podgląd → zapis, Approve `release` | sesja uruchamia, właściciel Approve | `:108` (Z-14) |
| Copyright | **ręcznie** w ASC (workflow nie wypełnia) | właściciel | `:109` (Z-15) |
| Zrzuty | `asc-zrzuty.yml` dry-run → apply (30.10, 64/64) | sesja uruchamia, właściciel Approve | `:110` (Z-16) |
| App Privacy, ocena wieku, kategoria | **ręcznie** | właściciel | `:111`, `:113`, `:114` (Z-17, Z-19, Z-20) |
| Lokalizacje IAP + zrzut zakupu | workflow `iap-localizations` (v1); zrzut `99-zakup-ceny.png` z E2E wgrany ręcznie | sesja + właściciel | `:118` (Z-24); **Trening nie zmigrował do v2** (P-789) — Oczko jest pierwsze |
| Billing Grace Period | ręcznie przez właściciela (3 dni, All Renewals) | właściciel | `docs/18-przekazanie.md` (zapis o gracji) |
| Bramka przed wysyłką | `npm run check:release` (`blokada-wydania.mjs`) | sesja | `:120` (Z-25b) |
| Wygaszenie starszych buildów | ręcznie w TestFlight | właściciel | `:121` (Z-25a) |
| Wybór builda do wersji, „Manual release” | ręcznie | właściciel | `:122`, `:123` (Z-26, Z-27) |
| „Add for Review” → Draft Submissions → Submit | ręcznie (30.10 ok. 10:40, „5 Items Submitted”) | właściciel | `:127` (Z-29) |
| Po akceptacji: test i „Release this version” | ręcznie | właściciel | `:144` (Z-31) |
| „Werdykt 07” i protokół testu | **w Treningu takich pojęć nie ma** (grep `werdykt` w docs 48/49/39/42/20 → pusto); zamiast tego audyt zmian Z-03 (`:86`), pełny katalog E2E Z-06 (`:89`) i lista z telefonu „tylko zmiany” (docs/49), którą wykonał właściciel (Z-08, `:91`) | — | patrz decyzja D-2 poniżej |

Wniosek z wzoru: **kroki ręczne w ASC (Copyright, Grace, wygaszenie buildów, wybór builda, Submit, Release) Trening zostawił właścicielowi i tak samo zostają tu**; workflowami robi się metadane, zrzuty i lokalizacje IAP — tak jak w Oczku.

## 4. Zestawienie punktów listy 1.0 (a = zrobione z dowodem · b = do zrobienia przez sesję · c = do zrobienia przez właściciela)

Czas właściciela [OCENA, jak w liście] osobno od czasu sesji. „Approve” = zatwierdzenie środowiska `release` przez właściciela przy każdym uruchomieniu zapisującym.

### a) Zrobione, z dowodem

| Punkt | Dowód |
|---|---|
| A1 / A1d build 1221 VALID + tag | run 44353461752, `git ls-remote --tags origin 'v1.0.0-b12*'` → b1221 = a830eb21 |
| A5 wiersz w `dziennik.md` | poprawiony w tym commicie (1221, run, a830eb21) |
| B1 `version` 1.0.0; B2 notatka bez zaślepek; B3 id aplikacji w `adresy.ts`; B5 manifest migracji | lista A–F, stan z 18.11 (kod binarki = kod z 01aaeddb, bez zmian w `app/`, `src/`) |
| E0 rekord aplikacji; E2 Family Sharing; E4 App Privacy; E5 ocena 16+; E8 Name; E9 szyfrowanie; E10 DSA; E11 Content Rights | lista E, `asc-kontrola` 44502801993 (E2, E5, E8) |
| E1 produkty V4 + ceny + brak ofert wprowadzających; terytoria; kategoria Lifestyle; metadane 32 lokalizacji; adresy; kontakt recenzenta | `asc-kontrola` 44502801993 (OK 16) |
| K1 wynik przebiegu 1221 | zrobione 19.11 (ZS1) |

### b) Do zrobienia przez sesję (czas W: 0)

| Punkt | Co i jak (wzór z Treningu) | Warunek / uwaga |
|---|---|---|
| K2 / A2 **werdykt 07 dla a830eb21 (1221)** | zlecenie dla roli 07 (Trening: audyt zmian Z-03) | brak pliku w `docs/jakosc/` (jest tylko `werdykt-build-1161.md`); **decyzja koordynatora** D-2 |
| K3 / F1a **protokół testu fizycznego 1221** | `docs/jakosc/test-fizyczny/1221.md`, potem `node scripts/jakosc/bramka-przypadki-uzycia.mjs recenzja 1221` kod 0 | **zrobione 22.11** (commit f9c5a941, P-1009, KO-190): PU-002/121/155 „zrobione: OK” słowami właściciela, pozostałe 58 PU F „pominięte: …” (P-973 i D-2); `recenzja 1221` → zielona, kod 0 |
| K4 / C1 / C2 zrzuty na kandydacie | `zrzuty-sklepu.yml` dispatch (en,pl; iPhone, iPad) na a830eb21; ocena wzrokiem C2 po przebiegu | **artefakty z 13.11 wygasają: surowe 2026-11-20, ramki 2026-11-27**; zakaz poniedziałków i 1–7 dnia miesiąca, maszyn macOS brak zwykle 14:00–23:00 UTC; 19.11 to czwartek (dozwolony); start poza oknem 14:00–23:00 UTC |
| K5 / D1 PR integracji → `main` | otwarcie PR po zielonym CI (CI na a830eb21: do sprawdzenia przed otwarciem) | **scala właściciel** (c); `list_pull_requests` 19.11: brak otwartych |
| K6 / E1a dry-run `asc-iap-localizations` (v2) | uruchomienie dry-run; obejrzenie wierszy `(wersja N, STAN; istniejących lokalizacji: K)` | Approve właściciela; zob. uwaga o D1 niżej |
| E1b zrzut recenzji 3 produktów | `99-zakup-ceny.png` z artefaktu `zrzut-zakupu` (Trening Z-24 — wgrywał właściciel) | wgranie = c; kadr do obejrzenia przez sesję (C7) |
| E17 `asc-kontrola` tuż przed wysyłką | ponowny odczyt (jak Trening Z-10) | tylko odczyt; po wklejeniu notatki RÓŻNICA ma zniknąć |
| F1 lista przed wysyłką `sklep.md` §5, §5a na a830eb21 | ok. 30–40 min sesji | po K2, K4, E17 |
| D3 CI na `main` po scaleniu; K9 | sesja | po D1 |
| K10 wiersze dziennika 1131/1141/1151/1171 | decyzja koordynatora (dopisać bez słów zgody z tamtych dni?) | nie blokuje wydania |
| F7 po wydaniu: `sprawdz-adresy.mjs --wydanie`, wiersz „Wydanie”, linia „Etap” | sesja | po F6 |

### c) Do zrobienia przez właściciela (konto, koszt, scalenie do `main`, wysłanie do Apple)

| # | Krok | Czas W [OCENA] | Zgoda osobna | Stan |
|---|---|---|---|---|
| 1 | Ręczna kontrola na iPhonie, build 1221 z TestFlight: PU-002, PU-121, PU-155 (`docs/wydanie/test-fizyczny.html`: T-02, T-72, T-105) | 20–40 min | nie (słowa KO-158) | **zrobione 22.11** ok. 08:31 UTC: „PU-002 OK, PU-121 OK, PU-155 OK” (commit f9c5a941, P-1009) |
| 2 | Akceptacja podpisów zrzutów en i pl (C5) | 5 min | nie | `podpisy-zrzutow.json` `status.en/pl` = „[DO AKCEPTACJI]” |
| 3 | Ocena wyglądu zrzutów (C4) | 5–10 min | nie | po C1 |
| 4 | **Scalenie PR → `main`** (D1) | 5 min | **tak** | `main` = 52308cd7; patrz uwaga niżej, czy to w ogóle warunek workflowów |
| 5 | Usunięcie reguły gałęzi integracji ze środowiska `release` (D2) | 2 min | nie | po 4 |
| 6 | Lokalizacje produktów: Approve dry-run, apply, drugi apply (E1a) | 8–12 min | **tak** (apply) | żaden przebieg v2 |
| 7 | Notatka dla recenzenta wklejona ponownie z `notatka-recenzja.txt` (E6) | 3 min | nie | **RÓŻNICA** w `asc-kontrola` — dowód, że niewklejona |
| 8 | Billing Grace Period 3 dni, All Renewals (E3) | 2 min | nie | [DO USTALENIA] (brak zapisu; Trening: ręcznie przez właściciela) |
| 9 | Copyright „2026 Łukasz Karwowski” (E7) | 1 min | nie | [DO USTALENIA] (Trening Z-15: ręcznie) |
| 10 | Zrzut zakupu do 3 produktów (E1b) | 5–10 min | nie | po 6 i C1 |
| 11 | Zrzuty do ASC: `asc-zrzuty` dry-run, apply (E14); dwa Approve | 8 min | **tak, osobno** | po C1, C4 |
| 12 | Wygaszenie starszych buildów w TestFlight (E15) | 2 min | nie | [DO USTALENIA] które aktywne (odczyt tylko w ASC); wzór Z-25a |
| 13 | Przygotowanie zgłoszenia: build 1221 do wersji 1.0, „Manually release”, 3 produkty (E16) | 10 min | nie | po 6, 10, 11, 12; wzór Z-26/Z-27 |
| 14 | Zgoda na wysłanie do recenzji (F2) | 1 min | **tak** | po K2, K3 |
| 15 | „Submit for Review” (F3), Draft Submissions → 5 pozycji | 5 min | **tak** | wzór Z-29 |
| 16 | Test po akceptacji tego samego buildu (F5) | 15–20 min | nie | po akceptacji Apple (zwykle do 48 h) |
| 17 | „Release this version” (F6) | 2 min | **tak** | wzór Z-31 |
| 18 | Po wydaniu: instalacja z App Store, ekran ofert (F7) | 5 min | nie | |

**Suma czasu właściciela: 104–143 min [OCENA]** (suma kolumny, bez zmian względem listy z 18.11; do „Submit” 82–116 min, po akceptacji 22–27 min); czekanie: build/zrzuty na macOS (kilkadziesiąt minut), recenzja Apple (zwykle do 48 h). Czas sesji: ok. 2–3 h agenta rozłożone (C1, werdykt, protokół, F1) [OCENA]. Warunkowo poza sumą: E13 (zapis metadanych po zmianie tekstu), F4 (odpowiedź App Review), E12 (kategoria podatkowa u doradcy).

**Uwaga o D1 (scalenie do `main`) — możliwe zmniejszenie liczby kroków właściciela.** Lista CR zakłada, że workflowy ASC ruszą dopiero „po D1” (P-319: workflow z `main`). Dowody pośrednie mówią coś innego: `workflow_dispatch` uruchamia definicję z wybranej gałęzi, a runy `asc-metadane` 41843551731, `asc-kontrola` 44502801993 i `testflight.yml` 44353461752 szły z gałęzi roboczych/integracji, nie z `main`. Reguła gałęzi integracji w środowisku `release` (D2) istnieje właśnie po to. **[DO USTALENIA]** — potwierdzi to dry-run `asc-iap-localizations` z gałęzi integracji (odczyt, jeden Approve). Jeśli zadziała, D1 przestaje być warunkiem kroków 6 i 11 i można go zrobić później albo wcale przed wysyłką do Apple.

## 5. Decyzje właściciela i koordynatora (≥2 opcje, rekomendacja pierwsza)

Decyzje produktowe rozstrzyga koordynator (P-087); właściciel zostaje przy kosztach, kontach, scaleniu do `main` i wysłaniu do Apple.

**D-1 (właściciel, scalenie do `main`, krok 4).**
- **(a, rekomendacja) Zrobić dry-run `asc-iap-localizations` z gałęzi integracji teraz; scalić dopiero, gdy wyniknie potrzeba.** Zysk: 7–15 min i jedna zgoda mniej na krytycznej ścieżce, jeśli dry-run przejdzie; koszt: jeden Approve więcej; ryzyko: dry-run nie przejdzie z gałęzi — wtedy wracasz do (b) bez straty.
- (b) Scalić PR do `main` najpierw (jak zakłada lista CR). Prosto, zgodnie z P-319; koszt: 5 min + krok D2, a scalenie jest poza ścieżką, jeśli (a) zadziała.

**D-2 (koordynator, werdykt 07 i protokół F dla 1221, K2/K3).** Trening nie miał ani werdyktu 07, ani protokołu F; właściciel sam testował listę „tylko zmiany”, a bramką było `check:release` plus audyt Z-03.
- **(a, rekomendacja) Napisać `1221.md` z „zrobione” dla PU-002/121/155 po teście właściciela i „pominięte: …” dla pozostałych F, podpierając się słowami właściciela z 17.11 (KO-158), plus werdykt 07 jako różnicowy audyt zmian 01aaeddb→a830eb21 (3 pliki, nie ma zmian w kodzie binarki).** Koszt: 0 min właściciela, ok. 30 min sesji; ryzyko: słowa z 17.11 dotyczyły builda 1201 (P-973) — czy obejmują 1221, trzeba potwierdzić jednym zdaniem właściciela (**[DO USTALENIA: K3]**).
- (b) Pełny protokół F ręcznie na 61 PU (ok. 61 × kilka minut). Najsilniejszy dowód; koszt: godziny czasu właściciela, wbrew jego decyzji z 17.11 (KO-157/158).
- (c) Wyjątek nazwany w `wyjatki.json` jak P-838 dla 1171. Najtańszy; ryzyko: wyjątek tylko dla 1171 jest precedensem dla nieobjętego buildu, nie dla 1221 — wymaga osobnej decyzji zapisanej w `decyzje.md`.

**D-3 (koordynator, zrzuty sklepu, C1).**
- **(a, rekomendacja) Powtórzyć `zrzuty-sklepu.yml` na a830eb21 (`jezyki=en,pl`, `urzadzenia=iphone,ipad`)** — zrzuty odpowiadają binarce w recenzji; koszt: czas maszyn macOS (okno poza 14:00–23:00 UTC), 0 min właściciela; surowe artefakty z 13.11 wygasają 20.11, więc to i tak jedyna droga, jeśli kod się zmienił.
- (b) Użyć zrzutów z 13.11 (ramki do 27.11): bez kosztu, ale 39 zmienionych plików kodu od tamtego przebiegu — ryzyko wprowadzenia w błąd (wytyczne 2.3.3) i brak surowych po 20.11.

**D-4 (właściciel, wygaszenie starszych buildów w TestFlight, krok 12).**
- **(a, rekomendacja) Wygasić wszystkie poza 1221 jak Trening Z-25a** — nie da się wybrać złego builda w kroku 13; koszt 2 min; nieodwracalne dla testerów starych buildów (tylko właściciel testuje, P-070).
- (b) Pominąć — ryzyko wyboru starego builda do wersji 1.0 przy „+” (E16).

**D-5 (koordynator, słowa zgody dla run #22, A1d).** Czy zgoda właściciela z 17.11 12:40 UTC („Build 9 - A”) obejmuje uruchomienie `testflight.yml` run #22 po poprawce FX7: (a, rekomendacja) potwierdzić w zakładce przebiegu w Actions, kto zatwierdził `release` (0 min, odczyt jednego ekranu), i wpisać do `dziennika.md`; (b) zostawić [DO USTALENIA] — nie blokuje wydania, osłabia ślad zgód.

## 6. Pozostałe [DO USTALENIA] (jedno zdanie, jak sprawdzić)

- Lokalizacje produktów widoczne w v2: dry-run `asc-iap-localizations` (odczyt).
- Billing Grace, Copyright, wybrany build, kategoria podatkowa, wygaszone buildy: odczyt tylko w ASC przez właściciela; `asc-kontrola` tego nie sprawdza (wniosek z logu run 44502801993).
- Przyczyna porażki run #21 (01aaeddb): w logu odczytano tylko ogon; treść błędu — „wg commita FX7/KO-173” (test bramki PU na macOS).
- Zielone CI na a830eb21: w ZS1 nie sprawdzano (lista z 18.11 podaje Linux 44236811881 i iOS 44236811872 dla 01aaeddb; kod binarki ten sam, ale przed PR D1 sprawdzić CI na a830eb21, K5).
