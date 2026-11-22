# M3 p2: testy zastąpione albo przeniesione przy zmianie startu na „Dziś” (ZM-18)

2026-11-08 · rola 08 · gałąź `claude/kopia-08-p2-2026-11-08` · zmiana **zachowania startu** zatwierdzona przez właściciela (ZM-18, P-563 (4a), P-569, P-571; ER-68–ER-71): zimny start zawsze na „Dziś”, licznik na własnej trasie `/licznik` nad grupą zakładek `app/(zakladki)/`. Nie użyto `.skip`, nie poluzowano progów. Asercje o zachowaniu, które dalej obowiązuje (cykl życia, blokada wygaszania, start danych, kamień milowy, licznik), zostały bez zmian — zmienia się tylko trasa, którą test montuje.

## A. Testy AS IS startu zastąpione testami TO BE od 07

| Test AS IS | Zastąpiony przez | Powód |
|---|---|---|
| `tests/ekrany/start-na-wzorze.test.tsx` S1 „praca skończyła się na wzorze → start otwiera ekran wzoru dokładnie raz” (usunięty; test 2 zostaje na trasie „/” = „Dziś”) | `tests/ekrany/start-dzis-wzor.test.tsx` (07-e2e), `tests/dane/start-dzis.test.ts` test 3 | P-563 (4a), ER-69: start nie otwiera wzoru; wzór otwiera „Kontynuuj ›” w tym samym powiększeniu |
| `tests/ekrany/aplikacja.test.tsx` test 1 „pierwszy ekran to licznik” — **tylko nazwa** (asercje bez zmian: „+1 row” jednym stuknięciem, bez powitania/quizu/radio) | `tests/ekrany/dzis-start.test.tsx` (07-e2e) | NFR-PIE-001 po ER-68: pierwszy ekran „Dziś”, „+1” karty ma tę samą etykietę |
| `tests/dane/kompozycja-licznika.test.ts` (3), `kompozycja-usuniecie.test.ts` (1), `wzor-miejsce.test.ts` (3), `kompozycja-icloud.test.ts` (1): `przygotuj()` → `{ cel: 'licznik' \| 'lista' \| 'wzor' }` | `{ cel: 'dzis', miejsce: … }` (ta sama logika miejsca); `tests/dane/start-dzis.test.ts` (07-e2e) | P-569: kształt wyniku z testu 07; miejsce liczone jak dotąd (`miejsce()`) |

## B. Testy przeniesione na nową trasę (asercje bez zmian)

| Plik | Zmiana | Powód |
|---|---|---|
| `blokada-trasa`, `licznik-trasa-032`, `testid-033-licznik-trasa`, `m1-063-dostep-licznik-trasa` (test 1), `stoper-po-pierwszym-plusie` | `require('../../app/index')` → `app/licznik`; w `stoper-po-pierwszym-plusie` atrapa `EkranLicznika` zamiast `Aplikacja` i `poScaleniu` w atrapie kompozycji | licznik na trasie `/licznik` (rysuje `EkranLicznika`) |
| `blad-odczytu-trasy`, `ladowanie-kolejka`, `import-zimny-start-206`, `niezawodnosc-kamien`, `tryb-awaryjny-trasa-licznika`, `tryb-awaryjny-zasoby`, `uczciwe-zasady-trasa`, `start-na-wzorze` (test 2) | `app/index` → `app/(zakladki)/index`; w `niezawodnosc-kamien` atrapa `j.jezyk` | start danych, ekran awaryjny, import z zimnego startu i kamień milowy są na „/” = „Dziś” |
| `ekran-nie-gasnie-trasa` (6 testów M1-059) | trasa „/” = korzeń „Dziś” (blokada wygaszania w `Aplikacja`), ścieżka licznika `'/'` → `'/licznik'`, oczekiwany pierwszy element `dzis-plus` zamiast `licznik-plus`, atrapa `j.jezyk` | korzeń cyklu życia zostaje pod licznikiem w stosie; asercje o tagu bez zmian |
| `m1-063-dostep-licznik-trasa` test 2 (powrót na pierwszy plan) | renderuje stos „Dziś” + licznik, asercje zawężone `within(trasa-licznika)` | scalenie i decyzję dostępu przy powrocie robi korzeń; licznik odświeża się po `poScaleniu` |
| `licznik-minus-plus-bez-projektu` (5) | `Aplikacja` → `EkranLicznika` (bez sklepu i cyklu w propsach) | ekran licznika bez cyklu życia |
| `projekt-po-drugiej-czesci-trasa` | `dismissTo('/')` → `dismissTo('/licznik')` (także `app/formularz/[rodzaj].tsx`, `app/projekt/[id].tsx` `navigate`) | licznik nie jest już na „/” |
| `projekty-trasa` | atrapa routera z `navigate` | otwarcie projektu z zakładki → `navigate('/licznik')` |
| `narzedzia-wstecz-trasa` | nazwa trasy bez segmentu grupy; poza kontrolą push: korzenie zakładek Dziś i Projekty, układ grupy, `licznik` (powrót „‹ Projects”, `nav-projekty`, do p3a) | WD-1: korzeń zakładki nie jest trasą push; Narzędzia i Historia zachowują „Back” (e2e 16) |
| `stan-wczytywania-tlo` (M1-089), `stany-bledow-094` | nazwa trasy bez segmentu grupy; stałe `stan="ladowanie"` w `(zakladki)/index.tsx` | przeniesienie pliku |
| `blad-zapisu-poza-licznikiem` | lista plików z `licznik.blad_zapisu` + `src/ekrany/Dzis.tsx` | „+1” karty = to samo zdarzenie co +1 licznika (ZM-18, ER-68): ten sam komunikat błędu zapisu |

## C. Testy akceptacyjne 07 przeniesione do głównego zestawu (zielone)
`tests/akceptacja/dane/start-dzis.test.ts` → `tests/dane/start-dzis.test.ts`; `tests/akceptacja/ekrany/dzis-start.test.tsx` → `tests/ekrany/dzis-start.test.tsx`; `tests/akceptacja/ekrany/start-dzis-wzor.test.tsx` → `tests/ekrany/start-dzis-wzor.test.tsx` (import `app/(zakladki)/index`). Zmienione tylko ścieżki importów.

## D. Wyjątek nazwany P-578 (lista oczekujących do fali 09)

| Plik | Stara asercja | Nowa asercja | Powód |
|---|---|---|---|
| `tests/i18n/pierwsze-w-fali-154.test.ts` „po fali: bramka --wydanie…” | `--wydanie` bez „oczekujace.json niepusta”; jedyne błędy: kontrola (a) | lista pusta → jak dotąd; lista niepusta → tylko klucze z `tests/i18n/m3-prefiksy.ts` (`kluczM3`) i `--wydanie` **musi** paść z powodu listy, innych błędów brak poza kontrolą (a) | P-578: klucze M3 tylko en i pl, 33 języki falą 09 (P-559, polecenie p2 pkt 5); wydanie bez fali dalej zablokowane |
| `tests/i18n/krytyczne.test.ts` „prawdziwe słowniki: mapa zgodna…” (gałąź bez uwagi kontroli (a)) | `--wydanie` kod 0 | lista pusta → kod 0; lista niepusta → tylko klucze M3, kod 1 i jedyny błąd „oczekujace.json niepusta” | jw. |

Stała prefiksów w jednym miejscu: `tests/i18n/m3-prefiksy.ts` (p2: `dzis.`, `zakladki.`; kolejne partie dopisują swoje) — usunąć po fali 09 (P-578).
