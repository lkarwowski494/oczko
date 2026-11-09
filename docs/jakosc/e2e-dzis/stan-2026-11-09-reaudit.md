# E2E i CI do pętli po reaudytach (P-626 d, P-627), rola 07, 2026-11-09

Polecenie: `oczko-warsztat/koordynacja/role-2026-11-09/07-reaudit.md` (main 4a18787). Gałąź `claude/kopia-07-reaudit-2026-11-09` od 0a35bba4. `src/`, `app/` nietknięte.
Na symulatorze nic nie uruchomiono (Linux); zmiany scenariuszy czekają na przebieg 5 (macOS). Pkt 6 (czerwone attempt 2 przebiegu 4) — po komunikacie koordynatora.

## 1. Maestro w CI (P-626 d)
| Opcja | Kompromis |
|---|---|
| **(a) wybrana:** `curl -fsSL --retry 5 --retry-all-errors --retry-delay 20` paczki `cli-$MAESTRO_VERSION/maestro.zip` z GitHub Releases + `MAESTRO_ZIP_SHA256` (`shasum -a 256 -c`), bez `get.maestro.mobile.dev` | każdy przebieg pobiera ok. 350 MB; 504 przechodzi ponowieniem (do ok. 100 s czekania); zmiana wersji = commit dwóch wartości |
| (b) `actions/cache` `~/.maestro` z kluczem wersji | szybciej przy trafieniu, ale chybienie (pierwszy przebieg po zmianie wersji, pamięć usunięta po 7 dniach bez użycia) pobiera tak samo bez ponowień — 504 z przebiegu 4 nadal by zatrzymał część |

Trening nie ma analogii: `e2e-ios.yml:201` i `store-screenshots.yml:212` — `curl -fsSL "https://get.maestro.mobile.dev" | bash` bez ponowień. Skrypt instalatora (odczyt 9.11) pobiera `.../releases/download/cli-$MAESTRO_VERSION/maestro.zip` jednym `curl --fail` (linie 94, 99) i kopiuje `maestro/*` do `~/.maestro` — krok robi to samo wprost. SHA-256 `54dbb071…d9d7` z pobrania w kontenerze 9.11 (203 pliki, `maestro-cli-2.12.1.jar`).

Kontrola: nowa reguła `MAESTRO-POBRANIE` w `scripts/jakosc/sprawdz-workflowy.mjs` (wyjątek od listy plików polecenia: jedna reguła strażnika 07, bez wpływu na 08) — wcześniej strażnik `MAESTRO-WERSJA` uruchamiał się tylko przy `get.maestro.mobile.dev`, więc bez zmiany zniknąłby po przejściu na paczkę. Czerwień na starej konfiguracji: `node scripts/jakosc/sprawdz-workflowy.mjs --katalog <kopia z HEAD>` → 2 naruszenia `MAESTRO-POBRANIE`, kod 1. `tests/jakosc/ci-maestro-wersja.test.ts` (krok uruchamiany w bashu z atrapą `curl`): stary krok 5/7 czerwonych, nowy 7/7. `kontrole-repo.test.ts`: +5 pułapek `MAESTRO-POBRANIE`.

## 2–5. Scenariusze
| ID | Scenariusz | Zmiana | Oczekiwany wynik przebiegu 5 |
|---|---|---|---|
| 33:69 | 33 | `assertVisible: "Back"` dopasowywał **nazwę części „Back”** (podpis pod tytułem, `Licznik.tsx` `st.podpis`), nie tylko pasek. Tytuł paska w tym miejscu wg `src/kompozycja/wstecz.ts:21–35`: formularz kończy `router.dismissTo('/licznik')` (`app/formularz/[rodzaj].tsx:68`), poprzednia trasa = `(zakladki)` z zakładką Projekty → „Projects”. Teraz: `{ id: nav-wstecz, text: "Back" }` (017: etykieta VoiceOver = „Back”) + `{ text: "Back", below: licznik-projekt }` (nazwa części) | czerwony do 017 (08), potem zielony |
| 240 | 03 | po „Otwórz licznik ›”: +1 → 2, `nav-wstecz`, `dzis-wartosc` = 2, zrzut `03-dzis-po-powrocie`; po restarcie licznik 2 | **czerwony do poprawki 240 (08)** — oczekiwane |
| 023 | 49 | linia konfliktu `above` `licznik-wartosc`, „Choose” `above` `licznik-plus` (bez przewijania); po wyborze dokładnie 6 + zrzut `49-po-wyborze` | czerwony do 023 (08) |
| 017 | 33 | jedyna asercja etykiety „wstecz” w e2e (pozostałe stukają po `nav-wstecz` bez tekstu; „Back” w 04, 34, 61 i `dodaj-czesc-cel` to tekst banera albo nazwa części) | jw. |

Przegląd pozostałych scenariuszy (`grep` tekstów paska „Back/Projects/Today/Tools/History/Settings” w `tapOn/assertVisible`): poza 33 brak asercji tekstu paska nawigacji; „History” w 29 to przycisk licznika, „Needles” w 60 to wybór narzędzia.

## Wady dla 08 (z polecenia, bez nowych)
240 (`src/kompozycja/licznik.ts:175`, `app/(zakladki)/index.tsx:52`), 023 (linia konfliktu na górze treści licznika), 017 (`src/ekrany/Pasek.tsx:26`: `accessibilityLabel={p.etykieta ?? tekst}` — ma być „Back”, widoczny tytuł bez zmian).

## Kontrole
`npx jest tests/jakosc` 60/60, 768/768 (na 93cad4c); `npm run verify` kod 0: 555/555 zestawów, 6872/6872 (drzewo przed ostatnią zmianą komentarza w 33 i tym plikiem; `tests/jakosc` powtórzone po nich).
