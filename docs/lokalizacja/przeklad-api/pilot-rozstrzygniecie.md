# Pilot przekładu agentami: pl + vi (rola 09, plan-prac 2.3, P-309; 2026-10-30)
Źródło: en.json d24f63e8…666832 (673 pozycje), en.kontekst.json af92bee4…b62972. Tłumaczenie: subagent (sonnet) z zadaniem ze `scripts/i18n/przeklad-agenci.mjs przygotuj`; drugi przegląd: inny subagent w świeżym kontekście (prompt modułu `tlumaczenie`). Przegląd człowieka: brak (pl: właściciel wg `jezyki.md` — do zrobienia).

| | pl | vi |
|---|---|---|
| tłumaczenie (czas ściany) | 3 min 44 s | 2 min 22 s |
| kontrola parametrów i kategorii CLDR | 673/673, 0 odrzuconych | 673/673, 0 odrzuconych |
| `sprawdz-i18n.mjs` (en + propozycje, katalog tymczasowy) | błędy 0 | błędy 0 |
| strażnik `slownik.mjs --slowniki` | błędy 0 | błędy 0 |
| drugi przegląd AI | 16 uwag (4 wysokie), ~2 min | 16 uwag (1 wysoka), ~2 min |
| poprawki przyjęte | 11 | 6 |

## Rozstrzygnięcie uwag
- **pl przyjęte (11):** czesc.co_dalej_opis (rodzaj nazwy części), dane.konflikt_wybor, dane.konflikt_a11y, icloud.konflikt_opis, projekt.czesc_cel (liczebnik przy parametrze bez odmiany → forma „Rzędy: n”), projekt.kopia_tytul, historia.opis_zerowanie, wzor.koniec_strony_gora/dol, wzor.czeka_siec, icloud.brak_miejsca.
- **pl odrzucone:** limit.zawczasu (propozycja dłuższa niż obecny tekst, kontekst „ok. 110” jest orientacyjny); projekt.cel_z_pauzy, wzor.notatka_bez_znacznika, probka.uwaga_kategoria (styl, bez błędu sensu — do przeglądu rodzimego); stoper.sprawdz „link” — **fałszywa uwaga**: błąd mojego pliku wejściowego przeglądu (dopasowanie prefiksu `klucz_` łączyło klucz zwykły z sąsiednim kluczem liczby mnogiej), słownik jest poprawny.
- **vi przyjęte (6):** przecinek dziesiętny (formularz.narzedzie_blad, probka.uwaga_4in), dni.tydzien, narzedzia.probka, wzor.rysik_podpowiedz, aktywnosc.teraz. **Odrzucone/odłożone** do przeglądu rodzimego (średnia pewność, styl): bút chì, szyk „khi xong hàng”, lặp lại, ostatnia_praca_*, menu.zablokuj, wzor.koniec_strony_*, rozmiar MB, licznik.po_dodaniu; ostatnie z powodu limitu „ok. 30 znaków” (47 znaków w obu wersjach); uwagi o „dodatkowych kluczach” — ten sam fałszywy alarm co w pl.
- **Wątpliwości tłumaczy (do rodzimych):** „crafting day” → pl „dzień robótkowy”, vi „ngày đan móc” (brak w słowniku); terminy handlowe Apple (Family Sharing, Restore) vi z pamięci modelu — niesprawdzone; nazwy CYC zostają po angielsku wg P-298.
- **Do 08/04 (źródło en):** teksty z parametrem liczbowym poza kluczem liczby mnogiej („{{wartosc}} rows”, „{{rzedy}} of {{cel}} rows”) nie dają poprawnej odmiany w pl/ru/cs…; kandydaci na klucze z `count`.
- **Limity długości:** pl: licznik.po_dodaniu 48>30, formularz.nazwa_czesc_n 11>10, ukonczenie.dni_* 13–15>12; vi: licznik.po_dodaniu 47>30, ukonczenie.dni_other 14>12 (limity w kontekście to „ok.”; do rozstrzygnięcia przy zrzutach 320 pt).
- Propozycje leżą w `docs/lokalizacja/przeklad-api/*.json`, NIE w `src/i18n/slowniki/`: `tests/i18n/konfiguracja.test.ts` wymaga zgodności słowników z `supportedLocales`, `CFBundleLocalizations` i `locales` (po dodaniu pl.json, vi.json verify padł: 6 testów). Podpięcie języków (app.json + index.ts) jest osobnym krokiem po fali.
