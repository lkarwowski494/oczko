# Stan: przekład 34 języków przez agentów (rola 09, plan-prac 2.3, P-309; aktualizacja 2026-10-30)
Wykonawca: sesja 09 (kopia `claude/kopia-09-2026-10-30`). Bez API (P-309 zastępuje P-144); skrypt i workflow API zostają na kopii, nieużyte.

## Źródło i wynik
- Źródło: `src/i18n/slowniki/en.json` sha256 `74ae9284…f2f4a4`, `en.kontekst.json` `1cc9f57f…e9ca4c2` (674 klucze, 18 baz kluczy przetłumaczonych drugi raz po zmianie źródła P-307).
- **34 języki × 674 klucze:** propozycje w `docs/lokalizacja/przeklad-api/<kod>.json` (płaski słownik z przyrostkami CLDR). NIE w `src/i18n/slowniki/`: podpięcie języków (app.json: supportedLocales, CFBundleLocalizations, locales + `index.ts`) jest osobnym krokiem na sygnał koordynatora; do tego czasu `tests/i18n/konfiguracja.test.ts` byłby czerwony.
- Tłumaczenie: subagent (sonnet), jedno zadanie na język ze słownikiem terminów języka (`slownik-terminow.json`), kontekstem i regułami (limity długości, brak terminów NIE). Oznaczenie: **maszynowe**, 2026-10-30.
- Drugi przegląd AI: inny subagent w świeżym kontekście (prompt modułu `tlumaczenie`); poprawki o pewności wysokiej naniesione skryptem `scripts/i18n/przeklad-poprawki.mjs` (kontrola identyczności parametrów); uwagi średnie zostają w `uwagi-*.md` dla rodzimych recenzentów (nie dla en/pl: pl 11 + vi 6 z pilota).
- **Przegląd człowieka: brak** w żadnym języku (przegląd zastępczy D-027 = ten drugi przegląd AI + skrypty). Kolejność rodzimych: `jezyki.md` (ja, nb, de, fr, nl, sv, da, ko, es, ru, it, fi, reszta).

## Kontrole (dowód: polecenia na katalogu zbiorczym en + 34 propozycje, rozpłaszczone do formatu słowników)
- `node scripts/sprawdz-i18n.mjs <katalog> --zrodlo en` → **błędy 0**, uwagi 958 (806 „tekst taki sam jak w źródle”: nazwy CYC po angielsku wg P-298/P-303, marka, symbole; 113 „brak liter pisma”: teksty złożone z parametrów i symboli; 39 „liczby inne”: słowo „jeden/zero” zapisane słownie lub cyfrą — bez błędu wartości).
- `node docs/lokalizacja/narzedzia/slownik.mjs --slowniki <katalog>` → **błędy 0**, uwagi 1 (wzorzec `robotka` po zmianie en „crafting days” nie trafia w tekst — do 06/09 w odświeżeniu słownika). Wyjątki nazwane: `docs/lokalizacja/slownik-wyjatki.json` (5 wpisów: „ściegiem dżersejowym”/stockinette ×4 języki, nazwa własna ms, artefakt `\b` sk, 코줄임 ko); poprawiony wzorzec ko dla 행 (`(?<![진실])행`, fałszywe trafienia w 진행/실행).
- Kontrola długości (`scripts/i18n/dlugosci.mjs`, raport `docs/lokalizacja/przeklad-api/dlugosci.md`): 35 kluczy z limitem „ok. N znaków”; ponad 1,3×N tylko pojedyncze (np. nb ukonczenie.dni_*, hu, ms, lv, el); ostateczna ocena na zrzutach 320 pt (rola 04).
- verify kod 0 na gałęzi przed tym krokiem (src/ bez zmian od merge 08).

## Otwarte
1. Podpięcie języków do aplikacji (app.json + index.ts) i zrzuty 320 pt/pseudo — na sygnał; CI iOS uruchamia `src/**`.
2. Przegląd rodzimy według kolejności i progu (treści krytyczne: kontrola (a) „szerokiej”; przekład zwrotny na pl w świeżej sesji — jeszcze niewykonany).
3. Terminy poza słownikiem wybrane przez tłumaczy („crafting day” → oddane szeroko, bez wspólnego słowa w 17 językach; stopwatch, highlighter, Family Sharing z pamięci modelu) — lista w `uwagi-*.md` i raporcie w warsztacie; zgłoszone do 06.
4. Teksty z limitem długości wymagają decyzji 04 przy zrzutach (np. `licznik.po_dodaniu` 47–48 znaków przy limicie ok. 30 w pl/vi/es-419).
5. Wątpliwości formy „many” w es/es-419/pt/fr/it (CLDR: miliony — „de”): tłumacze dali formę „other” albo z „de”; test wektorów w aplikacji po podpięciu.
