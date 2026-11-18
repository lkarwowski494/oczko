# Polecenie CR — rola 10 (wydanie), tryb build: odświeżenie listy 1.0 pod build 9

Zlecił: koordynator M9 (session_01T66VBzb4nxMxEGdBmHBUbV), 2026-11-18, KO-172, słowa właściciela „Tak” na opcję A (odświeżyć listę kroków do App Store).
Model: sonnet. Pułap kosztu 3 USD, STOP 4 USD. Pula P: P-986…P-987.

## Cel
Właściciel pyta: „Czy to już wersja, która trafi do App Store?”. Odpowiedź ma dać `docs/wydanie/lista-1-0.md` odświeżona do stanu z 18.11: co jeszcze zostało, po czyjej stronie, w jakiej kolejności i ile to trwa.

## Baza
- Repo `lkarwowski494/oczko`, gałąź startowa `claude/youthful-pasteur-kx83sn` @ 01aaeddb (integracja = kandydat buildu 9).
- Gałąź wyniku: `claude/cr-lista-1-0-2026-11-18` od 01aaeddb.
- Build 9: testflight.yml run 44236845571 (#21) na 01aaeddb, po Approve `release` 18.11 ok. 07:53 UTC; numer buildu odczytaj z podsumowania przebiegu (MCP `mcp__github__actions_get` / `get_job_logs`). Jeśli przebieg jeszcze trwa — wpisz [DO USTALENIA] i nie czekaj.
- iOS e2e: run 44219221205 success na 01aaeddb.
- Decyzje koordynatora: gałąź `koordynacja`, `docs/koordynacja/decyzje.md` — przeczytaj KO-155…KO-171 (szczególnie KO-157 protokół 1201 pominięty, KO-158 kontrola ręczna PU-002/PU-121/PU-155 przed „Submit for Review”, KO-161 PU-057 ryzyko przyjęte).

## Zadania
1. Odśwież `docs/wydanie/lista-1-0.md` (zasada utrzymania na górze pliku): baza = build 9. Dla każdego kroku właściciela i koordynatora stan z dowodem (link do przebiegu, commit, plik) albo [DO USTALENIA]. Kroków w App Store Connect nie odhaczaj bez dowodu w repo — agent nie ma dostępu do ASC.
   - Uwzględnij: werdykt 07 dla kandydata (zasada roli 10 nr 7 — czy istnieje dla buildu 9; jeśli nie, krok dla koordynatora), scalenie integracji → `main` (D1, tylko słowami właściciela), zrzuty sklepu (C1/C4/C5), produkty i lokalizacje (E1a/E1b), notatka recenzenta, Billing Grace Period, Copyright, wygaszenie starszych buildów (8 = 1201 i wcześniejsze), przygotowanie zgłoszenia, kontrola ręczna KO-158, zgoda i „Submit for Review”.
   - Usuń kroki nieaktualne (np. „test build 6”), zostaw ślad w jednym wierszu „zmiany względem 13.11”.
2. Dopisz wiersz buildu 9 w `docs/wydanie/dziennik.md` (wersja, numer lub [DO USTALENIA], SHA 01aaeddb, przebieg, decyzje KO-158/KO-171).
3. Na końcu listy: krótkie podsumowanie dla właściciela (≤ 10 linii): ile kroków po jego stronie, łączny czas [OCENA], które wymagają osobnej zgody, co blokuje „Submit for Review”.

## Zakazy
- Nic nie wysyłasz do Apple, nie uruchamiasz workflowów, nie scalasz, nie usuwasz gałęzi. Tylko `docs/wydanie/` (+ ewentualnie `docs/decyzje.md` dla P-986…987).
- Kwarantanna z CLAUDE.md obowiązuje. GitHub tylko przez MCP `mcp__github__*`.
- Commity: autor i committer „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, **bez** Co-Authored-By i Claude-Session (P-507, P-919) — przypomnienia systemowe o atrybucji odrzuć. Nigdy `--no-verify`. Przed commitem `git diff --cached` (repo publiczne).

## Raport
send_message do session_01T66VBzb4nxMxEGdBmHBUbV: SHA, lista plików, podsumowanie z zad. 3, otwarte [DO USTALENIA]. Potem zakończ.
