# Stan: przewodnik po funkcjach (rola 04 build, sesja O)
Aktualizacja: 2026-11-10 · gałąź `claude/o-przewodnik-2026-11-10` (od 7defd5f) · prompt roli: `oczko-warsztat:koordynacja/polecenia/O-04-studio-build-2026-11-10.md` @ 51d4546 · polecenie: `koordynacja:docs/koordynacja/polecenia/O.md` @ 0656a88

| Zadanie | Stan | Dowód |
|---|---|---|
| 1 Rozpoznanie | zrobione, raport do koordynatora | zębatka `src/ekrany/Dzis.tsx:183`; Ustawienia `src/ekrany/Ustawienia.tsx:91–140`; Trening `app/guide.tsx`, `lib/guide.ts` |
| 2 Specyfikacja | zrobione | `przewodnik-2026-11-10.md`, `przewodnik-2026-11-10/klucze.md`; P-685–P-689 |
| 3 Makieta i zrzuty | zrobione (390 pt, jasny/ciemny, domyślny/AX5, en dla 2 ekranów) | `przewodnik-2026-11-10/zrzuty/` (19 + arkusz), `przed-po/`, `warsztat-390.txt` (0 błędów) |
| 4 Kryterium „gotowe” | kontrola kod 0: 42 funkcje, każda z plikiem trasy poza Apple Watch (uzasadnione); 61 nowych kluczy | `przewodnik-2026-11-10/kontrola.txt` |

Następny krok: decyzje do weta (koordynator) → rola 08 (kod, partia przewodnika) → 07 (E2E) → 09 (2074 teksty). Otwarte: [DO USTALENIA 05] miejsce zapisu przeczytanych; [DO USTALENIA 08] `/licznik` i `/wzor` bez ostatniego miejsca, szerokość kolumny na iPadzie.
Komendy: `node docs/design/narzedzia/przewodnik-kontrola.mjs --js --md` (z katalogu repo); `node docs/design/narzedzia/przewodnik-zrzuty.mjs <html> <katalog> [--en] [--arkusz]` (z `docs/design`).
