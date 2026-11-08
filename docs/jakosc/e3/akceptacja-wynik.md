# Testy akceptacyjne: stan przed kodem
Wygenerowano: 2026-11-08T17:19:54.501Z · `node scripts/jakosc/akceptacja-raport.mjs`

Razem 8: asercja 8; błędy raportu: 0.

| Plik | Test | Stan | Fragment wyniku |
|---|---|---|---|
| tests/akceptacja/dane/start-dzis.test.ts | przygotuj(): zimny start zawsze „Dziś” (ZM-18, P-563 4a) › NFR-PIE-001 / BR-LIC-001/S1 (ER-68): świeża instalacja → „Dziś”, karta „Pierwszy licznik” otwiera licznik z 0 | asercja | Error: expect(received).toEqual(expected) // deep equality |
| tests/akceptacja/dane/start-dzis.test.ts | przygotuj(): zimny start zawsze „Dziś” (ZM-18, P-563 4a) › BR-PRJ-011/S1 (ER-69): restart po pracy w liczniku → „Dziś”, „Kontynuuj ›” do tego licznika; „+1” karty liczy ten sam licznik | asercja | Error: expect(received).toEqual(expected) // deep equality |
| tests/akceptacja/dane/start-dzis.test.ts | przygotuj(): zimny start zawsze „Dziś” (ZM-18, P-563 4a) › BR-PRJ-011/S1 (P-563 4a): praca skończyła się na wzorze → start na „Dziś” (nie na wzorze); „Kontynuuj ›” do wzoru, strona i powiększenie zachowane | asercja | Error: expect(received).toEqual(expected) // deep equality |
| tests/akceptacja/dane/start-dzis.test.ts | przygotuj(): zimny start zawsze „Dziś” (ZM-18, P-563 4a) › BR-PRJ-011/S1 (P-564, P-565): ostatni licznik w koszu, projekty są → „Dziś” z kartą „Wybierz projekt ›” (miejsce: lista) | asercja | Error: expect(received).toEqual(expected) // deep equality |
| tests/akceptacja/ekrany/start-dzis-wzor.test.tsx | BR-PRJ-011/S1 (ER-69, P-563 4a): praca skończyła się na wzorze → zimny start NIE otwiera wzoru sam (start na „Dziś”) | asercja | Error: expect(received).toHaveLength(expected) |
| tests/akceptacja/ekrany/dzis-start.test.tsx | „Dziś” jako pierwszy ekran (ZM-18, P-563 4a) › NFR-PIE-001 / BR-LIC-001/S1 (ER-68): pierwszy ekran „Dziś”, karta z 0 i „+1”, bez powitania, quizu, zakupu i odnośnika Pro | asercja |  |
| tests/akceptacja/ekrany/dzis-start.test.tsx | „Dziś” jako pierwszy ekran (ZM-18, P-563 4a) › BR-LIC-001/S2 (ER-68): „+1” karty = +1 licznika — ten sam przypadek użycia raz, wibracja „plus” po wyniku, karta 1 bez zmiany ekranu | asercja |  |
| tests/akceptacja/ekrany/dzis-start.test.tsx | „Dziś” jako pierwszy ekran (ZM-18, P-563 4a) › BR-ZAK-006/S1 (ER-70): limit zawczasu na karcie — bez „+1”, komunikat limitu z odnośnikiem Pro, „Kontynuuj ›” działa, bez ekranu zakupu | asercja |  |
