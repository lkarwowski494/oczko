# Materiał na wersję 1.1 z kodu 0.1.0 (P-099 D1a)
Kopie plików 0.1.0 (stan z gałęzi roboczej przed partią porządkową) przeniesione przez rolę 08 w partii porządkowej. **Materiał, nie dowód działania** (P-004): kod nie jest uruchamiany ani testowany, nie wchodzi do `tsconfig` ani do testów.
- `shaping-calculator.ts` — F-40 (PÓŹNIEJ, BR-KAL-004): równomierne dodawanie i ujmowanie; zgodny z RD-05-W1 i RD-06-W3 według `docs/porownanie-kodu.md`; przed użyciem rozstrzygnąć OP-04 (rząd płaski / okrążenie).
- `yarn-usage-estimator.ts` — F-42 (PÓŹNIEJ, BR-KAL-005): tylko `estimateYarnFromSwatch` jako wzór; **bez zapasu domyślnego** (`safetyMarginPercent = 10` sprzeczny z BR-KAL-005/S3 i OP-05).
Testy 0.1.0 tych plików: w historii git przed commitem „08 porządki A2” (`src/core/__tests__/shaping-calculator.test.ts`, `yarn-usage-estimator.test.ts`).
