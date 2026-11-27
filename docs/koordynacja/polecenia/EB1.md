# EB1 — rola 08 fix: +1 z ekranu blokady nie trafia do aplikacji (zgłoszenie użytkownika, 1.0.1) (2026-11-27)

Koordynator: session_01BM51ocmU7QhJeCxywemjAn (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID). Gałąź stanu `koordynacja` tylko do odczytu.
Model: sonnet. Pułap: 6 USD (STOP 7,8). Decyzja: KO-223. Pula P: **P-1079…P-1082**. Kontekst: od 30% kończysz krok, stan w `docs/jakosc/eb1-stan.md`, push, PRZEKAZANIE. Priorytet: realny błąd u użytkowników w funkcji polecanej we wpisach; możliwa utrata policzonych rzędów (zasada wspólna 10).

## Rola
08-programista, tryb fix. Prompt składasz sama (WG-30): `add_repo` lkarwowski494/prompts (odczyt), klon `--depth 1` do `/home/user/prompts`, `node /home/user/prompts/tools/assemble.mjs 08-programista --tryb fix --plik <scratchpad>/08-fix.md`; przeczytaj w całości.

## Start
Gałąź `claude/eb1-ekran-blokady-2026-11-27` od **9aa5ee44** (`origin/claude/youthful-pasteur-kx83sn`; kod aplikacji = 1.0.1 w sprzedaży + zmiany CI). `npm ci`.

## Zgłoszenie (użytkownik z grupy FB, przez właściciela 27.11 ok. 18:30 UTC, dosłownie)
„przy zmianie licznika na zablokowanym ekranie i po ponownym przejściu do aplikacji licznik rzędu nie aktualizuje się. Tu widać rząd 13 a po powrocie do aplikacji pokazuje 11.”
Oczekiwane (PU-126, PU-127): po odblokowaniu wartość w aplikacji większa o liczbę +1 z ekranu blokady, baner „Dodano n rzędy z ekranu blokady o …. Cofnąć?”. PU-126 jest klasy F — nigdy nie testowany fizycznie przez właściciela; PU-127 ma test jednostkowy na zdarzeniach portu (`tests/ekrany/pu-seria-zrodlo-127-335.test.tsx`).
Miejsca (katalog PU): `targets/widget/Aktywnosc.swift:195` (+1 z ekranu blokady), `src/przypadki-uzycia/dziennik.ts:72` (scalenie +1 z ekranu blokady). Wskazówka KD1 (F4, `docs/wydanie/kody-ofert.md` §5): brak odświeżenia po powrocie na pierwszy plan (`AppState → active` w `app/_layout.tsx:49,108` obsługuje tylko „background” i start) — hipoteza, nie dowód.

## Zadania
1. **Diagnoza z kodu (bez zgadywania):** prześledź ścieżkę +1 z Live Activity (AppIntent w celu widgetu) → zapis (App Group / plik / UserDefaults / skrzynka zdarzeń) → odczyt w aplikacji (kiedy: start, powrót na pierwszy plan, otwarcie licznika) → scalenie do bazy i UI. Ustal, czy zdarzenia giną (utrata danych), czy tylko nie są odczytane przy powrocie (stan nieaktualny do restartu). Hipotezy z dowodem `plik:linia`. Jeśli przyczyny nie da się ustalić z kodu: STOP z raportem i propozycją pomiaru (np. diagnostyka do „Zgłoś problem”).
2. **Test najpierw czerwony** odtwarzający scenariusz: zdarzenia +1 z ekranu blokady w trakcie, gdy aplikacja jest w tle (nie zabita) → powrót na pierwszy plan → licznik musi pokazać +n i baner PU-127. Czerwony na 9aa5ee44 z właściwego powodu.
3. **Poprawka** minimalna, bez zmiany wyglądu i tekstów (jeśli potrzebny tekst — zgłoś). Bez utraty danych: scalenie idempotentne (podwójna dostawa nie dubluje, jak PU-158 dla zegarka).
4. **Katalog PU:** jeśli scenariusz „powrót z tła po +1 z ekranu blokady” nie jest opisany — nowy/zmieniony PU (P-835, zasada 22) z klasą A/B i testem; PU-126 zostaje F (test fizyczny właściciela na następnym buildzie).
5. Recenzja ścieżki wrażliwej (dane): nowy subagent na samym diffie. P-1079…P-1082 w `docs/decyzje.md` (KO-223). verify kod 0 → `docs/jakosc/eb1-verify.txt` (podsumowanie i kod). Commit, push.

## Zakazy
Bez buildów TestFlight, dispatchu, scalania; bez zmian wyglądu i tekstów UI bez zgłoszenia; nie osłabiasz testów i kontroli; nigdy `--no-verify` ani force-push; nie tworzysz/archiwizujesz sesji; nie piszesz na `koordynacja`; bez pytań do właściciela. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507); przed pushem `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 9aa5ee44..HEAD` bez trailerów. GitHub tylko przez MCP.

## Raporty (≤ 10 linii, send_message)
- po diagnozie (zadanie 1): przyczyna z `plik:linia`, czy dane giną — od razu, zanim zaczniesz poprawkę;
- PRZEKAZANIE: SHA, test czerwony→zielony, poprawka, PU, recenzja, verify, P-, koszt.
