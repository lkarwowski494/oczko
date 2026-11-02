# Poprawki po raporcie E2 #135, sesja C (rola 08, tryb fix; 2026-11-02): Word, strażnik ikony zegarka, klucz

Gałąź: `claude/kopia-poprawki-c-2026-11-02` (od `claude/kopia-integracja-2026-11-02` c649f78). Polecenie: `oczko-warsztat` 50ff573 `koordynacja/role-2026-11-01/08-poprawki-e2.md`, sekcja C. Raport źródłowy: `oczko-warsztat` `07-jakosc/2026-11-02-e2/raport.md`. Na roboczą nie pushowano (scali koordynator). Swift nie kompiluje się na Linuksie: kompilacja, `swift test` pakietu i `eksperymenty-wzoru` dopiero w przebiegu macOS po scaleniu.

Stan wyjściowy (przed pracą): `npm ci` kod 0; `npm test` 311 zestawów, 3125 testów, kod 0 (zgodne z koordynatorem).

## E0: klasyfikacja i plan

| ID | Rodzaj | Realność | Plan |
|---|---|---|---|
| E2-A5 (W1-A, P-282 A) | D | realny, S3 | włączyć przycinanie końcowych pustych stron dla wyniku Worda; zdjąć `XCTExpectFailure` |
| E2-A3 (W1) | D | brzegowy | osobny powód `przekroczono_czas` dla pliku lokalnego; strona WWW zostaje przy `brak_sieci` (czeka w skrzynce) |
| P-350 | D | brzegowy (wydanie) | strażnik po prebuild: cel zegarka ma `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon` |
| P-351 | do sprawdzenia | — | czy kod używa `licznik.jednostka_w_trakcie`; jeśli nie, zgłoszenie |

## Wykonane

| ID | Commit | Test (przed → po) | Uwagi |
|---|---|---|---|
| E2-A5 | bac5ac3 | `tests/adaptery/konwersja-pdf-kontrakt.test.ts` (5): 5 z 5 czerwonych (zaślepka, brak podłączenia, `XCTExpectFailure`) → 5 z 5 zielonych | `bezPustychStronNaKoncu` usuwa końcowe strony bez tekstu i z jednolicie białą miniaturą, nigdy do zera stron, zapis obok i podmiana pliku; wołane tylko dla `.word` w `Konwersja.naPdf`, przed `sprawdz`. Asercje Swift (`testW1PustaStronaNaKoncu`, 4 wartości + plik po przycięciu) bez zmian, zdjęty tylko `XCTExpectFailure` |
| E2-A3 | 1f32c23 | 6 nowych czerwonych (alert, adapter, trasa Word, 3 kontrakty Swift) → zielone; test skrzynki zielony od razu (strażnik decyzji) | Swift `PowodWzoru.przekroczonoCzas` + `powodPrzekroczeniaCzasu(plikLokalny:)`; TS `Powod`, lista adaptera, `alertImportu`; klucze `wzor.blad_czas`, `wzor.blad_czas_opis` (tylko en, `oczekujace.json`) |
| P-350 | c9ef6ba | `tests/jakosc/ikona-zegarka-prebuild.test.ts` (7): 7 z 7 czerwonych na zasłonie skryptu (kod 0) → 7 z 7 zielonych | `scripts/natywne/ikona-zegarka.mjs` + krok w `jakosc-ios.yml` (job `build`, po `expo prebuild`, przed `pod install`). Dowód na żywo: `expo prebuild --platform ios --no-install --clean` (Linux, kod 0) → strażnik kod 0 (2 konfiguracje `com.apps4brew.knitting.watchkitapp`, AppIcon); po zamianie na `AppIconX` kod 1. Wzór: `verify:native` w Treningu (`scripts/verify-native.mjs`, `ios-unsigned.yml`) |
| P-351 | — (bez kodu) | — | patrz „P-351: zgłoszenie” niżej |

Przegląd subagentem zmian ścieżki wrażliwej (workflow, P-350; tylko diff, znalezisko i zasady 10–14): „brak uwag”.

Dowód końcowy: `env -u NODE_PATH npm run verify` kod 0 (313 zestawów, 3144 testów); wcześniej po E2-A3: 312 zestawów, 3137 testów; `typecheck`, `typecheck:testy`, `jakosc:kontrole`, `i18n` (0 błędów, uwagi z listy oczekujących) kod 0.

## Do akceptacji 04 (teksty robocze, wg przewodnika głosu: co się stało i co zrobić)
- `wzor.blad_czas` „Oczko couldn’t finish converting this file”
- `wzor.blad_czas_opis` „“{{plik}}” took too long to convert. Nothing was added. Try again, or save it as a PDF and add the PDF.”

## Decyzje i uwagi roli
- E2-A3, skrzynka (share extension): `przekroczono_czas` nie jest w `PRZEJSCIOWE`, więc Word, który się nie skonwertował, daje alert z przyczyną, a zlecenie zostaje do potwierdzenia (nic po cichu). Alternatywa: uznać za przejściowy (zlecenie czeka i ponawia przy starcie bez komunikatu, 60 s konwersji przy każdym starcie) — odrzucona, bo to dawna cisza. Do weta koordynatora.
- E2-A3, skutek uboczny wcześniejszego stanu: przy imporcie Worda z aplikacji `brak_sieci` dawał `alertImportu` = null, czyli brak jakiegokolwiek komunikatu (nie „komunikat o sieci”, jak w raporcie 07); teraz jest alert.
- Docs poza zakresem roli 08 (`docs/architektura/moduly.md`, lista powodów kontraktu `Powod`): do aktualizacji przez 05.

## P-351: zgłoszenie (kod nie używa klucza)
`licznik.jednostka_w_trakcie` („current row”) jest w `docs/design/fix10-2026-11-01/klucze.json:74` i w `design-spec.md:904` (F-09, BR-LIC-012: podpis przy liczbie w trybie „rząd w trakcie” zamiast „rows”), ale **kod go nie używa**: `rg jednostka_w_trakcie src app` = 0 trafień, a `src/ekrany/Licznik.tsx:100` pokazuje w tym trybie `licznik.jednostka` („rows”) (liczba to `s.dziergany`, `Licznik.tsx:85`). Zgodnie z poleceniem (kod nie używa → zgłosić) nie dopisano klucza do `en.json` (osierocony klucz bez użycia); nie naprawiano rozjazdu (nowe znalezisko).
- **Nowe znalezisko E2-C-N1** (rozjazd z design-spec F-09): realny, S3 (zły podpis liczby w trybie „rząd w trakcie”, nie utrata danych). Opcje: **A** (rekomendacja) — w `Licznik.tsx:100` dla `znaczenie === 'w_trakcie'` i bez celu podpis `t('licznik.jednostka_w_trakcie')`, klucz tylko en + `oczekujace.json`, test RNTL (tryb `w_trakcie`: podpis „current row”, tryb `skonczone`: „rows”); koszt ok. 15 min agenta, jedna linia kodu; **B** — 04 usuwa klucz z `klucze.json` i F-09 mówi „rows” (kompromis: liczba oznacza rząd w robocie, podpis „rows” myli, bo sugeruje liczbę skończonych). Brak E2E (`rg "current row" e2e` = 0).

## Uwaga do 10 (poza zakresem sesji C)
`testflight.yml:107-108` też uruchamia `expo prebuild`, ale bez strażnika ikony zegarka (zmiana workflow wydania, ścieżka wrażliwa, rola 10; `kontrola-ipa.sh` łapie brak `CFBundleIconName` dopiero w archiwum). Propozycja: ten sam krok po prebuild w `testflight.yml`.
