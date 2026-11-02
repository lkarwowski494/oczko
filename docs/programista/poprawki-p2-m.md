# Poprawki P2, sesja M (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-m-2026-11-02` (baza integracja 5, 52d29f8). Polecenie: `oczko-warsztat` c3b0e80 `koordynacja/role-2026-11-01/08-poprawki-p2.md`, sekcja M, przeczytane w całości. Zakres: P2-4, P2-6, trywialne P2-2. Na roboczą nie pushowano. P-315: `docs/fakty-wlasciciela.md` (hak startowy) i repo `trening` (wzorzec 31, S18: wskaźnik przewijania ukryty, `components/Scroll.tsx`) — analogia zastosowana.

## E0 (środowisko i stan wyjściowy)
- Linux (kontener), brak Xcode i symulatora: zrzutów przed/po nie ma; dowód to asercje stylu na prawdziwych tokenach. Co wymaga układu (przycięty wiersz przy AX5) potwierdzi przebieg macOS.
- `npm ci` kod 0. Stan wyjściowy 52d29f8: `env -u NODE_PATH npm test` kod 0 — **340 zestawów, 3324 testy** (zgodnie z koordynatorem).
- Klasyfikacja: wszystkie **D** (zgodność z zatwierdzonym Aneksem P2 roli 04; bez wyboru właściciela).

## Stan
| ID | Rodzaj | Test (czerwony → zielony) | Commit | Wynik |
|---|---|---|---|---|
| P2-4 (a) Narzędzia bez wagi 700 | D | `tests/ekrany/naglowki-p2-4.test.tsx`: waga „700” wobec braku, oba motywy → zielone | 7e52cac | zrobione |
| P2-4 (b) Historia dni: nagłówki jak `.naglowek-grupy` | D | ten sam plik: 17 pt grafit 700 wobec 13 pt olowek bez wagi, odstęp 16 wobec 20; oba motywy → zielone | 7e52cac | zrobione |
| P2-4 (c) nagłówek menu stopera | D (brak odstępstwa) | ten sam plik: **zielony przed i po** — kod już zgodny (krój systemowy `podpis`, olowek, bez wagi; klucz `stoper.menu_naglowek` = „Session started {{godzina}}” w `en.json:589`, zgodny z `klucze.json`). Czułość dowiedziona mutacją (`fontWeight: '700'` w stylu → czerwony), mutacja cofnięta | 7e52cac | bez zmian kodu, strażnik |
| P2-6 lista akcji przy AX5 | D | `tests/ekrany/menu-przewijanie-ax5.test.tsx`: 2 z 4 czerwone (`showsVerticalScrollIndicator` undefined wobec false) → zielone; 2 strażniki zielone przed i po (brak cienia/gradientu/przyciągania; brak `flashScrollIndicators` i `persistentScrollbar` w `src/` i `app/`); strażnik cienia dowiedziony mutacją (`shadowOpacity` na pasku przycisków → czerwony) | 953fca8 | zrobione |
| P2-2 token `promien.przyciskPelny` | D (trywialny) | `tests/ekrany/przycisk-pelny-token.test.tsx`: tokeny podmienione na różne wartości, czerwony (17 wobec 31) → zielony; `przycisk-pelny-promien.test.tsx` (wartość 14) nadal zielony | 2636980 | zrobione; wygląd bez zmian (14 = 14) |

Token `promien.przyciskPelny` = 14 był już w `docs/design/tokeny.json` (dodał 04), więc `tokeny.json` bez zmian.

## Co zmieniono
- **P2-4:** `Narzedzia.tsx` `naglowekGrupy` bez `fontWeight`. `HistoriaDni.tsx`: nagłówek bloku `typografia.drobny` + `olowek` bez wagi, `marginTop: odstep.xl − odstep.l` (przy `gap` kontenera `odstep.l` daje 20 pt nad blokiem, jak `.naglowek-grupy` `margin: 20px`, `sesje-historia.html:75`); bloki tygodnia i miesiąca mają nagłówek nad kartą (jak blok dnia; styl `blok`), zawartość karty bez zmian. Treść nagłówków bez zmian (z kompozycji).
- **P2-6:** `Arkusz.tsx` (`ArkuszDecyzji`, wspólny dla menu ••• i arkuszy decyzji): `showsVerticalScrollIndicator={false}`. Przycięcie ostatniego wiersza wynika z braku wyrównania listy do wiersza (brak `snapTo*`, brak `pagingEnabled`) — tego RNTL nie mierzy.
- **P2-2:** `Arkusz.tsx` `glowny` i `niszczacy` → `promien.przyciskPelny`; komentarz H-1d zastąpiony.
- Wyszukanie po poprawce: `grep promien.przyciskDrugi src` → pozostałe użycia to przyciski z obrysem w rzędzie (Zapas, Ukonczenie, LicznikStyl, WzorZnacznik, WzorPrzegladarka, IcloudKonflikt), niezmienione (poza P2-2).

## Nowe znaleziska (nienaprawione; do 04 / koordynatora)
1. **Spec P2 poz. 9 mówi „nagłówek arkusza najwyżej 2 linie i skala tytułu ×1,6 (E2-A1) zostają”, a kod ma skalę ×1,8 (`MAX_SKALA_TYTULOWA`, `menu-ax5.test.tsx`) i brak `numberOfLines`.** Przy długiej nazwie projektu i AX5 tytuł menu może zająć kilka linii. Realność: brzegowy (AX5 + długa nazwa). Wymaga decyzji 04: 1,6 i 2 linie wobec stanu obecnego.
2. **Wskaźnik przewijania ukryty tylko w arkuszu decyzji.** Pozostałe `ScrollView` w `src/ekrany` go nie ukrywają, a Trening ma to wszędzie (wzorzec 31, S18). Realność: teoretyczny/szlif. Decyzja 04: czy wzorzec obejmuje całą aplikację.
3. **Menu stopera jest widokiem w ekranie, nie menu systemowym** (odstępstwo nazwane R8/P-191); „styl systemu” z poz. 7c spełnia krój i kolor nagłówka, nie sama kontrolka.

## Wynik bramki
`env -u NODE_PATH npm run verify` (typecheck, typecheck:testy, lint, jakosc:kontrole, npm test) kod 0: **343 zestawy, 3336 testów** (baza 340 / 3324; +3 zestawy, +12 testów). `docs/jakosc/e4/tabela-08.md` regenerowana w każdym commicie (269 plików testów, 0 błędów).

## Czas
Praca agenta ok. 45 min. Czekanie: `npm ci`, pełny zestaw (ok. 80 s), `verify`. Czas właściciela: 0.

## Następny krok
Koordynator: scalenie gałęzi M do roboczej; w przebiegu macOS sprawdzić zrzutami: nagłówki „Tools” i „History” (13 pt, bez wagi, odstęp 20 pt), menu ••• przy AX5 (przycięty ostatni wiersz, brak wskaźnika; scenariusz 30), nagłówek menu stopera.
