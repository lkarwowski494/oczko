# CI — bramka PU, katalog według słów właściciela, protokół F buildu 8 (07 fix, 2026-11-16)

Sesja CI, rola 07-jakosc (tryb fix, moduł `scenariusze-uzytkownika`), polecenie `origin/koordynacja:docs/koordynacja/polecenia/CI.md` @ 9c82525c, start e996b6c3, gałąź `claude/ci-bramka-pu-2026-11-16`. Słowa właściciela: 16.11.2026 ok. 07:00 UTC „Zgodnie z rekomendacja” (Pytanie 1 wariant B, Pytanie 2 wariant A).

## Stan zadań

| Zadanie | Stan | Commit |
|---|---|---|
| CI-01 katalog | zrobione: PU-137, PU-153 → F; nowe F PU-340 (z 134), PU-341 (z 135), PU-342 (z 175), PU-343 (z 139), PU-344 (z 333, zegarek); zawężone PU-134, 135, 139, 175, 333; lista `docs/wydanie/test-fizyczny.html` z generatora | 2c446d00 |
| CI-02 bramka P-906 | zrobione: `bladTestuSwift` w `scripts/jakosc/bramka-przypadki-uzycia.mjs`; PU-333 „z testem:” → `ZegarekSkrzynkaTests.swift:106`; najpierw czerwone (3), mutacje M1–M9 zabite; `tests/jakosc` 965/965. **Brak recenzji niezależnej** (ścieżka wrażliwa) — do zrobienia | 59c8a75e |
| CI-03 protokół F buildu 8 | **niezrobione**: szkielet protokołu (propozycja P-914: plik pod nazwą nieczytaną przez bramkę, generowany `protokolWyniku` z `scripts/wydanie/test-fizyczny.mjs`, zmiana nazwy na numer po buildzie); `scripts/sprawdz-scenariusze.mjs` nie istnieje — tryb statyczny = `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` (kod 0, A=109, B=176, F=59, razem 344) | — |
| CI-04 lista dla 08 | zrobione (lista niżej) | commit z tym dokumentem |

Przekazanie (P-324, 29% kontekstu, budżet 7,23 USD): sesja kończy po tym commicie; CI-03 i recenzja CI-02 do rozdzielenia przez koordynatora.

## Dla BX11 (scalenie gałęzi `claude/ci-bramka-pu-2026-11-16`)

- Moje wiersze katalogu: PU-134, 135, 137, 139, 153, 175, 333 i nowe PU-340–344 (F). Konflikt możliwy tylko w linii „Podsumowanie” i linii 13 („B według pokrycia”) — po scaleniu przeliczyć `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog`.
- `docs/wydanie/test-fizyczny.html` po scaleniu wygenerować ponownie: `node scripts/wydanie/test-fizyczny.mjs`.
- Bramka: `tests/jakosc/bramka-przypadki-uzycia.test.ts:71` — fikstura dowiązuje też `modules`.

## CI-04: co zostaje „do zaprogramowania” (dla sesji 08)

Po jednej linii: PU — rodzaj testu — co sprawdza asercja — plik wzorcowy.

- **PU-134** — Maestro iPhone — asercje widoczności już są w scenariuszu 30 (`licznik-plus`, `licznik-minus`, menu, arkusz, 12 345, pasek pod wzorem); brakuje tagu `PU-134` w nagłówku scenariusza i przeniesienia PU do A po zielonym przebiegu na SHA — wzorzec: `e2e/scenariusze/30-nfr-dos-002-duzy-tekst.yaml`.
- **PU-135** — Maestro iPhone, nowy scenariusz z tagiem `osobny-krok` (AX5 ustawia workflow): 9 ekranów, `scrollUntilVisible` do ostatniego elementu każdego ekranu i `assertVisible` przycisków i tytułów, bez porównania zrzutów — wzorzec: `e2e/scenariusze/30-nfr-dos-002-duzy-tekst.yaml`.
- **PU-175** — Maestro iPhone — „Język” → Deutsch, potem 日本語: `assertVisible` „Heute”, „Leitfaden”, „今日”, „ガイド” na „Dziś”, liczniku z przypomnieniem i „Oczko Pro” (klucze `dzis.tytul`, `przewodnik.tytul`) — wzorzec: `e2e/scenariusze/39-p-190-jezyk-trwaly.yaml`.
- **PU-139** — komponentowy (Jest) — przy `useColorScheme` = `dark` tło korzenia i 6 ekranów („Dziś”, licznik, wzór, „Ustawienia”, „Oczko Pro”, przewodnik) = token ciemny; „Pokaż ›”, ptaszek i strzałki obecne — wzorzec: `tests/ekrany/stan-wczytywania-tlo.test.tsx` (mock `useColorScheme` w `beforeEach`).
- **PU-057** — Maestro iPhone — `wzor-strona` „Page N of N” na ostatniej stronie, N z konstrukcji pliku testowego (wymuszone podziały stron, każda strona z treścią; P-907, KO-092), nie z wyniku konwersji — wzorzec: `e2e/scenariusze/25-br-wzr-007-s2-plik-word.yaml` i `e2e/scenariusze/subflows/wzor-word-strony.yaml`; pliki E2E: `src/kompozycja/e2e/pliki-wzoru.ts`.
- **PU-162** — Maestro iPhone + krok workflowu (ścieżka wrażliwa, recenzja niezależna) — `stopApp` → `launchApp` → `extendedWaitUntil dzis-karta`, czas do podsumowania przebiegu bez progu; pola czasu w `commands-*.json` `[DO USTALENIA]` na artefakcie ostatniego przebiegu — wzorzec: `e2e/scenariusze/31-nfr-wyd-001-reakcja-licznika.yaml`.
- **CG-1** (P2) — martwa ścieżka `docs/design/wzorce-zrzuty/` w komentarzu `e2e/scenariusze/30-nfr-dos-002-duzy-tekst.yaml:2` (w katalogu usunięta w CI-01 razem z porównaniem zrzutów); poprawić komentarz na „bez porównania zrzutów; ucięcia: PU-340 (F)” — plik: ten sam scenariusz.

Pozostałe „do zaprogramowania” bez zmian w tej sesji: PU-012, 138, 143, 144, 146, 147, 148, 150, 336 (razem z wyżej wymienionymi 15).

## Otwarte (do koordynatora)

- **PU-344 (F, zegarek):** na prawdziwym zegarku nie ma sposobu wywołania błędu zapisu skrzynki (kroki „Zegarek z nieczytelną skrzynką”); bez niego właściciel może tylko wpisać „pominięte: …”. `[DO USTALENIA]`: czy rola 08 ma dodać wyzwalacz w buildzie testowym, czy pozycja zostaje do pominięcia z uzasadnieniem.
- **Nazwa protokołu F buildu 8:** bramka czyta `docs/jakosc/test-fizyczny/<CFBundleVersion>.md`, a numer buildu 8 znany jest dopiero z przebiegu TestFlight (`GITHUB_RUN_NUMBER * 10 + próba + 1000`); szkielet leży pod nazwą nieczytaną przez bramkę (P-914) i po buildzie zmienia nazwę na numer.
