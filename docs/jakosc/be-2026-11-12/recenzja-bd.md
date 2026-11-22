# Audyt: Programista — Oczko — 2026-11-12 (recenzja niezależna BD: 07 fix JAK-05/JAK-17)
Commit: 7e86bfa1 (zakres `562dfc4..7e86bfa1`, 11 plików) · Tryb: audit (recenzja niezależna, sesja BE) · Środowisko: Linux 6.18, Node 22, `npm ci` kod 0, Jest działa; brak macOS/Xcode/Maestro — krok „Scenariusze” sprawdzony w bashu z udawanym `maestro` (harness testu BD i własne sondy), nie na symulatorze. Prompt roli przeczytany do linii `=== KONIEC PROMPTU ROLI ===`.

## Podsumowanie
**Werdykt: TAK — zmiana mieści się w zgodzie właściciela KO-054.** Porażka asercji nie jest ponawiana ani maskowana (także asercja czerwona przed awarią w tym samym podejściu: `.github/workflows/jakosc-ios.yml:391` i `.github/workflows/jakosc-ios.yml:394`), powtórzenie najwyżej raz (`.github/workflows/jakosc-ios.yml:371`), widoczne w podsumowaniu (`.github/workflows/jakosc-ios.yml:400`), limity, progi i lista scenariuszy bez zmian (`dowody/zakres-diffu.txt`, grep kod 1). Testy: na 562dfc4 czerwone z właściwego powodu (6/10 i 2/3, asercje zachowania), na 7e86bfa1 zielone (10/10, 3/3, kod 0). Brak P0/P1; trzy uwagi: ryzyko limitu czasu przy pełnym pakiecie (P2, realne tylko dla `[e2e-pelny]`), utrata śladu statusu w-ponowieniu z 1. podejścia w podsumowaniu (P3) i jeden zbyt ogólny wzorzec klasyfikatora (P3, teoretyczny).

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 08-programista-001 | P2 | D | Pełny pakiet: awaria w drugiej połowie części + pełne 2. podejście przekracza limit kroku; wtedy część nie ma wpisu w podsumowaniu | zweryfikowane (BF 928e1767) |
| 08-programista-002 | P3 | D | Status „w-ponowieniu” z 1. podejścia znika z podsumowania po powtórzeniu zestawu | zweryfikowane (BF 928e1767) |
| 08-programista-003 | P3 | D | Wzorzec „deviceInfo failed” łapie też treść porażki asercji z tymi słowami; CDATA w `<system-out>` też | zweryfikowane (BF 928e1767) |
| 08-programista-004 | P3 | D | Awaria maszyny w CDATA wewnątrz `<failure>` nierozpoznana (delta BF; fail-closed, teoretyczny) | otwarte |

## Linia bazowa i założenia
- Wzorzec: Trening e2e-ios.yml, linie 223–228 @2d97581 (przeczytany, `dowody/trening-e2e-ios-213-228.txt`): przy „iOS driver not ready in time|deviceInfo failed” w **całym logu** Maestro jedno powtórzenie zestawu, `rm -rf e2e-out` (wyniki 1. podejścia odrzucone), strażnik czasu na podejście (`guard`, alarm). Oczko jest węższe i ostrzejsze niż wzorzec: klasyfikuje tylko treść `<failure>/<error>` junit scenariusza, zachowuje porażki 1. podejścia i nie ponawia ich; nie ma strażnika czasu na podejście (patrz 001).
- Wymiary pokrycia: ścieżki zapisu — nie dotyczy (CI, bez danych użytkownika); obsługa błędów — sprawdzone (brak junit = porażka, `scripts/ci/e2e-awaria-maszyny.mjs:29`; awaria w 2. podejściu = porażka); typy na granicach — sprawdzone (junit z zewnątrz: sondy K1–K8); system projektowy, i18n, dostępność, wydajność aplikacji — nie dotyczy (zmiana w CI); testy na właściwym poziomie — sprawdzone (krok workflowu wykonywany w bashu `-e` z udawanym `maestro`, nie atrapa logiki); liczby konfiguracyjne — sprawdzone (limity bez zmian).
- Soczewki: „recenzent szukający ścieżki bez testu” — znaleziona ścieżka bez testu: ponawialny scenariusz zielony w ponowieniu przed awarią (002); „programista czytający pierwszy raz” — komentarz `.github/workflows/jakosc-ios.yml:361-364` wystarcza.
- Rejestr założeń: bez propozycji zmian.

## Pokrycie (co sprawdzono, czego nie)
| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| `.github/workflows/jakosc-ios.yml` krok „Scenariusze” (361–406) | tak, linia po linii + uruchomienie w bashu | `dowody/7e8-e2e-awaria-maszyny.txt`, `dowody/sondy.txt` |
| krok AX5 (407–421), limity kroku/joba (274, 354) | tak (bez zmian w diffie) | `dowody/zakres-diffu.txt` |
| `scripts/ci/e2e-awaria-maszyny.mjs` | tak | `dowody/sondy.txt` (K1–K8) |
| `.github/scripts/jakosc/maestro-failures.py` | tak (czytanie + testy) | `dowody/7e8-maestro-failures-przerwany.txt` |
| testy i fikstury BD | tak, na 562dfc4 i 7e86bfa1 | `dowody/562-e2e-awaria-maszyny.txt`, `dowody/562-maestro-failures-przerwany.txt`, `dowody/7e8-e2e-awaria-maszyny.txt`, `dowody/7e8-maestro-failures-przerwany.txt` |
| `CLAUDE.md`, `docs/decyzje.md` P-781–P-783 | tak (zgodność z kodem) | diff |
| przebiegi #142/#173/#182 (miejsce awarii w części) | nie — twierdzenie P-782 (3) „awaria w 1.–2. scenariuszu” niezweryfikowane | [DO USTALENIA] |
| zachowanie na prawdziwym macOS/Maestro | nie (brak macOS) | — |

## Kontrola dowodów i sekretów
`node sprawdz-raport.mjs docs/jakosc/be-2026-11-12/recenzja-bd.md . --rola 08-programista` (kopia skryptu w scratchpadzie) → kod 0: „OK: odwołania, cytaty, pliki dowodów i sekrety sprawdzone; format raportu 08-programista”.

## Stosowalność listy kontrolnej
| Pozycja | Status | Wynik |
|---|---|---|
| DEV-01 | dotyczy (logika klasyfikacji i kroku) | ok: każda gałąź kroku ma test (5 scenariuszy w `tests/jakosc/e2e-awaria-maszyny.test.ts`); luka: 002 |
| DEV-02 | dotyczy | ok: 3/3 commitów zmieniających zachowanie zmienia test w tym samym commicie (bd139d93, c93273b0, 7e86bfa1); 7e013f0f tylko dokumenty |
| DEV-03 | dotyczy | ok: brak `.skip`/`.only`/pustych asercji w nowych testach |
| DEV-04 | dotyczy (tylko 2 nowe pliki testów) | ok: 10/10, 3/3, kod 0; pełnego `npm run verify` nie uruchamiano (poza zakresem polecenia) |
| DEV-05, DEV-06, DEV-08, DEV-11, DEV-12, DEV-15, DEV-16 | nie dotyczy (CI, bez bazy, UI, czasu, i18n) | — |
| DEV-07 | dotyczy | ok: brak junit = brak dowodu = porażka (`scripts/ci/e2e-awaria-maszyny.mjs:29`) |
| DEV-09 | dotyczy (junit z zewnątrz) | 003 |
| DEV-10 | dotyczy (wynik widoczny w podsumowaniu) | 001, 002 |
| DEV-13 | dotyczy (limity) | ok: bez zmian; ryzyko w 001 |
| DEV-14 | dotyczy | ok: brak sekretów w diffie; fikstury z zamaskowanym UUID |

## Znaleziska (szczegóły)

### 08-programista-001 · Pełny pakiet: awaria w drugiej połowie części + pełne 2. podejście przekracza limit kroku; wtedy część nie ma wpisu w podsumowaniu
- Pozycja listy kontrolnej: DEV-10
- Poziom: P2
- Realność: realny dla pełnego pakietu (`[e2e-pelny]`, nocny), brzegowy dla pakietu podstawowego (bramka) · Pewność: średnia (wagi częściowo szacunkowe)
- Rodzaj: D
- Dowód: `dowody/rachunek-limitu.txt`. Pełny pakiet: części 22/23/22 scenariusze, jedno podejście ≈ 74,5/76,4/74,6 min, limit kroku 118/122/118 min (`.github/workflows/jakosc-ios.yml:354`, 30 + 4 × N); limit przekroczony, gdy awaria nastąpi po ≈ 58–60% części (najgorzej 149–153 min). Podstawowy: części 6/7, najgorzej 50,5/54,5 min przy limicie 54/58 — margines 3,5 min (≈ 6%), bez ponawialnych w tych częściach. Limit joba 150 min (`.github/workflows/jakosc-ios.yml:274`) nie wiąże przed limitem kroku. Podsumowanie części zapisuje dopiero blok `.github/workflows/jakosc-ios.yml:396-405` na końcu kroku; przy przekroczeniu zostaje tylko adnotacja `::warning::` (`.github/workflows/jakosc-ios.yml:389`).
- Mechanizm: brak budżetu czasu na 2. podejście (Trening ma strażnik na podejście, `dowody/trening-e2e-ios-213-228.txt`); ryzyko nazwane przez BD w P-782 (3). Skutek: fałszywie czerwony (fail-closed), nie fałszywie zielony — zgoda KO-054 nie naruszona.
- Powraca: nie
- Wzorzec lub źródło: Trening `e2e-ios.yml` @2d97581 (strażnik `guard`, alarm na podejście).
- Kroki w aplikacji: commit z `[e2e-pelny]`, awaria sterownika w ok. 15. scenariuszu części → krok przerwany limitem, brak wpisu części w podsumowaniu.
- Opcje: (a) zostawić jako ryzyko nazwane P-782 (3) — zero pracy, rzadki fałszywy czerwony w pełnym pakiecie; (b) przed `przebieg 2` dopisać do podsumowania wynik 1. podejścia (scenariusz, przyczyna, wyniki) — kilka linii, przekroczenie limitu przestaje gubić ślad; (c) przed `przebieg 2` porównać `$SECONDS` + wagę części z limitem i przy braku czasu zakończyć czerwonym z wpisem „powtórzenie pominięte: brak czasu” — więcej kodu i testu; (d) podnieść limit — poza zgodą KO-054 (decyzja właściciela). Rekomendacja: (b), reszta jako (a).
- Test akceptacyjny: harness `tests/jakosc/e2e-awaria-maszyny.test.ts` z udawanym `maestro`, które w 2. podejściu zabija krok (np. `kill -TERM $PPID`), a podsumowanie i tak zawiera „powtórzenie zestawu” i przyczynę.
- Status: otwarte

### 08-programista-002 · Status „w-ponowieniu” z 1. podejścia znika z podsumowania po powtórzeniu zestawu
- Pozycja listy kontrolnej: DEV-10
- Poziom: P3
- Realność: brzegowy (tylko pełny pakiet: ponawialne 2/3/2 w częściach, żaden w bramce, `dowody/rachunek-limitu.txt`) · Pewność: wysoka
- Rodzaj: D
- Dowód: sonda S1 (`dowody/sondy.txt`, `dowody/sonda-be.test.ts.txt`): 02 ponawialny — asercja, ponowienie zielone („w-ponowieniu” w `podejscie-1/wyniki.txt`), potem awaria w 03 → 2. podejście uruchamia 02 trzeci raz, podsumowanie pokazuje tylko „zielony 02”. Przyczyna: `POMIN` i przeniesienie wyników biorą tylko `^czerwony` (`.github/workflows/jakosc-ios.yml:391`, `.github/workflows/jakosc-ios.yml:394`).
- Mechanizm: P-091 9a wymaga, by „w ponowieniu” było liczone osobno, „nie jako zaliczenie bez śladu” (komentarz `.github/workflows/jakosc-ios.yml:377`); ślad zostaje tylko w artefakcie `e2e-out/podejscie-1`. Wynik bramki się nie zmienia.
- Powraca: nie
- Wzorzec lub źródło: P-091 (9a), `docs/decyzje.md:97`.
- Kroki w aplikacji: pełny pakiet, niestabilny ponawialny scenariusz przed awarią sterownika w tej samej części.
- Opcje: (a) traktować „w-ponowieniu” jak „czerwony”: dopisać do `POMIN` i przenieść linię z dopiskiem „(1. podejście)” — scenariusz nie biegnie trzeci raz, ślad zostaje; (b) tylko przenieść linię do podsumowania, scenariusz biegnie w 2. podejściu — trzecie uruchomienie zostaje. Rekomendacja: (a).
- Test akceptacyjny: sonda S1 jako test: 02 uruchomiony 2× (nie 3×), podsumowanie zawiera „w-ponowieniu 02 … 1. podejście”.
- Status: otwarte

### 08-programista-003 · Wzorzec „deviceInfo failed” łapie też treść porażki asercji z tymi słowami; CDATA w `<system-out>` też
- Pozycja listy kontrolnej: DEV-09
- Poziom: P3
- Realność: teoretyczny (`grep` w `e2e/` i `src/`: 0 trafień, `dowody/grep-wzorce-w-tresci.txt`; czy Maestro 2.12.1 pisze `<system-out>` z CDATA — nie sprawdzono) · Pewność: wysoka (zachowanie), średnia (realność)
- Rodzaj: D
- Dowód: sondy K1–K8 (`dowody/sondy.txt`): poprawnie odrzucone — wzorzec w `<system-out>` tekstem (K1), w atrybucie `message=` (K3, K4), w `file=` (K6), encja w `system-out` (K8) i w nazwie testu (test BD). Za szeroko: K7 — `<failure>Assertion is false: "deviceInfo failed" is visible</failure>` → kod 0 (awaria maszyny, asercja byłaby ponowiona); K2 — `<system-out><![CDATA[<failure>DeviceUnreachableException</failure>]]>` → kod 0. Wyrażenie: `scripts/ci/e2e-awaria-maszyny.mjs:11` i `scripts/ci/e2e-awaria-maszyny.mjs:18`.
- Mechanizm: wzorzec dopasowany w dowolnym miejscu treści, bez wykluczenia porażek asercji i bez pominięcia sekcji CDATA.
- Powraca: nie
- Wzorzec lub źródło: Trening dopasowuje te same frazy w całym logu (szerzej niż Oczko).
- Kroki w aplikacji: brak dziś (żaden scenariusz nie sprawdza takiego tekstu).
- Opcje: (a) odrzucać treść zaczynającą się od „Assertion is false” i usuwać CDATA przed dopasowaniem — 2 linie i 2 przypadki testu; (b) zostawić i dopisać do `jakosc:kontrole` sprawdzenie, że scenariusze nie zawierają fraz z `WZORCE_AWARII_MASZYNY` — kontrola trwała, ale pośrednia. Rekomendacja: (a).
- Test akceptacyjny: przypadki K2 i K7 z `dowody/sonda-be.test.ts.txt` dają kod 1.
- Status: otwarte

## Do sprawdzenia (pewność ≤ 80%)
- `maestro-failures.py` liczy krok `RUNNING` jako przerwany (`.github/scripts/jakosc/maestro-failures.py:46`); czy przy zwykłej porażce zagnieżdżonego `runFlow` rodzic zostaje w `RUNNING` (dodatkowy, mylący wpis „przerwany” w logu) — nie sprawdzono na prawdziwym `commands-*.json`; skrypt tylko informacyjny, zawsze kod 0.
- Twierdzenie P-782 (3), że w #142/#173/#182 awaria była w 1.–2. scenariuszu części — przebiegów nie czytano.

## Co działa dobrze i należy zachować
- Klasyfikacja po treści `<failure>/<error>` junit pojedynczego scenariusza, nie po całym logu (węższe niż Trening) i „brak junit = porażka”.
- Porażki 1. podejścia sprzed awarii zachowane, liczone i wykazane z dopiskiem; 1. podejście w artefakcie `e2e-out/podejscie-1`.
- Testy wykonują prawdziwy tekst kroku z workflowu w `bash -e` z udawanym `maestro` i fiksturami z prawdziwych junit — test potrafi paść (6/10 i 2/3 czerwone na 562dfc4).

## Decyzje dla właściciela
Brak — wszystkie trzy poprawki mieszczą się w zgodzie KO-054 i należą do koordynatora (P-087). Opcja 001 (d) „podnieść limit” wymagałaby zgody właściciela; nie rekomenduję. Pula P-784…P-785 nieużyta (recenzja nie podjęła decyzji).

## Proponowane polecenie naprawy
`node tools/assemble.mjs 07-jakosc --tryb fix --zadania 08-programista-001,08-programista-002,08-programista-003` (właściciel kroku CI: rola 07; dla 001 tylko opcja b)

## Delta BF (ac0ba37e..928e1767, recenzja poprawek 001–003)
Zakres: 4 commity (4867c6cf, 740a5289, 07a485ac, 928e1767), 7 plików; numery linii niżej dotyczą 928e1767 (gałąź `claude/bf-e2e-poprawki-2026-11-12`), nie tej gałęzi.

**Werdykt: TAK.** Mieści się w KO-054, a 001–003 są naprawione.
- Zgoda KO-054: żadna asercja nie jest ponawiana ani ukrywana. Status „w-ponowieniu” (asercja + ponowienie P-091 9a) wchodzi teraz do listy pomijanych i nie biegnie trzeci raz (jakosc-ios.yml l. 393). Nie dolicza się też do bramki, tak jak przed zmianą. Limity, plan i lista scenariuszy bez zmian: grep diffu zwraca kod 1 (`dowody/bf-zakres-delty.txt`). Powtórzenie nadal najwyżej raz.
- 001 naprawione (opcja b, P-786). Nagłówek części (l. 388), przyczyna awarii i wyniki 1. podejścia (l. 396) trafiają do podsumowania przed 2. podejściem. Test z udawanym przerwaniem kroku (SIGTERM do powłoki) ma te wpisy, choć blok końcowy się nie wykonał. Bez awarii podsumowanie wygląda jak przed zmianą: nagłówek raz, potem wyniki.
- 002 naprawione (P-787). Sonda S1 na 928e1767: 02 uruchomiony 2× zamiast 3×, w wyniku końcowym „w-ponowieniu 02 (1. podejście, …)” (`dowody/bf-928-sondy.txt`).
- 003 naprawione (P-788). Klasyfikator usuwa CDATA i `<system-out>`/`<system-err>` i pomija treść zaczynającą się od „Assertion is false” (e2e-awaria-maszyny.mjs l. 18–19). Sondy K1–K8 na 928e1767: K2 i K7 dają teraz kod 1. Pozostałe bez zmian: K1, K3, K4, K6 i K8 kod 1, K5 (`<error>` z wzorcem) kod 0.
- Testy: na ac0ba37e z testem i fiksturami z 928e1767 padają 4 z 14 nowych testów, kod 1. Powód właściwy, asercje zachowania: podsumowanie puste po przerwaniu, 02 uruchomiony 3×, K2 i K7 kod 0 (`dowody/bf-ac0-e2e.txt`). Na 928e1767 oba pliki testów przechodzą, 17/17, kod 0 (`dowody/bf-928-testy.txt`). Sondy: kod 0 (`dowody/bf-928-sondy.txt`).
- Ryzyko limitu (pkt 4.3) bez zmian co do liczb (`dowody/rachunek-limitu.txt`). Przekroczenie nie gubi już jednak śladu części w podsumowaniu.

### 08-programista-004 · Awaria maszyny zapisana w CDATA wewnątrz `<failure>` nie jest rozpoznawana (powtórzenia nie ma, krok czerwony)
- Pozycja listy kontrolnej: DEV-09
- Poziom: P3
- Realność: teoretyczny. Prawdziwy junit z #182 (fikstura `junit-device-unreachable.xml`) ma zwykły tekst bez CDATA; czy Maestro 2.12.1 kiedykolwiek pisze `<failure>` w CDATA — nie sprawdzono. · Pewność: wysoka (zachowanie)
- Rodzaj: D
- Dowód: sonda K9 (`dowody/bf-sondy-k9-k11.txt`): prawdziwa treść DeviceUnreachableException owinięta w `<![CDATA[…]]>` w `<failure>` daje kod 1. Przyczyna: `bezLogow` usuwa każdą sekcję CDATA, także w `<failure>`. K10 i K11 (prawdziwa awaria z `<system-out>`) dają kod 0, poprawnie.
- Mechanizm: wynik jest bezpieczny, bo błąd działa w stronę czerwieni. Wraca wtedy jednak sytuacja sprzed JAK-05: ręczne ponowienie joba.
- Powraca: nie
- Wzorzec lub źródło: P-788.
- Kroki w aplikacji: brak dziś.
- Opcje: (a) usuwać CDATA tylko w `<system-out>`/`<system-err>`, a w `<failure>`/`<error>` je rozpakowywać. To jedna zmiana wyrażenia i przypadek K9 w teście. (b) Zostawić, bo junit Maestro nie używa CDATA (zgodne z fiksturą #182). Rekomendacja: (b) teraz, a (a) przy najbliższej zmianie klasyfikatora.
- Test akceptacyjny: K9 daje kod 0, K2 nadal kod 1.
- Status: otwarte

Do sprawdzenia (delta): czy GitHub zapisuje `GITHUB_STEP_SUMMARY` kroku przerwanego przez `timeout-minutes`. Test BF symuluje przerwanie w bashu; dokumentacji GitHub nie czytałem w tej sesji.
