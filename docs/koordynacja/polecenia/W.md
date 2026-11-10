# Sesja W: recenzja niezależna poprawki 001/002 (rola 08 audit) — Oczko
Koordynator: session_01T66VBzSysgpxeGoAFWUzoF. Raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; po wiadomości o zmianie koordynatora piszesz do nowego. Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: 08-programista w trybie audit — recenzja niezależna (autor: sesja V; jej raportu nie dostajesz). Prompt roli: prywatne repo `lkarwowski494/oczko-warsztat` (add_repo, push; zapis prosto na `main`, P-010), plik `koordynacja/polecenia/Q-08-programista-audit-2026-11-10.md` @ 5b8551a — przeczytaj w całości, jesteś tą rolą. Jeśli add_repo zostanie odrzucony: nie ponawiaj, raport wyślij w wiadomości.
2. Start: oczko `claude/t-przewodnik-2026-11-10` @ 75242ba, tylko odczyt (`git checkout --detach 75242ba`). Zakres: `068eaa2..75242ba` (768c78f, 69f6c44, 75242ba). Znaleziska, które ta zmiana ma zamknąć: warsztat `audit/M1-2026-11-10-finalny/przewodnik/08-recenzja-t-2026-11-10.md` @ 9a792ab, sekcje 08-programista-001 i 002 (przeczytaj je; reszty tego raportu nie powtarzasz).
3. Zadania (werdykt per punkt, dowód uruchomiony albo przeczytany przez ciebie, `plik:linia`):
   1. 001: przy wejściu z „Dziś” „Pokaż” funkcji Ustawień kładzie Ustawienia na przewodnik (Wstecz → przewodnik, spec `docs/design/przewodnik-2026-11-10.md` §3); przy wejściu z Ustawień wraca do istniejących Ustawień (Q-001). Sprawdź na prawdziwym stanie stosu (`StackRouter` expo-router 57.0.27 albo test `tests/ekrany/przewodnik-stos.test.tsx`), czy test jest czerwony na 068eaa2 z właściwego powodu i nie sprawdza tylko atrapy. Inne wejścia do przewodnika (grep `przewodnik` w `app/`, `src/`): czy parametr nie wycieka i czy nie ma trzeciej ścieżki bez testu.
   2. 002: w spec §5 tylko zamknięcie znacznika, nic więcej w dokumentach 04 (`git diff 068eaa2 75242ba -- docs/design`).
   3. P-708 w `docs/decyzje.md`: wiersz dopisany, treść P-704 nietknięta, zgodność z kodem.
   4. Scenariusze Maestro 69/70: czy rzeczywiście nie dotykają zmienionej gałęzi (V twierdzi „bez zmian”).
   5. `npm run verify` na 75242ba z kodem wyjścia (wynik do pliku, w kontekście `tail -20`).
   6. Raport: warsztat `audit/M1-2026-11-10-finalny/przewodnik/08-recenzja-v-2026-11-10.md` (P0–P3 z realnością, `plik:linia`); werdykt **75242ba do scalenia z integracją TAK/NIE**.
4. Zakazy: w oczko niczego nie commitujesz, nie scalasz, nie wyzwalasz workflowów, nie tworzysz i nie archiwizujesz sesji (najwyżej 1 subagent naraz, sonnet albo haiku — WG-06), nie piszesz na `koordynacja`, nigdy --no-verify ani force-push, nie pytasz właściciela (bez AskUserQuestion). Commit w warsztacie: tożsamość „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By.
5. Kontekst i koszt: od 30% okna raport częściowy, push, PRZEKAZANIE. Pułap 3 USD, STOP 3,9. Celuj w 20 min.
6. Raporty (≤ 10 linii, send_message): PRZEKAZANIE: werdykt, liczba P0/P1/P2/P3 z opisem P0/P1/P2, kod verify, SHA raportu w warsztacie.
