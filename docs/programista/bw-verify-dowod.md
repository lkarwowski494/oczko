# BW — dowód `npm run verify` (WL-1171-01)

- Gałąź `claude/bw-powrot-2026-11-15`, tip przed tym plikiem: 49ecf365 (baza: a117ded0), 2026-11-15, Linux (bez Xcode/symulatora).
- Stan wyjściowy (przed zmianami): `npx jest --ci` — 609 zestawów, 7449 testów, kod 0.
- Test przed poprawką (na b3975dd1, po commicie strukturalnym): `tests/ekrany/wzor-menu-zrodel-wstecz.test.tsx` — 2 czerwone („Unable to find an element with testID: nav-wstecz”), 1 zielony (kontrola); po poprawce (2590e8f1) 3/3 zielone.
- Pierwszy `npm run verify`: kod 1 — `jakosc:kontrole`: `docs/jakosc/e4/tabela-08.md` nieaktualna po dodaniu testu; naprawione generatorem (cb4d085b).
- Drugi `npm run verify` (typecheck, typecheck:testy, lint, jakosc:kontrole, test): **kod 0**; `Test Suites: 610 passed, 610 total`, `Tests: 7452 passed, 7452 total` (baza +1 zestaw, +3 testy); granice 276 + 35 plików bez naruszeń; brd.json OK (199 wektorów).
- Nie sprawdzono: zachowania na urządzeniu i scenariusza Maestro 21 na symulatorze (Linux); składnię i kolejność pilnują `tests/jakosc/e2e-*` (zielone).
