# Audyt: Wydanie i sklepy — Oczko — recenzja niezależna BG (KO-056, migracja ASC API v2) — 2026-11-13
Commit przedmiotu: `de5497bc` (diff `2ed5215a..de5497bc`, 14 plików) · Tryb: audit (rola 10-wydanie, sesja BH) · Gałąź: `claude/bh-recenzja-bg-2026-11-13` od `de5497bc` (HEAD zgodny z poleceniem) · Prompt roli przeczytany do linii `=== KONIEC PROMPTU ROLI ===`.
Środowisko: Linux (chmura), Node, git, `npm ci` kod 0, sieć do developer.apple.com (surowy JSON DocC) i anonimowy odczyt repo `trening`. Bez macOS/Xcode (niepotrzebne w tym zakresie). Żadnych wywołań App Store Connect, żadnych workflowów.

Wyjątek nazwany: tryb audit nie zmienia plików śledzonych, ale polecenie koordynatora BH (pkt 4.5) każe zapisać ten raport w `docs/wydanie/bh-2026-11-13/` i wypchnąć; dowody leżą obok (`dowody/`), bez sekretów. Kodu BG nie poprawiałem.

## Podsumowanie

**Werdykt: TAK** (do scalenia i przebiegu właściciela według `docs/wydanie/asc-v2/przebieg-wlasciciela.md`), z jedną poprawką zalecaną przed pierwszym `apply` na produktach już zatwierdzonych (10-wydanie-001, dziś teoretyczna).

Każda ścieżka, typ zasobu, relacja `version`, atrybut i stan wersji użyte przez skrypt i atrapę zgadzają się z dokumentacją Apple odczytaną dziś (surowy JSON stron i schematów, `dowody/apple-schematy.txt`, `dowody/apple-cytaty.txt`). Dry-run nie wykonuje zapisów (kod i test), apply nigdy nie usuwa (klient dopuszcza tylko GET/POST/PATCH, atrapa przerywa test przy DELETE), wersja w recenzji nie jest ruszana (sprawdzone dla READY_FOR_REVIEW, WAITING_FOR_REVIEW, IN_REVIEW). Testy: 26 z 36 czerwonych na `2ed5215a` z właściwego powodu, 36 z 36 zielonych na `de5497bc`; `npm run verify` na `de5497bc`: kod 0 (607 zestawów, 7365 testów).

| ID | Poziom | Rodzaj | Tytuł | Status |
|---|---|---|---|---|
| 10-wydanie-001 | P2 | D | Nowa wersja bez dziedziczenia gubi lokalizacje języków „czeka” i „błąd” z poprzedniej wersji | otwarte |
| 10-wydanie-002 | P3 | D | Komunikat odmowy wycofanego endpointu maskuje całą ścieżkę („POST /v1/{id}”) | otwarte |
| 10-wydanie-003 | P3 | D | Testy nie pokrywają stanów READY_FOR_REVIEW, IN_REVIEW i REJECTED; P-789 nie opisuje zachowania po odrzuceniu | otwarte |
| 10-wydanie-004 | P3 | D | Przebieg właściciela nie mówi wprost, że teksty w nowej wersji roboczej nie są widoczne w sklepie przed recenzją tej wersji | otwarte |

P0 i P1: brak.

## Linia bazowa i założenia

Zakres jest wąski (skrypt API, nie strona produktu), więc z wymiarów roli przeszedłem te, których dotyczy diff:
- **Poświadczenia:** workflow bez zmian w obsłudze sekretów (środowisko `release`, maskowanie, plik klucza usuwany `if: always()`); skrypt nie loguje tokenu ani odpowiedzi API (`scripts/asc/iap-localizations.mjs:64-66`). Sprawdzone, bez uwag.
- **Recenzja / zakupy:** skrypt nie wysyła niczego do recenzji (brak `reviewSubmissions` i `*Submissions` w kodzie; klient odmawia `*Submissions` v1). Sprawdzone.
- **Wydanie / zły przebieg:** zawsze najpierw dry-run (workflow uruchamia krok podglądu przed zapisem, `.github/workflows/asc-iap-localizations.yml:56-65`), idempotencja drugiego apply w testach. Sprawdzone.
- **Strona produktu, prywatność, formularze, terminy:** poza zakresem diffu — sprawdzone, brak związku.

Soczewki: recenzent App Review (nie dotyczy — nic nie trafia do recenzji), napastnik czytający repo (brak nowych sekretów; tylko kody lokalizacji i nazwy produktów w logu), właściciel wydający poprawkę (przebieg 4 kroków, dry-run bez zapisów).

Wzorzec: dokumentacja Apple „Migrating In-App Purchase metadata to v2” i „Working with … versions” (odczyt 2026-11-13). Analogia Trening (P-315): `lkarwowski494/trening` @2d97581 (2026-11-11) nadal woła v1 (`dowody/trening-v1.txt`, wiersze 95–117 skryptu) — twierdzenie BG potwierdzone, analogii brak.

Założenia BG oznaczone `[DO USTALENIA]` (dziedziczenie lokalizacji przez nową wersję; widoczność lokalizacji v1 w wersjach; termin usunięcia v1) — dokumentacja dalej ich nie rozstrzyga; zmiany statusu w `docs/zalozenia.md` nie proponuję.

## Pokrycie (co sprawdzono, czego nie)

| Obszar / pliki / ekrany | Sprawdzone? | Jak (plik dowodu) |
|---|---|---|
| `scripts/asc/iap-localizations.mjs` (cały, 219 linii) | tak | odczyt linia po linii; sonda `dowody/sonda-bh.txt` |
| `scripts/asc/wycofane-endpointy.mjs`, `kontrola-wycofane.mjs` | tak | odczyt; testy kontroli w `dowody/testy-de5497bc.txt` |
| `tests/wydanie/asc-iap-v2*.{ts,mjs}`, `iap-nazwa-aplikacji.test.ts` | tak | odczyt; porównanie atrapy ze schematami Apple; przebieg na obu commitach |
| `.github/workflows/asc-iap-localizations.yml` | tak | odczyt (zmienione tylko komentarze) |
| `docs/wydanie/asc-v2/*`, P-789…P-791, `sklep.md`, `package.json` | tak | odczyt; cytaty Apple z inwentarza sprawdzone u źródła |
| Dokumentacja Apple: 4 przewodniki, 6 stron grup zasobów, 9 endpointów, schematy żądań i obiektów | tak | `dowody/apple-schematy.txt`, `dowody/apple-cytaty.txt` |
| Zachowanie prawdziwego App Store Connect | **nie sprawdzono** | zakaz polecenia; pierwszy dowód to dry-run właściciela |
| OpenAPI 4.6 (zip) — twierdzenie BG, że nie oznacza v1 jako deprecated | nie sprawdzono | nieistotne dla werdyktu (strony endpointów mają flagę, sprawdzone) |

## Kontrola dowodów i sekretów

- `node sprawdz-raport.mjs docs/wydanie/bh-2026-11-13/recenzja-bg.md . --rola 10-wydanie` (kopia skryptu w scratchpadzie): wynik w `dowody/sprawdz-raport.txt`.
- Testy na `de5497bc`: `npx jest tests/wydanie/asc-iap-v2.test.ts tests/wydanie/iap-nazwa-aplikacji.test.ts` → 36 passed, **KOD 0** (`dowody/testy-de5497bc.txt`).
- Testy na `2ed5215a` (worktree, testy z `de5497bc`): 26 failed, 10 passed, **KOD 1** (`dowody/testy-2ed5215a.txt`). Powody czerwieni: stary skrypt woła `…/subscriptionGroupLocalizations` v1 itd. → atrapa 404, zero zapisów v2 („Expected length: 4, Received length: 0”), odmowy klienta nie ma, brak pliku `kontrola-wycofane.mjs`, brak nagłówka KO-056. Zielone na starym (10) to niezmienniki zachowane: dry-run bez zapisów, odmowa DELETE, dozwolone ścieżki v2, test braku nazwy po stronie planu — zgodnie z oczekiwaniem.
- `npm run verify` na `de5497bc`: Test Suites 607 passed, Tests 7365 passed, **KOD 0** (`dowody/verify-de5497bc.txt`).
- Sekrety: raport i dowody nie zawierają kluczy, tokenów ani identyfikatorów klucza (atrapa używa `TOKEN-TESTOWY`).

## Stosowalność listy kontrolnej

| Pozycja | Status (dotyczy / nie dotyczy + powód / decyzja D-xx) | Wynik (ok / znalezisko ID / nie sprawdzono + powód) |
|---|---|---|
| WYD-01 | dotyczy (workflow z sekretami) | ok — bez zmian w obsłudze sekretów; tylko `workflow_dispatch`, środowisko `release` |
| WYD-02 | nie dotyczy — brak wysyłki buildu | — |
| WYD-03 | nie dotyczy — brak zmian wersji aplikacji | — |
| WYD-04 | dotyczy częściowo (teksty produktów zakupu) | ok — teksty bez zmian (`produkty.store.json` poza diffem); zmienia się tylko droga zapisu |
| WYD-05 | nie dotyczy — zrzuty poza zakresem | — |
| WYD-06 | nie dotyczy — brak nowych tekstów | — |
| WYD-07 | nie dotyczy | — |
| WYD-08 | nie dotyczy — brak nowych danych | — |
| WYD-09 | nie dotyczy — skrypt CI, nie aplikacja | — |
| WYD-10 | nie dotyczy | — |
| WYD-11 | dotyczy (produkty zakupu i ich wersje dla recenzji) | ok z uwagą — 10-wydanie-004 |
| WYD-12 | nie dotyczy | — |
| WYD-13 | dotyczy (plan zapisu w ASC, dry-run przed apply, plan na błąd) | ok z uwagami — 10-wydanie-001, 10-wydanie-003 |
| WYD-14 | nie dotyczy — iOS | — |
| WYD-15 | nie dotyczy — strona produktu poza zakresem | — |

## Znaleziska (szczegóły)

### 10-wydanie-001 · Nowa wersja bez dziedziczenia gubi lokalizacje języków „czeka” i „błąd” z poprzedniej wersji
- Pozycja listy kontrolnej: WYD-13
- Poziom: P2
- Realność: teoretyczny dziś (w `docs/wydanie/metadane/produkty.store.json` żaden język nie ma `czeka`; 6 języków ma `ascLocale: null`), brzegowy po powrocie pola `czeka` (P-422 już go używał) albo przy braku nazwy aplikacji dla lokalizacji grupy · Pewność: wysoka
- Rodzaj: D
- Dowód: `scripts/asc/iap-localizations.mjs:94` „const known = new Set(Object.values(translations).map(t => t.ascLocale).filter(Boolean));” — języki z `czeka` i z akcją `błąd` mają `ascLocale`, więc nie trafiają do `extra`; kopia „obcych” w `scripts/asc/iap-localizations.mjs:182-185` obejmuje tylko `extra`. Sonda (`dowody/sonda-bh.txt`, pkt 2): zatwierdzona wersja z `en-US,pl`, `pl` ma `czeka`, Apple nie dziedziczy → nowa wersja ma tylko `en-US`, kod 0, bez ostrzeżenia.
- Mechanizm: lokalizacja obecna w starej wersji, której skrypt nie zapisuje (czeka / błąd planu), znika z nowej wersji; po jej zatwierdzeniu znika ze sklepu, choć skrypt deklaruje „NIGDY nie usuwa” (`scripts/asc/iap-localizations.mjs:17`). `grep -n "obceStare\|known" scripts/asc/iap-localizations.mjs` → 2 miejsca: :94, :179-185.
- Powraca: nie
- Wzorzec lub źródło: Apple, working-with-in-app-purchase-versions (odczyt 2026-11-13): „Versions are read-only after creation. To change a version’s contents, create a new version.” — zawartość nowej wersji jest w całości odpowiedzialnością skryptu (`dowody/apple-cytaty.txt`).
- Kroki w aplikacji: właściciel uruchamia `apply` dla produktu w stanie APPROVED, w pliku jest język z `czeka` albo grupa bez nazwy aplikacji dla lokalizacji obecnej w ASC.
- Opcje: (a) kopiować do nowej wersji każdą lokalizację starej wersji, której plan nie tworzy ani nie aktualizuje (czeka, błąd, obca) — mały diff, zachowuje niezmiennik; (b) przy takim przypadku nie tworzyć wersji i zgłosić PROBLEM — bezpieczniej, ale wymaga ręcznego kroku. Rekomendacja: (a).
- Test akceptacyjny: w `tests/wydanie/asc-iap-v2.test.ts` scenariusz „zatwierdzona wersja z `pl` (czeka) + Apple nie dziedziczy → nowa wersja zawiera `pl` z tekstem starej wersji”; czerwony na `de5497bc`.
- Status: otwarte

### 10-wydanie-002 · Komunikat odmowy wycofanego endpointu maskuje całą ścieżkę („POST /v1/{id}”)
- Pozycja listy kontrolnej: WYD-13
- Poziom: P3
- Realność: realny (każda odmowa) · Pewność: wysoka
- Rodzaj: D
- Dowód: `scripts/asc/iap-localizations.mjs:59` — wzorzec `/\/[0-9A-Za-z_-]{6,}/g` zamienia też nazwy zasobów; sonda pkt 1 (`dowody/sonda-bh.txt`) pokazuje komunikat `Wycofany endpoint POST /v1/{id} — odmowa`.
- Mechanizm: maska identyfikatorów obejmuje litery; `grep -n "replace(/\\\\/\[0-9A-Za-z" scripts/asc/*.mjs` → 1 trafienie (:59). Linia :66 używa poprawnej maski `[0-9a-f-]{8,}`.
- Powraca: nie
- Wzorzec lub źródło: zasada roli 10 nr 5 (bez identyfikatorów w logu) — zachowana; problem tylko diagnostyczny.
- Kroki w aplikacji: ktoś dopisuje wycofaną ścieżkę; log CI nie mówi, którą.
- Opcje: (a) maska jak w :66 (tylko cyfry/hex) — prosta; (b) zostawić — test sprawdza tylko słowo „wycofan”. Rekomendacja: (a).
- Test akceptacyjny: odmowa `POST /v1/subscriptionLocalizations` ma w komunikacie `subscriptionLocalizations`.
- Status: otwarte

### 10-wydanie-003 · Testy nie pokrywają stanów READY_FOR_REVIEW, IN_REVIEW i REJECTED; P-789 nie opisuje zachowania po odrzuceniu
- Pozycja listy kontrolnej: WYD-13
- Poziom: P3
- Realność: brzegowy · Pewność: wysoka
- Rodzaj: D
- Dowód: `tests/wydanie/asc-iap-v2.test.ts:147` testuje tylko `WAITING_FOR_REVIEW`. Sonda pkt 3: READY_FOR_REVIEW i IN_REVIEW → kod 1, zero zapisów (poprawnie); REJECTED i DEVELOPER_REJECTED → skrypt tworzy nową wersję i zapisuje (zgodne ze zdaniem Apple o tworzeniu nowej wersji do zmiany treści, `dowody/apple-cytaty.txt`, ale nieopisane w P-789 ani w przebiegu właściciela).
- Mechanizm: zbiór `W_RECENZJI` (`scripts/asc/iap-localizations.mjs:111`) jest poprawny wobec enumu Apple (`dowody/apple-schematy.txt`: 9 stanów), brak tylko trwałej kontroli dla pozostałych dwóch stanów.
- Powraca: nie
- Wzorzec lub źródło: enum `state` w `InAppPurchaseVersion.Attributes` (odczyt 2026-11-13).
- Kroki w aplikacji: produkt po odrzuceniu; właściciel uruchamia apply i dostaje nową wersję bez zapowiedzi w dokumentach.
- Opcje: (a) `test.each` po trzech stanach recenzji + test REJECTED → nowa wersja, zdanie w P-789/przebiegu; (b) zostawić. Rekomendacja: (a).
- Test akceptacyjny: testy dla READY_FOR_REVIEW, IN_REVIEW (kod 1, 0 zapisów) i REJECTED (1 nowa wersja) zielone.
- Status: otwarte

### 10-wydanie-004 · Przebieg właściciela nie mówi wprost, że teksty w nowej wersji roboczej nie są widoczne w sklepie przed recenzją tej wersji
- Pozycja listy kontrolnej: WYD-11
- Poziom: P3
- Realność: brzegowy (dziś produkty Oczka nie przeszły recenzji; dotyczy produktów zatwierdzonych) · Pewność: średnia
- Rodzaj: D
- Dowód: `docs/wydanie/asc-v2/przebieg-wlasciciela.md:11` mówi tylko, że apply „Nie wysyła jej do recenzji”; krok 5 (:15) odsyła wysyłkę poza zakres. Apple (migrating…, odczyt 2026-11-13): wersja to „a draft container that groups the metadata and images that go through App Review together”; grupa: „Submit a subscription group version independently only when you change group-level localization without changing any subscription in the group.”
- Mechanizm: kod 0 po apply może zostać odczytany jako „teksty są w sklepie”.
- Powraca: nie
- Wzorzec lub źródło: jw. (`dowody/apple-cytaty.txt`).
- Kroki w aplikacji: apply na zatwierdzonym produkcie → teksty czekają w wersji roboczej do wysyłki.
- Opcje: (a) jedno zdanie w kroku 3 przebiegu + wiersz w logu skryptu przy nowej wersji; (b) tylko zdanie w przebiegu. Rekomendacja: (b).
- Test akceptacyjny: przebieg zawiera zdanie o widoczności tekstów dopiero po zatwierdzeniu wersji i o osobnej wysyłce wersji grupy.
- Status: otwarte

## Do sprawdzenia (pewność ≤ 80%)

- **Sprzeczność w dokumentacji Apple:** „`PREPARE_FOR_SUBMISSION`: The version is open for editing. You can add, change, or remove localizations” obok „Versions are read-only after creation”. Interpretacja BG (tylko do odczytu poza stanem roboczym) jest jedyną spójną: żądanie utworzenia wersji ma tylko relację rodzica, bez atrybutów (`dowody/apple-schematy.txt`), więc lokalizacje da się dodać wyłącznie po utworzeniu. Czy POST lokalizacji v2 do wersji nie-roboczej zwraca 409 — Apple wymienia 409 bez warunku; atrapa to zakłada (`tests/wydanie/asc-iap-v2-atrapa.mjs:72`), skrypt na tym nie polega (pisze tylko do wersji roboczej). Rozstrzygnie dry-run/apply właściciela.
- **Czy `POST …Versions` przy istniejącej wersji roboczej zwraca 409** (atrapa `tests/wydanie/asc-iap-v2-atrapa.mjs:62`): niepotwierdzone; skrypt tworzy wersję tylko, gdy roboczej nie ma, więc nieistotne dla bezpieczeństwa.
- **Czy można utworzyć nową wersję, gdy poprzednia jest REJECTED** — dokumentacja nie zabrania; przy odmowie skrypt zgłasza błąd bez innych zapisów.
- **Dziedziczenie lokalizacji i widoczność lokalizacji v1 w wersjach** — jak u BG, `[DO USTALENIA]` do pierwszego przebiegu.

## Co działa dobrze i należy zachować

- Dry-run bez zapisów: zapisy wyłącznie pod warunkiem `apply` (`scripts/asc/iap-localizations.mjs:173-174` i `:192`), discover i odczyt wersji tylko `client.list` (GET); test `zero żądań innych niż GET, stan bez zmian`.
- Nigdy nie usuwa: `ALLOWED_METHODS` = GET/POST/PATCH i odmowa przed `fetch` (`scripts/asc/iap-localizations.mjs:39`, `:54`); atrapa rzuca wyjątek przy DELETE (`tests/wydanie/asc-iap-v2-atrapa.mjs:37`).
- Wersja w recenzji nietknięta: zapis tylko do wersji roboczej (`wersjaId = v.robocza?.id`), a gdy jej brak i jest wersja w recenzji — PROBLEM bez zapisu (`scripts/asc/iap-localizations.mjs:169-172`). Atrapa odrzuca zapis do każdej wersji poza PREPARE_FOR_SUBMISSION, więc zapis do złej wersji wyszedłby w testach.
- Atrapa odzwierciedla kształt Apple, nie tylko autora: ścieżki, typy, `relationships.version`, wymagane `locale`/`name`, odrzucanie nieznanych atrybutów, `attributes.version` (integer) i `state` — wszystko zgodne ze schematami odczytanymi dziś.
- Odmowa wycofanych ścieżek w kliencie + kontrola repo w `jakosc:kontrole` z plikiem-pułapką (trwała kontrola, D-050).
- Token nie opuszcza `api.appstoreconnect.apple.com` (`scripts/asc/iap-localizations.mjs:57`).

## Decyzje dla właściciela

Brak nowych. P-789…P-791 (BG) — recenzja nie znajduje podstaw do weta. Pula P-792…P-793 niewykorzystana. Kolejny krok bez zmian: scalenie (zgoda właściciela) i dry-run według `przebieg-wlasciciela.md`; 10-wydanie-001 zalecane przed pierwszym `apply` na produktach zatwierdzonych (dziś teoretyczne).

## Proponowane polecenie naprawy
`node tools/assemble.mjs 10-wydanie --tryb fix --zadania 10-wydanie-001,10-wydanie-002,10-wydanie-003,10-wydanie-004`
