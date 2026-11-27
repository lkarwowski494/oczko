# Lista kroków właściciela do wydania 1.0.1 (rola 10 · WY1 · KO-203 · 2026-11-25)

**Po co 1.0.1.** Wyłącznie po to, by w App Store Connect (ASC) wgrać nowe zrzuty ekranu: zrzuty wersji 1.0 są w ASC zablokowane (stan wg polecenia WY1, nie sprawdzony przez tę sesję — **[DO USTALENIA]**: dokładny stan wersji 1.0 w ASC odczytuje właściciel w kroku 1). **Kod aplikacji = build 1221 (tag `v1.0.0-b1221`, a830eb21)**; różnica to pola wersji (dowód: `docs/wydanie/1-0-1-roznica.md`, skrypt `scripts/wydanie/roznica-wersji.mjs`, test `tests/wydanie/roznica-wersji.test.ts`).

**Stan tej sesji:** niczego nie wysłano do ASC, żadnego workflowu nie uruchomiono, brak tagów, `main` nietknięty. Każdy krok „zgoda: tak” = osobne, wyraźne słowa właściciela na to jedno działanie (zasada roli 10 nr 2; zapis w `dziennik.md` robi koordynator).

**Gdzie szukano w Treningu (P-315):** `docs/42-plan-wydania-1.0.md`, `docs/39-lista-kontrolna-wydania.md`, `docs/48-zgloszenie-1-0.md` (repo `lkarwowski494/trening`) — **nie odczytane w tej sesji** (zakres repo sesji = tylko `oczko`; `fakty-wlasciciela.md` mówi o analogii Z-25a/Z-28/Z-31 w `48-zgloszenie-1-0.md`). Odnośniki niżej to wskazówki dla koordynatora, kroki oparte na `docs/wydanie/lista-1-0.md` tego repo.

## Warunki wstępne (po stronie koordynatora — nie kroki właściciela)

| # | Warunek | Dowód / sposób | Stan |
|---|---|---|---|
| W1 | Kod = 1221 | `node scripts/wydanie/roznica-wersji.mjs` kod 0 na SHA gałęzi `claude/wydanie-1-0-1` | w `1-0-1-roznica.md` |
| W2 | Protokół F buildu 1221 w gałęzi | `node scripts/jakosc/bramka-przypadki-uzycia.mjs recenzja 1221` kod 0. **Bez pliku `docs/jakosc/test-fizyczny/1221.md` kontrola 3 bramki `bramka-przypadki` w `testflight.yml` jest czerwona** — gałąź startuje z a830eb21, który tego pliku nie ma (PF1, f9c5a941, P-1009 jest tylko w `main`). Plik skopiowany bajt w bajt z f9c5a941 (P-1041) | zrobione w gałęzi |
| W3 | Zielony „Jakość · iOS” na tym samym SHA | wyzwolenie przez K: `workflow_dispatch` `jakosc-ios.yml`, `ref=claude/wydanie-1-0-1`, `znacznik` = domyślny `[e2e-pelny]` (wyzwalacz push tej gałęzi nie obejmuje, nie zmieniałem workflowu); odczyt: `node scripts/wydanie/testflight.mjs bramka lkarwowski494/oczko <SHA>`. Każdy nowy commit w gałęzi = powtórka (bramka wymaga TEGO SAMEGO SHA) | do zrobienia (K) |
| W4 | Gałąź dopuszczona w środowisku `release` | Settings → Environments → release → Deployment branches: dodać `claude/wydanie-1-0-1` (agent reguł nie odczyta, API 403). Bez tego zadanie `build` nie dostanie sekretów | **[DO USTALENIA]** (W: krok 2) |
| W5 | Wejścia `testflight.yml` | niżej | gotowe |

### Wejścia `testflight.yml` (dispatch REST z `ref`, P-319)

Wspólne: `ref=claude/wydanie-1-0-1`, SHA = HEAD gałęzi po W3 (żaden commit po przebiegu `Jakość · iOS`).

- **(a) przebieg dowodowy bez wysyłki:** `bez_wysylki=true`, `pomin_bramke_e2e=false`, `powod=''`. Robi: bramki (`bramka`, `bramka-przypadki`), pełną budowę, podpis, kontrolę `.ipa` (spójność wersji 1.0.1 w pakietach: `scripts/wydanie/kontrola-ipa.sh`) i walidację Apple; **bez** wysyłki i **bez** tagu. Zgoda W: tak (zatwierdzenie `release`).
- **(b) prawdziwy:** `bez_wysylki=false`, `pomin_bramke_e2e=false`. Wysyła build 1.0.1 do TestFlight i tworzy tag `v1.0.1-b<N>` (`N` = run_number×10 + run_attempt + `PRZESUNIECIE`; ADR-0014). Zgoda W: tak, osobno od (a).
- `pomin_bramke_e2e` **nie** używać (zakaz polecenia WY1); awaria maszyny macOS → jedno ponowienie, potem diagnoza (CLAUDE.md).
- Maszyn macOS zwykle brak ok. 14:00–23:00 UTC (`docs/fakty-wlasciciela.md`); `jakosc-ios.yml` pełny (`[e2e-pelny]`) + `testflight.yml` ≈ kilka godzin zegarowych [OCENA].

## Kroki właściciela (kolejność wynika z zależności)

Czas to szacunek [OCENA], nie pomiar. „Gdzie” — [App Store Connect → Oczko (Apple ID 6823678721)](https://appstoreconnect.apple.com/apps/6823678721).

| # | Krok | Kiedy | Czas W | Zgoda | Analogia w Treningu |
|---|---|---|---|---|---|
| 1 | **Sprawdź stan wersji 1.0 w ASC** (App Store → iOS App → wersja 1.0: stan, zrzuty; odpowiedz koordynatorowi: stan i czy „+ Version or Platform” jest aktywny). Jeśli 1.0 czeka na recenzję albo jest w recenzji, nowa wersja może być niemożliwa — decyzja K | od razu | 3 min | nie | — |
| 2 | **Dopuść gałąź `claude/wydanie-1-0-1`** w środowisku `release` ([Środowiska](https://github.com/lkarwowski494/oczko/settings/environments)); po wydaniu usuń regułę (jak D2 w `lista-1-0.md`) | przed (a) | 2 min | nie | `lista-1-0.md` D2 |
| 3 | **Zatwierdź `release` dla przebiegu (a)** (bez wysyłki) i obejrzyj podsumowanie | po W3 (K wyzwala) | 3 min | **tak** (na przebieg a) | `lista-1-0.md` A1c |
| 4 | **Zatwierdź `release` dla przebiegu (b)** (wysyłka do TestFlight) | po (a) zielonym | 3 min | **tak** (osobno) | `lista-1-0.md` A1c |
| 5 | **Utwórz wersję 1.0.1:** App Store → iOS App → „+ Version or Platform” → iOS → `1.0.1` (stan Prepare for Submission) | gdy stan 1.0 na to pozwala (krok 1) | 2 min | nie (nic nie wysyła) | Trening `48-zgloszenie-1-0.md` (wersja i build) |
| 6 | **„What’s New in This Version”:** K uruchamia `asc-metadane` w trybie `podglad` (tylko odczyt) i potem `zapis`; źródło: `docs/wydanie/metadane/co-nowego-1-0-1.store.json` + `en.store.json` (33 lokalizacje; tekst: „Zaktualizowane zrzuty ekranu w App Store. Aplikacja działa bez zmian.” i odpowiedniki). Zatwierdzenie `release` przy każdym trybie | po 5 | 5 min | **tak** (zapis) | `lista-1-0.md` E13 |
| 7 | **Wygaś starsze buildy** niepotrzebne w TestFlight (1.0.0: 1221 zostaje, jeśli 1.0 jeszcze go używa) — tylko by uniknąć wyboru złego buildu | po 4 | 2 min | nie | `lista-1-0.md` E15, Trening Z-25a |
| 8 | **Zrzuty:** przebieg `zrzuty-sklepu` (ZR8b, kadry 03/04 z gałęzi `claude/zr8-kadry-03-04-2026-11-25`) → `asc-zrzuty` `dry-run` → obejrzeć listę → `apply`. `asc-zrzuty` działa z `main` (P-319) i wgrywa do **edytowalnej** wersji (`PREPARE_FOR_SUBMISSION`, `scripts/asc/zrzuty.mjs`: `EDITABLE_STATES`) — czyli dopiero po kroku 5. Nigdy nie usuwa; grupy, które mają już zrzuty, pomija (**[DO USTALENIA]**: wersja 1.0.1 w ASC dziedziczy zrzuty 1.0; zablokowane zrzuty trzeba w ASC usunąć ręcznie albo `asc-zrzuty` pominie grupę — pokaże dry-run) | po 5; wejścia dostarcza K po ZR8b | 8–15 min | **tak, osobno na dry-run i na apply** | `lista-1-0.md` E14 |
| 9 | **Ocena wyglądu zrzutów** (artefakt `sklep-zrzuty-ramki`) przed krokiem 8 | przed 8 | 5–10 min | nie | `lista-1-0.md` C4 |
| 10 | **Wybierz build 1.0.1** w wersji 1.0.1 (Build → „+”); jeśli „Missing Compliance” → NO (`ITSAppUsesNonExemptEncryption: false`, jak w 1.0, E9) | po 4 i przetworzeniu przez Apple | 3 min | nie | `lista-1-0.md` E16 |
| 11 | **Sposób wydania:** „Manually release this version” (rekomendacja; jak w 1.0, D5a/F6) albo automatyczne — patrz „Decyzja” niżej | przy 10 | 1 min | nie | `lista-1-0.md` E16, F6 |
| 12 | **Przegląd Draft Submissions** (wersja 1.0.1 + build; produkty bez zmian — nie dołączać na nowo, chyba że ASC tego wymaga) | po 6, 8, 10 | 3 min | nie | `lista-1-0.md` F3 |
| 13 | **Zgoda na wysłanie do recenzji** (słowa i data do `dziennika.md`) | po 12 i F1a (poniżej) | 1 min | **tak** | `lista-1-0.md` F2 |
| 14 | **„Submit for Review”** (Draft Submissions → Submit) | po 13 | 5 min | **tak (13)** | `lista-1-0.md` F3 |
| 15 | **Po akceptacji** (zwykle do 48 h, czas Apple, nie agenta): jeśli „Manually release” — **„Release this version”** | po akceptacji | 2 min | **tak** | `lista-1-0.md` F6 |
| 16 | **Po wydaniu:** zrzuty widoczne na stronie sklepu; wiersz „Wydanie” w `dziennik.md`; linia „Etap” w `CLAUDE.md` z datą (K/S) | po 15 | 5 min | nie | `lista-1-0.md` F7 |

**Warunek F1a (protokół F):** `node scripts/jakosc/bramka-przypadki-uzycia.mjs recenzja 1221` jest zielony (W2), ale **dla 1.0.1 (kod identyczny z 1221) protokół osobny nie powstaje**: kontrola 3 czyta protokół *poprzedniego wysłanego buildu* (po wysłaniu 1.0.1 będzie to build 1.0.1 — przy następnym przebiegu `testflight.yml` trzeba będzie protokołu dla niego; **[DO USTALENIA]** czy K chce go od razu, słowami właściciela, zasada 22).

## Decyzja: sposób wydania (rekomendacja)

| Opcja | Plus | Minus |
|---|---|---|
| **A. Ręczne („Manually release”), rekomendacja** | Spójne z 1.0 (D5a); właściciel może obejrzeć zrzuty/stronę przed publikacją (krok 15) | Jeden krok więcej (2 min) |
| B. Automatyczne po akceptacji | Brak kroku właściciela, szybciej | Kod = 1221, więc ryzyko niskie, ale nowe zrzuty idą na stronę bez kontroli po akceptacji |

## Szacunki

- **Czas agenta (K/S):** kroki 3–4 (przebiegi a/b) ≈ kilka godzin zegarowych maszyn macOS, ale czas pracy agenta ≈ 30–60 min; zrzuty (ZR8b) i `asc-*` wg planu roli 11/ZR.
- **Czas właściciela:** suma kolumny „Czas W” ≈ 40–60 min [OCENA], w tym 4 zgody (3, 4, 6, 8×2, 13/14, 15).
- **Czekanie:** maszyny macOS (zwykle brak 14:00–23:00 UTC), przetwarzanie buildu przez Apple, recenzja Apple do ok. 48 h.

## Źródła

`docs/wydanie/lista-1-0.md` (wzór kroków E13–E16, F2–F7), `.github/workflows/testflight.yml`, `.github/workflows/jakosc-ios.yml`, `.github/workflows/asc-metadane.yml`, `.github/workflows/asc-zrzuty.yml`, `scripts/asc/metadane.mjs`, `scripts/asc/zrzuty.mjs`, `scripts/wydanie/testflight.mjs`, `scripts/jakosc/bramka-przypadki-uzycia.mjs`, `docs/jakosc/test-fizyczny/1221.md` (kopia z f9c5a941), `docs/fakty-wlasciciela.md`. Odczyt: 2026-11-25.
