# E2 Przegląd wdrożenia 08 i testy roli 12 (build, E2–E3) · 2026-10-26 · STOP E2
Prompt: biblioteka `prompts` 97ec212, `12-niezawodnosc --tryb build` (60828 znaków, moduły incydent-i-poprawka, pakiety-tresci, ratowanie-danych, widocznosc-awarii; poza repo). Wejście: E0 (P-079), E1 (P-080), ADR-0018–0021, `partia-4.md` „Odstępstwa”, P-176, P-177, P-180, P-187. HEAD wejścia d970ac8.

## Środowisko (ETAP 0 tej sesji)
| Sprawdź | Wynik |
|---|---|
| System, Node, git | Linux 6.18, Node v22.22.0; gałąź `claude/jolly-thompson-paz6d8` |
| Bramka wejścia | `npm ci` kod 0; `env -u NODE_PATH npm run verify` kod 0, **1866/1866** (d970ac8) |
| macOS, Xcode, symulator | brak (P-187: bez pushu dla CI iOS); E2E i ćwiczenia na symulatorze idą do przebiegu nocnego albo do 07/10 |
| Moduły | `ratowanie-danych`, `widocznosc-awarii`, `incydent-i-poprawka` — dotyczą; `pakiety-tresci` — nie dotyczy (Oczko nie ładuje pakietów treści, E0) |

## 1. Przegląd wdrożenia 08 (ADR-0018, ADR-0019, ADR-0020)
| Obszar | Stan w kodzie (plik:linia) | Ocena |
|---|---|---|
| Strażnik — logika | `src/niezawodnosc/start.ts`: sygnatury 08, „Spróbuj normalnie” = start normalny w tym samym procesie z licznikiem próg − 1 i `wToku` = true | **zgodne z wzorcem 12**: 9 sekwencji wzorca i własność z modelem historii zielone (`tests/niezawodnosc/straznik-wektory.test.ts`); 3 mutanty zabite. Odstępstwo przyjmuję bez zmian. |
| Strażnik — wywołanie | `app/_layout.tsx:46–48` tylko przy `AppState` = `active`; zapis przed bazą `src/kompozycja/start-aplikacji.ts:29–36` | zgodne z ADR-0019 |
| Strażnik — kamień milowy | `app/index.tsx:27–28`: `zapiszKamien()` w tym samym kroku co `ustawGotowe(true)`, **przed** renderem licznika | **N12-01** |
| Okno przed JS (P-177) | stan zapisywany dopiero z JS (~1,4 s po aktywacji, E2E 40306542928) | **N12-10**: brzegowy, bez znacznika natywnego (niżej) |
| Surowa kopia | `src/dane/kopia-ratunkowa.ts:21–32` trzy pliki przed otwarciem bazy | **zgodne**: proces zabity SIGKILL z otwartą bazą WAL → kopia 100/100 wierszy, oryginał bajt w bajt; kontrola: sam `.db` gubi zapisy |
| `sprawdzKopie` | `kopia-ratunkowa.ts:35–58` | zgodne (uszkodzona strona, `user_version` 0, obcy `application_id`, plik 0 B odrzucone); **N12-06** (powód przy uszkodzeniu strony 2) |
| Przywracanie | `przywrocZKopii` `kopia-ratunkowa.ts:77–97`, `przeniesienie.ts` (ATTACH + jedna transakcja, ADR-0020 (5′)) | **zgodne**: liczności jak w kopii, kopia „przed” ze stanem sprzed, `blad` i klucze urządzenia bez zmian, błąd w trakcie = baza bez zmian; **N12-08** (latentne) |
| Baza nie do otwarcia → ZIP | `EkranAwaryjny.tsx:21–22`: `zapiszKopie()` = `null` → nic | **N12-03** |
| Kopie 30 dni | `KOPIE_RATUNKOWE_DNI`, `KOPIA_PRZED_IMPORTEM_DNI` w `konfiguracja.ts:9, 29` bez użycia | **N12-04** |
| Kopia przed migracją | `migruj.ts:43`: stała nazwa `przed-migracja-<wersja>.db`, `kopiaBazy` odrzuca istniejący cel | **N12-02** |
| Jedno źródło ścieżki bazy (P-176, P-180) | `tests/jakosc/sciezka-bazy-jedna.test.ts`; `katalogJakoUri` `adapter-expo.ts:22` (błąd „Application%20Support”) | zgodne; mój kod nie zna nazwy pliku bazy (lista plików z `surowaKopia`), test 08 zielony bez zmian |
| ADR-0018 | brak globalnej obsługi błędów JS (`setGlobalHandler` — 0 wystąpień w `src/`, `app/`), brak modułu MetricKit; „Zgłoś problem” w trybie awaryjnym `naZglosProblem={() => undefined}` (`EkranAwaryjny.tsx:27`) | **N12-05** |

## 2. Znaleziska (realność: zasada wspólna 5)
| ID | Problem | Realność | Skutek dla użytkownika | Poprawka |
|---|---|---|---|---|
| N12-01 | Kamień milowy przed renderem pierwszego ekranu | **realny** (P0: odcięcie od danych) | Błąd renderu licznika zależny od danych (typowy po aktualizacji) powtarza się przy każdym starcie, a strażnik ma kamień — tryb awaryjny nie włączy się nigdy | łatka 08: `useEffect(() => { if (gotowe) void zapiszKamien(); }, [gotowe])`; test oczekujący `tests/akceptacja/ekrany/niezawodnosc-kamien.test.tsx` czerwony na asercji, zielony z łatką |
| N12-02 | Stała nazwa kopii przed migracją z przebudową | **brzegowy dziś** (brak migracji z przebudową, `WERSJA_SCHEMATU` = 1), **realny** od pierwszej takiej migracji | Po jednej nieudanej próbie migracja tej wersji nie rusza już nigdy, także w buildzie z poprawką (ADR-0021) — tryb awaryjny bez wyjścia | łatka 08: czas w nazwie (`opcje.teraz`, kontener podaje zegar), zmiana oczekiwania w ŚU-04; test oczekujący `tests/akceptacja/dane/niezawodnosc-migracja-ponowna.test.ts` czerwony (`zapis`), zielony z łatką (25/25 `tests/dane`) |
| N12-03 | Przy bazie nie do otwarcia „Zapisz kopię danych” nic nie robi | **realny** (uszkodzona baza) | Użytkownik nie może przekazać danych do ratowania; surowa kopia leży na urządzeniu bez drogi wyjścia | kod 12 `zipSurowejKopii` (`src/niezawodnosc/kopie.ts`, ADR-0020 (3)); łatka wpięcia w `EkranAwaryjny.tsx` i `start-aplikacji.ts` (typecheck 0) |
| N12-04 | Brak sprzątania kopii | brzegowy (miejsce) | Każdy import, przywrócenie, migracja i wejście w tryb awaryjny zostawia pełną kopię bazy na zawsze | kod 12 `kopieDoUsuniecia` / `sprzatnijKopie` (30 dni, tylko przy kamieniu milowym); wpięcie w `zapiszKamien` w tej samej łatce |
| N12-05 | ADR-0018 niewdrożone: globalna obsługa błędów JS, MetricKit, „Zgłoś problem” w trybie awaryjnym | brzegowy przed premierą (TestFlight daje raporty testerów), realny po premierze (jedyny sygnał od użytkowników App Store bez Maca) | Właściciel nie dowie się o awarii u użytkownika, który nie zgłosi jej sam | decyzja Q4 |
| N12-06 | `sprawdzKopie` mapuje wyjątek SQLite przy uszkodzeniu (np. strona 2) na `bledne_dane` („obcy plik”) | brzegowy (zły komunikat, odrzucenie poprawne) | Komunikat „to nie jest plik Oczka” zamiast „kopia uszkodzona” | dla 08: `SQLITE_NOTADB` → `bledne_dane`, `SQLITE_CORRUPT` → `uszkodzony` (sonda: strona 2 → `bledne_dane`, strony 5 i 7 → `uszkodzony`) |
| N12-07 | Archiwum z trybu awaryjnego ma w manifeście `wersja_schematu` = `WERSJA_SCHEMATU`, a baza w środku jest bez migracji | latentny (jedna wersja schematu) | Po zmianie schematu import takiego archiwum może przyjąć złą wersję | dla 08/05: manifest z `PRAGMA user_version` bazy |
| N12-08 | Przywrócenie kopii w starszym schemacie migruje kopię roboczą bez `katalogKopii` | latentny | Migracja z przebudową na kopii roboczej zwróci `zapis` — przywrócenie starej kopii niemożliwe | dla 08: katalog tymczasowy jako `katalogKopii` kopii roboczej |
| N12-09 | Zapis stanu startu: `File.write` w miejscu, błąd zapisu połknięty (`start-aplikacji.ts:26`) | brzegowy | Zabicie w trakcie zapisu = stan początkowy (kierunek bezpieczny: najwyżej jeden start później); pełny dysk = pętla niewykrywana | bez zmian teraz; ćwiczenie „brak miejsca” w E3 |
| N12-10 | Okno przed JS (P-177) | **brzegowy** | niżej | tańsza kontrola zamiast znacznika |

### N12-10: okno przed zapisem „start w toku” (P-177)
W oknie (start procesu → `rozpocznijStart`, ok. 1,4 s) działają: (1) kod natywny przy starcie (moduły Expo, `ZegarekAppDelegate` — aktywacja WCSession i zapis linii z zegarka do dziennika, `modules/oczko-dziennik-plus/ios/Zegarek.swift:47–51`); (2) ładowanie pakietu JS i kod modułów wykonywany przy imporcie; (3) pierwszy render korzenia i czekanie na `AppState` = `active`.
- Awaria w (1)–(3) wydarza się tak samo w starcie normalnym i awaryjnym, bo decyzja zapada później w JS. Policzenie jej nie przywróci dostępu do danych: ekran awaryjny padłby w tym samym miejscu. Znacznik natywny miałby sens tylko razem z bramką natywną, która pomija ryzykowną inicjalizację (np. WCSession).
- Jedyny kod zależny od danych w (1) to zapis linii z zegarka. Wykonuje się też przy starcie w tle, którego ADR-0019 celowo nie liczy. Ma testy `swift test` (X-ZG) i parsowanie z opcjonalnym wynikiem.
- (2) nie zależy od danych, jeśli moduły nie robią I/O przy imporcie. **Tańsza kontrola:** `tests/niezawodnosc/okno-przed-startem.test.ts` sprawdza w drzewie składni wszystkich plików `app/` i `src/`, że przy imporcie nie ma wywołań I/O plików, bazy ani argumentów startu (dziś 0), oraz próbkę negatywną.
- Zabicie przez system lub użytkownika w oknie to nie awaria i słusznie się nie liczy.

## 3. Kod i testy roli 12 (E2)
| Plik | Co | Czerwień przed kodem | Wynik |
|---|---|---|---|
| `tests/niezawodnosc/wektory-straznika.json`, `straznik-wektory.test.ts` | 9 sekwencji wzorca 12, 9 uszkodzonych zapisów, własność z modelem historii | kod 08 istniał; zamiast czerwieni mutanty: „spróbuj” zeruje licznik → 3 czerwone, start awaryjny „w toku” → 4, ujemny licznik przyjęty → 1 | 20/20 |
| `tests/niezawodnosc/kopia-przywracanie.test.ts`, `pomocnicze.ts` | prawdziwa awaria procesu z WAL, uszkodzona strona, przypadki `sprawdzKopie`, przywrócenie | testy kodu 08 (potwierdzenie ADR-0020) | 11/11 |
| `src/niezawodnosc/kopie.ts`, `tests/niezawodnosc/kopie.test.ts` | sprzątanie 30 dni, ZIP surowej kopii z manifestem (nagłówek SQLite bez otwierania bazy) | zaślepka `NIEZAIMPLEMENTOWANE` → 10/11 czerwonych na znaczniku | 11/11 |
| `tests/niezawodnosc/okno-przed-startem.test.ts` | P-177: brak I/O przy imporcie | — (kontrola stanu) | 2/2 |
| `tests/akceptacja/dane/niezawodnosc-migracja-ponowna.test.ts` | N12-02 dla 08 | czerwony na asercji (`zapis`) | z łatką 1/1 |
| `tests/akceptacja/ekrany/niezawodnosc-kamien.test.tsx` | N12-01 dla 08 | czerwony na asercji (kamień wywołany 1 raz) | z łatką 2/2 |

Bramka: `env -u NODE_PATH npm run verify` kod 0, **1910/1910**; `npm run test:akceptacja` kod 0 (3: asercja 2, zielony-ok 1, błędy raportu 0). Nazwany wyjątek: `tests/niezawodnosc` dopisany do `WYLACZONE` w `docs/jakosc/narzedzia/tabela-08.mjs` (testy własne roli 12, jak `tests/i18n` roli 09), tabela przekazania 07 → 08 zregenerowana (2 nowe wiersze oczekujące). Łatki dla 08 i logi: `oczko-warsztat/12-niezawodnosc/2026-10-26-build-e2/`.

## 4. Pytania na STOP E2 (koordynator wg P-087)
- **Q1 (N12-01).** (a) Łatka 08 jak wyżej, w partii 5 — 2 linie, test gotowy. (b) Kamień w `onLayout` widoku licznika — dokładniej „narysowany”, ale więcej kodu w ekranie i osobny przypadek dla listy. **Rekomendacja: (a).**
- **Q2 (N12-02).** (a) Czas w nazwie kopii (`przed-migracja-<wersja>-<ms>.db`), łatka gotowa, zgodna z sprzątaniem 30 dni. (b) Usunięcie istniejącej kopii przed nową próbą — traci kopię sprzed pierwszej próby, sprzeczne z zasadą roli 1. **Rekomendacja: (a).**
- **Q3 (N12-03, N12-04).** (a) 08 nakłada łatkę wpięcia w partii 5 (pliki 08, praca równoległa). (b) 12 nakłada ją sama po pull — ryzyko konfliktu z ekranami partii 5. **Rekomendacja: (a).** Teksty: brak nowych (ZIP używa tego samego przycisku).
- **Q4 (N12-05, ADR-0018).** (a) Przed TestFlight: globalna obsługa błędów JS z wpisem `blad` bez komunikatu i „Zgłoś problem” w trybie awaryjnym; moduł MetricKit do 1.1 jako uzupełnienie ADR-0018 (TestFlight: „TestFlight users of your app automatically share crash reports”, moduł `widocznosc-awarii`). (b) Pełne ADR-0018 przed TestFlight (moduł Swift ok. 2–3 h agenta + przebieg CI macOS). **Rekomendacja: (a)** — przed premierą testerzy dają raporty bez MetricKit; MetricKit przed wydaniem w App Store.
- **Q5 (N12-10).** (a) Bez znacznika natywnego, tańsza kontrola w teście (zrobione). (b) Znacznik natywny + bramka pomijająca aktywację WCSession po progu (Swift, ok. 2 h + CI macOS). **Rekomendacja: (a).**
- N12-06–N12-08: zgłoszenia do 08/05 bez decyzji (latentne lub komunikat).

## 5. Plan E3 (po odpowiedzi)
Ćwiczenia automatem na Linuksie (adapter `node:sqlite` z testów, prawdziwy dysk): awaria w pętli (`rozpocznijStart` ×3 bez kamienia → tryb awaryjny → archiwum z licznościami, SHA plików bazy przed i po), zepsuty plik bazy (otwarcie → `uszkodzony` → surowa kopia → ZIP z SHA z manifestu), brak miejsca (błąd `ENOSPC` w kopii i zapisie stanu), przerwane przywracanie (proces zabity SIGKILL w środku transakcji → baza bez zmian, ponowne przywrócenie udane); runbook `docs/niezawodnosc/runbook.md`; przekazanie do 07 i 10. Szacunek: ok. 3–4 h agenta; oczekiwanie: brak (bez macOS); czas właściciela: 0 (decyzje — koordynator, P-087).
