# Poprawki 033, sesja T (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-033-2026-11-02` (baza: integracja 6, aadcbe1). Polecenie: `oczko-warsztat` e0fb2f1 `koordynacja/role-2026-11-01/08-poprawki-033.md` (P-382). Na roboczą ani `main` nie pushowano. Koordynator: session_01T66VBwakbtXXLmB3joKZcd.

P-315: analogii w Treningu nie szukałem osobno — zadania wynikają z raportów 07 (`07-jakosc/2026-11-02-033-a|b/raport.md`, sekcje „Lista dla 08” / „Dla 08”) i z istniejącego wzorca w tym repo (panele `e2e-*`, `paneleE2e`); `docs/fakty-wlasciciela.md` nie dotyczy tych zadań. Baza testów na starcie: nie uruchamiałem osobno pełnego zestawu przed zmianami — dowód koordynatora: `verify` kod 0 na aadcbe1 (polecenie). Pełny `verify` po zmianach: patrz wiadomość do koordynatora.

## Stan (2 z 2 ID)
| ID | Rodzaj | Test (czerwony → zielony) | Commit |
|---|---|---|---|
| 033-T1 testID | D (bez zmiany wyglądu i zachowania) | 5 nowych plików/przypadków tras z `app/` (P-377): 9 czerwonych z „Unable to find an element with testID …” → zielone | patrz `git log` (commit „033-T1”) |
| 033-T1 hak `e2e-ocena-stan` (F-64) | D | `e2e-ocena-stan.test.tsx` 2 czerwone („Unable to find … e2e-ocena-stan”) → zielone | j.w. |
| 033-T2 `app/zglos.tsx:27-28` | opis, bez zmiany (wartość techniczna w treści zgłoszenia) | — | ten plik |

## 033-T1: testID (wszystkie dopisane bez zmiany wyglądu, etykiet i akcji)
| testID | Miejsce | Test na trasie |
|---|---|---|
| `powtorzenie-dlugosc-pole` | `src/ekrany/Formularze.tsx:64` (`Pole`, klawiatura liczbowa bez zmian) | `testid-033-formularz-trasa.test.tsx` (trasa `/formularz/[rodzaj]`; wpis „10” + zapis → powtórzenie 2, rząd 7) |
| `import-zastap` | `src/ekrany/Dane.tsx:52` | `testid-033-ustawienia-trasa.test.tsx` (`/ustawienia?import=…`) |
| `ustawienia-zglos`, `ustawienia-ocen` | `src/ekrany/Ustawienia.tsx:87-88` | j.w. (stuknięcie: `/zglos`; adres recenzji do `otworzAdres`) |
| `wzor-zaznacz` | `src/ekrany/WzorPrzegladarka.tsx:127` | `wzor-trasa-znacznik.test.tsx` (nowy przypadek, trasa `/wzor`) |
| `licznik-powtorzenie`, `licznik-calosc`, `licznik-notatka` | `src/ekrany/Licznik.tsx` (linia powtórzenia, podpis całości, nagłówek „Note”) | `testid-033-licznik-trasa.test.tsx` (trasa `/`) |
| `projekt-postep` | `src/ekrany/Projekt.tsx` (tekst „N% done”) | `testid-033-projekt-trasa.test.tsx` (trasa `/projekt/[id]`) |

Scenariusze przepięte z etykiet na testID (selektory; teksty asercji bez zmian): 55, 56 (`licznik-powtorzenie` + podprzepływ `ustaw-powtorzenie`), 62 (`wzor-zaznacz`), 63 (`ustawienia-zglos`), 65 (`ustawienia-ocen`), 66 (`import-zastap`). Pozostawione jako tekst celowo: `assertNotVisible ".*[Rr]ate Oczko.*"` w 65 (negatyw na jedynym tekście, zob. komentarz scenariusza), „A repeat needs at least 1 row.” (55), radio „The row I’m on” (56). W `e2e/README.md` dopisane wiersze: wszystkie powyższe testID oraz `e2e-ocena-stan`.

**Nie zrobione z listy 07 (brak nazwy testID w raportach, nazwę nadaje 07 — zmiana nazwy = zmiana scenariuszy):** opcje `Wybor` (radio: rodzaj licznika, znaczenie liczby, rodzaj narzędzia; `src/ekrany/Arkusz.tsx:121`) — raport 033-A poz. 3 nie podaje identyfikatorów; selektor po etykiecie działa. Poz. 7 raportu 033-B (osobny odczyt rzędu znacznika) — warunkowa („jeśli 08/04 zmieni zachowanie”); zachowania nie zmieniałem.

## 033-T1: hak `e2e-ocena-stan` (F-64)
Wzorzec haka E2E istnieje (`paneleE2e`, `e2e-pliki-stan`, `e2e-pomiar-operacji`), więc wykonane. `src/kompozycja/e2e/ocena-stan.tsx`: licznik wywołań `portOceny.popros` i ostatni adres z `systemAplikacji.otworzAdres`, panel „rating requests: N · last address: …” (`e2e-ocena-stan`, bez `t()`) w `PanelUstawien`. Podłączenie: `src/kompozycja/system.ts` — `paneleE2e?.zapamietajAdres(url)` i `paneleE2e ? paneleE2e.zliczajProsby(portOcenySklepu) : portOcenySklepu`; poza buildem E2E `paneleE2e` jest `null` (P-238), więc zachowanie wydania bez zmian i moduł nie wchodzi do bundla. Hak tylko liczy i przepuszcza. Scenariusza 65 nie rozszerzałem o asercje na panelu (to zmiana asercji — dla 07); komentarz tego scenariusza („propozycja dla 08”) jest przez to nieaktualny.

## 033-T2: `app/zglos.tsx:27-28` — surowe polskie wartości w podglądzie zgłoszenia
**Ustalenie (plik:linia):** to **wartość techniczna wysyłana w treści zgłoszenia**, a nie osobny tekst interfejsu.
- `app/zglos.tsx:27` wartość `synchronizacja` = `kontener.z.synchronizacja.stan()` (kod stanu domeny) albo literał `'wylaczona'`; `:28` wartość `zegarek` = `'brak'` albo `ostatni kontakt <ISO UTC>`.
- `src/ekrany/ZglosProblem.tsx:16`: `wiersze = diagnostyka.map(pole => `${t(etykieta)}: ${wartosc}`)`. Te **same** `wiersze` są pokazane (`:25`, podgląd BR-DAN-010 S1) i wysłane (`:20`, `system.udostepnij({ tresc: wiersze.join('\n') })`). Podgląd = dokładnie to, co opuszcza telefon; etykiety są przez `t()`, wartości to znaczniki diagnostyczne dla twórcy.
- Spójnie z trybem awaryjnym: `src/kompozycja/zgloszenie-awaryjne.ts:1-3` opisuje treść jako „techniczną (nie tekst interfejsu)”, znaczniki po angielsku (`safe_mode=…`, `database=not_opened`). Test `tests/ekrany/zglos-trasa.test.tsx:38-44` (07-jakosc-013, BR-DAN-011) przypina `brak`; BRD mówi o „braku kontaktu”, bez brzmienia.
- Użytkownik w en widzi więc „Sync: wylaczona”, „Watch: brak” — **realność: brzegowa** (dotyczy każdego, kto otworzy podgląd, ale to 2 wiersze diagnostyki, nie główny przepływ; dane nie giną, prywatność bez zmian).
- **Dlaczego bez zmiany (zgodnie z poleceniem):** tłumaczenie wartości przez `t()` zmieniłoby treść wysyłaną twórcy (język zgłoszenia zależałby od języka użytkownika), a rozdzielenie podglądu od ładunku łamałoby BR-DAN-010 S1 („pełna treść … zanim cokolwiek opuści telefon”). Test czerwony przed nie ma czego sprawdzać — nie ma błędu i18n klucza, jest decyzja o brzmieniu ładunku.

**Opcje dla koordynatora (P-087; sprawa dla 04/07 przy zmianie brzmienia):**
| Opcja | Co się zmienia | Kompromis |
|---|---|---|
| A. Zostawić (stan obecny) | nic | 0 kosztu; w en wiersze „Sync”/„Watch” mają polskie wartości. Twórca czyta po polsku. |
| B. **Rekomendacja:** zamienić wartości na neutralne angielskie znaczniki (`off`/`none`/`last contact <ISO>`; mapowanie kodów stanu na poziomie `app/zglos.tsx`, bez zmiany `stan()`) | podgląd i ładunek jednocześnie (nadal identyczne); poprawić `zglos-trasa.test.tsx` (`brak` → `none`) i zapis w BR-DAN-011/scenariuszu 63 | spójne z trybem awaryjnym, jednolity język ładunku; wymaga zgody na zmianę testu 07 i zapisu w decyzjach; mała zmiana (2 linie + 1 test). |
| C. Przetłumaczyć wartości przez `t()` | ładunek zależny od języka użytkownika | odrzucam: twórca dostawałby zgłoszenia w 35 językach, a klucze dołączyłyby do kolejki przekładu. |

## `src/kompozycja/historia.ts:23` — etykieta dnia z robótką (tylko opis dla 04, bez zmiany)
Linie 21-23: `rzedy` znamy tylko dla wybranego dnia (`dzien === o.wybrany`), więc dla pozostałych dni `a11y` = `t('dni.dzien_bez_a11y', { etykieta })` = sama data (`en.json` „{{etykieta}}”) — dzień z robótką (`robotka === true`) i bez nie różnią się w VoiceOver; BR-DNI-001 S1 wymaga informacji. Komentarz w kodzie (`:21`) już odnotowuje brak klucza bez liczby. **Dla 04:** potrzebny klucz „dzień z robótką” bez liczby (np. `dni.dzien_robotka`: „{{etykieta}}, crafting day”) — brzmienie i liczba mnoga to decyzja 04; po przyjęciu 08 ustawi `a11y` dla `r && rzedy === null`. Wygląd bez zmian (kreska pod numerem dnia dziś nie ma etykiety poza wybranym dniem). Realność: realna dla VoiceOver, brzegowa wizualnie.

## Dowody
Zrzuty przed/po: niewykonane (Linux, bez symulatora); zmiany nie zmieniają wyglądu (same `testID`). Scenariusze Maestro nie biegły (macOS tylko w nocnej macierzy); kontrola statyczna scenariuszy: `env -u NODE_PATH npx jest --ci tests/jakosc` 32 zestawy, 345 testów, kod 0.
