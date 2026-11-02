# Plan prac Oczka do wydania 1.0 (stan bieżący, koordynator, 2026-11-01)

Historia planu z 2026-10-27: `docs/plan-prac-historia-2026-10-27.md`. Decyzje do P-314. Daty, czas i tokeny to szacunki **[OCENA]**, nie zobowiązania. Okno maszyn macOS: ok. 23:00–14:00 UTC (P-187, P-307); poza nim praca bez macOS (P-297, P-311). Sesje ról: sonnet/high (P-310), jedna sesja = jedno zwarte zadanie (P-312). Tokeny = cała sesja z odczytami cache; koszt stały promptu roli ok. 15–20 tys. tokenów na turę.

## Stan wyjściowy
Kod 1.0 kompletny (etap 1 zamknięty, P-299); audyty 04 (P-301) i 07 (P-305) przyjęte; przekład 34 języków maszynowy (P-309). Czekają trzy kopie: 08 (`claude/kopia-partia-7-2026-10-30-b`), 09 (`claude/kopia-09-2026-10-30`), 07 (`claude/kopia-07-2026-10-30`) — szczegóły w `docs/przekazanie-koordynatora.md`.

## Kolejność do wydania (P-320, właściciel 2026-11-01: „zrzutów nie ma sensu robić przed audytem”)
**Przed audytem — tylko to, co szuka i naprawia błędy albo buduje narzędzia:** integracja kopii i pełny przebieg, raport E2 (07), aneks audytu 04 (warianty AX5, iPad, poziomo, ciemny — domknięcie P-301), poprawki 08 (z E2, aneksu, W1-A), kontrakt `select-xcode` (P-313), plan testu na urządzeniu z zegarkiem (P-316, sam plan), środowisko `release` i workflowy ASC z Treningu (10, infrastruktura), instrukcja kroków właściciela (bez A6).
**Pełny audyt (M1, opus/high, P-293) na kodzie po poprawkach; od jego startu zamrożenie zakresu — tylko naprawy blokerów (jak Trening, „Audyty i wydania” pkt 3).**
**Dopiero z buildu kandydata (po naprawach audytu):** zrzuty sklepu (scenariusz, dane pokazowe, ramki, podpisy, kadry 04), metadane en ostateczne i ich przekład na 35 języków (09), fala przekładu zmienionych kluczy UI (jedna, po audycie), przeglądy rodzime i przekład zwrotny, commit wydania 1.0.0 + `tests/bazy/v1.db` (P-306: zamraża schemat), wdrożenie schematu CloudKit do Production (A6 — nieodwracalne), build TestFlight i test właściciela na urządzeniach (inaczej test do powtórki), App Privacy, notatka do recenzji, metadane i zrzuty w App Store Connect, wysyłka.

## Plan 2.11 (P-368; UTC) [OCENA]
| Kiedy | Tor | Sesja | Co | Wynik |
|---|---|---|---|---|
| ~05:00– | B | 10 (sonnet) | P-349 (1) Content Rights, (3) `check-urls` jak Trening, (4) lista wytycznych | kopia, verify 0 |
| ~05:00– | C | 04 (sonnet) | znaleziska P2 z P-364 → `docs/design/` | lista dla 08 |
| po cz. 3 #137 (~05:20) | A | 07 (sonnet) | raport E2 #137 (07/20/36, 30) | `07-jakosc/2026-11-02-e2-137/` |
| ~06:30–10:00 | A | 08 (sonnet, ≤ 2 ID/sesja, równolegle) | poprawki z 07 i 04 | kopie, verify 0 |
| ~10:30 | A | koordynator | scalenie, verify, jeden push `[e2e-pelny] [e2e-ciemny]` | przebieg 4 (~10:30–13:00) |
| w czasie przebiegu 4 | — | 07; koordynator | 032 (033 na noc); polecenie M1 | — |
| po zielonym przebiegu 4 | — | M1 (opus/high) | pełny audyt (P-293) | raport z werdyktem |

## Harmonogram 1–4.11 (UTC; czas polski = UTC+1) — P-319, P-320
| Kiedy | Sesja (sonnet/high) | Co | Wynik / dowód | Czeka na |
|---|---|---|---|---|
| 1.11 17:10– | **07** (faza A) | **zgodność kodu z zakresem 1.0 — 51 funkcji MVP (P-321)**; kontrakt `select-xcode.sh` (P-313); zegarek w planie testu na urządzeniu (P-316) | hashe kopii, verify 0 | — |
| 1.11 17:10– | **10** (tylko faza A, potem koniec) | środowisko `release`; workflowy ASC z Treningu; szkic metadanych en (bez zamrożenia); instrukcja właściciela (A6 po audycie) | `docs/wydanie/kroki-wlasciciela-testflight.md` | — |
| 1.11 23:00 | **08 integracja** (faza B) | merge roboczej, verify, pushe 08 → 09 → 07 (`[e2e-pelny] [e2e-ciemny]`) | numer przebiegu, build ze Swift 35 języków | okno macOS |
| 1.11 23:10–2.11 ~01:30 | CI | pełny przebieg (ok. 2–2,5 h) | artefakty | maszyny |
| 2.11 ~01:30– | **07** (faza B) | raport E2 + aneks werdyktu; lista błędów aplikacji dla 08 | raport `07-jakosc/2026-11-02-e2/` | przebieg |
| 2.11 ~01:30– | **04** (nowa) | aneks audytu 2.1: AX5, iPad, poziomo, ciemny, długości etykiet 35 języków, krój 700 (bez kadrów zrzutów) | raport aneksu, lista zmian | przebieg |
| 2.11 ~03:30–12:00 | **08** (sesja integracji) | poprawki z 07 i 04, W1-A, push kopii 07 i 10 z fazy A; HEAD z `[e2e-pelny]` | przebieg 2 zielony do ~13:30 | raporty 07, 04 |
| 1.11 18:10– | **03**, **05**, **04** (nowe, równolegle) | przygotowanie partii 8 (P-326): kontrakt wg D2; klucze `ustawienie`, kopia przed „Replace”, porty skrzynki i zegarka; projekty i teksty en | dokumenty na roboczej | — |
| 2.11–5.11 | **08** partie 8a–8e (P-326) | 33 luki z raportu zgodności (test przed kodem); 8d, 8e w oknie macOS | przebiegi zielone | 03, 05, 04 |
| po 8a–8e | **07** | 032 (testy tras), 033 (E2E brakujących funkcji) | przebieg pełny zielony | partia 8 |
| ok. 6–7.11 | **M1 audyt** (opus/high) | pełny audyt kodu kandydata (12, 07, 04, 05), OG-07; zamrożenie zakresu | raport z werdyktem i listą blokerów | przebieg 2 |
| 2.11/3.11 noc | **08** (nowa) | naprawy blokerów z audytu (test przed kodem), przebieg | przebieg zielony | raport M1 |
| 3.11 dzień | **09** (nowa) | jedna fala przekładu zmienionych kluczy; metadane sklepu 35 języków z zamrożonych en | kontrole błędy 0 | naprawy |
| 3.11 dzień | **10** (nowa) + **04** | metadane en ostateczne; kadry i podpisy; scenariusz i workflow zrzutów jak Trening (`store-screenshots`) | — | naprawy |
| 3.11/4.11 noc | **08** + **10** | commit wydania 1.0.0 + `v1.db`; przebieg; zrzuty z buildu kandydata; `testflight.yml` (zatwierdza właściciel) | build kandydata w TestFlight, zrzuty | kroki właściciela A1–A5, B2 |
| 4.11 | **właściciel** | A6 CloudKit → Production (po audycie); test na telefonie, iPadzie i zegarku (pierwsza część ok. 5 min) | wypełniona lista | build |

Właściciel po audycie (P-320, P-322): A1–A5 i B2 z `docs/wydanie/kroki-wlasciciela-testflight.md` (ok. 65–75 min).

**Pomiar tokenów (zastępuje wcześniejsze szacunki, które były ok. 10× za niskie):** sesja 10 faza A (sonnet, 22 min) — 39,2 M odczytów cache, 0,40 M zapisu cache, 0,13 M wyjścia, 6,82 USD wg `get_session` (`usage`), 2026-11-01. Przelicznik [OCENA]: sesja sonnet ok. 15–20 M odczytów cache na 10 min pracy; opus ok. 1,7× droższy za token. Szacunek do 4.11 [OCENA]: 8–10 sesji ról, ok. 300–600 M odczytów cache, ok. 50–120 USD równowartości limitu; największe: audyt M1 (opus) i zgodność 1.0 (opus). Kolumny „Tokeny” w tabeli kroków niżej są nieaktualne.

## Kroki do wydania
| # | Krok | Rola / sesja | Okno | Zależy od | Dowód ukończenia | Czas agenta | Tokeny |
|---|---|---|---|---|---|---|---|
| 1 | Pushe kopii 08 → 09 → 07 na roboczą, HEAD z `[e2e-pelny] [e2e-ciemny]`, jeden pełny przebieg | 08 integracja (1 sesja, P-312) | macOS, start 23:00 UTC 1.11 | — | 3 pushe fast-forward, verify kod 0 przed każdym; numer przebiegu | 1–1,5 h | 2–4 M |
| 2 | Wynik przebiegu: raport E2 (bramka, scen. 15, 30, 35, 53, 44–52, ciemny), klasyfikacja porażek, aneks werdyktu; test kontraktu `select-xcode.sh` (P-313); zegarek w planie testu na urządzeniu i strategii §8 (P-316) | 07 (1 sesja) | po końcu 1 (ok. 01:30–02:30 UTC) | 1 | raport w `oczko-warsztat`, `sprawdz-raport` OK | 1–2 h | 3–5 M |
| 3 | Aneks audytu 04: AX5, iPad, poziomo, ciemny, długości etykiet 35 języków (pl/vi/es-419 `licznik.po_dodaniu`, nb `ukonczenie.dni_*`), krój 700 na zrzucie licznika; kadry i podpisy zrzutów sklepu | 04 (1 sesja, równolegle z 2) | bez macOS (zrzuty z artefaktów) | 1 | raport aneksu, lista zmian z kluczami | 1–2 h | 3–5 M |
| 4 | Poprawki z 2–3 (kod i teksty), W1-A pusta strona 2 (scen. 53), scenariusz „zrzuty-sklepu” z fikcyjnymi danymi (plan `docs/wydanie/metadane/zrzuty-plan.md`, opcja A); przy zmianie en — fala przekładu tylko zmienionych kluczy (09, `DELTA`) | 08 (1 sesja) + 09 (krótka, tylko gdy en się zmieni) | kod bez macOS, push w oknie do ok. 12:00 UTC 2.11 | 2, 3 | verify kod 0, przebieg zielony, artefakty zrzutów | 2–4 h | 4–8 M |
| 5 | Zrzuty sklepu (iPhone 1320×2868, iPad 2064×2752) z artefaktów, kontrola `file`, metadane en z „crafting days” (P-302), metadane sklepu w 35 językach; workflowy ASC z Treningu (`asc-metadane`, `asc-zrzuty`, `store-screenshots`, P-316) | 10 + 09 (2 sesje, równolegle) | bez macOS | 4 | `sklep.md` §5, `en.store.json`, pliki metadanych języków | 1–2 h + 1–2 h | 2–4 M + 3–5 M |
| 6 | **Właściciel:** A1–A4, A6 (App Group, kontener iCloud, możliwości App ID, cele, schemat CloudKit do Production), A5 = skopiowanie 3 sekretów klucza ASC z Treningu do środowiska `release` Oczka (P-316), B2 produkty Oczka; **B1 Paid Apps już zrobione** (P-316); B3 — rola 10 u źródła — `docs/wydanie/testflight-lista.md` | właściciel | dowolnie, najlepiej do 2.11 | — | odpowiedź „zrobione” + zrzut ekranu bez sekretów | — | — |
| 7 | Commit wydania: wersja 1.0.0 + `tests/bazy/v1.db` razem (P-306, patch `oczko-warsztat` `08-programista/2026-10-30/`) i build podpisany, `testflight.yml`, wysyłka do TestFlight | 08 (commit) + 10 (build) — 1 sesja 10 z commitem 08 przygotowanym w kroku 4 | macOS | 4, 5, 6 | build w TestFlight, numer buildu | 1–2 h | 2–4 M |
| 8 | **Właściciel:** test na iPhonie i iPadzie wg `docs/jakosc/testflight-na-urzadzeniu.md` (U1–U12, TT-01–TT-11, ZM-06 iCloud; zegarek wraca do testu — P-316 koryguje P-290) | właściciel | po 7 | 7 | wypełniona lista | — | — |
| 9 | Pełny audyt przed live na opus/high (warunek P-293): `M1-audytor-generalny --tryb audit` (12, 07, 04, 05 w jednym), weryfikacja patentowa funkcji wzoru OG-07 (P-218) | M1 (1 sesja, opus/high — wyjątek od P-310 z P-293) | bez macOS | 7 (kod kandydata) | raport z werdyktem | 3–5 h | 10–20 M |
| 10 | Poprawki blokerów z 8–9, przebieg, build 2 do TestFlight | 08 + 10 (1–2 sesje) | macOS | 8, 9 | przebieg zielony, build | 2–4 h | 4–8 M |
| 11 | **Właściciel:** scalenie do `main` (P-313: konflikt z DEC-35 — wygrywa robocza), App Store Connect (metadane, zrzuty, App Privacy „Data Not Collected” wg P-300), „Submit for Review”; wydanie ręczne po recenzji. **Workflowy `asc-*.yml` działają dopiero po scaleniu do `main`** (`workflow_dispatch` tylko z plikiem na gałęzi domyślnej; P-319, dowód `docs/wydanie/sklep.md` §2–§3b); pierwszy zapis metadanych na jednej lokalizacji (`tylko = en-US`) | właściciel (z gotową listą od 10) | — | 10 | status „Waiting for Review” | — | — |

## Kolejność i kalendarz [OCENA]
- **1.11 16–23 UTC (bez macOS):** decyzje P-310–P-314, ten plan, polecenie startowe sesji integracyjnej 08. Nic innego nie jest gotowe do pracy bez wyniku przebiegu (krok 3 potrzebuje zrzutów).
- **Noc 1/2.11:** krok 1 (23:00) → pełny przebieg ok. 2–2,5 h → kroki 2 i 3 równolegle (ok. 02:00–04:00) → krok 4 (push do ok. 12:00).
- **2.11 po południu:** krok 5 (bez macOS); krok 6 u właściciela.
- **Noc 2/3.11:** krok 7 (gdy 6 zrobione). **3–4.11:** kroki 8 i 9 równolegle. **4–6.11:** krok 10. **Najwcześniej 6–7.11:** krok 11; recenzja Apple zwykle 1–3 dni [DO SPRAWDZENIA u źródła w dniu wysyłki].
- Suma pracy agentów: ok. 16–30 h, ok. 40–80 M tokenów [OCENA]; najdroższy jest krok 9.

## Od właściciela
Krok 6 (ok. 20–40 min, najlepiej do 2.11; Paid Apps już jest, klucz ASC kopiowany z Treningu — P-316), krok 8 (ok. 70–90 min), krok 11 (ok. 30 min + zgody). Plus: usunięcie nieaktualnych gałęzi kopii (lista w przekazaniu). Przed każdym pytaniem do właściciela — najpierw Trening (P-315).

## Ryzyka
Okno maszyn (każda poprawka natywna = jedna noc); Swift z 35 językami i `Intl.PluralRules` na Hermes jeszcze nie kompilowane na macOS (krok 1 to pierwszy dowód); przekład bez przeglądu człowieka (D-027); pytania Apple przy recenzji; OG-07 może wyciąć zrzuty 2 i 4.

## 1.1 (bez zmian)
Atlas technik z rysunkami SVG, Live Activity z pauzą, MetricKit, funkcje wg danych z App Store, zakresy szydełkowe CYC (P-304 (b)) — szczegóły w historii planu.
