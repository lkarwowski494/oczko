# Partia 8: kontrakty dla luk 07-jakosc-003, -004, -005, -017 (rola 05, fix, 2026-11-01)

Wejście: raport zgodności 1.0 (`oczko-warsztat` `07-jakosc/2026-11-01-zgodnosc-1-0/raport.md`, ecc4c36), P-325/P-326. Decyzje: ADR-0028 (003), ADR-0029 (004), ADR-0030 (005), ADR-0031 (017). Wszystkie cztery są **przyjęte warunkowo** do potwierdzenia przez koordynatora (P-087). Kodu aplikacji nie zmieniałem (kod czytany jako materiał); poniżej to, co ma wdrożyć rola 08, i kryteria, które mają przejść testy (czerwone przed poprawką, zasada 11).

Klasyfikacja E0: 003 — D (defekt, ścieżka danych); 004 — D; 005 — D (luka 1) + zależność od roli 04 (luka 2, token haptyki); 017 — D. Żadne nie wymaga wyboru właściciela (koszty i konta nie są dotknięte); wybory spośród opcji zapisane w ADR.

## Zmiany portów (nie wchodzą do bloku „Porty domeny” w `moduly.md`, dopóki 08 nie zmieni `src/domena/porty.ts`)
`sprawdz-porty.mjs` wymaga, żeby blok w `moduly.md` był równy `src/domena/porty.ts`; dlatego 08 wprowadza poniższe zmiany **w tym samym commicie** w obu miejscach.
```ts
// Katalogi: nowy katalog kopii przed importem (ADR-0028), Documents/Backup
export interface Katalogi { kopie: string; kopiePrzed: string; tymczasowy: string }
// PortArchiwum.zapisz: opcjonalny przedrostek nazwy (domyślnie 'oczko'); kopiaPrzed() zapisuje 'oczko-przed-importem' w Katalogi.kopiePrzed
zapisz(katalogDocelowy: string, opcje?: { przedrostek?: string }): Promise<Wynik<{ sciezka: string; manifest: Manifest }>>;
// Siec (ADR-0031): podpowiedź o ścieżce sieciowej, nie gwarancja osiągalności serwera
export type StanSieci = 'jest' | 'brak' | 'nieznany';
export interface Siec { stan(): StanSieci; obserwuj(fn: (s: StanSieci) => void): () => void }
// SkrzynkaImportu: dopisanie zlecenia z aplikacji (strona WWW bez sieci); zapis atomowy tmp → rename, ten sam zlecenie.json co rozszerzenie
export type NoweZlecenie = { rodzaj: 'adres'; adres: string; nazwa: string; projektId: string | null };
export interface SkrzynkaImportu { pobierz(): Promise<ZlecenieImportu[]>; usun(id: string): Promise<void>; dodaj(z: NoweZlecenie): Promise<Wynik<{ id: string }>> }
```
`Zegarek` i `WynikImportu` bez zmian sygnatur (`kopiaPrzed` w `WynikImportu` nadal pełna ścieżka; nazwę wyciąga kompozycja).

Stałe do `src/konfiguracja.ts` (ARCH-05, jedno miejsce): `KOPIA_PRZED_IMPORTEM_MAKS = 2` (kopie, [OCENA 05]), `SIEC_PONOWIENIE_MS = 5000` ([OCENA 05]; odstęp przed ponownym `przetworzSkrzynke` po zdarzeniu `'jest'`). `KOPIA_PRZED_IMPORTEM_DNI = 30` bez zmian.

## 1. 07-jakosc-003 — kopia sprzed „Replace” (ADR-0028)
Pliki 08: `src/dane/archiwum.ts` (`kopiaPrzed` przez `zapisz` z przedrostkiem), `src/kompozycja/start-aplikacji.ts:76` i `kontener.ts:93` (`katalogi.kopiePrzed = <Documents>/Backup`), `src/niezawodnosc/kopie.ts` (czysta funkcja puli `kopieDoUsuniecia`-podobna dla `.oczko`, wołana w tym samym miejscu startu co `sprzatnijKopie`), `app/ustawienia.tsx:79` (wynik „Replace” → stan `zastapiono` z `Dane.tsx:40`), `src/kompozycja/dane.ts` (`wynikScalenia` dla `zastap`).
| ID | Kryterium (test) |
|---|---|
| K-03a | Eksport → zmiana danych → import tego pliku w trybie „Replace”: w `Documents/Backup` powstaje dokładnie jeden plik `oczko-przed-importem-<dzień>.oczko`; `sprawdz()` go przyjmuje (manifest, SHA-256, `integrity_check`). |
| K-03b | Import pliku z K-03a w trybie „Replace” przywraca liczności tabel i SHA-256 plików sprzed pierwszego „Replace” (kopia jest kompletna, łącznie z plikami, które „Replace” osierocił). |
| K-03c | Ekran po „Replace” (przez trasę `app/ustawienia`, nie sam komponent) pokazuje stan `zastapiono` z nazwą kopii i miejscem w Plikach; po „Merge” pokazuje wynik scalenia i **nie** tworzy kopii. |
| K-03d | Błąd zapisu kopii (`brak_miejsca`, `zapis`) → import kończy się błędem przed pierwszym zapisem do bazy: `PRAGMA data_version` i liczności bez zmian, ekran pokazuje błąd, nie „Merged” ani `zastapiono`. |
| K-03e | Druga kopia tego samego dnia dostaje `-2`, nie nadpisuje pierwszej. |
| K-03f | Pula (ADR-0032, zastępuje pierwotne „przy 3 kopiach zostają 2 najnowsze”, DEC-18 a): trzy kopie jednego dnia → zostają pierwsza i najnowsza; pierwsza kopia każdego dnia zostaje do 30 dni ponad limit; kopia starsza niż 30 dni jest usuwana; plik o obcej nazwie w `Documents/Backup` i nazwa z datą w przyszłości zostają (czysta funkcja, test w Node). |
| K-03g | „Replace” przy włączonym iCloud nadal odmawia (`niedozwolone_przejscie`) i nie tworzy kopii (ADR-0005). |
Ryzyko: ARCH-13 — pakowanie i VACUUM pod `czasWTle.chron('import', …)` (jak dziś). Realność: realny (ścieżka danych). Czas 08: 1,5–2 h (raport). Zależność: 04 (tekst `dane.zastapiono`, `miejsce`).

## 2. 07-jakosc-004 — preferencje urządzenia (ADR-0029)
Pliki 08: `src/dane/repozytoria/ustawienia.ts` (`KluczUstawienia` + 3 klucze), `src/dane/baza/przeniesienie.ts:13` (`KLUCZE_URZADZENIA` + 3 klucze), nowa czysta funkcja domeny `preferencjeZUstawien(surowe) → { wibracje, ekranNieGasnie, ukladMiar }` (walidacja + wartości domyślne), `src/kompozycja/preferencje.ts` (migawka z bazy, zapis przez `ustawPreferencje`), `src/kompozycja/licznik.ts:240` (`ekranWlaczony` z preferencji), `src/kompozycja/miary.ts` (`ukladMiar(pref, …)`), `src/i18n` (`MagazynPreferencji` JSON-owo dla `uklad_miar`), `src/przypadki-uzycia/projekt.ts:162` (po „Usuń wszystkie dane” przeładowanie migawki), ekran Ustawień (wiersze „Vibration”, „Keep screen on while counting”, „Units”; etykiety: 04).
| ID | Kryterium (test) |
|---|---|
| K-04a | `preferencjeZUstawien` (Node): brak klucza → domyślne; wartość złego typu / nieznany napis → domyślna (`"auto"`, `true`); poprawne wartości przechodzą. |
| K-04b | Restart: `ustawPreferencje({ wibracje: false })` → nowy kontener na tej samej bazie → `preferencje().stan().wibracje === false` (BR-LIC-020 S3 po restarcie) i haptyka dla +1, przypomnienia, końca powtórzenia i celu dnia nie jest wołana. |
| K-04c | `ekran_nie_gasnie = false` → ekran licznika nie woła `EkranAktywny.wlacz` (BR-LIC-013 S2); `true` → woła (S1). |
| K-04d | `uklad_miar = "imperial"` na telefonie z systemem metrycznym → narzędzia pokazują cale i uncje; `"metric"` na systemie `us` → cm i gramy; `"auto"` → jak system (BR-KAL-003 S6); dane w bazie bez zmian (mm, g). |
| K-04e | Test na kopii `v1.db` bez tych kluczy: otwarcie nie zapisuje żadnego wiersza `ustawienie`, odczyt daje wartości domyślne, `integrity_check = ok`, `user_version` bez zmiany (brak migracji). |
| K-04f | Import „Replace” i „Merge” archiwum zawierającego te klucze nie zmienia kluczy urządzenia (`KLUCZE_URZADZENIA`). |
| K-04g | Błąd zapisu (zablokowana kolejka / pełny dysk, wstrzyknięty) → komunikat `licznik.blad_zapisu`, migawka bez zmiany; po „Usuń wszystkie dane” migawka = domyślne. |
Realność: realny (wibracje, jednostki), brzegowy (ekran). Czas 08: 4,5–5,5 h (raport). Zależność: 04 (wiersze Ustawień, układ).

## 3. 07-jakosc-005 — zegarek, `odbieraj` (ADR-0030)
Pliki 08: nowy `src/kompozycja/zegarek-odbior.ts` (subskrypcja, single-flight), wpięcie w `src/kompozycja/licznik.ts` obok `uslugi.start` i zamknięcia kontenera; bez zmian `src/platforma/zegarek.ts`. Swift (okno macOS, 8e): funkcja wzorca haptyki w pakiecie `oczko-reguly` + mapowanie w `targets/watch/Aplikacja.swift:83`.
| ID | Kryterium (test) |
|---|---|
| K-05a | Udawany zegarek emituje zdarzenie po dopisaniu 1 linii do dziennika; aplikacja aktywna → licznik w bazie i na ekranie rośnie o 1 bez zdarzenia `AppState`, `Zegarek.potwierdz` dostaje id linii, `wyslijStan` jest wołane po potwierdzeniu. |
| K-05b | 3 zdarzenia w ciągu jednej pętli zdarzeń → najwyżej 2 przebiegi `naPierwszyPlan`, końcowa wartość = wartość + 3, wszystkie 3 id w `potwierdzone`. |
| K-05c | Zdarzenie przy `AppState !== 'active'` → żadne scalenie (zero transakcji); po przejściu na `active` linie są scalone przez istniejące `naPierwszyPlan` (ARCH-13). |
| K-05d | Powtórzone dostarczenie tej samej linii (id) → licznik bez zmiany, id nadal potwierdzone (M-02). |
| K-05e | Błąd scalenia (wstrzyknięty) → wpis `blad` z kodem `zegarek_scalenie`, dziennik nieskrócony, kolejne zdarzenie ponawia i scala. |
| K-05f | Odpięcie przy zamknięciu kontenera: po zamknięciu zdarzenia nie wywołują scalenia (brak wycieku subskrypcji). |
| K-05g | Swift (`swift test`): funkcja wzorca haptyki: wejście na rząd z przypomnieniem → `przypomnienie`; zwykły rząd → `plus`; nieudany zapis → `bladZapisu`; licznik zablokowany → `blokadaStukniecie`. Wymaga tokenu 04 `haptykaZegarek.przypomnienie` (do czasu tokenu mapowanie `przypomnienie → plus`, test oznacza to jawnie). |
| K-05h | Urządzenie (P-316, krok właściciela): telefon na pierwszym planie, licznik otwarty; 3 stuknięcia na zegarku → telefon pokazuje +3 bez ruchu w aplikacji, zegarek nie pokazuje „iPhone not nearby…” po 15 min. Na zegarku rząd z przypomnieniem wibruje wzorcem innym niż `.click` (po tokenie). |
Realność: realny (użytkownicy zegarka); pewność skutku na urządzeniu średnia. Czas 08: 2 h (luka 1) + 1 h (luka 2) + CI macOS (raport). Zależność: 04 (token), zegarek właściciela.

## 4. 07-jakosc-017 — skrzynka: sieć i reguła rozszerzeń (ADR-0031)
Pliki 08: `modules/oczko-wzor/ios/` (`NWPathMonitor`: `siecStan()`, zdarzenie `siecZmiana`) i `modules/oczko-wzor/index.ts`; nowy `src/platforma/siec.ts` (adapter, w E2E `siecWylaczona()` → `'brak'`); `src/platforma/skrzynka.ts` (`dodaj`); `src/kompozycja/wzor.ts` + `wzor-dodawanie.ts:11` (po `brak_sieci` z aplikacji → `dodaj` zamiast `null`); `app/projekt/[id].tsx:125` (stan z portu, nie z `siecWylaczona()`); `src/przypadki-uzycia/skrzynka.ts:17,28` i nowa czysta `rodzajPliku` w `src/domena/` (reguła Word = `.docx`); ponowienie na zdarzeniu `Siec`.
| ID | Kryterium (test) |
|---|---|
| K-17a | `Siec.stan() === 'brak'` + stuknięcie linku filmu → alert `wzor.film_bez_sieci_tytul`/`film_bez_sieci`, `otworzAdres` nie wołane; `'jest'` i `'nieznany'` → `otworzAdres` wołane; link zapisany w każdym przypadku (BR-WZR-007 S4). |
| K-17b | Strona WWW z aplikacji, konwerter zwraca `brak_sieci` → w skrzynce powstaje zlecenie (`rodzaj: 'adres'`, `projektId`), projekt pokazuje wiersz `wzor.czeka_siec`, nie powstaje pusty wzór (BR-WZR-007 S3). |
| K-17c | Zdarzenie `Siec` → `'jest'` (po `SIEC_PONOWIENIE_MS`) uruchamia `przetworzSkrzynke`; zlecenie z K-17b kończy jako wzór, a zlecenie znika ze skrzynki. |
| K-17d | `SkrzynkaImportu.dodaj` zapisuje `zlecenie.json` atomowo (tmp → rename); katalog bez manifestu nie jest widoczny dla `pobierz`; `grupa === null` → `Wynik` błąd `zapis`, alert, adres zostaje w polu. |
| K-17e | Wiersz „czeka na sieć” zostaje po restarcie aplikacji (zlecenie jest w skrzynce, nie w pamięci). |
| K-17f | Swift (`swift test`): mapowanie `NWPath.Status` → `StanSieci`: `satisfied` → `jest`; `unsatisfied` i `requiresConnection` → `brak`; brak odpowiedzi monitora → `nieznany`. |
| K-17g | E2E 13/14 (`oczkoE2eSiec=brak`): film i strona wg K-17a/K-17b przez trasę (nie sam komponent). |
| K-17h | `rodzajPliku`: `.pdf`/`application/pdf` → `pdf`; `.docx`/`…wordprocessingml.document` → `word`; `.doc` i `application/msword` → `null` (alert `wzor.blad_typ`); obraz → `obraz`; lista UTI w `targets/share/Info.plist:12` zawiera Word wyłącznie jako `org.openxmlformats.wordprocessingml.document` (test porównuje oba). |
| K-17i | `grep -rn siecWylaczona src app` poza `tryb-e2e.ts` i adapterem E2E → 0 trafień. |
Realność: brzegowy. Czas 08: 3,5–4,5 h (raport) + okno macOS (Swift). Zależność: 10 przy deklaracji prywatności (wiersz w inwentarzu), brak nowych tekstów dla 04 (klucze `wzor.film_bez_sieci*`, `wzor.czeka_siec`, `wzor.blad_typ` istnieją).

## Kolejność dla 08
1. 8a: 003 (K-03a–g) i 004 (K-04a–g) — dane, bez macOS; 004 przed 8b (haptyka i licznik czytają migawkę).
2. 8e: 005 (K-05a–f w Node bez macOS; K-05g po tokenie 04; K-05h u właściciela).
3. 8d: 017 (K-17a–e, h, i w Node; K-17f i K-17g w oknie macOS).
Każde ID = jeden commit z numerem znaleziska; test czerwony na obecnym kodzie z właściwego powodu przed poprawką (zasada 11).

## Nowe obserwacje (nie naprawiane tutaj; zasada trybu fix)
- **N-05-1 (do 07/03, realny):** `usunWszystkieDane` (`src/przypadki-uzycia/projekt.ts:162`) kasuje dane bez kopii bezpieczeństwa; Trening robi `safetyBackup('reset')` zawsze przed „Wyczyść wszystkie dane” (`lib/backup.ts:99`, `app/more/settings.tsx:91`). Czy BR-DAN-… tego wymaga, nie sprawdziłem `[DO USTALENIA]`; jeśli tak, ta sama kopia `.oczko` z ADR-0028 jest gotowym mechanizmem (przedrostek `oczko-przed-usunieciem`).
- **N-05-2 (do 04, brzegowy):** kopia w `Documents/Backup` jest wliczana do kopii urządzenia iCloud (ADR-0028, Konsekwencje); tekst w „Data and sync” o miejscu kopii i jej rozmiarze — decyzja 04.
