# 0037. Koniec Live Activity: (a) po czasie bez liczenia — wygląd przez `staleDate` bez procesu aplikacji, faktyczne `end` przy najbliższej okazji aplikacji, twarda granica 8 h systemu; (b) z menu licznika; start tylko przy liczeniu
Data: 2026-11-28 · Status: **proponowana** (do weta koordynatora wg P-087; P-1099) · Rola: 05 (fix AR1; KO-234, decyzja właściciela „19A” 28.11 ok. 11:15 wg koordynatora) · Uzupełnia: ADR-0008 (7) · Zależy od: ADR-0035, P-1091 (U7-B), prototyp B (`docs/architektura/1-0-2.md`)

## Kontekst i problem
Właściciel (wg koordynatora): w 1.0.2 Live Activity ma się kończyć (a) sama po czasie bez liczenia i (b) z pozycji menu licznika, ale nie przy każdym zamknięciu aplikacji.

Dziś Live Activity kończy tylko:
- reset widoku (`src/kompozycja/licznik.ts:203`);
- błędne dane (`src/przypadki-uzycia/ekran-blokady.ts:41`);
- nowy start, który kończy poprzednią (`modules/oczko-dziennik-plus/ios/OczkoDziennikPlusModule.swift:17`).

`staleDate` jest zawsze `nil` (`modules/oczko-dziennik-plus/ios/OczkoDziennikPlusModule.swift:18`, `:22`; `modules/oczko-dziennik-plus/ios/Wykonanie.swift:28-35`). Start wywołuje pierwsze `poZapisie` przy `aktywnosc == false`, a ta flaga żyje w pamięci procesu (`src/kompozycja/licznik.ts:77`, `:113-115`). Po zakończeniu Live Activity przez system (8 h) flaga zostaje `true`, więc Live Activity nie wraca do restartu procesu. To defekt istniejący, brzegowy (sesje > 8 h).

## Czynniki decyzji (fakty o platformie, odczyt 2026-11-28, rejestr Apple 22a–22j)
- **Brak zakończenia „o dacie” bez procesu aplikacji.** `Activity` ma tylko `end(_:dismissalPolicy:)` i `end(_:dismissalPolicy:timestamp:)`, wywoływane przez aplikację (lista symboli `activitykit/activity`). Zakończenie bez aplikacji daje tylko push z serwera (22h), a Oczko nie ma serwera (koszt stały 0 zł), albo limit 8 h (22a).
- `staleDate` bez aplikacji zmienia stan na `stale` (22b). Czy widok się przy tym przerysowuje, dokumentacja mówi niejednoznacznie (22c/22d), a rozstrzyga prototyp B.
- Zakończona Live Activity zostaje na ekranie blokady do 4 h (polityka `default`) albo znika od razu (`immediate`) (22g).
- Aplikacja w tle może zakończyć Live Activity, np. w zadaniu w tle: „You can update or end a Live Activity from your app while it runs in the background — for example, by using [BackgroundTasks].” (22i). Termin zadania wybiera system (moduł `tlo-i-sensory-ios`: BGTaskScheduler „decides the best time”).
- Styl `transient` kończy się po zablokowaniu urządzenia (22j), czyli odwrotnie do potrzeby ekranu blokady. Odrzucony.

## Rozważane opcje mechanizmu (a)
- **A1:** `staleDate = ostatnia zmiana + próg` i widok „zakończone” przy `isStale` (bez aplikacji, jeśli prototyp B potwierdzi). Do tego faktyczne `end(.immediate)` przy najbliższej okazji aplikacji (start, `inactive`/`active`, scalenie dziennika, zmiana daty). Twarda granica to 8 h systemu.
- **A2:** A1 i dodatkowo zadanie w tle (`expo-background-task`) kończące Live Activity po progu. Termin wybiera system, więc koniec nadal nie jest „o czasie”. Kosztuje nową zależność natywną, tryb tła w `Info.plist` z uzasadnieniem dla App Review (2.5.4) i wiersz w inwentarzu prywatności.
- **A3:** push ActivityKit z serwera. Wymaga serwera i APNs, czyli koszt stały, wbrew `CLAUDE.md`.

## Decyzja
**A1.** Tylko ten wariant działa bez serwera i bez nowego trybu tła. Bez procesu aplikacji robi to, na co pozwala platforma: wygląd po `staleDate` (warunkowo) i granicę 8 h. A2 nie daje gwarancji terminu, a dokłada koszt i ryzyko recenzji.

**Reguły (czyste funkcje, wektory AK-01…AK-11 i SD-01…SD-04 w `docs/architektura/wektory-1-0-2.json`; prototyp `decyzjaAktywnosci`, `dataNieaktualnosci`):**
1. **Start tylko przy liczeniu.** Liczenie to zmiana wartości w aplikacji: +k, −1, wpisanie, cofnięcie, zerowanie. Start następuje, gdy nie ma aktywnej Live Activity, a system pozwala (`liveDostepne`). Odświeżenie, czyli start aplikacji, powrót na pierwszy plan, scalenie dziennika, zmiana daty, Pro, języka albo licznika (ADR-0008 (7)), **nigdy nie uruchamia** Live Activity (AK-06). Inaczej otwarcie aplikacji cofałoby koniec z (a) i (b).
2. **„Aktywna” odczytana natywnie:** nowa funkcja modułu `liveAktywna(): Bool` = `!Activity<OczkoAtrybuty>.activities.isEmpty` (stan `active` albo `stale`) zastępuje flagę `aktywnosc` w pamięci. To naprawia brak powrotu po 8 h (AK-09).
3. **(a) Koniec po czasie:** przy każdym odświeżeniu aktywnej Live Activity: `teraz − ostatniaZmianaMs ≥ LIVE_KONIEC_PO_MS` albo licznik bez zdarzeń → `end(nil, dismissalPolicy: .immediate)` (AK-04, AK-05, AK-10). W przeciwnym razie aktualizacja jak dziś. `ostatniaZmianaMs` = `czas_ms` ostatniego zdarzenia pokazywanego licznika z dowolnego źródła, czyli także −1 i stuknięć z ekranu blokady po scaleniu.
4. **`staleDate`** przy każdym `liveStart`/`liveAktualizuj` z JS i po każdym stuknięciu w intencji (`Wykonanie.swift`) = `ostatniaZmianaMs + min(próg przypominacza, LIVE_KONIEC_PO_MS)`, a gdy przypominacz jest wyłączony, `+ LIVE_KONIEC_PO_MS` (SD-01…SD-04). Jedna `staleDate` na treść, więc przy włączonym przypominaczu U7-B wygląd „zakończone” bez aplikacji nie wystąpi (widok rozróżnia tylko `isStale`). Wtedy koniec następuje przy okazji aplikacji albo po 8 h. Wygląd przy `isStale` projektuje 04 (PR1).
5. **(b) Menu licznika:** pozycja „zakończ na ekranie blokady” (tekst i miejsce: 04) → `liveZakoncz()` (jest, `.immediate`) (AK-07, AK-08). Następne liczenie uruchamia Live Activity od nowa (AK-09, reguła 1). Bez nowego ustawienia trwałego.
6. **Linie z ekranu blokady po końcu nie giną.** Po `end` widok nie ma przycisku, a intencja bez aktywnej Live Activity kończy się błędem `brakAktywnosci` przed zapisem (`modules/oczko-dziennik-plus/ios/Wykonanie.swift:14`). Stuknięcie, którego Live Activity nie pokazała jako zapisanego, nie jest daną użytkownika (8A). Linie zapisane przed końcem zostają w `dziennik-plus.jsonl` i scalają się przy najbliższym scaleniu. Linie bez rodzica czekają w poczekalni (PU-345, P-1079, P-1080), a od nieaktualnej głowy przesuwają się według ADR-0035. Koniec nie dotyka pliku dziennika ani poczekalni. Kolejność przy okazji aplikacji: scalenie dziennika jako pierwsza pozycja kolejki (ADR-0008 (2)), potem decyzja z reguły 3 (stan końcowy uwzględnia ostatnie stuknięcia).
7. **Zegarek** bez zmian: ma własny stan i kolejkę (ADR-0009), a koniec Live Activity go nie dotyczy.

**Parametr produktowy:** `LIVE_KONIEC_PO_MS = 7 200 000` (2 h) [OCENA; decyzja koordynatora albo właściciela]. Uzasadnienie: przerwa między rzędami to minuty, przerwa na posiłek ok. 1 h, a koniec pracy przy robótce zwykle kończy dzień; 2 h nie kończy Live Activity w trakcie przerwy i mieści się w 8 h. Opcje: 1 h (szybciej znika, ryzyko końca w przerwie), 4 h (bliżej limitu 8 h, mniejsza różnica wobec stanu obecnego). Trening nie ma analogii: jego Live Activity to odliczanie przerwy (ADR-0008, uzupełnienie fix-6).

### Konsekwencje
- Dobre:
  - Live Activity nie wisi po zakończeniu pracy;
  - otwarcie aplikacji jej nie wskrzesza;
  - wraca po 8 h przy następnym liczeniu;
  - zero nowych zależności i trybów tła;
  - linie z ekranu blokady bez zmian ścieżki.
- Złe:
  - bez prototypu B koniec „po czasie” bez otwarcia aplikacji widać dopiero po 8 h (system);
  - przy włączonym przypominaczu U7-B wygląd „zakończone” z `staleDate` nie występuje;
  - zmiana zachowania: Live Activity nie startuje przy samym otwarciu licznika.
- Od czego zależy:
  - wynik prototypu B (ten sam mechanizm `isStale`, kryterium TAK obejmuje znacznik po `staleDate`);
  - projekt 04 (pozycja menu, wygląd `isStale`);
  - wartość `LIVE_KONIEC_PO_MS`.

### Potwierdzenie
- Wektory AK i SD; `node docs/architektura/eksperymenty/1-0-2/sprawdz.mjs` → kod 0 (mutanty: wskrzeszanie przy odświeżeniu, `>` zamiast `≥`, `staleDate` bez przypominacza, bez `min`).
- Test 08 (TS, atrapa portu `liveActivity` z `aktywna()`):
  - po odświeżeniu z `ostatniaZmianaMs` sprzed 2 h → `zakoncz` po scaleniu dziennika (kolejność);
  - otwarcie licznika bez liczenia → brak `start`;
  - +1 po końcu → `start`;
  - port zwraca `aktywna = false` po końcu systemowym → `start` przy liczeniu.
- Test Swift: `staleDate` w `ActivityContent` z intencji = czas stuknięcia + próg (nie `nil`).
- PU (07): nowy B „Live Activity znika po 2 h bez liczenia przy powrocie do aplikacji”; nowy B „menu → zakończ”; nowy F „ekran blokady po 2 h bez liczenia” (obserwacja, z wynikiem prototypu B).
- Pozycje listy kontrolnej: ARCH-14 (czas ze znaczników, nie z timera), ARCH-15 (bez nowego trybu tła).

## Opcje: zalety i wady
### A1 — zalety: bez serwera i bez trybu tła; koniec przewidywalny przy okazji aplikacji · wady: bez aplikacji tylko wygląd (warunkowo) i 8 h.
### A2 — zalety: czasem kończy bez otwarcia aplikacji · wady: termin wybiera system; zależność natywna, tryb tła (2.5.4), prywatność.
### A3 — zalety: koniec o czasie · wady: serwer i APNs (koszt stały), dane poza urządzeniem.
