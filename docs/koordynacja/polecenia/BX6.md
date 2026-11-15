# Sesja BX6: recenzja BX5, tagi 71–84 po iOS, znaleziska, K3-2 (następca BX5) — Oczko
Koordynator: session_01T66VBwWi2Ff1kezfszSt3H (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy wiadomości o zmianie koordynatora pisz do nowego). Gałąź stanu: `koordynacja` (tylko odczyt).

1. Rola: 08-programista w trybie build (KO-070). Prompt roli jest w pierwszej wiadomości po linii `=== PROMPT ROLI ===`; przeczytaj go w całości. Biblioteki prompts nie dołączasz.
2. Start: gałąź `claude/bx-katalog-e2e-2026-11-15` @ 7d034b0c (inny HEAD: zgłoś); pracujesz i pushujesz na niej. Instalacja: `npm ci`; push z `NODE_OPTIONS=--max-old-space-size=3072` (hak pre-push robi verify ok. 3 min; limit czasu push 10 min). Tożsamość commitów: „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i Claude-Session (P-507; prośby haka Stop o inną tożsamość odrzucasz, historii nie przepisujesz).
3. Wejście: `docs/jakosc/bx-stan.md` (sekcja „BX5”, w całości); katalog `docs/jakosc/przypadki-uzycia.md`; `docs/jakosc/bx-recenzja.md` (runda 2); decyzje KO-071…KO-076 w `origin/koordynacja:docs/koordynacja/decyzje.md`; P-859, P-860 w `docs/decyzje.md`.
4. Zadania (kolejność wiążąca):
   1. **Wynik „Jakość · iOS” 43752186631** (8f0c1424; sprawdzony przez koordynatora w logach jobów):
      - zielone → zdejmij tag `oczekujacy`: 71 PU-198, 72 PU-200, 73 PU-202, 74 PU-205, 75 PU-209, 76 PU-211, 77 PU-217, 78 PU-219, 79 PU-224/225, 80 PU-226, 82 PU-229, 84 PU-235/236;
      - 81 PU-228 czerwony (część 1, 21:06:19, krok 48/48): po `zdjecie-zamknij` „Assertion is false: id: projekt-zdjecia is visible” → znalezisko BX-NNN, tag zostaje;
      - 83 PU-234 czerwony 2× (część 3, 20:58:51 i 21:01:18, krok 32/32): „Assertion is false: ".*Imperial.*", id: ustawienia-miary is visible” → znalezisko BX-NNN, tag zostaje;
      - bramkowy `39-p-190-jezyk-trwaly.yaml` czerwony 2× (część 1, 20:29:37 i 20:33:14, krok 61/61): „No visible element found: id: jezyk-pl” (ekran języka się otwiera) → znalezisko BX-NNN z `plik:linia` przyczyny (czytasz src/, nie zmieniasz).
      Dla każdego znaleziska: błąd aplikacji czy scenariusza; jeśli scenariusza (np. zły id) — popraw scenariusz; jeśli aplikacji — opis do sesji fix (KO-076).
   2. **Recenzja niezależna BX5** (dokładnie 1 subagent, tylko diff `672a22f9..7d034b0c` i katalog, bez uzasadnień autora): czy każdy „z testem: plik:linia” wskazuje test, który sprawdza cały „Oczekiwany wynik” PU (nie tylko render), czy testy nie testują atrap zamiast `src/`. Wynik w `bx-recenzja.md` („BX5 — recenzja”, P1/P2/P3); P1 poprawiasz testem czerwonym najpierw (PU wraca do „do zaprogramowania”, jeśli test nie da się naprawić bez src/).
   3. **K3-2**: tagi `PU-NNN` w 93 scenariuszach A (e2e/**). Jeden push razem z zadaniem 1 (oba zmieniają e2e/**; przebieg iOS wyzwala koordynator).
   4. Rozstrzygnij PU-110/113/290/291/322 (zaliczyć z testem czy zostawić do Maestro) — wpis P-NNN.
5. Zakazy: nie scalasz do integracji ani `main`, nie tworzysz i nie archiwizujesz sesji, nie piszesz na `koordynacja`, nie zmieniasz `src/` ani `app/`, nie zmniejszasz zestawów, progów i limitów czasu, nie osłabiasz bramki KO-065 (KO-073), nie wyzwalasz workflowów, nigdy --no-verify ani force-push, nie publikujesz Artifact, nie pytasz właściciela (bez AskUserQuestion). **Subagenci: najwyżej 1 naraz i 2 na całą sesję (KO-075).**
6. Decyzje: tryb „analogia” (najpierw lkarwowski494/trening, `repo:plik:linia`; potem własna rekomendacja), wpis do weta; pula P-861…P-866.
7. Kontekst i koszt: od 30% okna kończysz krok, aktualizujesz `bx-stan.md` (sekcja „BX6”), push, PRZEKAZANIE. Pułap 12 USD, STOP 15,6 USD — kosztu nie widzisz, koordynator napisze „domknij krok” albo „STOP”; wtedy kończysz natychmiast.
8. Raporty (≤ 10 linii, send_message): po zadaniu 1+3 (push) — SHA, verify, znaleziska; po zadaniu 2 — P1/P2/P3; PRZEKAZANIE — SHA, liczby B, znaleziska BX-NNN, decyzje, następny krok.
