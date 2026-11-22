# Kontrakt zakresu Oczka: historia etapów E0–E2 (rola 03, 2026-10-22)
Archiwum robocze: rama, soczewki, pominięcia i warianty, na których stoi `docs/scope-contract.md`. Nagłówki sekcji bez zmian, bo powołują się na nie `docs/brd/errata.md` (ER-10–ER-24) i `docs/decyzje.md`. Tabele „Zakres”, „NIE robimy” i „Ranking” obowiązują tylko w `docs/scope-contract.md`.

Stan: **STOP E2** (cięcie, warianty) · Aktualizacja: 2026-10-22 · Rola 03-zakres, tryb build (prompt `prompts` @97ec212, złożony 2026-10-22, 55 540 znaków) · Wejście: BRD `docs/brd/` (E4 + poprawka ER-06–ER-08), `docs/monetyzacja.md` (sesja 2, E3), P-001–P-039, ZAL-001–026

Kontrakt powstaje etapami E0–E3; tabele „Zakres” i „NIE robimy” w formacie `zakres.mjs` pojawią się w E3. Do tego czasu ID F-nn to kandydaci, nie decyzje.

## E0: Rama

### Środowisko (sprawdzone 2026-10-22)
| Sprawdzenie | Wynik | Skutek |
|---|---|---|
| System, Node, git | Linux x86_64 w chmurze, Node v22.22.0; gałąź `claude/jolly-thompson-paz6d8` @2855dbf | — |
| GitHub | push przez git na gałąź roboczą (Oczko) i na `main` (`oczko-warsztat`, P-010); biblioteka `prompts` tylko do odczytu | — |
| Sieć | 200: `itunes.apple.com/lookup`, `developer.apple.com/app-store/review/guidelines/`; `apps.apple.com` odpowiada (404 dla testowego id, host osiągalny) | wzorzec najlepszych w E1 z odczytu z dziś |
| BRD i dokument roli 02 | oba w `docs/` | brak STOP z powodu braku wejścia |
| Bramka opłacalności (zasada wspólna 20) | werdykt „budować” (P-013, 2026-10-21), następne odświeżenie 04.2027 (P-016) | aktualna |
| Xcode, symulator | brak (właściciel też nie ma Maca) | testy na telefonie tylko przez TestFlight: koszt w godzinach właściciela |
| Wysiłek sesji | nie da się sprawdzić narzędziem | zalecany: high |

### Wyjątki nazwane (zasada wspólna 7)
- **Sesja roli 03 nie jest świeża** (zasada wspólna 19; zalecenie sztafety: nowa sesja). Właściciel, 2026-10-22: „Pracuj tutaj”. Ta sama sesja wcześniej przewinęła gałąź i poprawiła `docs/sztafeta.md`.
- **Naruszenie kwarantanny P-003 przed startem roli (nieumyślne).** Zanim sesja dostała rolę 03, na gałęzi `claude/amazing-ride-iup4to` (stan poprzedniej wersji) zobaczyła: listę katalogów w korzeniu repo, tytuły 5 ostatnich commitów poprzedniej wersji (m.in. kalkulator próbki na mokro i kompensacji blokowania, motyw UI, wdrożenie TestFlight), stary `CLAUDE.md` z opisem standardu jakości oraz listę zależności z `package.json` (m.in. `qrcode`, `expo-document-picker`, `expo-haptics`). Kodu, testów, dokumentów ani BRD poprzedniej wersji nie otwierała. Ryzyko zakotwiczenia dotyczy dwóch miejsc: F-41 (długość po blokowaniu, BR-KAL-006) i obszaru 10 z `docs/pomysl.md` (przekazanie projektu). **Tańsza kontrola zamiast pominiętej:** soczewki E1 i ocena tych dwóch pozycji w E2 robią subagenci bez kontekstu tej sesji (nie fork), a decyzje o nich mają w Uzasadnieniu źródło z BRD albo z odczytu z dziś.

### Wejście jako hipotezy
| ID | Treść (skrót) | Status w rejestrze | Na czym stoi w 03 |
|---|---|---|---|
| ZAL-008 | Oczko to narzędzie N, nie aplikacja W z treścią | hipoteza (wspierana przez 01, E1–E2) | J-10 i SLO jako słownik, nie kursy |
| ZAL-009 / H-03 | uczciwość i zaufanie do danych jako wyróżnik | potwierdzone (R) | podłogi danych przed rankingiem |
| ZAL-002 | wartość stała dla funkcji sesyjnych | potwierdzone (R); przy modelu B nie jest warunkiem | — |
| ZAL-003 | koszt 0 zł bez konta i sieci | potwierdzone dla iCloud i płatności | F-27 synchronizacja, F-12 zegarek (koszt 0 do potwierdzenia przez 05) |
| ZAL-019 / H-04 | rdzeń: J-01, J-02, J-03, J-05, J-06, J-07 | hipoteza (R) | **sprawdzam w E1** (pętla główna) |
| ZAL-020 / H-05 | kalkulatory swetrowe bez dowodu potrzeby | hipoteza | E2 (F-38–F-43) |
| ZAL-021 / H-06 | funkcje „wow” z luk rynku | hipoteza; dowód zakupu dla zegarka (R mocny) i przypomnień (R) | E2 (F-02, F-06, F-07, F-08, F-11, F-12) |
| ZAL-022 / H-07 | jedna aplikacja z warstwami lepsza od rodziny | hipoteza | **E2, podział** |
| ZAL-023 / H-08 | import od konkurencji przyciąga płacących | hipoteza | F-29 |
| ZAL-024 / H-09 | AI na urządzeniu nie jest potrzebą | hipoteza | brak BR o AI; funkcja AI tylko przez ER do 01 |
| ZAL-025 / KP-01 | lista darmowa raz wydana nie kurczy się | hipoteza (R), reguła kontraktu | **ograniczenie zakresu:** listę darmową zawężam tylko przed wydaniem |
| ZAL-026 / P-029 | Pro 14,99 USD konwertuje ≥ 1,85% | hipoteza, test po wydaniu | wersja 1 musi mieć funkcje Pro, inaczej testu modelu nie ma czym przeprowadzić |
| ZP-07 a zasada 18 | „bijąca funkcjonalnościami liderów” a „bez kombajnu” | napięcie wskazane przez 01 | E2: warianty pokażą koszt szerokości |

### Kandydaci (59 BR → 44 funkcje)
Klasa WTP i poziom dowodu z tabeli „Wartość funkcji” roli 02 (P-027); propozycja darmowe/Pro z „Podziału darmowe / Pro” (P-030–P-032). Podłoga według wzorców roli: `dane`, `bezpieczeństwo` (reguły krytyczne RD i treść krytyczna), `prawo` (OG); `→ F-nn` oznacza kontrolę innej funkcji. Blokery wydania z `docs/brd/README.md` oznaczam „blok.”.

| ID | Funkcja | Wymagania | J / PR | WTP (dowód) | 02 | Podłoga |
|---|---|---|---|---|---|---|
| F-01 | Licznik rzędów od pierwszego uruchomienia, dodaj i odejmij, potwierdzenie wibracją | BR-LIC-001, BR-LIC-002, BR-LIC-005 | J-01 / PR-01, PR-02 | WTP-0 (R, B) | darmowa | dane: blok. BR-LIC-001, 002 |
| F-02 | Historia zmian z godziną i cofnięciem | BR-LIC-003 | J-01 / PR-02 | WTP-1 (R słaby) | darmowa | dane: blok. BR-LIC-003 → F-01 |
| F-03 | Blokada przed przypadkowym stuknięciem | BR-LIC-004 | J-01 / PR-02 | WTP-2 (B) | darmowa | — |
| F-04 | Kilka liczników w projekcie, zmiana ustawień w trakcie | BR-LIC-006, BR-LIC-008 | J-02 / PR-03 | WTP-1 (R), WTP-0 (B) | darmowa | — |
| F-05 | Licznik powtórzeń powiązany z rzędami | BR-LIC-007 | J-02 / PR-03 | WTP-1 (R) | Pro | — |
| F-06 | Przypomnienie „co N rzędów, M razy” | BR-LIC-009 | J-03 / PR-04 | WTP-1 (R) | Pro | — |
| F-07 | Plan rzędów z instrukcji wzoru | BR-LIC-010 | J-03 / PR-04 | WTP-2 (H) | Pro | — |
| F-08 | Cel rzędów i jego osiągnięcie | BR-LIC-011 | J-11 / PR-02 | WTP-2 (B) | darmowa | — |
| F-09 | Znaczenie liczby (rząd skończony / w trakcie) | BR-LIC-012 | J-01 / PR-02 | WTP-2 (B) | darmowa | — |
| F-10 | Ekran nie gaśnie podczas liczenia | BR-LIC-013 | J-06 / PR-05 | WTP-0 (R) | darmowa | — |
| F-11 | Liczenie z ekranu blokady | BR-LIC-014 | J-06 / PR-05 | WTP-1 (R słaby) | Pro | — |
| F-12 | Liczenie na zegarku bez telefonu w ręku | BR-LIC-015 | J-06 / PR-05 | WTP-1 (R mocny) | Pro | dane: NFR-ZEG-001 (blok., jeśli w wydaniu) |
| F-13 | Dodanie rzędu głosem (Siri) | BR-LIC-016 | J-06 / PR-05 | WTP-1 (R) | Pro | — |
| F-14 | Projekt z częściami | BR-PRJ-001 | J-02, J-05 / PR-07 | WTP-1 (R) | darmowa | — |
| F-15 | Notatka widoczna przy liczniku | BR-PRJ-002 | J-05 / PR-02, PR-07 | WTP-1 (R słaby) | darmowa | — |
| F-16 | Zdjęcia projektu i etykiet | BR-PRJ-003 | J-05 / PR-07 | WTP-1 (R) | darmowa (P-032) | — |
| F-17 | Dane techniczne projektu (drut w mm i US) | BR-PRJ-004 | J-05 / PR-07 | WTP-2 (B) | darmowa | — |
| F-18 | Powrót do projektu po przerwie | BR-PRJ-005 | J-05 / PR-07 | WTP-0 (R) | darmowa (dane) | dane: odczyt |
| F-19 | Stan projektu i archiwum ukończonych | BR-PRJ-006 | J-05 / PR-07 | WTP-2 (R) | darmowa (dane) | dane: odczyt |
| F-20 | Zrób ponownie (kopia projektu) | BR-PRJ-007 | J-05 / PR-07 | WTP-2 (B) | darmowa (P-032) | — |
| F-21 | Stoper sesji przy zablokowanym ekranie | BR-PRJ-008 | J-11 / PR-14 | WTP-1 (R) | Pro | — |
| F-22 | Postęp i szacowany czas do celu | BR-PRJ-009 | J-11 / PR-14 | WTP-2 (H) | Pro | — |
| F-23 | Przypomnienie o przerwie | BR-PRJ-010 | J-11 / PR-14 | WTP-2 (B), OP-15 | → 03 | — |
| F-24 | Import wzoru z pliku i ze zdjęcia | BR-WZR-001, BR-WZR-002 | J-04 / PR-06 | WTP-1 (R) | darmowa (P-032) | prawo: OG-07 (blok.) |
| F-25 | Wzór i licznik na jednym ekranie | BR-WZR-005 | J-04 / PR-06 | WTP-2 (B) | darmowa (P-032) | prawo: OG-07 (blok.) |
| F-26 | Znacznik bieżącego rzędu we wzorze | BR-WZR-003 | J-04 / PR-06 | WTP-1 (R mocny) | Pro | prawo: OG-07 (blok.) |
| F-27 | Synchronizacja przez iCloud (opcjonalna) | BR-DAN-002 | J-07 / PR-08 | WTP-1 (R) | darmowa (P-031) | dane: NFR-DAN-003 (blok.) |
| F-28 | Pisanie po wzorze (Apple Pencil) | BR-WZR-004 | J-04 / PR-06 | WTP-1 (R najmocniejszy) | Pro | prawo: OG-07 (blok.) |
| F-29 | Import od innej aplikacji (zapas z Ravelry) | BR-DAN-007 | J-07, H-08 / PR-13 | WTP-2 (H) | darmowa | — |
| F-30 | Siatka co 10 oczek na schemacie | BR-WZR-006 | J-04 / PR-06 | WTP-2 (B pojedynczy) | Pro albo → 03 | prawo: OG-07 (blok.) |
| F-31 | Baza na urządzeniu, trwały zapis, dane po aktualizacji | BR-DAN-001, BR-DAN-003 | J-07 / PR-02, PR-08 | dane | dla wszystkich | dane: blok. NFR-DAN-001, 002 |
| F-32 | Nowy telefon, eksport i import własnego eksportu | BR-DAN-004, BR-DAN-005, BR-DAN-006 | J-07 / PR-08 | dane | dla wszystkich | dane: eksport, odczyt (blok.) |
| F-33 | Usunięcie z koszem 30 dni | BR-DAN-008 | J-07 / PR-07 | dane | dla wszystkich | dane: usunięcie |
| F-34 | Usunięcie wszystkich danych | BR-DAN-009 | ZP-03 / PR-08 | dane | dla wszystkich | dane: usunięcie; prawo: OG-04 |
| F-35 | Zakup Pro, przywracanie, opłacone nie znika | BR-ZAK-001, BR-ZAK-003 | J-07 / PR-09 | warunek | dla wszystkich | prawo: OG-02 (blok. BR-ZAK-001) |
| F-36 | Bez reklam i śledzenia, polityka prywatności | BR-ZAK-002, BR-ZAK-004 | ZP-03 / PR-09 | warunek | dla wszystkich | prawo: OG-04, NFR-PRY-001 (blok.) |
| F-37 | Zapas włóczki i narzędzi | BR-ZAP-001, BR-ZAP-002, BR-ZAP-003, BR-ZAP-004 | J-08 / PR-10 | WTP-1 (R), WTP-2 | Pro | prawo: OG-13; bezpieczeństwo: RD-03, RD-10 |
| F-38 | Obliczenia podstawowe: oczka z próbki, jednostki, grubość włóczki | BR-KAL-001, BR-KAL-003, BR-KAL-008 | J-09 / PR-11 | WTP-1 (R), WTP-0 (R), WTP-2 (B) | darmowa | bezpieczeństwo: RD-01, RD-03, RD-04, RD-10 (blok.) |
| F-39 | Przeliczenie wzoru na własną próbkę | BR-KAL-002 | J-09 / PR-11 | WTP-1 (R słaby) | Pro | bezpieczeństwo: RD-02 (blok.) |
| F-40 | Równomierne dodawanie i ujmowanie | BR-KAL-004 | J-09 / PR-11 | WTP-1 (B) | Pro | — (RD-05, RD-06 niekrytyczne) |
| F-41 | Długość po blokowaniu | BR-KAL-006 | J-09 / PR-11 | WTP-2 (B), brak na rynku | → 03 | bezpieczeństwo: RD-08 (blok.) |
| F-42 | Zużycie włóczki z wagi próbki | BR-KAL-005 | J-08, J-09 / PR-11 | WTP-1 (R) | Pro | bezpieczeństwo: RD-07 (blok.) |
| F-43 | Luz w obwodzie | BR-KAL-007 | J-09 / PR-11 | WTP-2 (B), 1 soczewka WTP-X | → 03, kandydat na odcięcie (H-05) | — (RD-09 niekrytyczna) |
| F-44 | Słownik skrótów z systemem US/UK, bez sieci | BR-SLO-001, BR-SLO-002 | J-10 / PR-12 | WTP-2 (R, B) | darmowa | bezpieczeństwo: RYZ-03, treść krytyczna (blok. BR-SLO-001) |

Kontrola przypisania (skrypt, 2026-10-22): 59 BR z BRD, każde w dokładnie jednej funkcji, 0 spoza BRD (wynik niżej w „Dowody E0”).

### Podłogi (stałe przed rankingiem)
- **Dane:** F-01, F-02 (blokery liczenia), F-31, F-32 (blokery danych), F-33, F-34, F-18, F-19 (odczyt własnych danych). Eksport i kopia służą rzadko, a są podłogą (wzorce, kalibracja).
- **Bezpieczeństwo i reguły krytyczne:** każde obliczenie, które zostaje, zostaje z regułą RD i przeglądem 06 (D-027): RD-01–RD-04, RD-07, RD-08, RD-10; słownik z jawnym systemem US/UK (RYZ-03). Nie upraszczam obliczeń bez źródła.
- **Prawo i wytyczne:** F-35 (OG-02), F-36 (OG-04, NFR-PRY-001), każda funkcja wzoru z porównaniem z zastrzeżeniami patentów (OG-07, P-024), F-37 bez symboli pielęgnacji (OG-13), opis w sklepie tylko o funkcjach z wydania (OG-05), więcej niż prosty licznik (OG-01, 4.2/4.3(b)).
- **Kontrakt płatności:** KP-01 (lista darmowa po wydaniu nie kurczy się), KP-10 (zakup nigdy w trakcie liczenia).

### Obszary z `docs/pomysl.md` bez BR (dla E1: pominięcie czy świadome „nie”)
P-001 mówi „robi to, co poprzednia wersja, i więcej, jeśli wykaże to research”. Te obszary nie mają wymagania w BRD; rola 01 sprawdziła je i nie znalazła dowodu albo nie spisała:
| Obszar | Co jest w BRD | Do E1 |
|---|---|---|
| 4: schematy ściegów z legendą symboli | tylko siatka na schemacie (BR-WZR-006) | sprawdzić u najlepszych w niszy; brak dowodu → NIE z warunkiem powrotu, dowód → ER do 01 |
| 5: karczek raglanowy, czapka, zamienniki włóczki | H-05 (brak dowodu, OP-07); zamienniki częściowo w BR-KAL-008 | jw. |
| 8: ćwiczenia z czytania instrukcji, rozpoznawanie ściegu, ratowanie błędów | tylko słownik (J-10, ZAL-008: to praca aplikacji W) | jw. |
| 10: przekazanie projektu innej osobie | „sprawdzone, brak dowodu w próbce” (`odkrywanie.md`) | jw.; ocena przez subagenta bez kontekstu tej sesji (wyjątek wyżej) |
| AI na urządzeniu (P-023) | H-09 bez BR | E1: dowód potrzeby → ER do 01; brak → nie w wersji 1 |

### Apetyt (pytanie do właściciela)
Apetyt to godziny **właściciela** na wersję 1: przegląd na bramkach, testy na telefonie przez TestFlight (bez Maca), decyzje, kroki w App Store Connect. Czas agenta się nie liczy (zasada wspólna 13). Liczby to [OCENA]: ok. 1 h na prostą funkcję na ekranie telefonu (przejście przepływu, zgłoszenie błędów, ponowny test), 3–6 h na funkcję natywną albo wieloma urządzeniami (zegarek, ekran blokady, iCloud, zakup w piaskownicy), stała ok. 15 h na role 04–11 (przeglądy STOP). Dokładny koszt każdej funkcji podam w rankingu E2.

| Opcja | Godziny właściciela | Co mniej więcej się mieści | Skutek |
|---|---|---|---|
| A: wąsko | ok. 30 h | podłogi (licznik, historia, dane, eksport, zakup) + kilka funkcji Pro bez zegarka | najszybsza premiera i recenzje; ryzyko 4.3(b) „simple timer” i słaby powód do zakupu Pro (test P-029 na małej ofercie) |
| B: środek | ok. 60 h | A + liczenie bez telefonu (zegarek albo ekran blokady), przypomnienia, wzór ze znacznikiem, zapas | oferta Pro z funkcjami, za które konkurencja bierze pieniądze (R mocny); premiera później |
| C: szeroko | ok. 100 h | prawie cała propozycja roli 02 (darmowe + Pro), bez funkcji z samą hipotezą | najbliżej „bijąca funkcjonalnościami” (ZP-07); najdłużej do pierwszych recenzji, największy koszt utrzymania w 35 językach |

Rekomendacja: **B**. Model B potrzebuje w wersji 1 funkcji Pro z dowodem zakupu (zegarek, znacznik we wzorze, przypomnienia), inaczej test P-029 mierzy słabą ofertę; C dokłada funkcje z dowodem B albo H, których wartość lepiej sprawdzić po pierwszych recenzjach (ZP-05).

### Plan i czas (zasada wspólna 9)
| Etap | Co | Czas agenta | Czekanie | Właściciel |
|---|---|---|---|---|
| E1 | pętla główna; 9 wymiarów pokrycia; 4 soczewki jako subagenci bez kontekstu tej sesji; wzorzec 2–3 najlepszych (lookup + recenzje z dziś); pominięcia jako ER do 01 | 2–3 h | limit iTunes ok. 20 zapytań/min | przegląd raportu, ok. 15 min |
| E2 | cięcie (podłogi, WTP-0, zasada 18, RICE w godzinach właściciela, apetyt); kombajn; podział na aplikacje (H-07); co najmniej 2 warianty; F-23, F-30, F-41, F-43 | 2–3 h | — | wybór wariantu, podziału i darmowe/Pro, ok. 20–30 min |
| E3 | `docs/scope-contract.md` w szablonie, `zakres.mjs --brd docs/brd --apetyt <h>` kod 0, definicja ukończenia, przekazanie 04–08, sztafeta | 1–1,5 h | — | akceptacja, ok. 10 min |

Razem: 5–7,5 h pracy agenta; od właściciela ok. 1 h (bez apetytu wersji 1, który jest osobną liczbą).

### Dowody E0
- Prompt roli: `node tools/assemble.mjs 03-zakres --tryb build --galaz claude/jolly-thompson-paz6d8` w `prompts` @97ec212, kod 0, 587 linii.
- Przypisanie BR: `node kontrola-e0.mjs docs/scope-contract.md docs/brd` (funkcje `tabele` i `wymaganiaBrd` ze skryptu `zakres.mjs` roli) → „BR w BRD: 59 · kandydatów F: 44 · BR przypisanych: 59 · błędów: 0”, kod 0. Kontrola negatywna na kopii z BR-LIC-003 zamienionym na BR-LIC-004: 2 błędy („BR-LIC-003 bez kandydata”, „BR-LIC-004 w F-02, F-03”), kod 1. Skrypty i wynik: `oczko-warsztat/03-zakres/2026-10-22-build/`.

## Po E0: decyzje i zgłoszenia (2026-10-22)
- **P-040:** kierunek wersji 1 = wariant B + F-11 (ekran blokady) + F-21 (stoper): „B plus 1, 3”. Linię i koszty potwierdza STOP E2.
- **P-041:** bez testów ręcznych właściciela, tylko automatyczne. Koszt w rankingu E2 = przeglądy, decyzje, utrzymanie; ryzyko „kryterium niesprawdzalne automatem” liczone przy każdej funkcji.
- **P-042: F-28 (pisanie Apple Pencil) w kierunku wersji 1** („1a”). Odrzucanie dłoni zapewnia system: tryb `PKCanvasViewDrawingPolicy.pencilOnly`, „Pencil touches are the only input that draw on the canvas.” (developer.apple.com/documentation/pencilkit/pkcanvasviewdrawingpolicy/pencilonly, odczyt 2026-10-22; od iOS 13); kryterium BR-WZR-004 sprawdza automat (dotyk palcem na płótnie → 0 kresek), a nasz kod (zapis adnotacji, położenie przy powiększeniu, eksport, tryb do odczytu po utracie Pro) testy jednostkowe i UI w symulatorze.
- **P-043: kalendarz i postęp K-1–K-5** (K-5 jako wyjątek właściciela, ZAL-027) i **P-044: nowe funkcje I-1, I-2, I-3, I-4, I-6, I-7, I-9**; I-5 i I-8 na liście „później”. Notatki: `oczko-warsztat/03-zakres/2026-10-22-build/kalendarz-wzorce.md`, `pomysly-nowe.md`.
- **Uwaga dla roli 02:** BR-PRJ-009 (postęp) ma teraz dowód R (K-4), nie tylko H; nowe funkcje K-1–K-5 i I-nn potrzebują podziału darmowe/Pro (propozycja w E2).
- **Skala:** po P-040–P-044 zakres jest szerszy niż wariant B (ok. 15 funkcji ponad B). W E2 każda przechodzi test zasady 18 i sygnałów kombajnu (ZP-01 „małe”); wynik idzie do decyzji właściciela, bez cichego cięcia.

### Zgłoszenia do roli 01 (ER)
| ID | Zgłoszenie | Dowód | Status |
|---|---|---|---|
| ER-10 | Metody NFR zakładają test ręczny albo urządzenie: NFR-OFF-001 („test ręczny i automatyczny”), NFR-DOS-001 („audyt VoiceOver na urządzeniu”), NFR-WYD-001 („pomiar na najstarszym obsługiwanym iPhonie”), NFR-ZEG-001 („test na parze urządzeń”); po P-041 metoda automatyczna albo nazwane ryzyko szczątkowe. Uwaga dla 02 i 07: tabela „Testy, których nie zrobi Node (krok właściciela)” w `docs/monetyzacja.md` potrzebuje zamiennika automatycznego | P-041; `docs/brd/wymagania.md` (NFR) | otwarte |
| ER-11 | Brak BR dla K-1–K-5 (kalendarz dni, dzień, podsumowanie okresu, postęp projektu w %, termin i cel dzienny; prace J-11, J-05) i reguły RD celu dziennego (czy dziś się liczy, zaokrąglenie, po terminie, prucie) oraz % z rzędów jako nazwanego przybliżenia; prefiks `KAL` w BRD Oczka jest zajęty przez obliczenia | P-043; `kalendarz-wzorce.md` | otwarte |
| ER-12 | Brak BR dla I-1, I-2, I-3, I-4, I-6, I-7, I-9 (prace J-01, J-03, J-05, J-11 i terminy) | P-044; `pomysly-nowe.md` | otwarte |

## E1: Główna praca i pętla (2026-10-22)
Metoda: cztery soczewki jako niezależni subagenci bez kontekstu tej sesji (nowy użytkownik, pasjonat po roku, najlepsze aplikacje niszy, właściciel jako opiekun), wspólny brief, każda przez 9 wymiarów; raporty i surowe dane: `oczko-warsztat/03-zakres/2026-10-22-build/soczewki/`. Kluczowe tezy sprawdzone przez rolę 03 u źródła (2026-10-22): liczby ocen i opisy z Lookup (`wzorzec-surowe/lookup-us-wszyscy-2026-10-22.json`), patenty w opisie knitCompanion, brak słowa „calendar” w opisach 23 aplikacji, cytaty id 12450531949, 14375427685, 13712427204 zgodne z korpusem; RSS recenzji US dziś zwraca 0 wpisów (sprawdzone ponownie), więc recenzje z korpusu 2026-10-21 i strony App Store z dziś.

**Skażenie kwarantanny w soczewkach (nazwane):** dwie soczewki przywołały treść spoza dozwolonego wejścia, najpewniej ze starego `CLAUDE.md` wczytanego do kontekstu na starcie sesji: „dwie pule po 10 kopii” (pasjonat, ER-P5) i narzędzie „Maestro” (nowy użytkownik, opiekun). Oba odrzucam jako uzasadnienie; ER-P5 nie idzie do roli 01 (pytanie o automatyczne kopie lokalne trafia do roli 12 z dowodem J-07), wybór narzędzi testów należy do 05 i 07.

### Główna praca i pętla główna
- Główna praca: J-01 „Wiedzieć, w którym rzędzie jestem, i ufać tej liczbie” z J-05 (powrót) i J-04 (miejsce we własnym wzorze). Wzorzec liderów w jednym zdaniu: „wiem dokładnie, gdzie skończyłem, w moim wzorze” (R 14615536466: „to be able to reliably know *exactly* where I left off in a pattern has been a game changer.”).
- Pętla główna (zgodna u 4 soczewek, F-24–F-26 u 2 z 4): uruchomienie → ostatni licznik (F-01, F-18) → +1 z wibracją, ekran nie gaśnie (F-01, F-10) → pomyłka: −1 albo cofnięcie z historii, ochrona przed stuknięciem (F-02, F-03, I-1) → [warstwa] wzór obok licznika ze znacznikiem (F-24, F-25, F-26) i przypomnienie „co N rzędów” (F-06) → wyjście bez zapisywania (F-31) → powrót do tego samego miejsca z notatką (F-18, F-15).
- Najkrótsza pętla, która wykonuje pracę: F-01 → F-10 → F-31 → F-18.

### Wzorzec najlepszych (Lookup US 2026-10-22, kryterium: `userRatingCount` typu N, średnia drugim kluczem)
| Aplikacja | Oceny, średnia | W pętli | Czego nie ma / co usunęła | Skargi |
|---|---|---|---|---|
| knitCompanion (id1058142783) | 6899, 4,83 | wzór → konfiguracja → znacznik i liczniki; śledzenie rzędu i iCloud za darmo | zegarek, zapas, kalkulatory; usunięta wersja dożywotnia (R 14338808883) | za trudno: „I have watched videos over and over” (R 13678678745) |
| My Row Counter (id1342608792) | 3867, 4,83 | licznik bez konfiguracji, wzór (PDF, WWW, Word od 3.58), zakreślacz, przypomnienia | historia z cofnięciem, blokada, kalkulatory, kalendarz (0 ze 177 pochwał) | funkcje za paywall (R 14519247568), reklamy, licznik całości nad sekcjami (W 13712427204) |
| Knitting Chart (id1251317736) | 1298, 4,35 | schemat → „Working Mode” z licznikiem | ostatnia wersja twórcy 2023-01-18 | „Is this an app? A document?” (R 13892775052), Pencil |

Żaden z trzech nie ma kalendarza, kalkulatorów swetrowych ani słownika; wszyscy trzej mają głos (F-13, poza kierunkiem P-040).

### Wymiary pokrycia
| Wymiar | Wynik |
|---|---|
| 1 Główna praca od początku do końca | pierwsze liczenie bez projektu to najostrzejsze 1★ u liderów (R 12450531949: „deleted in 5 mins because I cannot figure out how to count the rows without creating a project”); po roku płacący odchodzą przez zaufanie (utracony zakup, zmiana warunków), nie przez brak funkcji (pasjonat: 12 z 32 recenzji płacących ≤3★, 0 o brak funkcji) |
| 2 Pominięcia | ER-13–ER-24 niżej |
| 3 Nadmiar | 4 z 4 soczewek: termin i cel (K-5, I-3, I-4), zapas F-37; 3 z 4: kalendarz jako osobna zakładka (K-1–K-3), kalkulatory F-38–F-43, karta I-6 → sprzeczność z P-043/P-044 do decyzji |
| 4 Podłogi | bez zmian wobec E0; OG-07 blokuje F-25, F-26, F-28, I-2 (patenty w opisie knitCompanion dziś); I-6 udostępnia zdjęcia bez metadanych lokalizacji (ER-24) |
| 5 Intuicyjność | bez nowego pojęcia: I-1, I-6, I-9, K-2; z nowym pojęciem albo pustym widokiem: K-4, K-5, I-2, I-3, I-4, I-7 → nie na pierwszym ekranie; gęstość znaków Pro (ok. 15 funkcji) czyta się jako „wszystko płatne” |
| 6 Wartość | MRC, 177 pochwał z 12 mies. [OCENA, wyrażenia regularne]: import wzoru 37, notatki 15, zapas 4, kalkulator 1, kalendarz 0 |
| 7 Koszt właściciela | [OCENA opiekuna, ×0,5–2]: ok. 50 h na wersję 1 i ok. 52 h/rok; 5 powierzchni natywnych (F-12, F-27, F-11, F-21, F-28) to ok. 56% rocznej opieki nad funkcjami; K i I razem ok. 7 h/rok (logika w pełni sprawdzalna automatem); F-27 najdroższy (ok. 10 h/rok) |
| 8 Zależności i blokery | OG-07 dla funkcji wzoru; NFR-ZEG-001, NFR-DAN-003 bez pełnego sprawdzenia automatem (P-041); diagnoza awarii tylko ze zgłoszeń (ER-19) |
| 9 Podział | 4 z 4: jedna aplikacja (iPhone, iPad, zegarek); zapas, kalkulatory, słownik jako warstwy poza głównym widokiem (wspiera ZAL-022) |

**F-41 i obszar 10 (kontrola po wyjątku kwarantanny):** 4 z 4 soczewek niezależnie: F-41 PÓŹNIEJ albo NIE (0 próśb o przeliczenie po blokowaniu w 4682 recenzjach, RD-08 krytyczna); obszar 10 NIE (brak prośby; eksport F-32 obsługuje przypadek).

### Pominięcia: ER do roli 01
| ID | Zgłoszenie | Dowód | Soczewki |
|---|---|---|---|
| ER-13 | Wpisanie wartości licznika i wyzerowanie (w historii, z cofnięciem; zerowanie z potwierdzeniem); przeniesienie trwającej robótki | 86 recenzji, 44 ≤3★ (wzorzec reset/ustaw, sprawdzone 2026-10-22); „You should be able to enter the number.” (StitchTally, 14375427685) | nowy, pasjonat |
| ER-14 | NFR pierwszego liczenia: najwyżej [DO USTALENIA, propozycja 2] stuknięcia do +1; nic przed licznikiem (powitanie, quiz, uprawnienia, zakup); offline | 12450531949; Loopsy 14441026601 | nowy |
| ER-15 | Powrót do miejsca po starcie i z innej aplikacji: projekt, część, licznik, strona i powiększenie wzoru, osobno na urządzeniu | „it *does not save* my settings.” (MRC, R 14255514434) | pasjonat |
| ER-16 | Licznik całości nad częściami jednego kawałka (sekcje zasilają całość) | W 13712427204, W 9711911250 | najlepsi, pasjonat |
| ER-17 | Źródła wzoru poza PDF i zdjęciem: strona WWW (zapis offline), Word; link do filmu (tylko link) | listing MRC, nota 3.58; 14644150451 | najlepsi, nowy |
| ER-18 | Zakreślanie i notatki na wzorze palcem na iPhonie (nie tylko Pencil); OG-07 | 13648606552; płatne „HIGHLIGHT” w knitCompanion | najlepsi, pasjonat |
| ER-19 | „Zgłoś problem” z lokalną diagnostyką wysyłany przez użytkownika, bez śledzenia; widoczny stan synchronizacji i zegarka | YarnBuddy 8151431159, 8662495109; Loopsy 13620980670; pętla opinii w wersji 1 (kontrakt roli, E2 pkt 6) | opiekun |
| ER-20 | Korekta czasu sesji (zapomniany stoper) i dat projektu | Loopsy 13728925552, 13535125970 | opiekun, pasjonat |
| ER-21 | NFR: działanie po premierze nowego iOS/watchOS i minimalne wersje systemu | 12259939345, 10717526170 | opiekun |
| ER-22 | Cofnięcie usunięcia licznika i części; import kopii na niepustej bazie (scalić albo zastąpić) | 編み物カウンター２ 10497670066 | opiekun, pasjonat |
| ER-23 | Lista projektów po roku: w toku według ostatniej pracy, ukończone osobno, wyszukiwanie | pasjonat (dowody w raporcie) | pasjonat |
| ER-24 | Doprecyzowania: BR-LIC-004 (stuknięcie w zablokowany licznik wyjaśnia; gest systemowy nie zmienia licznika: Knit Row Counter 4570617893), BR-PRJ-002 (długość notatki), ER-11 (dzień w strefie urządzenia: Easy Knitty 10008576789), ER-12 (I-1 tylko na licznikach rzędów; I-6 bez metadanych lokalizacji) | jw. | wszystkie |

Uwagi dla roli 02: F-26 (znacznik) jako Pro jest ostrzejsze niż u knitCompanion (śledzenie rzędu darmowe); czy Pro obejmuje przyszłe funkcje Pro [DO USTALENIA]. Dla roli 12: automatyczne kopie lokalne z odtworzeniem w aplikacji (J-07; skażone uzasadnienie soczewki odrzucone).

### Sprzeczności z wejściem
- **ZAL-019 / H-04 podważone w części:** J-04 (miejsce we własnym wzorze) należy do rdzenia, nie „potem”: to główna praca liderów i najczęstsza pochwała (import wzoru 37 ze 177).
- **Kierunek P-043/P-044 a sygnały kombajnu:** wszystkie soczewki wskazują termin i cel dzienny (K-5, I-3, I-4) oraz zapas; trzy z czterech kalendarz jako zakładkę, kalkulatory i kartę I-6. Koszt opieki tych funkcji jest mały (logika), ryzyko dotyczy zagracenia i pierwszego użycia.
- **Opiekun:** F-27 (iCloud) najdroższy w opiece; I-7 (wibracje) bez sprawdzenia odczucia automatem.

## E2: Cięcie i warianty (2026-10-22)
Wejście: BRD po poprawce roli 01 (80 BR, P-047, P-048), kierunek właściciela P-040–P-046, pętla E1 (P-045), koszty z soczewki opiekuna (`oczko-warsztat/03-zakres/2026-10-22-build/soczewki/opiekun.md`; ślad kwarantanny „23:55 UTC (`CLAUDE.md`)” w tym pliku pominięty). Kolejność cięcia według modułu `ciecie`: podłoga → podstawa WTP-0 → test zasady 18 → ranking RICE w godzinach właściciela → apetyt. Skrypt: `zakres-oczko.mjs` (wyjątek nazwany: obok D-nnn przyjmuje P-nnn, bo rejestr Oczka numeruje decyzje P-nnn; różnica dwóch wyrażeń w nagłówku pliku, `oczko-warsztat/03-zakres/2026-10-22-build/`).

### Główna praca i pętla (do kontraktu)
- Główna praca: J-01 „Wiedzieć, w którym rzędzie jestem, i ufać tej liczbie” z J-05 i J-04 (miejsce we własnym wzorze).
- Pętla główna: uruchomienie w ostatnim miejscu (F-49, F-18) → +1 z wibracją, ekran nie gaśnie (F-01, F-10) → pomyłka: −1, cofnięcie, strażnik, opcjonalna blokada, wpisanie wartości (F-02, F-47, F-03, F-45) → [warstwa] części z celem (F-14, F-08), wzór obok licznika ze znacznikiem (F-24, F-25, F-26) i przypomnienie (F-06) → wyjście bez zapisywania (F-31) → powrót z notatką (F-15).
- Podział: jedna aplikacja (iPhone, iPad, zegarek) z warstwami: Narzędzia (zapas F-37, obliczenia F-38) i Historia (F-59) poza ekranem licznika (H-07 (a); 4 z 4 soczewek E1; ZAL-022).
- Pętla opinii w wersji 1: „Zgłoś problem” (F-57); systemowa prośba o ocenę po ukończeniu projektu i odnośnik „Oceń” według kontraktu roli (specyfikacja: rola 11) nie mają BR: zgłoszenie ER-25 do roli 01 przy następnej poprawce.

### Test zasady 18 i kombajn (wynik)
- Wartość: każda funkcja MVP ma dowód B albo R, poza F-61 (cel dzienny H: wyjątek właściciela P-043, ZAL-027). F-07 scalone z F-06 (U-3), ID wycofane.
- Intuicyjność: kryterium w kolumnie „Intuicyjność”; wynik każdego czeka na przejście poznawcze roli 04 (P-041: bez testów z ludźmi, chyba że właściciel zgodzi się na testerów zewnętrznych).
- Sygnały kombajnu (soczewki E1) złagodzone warstwami i scaleniami (P-046, U-1–U-12): ekran licznika bez K i I, kalendarz jako widok historii, termin jako pole projektu, karta tylko w chwili ukończenia.
- Wycięte albo odłożone z powodem i warunkiem powrotu: F-13, F-22, F-23, F-29, F-30, F-39–F-44, F-62.

### Warianty dla właściciela ([OCENA] godzin właściciela ×0,5–2; bramki ról ok. 15 h osobno)
| Wariant | Co zawiera | Wersja 1 (funkcje) | Opieka / rok | Ryzyko | Co wypada względem W1 |
|---|---|---|---|---|---|
| **W1 (rekomendacja): kierunek P-040–P-046 + pominięcia E1** | 49 funkcji MVP z tabeli niżej | ok. 44 h | ok. 48 h | 5 powierzchni natywnych (zegarek, iCloud, ekran blokady, stoper, Pencil) bez pełnego sprawdzenia automatem (P-041); szerokość złagodzona warstwami | — |
| W2: węższy, mniej powierzchni natywnych | W1 bez F-27 (iCloud → 1.1; nowy telefon przez kopię urządzenia i eksport), F-11 i F-21 (sesja ekranu blokady, stoper), F-37 (zapas), F-61 (termin i cel) | ok. 34 h | ok. 32 h | sprzeczne z P-031, P-040, P-043; Pro bez ekranu blokady, stopera, zapasu i terminu (zostają: powtórzenia, przypomnienia, zegarek, znacznik, Pencil, zakreślacz) | 5 funkcji, ok. 10 h i ok. 16 h/rok |
| W3: szerszy | W1 + F-13 (Siri, 3 z 3 liderów), F-42 (zużycie), F-39 (przeliczenie), F-44 zawężony do tabeli US↔UK z CYC | ok. 49 h | ok. 52 h | głos w 35 językach, dwie reguły krytyczne i treść krytyczna do przeglądu 06 | dochodzą 4 funkcje |

Rekomendacja: **W1**. Wykonuje kierunek właściciela z dowodami dla każdej funkcji (poza nazwanym wyjątkiem F-61) i odpowiada na główne 1★ liderów (zaufanie, prostota). W2 to rozsądna obrona, jeśli roczna opieka ma być niższa: tnie to, czego automat nie sprawdzi. W3 dokłada funkcje o słabszym dowodzie.

**Apetyt (propozycja do decyzji):** 45 h godzin właściciela na funkcje wersji 1 (W1 = 43,75 h) plus ok. 15 h bramek ról.

**Darmowe / Pro:** lista darmowa W1 to zobowiązanie po wydaniu (KP-01). Nowe funkcje bez klasy roli 02: proponuję darmowe wszystkie poza F-56 (zakreślanie palcem, przy narzędziach wzoru Pro) i F-61 (termin i cel dzienny). Uwaga dla roli 02: F-26 jako Pro jest ostrzejsze niż u knitCompanion (śledzenie rzędu darmowe).

Tabele wariantu W1 (zakres, NIE robimy, dostęp, ranking) przeniesione do `docs/scope-contract.md` w E3 (2026-10-22).
