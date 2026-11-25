# RZ2 — niezależna recenzja kodu ZR8 / ZR8b / ZR8c (zadanie 2)

Rola 07-jakosc, tryb audytu. Data: 2026-11-25. Zakres: `git diff 8b8a2c3c..8685b098` (commity 0f349489 ZR8, 4eea5b1d ZR8b, 8685b098 ZR8c; 30 plików; `docs/decyzje.md` P-1035…P-1043; KO-201, KO-202, KO-205).
Recenzentka nie czytała raportów autorów ZR8* (send_message) przed własną oceną. Dokumenty `docs/jakosc/zr8*` czytane tylko jako opis intencji; wszystkie tezy poniżej sprawdzone własnym uruchomieniem.

## Werdykt: **PRZYJĄĆ Z UWAGAMI**

0 × P1, 2 × P2, 3 × P3 (+ 1 obserwacja). Poprawka robi to, co obiecuje: usuwa fałszywy alarm paska licznika, nie osłabia czułości na znacznik leżący na tekście ani na cienki pas 2, zmiana w `src/` jest wyłącznie e2e, zestaw kontroli w workflowach bez zmian, `npm run verify` zielony. Uwagi P2 to luki czułości kontroli (nie regresje względem stanu sprzed ZR8); żadna nie blokuje wysłania kadrów, bo kadry z biegów 45633013976/45633019859 przeszły też przegląd wizualny (`rz2-kadry.md`, „do sklepu: TAK”).

## Odpowiedzi na pytania polecenia

| Pytanie | Odpowiedź | Dowód |
|---|---|---|
| Czy `kontrola-zakreslen.mjs` wykrywa prawdziwy znacznik na tekście? | **TAK** (neutralna linia ≥ 60% szerokości na wierszu tekstu → BŁĄD z nazwą pliku) | próba M1, `rz2-proby-czulosci.txt` |
| Czy wykrywa pas za cienki? | **TAK** (pas 2 / pas 1 < 0,65) | test ZR8: 64/64 czerwone na skrypcie z 8b8a2c3c, 149/149 zielone po zmianach |
| Czy wykrywa pas **za gruby**? | **NIE** — brak górnej granicy; pasy zakrywające sąsiednie wiersze przechodzą z „OK” | próby M5, M6 (P2-1) |
| Czy „ciemny = neutralny” (KO-205) ukrywa prawdziwe błędy? | **Częściowo, w wąskim przypadku:** linia znacznika o nasyceniu > 30 jest niewidoczna dla kontroli, a „brak linii” kończy się OK bez błędu | próby M2, M4 (P2-2) |
| Czy testy są czerwone z właściwego powodu na kodzie sprzed poprawki? | **TAK** | ZR8c: 5/16 czerwone na skrypcie z 4eea5b1d, powód: wiersz 1002 (pasek licznika) w `linie`; ZR8: 64/64 na skrypcie z 8b8a2c3c; ZR8b: 6/14 na fikturze z 0f349489 (margines/pusty pas/zakładka), `rz2-proby-czulosci.txt` |
| Czy zmiana `wzor-sklepu.ts` jest tylko e2e i nie dotyka aplikacji? | **TAK** | `wzor-sklepu.ts` ← jedyny importer `src/kompozycja/e2e/panele.tsx` ← `src/platforma/tryb-e2e.ts:17` za `process.env.EXPO_PUBLIC_E2E === '1'`; poza `tests/` nikt inny go nie importuje; w diffie brak plików `app/`, `modules/`, `targets/` |
| Czy workflowy zmieniły zestaw kontroli? | **NIE** — diff nie zawiera żadnego pliku `.github/` ani `package.json`; kontrola rozszerzona wewnątrz istniejącego kroku `kontrola-zakreslen.mjs` (`zrzuty-sklepu.yml:492`) | `git diff --stat 8b8a2c3c..8685b098 -- .github package.json` puste |
| `npm ci && npm run verify` na 8685b098 | **exit 0**, 740 zestawów, 8278 testów (zgodne z deklaracją ZR8c) | `docs/jakosc/rz2-verify.txt` |

Dodatkowe, niezależne potwierdzenie: przebieg 45633019859 (HEAD 8685b098, run #57), zadanie „komplet” = success, w tym krok z `kontrola-zakreslen.mjs` na 29 językach.

## Ustalenia

### P2-1 — kontrola grubości pasa nie ma górnej granicy: pas zakrywający sąsiednie wiersze przechodzi (realność: brzegowy)

- `scripts/ci/kontrola-zakreslen.mjs:102-111` (`GRUBOSC_PASA_MIN`, `grubosciPasow`): `ok` to tylko `h2/h1 ≥ 0,65`. Nic nie ogranicza wysokości pasa względem wiersza tekstu ani grubości pasa 1. `polozeniePasa` sprawdza tylko środek pasa 2 (±0,9 wysokości wiersza).
- Dowód (`rz2-proby-czulosci.txt`, M5): na prawdziwym kadrze en 04 dorysowano pasy 51 i 71 wierszy kadru (wiersz tekstu ma 9 wierszy kadru), środek pasa 2 na wierszu 13 — pas 2 zakrywa „Rows 10-12” i „Rows 14-20”. Wynik: `POŁOŻENIE OK … odchylenie 0.00`, `GRUBOŚĆ OK … 71/51 (1.39)`, `Kontrola zakreśleń: OK`, kod 0. M6 (pas 2 = 1,83 × pas 1): też OK.
- Dlaczego ważne: kryterium (b) przeglądu („żaden pas nie zakrywa sąsiedniego wiersza”) jest sprawdzane dziś tylko okiem. Gest sceny to stały swipe 800 ms, więc w praktyce pas rośnie raczej rzadko — stąd „brzegowy”.
- Sugestia (nie wdrażam, audyt): górna granica `h/wysokość_wiersza ≤ ~1,6` (zmierzone pełne pasy 1,00–1,09 względem pasa 1, ~1,2–1,3 wysokości wiersza) albo `h2/h1 ≤ 1,5`; test z kadrem M5.

### P2-2 — „ciemny = neutralny” + „brak linii = OK”: znacznik o nasyceniu > 30 albo nieobecny nie jest widoczny dla kontroli (realność: brzegowy; dziś znacznik jest neutralny, nasycenie ≤ 10)

- `scripts/ci/kontrola-zakreslen.mjs:123` (`NASYCENIE_MAX = 30`), `:131` (`linie.length === 0` → `brak: true, ok: true`), `:209` (`if (z.brak) continue;` — bez komunikatu, bez błędu).
- Dowód: M2 — ta sama linia na tekście wiersza 21, ale ciemnoczerwona (110,30,30, nasycenie 80): `ZNACZNIK OK … poza tekstem wierszy`, kod 0 (próba M1 z linią czarną: BŁĄD). M4 — znacznik usunięty z kadrów 03 i 04: brak linii „ZNACZNIK”, kod 0, bez ostrzeżenia. M3 — czarna linia na tekście, ale 55% szerokości: OK (zamierzone przy progu 60%, ale ten sam mechanizm).
- Skutek: kontrola, której celem jest wykrycie linii znacznika na tekście, milczy dokładnie wtedy, gdy znacznik zmieni kolor (zmiana motywu/akcentu) albo przestanie być narysowany. Kadry 03 i 04 *zawsze* mają znacznik (`00-przygotuj.yaml`, scena 03), więc brak linii powinien być błędem.
- „Czy ciemny = neutralny ukrywa błędy?” — przy dzisiejszych kadrach nie (pomiar: znacznik iPhone ≥ 96% neutralnych, iPad 76–79%; przycisk złoty > 100). Ukrywa je tylko po zmianie koloru znacznika. Margines iPada: 76–79% przy progu 60% (16–19 pp) — zmiana szerokości kolumny licznika na iPadzie mogłaby go zjeść.
- Sugestia: w kadrach 03/04 traktować `brak` jako BŁĄD (z wyjątkiem świadomej listy kadrów bez znacznika); test z kadrem M4.

### P3-1 — testy czułości kontroli nie biegną nigdzie z wymuszonym ImageMagickiem poza lokalnym `verify` (realność: brzegowy; konwencja KO-035/P-724, nie regresja)

- `.github/workflows/zrzuty-sklepu.yml:470` uruchamia z `OCZKO_WYMAGAJ_IMAGEMAGICK=1` tylko `ramki-sklepu.test.ts` i `kontrola-zakreslen.test.ts`. Trzy testy zależne od `convert` — `zakreslenie-grubosc-znacznik.test.ts`, `zr8c-pasek-licznika.test.ts`, `zakreslenie-polozenie.test.ts` — przy braku `convert` są pomijane z ostrzeżeniem (`jakosc-ios.yml` biegnie na `macos-26`, `jakosc-linux.yml` nie instaluje ImageMagicka; czy obraz `ubuntu-latest` go ma — **[DO USTALENIA]**, nie sprawdzałam logu CI).
- Skutek: zmiana progu/definicji w skrypcie nie zostanie złapana przez te testy w CI, jeśli runner nie ma `convert` (lokalnie testy biegną: 149/149 zielone).
- Sugestia: dopisać te trzy pliki do kroku w `zrzuty-sklepu.yml:470` (zmiana zestawu kontroli — decyzja koordynatora).

### P3-2 — poluzowane asercje starego testu ZR7 (`zakreslenie-polozenie.test.ts:51, 58`)

- Było: `not.toMatch(BŁĄD … 04-zakreslenie)` i `^BŁĄD ` = `ZLE.length`; jest: tylko błędy „pas 2 poza wierszem 13”. Uzasadnienie w komentarzu (grubość i znacznik mają własny test) jest prawdziwe, ale nowy, nieprzewidziany rodzaj błędu w tych 31 kadrach nie zostanie już zauważony przez żaden z dwóch testów (ZR8 liczy konkretne klasy: 12 + 29).
- Sugestia: dodać w teście ZR8 asercję na łączną liczbę linii `^BŁĄD ` (12 + 29 = 41 dla zestawu).

### P3-3 — luka w numeracji decyzji

- `docs/decyzje.md`: po P-1039 (linia 882) następuje P-1042 (883); P-1040 i P-1041 nie występują w repo ani w `koordynacja/decyzje.md` (`grep`). Pula ZR8b to P-1038…P-1039, ZR8c P-1042…P-1043 — numery 1040–1041 pominięte bez adnotacji. Kosmetyka, ale kontrola ciągłości numeracji (jeśli istnieje) i czytelnik tego nie wytłumaczą. **[DO USTALENIA]**, czy zarezerwowane.

### Obserwacja (nie błąd): kreska rozgrzewkowa w `00-przygotuj.yaml:127-130`

- Mechanizm usterki „cienki pas 2” pozostaje nieudowodniony (P-1036 mówi to wprost). Łagodzenie: kierunkowy swipe + `wzor-cofnij-rysunek`, potem asercja `1 highlight`, więc gdyby cofnięcie zdjęło pas 1, scena pada głośno, nie po cichu. Skuteczność: w kadrach z biegu 45564086208 (źródło biegów 45633013976/45633019859, build z 4eea5b1d) wszystkie 29 języków + en/pl iPad mają pas 2 pełny, w tym pierwszy język każdego zadania (przed: 12 z 31 cienkich); n jest małe i to jeden przebieg builda — przy następnych przebiegach kontrola grubości będzie dalej pilnować.

## Sprawdzone bez uwag

- `src/kompozycja/e2e/wzor-sklepu.ts` (+11): wiersze od indeksu 7 obniżone o 38 pkt, wiersze 0–6 bez zmian (test ZR8b to sprawdza: 670 − 40·i dla i=3, 5); czysty moduł bez importów; geometria zgodna z kadrami (przegląd wizualny: znacznik w przerwie we wszystkich 29 językach i na iPadzie, etykieta „Row 21 ↓” nie dotyka tekstu).
- `tests/wydanie/pomoc-swipe.ts`: pomija tylko swipe'y bez `start`/`end`; każdy swipe ze współrzędnymi nadal podlega regułom ZR4/ZR7.
- Dowody autorów (`zr8*-verify.txt`, `exit=0`) zgodne z własnym uruchomieniem (740 zestawów, 8278 testów).

## Decyzje RZ2 (pula P-1044…P-1045; nie wpisane do `docs/decyzje.md`, wpis zostaje koordynatorowi)

| Nr | Decyzja / ustalenie | Podstawa |
|---|---|---|
| P-1044 | Kadry 03/04 z biegów 45633013976 i 45633019859: **do sklepu TAK** (0 uwag blokujących, 4 informacyjne); ocena wzrokowa, nie pomiar pikselowy | `rz2-kadry.md` |
| P-1045 | Kod ZR8/ZR8b/ZR8c: **PRZYJĄĆ Z UWAGAMI** (P2-1 brak górnej granicy pasa, P2-2 `brak`/kolor znacznika; P3-1…P3-3). Rekomendacja koordynatorowi: poprawki P2 i P3-1 jako osobny krok roli 08/10 przed następnym przebiegiem zrzutów; kadry z biegów 45633* nie wymagają ponownego przebiegu | ta recenzja |

## Pliki dowodowe

`docs/jakosc/rz2-verify.txt` (verify, exit 0) · `docs/jakosc/rz2-proby-czulosci.txt` (próby M1–M6, dowody czerwony/zielony) · `docs/jakosc/rz2-kadry.md` (zadanie 1).
