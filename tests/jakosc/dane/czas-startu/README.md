# Fikstury `czas-startu` (PU-162, KO-111)

Zminimalizowane wycinki prawdziwych plików `commands.json` Maestro 2.12.1 z artefaktu `e2e-czesc-4-iphone`
przebiegu „Jakość · iOS” 43828957399 (SHA cd95fc4b, 16.11.2026). Układ katalogów jak w artefakcie:
`<scenariusz>/<data>/<nazwa scenariusza>/commands.json`.

- Zachowane: początek listy poleceń do trzeciego polecenia po pierwszym `dzis-karta` (wartości `timestamp` i `duration`
  w milisekundach bez zmian), polecenia opakowujące `runFlowCommand` z nazwami zredukowanymi do `launchAppCommand` + asercji.
- Usunięte: `evaluatedCommand` (powtórzenie), identyfikator symulatora (`MAESTRO_DEVICE_UDID`), reszta poleceń scenariusza 31.
- Oczekiwane czasy (wzór: `timestamp + duration` asercji `dzis-karta` − `timestamp` `launchApp`): scenariusz 30 = 29108 ms
  (21161 + 7851 + 96 przerwy), scenariusz 31 = 33200 ms (20208 + 12985 + 7).
