# Testy akceptacyjne przed kodem (rola 07, E3)
- Jeden test na kryterium; ID kryterium w nazwie testu (`BR-LIC-001/S2`, `KP-12`, `NFR-PIE-001`, `RD-16-W3`, `R-018`, `P-089`).
- Testy piszemy wobec portów i sygnatur (`src/domena/**`, `src/przypadki-uzycia/**`, `src/dane/**`, `src/ekrany/**`). Zaślepka rzuca `NIEZAIMPLEMENTOWANE: <ID>` (`src/domena/zaslepka.ts`).
- Czerwień tylko z właściwego powodu: znacznik albo asercja; nigdy import, składnia, typ. Sprawdza: `npm run test:akceptacja` (raport `docs/jakosc/e3/akceptacja-wynik.md`).
- Wyrocznia z innego źródła niż kod: wektor (BRD `tests/wektory/brd.json`, `docs/monetyzacja/wektory-*.json`, `docs/tresci/wektory.json`, `docs/architektura/eksperymenty/e1/scal-wektory.json`), własność, rachunek innym narzędziem albo decyzja z ID w komentarzu.
- Zasady: `docs/jakosc/strategia.md` §3 „Zasady pisania testów”. Rola 08 przenosi test do głównego zestawu (`tests/domena`, `tests/dane`, `tests/ekrany`) w commicie, który go zazielenia.
