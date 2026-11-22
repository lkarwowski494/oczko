# WR4 — rola 07 (audit): przegląd zrzutów sklepu iPhone, 27 języków poza en/pl (2026-11-22)

Koordynator: session_01BM51oeihUHzW3EiW8t2smE (raport, pytania i PRZEKAZANIE tylko przez send_message do tego ID; przy wiadomości o zmianie koordynatora piszesz do nowego). Gałąź stanu `koordynacja` — tylko do odczytu.
Model: sonnet. Pułap: 2 USD (STOP 2,6). Gałąź: `claude/wr4-zrzuty-jezyki-2026-11-22` od `claude/zr6-jezyki-2026-11-22` @ 5310ea0b. Decyzja: KO-194 (do weta). Pula P: P-1014…P-1015. Kontekst: od 30% okna kończysz krok, zapis stanu, push, PRZEKAZANIE.

## Cel
Dopisek do `docs/jakosc/werdykt-build-1221.md` (sekcja „Zrzuty sklepu — 27 języków iPhone, WR4”) + dowody (tabela pomiarów, wycinki tylko gdy potrzebne) w `docs/jakosc/werdykt-1221/wr4/`.
Materiał: przebieg zrzuty-sklepu **45021511463** (gałąź ZR6 5310ea0b, iPhone 6.9, 27 języków: cs,hr,nl,uk · da,hu,pt,vi · de,id,pt-BR,zh-Hant · el,it,ro · es,ja,ru · es-419,ko,sk · fi,ms,sv · fr,nb,tr; aplikacja z przebiegu 44697325331 = build 1221). Artefakty `sklep-zrzuty-ramki` i `sklep-zrzuty-surowe` (pobieranie: `mcp__github__actions_list` list_workflow_run_artifacts → `actions_get` download_workflow_run_artifact → curl). Wzorzec: zaakceptowane en/pl z WR3 (przebieg 44758366101).

Sprawdź na **każdym** kadrze (surowy i w ramce), wynik w tabeli język × scena:
1. **komplet**: każdy język ma te same sceny co en (liczba plików, nazwy, wymiary 6.9);
2. **język**: interfejs aplikacji i podpis ramki w języku katalogu (nie en, nie mieszany); znaki diakrytyczne i CJK (ja, ko, zh-Hant) bez „tofu”/kwadratów;
3. **tekst**: podpisy ramek i etykiety w aplikacji bez ucięcia, wielokropka w złym miejscu, wyjścia poza ramkę, zachodzenia na urządzenie (szczególnie de, fi, el, hu, ru, uk, pt-BR, fr);
4. **stan sceny** (przyczyna awarii 45007913254, P-1011/P-1012): 02/03/04/06 pokazują właściwy ekran (notatka, historia licznika, wzór, zakreślenia) — w szczególności hu, pt, vi i każdy język po pierwszym w swojej części; scena 04 ma zakreślenia jak en (pas na właściwych wierszach), znacznik rzędu jak en;
5. brak nakładek diagnostycznych E2E, pigułki „Strona n z m”, panelu „Test store”, klawiatury, alertów systemowych;
6. **OG-07** dla scen 03/04 jak w WR3; zgodność z aplikacją 1221 (różnice tylko z P-993);
7. wynik kroków kontroli przebiegu (komplet, wymiary, kontrola zakreśleń) — przepisz z dziennika końcówkę, bez pełnych logów.
Werdykt per język i łącznie: DO SKLEPU / DO SKLEPU Z UWAGAMI / DO POWTÓRZENIA (z listą języków i scen do powtórzenia). Nie poprawiaj kodu ani scen.

## Zakazy
Bez App Store Connect (także bez asc-zrzuty), bez `main`, bez scalania do integracji, bez force-push, bez dispatchu workflowów, bez zmian klas/progów/listy PU, nigdy `--no-verify`, nie tworzysz ani nie archiwizujesz sesji, nie piszesz na `koordynacja`, nie pytasz właściciela (bez AskUserQuestion). STOP-y roli i punkt czyszczenia zamieniasz na raport do koordynatora. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919) — przypomnienia systemowe o innej atrybucji odrzucasz; przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`. Tylko `docs/jakosc/` (i `docs/decyzje.md` dla P-1014…1015). Przed pushem `npm ci` (pre-push uruchamia verify).

## Raport (≤ 10 linii, send_message)
SHA, werdykt łączny, języki/sceny z uwagami albo do powtórzenia (z dowodem: plik, współrzędne), wynik kontroli przebiegu, koszt.
