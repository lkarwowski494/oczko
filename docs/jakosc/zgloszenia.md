# Zgłoszenia roli 07 do innych ról
Jedno miejsce zgłoszeń roli 07 (P-090 Q3a): zapisane teraz, poprawki zbiorczo — 01 i 02 w jednej sesji fix przed rolą 08; 03 i 04 przy najbliższej sesji. Status zmienia rola, która poprawia.

| ID | Do | Co | Dowód | Status | Testy zależne |
|---|---|---|---|---|---|
| ER-34 | 01 | RD-10: luka 25,5 „poza tabelą” a P-084 / `KL4-25_5` → {2}; RD-10-W2 = `2.3` zamiast zbioru | `docs/brd/reguly.md:157`, `tests/wektory/brd.json` RD-10-W2 | naprawione-do-weryfikacji (rola 01, fix 2026-10-25, P-097; `docs/brd/errata.md`) | klasyfikacja grubości (wyrocznia: `docs/tresci/wektory.json`) |
| ER-35 | 01 | OP-03 otwarte w BRD, rozstrzygnięte P-081 P3a | `docs/brd/README.md:103` | naprawione-do-weryfikacji (rola 01, fix 2026-10-25, P-097; `docs/brd/errata.md`) | BR-KAL-003/S1 |
| ER-36 | 01 | kryteria niejednoznaczne (BR-LIC-004/S1–S2, BR-LIC-005/S2, BR-LIC-020/S2, BR-WZR-007/S3, BR-DNI-006/S1) | `e0/kryteria.md`, „Luki” | naprawione-do-weryfikacji (rola 01, fix 2026-10-25, P-097; `docs/brd/errata.md`) | te scenariusze (test według propozycji brzmienia) |
| Z07-01 | 02 | tabela „Testy, których nie zrobi Node” z modelu B: „dane do odczytu” przeczy KP-02 V4; brak scenariuszy subskrypcji W-15–W-18; lista do zastąpienia listą kontrolną P-090 Q1a | `docs/monetyzacja.md:581–593`, `:51` | naprawione-do-weryfikacji (rola 02, fix 2026-10-25, P-103; dowody `oczko-warsztat/02-monetyzacja/2026-10-25-fix-z07/E2-dowody.md`) | lista „tylko telefon” w strategii |
| Z07-02 | 02 | L-07 i L-13 cytowane w BR bez wektora; przekazanie mówi „L-01–L-15, 14 z 14” (jest 17 + S 10 + Z 8) | `docs/monetyzacja/wektory-limitu.json`, `docs/brd/wymagania-dane.md:62, :194, :273` | naprawione-do-weryfikacji (rola 02, fix 2026-10-25, P-103; dowody `oczko-warsztat/02-monetyzacja/2026-10-25-fix-z07/E2-dowody.md`) | BR-ZAK-005, BR-ZAK-007 (scenariusze z L-07, L-13) |
| Z07-03 | 03 | BR-ZAK-005–007 i BR-DAN-012 w wersji 1 bez funkcji F w tabeli zakresu; przekazanie dla 07 wymienia tylko BR-ZAK-001–004 | `docs/scope-contract.md:47, :219` | otwarte | testy tych BR mają w nazwie „F-—” |
| Z07-04 | 03/04 | BR-LIC-012 (F-09, tryb „rząd w trakcie”) a ekran zawsze z „Now knitting row N” | `docs/design/design-spec.md:30` | otwarte | BR-LIC-012 |
| Z07-05 | 04 | stany bez zrzutu wzorcowego (zablokowany, seria stuknięć, błąd zapisu, offline, pusty, oferty z subskrypcją / bez sieci) i ekrany nienarysowane (wzór poziomo, zegarek, ekran blokady, kalendarz, Ustawienia, tryb awaryjny ADR-0019, okno „Uczciwe zasady” P-089); ok. 20 stanów z BR bez makiety | `design-spec.md:51–57, :95`; `e0/kryteria.md` | otwarte | testy ekranów tych stanów: zapytania po roli bez etykiety wzorcowej |
| Z07-06 | 01/04 | NFR-DOS-002, NFR-WYD-001 bez progu (OP-16, OP-17) | `docs/brd/README.md:116–117` | otwarte | pomiar bazowy informacyjny do czasu progu |

## Zgłoszenia z E1 (2026-10-25)
Pełny opis, dowód (`plik:linia` albo komenda), propozycja i testy zależne: [`e1/zgloszenia-e1.md`](e1/zgloszenia-e1.md).
| Do | ID | Temat |
|---|---|---|
| 01 | ER-37–ER-44 | RD-16 strefy i DST; arytmetyka RD-14/07/15/11 i tolerancja; schemat `brd.json`; reguły licznika (RD-17 a scalone stuknięcia, RD-12, RD-13); cofnięcie ze środka historii; import „scal”; liczby w 35 lokalizacjach; dni przy północy |
| 02 | Z07-07–Z07-09 | wektory limitu (L-04c, L-04d, Z-09, Z-10); wektory dostępu (W-19, karencja, zakup oczekujący, Pro na zegarku); reguły produktu (dzień ukończony dla okna „Uczciwe zasady”, seria a dzień limitu, `pro` przy scaleniu) — naprawione-do-weryfikacji (rola 02, fix 2026-10-25, P-103; dowody `oczko-warsztat/02-monetyzacja/2026-10-25-fix-z07/E2-dowody.md`); L-19 też |
| 04 | Z07-10 | liczba 5-cyfrowa przy AX5, ostrzeżenie o metadanych przy eksporcie, stan „czeka” |
| 05 | Z07-11–Z07-19 | intencja i dziennik +1 (M-10, złoty plik TS↔Swift); kontrakt stanu Live Activity i zegarka; `scal` iteracyjne i M-09; iCloud (kolejność, schemat CloudKit); migracje i plan zapytań; obejścia narzędzi; wzory i `.oczko`; wstrzyknięty zegar; kontrola podpisanego `.ipa`  — naprawione-do-weryfikacji (rola 05, fix 2026-10-25, P-110; dowody `oczko-warsztat/05-architekt/2026-10-25-fix/E2-dowody.md`) |
| 10 | Z07-20 | lista wydania (eksport, IAP w pierwszej wersji, notatka dla recenzenta) |
| 12 | Z07-21 | start w tle po aktualizacji, limit kopii, czas migracji wobec watchdoga, Xcode |
| 09 | Z07-23 | `scripts/sprawdz-i18n.mjs` szukał `typescript` tylko względem katalogu roboczego; w CI (bez globalnego `NODE_PATH`) 2 testy `tests/i18n/sprawdz-i18n.test.ts` padały (run 40223002065). Poprawka minimalna roli 07 (zapasowo względem repo skryptu, 2026-10-25) — do przeglądu przez 09 |
| 05 | Z07-22 | sygnatury przypadków użycia, danych i ekranów zaproponowane przez 07 w E3 (`src/przypadki-uzycia/**`, `src/dane/**`, `src/ekrany/**`, typy w `src/przypadki-uzycia/porty-propozycja.ts`) — zatwierdzenie i przeniesienie typów portów do `src/domena/porty.ts` w sesji fix 05 (P-091 11a) — naprawione-do-weryfikacji (rola 05, fix 2026-10-25, P-110; dowody `oczko-warsztat/05-architekt/2026-10-25-fix/E2-dowody.md`) |
