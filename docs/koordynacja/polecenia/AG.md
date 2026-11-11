# Sesja AG: odbiór pierwszego przebiegu zrzutów C1 (rola 10 audit) — Oczko
Koordynator: session_01T66VBzYNZrXJBE3HaMBWVG (raporty, pytania i PRZEKAZANIE tylko przez send_message do tego ID; po wiadomości o zmianie koordynatora pisz do nowego). Gałąź stanu koordynatora: `koordynacja` (tylko do odczytu).

1. Rola: 10-wydanie w trybie audit. Prompt roli jest w twojej pierwszej wiadomości po linii `=== PROMPT ROLI ===`; przeczytaj go w całości, jesteś tą rolą. Biblioteki prompts ani warsztatu nie dołączasz (WG-11). Wyjątki nazwane: zakres tylko punkt 3; STOP-y roli = raport do koordynatora.
2. Start: oczko integracja `claude/youthful-pasteur-kx83sn` @ 19cbcc4, tylko odczyt.
3. Zadania — przebieg `zrzuty-sklepu.yml` **42992359897** (workflow_dispatch, en,pl, iphone,ipad; success 10:57 UTC). Artefakty pobierz przez GitHub MCP / API (`list_workflow_run_artifacts`, `download_workflow_run_artifact`) do scratchpadu i obejrzyj obrazy (Read na PNG):
   1. **010 (warunek z recenzji AF):** `99-zakup-ceny.png` (iphone i ipad, en) — czy w kadrze NIE ma panelu „Test store: expire access” ani innych paneli E2E; trzy plany z cenami i zdanie „Without Pro” widoczne. Werdykt TAK/NIE z opisem kadru.
   2. Ramki i podpisy en/pl: rozmiary plików zgodne z wymaganiami App Store (wg `docs/wydanie/zrzuty-ramki.md` i `docs/wydanie/sklep.md`), podpis nie nachodzi na zrzut, polskie znaki poprawne, brak obciętego tekstu; liczba zrzutów na urządzenie i język zgodna z planem.
   3. Kadry aplikacji: brak danych osobowych, brak elementów testowych/debug, brak pustych ekranów.
   4. Raport (≤ 60 linii) wyślij koordynatorowi przez send_message: werdykt per punkt, lista plików z problemem, znaleziska P0–P3 (numeracja od 10-wydanie-012), czego nie dało się sprawdzić. Nie zapisuj go w repo.
4. Zakazy: niczego nie commitujesz, nie scalasz, nie wyzwalasz workflowów, nic nie wysyłasz do App Store Connect, nie tworzysz i nie archiwizujesz sesji (najwyżej 1 subagent naraz), nie piszesz na `koordynacja`, nie pytasz właściciela (bez AskUserQuestion).
5. Decyzje: tryb „analogia” (trening, `repo:plik:linia`); pula P-729…P-730; P0/P1 od razu jako PYTANIE.
6. Kontekst i koszt: od 25% okna kończysz i wysyłasz raport. Pułap 4 USD; STOP 5,2.
