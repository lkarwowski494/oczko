# M3 p5: testy zmienione przy przebudowie Historii i Sesji

2026-11-08 · rola 08 · gałąź `claude/kopia-08-p5-2026-11-08` od 936a1227. Zmiany dotyczą wyłącznie wartości wyglądu starego systemu (kalendarz z kołem i kreską, nagłówki 13 pt); testów zachowania (teksty, etykiety VoiceOver, testID, wywołania) nie zmieniono. Wyjątek P-553 jak w p1–p3a.

| Test | Zmiana | Powód |
|---|---|---|
| `przycisk-glowny-wypelniony` „wybrany dzień w Historii = przycisk główny” → „Historia (M3 p5): dzień z robótką = kwadrat `akcent` z obwódką `akcentTekst`, wybrany dzień = obwódka `tekst`” | asercja koloru koła `przycisk` zastąpiona asercją kwadratu dnia: wybrany (obwódka `tekst`), dziergany (tło `akcent`, obwódka `akcentTekst`), bez robótki (`dzienPusty`) | makieta Dzianiny `historia-390-*`: dzień dziergany = kwadrat dzianiny z obwódką, wybrany = ciemna obwódka; koła i kreski nie ma (jak „Ten tydzień” na „Dziś”, p2) |
| `naglowki-p2-4` (b) „Historia dni: nagłówki…” | 13 pt `tekst2` bez wagi → treść 17 pt `tekst` waga 700; 20 pt nad blokiem bez zmian | makieta `dzianina/ekrany.html:35` `.sekcja { font-weight: 700 }` (bez 13 pt); (a) „Narzędzia” i (c) stoper bez zmian |
| `bez-literalow-wymiarow` | usunięte 6 wyjątków `HistoriaDni.tsx` (kreska 14 × 3, koło 34) | literały zniknęły z kodu; test „każdy wyjątek nadal występuje” wymaga czystej listy |

Nowy test przed kodem: `tests/ekrany/historia-dni-komorka-320.test.tsx` (6): styl komórki dnia: `width` liczbowy ≥ `cel.minimum` (nazwy bez „44 pt” — reguła JAK-13, `dokumenty-jakosci` 046; cel dotyku sprawdza audyt na urządzeniu), siedem komórek wypełnia szerokość ekranu (320, 320 + AX5, 390), wysokość ≥ 44 pt. Przed kodem: 3 × czerwone na asercji `typeof width === 'number'` (było `"14.28%"`), po kodzie: 6/6.

## Część 2 (P-590 (a): kafelki podsumowania miesiąca, nazwy sąsiednich miesięcy, dni przyszłe)
Nowy test przed kodem: `tests/ekrany/historia-dni-czesc-2.test.tsx` (10): przed kodem 8 × czerwone (brak `historia-kafel-*`, brak nazw miesięcy w strzałkach, brak stylu dni przyszłych), 2 zielone od początku (nota o stoperze bez sesji, wybór dnia przyszłego — strażnicy zachowania). Po kodzie 10/10.
| Test | Zmiana | Powód |
|---|---|---|
| `historia-dni` „dzień: projekty…; tydzień i miesiąc” | `getAllByText('5 rows')` długość 2 → 1, dodana asercja kafelka `historia-kafel-rzedy` („5”); linia „2 crafting days” → kafelek `historia-kafel-dni` („2” nad „crafting days”) | miesiąc ma kafelki zamiast linii „rzędy” i „dni robótkowe” (makieta `historia`); tekst „1 project finished”, nota o stoperze i tydzień bez zmian |
