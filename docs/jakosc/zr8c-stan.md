# ZR8c — stan (rola 10, fix; 2026-11-25; KO-205, P-1042, P-1043)

**Zgłoszenie:** iPhone 6.9″, kadry 03 i 04: „znacznik nadal na tekście” (linia y≈1002 w wierszu tekstu 963–1032, wszystkie języki; iPad OK) — przebiegi 45564086208 (all × iPhone) i 45564082350 (en, pl × iPhone, iPad), commit 4eea5b1d (ZR8b).

**Przyczyna (z pikseli):** znacznik stoi w przerwie (odstęp ≥ 22 px kadru 500 px = 23,4–27,4 pkt PDF; ≈ 19 pkt UIKit iPhone, ≈ 47 pkt iPad). Alarm to fałszywy wynik kontroli `liniaZnacznika`: wiersz 1002 to dolny pasek licznika aplikacji, w którym złoty przycisk „+1” (≈ 192,132,37, średnia RGB 120 < `PROG_CIEMNY`) i ciemny tekst dają 62,6% szerokości (en) ≥ `PROG_LINII` 60% (pl 46,4%; 13 z 29 języków czerwonych). Fikstura i sceny bez zmian.

**Poprawka (KO-205, opcja A):** `scripts/ci/kontrola-zakreslen.mjs` — do decyzji „linia” liczą się tylko ciemne piksele neutralne (`NASYCENIE_MAX` 30; znacznik ≤ 10, przycisk > 100). Progi bez zmian.

**Dowody:** `tests/wydanie/zr8c-pasek-licznika.test.ts` + `tests/wydanie/dane/zr8c-pasek-licznika/` (prawdziwe kadry, `pomiary.json`); czerwony na 4eea5b1d: `zr8c-dowod-czerwony.txt` (5 z 16); przegląd 29 języków: `zr8c-kontrola.txt` (alarmy 26 → 0); `npm run verify` exit 0, 740 zestawów, 8278 testów zielone: `zr8c-verify.txt`.

**Maestro / „tylko e2e”:** nie dotyczy — sceny i `wzor-sklepu.ts` bez zmian.

**Następny krok (koordynator):** dispatch tylko joba „komplet” — wejścia w P-1043 (`docs/decyzje.md`).
