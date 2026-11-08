# M3 p3b Wzór — stan partii (rola 08, build) · 2026-11-08

Gałąź `claude/kopia-08-p3b-2026-11-08` od 936a1227 (HEAD zgodny na starcie). Koordynator: session_01T66VBx6UXGtzFfAZDeBpip. Polecenie: oczko-warsztat `koordynacja/role-2026-11-08/08-p3b.md` @ 9870a5b. Decyzje: P-563, P-580, P-584, P-587, P-588.

## Stan wyjściowy
`npm test` (jest): 517 zestawów, 5385 testów, kod 0. `npm run test:akceptacja`: 0 testów (kryteria przeniesione do głównego zestawu).

## Zrobione (commity `[M3 p3b] …`)
- **ZM-06 + kafel (P-588)** — ef219fa: `GrupaWzorow` z propem `menuOtwarte`; trasa `/wzor` bez wzoru ma menu źródeł otwarte od razu (plik, skan z aparatem, zdjęcia, adres; w buildzie E2E także panel plików testowych); parametr `zrodla` pomija otwarcie wzoru. Kafel „Dodaj wzór” na „Dziś” → `/licznik` + `/wzor?zrodla=1`; bez bieżącego projektu → Projekty. Testy przed kodem (czerwone z właściwego powodu: brak `menuitem` / brak wywołania `push`): `tests/ekrany/wzor-zrodla-od-razu.test.tsx` (4), `tests/ekrany/dzis-kafel-dodaj-wzor.test.tsx` (3).
- **e2e (wyjątek P-588)** — ef219fa: usunięty krok `wzor-dodaj` w ścieżce bez wzoru: 12 `tapOn` (scenariusze 21, 22, 23, 24, 25, 26, 27, 30, 53 ×3 = 11 oraz podprzepływ `otworz-wzor-pdf.yaml`); bez zmian testID i innych kroków; w 21 i 22 zrzut „ekran-dodaj-wzor” po `assertVisible` elementu menu (`e2e-wzor-pdf-skan`, `e2e-wzor-zdjecie`). Strażnik `tests/jakosc/e2e-licznik-to-be.test.ts` zielony; `tests/jakosc/e2e-noc-2026-11-02.test.ts` (kolejność zrzutów 21/22) dopasowany — wykaz w `m3-p3b-zastapione-testy.md`.
- **Pasek −1 / rząd / +1, ZM-10, 04-001, 04-003** — 5889d3e: `WzorLicznik` (liczba w komórkach `Liczba`, tło `pasek`, linia `pasekLinia`, +1 `akcent`/`naAkcencie`, −1 z obrysem `tekst2`; od `PROG_KATEGORII_DOSTEPNOSCI` (AX1) liczba nad rzędem −1/+1; odnośnik limitu z `cele.minimum`), `WzorPrzegladarka` (rama `wzorRama` wokół strony w oryginale, bez filtra). Test: `tests/ekrany/wzor-pasek-dzianina.test.tsx` (17; 14 czerwonych na starym pasku, 3 kontrole zielone przed i po).

## Znaleziska M1 04-001…003
| ID | Zamknięcie | Test | Przed kodem |
|---|---|---|---|
| 04-001 (limit/blokada na pasku) | odnośnik limitu z wysokością z tokenów, blok limitu nad rzędem przycisków, tekst jak na liczniku | `wzor-pasek-dzianina` „limit… (04-001)” (2) + istniejące 203 (3) | nowe czerwone; 203 zielone przed i po (zachowanie bez zmiany) |
| 04-002 (haptyka i VoiceOver +1) | ścieżka niezmieniona (`poPlusiePaska`, Magic Tap); w nowym układzie sprawdzają ją te same testy trasy | `wzor-pasek-plus-203-204.test.tsx` 204 (3) | **zielone przed i po** — brak nowego testu czerwonego, bo zachowanie nie zmieniło się; do potwierdzenia przez 04 |
| 04-003 (etykiety przy AX) | granica AX1, limity skali ×1,4 / ×1,8, etykiety VoiceOver bez zmian | `wzor-pasek-dzianina` „granica przy AX1–AX5” (9) + 205 w `tytuly-limit-skali` | nowe czerwone |

## Dowody
`npm run verify`: wynik w raporcie (dopisany po przebiegu). Stan wyjściowy 517 zestawów / 5385 testów; po partii 520 / 5409 (3 nowe pliki, +24 testy).

## Nie sprawdzono
Urządzenie i symulator (Linux, brak macOS): wygląd, układ przy AX1–AX5 na prawdziwym Dynamic Type, haptyka, VoiceOver, kolor strony PDF w ciemnym motywie (kontrast ramy do strony); zrzuty `wzor-*` (brak Expo web); E2E iOS `[e2e-pelny]` — uruchamia koordynator po scaleniu.

## Otwarte
1. **Linia „liczby zakreśleń”** (`wzor-zakreslenia`): spec i makieta „bez stałej linii” (ZM-10, M1), ale scenariusze e2e 26, 27, 47 asercją tekstu na tym testID (`e2e/README.md:250`) — linia zostaje do decyzji (opcje w raporcie).
2. Nagłówek ekranu wzoru (pasek nawigacji) bez zmian układu względem makiety (tytuł „Licznik” + plik · strona): tylko kolory z tokenów p1 — do audytu 04.
3. Podpis pod liczbą paska to istniejące teksty (`licznik.teraz`, `licznik.jednostka_w_trakcie`), nie krótkie „rząd” z makiety — zachowanie testów tekstów; nowych kluczy `wzor.*` nie dodano (oczekujace.json bez zmian).
