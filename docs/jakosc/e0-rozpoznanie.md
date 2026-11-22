# E0 Rozpoznanie (rola 07-jakosc, build) · 2026-10-25 · STOP E0
Prompt: `prompts` @97ec212, `07-jakosc --tryb build`, moduły e2e-mobilne, geo-slady, wlasnosci-i-domena, wydanie (64 487 znaków). Gałąź `claude/jolly-thompson-paz6d8` od 8092f10 (P-089). Na STOP-y odpowiada koordynator (P-087).

## 1. Macierz możliwości środowiska (kontener Linux, 2026-10-25)
| Metoda | Dostępna | Dowód (komenda → wynik) |
|---|---|---|
| Node, npm, git | tak | `node -v` → v22.22.0; npm 10.9.4; `uname -a` → Linux 6.18 x86_64 |
| Jest (runner projektu, `jest-expo` ~57) | tak | `npm ci` kod 0; `npx jest` → 100 zestawów, **956/956**, kod 0 (36 s) |
| TypeScript | tak | `npm run typecheck` → kod 0 |
| Lint | **nie ma w projekcie** | `package.json` bez skryptu `lint`, brak konfiguracji ESLint |
| fast-check | tak | `fast-check/package.json` → 4.10.2 |
| Stryker | tak (scratchpad, nie w repo) | `npm i -D @stryker-mutator/core@9` kod 0; `npx stryker --version` → 9.6.1 |
| `node:sqlite` (adapter portu bazy w testach) | tak | `DatabaseSync(':memory:')` → `sqlite_version()` = 3.50.4 |
| Playwright / Chromium | tak | `playwright/package.json` → 1.63.0 (zrzuty Expo web, gdy powstanie) |
| Maestro (Android i iOS) | **nie** | `which maestro` → brak; Android: brak `emulator`/`adb`, brak `/dev/kvm` |
| `xcodebuild`, symulator iOS, XCTest, `performAccessibilityAudit` | **nie** (tylko macOS) | `which xcodebuild` → brak; uruchamiane wyłącznie na runnerze macOS w CI |
| `gh` | **nie** | `gh auth status` → „Failed to log in … (GH_TOKEN)”; zamiennik: narzędzia MCP GitHub (odczyt przebiegów działa) |
| Przebiegi CI repo | tak, odczyt | MCP `actions_list` → 91 przebiegów; ostatnie na `main` (stara wersja) czerwone: `tests-tz` 18–20.10, `E2E iOS` 17.10 |
| CI na gałęzi roboczej | **nie dziś** | stare workflowy: `ci.yml` push tylko `main` + `pull_request`; `e2e-ios.yml` push `main`; `tests-tz.yml` cron (z `main`); nowy workflow musi mieć wyzwalacz na gałąź roboczą |
| Sieć | tak | `registry.npmjs.org` 200; `docs.github.com` 200 |
| Widoczność repo | **publiczne** | MCP `search_repositories repo:lkarwowski494/oczko` → `"private": false` |

Koszt CI (odczyt 2026-10-25, surowy tekst przez `curl` + `grep`):
- „GitHub Actions usage is free for self-hosted runners and for public repositories that use standard GitHub-hosted runners.” (docs.github.com/en/billing/concepts/product-billing/github-actions).
- Plan Free, standardowe runnery: 20 zadań równolegle, **najwyżej 5 zadań macOS równolegle**; „Each job in a workflow can run for up to 6 hours of execution time.” (docs.github.com/en/actions/reference/limits).
- Etykiety: `macos-26` (arm64) i `macos-latest` wskazują ten sam obraz `macos-26-arm64` (docs.github.com/en/actions/reference/runners/github-hosted-runners).

## 2. Stan wyjściowy kodu i narzędzi
| Kontrola | Wynik |
|---|---|
| `npx jest` | 956/956, kod 0 (testy kodu 0.1.0 i i18n roli 09; nie są dowodem działania, P-004) |
| `npm run typecheck` | kod 0 |
| `node --no-warnings docs/architektura/narzedzia/sprawdz-schemat.mjs` | „wszystkie kontrole OK”, kod 0 |
| `node docs/architektura/narzedzia/granice.mjs src` | **kod 1, 13 naruszeń w 93 plikach** (stary kod 0.1.0; kontrola może być dziś tylko informacyjna) |
| `node docs/monetyzacja/limit-test.mjs` / `dostep-test.mjs` | 35/35, 24/24, kod 0 |
| `node docs/architektura/eksperymenty/e1/kontrola-adr.mjs docs/adr` | błędy: 0 |
| `npm run -s i18n` | błędy 0, języki: en, 9 kluczy |

## 3. Przepływy i kryteria akceptacji
Inwentarz: [`e0/kryteria.md`](e0/kryteria.md) (luki, tabele RD i wektorów, mapa F → BR), [`e0/kryteria.json`](e0/kryteria.json) (220 pozycji z `plik:linia`), generator `narzedzia/inwentarz-kryteriow.py` (`python3 -I` → kod 0, wynik identyczny bajt w bajt). Oceny „sprawdzalne” i „poziom” to [OCENA] roli 07 do E1.
- 49 funkcji MVP, **71 BR** w zakresie (67 z tabeli zakresu + BR-ZAK-005–007, BR-DAN-012 spoza tabeli).
- **220 kryteriów:** 183 scenariusze BR, 13 NFR, 15 KP, 9 scenariuszy „tylko telefon”. Sprawdzalne automatem: tak 159, częściowo 56, nie 5.
- Poziom (wstępny): domena-Node 70, dane `node:sqlite` 53, ekran RNTL 52, E2E symulator 26, tylko urządzenie 18.
- Wyrocznie: `tests/wektory/brd.json` 102 wektory w 18 RD (11 RD w zakresie), limit L 17 / S 10 / Z 8, dostęp W 18 / P 6, treści 175 (`docs/tresci/wektory.json`), scalanie M-01–M-08.
- Przepływy: przejście poznawcze z1–z5 (`docs/design/przejscie/wynik.md`), macierz 7 stanów × 12 wariantów = 84 zrzuty wzorcowe; U-1–U-12 tylko w `oczko-warsztat`.
- Dochodzi P-089 (koordynator, 2026-10-25): ceny tylko z StoreKit, Family Sharing 3 produkty, okno „Uczciwe zasady” po pierwszym ukończonym dniu z robótką (tylko darmowa), karta Pro po imporcie (warunkowo).
- Lista kontroli automatycznych roli 05 (13 pozycji, `e3-…md` §4), 22 ścieżki utraty danych (`dane.md`), „Dla roli 07” roli 12 (`docs/niezawodnosc/e1-decyzje.md`), przekazanie 09 (`docs/lokalizacja/e1-mechanizm.md`): wszystkie trafią do planu E2 z miejscem albo powodem.

## 4. Założenia z wejścia (hipotezy, na których stoi strategia)
| Założenie | Źródło | Status | Skutek dla 07 |
|---|---|---|---|
| ZAL-030: +1 z Live Activity działa przy zablokowanym telefonie | 05 | hipoteza, ryzyko szczątkowe (P-070 3a) | test intencji na symulatorze; zablokowany telefon na liście „Nie sprawdzono” |
| Wzorzec CI Treningu (Expo SDK 56, `macos-26`, Xcode ≥ 26.4) działa dla Oczka (SDK 57, cel `watch`, `@bacons/apple-targets`) | koordynator, plan-app-store krok 1 | hipoteza | pierwszy przebieg macOS informacyjny (E3); cel zegarka to ryzyko 2 planu |
| P-041: weryfikacja tylko automatem | właściciel | decyzja | sprzeczna z tabelą „tylko telefon” (pytanie Q1) |
| Wektory roli 06 wygrywają z tekstem RD-10 | P-084 (późniejsza decyzja, źródło szczebla 3) | potwierdzone rejestrem decyzji | test klasyfikacji na `docs/tresci/wektory.json`; ER do 01 |
| Ekrany nie mają sygnatur w ADR (tylko porty i przypadki użycia) | `moduly.md` | stan dokumentów | pytanie Q2 (gdzie testy ekranów przed kodem) |

## 5. Luki w wejściach (zgłoszenia; nie blokują E1)
| Do | ID | Co | Dowód |
|---|---|---|---|
| 01 | ER-34 | RD-10: „luka (np. 25,5) daje poza tabelą” przeczy P-084 i `KL4-25_5` → {2}; RD-10-W2 zapisuje zbiór {2,3} jako liczbę `2.3` | `docs/brd/reguly.md:157`, `tests/wektory/brd.json` (RD-10-W2), `docs/tresci/wektory.json` |
| 01 | ER-35 | OP-03 nadal otwarte w BRD, rozstrzygnięte P-081 P3a | `docs/brd/README.md:103`, BR-KAL-003/S1 |
| 01 | ER-36 | kryteria niejednoznaczne z propozycją brzmienia: BR-LIC-004/S1–S2, BR-LIC-005/S2 (dźwięki, których nie ma), BR-LIC-020/S2, BR-WZR-007/S3, BR-DNI-006/S1 (kolejność kilku projektów z terminem; P-048 (4) daje regułę — do wpisania w BR) | `e0/kryteria.md` „Luki” |
| 02 | — | tabela „tylko telefon” z modelu B („dane do odczytu” przeczy KP-02 V4), brak scenariuszy subskrypcji W-15–W-18; L-07 i L-13 cytowane w BR bez wektora; przekazanie mówi „L-01–L-15, 14/14” | `docs/monetyzacja.md:581–593`, `:51`; `wektory-limitu.json`; `wymagania-dane.md:62, :194, :273` |
| 03 | — | BR-ZAK-005–007 i BR-DAN-012 w wersji 1 bez F w tabeli zakresu; BR-LIC-012 (F-09) a ekran zawsze z „Now knitting row N” | `docs/scope-contract.md:47, :219`; `design-spec.md:30` |
| 04 | — | stany bez zrzutu wzorcowego (zablokowany, seria, błąd zapisu, offline, pusty, oferty z subskrypcją i bez sieci) i ekrany nienarysowane (wzór poziomo, zegarek, ekran blokady, kalendarz, Ustawienia, tryb awaryjny ADR-0019, okno „Uczciwe zasady” P-089); ok. 20 stanów z BR bez makiety | `design-spec.md:51–57, :95`; `e0/kryteria.md` |
| 01/04 | — | NFR-DOS-002, NFR-WYD-001 bez progu (OP-16, OP-17) | `docs/brd/README.md:116–117` |
Do czasu poprawek: test sprawdza zachowanie wobec parametru albo wyroczni wyższego rzędu (decyzja nowsza > tekst BRD), z ID zgłoszenia w nazwie.

## 6. Stosowalność modułów
| Moduł | Dotyczy | Powód |
|---|---|---|
| `e2e-mobilne` | **tak** | główny przepływ (+1, limit, zakup) zależy od ekranu, nawigacji, Live Activity, zegarka i StoreKit; P-041 wymaga symulatora w CI |
| `wlasnosci-i-domena` | **tak** | `limit`, `dostep`, `scal`, licznik, RD-11–RD-17, klasyfikacja grubości i przeliczenia (F-38) to reguły domenowe w czystym TS |
| `geo-slady` | **nie** | aplikacja nie wyzwala niczego po lokalizacji (`e3-…md` §1: „lokalizacja: sprawdzone, brak”); zdjęcia bez GPS (P-073) testuje się bez śladów. Sekcja „Czas i strefy” wzorców **dotyczy** (RD-16, limit miesiąca, północ) |
| `wydanie` | **tak, w build tylko plan** | plan wydania w strategii: jeden SHA, test aktualizacji z poprzedniej wersji (od 1.0; 0.1.0 wyjęte P-070), lista „tylko telefon”; audyt po 08 |

## 7. Wzorzec Treningu (do E2)
Odczyt `lkarwowski494/trening` @928d0ff (2026-10-25), raport z `plik:linia`: [`e0/trening-wzorzec.md`](e0/trening-wzorzec.md). Do przeniesienia: `tests.yml` na każdy push (Linux), `e2e-ios.yml` na `macos-26` (build raz ok. 40 min → artefakt; części E2E LPT z wagami, test „każdy scenariusz w dokładnie jednej części”), interpreter Maestro w Jest, sztuczny sklep `EXPO_PUBLIC_STORE_FAKE=1` tylko w buildzie E2E ze strażnikiem, podpis bez certyfikatu (`CODE_SIGNING_ALLOWED=NO` na symulatorze), wybór najnowszego Xcode 26, `tests-tz` z 7 strefami, klawiatura (retry + `eraseText` + wpis po znaku + `assertVisible`). **Różnica:** Trening nie ponawia automatycznie zadania przy niedostępnym `macos-26` (tylko reguła ręczna `CLAUDE.md:60–63`); propozycja automatu w E2. Czasów przebiegów nie odczytano z API (repo `trening` poza zakresem sesji); liczby z komentarzy i dokumentów Treningu, do pomiaru w pierwszym przebiegu Oczka.

## 8. Plan i czas
| Etap | Agent | Oczekiwanie | Właściciel |
|---|---|---|---|
| E1 rejestr ryzyk (przepływy × sposoby awarii, wyrocznie, 4 soczewki jako niezależne subagenty) | 1,5–2 h | — | 0 (koordynator, P-087) |
| E2 plan testów (poziomy, narzędzia z opcjami, CI z kosztem, DoD, „tylko telefon”, mapa 13 kontroli 05 + 12 + 09) | 1–1,5 h | — | 0 |
| E3 testy akceptacyjne czerwone (domena i dane najpierw, potem ekrany i scenariusze Maestro), zaślepki z sygnaturami `moduly.md`, narzędzia (`czas.mjs`, części E2E), workflow CI na gałęzi | 5–8 h | pierwszy przebieg macOS informacyjny: build ok. 40 min + E2E; `macos-26` bywa niedostępny wieczorami | 0 |
| E4 przekazanie do 08 | 0,5–1 h | — | 0 |

## 9. Pytania na STOP E0 (odpowiada koordynator, P-087)
**Q1. Scenariusze „tylko telefon” (zakup, przywrócenie, Family Sharing, zwrot) wobec P-041.**
- (a) **Lista kontrolna z telefonu przy TestFlight wewnętrznym** jako jedyny krok właściciela (plan-app-store krok 9: 45–75 min; tak robi Trening), wąsko: zakupy w piaskownicy i aktualizacja; reszta automatem albo „Nie sprawdzono”. Wyjątek nazwany od P-041. **Rekomendacja** (zgodne z planem koordynatora i Treningiem; StoreKit w piaskownicy nie da się sprawdzić na symulatorze bez pliku konfiguracji StoreKit w Xcode).
- (b) Ściśle P-041: wszystkie jako ryzyko szczątkowe „Nie sprawdzono”, zakupy tylko na sztucznym sklepie w E2E. Kompromis: zero czasu właściciela, ale pierwszy prawdziwy zakup odbywa się dopiero u klienta.

**Q2. Testy ekranów (52 kryteria RNTL) przed kodem: ekrany nie mają sygnatur w ADR.**
- (a) **Testy RNTL teraz, wobec zaślepek ekranów z nazwą pliku z `moduly.md` i zapytań po roli i etykiecie VoiceOver z `design-spec.md`** (wyrocznia zatwierdzona przez 04); zaślepka rzuca `NIEZAIMPLEMENTOWANE: <ID>`. **Rekomendacja**: kryterium ma test przed kodem, etykiety VoiceOver to i tak kontrakt 04.
- (b) Kryteria ekranowe jako testy przypadków użycia (Node) + scenariusze Maestro; testy RNTL pisze 08 razem z ekranem według DoD. Kompromis: mniej zaślepek, ale 08 pisze część testów sama (słabsze „test przed kodem”).

**Q3. Zgłoszenia z §5.**
- (a) **Wpisy teraz w erracie BRD (ER-34–ER-36) i w rejestrze 02/03/04 jako otwarte; poprawki zbiorczo przy najbliższej sesji tych ról, bez blokowania 07** (testy z wyrocznią wyższego rzędu i ID zgłoszenia w nazwie). **Rekomendacja.**
- (b) Krótkie sesje fix 01 i 02 przed E3 roli 07. Kompromis: czystsze wejście, ok. 2 sesje i dzień kalendarza więcej.

Wyjątek nazwany (zasada 19): inwentarz kryteriów i odczyt Treningu wykonały dwa subagenty bez wglądu w siebie; kluczowe tezy sprawdzone u źródła przez rolę (RD-10, L-07/L-13, tabela „tylko telefon”, koszt CI).
