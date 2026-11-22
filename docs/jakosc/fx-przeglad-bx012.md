# Przegląd BX-012 (ścieżka wrażliwa: bramka KO-065) — nieodbyty w sesji FX

Powód: koordynator zakazał subagentów w sesji FX (KO-078: „bez subagentów”); przegląd zleca koordynator albo właściciel (rola 08 fix, ścieżki wrażliwe). Wyjątek nazwany P-873.
Zakres dla recenzenta (nowy kontekst, bez rozumowania autora): `git diff edcfb7cd..HEAD -- scripts/jakosc/bramka-przypadki-uzycia.mjs tests/jakosc/bramka-przypadki-uzycia.test.ts`, funkcja `tagiScenariusza`.
Pytania: (1) czy któraś kontrola korzystająca z `tagi()` (`oczekujacy`, `ipad`, K3-2) może po zmianie przestać być sprawdzana albo zaliczać więcej niż powinna; (2) czy tag w komentarzu, po `---` albo w innym kluczu może zostać wzięty za tag; (3) czy skrajne wejścia (brak `tags:`, `tags:` na końcu pliku, `tags: []`, wielokrotne `tags:`) dają bezpieczny wynik. Tylko P0/P1 z `plik:linia` i scenariuszem albo „brak uwag”.
Tańsza kontrola w zastępstwie (zasada 7): test „tylko zaostrzenie” na 85 scenariuszach z repo + bateria przypadków obejścia w `tests/jakosc/bramka-przypadki-uzycia.test.ts` („BX-012”).
