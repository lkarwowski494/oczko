# Przewodnik po funkcjach — specyfikacja (rola 04 build, sesja O, 2026-11-10)

Decyzja właściciela (10.11 ok. 15:50 UTC, dosłownie): „Obok zębatki i w ustawieniach przydałoby się coś jak przewodnik po funkcjach - coś w stylu pierwsze kroki do nowego projektu w kilku punktach i pełna bibiolteka wszystkich funkcji”; termin: „Build 4, przed 1.0”. Decyzje tej specyfikacji: P-685–P-689 (`docs/decyzje.md`, do weta). Analogia: Trening `app/guide.tsx`, `lib/guide.ts`, wejście `app/(tabs)/more.tsx:20`, decyzja Treningu 08.10.2026 wariant A (`trening:docs/18-archiwum-do-11.10.md:139`).

**Wyjątki nazwane.** (1) Bez bramki opłacalności i bez etapów E1–E3: projekt w istniejącym systemie „Dzianina” (`design-spec.md`, `tokeny.json`), bez nowych kolorów i tokenów kolorów. (2) Kwarantanna roli 04 (`CLAUDE.md`): czytany był bieżący kod przebudowy (`app/`, `src/`, `e2e/`) wyłącznie po trasy, testID i klucze — polecenie O wymaga plików tras; `archiwum/` nietknięte. (3) Dwie nazwy spoza interfejsu aplikacji: „Apple Watch” (literał, znak towarowy) i „Ekran blokady” (termin Apple) — powierzchnie systemu nie mają nazwy w interfejsie Oczka.

## Pliki
| Co | Plik |
|---|---|
| Treść (jedno źródło: kroki, 9 grup, 42 funkcje, trasy, en i pl) | `przewodnik-2026-11-10/tresc.json` |
| Tabela kluczy (61 nowych, en + pl, trasa „Pokaż”) i nazw z istniejących kluczy | `przewodnik-2026-11-10/klucze.md` (generowana) |
| Kontrola treści (nazwy = wartości używanych kluczy, pliki tras, pokrycie kontraktu, liczby); kod 0 | `narzedzia/przewodnik-kontrola.mjs` → `przewodnik-2026-11-10/kontrola.txt` |
| Makieta (4 ekrany) | `przewodnik-2026-11-10/przewodnik.html` (dane z `tresc.js`) |
| Zrzuty 390 pt: 4 ekrany × jasny/ciemny × domyślny/AX5 (16) + en jasny dla 2 ekranów przewodnika (makiety „Dziś” i Ustawień są tylko po polsku) + arkusz | `przewodnik-2026-11-10/zrzuty/` (`narzedzia/przewodnik-zrzuty.mjs`) |
| Pomiar warsztatu 390 pt (0 błędów) i obraz mrużenia | `przewodnik-2026-11-10/warsztat-390.txt`, `przewodnik-mruzenie-390.png` |
| Zrzuty 320 pt (te same warianty, kontrola przepełnienia) | `przewodnik-2026-11-10/zrzuty-320/` |
| Pary przed/po krytyki | `przewodnik-2026-11-10/przed-po/` |

## 1. Wejścia (P-685)
- **„Dziś”, pasek** (`src/ekrany/Dzis.tsx:183`): nowy `PrzyciskSymbolu` **przed** zębatką (zębatka zostaje skrajna). Symbol `questionmark.circle` (iOS 13) **z widocznym podpisem** `przewodnik.tytul` (właściwość `podpis`, jak „Narzędzia” DEC-05 a, `src/ekrany/ListaProjektow.tsx:75–76`, dotąd „jedyny symbol z widocznym podpisem” — przewodnik jest drugim; wymaganie właściciela „To ma być intuicyjne”, 10.11), rozmiar i kolor jak zębatka (`ROZMIAR_SYMBOLU`, `tekst`, limit skali `MAX_SKALA_TYTULOWA`), cel 44 × 44 pt (`cel.minimum`, styl `symbol` w `Pasek.tsx`), etykieta VoiceOver `przewodnik.tytul` („Przewodnik” / „Guide”), rola przycisku, testID `nav-przewodnik`. Tylko na „Dziś” — jak zębatka (P-571). Od AX3 symbole paska przechodzą do osobnego wiersza nad tytułem „Dziś” (podpis zostaje; przy 320 pt i AX5 inaczej wypadały poza ekran — `przed-po/ax5-320-dzis-*`). Bez plakietki nieprzeczytanych. Zrzut: `zrzuty/dzis-przewodnik-*`.
- **Ustawienia** (`src/ekrany/Ustawienia.tsx:121–129`): wiersz „Przewodnik” w grupie z „Pomoc”, **bezpośrednio nad „Pomoc”**; kafelek ikony `questionmark.circle`, wartość `przewodnik.postep_wiersza` („3 z 42”, `tekst2`, `accessibilityValue`), strzałka, testID `ustawienia-przewodnik`. Zrzut: `zrzuty/ustawienia-przewodnik-*`.
- **„Pomoc”** (link WWW wsparcia) zmienia symbol z `questionmark.circle` na `lifepreserver` (iOS 14): jeden symbol = jedno znaczenie (zasada studia 6; tak samo P-577 dla `sun.max`).

## 2. Ekran `app/przewodnik.tsx` (nowa trasa; P-686)
Wypchnięty na stos (z „Dziś” albo z Ustawień), bez paska zakładek; wstecz `Wstecz` jak Ustawienia. Jeden przewijany ekran, kolejność:
1. Duży tytuł `przewodnik.tytul` (Bree, `duzyTytul` 34, `accessibilityRole="header"`); pod nim `przewodnik.wstep` (`tresc2`, `tekst2`).
2. **„Pierwsze kroki”** — nagłówek sekcji Bree `tytul` 22 (rola nagłówka). Lista grupowana (`lista`: `powierzchnia`, promień 16, podziałka `linia`) z **6 krokami**, zawsze widocznymi: numer (Bree 22, `tekst2`, ukryty przed VoiceOver, limit ×1,8), zdanie (`tresc`, `tekst`), pod zdaniem „Pokaż ›” — przycisk tekstowy (`akcentTekst`, 700, cel 44 pt; akcja poboczna wg `design-spec.md` „Arkusz formularza” (4)). Numeracja jest tu treścią (kolejność czynności), nie ozdobą. Kroki prowadzą od pustej aplikacji do projektu i rzędu: pierwszy „+1” na „Dziś” → nazwa projektu → cel części → wzór → powrót przez „Kontynuuj” → kolejny projekt.
3. **„Biblioteka funkcji”** — nagłówek sekcji Bree 22, pod nim `przewodnik.przeczytane` („Przeczytane: 3 z 42”, `tresc2`, `tekst2`, testID `przewodnik-postep`).
4. **9 grup** z nagłówkiem grupy `lista.naglowekGrupy` (17 / 700 / `tekst`, rola nagłówka): Dziś, Licznik, Projekty, Wzór, Narzędzia, Historia, Ustawienia, Oczko Pro, Apple Watch i ekran blokady. W grupie wiersze funkcji (lista grupowana). **Wiersz zwinięty** (≥ 44 pt, padding 12/16): nazwa (`tresc`, 600) · znak przeczytania · szewron `chevron.down` (`tekst2`). **Rozwinięty** (szewron `chevron.up`): opis 1–2 zdania (`tresc`, `tekst`) i „Pokaż ›” jak w krokach. Rozwinięty jest najwyżej jeden wiersz naraz (jak Trening `guide.tsx:17,29`), rozwinięcie bez animacji (jak licencje, fix11).
5. Bez przycisków na dole, bez wyszukiwania, bez obrazków.

Odstępy z `odstepy` (sekcje 16, nagłówek → grupa 8, poziomo 16). Zrzuty: `zrzuty/przewodnik-kroki-*`, `zrzuty/przewodnik-biblioteka-*`.

## 3. „Pokaż” (P-687)
Analogia Trening `guide.tsx:21`: trasa zakładki → zamknięcie stosu (`dismissAll`) i `navigate` do zakładki (bez drugiego zestawu zakładek); inna trasa → `push` (wstecz wraca do przewodnika). Kontekst bierze się z ostatniego miejsca pracy, tak jak „Kontynuuj” (`app/(zakladki)/index.tsx:64`) i przycisk „Wzór” licznika (`app/licznik.tsx:64`, `/wzor` bez parametrów):
| Trasa | Plik | Gdy brak miejsca / projektu |
|---|---|---|
| `/` (Dziś), `/projekty`, `/dni` | `app/(zakladki)/index.tsx`, `projekty.tsx`, `dni.tsx` | — |
| `/licznik`, `/wzor` | `app/licznik.tsx`, `app/wzor.tsx` | `/` (karta „Pierwszy licznik”) [DO USTALENIA 08: dzisiejsze zachowanie tras bez ostatniego miejsca] |
| `/projekt/[id]` (projekt ostatniego miejsca) | `app/projekt/[id].tsx` | `/projekty` |
| `/kosz`, `/zapas`, `/druty`, `/probka`, `/ustawienia`, `/miary`, `/stan-danych`, `/jezyk`, `/zglos`, `/zrodla` | `app/<trasa>.tsx` | — |
Zasady: „Pokaż” otwiera ekran, nie menu ani arkusz (bez automatycznego otwierania ••• czy „Cel”); funkcja w menu ••• prowadzi do ekranu z tym menu. **Oczko Pro → `/ustawienia`, nie `/oferty`**: zakup tylko z komunikatu limitu i z Ustawień (ER-70, BR-ZAK-006, P-563 (10)). **Apple Watch: bez „Pokaż”** (aplikacja zegarka, poza nawigacją iPhone’a); opis mówi, gdzie ją otworzyć. Ekran blokady → `/licznik` (stamtąd zaczyna się liczenie). Pełna lista tras przy każdej funkcji: `klucze.md`; istnienie plików sprawdza kontrola (kod 0).

## 4. Stan przeczytania (P-688)
- Funkcja staje się przeczytana przy pierwszym rozwinięciu (Trening `markGuideSeen`, `guide.ts:78`). Znak: symbol `checkmark` (`tekst2`, rozmiar treści, limit ×1,8) przed szewronem; nieprzeczytana — bez znaku. Nie kółko: kółko z ptaszkiem to w Dzianinie wybór (`znaczniki.radio`), a nie stan. Nic tylko kolorem: stan niesie obecność symbolu i tekst VoiceOver.
- Kroki nie mają stanu (zawsze widoczne, krótkie).
- Zapis: lokalnie na urządzeniu, lista id przeczytanych funkcji (np. ustawienie `przewodnik_przeczytane`); **bez synchronizacji iCloud i bez eksportu** (stan ekranu, nie dane robótki — jak Trening „bez `userTouched`”); „Usuń wszystkie dane” czyści; id spoza listy pomijane przy odczycie. [DO USTALENIA 05: miejsce zapisu — tabela ustawień czy pamięć klucz–wartość urządzenia.]

## 5. Ciemny motyw, Dynamic Type, VoiceOver, iPad
- **Ciemny:** wyłącznie tokeny (`tlo`, `powierzchnia`, `linia`, `tekst`, `tekst2`, `akcentTekst`); pary już w `dzianina/kontrast-tabela.txt` (np. `akcentTekst`/`powierzchnia` 5,39:1 jasny, 9,30:1 ciemny; `tekst2`/`powierzchnia` 7,15:1 i 7,48:1; warianty „Zwiększ kontrast” też OK). Zrzuty `*-ciemny*`.
- **Dynamic Type do AX5:** tekst bez limitu; numer kroku, szewron, ptaszek i symbole paska z limitem `MAX_SKALA_TYTULOWA` (×1,8); „Pokaż” zawsze pod zdaniem; długa nazwa łamie się w wierszu, szewron zostaje w wierszu (krytyka: `przed-po/ax5-przypomnienia-*`); od AX1 wartość wiersza Ustawień pod etykietą (jak inne wiersze). Zrzuty `*-ax5`.
- **VoiceOver:** nagłówki sekcji i grup z rolą nagłówka; krok = tekst z etykietą „{`przewodnik.krok_a11y`}. {zdanie}”, przycisk „Pokaż” z etykietą `przewodnik.pokaz_a11y` („Pokaż: Krok 2 z 6”); wiersz funkcji = przycisk z etykietą „{nazwa}, {nazwa grupy}, {przeczytane|nieprzeczytane}” (grupa rozróżnia dwie „Historie”) (`przewodnik.przeczytana` / `nieprzeczytana`), `accessibilityState.expanded`, wskazówka systemowa rozwinięcia; „Pokaż” funkcji: „Pokaż: {nazwa}”. Kolejność czytania = wizualna. `accessibilityLanguage` jak w Treningu (`guide.tsx:28`).
- **iPad:** ten sam ekran; kolumna treści najwyżej 672 pt, wyśrodkowana (ok. 70 znaków w wierszu przy 17 pt; Butterick 45–90) [DO USTALENIA 08: wspólna wartość z Ustawieniami, jeśli istnieje; inaczej nowy token `lista.maxSzerokosc` — zgłoszenie do 04]. Zakreślacz: opis wspomina Apple Pencil na iPadzie (F-28).

## 6. testID (do tabeli e2e roli 07)
`nav-przewodnik` (Dziś) · `ustawienia-przewodnik` (wiersz) · `przewodnik` (ScrollView) · `przewodnik-postep` · `przewodnik-krok-{1..6}` i `przewodnik-krok-{n}-pokaz` · `przewodnik-grupa-{id}` (dzis, licznik, projekty, wzor, narzedzia, historia, ustawienia, pro, poza) · `przewodnik-f-{id}` (wiersz), `przewodnik-f-{id}-opis`, `przewodnik-f-{id}-pokaz` (id funkcji z `tresc.json`, np. `cel`, `dodaj-wzor`). Proponowany scenariusz E2E (07): „Dziś” → `nav-przewodnik` → `przewodnik-f-cel` → `przewodnik-f-cel-pokaz` → ekran licznika; drugi: Ustawienia → `ustawienia-przewodnik` → postęp „1 z 42”.

## 7. Klucze i18n (P-689)
- **61 nowych kluczy** `przewodnik.*`: 13 stałych (tytuł, wstęp, sekcje, postęp, „Pokaż”, etykiety VoiceOver, grupa i nazwa ekranu blokady), 6 kroków (`przewodnik.krok_{n}`), 42 opisy (`przewodnik.f_{id}`). Teksty en i pl: `klucze.md`. Do roli 09: 61 × 34 języki = 2074 teksty (en 3625 znaków).
- **Nazwy funkcji i grup to istniejące klucze** (46 różnych, np. `menu.cel`, `projekty.kosz`, `zakladki.historia`) — przewodnik nie tworzy drugiej nazwy funkcji. Każda nazwa w cudzysłowie w krokach i opisach (66 cytatów en + pl) jest wartością klucza używanego w `app/` albo `src/` albo literałem (`+1`, `•••`, `−1`, `Apple Watch`, `Apple Pencil`) — reguła `tests/wydanie/notatka-nazwy.test.ts`; sprawdza `przewodnik-kontrola.mjs` (kod 0; kontrola negatywna: pierwszy przebieg wykrył 3 błędy — `wzor.tytul` nieużywany w kodzie i „Add to Oczko” z rozszerzenia udostępniania — poprawione).
- Dla 08: test jak Trening `tests/guide.test.tsx` — cytaty w tekstach przewodnika we wszystkich 35 językach są wartościami kluczy interfejsu w tym języku (dla 09: przy tłumaczeniu nazw w cytatach brać tłumaczenie tego klucza, jak w Treningu znaczniki ⟪etykieta⟫).
- Parametr `{{limit}}` w `przewodnik.f_pro` z `LIMIT_DNI_W_MIESIACU` (`src/konfiguracja`), nie liczba w tekście.
- Polski: formy bezosobowe i bez rodzaju („miejsce ostatniej pracy”), zgodnie z otwartym [DO USTALENIA 09: forma rodzajowa] w `design-spec.md` „Głos”.

## 8. Pokrycie funkcji 1.0
Kontrakt zakresu: 51 funkcji MVP; 49 ma miejsce w krokach albo w bibliotece (lista z kontraktem przy każdej funkcji w `klucze.md`), 2 pominięte z powodem: F-31 (trwały zapis — własność, nie czynność), F-36 (bez reklam i śledzenia — obietnica; „Polityka prywatności” zostaje linkiem w Ustawieniach). Dodatkowo w bibliotece: „Język” i „O naszych treściach” (ekrany bez numeru F). Każda funkcja biblioteki ma plik trasy, poza Apple Watch (uzasadnienie wyżej).

## 9. Czego nie ma w 1.0 (zasada wspólna 18: bez kombajnu)
| Pominięte | Dlaczego | Warunek powrotu |
|---|---|---|
| Wyszukiwanie w przewodniku | 42 wiersze w 9 nazwanych grupach mieszczą się w przewijaniu; pole szukania dubluje nagłówki | zgłoszenia „nie mogę znaleźć funkcji” albo > 60 funkcji |
| Podpowiedzi na ekranach, karuzela na start, wycieczka z dymkami | Trening odrzucił je 08.10.2026 (wariant A); okno przed „Dziś” łamie NFR-PIE-001 (0 ekranów przed pierwszym „+1”) | — |
| „Co nowego” po aktualizacji | 1.0 to pierwsze wydanie — nie ma zmian do opisania | 1.1 (Trening ma wejście z „Co nowego”) |
| Kroki odhaczane z danych (wykryty projekt, cel, wzór) | więcej logiki i stanów bez dowodu wartości; „Pokaż” i przeczytane wystarczą | test 3–5 osób pokaże, że kroki giną |
| Plakietka nieprzeczytanych na ikonie | presja bez wartości (HIG: plakietka dla rzeczy wymagających uwagi) | — |
| Obrazki, animacje, filmy w przewodniku | koszt × 35 języków, starzeją się z każdym ekranem | — |
| Przewodnik na zegarku | zegarek ma jedną czynność („+1 rząd”) | — |
| Linki „Pokaż” do pozycji menu i arkuszy | otwieranie menu za kogoś to niestandardowe zachowanie i kruche E2E | — |

## 10. Krytyka makiety (usterki → poprawki)
1. Sześć obramowanych przycisków „Pokaż” ważyło więcej niż treść kroków (test mrużenia) → przycisk tekstowy `akcentTekst` „Pokaż ›” (`przed-po/kroki-pokaz-*`).
2. AX5: jedno długie słowo („Przypomnienia”) wypychało szewron poza wiersz → nazwa się łamie, szewron zostaje (`przed-po/ax5-przypomnienia-*`).
3. Dwie funkcje „Historia” (licznika i zakładki) — rozróżnia je grupa i etykieta VoiceOver z grupą w nagłówku; zostawione, bo obie nazwy są w interfejsie (nowa nazwa byłaby drugą nazwą tej samej funkcji).
4. Pomiar warsztatu (`warsztat-390.txt`): 0 błędów; ostrzeżenia dotyczą całej strony makiety (4 ekrany, w tym uproszczona karta „Dziś” i pasek zakładek) — sam ekran przewodnika ma 4 wielkości (34, 22, 17, 15) i 3 kolory tekstu (`tekst`, `tekst2`, `akcentTekst`); odstęp 2 px to przerwa tekst–symbol w łączu (jak `nav` w `dzianina/ekrany.html`).

## 11. Intuicyjność (wymaganie właściciela 10.11 ok. 17:25 UTC: „To ma być intuicyjne.”)
| Kryterium | Jak spełnione | Sprawdzenie | Wynik na makiecie |
|---|---|---|---|
| (1) Wejście widać bez szukania; ikona z podpisem albo etykietą zrozumiałą bez wiedzy o aplikacji | „? Przewodnik” z widocznym podpisem w pasku „Dziś” — ekranu, od którego zawsze startuje aplikacja (P-563 (4a)), bez przewijania; drugie wejście: wiersz „Przewodnik” w Ustawieniach; etykieta VoiceOver = podpis | zrzuty `dzis-przewodnik-*` (390 i 320 pt, AX5); E2E 07: `nav-przewodnik` widoczny bez przewijania na świeżej instalacji | spełnione (320 pt AX5 po poprawce) |
| (2) Od otwarcia przewodnika do właściwego ekranu najwyżej 2 stuknięcia | krok: 1 stuknięcie („Pokaż”); funkcja: 2 (rozwiń, „Pokaż”); jedyny wyjątek bez ekranu: Apple Watch (aplikacja zegarka) | E2E 07: `przewodnik-f-cel` → `przewodnik-f-cel-pokaz` → `licznik-*` | spełnione |
| (3) „Pierwsze kroki” od razu na górze i rozwinięte; biblioteka niżej, w grupach nazwanych słowami użytkownika | kroki pierwsze pod tytułem, zawsze widoczne (bez zwijania); grupy noszą nazwy, które osoba widzi w aplikacji: zakładki (Dziś, Projekty, Narzędzia, Historia), tytuły ekranów (Licznik, Wzór, Ustawienia, Oczko Pro), powierzchnie systemu (Apple Watch i ekran blokady) — żadnej nazwy modułu z kodu | zrzut `przewodnik-kroki-*`; kontrola: nazwa każdej grupy jest kluczem interfejsu | spełnione |
| (4) Zdania krótkie, w każdym kroku jedna czynność, nazwy z interfejsu | po dopisku: krok 2 bez „Otwórz licznik” (to robi „Pokaż”), krok 5 tylko „Kontynuuj”; zdania kroków ≤ 13 słów (pl i en), opisy ≤ 18 słów w zdaniu i 1–2 zdania; nazwy w cudzysłowach = wartości kluczy interfejsu (kontrola kod 0) | `kontrola.txt`; pomiar słów w zdaniach (pl: 13/4, 6/4, 8/6, 11/6, 7/7, 11) | spełnione |
| (5) Bez samouczka nakładkowego, który blokuje ekran | przewodnik to zwykły ekran; nic nie pojawia się samo; NFR-PIE-001: 0 ekranów przed pierwszym „+1” | Trening ma tak samo: przewodnik jako ekran (`trening:app/guide.tsx:14`), „Pierwsze kroki” jako karta na ekranie głównym tylko dla nowej osoby (`trening:components/Dashboard.tsx:106`), podpowiedzi na ekranach i karuzela odrzucone (`trening:docs/18-archiwum-do-11.10.md:139`) | spełnione |

**Ścieżka nowej osoby: pusta aplikacja → pierwszy rząd → pierwszy projekt (liczenie stuknięć).** Ekrany spoza tej makiety według zatwierdzonych makiet Dzianiny (`dzianina/ekrany.html`: `dzis-pierwszy`, `licznik`, `formularz-*`) i przepływów z listy testu buildu 3 (T-03, T-20); wpisanie nazwy nie jest liczone jako stuknięcie.
| Ścieżka | Stuknięcia do pierwszego rzędu | Do pierwszego projektu (nazwa zapisana) |
|---|---|---|
| A. Bez przewodnika: „+1” na karcie „Pierwszy licznik” → „Otwórz licznik” → ••• → „Nazwij projekt i część” → nazwa → „Zapisz” | **1** | **5** |
| B. Z przewodnikiem, krok po kroku: „Przewodnik” → krok 1 „Pokaż” (wraca na „Dziś”) → „+1” → „Przewodnik” → krok 2 „Pokaż” (licznik) → ••• → „Nazwij projekt i część” → „Zapisz” | **3** | **8** |
| C. Projekt najpierw: „Projekty” → „Nowy projekt” → nazwa → „Dodaj” → część na ekranie projektu → „+1 rząd” | **5** | **3** |
Wniosek: przewodnik nie jest potrzebny do pierwszego rzędu (ścieżka A, 1 stuknięcie) i dodaje 3 stuknięcia osobie, która chce iść krokami (B). Krok 1 „Pokaż” otwarty z „Dziś” tylko zamyka przewodnik — świadomie: ten sam przycisk działa z Ustawień. Przejście poznawcze z 3–5 osobami (bez instrukcji: „załóż projekt i policz rząd”, potem „znajdź, jak ustawić przypomnienie”) — krok właściciela po wdrożeniu, wynik do roli 03 (kolumna „Intuicyjność” kontraktu).

## Czego nie sprawdzono
Urządzenie (SF Symbols `questionmark.circle` i `lifepreserver` obok zębatki, Dynamic Type na żywo, VoiceOver), 430 pt (320 pt sprawdzone na makiecie), iPad, najdłuższy język (DE — teksty powstaną w roli 09), przejście poznawcze z 3–5 osobami. Makieta „Dziś” ma uproszczoną kartę (bez rysunku dzianiny) — ocenia się tylko pasek z dwoma symbolami.

## Szacunek pracy [OCENA agenta, nie pomiar]
- **08 (kod):** ekran `app/przewodnik.tsx` + komponent, dane przewodnika z kluczami, zapis przeczytanych, 2 wejścia, zmiana symbolu „Pomoc”, test nazw i testy ekranu — ok. 2–3 h pracy agenta, jedna partia; czekanie: verify i CI.
- **07:** 2 scenariusze E2E i wpisy testID — ok. 0,5–1 h.
- **09 (34 języki):** 2074 teksty, ok. 3,6 tys. znaków en na język; maszynowo jak P-673 (subagenci z `en.kontekst.json`), nazwy w cudzysłowach z tłumaczeń istniejących kluczy — ok. 1–1,5 h agenta.
- **Właściciel:** na urządzeniu tylko nowe elementy: ikona obok zębatki, ekran, „Pokaż” z 2–3 funkcji, wiersz w Ustawieniach (ok. 5 min).
