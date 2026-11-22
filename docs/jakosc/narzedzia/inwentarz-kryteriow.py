#!/usr/bin/env python3
# Generator inwentarza kryteriów akceptacji wersji 1 (rola 07, E0). Czyta tylko docs/ i tests/wektory/brd.json.
import re, glob, json, os, sys, collections
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
OUT = os.path.join(REPO, 'docs', 'jakosc', 'e0')

# --- zakres: F (MVP) -> BR, z docs/scope-contract.md (tabela "Zakres", decyzja MVP) ---
scope_rows = {}
for i, l in enumerate(open(f'{REPO}/docs/scope-contract.md'), 1):
    m = re.match(r'\| (F-\d+) \| ([^|]+) \| ([^|]+) \| (MVP|PÓŹNIEJ|NIE|TEST) \|', l)
    if m:
        scope_rows[m.group(1)] = dict(nazwa=m.group(2).strip(), br=re.findall(r'BR-[A-Z]+-\d+', m.group(3)), decyzja=m.group(4), linia=i)
mvp = {f: r for f, r in scope_rows.items() if r['decyzja'] == 'MVP'}
br2f = {}
for f, r in mvp.items():
    for b in r['br']:
        br2f[b] = f
# BR w zakresie spoza tabeli (blokery README i errata), bez F w kontrakcie zakresu
EXTRA = {
    'BR-ZAK-005': ('—', 'docs/brd/README.md:43 (bloker), docs/brd/errata.md:155 (ER-26); brak w tabeli zakresu'),
    'BR-ZAK-006': ('—', 'docs/brd/README.md:43 (bloker), docs/brd/errata.md:155, :158 (ER-26, ER-29); brak w tabeli zakresu'),
    'BR-ZAK-007': ('—', 'docs/brd/README.md:43 (bloker), docs/brd/errata.md:155 (ER-26); brak w tabeli zakresu'),
    'BR-DAN-012': ('—', 'docs/scope-contract.md:11 (pętla opinii w wersji 1, ER-25), docs/brd/errata.md:154; brak w tabeli zakresu'),
}
MODUL = {'LIC': 'licznik', 'PRJ': 'projekt', 'WZR': 'wzór', 'DAN': 'dane', 'ZAK': 'zakup i limit', 'ZAP': 'zapas', 'KAL': 'obliczenia', 'DNI': 'dni i postęp', 'SLO': 'słownik'}

# --- scenariusze z BRD ---
scen = []  # dict
brinfo = {}
for f in sorted(glob.glob(f'{REPO}/docs/brd/wymagania-*.md')):
    rel = os.path.relpath(f, REPO)
    br = None; n = 0; cur = None
    for i, l in enumerate(open(f), 1):
        m = re.match(r'### (BR-[A-Z]+-\d+): (.*)', l)
        if m:
            br = m.group(1); n = 0; brinfo[br] = dict(tytul=m.group(2).strip(), plik=f'{rel}:{i}'); cur = None
            continue
        m = re.match(r'\s+- Scenariusz: (.*)', l)
        if m and br:
            n += 1
            cur = dict(id=f'{br}/S{n}', br=br, scen=m.group(1).strip(), plik=f'{rel}:{i}', tekst=[])
            scen.append(cur); continue
        if cur and re.match(r'\s{4,}- ', l):
            cur['tekst'].append(l.strip()[2:])
        elif l.startswith('#'):
            cur = None

# --- adnotacje (ocena roli 07, E0) ---
# (sprawdzalne, wyrocznia, poziom, uwagi)
T, C, N = 'tak', 'czesciowo', 'nie'
DOM, DAT, RNTL, E2E, DEV = 'domena-Node', 'dane-node:sqlite', 'ekran-RNTL', 'E2E-symulator', 'tylko-urządzenie'
A = {
 # LIC
 'BR-LIC-001/S1': (T, 'NFR-PIE-001; Z-01', E2E, 'świeża instalacja; także offline i z datą 1. i ostatniego dnia miesiąca (NFR-PIE-001 metoda)'),
 'BR-LIC-001/S2': (T, 'NFR-PIE-001; L-01, Z-01', E2E, 'liczba stuknięć = 1, adapter sieci „brak połączenia”'),
 'BR-LIC-001/S3': (T, 'brak (wartości w scenariuszu)', DAT, ''),
 'BR-LIC-002/S1': (T, 'brak (wartości w scenariuszu)', DOM, ''),
 'BR-LIC-002/S2': (T, 'brak (wartości w scenariuszu)', DOM, ''),
 'BR-LIC-002/S3': (T, 'brak (wartości w scenariuszu)', DOM, 'granica 0; brak wpisu w historii'),
 'BR-LIC-003/S1': (T, 'brak (wartości w scenariuszu)', RNTL, 'zegar wstrzykiwany'),
 'BR-LIC-003/S2': (T, 'RD-15 (wykonanie dnia bez cofniętych)', DAT, ''),
 'BR-LIC-004/S1': (C, 'brak', RNTL, 'fizyczny dotyk kolana nie do odtworzenia; test: zdarzenie press na +1 w stanie zablokowanym nie zmienia wartości. Brzmienie: „Gdy licznik dostaje zdarzenie stuknięcia w przycisk +1”'),
 'BR-LIC-004/S2': (C, 'brak', RNTL, '„świadomy gest” nieokreślony; design: pasek „Counter locked · Unlock” (docs/design/design-spec.md:34). Brzmienie: „Gdy stuka Unlock na pasku blokady”'),
 'BR-LIC-004/S3': (T, 'tekst z docs/design/design-spec.md:34', RNTL, ''),
 'BR-LIC-004/S4': (C, 'brak', E2E, 'gestu systemowego od krawędzi nie da się wiernie odtworzyć w XCUITest; test zastępczy: przeciągnięcie z dolnej krawędzi strefy +1 nie dodaje rzędu (RNTL/E2E); reszta ryzyko szczątkowe'),
 'BR-LIC-005/S1': (C, 'brak', DEV, 'haptyka i ciągłość podcastu tylko na urządzeniu; automat: wywołanie haptyki przy +1 (mock) i brak zmiany kategorii sesji audio (RNTL). Ryzyko szczątkowe P-041'),
 'BR-LIC-005/S2': (C, 'brak', RNTL, 'zakłada istnienie dźwięków i ustawienia ich wyłączenia; w design brak dźwięków i przełącznika (nie znaleziono w docs/design/design-spec.md). Brzmienie: „aplikacja nigdy nie odtwarza dźwięku przy +1” albo usunąć'),
 'BR-LIC-006/S1': (T, 'brak (wartości w scenariuszu)', DAT, ''),
 'BR-LIC-007/S1': (T, 'RD-12-W1', DOM, ''),
 'BR-LIC-007/S2': (T, 'RD-12-W2', DOM, ''),
 'BR-LIC-007/S3': (T, 'RD-12-W5', RNTL, 'walidacja w domenie (RD-12-W5) + komunikat na ekranie'),
 'BR-LIC-008/S1': (T, 'RD-12 (rachunek: r=17, n=10 → 2/7)', DOM, 'wektora dokładnie dla tego przypadku nie ma w brd.json; wynik z wzoru RD-12'),
 'BR-LIC-009/S1': (C, 'RD-13-W1', DOM, 'reguła tak; „zmienia wygląd całego ekranu” → RNTL (stan zakreślenia, docs/design/design-spec.md:23); wibracja jak BR-LIC-020'),
 'BR-LIC-009/S2': (T, 'RD-13-W2', DOM, ''),
 'BR-LIC-009/S3': (T, 'RD-13-W3', DOM, ''),
 'BR-LIC-010/S1': (T, 'RD-13 (lista s + kN)', RNTL, 'podgląd planu w formularzu (U-3)'),
 'BR-LIC-010/S2': (T, 'RD-13; OP-06 (docs/brd/README.md:107)', RNTL, ''),
 'BR-LIC-011/S1': (T, 'brak (wartości w scenariuszu); U-11', RNTL, 'treść „osiągnięcia” nieokreślona; test: stan celu + akcje „Następna część / Druga taka sama” (docs/scope-contract.md:22)'),
 'BR-LIC-011/S2': (T, 'brak (wartości w scenariuszu)', RNTL, 'oznaczenie „ponad cel”: brak tekstu w design'),
 'BR-LIC-012/S1': (C, 'brak', RNTL, 'design pokazuje zawsze obie wartości („Now knitting row 48” + liczba skończonych, docs/design/design-spec.md:30) — czy ustawienie F-09 zostaje? Do wyjaśnienia z 04/03'),
 'BR-LIC-013/S1': (C, 'brak', DEV, 'automat: wywołanie keep-awake przy wejściu na ekran licznika (mock); realne niegaśnięcie tylko na urządzeniu'),
 'BR-LIC-013/S2': (C, 'brak', DEV, 'automat: brak keep-awake przy wyłączonej opcji'),
 'BR-LIC-014/S1': (C, 'S-05 (strażnik przy +1 z ekranu blokady)', DEV, 'logika dziennika +1 (ADR-0008) testowalna w dane-node; Live Activity tylko urządzenie/E2E częściowo'),
 'BR-LIC-015/S1': (C, 'NFR-ZEG-001; S-04, L-11', DOM, 'logika synchronizacji z symulowanym transportem (domena); UI zegarka para symulatorów „jeśli CI pozwala”; prawdziwy zegarek: ryzyko szczątkowe'),
 'BR-LIC-015/S2': (C, 'RD-13-W1', E2E, 'wibracja zegarka tylko urządzenie'),
 'BR-LIC-017/S1': (T, 'brak (wartości w scenariuszu)', DOM, ''),
 'BR-LIC-017/S2': (T, 'brak (wartości w scenariuszu)', DAT, ''),
 'BR-LIC-017/S3': (T, 'RD-15 (wykonanie bez wpisań)', DAT, ''),
 'BR-LIC-017/S4': (T, 'S-06, L-08 (pośrednio), D4 w P-057', DOM, 'brak wektora L dla wpisania w dniu w limicie (2 z 5 → 3 z 5); test złożony z S-06 + L-01-podobnego'),
 'BR-LIC-017/S5': (T, 'L-08, S-06', DOM, ''),
 'BR-LIC-017/S6': (T, 'S-07', RNTL, 'potwierdzenie + cofnięcie z historii'),
 'BR-LIC-017/S7': (T, 'brak (reguła w scenariuszu)', RNTL, ''),
 'BR-LIC-018/S1': (T, 'brak (wartości w scenariuszu)', DOM, ''),
 'BR-LIC-018/S2': (T, 'brak (wartości w scenariuszu)', DOM, ''),
 'BR-LIC-018/S3': (T, 'brak (wartości w scenariuszu)', DOM, ''),
 'BR-LIC-019/S1': (T, 'RD-17-W1', DOM, 'reguła w domenie; baner i „Undo” w RNTL (docs/design/design-spec.md:35)'),
 'BR-LIC-019/S2': (T, 'RD-17-W4', DOM, ''),
 'BR-LIC-019/S3': (T, 'RD-17 (tylko liczniki rzędów)', DOM, 'wektora dla licznika oczek nie ma w brd.json'),
 'BR-LIC-019/S4': (T, 'P-046', RNTL, 'asercja negatywna'),
 'BR-LIC-020/S1': (C, 'F-48: dwa wzorce', RNTL, 'automat: różne ID wzorca haptyki (mock); odczucie różnicy: ryzyko szczątkowe (docs/scope-contract.md:219)'),
 'BR-LIC-020/S2': (C, 'brak', RNTL, 'niejednoznaczne: „wzór przypisany do zdarzenia” a F-48 „tylko dwa wzorce” (docs/scope-contract.md:58). Brzmienie: „wibruje wzorem przypomnienia (nie rzędu)”'),
 'BR-LIC-020/S3': (T, 'brak', RNTL, 'mock haptyki: 0 wywołań'),
 # PRJ
 'BR-PRJ-001/S1': (T, 'brak (wartości w scenariuszu)', DAT, ''),
 'BR-PRJ-002/S1': (T, 'brak', RNTL, ''),
 'BR-PRJ-002/S2': (T, 'P-047 (5000 znaków to przykład)', DAT, ''),
 'BR-PRJ-003/S1': (C, 'brak', E2E, 'aparat w symulatorze niedostępny: wybór z biblioteki/mock; plik w katalogu aplikacji (ADR-0001) i odczyt offline testowalne'),
 'BR-PRJ-004/S1': (T, 'RD-11-W1; DRT-M04000', DOM, ''),
 'BR-PRJ-004/S2': (T, 'RD-11-W3; DRT-M03000', DOM, ''),
 'BR-PRJ-005/S1': (T, 'brak', RNTL, ''),
 'BR-PRJ-006/S1': (T, 'brak', DAT, 'U-9'),
 'BR-PRJ-007/S1': (T, 'brak', DAT, 'U-2'),
 'BR-PRJ-008/S1': (T, 'brak (wartości w scenariuszu)', DOM, 'czas z znaczników, nie z timera w pamięci'),
 'BR-PRJ-008/S2': (C, 'brak', DEV, 'stoper na ekranie blokady (Live Activity) tylko urządzenie; zatrzymanie przez intencję testowalne w dane-node'),
 'BR-PRJ-011/S1': (T, 'brak', E2E, 'terminate + relaunch'),
 'BR-PRJ-011/S2': (T, 'brak', E2E, 'tło/pierwszy plan'),
 'BR-PRJ-011/S3': (C, 'NFR-DAN-003', DAT, 'dwa magazyny z symulowanym transportem; prawdziwe dwa urządzenia: ryzyko szczątkowe'),
 'BR-PRJ-012/S1': (T, 'brak', DAT, ''),
 'BR-PRJ-012/S2': (T, 'brak', DAT, ''),
 'BR-PRJ-012/S3': (T, 'tekst „No project called …” (docs/design/design-spec.md:55)', RNTL, ''),
 'BR-PRJ-013/S1': (T, 'brak (wartości w scenariuszu)', DOM, ''),
 'BR-PRJ-013/S2': (T, 'brak', DAT, ''),
 'BR-PRJ-013/S3': (T, 'brak', RNTL, ''),
 'BR-PRJ-014/S1': (T, 'brak', DAT, ''),
 'BR-PRJ-014/S2': (T, 'brak', RNTL, ''),
 'BR-PRJ-014/S3': (T, 'brak', RNTL, ''),
 'BR-PRJ-015/S1': (T, 'brak (wartości w scenariuszu)', RNTL, ''),
 'BR-PRJ-015/S2': (T, 'NFR-PRY-001; ZP-03', DAT, 'test pliku karty: brak EXIF GPS; arkusz udostępniania mock'),
 'BR-PRJ-015/S3': (T, 'brak', RNTL, ''),
 'BR-PRJ-016/S1': (T, 'brak (wartości w scenariuszu)', DAT, ''),
 'BR-PRJ-016/S2': (T, 'BR-PRJ-011', E2E, ''),
 # WZR
 'BR-WZR-001/S1': (C, 'brak', E2E, 'rozszerzenie udostępniania (ADR-0011) w XCUITest trudne; zapis i odczyt offline w dane-node'),
 'BR-WZR-001/S2': (T, 'brak', DAT, 'plik uszkodzony jako wejście testu'),
 'BR-WZR-002/S1': (C, 'brak', E2E, 'aparat: mock; „można powiększać” → RNTL (gest pinch) częściowo'),
 'BR-WZR-003/S1': (T, 'brak', DOM, ''),
 'BR-WZR-003/S2': (T, 'brak', DAT, ''),
 'BR-WZR-004/S1': (N, 'brak', DEV, 'odrzucenie dłoni tylko na iPadzie z Pencil; automat: konfiguracja PencilKit drawingPolicy = pencilOnly (P-042). Ryzyko szczątkowe (docs/scope-contract.md:219)'),
 'BR-WZR-005/S1': (T, 'brak', E2E, 'orientacja pozioma w symulatorze; makiety brak (docs/design/design-spec.md:95)'),
 'BR-WZR-007/S1': (C, 'brak', E2E, 'udostępnienie z Safari tylko E2E/urządzenie; zapis offline strony w dane-node'),
 'BR-WZR-007/S2': (C, 'brak', E2E, 'jak WZR-001/S1'),
 'BR-WZR-007/S3': (C, 'brak', DAT, '„nie ma treści wzoru” niemierzalne. Brzmienie: „strona zwraca 401/403 albo po zapisie nie ma tekstu ani obrazu”'),
 'BR-WZR-007/S4': (T, 'brak', RNTL, 'adapter sieci „brak połączenia”'),
 'BR-WZR-008/S1': (C, 'brak', E2E, 'gest palcem po PDF w E2E; trwałość adnotacji w dane-node'),
 'BR-WZR-008/S2': (T, 'brak', DAT, 'plik wzoru niezmieniony: skrót pliku przed i po'),
 'BR-WZR-008/S3': (C, 'BR-WZR-004', E2E, ''),
 # DAN
 'BR-DAN-001/S1': (T, 'NFR-DAN-002', E2E, 'zabicie procesu po każdej zmianie; logika zapisu też w dane-node (ADR-0002)'),
 'BR-DAN-002/S1': (C, 'NFR-DAN-003', DAT, 'symulowany transport; prawdziwy iCloud: ryzyko szczątkowe (docs/brd/wymagania.md:84)'),
 'BR-DAN-002/S2': (T, 'NFR-DAN-003', DAT, ''),
 'BR-DAN-002/S3': (T, 'NFR-PRY-001', DAT, 'szpieg adaptera sieci: 0 wywołań'),
 'BR-DAN-003/S1': (T, 'NFR-DAN-001', DAT, 'test migracji w transakcji na kopii bazy; wyjątek P-070 (0.1.0 bez migracji)'),
 'BR-DAN-003/S2': (T, 'NFR-DAN-001', DAT, 'wstrzyknięty błąd migracji; komunikat zamiast pustej listy (RNTL)'),
 'BR-DAN-004/S1': (C, 'OG-10', DEV, 'odtworzenie z kopii iCloud tylko urządzenie; automat: plik bazy w katalogu objętym kopią (bez isExcludedFromBackup)'),
 'BR-DAN-005/S1': (T, 'brak', DAT, ''),
 'BR-DAN-005/S2': (T, 'L-07 (S-09), KP-02', DOM, ''),
 'BR-DAN-006/S1': (T, 'brak', DAT, 'obieg eksport → import, porównanie rekordów'),
 'BR-DAN-006/S2': (T, 'brak', DAT, ''),
 'BR-DAN-006/S3': (T, 'P-047', DAT, ''),
 'BR-DAN-006/S4': (T, 'P-047', DAT, ''),
 'BR-DAN-006/S5': (T, 'brak', DAT, ''),
 'BR-DAN-008/S1': (T, 'P-026', DAT, 'zegar wstrzykiwany'),
 'BR-DAN-008/S2': (T, 'P-026', DAT, 'informacja o terminie przy usuwaniu → RNTL'),
 'BR-DAN-008/S3': (T, 'P-047', DAT, ''),
 'BR-DAN-008/S4': (T, 'P-047', DAT, ''),
 'BR-DAN-009/S1': (C, 'KP-05', DAT, 'usunięcie w iCloud: mock CloudKit; prawdziwe konto: ryzyko szczątkowe'),
 'BR-DAN-010/S1': (T, 'NFR-PRY-001', RNTL, 'lista pól diagnostyki i brak treści projektów'),
 'BR-DAN-010/S2': (C, 'brak', RNTL, 'arkusz udostępniania systemowy: mock; „nie wysyła niczego sama” → szpieg sieci'),
 'BR-DAN-010/S3': (T, 'brak', DAT, ''),
 'BR-DAN-011/S1': (T, 'brak', RNTL, 'stan wstrzyknięty'),
 'BR-DAN-011/S2': (T, 'brak', RNTL, ''),
 'BR-DAN-012/S1': (C, 'S-39; OG-15', RNTL, 'mock requestReview: 1 wywołanie po zamknięciu karty; czy system pokaże: poza kontrolą. Chwila prośby: OP-33 otwarte (docs/brd/README.md:123)'),
 'BR-DAN-012/S2': (T, 'brak', RNTL, '0 wywołań w wymienionych czynnościach'),
 'BR-DAN-012/S3': (T, 'S-39', RNTL, 'mock Linking: URL z action=write-review'),
 # ZAK
 'BR-ZAK-001/S1': (C, 'W-02', DOM, 'logika dostępu w Node; realna reinstalacja: TestFlight (docs/monetyzacja.md:586)'),
 'BR-ZAK-001/S2': (T, 'W-03, W-18; L-10 (L-13 opisowy, docs/monetyzacja.md:156)', DOM, 'L-13 nie ma wektora w wektory-limitu.json (opis pliku: poza funkcją)'),
 'BR-ZAK-001/S3': (C, 'W-09; KP-08', DOM, 'TestFlight (docs/monetyzacja.md:588)'),
 'BR-ZAK-001/S4': (C, 'L-10, L-18; OP-22', DEV, 'odczyt Pro na zegarku: ADR-0009; brak wektora W dla zegarka'),
 'BR-ZAK-001/S5': (C, 'W-10', DEV, 'Family Sharing tylko TestFlight (docs/monetyzacja.md:591)'),
 'BR-ZAK-001/S6': (C, 'W-14; KP-02', DOM, 'realne odebranie: TestFlight'),
 'BR-ZAK-002/S1': (C, 'NFR-PRY-001; KP-11', DAT, 'przegląd zależności (lista SDK) + szpieg sieci w testach; etykieta App Privacy: rola 10'),
 'BR-ZAK-003/S1': (T, 'W-15/W-17; KP-01', DOM, ''),
 'BR-ZAK-003/S2': (T, 'KP-01 (LIMIT_DNI ≥ poprzednie wydanie)', DOM, 'kontrola przed wydaniem: porównanie LIMIT_DNI i listy „zawsze działa” z poprzednim tagiem'),
 'BR-ZAK-004/S1': (T, 'KP-04', RNTL, ''),
 'BR-ZAK-005/S1': (T, 'L-01', DOM, ''),
 'BR-ZAK-005/S2': (T, 'L-02', DOM, ''),
 'BR-ZAK-005/S3': (T, 'L-04, L-04b', DOM, ''),
 'BR-ZAK-005/S4': (T, 'L-03; Z-02', DOM, ''),
 'BR-ZAK-005/S5': (T, 'L-08; S-06', DOM, ''),
 'BR-ZAK-005/S6': (T, 'L-06', DOM, ''),
 'BR-ZAK-005/S7': (T, 'S-09 (L-07 opisowy)', DOM, 'L-07 nie ma wektora startDnia; pokrywa S-09 + test „kalkulator nie woła strażnika”'),
 'BR-ZAK-005/S8': (T, 'L-05', DOM, ''),
 'BR-ZAK-005/S9': (T, 'L-10', DOM, ''),
 'BR-ZAK-005/S10': (T, 'L-11', DOM, ''),
 'BR-ZAK-005/S11': (T, 'S-02', DOM, ''),
 'BR-ZAK-005/S12': (T, 'S-07, S-08', DOM, ''),
 'BR-ZAK-005/S13': (C, 'L-18', DOM, 'reguła w Node; UI zegarka E2E para symulatorów albo urządzenie'),
 'BR-ZAK-005/S14': (T, 'L-16, L-17; KP-15', DOM, ''),
 'BR-ZAK-005/S15': (T, 'L-15', DOM, ''),
 'BR-ZAK-006/S1': (T, 'Z-02; KP-13; tekst docs/design/design-spec.md:16', RNTL, 'zrzut wzorcowy `limit-zawczasu`'),
 'BR-ZAK-006/S2': (T, 'Z-03; L-04', RNTL, ''),
 'BR-ZAK-006/S3': (T, 'L-03; tekst docs/design/design-spec.md:17', RNTL, 'zrzut wzorcowy `limit`'),
 'BR-ZAK-006/S4': (T, 'KP-10, KP-13', E2E, 'przejście przepływów bez ekranu zakupu'),
 'BR-ZAK-006/S5': (T, 'Z-07; KP-13', RNTL, ''),
 'BR-ZAK-006/S6': (T, 'Z-06', RNTL, 'brak zrzutu wzorcowego (tekst w docs/design/design-spec.md:18)'),
 'BR-ZAK-006/S7': (C, 'W-15; KP-03, KP-14', RNTL, 'showManageSubscriptions: mock; stan „do E4” w macierzy (docs/design/design-spec.md:56)'),
 'BR-ZAK-007/S1': (T, 'L-09', DOM, ''),
 'BR-ZAK-007/S2': (T, 'W-05, W-06, W-16; KP-02', DOM, 'tabela „tylko telefon” (docs/monetyzacja.md:591–592) ma oczekiwanie „dane do odczytu” z modelu B — sprzeczne z KP-02 V4'),
 # ZAP
 'BR-ZAP-001/S1': (T, 'RD-03-W1; JW-yd-437', DOM, 'format wyświetlania (2 miejsca) nieokreślony w RD'),
 'BR-ZAP-001/S2': (T, 'OG-13, OP-11', RNTL, 'asercja: brak grafik symboli'),
 'BR-ZAP-002/S1': (T, 'brak (wartości w scenariuszu)', DAT, 'U-9'),
 'BR-ZAP-003/S1': (T, 'RD-11-W2; DRT-M03250', DOM, ''),
 'BR-ZAP-004/S1': (T, 'RD-10 (kategorie)', DAT, ''),
 'BR-ZAP-004/S2': (T, 'NFR-OFF-001', E2E, ''),
 # KAL
 'BR-KAL-001/S1': (T, 'RD-01-W1', DOM, 'przegląd 06 wykonany (docs/tresci/README.md:2)'),
 'BR-KAL-001/S2': (T, 'RD-01-W5', DOM, ''),
 'BR-KAL-001/S3': (T, 'RD-01-W2', DOM, ''),
 'BR-KAL-003/S1': (C, 'RD-04-W1; KL10-* (docs/tresci/wektory.json:1526)', DOM, 'liczba tak; „sposób pokazania zależy od OP-03” — w BRD otwarte (docs/brd/README.md:103), rozstrzygnięte P-081 P3a (docs/decyzje.md:87); BRD do aktualizacji'),
 'BR-KAL-003/S2': (T, 'RD-03-W3; JW-oz-3_5', DOM, ''),
 'BR-KAL-008/S1': (T, 'RD-10-W2; KL4-23', DOM, 'P-084 zaokrągla próbkę przed klasyfikacją; reguly.md:157 („luka 25,5 → poza tabelą”) sprzeczne z KL4-25_5 → [2]'),
 # DNI
 'BR-DNI-001/S1': (T, 'RD-16', DAT, ''),
 'BR-DNI-001/S2': (T, 'RD-15', DAT, ''),
 'BR-DNI-001/S3': (T, 'RD-15, RD-16; L-04, L-06', DAT, ''),
 'BR-DNI-001/S4': (T, 'P-043', RNTL, 'asercja negatywna + brak zaplanowanych powiadomień'),
 'BR-DNI-002/S1': (T, 'brak (wartości w scenariuszu)', DAT, ''),
 'BR-DNI-002/S2': (T, 'RD-16-W1', DOM, 'strefa czasowa wstrzykiwana'),
 'BR-DNI-003/S1': (T, 'brak (wartości w scenariuszu)', DAT, 'początek tygodnia z regionu (Intl/CLDR, ADR-0017)'),
 'BR-DNI-003/S2': (T, 'brak', RNTL, ''),
 'BR-DNI-004/S1': (T, 'RD-14-W1', DOM, ''),
 'BR-DNI-004/S2': (T, 'RD-14-W4', DOM, ''),
 'BR-DNI-004/S3': (T, 'RD-14-W6', RNTL, ''),
 'BR-DNI-005/S1': (T, 'RD-15-W1', DOM, ''),
 'BR-DNI-005/S2': (T, 'RD-15', DOM, ''),
 'BR-DNI-005/S3': (T, 'RD-15', DOM, ''),
 'BR-DNI-005/S4': (T, 'RD-15-W4', DOM, ''),
 'BR-DNI-005/S5': (T, 'P-046', RNTL, ''),
 'BR-DNI-006/S1': (C, 'RD-15', DAT, 'kolejność dla dwóch projektów z terminem: według celu na dziś malejąco? Reguła sortowania nie jest zapisana w RD-15 ani BR. Brzmienie: „projekty z terminem według celu na dziś malejąco, potem bez terminu według ostatniej pracy”'),
 'BR-DNI-006/S2': (T, 'RD-15-W4', DAT, ''),
 'BR-DNI-006/S3': (T, 'BR-PRJ-012', DAT, ''),
}

# --- wymagania przekrojowe NFR z docs/brd/wymagania.md ---
NFR = [
 ('NFR-DAN-001', 'Zero utraty danych przy aktualizacji', T, 'próg 0; P-070', DAT, 'F-31', 'migracja w transakcji na kopii bazy'),
 ('NFR-DAN-002', 'Każda zmiana licznika zapisana trwale', T, 'próg 0', E2E, 'F-31', 'zabicie procesu po każdej zmianie; także dane-node'),
 ('NFR-DAN-003', 'Synchronizacja nie zmienia liczby bez wiedzy', C, 'próg 0; RYZ-02', DAT, 'F-27', 'dwie instancje magazynu i zegarek z symulowanym transportem; iCloud między urządzeniami: ryzyko szczątkowe'),
 ('NFR-OFF-001', 'Działanie bez sieci', T, 'próg 100% PR-01–07, 10–12, 14', E2E, '—', 'adapter sieci „brak połączenia”; PR-12 poza zakresem'),
 ('NFR-PIE-001', 'Pierwsze liczenie bez przeszkód', T, '1 stuknięcie, 0 ekranów; L-01, Z-01', E2E, 'F-01', 'z datą 1. i ostatniego dnia miesiąca'),
 ('NFR-PRY-001', 'Brak zbierania danych', C, '„Data Not Collected”, 0 SDK', DAT, 'F-36', 'automat: lista zależności wobec listy dozwolonych; etykieta: rola 10 (przegląd, nie test)'),
 ('NFR-DOS-001', 'VoiceOver w głównych przepływach', C, '100% elementów PR-01–05', E2E, '—', 'performAccessibilityAudit + RNTL etykiety; odbiór przez osobę: ryzyko szczątkowe'),
 ('NFR-DOS-002', 'Duży tekst', N, 'próg [DO USTALENIA] OP-16', E2E, '—', 'bez progu brak wyroczni; propozycja: „0 obciętych i nakładających się tekstów przy AX5 na ekranach PR-01–06” wobec zrzutów wzorcowych (docs/design/design-spec.md:9)'),
 ('NFR-WYD-001', 'Reakcja licznika', N, 'próg [DO USTALENIA] OP-17', E2E, 'F-01', 'budżet „po pomiarze bazowym” (docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md:30); propozycja: p95 z 20 powtórzeń ≤ pomiar bazowy × 1,2 jako regresja'),
 ('NFR-ZEG-001', 'Zgodność zegarka i telefonu', C, 'różnica 0 po synchronizacji', DOM, 'F-12', 'symulowany transport; para symulatorów „jeśli CI pozwala”; prawdziwy zegarek: ryzyko szczątkowe'),
 ('NFR-SYS-001', 'Działanie po premierze nowego iOS/watchOS', C, '0 przepływów; czas [DO USTALENIA] OP-26', E2E, '—', 'minimalne wersje w ADR-0006; czas poprawki otwarty (docs/decyzje.md:76)'),
 ('NFR-JEZ-001', '35 lokalizacji', T, '100% kluczy', DOM, '—', 'kontrola katalogu tłumaczeń (rola 09); tłumaczenia późno (CLAUDE.md)'),
 ('NFR-KOS-001', 'Koszt stały 0 zł', N, '0 zł', '—', '—', 'przegląd usług w ADR, nie test automatyczny; propozycja: kontrola listy zależności sieciowych/usług w CI'),
]
nfr_lines = {}
for i, l in enumerate(open(f'{REPO}/docs/brd/wymagania.md'), 1):
    m = re.match(r'### (NFR-[A-Z]+-\d+)', l)
    if m: nfr_lines[m.group(1)] = i

# --- KP z docs/monetyzacja.md (wersja obowiązująca) ---
KP = [
 ('KP-01', 'Limit darmowy tylko się luzuje; nic darmowego za zaporę', T, 'LIMIT_DNI wobec poprzedniego wydania', DOM, 'docs/monetyzacja.md:50', 'kontrola przed wydaniem (07)'),
 ('KP-02', 'Utrata Pro: wraca limit; dane, historia, eksport zawsze', T, 'W-05, W-06, W-14, W-16; L-09', DOM, 'docs/monetyzacja.md:51', 'wersja V4; wersja sesji 2 (docs/monetyzacja.md:539) nieaktualna'),
 ('KP-03', 'Aktywna subskrypcja: ekran nie oferuje tej samej; dożywotni z informacją', T, 'W-15, W-17', RNTL, 'docs/monetyzacja.md:52', ''),
 ('KP-04', 'Polityka prywatności i Terms of Use w aplikacji i metadanych', C, 'BR-ZAK-004', RNTL, 'docs/monetyzacja.md:53', 'metadane: rola 11, przegląd'),
 ('KP-05', '„Usuń wszystkie dane” nie usuwa zakupu', C, 'W-02', DOM, 'docs/monetyzacja.md:542', 'potwierdzenie z tekstem (RNTL); TestFlight (docs/monetyzacja.md:590)'),
 ('KP-06', 'Dostęp z transakcji sklepu; pamięć podręczna tylko ostatni odczyt', T, 'W-03, W-04, W-11, P-01–P-06', DOM, 'docs/monetyzacja.md:543', ''),
 ('KP-07', 'Nasłuch transakcji od startu', C, 'brak', RNTL, 'docs/monetyzacja.md:544', 'mock adaptera: listener zarejestrowany przy starcie'),
 ('KP-08', 'Przywracanie tylko po stuknięciu', T, 'W-02, W-07', RNTL, 'docs/monetyzacja.md:545', 'mock: restore wołane tylko z akcji'),
 ('KP-09', 'Cena ze sklepu, nie z kodu', T, 'brak', RNTL, 'docs/monetyzacja.md:546', 'kontrola statyczna: brak literałów cen w kodzie i tłumaczeniach'),
 ('KP-10', 'Ekran zakupu tylko po działaniu; nigdy w PR-02, PR-05, przy pierwszym uruchomieniu', T, 'zawężone KP-13', E2E, 'docs/monetyzacja.md:547', ''),
 ('KP-11', 'Bez SDK analityki w ścieżce zakupu', T, 'NFR-PRY-001', DAT, 'docs/monetyzacja.md:548', 'lista zależności; zakaz verifyPurchaseWithProvider itd. (docs/monetyzacja.md:571)'),
 ('KP-12', 'Strażnik tylko w startDnia(), wolaStraznika()', T, 'S-01–S-10, L-01–L-18', DOM, 'docs/monetyzacja.md:54', ''),
 ('KP-13', 'Ekran zakupu tylko z komunikatu limitu i Ustawień; limit zawczasu', T, 'Z-01–Z-08', RNTL, 'docs/monetyzacja.md:55', ''),
 ('KP-14', '„Zarządzaj subskrypcją” w aplikacji', C, 'brak', RNTL, 'docs/monetyzacja.md:56', 'mock showManageSubscriptions'),
 ('KP-15', 'Dni z robótką w danych synchronizowanych; scalenie nie odbiera dnia', T, 'L-11, L-14, L-16, L-17, L-18', DAT, 'docs/monetyzacja.md:57', ''),
]

TYLKO_TEL = [
 ('TT-1', 'zakup Pro w TestFlight', 'W-01', 'docs/monetyzacja.md:585'),
 ('TT-2', 'reinstalacja, start bez „Przywróć”', 'W-02', 'docs/monetyzacja.md:586'),
 ('TT-3', 'tryb samolotowy po zakupie, zabicie i start', 'W-03', 'docs/monetyzacja.md:587'),
 ('TT-4', 'iPad z tym samym kontem, „Przywróć”', 'W-09', 'docs/monetyzacja.md:588'),
 ('TT-5', 'inne konto piaskownicy, „Przywróć”', 'W-07', 'docs/monetyzacja.md:589'),
 ('TT-6', '„Usuń wszystkie dane”, potem „Przywróć”', 'W-02', 'docs/monetyzacja.md:590'),
 ('TT-7', 'członek rodziny, potem odebranie', 'W-10, W-14', 'docs/monetyzacja.md:591'),
 ('TT-8', 'zwrot', 'W-05, W-06; OP-21', 'docs/monetyzacja.md:592'),
 ('TT-9', 'zegarek bez telefonu', 'brak (OP-22)', 'docs/monetyzacja.md:593'),
]

# --- składanie wyników ---
inscope = sorted(set(br2f) | set(EXTRA), key=lambda b: (b.split('-')[1], b))
rows = []
missing_ann = []
for s in scen:
    b = s['br']
    if b not in inscope: continue
    f = br2f.get(b, EXTRA.get(b, ('—',))[0])
    a = A.get(s['id'])
    if not a:
        missing_ann.append(s['id']); a = ('?', '?', '?', '')
    rows.append(dict(id=s['id'], br=b, f=f, modul=MODUL[b.split('-')[1]], tytul=f"{brinfo[b]['tytul']}: {s['scen']}",
                     sprawdzalne=a[0], wyrocznia=a[1], poziom_sugerowany=a[2], uwagi=a[3], plik=s['plik'], rodzaj='BR'))
for (i, t, sp, wy, po, f, uw) in NFR:
    rows.append(dict(id=i, br=i, f=f, modul='przekrojowe (NFR)', tytul=t, sprawdzalne=sp, wyrocznia=wy, poziom_sugerowany=po, uwagi=uw,
                     plik=f'docs/brd/wymagania.md:{nfr_lines.get(i, "?")}', rodzaj='NFR'))
for (i, t, sp, wy, po, pl, uw) in KP:
    rows.append(dict(id=i, br='BR-ZAK (kontrakt płatności)', f='F-35', modul='zakup i limit (KP)', tytul=t, sprawdzalne=sp, wyrocznia=wy,
                     poziom_sugerowany=po, uwagi=uw, plik=pl, rodzaj='KP'))
for (i, t, wy, pl) in TYLKO_TEL:
    rows.append(dict(id=i, br='BR-ZAK-001/007', f='F-35', modul='zakup (tylko telefon)', tytul=t, sprawdzalne='nie' if i == 'TT-9' else 'czesciowo',
                     wyrocznia=wy, poziom_sugerowany=DEV, uwagi='krok właściciela w TestFlight (P-041: brak testów ręcznych — konflikt do rozstrzygnięcia)' + ('; OP-21 otwarte' if i == 'TT-8' else '') + ('; OP-22 → ADR-0009' if i == 'TT-9' else '') + ('; oczekiwanie „dane do odczytu” z modelu B, w V4 pełne dane (KP-02)' if i in ('TT-7', 'TT-8') else ''),
                     plik=pl, rodzaj='tylko-telefon'))

if missing_ann:
    print('BRAK ADNOTACJI:', missing_ann, file=sys.stderr); sys.exit(1)

# --- wektory ---
brd = json.load(open(f'{REPO}/tests/wektory/brd.json'))
rd = collections.OrderedDict()
for v in brd: rd.setdefault(v['regula'], []).append(v['id'])
rd_lines = {}
for i, l in enumerate(open(f'{REPO}/docs/brd/reguly.md'), 1):
    m = re.match(r'### (RD-\d+): (.*)', l)
    if m: rd_lines[m.group(1)] = (i, m.group(2))
krytyczne = {'RD-01', 'RD-02', 'RD-03', 'RD-04', 'RD-07', 'RD-08', 'RD-10'}
rd_br = collections.defaultdict(set)
for f in glob.glob(f'{REPO}/docs/brd/wymagania-*.md'):
    br = None
    for l in open(f):
        m = re.match(r'### (BR-[A-Z]+-\d+)', l)
        if m: br = m.group(1)
        elif l.startswith('## '): br = None
        for r in re.findall(r'RD-\d+', l):
            if br: rd_br[r].add(br)
lim = json.load(open(f'{REPO}/docs/monetyzacja/wektory-limitu.json'))
dos = json.load(open(f'{REPO}/docs/monetyzacja/wektory-dostepu.json'))
tre = json.load(open(f'{REPO}/docs/tresci/wektory.json'))

json.dump(rows, open(f'{OUT}/kryteria.json', 'w'), ensure_ascii=False, indent=1)

# --- statystyki ---
brs = [r for r in rows if r['rodzaj'] == 'BR']
cnt = collections.Counter(r['sprawdzalne'] for r in rows)
cntb = collections.Counter(r['sprawdzalne'] for r in brs)
lvl = collections.Counter(r['poziom_sugerowany'] for r in rows)
br_without = [b for b in inscope if not any(r['br'] == b for r in brs)]
stats = dict(br=len(inscope), f=len(mvp), scen=len(brs), all=len(rows), cnt=cnt, cntb=cntb, lvl=lvl, br_without=br_without)
json.dump(dict(stats={k: (dict(v) if isinstance(v, collections.Counter) else v) for k, v in stats.items()}), open(f'{OUT}/stats.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: (dict(v) if isinstance(v, collections.Counter) else v) for k, v in stats.items()}, ensure_ascii=False))

# --- markdown ---
def esc(s): return str(s).replace('|', '\\|')
L = []
P = L.append
P('# Inwentarz kryteriów akceptacji: wersja 1 (MVP)')
P('Rola 07-jakość, E0 (pomocnik) · 2026-10-25 · Źródła: `docs/scope-contract.md`, `docs/brd/`, `tests/wektory/brd.json`, `docs/design/`, `docs/monetyzacja.md` z wektorami, `docs/tresci/`. Kwarantanna: nie czytano `archiwum/`, `app/`, `src/`, `lib/`, `tests/` (poza `tests/wektory/brd.json`), `scripts/`, `site/`, `.maestro/`. Ocena „sprawdzalne” i „poziom” to [OCENA] roli 07.')
P('')
P('## Podsumowanie liczb')
P(f'- Funkcje MVP w kontrakcie zakresu: **{len(mvp)}** (docs/scope-contract.md:204 „MVP 49”).')
P(f'- BR w zakresie: **{len(inscope)}** = {len(br2f)} z kolumny „Wymagania” funkcji MVP + {len(EXTRA)} spoza tabeli (BR-ZAK-005, BR-ZAK-006, BR-ZAK-007 — blokery wydania, docs/brd/README.md:43; BR-DAN-012 — pętla opinii, docs/scope-contract.md:11).')
P(f'- Kryteria razem: **{len(rows)}** = {len(brs)} scenariuszy BR + {len(NFR)} NFR + {len(KP)} KP + {len(TYLKO_TEL)} scenariuszy „tylko telefon”.')
P(f'- Sprawdzalne (wszystkie kryteria): tak **{cnt["tak"]}**, częściowo **{cnt["czesciowo"]}**, nie **{cnt["nie"]}**. Same scenariusze BR: tak {cntb["tak"]}, częściowo {cntb["czesciowo"]}, nie {cntb["nie"]}.')
P(f'- Poziom sugerowany: ' + ', '.join(f'{k} **{v}**' for k, v in sorted(lvl.items(), key=lambda x: -x[1])) + f'. Wymaga symulatora albo urządzenia: **{lvl[E2E] + lvl[DEV]}** (E2E-symulator {lvl[E2E]}, tylko-urządzenie {lvl[DEV]}).')
P(f'- BR w zakresie bez kryteriów (scenariuszy): ' + (', '.join(br_without) if br_without else '**brak** (każde BR w zakresie ma co najmniej 1 scenariusz)') + '.')
P(f'- Wektory: RD w `tests/wektory/brd.json` {len(brd)} w {len(rd)} regułach (README BRD podaje 71 w 13 RD na E4, docs/brd/README.md:28; po ER-11/ER-12 doszły RD-14–RD-18); limit L {len(lim["startDnia"])}, S {len(lim["wolaStraznika"])}, Z {len(lim["mozeZaczacDzien"])}; dostęp W {len(dos["decyzja"])}, P {len(dos["odczytajPamiec"])}; treści {sum(len(tre[k]) for k in ["klasyfikacja_4in","klasyfikacja_10cm","jednostki","druty","szydelka"])}.')
P('')
P('## Luki i sprzeczności (do decyzji koordynatora albo ER)')
P('### Kryteria niesprawdzalne albo niejednoznaczne → propozycja brzmienia')
for r in rows:
    if r['sprawdzalne'] == 'nie' or ('Brzmienie' in r['uwagi']) or ('niejednoznaczne' in r['uwagi']) or ('niemierzalne' in r['uwagi']):
        P(f"- **{r['id']}** ({r['plik']}): {r['uwagi']}")
P('')
P('### Zakres i dokumenty niespójne')
G = [
 'BR-ZAK-005–007 i BR-DAN-012 są w wersji 1 (blokery, pętla opinii), ale nie ma ich w kolumnie „Wymagania” tabeli zakresu ani w przekazaniu dla 07 (docs/scope-contract.md:47, :219 wymienia tylko BR-ZAK-001–004). Propozycja: przypisać do F-35 / F-57 przez bramkę `zmiany-zakresu`.',
 'Tabela „tylko telefon” (docs/monetyzacja.md:581–593) pochodzi z sesji 2 (model B): oczekiwanie „Pro znika, dane do odczytu” (:591, :592) przeczy KP-02 V4 (docs/monetyzacja.md:51: dane, historia, eksport zawsze dostępne). Brak scenariuszy TestFlight dla subskrypcji (W-15–W-18). ER do 02.',
 'P-041 (testy tylko automatyczne, docs/scope-contract.md:219) a scenariusze „tylko telefon” jako krok właściciela (docs/monetyzacja.md:581): sprzeczność metody do rozstrzygnięcia przez koordynatora.',
 'Przekazanie 02 → 07 mówi „L-01–L-15” i „14 z 14 wektorów” (docs/monetyzacja.md:88, :31), a `wektory-limitu.json` ma 17 wektorów startDnia (L-01…L-18 bez L-07, L-13; z L-04b) + S-01–S-10 + Z-01–Z-08. L-07 i L-13 nie mają wektora (opis pliku: docs/monetyzacja/wektory-limitu.json:2), choć BR je cytują (wymagania-dane.md:62, :194, :273).',
 'RD-10: tekst reguły „luka (np. 25,5) daje poza tabelą” (docs/brd/reguly.md:157) przeczy P-084 i wektorowi treści KL4-25_5 → kategoria 2 (docs/tresci/wektory.json; docs/decyzje.md:90). ER do 01; wyrocznią dla testów klasyfikacji są wektory treści.',
 'OP-03 w BRD otwarte (docs/brd/README.md:103, wymagania-narzedzia.md:90), a rozstrzygnięte w P-081 P3a (docs/decyzje.md:87). BR-KAL-003/S1 do aktualizacji przez 01.',
 'BR-LIC-012 (tryb „rząd w trakcie”, F-09) a design: ekran licznika zawsze pokazuje „Now knitting row N” obok liczby skończonych (docs/design/design-spec.md:30). Czy ustawienie F-09 zostaje? 04/03.',
 'BR-LIC-005/S2 zakłada dźwięki aplikacji i ich wyłączenie; w design brak dźwięków i przełącznika (nie znaleziono). 01/04.',
 'BR-LIC-020/S2 („wzór przypisany do zdarzenia”) a F-48 „tylko dwa wzorce” (docs/scope-contract.md:58).',
 'NFR-DOS-002 i NFR-WYD-001 bez progu (OP-16, OP-17; docs/brd/README.md:116–117); budżety wydajności „po pomiarze bazowym” (docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md:25–36).',
 'OP-33 (chwila prośby o ocenę, docs/brd/README.md:123) otwarte; przejście poznawcze sugeruje kolejne uruchomienie (docs/design/przejscie/wynik.md:30).',
 'OP-21 (zwrot w piaskownicy bez Xcode, docs/monetyzacja.md:971) i OP-22 (Pro na zegarku, docs/brd/README.md:120; ADR-0009 go wymienia — nie czytano treści) otwarte.',
 'U-1–U-12 (uproszczenia przepływów) zdefiniowane tylko w prywatnym `oczko-warsztat` (docs/scope-contract.md:8): w `docs/` nie znaleziono ich treści, więc kryteria intuicyjności odwołujące się do U-n nie mają wyroczni w tym repo.',
]
for g in G: P(f'- {g}')
P('')
P('### Stany ekranów brakujące w design')
P('Macierz stanów (docs/design/design-spec.md:51–57) i zrzuty wzorcowe: 7 stanów × 12 wariantów = 84 pliki (`docs/design/wzorce-zrzuty/`: licznik-start, licznik-w-toku, limit, limit-zawczasu, oferty, projekty, ukonczenie; 320/390/430 pt × jasny/ciemny × domyślny/AX5).')
P('- Stany w macierzy bez zrzutu wzorcowego (tylko prototyp albo tekst): licznik zablokowany, seria stuknięć z banerem, błąd zapisu („do E4”), offline; projekty pusty i brak wyników; oferty z aktywną subskrypcją („do E4”) i bez sieci; ukończenie bez włóczki w zapasie (docs/design/design-spec.md:54–57).')
P('- Ekrany nienarysowane (docs/design/design-spec.md:95): wzór i licznik poziomo (F-25, F-26, F-56), zegarek (F-12), ekran blokady (F-11, F-21), kalendarz i podsumowanie (F-59), Ustawienia (eksport, kopia, polityka, „Oceń”, „Zgłoś problem”).')
P('- Stany wymagane przez BR, których nie znaleziono w macierzy: cel osiągnięty i „ponad cel” (BR-LIC-011), przypomnienie 5 z 5 / koniec serii (BR-LIC-009), ostatni darmowy dzień — tylko tekst (BR-ZAK-006/S6, design-spec.md:18), zegarek na limicie (BR-ZAK-005/S13), konflikt synchronizacji (BR-DAN-002/S2), nieudana migracja (BR-DAN-003/S2), import „scal / zastąp” i plik nierozpoznany (BR-DAN-006), „Recently deleted” (BR-DAN-008), stan danych sync/zegarek (BR-DAN-011), podgląd „Zgłoś problem” (BR-DAN-010), błąd wpisania wartości (BR-LIC-017/S7), bliźniak i cel z pierwszej części (BR-PRJ-014), korekta sesji z błędem (BR-PRJ-013/S3), błąd importu wzoru i strony (BR-WZR-001/S2, BR-WZR-007/S3), błędy obliczeń (BR-KAL-001/S2–S3), postęp bez celów (BR-DNI-004/S3), termin minął (BR-DNI-005/S4, BR-DNI-006/S2), karta bez stopera (BR-PRJ-015/S3).')
P('- Przejście poznawcze: 5 zadań z1–z5 (docs/design/przejscie/wynik.md:4–12); intuicyjność „czeka na 04” dla F-25/F-26, F-12, F-11/F-21, F-59 (wynik.md:25).')
P('')
P('## Blokery wydania (docs/brd/README.md:35–48) w zakresie')
P('NFR-DAN-001/BR-DAN-003; NFR-DAN-002/BR-DAN-001; NFR-DAN-003/BR-DAN-002; BR-DAN-004–006; BR-LIC-001–003; BR-ZAK-001; BR-ZAK-005–007; BR-ZAK-002, NFR-PRY-001, BR-ZAK-004; NFR-ZEG-001 (F-12 w MVP); BR-KAL-001, -003, -008 (przegląd 06 wykonany: docs/tresci/README.md:2; BR-KAL-002, -004–007 i BR-SLO-001 poza zakresem); BR-WZR-001–005, -007, -008 (porównanie z patentami OG-07: reguła w docs/design/design-spec.md:83, makieta F-25 do ponownego przejścia); OG-05 (opis sklepu tylko z funkcjami wydania — przegląd, nie test).')
P('')
P('## Reguły RD i wektory')
P('| RD | Nazwa | Krytyczna | Wektory | ID | BR | W zakresie | Plik |')
P('|---|---|---|---|---|---|---|---|')
for r, ids in rd.items():
    ln, nm = rd_lines[r]
    brl = sorted(rd_br.get(r, []))
    inz = 'tak' if any(b in inscope for b in brl) else 'nie'
    P(f'| {r} | {esc(nm)} | {"tak" if r in krytyczne else "nie"} | {len(ids)} | {ids[0]}…{ids[-1]} | {", ".join(brl)} | {inz} | docs/brd/reguly.md:{ln} |')
P('')
P('## Wektory kontraktu płatności i treści')
P('| Plik | Grupa | Liczba | ID | Dotyczy |')
P('|---|---|---|---|---|')
P(f'| docs/monetyzacja/wektory-limitu.json:7 | startDnia | {len(lim["startDnia"])} | ' + ', '.join(v['id'] for v in lim['startDnia']) + ' | BR-ZAK-005, -007, BR-LIC-017, BR-DNI-001; KP-12, KP-15 |')
P(f'| docs/monetyzacja/wektory-limitu.json:622 | wolaStraznika | {len(lim["wolaStraznika"])} | S-01…S-10 | KP-12, BR-ZAK-005 (P-067) |')
P(f'| docs/monetyzacja/wektory-limitu.json:724 | mozeZaczacDzien | {len(lim["mozeZaczacDzien"])} | Z-01…Z-08 | KP-13, BR-ZAK-006, NFR-PIE-001 |')
P(f'| docs/monetyzacja/wektory-dostepu.json:11 | decyzja | {len(dos["decyzja"])} | W-01…W-18 | BR-ZAK-001, -003, -007; KP-02, -03, -06 |')
P(f'| docs/monetyzacja/wektory-dostepu.json:423 | odczytajPamiec | {len(dos["odczytajPamiec"])} | P-01…P-06 | KP-06 |')
for k, ln, what in [('klasyfikacja_4in', 4, 'RD-10, P-084; BR-KAL-008, BR-ZAP-004'), ('klasyfikacja_10cm', 1526, 'RD-04 + RD-10, P-084 (P3a); BR-KAL-003, -008'), ('jednostki', 1851, 'RD-03; BR-ZAP-001, BR-KAL-003'), ('druty', 1930, 'RD-11; BR-PRJ-004, BR-ZAP-003'), ('szydelka', 2178, 'RD-11 (szydełka zwykłe); BR-PRJ-004, BR-ZAP-003')]:
    ids = [x['id'] for x in tre[k]]
    P(f'| docs/tresci/wektory.json:{ln} | {k} | {len(ids)} | {ids[0]}…{ids[-1]} | {what} |')
P('')
P('## Kryteria (pełna lista; JSON: `kryteria.json`)')
P('| ID | BR | F | Moduł | Tytuł | Sprawdzalne | Wyrocznia | Poziom | Uwagi | Plik:linia |')
P('|---|---|---|---|---|---|---|---|---|---|')
for r in rows:
    P('| ' + ' | '.join(esc(r[k]) for k in ['id', 'br', 'f', 'modul', 'tytul', 'sprawdzalne', 'wyrocznia', 'poziom_sugerowany', 'uwagi', 'plik']) + ' |')
P('')
P('## Funkcje MVP → BR')
P('| F | Funkcja | BR | Plik:linia |')
P('|---|---|---|---|')
for f, r in sorted(mvp.items(), key=lambda x: int(x[0][2:])):
    P(f"| {f} | {esc(r['nazwa'])} | {', '.join(r['br'])} | docs/scope-contract.md:{r['linia']} |")
open(f'{OUT}/kryteria.md', 'w').write('\n'.join(L) + '\n')
