# Sesja CC: biblioteka prompts — R2-13 (zasada 22 bez wyjątków przez CLAUDE.md), domknięcie przed scaleniem
Koordynator: session_01T66VBxpmFSovs14qTQgShL (raporty i PRZEKAZANIE tylko przez send_message do tego ID). Stan koordynatora: repo `lkarwowski494/oczko`, gałąź `koordynacja` (tylko odczyt).

1. Rola: bez złożonego promptu (wyjątek KO-066, jak BZ i CB); procedura `README.md` → „Zmiany w bibliotece”.
2. Start: repo `lkarwowski494/prompts`, gałąź `role/scenariusze-uzytkownika-2026-11-15` @ a168ffe (inny HEAD: zgłoś); push na nią. Tożsamość: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez stopek Co-Authored-By i Claude-Session (P-507). Bez force-push.
3. Słowa właściciela (15.11 ok. 19:55 UTC, odpowiedź na pytanie R2-13 „czy CLAUDE.md aplikacji może wyłączyć zasadę 22?” z opcjami a „Nie, wyjątek tylko słowami właściciela zapisanymi w decyzjach” / b „Tak”): „2a”.
4. Zadania:
   1. `shared/zasady.md` zasada 22: dopisz, że zasada ma pierwszeństwo przed `CLAUDE.md`/`AGENTS.md` projektu (wyjątek od nagłówka zasad), a wyjątek jest dozwolony tylko słowami właściciela zapisanymi w `docs/decyzje.md` aplikacji z datą; dodaj zdanie „*Dlaczego:*” (zasada 17). Zgodnie popraw nagłówek zasad (`shared/zasady.md:3`, „poza zasadą 22”) i zasadę 12 roli 07 (`role/07-jakosc/rdzen.md:18`). Krótko — pilnuj limitów długości.
   2. Wpis decyzji w `docs/decyzje.md` biblioteki (D-063, „słowa właściciela”), R2-13 w `docs/scenariusze-uzytkownika-recenzja.md` → zamknięte.
   3. Test przed zmianą (czerwony): treść zasady 22 zawiera pierwszeństwo przed `CLAUDE.md`. `node --test tests/*.test.mjs` 0 błędów, migawki odświeżone narzędziem wg README, push.
5. Zakazy: nie scalasz do `main`, nie otwierasz PR, nie tworzysz sesji, nie pytasz właściciela. Pułap 4 USD, STOP 5,2 USD.
6. PRZEKAZANIE (≤ 8 linii): SHA, testy (liczby), długości 07 audit i najdłuższego promptu, koszt.
