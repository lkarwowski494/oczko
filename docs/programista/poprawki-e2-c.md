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

Dowód po E2-A3: `npm test` 312 zestawów, 3137 testów, kod 0; `typecheck`, `typecheck:testy`, `jakosc:kontrole`, `i18n` (0 błędów, uwagi z listy oczekujących) kod 0.

## Do akceptacji 04 (teksty robocze, wg przewodnika głosu: co się stało i co zrobić)
- `wzor.blad_czas` „Oczko couldn’t finish converting this file”
- `wzor.blad_czas_opis` „“{{plik}}” took too long to convert. Nothing was added. Try again, or save it as a PDF and add the PDF.”

## Decyzje i uwagi roli
- E2-A3, skrzynka (share extension): `przekroczono_czas` nie jest w `PRZEJSCIOWE`, więc Word, który się nie skonwertował, daje alert z przyczyną, a zlecenie zostaje do potwierdzenia (nic po cichu). Alternatywa: uznać za przejściowy (zlecenie czeka i ponawia przy starcie bez komunikatu, 60 s konwersji przy każdym starcie) — odrzucona, bo to dawna cisza. Do weta koordynatora.
- E2-A3, skutek uboczny wcześniejszego stanu: przy imporcie Worda z aplikacji `brak_sieci` dawał `alertImportu` = null, czyli brak jakiegokolwiek komunikatu (nie „komunikat o sieci”, jak w raporcie 07); teraz jest alert.
- Docs poza zakresem roli 08 (`docs/architektura/moduly.md`, lista powodów kontraktu `Powod`): do aktualizacji przez 05.
