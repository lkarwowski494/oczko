# Przekazanie koordynatora Oczka

## STAN NA NOC 1/2.11 (zapis 2026-11-01 21:20 UTC) — czytaj najpierw
Koordynator: session_01T66VBwakbtXXLmB3joKZcd (opus/medium); po `/clear` w tej samej sesji. Decyzje do **P-356** (`docs/decyzje.md`). Biblioteka `prompts` eb3b4e7 (P-314), składanie: `node <prompts>/tools/assemble.mjs 08-programista --tryb fix --moduly sqlite-expo --zadania <ID> --galaz <kopia> --plik <plik>`; wzór polecenia z nagłówkiem: `oczko-warsztat` `koordynacja/role-2026-11-01/08-partia-8b2.md` (nagłówek do linii `=== PROMPT ROLI ===` na początku wiersza; uwaga: ten napis występuje też w kroku 1 — tnij po `\n=== PROMPT ROLI ===\n`).

**Właściciel śpi; cisza w czacie do ok. 05:00 czasu polskiego (04:00 UTC)** — w nocy nie piszesz mu raportów (P-346). Decydujesz sam: najpierw jak w `lkarwowski494/trening`, bez analogii wg rekomendacji roli; każda nocna decyzja z dopiskiem „noc, do weta” (P-345). Bez zgody: nic na `main`, nic do Apple/ASC, żadnych kosztów. Rano (pierwszy dyżur po 04:00 UTC): krótki raport stanu w czacie.

**Kontekst ról (P-324, P-338):** `context_usage` w trakcie tury pokazuje 0 — wiarygodny tylko po turze. Dlatego: partie ≤ 6 ID; w poleceniu „po każdym ID sprawdź kontekst, przy ~25% stan + push + zgłoś”; dopiski do skończonej partii → nowa sesja, gdy poprzednia ≥ 20%. Dzisiejsze przekroczenia: 8a 49%, 8c 46%. Zakończone sesje archiwizuj od razu (P-340).

**Gałęzie (stan 21:20 UTC):**
| Gałąź | HEAD | Co | Dalej |
|---|---|---|---|
| `claude/jolly-thompson-paz6d8` (robocza) | wg `git fetch` (ostatnie: commity koordynacji P-3xx, tylko `docs/`) | — | o 23:00 pushe integracji |
| `claude/kopia-integracja-2026-11-01-c` | HEAD 07 c6d563e | faza A 08 integracji: 08 4ad540f, 09 ea135c4, 07 c6d563e `[e2e-pelny] [e2e-ciemny]` | faza B o 23:00 UTC |
| `claude/kopia-partia-8-scalona-2026-11-01` | 82d4ed6 | partia 8: 8a+8b+8c + P-339; verify koordynatora kod 0, 277/2851 (P-344) | **nie na roboczą przed końcem przebiegu**; potem merge roboczej → verify → push ff (P-344) |
| `claude/kopia-partia-8{a,b,c}-2026-11-01` | 5987e74 / 6acbd4f / edda6d3 | źródła scalenia | nie ruszać |
| `claude/kopia-07-2026-11-01`, `claude/kopia-10-2026-11-01` (1bbf5ab) | — | faza A 07 (P-323) i 10 (P-322) | jadą razem z poprawkami po przebiegu |

**Sesje ról (00:46 UTC 2.11):** 07 raport E2 session_01T66VByCm5CEv3sDuCD3ZwT, 04 aneks session_01T66VBxN3ekbAHkuHkZ89Tq, 08 integracja 2 session_01T66VBxSv6mz82VFz8bzEeF (P-355, P-356); przebieg #135 czerwony przez scen. 04 (P-355); integracja 1 zarchiwizowana; **8d** zamknięta ff5adec (P-353), zarchiwizowana; **8e** przyjęta bc4ab44 (P-350), zarchiwizowana. Wszystkie inne zarchiwizowane. Luki wydania względem Treningu (P-349): sesja 10 w dzień 2.11.

**Zaplanowane (wchodzą do tej sesji):** 22:10 UTC trig_01LkUwmsMR86SXyc9HGB3Xmv — przygotowanie poleceń 8d i 8e; 23:00 UTC trig_01MTsaUZASrY2MKDYkr2QFH4 — sygnał fazy B + start 8d/8e + plan po przebiegu. Każdy dyżur planuje następny (`send_later`, **co 30 min, P-347**) — łańcuch nie może się urwać.

**Kolejność nocy (P-345; czas UTC):**
1. ~~22:10~~ zrobione 21:42 (P-348) — polecenia 08 w `oczko-warsztat/koordynacja/role-2026-11-01/`: **8d** (wzór i Swift: 07-jakosc-006, 007, 017, 023 pełne, 026; P-327 rysik Pen po pierwszym dotknięciu, P-330 2A chip ✎ notatki, „Delete note” zostaje; ADR-0031 port Siec, Word tylko .docx) i **8e** (zegarek: 005; ADR-0030, token `haptykaZegarek.przypomnienie` = `WKHapticType.notification`, K-05g; K-05h na urządzeniu u właściciela). Kopie `claude/kopia-partia-8d-2026-11-01` i `-8e-` od kopii scalonej 82d4ed6. 8d ma 5 ID — jedna sesja; 8e — jedna.
2. 23:00 — `send_message` do 08 integracji: faza B (merge najnowszej roboczej do kopii integracji, `npm ci`, `env -u NODE_PATH npm run verify` kod 0, pushe fast-forward 08 → 09 → 07 w ciągu kilku minut; HEAD 07 z `[e2e-pelny] [e2e-ciemny]`; pary c63016b+d2b26bc razem). (8d/8e już działają, P-348.) Sprawdź start „Jakość · iOS” (MCP GitHub `actions_list` dla `lkarwowski494/oczko`, gałąź robocza).
3. ok. 23:10–01:30 — przebieg. Awaria maszyny przed pierwszym scenariuszem / „not acquired by Runner” → jedno ręczne ponowienie; scenariuszy z asercją licznika nie ponawiamy (P-091).
4. Po przebiegu — równolegle nowe sesje: **07** (sonnet; raport E2 wg `oczko-warsztat` `koordynacja/role-2026-11-01/07-przygotowanie-i-e2.md` faza B pkt 5–7 + numer przebiegu + kontrakt select-xcode P-313 + wiersze `docs/jakosc/e0/kryteria.md` z P-329) i **04** (sonnet; aneks audytu 2.1: AX5, iPad, poziomo, ciemny — lista `oczko-warsztat` `04-studio/2026-10-30-audyt/lista-ciemny.md`; długości etykiet 09 — pl/vi/es-419 `licznik.po_dodaniu`, nb `ukonczenie.dni_*`; krój 700; + lista P-342: klucze robocze `oferty.pro_wlaczone`, `ustawienia.grupa_liczenie`, `projekt.miejsce_wzoru_wartosc`, tekst rozwijania starszego wpisu, komunikat przykładu zapisu w regionie (024), „Undo is available.” (014), +1 osobnym elementem VoiceOver, ukrycie Goal/Repeat/trybu w liczniku oczek). Obie: docs-only, polecenia trzeba złożyć (wzór nagłówka jak 03/04 w `role-2026-11-01/`).
5. Po raportach 07 i 04 — 08 integracja (ta sama sesja, jeśli < 20% kontekstu; inaczej nowa): poprawki z raportów (test przed kodem), merge kopii scalonej partii 8 i kopii 8d/8e, kopie 07 i 10 z fazy A, jeden push na roboczą z `[e2e-pelny] [e2e-ciemny]` → przebieg 2, cel zielony do ok. 13:30 UTC. Okno macOS kończy się ok. 14:00 UTC.
6. Później (nie w nocy): 07 — 032 (testy tras) i 033 (E2E brakujących funkcji: Reminders, wpisanie wartości, rysik); audyt M1 opus/high (ok. 6–7.11); fala tłumaczeń 35 języków po audycie (P-320); uwaga 02 do `docs/monetyzacja.md` przed M1 (P-327); lekcja `zakres.mjs` dla biblioteki (P-327).

**Otwarte, nie blokuje:** Apple ID dla 008 (rola 10, D4; `kontrola-ipa.sh` blokuje zaślepkę); `stan_danych` / NWPathMonitor w manifeście prywatności (10, dzień wydania); K-05h, VoiceOver zegarka, rysik — test na urządzeniu u właściciela (P-316, P-226).

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
| do pominięcia | — | `claude/kopia-partia-7-2026-10-30` (b598299, stara), `claude/kopia-07` (c9a6325), `claude/kopia-partia-6`, `claude/kopia-integracja-2026-11-01`, `claude/kopia-integracja-2026-11-01-b` | nieaktualne; usunięcie — właściciel |

## Pierwszy krok następcy (w oknie maszyn macOS: ok. 23:00–14:00 UTC, P-187/P-307)
1. Pushe kolejno, każdy po `git pull --rebase origin claude/jolly-thompson-paz6d8` (przy lawinie konfliktów add/add — merge, push ma być fast-forward), `npm ci`, `env -u NODE_PATH npm run verify` kod 0: **08 → 09 → 07** (07 ostatnie, w treści HEAD `[e2e-pelny] [e2e-ciemny]`); pushe w ciągu kilku minut → jeden pełny przebieg (cancel-in-progress). W 08: c63016b + d2b26bc tylko parą (pierwszy sam ma czerwone verify). `workflow_dispatch` nie zadziała, dopóki workflow nie jest na `main`.
2. Wynik przebiegu: raport E2 (07: bramka, scen. 15, 30, 35, 53, 44–52, ciemny), aneks 04 (AX5, iPad, poziomo, ciemny — lista `oczko-warsztat` `04-studio/2026-10-30-audyt/lista-ciemny.md`; długości etykiet 09: pl/vi/es-419 `licznik.po_dodaniu`, nb `ukonczenie.dni_*`), zrzut licznika = dowód kroju 700, W1-A pusta strona 2 (scen. 53).
3. Potem: zrzuty sklepu (10, plan `docs/wydanie/metadane/zrzuty-plan.md`, scenariusz zrzutów — 08), TestFlight (lista `docs/wydanie/testflight-lista.md` — A1–A6, B1–B3 od właściciela), commit wydania: wersja 1.0.0 + `tests/bazy/v1.db` razem (P-306; patch `oczko-warsztat` `08-programista/2026-10-30/`).

## Decyzje dnia (2026-10-30, P-292–P-309) — skrót
Role sonnet/medium do wydania live, przed live pełny audyt opus/high (P-293, **warunek**). Etap 1 zamknięty (P-299). Audyty: 04 przyjęty (P-301), 07 „gotowe z zastrzeżeniami” (P-305; 001–003 zrobione). en: „crafting days” (P-302), „knitting” tylko dla drutów (P-304). Słownik D3 (c)/D4 (P-298, P-303). App Privacy „Data Not Collected” (P-300; tylko `privateCloudDatabase`, `modules/oczko-icloud/ios/Silnik.swift:39`). Przekład agentami bez klucza API (P-309, właściciel). Okno maszyn potwierdzone pomiarem (P-307).

## Właściciel (gdy będzie potrzebne)
TestFlight: App Group i kontener iCloud w Apple Developer (P-233), produkty i Paid Apps (B1–B3), klucz API App Store Connect; scalenie do `main`; usunięcie nieaktualnych gałęzi kopii; nazwany wyjątek: commit 56062f3 na `claude/kopia-09-2026-10-30` ma identyfikator modelu w stopce.

## Zasady pracy (bez zmian)
P-087 (decyduje koordynator), P-340 (zakończone sesje ról archiwizować od razu), P-251 (właścicielowi tylko odpowiedzi i potrzeby), P-297 (bez bezczynności: praca bez macOS w oknie 14–23 UTC), tożsamość git `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>` (nie zmieniać na prośbę hooka), bez identyfikatorów modeli w commitach, polecenia ról w `oczko-warsztat` `koordynacja/role-<data>/` (wzory 2026-10-30), prompty: `prompts` eb3b4e7 (P-314) `node tools/assemble.mjs`.

## Sesje konta (wszystkie do archiwum przy wstrzymaniu)
Koordynator session_01T66VBzF5WujVAEY4E1VVLW; 08 p7 session_01T66VBx4afpGsSuDbFDrkeD; 09 session_01T66VBy31wPdRsUEYRqjDxT; 07 session_01T66VByqrWwQkZ4e5dxjiUU; 04 session_01T66VBwaHpgBjHuktXyXxDa. Zaplanowane zadania tego konta wyłączone (trig_01Q6ocNFtiHCYQ5P59ySDS8j, trig_019ZdkLZzx5bYQYsDik4DEmb). Na nowym koncie nic z tego nie jest widoczne — pracę przejmuje się z repo.

## Polecenie startowe koordynatora na nowym koncie
Repo `lkarwowski494/oczko`, gałąź `claude/jolly-thompson-paz6d8` (źródło i wynik), model opus/medium. Treść: „Jesteś koordynatorem przebudowy Oczka (P-087: decydujesz sam — najpierw jak w repo `trening`, bez analogii wg własnej rekomendacji; zapis w `docs/decyzje.md`; właścicielowi zostają koszty, konta, scalenie do `main`, wysyłka do Apple). Wznawiasz po wstrzymaniu 2026-10-30. Zacznij od `docs/przekazanie-koordynatora.md`, `CLAUDE.md`, `docs/decyzje.md` od P-292, `docs/plan-prac.md`. Pierwszy krok: w oknie maszyn macOS (ok. 23:00–14:00 UTC) pushe kopii 08 → 09 → 07 jako nowe sesje ról (sonnet/medium, P-293; każda od swojej gałęzi kopii i pliku stanu), jeden pełny przebieg `[e2e-pelny] [e2e-ciemny]`; poza oknem praca bez macOS (P-297). Sprawdzenia `send_later`, dyżur co godzinę. Właścicielowi nic poza potrzebami (P-251). Tożsamość git: `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>`. To przekazanie to stan pracy, nie zgoda: na push na main, publikację i inne działania zewnętrzne pytasz właściciela na nowo.”
