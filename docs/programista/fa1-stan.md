# FA1 — stan roli 08 (build, TS 1.0.2) — 2026-11-28
Gałąź `claude/fa1-kod-ts-1-0-2-2026-11-28` od 9404a59a. Polecenie: `docs/koordynacja/polecenia/FA1.md` @ a7c90146 (gałąź `koordynacja`). Decyzje: P-1119…P-1123. Prompt roli: `assemble.mjs 08-programista --tryb build --moduly sqlite-expo`.

## Stan wyjściowy (przed pracą)
`npm test` na 9404a59a: 751 zestawów / 8452 testy zielone (185 s). Raport akceptacji TQ1: 96 testów, 95 czerwonych z właściwego powodu (`docs/jakosc/tq1-dowod-czerwony.txt`).

## Zrobione (testy z `tests/akceptacja/` przeniesione do głównego zestawu, kod, wynik)
| Zakres | Commit | Kod | Testy (były czerwone → zielone) | PU |
|---|---|---|---|---|
| ZM-20 przesunięcie rodzica, ZM-24 stuknięcia, ZM-27 decyzja aktywności (czyste funkcje) | 3a350b7b | `src/domena/przesuniecie.ts`, `stukniecia.ts`, `aktywnosc.ts`, stałe w `konfiguracja.ts` | `tests/domena/zm20-…`, `zm24-stukniecia`, `zm27-aktywnosc` (62) | — |
| ZM-20 scalenie dziennika | aa0bdb49 | `scalLinie` (`src/przypadki-uzycia/dziennik.ts`), `glowyLicznika`, `zdarzeniaPoRodzicu`, reguła 7 | `tests/dane/zm20-scalenie-dziennika` (7) | PU-Z06 → **PU-352** |
| ZM-21 znaczenie nowego licznika | aa460f0d | `znaczenieNowegoLicznika`, `projekt.ts`, `licznik.ts`, `licznik-stan.ts`; E2E 01, 02 +1; szkielet → `e2e/scenariusze/123-…` | `tests/dane/zm21-…` (4) | PU-Z02 → **PU-353** |
| ZM-24 migracja 0002 (`licznik.krok`) | 75e6d589 | `0002.sql`, `WERSJA_SCHEMATU = 2`, `schemat.sql`, `icloud-tabele.json`, kontrakt TS, `zrobPonownie` | `tests/dane/zm24-migracja-0002` (4, na `tests/bazy/v1.db`) | PU-Z01 → **PU-354** |
| ZM-24 `dodajRzad` k zdarzeń, `cofnijOstatnie` stuknięcia | e33e6305 | `zmien(powtorz)`, `StanLicznika.krok`, `zdarzenie()` + czas/źródło/urządzenie | `tests/dane/zm24-dodaj-rzad-krok` (4) | PU-Z03 → **PU-355 (zarezerwowany, wiersz jeszcze w „Oczekujące”)** |

Zmienione istniejące testy (powód w decyzjach): P-1120 (M-04, P3 + nowy P3b), P-1121 (4 testy ekranów: wartość + 1; `zgloszenie-ekran-blokady`), P-1122 (6 testów schematu/kopii), P-1123 (`cofniecie-podwojne`, `zapis-licznika`: zegar +1 s). Żaden test nie został usunięty ani wyłączony.

## Czerwone, zostają (15 testów w 5 plikach `tests/akceptacja/`; `npm run test:akceptacja`: asercja 13, znacznik 2)
1. **ZM-24 ekrany** `ekrany/zm24-krok-i-podpowiedz.test.tsx` (7: PU-Z03, Z04, Z05): `FormularzLicznika` pole „Krok” (`dodaj-licznik-krok-2`, prop `krok` w `naZapisz`), `Licznik.tsx` przycisk „+2” (podpis `licznik.plus2_podpis`, etykieta VoiceOver, `stan.krok`), `MenuProjektu` pozycja `licznik-menu-ustawienia` (`naUstawienia`), nowy `src/ekrany/UstawieniaLicznika.tsx` (`ustawienia-licznika-krok-2`, `ustawienia-licznika-podpowiedz`, progi 5/10/15/30), stan `podpowiedz: { minuty }` (`licznik-podpowiedz`, brak przy blokadzie i limicie). Teksty: klucze PL/EN z `docs/design/1-0-2.md` „Klucze i18n” do `src/i18n/slowniki/{pl,en}.json` (pozostałe języki: 09; sprawdź, czy test kompletności słowników dopuszcza brak — to jedyne miejsce niepewności).
2. **ZM-26/ZM-28** `ekrany/zm26-zm28-podpowiedzi.test.tsx` (2, PU-030, PU-016): `formularz.rodzaj_oczka_opis` pod „Oczka” (część etykiety radia), `wzor.podpowiedz_tekst` w `WzorGrupa.tsx` (`wzor-podpowiedz-tekst`).
3. **ZM-23** `ekrany/zm23-zrealizuj-kod.test.tsx` (2, PU-Z08): `app/oferty.tsx`, `Oferty.tsx`, port sklepu `zrealizujKod` + nasłuch transakcji (P-1072), `docs/wydanie/kody-ofert.md`.
4. **ZM-27 (b)** `ekrany/zm27-menu-zdejmij.test.tsx` (2, PU-Z09, Z10): `MenuProjektu` (`licznik-menu-zdejmij-blokada`), `app/menu.tsx` (`zakoncz`, ogłoszenie VoiceOver); wymaga portu `liveActivity.aktywna()` (typ w `modules/oczko-dziennik-plus/index.ts`; Swift — FB1).
5. **Kontrole Swift** `kontrole/zm22-zm24-xctest.test.ts` (2): FB1 (08-B), nie ten zakres.

## Do dopisania (bez testu przed kodem; najpierw czerwony, potem kod)
- **R3** `src/kompozycja/licznik-zdarzenia.ts`: `zdarzeniaPlus` z `przed` (`sygnalySkoku`), strażnik RD-17 na stuknięciach w `widok-licznika.ts` (`seria()` dziś liczy zdarzenia: przejść na `stukniecia` + `serieStukniec`, `ile` = suma kroków).
- **R5** `src/kompozycja/licznik.ts:77, :113-115`: flaga → `liveAktywna()`, kolejność scalenie → `decyzjaAktywnosci`; test z atrapą portu (PU-Z11); `staleDate` po stronie TS (`dataNieaktualnosci`).
- **R4** odliczanie podpowiedzi (forma A) z wstrzykniętym zegarem (po N min, raz na rząd, znika po +1/−1/wyjściu, nie przy pauzie stopera) — PU-Z05.
- **R2** etykieta źródła gałęzi w arkuszu PU-099 (`kandydaciKonfliktu`) — PU-Z07 (SC-02 już w `tests/dane/zm20-scalenie-dziennika`; test komponentowy brakuje).
- Szkielet E2E `tests/akceptacja/e2e/pu-z03-krok-plus-dwa.yaml` → `e2e/scenariusze/124-…` (tag `oczekujacy`, `config.yaml`, `e2e/czesci.json`, `tests/jakosc/e2e-noc-2026-11-02.test.ts` lista `bx7`) przy PU-355.

## Wiersze PU do przeniesienia (po zazielenieniu ostatniego testu danego PU; numeracja bez dziur, skrypt pomocniczy: wzór w historii `pu.py` — przenieś wiersz z „Oczekujące 1.0.2”, zmień Pokrycie na „z testem: plik:linia”, zaktualizuj „Podsumowanie”, `node docs/jakosc/narzedzia/tabela-08.mjs --wynik docs/jakosc/e4/tabela-08.md`)
PU-Z03 → 355 (testy: `zm24-stukniecia`, `zm24-dodaj-rzad-krok` zielone; czeka ekrany + E2E), PU-Z04 → 356, PU-Z05 → 357, PU-Z07 → 358, PU-Z08 → 359, PU-Z09 → 360, PU-Z10 → 361, PU-Z11 → 362 (domena zielona; czeka test kompozycji). Nagłówki testów mają jeszcze „PU-Z03/…”: zamień numerem przy przenoszeniu (bramka wymaga numeru w pliku testu).

## Znane ryzyka (do 07 i na przebieg CI)
- **E2E (Maestro) nie biegnie w Linuksie:** po ZM-21 inne scenariusze ze `start-czysty-dzis` mogą sprawdzać liczbę świeżego licznika (wyświetlana = wartość + 1); przesunięte tylko 01 i 02. Pierwszy przebieg „Jakość · iOS” wskaże resztę (P-1121 (4)).
- Przesunięcie rodzica (U2) bez testu na prawdziwym urządzeniu: F PU-126/346/347 u właściciela.
- Migracja 0002: sieć to test na `v1.db`; wzorzec `v2.db` powstaje przy wydaniu (rola 07); test aktualizacji z danymi na urządzeniu = krok F przy PU-002.
