# E1 Rejestr ryzyk i wyrocznie (rola 07-jakosc, build) · 2026-10-25 · STOP E1
Wejście: E0 przyjęte (P-090). Metoda: cztery niezależne soczewki (subagenty bez wglądu w siebie): użytkownik tracący dane albo dostający błędną informację, programista zmieniający kod jutro, właściciel wydający bez cofnięcia, sceptyk szukający testu, który nie może paść; scalenie bez duplikatów z tabelą pokrycia 238/238 ID.

## Wynik
- Rejestr: [`e1-ryzyka.md`](e1-ryzyka.md) — **185 ryzyk** w 16 przepływach; priorytet: wysokie 129, średnie 45, niskie 11. Skutek × prawdopodobieństwo: S1 realny 36, S1 brzegowy 46, S1 teoretyczny (dane) 2; S2 realny 45, S2 brzegowy 37; S3 realny 8, S3 brzegowy 11.
- Każdy wiersz: sposób awarii, skutek, prawdopodobieństwo, wyrocznia z typem i źródłem (albo `[DO USTALENIA]` → zgłoszenie), najtańszy poziom testu, miejsce uruchomienia (Linux CI 150, macOS CI 63, telefon P-090 8, „Nie sprawdzono” 5), BR/kryterium, status (E3: test 66, E3: kontrola 34, wymaga zgłoszenia 105, po 08 13, ryzyko szczątkowe 8).
- Soczewki z pełnymi tabelami: [`e1/soczewki/`](e1/soczewki/). Zgłoszenia: [`e1/zgloszenia-e1.md`](e1/zgloszenia-e1.md) (ER-37–ER-44 do 01 — dopisane do `docs/brd/errata.md`; Z07-07–Z07-21 do 02, 04, 05, 10, 12), indeks w [`zgloszenia.md`](zgloszenia.md).

## Sprawdzone przez rolę 07 (nie tylko soczewki)
| Teza | Komenda / miejsce | Wynik |
|---|---|---|
| wektory limitu, dostępu i scalania nie zabijają 7 z 18 mutantów | `node docs/jakosc/narzedzia/mutanty-e1.mjs <kopie>` (użycie w nagłówku pliku) | PRZEŻYŁ: `limit.mjs` granica 60 min i „ostatni darmowy” u Pro; `dostep.mjs` `>`→`>=` (×2), `Math.max`→`Math.min`; `scal.mjs` bez sortowania głów, ostatni rodzic zamiast pierwszego |
| 3 stuknięcia z ekranu blokady z tym samym rodzicem (ADR-0008:11) | prototyp `docs/architektura/eksperymenty/e1/scal.mjs` | `konflikt`, kandydaci 23/23/23 zamiast zgodnego 25 (S1) |
| `scal` na długim liczniku | ten sam prototyp, łańcuch n zdarzeń | 5 000 → 5000; 10 000 → „Maximum call stack size exceeded” (S1) |
| RD-16 bez zimy i przejść czasu | `tests/wektory/brd.json` RD-16-W1–W6 | czerwiec 2023 i 22.10.2026: wszystkie w czasie letnim |
| strażnik limitu a rodzaje zdarzeń | `limit.mjs:13` vs `docs/architektura/stany.json:6` | `cofniecie`, `rozstrzygniecie` rzucają wyjątek bez mapowania (`moduly.md:77`, bez testu) |
| CloudKit Production | developer.apple.com/documentation/cloudkit/deploying-an-icloud-container-s-schema (odczyt 2026-10-25, surowy tekst) | „Apps in the App Store can access only the production environment”; żaden dokument 05/10/12 nie opisuje wdrożenia schematu |
| odwołania do Treningu w pytaniach | `trening` @928d0ff: `docs/32-wzorce-interakcji.md:57`, `docs/39-lista-kontrolna-wydania.md:40–50`, `CLAUDE.md:60–68` | zgodne z cytatami |

## Najważniejsze (wysokie, S1)
- Ekran blokady i zegarek: fałszywy konflikt przy kilku stuknięciach, brak złotego pliku dziennika i stanu TS↔Swift, brak danych limitu w stanie Live Activity (R-018 i sąsiednie; Z07-11, Z07-12).
- `scal`: stos, gubienie gałęzi przy dwóch rodzicach, ciche „zgodny” przy złych danych (R-036; Z07-13).
- iCloud: schemat Production, kolejność dostarczeń wobec kluczy obcych, partia zablokowana jedną złą pozycją (R-051; Z07-14).
- Migracje i start: kontrola schematu sprawdza dokument zamiast runnera aplikacji; brak blokady zmian w wydanych migracjach (Z07-15).
- Wydanie: kontrole na `prebuild` zamiast na podpisanym `.ipa`; strażnik sztucznego sklepu w buildzie wydania (P-089); test aktualizacji tylko w Node (Z07-19, Z07-20).
- Siła testów: strażnicy obchodzeni pisownią i zieloni na pustym wejściu; nic z nowych kontroli nie jest w `npm run verify` ani w CI na gałęzi roboczej.

## Pytania do koordynatora (P-087)
Pełne opcje, kompromisy i odwołania do Treningu: [`e1/pytania-e1.md`](e1/pytania-e1.md). Rekomendacje: 1 (b) schemat CloudKit: CI wgrywa Development, właściciel wdraża Production; 2 (a) lista P-090 + aktualizacja z poprzedniego buildu, start nad 0.1.0, rekord telefon → iPad; 3 (a) „Cofnij” tylko ostatnia zmiana / seria na końcu (Trening); 4 (b) RD-17 per źródło po czasie zdarzenia; 5 (a) najnowszy Xcode 26 + tygodniowy build (Trening); 6 (a) import „scal” po UUID (Trening DA-06); 7 (b) „Undo” z banera serii zwraca dzień limitu (Trening: anulowany nie zużywa dnia); 8 (b) iPad: `plutil` w bramce, pakiet nocą; 9 (a) bramka = pakiet podstawowy, pełny katalog nocą (Trening), bez ponowień scenariuszy z asercją wartości; 10 (a) ponowienie przy braku `macos-26` ręczne (Trening); **11 (a) sesja fix roli 05 razem z 01 i 02 przed rolą 08.**

## Dalej
E2 (plan testów): poziomy według rejestru, narzędzia i progi jako decyzje, dane testowe, CI z kosztem i limitami czasu, definicja ukończenia, lista „tylko telefon” P-090, mapa kontroli 05 (13), 12 i 09. Agent ok. 1–1,5 h.
