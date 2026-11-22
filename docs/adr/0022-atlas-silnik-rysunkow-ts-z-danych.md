# 0022. Atlas technik (1.1): rysunki liczone z danych karty w czystym TS — model rysunku (części nitki z warstwami z reguł przeplotu) i zapis SVG bez tekstu; ten sam kod w aplikacji i w generatorze strony
Data: 2026-10-26 · Status: **proponowana** (prototyp E1, uzupełnienie E2: łatki przeplotu; P-201: Q1a przyjęte przez koordynatora wg P-087) · Rola: 05 (build, atlas 1.1) · Zależy od: P-093 (2), P-095, P-178, P-179, P-192, P-201, ADR-0003, ADR-0017, ADR-0023, ADR-0024

## Kontekst i problem
Atlas technik w 1.1–1.2 (P-093 (2), P-179) ma rysunki technik dziewiarskich, które muszą być prawdziwe (przebieg nitki, kolejność przeplotu, liczba oczek, kierunek pochylenia zgodny ze źródłem), jedne dla wszystkich 35 języków (P-192), bez generatora obrazów (P-178) i bez odrysowywania cudzych materiałów (P-095). Te same rysunki pokazuje ekran aplikacji i strona statyczna. Przepływy A1–A3, S1 i G1 z `docs/atlas/e0-rozpoznanie.md` §3 (do kontraktu zakresu dopisze je rola 03).

## Czynniki decyzji
- P-192: SVG bez `<text>` i liter; podpis, kroki i VoiceOver przez `t()` obok rysunku.
- Prawdziwość: wartość, której atlas uczy (pochylenie, bilans), ma ID twierdzenia roli 06; rysunek, który jej przeczy, ma oblać test.
- Analogia z Treningiem (P-087): silnik figur v2 liczy pozę z ograniczeń, testy niezmienników dziedziczy każda rodzina, walidator podaje kod błędu i miejsce (`trening/docs/50-figury-v2.md` §1, §5, §10; odczyt 2026-10-26).
- Zasada architekta 6: logika rysunku działa w Node bez telefonu.
- Motywy jasny/ciemny i „Zwiększ kontrast” z tokenów 04 bez osobnych plików.

## Rozważane opcje
A. Silnik w czystym TS: karta → model rysunku (części nitki, skrzyżowania, kolejność warstw) → zapis SVG albo rysowanie `react-native-svg`; ten sam kod w aplikacji i w generatorze.
B. Generator tylko w Node; aplikacja dostaje gotowe pliki (SVG/PNG) z paczki.
C. Rysunki ręczne (SVG z edytora) sprawdzane przeglądem.

## Decyzja
Opcja A. Szczegóły:
1. **Rodzina = funkcja z parametrami karty** (`rysunek.rodzina`, `probka`, `tlo`, `operacja`; kontrakt w ADR-0023). Prototyp: `siatka-petli` (druty: oczko prawe, lewe, ujęcia) w `scripts/atlas/silnik/`; planowane: `graf-szydelkowy`, `nabieranie`.
2. **Geometria z ograniczeń, nie ze współrzędnych w danych.** Pętla to łańcuch Catmulla-Roma przez 7 węzłów (podstawa, szyjka, początek głowy, wierzchołek…), jeden łańcuch na rząd — ciągłość nitki i stycznej wynika z konstrukcji. Wymiary w jednym obiekcie `WYMIAR` (uproszczenie ilustracyjne, bez liczb na rysunku).
3. **Przeplot wynika z reguł, nie jest wpisany:** silnik wykrywa każde skrzyżowanie części (platyna, nóżka, głowa, drut) i przypisuje mu część „nad” z reguły (oczko prawe: nowa pętla spod spodu na wierzch; lewe odwrotnie; ujęcie: pętla z `na_wierzchu` nad pozostałymi; drut: przez pętlę według kierunku wkłucia; założenia A-1–A-3 w `docs/atlas/e2-moduly-dane.md` §3). Rysowanie (E2): warstwa bazowa + **łatka** części „nad” na każdym skrzyżowaniu, kolejność łatek z lokalnych zależności. Globalnej kolejności warstw nie ma, bo jedna część bywa raz nad, raz pod tą samą inną częścią (drut przez głowę — wykazane w E2). Skrzyżowanie bez reguły albo łatki zasłaniające się nawzajem = błąd rysunku.
4. **Pochylenie i bilans wylicza silnik** z operacji (`na_wierzchu: lewe` → pętla lewa nachylona w prawo); test porównuje je z twierdzeniami karty.
5. **SVG bez tekstu:** tylko `<svg>`, `<rect>`, `<g>`, `<path>` z poleceniami `M`, `C`, `L` (bez łuków `A` — zastrzeżenie dekodera SVG na iOS, rejestr E0), kolory z tokenów, klasy ról `a-t`, `a-o`, `a-z`, `a-n` dla podmiany motywu na stronie. Strażnik liter to biała lista elementów, atrybutów i postaci wartości.
6. **Przeniesienie do aplikacji (rola 08, 1.1):** `scripts/atlas/silnik/` → `src/domena/atlas/` (czysty TS, w granicach `granice.mjs`); importy bez rozszerzenia `.ts` (prototyp ma je dla `node --experimental-strip-types`). Do tego czasu kod nie jest w `src/` (1.0 w budowie).

### Konsekwencje
- Dobre: jeden kod rysuje i jest testowany; nowa technika = dane + ewentualnie nowa operacja, nie nowy rysunek; błędny przeplot nie daje się „wpisać”; motywy bez plików na motyw; rozmiar SVG 10–25 KB na rysunek (pomiar E1).
- Złe: silnik i reguły przeplotu to kod do utrzymania; wygląd zależy od parametrów `WYMIAR` (przegląd 04); rodziny szydełko i nabieranie wymagają osobnej pracy (wykonalność 1–3 według raportu B §5.2).
- Od czego zależy: przegląd wyglądu przez 04 (kształt pętli, grubość kreski, wyróżnienie — zgłoszenie Z-04-01 w `docs/atlas/e1-decyzje.md`); twierdzenia 06 dla każdej karty.

### Potwierdzenie
- `npx jest scripts/atlas` (w `npm test`/`verify`): każdy krok karty bez błędów `sprawdzRysunek` (ciągłość nitki, przeplot — reguła liczona od nowa i ostatnia łatka w punkcie skrzyżowania, liczba oczek, topologia, obejmowanie, wkłucie, twierdzenia, wyróżnienie, litery, kontrast nitki i drutu ≥ 3:1 w obu motywach); 13 mutantów, z których każdy oblewa właściwe sprawdzenie; 7 przypadków strażnika liter; determinizm bajtowy względem `docs/atlas/prototyp/*.svg`.
- `node --experimental-strip-types --no-warnings scripts/atlas/generuj.mjs --check` kod 0.
- Po przeniesieniu (08): `granice.mjs src` bez naruszeń dla `src/domena/atlas`.

## Opcje: zalety i wady
### A — zalety: jeden kod i jedne testy dla aplikacji i strony; motywy z tokenów; analogia Treningu · wady: silnik w paczce aplikacji (ok. 15 KB źródła w prototypie), zależność `react-native-svg` (ADR-0024).
### B — zalety: brak silnika w aplikacji · wady: plik na motyw i kontrast, rysunek w aplikacji nie przechodzi przez te same testy co model, większa paczka przy wielu rysunkach.
### C — zalety: pełna swoboda wyglądu · wady: brak testu przeplotu i twierdzeń, ryzyko odrysowania cudzych ilustracji (P-095), każda poprawka ręczna × liczba rysunków.
