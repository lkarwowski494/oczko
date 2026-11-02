# Poprawki po raporcie E2 #135, sesja B (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-b-2026-11-02` (baza `claude/kopia-integracja-2026-11-02` c649f78). Polecenie: `oczko-warsztat` 50ff573 `koordynacja/role-2026-11-01/08-poprawki-e2.md`, sekcja B. Raport źródłowy: `oczko-warsztat` `07-jakosc/2026-11-02-e2/raport.md` (E2-A1, E2-A2). Na roboczą nie pushowano.

## E0 (środowisko i stan wyjściowy)
- Linux (kontener), Node 22.23.4, brak Xcode/symulatora/Maestro — widoczność przy AX5 i nawigacja natywna sprawdzalne tylko w przebiegu macOS.
- `npm ci` kod 0; `env -u NODE_PATH npm test` na c649f78: **311 zestawów, 3125 testów, kod 0** (zgodne z koordynatorem).
- Klasyfikacja: E2-A1 = **D** (defekt, realny); E2-A2 = **D do potwierdzenia** (nie odtworzono, zob. niżej).

## E2-A1 — naprawione (commit 79b2ffe)
- **Mechanizm:** tytuł arkusza (`Arkusz.tsx`) nie miał `maxFontSizeMultiplier`, więc nazwa projektu („Counter from Nov 10 at 7:30 PM”) rosła ×3,571 przy AX5 i zajmowała ekran; akcje (`menu-wpisz-wartosc`) leżały poza widokiem. Wzorzec P-277/P-287: krój tytułowy najwyżej ×1,8 (`MAX_SKALA_TYTULOWA`).
- **Poprawka:** `maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}` na wszystkich trzech tytułach w `src/ekrany/Arkusz.tsx` (arkusz decyzji z ✕, arkusz decyzji bez ✕, nagłówek arkusza formularza — wspólny kod, więc menu ••• i pozostałe arkusze). Lista akcji już była w przewijanym `ScrollView`, przyciski na dole bez zmian; wygląd bez zmian poza limitem skali (system `docs/design/`, P-277).
- **Test:** `tests/ekrany/menu-ax5.test.tsx` — przed poprawką 2 z 3 czerwone (`maxFontSizeMultiplier` = undefined, oczekiwane 1,8), po poprawce 3/3. Trzeci test (akcja w przewijanym obszarze, „Cancel” poza nim) jest strażnikiem istniejącego układu i był zielony przed poprawką.
- **Ograniczenie dowodu:** RNTL nie liczy układu — nie dowodzi, że akcja jest widoczna na ekranie przy AX5. To potwierdzi scenariusz 30 (krok 24) w przebiegu macOS po scaleniu. Zrzut przed/po: brak (Linux).
- **Wyszukanie po poprawce:** inne tytuły arkuszy w `Arkusz.tsx`: 3/3 objęte. Poza `Arkusz.tsx`: `LicznikArkuszLimitu.tsx:13` (własny tytuł, tekst stały `limit.nie_dodano`) i tytuły ekranów pełnoekranowych (`Projekt.tsx:113` — nazwa projektu użytkownika, `ListaProjektow`, `Kosz` itd.) też bez limitu — **nowe znalezisko do 04/07 (nie naprawiane, poza ID)**: `Projekt.tsx:113` pokazuje nazwę wpisaną przez użytkownika, więc ta sama klasa defektu przy AX5.

## E2-A2 — nie odtworzono; bez naprawy
Kroki scenariusza 34 odtworzone testami na prawdziwym SQLite (node:sqlite) i trasach z atrapą tylko `expo-router`/kontekstu:
1. `tests/ekrany/projekt-po-drugiej-czesci-trasa.test.tsx`: cel 40 → +1 → trasa `/formularz/co-dalej` → „A second Back” (`co-dalej-druga`) → `dismissTo('/')`, `licznik.otworz(nowy)`, `licznik.widok().projektId == 'p1'`, bieżący licznik ≠ stary. **Zielony.**
2. `tests/ekrany/projekt-po-drugiej-czesci-ekran.test.tsx`: ta sama baza (część z celem 40 + część `para_z`) → trasa `/projekt/[id]` (`app/projekt/[id].tsx`) rysuje „Pair of Back”. **Zielony.**
- Sprawdzone wcześniej tym samym ciągiem (usunięty duplikat): `nastepnaCzesc` → `koniec` z `celDrugiej` 40, `dodajCzescPara`, `widokProjektu`, `stanProjektu`, ekran `Projekt` — zielone.
- **Wniosek:** warstwa danych, model odczytu, trasa formularza i trasa projektu działają po „Next part → druga taka sama”. Pusty ekran z #135 (ciemny widok bez elementów, hierarchia: tylko okno „Oczko”) nie wynika z tych warstw. Nieodtworzone zostają: nawigacja natywna po `dismissTo('/')` + `push('/projekt/[id]')` w stosie (`app/formularz/[rodzaj].tsx:56`, `app/index.tsx:85`), przemontowanie licznika (`key={wersja}`, `app/index.tsx:~78`) i wyścig czasowy w symulatorze. Ekran w stanie `w === null` rysuje pusty `View` (`app/projekt/[id].tsx:~62`) — zgodny z objawem, ale nic nie wskazuje, dlaczego `wczytaj()` miałby się nie zakończyć [DO USTALENIA].
- **Klasyfikacja:** realność niepotwierdzona (pewność niska); bez naprawy na ślepo (polecenie, E2-A2). Testy zostają jako strażnicy ścieżki.
- **Propozycje (dla koordynatora, wybór po jego stronie):** (a) ponowić scenariusz 34 w przebiegu macOS po scaleniu — jeśli zielony, A2 był incydentem maszyny/czasu (scenariusze z asercją licznika nie są ponawiane wg P-091, ale to inny scenariusz-informacyjny; decyzja koordynatora); (b) dodać do scenariusza 34 zrzut i `extendedWaitUntil` na `projekt-dodaj` z dłuższym limitem oraz zapis hierarchii, żeby następna porażka dała dowód (zmiana scenariusza = rola 07).

## Weryfikacja
`env -u NODE_PATH npm run verify` (typecheck, typecheck:testy, lint, jakosc:kontrole, npm test) kod 0: **314 zestawów, 3130 testów** (baza 311/3125 + 3 nowe zestawy, 5 nowych testów). `docs/jakosc/e4/tabela-08.md` zregenerowana.

## Uwaga: tożsamość git
Hak końcowy sesji prosi o autora `noreply@anthropic.com`; zgodnie z poleceniem koordynatora commity zostają z `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>` (bez Co-Authored-By i nazw modeli).
