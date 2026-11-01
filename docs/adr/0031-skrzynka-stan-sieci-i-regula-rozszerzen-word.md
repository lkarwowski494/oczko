# 0031. Skrzynka importu: port stanu sieci (podpowiedź z `NWPathMonitor`) dla filmu i strony WWW, strona bez sieci czeka w skrzynce także z aplikacji; jedna reguła rozszerzeń Word (`.docx`)
Data: 2026-11-01 · Status: **przyjęta warunkowo** (rekomendacja 05; potwierdza koordynator wg P-087) · Rola: 05 (fix, partia 8, 07-jakosc-017) · Zależy od: ADR-0011 (fix-7), ADR-0016, NFR-OFF-001, BR-WZR-007 (S2–S4), F-24, F-55, `prywatnosc.md`

## Kontekst i problem
Trzy rozjazdy w imporcie wzoru z sieci (raport 07-jakosc-017):
1. Komunikat „film wymaga sieci” jest wywoływany stanem sieci tylko z argumentu E2E (`app/projekt/[id].tsx:125`: `siecWylaczona() ? 'brak' : 'jest'`; `src/platforma/tryb-e2e.ts:40`); w produkcji nie ma źródła stanu sieci, więc BR-WZR-007 S4 nie działa.
2. Strona WWW dodana z aplikacji (pole „Link”) bez sieci znika bez śladu: `dodajWzor` zwraca `brak_sieci`, a `alertImportu` mapuje to na `null` (`src/kompozycja/wzor-dodawanie.ts:11`), `app/wzor.tsx` niczego nie zapisuje. Tę samą stronę udostępnioną z Safari trzyma skrzynka (`przetworzSkrzynke`, `PRZEJSCIOWE`), więc zachowanie zależy od drogi dodania.
3. Reguła Word nie jest jedna: `zrodloZlecenia` przyjmuje `.doc` i `msword` (`src/przypadki-uzycia/skrzynka.ts:17,28`), a arkusz udostępniania pokazuje Oczko tylko dla `org.openxmlformats.wordprocessingml.document` (`targets/share/Info.plist:12`); eksperyment konwersji obejmował tylko `.docx` (`modules/oczko-wzor/TestyOknaMaszyn/Package.swift:20`, korpus tekst/tabela/obraz).

## Czynniki decyzji
- NFR-OFF-001 (100% przepływów działa bez sieci lub mówi, że jej potrzebuje) i BR-WZR-007 S3 („strona, której nie da się zapisać” → komunikat, bez pustego wzoru), S4 (film).
- Apple, odczyt 2026-11-01 (`developer.apple.com/tutorials/data/documentation/…`): `NWPathMonitor` — „An observer that you use to monitor and react to network changes.” (iOS 12+); `NWPath.Status.satisfied` — „The path is available to establish connections and send data.”; `unsatisfied` — „The path is not available for use.”; `requiresConnection` — „The path is not currently available, but establishing a new connection may activate the path.” Stan ścieżki jest podpowiedzią, nie gwarancją osiągalności serwera.
- Apple, odczyt 2026-11-01: `NSAttributedString.DocumentType.docFormat` — „Microsoft Word document.”, dostępny tylko w macOS 10.0 (strona nie podaje iOS), więc nie ma systemowego czytnika `.doc` na iOS; renderowanie `.doc` w `WKWebView` nie jest sprawdzone `[DO USTALENIA]`.
- ADR-0016: każda nowa biblioteka natywna to utrzymanie i manifest prywatności; moduł `oczko-wzor` już zawiera konwerter i klasyfikuje `brak_sieci`.
- Prywatność: `NWPathMonitor` nic nie wysyła i nie zapisuje; nie występuje w tabeli kategorii required reason API projektu (`docs/architektura/prywatnosc.md:41-44`: UserDefaults, FileTimestamp, SystemBootTime, DiskSpace) `[DO USTALENIA przy 10: sprawdzenie na stronie Apple „Describing use of required reason API” w dniu wydania]`.

## Rozważane opcje
Stan sieci:
- A. Własna funkcja Swift w `oczko-wzor`: `NWPathMonitor` startowany przy pierwszej subskrypcji, `siecStan()` i zdarzenie `siecZmiana`; port TS `Siec`. Bez nowej zależności JS.
- B. Pakiet Expo do stanu sieci (nowa zależność wg ADR-0016: wersja z `bundledNativeModules` SDK 57 ≥ 14 dni, manifest prywatności) — `[DO USTALENIA]`: API i manifest niesprawdzone u źródła w tej sesji.
- C. Bez portu: film otwiera się zawsze, odpowiedzialność za błąd ma przeglądarka.

Strona WWW bez sieci z aplikacji: (a) zapis zlecenia do skrzynki (`rodzaj: 'adres'`, `projektId`) i wiersz „czeka na sieć”; (b) alert „brak sieci” z zachowaniem wpisanego adresu w polu, bez kolejki.

Word: (i) tylko `.docx` (jedna reguła w jednym module, odrzucenie `.doc` czytelnym `wzor.blad_typ`); (ii) dodać `.doc` (UTI `com.microsoft.word.doc`) po eksperymencie konwersji na symulatorze.

## Decyzja
Stan sieci: **A**; strona bez sieci: **(a)**; Word: **(i)**, ponieważ (A) nie dodaje zależności ani deklaracji prywatności i opiera się na stanie, który Apple opisuje jako podstawowy mechanizm obserwacji sieci; (C) łamie BR-WZR-007 S4; (a) wykorzystuje cały istniejący cykl skrzynki (`PRZEJSCIOWE`, `wzor.czeka_siec`, ponowienie przy starcie i `AppState → active`), a (b) gubi pracę, jeśli użytkowniczka zamknie arkusz; (i) nie obiecuje formatu, którego iOS nie umie czytać systemowo i którego nikt nie sprawdził.

Kontrakt (08; K-17a–K-17i w `partia-8-kontrakty.md` §4):
1. Port `Siec { stan(): 'jest' | 'brak' | 'nieznany'; obserwuj(fn: (s) => void): () => void }`; adapter produkcyjny z `oczko-wzor`, adapter E2E: `siecWylaczona()` → `'brak'` (bez zmiany argumentu `oczkoE2eSiec`). `'nieznany'` (monitor jeszcze nie odpowiedział, błąd modułu) = zachowanie jak przy `'jest'`: próbujemy.
2. Film: otwarcie linku przy `stan() === 'brak'` pokazuje `wzor.film_bez_sieci_tytul` / `wzor.film_bez_sieci` (klucze istnieją, `src/i18n/slowniki/en.json:451,690`) i nie otwiera przeglądarki; przy innym stanie otwiera. Link zawsze zostaje zapisany (BR-WZR-007 S4).
3. Strona WWW z aplikacji: wynik `brak_sieci` zapisuje zlecenie (`SkrzynkaImportu.dodaj`, atomowo: katalog tymczasowy → `rename`, ten sam `zlecenie.json` co rozszerzenie) i pokazuje wiersz „czeka na sieć”; brak App Group (`grupa === null`) → `Wynik` błąd `zapis`, alert zapisu, wpisany adres zostaje w polu (polityka błędów: dane z formularza nie giną).
4. Ponowienie: `przetworzSkrzynke` po zdarzeniu `Siec` → `'jest'` (z odstępem `SIEC_PONOWIENIE_MS` [OCENA 05: 5 s]), przy starcie i powrocie na pierwszy plan (jak dziś). Trzykrotnie nieudane z powodem innym niż `PRZEJSCIOWE` = alert `skrzynka.nie_dodano` (bez zmian).
5. Word: jedna czysta funkcja `rodzajPliku(nazwa, typ): 'pdf' | 'word' | 'obraz' | null` w domenie; Word = `.docx` albo typ `…wordprocessingml.document`; `.doc` i `application/msword` → `null` → `wzor.blad_typ`. Reguła aktywacji arkusza (`Info.plist`) bez zmian, więc reguła TS i plist są zgodne; test sprawdza zgodność listy (K-17h).
6. Inwentarz prywatności (`prywatnosc.md`): wiersz „Stan ścieżki sieciowej (NWPathMonitor): tylko lokalnie, bez zapisu, bez wysyłki” — dopisuje 10 przy kontroli manifestu; dziś brak zmiany w deklaracji.

### Konsekwencje
- Dobre: komunikat o filmie działa w produkcji; strona bez sieci nie znika; jedna reguła Word w kodzie i w arkuszu; zero nowych zależności JS.
- Złe: własny kod Swift do utrzymania (kilkadziesiąt linii) i test na urządzeniu; `'jest'` nie znaczy, że serwer odpowie (strona nadal może dać `brak_sieci` z konwertera — to jest właściwy sygnał dla WWW); `.doc` nie jest obsługiwany w 1.0.
- Od czego zależy (decyzja warunkowa): potwierdzenie koordynatora; `.doc` wróci do rozważenia po eksperymencie konwersji (dowód: korpus `.doc` w `EksperymentyTests`), zmiana reguły = nowy ADR „zastępuje 0031 pkt 5” i `Info.plist` (rola 10 / 08d).

### Potwierdzenie
- Testy: K-17a–K-17i (Node z udawanym `Siec`; Swift `swift test` dla klasyfikacji statusu; E2E 13/14 z `oczkoE2eSiec=brak`).
- Kontrola: `grep -rn "siecWylaczona" src app` poza `tryb-e2e.ts` i adapterem E2E → 0 trafień (stan sieci tylko przez port).

## Opcje: zalety i wady
### A (stan sieci własny Swift) — zalety: brak zależności, jedna powierzchnia natywna w `oczko-wzor` · wady: kod do utrzymania, test na urządzeniu.
### B (pakiet Expo) — zalety: gotowe API · wady: zależność + manifest, niesprawdzone u źródła w tej sesji.
### C (bez portu) — zalety: zero kodu · wady: nie spełnia BR-WZR-007 S4.
