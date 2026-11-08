# M3 p3a: testy zmienione przy przebudowie licznika (ZM-04, ZM-05, P-580, P-581, P-583, P-585, P-586)

2026-11-08 · rola 08 · gałąź `claude/kopia-08-p3a-2026-11-08` od 014847ea. Zmiany zachowania licznika wynikają z decyzji właściciela (P-563, P-580, P-581, P-586), nie z poprawek pod test. Asercje zachowania (teksty, etykiety VoiceOver, testID, zapis) zostają; zmieniono tylko to, co kodowało wygląd lub układ starego systemu albo miejsce pozycji przeniesionych między ekranami.

## A. Test akceptacyjny 07 przeniesiony do głównego zestawu (zielony)
`tests/akceptacja/ekrany/licznik-to-be.test.tsx` → `tests/ekrany/licznik-to-be.test.tsx` (3 testy; zmienione tylko ścieżki importów i komentarz). Strażnik `tests/jakosc/e2e-licznik-to-be.test.ts` bez zmian, zielony.

## B. Wartości wyglądu i układ starego systemu zastąpione odpowiednikami dla Dzianiny (wyjątek P-553 jak w p1 i p2)
| Test | Zmiana | Powód |
|---|---|---|
| `licznik-ax5` „AX5: liczba nad nazwą projektu i części” | kolejność AX: nazwa projektu → liczba → „Now working row” | makieta `licznik-390-*-ax5` (Dzianina) zastępuje wariant (d) P-275 (liczba nad nazwami) |
| `licznik-ax5` P-277 (skale) | tytuł = nazwa projektu (`getByText('Harbor')`, ×1,8); skala liczby z komórki `licznik-wartosc-cyfra-0` (×1,3) | tytuł to nazwa projektu; liczba w `Liczba` (komórki stałej szerokości, M3-S3-03) niesie skalę na komórkach |
| `licznik-ax5` „pasek przy AX5” | pasek ma tylko „Back” i •••; symbol historii poza paskiem | historia, wzór i stoper w rzędzie akcji pod liczbą (ZM-04) |
| `licznik-ax5` M1-132 (3 testy: pięć cyfr AX5, linia bazowa, próg `minimumFontScale`) | liczba w jednym wierszu komórek, jednostka pod liczbą; zamiast `minimumFontScale` schodki tokenów (≤3 cyfry `liczbaLicznika`, 4–5 `liczbaKarty`, 6+ `liczbaPaskaWzoru`) | `Liczba` z p1 nie zmniejsza się do szerokości; dolny próg 0,5 przestał istnieć w tym komponencie |
| `przycisk-glowny-wypelniony` „+1 row na liczniku” | tło `akcent`, tekst `naAkcencie`, bez obrysu | makieta `.wielki` i „+1” karty „Dziś”; nie token `przycisk` |
| `przycisk-glowny-wypelniony` „kapsuła stopera w trakcie sesji” | akcja stopera w trakcie sesji: tło `akcent` | stoper w rzędzie akcji (P-586 2a); wygląd biegnącego stopera [DO USTALENIA 04] |
| `stoper-kapsula-rozmiar` (3 z 5; 2 skale ×1,6 bez zmian) | czas w akcji: krój systemowy 600, `typografia.mala.pt` (13), cyfry tabelaryczne | czas stoi w komórce akcji w kroju podpisu akcji, nie w kapsule 17 pt 700 |
| `symbole-sf` „skala symbolu” (stoper) | symbol akcji 24 pt w rzędzie, 40 pt w liście AX, skala ×1,8, także przy trwającej sesji | kapsuły z paska nie ma |

## C. Pozycje przeniesione między ekranami (testID bez zmian, zmienia się kontener)
| Test | Zmiana | Powód |
|---|---|---|
| `menu-oczka` (przepisany) | cel, powtórzenie i przypomnienia sprawdzane w `MenuCel`; w ••• zostaje `menu-znaczenie`; `menu-wzor` nieobecny | P-581 (a): „Cel” otwiera arkusz z tymi trzema pozycjami; „Wzór” to akcja |
| `menu-wzor` (przepisany) | zamiast wiersza „Pattern”/„Add pattern…” w ••• — jego brak i akcja `licznik-wzor` | P-580, P-586; „Add pattern…” bez wzoru: dotychczasowe dodanie wzoru pod akcją, menu źródeł to p3b |
| `licznik-wzor` | akcja „Pattern” zawsze jest (także bez wzoru), kolejność: wzór, stoper, Historia | P-580: „Wzór” zawsze widoczna |
| `historia-menu` BR-PRJ-006 | pozycje nazwa, numer, ukończ w `MenuProjektu`; cel, przypomnienie, powtórzenie w `MenuCel` (osobny test) | j.w. |
| `przypomnienia-trasa` (2) | `/menu` z parametrem `arkusz=cel` | przypomnienia w arkuszu „Cel” |
| `licznik-oczek` menu | j.w.: znaczenie w `MenuProjektu`, cel i przypomnienie w `MenuCel` | j.w. |
| `pasek-symbole-033-036` (3) | symbole: akcje pod liczbą (etykieta `licznik.akcja_historia`); „wstecz” na liczniku `nav-wstecz` zamiast `nav-projekty` (P-583); grupy ••• bez testID `menu-grupa-*` (ZM-05), kolejność i podział grup przez drzewo | kontrakt testID M3-TESTID-02 |
| `stany-bledow-094` | atrapa propsów `MenuProjektu` bez `naCel`/`naPrzypomnienie`/`naPowtorzenie` | propsy przeniesione do `MenuCel` |
| `licznik-p5` | wejście do projektu = „Project: Harbor Sweater” (`licznik-projekt-wejscie`); `licznik-projekt` to nazwa | P-580 (a) |
| `licznik-limit` | nazwa przycisku ••• `/^Counter options/` | nowa etykieta (`licznik.menu_wiecej_a11y`) |
| `testid-033-licznik-trasa` `licznik-notatka` | blok z ikoną i treścią zamiast nagłówka „Note” | testid.md: nagłówek znika, etykieta = treść |

## D. Odczyt liczby z `Liczba` zamiast jednego `<Text>` (asercje wartości bez zmian)
`licznik` (2), `licznik-oczek`, `jednostka-rzedow-liczba-mnoga`, `licznik-minus-plus-bez-projektu`, `licznik-trasa-032`, `blokada-trasa`: `props.children` / `children.join('')` → `props.accessibilityLabel` elementu `licznik-wartosc` (komponent `Liczba` dzieli cyfry na komórki, etykieta = liczba).

## E. Uzupełnienie atrap (bez zmian asercji)
`licznik-trasa-032`, `testid-033-licznik-trasa`, `blokada-trasa`, `stoper-po-pierwszym-plusie`: `j.jezyk` w atrapie kontenera (trasa licznika podaje język komponentowi `Liczba`); `blokada-trasa`: `useLocalSearchParams` w atrapie `expo-router` (trasa `/menu` czyta parametr `arkusz`).

## F. Testy i18n
Bez zmian w testach; `docs/lokalizacja/oczekujace.json`, `src/i18n/pseudo/en-XA.json` (generowany skryptem) i `tests/i18n/m3-prefiksy.ts` zaktualizowane (P-578).

## G. Nowe testy partii (czerwone przed kodem z właściwego powodu)
`tests/ekrany/ekran-nie-gasnie-dzis.test.tsx` (7; P-585), `tests/ekrany/licznik-akcje.test.tsx` (11; akcje, „Projekt ›”, wstecz, dzianina, AX5), `tests/ekrany/menu-licznika-m3.test.tsx` (11; ••• 6 pozycji w 2 grupach, arkusz „Cel”).
