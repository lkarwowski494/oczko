#!/usr/bin/env bash
# Build na urządzenie („Any iOS Device”) wymaga, żeby platforma iOS zgodna z SDK wybranego Xcode była zainstalowana —
# inaczej xcodebuild kończy się „iOS X.Y is not installed” (przebieg 37123785083 na Xcode 16.2 / iOS 18.2).
# Obraz macos-26 (od SDK 56) ma środowiska iOS 26.2/26.4/26.5 — dla domyślnego wyboru Xcode 26.6 (SDK iOS 26.5) zwykle nic
# nie pobieramy; pobranie tylko, gdy brakuje (np. po zmianie obrazu). Dopasowanie „iOS 26.4( |.)” obejmuje też 26.4.1.
# Uruchamiać po scripts/ci/select-xcode.sh.
set -euo pipefail
SDK="$(xcrun --sdk iphoneos --show-sdk-version)"
echo "SDK iOS wybranego Xcode: ${SDK}"
if xcrun simctl list runtimes | grep -Eq "iOS ${SDK//./\\.}( |\.)"; then
  echo "Platforma iOS ${SDK} jest zainstalowana — bez pobierania."
else
  echo "Brak platformy iOS ${SDK} — pobieram (xcodebuild -downloadPlatform iOS)."
  sudo xcodebuild -downloadPlatform iOS
fi
# 0.20 (Apple Watch): aplikacja osadza zegarek, więc build iPhone'a potrzebuje też platformy watchOS zgodnej z SDK wybranego Xcode (ten sam błąd
# „watchOS X.Y is not installed”). Obraz macos-26 ma watchOS 26.x; pobranie tylko, gdy brakuje.
WSDK="$(xcrun --sdk watchos --show-sdk-version 2>/dev/null || true)"
if [ -n "${WSDK}" ]; then
  echo "SDK watchOS wybranego Xcode: ${WSDK}"
  if xcrun simctl list runtimes | grep -Eq "watchOS ${WSDK//./\\.}( |\.)"; then
    echo "Platforma watchOS ${WSDK} jest zainstalowana — bez pobierania."
  else
    echo "Brak platformy watchOS ${WSDK} — pobieram (xcodebuild -downloadPlatform watchOS)."
    sudo xcodebuild -downloadPlatform watchOS
  fi
else
  echo "Brak SDK watchOS w wybranym Xcode — pobieram platformę (xcodebuild -downloadPlatform watchOS)."
  sudo xcodebuild -downloadPlatform watchOS
fi
xcrun simctl list runtimes
