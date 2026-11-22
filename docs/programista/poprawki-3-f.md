# Poprawki 3, sesja F (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-f-2026-11-02` (baza roboczej 2a83370, integracja 3 fcbeef4 + docs). Polecenie: `oczko-warsztat` 255950b `koordynacja/role-2026-11-01/08-poprawki-3.md`, sekcja F. Na roboczą nie pushowano. Pliki sesji G i H nietknięte (`Arkusz.tsx`, `testflight.yml`, `Projekt.tsx`, `LicznikArkuszLimitu.tsx`, `ListaProjektow.tsx`, `Kosz.tsx`, `MenuProjektu.tsx` nie ruszano).

P-315: analogii w Treningu szukałem tylko w `docs/fakty-wlasciciela.md` (brak wpisu o tych pozycjach); obie pozycje mają rozstrzygnięcie 04 w `design-spec.md` (F-09 :905, poz. 12 :936) i wariant z decyzji koordynatora (P-360, P-361), więc pytań nie było.

## Stan (2 z 2 ID sekcji F)
| ID | Rodzaj | Test (czerwony → zielony) | Commit | Wynik |
|---|---|---|---|---|
| E2-C-N1 (wariant A) | D | `tests/ekrany/licznik.test.tsx` „E2-C-N1 / BR-LIC-012: tryb „rząd w trakcie” bez celu podpisuje liczbę „current row”, nie „rows””: czerwony (`Unable to find an element with text: current row`, na ekranie „rows”) → zielony; drugi test (tryb „skończone” i cel „of 40” zostają) to strażnik, zielony od początku | eaf69c5 | zrobione |
| Poz. 12 C, wiersz „czeka na sieć” w liście wzorów ▾ (P-353 d) | D | `tests/ekrany/wzor-przegladarka.test.tsx` 2 z 3 czerwone (brak ▾ przy jednym wzorze, brak wiersza) → zielone; `tests/ekrany/wzor-trasa-czeka-w-liscie.test.tsx` (nowy, trasa `/wzor` na prawdziwej bazie, skrzynce i kompozycji): 2 z 3 czerwone (brak ▾) → 3 zielone; mutacja (wyłączone odświeżanie listy w `app/wzor.tsx`) czerwieni test trzeci | fff49b6 (strukturalny) + 5f1fbcb | zrobione |

Stan wyjściowy: `env -u NODE_PATH npm run verify` kod 0, 327 zestawów, 3215 testów (zgodne z bazą koordynatora). Po commitach: eaf69c5 kod 0, 327/3217; fff49b6 kod 0, 327/3217; 5f1fbcb kod 0, **328 zestawów, 3223 testy** (typecheck, typecheck:testy, lint, kontrole repo — w tym limit rozmiaru plików — i `npm test`). `tabela-08.md` regenerowana narzędziem. Zrzuty przed/po: niewykonane (Linux, bez symulatora); dowód wizualny = asercje na prawdziwym `t()` z `en.json` oraz wzorce 04 `aneks8-wzor-przelacznik-czeka-*`; wygląd wiersza na urządzeniu — próbka u 07 w przebiegu E2E.

## E2-C-N1: co zmieniono
`Licznik.tsx:100`: podpis przy liczbie w trybie `znaczenie === 'w_trakcie'` bez celu = `t('licznik.jednostka_w_trakcie')` („current row”); z celem nadal „of {cel}”, licznik oczek nadal „stitch/stitches” (pierwszeństwo: cel → oczka → w_trakcie → „rows”). Klucz dopisany w `en.json` (`licznik.jednostka_w_trakcie`), `en.kontekst.json` (opis z `klucze.json` 04), `en-XA.json` (`npm run i18n:pseudo`) i `docs/lokalizacja/oczekujace.json` (przekład w fali 09, P-320). `npm run i18n`: błędy 0.
Wyszukanie przed commitem: `grep "t('licznik.jednostka'" src app` → jedno użycie (`Licznik.tsx`); pasek licznika pod wzorem pokazuje „Now working row n”, nie podpis jednostki.

## Poz. 12 C: co zmieniono
- **Ekran** (`WzorPrzegladarka.tsx`, `WzorMenu.tsx`): `StanPrzegladarki.oczekujace?` i `naUsunOczekujacy?`; ▾ i menu `wzor.przelacz_a11y` pojawiają się przy ≥ 2 wzorach **albo** gdy coś czeka; pod wzorami wiersz oczekującego: nazwa + `wzor.czeka_siec` (podpis, `olowek`) + ✕ 44 pt (`wzor.usun_oczekujacy_a11y`), testID `wzor-czeka-siec` jak w grupie na ekranie projektu; wiersz niczego nie przełącza. ✕ przy ostatniej pozycji do wyboru (jeden wzór, jeden oczekujący) zamyka menu.
- **Trasa** (`app/wzor.tsx`): `oczekujace` = `czekaSiec` bieżącego projektu; ✕ → `kontener.wzor.k.potwierdzBlad` (ten sam przypadek użycia co `GrupaWzorow`); gdy liczba oczekujących maleje przy otwartym wzorze, lista wzorów jest wczytywana ponownie (otwarty wzór zostaje), więc po powrocie sieci wiersz zamienia się we wzór bez ogłoszenia. Bez otwartego wzoru (grupa na ekranie projektu) nic się nie przełącza.
- **Strukturalnie osobny commit** fff49b6: lista wzorów wydzielona do `MenuWzorow` (`WzorMenu.tsx`, tak jak wcześniej menu z tego samego powodu); powód: `WzorPrzegladarka.tsx` miał 19,7 KB, kontrola rozmiaru (20 KB) zatrzymała pierwszą wersję (21,2 KB). Po zmianie 20 350 B z limitu 20 480 B — **następna zmiana w tym pliku wymaga kolejnego wydzielenia**.
- Bez nowych kluczy i tokenów; wartości z `motyw.ts`.

## Nowe znaleziska (nienaprawione; do decyzji koordynatora / 04 / 07)
1. **F-09, druga połowa niewdrożona (D, realny, S3):** design-spec `:905` mówi, że w trybie „rząd w trakcie” **nie ma** linii „Now working row n” (liczba nią jest), a `Licznik.tsx:145` pokazuje ją dla `!start && !oczka` także w tym trybie (`licznik-teraz-rzad`). E2-C-N1 w wariancie A obejmował tylko podpis. Poprawka: warunek `s.znaczenie !== 'w_trakcie'` + test RNTL (jedna linia); decyzja o linii celu w tym trybie nadal `[DO USTALENIA 01]`.
2. **Nagłówek menu wzorów (D, brzegowy, S3):** design-spec `:670` i makieta `wzor-przelacznik-czeka` mają nad listą nagłówek (`wzor.przelacz_naglowek` „Patterns in {{projekt}}”); klucz jest w `en.json`, ale kod go nie używa (`grep przelacz_naglowek src app` → 0 trafień poza słownikami i pseudolokalizacją `en-XA.json`), a `StanPrzegladarki` nie niesie nazwy projektu. Poprawka wymaga pola `projekt` w stanie i `Text` w `MenuWzorow` — mała, poza ID sesji F.
3. **`e2e/README.md:230`** (rola 07): wiersz `wzor-czeka-siec` mówi „ekran projektu”; teraz id jest także w liście wzorów ▾ na ekranie wzoru (te same kryteria, inny ekran). Scenariusza E2E dla wiersza w ▾ brak — do 07.

## Uwagi
- Zgodnie z poleceniem nie dopisywałem `Co-Authored-By` ani identyfikatorów modelu; tożsamość git `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>` (ustawiona lokalnie w repo).
- Swift i urządzenie: bez zmian (zmiany tylko w TypeScript).
- Kontekst sesji: `get_session` w trakcie tury zwrócił `used_tokens` 0 (nie do oceny); zgodnie z P-350 po 2 ID koniec.
