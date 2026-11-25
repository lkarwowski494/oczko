# RZ3 — niezależna recenzja poprawek ZR9 (zadanie 3)

Rola 07-jakosc, tryb audytu. Data: 2026-11-25. Zakres: `git diff f0b28df6..8a8fb678` (5 commitów: b44283e8 P2-1, 3605231b P2-2, 4ac256e4 decyzje P-1044…P-1047, 13626ccd P3-1 workflow, 8a8fb678 test 10-wydanie-019; 8 plików).
Dokumenty `docs/jakosc/zr9-*` czytane tylko jako opis intencji; każda teza poniżej sprawdzona własnym uruchomieniem (próby i pomiary: `docs/jakosc/rz3-proby-czulosci.txt`, `npm run verify`: `docs/jakosc/rz3-verify.txt`). Kod nie był poprawiany (audyt): błąd = ustalenie.

## Werdykt: **PRZYJĄĆ Z UWAGAMI**

0 × P1, 0 × P2, 1 × P3 (+ 4 obserwacje). Obie uwagi P2 z RZ2 są usunięte: próby M5/M6 i M2/M4, które na f0b28df6 kończyły się „OK”, na 8a8fb678 dają BŁĄD i kod 1; na 33 prawdziwych parach kadrów 03/04 z biegów 45633013976 i 45633019859 nowa kontrola nie daje żadnego fałszywego alarmu (to zamyka „ryzyko jawne” zapisane w P-1046). Krok z `OCZKO_WYMAGAJ_IMAGEMAGICK=1` uruchamia 6 istniejących plików, a zestaw kontroli się nie skurczył. Pozostaje jedna drobna luka w teście, który pilnuje listy plików w workflowie (P3-1).

## Odpowiedzi na pytania polecenia

| Pytanie | Odpowiedź | Dowód |
|---|---|---|
| P2-1: czy próby M5 i M6 teraz dają BŁĄD? | **TAK** („pas 1 (51 wierszy kadru) i pas 2 (71 …) za gruby”, kod 1); na f0b28df6 obie były OK | `rz3-proby-czulosci.txt` sekcja A (M5, M6 stary/nowy) |
| P2-1: czy prawdziwe kadry 03/04 z 45633013976 / 45633019859 nadal przechodzą? | **TAK** — 29 + 4 pary, 0 BŁĘDÓW, ten sam wynik starym i nowym skryptem; najgrubszy pas = 1,33 wiersza tekstu przy limicie 1,6 | sekcja B; wiersz tekstu 11, pas 12 wierszy kadru |
| P2-1: czy test jest czerwony na f0b28df6 z właściwego powodu? | **TAK** — 6 z 9 czerwonych, każdy przez asercję na treści wyniku (brak „za gruby” / brak „brak linii znacznika” w stdout, kod 0 zamiast 1), nie przez błąd środowiska; 3 zielone to testy „bez fałszywego alarmu” i baza, więc muszą być zielone na obu | sekcja C |
| P2-2: czy „brak linii znacznika” albo nasycenie > 30 nadal kończy się cichym OK? | **NIE** — BŁĄD z nazwą pliku (`scripts/ci/kontrola-zakreslen.mjs:231`), `bledy++`, kod 1; M2 i M4 czerwone, brak znacznika tylko w 04 wskazuje tylko plik 04 | sekcja A (M2, M4), test w sekcji C |
| P2-2: fałszywy alarm na kadrach 45633*? | **NIE** — 66 linii „ZNACZNIK OK” (33 pary × 2 kadry; w kadrach iPada po cztery linie znacznika), 0 BŁĘDÓW | sekcja B |
| P3-1: czy krok testowy z `OCZKO_WYMAGAJ_IMAGEMAGICK=1` uruchamia 6 plików i czy pliki istnieją? | **TAK** — `.github/workflows/zrzuty-sklepu.yml:471`, env w tym samym kroku (`:469`); 6 plików istnieje; lokalnie z wymuszeniem 6 zestawów, 153 testy zielone, 0 pominiętych | sekcja E |
| Czy przy wymuszeniu któryś test może się pominąć? | **NIE** — bez `convert` i z `OCZKO_WYMAGAJ_IMAGEMAGICK=1` wszystkie 6 zestawów pada głośno (nie pomija); bez wymuszenia pomijane są z `::warning::` jak dotąd | sekcje F, G |
| Czy zmiana regexu 10-wydanie-019 (`[^\n]*`) osłabia kontrolę? | **NIE w sensie zestawu**: pierwsze dwa pliki nadal muszą stać w tej kolejności, a `--ci --runInBand` nadal kończy komendę (`tests/wydanie/kontrola-zakreslen.test.ts:227`); dopisane cztery pliki pilnuje nowy test (`:229-232`). Zob. P3-1 co do głębokości tego pilnowania | `tests/wydanie/kontrola-zakreslen.test.ts:227-232` |
| Czy zmienione fikstury syntetyczne maskują regres względem f0b28df6? | **NIE** — zmiana to geometria (pas 31 → 15 px, tj. z 2,4 na ok. 1,1 wiersza tekstu 13 px) i dodanie linii znacznika; stosunek pas 2 / pas 1 i położenie wierszy bez zmian; stary pas 31 px jest teraz przypadkiem „za gruby” testowanym osobno w `zr9-granice-zakreslen.test.ts`. Stary test na nowym skrypcie czerwony z powodów zamierzonych (pas 31 px, brak znacznika, stary regex workflowu) | sekcja H; `git diff f0b28df6..8a8fb678 -- tests/wydanie/kontrola-zakreslen.test.ts` |
| Mutacje skryptu 8a8fb678 (A–F) | **wszystkie złapane**: `PAS_MAX_WIERSZY` 1,6→50 (3 czerwone, tylko zr9), „brak” → cichy OK (3, tylko zr9), `GRUBOSC_PASA_MIN` 0,65→0,1 (13), `ODCHYLENIE_MAX` 0,9→9 (13), `NASYCENIE_MAX` 30→255 (11), `PAS_MAX_WIERSZY` 1,6→1,2 (7) | sekcja D |
| `npm ci && npm run verify` na 8a8fb678 | **exit 0**, 741 zestawów, 8288 testów (0 FAIL; 8287 w `zr9-verify.txt` dotyczyło 4ac256e4 — commit 8a8fb678 dodał jeden test) | `docs/jakosc/rz3-verify.txt` |

## Ustalenia

### P3-1 — test listy plików w kroku z `OCZKO_WYMAGAJ_IMAGEMAGICK=1` sprawdza tylko napisy, nie istnienie plików ani wiązanie z `env` (realność: teoretyczny → brzegowy; zestaw może po cichu zmaleć)

- `tests/wydanie/kontrola-zakreslen.test.ts:229-232`: test wyszukuje wiersz `run: npx jest tests/wydanie/ramki-sklepu.test.ts` i sprawdza, że zawiera ciągi `tests/wydanie/<nazwa>.test.ts` dla czterech plików; nie sprawdza, czy plik istnieje, ani że `env: OCZKO_WYMAGAJ_IMAGEMAGICK: '1'` (`.github/workflows/zrzuty-sklepu.yml:468-469`) stoi w tym samym kroku co ta komenda.
- Dowód: `npx jest --listTests tests/wydanie/nie-ma-takiego.test.ts tests/wydanie/zr9-granice-zakreslen.test.ts` → wypisuje tylko istniejący plik, kod 0 (jest traktuje argumenty jak wzorce i nie zgłasza nieistniejącego). Czyli po usunięciu albo przemianowaniu pliku testowego (np. `zr8c-pasek-licznika` → inna nazwa) test workflowu zostaje zielony (napis w yml dalej jest), a krok w CI po cichu uruchamia o jeden zestaw mniej.
- Skutek: dokładnie ta klasa „testy czułości kontroli milkną” (RZ2 P3-1), którą zmiana miała zamknąć, może wrócić po refaktorze nazw; dziś wszystkie 6 plików istnieje (sekcja E), więc usterka jest teoretyczna.
- Sugestia (nie wdrażam, audyt): w tym samym teście `fs.existsSync` dla każdego pliku z komendy i dopasowanie, że `OCZKO_WYMAGAJ_IMAGEMAGICK` leży w bloku tego samego kroku (np. podział yml po `- name:`).

## Obserwacje (nie błędy)

1. **Margines znacznika iPada.** Po P2-2 brak linii znacznika to twardy BŁĄD, a iPad ma linie neutralne na 76–79% szerokości przy progu 60% (`scripts/ci/kontrola-zakreslen.mjs:137`, 16–19 pp). Zmiana szerokości kolumny licznika albo koloru znacznika teraz zaczerwieni job „komplet” zamiast po cichu przejść — to zamierzony kierunek (głośno), ale koordynator powinien o tym wiedzieć przy następnej zmianie wzoru ramki.
2. **Luz górnej granicy.** Limit 1,6 × wiersz tekstu przy najgrubszym zmierzonym pasie 1,33 (`scripts/ci/kontrola-zakreslen.mjs:109`) dopuszcza pas wystający poza własny wiersz o ok. 0,3 wiersza; pas 17 wierszy kadru (1,55) przechodzi, 19 (1,73) nie — granica jest przetestowana (`tests/wydanie/zr9-granice-zakreslen.test.ts`). To świadomy kompromis z P-1046 (margines nad zmierzonym maksimum), nie błąd.
3. **Jedno miejsce pokrycia nowych reguł.** Górną granicę i „brak linii znacznika” testuje wyłącznie `zr9-granice-zakreslen.test.ts` (mutacje A i B łapie tylko ten plik, sekcja D); `kontrola-zakreslen.test.ts` ma jedynie dostosowane fikstury. Dopóki plik jest w kroku z wymuszeniem (P3-1 powyżej), to wystarcza; w `jakosc-linux` bez `convert` testy są pomijane z ostrzeżeniem, jak przed zmianą.
4. **Deklaracja verify jest o commit wcześniejsza.** `docs/jakosc/zr9-verify.txt` (8287 testów) powstał w 4ac256e4; HEAD 8a8fb678 ma o jeden test więcej (8288, ten z `tests/wydanie/kontrola-zakreslen.test.ts:229`). Liczby ZR9 były prawdziwe dla swojego commita; ostatnia pełna bramka na HEAD jest dopiero ta z RZ3.

## Sprawdzone bez uwag

- `scripts/ci/kontrola-zakreslen.mjs:109-132` (`PAS_MAX_WIERSZY`, `grubosciPasow`): oba pasy sprawdzane względem mediany wysokości wiersza tekstu; gdy kadr nie ma wierszy tekstu, górna granica nie jest oceniana, ale wtedy `polozeniePasa` daje BŁĄD (komunikat o braku wierszy tekstu; `tests/wydanie/kontrola-zakreslen.test.ts:200-202`), więc brak wierszy nie jest cichym OK.
- `scripts/ci/kontrola-zakreslen.mjs:231`: `continue` po BŁĘDZIE „brak linii znacznika” pomija dalsze sprawdzanie znacznika tego kadru, ale `bledy++` jest wykonane i kod wyjścia = 1 (sekcja A, M4).
- Progi bez zmian względem f0b28df6: `GRUBOSC_PASA_MIN` 0,65 (`:103`), `ODCHYLENIE_MAX` 0,9 (`:69`), `PROG_CIEMNY` 140 (`:61`); wyjątki od zakresu zmiany: brak plików `app/`, `src/`, `package.json` w diffie (`git diff --stat f0b28df6..8a8fb678`: 8 plików — workflow, decyzje, 3 pliki `docs/jakosc/zr9-*`, skrypt kontroli, dwa testy).
- Diff `.github/workflows/zrzuty-sklepu.yml`: 3 linie (komentarz + komenda), bez zmiany środowiska ani kroków; zestaw kontroli poszerzony z 2 do 6 plików, nic nie usunięto.

## Nie sprawdzono

- Przebiegu CI na 8a8fb678 w GitHub Actions (nie wolno dispatchować workflowów; sprawdzono tylko lokalnie z wymuszonym ImageMagickiem i bez niego).
- Stwierdzenia P-1047, że numery P-1040…P-1041 należą do sesji WY1 (gałąź `claude/wydanie-1-0-1`): niezależnie nie zweryfikowano; nie wpływa na ocenę kodu (P3-3 z RZ2 był kosmetyką).
- ImageMagick w CI (7.1.2 z apt, wg P-1047) a lokalny 6.9.12-98: pomiary i `verify` zrobione na IM6; kontrola analizuje PNG 500 px szerokości w surowych bajtach RGB, więc różnica wersji jest mało prawdopodobna, ale nie sprawdzona na IM7.
- Kadrów innych niż 45633013976 i 45633019859 (inne biegi mają inne układy); iPad tylko w kadrach tych dwóch biegów (4 pary).

## Stosowalność listy kontrolnej roli 07

JAK-02 (wyrocznie), JAK-04 (mutacje), JAK-09 (bramka CI = te same komendy) i JAK-17 (nazwy robią to, co mówią) — sprawdzone; JAK-15 (deklaracje prawdziwe): deklaracje z `zr9-stan.md` i P-1046/P-1047 potwierdzone własnym uruchomieniem (6/9 czerwonych, 153 testy, zero fałszywych alarmów), a „ryzyko jawne” z P-1046 zamknięte pomiarem na kadrach 45633*. JAK-12/16/18/19 (E2E, aktualizacje, stan CI na `main`, bramka scenariuszy) poza zakresem tego diffu — nie sprawdzano.
