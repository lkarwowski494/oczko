# BX12 — dodatek 1 (KO-104, 2026-11-16): poprawki po recenzji CK

Źródło: `origin/claude/ck-recenzja-scen-2026-11-16:docs/jakosc/ck-recenzja-scenariusze.md` @ 9b0fbfb0 (przeczytaj wiersze CK-01…CK-09). Zasady z polecenia głównego `BX12.md` obowiązują bez zmian (autor właściciela, **bez** `Co-Authored-By` i `Claude-Session`, nigdy `--no-verify`, zasada 22). Kolejność: po zad. 1 i 2, przed resztą zad. 3. Każda poprawka = osobny commit, test czerwony najpierw tam, gdzie to test.

1. **CK-01 (P2)** scen. 105: dodać kontrolę pozytywną obrotu — na ekranie wzoru `setOrientation LANDSCAPE_LEFT` → asercja `e2e-okno` „window: landscape”, potem dotychczasowe asercje „portrait”; poprawić błędne odesłanie do scen. 103 w nagłówku. Scenariusz zostaje `oczekujacy` do zielonego iOS.
2. **CK-02 (P2)** scen. 91: przed restartem wybrać wzór, który **nie** jest pierwszy po nazwie, tak aby regresja zapamiętania wyboru dawała czerwień.
3. **CK-03 (P2)** `tests/jakosc/pu-191-bez-sdk-reklam-i-sledzenia.test.ts`: ID decyzji na liście dozwolonych musi istnieć w `docs/decyzje.md`; lista zakazanych obejmuje też `devDependencies` i produkcyjne pakiety z lockfile. Dowód: mutacje (a)–(c) z raportu CK padają.
4. **CK-04, CK-05 (P3)** katalog PU: tylko kolumna pokrycia — dopisek „częściowo” przy PU-067 i PU-011 (opisu, klasy ani listy nie ruszać).
5. **CK-09 (P3)** nieaktualny komentarz w `tests/jakosc/e2e-noc-2026-11-02.test.ts:191`.

Poza zakresem (nie ruszać): CK-06, CK-07 (rejestr), CK-08 (cel PU-044 — wymaga słów właściciela).
Raport: SHA każdego commita, wynik mutacji CK-03, `npm run verify`.
