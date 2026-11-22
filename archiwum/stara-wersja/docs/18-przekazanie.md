# 18. Przekazanie Projektu — Oczko (Purlo) 🧶

> **Stan na:** 17.10.2026  
> **Status:** Standard Role-Model (`trening` + `organizer`) wdrożony w 100% per BRD-QA-REL 1.0  

---

## 1. Architektura i Stan Techniczny

1. **Jądro domenowe (Domain Core):**
   - 100.00% pokrycia linii, gałęzi, instrukcji i funkcji w `src/core/` (weryfikowane przez `npm run test:coverage`).
   - Czysta warstwa domenowa bez żadnych zależności od platformy czy sieci.
2. **Trwałość danych i Odzyskiwanie po Awarii:**
   - Dwie rozdzielne pule po 10 kopii zapasowych w SQLite/FS:
     - Pula sesyjna: `kopia-YYYY-MM-DD-HH-mm-ss.json` (max 10)
     - Pula bezpieczeństwa: `przed-importem-*` i `przed-czyszczeniem-*` (max 10, przyrostek `-2` przy tej samej sekundzie).
   - Ochrona uszkodzonego stanu: `state_corrupt_<timestamp>.json` z polem `recovery` i banerem `RecoveryBanner` na ekranie głównym.
3. **Własności matematyczne (PBT) i Wyrocznia Pythona:**
   - Stateful PBT z monotonicznym zegarem i deterministycznymi sekwencjami akcji.
   - Niezależna wyrocznia Pythona `scripts/gen-gauge-corpus.py` weryfikująca algorytmy próbki ściegu i kształtowania.
4. **Macierz Pokrycia AST (`scripts/test-matrix.mjs`):**
   - 100% we wszystkich 5 kategoriach w `docs/22-macierz-testow.md`:
     - `EKRAN`: 5/5 (100%)
     - `UI`: 43/43 (100%)
     - `TEKST`: 235/235 (100%)
     - `LOGIKA`: 186/186 (100%)
     - `WYMIAR`: 50/50 (100%)
   - Parser AST z wycinaniem komentarzy, tytułów testów i deklaracji importu.
5. **Przepływy Maestro w Jest:**
   - 10 scenariuszy `.maestro/*.yaml` wykonywanych przez `tests/maestro-runner.ts`.
   - Testy stref czasowych (`tests/maestro-runner.test.ts`) dla poniedziałku, niedzieli i 23:55 UTC.
6. **Bezpieczeństwo i Higiena:**
   - Bramka `npm run check:i18n` — 0 brakujących i 0 martwych kluczy.
   - Bramka `npm run check:licenses` — weryfikacja licencji permisywnych i blokada GPL/LGPL/AGPL.
   - Skaner `.gitleaks.toml` i `.github/scripts/gitleaks-range.sh` z flagą `-m`.
   - Kontrakt czystości marek `tests/brands.contract.test.ts`.
   - Skrypt weryfikacji natywnej `scripts/verify-native.mjs` (20 punktów iOS).
   - Test bezpieczeństwa publicznego repo `tests/public-repo.test.ts`.

---

## 2. Główna Komenda Weryfikacyjna

Wszelkie zmiany w projekcie muszą zakończyć się sukcesem komendy:
```bash
npm run verify
```
Składa się ona z:
1. `npm run typecheck` (`tsc --noEmit`)
2. `npm run check:i18n` (spójność słowników PL i EN)
3. `npm run check:licenses` (sprawdzenie licencji open-source)
4. `node scripts/test-matrix.mjs --check` (100% pokrycia macierzy AST)
5. `node scripts/verify-native.mjs` (niezmienniki iOS na Linuksie/Windowsie)
6. `npm run test:coverage` (wszystkie testy jednostkowe, integracyjne, PBT i kontraktowe)
