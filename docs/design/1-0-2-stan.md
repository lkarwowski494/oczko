# Stan PR2 — projekt 1.0.2 (rola 04 fix)

Aktualizacja: 2026-11-28 · Gałąź `claude/pr2-projekt-1-0-2-2026-11-28` od 38bf0d4b (wynik PR1) · Polecenie: `docs/koordynacja/polecenia/PR2.md` @ 56a87d65 (gałąź `koordynacja`) · Prompt: `04-studio-projektowe --tryb fix --moduly przeplywy-i-gesty,render-i-krytyka --zadania ZM-27` (prompts, klon `--depth 1` 2026-11-28).

## Zrobione
- PR1 (U3–U7, U10): makiety, zrzuty, spec i decyzje P-1100…P-1103 — `docs/design/1-0-2.md`; weto otwarte.
- PR2: scalenie integracji `0c3f9214` (RS1, P-1092…P-1095); konflikt `docs/decyzje.md` rozwiązany P rosnąco; verify po scaleniu kod 0.
- PR2: ZM-27 (sygnał 19, KO-234) — sekcja „ZM-27” w `docs/design/1-0-2.md`; makiety `z27-*` (10 ekranów, 40 zrzutów, arkusz `1-0-2/przeglad-zm27.png`); kontrast 26 par kod 0; warsztat 0 błędów; wiersz ZM-27 w `docs/scope-contract.md`; P-1107 (b), P-1108 (a), P-1109 (wyjątek: wiersz zakresu przez 04).
- verify: `docs/design/pr2-verify.txt`.

## Otwarte
- Weto: P-1100…P-1103 (PR1), P-1107…P-1109 (PR2; odrzucone opcje wyrenderowane: `z27-menu-nazwa-B`, `z27-menu-B-wyszarzone`, `z27-potwierdzenie-B`, `z27-blokada-wygaszona-B`).
- 05 (AR1): czas i mechanizm (a); wymagania 1–4 i pytanie 5 z sekcji ZM-27 (natychmiastowe usunięcie, powrót tylko przy liczeniu, czas (a) > 30 min, stoper; koniec przy „ukończonym” projekcie i koszu).
- Prototyp B (05/08) decyduje o B2 (P-1091); A niezależne.
- 09: `licznik.jednostka_w_trakcie` w `pl`; teksty U5 z Treningu; 4 klucze ZM-27 × 33.
- Urządzenie: czy Dynamic Island ukrywa aktywność aplikacji na pierwszym planie (przejście ZM-27 (b), krok 4) [DO USTALENIA].
- Po wdrożeniu: tryb audit 04 na zrzutach aplikacji (SP-13), 430 pt, urządzenie.

## Następny krok
Koordynator: weto albo przyjęcie P-1100…P-1103 i P-1107…P-1109 → 05 AR1 (czas (a)) → 07 (PU i testy przed kodem z „Paczki dla 07 i 08”) → 08.
