# CL — recenzja różnicowa BX11 (zad. 3, kroki A–C) i BX12 (08-programista, tryb audytu, 2026-11-16)

Polecenie: `origin/koordynacja:docs/koordynacja/polecenia/CL.md` @ 95471221. Zakres: `git log --no-merges 6a055e8b..5231cc13 --not bdd64f6c` (26 commitów; scalenie 4e129bbf poza zakresem). Gałąź CI @ bdd64f6c i stan do 6a055e8b zrecenzowały CJ i CK. Tych ustaleń tu nie powtarzam.
Kolejność pracy: najpierw własna ocena, potem porównanie z `bx-stan.md` (BX11, BX12) i `bx12-dowod-czerwony.txt` (sekcja „Porównanie”). Mutacje wyłącznie w kopii roboczej (`git worktree` w katalogu tymczasowym, odłączona od 5231cc13), bez commitów; kopia usunięta przed zapisem raportu. Kontekst sesji był w trakcie pracy kompaktowany; stan i wyniki zapisane przed kompakcją są w tym pliku.

## Werdykt: **Z UWAGAMI** (P1: 0, P2: 1, P3: 4)

| ID | Waga | Realność | Miejsce | Ustalenie | Poprawka (P1/P2) |
|---|---|---|---|---|---|
| CL-01 | P2 | realny (do zdjęcia tagu) | `e2e/scenariusze/30-nfr-dos-002-duzy-tekst.yaml:12` | Tag `oczekujacy` wyłącza scenariusz 30 (AX5: +1/−1, menu, arkusz, 12 345) z bramki pakietu `przypadki`/`pelny` (`scripts/ci/e2e-czesci.mjs:155`: bramka = wszystkie poza `oczekujace`). Zbiór scenariuszy telefonu w bramce: 81 → 80. Różnica to dokładnie `30-nfr-dos-002-duzy-tekst.yaml`. Przed BX12 scenariusz 30 bramkował (tagi `NFR-DOS-002`, `osobny-krok`, `stan-licznika`). CI-04 (`docs/jakosc/ci-stan.md:26`) przewidywało dopisanie tagu `PU-134`, nie wyłączenie z bramki. Tag wymusiła kontrola 2 przy Pokryciu „oczekujący:” (KO-073; dowód: `bx12-dowod-czerwony.txt`, sekcja PU-134). Autorzy zapisali „kroki i asercje bez zmian” (`bx-stan.md:212`), ale nie odnotowali osłabienia bramki. P-918 sprawdzało brak wpływu tagu tylko dla iPada (44/46), a dla telefonu wpływ jest. | Po zielonym przebiegu iOS 43828957399 ze scenariuszem 30: zdjąć `oczekujacy` z 30 i przenieść PU-134 do A (zad. 4 BX12) przed scaleniem do gałęzi integracji. Jeśli przebieg nie będzie zielony: zdjąć PU-134 z nagłówka 30 i przywrócić 30 do bramki, a Pokrycie PU-134 zmienić na „do zaprogramowania”. |
| CL-02 | P3 | brzegowy | `tests/ekrany/pu-012-ipad-zakreslanie.test.tsx:28-40`; `docs/jakosc/przypadki-uzycia.md:35` | Liczby pasów 1/2/1 wstrzykuje test przez `rerender(stan({ zakreslenia: n }))`. Test dowodzi wyświetlania stanu i wywołań `naNarzedzie`/`naCofnij`, a nie tego, że „licznik pasów rośnie od razu”. `ukladOkna(1024 × 1366)` liczony jest obok, a komponent nie dostaje okna. Komentarze „nowy pas od razu” i „szybka para = +2” oraz Pokrycie „licznik pasów 0 → 1 → 2 → 1” przeceniają test. Lista „nie dowodzi” w Pokryciu jest jednak uczciwa (KO-105 spełnione formalnie). | — |
| CL-03 | P3 | brzegowy | `tests/ekrany/pu-147-ipad-przewodnik.test.tsx:38`; `docs/jakosc/przypadki-uzycia.md:296` | Pokrycie mówi „„Show ›” → licznik”, a test sprawdza `navigate('/')`, czyli „Today” na świeżej bazie (komentarz testu sam to mówi). Test „przeczytane osobno od 0” na dwóch świeżych bazach jest prawdziwy z konstrukcji. Ochronę daje test importu `tests/dane/przewodnik-przeczytane.test.ts:37`. | — |
| CL-04 | P3 | teoretyczny | `e2e/scenariusze/91-pu-290-dwa-wzory-przelaczanie-i-restart.yaml:9`, `:71-93` | (a) `name:` nadal mówi „restart otwiera PDF”, a od CK-02 restart otwiera zdjęcie. (b) Regresja *tylko* zapisu przy przełączeniu przeszłaby w 91 na zielono: ostatni zapis przed restartem i tak pochodzi z otwarcia zdjęcia z ekranu projektu (:71, `zapamietajWzor` w `wczytaj`, `app/wzor.tsx:96`). Tę regresję łapie Jest (`tests/ekrany/pu-wzor-przelacz-290.test.tsx:58-71`: start na w2, przełączenie na w1, restart → w1). 91 łapie brak zapamiętywania w ogóle i regresję `wzorDoOtwarcia` → lista[0]. | — |
| CL-05 | P3 | teoretyczny | `modules/oczko-wzor/TestyOknaMaszyn/Testy/korpus/generuj-korpus.mjs:4` | Nagłówek „Użycie: … → tekst.docx, tabela.docx, obraz.docx” bez `strony.docx` (skrypt generuje cztery pliki, `:49`). | — |

## Zadanie 1 — poprawki CK (stan: zamknięte / częściowo / niezamknięte)

| CK | Commit | Stan | Dowód |
|---|---|---|---|
| CK-01 (scen. 105) | a9a595dc | **zamknięte** | Kontrola pozytywna: wzór (`otworz-wzor-pdf`) → `setOrientation LANDSCAPE_LEFT` → `assertVisible e2e-okno ".*window: landscape.*"`. Panel `e2e-okno` (`src/kompozycja/e2e/okno-stan.tsx`) podaje orientację z `useWindowDimensions`, więc bez obrotu symulatora asercja jest czerwona. Strażnik `tests/jakosc/ch01-okno-w-scenariuszu-105.test.ts`: mutacja M4a (usunięcie asercji landscape) i M4b (rozluźnienie do `.*window: .*`) → 3/5 testów czerwonych. Tag `stan-licznika` uzasadniony (`subflows/projekt-roboczy.yaml` sprawdza wartość licznika; README reguła 5). |
| CK-02 (scen. 91) | a30f31c0 | **zamknięte** (z uwagą CL-04) | Przed restartem bieżący jest „Test pattern”, drugi po nazwie. Bez zapamiętania `wzorDoOtwarcia` (`src/przypadki-uzycia/wzor.ts:167`) → lista[0] = „Sleeve chart” → asercja „Photo.*” (:93) czerwona. |
| CK-03 (PU-191) | 15b7f70c | **zamknięte** | Mutacje M3a–M3d (P-999 w liście dozwolonych; `@sentry/react-native` w devDependencies; produkcyjny `@sentry/core` w locku; wpis opcjonalny w locku) → każda czerwona. |
| CK-04 (PU-067) | 8a392061 | **zamknięte** | `przypadki-uzycia.md:129` ma dopisek „częściowo (położenie…)”. |
| CK-05 (PU-011) | 4bb64503 | **zamknięte** | `przypadki-uzycia.md:34` ma dopisek „częściowo — CK-05: „4 highlights” z atrapy…”. |
| CK-09 | 3090bbed | **zamknięte** | `tests/jakosc/e2e-noc-2026-11-02.test.ts:191`: komentarz „90–91 zajęte od P-905”. |

## Zadanie 2 — scenariusze

- **110, 114–117 (iPad):** tagi `przypadki-uzycia`, `oczekujacy`, `PU-NNN`, `ipad`; `stan-licznika` w 110, 115, 116, 117 (wartość licznika przez podprzepływy). 114 nie ma asercji wartości licznika: `start-czysty-dzis` i `otworz-ustawienia` bez `licznik-wartosc` z tekstem. Pokrycie każdego PU nazywa luki (KO-105, „częściowo”).
- **111 (PU-138, `osobny-krok`):** bez `stan-licznika`, poprawnie, bo nie ma asercji wartości.
- **118 (PU-175, de/ja):** asercje tytułów i przycisków w obu językach (:95–152). Pokrycie nazywa lukę (ucięcia → PU-342). Zgodne z P-924.
- **119 (PU-057, KO-092):** N = 3 wynika z konstrukcji pliku (`generuj-korpus.mjs:41-42`: 3 akapity, 2 × `w:br w:type="page"`). `strony.docx` odtworzony w katalogu tymczasowym jest **bajt w bajt identyczny** (SHA-256 afe05b02… dla obu; tak samo tekst/tabela/obraz). W ZIP są tylko 4 wpisy OOXML z datą 1980-00-00, bez `docProps`, a treść jest syntetyczna („Page one: cast on 20 stitches.” …), więc nie ma danych osobowych. Base64 w `src/kompozycja/e2e/pliki-wzoru.ts` = bajty pliku korpusu (sprawdzone). Strażnik: `tests/adaptery/e2e-pliki-wzoru.test.ts:28,47`.
- **120, 121 (PU-135):** razem 9 ekranów z PU. Pokrycie nazywa podział i luki (ostatni pakiet licencji, ucięcia → PU-341).
- **44, 46, 30:** zmienione tylko tagi (44/46 bez wpływu na bramkę, iPad). 30: kroki i asercje bez zmian, poza komentarzem w linii 2 (CG-1). Ma jednak wpływ na bramkę: **CL-01**.
- README: nowe testID (`dzis-kafel-probka`, `jezyk-ja`, `licencje-kroj-bree-serif`, `e2e-wzor-word-strony`) dopisane; reguła 5 (`stan-licznika`) przestrzegana w nowych scenariuszach.

## Zadanie 3 — config.yaml i czesci.json

`node scripts/ci/e2e-czesci.mjs plan` (telefon): 111 scenariuszy w 4 częściach (`files` + `osobne`). iPad (`maTag ipad`): 8. Razem 119 = wszystkie pliki `e2e/scenariusze/*.yaml` poza `config.yaml`, więc żaden nie wypadł z części. Wagi w `czesci.json` dla 110, 111, 114–121 są dopisane, a stare się nie zmieniły. Bramka telefonu (wszystkie poza `oczekujacy`): 81 → 80, ubył tylko scenariusz 30 (CL-01). Zgodnie z KO-073 scenariusz `oczekujacy` nie liczy się jako test (bramka katalogu: „oczekujący” w B to błąd bramki).

## Zadanie 4 — testy KO-105 i PU-139

- PU-139: mutacja M1 (`useKolory` na sztywno jasny) → 9/9 testów PU-139 czerwonych; M2 (`contentStyle` stosu `#FFFFFF`) → test korzenia czerwony. Testy mają zęby.
- PU-143/144 (`tests/ekrany/pu-ipad-uklad-wzoru-143-144.test.tsx`): mutacja M5 (`uklad.ts`: kolumna obok tylko w compact) → PU-143 czerwony. Uczciwe „częściowo”.
- PU-148: mutacja M6 (bez `odzyskajRysunki`, `app/wzor.tsx:112`) → `pu-wzor-przelacz-290.test.tsx:139` czerwony.
- PU-012 i PU-147: patrz CL-02, CL-03.
- Tytuły PU-146/148/150/147 w istniejących testach: zmienione tylko tytuły (6 plików, 6 +/6 −), ciała bez zmian. Każdy tytuł pasuje do treści testu (`orientacja-ekranu.test.ts:9`, `bezpieczny-ipad.test.tsx:19`, `wzor-rysunki-odzysk.test.ts:11`, `wzor-trasa-znacznik.test.tsx:54`, `znacznik-ustawianie.test.ts:4`, `przewodnik-przeczytane.test.ts:37`). Luki „obrócona strona” (PU-150) i „obrót w symulatorze” (PU-146) są nazwane w Pokryciu.
- Bazowy przebieg docelowych testów (14 zestawów): 153/153 zielone, kod 0.

## Zadanie 5 — katalog

Zmiany poza Pokryciem w zakresie są identyczne z CI-01 (2c446d00): opisy PU-134/135/139/175/333, PU-137/153 B → F, nowe PU-340–344 (F). Po 2c446d00 nie ma żadnej zmiany poza Pokryciem (porównanie kolumn 1–7 wierszy PU w 2c446d00 i 5231cc13 jest puste). Liczby policzone skryptem: A = 109, B = 176, F = 59 (344), B: z testem 144, oczekujący 30, do zaprogramowania 2. Zgodne z nagłówkiem katalogu. `node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog` → „Kontrola 2: zielona”, kod 0. **Bez P1.**

## Zadanie 6 — kod produktu

Zmiany tylko w `src/kompozycja/e2e/panele.tsx` (+`'strony'`, etykieta „3 pages”) i `src/kompozycja/e2e/pliki-wzoru.ts` (`DOCX_STRONY_B64`). Ładowane wyłącznie przez `require` za `process.env.EXPO_PUBLIC_E2E === '1'` (`src/platforma/tryb-e2e.ts:17`). Żaden inny moduł `src/` ani `app/` nie importuje `kompozycja/e2e`. Strażnik `tests/adaptery/tryb-e2e-straznik.test.ts` bez zmian. Korpus: zadanie 2 (119).

## Zadanie 7 — decyzje, CLAUDE.md, tożsamość, tabela 08

- `docs/decyzje.md`: w zakresie są tylko dopisane wiersze P-917, P-918, P-919, P-924 (0 linii usuniętych; P-906 przyszło ze scalenia CI). Treść zgadza się z kodem: listy NOC-6 85–121 bez 112–113 (`e2e-noc-2026-11-02.test.ts:191`), wagi 240/165/230/260 (`czesci.json`), tagi 118–121, `e2e-wzor-word-strony`.
- `CLAUDE.md` (6d654c04): reguła „Tożsamość commitów (P-507, P-919)” w „Zasadach” i w „Compact instructions”. Wcześniej jej nie było.
- Wszystkie 26 commitów zakresu: autor i committer „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”. `git log --format='%h %(trailers:key=Co-Authored-By)%(trailers:key=Claude-Session)' 6a055e8b..5231cc13` nie pokazuje trailerów.
- `node docs/jakosc/narzedzia/tabela-08.mjs --check docs/jakosc/e4/tabela-08.md` → 501 plików testów, 0 błędów, kod 0.

## Porównanie z raportami autorów (czytane po własnej ocenie)

- `bx-stan.md:212` (BX12 zad. 3): „kroki i asercje bez zmian” to prawda, ale raport pomija, że 30 wypadł z bramki (CL-01). Liczby katalogu z tej linii (136/34/6) to stan pośredni, a nagłówek katalogu na 5231cc13 jest aktualny.
- `bx12-dowod-czerwony.txt`: dowody czerwieni CK-01 (mutacja asercji landscape) zgadzają się z moimi M4a/M4b. Dowód PU-134 pokazuje, że tag `oczekujacy` wymusiła kontrola 2, co jest źródłem CL-01.
- `bx-stan.md:191` (BX11, BX-041) uczciwie nazywa, czego Maestro nie czyta (kreski pióra, położenie znacznika). Zgodne z Pokryciem PU-012/148/150.
