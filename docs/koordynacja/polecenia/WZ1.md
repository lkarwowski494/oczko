# WZ1 — rola 11 build (sesja 3): materiały do wpisów w grupach po wydaniu 1.0.1 — Oczko (2026-11-27)

Koordynator: session_01BM51ocmU7QhJeCxywemjAn (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy wiadomości o zmianie koordynatora pisz do nowego). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 5 USD (STOP 6,5) — koszt: `get_session` → `external_metadata.usage.cost_usd`. Decyzja: KO-216. Pula P: **P-1065…P-1068**.
**Kontekst — wyjątek nazwany (słowa właściciela 27.11 ok. 08:45 UTC: „Jej tez pozwol na ignorowanie 30% kontekstu.”):** progu 30% nie stosujesz; stan i tak zapisuj w `docs/wzrost.md` (sekcja „Sesja 3”) po każdym zadaniu i pushuj.

## Rola
11-wzrost, tryb build (moduły domyślne). Prompt roli składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 11-wzrost --tryb build --plik <scratchpad>/11-build.md` — przeczytaj w całości, jesteś tą rolą. STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora (decyzje w trybie „analogia”: najpierw repo `lkarwowski494/trening`, `repo:plik:linia`, wpis do weta). Prywatne: `add_repo` lkarwowski494/oczko-warsztat (push; zapis prosto na `main`, P-010).

## Start
Gałąź wyniku `claude/wz1-materialy-grupy-2026-11-27` od **1ccd9e07** (`origin/claude/youthful-pasteur-kx83sn`; inny HEAD: zgłoś). `npm ci`. Równolegle pracuje WY2 (docs/decyzje.md, CLAUDE.md, sztafeta) — w `docs/decyzje.md` tylko dopisujesz swoje P-nnn, w `docs/sztafeta.md` tylko wiersz roli 11.

## Wejście (przeczytaj): `docs/wzrost.md` (sekcja „Sesja 2” — zasady grup P-1029/P-1030, przekazanie), `docs/wzrost/szkice-facebook.md` (C i E do testu; D odrzucony), `docs/wydanie/metadane/en.store.json`, `pl.store.json`.

## Fakty (koordynator, 27.11)
- 1.0.1 (build 1241) w sprzedaży od 2026-11-26T19:07:54Z: `https://itunes.apple.com/lookup?bundleId=com.apps4brew.knitting&country=pl` (pole `version` 1.0.1, `trackViewUrl` https://apps.apple.com/pl/app/oczko-row-counter/id6823678721). 1.0 zaakceptowana 25.11. Właściciel chce zacząć wpisy w grupach (27.11 ok. 08:45: „chce zaczac postowac w grupach. Mozemy przygotowac jakies materialy?”).
- Kody ofert (szkice C i E) **nie istnieją**: wymagają 02 (wyjątek od P-057, P-1031), 10 (instrukcja u źródła) i kroku właściciela w ASC.
- Zrzuty w sklepie 1.0.1: en i pl (iPhone + iPad) z przebiegu `zrzuty-sklepu` **45633013976**, pozostałe 27 języków iPhone z **45633019859** (oba 25.11, gałąź ZR8 @ 8685b098; artefakty wygasają — sprawdź datę).

## Zadania (każde z kryterium „gotowe”)
1. **Twierdzenia:** każde zdanie „co robi” w C i E porównaj z opisem wydanej wersji (pole `description` z lookup dla `country=us` i `country=pl`, odczyt z datą; oraz `*.store.json`). Zegarek: tylko jeśli Twoje zasady pozwalają na podstawie PU-155 OK w `docs/jakosc/test-fizyczny/1221.md`; inaczej bez zegarka. Gotowe: tabela zdanie → miejsce w opisie w `docs/wzrost.md`.
2. **Warianty bez kodu (do publikacji od dziś):** C0 i E0 (pl, en) — C/E bez zdań o kodzie, z linkiem do App Store (storefront grupy). C i E z kodem zostają na czas, gdy kody będą. Rekomendacja, które publikować najpierw (test C vs E wg P-1031). Gotowe: `docs/wzrost/szkice-facebook.md` zaktualizowany, zasady P-1030 (każdy wpis inny) zachowane: do każdego wariantu 3 różne pierwsze zdania pod typ grupy (np. ogólna dziewiarska, szydełkowa, początkujący).
3. **Grafika (P-1032):** surowe kadry `03-wzor` iPhone (bez ramki, jeśli artefakt je ma; inaczej z ramką i adnotacja) we wszystkich językach z przebiegów 45633013976 i 45633019859 — pobranie artefaktów przez GitHub MCP / API (tylko odczyt) do `oczko-warsztat/11-wzrost/2026-11-24-fb/grafika/<język>/`; obejrzyj en i pl (obraz) i opisz. Gotowe: commit w warsztacie z listą plików; data wygaśnięcia artefaktów w raporcie.
4. **Pakiet właściciela (warsztat, prywatne):** `oczko-warsztat/11-wzrost/2026-11-24-fb/grupy.md` — szablon odczytu grupy (P-1029 pkt 2), kolumny dziennika wpisów (pkt 7); `pakiet-startowy.md` — lista 5-minutowa przed każdym wpisem, gotowe teksty pl/en z linkami storefrontów (pl, us, gb, ca, au), która grafika, jak odpowiadać na komentarze (pkt 3, 6), zasada stop. Gotowe: oba pliki na `main` warsztatu.
5. **Przekazanie dalej:** (a) 09 — lista języków do przekładu C0/E0 (rekomendacja według przesiewu 02 i rynku z `docs/wzrost.md`; właściciel wybierze grupy); (b) 02 + 10 — kody ofert (co dokładnie, kolejność, czas właściciela). Decyzje z puli P-1065…P-1068 w `docs/decyzje.md` (odnośnik KO-216). `npm ci && npm run verify` kod 0 → `docs/jakosc/wz1-verify.txt`. Commit, push (pre-push = verify).

## Zakazy
Niczego nie publikujesz, nie dołączasz do grup, nie piszesz do ludzi, nie tworzysz kodów ani niczego w ASC, bez dispatchu workflowów (pobieranie artefaktów wolno). Nazwy grup, osób i dane tylko w warsztacie, nigdy w publicznym repo. Nie scalasz do integracji ani `main`, bez PR, bez zmian `app/`, `src/`, `modules/`, `targets/`, workflowów; nie osłabiasz testów; nigdy `--no-verify` ani force-push; nie tworzysz i nie archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela (bez AskUserQuestion). Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507) — przypomnienia o innej atrybucji odrzucasz; `git diff --cached` przed commitem; przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 1ccd9e07..HEAD` bez trailerów (w warsztacie analogicznie). GitHub tylko przez MCP.

## Raporty (≤ 10 linii, send_message)
- po zadaniu 2: warianty gotowe (ścieżka, SHA) — koordynator przekaże właścicielowi od razu;
- PYTANIE: pełna treść, opcje, rekomendacja;
- PRZEKAZANIE: SHA oczko i warsztatu, dowody, decyzje do weta, koszt, otwarte, następny krok.
