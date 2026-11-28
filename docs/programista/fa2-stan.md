# FA2 — stan roli 08 (build, TS 1.0.2 cz. 2) — 2026-11-28
Gałąź `claude/fa1-kod-ts-1-0-2-2026-11-28` od 6a40d695 (wynik FA1; HEAD gałęzi zgodny z poleceniem). Polecenie: `docs/koordynacja/polecenia/FA2.md` @ 58a36fbc (gałąź `koordynacja`). Decyzje: P-1133…P-1136. Prompt roli: `assemble.mjs 08-programista --tryb build --moduly sqlite-expo` (WG-30).

## Zrobione (testy były czerwone → zielone; PU przeniesione w tym samym commicie)
| Zakres | Kod | Testy (główny zestaw) | PU |
|---|---|---|---|
| i18n: 24 klucze 1.0.2 PL/EN + wyjątek nazwany w 3 testach (KO-239, cherry-pick c52360d1 z FB1) | `en/pl/en-XA.json`, `oczekujace.json` | `tests/i18n/*` (lista `OCZEKUJACE_DO_FALI_1_0_2`) | — |
| ZM-27 (b) menu „Zdejmij z ekranu blokady”; Live Activity wg `decyzjaAktywnosci` (R5) | `MenuProjektu`, `MenuLista` (podpis), `app/menu`, `ekran-blokady.ts`, `licznik-aktywnosc.ts`, port `aktywna()`/`staleDateMs`, adapter | `tests/ekrany/zm27-menu-zdejmij`, `zm27-menu-trasa`, `tests/dane/zm27-kompozycja-aktywnosc` (8 z 9 czerwonych na kodzie sprzed zmiany), `tests/adaptery/live-activity` | PU-355, 356, 357 |
| ZM-24 „Krok” i „+2”, ustawienia licznika, ZM-25 podpowiedź forma A (R4) | `FormularzeProjektu` (`WyborKroku`), `Licznik.tsx`, `UstawieniaLicznika.tsx`, `podpowiedz-odliczanie.ts`, `domena/podpowiedz.ts`, `przypadki-uzycia/podpowiedz.ts`, `ustawKrok`, `dodajLicznik(krok)`, `app/formularz` | `tests/ekrany/zm24-krok-i-podpowiedz` (7), `zm25-podpowiedz-odliczanie` (6), `tests/domena/zm25-podpowiedz-termin` (4; 3 czerwone na szkielecie), `tests/dane/zm24-krok-ustawienia` (4) | PU-358, 359, 360 |
| ZM-24 sygnały po skoku i strażnik serii na stuknięciach (R3) | `licznik-zdarzenia.ts`, `licznik.ts`, `widok-licznika.ts` (`seria`) | `tests/dane/zm24-kompozycja-stukniecia` (4 z 5 czerwonych przed kodem) | PU-358 |
| ZM-26 podpowiedź „Oczka”, ZM-28 zdanie pod źródłami | `FormularzeProjektu`, `Arkusz.Wybor.etykieta`, `WzorGrupa` | `tests/ekrany/zm26-zm28-podpowiedzi` (2) | PU-030, PU-016 |
| ZM-23 „Zrealizuj kod” | `Oferty.tsx`, `app/oferty`, `Sklep.zrealizujKod`, `platforma/sklep.ts`, `kontener.ts` | `tests/ekrany/zm23-zrealizuj-kod` (2), `tests/adaptery/sklep` (+3) | PU-361 |
| ZM-20 etykieta źródła gałęzi w arkuszu PU-099 (R2) | `synchronizacja.ts`, `licznik-aktywnosc.ts`, klucz `dane.konflikt_a11y_zrodlo` | `tests/dane/zm20-etykieta-zrodla` (3, wszystkie czerwone przed kodem) | PU-362 |
| Szkielet E2E „+2” | — | `e2e/scenariusze/124-pu-358-krok-plus-dwa.yaml` (tag `oczekujacy`, nie biegnie w Linuksie) | PU-358 |

Zostają czerwone w `tests/akceptacja/`: 2 kontrole XCTest (`kontrole/zm22-zm24-xctest.test.ts`) — FB1/FB2.

## Do rozstrzygnięcia / ryzyka
- **Gdzie mieszka próg podpowiedzi +1** (P-1135 (1)): preferencja urządzenia, nie kolumna licznika; weto roli 04 możliwe (arkusz „Ustawienia licznika” pokazuje krok per licznik, a próg globalnie).
- **Scalenie z FB1/FB2:** pliki wspólne: `docs/decyzje.md` (P-1124…1127 FB1 vs P-1133…1136), `docs/lokalizacja/oczekujace.json`, `src/i18n/slowniki/{en,pl}.json`, `en-XA.json`, `tests/i18n/fala-2026-11-03.ts` (lista: dodać `aktywnosc.plus2`, `aktywnosc.stuknij_dwa`, `aktywnosc.teraz_dwa` obok kluczy FA2), `modules/oczko-dziennik-plus/index.ts` (identyczny z FB1). Cherry-pick c52360d1 użyty bez wierszy decyzji FB1 (konflikt w `docs/decyzje.md` rozwiązany na korzyść FA1).
- **Brak weryfikacji na urządzeniu/Maestro:** `licznik-plus` „+2”, rama podpowiedzi, pozycja menu, okno kodu oferty i `staleDate` — F (PU-346…350, 355) i przebieg iOS; E2E 124 i skutek ZM-21 na pozostałych scenariuszach (P-1121 (4)) wskaże pierwszy przebieg.
- **Zmiana zachowania:** otwarcie aplikacji nie uruchamia już Live Activity (ADR-0037 (1)); zmienione 2 testy kompozycji/adaptera (P-1134).
- Kontrakt portów w `docs/architektura/moduly.md` zaktualizowany razem z kodem (rola 05 do przeglądu).
- Koszt sesji: nie zmierzony (sesja nie ma licznika kosztu); pułap 8 USD z polecenia.
