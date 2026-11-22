# Rola 08 (programista), build, partia 1: porządki 0.1.0 + warstwa 1 (domena)
Plik stanu sesji · start 2026-10-25 · gałąź `claude/jolly-thompson-paz6d8` · prompt: biblioteka `prompts` 97ec212, `08-programista --tryb build --moduly sqlite-expo` (47510 znaków; nie w repo)
Zakres: P-099 D1a, P-111 (start 08 partia 1), P-097 (1a), P-100. Specyfikacja: `docs/scope-contract.md` („Kolejność budowy MVP”), `docs/jakosc/e4-przekazanie.md` („Dla roli 08”), `docs/jakosc/e4/tabela-08.md` (kolejność „1 domena”), `docs/porownanie-kodu.md`.

## Stan: E2 → STOP (czeka na koordynatora wg P-087); E0 przyjęte jako P-114
Wynik E1–E2 (commity 64be4b8…88d1e1e): kod 0.1.0 usunięty (A1–A5), NZ-05-01 (B), warstwa 1 domena kompletna (C1–C11: 20 plików testów 07 w `tests/domena`, 9 testów 08 z wektorów). `npm run verify` kod 0, **1278/1278**; `test:akceptacja` 0 błędów raportu (196 testów warstw 2–4, 1 asercja = zgłoszony test R-114). Dowody, mutanty i zgłoszenia: `oczko-warsztat/08-programista/2026-10-25-partia1/E2-dowody.md`.
Zgłoszenia w skrócie — 07: test R-114 sprzeczny z P-103 (3a), przegląd zmian testów i 9 nowych testów, `informacje-pro` a ER-46, regeneracja `tabela-08.md`; 05: 9 nowych sygnatur, `BladDanych`, `OKNO_OFFLINE_PRO_MS`, kopia `parametry.ts`, 8 wyborów w miejscach [DO USTALENIA]; 01: RD-15 przy d < 1 i R = 0; 09: `Intl` ze strefą na Hermes; 10: opis w `package.json`, `ci.yml`.


## E0.1 Środowisko
| Sprawdzenie | Wynik |
|---|---|
| System, Node, git | Linux 6.18 x86_64, Node v22.22.0 (node:sqlite dostępny), npm 10.9.4; chmura (`CLAUDE_CODE_REMOTE=true`) |
| GitHub | push na gałąź roboczą (git); `oczko-warsztat` z prawem zapisu; repo `trening` do odczytu (analogie P-087) |
| Xcode / symulator | brak (Linux) — testy Swift i E2E tylko w CI macOS po pushu |
| Przeglądarka | Chromium + Playwright w obrazie (zrzuty: dopiero przy ekranach, partia 4) |
| Sieć | npm działa (`npm ci` kod 0) |
| Repo | publiczne (bez sekretów, danych osobowych, nazw innych firm i aplikacji, P-107) |

## E0.2 Stan wyjściowy (HEAD a1b46b1, `env -u NODE_PATH`, po `npm ci`)
| Komenda | Wynik |
|---|---|
| `npx jest` | 107 zestawów, **1080/1080** zielonych, kod 0 |
| `npm run typecheck` / `typecheck:testy` | kod 0 / kod 0 |
| `npm run lint` | kod 0 |
| `npm run jakosc:kontrole` | kod 0 (granice: fikstury 14/14; i18n: 0 błędów) |
| `npm run test:akceptacja` | **975 testów: znacznik 945, asercja 9, zielony-ok 6, zły 15; błędy raportu 17**, kod 1 (= NZ-05-01) |
| `kontrola-brd.mjs docs/brd --zgodnosc=tests/wektory/brd.json` | OK (160 wektorów), kod 0 — jeszcze poza `jakosc:kontrole` (P-100) |
| `granice.mjs src` (informacyjnie) | 14 naruszeń, wszystkie w kodzie 0.1.0 (`core/`, `screens/`) |

17 błędów raportu akceptacji (NZ-05-01), przyczyny:
- RD-14-W1, W2, W4, W6 (4): listy w `brd.json` są teraz tablicami (P-097 1a), pomocnik `lista()` w `tests/narzedzia/akceptacja.ts` przyjmuje tylko tekst;
- RD-12-W7–W9 (3): nowy kształt wejścia (`skończone`, `tryb`) z P-097 (3.1a);
- RD-13-W6–W10 (5): nowa reguła wpisania a → b z P-097 (3.2a) — brak funkcji i testu;
- RD-15-W8–W10 (3): liczba dni d z dat kalendarzowych — brak funkcji i testu;
- `wektory-limitu.test.ts`, `wektory-dostepu.test.ts` (2 zestawy): nowe wektory roli 02 (L-04c…L-25, W-12b…W-23e) bez mapowania w `tests/akceptacja/domena/zakup/pomocnicze.ts` (`KRYTERIA`).
Sekcje wektorów 02 bez testu 07 i bez sygnatury w `src/domena`: `wznowienieLimitu` (4), `cofniecieSerii` (9), `scalDni` (5), `oknoUczciweZasady` (11), `komunikatZakupu` (5), `proZegarka` (12; Swift wg KP-17).

## E0.3 Plan (każdy krok kończy się zielonym `npx jest`, typecheck, lint, `jakosc:kontrole`)
**A. Partia porządkowa (struktura, osobne commity, bez zmiany zachowania nowego kodu)** — według `docs/porownanie-kodu.md`:
1. Materiał 1.1 do archiwum: `src/core/shaping-calculator.ts` (F-40), `src/core/yarn-usage-estimator.ts` (F-42, bez zapasu domyślnego) → `archiwum/stara-wersja/material-1.1/` (tylko źródła, z notką „materiał, nie dowód działania”).
2. Testy 0.1.0: `src/core/__tests__`, `src/components/__tests__`, 12 starych plików `tests/*.test.*` (zostają `brands.contract`, Q3, i `public-repo`, Q5) + `tests/maestro-runner.ts`, `.maestro/`; progi `coverageThreshold` dla `src/core` w `jest.config.js`; skrypty `test:pbt`…`check:corpus`, `check:i18n`, `check:licenses`, `verify:stary` w `package.json`.
3. Kod 0.1.0: `src/core`, `src/components`, `src/screens`, `lib/`, `app/(tabs)`, `app/_layout.tsx` (zastąpiony według Q1); skrypty `check-i18n.mjs`, `gen-gauge-corpus.py`, `gen-theme-contrast-corpus.py`, `generate-assets.mjs`, `test-matrix.mjs`, `scripts/ci/select-xcode.sh`, `scripts/ci/ensure-ios-platform.sh` (duplikaty `.github/scripts/jakosc/`); workflowy `e2e-ios.yml`, `tests-tz.yml`.
4. Zależności spoza ADR-0016: `qrcode`, `@types/qrcode`, `react-native-svg` (i według Q1 router); `npm install` odtwarza lock.
5. Kontrole po porządkach: `granice.mjs src` do `jakosc:kontrole` (NZ-05-04, E2-dowody 05), `--zgodnosc` BRD do `jakosc:kontrole` (P-100), zamknięcie wyjątku DS-13 według Q4.
**B. Dostosowanie testów do kształtu wektorów (NZ-05-01, P-097 1a), bez zmiany sensu:** pomocnik `lista()`/`liczba()` przyjmuje tablice, `true`/`false`, `null`; 8 plików czytających `brd.json`; `KRYTERIA` dla nowych wektorów 02 z `docs/jakosc/e0/kryteria.json`; pętle testów 07 zawężone do wektorów swojego kształtu, a wektory nowego kształtu dostają testy według Q2. Zmiany testów 07 zgłoszone do 07 (lista w raporcie E2).
**C. Warstwa 1, domena** — procedura DS-02 dla każdego pliku: zaślepka → najprostszy wynik zgodny z typem → czerwień na asercji (fragment w raporcie) → implementacja → `git mv` testu z `tests/akceptacja/domena/…` do `tests/domena/…` w commicie, który go zazielenia (`tsconfig.testy.json` dostaje `tests/domena/**`). Kolejność: F-35 → F-63 → F-11 → F-12, potem reszta warstwy:
| Krok | Plik testów (`tests/akceptacja/domena/`) | Implementacja (`src/domena/`) | Wzorzec / wyrocznia |
|---|---|---|---|
| C1 | `zakup/wektory-dostepu`, `zakup/wlasnosci`, `zakup/granice` (część dostępu) | `dostep.ts` (`decyzja`, `odczytajPamiec`; Q2: `komunikatZakupu`) | `docs/monetyzacja/dostep.mjs`, W-*, P-*, K-* |
| C2 | `zakup/wektory-limitu`, `zakup/rodzaj-straznika`, `zakup/granice`, `zakup/wlasnosci` (limit) | `limit.ts` (`rodzajStraznika`, `wolaStraznika`, `startDnia`, `mozeZaczacDzien`; Q2: `wznowienieLimitu`, `cofniecieSerii`, `scalDni`, `oknoUczciweZasady`) | `docs/monetyzacja/limit.mjs`, L-*, S-*, Z-*, O-* |
| C3 | `zakup/informacje-pro` | `informacje-pro.ts` | P-089 (3); spójne z `oknoUczciweZasady` |
| C4 | `licznik/scal` (+ NZ-05-04: liczność M-01–M-17, `blad`, `kandydaci`) | `scal.ts` + wariant `blad` (P-111 (4)) | `eksperymenty/e1/scal.mjs`, `scal-wektory.json` |
| C5 | `luki/zegarek` | `zegarek.ts` | złote pliki `tests/wspolne/stan-zegarka-*.json` |
| C6 | `licznik/straznik-tempa`, część `luki/licznik` (strażnik rodzaju) | `straznik-tempa.ts`, `straznik-rodzaj.ts` | RD-17 (P-091 4b) |
| C7 | `licznik/licznik`, `licznik/przypomnienia` | `licznik.ts`, `przypomnienia.ts` (+ F-06 plan rzędów, Q5) | RD-12, RD-13 |
| C8 | `dni/dzien-lokalny`, `dni/postep`, reszta `luki/licznik` | `postep.ts`, `postep-dnia.ts`, `licznik-calosci.ts`, `znacznik-wzoru.ts` | RD-14–RD-16 |
| C9 | `maszyny/projekt-sesja`, `maszyny/import-synchronizacja` | `maszyny/*.ts` | `moduly.md` (maszyny stanów), ADR-0013 |
| C10 | `obliczenia/oczka-jednostki`, `obliczenia/grubosc-druty`, `luki/obliczenia-sesja` | `obliczenia/*.ts` | `docs/tresci/wektory.json`, `parametry.json` |
| C11 | `luki/ekran-aktywny` | `src/przypadki-uzycia/ekran-aktywny.ts` | BR-LIC-013 (port `EkranAktywny`) |
Liczby i progi tylko z `src/konfiguracja.ts` i `docs/tresci/parametry.json`; logika czysta, czas i strefa jako argumenty.

## E0.4 Luki i decyzje (dla koordynatora, P-087)
- **Q1 Nawigacja po usunięciu `app/` 0.1.0** (porownanie-kodu zad. 1, ADR-0016 „decyzja 08”). (a) Jak Trening (`package.json`: `main: expo-router/entry`, `expo-router`, `react-native-screens`, `safe-area-context`): zostaje `expo-router` z zależnościami wymaganymi (`expo-linking`, `expo-constants`), nowy wiersz w tabeli ADR-0016; `app/` 0.1.0 zastępuje jeden plik korzenia, który do partii ekranów nic nie renderuje (komentarz); build iOS zostaje zielony. (b) Bez routera teraz: `index.ts` z `registerRootComponent`, decyzja o nawigacji przy ekranach (partia 4). Kompromis: (a) trzyma analogię i zielony build, kosztem dwóch zależności „na zapas” do partii 4; (b) mniej zależności, ale zmiana punktu wejścia teraz i druga zmiana przy ekranach. **Rekomendacja: (a).** `react-native-svg` usuwam w obu wariantach (ikony z SF Symbols, `design-spec.md`); wraca wierszem ADR, jeśli 04 będzie go wymagać.
- **Q2 Wektory bez testu 07** (RD-12-W7–W9, RD-13-W6–W10, RD-15-W8–W10; sekcje 02: `wznowienieLimitu`, `cofniecieSerii`, `scalDni`, `oknoUczciweZasady`, `komunikatZakupu`). (a) 08 pisze testy z wektorów (prompt roli: „sam piszesz testy tylko tam, gdzie 07 ich nie dała … z wektora reguły”), czerwone na zaślepce przed kodem, i dodaje sygnatury w `src/domena` (`przypomnienieWpisania`, `dniDoTerminu`, funkcje limitu i dostępu wg prototypów 02); sygnatury zgłoszone do 05 (moduly.md) i testy do 07 (audit). (b) Wektory zostają bez testu, zgłoszenie do 07 i sesja 07 przed częścią domeny. **Rekomendacja: (a)** — wyrocznią jest wektor, nie kod; (b) zostawia regułę bez testu w gotowej warstwie. `proZegarka` tylko w Swift (KP-17, ADR-0009 D) — partia 3.
- **Q3 `tests/brands.contract.test.ts`:** `porownanie-kodu.md` mówi USUNĄĆ, a P-105/P-107 każą 07 rozszerzyć ten test na `docs/`. (a) Zostaje; usuwam z niego tylko ścieżki usuniętych plików (`src/core/i18n*.ts`). (b) Usunąć według porównania. **Rekomendacja: (a)** (usunięcie kontroli = osłabienie testów).
- **Q4 Wyjątek DS-13 (kod 0.1.0 poza kontrolami):** (a) `app` z `STARY_KOD` do `NOWY_KOD` w `kontrole-repo.mjs`, `granice.mjs src` do bramki; mechanizm `--stary` zostaje (raportuje 0) do decyzji 07. (b) Usunąć `STARY_KOD`, `--stary`, linię w `jakosc-linux.yml` i fiksturę w `tests/jakosc/kontrole-repo.test.ts` (narzędzia 07). **Rekomendacja: (a)** — minimalna zmiana cudzych narzędzi, kontrola obejmuje cały nowy kod.
- **Q5 Pliki z werdyktem USUNĄĆ/PRZEPISAĆ, które zostają w tej partii (wyjątki nazwane):** `.github/scripts/select-xcode.sh` i `scripts/verify-native.mjs` (używa ich `testflight.yml`, właściciel 10, wyjątek z `wyjatki.json`); `.github/workflows/ci.yml` (porównanie: „USUNĄĆ przy scaleniu”); `tests/public-repo.test.ts`, `scripts/licenses.mjs` (PRZEPISAĆ — 07); `pages.yml`, `site/`, `app.json` (PRZEPISAĆ — 10 i partie 3–4); `.github/scripts/gitleaks-range.sh` (ZOSTAJE, podpięcie 07/10). F-06: rachunek `repeats-schedule.ts` przenoszę do `src/domena/przypomnienia.ts` jako plan rzędów z `Wynik` (W5: N = 0 → błąd danych), test z RD-13-W1–W5 przed kodem. **Rekomendacja: przyjąć listę.**
- **Q6 Wersje i brakujące pakiety ADR-0016** (`expo` 57.0.26 → 57.0.31, `expo-sqlite` 57.0.3 → 57.0.4; brak `expo-file-system`, `expo-crypto`, `expo-keep-awake`, `expo-iap`…). (a) Z warstwą, która ich używa (partie 2–3); (b) teraz. **Rekomendacja: (a)** (minimalny zakres; domena nie ma importów z expo).
- **Uwaga (bez decyzji):** sygnatury 05/07 części funkcji domeny zwracają typ bez `Wynik` i rzucają błąd danych (np. `startDnia`, wzorzec `BladDanych` z `limit.mjs`, testy 07 tego oczekują). Wykonuję sygnatury bez zmian (zasada programisty 6); różnicę wobec wzorca „Wynik zamiast wyjątku” wpisuję w raporcie dla 05.
- **Uwaga:** pole `description` w `package.json` ma dawną nazwę i wydawcę 0.1.0 — do roli 10 przy metadanych, nie zmieniam.

## E0.5 Czas (zasada 9)
- Agent: A ≈ 1,5–2 h; B ≈ 1 h; C ≈ 5–7 h (20 plików, ok. 150 testów, porty prototypów 02 i 05). Razem ≈ 8–10 h pracy agenta.
- Czeka się na: CI po pushu (Linux ok. 2 min, iOS ok. 15–30 min) — push po porządkach i po każdej grupie C.
- Właściciel: nic (decyzje u koordynatora, P-087).

## Dziennik
- 2026-10-25: E0 — stan wyjściowy, plan, Q1–Q6; STOP do koordynatora. Odpowiedź: P-114 (Q1a–Q4a, Q5, Q6a).
- 2026-10-25: E1 A1–A5, B, C1–C11; E2 — verify 1278/1278, raport akceptacji bez błędów; STOP E2.
