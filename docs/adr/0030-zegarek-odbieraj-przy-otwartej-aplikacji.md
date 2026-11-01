# 0030. Zegarek: `Zegarek.odbieraj` jako sygnał do scalenia dziennika przy otwartej aplikacji (jedno scalanie naraz, tylko na pierwszym planie); wzorzec haptyki przypomnienia na zegarku wg tokenu 04
Data: 2026-11-01 · Status: **przyjęta warunkowo** (rekomendacja 05; potwierdza koordynator wg P-087; wzorzec haptyki czeka na token roli 04) · Rola: 05 (fix, partia 8, 07-jakosc-005) · Zależy od: ADR-0008, ADR-0009 (pkt 3, 6), ADR-0002, ADR-0007, BR-LIC-015 S1–S2, BR-DAN-011 S3, P-316

## Kontekst i problem
Stuknięcie na zegarku trafia do dziennika +1 na telefonie (`modules/oczko-dziennik-plus/ios/Zegarek.swift:29-39`: `dopisz` z zapisem trwałym, potem `poZapisie` → zdarzenie `zegarekZdarzenia`). Adapter TS ma `odbieraj` (`src/platforma/zegarek.ts:22-25`), ale nikt go nie subskrybuje (`grep odbieraj src app` → tylko iCloud i atrapa E2E). Skutek, gdy aplikacja telefonu jest na pierwszym planie (telefon na stojaku): linia leży w dzienniku do przejścia tło → aktywna; telefon pokazuje starą liczbę, zegarek nie dostaje `potwierdzone` i po `ZEGAREK_PONOWIENIE_MS` (15 min) pokazuje „iPhone not nearby…” mimo że telefon jest obok (raport 07-jakosc-005, grupa F, F-12 luka 1). Dodatkowo zegarek gra zawsze `.click` — wzorca przypomnienia (BR-LIC-015 S2, „wibruje”) nie ma (`targets/watch/Aplikacja.swift:83`; `docs/design/tokeny.json:190-194` bez klucza).

## Czynniki decyzji
- Źródłem prawdy jest dziennik, nie ładunek zdarzenia (ADR-0009 pkt 3; komentarz `zegarek.ts:1-2`); scalenie jest idempotentne po UUID (M-02).
- Zapis do dziennika kończy się przed `poZapisie`, więc scalenie odpalone przez zdarzenie zawsze zobaczy linię.
- Zawieszenie z blokadą pliku (ARCH-13, `0xdead10cc`): transakcja nie może zaczynać się w tle bez ochrony czasu wykonania; JS w tle po wybudzeniu przez zegarek nie ma gwarancji (ADR-0009, `ZegarekAppDelegate` aktywuje tylko WCSession).
- Seria stuknięć (kilka w sekundę) nie może tworzyć kolejki scaleń ani wyprzedzać zapisu z ekranu (ADR-0008 (2): pozycje kolejki w kolejności wywołań).
- Wzorce haptyki i ich teksty/tokeny należą do roli 04 (zasada wspólna 15); rola 05 ustala tylko, gdzie zapada decyzja i jak ją sprawdzić.

## Rozważane opcje
- A. Subskrypcja w kompozycji: zdarzenie = sygnał; gdy aplikacja jest aktywna, scalenie dziennika jedną pozycją kolejki (jak `naPierwszyPlan`) z „jedno naraz + jedno domknięcie”, po nim `potwierdz` → odświeżenie ekranu → `poZapisie` (stan do zegarka, ekran blokady).
- B. Zastosować zdarzenia z ładunku (`linie`) bezpośrednio, bez czytania dziennika.
- C. Odpytywanie dziennika timerem, gdy ekran licznika jest otwarty.

## Decyzja
Wybrano „A”, ponieważ używa jedynej istniejącej ścieżki zapisu (`scalDziennikWKolejce`), nie dubluje reguł scalania (B tworzy drugą implementację `scalLinie`, ryzyko rozjazdu z dziennikiem i z trwałością) i nie wprowadza timerów w tle (C: zużycie baterii, opóźnienie, brak zdarzenia gdy nic nie przyszło).

Kontrakt (08; kryteria K-05a–K-05h w `partia-8-kontrakty.md` §3):
1. `Zegarek.odbieraj(fn)`: `fn` jest wołane po trwałym zapisie co najmniej jednej linii zegarka w dzienniku; ładunek jest informacyjny; zwraca funkcję odpięcia. Subskrypcja startuje po `uruchomDane` (linie z wcześniej zapisane scala start) i jest odpinana przy zamknięciu kontenera.
2. Obsługa: gdy `AppState !== 'active'` — nic (linie czekają, `naPierwszyPlan` scali je przy powrocie; brak transakcji w tle bez ochrony). Gdy aktywna: `zlecScalenie()` — jeśli scalenie trwa, ustawia flagę `ponow` i wraca; w przeciwnym razie wykonuje `naPierwszyPlan(z)` → `potwierdz(wynik.potwierdzone)` → odczyt stanu → `poZapisie(w)` i powtarza, dopóki flaga `ponow` jest ustawiona. Seria N zdarzeń daje najwyżej 2 przebiegi scalenia, a końcowa wartość licznika = wartość + N.
3. Błąd scalenia nie jest cichy dla diagnostyki: wpis `blad` (kod `zegarek_scalenie`, bez treści projektów, NFR-PRY-001), linie zostają w dzienniku (nie są skracane), ponowienie przy następnym zdarzeniu, powrocie na pierwszy plan albo ponowieniu zegarka. Komunikatu dla użytkowniczki nie ma: dane nie są utracone, a zegarek ma własny stan „nie zapisano” (ADR-0009 uzupełnienie pkt 2).
4. Haptyka na zegarku: decyzja „jaki wzorzec po stuknięciu” to czysta funkcja w pakiecie reguł (`oczko-reguly`, Swift): wejście — stan przed/po stuknięciu i lista przypomnień rzędu (ta sama reguła `numerRzedu` co pas przypomnienia), wynik ∈ {`plus`, `przypomnienie`, `bladZapisu`, `blokadaStukniecie`}; adapter `WKInterfaceDevice.current().play(...)` mapuje wynik na `WKHapticType` z `haptykaZegarek` w `tokeny.json`. **Wymaga tokenu `haptykaZegarek.przypomnienie` od roli 04** (dziś go nie ma); do czasu tokenu zegarek gra `plus` (stan obecny), a sprawdzenie „wibruje” pozostaje na urządzeniu (P-316).
5. Haptyka na telefonie: bez zmian — BR-LIC-020 dotyczy akcji na telefonie; zdarzenie z zegarka scalone na telefonie nie wibruje telefonu (wibracja telefonu nie ma właściciela w ręku; [OCENA 05], do weryfikacji przy teście P-316).

### Konsekwencje
- Dobre: telefon z otwartą aplikacją pokazuje wynik zegarka bez opuszczania aplikacji; zegarek dostaje `potwierdzone` od razu, więc nie pokazuje fałszywego „iPhone not nearby”; zero nowych zapisów poza istniejącym scaleniem.
- Złe: dwa scalenia przy serii (celowo); w tle nic się nie dzieje do powrotu na pierwszy plan (jak dotąd, R-020); wzorzec haptyki zależy od tokenu 04.
- Od czego zależy (decyzja warunkowa): token roli 04 (pkt 4); test na zegarku właściciela (P-316, okno macOS 8e); potwierdzenie koordynatora.

### Potwierdzenie
- Testy w Node z udawanym zegarkiem (`tests/ekrany/e2e-zegarek-stan.test.tsx` rozszerzony albo nowy `tests/kompozycja/zegarek-odbior.test.ts`): K-05a–K-05f. Swift (`swift test`, CI macOS): K-05g (funkcja wzorca). Urządzenie: K-05h (telefon na pierwszym planie, 3 stuknięcia na zegarku).
- Kontrola ARCH-13: scalenie z zegarka nigdy nie startuje przy `AppState !== 'active'` (test z udawanym `AppState`).

## Opcje: zalety i wady
### A — zalety: jedna ścieżka scalania, idempotentna, bezpieczna dla blokady pliku · wady: scalenie czyta cały dziennik (mały, skracany po scaleniu).
### B — zalety: bez odczytu pliku · wady: druga implementacja scalania, ładunek może zgubić linie przy błędzie dostarczenia zdarzenia.
### C — zalety: nie zależy od zdarzeń modułu · wady: timer, bateria, opóźnienie, sprzeczne z ARCH-14 w duchu (czas ze znaczników, nie z tykania).
