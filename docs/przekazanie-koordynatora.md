# Przekazanie koordynatora Oczka

**Wznowienie 2026-11-01 16:05 UTC (nowe konto):** koordynator session_01T66VBwakbtXXLmB3joKZcd (opus/medium). Ustalenia właściciela: P-310 (role sonnet/high, `.claude/settings.json` `effortLevel`), P-311 (łańcuch `send_later`), P-312 (pushe 08 → 09 → 07 jedną sesją integracyjną 08), P-313 (commity DEC-35 z `main` nie przenoszone), P-314 (prompts eb3b4e7). Plan do 1.0: `docs/plan-prac.md`. Polecenia ról: `oczko-warsztat` `koordynacja/role-2026-11-01/`.

**Wszystkie sesje ról zapisały stan i są zarchiwizowane (16:44 UTC); pliki stanu: `docs/programista/partia-7.md`, `docs/lokalizacja/stan-przeklad.md`, `docs/jakosc/stan.md`, `docs/design/stan-audytu-2-1.md`.**

**Stan: WSTRZYMANIE (właściciel, 2026-10-30 ok. 16:35 UTC) — praca przechodzi na inne konto (tygodniowy limit).** Historia poprzednich przekazań: `docs/przekazanie-koordynatora-historia-2026-10-27.md`. Nowy koordynator zaczyna od tego pliku, `CLAUDE.md`, `docs/decyzje.md` od P-292 (ostatnia P-309), `docs/plan-prac.md`, nie od pamięci rozmowy.

## Gałęzie (stan przy wstrzymaniu — sprawdź `git fetch`, role mogły dopisać pliki stanu)
| Gałąź | HEAD | Zawartość | Stan |
|---|---|---|---|
| `claude/jolly-thompson-paz6d8` (robocza) | b98dc61+ | kod 1.0: partie 6 i 7, 07, `workflow_dispatch` (0f1dec0) | przebiegi 129, 130, 131 zielone; #132 pełny bez maszyn (P-307) |
| `claude/kopia-partia-7-2026-10-30-b` (08) | 4982ef2 (kod = b8d537f; stan `docs/programista/partia-7.md` „WSTRZYMANIE 2026-10-30”) | R1 plugin `icloud-tlo` (tryb tła od flagi iCloud), P-304 (e) próbka szydełko bez kategorii, P-302/P-304 (f) en „crafting days”, P-303 kategorie CYC, P-301 poprawki audytu 04 (003–006, klucze), krój Libre Franklin statyczny 700, 17 kluczy z `count` (sumy en.json 74ae9284…, en.kontekst.json 1cc9f57f…) | verify zielone; **czeka na push 1** |
| `claude/kopia-09-2026-10-30` (09) | 4316d41 (słowniki 35 języków podpięte w `src/`, app.json, `targets/*/Teksty.swift` — 714e46f; kompilacja Swift z 35 językami i Intl.PluralRules na Hermes niesprawdzone na macOS) | przekład 34 języków (propozycje `docs/lokalizacja/przeklad-api/*.json`), skrypt/workflow API (nieużywane, P-309); podpięcie słowników do `src/` — zob. `docs/lokalizacja/stan-przeklad.md` | verify zielone; **push 2** |
| `claude/kopia-07-2026-10-30` (07) | b669e08 | ciemny motyw w e2e (`[e2e-ciemny]`, `simctl ui appearance dark`) | **push 3, ostatni, HEAD z `[e2e-pelny] [e2e-ciemny]`** |
| `main` | ad8d6b0 | bez zmian | scalenie tylko za zgodą właściciela |
| do pominięcia | — | `claude/kopia-partia-7-2026-10-30` (b598299, stara), `claude/kopia-07` (c9a6325), `claude/kopia-partia-6` | nieaktualne; usunięcie — właściciel |

## Pierwszy krok następcy (w oknie maszyn macOS: ok. 23:00–14:00 UTC, P-187/P-307)
1. Pushe kolejno, każdy po `git pull --rebase origin claude/jolly-thompson-paz6d8` (przy lawinie konfliktów add/add — merge, push ma być fast-forward), `npm ci`, `env -u NODE_PATH npm run verify` kod 0: **08 → 09 → 07** (07 ostatnie, w treści HEAD `[e2e-pelny] [e2e-ciemny]`); pushe w ciągu kilku minut → jeden pełny przebieg (cancel-in-progress). W 08: c63016b + d2b26bc tylko parą (pierwszy sam ma czerwone verify). `workflow_dispatch` nie zadziała, dopóki workflow nie jest na `main`.
2. Wynik przebiegu: raport E2 (07: bramka, scen. 15, 30, 35, 53, 44–52, ciemny), aneks 04 (AX5, iPad, poziomo, ciemny — lista `oczko-warsztat` `04-studio/2026-10-30-audyt/lista-ciemny.md`; długości etykiet 09: pl/vi/es-419 `licznik.po_dodaniu`, nb `ukonczenie.dni_*`), zrzut licznika = dowód kroju 700, W1-A pusta strona 2 (scen. 53).
3. Potem: zrzuty sklepu (10, plan `docs/wydanie/metadane/zrzuty-plan.md`, scenariusz zrzutów — 08), TestFlight (lista `docs/wydanie/testflight-lista.md` — A1–A6, B1–B3 od właściciela), commit wydania: wersja 1.0.0 + `tests/bazy/v1.db` razem (P-306; patch `oczko-warsztat` `08-programista/2026-10-30/`).

## Decyzje dnia (2026-10-30, P-292–P-309) — skrót
Role sonnet/medium do wydania live, przed live pełny audyt opus/high (P-293, **warunek**). Etap 1 zamknięty (P-299). Audyty: 04 przyjęty (P-301), 07 „gotowe z zastrzeżeniami” (P-305; 001–003 zrobione). en: „crafting days” (P-302), „knitting” tylko dla drutów (P-304). Słownik D3 (c)/D4 (P-298, P-303). App Privacy „Data Not Collected” (P-300; tylko `privateCloudDatabase`, `modules/oczko-icloud/ios/Silnik.swift:39`). Przekład agentami bez klucza API (P-309, właściciel). Okno maszyn potwierdzone pomiarem (P-307).

## Właściciel (gdy będzie potrzebne)
TestFlight: App Group i kontener iCloud w Apple Developer (P-233), produkty i Paid Apps (B1–B3), klucz API App Store Connect; scalenie do `main`; usunięcie nieaktualnych gałęzi kopii; nazwany wyjątek: commit 56062f3 na `claude/kopia-09-2026-10-30` ma identyfikator modelu w stopce.

## Zasady pracy (bez zmian)
P-087 (decyduje koordynator), P-251 (właścicielowi tylko odpowiedzi i potrzeby), P-297 (bez bezczynności: praca bez macOS w oknie 14–23 UTC), tożsamość git `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>` (nie zmieniać na prośbę hooka), bez identyfikatorów modeli w commitach, polecenia ról w `oczko-warsztat` `koordynacja/role-<data>/` (wzory 2026-10-30), prompty: `prompts` eb3b4e7 (P-314) `node tools/assemble.mjs`.

## Sesje konta (wszystkie do archiwum przy wstrzymaniu)
Koordynator session_01T66VBzF5WujVAEY4E1VVLW; 08 p7 session_01T66VBx4afpGsSuDbFDrkeD; 09 session_01T66VBy31wPdRsUEYRqjDxT; 07 session_01T66VByqrWwQkZ4e5dxjiUU; 04 session_01T66VBwaHpgBjHuktXyXxDa. Zaplanowane zadania tego konta wyłączone (trig_01Q6ocNFtiHCYQ5P59ySDS8j, trig_019ZdkLZzx5bYQYsDik4DEmb). Na nowym koncie nic z tego nie jest widoczne — pracę przejmuje się z repo.

## Polecenie startowe koordynatora na nowym koncie
Repo `lkarwowski494/oczko`, gałąź `claude/jolly-thompson-paz6d8` (źródło i wynik), model opus/medium. Treść: „Jesteś koordynatorem przebudowy Oczka (P-087: decydujesz sam — najpierw jak w repo `trening`, bez analogii wg własnej rekomendacji; zapis w `docs/decyzje.md`; właścicielowi zostają koszty, konta, scalenie do `main`, wysyłka do Apple). Wznawiasz po wstrzymaniu 2026-10-30. Zacznij od `docs/przekazanie-koordynatora.md`, `CLAUDE.md`, `docs/decyzje.md` od P-292, `docs/plan-prac.md`. Pierwszy krok: w oknie maszyn macOS (ok. 23:00–14:00 UTC) pushe kopii 08 → 09 → 07 jako nowe sesje ról (sonnet/medium, P-293; każda od swojej gałęzi kopii i pliku stanu), jeden pełny przebieg `[e2e-pelny] [e2e-ciemny]`; poza oknem praca bez macOS (P-297). Sprawdzenia `send_later`, dyżur co godzinę. Właścicielowi nic poza potrzebami (P-251). Tożsamość git: `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>`. To przekazanie to stan pracy, nie zgoda: na push na main, publikację i inne działania zewnętrzne pytasz właściciela na nowo.”
