# 0032. Pula kopii sprzed „Replace” i „Delete all data”: pierwsza kopia każdego dnia zostaje 30 dni niezależnie od limitu ilości (zastępuje ADR-0028 pkt 4)
Data: 2026-11-02 · Status: **przyjęta** (DEC-18 a, P-393, koordynator wg P-087, 2026-11-02; do weta) · Rola: 12 (fix, M1-audytor-generalny-013, 12-niezawodnosc-003) wg reguł roli 05 (moduł `dane-lokalne-sqlite`) · Zastępuje: ADR-0028 pkt 4 (pozostałe punkty ADR-0028 bez zmian) · Zależy od: ADR-0028, ADR-0004, ADR-0019, ADR-0020 (6)

## Kontekst i problem
ADR-0028 pkt 4 liczył pulę kopii w `Documents/Backup` samą ilością: zostają 2 najnowsze. Trzy „Replace” jednego dnia (osoba szukająca właściwego pliku importuje kilka po kolei) dają `oczko-przed-importem-<dzień>.oczko`, `-2`, `-3`, a sprzątanie przy kamieniu milowym usuwa pierwszą, czyli jedyną kopię danych sprzed importów (audyt M1, 12-niezawodnosc-003, P1). „Replace” kasuje wiersze, a pliki bez odwołań sprząta kosz (ADR-0028 „Kontekst”), więc innej drogi do oryginału nie ma. Ta sama funkcja liczy pulę `oczko-przed-usunieciem-` (dwa „Delete all data” po kolei).

## Czynniki decyzji
- Zasada roli 12 nr 1: oryginał zmienia dopiero sprawdzone przywrócenie; zasada wspólna 10 (zero utraty danych).
- ADR-0020 (6) i ADR-0004: kopie trzymane 30 dni (`KOPIA_PRZED_IMPORTEM_DNI`).
- Kontrakt nazw z ADR-0028 pkt 1 i 4: funkcja wyboru jest czysta i widzi tylko nazwy (`oczko-przed-<rodzaj>-RRRR-MM-DD[-n].oczko`); czas w nazwie ma dokładność dnia (UTC, `teraz.dzien`).
- Rozmiar: do ok. 415 MB na kopię po 3 latach (ADR-0004, E0 §3); `Documents` wlicza się do kopii urządzenia iCloud (ADR-0028 „Konsekwencje”).
- DEC-18 (P-393): wybrano „a — kopia sprzed pierwszego „Zastąp” w serii (np. 24 h) chroniona 30 dni niezależnie od limitu ilości”; odrzucone: b — limit wieku i miejsca (do 3× rozmiar danych), c — bez zmian, ryzyko w tekście.

## Rozważane opcje (jak rozumieć „serię” w wyborze a)
- A. Seria = dzień z nazwy kopii: pierwsza kopia każdego dnia (najmniejszy przyrostek) zostaje do 30 dni; najnowsza zawsze; pozostałe od najnowszej, dopóki zostawionych jest mniej niż `KOPIA_PRZED_IMPORTEM_MAKS` (2).
- A2. Seria = łańcuch kopii, w którym kolejne dzieli najwyżej doba; chroniona pierwsza kopia łańcucha.
- A3. Seria = okno doby od pierwszej kopii serii (kotwica); kopia spoza okna zaczyna nową serię.

## Decyzja
Wybrano „A”, ponieważ jako jedyna jest stabilna przy usuwaniu i nie wymaga nowego parametru ani zmiany nazw: kopia chroniona nigdy nie traci ochrony przez to, że sprzątanie usunęło inną. A2 jest niestabilna (rachunek: łańcuch dni −5, −4, −3 → usunięcie −4 rozdziela go na dwie serie, więc przy codziennym „Replace” chronionych przybywa i tak, a reguła trudniejsza do sprawdzenia); A3 chroni mniej kopii przy codziennym „Replace” (co druga doba), ale przy dokładności dnia w nazwie okno „24 h” to w praktyce „ten sam albo następny dzień”, trudniej je opisać i zostawia tę samą klasę ryzyka miejsca.

Reguła (czysta funkcja `kopiePrzedDoUsuniecia`, `src/niezawodnosc/kopie.ts`; wołana przy kamieniu milowym strażnika, ADR-0019), osobno dla `importem` i `usunieciem`:
1. Kopia starsza niż `KOPIA_PRZED_IMPORTEM_DNI` (30, ściśle, od północy dnia z nazwy UTC) jest usuwana, także pierwsza kopia dnia.
2. Z młodszych zostaje pierwsza kopia każdego dnia (najmniejszy przyrostek wśród obecnych; brak pliku bez przyrostka, bo użytkowniczka usunęła go w Plikach = chroniona najstarsza zostawiona z tego dnia), niezależnie od limitu.
3. Najnowsza kopia zostaje zawsze.
4. Pozostałe zostają od najnowszej, dopóki zostawionych jest mniej niż `KOPIA_PRZED_IMPORTEM_MAKS` (2); reszta jest usuwana.
5. Bez zmian z ADR-0028 pkt 4: tylko nazwy z reguły `^oczko-przed-(importem|usunieciem)-\d{4}-\d{2}-\d{2}(-\d+)?\.oczko$`; obca nazwa i dzień z przyszłości (cofnięty zegar) zostają i nie liczą się ani do limitu, ani do pierwszej kopii dnia.

### Konsekwencje
- Dobre: seria „Replace” jednego dnia zachowuje kopię z danymi sprzed serii (test akceptacyjny M1-013) i najnowszą; typowa seria zajmuje jak dotąd 2 kopie; kod w jednej czystej funkcji, adapter bez zmian.
- Złe: przy „Replace” lub „Delete all data” w wielu dniach w ciągu 30 dni (np. przenoszenie danych między urządzeniami eksportem i „Replace” co dzień) pula rośnie do jednej kopii na każdy taki dzień plus najnowsza, najwyżej ok. 32 na rodzaj [OCENA 12, rachunek: 31 dni w oknie „≤ 30 dni” + kopia dnia bieżącego z przyrostkiem]. Przy 415 MB na kopię to rząd 13 GB w `Documents` (kopia urządzenia iCloud). Podpis `dane.kopie_opis` już prosi o usuwanie niepotrzebnych kopii.
- Od czego zależy (decyzja warunkowa): weto koordynatora lub właściciela wobec DEC-18; pomiar rozmiaru kopii na prawdziwych danych — jeśli przekroczy próg ustalony z rolą 05, wariant A3 albo limit miejsca dla kopii nie-pierwszych (nowa decyzja).

### Potwierdzenie
- Czysta funkcja: `tests/niezawodnosc/kopie.test.ts`, blok K-03f ADR-0032 (trzy kopie jednego dnia → usunięta środkowa; pierwsze kopie trzech dni zostają ponad limit; najnowsza zawsze; brak kopii bez przyrostka; > 30 dni; oba rodzaje; obce nazwy i przyszłe daty).
- Na prawdziwych archiwach: `tests/dane/archiwum.test.ts`, K-03h (trzy „Replace” → `sprzatnijKopiePrzed` → zostają pierwsza i najnowsza, SHA-256 pierwszej bez zmian, jej import przywraca liczności, migawkę i pliki).
- Lista kontrolna: NIE-03 (rola 12) / ARCH-11 (rola 05).

## Opcje: zalety i wady
### A — zalety: stabilna przy usuwaniu, bez nowego parametru, opis jednym zdaniem · wady: przy codziennym „Replace” do ok. 32 kopii na rodzaj.
### A2 — zalety: przy rzadkim usuwaniu chroni najmniej kopii · wady: ochrona zależy od tego, co sprzątanie już usunęło (niestabilna), więc w praktyce rośnie jak A; trudna do sprawdzenia.
### A3 — zalety: stabilna, przy codziennym „Replace” ok. połowa kopii A · wady: okno „doby” przy dokładności dnia w nazwie to „ten sam albo następny dzień”; nadal bez górnej granicy miejsca.
