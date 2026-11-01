# Rola 08 (programista), fix, partia 8c: projekt i dni
Plik stanu sesji · start 2026-11-01 · gałąź kopii `claude/kopia-partia-8c-2026-11-01` (z roboczej 8063d98) · polecenie: `oczko-warsztat` `koordynacja/role-2026-11-01/08-partia-8c.md` (6760d7c) · zakres: 07-jakosc-001, 010, 018, 027, 028, 031-projekt · decyzje P-326, P-330 (001 wariant B).
Baza: `env -u NODE_PATH npx jest --ci` na 8063d98 = 239 zestawów, 2655 testów, kod 0.

## Stan ID
| ID | Status | Commit | Test (czerwony przed → zielony po) |
|---|---|---|---|
| 028 | zrobione | 2cf7b57 | `tests/ekrany/projekty-trasa.test.tsx` „dwie części…”: otwierał `l0`, po poprawce `l1` (trasa `app/projekty.tsx`, prawdziwa baza) |
| 031 F-50 | zrobione | 4188a6f | tamże „Left sleeve · row 3 of 96” |
| 027 | zrobione | 107cf59 | tamże, 2 testy „Finished Nov 11 · 1 h 30 min” / bez czasu / z rokiem |
| 031 F-08, F-46 | zrobione | 24e208c | `tests/ekrany/projekt-drobne-8c.test.tsx` (baza → model → kompozycja → ekran) |
| 010 | zrobione | 4f1a6f7 | `tests/ekrany/projekt-miejsce-wzoru.test.tsx`: baza → model → kompozycja → ekran, „Pattern: Page 3, row 48”, po +1 „row 49”; bez znacznika brak wiersza |
| 018 | zrobione | c21cdf8 | `tests/ekrany/historia-ukonczenia.test.tsx` (trasa `app/dni.tsx`): „Finished: Sweter”; martwy `src/ekrany/Dni.tsx` usunięty razem z 2 testami (asercje o braku serii i „0 h” przeniesione do testu trasy) |
| 001 | do zrobienia (największe: wiersz „Yarn”, arkusz wyboru, linia „Choose yarn”, „Edit stash” na karcie) | — | — |
Generator: `docs/jakosc/e4/tabela-08.md` zregenerowany osobnym commitem (po każdym nowym teście trzeba powtórzyć: `node docs/jakosc/narzedzia/tabela-08.mjs --wynik docs/jakosc/e4/tabela-08.md`; przy scalaniu z 8a/8b koordynator regeneruje).

## Decyzje i uwagi wykonawcy (do przeglądu koordynatora)
- F-50: `n` w „row {n} of {cel}” = liczba widoczna na liczniku (wartość), zgodnie z makietą „row 47 of 96”; do tej pory lista pokazywała wartość + 1 w „Now knitting row n”. [DO USTALENIA 04/koordynator, jeśli ma być wartość + 1.] Projekt roboczy (bez nazwy części) zostaje przy „Now knitting row n”.
- F-08: dopisek „Goal reached” gdy rzędy ≥ cel (nie tylko równo).
- F-46: poprawka dotknęła `src/kompozycja/licznik.ts` (jedna linia) i typu `calosc` w `LicznikTypy.ts`/`Licznik.tsx` — obszar 8b; konflikt przy scaleniu możliwy, ale minimalny.
- Klucze en: nałożone tylko `projekty.ukonczono_*` (z `klucze.json`; skrypt filtrujący po regexie, kolizja z inną treścią = błąd). Pseudolokalizacja `en-XA.json` zregenerowana (`npm run i18n:pseudo`).
- F-35 i F-09, F-32, F-63 z 031 nie należą do 8c (F-35 zamknięte D2; F-09 → 8b; F-32, F-63 → 8a).
- 010: nowy tekst roboczy `projekt.miejsce_wzoru_wartosc` = „Page {{strona}}, row {{rzad}}” (brak w `klucze.json` 04) — do akceptacji 04 i do fali tłumaczeń po audycie (P-320). Wzór: ostatnio oglądany (`ostatnie_miejsce.wzor`), inaczej pierwszy ze znacznikiem; rząd przed schematem = brak wiersza.
- 018: dzień ukończenia z `ukonczono_dzien`; linia `dni.ukonczone` (istniejący klucz) pod projektami dnia. `stanHistorii` dostał opcjonalne `terazMs`/`strefa` (etykieta robocza projektu bez nazwy).
