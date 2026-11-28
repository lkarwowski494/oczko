#!/usr/bin/env bash
# Przebieg prototypu B na symulatorze (PB1, zadanie 1–2). Użycie: przebieg.sh <UDID> <ścieżka .app> <katalog-wyjścia> [liczba przebiegów=2]
# Każdy przebieg: start aplikacji z OCZKO_PROTOTYP_B=1 → Live Activity (staleDate = start + 60 s) → simctl terminate → brak procesu (pgrep, launchctl)
# → zrzuty simctl io co 5 s od start+10 s do start+110 s → OCR (ocr.swift). Wynik: <wyjście>/przebieg-N/{zrzuty,ocr.jsonl,meta.json,proces.txt}.
set -uo pipefail
DEV="$1"; APP="$2"; OUT="$3"; N="${4:-2}"
KAT="$(cd "$(dirname "$0")" && pwd)"
BUNDLE=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")
NAZWA=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$APP/Info.plist")
mkdir -p "$OUT"
swiftc -O "$KAT/ocr.swift" -o "$OUT/ocr" 2> "$OUT/ocr-build.log" || { echo "::error::kompilacja ocr.swift nie powiodła się"; cat "$OUT/ocr-build.log"; }
teraz_ms() { python3 -c 'import time; print(int(time.time()*1000))'; }
echo "bundle=$BUNDLE exec=$NAZWA dev=$DEV" | tee "$OUT/srodowisko.txt"
xcrun simctl listapps "$DEV" 2>/dev/null | grep -c "$BUNDLE" | sed 's/^/zainstalowana: /' | tee -a "$OUT/srodowisko.txt" || true
for i in $(seq 1 "$N"); do
  P="$OUT/przebieg-$i"; mkdir -p "$P/zrzuty"
  xcrun simctl terminate "$DEV" "$BUNDLE" 2>/dev/null || true
  rm -f "$(xcrun simctl get_app_container "$DEV" "$BUNDLE" data)/Documents/prototyp-b.json" 2>/dev/null || true
  SIMCTL_CHILD_OCZKO_PROTOTYP_B=1 xcrun simctl launch "$DEV" "$BUNDLE" > "$P/launch.txt" 2>&1 || { echo "launch nie powiódł się" | tee -a "$P/launch.txt"; }
  DATA=$(xcrun simctl get_app_container "$DEV" "$BUNDLE" data)
  F="$DATA/Documents/prototyp-b.json"
  for _ in $(seq 1 90); do [ -f "$F" ] && break; sleep 1; done
  if [ ! -f "$F" ]; then echo '{"blad":"brak prototyp-b.json w 90 s"}' > "$P/meta.json"; xcrun simctl io "$DEV" screenshot "$P/zrzuty/brak-pliku.png" || true; continue; fi
  cp "$F" "$P/meta.json"
  START=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["startMs"])' "$P/meta.json")
  # Proces aplikacji istnieje przed terminate (dowód, że pgrep go widzi), potem go nie ma.
  { echo "== przed terminate ($(date -u +%T))"; pgrep -fl "$NAZWA.app/$NAZWA" || echo "(pgrep: brak)";
    xcrun simctl spawn "$DEV" launchctl list 2>/dev/null | grep -i "$BUNDLE" || echo "(launchctl: brak)"; } > "$P/proces.txt" 2>&1
  sleep 3
  xcrun simctl terminate "$DEV" "$BUNDLE" >> "$P/proces.txt" 2>&1 || true
  sleep 2
  { echo "== po terminate ($(date -u +%T))"; if pgrep -fl "$NAZWA.app/$NAZWA"; then echo "PROCES-ISTNIEJE"; else echo "PROCES-BRAK (pgrep)"; fi
    if xcrun simctl spawn "$DEV" launchctl list 2>/dev/null | grep -i "$BUNDLE"; then echo "LAUNCHCTL-ISTNIEJE"; else echo "LAUNCHCTL-BRAK"; fi; } >> "$P/proces.txt" 2>&1
  : > "$P/zrzuty.tsv"
  for t in $(seq 10 5 110); do
    CEL=$((START + t * 1000))
    while [ "$(teraz_ms)" -lt "$CEL" ]; do sleep 0.5; done
    PLIK="$P/zrzuty/t$(printf '%03d' "$t").png"
    xcrun simctl io "$DEV" screenshot "$PLIK" > /dev/null 2>&1 || true
    printf '%s\t%s\t%s\n' "$t" "$(teraz_ms)" "$(basename "$PLIK")" >> "$P/zrzuty.tsv"
  done
  if [ -x "$OUT/ocr" ]; then "$OUT/ocr" "$P"/zrzuty/*.png > "$P/ocr.jsonl" 2> "$P/ocr.err" || true; fi
  echo "przebieg $i zakończony: start=$START" | tee -a "$OUT/srodowisko.txt"
done
