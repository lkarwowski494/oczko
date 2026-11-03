# Treści i wiedza domenowa (rola 06): przekazanie
Stan: 2026-10-23, build E3 zakończony (przegląd zastępczy D-027). Rejestr twierdzeń, kopie źródeł i teksty robocze są w prywatnym `oczko-warsztat/06-tresci/2026-10-22-build/` (P-006, P-010); tutaj tylko to, na co pozwala `CLAUDE.md`.

## Pliki
| Plik | Dla kogo | Co to jest |
|---|---|---|
| `parametry.json` | 05, 08 | wartości do modułu konfiguracji (`moduly.md`, „Liczby obliczeń F-38, tabela drutów RD-11 [DO USTALENIA]”): przeliczniki (cal, jard, funt, uncja, 4 in), 8 kategorii grubości z zakresami próbki na 4 in, tabela drutów (29 wierszy) i zwykłych szydełek (28), metoda zaokrąglania (P-084), linia źródła CYC; każda pozycja z ID twierdzenia |
| `wektory.json` | 07 | 175 wektorów z ID twierdzeń: klasyfikacja na 4 in (granice, połówki, błędy), z 10 cm (P3a + P-084), jednostki (tolerancja 1e-9), druty i szydełka (każdy wiersz + rozmiar spoza tabeli) |
| `nazwy-zrodel.json` | 08, 09, 10 | nazwy źródeł dozwolone tylko na ekranie Ustawienia → „Źródła wiedzy” (P-085); strażnik `scripts/sprawdz-nazwy-zrodel.mjs`, test `tests/tresci/nazwy-zrodel.test.ts` |
| `kanon-en.json` | 07, 08, 09 | migawka kanonu en (bloki, klucze `en.json`, zdania bez znaczników) z mapą bloków; generuje `oczko-warsztat` `narzedzia/kanon-vs-slownik.mjs --zapisz` (ten sam skrypt bez `--zapisz` jest czerwony, gdy kanon zmieniono bez nowej migawki); test `tests/tresci/kanon-en.test.ts`: każde zdanie kanonu stoi w kluczach en według mapy (M1-audytor-generalny-037) |

## Reguły dla kodu (08) i testów (07)
- Klasyfikacja grubości: próbkę na 4 in (wpisaną albo z 10 cm × 10,16/10, bez zaokrąglania przelicznika) zaokrągla się do najbliższej całości i porównuje z zakresami włącznymi; dokładna połówka: część wspólna wyników obu całości, inaczej „między kategoriami” albo „powyżej tabeli”; ≤ 0 to błąd danych (P-084). Zaokrąglenie do 0 daje kategorię 7 („6 or fewer” obejmuje 0; wektory `KL4-0_3`, `KL4-0_5`).
- Rozmiar w mm → oznaczenie US tylko z tabeli; rozmiar spoza tabeli albo wiersz bez US daje „brak”, bez najbliższej wartości (RD-11). Tabela szydełek to szydełka zwykłe; stalowe CYC ma osobno (poza W1).
- Liczby tylko z `parametry.json` (jedna wartość jednej wielkości; zmiana wymaga zmiany rejestru roli 06).
- Strony CYC w innych językach to przekłady oryginału angielskiego: liczby bierzemy tylko z angielskiego. Strona hiszpańska w kategorii 6 podaje „5 a 11” oczek i „8 mm y mas”, angielska i francuska 7–11 i 8–12,75 mm; obowiązuje 7–11 także w es (rejestr `GRB-R06`, odczyt 2026-11-03). Ze strony hiszpańskiej pochodzą tylko nazwy kategorii es (P-303); przegląd es nie „poprawia” zakresu na 5.

## Teksty (09 przenosi do słowników, 04 ustala miejsce i brzmienie interfejsu)
Kanon angielski ze znacznikami `[T:ID]`: `oczko-warsztat/06-tresci/2026-10-22-build/tresci/en/` (`stale.md`, `szablony.md`, `zrodla-wiedzy.md` — od 2026-11-03 zawężony do P-112 (2): zdanie ogólne i linia CYC; mapa bloków na klucze `mapa-kluczy.json`, kopia w `kanon-en.json`); zestaw do przekładu `przeklad/zestaw-2026-10-23.json` (przekład po 08 i audycie 04, za zgodą właściciela na kosztorys, P-085). Znaczniki zdejmuje budowanie słowników; sens zmienia tylko 06.

Warunki wyświetlania (dla 04 i 08):
- `calc.note.lace` zawsze razem z wynikiem kategorii 0 i z wynikiem powyżej tabeli;
- `calc.note.rounding` tylko, gdy próbka na 4 in nie jest całością i nie jest dokładną połówką; obok wartość dokładna (P-084);
- `size.note.mm` przy każdym rozmiarze z oznaczeniem US (P-086 Q1a);
- `calc.note.four_inches` przy próbce na 4 in albo przeliczonej z 10 cm (wiersz wartości na 4 in przy próbce z 10 cm; bez kategorii — np. projekt szydełkowy — nic nie jest przeliczane, więc bez uwagi);
- `calc.note.category` (zastrzeżenie + zalecenie blokowania, PRB-002, PRB-005) przy każdym wyniku kategorii; zdanie o blokowaniu jest tym samym tekstem co `calc.note.stitches`, więc przy widocznym wyniku oczek stoi raz, w jego bloku (M1-audytor-generalny-037);
- linia źródła CYC tylko na ekranie „Źródła wiedzy”, dosłownie, bez tłumaczenia (P-085).
- wynik kategorii grubości tylko dla próbki z drutów: zakresy `GRB-Z*` to wiersz drutowy CYC, a szydełko ma w CYC osobne zakresy (P-304 (3)); w projekcie szydełkowym i w kalkulatorze bez projektu po wyborze „Hook” kategorii nie ma (DEC-06 a, M1-audytor-generalny-066).

## Zmiana treści później
Każda zmiana zdania z twierdzeniem krytycznym (28, lista w rejestrze) unieważnia przegląd (skrót zdań) i wymaga ponownej weryfikacji roli 06; błąd w wydanej treści zgłasza się też roli 12.
