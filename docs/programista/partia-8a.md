# Partia 8a (rola 08, tryb fix) — dane, ustawienia, zakup, kopia, diagnostyka

Stan: 2026-11-01 · gałąź `claude/kopia-partia-8a-2026-11-01` (z `claude/jolly-thompson-paz6d8` @ 8063d98) · polecenie: `oczko-warsztat` `koordynacja/role-2026-11-01/08-partia-8a.md` (6760d7c) · decyzje P-326–P-330.

## Stan wyjściowy i końcowy
- Przed pracą (8063d98): `npm test` 239 zestawów, 2655 testów, kod 0.
- Po pracy: `env -u NODE_PATH npm run verify` (typecheck, typecheck:testy, lint, jakosc:kontrole, test) — kod 0, 252 zestawy, 2722 testy (2026-11-01).

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
| 019 | e066618 | `tests/ekrany/stan-danych-trasa.test.tsx` |

Przegląd ścieżek wrażliwych (zasada trybu fix; subagent bez mojego rozumowania, diff `8063d98..HEAD -- src app` do 8511e0b: 003, N-05-1, 012, 004): **„brak uwag”**. Późniejsze commity (002, 008, 013, 029, 031, 019) nie dotykają kopii, importu ani czyszczenia danych; 002 dotyka zakupów — przegląd nieodbyty (patrz „Otwarte”).

## Nie zrobione / otwarte
- **015** (ostatnia udana synchronizacja na sztywno `ostatniaUdana: null`): brak źródła danych. Wymaga nowego klucza stanu urządzenia (np. `icloud_ostatnia_udana_ms`, wzór `zegarek_ostatnia_partia_ms`, P-199 Q5a) i wiersza w `dane.md` — decyzja roli 05 / koordynatora. Opcje: A) klucz zapisywany przez sterownik po udanej partii (rekomendacja; mały, bez migracji); B) wyprowadzenie z `synchronizacja.zmieniono_ms` — tej kolumny nie aktualizuje się po każdej partii, więc fałszywe. Realność: brzegowa (iCloud ukryty w 1.0, ZM-06).
- **008**: wartość Apple ID zostaje `id0000000000` do czasu odczytu z API App Store Connect przez rolę 10 (D4). Do tego czasu `kontrola-ipa.sh` odrzuca build (zamierzone). Opcja do decyzji 04/koordynatora: ukryć wiersz „Rate Oczko” do czasu wpisania id (dziś stuknięcie otwiera zły adres).
- **031**: F-35 bez kodu (ZM-12: przywracanie tylko na ekranie zakupu). F-08, F-09, F-46, F-50 należą do 8b/8c.
- Brak przeglądu subagenta dla zmian 002 (zakupy, ścieżka wrażliwa).

## Prośby do 04 / 05 / 01
- 04: tekst „Oczko Pro is on.” (P-330) nie miał klucza — `ustawienia.pro_wlaczone` to „On”; dopisałem roboczo `oferty.pro_wlaczone` (en + kontekst), do akceptacji. Brak klucza nagłówka grupy „Counting” w Ustawieniach (design-spec 004) — grupa bez nagłówka.
- 04: kolizja `dane.zastapiono` (stare parametry `{nazwa, miejsce}`) — zastąpione kształtem 04/ADR-0028 `{kopia}`.
- 05/10: nowe katalogi i kopie w `Documents/Backup` (N-05-2 dla 04: tekst w „Data and sync” `stan_danych.kopie_opis` jest w kluczach, ale sam wiersz w `StanDanych` nie jest narysowany — poza ID 8a).

## Wyjątki nazwane (zasada 7)
- K-04e: `tests/bazy/` nie istnieje (brak wydanych wersji przed 1.0), więc test „bez migracji” idzie na świeżo zmigrowanej bazie bieżącego schematu.
- Istniejące testy zmienione zgodnie z ADR: ŚU-11 (kopia `.oczko` zamiast `.db`), ŚU-16 (Documents/Backup jako wyjątek od ADR-0001), R-068 (kształt propsów), `icloud-stan-danych` (this iPhone → this device).
- Okno +1 między kopią a usunięciem w „Delete all data” — teoretyczne (ms po potwierdzeniu).
- Pula kopii: ta sama zasada (2 najnowsze, 30 dni) osobno dla `oczko-przed-importem-*` i `oczko-przed-usunieciem-*` — wybór 08 (ADR mówi tylko o imporcie), do potwierdzenia przez 05.
