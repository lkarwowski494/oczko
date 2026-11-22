# Przekazanie koordynatora Oczka (na wypadek wyczerpania limitu konta)

Aktualizuje koordynator po każdej zmianie stanu (P-244). Nowy koordynator, także na innym koncie Claude, zaczyna od tego pliku, `CLAUDE.md`, `docs/decyzje.md` (od P-217) i `docs/sztafeta.md`, nie od pamięci rozmowy.

**Ostatnia aktualizacja:** 2026-10-27 ok. 16:00 UTC — **WSTRZYMANE przez właściciela (sekcja niżej)**; wcześniej 08:50 UTC konto 2 przejęło (P-269); sesje ról 08 p7, 07, 08 p6 uruchomione na koncie 2 · gałąź robocza `claude/jolly-thompson-paz6d8` · ostatnia decyzja P-291 · **koordynator: session_01T66VBzy9qEVyo8a5aMd7r1 (konto 2, od 08:45 UTC)**; poprzedni (konto 1, nieaktywny): session_01VjtVbMx8DYWkBfH4pvaCXK

## WSTRZYMANIE (właściciel, 2026-10-27 ok. 16:00 UTC) — stan do wznowienia
Praca wstrzymana na polecenie właściciela. Zaplanowane zadania koordynatora Oczka: brak (nocne sprawdzenie skasowane). Sesje ról zapisały stan (hashe w tabeli niżej, potwierdzone na zdalnych gałęziach) i czekają bez zadań. Kontenery sesji mogą zostać zwolnione po kilku dniach — stan żyje wyłącznie w gałęziach `claude/kopia-*`, plikach stanu ról (`docs/programista/partia-6.md`, `partia-7.md`, `docs/jakosc/stan.md` na kopiach) i w `oczko-warsztat`; nowa sesja roli startuje z nich (szablon niżej, prompty: `oczko-warsztat` `koordynacja/role-2026-10-27/`).

**Gałąź robocza** `claude/jolly-thompson-paz6d8` — ostatni kod: 2c6d69e (krok 3: iCloud pola NULL + XCTest, hook P-260, Magic Tap, P0 wyścig pierwszego +1, panel zegarka, pasek AX5). Ostatnia decyzja: P-290.

**CI (P-291):** przebieg 128 (run 40503412220, 2c6d69e) zakończony 14:21: build z iCloud ✅, swift-test z XCTest iCloud ✅, `eksperymenty-wzoru` ❌ (W1 środowisko); **e2e anulowane bez maszyny** — P0 (bramka 01), 15, 30 niesprawdzone w E2E. Pierwszy krok po wznowieniu: ponowić e2e 128 (`rerun_failed_jobs`, do 30 dni) albo od razu kolejka niżej (jej przebieg z `[e2e-pelny]` sprawdzi 01).

**Czeka na push (po końcu 128, kolejno, każdy po poprzednim):**
| # | Kto | Gałąź kopii (HEAD) | Zawartość | Znacznik |
|---|---|---|---|---|
| 1 | 08 partia 6 | `claude/kopia-partia-6` (942f8dd) | P-271 strażnik startu (tło ≠ awaria), W1-A (Word tabela/obraz), P-276 film (zamiana jawna, flaga `film`), plan 1.1 pkt 1–8 („Rename”, Magic Tap we wzorze, W11 + błąd komunikatu aparatu, arkusz skrzynki na projekcie, „Paste” przez `oczko-wzor`, miniatura PDF), P-283–P-285, U9–U12; dużo nowego, nieskompilowanego Swift | bez |
| 2 | 07 | `claude/kopia-07` (c9a6325) | scen. 53 (Word), testID P-283, F07-34 (35), F07-35 (JAK-09: `akceptacja` jako bramka) | `[e2e-pelny]`, jeśli 3 nie idzie od razu |
| 3 | 08 partia 7 | `claude/kopia-partia-7-noc` (146cc64) | iCloud TS: poczekalnia `nowsza_wersja`, „Update Oczko…”, „Syncing…” | `[e2e-pelny]` |
Każdy: `git pull --rebase origin claude/jolly-thompson-paz6d8`, generatory, `env -u NODE_PATH npm run verify` (hook P-260 i tak uruchamia), push na sygnał koordynatora.

**Wznowienie 2026-10-30 (P-292):** koordynator session_01T66VBzF5WujVAEY4E1VVLW; 08 partia 6 (push 1) session_01T66VBxnanDHvraKAoVNbpX (sonnet, z `claude/kopia-partia-6`, polecenie `oczko-warsztat` 8a800e0 `koordynacja/role-2026-10-30/`). Ponowienie e2e 128 nieudane (artefakt wygasł). **Push 1 zrobiony:** 6412115, przebieg 129 (41047429044) zielony (P-294); sesja 08 p6 zarchiwizowana. **Push 2 (07, bez znacznika) w toku** — sesja 07 session_01T66VBy1a8CfuEwRKXQvKe2 (sonnet, z `claude/kopia-07`, polecenie `oczko-warsztat` 72a96db). **Push 2 zrobiony:** 995fc91, przebieg 130 zielony. **Push 3 (P-295):** sesja 08 p7 session_01T66VBx4afpGsSuDbFDrkeD, push bez znacznika do 13:50 UTC; pełny `[e2e-pelny]` w nocy. Stare sesje niżej: zarchiwizowane, nic do nich nie wysyłać.

**Przerwa bez maszyn (P-296), od 14:17 UTC:** 04 audyt 2.1 session_01T66VBwaHpgBjHuktXyXxDa, 06 D3/D4 session_01T66VC11LHrBiqQdGVK2YoL (sonnet; polecenia `oczko-warsztat` 5f0defd). Przebieg 131 (41063247783, push 3 258a026): maszyny przydzielone także po 14:00 UTC (pomiar do P-187); build, swift-test, e2e cz. 2 ✅, cz. 1 w toku o 14:16. 08 p7 session_01T66VBx4afpGsSuDbFDrkeD: wynik 131 + plan-prac 2.2 na kopii `claude/kopia-partia-7-2026-10-30` (push nocą). 07 push 2 zarchiwizowana. **P-297 (14:19 UTC):** 07 audyt 2.4 session_01T66VByqrWwQkZ4e5dxjiUU, 10 metadane session_01T66VBy196FgT5LYED2fCSu; dyżur bez bezczynności co godzinę (`7 6-23 * * *` UTC).

**Stan 15:15 UTC (P-299–P-307):** etap 1 zamknięty (131 zielony); audyty 04 (P-301) i 07 (P-305) przyjęte, 06 i 10 zakończone (zarchiwizowane). Pełny `[e2e-pelny]` #132 bez maszyn (P-307) → nocą ok. 23:05 UTC (zaplanowane zadanie trig_01Q6ocNFtiHCYQ5P59ySDS8j): push 08 p7 `claude/kopia-partia-7-2026-10-30-b`, potem 07 `claude/kopia-07-2026-10-30` z `[e2e-pelny] [e2e-ciemny]`. Aktywne: 08 p7 (font statyczny 700), 04 (porównanie kluczy fix9, teksty `wzor.film_*`), 07 (przegląd Maestro 1e92c8d). Wersja 1.0.0 + `tests/bazy/v1.db` w commicie wydania (P-306). Dyżur co godzinę: trig_019ZdkLZzx5bYQYsDik4DEmb.

**Sesje (konto 2, zarchiwizowane):** koordynator session_01T66VBzy9qEVyo8a5aMd7r1; 08 p6 session_01T66VByADnL2T64RBV2HPqF; 08 p7 session_01T66VBwDdcBHrNrCt25ZNWW; 07 session_01T66VBvUS4tz9Ei2heewJzY. Zarchiwizowane: 04, 05, 09 (praca zakończona). 10 — nieuruchomiona.

**Warunek przed wydaniem live (P-293):** pełny audyt na opus/high (`M1-audytor-generalny --tryb audit` albo `07 --tryb audit`) — kompensuje wyjątek „wszystkie role sonnet/medium”. Do tego czasu sesje ról: `claude-sonnet-5-5`, medium; koordynator opus/medium.

**Otwarte (bez okna maszyn):** pusta strona 2 przy konwersji Word (decyzja po zrzucie scen. 53, P-282 (a)); audyt 04 (lista zbiorcza w raporcie E2 partii 6 `oczko-warsztat` a9eefeb i P-275–P-284); 06 — D3/D4 słownika (P-281); plan TestFlight `docs/jakosc/testflight-na-urzadzeniu.md` (P-290: build TF z `ICLOUD_W_1_0 = true`).

**Właściciel (niepilne):** usunąć gałąź `claude/kopia-09` (P-281); przed TestFlight: App Group i kontener iCloud w Apple Developer (P-233), produkty i Paid Apps w App Store Connect (blok E testów).

**Zasada komunikacji:** właścicielowi nic nie pisać poza odpowiedzią na pytanie albo potrzebą (koszty, konta, scalenie, Apple).

## Jak przejąć na innym koncie
1. Sesje i zaplanowane zadania poprzedniego konta nie są widoczne z nowego konta. Pracę przejmujesz z repozytorium, nie z sesji.
2. Kod sesji w toku: gałęzie kopii `claude/kopia-partia-6`, `claude/kopia-partia-6-natywne` (Swift pod-agenta partii 6) i `claude/kopia-partia-7` (P-244; zapis co ~30 min, także kod niesprawdzony). Stan i plan: `docs/programista/partia-6.md`, `partia-7.md` na tych gałęziach. Zanim cokolwiek trafi na gałąź roboczą: rebase na `claude/jolly-thompson-paz6d8`, `env -u NODE_PATH npm run verify` zielone.
3. Nowa sesja roli: źródło `lkarwowski494/oczko`, rewizja i gałąź wyniku `claude/jolly-thompson-paz6d8` (kopie: rewizja z gałęzi kopii). Szablon polecenia startowego: niżej. Repo `prompts` bywa niedostępne dla sesji ról — wtedy skrót zasad roli z P-242/P-243 (wiadomości koordynatora) albo prompt złożony przez koordynatora.
4. Odtwórz dyżur nocny: maszyny macOS GitHub Actions są dostępne po północy czasu polskiego (P-187). Nocny przebieg „Jakość · iOS” (`jakosc-ios.yml`) rusza z pushem kodu na gałąź roboczą albo ręcznie; `cancel-in-progress` — każdy kolejny push kodu go anuluje.

## Stan (2026-10-27 06:30 UTC) — przejęcie na drugie konto (tygodniowy limit konta 1)
Sesje ról i zaplanowane zadania konta 1 **nie działają** na koncie 2: role trzeba uruchomić od nowa z gałęzi kopii i plików stanu.

- **Zakres 1.0:** pełne MVP z wzorami (F) i iCloud (G), P-217. Plan: `docs/plan-app-store.md` (do odświeżenia pod P-217).
- **Fundament partii 6/7:** L1–L3c nałożone (P-236). Panele E2E poza buildem wydania (P-238, P-240).
- **Strona:** `apps4brew.com/oczko/` opublikowana, adres polityki przełączony (P-239).
- **Okno maszyn macOS** do ok. 14:00 UTC (P-187). Każdy push w ścieżkach `jakosc-ios.yml` (kod, `e2e/**`, `package.json`, `modules/**`, workflow) anuluje bieżący przebieg; pełny pakiet tylko z `[e2e-pelny]` w treści HEAD.
- **Przebieg 121** (run 40457386369, bd60073, pełny): **zakończony 07:20 UTC — build, swift-test, e2e iPhone 1–3 i iPad success**; `eksperymenty-wzoru` ❌ informacyjnie (P-265). Szczegóły scenariuszy (bramka, kaskada orientacji, 36) w raporcie 07 `E2-przebieg-121.md`. Sygnał dla kroku 1 kolejki dany 07:27 UTC. **Krok 1 wypchnięty:** 8c876ad `[e2e-pelny]` (07:28), przebieg 122 (40467271474) anulowany; 07 wypchnęło F07-30 781f939 `[e2e-pelny]` (P-266) → **przebieg 123 (40468002239)** = P-262 ×3 + F07-30, start 07:35, koniec ok. 09:10 UTC; potem krok 2. **Przebieg 126 zakończony 12:00: build, swift-test ✅; cz. 2 (AX5), cz. 3 (bramka 04, 08), iPad ✅; cz. 1 iPhone ❌ tylko bramka 01 (zimny start, P-286); eksperymenty-wzoru ❌ (W1 środowisko, P-282, W2/W3 ✅). Krok 3 wypchnięty be89292 (12:03; przebieg 127 stał w kolejce), zastąpiony 2c6d69e (12:23, P-288: + P0 wyścig pierwszego +1, panel zegarka, pasek AX5) — przebieg na 2c6d69e sprawdza iCloud, hook i P0; kontrola 13:10.** **13:30 UTC: przebieg 128 (40503412220, 2c6d69e) nadal w kolejce maszyn od 12:23 — okno dnia zamknięte; zostaje w kolejce i ruszy przy wolnych maszynach (noc). Kolejka nocna: (1) wynik 128 (iCloud build/XCTest, hook, P0 — bramka 01, 11, 31); (2) po jego końcu partia 6 (`claude/kopia-partia-6` e779602+: P-271 strażnik startu, W1-A, P-276 film, plan 1.1, P-283–P-285; dużo nowego Swift) bez znacznika → 07 (`claude/kopia-07` 6312760+: scen. 53, testID, F07-34) z `[e2e-pelny]`. Nie pushować kodu, dopóki 128 nie skończy (anulowałby go). (3) po 07: partia 7 `claude/kopia-partia-7-noc` 9d94084 (iCloud: poczekalnia `nowsza_wersja`, „Update Oczko…”, „Syncing…”) z `[e2e-pelny]`. Raport E2 partii 6: `oczko-warsztat` a9eefeb.** Czeka na następne okno: partia 6 `claude/kopia-partia-6` e779602+ (P-271, W1-A, P-276, plan 1.1, P-283–P-285) + 07 `claude/kopia-07` (scen. 53, testID). Krok 2 wypchnięty (P-280): p6 5e2058d → 07 a5f7856 → p7 65e9a4c `[e2e-pelny]` → przebieg 126 (40484943291) od 09:59, koniec ok. 11:35; potem krok 3 (iCloud e996bae+339a85b, hook P-260 b5b4e6c).** Wynik 123 (09:40 UTC, P-278): failure — bramka cz. 3 czerwona na 04 (baner serii), krok 2 ruszył 09:50 jako pomiar.** Stan 123 o 08:45 UTC (konto 2): build, swift-test, e2e część 1 iPhone i iPad success; części 2–3 iPhone w toku; `eksperymenty-wzoru` ❌ ta sama klasa co 121 (poprawka 7af7ef2 w kroku 2). Nowe błędy aplikacji z 121 (P-266): 30, 36, 51 → partia 7; 52 → partia 6 (gotowe: kopia 937d6f2 = 7af7ef2 + katalog zastępczy E2E, P-267; push w kroku 2).
- **Kolejka pushy (po kolei, każdy po końcu poprzedniego przebiegu):**
  1. Partia 7 — poprawki P-262 (a) Save pod klawiaturą, (b) liczba w poziomie, (c) stoper po pierwszym +1: commity do cf5c83b z `claude/kopia-partia-7` (próbny rebase `proba-p262` b28a1d3, verify 2537/2537), head z `[e2e-pelny]` (P-263). Dowód (a): odstęp paska w hierarchii > 0; jeśli 0 → STOP z opcjami (1) InputAccessoryView „Done”, (2) ScrollView z `automaticallyAdjustKeyboardInsets`.
  2. (P-268) Po końcu przebiegu 123, kolejno: partia 6 `claude/kopia-partia-6` (937d6f2 i następny: 7af7ef2 + scen. 52 P-267) bez znacznika → 07 185219e (`e2e/README.md`: `usun-wszystko-anuluj`; kopia jako patch w `oczko-warsztat` 4ae8f46 `07-jakosc/2026-10-26-fix3/kopia/`, odtworzenie `git am`) → partia 7 ostatnia: cherry-pick 85d1b0f, 48af829, cd33af0 (scen. 36, 51, 30; bez iCloud) z `[e2e-pelny]`. Gotowe: `claude/kopia-partia-7-krok2` (49d32c6, verify 2542/2542). Przy kroku 2 sprawdzić wynik P-262 (a): odstęp paska > 0 = OK, 0 = STOP partii 7.
  3. (P-268) Po końcu kroku 2: partia 7 e996bae + 339a85b (iCloud pola NULL + XCTest; możliwy konflikt w `jakosc-ios.yml` z 7af7ef2 — zachować oba kroki) i koordynator hook P-260 (`claude/kopia-koordynator-p260`, b5b4e6c) z `[e2e-pelny]`.
- Właściciel w pracy (P-251, 2026-10-27): pingować tylko przy kosztach, kontach, scaleniu do `main`, wysyłce do Apple; bez raportów stanu. **Właściciel 2026-10-27 12:35: koordynator nie pisze nic po zdarzeniach (wiadomości ról, sprawdzenia) — odzywa się tylko zapytany albo gdy czegoś potrzebuje; tura bez potrzeby kończy się jednym znakiem.**


## Sesje ról — konto 2 (od 2026-10-27 08:48 UTC, P-269)
| Rola | Sesja konta 2 | Gałąź kopii (wynik sesji) | Następny krok |
|---|---|---|---|
| 08 partia 7 | session_01T66VBwDdcBHrNrCt25ZNWW | `claude/kopia-partia-7` | krok 2 (ostatni, `[e2e-pelny]`), krok 3 iCloud — na sygnał |
| 07 fix-3 | session_01T66VBvUS4tz9Ei2heewJzY | `claude/kopia-07` (nowa) | odtworzyć 47b9bd5, raport `E2-przebieg-123.md`; push w kroku 2 na sygnał |
| 08 partia 6 | session_01T66VByADnL2T64RBV2HPqF | `claude/kopia-partia-6` | krok 2 (pierwszy, bez znacznika; 7af7ef2 + 937d6f2 + 1c78e3f manifest W1–W3, P-270) na sygnał; potem W1–W3 |
| 05 przeglądy (P-272) | session_01T66VBxEUVZa1a385Aya8Wy (zarchiwizowana) | `claude/kopia-05` | zrobione (P-274, P-276) |
| 04 fix-8 (P-272) | session_01T66VBwdxqMdrc4M8QCPweH (zarchiwizowana) | `claude/kopia-04` | zrobione (P-275, P-276); następnie audyt 2.1 |
| 09 słownik (P-272) | session_01T66VByqAL8puHu6nZh23xw (zarchiwizowana) | `claude/kopia-09` (do usunięcia przez właściciela, P-281) | słownik gotowy (f3115f5); D3/D4 → 06 |
| 10 wydanie | — (nie uruchomiona) | `docs/wydanie/stan.md` | uruchomić, gdy będzie zadanie (etap 2.5) |
| koordynator | session_01T66VBzy9qEVyo8a5aMd7r1 | ten plik, `docs/decyzje.md` | dyżur kolejki okna |

Złożone prompty ról 07 i 08 (prompts@97ec212) dla sesji bez dostępu do `prompts`: `oczko-warsztat` `koordynacja/role-2026-10-27/` (b2ac4cd).

## Sesje ról konta 1 (nieaktywne, tylko historia)
| Rola | Sesja konta 1 | Gałąź kopii / plik stanu | Następny krok |
|---|---|---|---|
| 08 partia 6 | session_011aVqoG57RGu7Vp1oQgJXGw | `claude/kopia-partia-6` = 584ba5f (bd60073 + 7af7ef2 + 937d6f2 scen. 52), `docs/programista/partia-6.md` sekcja „Stan · 07:05 UTC — PRZEKAZANIE” | wynik 121 (W1–W3), push 7af7ef2 w kroku 2 kolejki; U1–U8 do TestFlight |
| 08 partia 7 | session_01TJJQNJ7a1qvykFbdUaXBge | `claude/kopia-partia-7` = df33b5c (krok 2: `claude/kopia-partia-7-krok2` 49d32c6), `docs/programista/partia-7.md` sekcja „Przekazanie” (przy kroku 2 możliwy konflikt w `jakosc-ios.yml` z 7af7ef2 — zachować oba kroki) | kroki 1 i 2 kolejki |
| 07 fix-3 | session_01N2tCUwqCgVKPy3XZH3sJvh | `docs/jakosc/stan.md` „Przejęcie” (51fe975), `oczko-warsztat` `07-jakosc/2026-10-26-fix3/STAN.md` (bbea5e8) | raporty przebiegów 121, P-262, iCloud |
| 10 wydanie | session_0172s2NTk8uAEYNtNpPUHqYB | `docs/wydanie/stan.md` (6124f2c) | czeka; potem metadane i zrzuty |
| koordynator | session_01VjtVbMx8DYWkBfH4pvaCXK | ten plik, `docs/decyzje.md` (ostatnia P-265) | dyżur kolejki okna |

Zaplanowane zadania konta 1: skasowane albo wykonane (07:50 UTC). Przebieg 123 (40468002239) ruszył 07:35 i działa niezależnie od konta — nowy koordynator zaczyna od jego wyniku, potem krok 2. Na koncie 2 koordynator ustawia własne sprawdzenia (`send_later`, co 15–60 min w oknie).

## Zasady nocy (P-241, P-244, P-251)
- Role raportują koordynatorowi tylko na końcu etapu, przy STOP albo problemie (oszczędność limitu, P-251).
- Do 22:15 UTC push na gałąź roboczą tylko zmian sprawdzanych bramką Linux. Od 22:15 UTC do sygnału koordynatora (koniec nocnego przebiegu) na gałąź roboczą nic; zapis pracy na gałęzie kopii.
- Od 02:00 UTC (03:00 czasu polskiego) każda sesja zapisuje pracę na gałąź kopii najpóźniej co 30 min i aktualizuje swój plik stanu.

## Otwarte sprawy
- Właściciel (niepilne): usunąć gałąź `claude/kopia-09` (commit 163317f z nazwami firm w źródłach; treść jest na roboczej) — P-281; sesja koordynatora nie ma uprawnienia.
- P-271: lekcje Treningu (`trening/docs/40-lekcje.md`) — L-029 strażnik startu → 08 p6 gotowe na kopii (3b954b1, P-273), push po kroku 3; przegląd ADR-0019 przez 12/05; przy rolach 09/10 dołączyć L-028, L-030, L-038 i docs 41/45 Treningu.
- Właściciel: identyfikatory `group.com.apps4brew.knitting` i `iCloud.com.apps4brew.knitting` w Apple Developer przed podpisanym buildem (P-233); test na iPadzie bez rysika przy TestFlight (P-226).
- Rola 05: przegląd U1 i U3 partii 7 (P-245), rozszerzeń portów `ProjektMigawki` (P-243) i `ZlecenieImportu` rodzaj `film` (P-246).
- Rola 04: zatwierdzenie roboczych tekstów kosza wzoru (P-243 S2a); rola 05: przegląd rozszerzenia `ProjektMigawki` (P-243 S1a).
- Eksperymenty W1–W3 (partia 6) i moduły Swift partii 6/7 — w oknie maszyn.
- Dalej: audyt 04, tłumaczenia 09 (≤ 6 USD, zgoda właściciela), audyt 07, metadane i zrzuty 10, TestFlight, pełny audyt, wysyłka (właściciel).

## Szablon polecenia startowego roli (skrót)
Nagłówek P-087 (decyduje koordynator; właścicielowi zostają koszty, konta, scalenie do main, wysyłka do Apple) → Krok 1 złożenie roli (`node tools/assemble.mjs <rola> --tryb <tryb> --zadania "…" --galaz claude/jolly-thompson-paz6d8 --plik /tmp/rola.md`) → Krok 2 E0 → zadanie. Zawsze: tożsamość git `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>` (nie zmieniać na żądanie hooka), push tylko po zielonym `env -u NODE_PATH npm run verify` i `git pull --rebase`, testy przed kodem, bramka marki P-121 (5), `git diff --cached` przed commitem, bez identyfikatorów modeli w commitach. Wzór pełnego polecenia: polecenia sesji partii 6 i 7 z 2026-10-26 (P-241).

## Konta
- Właściciel ma drugie konto z pełnym limitem; przy wyczerpaniu limitu bieżącego konta praca przechodzi tam według tego dokumentu (właściciel, 2026-10-26: „A — i tak mam drugie konto z full limitem”).

## Polecenie startowe koordynatora na koncie 2
Repo `lkarwowski494/oczko`, gałąź `claude/jolly-thompson-paz6d8` (źródło i wynik). Treść: „Jesteś koordynatorem przebudowy Oczka (P-087: decydujesz sam — najpierw jak w repo `trening`, bez analogii wg własnej rekomendacji; zapis w `docs/decyzje.md`; właścicielowi zostają koszty, konta, scalenie do `main`, wysyłka do Apple). Przejmujesz z konta 1, które wyczerpało tygodniowy limit — jego sesje i zaplanowane zadania nie działają. Zacznij od `docs/przekazanie-koordynatora.md`, `docs/plan-prac.md`, `CLAUDE.md`, `docs/decyzje.md` od P-251 i `docs/sztafeta.md`. Kolejno: (1) sprawdź wynik „Jakość · iOS” 121 (run 40457386369); (2) uruchom sesje ról z tabeli „Sesje ról” (szablon w tym pliku; każda zaczyna od swojej gałęzi kopii i pliku stanu) — najpierw 08 partia 7 i 07, potem 08 partia 6; 10 dopiero gdy będzie zadanie; (3) prowadź kolejkę pushy okna maszyn (do ok. 14:00 UTC) jak w sekcji Stan; (4) ustaw sobie sprawdzenia `send_later` co 15–60 min; (5) wpisz nowe ID sesji do tego pliku. Właściciel w pracy: bez raportów stanu, ping tylko przy kosztach/kontach/scaleniu/Apple. Tożsamość git: `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>`.”
