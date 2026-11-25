#!/usr/bin/env bash
# Wybiera i uruchamia symulator Apple Watch do zrzutów sklepu (zrzuty-zegarka.yml; rola 10-wydanie, ZW1, KO-197). Wzorzec: trening:scripts/ci/watch-simulator.sh.
# Wypisuje TYLKO identyfikator symulatora na stdout (log CI jest publiczny — żadnych nazw maszyn poza tym jednym wynikiem, który workflow zapisuje do zmiennej).
# Domyślny wzorzec: „Apple Watch Series 1[0-9] (46mm)” — 416 × 496 px, rozmiar z listy Apple (Series 12, 11, 10); wersja 42 mm ma inny ekran i nie jest na liście Apple.
# Inny zegarek: wzorzec (regex) w 1. argumencie, np. „Apple Watch Ultra 3” (422 × 514); rozmiar kadrów sprawdza potem zegarek-kadry.mjs komplet.
# Użycie: UDID=$(bash scripts/ci/zegarek-symulator.sh [wzorzec_nazwy])
# Zmienne: DRY_RUN=1 — nie uruchamia symulatora (test w Jest na Linuksie podaje własny wynik `simctl list` w SIMCTL_LIST_JSON).
set -euo pipefail
PATTERN="${1:-Apple Watch Series 1[0-9] \\(46mm\\)}"
[ -n "$PATTERN" ] || PATTERN='Apple Watch Series 1[0-9] \(46mm\)'
if [ -n "${SIMCTL_LIST_JSON:-}" ]; then LIST=$(cat "$SIMCTL_LIST_JSON"); else LIST=$(xcrun simctl list devices available -j); fi
# Brak zegarka pasującego do wzorca = błąd (nie cichy wybór innego rozmiaru: Apple wymaga jednego rozmiaru we wszystkich lokalizacjach i tylko z listy).
UDID=$(printf '%s' "$LIST" | node -e '
  const j = JSON.parse(require("fs").readFileSync(0, "utf8")); const pat = new RegExp(process.argv[1]);
  const rows = Object.entries(j.devices).filter(([rt]) => /watchOS/.test(rt)).flatMap(([rt, ds]) => ds.map(d => ({ ...d, rt })));
  const ver = rt => (rt.match(/watchOS-(\d+)-?(\d+)?/) || []).slice(1).map(x => Number(x || 0));
  const cmp = (a, b) => (ver(b.rt)[0] - ver(a.rt)[0]) || (ver(b.rt)[1] - ver(a.rt)[1]);
  const pick = rows.filter(d => pat.test(d.name)).sort(cmp)[0];
  if (!pick) { console.error("Brak symulatora watchOS pasującego do wzorca (xcrun simctl list devices available)"); process.exit(1); }
  console.log(pick.udid);' "$PATTERN")
if [ -z "${DRY_RUN:-}" ]; then
  xcrun simctl boot "$UDID" >/dev/null 2>&1 || true
  xcrun simctl bootstatus "$UDID" -b >/dev/null 2>&1 || true
fi
printf '%s\n' "$UDID"
