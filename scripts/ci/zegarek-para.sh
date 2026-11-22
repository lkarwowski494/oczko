#!/usr/bin/env bash
# Paruje symulator zegarka z symulatorem iPhone'a przed zrzutami (zegarek-zrzuty.sh; rola 10-wydanie, ZW1, KO-197). Wzorzec: trening:scripts/ci/watch-pair.sh (lekcja L-064 Treningu).
# Bez pary watchOS pokazuje obok godziny czerwoną przekreśloną ikonę telefonu („brak połączenia z iPhone'em”) na każdym zrzucie do App Store. Para musi powstać PRZED instalacją
# aplikacji: parowanie po instalacji kasuje aplikację (Trening, przebieg 40883907827).
# Wybór telefonu: iPhone z najnowszego iOS, z którym watchOS da się sparować (próbujemy od najnowszego). Log CI jest publiczny — wypisujemy tylko stan, bez nazw i identyfikatorów.
# Użycie: bash scripts/ci/zegarek-para.sh <UDID_zegarka>
# Zmienne: DRY_RUN=1 — tylko wypisuje kolejność kandydatów (UDID-y telefonów), nic nie uruchamia (test w Jest podaje `simctl list` w SIMCTL_LIST_JSON).
set -euo pipefail
WATCH="${1:?podaj UDID zegarka}"
if [ -n "${SIMCTL_LIST_JSON:-}" ]; then LIST=$(cat "$SIMCTL_LIST_JSON"); else LIST=$(xcrun simctl list devices available -j); fi
PHONES=$(printf '%s' "$LIST" | node -e '
  const j = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const ver = rt => (rt.match(/iOS-(\d+)-?(\d+)?/) || []).slice(1).map(x => Number(x || 0));
  const rows = Object.entries(j.devices).filter(([rt]) => /\.iOS-/.test(rt)).flatMap(([rt, ds]) => ds.filter(d => /^iPhone/.test(d.name)).map(d => ({ ...d, rt })));
  rows.sort((a, b) => (ver(b.rt)[0] - ver(a.rt)[0]) || (ver(b.rt)[1] - ver(a.rt)[1]));
  console.log(rows.map(d => d.udid).join("\n"));')
[ -n "$PHONES" ] || { echo "::error::Brak symulatora iPhone'a do sparowania z zegarkiem"; exit 1; }
if [ -n "${DRY_RUN:-}" ]; then printf '%s\n' "$PHONES"; exit 0; fi
# Zegarek bywa już w parze (inny telefon) — rozłącz, żeby para była jednoznaczna.
xcrun simctl shutdown "$WATCH" >/dev/null 2>&1 || true
for p in $(xcrun simctl list pairs -j | node -e 'const j=JSON.parse(require("fs").readFileSync(0,"utf8")); for (const [id,p] of Object.entries(j.pairs||{})) if (p.watch&&p.watch.udid===process.argv[1]) console.log(id)' "$WATCH"); do
  xcrun simctl unpair "$p" >/dev/null 2>&1 || true
done
PHONE=""
for p in $PHONES; do
  xcrun simctl shutdown "$p" >/dev/null 2>&1 || true
  if PAIR=$(xcrun simctl pair "$WATCH" "$p" 2>/dev/null); then PHONE="$p"; break; fi
done
[ -n "$PHONE" ] || { echo "::error::Nie udało się sparować zegarka z żadnym symulatorem iPhone'a"; exit 1; }
xcrun simctl pair_activate "$PAIR" >/dev/null 2>&1 || true
xcrun simctl boot "$PHONE" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$PHONE" -b >/dev/null 2>&1 || true
xcrun simctl boot "$WATCH" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$WATCH" -b >/dev/null 2>&1 || true
sleep 10   # połączenie zegarka z telefonem ustala się chwilę po starcie obu symulatorów
STATE=$(xcrun simctl list pairs -j | node -e 'const j=JSON.parse(require("fs").readFileSync(0,"utf8")); const p=(j.pairs||{})[process.argv[1]]; console.log(p ? p.state : "brak")' "$PAIR")
echo "Zegarek sparowany z iPhone'em: stan pary: $STATE"
