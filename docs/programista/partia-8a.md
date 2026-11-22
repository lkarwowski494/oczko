# Partia 8a (rola 08, tryb fix) — dane, ustawienia, zakup, kopia, diagnostyka

Stan: 2026-11-01 · gałąź `claude/kopia-partia-8a-2026-11-01` (z `claude/jolly-thompson-paz6d8` @ 8063d98) · polecenie: `oczko-warsztat` `koordynacja/role-2026-11-01/08-partia-8a.md` (6760d7c) · decyzje P-326–P-330.

## Stan wyjściowy i końcowy
- Przed pracą (8063d98): `npm test` 239 zestawów, 2655 testów, kod 0.
- Po pracy: `env -u NODE_PATH npm run verify` (typecheck, typecheck:testy, lint, jakosc:kontrole, test) — kod 0, 253 zestawy, 2729 testy (2026-11-01, po P-335).

## Klasyfikacja (E0)
Wszystkie D (defekt). Wybory P z 04 (P-330) już rozstrzygnięte. Nie ma wyboru właściciela: koszt, konta, scalenie i wysyłka nie są dotknięte.

## Zrobione (test czerwony przed → poprawka → zielony; osobny commit)
| ID | Commit | Test (czerwony przed poprawką) |
|---|---|---|
| klucze en 04 | 21bce6b | `tests/narzedzia/klucze-fix10-8a.test.ts` (24 + 24 + 7); pseudo-locale wygenerowana skryptem |
| 003 | 82b62d3 | K-03a,b,d,e `tests/dane/archiwum.test.ts`; K-03f `tests/niezawodnosc/kopie.test.ts`; K-03c,d przez trasę `tests/ekrany/ustawienia-trasa.test.tsx` |
| N-05-1 | 42f5227 | `tests/dane/usun-wszystko-kopia.test.ts`, `tests/ekrany/usun-wszystko-trasa.test.tsx` |
| 012 | ddaad0c | `usun-wszystko-trasa` (zdanie o Pro) |
| 004 | 8511e0b | `tests/dane/preferencje.test.ts`, `kompozycja-preferencje.test.ts`, `tests/ekrany/miary.test.ts`, `preferencje-trasa.test.tsx` (K-04a–g) |
| 002 | 6722e8d | `tests/ekrany/oferty-trasa.test.tsx` (7) |
| 008 | eb283ed | `tests/wydanie/adresy-zaslepka.test.ts`; skrypt `scripts/wydanie/kontrola-adresow.mjs` w `kontrola-ipa.sh` |
| 013 | b52f564 | `tests/ekrany/zglos-trasa.test.tsx` |
| 029 | c060e5f | `tests/dane/licznik-minus-zero.test.ts` |
| 031-dane (F-32, F-63) | aab7e60 | `ustawienia-trasa` (alert „nie rozpoznano”, stan Pro w wierszu) |
| 002 (przegląd) | 21a0fc1 | `oferty-trasa` P1-1, P1-2 |
| 015 | b09847f | `icloud-ostatnia-udana.test.ts`, `stan-danych-trasa` |
| 004 (Counting) | 7a12f40 | `preferencje-trasa` |
| 019 | e066618 | `tests/ekrany/stan-danych-trasa.test.tsx` |

Przegląd ścieżek wrażliwych (zasada trybu fix; subagent bez mojego rozumowania, diff `8063d98..HEAD -- src app` do 8511e0b: 003, N-05-1, 012, 004): **„brak uwag”**. Późniejsze commity (002, 008, 013, 029, 031, 019) nie dotykają kopii, importu ani czyszczenia danych; 002 dotyka zakupów — przegląd nieodbyty (patrz „Otwarte”).

## Decyzje koordynatora P-335 (wykonane)
- **015** wariant A: commit b09847f (klucz `icloud_ostatnia_udana_ms`, zapis po udanym `wyslij` i po odebranej partii, odczyt w `/stan-danych`; wiersz w `dane.md` jako aneks do przeglądu 05). Testy: `tests/dane/icloud-ostatnia-udana.test.ts`, `tests/ekrany/stan-danych-trasa.test.tsx`.
- **008**: wiersz „Rate Oczko” zostaje; build z zaślepką odrzuca `kontrola-ipa.sh`; Apple ID wpisze rola 10 (D4).
- **Counting**: `ustawienia.grupa_liczenie` (en + kontekst) i nagłówek grupy — commit 7a12f40; razem z `oferty.pro_wlaczone` do akceptacji 04 w aneksie.
- **Pula kopii** osobno po 2 dla `przed-importem` i `przed-usunieciem` — przyjęte (05 przy przeglądzie M1).
- **Przegląd 002** (zakupy): subagent, tylko diff 6722e8d — 2 × P1, oba naprawione testem czerwonym przed (commit 21a0fc1): (P1-1) „Restore” w trakcie Ask to Buy odblokowywał „kup”, gubił oczekiwanie i mówił „No purchase found”; (P1-2) brak strażnika podwójnego „kup”, druga odpowiedź nadpisywała flagę. Pozostałe pytania przeglądu bez znalezisk.

## Otwarte
- **008**: wartość Apple ID (rola 10, D4).
- **Zakupy 002**: przegląd po poprawce nie powtarzany (jeden przegląd na ID, zasada trybu fix).
- Nieodbyty przegląd 015 (sterownik synchronizacji nie jest ścieżką z listy wrażliwych: zapis znacznika czasu, bez zmian w danych użytkownika).

## Prośby do 04 / 05
- 04: akceptacja roboczych kluczy `oferty.pro_wlaczone` („Oczko Pro is on.”) i `ustawienia.grupa_liczenie` („Counting”); kolizja `dane.zastapiono` rozwiązana kształtem 04/ADR-0028 (`{kopia}`).
- 05: wiersz `icloud_ostatnia_udana_ms` w `dane.md` (aneks 08); pula kopii osobno dla importu i usunięcia (ADR-0028 mówi o imporcie).
- Wiersz o kopiach w „Data and sync” (`stan_danych.kopie_opis`, N-05-2): klucz jest w słownikach, ale wiersza nie narysowałem w `StanDanych` — poza ID 8a, do decyzji 04/koordynatora.

## Wyjątki nazwane (zasada 7)
- K-04e: `tests/bazy/` nie istnieje (brak wydanych wersji przed 1.0), więc test „bez migracji” idzie na świeżo zmigrowanej bazie bieżącego schematu.
- Istniejące testy zmienione zgodnie z ADR: ŚU-11 (kopia `.oczko` zamiast `.db`), ŚU-16 (Documents/Backup jako wyjątek od ADR-0001), R-068 (kształt propsów), `icloud-stan-danych` (this iPhone → this device).
- Okno +1 między kopią a usunięciem w „Delete all data” — teoretyczne (ms po potwierdzeniu).
- Pula kopii: ta sama zasada (2 najnowsze, 30 dni) osobno dla `oczko-przed-importem-*` i `oczko-przed-usunieciem-*` — wybór 08 (ADR mówi tylko o imporcie), do potwierdzenia przez 05.
