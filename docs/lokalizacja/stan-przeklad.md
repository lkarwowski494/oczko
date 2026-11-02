# Stan: przekład 34 języków przez agentów (rola 09, plan-prac 2.3, P-309; aktualizacja 2026-10-30)
Wykonawca: sesja 09 (kopia `claude/kopia-09-2026-10-30`). Bez API (P-309 zastępuje P-144); skrypt i workflow API zostają na kopii, nieużyte.

## Źródło i wynik
- Źródło: `src/i18n/slowniki/en.json` sha256 `74ae9284…f2f4a4`, `en.kontekst.json` `1cc9f57f…e9ca4c2` (674 klucze, 18 baz kluczy przetłumaczonych drugi raz po zmianie źródła P-307).
- **34 języki × 674 klucze:** propozycje (płaski słownik z przyrostkami CLDR) w `docs/lokalizacja/przeklad-api/<kod>.json`; **podpięte** (zgoda koordynatora, 2026-10-30 16:34 UTC) do `src/i18n/slowniki/<kod>.json` (zagnieżdżone), `index.ts`, `app.json` (supportedLocales iOS/Android, CFBundleLocalizations, locales) i `locales/systemowe/<kod>.json` (nazwa „Oczko” + tekst zgody aparatu, maszynowe, bez przeglądu człowieka); tabele Swift (`targets/{widget,watch,share}/Teksty.swift`) wygenerowane testem `teksty-natywne`.
- Tłumaczenie: subagent (sonnet), jedno zadanie na język ze słownikiem terminów języka (`slownik-terminow.json`), kontekstem i regułami (limity długości, brak terminów NIE). Oznaczenie: **maszynowe**, 2026-10-30.
- Drugi przegląd AI: inny subagent w świeżym kontekście (prompt modułu `tlumaczenie`); poprawki o pewności wysokiej naniesione skryptem `scripts/i18n/przeklad-poprawki.mjs` (kontrola identyczności parametrów); uwagi średnie zostają w `uwagi-*.md` dla rodzimych recenzentów (nie dla en/pl: pl 11 + vi 6 z pilota).
- **Przegląd człowieka: brak** w żadnym języku (przegląd zastępczy D-027 = ten drugi przegląd AI + skrypty). Kolejność rodzimych: `jezyki.md` (ja, nb, de, fr, nl, sv, da, ko, es, ru, it, fi, reszta).

## Kontrole (dowód: polecenia na katalogu zbiorczym en + 34 propozycje, rozpłaszczone do formatu słowników)
- `node scripts/sprawdz-i18n.mjs <katalog> --zrodlo en` → **błędy 0**, uwagi 958 (806 „tekst taki sam jak w źródle”: nazwy CYC po angielsku wg P-298/P-303, marka, symbole; 113 „brak liter pisma”: teksty złożone z parametrów i symboli; 39 „liczby inne”: słowo „jeden/zero” zapisane słownie lub cyfrą — bez błędu wartości).
- `node docs/lokalizacja/narzedzia/slownik.mjs --slowniki <katalog>` → **błędy 0**, uwagi 1 (wzorzec `robotka` po zmianie en „crafting days” nie trafia w tekst — do 06/09 w odświeżeniu słownika). Wyjątki nazwane: `docs/lokalizacja/slownik-wyjatki.json` (5 wpisów: „ściegiem dżersejowym”/stockinette ×4 języki, nazwa własna ms, artefakt `\b` sk, 코줄임 ko); poprawiony wzorzec ko dla 행 (`(?<![진실])행`, fałszywe trafienia w 진행/실행).
- Kontrola długości (`scripts/i18n/dlugosci.mjs`, raport `docs/lokalizacja/przeklad-api/dlugosci.md`): 35 kluczy z limitem „ok. N znaków”; ponad 1,3×N tylko pojedyncze (np. nb ukonczenie.dni_*, hu, ms, lv, el); ostateczna ocena na zrzutach 320 pt (rola 04).
- **Korekta 16:50 UTC:** wcześniejsze kontrole zbiorcze pomijały es-419 (wzorzec nazw plików bez cyfr); po poprawce 35 języków: sprawdz-i18n błędy 0 (978 uwag), strażnik słownika błędy 0.
- Po podpięciu: `npm run verify` kod 0 (245 zestawów, 2702 testy), w tym `tests/i18n/konfiguracja.test.ts`, `teksty-natywne`, `liczba-mnoga`.

## Otwarte
1. Zrzuty 320 pt/pseudo i sprawdzenie `Intl.PluralRules` w aplikacji (nie tylko w Jest) po przebiegu CI iOS na roboczej; push na roboczą na sygnał (src/** uruchamia CI iOS).
2. Przegląd rodzimy według kolejności i progu (treści krytyczne: kontrola (a) „szerokiej”; przekład zwrotny na pl w świeżej sesji — jeszcze niewykonany).
3. Terminy poza słownikiem wybrane przez tłumaczy („crafting day” → oddane szeroko, bez wspólnego słowa w 17 językach; stopwatch, highlighter, Family Sharing z pamięci modelu) — lista w `uwagi-*.md` i raporcie w warsztacie; zgłoszone do 06.
4. Teksty z limitem długości wymagają decyzji 04 przy zrzutach (np. `licznik.po_dodaniu` 47–48 znaków przy limicie ok. 30 w pl/vi/es-419).
5. Wątpliwości formy „many” w es/es-419/pt/fr/it (CLDR: miliony — „de”): tłumacze dali formę „other” albo z „de”; test wektorów w aplikacji po podpięciu.

## Treść krytyczna: bramka kontroli (a) (2026-11-02, M1-audytor-generalny-008 / 09-lokalizacja-003, DEC-11 a)
- **Mapa (06):** `docs/lokalizacja/krytyczne.json` — 10 kluczy `probka.*` z twierdzeniem z listy 28 krytycznych rejestru 06 (`kategoria`, `kategoria_otwarta`, `kategoria_miedzy`, `kategoria_obie`, `kategoria_powyzej`, `uwaga_4in`, `uwaga_kategoria`, `uwaga_koronka`, `uwaga_oczka`, `uwaga_zaokraglenie`), z ID twierdzeń i skrótem tekstu źródłowego `sha_en`. Znaczniki `[T:ID]` znikają przy budowie słowników, więc to jedyny ślad klucz → twierdzenie w tym repo. Nowy albo zmieniony klucz krytyczny: 06 dopisuje go w tym samym commicie co zmianę `en.json`.
- **Stan (09):** `docs/lokalizacja/przeglad-krytyczne.json` — wpis `a` na język × klucz: kto, data, metoda `przeklad-zwrotny-pl`, wynik `zgodny`, skrót przekładu, który kontrolowano. Obecnie **pusty**: kontrola (a) niewykonana w żadnym z 34 języków (340 par).
- **Bramka:** `node scripts/sprawdz-i18n.mjs … --krytyczne … --przeglad … --wydanie` kończy się kodem 1, gdy którykolwiek klucz krytyczny nie ma w języku ważnego wpisu (brak, wynik niezgodny, tekst zmieniony po kontroli) albo `sha_en` nie zgadza się z `en.json`; bez `--krytyczne/--przeglad` `--wydanie` kończy się kodem 2. Poza `--wydanie` ta sama kontrola daje jedną uwagę z liczbą par. Wołają ją `npm run i18n*` (uwaga) i `scripts/wydanie/kontrola-ipa.sh` (TestFlight, błąd).
- **Wpis kontroli (a):** `--skrot <język>` wypisuje skróty kluczy krytycznych języka; wpis robi się dopiero po wykonaniu przekładu zwrotnego na pl w świeżej sesji i porównaniu sensu (nigdy z góry).

## WSTRZYMANIE 2026-10-30 (16:40 UTC, polecenie koordynatora/właściciela; pracę przejmuje inne konto)
- **HEAD kopii** `claude/kopia-09-2026-10-30`: patrz commit z tą sekcją (poprzedni: 714e46f „podpięcie 35 języków”). Nic nie wypchnięto na roboczą poza tym plikiem (same docs); nocny push odwołany.
- **verify:** kod 0 na 714e46f (245 zestawów, 2702 testy); `sprawdz-i18n` błędy 0, `slownik.mjs --slowniki` błędy 0 na 35 językach.
- **Sumy en** (zamrożenie P-307): `en.json` sha256 `74ae9284148122e7e215770b41c5ada4a94bf08a259ddb6119866ea380f2f4a4`, `en.kontekst.json` `1cc9f57f6a6bd17cd17e43b46d54e1b20fdc222789fb9d68a52d64c68e9ca4c2`. Zmiana en po tych sumach = nowa fala dla zmienionych baz kluczy (`DELTA` w `scripts/i18n/przeklad-agenci.mjs`).
- **Stan:** przekład 34 języków i podpięcie 35 języków (słowniki, `index.ts`, `app.json`, `locales/systemowe`, tabele Swift) są zrobione na kopii. Wszystko maszynowe, bez przeglądu człowieka.
- **Następny krok:** (1) `git pull --rebase` kopii 09 na roboczą po pushu 08; (2) push 09 na roboczą (zmiany `src/**` i `targets/**` uruchamiają CI iOS — kompilacja Swift z 35 językami i `Intl.PluralRules` na Hermes jeszcze niesprawdzone); (3) zrzuty 320 pt/pseudo i zgłoszenia długości do 04; (4) przeglądy rodzime wg `jezyki.md`; (5) „crafting day” do słownika 06 przy reaudycie.
- **Kolejność pushy na roboczą:** 08 → 09 → 07 (07 z `[e2e-pelny] [e2e-ciemny]` jako jeden przebieg).
- Uwaga: pierwszy commit kopii (56062f3) ma identyfikator modelu w stopce — nazwany wyjątek P-309, bez przepisywania historii.
