# Testy akceptacyjne: stan przed kodem
Wygenerowano: 2026-11-28T14:26:19.199Z · `node scripts/jakosc/akceptacja-raport.mjs`

Razem 2: asercja 2; błędy raportu: 0.

| Plik | Test | Stan | Fragment wyniku |
|---|---|---|---|
| tests/akceptacja/kontrole/zm22-zm24-xctest.test.ts | ZM-22 ZM-24: XCTest pakietu czyta wektory-1-0-2.json („intencja”) — wszystkie ID IN-01…IN-11 wykonane przez Wykonane.sprawdz | asercja | Error: expect(received).toContain(expected) // indexOf |
| tests/akceptacja/kontrole/zm22-zm24-xctest.test.ts | ZM-24: XCTest haptyki zegarka przy skoku czyta „przypomnienie_skoku” (PS-01…PS-07) | asercja | Error: expect(received).toMatch(expected) |
