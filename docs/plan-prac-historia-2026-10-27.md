# Plan prac Oczka od 2026-10-27 do 1.1 (dla koordynatora na koncie 2)

Stan wyjściowy: `docs/przekazanie-koordynatora.md` (kolejka okna maszyn, kopie ról), decyzje do P-268. Zakres 1.0 = pełne MVP z wzorami (F) i iCloud (G) według P-217. Ten plik zastępuje harmonogram z `docs/plan-app-store.md`, który był pisany dla kierunku C (P-181). Plan 1.1 w tamtym pliku obowiązuje, ale bez pozycji przeniesionych do 1.0. Daty to szacunki [OCENA], nie zobowiązania. Okno maszyn macOS to codziennie ok. 00:00–14:00 UTC (P-187). Każda poprawka natywna to jeden dzień kalendarza.

## Etap 0: dziś, okno do ok. 14:00 UTC (kolejka P-268)
| # | Zadanie | Kto | Warunek startu | Dowód ukończenia |
|---|---|---|---|---|
| 0.1 | Wynik przebiegu 123 (40468002239: P-262 ×3 + F07-30) | koordynator, 07 | koniec przebiegu (ok. 09:10) | raport 07 `E2-przebieg-123.md`, bramka 01–09 + 33; P-262 (a): odstęp paska > 0, inaczej STOP partii 7 z opcjami (1) InputAccessoryView, (2) ScrollView |
| 0.2 | Krok 2: partia 6 (`claude/kopia-partia-6`: 7af7ef2 + scen. 52) → 07 (patch 185219e z `oczko-warsztat` 4ae8f46, `git am`) → partia 7 (`claude/kopia-partia-7-krok2` 49d32c6) z `[e2e-pelny]` | 08 p6, 07, 08 p7 | 0.1 zakończone | przebieg zielony, scen. 30, 36, 51, 52 |
| 0.3 | Krok 3: partia 7 iCloud e996bae + 339a85b (pola NULL, XCTest wektorów) + hook P-260 (`claude/kopia-koordynator-p260`) z `[e2e-pelny]` | 08 p7, koordynator | 0.2 zakończone, okno trwa | build zielony, `swift test` iCloud N z N, `npm ci` instaluje hook |
| 0.4 | Jeśli okno się skończy przed 0.3 → przenieść 0.3 na następną noc. Wieczorem na gałąź roboczą idą tylko zmiany sprawdzane bramką Linux | koordynator | — | wpis w przekazaniu |

## Etap 1: domknięcie kodu 1.0 (ok. 27–30.10)
| # | Zadanie | Kto | Zależy od | Można zacząć teraz? |
|---|---|---|---|---|
| 1.1 | Pozostałe funkcje partii 6 (wzory: PDF, zdjęcie → PDF, WWW/Word/film, zakreślanie, rysik, iPad, rozszerzenie) według `docs/programista/partia-6.md` | 08 p6 | 0.2 | **tak** — praca w TS na kopii, Swift w oknie |
| 1.2 | Partia 7 iCloud: reszta listy z `partia-7.md` (XCTest, stany 04, ZM-06) | 08 p7 | 0.3 | **tak** — TS na kopii |
| 1.3 | Przeglądy 05: U1 i U3 partii 7 (P-245), porty `ProjektMigawki` (P-243 S1a), `ZlecenieImportu` rodzaj `film` (P-246); reguła wersji pól iCloud przy migracji schematu (P-264) | 05 | nic | **tak** — tylko dokumenty i kod jako materiał |
| 1.4 | 04: teksty kosza wzoru (P-243 S2a), rodzaj przycisku `niszczacy` i alternatywy dla scen. 30 (P-268) | 04 | nic | **tak** |
| 1.5 | 07: kolejne F07 z raportów, pakiet podstawowy (36 po zielonym), plan testów na urządzeniu U1–U8 (P-261, P-267 U5) | 07 | przebiegi | po 0.1 |
| 1.6 | 08: podział `Licznik.tsx` (20 090 / 20 480 B) przed kolejną zmianą licznika | 08 p7 | 0.2 | tak, na kopii |
| 1.7 | ~~05 + 08: N12-12 `integrity_check`~~ **zrobione** (`src/dane/archiwum.ts:88`, test 06c9ff8; P-299) | 08 | nic | **tak** — sprawdzenie |

## Etap 2: audyty i treści (ok. 29.10–1.11)
| # | Zadanie | Kto | Zależy od |
|---|---|---|---|
| 2.1 | Audyt 04 (wygląd zgodny z `docs/design/`, iPad, poziomo, AX5, ciemny) | 04 | koniec etapu 1 |
| 2.2 | ~~55 kluczy bez wpisu w `en.kontekst.json`~~ **zrobione** (2026-10-30, 08 p7: `npm run i18n` 669/669 z kontekstem, eda6dcc); zostaje zamrożenie tekstów en po 2.1 | 08 + 09 | 2.1 (teksty po audycie) |
| 2.3 | Przekład 35 języków przez API z kontekstem (≤ 6 USD bez pytania, P-144), drugi przegląd AI, przegląd zastępczy (D-027) | 09 | 2.2 |
| 2.4 | Audyt 07 (strategia, definicja ukończenia, pokrycie BR) | 07 | etap 1 |
| 2.5 | Metadane, zrzuty (iPhone, iPad), notatka do recenzji, strona prywatności | 10 | 2.1, 2.3 dla lokalizacji |

## Etap 3: TestFlight (ok. 1–3.11)
| # | Zadanie | Kto |
|---|---|---|
| 3.1 | **Właściciel:** identyfikatory `group.com.apps4brew.knitting` i `iCloud.com.apps4brew.knitting` w Apple Developer (P-233), sekrety podpisu, token CloudKit | właściciel (~30 min) |
| 3.2 | Build podpisany, `testflight.yml`, wysłanie | 10 |
| 3.3 | **Właściciel:** test na iPhonie i iPadzie (zegarek: brak urządzenia — „nie sprawdzono”, P-290); plan: `docs/jakosc/testflight-na-urzadzeniu.md` (lista U1–U8, ZM-06 iCloud telefon ↔ iPad — niezaliczony = przełącznik ukryty, P-218 Q5a; iPad bez rysika, P-226) | właściciel (45–90 min) |

## Etap 4: pełny audyt i wysyłka (ok. 4–10.11)
Pełny audyt przed App Store (12, 07, 04), poprawki blokerów, weryfikacja patentowa funkcji wzoru w gotowym kodzie (P-218 OG-07). **Właściciel:** scalenie do `main`, App Store Connect, „Submit for Review”. Wydanie ręczne po przeglądzie Apple.

## 1.1 (ok. 4–6 tygodni po premierze)
Atlas technik z rysunkami SVG bez tekstu (P-093, P-095, P-179, P-192), Live Activity z polem pauzy (P-199 Q3c), MetricKit (ADR-0018), funkcje do wyboru według danych z App Store (F-13, F-22, F-39, F-42, F-62). Nominacja „App Enhancements” co najmniej 3 tygodnie przed (P-147). **Właściciel:** domena strony atlasu (koszt).

## Do zrobienia od razu, bez ryzyka straty (nic, od czego zależą, się nie zmieni)
1.3 (przeglądy 05), 1.4 (04: teksty i przycisk), 1.7 (sprawdzenie N12-12), praca TS partii 6 i 7 na kopiach (1.1, 1.2). **Nie zaczynać przed audytem 04:** przekładu (2.3) ani zrzutów (2.5).

## Ryzyka
Okno maszyn (dzień na każdą poprawkę natywną), tygodniowy limit konta (sesje lekkie, raporty tylko na końcu etapu, P-251), pytania Apple, nieskompilowany Swift na kopiach.
