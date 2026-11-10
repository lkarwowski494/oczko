# Decyzje koordynatora (KO) — Oczko

Migracja: KO-001…KO-009 = wpisy P-634…P-642 w `docs/decyzje.md` na `origin/claude/kopia-koordynator-2026-11-08` (pełna treść tam).

| KO | Data UTC | Tryb | Decyzja | Analogia / powód | Odrzucone | Weto |
|---|---|---|---|---|---|---|
| KO-001 | 2026-11-09 21:21 | rekomendacja (zgoda trwała) | P-634: TF build 1 z 3772a7ca po zielonym przebiegu 6; brak pushy na integrację do potwierdzenia checkoutu po SHA | P-633, zgoda na build 1 | push od razu | do weta |
| KO-002 | 2026-11-09 21:29 | rekomendacja | P-635: 024 wariant A (`marginTop: 'auto'` zamiast wypełniacza `flex: 1`) | ramki z urządzenia | B jawna wysokość, C bez dociskania | do weta |
| KO-003 | 2026-11-09 22:30 | rekomendacja | P-636: build 2 scalony od razu, przebieg 7 zamiast osobnego `[e2e-ipad]` | oszczędność 1 przebiegu | 2 przebiegi; osobny e2e-ipad | do weta |
| KO-004 | 2026-11-09 22:42 | — | P-637: zapis 1101 VALID | fakt | — | — |
| KO-005 | 2026-11-10 00:38 | rekomendacja | P-638: 06 poprawka, 28 jedno ponowienie (P-091 9a) | bramka TF wymaga zielonego | wyjątek dla 06; ponowienie 06 | do weta |
| KO-006 | 2026-11-10 00:56 | rekomendacja | P-639: scalenie 06, przebieg 8 | — | — | do weta |
| KO-007 | 2026-11-10 03:01 | rekomendacja | P-640: TF build 2; M1 od razu na 58284a88 | commit ustalony | M1 po teście na telefonie | do weta |
| KO-008 | 2026-11-10 03:36 | rekomendacja | P-641: publikacja stron `site/` przed App Review (rola 10; publikacja = zgoda właściciela) | 5.1.1(i) | wysyłka ze starymi stronami | do weta |
| KO-009 | 2026-11-10 04:08 | rekomendacja | P-642: DEC-01 (c) P2 wizualne → 1.0.1, koniec zawieszenia P-544; DEC-02 (a) notatka App Review + plan zrzutów przed wysyłką | plan zamrożony P-458 | wszystko w 1.0; opis sklepu teraz | do weta |
