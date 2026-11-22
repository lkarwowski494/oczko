# Oczko (Purlo) — Zasady Projektu i Przewodnik Agenta

## 1. Repozytorium i Architektura
- Repozytorium jest **PUBLICZNE**. Absolutny zakaz commitowania sekretów, tokenów, certyfikatów, kluczy `.p8`/`.p12` oraz plików `.env`.
- Koszt stały: **0 PLN** (brak płatnych usług SaaS, Firebase Auth, EAS czy chmur zewnętrznych). Całość oparta o GitHub Actions i darmowy macOS dla publicznych repozytoriów.
- **Offline-First:** Pełna logika i funkcjonalność działa w 100% lokalnie w SQLite i pamięci urządzenia bez sieci.

## 2. Standard Jakościowy Role-Model (trening + organizer)
- **Logika domenowa:** Obowiązuje bezwzględne 100.00% pokrycia linii, gałęzi, instrukcji i funkcji (`src/core/`).
- **Macierz Pokrycia AST (`docs/22-macierz-testow.md`):** Utrzymywana na poziomie 100% we wszystkich 5 kategoriach (`EKRAN`, `UI`, `TEKST`, `LOGIKA`, `WYMIAR`).
- **Przepływy Maestro:** Scenariusze `.maestro/*.yaml` uruchamiane lokalnie i w Jest przez `tests/maestro-runner.ts` z testami skrajnych stref czasowych i przejścia przez północ (23:55 UTC).
- **Trwałość danych:** Dwie niezależne pule po 10 kopii zapasowych (`kopia-*` oraz `przed-importem-*`/`przed-czyszczeniem-*`), ochrona stanu uszkodzonego `state_corrupt_*` z banerem odzyskiwania.
- **Czystość i18n:** Bramka `npm run check:i18n` blokuje brakujące oraz martwe klucze. Zakaz polskich słów na ekranach w języku angielskim (`tests/i18n-no-polish-in-en.test.tsx`).
- **Czystość marek:** Zakaz używania znaków towarowych innych firm (`tests/brands.contract.test.ts`).

## 3. Komenda Weryfikacyjna
Przed każdym zatwierdzeniem zmian:
```bash
npm run verify
```
Narzędzie `npm run verify` wykonuje pełny łańcuch:
1. `npm run typecheck`
2. `npm run check:i18n`
3. `npm run check:licenses`
4. `node scripts/test-matrix.mjs --check`
5. `node scripts/verify-native.mjs`
6. `npm run test:coverage`
