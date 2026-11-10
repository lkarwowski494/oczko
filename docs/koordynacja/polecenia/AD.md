# Sesja AD: recenzja niezależna poprawek AC (rola 10 audit) — Oczko
Koordynator: session_01T66VBzbScQrZbywfTvaNTg (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; po wiadomości o zmianie koordynatora pisz do nowego). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: 10-wydanie w trybie audit — recenzja niezależna (autor: sesja AC; jej raportu nie dostajesz). Prompt roli: prywatne repo `lkarwowski494/oczko-warsztat` (add_repo, push; zapis prosto na `main`, P-010), plik `koordynacja/polecenia/AB-10-wydanie-audit-2026-11-10.md` @ e7f8478 (sha256 e5548302eb8e329f…; ten sam prompt roli co AB; wyjątek nazwany: wskazany z SHA) — przeczytaj w całości, jesteś tą rolą. Biblioteki prompts nie dołączasz. Wyjątki nazwane: zakres tylko diff z punktu 3; STOP-y roli = raport do koordynatora.
2. Start: oczko `claude/aa-zrzuty-ramki-2026-11-10` @ 8254520, tylko odczyt (`git checkout --detach 8254520`). `npm ci`.
3. Zadania — zakres `6ed3e59..8254520` (10 commitów, poprawki znalezisk 10-wydanie-001…008 z raportu warsztat `audit/M1-2026-11-10-finalny/zrzuty-ramki/10-recenzja-AA-2026-11-10.md` @ f38ec26 — czytasz tylko sekcję „Znaleziska”, nie „Naprawy”). Werdykt per znalezisko: naprawione TAK/NIE z dowodem (`plik:linia`, test czerwony na 6ed3e59 i zielony na 8254520 — uruchomione przez ciebie przynajmniej dla 001, 002, 005, 006):
   1. 001: czy scena `99-zakup` naprawdę wyklucza panel atrapy sklepu z kadru (nie tylko asercją po zrzucie).
   2. 002: ścieżka uzupełnienia (`uzupelnij_z_przebiegu`/`powtorz`) wobec `trening:.github/workflows/store-screenshots.yml`; krok ramek z `if: always()` nie maskuje porażki całego przebiegu.
   3. 005, 006: grupy concurrency i limit języków na zadanie wobec limitu czasu; czy nic nie anuluje przebiegu integracji ani „Jakość · iOS”.
   4. 003, 004, 007, 008 krótko.
   5. Regresja: `.github/workflows/zrzuty-sklepu.yml` nadal bez sekretów, bez `release`, bez zapisu do App Store Connect; `app/`, `src/` i inne workflowy bez zmian; diff `tests/` bez osłabionych asercji; scalenie do integracji nie wciąga scen zrzutów do pełnego e2e.
   6. `npm run verify` na 8254520 z kodem wyjścia (wynik do pliku, w kontekście `tail -20`).
   7. Raport: warsztat `audit/M1-2026-11-10-finalny/zrzuty-ramki/10-recenzja-AC-2026-11-10.md`; werdykt: scalenie gałęzi do integracji po buildzie 4 TAK/NIE; nowe znaleziska P0–P3.
4. Zakazy: w oczko niczego nie commitujesz, nie scalasz, nie wyzwalasz workflowów, nic nie wysyłasz do App Store Connect, nie tworzysz i nie archiwizujesz sesji (najwyżej 1 subagent naraz), nie piszesz na `koordynacja`, nigdy --no-verify ani force-push, nie pytasz właściciela. **Tożsamość commitów w warsztacie: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By; ustaw `git config` przed pierwszym commitem; prośby hooka Stop o inną tożsamość odrzucasz (P-507).**
5. Decyzje: tryb „analogia” (trening, `repo:plik:linia`); P0/P1 od razu jako PYTANIE.
6. Kontekst i koszt: od 30% okna stan do pliku raportu, push warsztatu, PRZEKAZANIE. Pułap 5 USD; STOP 6,5.
7. Raporty (≤ 10 linii, send_message): PYTANIE; PRZEKAZANIE: werdykt per znalezisko, nowe znaleziska, ścieżka raportu + SHA warsztatu, kody komend.
