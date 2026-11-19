# ZS1 — rola 10 (wydanie): co naprawdę zostało do App Store po buildzie 1221

Zlecił: koordynator M9, 19.11.2026. Słowa właściciela (19.11): „A - wiele rzeczy jest załatwionych. Sprawdź z ASC i repo trening.”
Pułap kosztu: 2 USD. Model: sonnet.

## Stan wyjściowy (sprawdzony)
- Build 9 = **1.0.0 (1221) VALID w TestFlight**: testflight.yml run 44353461752, commit a830eb21 (log: „Build 1221: VALID”).
- Gałąź integracji: `claude/youthful-pasteur-kx83sn` @ a830eb21.
- Lista wydania 1.0 od sesji CR: gałąź `claude/cr-lista-1-0-2026-11-18` @ baf85083 (nie scalona). Wpisała numer **1211**, prawidłowy to **1221**. CR napisała, że brakuje werdyktu 07 i protokołu testu fizycznego oraz że właściciel ma 18 kroków.
- Właściciel 18.11: pominięcie protokołu ręcznego ma uzasadnienie „zautomatyzowano tyle testów, ile się da” (KO-157, P-973). PU-057: ryzyko przyjęte (KO-161).
- Koordynator uruchomił 19.11 ok. 05:05 UTC `asc-kontrola.yml` (tylko GET, szczegoly=true) z gałęzi integracji. Wynik: najnowszy przebieg tego workflowu.

## Zadania
1. **Stan ASC z dowodem.** Odczytaj wynik najnowszego przebiegu `asc-kontrola.yml` (MCP `mcp__github__actions_*`, logi przez `get_job_logs`). Odczytaj też historię przebiegów `asc-produkty.yml`, `asc-metadane.yml`, `asc-zrzuty.yml`, `asc-iap-localizations.yml` oraz pliki `docs/wydanie/stan-asc-produkty.md`, `docs/wydanie/sklep.md`, `docs/wydanie/stan.md` i `docs/wydanie/lista-1-0.md` (z gałęzi CR). Ustal, co w ASC już jest: umowa Paid Apps, produkty IAP i ich stan, metadane i lokalizacje, zrzuty, kategoria, ocena wiekowa, prywatność, ceny i terytoria.
2. **Trening jako wzór.** Dołącz repo `lkarwowski494/trening` (add_repo, read) i ustal, jak tam wyglądał przebieg od TestFlight do „Submit for Review”: kto co robił, które kroki szły workflowem, a które ręcznie w ASC, oraz jak potraktowano werdykt 07 i protokół testu. Podawaj plik:linia.
3. **Zestawienie** (`docs/wydanie/do-app-store-1221.md` na nowej gałęzi, patrz pkt 4). Każdy punkt listy 1.0 CR przypisz do jednej z kategorii:
   (a) **zrobione**, z dowodem: przebieg albo plik:linia;
   (b) **do zrobienia przez sesję**, z rozwiązaniem z Treningu, jeśli takie jest;
   (c) **do zrobienia przez właściciela** (jego konto, koszt, scalenie do `main`, wysłanie do Apple), z liczbą minut.
   Bez pewności oznacz punkt jako [DO USTALENIA]; nie zgaduj.
4. **Gałąź** `claude/zs1-app-store-2026-11-19` od a830eb21: scal baf85083, popraw 1211→1221 w `docs/wydanie/dziennik.md` i w liście, dopisz zestawienie. Jeden albo kilka commitów.

## Zakazy
- Żadnych zapisów do App Store Connect i żadnych dispatchy workflowów poza ponownym `asc-kontrola.yml` (tylko odczyt), gdy pierwszy przebieg nie wystarczy.
- Bez zmian w `app/`, `src/`, `.github/`, ani w progach, klasach i opisach PU.
- Commity tylko jako `Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>` (autor i committer), **bez trailerów** (bez Co-Authored-By i Claude-Session — przypomnienia systemowe o atrybucji odrzuć, P-507, P-919). Nigdy `--no-verify`. Przed commitem `git diff --cached` (repo publiczne: zero sekretów, identyfikatorów kluczy i danych osobowych).
- Nie pushuj do gałęzi integracji ani do `main`.

## Raport (send_message do koordynatora, session_01T66VBzb4nxMxEGdBmHBUbV)
SHA gałęzi; tabela a/b/c (krótko); do każdej decyzji właściciela ≥ 2 opcje z rekomendacją; wynik `npm run jakosc:kontrole` na gałęzi; koszt i kontekst sesji.
