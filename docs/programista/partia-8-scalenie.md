# Partia 8 — scalenie kopii 8a, 8b, 8c (rola 08, tryb fix, 2026-11-01)

Gałąź: `claude/kopia-partia-8-scalona-2026-11-01` (z `claude/kopia-partia-8b-2026-11-01` 6acbd4f; scalone: 8a 5987e74, 8c edda6d3). Kopii 8a/8b/8c nie zmieniano. Zatwierdzone ID: `scalenie-8a-8b-8c`, `P-339`.

## Stan
- Scalenie 8a → 65bbc8e; scalenie 8c → ad28ce3; P-339 → b866bf7. `env -u NODE_PATH npm run verify` kod 0 po każdym kroku.
- Liczby testów: 8b = 268 zestawów / 2807 testów po scaleniu 8a; po 8c 277 / 2844; po P-339 277 / 2851.

## E0 (klasyfikacja)
| ID | Rodzaj | Co |
|---|---|---|
| scalenie-8a-8b-8c | D | `git merge --no-ff`, konflikty z zachowaniem obu stron, pliki generowane regenerowane |
| P-339 | D | podpis `stan_danych.kopie_opis` w „Data and sync”, tylko gdy w `Documents/Backup` są kopie Oczka (spec: `design-spec.md` „Kopia w Data and sync”, makieta `stan-danych-kopie`, ADR-0028); nie wymaga wyboru produktowego, bo wygląd i warunek są w specyfikacji 04 |

Środowisko: Linux, Node v22.23.4, bez Xcode i symulatora iOS; testy ekranów w Jest na prawdziwym SQLite (`node:sqlite`) i `expo-file-system` odwzorowanym na Node. Zrzutu ekranu „po” nie zrobiono (brak symulatora); dowód widocznej zmiany to test trasy `/stan-danych` na tekście z `en.json` oraz makieta 04.

## Konflikty i rozwiązania
**Scalenie 8a (jeden konflikt)**
- `docs/jakosc/e4/tabela-08.md` — plik generowany; zregenerowany `node docs/jakosc/narzedzia/tabela-08.mjs --wynik docs/jakosc/e4/tabela-08.md`.
- `en.json`, `en.kontekst.json`, `en-XA.json` scaliły się automatycznie; sprawdzone sumą kluczy (liście) i porównaniem trójstronnym z bazą 605e9f4: 0 konfliktów wartości, 0 brakujących.

**Scalenie 8c (trzy konflikty tekstowe)**
- `app/formularz/[rodzaj].tsx` — importy: 8b (`Alert`, `ListaPrzypomnien`, `miesiac`, `oglos`) razem z 8c (`useFocusEffect`, `FormularzWloczekProjektu`).
- `src/kompozycja/licznik.ts` (`stanEkranu`) — strażniki licznika oczek z 8b (`oczka ? … : …`) razem z F-46 z 8c (`calosc.czesc = null` w projekcie roboczym); typ `calosc` w `LicznikTypy.ts` z 8c (`czesc: string | null`) zostaje.
- `docs/jakosc/e4/tabela-08.md` — regeneracja jak wyżej.
- `en.json`, `en.kontekst.json`, `en-XA.json` — suma kluczy, trójstronne porównanie z bazą 8063d98: 0 konfliktów wartości, 0 brakujących (796 / 731 / 796 kluczy).
- `src/ekrany/Dni.tsx` usunięty przez 8c bez zmian po stronie 8a/8b i bez importów — usunięcie zostaje.

**Niezgodności atrap po scaleniu 8c (testy czerwone, asercje bez zmian)**
Nie jest to sprzeczność wymagań, tylko atrapa jednej partii bez zależności dodanej przez drugą. Dopełniono atrapy, żadnej asercji nie zmieniono ani nie usunięto:
- `tests/ekrany/przypomnienia-trasa.test.tsx`, `wpisanie-sygnal.test.tsx`, `wpisanie-trasa.test.tsx` — atrapa `expo-router` bez `useFocusEffect`, a `app/formularz/[rodzaj].tsx` (07-jakosc-001, 8c) go woła; dodano `useFocusEffect` jak w atrapach 8c.
- `tests/ekrany/projekty-trasa.test.tsx` (8c) — atrapa kontenera bez `dostep`, a `app/projekty.tsx:29` (07-jakosc-022, 8b) woła `kontener.dostep.stan()`; dodano `dostep: { stan: () => ({ poziom: 'darmowy' }) }` (wzorzec z `niezawodnosc-kamien.test.tsx:20`).
- Odrzucona opcja: `kontener.dostep?.` w kodzie produkcyjnym — dopasowywałaby kod do atrapy.

## P-339
- Test czerwony przed kodem (zaślepka `false`): `tests/niezawodnosc/kopie.test.ts` (czysta funkcja i adapter na prawdziwym katalogu), `tests/ekrany/stan-danych-trasa.test.tsx` (4 przypadki trasy).
- Kod: `czySaKopiePrzed` i `saKopiePrzed` w `src/niezawodnosc/kopie.ts` (tylko odczyt listy; nazwy wg reguły ADR-0028; brak katalogu lub błąd odczytu = bez podpisu), prop `kopie` w `StanDanych` (obie gałęzie: z iCloud i bez), trasa `app/stan-danych.tsx` odświeża stan przy fokusie.
- Bez liczb i rozmiarów (design-spec, P-328).

## Otwarte / do koordynatora
- Zrzut „po” dla P-339: brak symulatora iOS w tym środowisku; do obejrzenia na urządzeniu właściciela (zawęzona lista testów).
- Przegląd subagenta dla P-339 (ścieżka wrażliwa `kopie.ts`, tylko diff b866bf7 i zasady 10–14): „brak uwag” (odbyty).
