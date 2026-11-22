# Poprawki P2, sesja K (rola 08, tryb fix; 2026-11-02, P-368, P-371)

Gałąź: `claude/kopia-poprawki-k-2026-11-02` (kopia integracji 5, 52d29f8). Polecenie: `oczko-warsztat` c3b0e80 `koordynacja/role-2026-11-01/08-poprawki-p2.md` (prompt roli przeczytany w całości). Zakres: P2-7, P2-8 z „Aneksu P2” roli 04 (`docs/design/design-spec.md`, klucze `docs/design/fix12-2026-11-02/klucze.json`). Na roboczą nie pushowano. P-315: pytań do właściciela nie było; do koordynatora jedno (niżej, kolizja nazwy klucza).

## E0
- Linux (kontener), brak Xcode i symulatora: wyglądu na urządzeniu ani zrzutów „przed/po” nie ma (zmiany widoczne tylko tekstem; SP-13 przez 07 po przebiegu). `npm ci` kod 0.
- Klasyfikacja: P2-7 D (tekst o rzędzie w Ustawieniach i formularzach to błąd treści), P2-8 D (VoiceOver czyta znaki zamiast zdania). Decyzje produktowe już podjęte w Aneksie P2 (wariant C i B); jedyna rozbieżność to nazwa klucza (P2-8).

## P2-7 błąd zapisu poza licznikiem i wzorem
| Commit | Co |
|---|---|
| e8bf559 | Klucze: `ustawienia.blad_zapisu` „Couldn’t save this setting”, `formularz.blad_zapisu` „Couldn’t save your changes”, `wspolne.blad_zapisu_opis`; `wzor.blad_czas_opis` w nowej kolejności zdań (PDF, potem ponowienie). Kontekst, lista oczekujących (P-357), en-XA. Test `tests/narzedzia/klucze-fix12-poprawki-k.test.ts` czerwony 4/5 → zielony; oczekiwanie w `tests/ekrany/wzor-dodawanie.test.ts` dopasowane do nowej treści (zmiana spec). |
| 04aa471 | Podłączenie: Ustawienia i Units — `Alert.alert(...alertBleduZapisu(t, 'ustawienia'))` (`src/ekrany/blad-zapisu.ts`; `app/ustawienia.tsx`, `app/miary.tsx`); formularze — `KomunikatZapisu` (`src/ekrany/Arkusz.tsx`) w `Zapas.tsx`, `FormularzeProjektu.tsx`, `Formularze.tsx`; alerty zdjęć, ukończenia, konfliktu iCloud, włóczki, projektu — `alertBleduZapisu(t, 'formularz')`. Test `tests/ekrany/blad-zapisu-poza-licznikiem.test.tsx` (grep: `licznik.blad_zapisu` tylko w `Licznik.tsx` i `WzorPrzegladarka.tsx` + 2 testy RNTL formularzy) i K-04g w `preferencje-trasa.test.tsx` — czerwone 4/8 → zielone. |

Wszystkie wystąpienia (grep `licznik.blad_zapisu` w `src/` i `app/`): było 10 plików poza licznikiem i wzorem (Ustawienia, Units, Zapas ×2, FormularzeProjektu ×8, Formularze, ukonczenie, zdjecie, konflikt, projekt/[id] ×3, wloczka ×2); po zmianie zostają `Licznik.tsx` i pasek licznika pod wzorem `WzorPrzegladarka.tsx:211` (Aneks: „licznik i wzór zostają przy swoich kluczach”). `WzorNotatki.tsx:18` ma tylko komentarz.

Decyzje wykonawcze (do weta koordynatora):
- Formularze pokazują błąd **w arkuszu** (dwie linie, rola `alert`), nie natywnym `Alert`: dotychczasowy mechanizm (`useZapis`) już zostawia arkusz otwarty z wpisanymi wartościami, zgodnie z kontekstem `formularz.blad_zapisu` w klucze.json. Natywny `Alert` był tylko tam, gdzie był wcześniej (Ustawienia, Units, zdjęcia, konflikt, ukończenie).
- Alerty poza Ustawieniami (zdjęcia, ukończenie, konflikt iCloud, włóczka) dostały tytuł `formularz.blad_zapisu` (najbliższy ogólny; 04 nie podało osobnych).
- Haptyka `bladZapisu` poza licznikiem nie podłączona (te ekrany nie mają wstrzykniętej haptyki); nie robiłem po drodze.

## P2-8 etykieta wpisu historii
| Commit | Co |
|---|---|
| 6aa59ad | Klucz `historia.wpis_a11y` „{{od}} to {{do}} at {{czas}}”; `accessibilityLabel` wiersza w `src/ekrany/Historia.tsx` = zdanie (cofnięty: zdanie + „Undone”), `{{wpis}}` w `historia.wpis_rozwin_a11y` = to samo zdanie; widoczny tekst bez zmian. `Tresc` dostał opcjonalny prop `etykieta`. Testy: `tests/ekrany/historia-rozwin.test.tsx` (3 nowe + 2 poprawione oczekiwania), klucze — czerwone 8/16 → zielone. |

**Odejście od nazwy z klucze.json (zatwierdzone przez koordynatora, wariant A, P-371):** klucze.json nazywał zdanie `historia.wpis_opis`, ale ten klucz już jest w 35 językach (widoczny wiersz z rodzajem zmiany „{{czas}} · {{z}} → {{na}} ({{opis}})”, `Historia.tsx`); spec mówi, że widoczny tekst zostaje. Nowa nazwa: `historia.wpis_a11y`, stary klucz bez zmian. Nazwa poprawiona też w `docs/design/fix12-2026-11-02/klucze.json` (osobny commit, 2 linie; do wiadomości 04). Odrzucone: B — zmiana nazwy starego klucza na `historia.wpis_rodzaj` w 35 słownikach i przeklad-api (duży diff bez zmiany zachowania).

## Nowe znaleziska (nienaprawione, poza zakresem)
1. Wiersze serii i wpisy z rodzajem zmiany (Reset, Entered, Undone) nadal czytane z widocznego tekstu (znaki „·” i „→”); 04 nie podało dla nich zdania. Realność: brzegowa; dla 04.
2. `{{od}}` i `{{do}}` to liczby bez formatu regionu (jak dotąd w wierszu); kontekst klucza mówi „w zapisie regionu”. Dla małych liczb bez różnicy, powyżej 999 w niektórych językach tak.
3. Natywne alerty z `licznik.blad_zapisu` zniknęły, ale teksty błędu zapisu w innych miejscach (`dane.blad` w Ukonczenie/Formularze:178, `import`/`eksport`) mają własne klucze i nie były w zakresie P2-7.

## Dowody
Wyniki pełnej bramki i liczby testów: wiadomość do koordynatora oraz sekcja poniżej.

`env -u NODE_PATH npm run verify` na ac76947 (+ tabela-08 i ten plik w następnym commicie): **kod 0**, 342 zestawy, 3338 testów (baza koordynatora 52d29f8: 340 zestawów, 3324 testy; +2 zestawy, +14 testów), typecheck i lint w ramach verify, `tabela-08.md` zregenerowana (267 plików testów, błędów 0). Pierwszy przebieg verify miał 1 czerwony test (D1 przypina kontekst `historia.wpis_rozwin_a11y` do klucze.json fix11) — kontekst przywrócony (ac76947), nie test. Zrzutów „przed/po” brak (Linux bez symulatora).

Ścieżki wrażliwe (migracje, kopie, import/eksport, zakupy, workflows): bez zmian, przegląd subagentem nie dotyczy.
