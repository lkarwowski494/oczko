#!/usr/bin/env bash
# Wybiera najnowszy zainstalowany Xcode danej wersji głównej (domyślnie 26) i ustawia go przez xcode-select.
# Od SDK 54 (T-051, docs/13): App Store Connect, a więc i TestFlight, przyjmuje od 28.04.2026 tylko buildy z Xcode 26+;
# od SDK 56 Expo wymaga Xcode 26.4+, więc workflowy działają na macos-26. Obraz macos-26 (20260907) ma Xcode 26.0.1 … 26.4.1,
# 26.5 i 26.6 — bierzemy najnowszy 26.x, który faktycznie jest (dziś 26.6), zamiast przypinać numer, który z obrazu może
# zniknąć. Dowiązania (Xcode_26.6.0.app, Xcode_26.4.app → Xcode_26.4.1.app) i wersje beta/RC (np. Xcode_26.4_beta.app) są
# pomijane. Brak pasującej wersji = błąd z listą dostępnych.
#
# Użycie: bash scripts/ci/select-xcode.sh [wersja_główna]
# Zmienne (dla testu w Jest na Linuksie): APPS_DIR — katalog z aplikacjami (domyślnie /Applications),
# DRY_RUN=1 — tylko wypisz wybór, bez sudo xcode-select.
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
if [ -z "$best" ]; then
  echo "::error::Brak Xcode ${MAJOR}.x w ${APPS}. Dostępne:"
  ls "$APPS" | grep -i xcode || echo "(żadnego)"
  exit 1
fi
echo "Wybrany Xcode: ${bestv} (${best})"
if [ "${DRY_RUN:-}" = "1" ]; then exit 0; fi
sudo xcode-select -s "$best/Contents/Developer"
xcodebuild -version
