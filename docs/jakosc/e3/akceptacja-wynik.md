# Testy akceptacyjne: stan przed kodem
Wygenerowano: 2026-11-28T13:14:29.729Z · `node scripts/jakosc/akceptacja-raport.mjs`

Razem 15: asercja 13, znacznik 2; błędy raportu: 0.

| Plik | Test | Stan | Fragment wyniku |
|---|---|---|---|
| tests/akceptacja/ekrany/zm27-menu-zdejmij.test.tsx | ZM-27 (b) „Remove from Lock Screen” w ••• licznika › ZM-27 PU-Z09: aktywność pokazuje ten licznik → pozycja z podpisem, pierwsza w drugiej grupie (przed „Lock counter”); stuknięcie woła zdjęcie i zamyka arkusz | asercja |  |
| tests/akceptacja/ekrany/zm27-menu-zdejmij.test.tsx | ZM-27 (b) „Remove from Lock Screen” w ••• licznika › ZM-27 PU-Z10: stoper `trwa` → dopisek „The timer keeps running.”; bez aktywności tego licznika pozycja ukryta (nie wyszarzona) | asercja |  |
| tests/akceptacja/ekrany/zm24-krok-i-podpowiedz.test.tsx | ZM-24 krok +2 (U6) › ZM-24 PU-Z03: „Dodaj licznik” ma „Step” z +1 (domyślnie) i +2 (`dodaj-licznik-krok-2`); zapis z +2 przekazuje krok 2 | asercja |  |
| tests/akceptacja/ekrany/zm24-krok-i-podpowiedz.test.tsx | ZM-24 krok +2 (U6) › ZM-24 PU-Z03: licznik z krokiem 2 — przycisk „+2”, podpis „rows 43–44 done”, etykieta VoiceOver z dwoma rzędami | asercja |  |
| tests/akceptacja/ekrany/zm24-krok-i-podpowiedz.test.tsx | ZM-24 krok +2 (U6) › ZM-24 PU-Z04: ••• ma „Counter settings” (`licznik-menu-ustawienia`) na końcu pierwszej grupy; stuknięcie otwiera ustawienia | asercja |  |
| tests/akceptacja/ekrany/zm24-krok-i-podpowiedz.test.tsx | ZM-24 / ZM-25 arkusz „Counter settings” (P-1102, P-1103) › ZM-24 PU-Z04: krok +2 (`ustawienia-licznika-krok-2`) → zapis z krokiem 2 i podpowiedzią wyłączoną | znacznik | Error: NIEZAIMPLEMENTOWANE: ZM-24 UstawieniaLicznika — brak modułu src/ekrany/UstawieniaLicznika |
| tests/akceptacja/ekrany/zm24-krok-i-podpowiedz.test.tsx | ZM-24 / ZM-25 arkusz „Counter settings” (P-1102, P-1103) › ZM-25 PU-Z05: „Nudge me if I forget +1” domyślnie wyłączone, lista progu ukryta; po włączeniu 5/10/15/30 min z domyślnym 10 | znacznik | Error: NIEZAIMPLEMENTOWANE: ZM-24 UstawieniaLicznika — brak modułu src/ekrany/UstawieniaLicznika |
| tests/akceptacja/ekrany/zm24-krok-i-podpowiedz.test.tsx | ZM-25 podpowiedź +1 na liczniku (forma A, P-1103) › ZM-25 PU-Z05: stan podpowiedzi — `licznik-podpowiedz` z „10 min without +1” i „row 43 done?”; etykieta VoiceOver z pytaniem | asercja |  |
| tests/akceptacja/ekrany/zm24-krok-i-podpowiedz.test.tsx | ZM-25 podpowiedź +1 na liczniku (forma A, P-1103) › ZM-25 PU-Z05: przy limicie i zablokowanym liczniku podpowiedzi nie ma, nawet gdy stan ją niesie (P-1103) | asercja |  |
| tests/akceptacja/kontrole/zm22-zm24-xctest.test.ts | ZM-22 ZM-24: XCTest pakietu czyta wektory-1-0-2.json („intencja”) — wszystkie ID IN-01…IN-11 wykonane przez Wykonane.sprawdz | asercja | Error: expect(received).toContain(expected) // indexOf |
| tests/akceptacja/kontrole/zm22-zm24-xctest.test.ts | ZM-24: XCTest haptyki zegarka przy skoku czyta „przypomnienie_skoku” (PS-01…PS-07) | asercja | Error: expect(received).toMatch(expected) |
| tests/akceptacja/ekrany/zm26-zm28-podpowiedzi.test.tsx | ZM-26 PU-030: pod „Stitches” w „Add counter” widać „For example, a chain or casting on.” jako część etykiety radia dla VoiceOver | asercja |  |
| tests/akceptacja/ekrany/zm26-zm28-podpowiedzi.test.tsx | ZM-28 PU-016: w „Add pattern” pod listą źródeł zdanie o rozpisce tekstem (`wzor-podpowiedz-tekst`), bez nowej akcji | asercja |  |
| tests/akceptacja/ekrany/zm23-zrealizuj-kod.test.tsx | ZM-23 „Redeem code” na ekranie Oczko Pro (U5) › ZM-23 PU-Z08: przycisk „Redeem code” obok „Restore purchases”; stuknięcie woła realizację kodu w porcie sklepu | asercja |  |
| tests/akceptacja/ekrany/zm23-zrealizuj-kod.test.tsx | ZM-23 „Redeem code” na ekranie Oczko Pro (U5) › ZM-23 PU-Z08: bez sieci → linia „An internet connection is needed.” w roli alertu | asercja |  |
