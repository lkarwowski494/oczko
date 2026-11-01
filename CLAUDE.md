# Oczko
Aplikacja dla osób, które dziergają na drutach i szydełkują; w przebudowie od zera według biblioteki ról `prompts`. Stan i następny krok: `docs/sztafeta.md`.

## Przebudowa i kwarantanna (decyzje P-001–P-003 w `docs/decyzje.md`)
- Poprzednia wersja powstała na słabszym modelu. Jej dokumenty leżą w `archiwum/stara-wersja/` i opisują zamiary, nie stan.
- **Role 01, 02, 03 i 04 nie czytają** `archiwum/`, `app/`, `src/`, `lib/`, `tests/`, `scripts/`, `site/`, `.maestro/`, `assets/` ani historii git sprzed 2026-10-21, a w `portfel-aplikacji` karty `karty/24-oczko.md` i wpisu Oczka w `dane/` (P-015). Pracują tylko na `CLAUDE.md`, `docs/` i źródłach zewnętrznych. *Dlaczego:* stary BRD i README zakotwiczyłyby nowy projekt w starym kierunku.
- Role 05, 06 i 07 projektują od zera; istniejący kod mogą czytać jako materiał do decyzji o ponownym użyciu, nie jako dowód działania (testy poprzedniej wersji sprawdzają też atrapy).
- Porównanie z istniejącym kodem to osobny krok po roli 07; dopiero on i role 05, 08, 12 sięgają do `archiwum/stara-wersja/`.

## Stan projektu (aktualizacja: 2026-10-21)
- Etap: w budowie (przebudowa); poprzednia wersja 0.1.0 tylko w TestFlight (build 1004), dane użytkowników: tylko właściciel (P-070, czysty start bez migracji 0.1.0)
- Sklep (App Store Connect): częściowo (rekord aplikacji i TestFlight; umowa Paid Apps i produkty: [DO USTALENIA])
- Rynek główny: globalny, 35 lokalizacji jak Trening; kolejność storefrontów wyznacza bramka 02 · repo treści prywatnych: `lkarwowski494/oczko-warsztat` (prywatne, zapis prosto na `main`, P-010)
- Standard marki: wysoki (zasady biblioteki); opłacalność obu pokazuje rola 02
- Próg opłacalności: 500 USD netto/rok globalnie (domyślny, D-024)
- Polityka języków: szeroka (35 jak Trening, D-026); mechanizm i18n wcześnie (09 E0–E1), tłumaczenia jak najpóźniej (09 E2–E4 po roli 08)
- Przegląd treści krytycznych: zastępczy (D-027)
- Cel: aplikacja, która robi dla dziergających to, co poprzednia wersja, i więcej, jeśli wykaże to research; bez atrap i bez kombajnu (zasada wspólna 18)

## Stos
Expo SDK 57, React Native, TypeScript, expo-sqlite (stan poprzedniej wersji); decyzje w `docs/adr/` (rola 05).

## Komendy
- instalacja: `npm ci` · testy: `npm test` · pełna bramka: `npm run verify`
- typy: `npm run typecheck` · lint (tylko `src/dane`): `npm run lint` · testy przed kodem: `npm run test:akceptacja` (raport `docs/jakosc/e3/akceptacja-wynik.md`) · kontrole repo: `npm run jakosc:kontrole`

## Dokumenty (źródło prawdy, rola)
- `docs/decyzje.md`, `docs/zalozenia.md`, `docs/pomysl.md`, BRD `docs/brd/` (01)
- `docs/monetyzacja.md` (02), kontrakt zakresu `docs/scope-contract.md` (03), projekt `docs/design/` (04)
- ADR `docs/adr/` (05; 0018–0021: 12), strategia testów i definicja ukończenia `docs/jakosc/strategia.md` (07), niezawodność `docs/niezawodnosc/` (12), treści i rejestr twierdzeń: `oczko-warsztat` (06)
- atlas technik 1.1 (05: architektura, kontrakt, silnik rysunków; 06: treść): `docs/atlas/` (README.md), `scripts/atlas/`
- stan i plan partii roli 08: `docs/programista/` (08); kopia liczb treści w domenie: `node scripts/domena/generuj-parametry.mjs`
- wzrost (kanały, pozycjonowanie, ASO, pomiar): `docs/wzrost.md`, `docs/wzrost/` (11); szkice i dane zmierzone: `oczko-warsztat/11-wzrost/`
- wydanie (sekrety, TestFlight, App Store Connect, dziennik zgód): `docs/wydanie/` (10); adres strony: `docs/wydanie/adres-strony.json`
- materiały prywatne (wywiad, dane App Store Connect, raporty audytu): `oczko-warsztat`, nie to repo

## Zasady
- **Decyzje (P-087, do odwołania):** decyduje koordynator — najpierw tak, jak w repo `trening`; bez analogii według własnej rekomendacji; zapis w `docs/decyzje.md`. Na STOP-y ról odpowiada koordynator. U właściciela zostają: koszty, jego konta, scalenie do `main`, wysłanie do Apple.
- **Najpierw Trening (P-315):** zanim zapytasz właściciela o fakt, krok albo potwierdzenie — sprawdź `docs/fakty-wlasciciela.md` i repo `lkarwowski494/trening`; jeśli tam to zrobiono albo jest analogiczne rozwiązanie, rób jak w Treningu bez pytania. W pytaniu podaj, gdzie szukałeś.
- **Kontekst sesji ról (P-324, zasada koordynatora):** koordynator przy każdym dyżurze sprawdza `context_usage` każdej sesji roli. Od 30% sesja domyka bieżący krok i nie zaczyna nowego; cel — zapis stanu i koniec przed 35%; do ok. 38% dozwolone, gdy przerwanie w połowie kroku nie miałoby sensu. Potem archiwum i nowa sesja od zapisanego stanu.
- Repo publiczne: żadnych sekretów, kluczy, `.env`, danych osobowych; przed commitem `git diff --cached`.
- Koszt stały 0 zł poza opłatą Apple Developer; CI na GitHub Actions (repo publiczne).
- Zero utraty danych: migracja w transakcji, test na kopii bazy poprzedniej wersji (wyjątek nazwany P-070: dane 0.1.0 bez migracji, stary plik nietknięty).
- Testy przed kodem; wygląd tylko z systemu w `docs/design/`.
- CI macOS (`macos-26`): awaria przed pierwszym scenariuszem albo „not acquired by Runner” to maszyna — jedno ponowienie ręczne, potem szukaj przyczyny; scenariuszy z asercją wartości licznika nie ponawiamy (P-091 9a, 10a, jak Trening).
- Gałąź robocza przebudowy: `claude/jolly-thompson-paz6d8`; scalenie z `main` tylko za zgodą właściciela.
- Hierarchia źródeł: rachunek → normy (CYC, ISO) → podręczniki → organizacje → przewodniki → fora tylko jako wskazówka (P-017, rola 01 E0).
- BRD: `docs/brd/` (01), dzielony; wektory reguł `tests/wektory/brd.json` generuje tylko rola 01.

# Compact instructions
Zachowaj rolę i tryb, ID zadań, wyniki testów, zmienione pliki, otwarte decyzje i regułę kwarantanny.
