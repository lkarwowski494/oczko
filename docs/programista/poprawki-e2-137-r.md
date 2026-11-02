# Poprawki E2 #137 — sesja R (08, tryb fix): E2-137-A3, E2-137-A4

Gałąź `claude/kopia-poprawki-r-2026-11-02` (baza 52d29f8 = integracja 5). Polecenie: `oczko-warsztat` cbbe090 `koordynacja/role-2026-11-01/08-poprawki-e2-137.md`, sekcja R. Stan na 2026-11-02.

## Wynik w skrócie
Przyczyny żadnego z dwóch objawów **nie ustalono** (obie poprawki to widoczny błąd + pomiar, nie naprawa przyczyny). Hipoteza 07 „kopia przed usunięciem trzyma kolejkę bazy” **nie odtwarza się** na prawdziwym SQLite.

| ID | Klasa | Commit | Test | Przed → po |
|---|---|---|---|---|
| E2-137-A3 | D (ścieżka utraty danych, bramka) | 2fec3ca | `tests/dane/usun-wszystko-import-kolejka.test.ts` (1), `tests/ekrany/ustawienia-import-wyjatek.test.tsx` (3), `tests/ekrany/e2e-pomiar-operacji.test.tsx` (5) | kolejka: **zielony przed zmianą** (nie ma czego naprawiać); wyjątek importu 3/3 czerwone → zielone; panel 4/5 czerwone na stubie → zielone |
| E2-137-A4 | D, brzegowy (informacyjny) | 95dc745 | `tests/ekrany/projekt-zdjecie-pomiar.test.tsx` (3) | 3/3 czerwone (brak alertu, brak panelu) → zielone |

## A3 — co sprawdzono i co zmieniono
- Test Jest (node:sqlite) odtwarza kolejność z ekranów: eksport → `usunWszystkieDane` (kopia ADR-0028 + usunięcie) → `licznosciBazy` → `importuj` „scal” ×2; po każdym kroku sonda na końcu obu kolejek (adaptera `kolejka()` i `wKolejce` przypadków użycia) kończy się w < 5 s. Zielony na kodzie sprzed zmiany: kolejka nie wisi, `wybierz` (= `import-gotowy`) wywoływane. Liczności po imporcie = przed usunięciem.
- Zmiana kodu: `app/ustawienia.tsx` `importZ` — wyjątek spoza `Wynik` (dotąd odrzucona obietnica, ekran bez stanu = objaw z #137) daje `dane.blad` („That didn’t work. Your data is unchanged.”). Kopie, usuwanie i import (`src/dane`, `src/przypadki-uzycia`) **nietknięte**.
- Panel `e2e-pomiar-operacji` (`src/kompozycja/e2e/pomiar-operacji.tsx`, wpięty w `panele.tsx`): tekst `import N ms` (do `import-gotowy`), `import running` (nic nie wraca), `… (error)`; w menu zdjęć `recode N ms · photo N ms · project N ms`. Poza buildem E2E nie trafia do bundla (ładowanie przez `paneleE2e`, P-238).

## A4
- `app/projekt/[id].tsx` `dodajPlik`: wyjątek zapisu → alert `licznik.blad_zapisu` (klucz istniejący; jego treść mówi o „row” — uwaga dla 04, nie zmieniano); plik tymczasowy usuwany także po wyjątku; `wczytaj()` po udanym zapisie poza `try` (błąd odczytu nie udaje błędu zapisu). Logika zapisu, kolejka i przekodowanie bez zmian.
- Dowodu przyczyny braku miniatury nie ma → bez dalszej zmiany kodu (polecenie).

## Otwarte (nie rozstrzygnięte, bez zgadywania)
1. **[DO USTALENIA]** Czy `import-gotowy` w scen. 08 istniał, ale poza ekranem (wynik renderowany pod „Delete all data”, `wynikDanych` na dole `Ustawienia`; po ADR-0029 ekran dłuższy — jak w E2-136-S3 dla eksportu)? Zrzut `08-krok67` kończy się tuż pod „Delete all data”. Dowodu w hierarchii nie widziałem (artefakty nie w repo); rozstrzygnie `scrollUntilVisible` w scenariuszu albo odczyt panelu `e2e-pomiar-operacji` w przebiegu 4 (liczba „import N ms” = import-gotowy się pojawił). To zmiana scenariusza → 07.
2. `e2e/README.md` (tabela testID) nie ma wiersza `e2e-pomiar-operacji` — polecenie zabrania ruszać `e2e/`; do dopisania przez 07 razem z odczytem panelu w scen. 08 i 17.
3. Okno „usunięcie + natychmiastowy import” (stuknięcie przed końcem usuwania) jest nieuporządkowane między kolejką adaptera a kolejką przypadków użycia (odczyt `licznosciBazy` nie czeka na usunięcie); w UI nieosiągalne (import wymaga arkusza i wyboru po zakończeniu usuwania), brzegowe — bez zmiany.

## Weryfikacja
`env -u NODE_PATH npm run verify`: kod 0; 344 zestawy, 3336 testów (baza koordynatora 340/3324: +4 pliki, +12 testów). `docs/jakosc/e4/tabela-08.md` zregenerowana. Przegląd ścieżki wrażliwej (import): subagent na samym diffie — „brak uwag”.
