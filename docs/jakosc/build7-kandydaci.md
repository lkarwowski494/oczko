# Kandydaci do buildu 7 (zegarek watchOS 10 + „przy okazji”)

Rola 07-jakosc · 2026-11-15 · sesja BR. Polecenie właściciela (15.11 ok. 10:00 UTC, przez koordynatora): „Do tego jezeli wyszly jakies rzeczy ktore warto naprawic w nowym buildzie to naprawmy je przy okazji.” Kryterium: realność, wejście do binarki, koszt i ryzyko regresji; bez nowych funkcji (zasada wspólna 18).
Źródła w tym repo: `docs/jakosc/werdykt-build-1161.md` (U1–U5), `docs/wydanie/lista-1-0.md`, `docs/wydanie/test-urzadzenia-build5.md`, `docs/programista/build3-stan.md`, `docs/wydanie/sklep.md`.

## Lista

| # | Kandydat | Źródło | Realność | Binarka | Koszt / ryzyko regresji | Build 7 |
|---|---|---|---|---|---|---|
| 1 | Minimum zegarka watchOS 10.0 | decyzja właściciela; `docs/jakosc/zegarek-watchos10-ocena.md` | realny (zegarek właściciela nie zainstaluje aplikacji) | tak | 08 ok. 45 min + 05 ok. 20 min; regresja niska (0 API z watchOS 11) | **TAK** |
| 2 | Pełny katalog E2E na SHA buildu 7 (U1) | `docs/jakosc/werdykt-build-1161.md:48` | brzegowy (zmiany w `WidokWzoru.swift` i ekranie „Dziś” bez pełnego przebiegu od e270a07) | nie (bramka, nie poprawka) | CI macOS ok. 1–1,5 h, 0 h kodu; okno maszyn poza ok. 14:00–23:00 UTC | **TAK** jako bramka (`[e2e-pelny]` w commicie kandydata, P-091 9a) |
| 3 | Krótki test właściciela na 1161 **teraz** (bez zegarka), zanim powstanie build 7 (U2, A3) | `docs/jakosc/werdykt-build-1161.md:49`; `docs/wydanie/lista-1-0.md` krok 1 | brzegowy | nie | czas właściciela ok. 25 min; zero ryzyka | **TAK** — to jedyne źródło poprawek „przy okazji”, których jeszcze nie znamy; po buildzie 7 test zawężony do zegarka (T-04, T-105–T-107) i tego, co zmieniono |
| 4 | 04-002: drugi pas zakreślenia cieńszy (`modules/oczko-wzor/ios/WidokWzoru.swift`) | `docs/wydanie/test-urzadzenia-build5.md:800` | **warunkowy**: realny tylko, jeśli Z-02 na telefonie = „nie” | tak | 08 + 04 ok. 1 h; regresja: rysowanie wzoru (scenariusze 26, 47 w pełnym E2E, pkt 2) | **TAK pod warunkiem** wyniku Z-02 = „nie” z pkt 3; inaczej NIE (1.0.1) |
| 5 | P-773: krycie znacznika PencilKit (Z-03) | `docs/wydanie/test-urzadzenia-build5.md:801` | warunkowy (Z-03) | tak | jak 4 | **TAK pod warunkiem** Z-03 = „nie” (tekst pod pasem wyblakły) |
| 6 | T-04: instrukcja „włącz przełącznikiem” zamiast przycisku instalacji | `docs/wydanie/test-urzadzenia-build5.md:111`; TestFlight: „install the iOS app first, then go to the App Details page in the Information section” … „there will be a button to install, update, or open it” (testflight.apple.com, odczyt 2026-11-15) | realny (myli testującego) | nie (lista testów) | 10 min, 07 przy liście buildu 7 | **TAK** (w liście testów buildu 7, nie w kodzie): „TestFlight → Oczko → Apple Watch → Zainstaluj albo aplikacja Watch → Dostępne aplikacje → Instaluj” |
| 7 | U3: brak `PrivacyInfo.xcprivacy` w widżecie i rozszerzeniu udostępniania | `docs/jakosc/werdykt-build-1161.md:50` | teoretyczny (kod celów bez API z listy, `manifest-celow.mjs`) | tak | 08 ok. 30 min; nowy plik w dwóch celach | NIE — bez skutku dla użytkownika i bez wymogu; rola 10 przy F1 |
| 8 | U4: 1277 heurystyk tłumaczeń | `docs/jakosc/werdykt-build-1161.md:51` | teoretyczny (nazwy własne, jednostki) | tak | rola 09, wiele języków | NIE |
| 9 | U5: brak dSYM `hermesvm.framework` i `OczkoUdostepnij.appex` | `docs/jakosc/werdykt-build-1161.md:52` | brzegowy (czytelność raportów awarii, nie użytkownik) | tak (ustawienia buildu) | rola 12; zmiana ustawień buildu bez testu = ryzyko dla eksportu | NIE — 1.0.1 z rolą 12 |
| 10 | Opis „Data and sync” w przewodniku sugeruje przełącznik iCloud, którego w 1.0 nie ma | `docs/wydanie/test-urzadzenia-build5.md:794` | brzegowy (G-04: ocena właściciela) | tak (teksty) | 04 + 09: tekst w 35 językach | NIE, chyba że właściciel w G-04 uzna tekst za mylący — wtedy decyzja K |
| 11 | B4: „Add pattern…” w `site/support.html` | `docs/wydanie/lista-1-0.md:60` | realny (instrukcja myląca) | nie (strona) | strona niezależna od buildu | NIE do buildu (1.0.1, DEC-03 b) |
| 12 | B6: zdanie o zegarku w opisie sklepu (2.5.1) | `docs/wydanie/lista-1-0.md:61` | [DO USTALENIA] | nie (metadane) | `asc-metadane`, bez buildu | NIE do buildu; decyzja K po teście zegarka na buildzie 7 |

## Lista TAK do buildu 7

1. Minimum zegarka watchOS 10.0 (pkt 1, lista zmian w `docs/jakosc/zegarek-watchos10-ocena.md`).
2. Bramka: pełny katalog E2E na SHA buildu 7 (pkt 2).
3. Przed buildem: krótki test właściciela na 1161 bez zegarka (pkt 3); od jego wyniku zależą pkt 4 i 5.
4. Warunkowo 04-002 i P-773 (pkt 4, 5).
5. Poprawiona instrukcja T-04 w liście testów buildu 7 (pkt 6).

## Skutek zmiany kandydata (do planu koordynatora)

Build 7 zastępuje 1161 jako kandydata 1.0, więc powtórzyć: A1c (build + Approve), A2 (werdykt 07 na nowym SHA), A3–A4 (test zawężony), C1 (zrzuty na SHA kandydata — zmiana zegarka nie zmienia zrzutów iPhone'a, ale reguła „zrzuty z SHA kandydata” z listy obowiązuje; decyzja K), E15 (wygasić także 1161), E16 (wybrać build 7) — `docs/wydanie/lista-1-0.md`.

## Nie sprawdzono

- Backlog 1.0.1 (`oczko-warsztat/audit/M1-2026-11-10-finalny/backlog-1-0-1.json`) i znaleziska I-003–I-005 z `08-recenzja-2026-11-10` (`docs/programista/build3-stan.md:28`) — w prywatnym repo `oczko-warsztat`, poza tą sesją. Krok: koordynator przegląda je według kryteriów tej tabeli (zasada: P3 = 1.0.1, P-458).
