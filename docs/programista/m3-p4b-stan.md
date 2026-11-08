# M3 p4b: stan partii (sekcje kawałków)

Wzorzec stanu: `m3-p7-stan.md`. Wykaz zastąpionych testów: `m3-p4b-zastapione-testy.md`.

## Kawałek A: ekran Projekt (rola 08, build, 2026-11-08)

Źródła: `docs/design/dzianina/fix-makiety-2026-11-08/dowody.md` (zadanie 1), makiety `ekrany.html` (`projekt`, `projekt-menu`, `projekt-edycja`, `projekt-ukonczony`), tokeny `projekt.*`, `miniatura.dzianina`.

**Zrobione** (commity w sekcji „Commity”):
1. Nagłówki grup (Części, Czas, Notatka, Szczegóły; też Zdjęcia i Wzór w ich komponentach): 17 pt / 700 / `tekst` (`typografia.instrukcja`, `projekt.naglowekGrupy`).
2. Miniatura dzianiny w wierszu części: ten sam komponent `Dzianina` co lista Projekty, rozmiar i promień z `miniatura.dzianina`, `gotowe` = rzędy części, `cel` = cel części (bez celu: `null`, jak na liście — okno 96 rzędów bez linii celu); ukryta przed VoiceOver (`accessibilityElementsHidden`, `no-hide-descendants`) i od AX1 w ogóle.
3. Strzałka (`StrzalkaWiersza`) w wierszach części i liczników (wiersze z liczbą sesji i Szczegółów miały lub dostały ją w tym samym kroku).
4. Szczegóły, Czas, daty ukończonego: jeden wiersz „etykieta po lewej, wartość `tekst2` po prawej, strzałka”; od AX1 kolumna (wartość pod etykietą, strzałka przy etykiecie).
5. „+” i ••• w `akcentTekst` (kolor przez istniejącą właściwość `kolor` `PrzyciskSymbolu`; `Pasek.tsx` bez zmian); „Gotowe” `akcentTekst`, 700.
6. Menu „+” i •••: pływająca lista pod paskiem (`position: absolute`, `powierzchnia`, promień `lista`, pozycje ≥ `cele.minimum`), „Usuń projekt…” w `niszczacy`; zachowanie i testID bez zmian.
7. Aliasy `papier`/`grafit`/`olowek`/`papierGrupa`/`blad`/`promien.grupa` w `Projekt.tsx` zastąpione tokenami Dzianiny; znak usunięcia `minus.circle.fill` w `niszczacy`.
8. Zdanie pomocy w edycji (`projekt.edycja_info`) już było i jest pokazywane; bez zmian.
Poza zakresem A, dla spójności testu 6 nagłówków: nagłówek w `WzorGrupa.tsx` i `Zdjecia.tsx` (po jednej linii stylu; **uwaga koordynatora: linia `Zdjecia.tsx` `naglowek` należy też do kawałka Zdjęcie — jeśli tamten ją zmienia, powinna być identyczna: `{ ...typografia.instrukcja, color: k.tekst }`**).

**Testy przed → po** (`tests/ekrany/m3-p4b-projekt.test.tsx`, 23 testy; wyniki z tego uruchomienia):
- Przed kodem: 23 czerwone, z właściwego powodu: asercje wyglądu (`Expected "#8A5A12" Received "#221D1A"` dla „+”/•••; nagłówki: 13 pt/`undefined`/`tekst2`), brakujące elementy (`Unable to find an element with testID: projekt-menu-lista`, `projekt-miniatura`, `projekt-czesc`, `projekt-licznik`), układ (`flexDirection: Expected "row", Received undefined`).
- Po kodzie: `Tests: 23 passed, 23 total`. Zestaw 35 plików dotykających Projekt: 228 zielonych; `npx jest tests/ekrany tests/i18n`: 231 zestawów, 2094 testy zielone.
- Test „znak usunięcia w `niszczacy`” był zielony od początku (alias `blad` = `niszczacy`); zostaje jako zabezpieczenie po usunięciu aliasu.
- `npm run typecheck`, `typecheck:testy`, `lint`: kod 0.
- Zastąpione testy: `m3-p4b-zastapione-testy.md` (2 pliki, wartości nagłówka).

**Nowe testID (dla roli 07):** `projekt-menu-lista` (pływająca lista menu „+” i •••), `projekt-czesc` (wiersz części), `projekt-licznik` (wiersz licznika części), `projekt-licznik-wiersz` (obwiednia wiersza licznika z wcięciem), `projekt-miniatura` (miniatura dzianiny części, ukryta przed VoiceOver). Istniejące testID bez zmian.

**Odstępstwa od makiety i zgłoszenia**
- Do 04: brak tokenów menu „+” i •••: cienia (makieta `0 8 28 #0005`), szerokości (250), wysokości pozycji 48 pt (jest `cele.minimum` 44 pt) i odsunięcia od krawędzi. Zrobiono bez cienia i bez stałej szerokości (lista przy prawej krawędzi, szerokość z treści), zgodnie z regułą „bez tokenu nie wpisuję wartości”.
- Do 04 / koordynatora: „‹ Projekty” w makiecie jest `akcentTekst`; w kodzie `Wstecz` ma domyślnie `tekst` i test `pasek-symbole-033-036` wymaga jednego wyglądu „wstecz” na licznik, projekt i kosz. Nie zmieniano (zmiana domyślnej w `Pasek.tsx` dotyka wszystkich ekranów — osobna decyzja; `Wstecz` ma już właściwość `kolor`).
- Do 09 / decyzji: „Ukończony {data}” pod tytułem ukończonego projektu (makieta `projekt-ukonczony`) nie ma klucza (jest `projekt.data_ukonczenia` „Finished” i grupa dat niżej); nie dodawano klucza. Zdanie pomocy w edycji w makiecie („Usuń część albo licznik znakiem minus. Usunięte trafiają do kosza na 30 dni.”) różni się od istniejącego `projekt.edycja_info` („Deleted parts and counters stay in Recently deleted for 30 days.”) — zostawiono istniejący.
- Kropka włóczki (P-567) nie wdrożona (decyzja P-598 (a)).
- Wiersze Czas/Szczegóły dostały `paddingHorizontal` `odstep.l` (było `odstep.m` ze wszystkich stron), zgodnie z makietą; wartości sumy czasu i liczby sesji z `tekst` na `tekst2` (makieta `.war`).
- Miniatura części bez celu: `cel = null` (okno 96 rzędów, bez linii celu) jak na liście Projekty, nie „puste wypełnienie”; jeśli ma być puste, to zmiana `Dzianina`/kompozycji do uzgodnienia z 04.

**Nie sprawdzono:** urządzenie i zrzuty (brak macOS/Expo web), 320 i 430 pt, AX5 na ekranie (test AX1 przez `fontScale` 1,786), VoiceOver, rzeczywiste położenie menu (`top: '100%'` pod paskiem, `zIndex`) na iOS, kontrast tekstów `akcentTekst` na zrzutach.

### Commity
- `65284d5` [M3 p4b] Projekt: wygląd Dzianiny (kod, testy, zastąpione asercje nagłówka)
