# DG1 — diagnoza czerwieni e2e 44266309347 (rola 08, tryb audit, sonnet)

Cel: ustalić, czy 4 porażki to maszyna/czas startu, czy realny defekt. **Bez zmian w kodzie i bez commitów na gałęziach kodu.**

- Run: https://github.com/lkarwowski494/oczko/actions/runs/44266309347 (SHA a830eb21; kod aplikacji = 01aaeddb, run 44236811872 zielony).
- Porażki (wszystkie 08:55–09:05 UTC, pierwsze scenariusze części):
  - cz. 2 (job 134684068856): BR-LIC-001/S1 (2×), PU-135 AX5 (`wzor-znacznik-rzad` "1");
  - cz. 3 (job 134684068862): NFR-PIE-001 (`dzis-karta` niewidoczna po czystej instalacji z zegarem 2026-11-30T23:55), BR-LIC-002 (`licznik-wartosc` "2" po +1).
- Pobierz artefakty runu (zrzuty, logi Maestro) przez MCP GitHub / logs_url + curl. Porównaj z tymi samymi scenariuszami w runie 44236811872.
- Raport (send_message do koordynatora, ≤ 25 linii): dla każdej porażki — co widać na zrzucie, przyczyna (maszyna / czas / defekt aplikacji / defekt scenariusza), dowód (plik, linia, zrzut), rekomendacja dla buildu 10 (≥ 2 opcje).
- Pułap 1,5 USD, STOP przy 2 USD. GitHub tylko przez MCP `mcp__github__*`. Bez czytania `archiwum/`.
