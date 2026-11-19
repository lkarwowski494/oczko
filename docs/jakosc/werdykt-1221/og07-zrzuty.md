# OG-07: przegląd ekranów wzoru w zrzutach sklepu (build 1221) — notatki dowodowe

Data 2026-11-19, rola 07. Próbka: artefakt `sklep-zrzuty-ramki` (id 14535281849) przebiegu 44533640642 (b106e210), katalog `warunek-og07/`, 8 plików: 03-wzor i 04-zakreslenie × {iPhone 6.9″, iPad 13″} × {en, pl}. Wszystkie 8 obejrzane osobno lub na zestawieniu.

Pochodzenie: przebieg 44533640642 nie robił zrzutów (build i zrzuty pominięte, ZR1 `zrzuty_z_przebiegu`); surowe pliki pochodzą z przebiegu 44505569101 na e3e7fe9e (zadania zrzutów iphone 1/2, ipad 1/2: success). Kod aplikacji w e3e7fe9e jest identyczny z a830eb21 (`git diff` na src, app, modules, ios, assets, package.json pusty), więc kadry odpowiadają binarce 1221. Build zrzutów: `zrzuty-sklepu.yml:242` `EXPO_PUBLIC_E2E: '1'`, `EXPO_PUBLIC_STORE_FAKE: '1'`, `EXPO_PUBLIC_ICLOUD_FAKE: '1'`, bez `WATCH_FAKE`.

## A. Ograniczenia projektowe P-218 (1)–(6) — zgodność treści kadrów 03/04
| Ogr. | Co widać | Wynik |
|---|---|---|
| (1) jeden wzór = jedno źródło, bez łączenia i składania fragmentów | jeden PDF „Czapka z warkoczem” (en: „Cable Hat”), jedna strona („Strona 1 z 1”), brak drugiego źródła | zgodne |
| (2) bez edycji treści wzoru; adnotacje jako osobna warstwa | treść PDF nietknięta; widać żółte zakreślenia (osobna warstwa), na 04 pasów jest więcej niż na 03 (kontrola-zakreslen: en iPhone 03=0/04=1, pl iPhone 03=1/04=2, en iPad 03=1/04=2, pl iPad 03=0/04=1: OK, 4 pary) | zgodne |
| (3) jeden wzór naraz z jednym znacznikiem; iPad: obok wzoru licznik, nie drugi wzór | jeden znacznik rzędu (linia z etykietą „Rząd 48 ↓” / „Row 48 ↓”) i licznik 47; iPad poziomo: wzór po lewej, licznik („47”, „+1 rząd”) po prawej | zgodne |
| (4) film tylko jako odnośnik poza wzorem | brak filmu w kadrach | zgodne |
| (5) treść zależna od postępu tylko od użytkownika i licznika | znacznik rzędu wynika z licznika (47 → „Rząd 48”), zakreślenia z ręki użytkownika | zgodne |
| (6) 07 sprawdza ekrany wzoru przed wydaniem | to jest ten przegląd | wykonane na kadrach, nie na urządzeniu |
Ocena projektu, nie opinia prawna (P-218): żadnego E3 (edycja części) ani E5 (złożenie w jeden zestaw) w kadrach.

## B. Wady kadrów niezwiązane z patentem (blokują wysyłkę zrzutów, nie binarki)
1. **Napisy diagnostyczne trybu E2E w kadrze — we wszystkich 28 plikach** (nie tylko 03/04). Zestawienia: `og07-sceny-03-04-pl.jpg`, `og07-sceny-01-02-05-07-en.jpg`. Widać: u góry po lewej „window: portrait (440 x 956)” (obcięte do „dow: …”, panel `e2e-okno`), u dołu po prawej „touch: dzis-kontynuuj ts1 pin1 pout1 te1 tc0” i „taps accepted: dzis-kontynuuj …” (panele `e2e-dotyk`, `e2e-nacisniecia`, e2e/README.md:378-379), na 03/04 „notes: none” (panel `e2e-wzor-notatki`) nakładające się na podpis „1 zakreślenie”, a na 02 (licznik) dwa bloki tekstu „pattern presses: 0 (last: none); counter screen mounts: 1” i „counter input: plus 0, minus 0; saves ok …”. Przyczyna: build zrzutów ma `EXPO_PUBLIC_E2E=1` (potrzebne dla zegara i testowego PDF), a workflow wyłącza tylko panel zegarka (komentarz przy `zrzuty-sklepu.yml:242`); argument `oczkoE2eBezDiagnostykiLicznika` (e2e/README.md:50) gasi tylko dwa panele licznika i nie jest ustawiany w scenach (`e2e/zrzuty-sklepu/*.yaml`: tylko `oczkoE2eTeraz`, `oczkoE2eSiec`). Binarka 1221 tego nie zawiera: kontrola .ipa „bez śladów trybu testowego (12 wzorców)”, panele są `null` w wydaniu (`src/platforma/tryb-e2e.ts`, `app/_layout.tsx`).
2. **iPad 13″ en/pl, kadr 03 i 04: pigułka „Strona 1 z 1” / „Page 1 of 1” zasłania dolny fragment tekstu PDF** (nakładanie, NFR-UKL-001 PR-01…06 mówi o 0 nakładających się elementów). Na iPhonie pigułka leży pod tekstem wzoru, bez zasłonięcia treści (kadr pl 03/04).
3. **Podpis a kadr:** pl 04 „Zakreślaj i notuj na wzorze” (en: „Highlight and write on the pattern”) — kadr pokazuje zakreślenia i pasek narzędzi, ale żadnej notatki (napis „notes: none” to właśnie panel diagnostyczny). Obietnica „notuj” nie jest pokazana. Rola 10/11 (metadane i podpisy), P3.

## C. Wniosek OG-07
- Treść scen 03 i 04 mieści się w ograniczeniach (1)–(6): **tak, pod względem OG-07 mogą iść do sklepu.**
- **Obecne pliki nie mogą iść do sklepu:** nie ze względu na patent, tylko przez napisy E2E (B1) i zasłonięcie tekstu na iPadzie (B2). Dotyczy też scen 01, 02, 05–07. Potrzebny przebieg zrzutów z czystym trybem prezentacji (np. wspólny argument startowy wyłączający wszystkie panele `e2e-*` oprócz tych potrzebnych flow, albo zrzut przez build bez diagnostyki), po czym ponowny przegląd 03/04 na nowych kadrach.
