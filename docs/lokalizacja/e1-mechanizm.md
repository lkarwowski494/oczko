# E1 Mechanizm (rola 09-lokalizacja, build, wejście wczesne) · 2026-10-22 · STOP E1 przyjęty (P-077), ADR-0017 przyjęty
Decyzje: P-075 (E0), P-076 (przestawienie na wzór Treningu). ADR: [`0017`](../adr/0017-i18n-wlasne-t-reguly-cldr-klucze-znaczeniowe-zrodlo-en.md) (przyjęta), [`0016`](../adr/0016-zaleznosci-wersji-1.md) bez nowych pakietów. Dowody: [`dowody/e1-czerwone.txt`](dowody/e1-czerwone.txt) (efe4ff8, pierwsza wersja), [`dowody/e1-zielone.txt`](dowody/e1-zielone.txt).

## Historia
Pierwsza wersja E1 (2e93bd1): i18next + react-i18next + polyfill `Intl.PluralRules`. Po odczycie Treningu (837a850) właściciel kazał przestawić się na jego wzór (P-076). Obecna wersja: własne `t()`, zero nowych pakietów, ręczne reguły CLDR.

## Co powstało
| Element | Plik |
|---|---|
| Zestaw 35 języków, dopasowanie języka systemu (jak `resolveLang` Treningu), łańcuch zastępczy, wybór system/aplikacja | `src/i18n/jezyki.ts` |
| `t()`, port `MagazynPreferencji`, zmiana języka w trakcie, odświeżenie po zmianie języka systemu, pseudolokalizacja dev | `src/i18n/i18n.ts` |
| Liczba mnoga CLDR dla 35 języków (ułamki, miliony) | `src/i18n/plural.ts` |
| Formaty (liczby, godzina 12/24, data w strefie urządzenia), układ miar | `src/i18n/format.ts` |
| Klucze typowane z `en.json` | `src/i18n/typy.ts` |
| Adapter `expo-localization` (jedyny import pakietu) | `src/platforma/lokalizacja.ts` |
| Słownik źródłowy `en` (9 kluczy z `design-spec.md`), kontekst, pseudo | `src/i18n/slowniki/`, `src/i18n/pseudo/en-XA.json` |
| Konfiguracja | `app.json` (plugin `expo-localization`, `CFBundleLocalizations`, `locales`), `locales/systemowe/en.json`, `package.json` (skrypty `i18n`, `i18n:kod`, `i18n:pseudo`; tylko `expo-localization` dodany) |
| Skrypt kontroli | `scripts/sprawdz-i18n.mjs` (kod z promptu roli) |
| Testy | `tests/i18n/*.test.ts` (8 plików, 186 testów) |

## Dowody
| Wymóg | Wynik |
|---|---|
| Wektory liczby mnogiej ze wzorców (pl, ru, cs, lv, sl, ro, fr, en, pt, pt-BR) | zielone |
| Strażnik: reguły ręczne = ICU Node dla 35 języków × 0…10 000, pełne miliony, 28 ułamków; ICU zna każdy tag | zielone; pierwszy przebieg wykrył realny błąd (lv: zakresy „11..19” dla ułamków), poprawiony |
| Wybór języka, łańcuch zastępczy (brak klucza → `en`), zmiana w trakcie, Android, uszkodzone ustawienia | zielone |
| Formaty, układ miar, konfiguracja `app.json` = słowniki, pseudo zgodne ze skryptem, brak `i18next`/`@formatjs` w zależnościach | zielone |
| `tsc --noEmit`, `npm run i18n` | kod 0; 0 błędów, 0 uwag, 9 kluczy |
| `npm run i18n:kod` | **kod 2: skan kodu niewykonany** (katalogów 08 jeszcze nie ma): „nie sprawdzono”, nie „w porządku” |
| Cały zestaw | 99 zestawów, 952 testy (w tym stary kod 0.1.0) |
| Kontrola ADR | 17/17 OK |
Uczciwa uwaga o kolejności: przepisanie mechanizmu (P-076) nie było czerwone przed kodem; `plural.ts` napisałem przed testem strażnika. Zamiast tego strażnik opiera się na niezależnym wzorcu (ICU) i przy pierwszym uruchomieniu wykrył błąd. Pierwotne testy czerwone są w efe4ff8.

## Czego nie sprawdzono
- `Intl.NumberFormat`/`DateTimeFormat` na prawdziwym Hermes (brak symulatora); `Intl.PluralRules` nie jest już używany w czasie działania.
- Zachowanie iOS dla `CFBundleLocalizations` względem `supportedLocales` (w dokumentacji Apple nie czytałem; Trening używa pierwszego, Expo zaleca drugie): deklarowane są oba, z tą samą listą.
- Teksty `ustawienia.*` i `NSCameraUsageDescription` to propozycje roli 09 do zatwierdzenia przez 04.

## Do decyzji
1. **Akceptacja ADR-0017** (status „proponowana”): (a) przyjąć, *rekomendacja*; (b) przyjąć ze zmianą.
2. Brak innych otwartych pytań produktowych: pytania 2–4 z poprzedniej wersji zamknięte przez P-076.

## Przekazanie (wejście wczesne kończy się tu; E2–E4 po 08 i audycie 04)
Komenda dla wszystkich: `npm run i18n:kod` (= `node scripts/sprawdz-i18n.mjs src/i18n/slowniki --zrodlo en --kod src/ekrany,src/komponenty,app`).
- **04:** 35 języków i kolejność przeglądów (`jezyki.md`); najdłuższy język ustalam w E2 zrzutami; plik pseudo `src/i18n/pseudo/en-XA.json` (`EXPO_PUBLIC_PSEUDO=1`); do zatwierdzenia: teksty `ustawienia.jezyk`, `jezyk_automatyczny`, `uklad_miar`, `jakosc_tlumaczenia`, `zglos_tlumaczenie` i `NSCameraUsageDescription`; ekrany: lista języków i wiersz jakości przekładu w Ustawieniach, przełącznik jednostek; Libre Franklin nie pokrywa greki i CJK (P-064).
- **06:** treść krytyczna (F-37, F-38; RD-01, RD-03, RD-04, RD-10) tłumaczona po przeglądzie zastępczym D-027 w każdym języku (P-075 5b), procedura po stronie 06; jednostki kanoniczne (mm, m, g, °C), zaokrąglenia i rozmiary drutów US/UK: 06; OP-12.
- **07:** komenda do CI; strażnik liczby mnogiej (`tests/i18n/liczba-mnoga.test.ts`) na Node z aktualnym ICU; test zgodności `supportedLocales` = `CFBundleLocalizations` = `locales` = słowniki; pseudolokalizacja jako zasób testów; krok na symulatorze iOS dla `Intl.NumberFormat`/`DateTimeFormat`.
- **08:** każdy tekst od pierwszego ekranu przez `t()` z kluczem znaczeniowym i wpisem w `en.kontekst.json` (DEV-12); `npm run i18n` przed commitem; adapter `MagazynPreferencji` na tabeli `ustawienie` (`jezyk`, `uklad_miar`); `odswiezJezykSystemowy()` przy powrocie na pierwszy plan; własny hook nad `naZmiane`; generator plików Swift z `t()` według wzoru Treningu przy pierwszym tekście natywnym (ADR-0017); stary `src/core/i18n*.ts` i `check:i18n` usunąć razem ze starym kodem.
W `docs/sztafeta.md`: „09 E2–E4 po audycie 04”.
