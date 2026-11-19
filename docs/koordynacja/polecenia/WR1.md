# WR1 — rola 07 (audit): werdykt dla buildu 1221 (a830eb21) (2026-11-19)

Model: sonnet. Pułap: 2,5 USD. Gałąź: `claude/wr1-werdykt-1221-2026-11-19` od integracji `claude/youthful-pasteur-kx83sn` @ b106e210. Decyzja: KO-178 (do weta). Pula P: P-991…P-992.

## Cel
Plik `docs/jakosc/werdykt-build-1221.md` w układzie `docs/jakosc/werdykt-build-1161.md` (dowody w `docs/jakosc/werdykt-1221/`). Binarka 1221 = a830eb21 (testflight 44353461752, „Build 1221: VALID”); kod po a830eb21 na integracji to tylko dokumenty i workflowy wydania (sprawdź `git diff --stat a830eb21 b106e210 -- src app modules ios`).
Zakres: (1) zmiany od ostatniego werdyktu (1161) do a830eb21 — audyt zmian jak Trening Z-03 (`docs/wydanie/do-app-store-1221.md`, D-2); (2) wyniki CI na a830eb21 (iOS e2e, verify macOS z testflight) z numerami przebiegów; (3) **OG-07** (P-218 ogr. 6, P-224): przegląd ekranów wzoru 03/04 na zrzutach sklepu — artefakt `sklep-zrzuty-ramki` przebiegu 44533640642 (`warunek-og07/…`) — czy pokazują coś spoza ograniczeń 1–6; wynik rozstrzyga, czy sceny 03/04 mogą iść do sklepu; (4) werdykt: GOTOWY / GOTOWY Z UWAGAMI / NIEGOTOWY, z P1/P2/P3.
**Nie** pisz `docs/jakosc/test-fizyczny/1221.md` — czeka na słowo właściciela (D-2, pytanie 1).

## Zakazy
Bez App Store Connect, bez `main`, bez force-push, bez dispatchu workflowów, bez zmian klas/progów/listy PU, nigdy `--no-verify`. Commity jako „Łukasz Karwowski <336954459+lkarwowski494@users.noreply.github.com>”, bez Co-Authored-By i bez Claude-Session (P-507, P-919); przed commitem `git diff --cached`. GitHub tylko przez MCP `mcp__github__*`.

## Raport
SHA, werdykt i lista uwag z priorytetami, wynik OG-07 (03/04: tak/nie i dlaczego), dowody (numery przebiegów, pliki), koszt.
