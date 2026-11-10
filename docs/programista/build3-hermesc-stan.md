# TF-B3-01: test licencji OFL czerwony na macOS (rola 08 fix, sesja N, 2026-11-10)

Stan: poprawka gotowa na `claude/n-hermesc-2026-11-10` (od 87ade5a); na integrację nic nie wypchnięto. Decyzje P-681, P-682.

- Przyczyna: `hermes-compiler` ma w paczce binarki wszystkich platform; test z 47c32cb brał pierwszy istniejący plik (`linux64-bin`) także na macOS. Build 2 (58284a8) nie miał tego testu.
- Poprawka: `tests/wydanie/hermesc-sciezka.ts` (wybór według platformy, brak = błąd) i `tests/wydanie/hermesc-sciezka.test.ts` (5 testów, platforma jako parametr).
- Czerwony przed poprawką (Linux, `npx jest tests/wydanie/hermesc-sciezka.test.ts`): 3 failed, 2 passed; darwin dostawał `.../linux64-bin/hermesc`, brak binarki i win32 bez wyjątku.
- Zielony po: 8/8 (`hermesc-sciezka` + `licencja-ofl-w-pakiecie`); pełny verify w haku pre-push.
- Otwarte: potwierdzenie na macOS daje dopiero następny przebieg `testflight.yml` (wyzwala koordynator albo właściciel); `k.error` z macOS niezapisany.
