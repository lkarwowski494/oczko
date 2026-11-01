# Plan prac Oczka do wydania 1.0 (stan bieżący, koordynator, 2026-11-01)

Historia planu z 2026-10-27: `docs/plan-prac-historia-2026-10-27.md`. Decyzje do P-314. Daty, czas i tokeny to szacunki **[OCENA]**, nie zobowiązania. Okno maszyn macOS: ok. 23:00–14:00 UTC (P-187, P-307); poza nim praca bez macOS (P-297, P-311). Sesje ról: sonnet/high (P-310), jedna sesja = jedno zwarte zadanie (P-312). Tokeny = cała sesja z odczytami cache; koszt stały promptu roli ok. 15–20 tys. tokenów na turę.

## Stan wyjściowy
Kod 1.0 kompletny (etap 1 zamknięty, P-299); audyty 04 (P-301) i 07 (P-305) przyjęte; przekład 34 języków maszynowy (P-309). Czekają trzy kopie: 08 (`claude/kopia-partia-7-2026-10-30-b`), 09 (`claude/kopia-09-2026-10-30`), 07 (`claude/kopia-07-2026-10-30`) — szczegóły w `docs/przekazanie-koordynatora.md`.

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
| 11 | **Właściciel:** scalenie do `main` (P-313: konflikt z DEC-35 — wygrywa robocza), App Store Connect (metadane, zrzuty, App Privacy „Data Not Collected” wg P-300), „Submit for Review”; wydanie ręczne po recenzji | właściciel (z gotową listą od 10) | — | 10 | status „Waiting for Review” | — | — |

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
