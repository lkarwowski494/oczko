# Integracja 2 (rola 08, tryb fix; 2026-11-02): scalenie kopii partii 8, 07 i 10

Gałąź: `claude/kopia-integracja-2026-11-02` (od roboczej 967fa11, tylko lokalnie do decyzji koordynatora). Polecenie: `oczko-warsztat` c9ea3b7 `koordynacja/role-2026-11-01/08-integracja-2.md`. Zatwierdzone: P-344, P-350, P-353. Na roboczą nie pushowano.

## Scalenia (`--no-ff`)
| Kopia | Merge | Konflikty i rozwiązanie |
|---|---|---|
| 8d (ff5adec, zawiera 8a+8b+8c) | d1b2d87 | `src/kompozycja/projekt.ts` — suma: wiersz `wloczka` (07-jakosc-001, 8) + `count` w `probka` (09, P-307); `en.kontekst.json` — suma kluczy; `en-XA.json` — regeneracja `npm run i18n:pseudo`; `tabela-08.md` — regeneracja. W `tests/` brak różnic względem rodziców (`git show --cc` pusty). |
| 8e (bc4ab44) | 7629da4 | tylko `tabela-08.md` (regeneracja); `scripts/natywne/kopie.json` scalił się sam (poprawny JSON). |
| 07 (9009f25) | a8dc0a8 | `docs/decyzje.md`, `docs/plan-prac.md`, `docs/przekazanie-koordynatora.md` — kopia niosła starszy stan dokumentów koordynatora; w spornych hunkach zostaje robocza (nowsza); diff do roboczej w tych trzech plikach pusty. |
| 10 (1bbf5ab) | 47fb6af | bez konfliktów. |

## Poprawka integracyjna (180e3dc)
Konflikt semantyczny bez konfliktu tekstowego: 09 przerobił `limit.arkusz_dni` na `_one/_other` (forma wg `count`), a `app/formularz/[rodzaj].tsx:120` (8b) wołał klucz bez `count` → arkusz pokazywał surowy klucz. Dopisane `count`. Test 024/S5 (`tests/ekrany/wpisanie-trasa.test.tsx:38`) miał stary literał „free knitting days”; en mówi „crafting days” od dc8e2fb (P-302/P-304 f) — zmieniony literał, asercja zostaje. Skan wszystkich `t('klucz')` dla kluczy liczby mnogiej bez `count`: 1 trafienie (to).

## Wynik bramki (po 180e3dc)
- `typecheck`, `typecheck:testy`, `lint`, kontrole repo (ADR, granice, BRD, tabela-08, schemat): zielone.
- `npm test`: 310 zestawów, 3113 testów; **1 czerwony**: `tests/i18n/konfiguracja.test.ts` (skrypt pseudolokalizacji kończy kodem 1 z powodu poniższego).
- `npm run i18n` (ostatni krok `jakosc:kontrole`): **kod 1, 2370 błędów** = partia 8 dodała do `en.json` klucze, których nie ma w 34 przetłumaczonych słownikach: 73 bazy kluczy „brak tłumaczenia” × 34 języki + `dane.zastapiono` (en: `{{kopia}}`, tłumaczenia: `{{nazwa}}`,`{{miejsce}}` → w tych językach ekran „Data replaced” pokazałby niewypełnione `{{…}}`). Kopie 8a–8e przechodziły, bo ich baza nie miała jeszcze słowników 09. Rozkład: ustawienia 13, wzor 11, przyp 9, licznik 9, oferty 6, historia 5, projekty 4, projekt 4, formularz 4, ukonczenie 3, dane 3, import 2, stan_danych 1. Lista kluczy: `npm run -s i18n | grep '^BŁĄD pl '`.
- Awaria w runtime: brak klucza → tekst z en (`src/i18n/i18n.ts:56-58`, łańcuch język → źródło); wyjątek `dane.zastapiono` (stare parametry).

## Decyzja P-357: wariant A (294b0ce)
- `scripts/sprawdz-i18n.mjs --oczekujace` (brak przekładu klucza z listy = uwaga; klucz z listy już przetłumaczony albo nieistniejący w źródle = błąd) i `--wydanie` (niepusta lista = błąd); `docs/lokalizacja/oczekujace.json` (74 klucze, powód, P-320/P-357); `kontrola-ipa.sh` woła bramkę z `--wydanie`; skrypty npm `i18n*` z `--oczekujace`.
- `dane.zastapiono`: stare przekłady usunięte z 34 słowników (tekst z en). Reguła „zmienne {{…}} = zmienne w en” była już błędem w `sprawdzSlowniki` (`parametry [...] ≠ źródło`); dodany test strażnik.
- Test przed zmianą: `tests/i18n/oczekujace.test.ts` 9 z 12 czerwonych (3 zielone = strażnicy istniejącego zachowania).
- **verify kod 0: 311 zestawów, 3125 testów** (typecheck, typecheck:testy, lint, jakosc:kontrole, npm test).
- Do fali przekładu (09, po audycie, P-320): przetłumaczyć 74 klucze z listy, opróżnić `oczekujace.json`; bez tego `kontrola-ipa.sh` zablokuje wydanie.

## Następny krok (nowa sesja 08)
Po wypchnięciu kopii: 4a (P-353 a+b: zdjąć `application/msword` w `system-plikow-uzytkownika.ts` i usunąć gałąź `.doc` w `przypadki-uzycia/wzor.ts` z testem; ADR-0031), 4b (P-350: strażnik `ASSETCATALOG_COMPILER_APPICON_NAME=AppIcon` po prebuild jak `verify:native` w Treningu, krok w `jakosc-ios.yml`), 4c (P-351: `licznik.jednostka_w_trakcie` jest w `klucze.json`, brak w `en.json` — sprawdzić użycie w kodzie). Każda: test czerwony → zielony, osobny commit.
