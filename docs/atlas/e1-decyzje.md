# Atlas technik 1.1 — rola 05, build, E1 (decyzje i prototyp ryzyka) · 2026-10-26

Wejście: STOP E0 (`docs/atlas/e0-rozpoznanie.md`), odpowiedź koordynatora P-201: Q1a przyjęte; Q2 (hosting) i Q3 (język bez źródła) u właściciela, do tego czasu domyślnie (a) z polem na adres i przełącznikiem; bez płatnego API.

## 1. ADR

| ADR | Decyzja | Status |
|---|---|---|
| [0022](../adr/0022-atlas-silnik-rysunkow-ts-z-danych.md) | Silnik w czystym TS: karta → model (części nitki, skrzyżowania, warstwy z reguł przeplotu) → SVG bez tekstu; ten sam kod w aplikacji i na stronie | proponowana (prototyp potwierdza wykonalność) |
| [0023](../adr/0023-atlas-kontrakt-danych-katalogu-json-schema.md) | JSON z ID twierdzeń 06, JSON Schema 2020-12, własny walidator TS bez zależności | proponowana (pola: `kontrakt-krokow.md` 0.1, wersja 1 w E2) |
| [0024](../adr/0024-atlas-rysunek-w-aplikacji-react-native-svg.md) | `react-native-svg` 15.15.4 w 1.1, rysunek jako jeden obraz z opisem z `t()` | **przyjęta** (P-201 Q1a) |
| [0025](../adr/0025-atlas-tresc-w-paczce-i-strona-statyczna.md) | Katalog w paczce; strona z podkatalogami, hreflang + x-default, tylko języki gotowe; hosting i adres `[DO USTALENIA]` (Q2), przełącznik Q3 | proponowana, warunkowa (Q2, Q3) |

ADR-0016: dopisane „Uzupełnienie 2026-10-26 (atlas 1.1)” — szkic wiersza `react-native-svg` do wpisania przez 08 przy instalacji. `kontrola-adr.mjs docs/adr --min 25`: 25 ADR, 0 błędów.

## 2. Prototyp ryzyka

Kod: `scripts/atlas/silnik/` (geometria, typy, rodzina `siatka-petli`, SVG ze strażnikiem liter, sprawdzenia; 28 KB źródła), `scripts/atlas/generuj.mjs`, testy `scripts/atlas/silnik.test.ts`. Dane: `docs/atlas/prototyp/karty/` (3 karty `[PRZYKŁAD]` w formacie kontraktu 0.1). Wynik: `docs/atlas/prototyp/*.svg` (rysunki w motywie jasnym), `arkusz-jasny.png`, `arkusz-ciemny.png` (skala 4×, do oceny).

| Rysunek | Części | Skrzyżowania | Rozmiar SVG | Błędy |
|---|---|---|---|---|
| oczko prawe (wynik, dżersej prawy, 4 × 3) | 60 | 32 | 18 276 B | 0 |
| oczko lewe (wynik, dżersej lewy, 4 × 3) | 60 | 32 | 24 558 B | 0 |
| k2tog — tkanina (przed) | 40 | 16 | 10 803 B | 0 |
| k2tog — wynik (4 → 3 oczka) | 55 | 34 | 18 596 B | 0 |

Dowody (2026-10-26):
- `node --experimental-strip-types --no-warnings scripts/atlas/generuj.mjs --png` → „OK: 4 rysunków bez błędów”, kod 0; `--check` kod 0 (pliki aktualne).
- `npx jest scripts/atlas` → 29/29: 4 rysunki bez błędów, 4 × determinizm bajtowy względem plików, k2tog (3 oczka, lewa na wierzchu, nachylenie > 0), odwrócenie reguły prawe/lewe, **10 mutantów** (każdy oblewa właściwe sprawdzenie: przeplot, ciągłość, topologia, obejmowanie, 3 × twierdzenie, kontrast, wyróżnienie, reguła), **7 przypadków strażnika liter** (`<text>`, `<title>`, `aria-label`, tekst między znacznikami, łuk `A`, litera w klasie, `<foreignObject>`).
- `npx tsc -p tsconfig.testy.json` kod 0 (dopisane `scripts/atlas/**/*` i `allowImportingTsExtensions`).
- Czas liczenia modelu + SVG (Node 22, Xeon 2,1 GHz, 20 powtórzeń po 5 rozgrzewkowych): oczko prawe p50 18,0 ms, p95 23,0 ms; k2tog p50 12,7 ms, p95 14,6 ms. To pomiar na serwerze, nie budżet telefonu (E3: pomiar na urządzeniu, krok właściciela).

### Co prototyp wykazał (ryzyko R-A1 z E0)
1. **Przeplot z reguł działa bez wpisywania warstw.** Zwykłe oczka przeszły za pierwszym razem; k2tog ujawnił dwa realne braki: (a) granice wycinka liczone od środków sąsiadów przesuwały platynę sąsiada nad cudzą głowę — poprawka: granice z kolumn próbki; (b) przy ujęciu dolna część nowej pętli przechodzi pod czubkiem głowy drugiej ujmowanej pętli — reguła uogólniona („platyna nowej pętli × nóżka **albo głowa** starej”), z uzasadnieniem w komentarzu silnika.
2. **Testy łapią rysunek bez przeplotu.** Przegląd parametrów (wysokość pętli × wysokość szyjki): przy pętli 1,6 rzędu silnik dał 0 skrzyżowań i test „obejmowanie” zgłosił 56 błędów; obszar poprawny: wysokość 1,7–1,8 przy szyjce 0,28–0,30 (0,33 oblewa przy 1,7 i 1,75). Wybrano 1,75 / 0,28 (środek obszaru).

   | wysokość \ szyjka | 0,28 | 0,30 | 0,33 |
   |---|---|---|---|
   | 1,70 | OK | OK | 54 błędy |
   | 1,75 | OK | OK | 52 błędy |
   | 1,80 | OK | OK | OK |

3. **Obwódka na całej długości dawała nacięcia na złączach** — zmieniona na odcinki wokół skrzyżowań (promień 4,5); wyróżnienie przeniesione pod rysunek (przykrywało własne nóżki pętli).

### Granice prototypu (świadomie)
Tylko fazy `tkanina` i `wynik`; bez drutów, strzałek i numerów kroków (glify cyfr — E2); bez szydełka, nabierania, narzutu i dodań; bez generatora strony i walidatora schematu (E2).

## 3. Zgłoszenia do innych ról

| ID | Do | Treść | Realność |
|---|---|---|---|
| Z-04-01 | 04 | Kontrast wyróżnienia do tła: zakreślacz/papier **1,30** (jasny) i **1,38** (ciemny) < 3:1 (WCAG 1.4.11 dla obiektu niosącego informację). Nitka/tło 14,37 i 14,39, nitka/zakreślacz 11,02 i 10,45 — w porządku. Możliwy kierunek (decyzja 04): krawędź wyróżnienia w `zakreslaczKrawedz` (4,17 / 10,42 do tła). W motywie ciemnym wyróżnienie jest na arkuszu prawie niewidoczne. | realny dla atlasu 1.1 |
| Z-04-02 | 04 | Wygląd rysunków (kształt pętli, grubość kreski 2,6, obwódka 4,6, wyróżnienie 7,5 jednostki) to propozycja techniczna; parametry są w jednym miejscu (`WYMIAR`, `KRESKA`), a zakres poprawny geometrycznie podaje tabela wyżej. | do przeglądu |
| Z-06-01 | 06 | ID twierdzeń w kartach próbnych to `TW-ATLAS-PRZYKLAD-*`; k2tog: „knit 2 stitches together; single right-leaning decrease” (CYC, kopia `oczko-warsztat/strona-katalog/2026-10-25-research/zrodla/B-cyc-knitting-abbreviations.txt:174–175`). Kierunek przeciągania przy oczku prawym/lewym (`kierunek`) potrzebuje twierdzenia ze źródła — reguła przeplotu w silniku na nim stoi. | realny |
| Z-03-01 | 03 | Przepływy atlasu A1–A3, S1–S3 do kontraktu zakresu 1.1 (dziś F-44 „PÓŹNIEJ”). | do zakresu 1.1 |

## 4. Pytania na STOP E1 (do koordynatora wg P-087)

**E1-Q1. Kolejność E2.**
- (a) Walidator i schemat katalogu (ADR-0023) + fazy `wklucie`/`przeciagniecie` z drutem i strzałką + glify cyfr kroków, potem generator strony z testem hreflang.
- (b) Najpierw generator strony (ADR-0025), potem walidator.
- **Rekomendacja: (a)** — 06 wypełnia karty teraz; walidator chroni jej pracę wcześniej niż strona, która czeka na Q2 (domena).

**E1-Q2. Nabieranie oczek (06 przygotowuje 3 metody).** Ocena po otrzymaniu danych: (a) słownik faz rozszerzony o ścieżkę nici wokół drutu, jeśli kroki 06 dają się opisać 5–6 nowymi fazami; (b) nabieranie poza MVP strony (jak P-095 D2). **Rekomendacja: decyzja po danych 06**, bez prac nad rodziną `nabieranie` w E2.
