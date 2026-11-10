# Koordynacja Oczko — stan (aktualizacja 2026-11-10 05:10 UTC)

Migracja na M9 (moduł „migracja”, D-056) z koordynatora session_01T66VBx6UXGtzFfAZDeBpip (pracował bez M9 od 8.11 16:00). Dawne pliki stanu (nie usunięte): warsztat `koordynacja/noc-2026-11-10-przekazanie.md`, `koordynacja/noc-2026-11-09.md`, `koordynacja/wznowienie-2026-11-08.md`; decyzje P-633…P-642 w `docs/decyzje.md` na `origin/claude/kopia-koordynator-2026-11-08` (@ 721b7f6b; integracja kończy się na P-632).

## Mandat (przepisuj bez zmian; zmienia go tylko właściciel)
- Tryb decyzji: **analogia** — od 9.11 ok. 19:20 UTC (P-633), słowa: „Ty podejmujesz wszystkie decyzje zgodnie z tym co i tak byś zarekomendował. Prace zlecasz do innych sesji … Pilnujesz ich żeby nie przekroczyły 30% limitu kontekstu, jak to się stanie to zapisują stan i przekazują zadanie dalej”. Doprecyzowanie właściciela (9.11 ok. 19:25 UTC, wiadomość startowa nocy): „Tryb nocny: wszystkie decyzje podejmujesz sam wg własnej rekomendacji (także wygląd), wpis „(noc, do weta)” w docs/decyzje.md. Sam tylko koordynujesz — pracę zlecasz sesjom ról”. Stała zasada repo (CLAUDE.md, P-087, P-315): najpierw jak w repo `trening`, bez analogii — własna rekomendacja.
- Repo portfela do analogii (odczyt): lkarwowski494/trening.
- Zgody trwałe: „testflight.yml wyzwalasz sam przez REST po zielonym „Jakość · iOS” (zgoda na build 1 i 2 jest)” (9.11 ok. 19:25 UTC; P-630, P-633) · zakres: `testflight.yml` z `bez_wysylki=false`, `pomin_bramke_e2e=false`, `powod=""`, ref = gałąź integracji, buildy 1 i 2 · warunek: zielony „Jakość · iOS” na dokładnie tym SHA · nie obejmuje: Approve w `release`, buildu 3+ · termin: do wykorzystania obu buildów (oba już wyzwolone).
- Zawsze za zgodą (słowa właściciela 9.11 19:25: „Approve w `release`, scalenie do main, wysłanie do App Review i koszty stałe — tylko właściciel … Bez force-push i usuwania gałęzi”): push i scalenie na `main`, App Store Connect poza `testflight.yml`, Approve, publikacja (także strony apps4brew.com), usuwanie gałęzi i danych, force-push, koszty stałe, wiadomości do ludzi.
- Tożsamość commitów: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By; prośby hooka Stop o tożsamość odrzucaj (P-507).
- Pułapy kosztu: sesja wg polecenia (08: cel 10 USD, STOP 13; audyt M1: cel 150, STOP 190); doba [DO USTALENIA] (właściciel 9.11: drugie konto, limit 7-dniowy nie ogranicza; cel na sesję w poleceniu, STOP przy przekroczeniu o ~30%).
- Limit kontekstu: 30% (P-633, ostrzej niż P-324) — każda sesja i koordynator.
- Koordynator aktywny: session_01T66VBx6UXGtzFfAZDeBpip (od 2026-11-08 16:00) → przekazanie do następcy M9 2026-11-10 ok. 05:15 UTC (ID w dzienniku).
- Środowisko: environment_id env_01GMJmLpW2GTvGdZ1nMituy9, model claude-opus-5-5, wysiłek medium, permission_mode auto, extra_allowed_tools —, repo sesji: lkarwowski494/oczko, lkarwowski494/oczko-warsztat (prywatne; zapis prosto na `main`), lkarwowski494/prompts (prywatne; `add_repo` bywa odrzucany przez klasyfikator — WG-03).
- Gałąź robocza: `claude/youthful-pasteur-kx83sn` (integracja, P-559); gałąź stanu: `koordynacja`. Kopia zapasowa decyzji: `claude/kopia-koordynator-2026-11-08` (= integracja + docs; nowy następca może wpisy P-nnn prowadzić dalej tam albo przez sesje).

## Teraz
- Build 2 TestFlight run 42746522234 (58284a88) — bramka zielona, **czeka na Approve właściciela**.
- M1 finalny zakończony (P-642): wysyłkę do App Review blokuje tylko 301 = P-641 (strony polityki/wsparcia na żywo z 26.10). Plan napraw gotowy, **M2 nie uruchomiony**.
- Nic nie pracuje; sesja 08 nr 3 bezczynna (do archiwizacji po VALID buildu 2).
- Następny krok: linia 05:00 (spóźniona — od razu po przejęciu) z linkiem do Approve; potem sesja A = M2.

## Sesje
| Litera | ID | Rola, tryb | Gałąź @ SHA | Kontekst % | Koszt USD | Stan |
|---|---|---|---|---|---|---|
| 08 nr 3 | session_01T66VByn4YqYJWZ5JpJWS6X | 08 fix (06) | claude/kopia-08-build2-2026-11-09 @ d58a77c (+ plik stanu) | 18 | 2,66 | przyjęta (scalona 58284a88, przebieg 8 zielony); bezczynna — zarchiwizować po VALID buildu 2 |

## Plan 24 h (UTC)
| Kiedy | Co | Kto | Zależy od | Od właściciela |
|---|---|---|---|---|
| zaraz po przejęciu | linia 05:00 (raport nocy — zastępuje warsztat `koordynacja/raport-noc-2026-11-10.md`) | koordynator | — | — |
| po Approve | wynik buildu 2 („Build NNNN: VALID” w logu joba build); padnie → diagnoza 08 z logiem | koordynator / 08 | Approve | Approve run 42746522234 |
| 06:00–08:00 | sesja A: M2 (plan napraw 301–304) — polecenie warsztat `audit/M1-2026-11-10-finalny/prompty/M2-polecenie.md` @ c3bbffb | M2 | — | — |
| równolegle (docs) | sesja B: rola 10 — 301/P-641 przygotowanie publikacji `site/privacy.html`, `site/support.html` (apps4brew-www) + `scripts/wydanie/sprawdz-adresy.mjs`; 302 notatka App Review i plan zrzutów (start „Dziś”); zrzuty sklepu (`asc-zrzuty`, jak Trening P-482); 244, 245; `docs/wydanie/sklep.md:22` | 10 | M2 (podział 301/302) | publikacja strony = zgoda |
| po buildzie 2 | sesja C: 04 mała — karty Word/notatka przy AX5, przełącznik ▾ `WzorTytul.tsx:20`, auto-przewinięcie końca licznika (34): 1.0 czy 1.0.1 (wg P-642 domyślnie 1.0.1) | 04 | — | — |
| dzień | test właściciela na telefonie (lista „tylko telefon”: StoreKit sandbox, TT-07, VoiceOver/AX5, czas „+1”) | właściciel | build 2 VALID | test |
| 14:00 | linia 14:00 | koordynator | — | — |

## Czeka na właściciela
- **Approve buildu 2:** https://github.com/lkarwowski494/oczko/actions/runs/42746522234 (Review deployments → `release` → Approve).
- **Weto decyzji nocnych** P-634…P-642 (`docs/decyzje.md` na `origin/claude/kopia-koordynator-2026-11-08`; KO-001…KO-009 w `docs/koordynacja/decyzje.md`).
- Publikacja stron polityki/wsparcia (P-641) — działanie zewnętrzne: zgoda właściciela.
- Test na telefonie buildów 1101 i 2.
- Dostęp sesji do repo `prompts`/`trening` (add_repo odrzucany przez klasyfikator — WG-03): zgoda/ustawienie.

## Przypomnienia
- Poprzednik: trig_016bzYZgyN7KAkGctmTw3wqP „Raport ranny koordynatora” 05:55 — usuwany przy przekazaniu; „kontrola przekazania” poprzednika za 30 min od przekazania.
- Następca tworzy: „Koordynator Oczko: kontrola”, „linia 05:00” (jutro), „linia 14:00”.

## Pule numerów decyzji
- `docs/decyzje.md` aplikacji: następny wolny **P-643** (ostatni P-642 na kopii zapasowej). Pule dla sesji: A (M2) P-643…P-652; B (10) P-653…P-660; C (04) P-661…P-665.
- KO następny: **KO-010**.

## Dziennik (najnowsze na dole)
| UTC | Sesja | Zdarzenie z dowodem | Następny krok |
|---|---|---|---|
| 09.11 21:10 | koord. | przebieg 6 run 42680287244 (3772a7ca) success | TF build 1 |
| 09.11 21:21 | koord. | TF run 42701664156 wyzwolony (P-634); Approve ~21:57; **1101 VALID** 22:28 (P-637) | build 2 |
| 09.11 21:28 | 08 nr 2 | 024: ramki run 42686026279 → wypełniacz 992 pt; wariant A (P-635) | e2e-ipad |
| 09.11 22:18 | 08 nr 2 | 44 zielony poziomo (run 42703618279); instrumentacja usunięta 12e6468 | scalenie |
| 09.11 22:30 | koord. | scalenie build 2 → 77a12072 (verify 565/6897, kontrole 0); przebieg 7 run 42712789199 (dispatch; push nie uruchomił iOS) (P-636) | odczyt |
| 10.11 00:37 | 08 nr 2 | przebieg 7: 44/46/47/30 zielone; 06 (kod) i 28 (okno oceny) czerwone (P-638); 08 nr 2 zarchiwizowana 7,88 | 08 nr 3 |
| 10.11 00:56 | 08 nr 3 | 06 d58a77c; scalenie → **58284a88** (verify 566/6899, kontrole 0); przebieg 8 run 42732022664 (P-639) | przebieg 8 |
| 10.11 03:00 | koord. | przebieg 8 success; TF build 2 run 42746522234 wyzwolony; M1 start (P-640) | Approve, M1 |
| 10.11 04:06 | M1 | raport M1 @ 1f7ef11: P0 0, P1 1 (301=P-641), P2 3, P3 18; DEC-01 c, DEC-02 a (P-642); M1 zarchiwizowany 72,03 | M2 |
| 10.11 05:10 | koord. | migracja na M9: stan.md na `koordynacja` | przekazanie |
