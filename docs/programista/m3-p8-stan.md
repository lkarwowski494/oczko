# M3 p8: ekran blokady, zegarek, widżet w barwach Dzianiny (stan partii)

2026-11-08 · rola 08 (build) · gałąź `claude/kopia-08-p8-2026-11-08` (start @ 4ea9688b) · wiersz p8 tabeli „Partie” (`oczko-warsztat/redesign/M3-2026-11-05/stop3-wlasciciel.md`), P-563 (5a), start równoległy z p2 (P-575). Zakres z design-spec Dzianiny: „tylko kolory i ikona”. Edytowane wyłącznie `targets/` i testy celów; `app/`, `src/`, `e2e/`, `modules/`, workflowy bez zmian.

## Stan wyjściowy (ETAP 0)
- `docs/design/tokeny.json` jest już Dzianiną (p1; identyczny bajt w bajt z `docs/design/dzianina/tokeny.json`: `cmp`), ale trzy `targets/*/expo-target.config.js` czytały stary kształt (`tokeny.kolor.jasny.grafit`). Dowód: `TypeError: Cannot read properties of undefined (reading 'jasny')` przy wczytaniu configu. **`expo prebuild` na bazie 4ea9688 padłby na starcie** — „Jakość · iOS” przed p8 byłaby czerwona niezależnie od zegarka.
- Ikona zegarka: `assets/watch.png` jest już ikoną Dzianiny (`cmp assets/watch.png docs/design/ikona/watch.png` = zgodne; `icon:` w configu zegarka wskazuje ten plik). Skrypt `scripts/natywne/ikona-zegarka.mjs` i job `zegarek-ikona` bez zmian (sprawdzają `ASSETCATALOG_COMPILER_APPICON_NAME`, nie obraz).
- Testy katalogów `tests/narzedzia`, `tests/wydanie`, `tests/jakosc`, `tests/adaptery` przed zmianą: 120 zestawów, 1322 testy zielone.

## Test przed kodem
`tests/wydanie/barwy-celow-tokeny.test.ts` (16 testów; 3 cele × 5 + ikona). Przed kodem: **12 czerwonych** (po 4 na cel: config nie buduje się — `TypeError`; katalog barw `Received: undefined`; brak `tokeny.kolory` w źródle; Swift używa nazw spoza katalogu), 4 zielone (brak ręcznych barw w Swifcie ×3, ikona). Po kodzie: 16/16 zielone. Kontrola mutacją: `Color("grafit")` wstawione do `Arkusz.swift` → test „Swift używa wyłącznie barw z katalogu” czerwony; cofnięte.

Co sprawdza: (1) config buduje się z `tokeny.kolory`; (2) katalog barw = tabela wymagań (nazwa, jasna, ciemna wartość z tokenu); (3) w configu zero heksów; (4) każde `Color(...)` w Swifcie wskazuje barwę z katalogu i żadna barwa katalogu nie jest martwa; (5) w Swifcie brak `UIColor`, `Color(red:)`, heksów, `Color.white` itd.; (6) ikona zegarka: config → `assets/watch.png` = `docs/design/ikona/watch.png`.

## Mapowanie barw (nazwa w katalogu zasobów = nazwa tokenu)
| Stara nazwa (Swift) | Nowa nazwa | Źródło w tokenach | Cele |
|---|---|---|---|
| `grafit` | `tekst` | `kolory.jasny/ciemny.tekst` (zegarek: `systemCzarny.tekst`) | widget, watch, share |
| `olowek` | `tekst2` | `…tekst2` | widget, watch, share |
| `papier` | `tlo` | `kolory.jasny/ciemny.tlo` | widget (tło Live Activity) |
| `przyciskTlo` | `przycisk` | `…przycisk` (zegarek: `systemCzarny.przycisk`) | widget, watch |
| `przyciskTekst` | `przyciskTekst` | `…przyciskTekst` | widget |
| `zakreslacz` | `powierzchnia` | `kolory.jasny/ciemny.powierzchnia` (zegarek: `ciemny.powierzchnia`) | widget, watch (tło pasa przypomnienia) |
| `zakreslaczKrawedz` | `akcent` | `…akcent` (zegarek: `systemCzarny.akcent`) | widget, watch (krawędź pasa) |
| `tekstNaZakreslaczu` | `tekst` | jw. | pas przypomnienia |
| `wyspazakreslacz` | `wyspaPowierzchnia` | `ciemny.powierzchnia` | rozwinięta Dynamic Island |
| `wyspatekstNaZakreslaczu` | `wyspaTekst` | `systemCzarny.tekst` | jw. |
| `wyspazakreslaczKrawedz` | `wyspaAkcent` | `systemCzarny.akcent` | jw. |
| `papier`, `grupa`, `arkusz`, `linia`, `blad` (share) | usunięte | były zadeklarowane, nigdzie nieużyte w Swifcie | share |

Zasada mapowania pasa przypomnienia: `docs/design/dzianina/mapa-tokenow.md` (zakreslacz → znacznik `akcent`, tekstNaZakreslaczu → `tekst` na `powierzchnia`). Kształt pasa (tło + 2 pt krawędź) bez zmian — design-spec: „tylko kolory i ikona”.

## Zastąpione testy
Brak: żaden istniejący test nie sprawdzał wartości barw celów (grep po `tests/` na stare nazwy: tylko niepowiązane trafienia `zakreslacz` jako narzędzie wzoru). Nie usunięto, nie wyłączono ani nie osłabiono żadnego testu.

## Braki w tokenach i zgłoszenia do 04
1. `systemCzarny` nie ma tła dla pasa przypomnienia (są tylko `tlo`, `kartaStack`, `tekst`, `tekst2`, `akcent`, `akcentTekst`, `przycisk`, `przyciskTekst`). Użyto `ciemny.powierzchnia` (#312B27) na zegarku i w rozwiniętej wyspie. Alternatywa: `systemCzarny.kartaStack` (#1E2024, zimniejszy, „przybliżenie do pomiaru”). Do decyzji 04 po pomiarze na urządzeniu.
2. Kontrast pasa: tekst na `powierzchnia` w motywie jasnym i ciemnym jest w `kontrast-tabela.txt` (15,20:1 i 11,98:1); na zegarku i w wyspie to te same kolory co `ciemny.tekst`/`ciemny.powierzchnia` (11,98:1). Pary `systemCzarny` w `kontrast-pary.json` liczone są tylko względem `kartaStack`, nie względem `ciemny.powierzchnia` — 04 może dopisać parę, jeśli zatwierdzi to tło. Pasa na `Smart Stack` (karta systemowa) nie mierzono.
3. Znak kresek (`znakKresek`, `docs/design/tokeny.json`): Swift nadal używa SF Symbol `number` jako zastępnika (komentarz „zasób jak w compact (zgłoszenie partii 4)”). Dodanie zasobu obrazu do celu widget to zmiana wyglądu poza „tylko kolory i ikona” — zgłoszenie do 04/koordynatora.
4. Haptyka: `tests/narzedzia/haptyka-zegarka-spojnosc.test.ts` ma jeszcze przejściowy skrót `blokadaStukniecie` → `blokada`. Zmiana nazwy przypadku wyliczenia dotyka `modules/oczko-reguly`, `src/` i `targets/watch/Wspolne/Haptyka.swift`, czyli poza zakresem p8 (kolizja z p2) — niewykonana.

## Co sprawdzi dopiero „Jakość · iOS” / urządzenie (nie sprawdzono tu: brak Xcode)
- kompilacja Swifta po zmianie nazw `Color("…")` (build zegarka, widgetu, rozszerzenia udostępniania);
- `actool`: katalog barw celów z nowymi nazwami (`tekst`, `tekst2`, `tlo`, `przycisk`, `przyciskTekst`, `powierzchnia`, `akcent`, `wyspa*`) i `AppIcon` zegarka (job `zegarek-ikona`);
- wygląd: pas przypomnienia (tło `powierzchnia`, krawędź `akcent`) na ekranie blokady jasnym i ciemnym, w Dynamic Island, na Smart Stack i na zegarku; kontrast tekstu pasa; ikona zegarka na tarczy.

## Propozycja wpisu do `docs/decyzje.md` (dla koordynatora)
„P-5xx · 2026-11-08 · M3 p8: cele natywne (ekran blokady, zegarek, widżet, udostępnianie) mają barwy wyłącznie z tokenów Dzianiny; nazwa barwy w katalogu zasobów = nazwa tokenu; pas przypomnienia: tło `powierzchnia`, krawędź `akcent`, tekst `tekst` (bez zmiany kształtu). Odrzucone: (a) pas na `akcentJasny` z `naAkcencie` — wypełnienie zakreślaczem wróciłoby jako druga barwa akcentu; (b) tło pasa `kartaStack` — nieprzemierzone przybliżenie. Zależy od: pomiaru kontrastu na urządzeniu (O: 04).”
