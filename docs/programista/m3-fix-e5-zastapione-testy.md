# M3 fix E5 — testy zastąpione jawnie (rola 08, 2026-11-09, P-614, P-615)

Każdy wiersz: test zapisywał zachowanie, które zatwierdzona poprawka 04 świadomie zmienia. Asercja nie jest luzowana — zastąpiona nowym oczekiwaniem z tokenów; stare oczekiwanie w kolumnie „było”.

| Plik:test | Było | Jest | Podstawa |
|---|---|---|---|
| `tests/ekrany/licznik-ax5.test.tsx` „AX5 … liczba i „Now working” nad nazwą projektu” | nazwa projektu < liczba < „Now working” | liczba < „Now working” < nazwa projektu | 016, `licznik.ax3ax5.kolejnosc` (P-613) |
| `tests/ekrany/licznik-akcje.test.tsx` „AX5: akcje jako lista … liczba nad nazwą, bez dzianiny” | nazwa < dzianina < liczba < notatka < akcje | liczba < nazwa < notatka < akcje; `licznik-dzianina` brak | 016, `licznik.ax3ax5.kolumnaDzianiny` = ukryta |
| `tests/ekrany/m3-p4b-kolumny.test.tsx` „AX1: dzianina jako pas … od AX3 (AX5) bez dzianiny” | AX5: pas dzianiny 96 pt | AX5: brak dzianiny; pas 96 sprawdzany przy AX1 | 016, jw. |
| `tests/ekrany/tytuly-limit-skali.test.tsx` „205: etykiety −1 i +1 paska … (×1,4 i ×1,4 z tokenu przyciskPlus)” | „+1” ×1,8 (`MAX_SKALA_TYTULOWA`) | „+1” ×`typografia.przyciskPlus.maxSkala` (1,4) | 005 (P-614) |
| `tests/ekrany/wzor-pasek-dzianina.test.tsx` (pasek, asercja „+1”) | „+1” ×1,8 | „+1” ×1,4 z tokenu | 005 (P-614) |
| `tests/ekrany/liczba-cyfry.test.tsx` „komponent: każda cyfra w komórce o tej samej szerokości…” | szerokość = komorkaEm × pt | szerokość = komorkaEm × pt × fontScale okna (bez limitu, komponent bez maxFontSizeMultiplier) | 003 (P-614) |
| `tests/ekrany/licznik-ax5.test.tsx` „P-277: krój tytułowy … „+1” i „−1” najwyżej ×1,4” | „+1 row” ×1,8 | ×1,4 (`przyciskPlus.maxSkala`) | 005 (P-614) |
| `tests/ekrany/naglowki-sekcji-13-reszta.test.tsx` „ListaProjektow: „In progress” i „Finished” — lista.naglowekGrupy” | 13 pt, `olowek` (H-2) | 17 pt, `tekst` (`lista.naglowekGrupy`) | 010 (P-614 (5); design-spec Fix E5: „zastępuje”) |
| `tests/ekrany/m3-p4b-kolumny.test.tsx` „AX1: karta w kolumnie, kolumna dzianiny min. 120 …; AX5: pas 48” | AX5: kolumna min. 120 | AX1: min. 120; AX5: pas 48 (`kartaDzis.ax3ax5`) | 004 (P-614 (2) A) |
| `tests/ekrany/dzianina-geometria.test.ts` „0 rzędów = sama igła z nabranymi oczkami …” | igła na dole (y = dół dzianiny) | pas nabrania 8 jedn. nad dołem, igła na nabraniu (`geometria.nabranie`) | 001 (P-619; makieta `ekrany.html:629–631`) |
| `tests/ekrany/pole-wyboru-wloczki.test.tsx` „pole wyboru włóczki wg wzorca 04 …” | koło `cel.poleWyboru` (44) z obrysem `drugiPrzyciskObrys`, glif „✓” w Text | `PoleWyboru`: obrys `tekst2`, zaznaczone `przycisk` + `checkmark` w `przyciskTekst`, bez „✓” | 011 (P-619 wariant B) |
| `tests/ekrany/pole-wyboru-wloczki.test.tsx` „145: pole wyboru z własnych tokenów …” | `cele.minimum` × `promienie.plus`, znak 700 17 pt ×1,6 | `znaczniki.radio` (AX1+ `radioAx5`) × `promienie.pole`, symbol `maxSkala` = MAX_SKALA_TYTULOWA (jak `ZnacznikRadio`) | 011 (P-619 wariant B) |
| `tests/domena/wzor/uklad-rysik.test.ts` „iPad poziomo 1180 × 820 …” | kolumna 340 pt (W4b: zawsze obok) | 280 pt (`cele.paskaWzoru.kolumna.szerokosc`), obok tylko przy oknie ≥ 1000 pt | 015 (P-614 (3) A) |
| `tests/ekrany/wzor-przegladarka.test.tsx` „układ „obok” … kolumna licznika o szerokości z ukladOkna” | `width: 340` | `width: 280` | 015 (P-614 (3) A) |
| `tests/ekrany/narzedzia-wstecz-trasa.test.tsx` M1-016 „/narzedzia: przycisk Back …” i „trwała kontrola” | Narzędzia i Historia (korzenie zakładek) z „Back” (`nav-wstecz`) | korzenie zakładek bez „wstecz”; Narzędzia i Historia w `POZA`; kontrola odwrotna w `m3-fix-e5-006.test.tsx` | 006 (P-614 (1) A) |
| `tests/ekrany/menu-licznika-m3.test.tsx` „korekta (…), potem stan (…), na końcu zerowanie” | zerowanie ostatnie w grupie korekty, przed blokadą | zerowanie we własnej grupie po ukończeniu | 009 (P-614 (4), zadania-08 poz. 9) |
| `tests/ekrany/menu-licznika-m3.test.tsx` „trzy grupy: korekta, stan, zerowanie …” | dwie grupy (zerowanie w korekcie) | trzy grupy; testID grup kontraktu nadal brak | 009 (P-614 (4)) |
