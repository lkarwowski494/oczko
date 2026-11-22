#!/usr/bin/env bash
# Wybiera najnowszy zainstalowany Xcode danej wersji głównej (domyślnie 26) i ustawia go przez xcode-select.
# Od SDK 54: App Store Connect przyjmuje od 28.04.2026 tylko buildy z Xcode 26+.
set -euo pipefail
MAJOR="${1:-26}"
APPS="${APPS_DIR:-/Applications}"
best=""
bestv=""
for app in "$APPS"/Xcode_"$MAJOR"*.app; do
  [ -d "$app" ] || continue
  [ -L "$app" ] && continue
  v="${app##*/Xcode_}"
  v="${v%.app}"
  if ! printf '%s\n' "$v" | grep -Eq "^${MAJOR}(\.[0-9]+)*$"; then continue; fi
  if [ -z "$bestv" ] || [ "$(printf '%s\n%s\n' "$bestv" "$v" | sort -t. -k1,1n -k2,2n -k3,3n | tail -1)" = "$v" ]; then
    best="$app"
    bestv="$v"
  fi
done
if [ -z "$best" ] && [ -d "$APPS/Xcode.app" ]; then
  best="$APPS/Xcode.app"
  bestv="$MAJOR"
fi
if [ -z "$best" ]; then
  echo "::error::Brak Xcode ${MAJOR}.x w ${APPS}. Dostępne:"
  ls "$APPS" 2>/dev/null | grep -i xcode || echo "(żadnego)"
  exit 1
fi
echo "Wybrany Xcode: ${bestv} (${best})"
if [ "${DRY_RUN:-}" = "1" ]; then exit 0; fi
sudo xcode-select -s "$best/Contents/Developer"
xcodebuild -version
