# FX5 — stan (08 fix: BX-005, 006, 007, 024, 029; PU-011, 333)

Sesja FX5, gałąź `claude/fx5-poprawki-2026-11-16` od 373a3123. Koordynator: session_01T66VBw2SfKb9bVmf3phpgK. Polecenie: `origin/koordynacja:docs/koordynacja/polecenia/FX5.md` @ b34f9f5e.

## Zadanie 1 — diagnoza rozbieżności opis PU ↔ kod (bez zmian w kodzie i w katalogu)

| BX / PU | Źródło prawdy (plik:linia) | Co robi kod | Werdykt |
|---|---|---|---|
| BX-005 / PU-290 | Nagłówek menu wzorów „Patterns in {{projekt}}” (`wzor.przelacz_naglowek`): `docs/design/archiwum/2026-11-08-kreski/design-spec.md:671` („menu `wzor.przelacz_naglowek` z listą wzorów projektu”), `:958` (decyzja 11 „**A**, potwierdzone”), `:729` (klucz); makieta `docs/design/fix7-2026-10-26/wzor.html:387` („Patterns in Harbor Sweater”); aneks potwierdzony testem `tests/narzedzia/klucze-fix12-poprawki-k.test.ts:32`. Aktualny `docs/design/design-spec.md` (Dzianina) menu wzorów nie opisuje i niczego nie cofa (`:98` tylko mówi o liście otwieranej ▾). | `MenuWzorow` (`src/ekrany/WzorMenu.tsx:30`) renderuje wiersze wzorów i oczekujące, bez nagłówka; `grep przelacz_naglowek src app` → 0 trafień poza słownikami; `StanPrzegladarki` nie niesie nazwy projektu. Znane od 3-F: `docs/programista/poprawki-3-f.md:27`. Test `tests/ekrany/pu-wzor-przelacz-290.test.tsx:58` ma komentarz „nie jest renderowany”. | **(a)** specyfikacja = opis PU, kod odbiega → wada aplikacji (brzegowa, S3). Poprawka mała (pole `projekt` w stanie + `Text` w `MenuWzorow`) — zadanie 3. |
| BX-006 / PU-291 | Migawka dla rozszerzenia „Udostępnij do Oczka” niesie „id, nazwa, ostatnia praca, czy ma wzór”: `docs/design/fix7-2026-10-26.md:36` (R1a); typ `ProjektMigawki` `src/domena/porty.ts:56` (`wzory: number`, nie nazwy); arkusz pokazuje tylko „{{projekt}} already has a pattern” (`udostepnij.kolejny`, `src/i18n/slowniki/en.json:932`). Nazw wzorów nie ma w migawce ani w żadnym wymaganiu rozszerzenia (BR-WZR-007, `docs/brd/wymagania-projekt.md:330-350`: cztery scenariusze, żaden o nazwach wzorów w arkuszu; `docs/brd/odkrywanie.md:210`: rozszerzenie tylko kopiuje plik do skrzynki, import tworzy nowy wzór). | `odswiezMigawke` (`src/przypadki-uzycia/migawka.ts:17-20`) liczy wzory (`count(*)`), nazw nie zapisuje — zgodnie ze specyfikacją. | **(b)** specyfikacja = kod, opis PU błędny. **Katalogu nie zmieniam** (zasada 22, wymaga słów właściciela). Proponowana treść „Oczekiwanego wyniku”: patrz niżej. |
| BX-007 / PU-044 | `docs/scope-contract.md:9` („karta „Kontynuuj” na „Dziś” pokazuje tylko licznik, część, cel części i +1”; na „Dziś” „tylko to, co wybrał właściciel”: karta, pasek tygodnia, „co dalej”, kafle, wolne dni); `docs/brd/wymagania-dni.md:146-150` (BR-DNI-006: „jako kolejność listy projektów, nie osobny ekran”, „przy projektach z terminem widać cel na dziś” — na liście projektów); `docs/design/testid.md:12` (linia 2 wiersza „w toku” przy terminie: `projekty.dzis_*`). | Linia „Do …, dziś 0 z N rzędów” jest na ekranie projektu (`src/ekrany/Projekt.tsx:138`, `projekt-linia-terminu`), cel dnia w wierszu listy (`projekty.dzis_*`, en: „Today: {{zrobione}} of {{count}} rows”, `src/i18n/slowniki/en.json:208-209`); karta „Dziś” (`src/ekrany/Dzis.tsx:111-117`) celu dnia nie pokazuje. | **(b)** specyfikacja = kod, opis PU błędny (karta „Dziś” nie ma pokazywać celu dnia). **Katalogu nie zmieniam.** Proponowana treść niżej. |

### Proponowane treści „Oczekiwanego wyniku” (do decyzji właściciela, zasada 22)

- **PU-291** (zamiast „… ta sama nazwa w grupie „Wzory” projektu i w kroku „Udostępnij” (migawka); …”): „Tytuł paska „Sleeve chart” i ta sama nazwa w grupie „Wzory” ⟦Patterns⟧ projektu; migawka dla „Udostępnij” niesie tylko liczbę wzorów projektu (arkusz mówi „already has a pattern”, nie wymienia nazw); pusta nazwa nie zmienia nazwy.” Kolumna „Test”: bez zmian (scenariusz sprawdza tytuł i `projekt-wzor`).
- **PU-044** (zamiast „Na karcie „Dziś” „Do …, dziś 0 z N rzędów”; …”): „Na liście „Projekty” w wierszu projektu z terminem cel dnia („Today: 0 of N rows” ⟦Dziś: 0 z N rzędów⟧) , a na ekranie projektu „Do …, dziś 0 z N rzędów” ⟦Done by …, today 0 of N rows⟧; karta „Dziś” celu dnia nie pokazuje (scope-contract:9); w sekcji „W toku” projekt z terminem nad projektami bez terminu.” Kolumna „Droga”: „Po ustawieniu terminu → „Projekty” (wiersz projektu) → projekt.” Kolumna „Ekran”: `(zakladki)/projekty`, `projekt/[id]`.
  Uwaga: dokładny tekst en/pl wiersza listy i linii na ekranie projektu do potwierdzenia przez sesję BX przy pisaniu scenariusza (`projekty.dzis_*` vs. `projekt.*`); tu podany z `en.json:208`.

## Pozostałe zadania

(uzupełniane po wykonaniu)

## Decyzje do przeniesienia

(brak)
