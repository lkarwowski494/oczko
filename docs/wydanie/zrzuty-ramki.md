# Zrzuty sklepu z ramkami i podpisami, zestaw na lokalizację, zrzut zakupu (rola 10 build · sesja AA · 2026-11-10)

Zlecenie: KO-032 (słowa właściciela przekazane przez koordynatora Piekarza 10.11 ok. 21:35 UTC: „Ma byc jak w treningu. przekaz tez do oczka.”). Decyzje: **P-717** (ramki i kolory), **P-718** (zestaw na lokalizację), **P-719** (zrzut zakupu), **P-720** (podpisy), wszystkie „do weta”. Wzór: Trening (`trening:scripts/ci/store-frames.sh`, `store-caption-layout.mjs`, `store/screenshot-captions.json`, analiza koordynatora `zrzuty-trening-2026-11-10.md`). Stan wykonania: tylko lokalnie i w testach; **żaden przebieg workflowu jeszcze nie biegł** (wyzwala koordynator).

## Co jest gdzie
| Co | Plik |
|---|---|
| Nakładanie ramki i podpisu na surowe PNG | `scripts/ci/ramki-sklepu.sh` |
| Układ podpisów (jeden rozmiar czcionki na język, ≤ 2 wiersze, łamanie między słowami, ja i zh-Hant przez `Intl.Segmenter`) | `scripts/ci/uklad-podpisow.mjs` |
| Kontrola wymiarów ASC, kanału alfa i limitu 10 na klasę | `scripts/ci/wymiary-asc.mjs` (wymiary z Apple, odczyt 2026-11-10: strona „Screenshot specifications”, surowy HTML) |
| Komplet scen na język i urządzenie | `scripts/ci/komplet-zrzutow.mjs` |
| Plan języków i podział na zadania macOS | `scripts/ci/zrzuty-jezyki.mjs` (lista z `SHOT_LOCALES` w `scripts/asc/zrzuty.mjs`: 29 języków z lokalizacją sklepu) |
| Podpisy, kolory (nazwy tokenów), krój | `docs/wydanie/metadane/podpisy-zrzutow.json` (tokeny: `docs/design/tokeny.json`; krój: `docs/design/fonty/BreeSerif.ttf`) |
| Zrzuty z symulatora, język po języku | `scripts/ci/zrzuty-sklepu.sh`, `e2e/zrzuty-sklepu/00-jezyk.yaml`, sceny `01`–`07` |
| Zrzut zakupu dla App Review | `e2e/zrzuty-sklepu/99-zakup.yaml` |
| Workflow | `.github/workflows/zrzuty-sklepu.yml` (plan → build → zrzuty → zbierz) |
| Testy | `tests/wydanie/uklad-podpisow.test.ts`, `ramki-sklepu.test.ts`, `zrzuty-jezyki.test.ts`, `zrzuty-sklepu.test.ts` |

## Wymiary (Apple, odczyt 2026-11-10)
Źródło: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/ — „You must include at least one screenshot and can upload up to 10 screenshots per device size”; „Images can’t include alpha channels or transparencies.” iPhone z Dynamic Island (duży): 1260×2736, 1290×2796, **1320×2868** (pion; poziom odwrotnie). iPad 13″: **2064×2752**, 2048×2732 (pion; poziom odwrotnie). Wyjście ramek ma wymiar identyczny z wejściem, więc zgodny z klasą; sprawdza to `wymiary-asc.mjs`.

## Wygląd ramki (P-717; do weta wyglądu w kroku C4 listy 1.0)
Tło `karta` #3A332E, podpis `kartaTekst` #F3F1EC, obwódka `akcent` #C08425 (tryb jasny tokenów); podpis u góry (pole 86% × 15%), zrzut 78% z zaokrągleniem 7%, bez obudów Apple, PNG RGB 8-bit. Krój: Bree Serif; Noto Sans Bold dla bg, el, nl, ru, sr, uk, vi; Noto Sans CJK Bold dla ja, ko, zh-Hant. Zmiana kolorów = zmiana nazw tokenów w polu `ramka` pliku podpisów, bez nowych scen.

## Jak odtworzyć lokalnie (bez macOS)
Surowe PNG z ostatniego zielonego przebiegu zrzutów (run 42784539154, artefakt `sklep-zrzuty-ramki` 13751726063, ważny do 24.11.2026; layout `6.9/en/`, `ipad-13/en/`, `warunek-og07/…`) albo własne w układzie `<klasa>/<język>/NN-<ekran>.png`:
```
bash scripts/ci/ramki-sklepu.sh <surowe> <wyjscie>      # wymaga ImageMagick 6 (convert, identify), node 22
node scripts/ci/wymiary-asc.mjs <wyjscie>               # kod 0 = wymiary, brak alfy, ≤ 10 na klasę
```
Dowód z tej sesji (2026-11-10): 14 plików wejściowych → 14 wyjściowych, `Ramki: 14 plików`, `wymiary-asc.mjs`: `OK (14 plików)`, kod 0; `file`: „PNG image data, 1320 x 2868, 8-bit/color RGB”; obrazy iPhone, iPad pionowo i iPad poziomo obejrzane. Język bez wpisu w `podpisy` jest pomijany z ostrzeżeniem.

## Jak uruchomić pełny przebieg (wyzwala koordynator; nic nie jest wysyłane do ASC)
- **Push** na gałąź z workflowem (`claude/youthful-pasteur-kx83sn` albo `claude/e-zrzuty-sklepu-2026-11-10`), commit z pierwszą linią zawierającą znaczniki: `… [zrzuty-sklepu] [zrzuty-jezyki:all] [zrzuty-zadan:6]` (dodatkowo `[zrzuty-urzadzenia:iphone]`, `[og07-ok]`, `[zrzuty-app:<run>]`). Plik workflowu z tej gałęzi AA musi najpierw trafić do gałęzi integracji (scalenie za zgodą koordynatora).
- **Po scaleniu do `main`:** Actions → „Zrzuty sklepu” → Run workflow: `jezyki` = `en,pl` (domyślnie) albo `all`, `zadan` = `6`, `urzadzenia` = `iphone,ipad`, `og07` wg C3.
- **Oczekiwany wynik** (`jezyki=en,pl`, domyślnie): zadania plan, build (≈ 18 min, pomijane przy `aplikacja_z_przebiegu`), 4 zadania zrzutów (iphone 1 i 2, ipad 1 i 2; po ≈ 40 min), zbierz; artefakty: `sklep-zrzuty-ramki` (`6.9/en`, `6.9/pl`, `ipad-13/en`, `ipad-13/pl`, po 5 zrzutów + `warunek-og07/…` po 2, razem 28 plików z ramką i podpisem), `sklep-zrzuty-surowe` (to samo bez ramek), `zrzut-zakupu` (`99-zakup-ceny.png`, 1320×2868). W podsumowaniu zadania zbierz: „Języki z ramkami: en,pl”.
- **`jezyki=all`:** 29 języków; przy `zadan` = 6: 6 zadań na urządzenie (12 razem, po 4–5 języków), ≈ 30 min na język (pomiar z przebiegu 42784539154: 34 min na 7 scen z danymi), przy 3 zadaniach macOS naraz ≈ 10 h zegarowych, ≈ 29 h maszyn (repo publiczne: 0 zł). Języki bez przekładu podpisów (27 ze sklepową lokalizacją poza en i pl, do czasu kroku C6) mają surowe zrzuty w `sklep-zrzuty-surowe`, nie w `sklep-zrzuty-ramki`; rekomendacja: `all` dopiero po C5 i C6, wcześniej `en,pl`.
- Awaria jednego języka nie zatrzymuje reszty (jedna powtórka sceny, potem lista „nieudane” i czerwony przebieg zbiorczy); awaria przed pierwszym scenariuszem albo „not acquired by Runner” = maszyna, jedno ponowienie ręczne (P-091, `CLAUDE.md`).

## Uzupełnienie przebiegu (P-721; analogia: Trening `store-screenshots.yml:37-44`)
Przebieg `all` trwa ≈ 10 h, więc brakujących scen nie robimy ponownie w całości. Po czerwonym przebiegu (lista braków w podsumowaniu kroku „komplet” z gotową wartością numeru przebiegu): Actions → „Zrzuty sklepu” → `uzupelnij_z_przebiegu` = numer przebiegu (artefakt `sklep-zrzuty-surowe`, 14 dni) albo znacznik `[zrzuty-uzupelnij:<numer>]` w pierwszej linii commitu, z tymi samymi `jezyki` i `urzadzenia`. Plan liczy brakujące sceny (sceny wzoru w `warunek-og07/` liczą się jako gotowe), zadania macOS robią tylko je (pole `sceny` macierzy), zadanie „zbierz” nakłada gotowe zrzuty poprzedniego przebiegu na nowe i składa komplet; zero braków = zero zadań macOS. Scena do powtórki mimo gotowego pliku: `powtorz` = `ja/04-zakreslenie,…` (znacznik `[zrzuty-powtorz:ja/04-zakreslenie]`); `en/99-zakup` = zrzut zakupu od nowa. Numer przebiegu bez zrzutów (zły albo wygasły) = czerwony plan. Ramki powstają także przy czerwonym komplecie (`if: always()`), więc niepełny zestaw jest do obejrzenia; do `asc-zrzuty` idzie dopiero zielony komplet. Limity planu: przebieg zwykły najwyżej 5 języków na zadanie (kod 2 z wymaganą liczbą `zadan`; `all` = `zadan` ≥ 6), uzupełnienie najwyżej 35 scen na zadanie. Kolejka: grupy `concurrency` tylko na zadaniach macOS (P-722), zwykły push na integrację nie anuluje oczekującego przebiegu ze znacznikiem. Nie biegło na macOS: sprawdzone testami i symulacją kroków planu (`tests/wydanie/zrzuty-uzupelnij.test.ts`).

## Zrzut zakupu dla App Review (P-719)
Scena `99-zakup.yaml` na atrapie sklepu z buildu zrzutów (`EXPO_PUBLIC_STORE_FAKE=1`): ekran ofert, trzy plany z cenami atrapy (0,99 / 6,99 / 14,99 USD jak w `docs/monetyzacja.md`), przycisk zakupu, po angielsku; bez wciskania „Kup”. Po wyśrodkowaniu planu rocznego scena cofa treść o ok. 10% ekranu i sprawdza `assertNotVisible` panelu „Test store: expire access” (10-wydanie-001, P-723; geometria do potwierdzenia pierwszym przebiegiem C1 — panel w kadrze = scena czerwona). Jeden plik na trzy produkty; **wgrywa właściciel** ręcznie w App Store Connect przy produktach (krok E1(b) listy 1.0), jak w Treningu. Otwarte: czy w kadrze nie zostaje panel „Test store” atrapy (pokaże pierwszy przebieg; wtedy zgłoszenie do 08, kodu aplikacji nie ruszam).

## Otwarte (`[DO USTALENIA]`)
1. Akceptacja podpisów en i pl przez właściciela (C5); przekład 27 języków (C6, rola 09).
2. Czy lokalizacja bez własnych zrzutów dziedziczy `en` w App Store Connect (E14; sprawdzenie w drugim języku wersji).
3. Czas na język (30 min) to pomiar z jednego przebiegu en; przebieg wielojęzyczny jeszcze nie biegł.
4. Czy wszystkie 29 języków przełącza się w scenie `00-jezyk` (testID `jezyk-<kod>` z `src/ekrany/Jezyk.tsx:33`; test sprawdza istnienie wzorca w kodzie, nie działanie na symulatorze).
5. Znaleziska dla 04 z `metadane/zrzuty-plan.md` („Stan wykonania”, 7 pozycji: kadry, placeholder wzoru, fixtura) nie są zamknięte tą zmianą.
