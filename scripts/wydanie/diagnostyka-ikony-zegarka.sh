#!/usr/bin/env bash
# Diagnostyka ikony zegarka (10-wydanie-002; testflight.yml #6: zbudowany zegarek bez CFBundleIconName). Tylko macOS (plutil, xcodebuild, assetutil).
# Wypisuje do logu zadania dowody przyczyny, które xcbeautify ukrywa: polecenie actool i jego ostrzeżenia z SUROWEGO logu budowy, wygenerowany przez actool
# częściowy plist (assetcatalog_generated_info.plist), katalog zasobów zegarka na dysku, Info.plist zbudowanego pakietu i istotne ustawienia budowy.
# Diagnostyka NIGDY nie kończy się błędem sama (werdykt należy do ikona-zegarka-pakiet.mjs); brak danych to tylko linia „brak”.
# Użycie: bash scripts/wydanie/diagnostyka-ikony-zegarka.sh <surowy log xcodebuild> <katalog budowy (SYMROOT/OBJROOT)> <ios/Oczko.xcodeproj>
LOG=${1:-ios/xcodebuild-zegarek.log}; BUILD=${2:-ios/build-zegarek}; PROJ=${3:-ios/Oczko.xcodeproj}
sekcja() { echo; echo "::group::$*"; }
koniec() { echo "::endgroup::"; }

sekcja "1. actool zegarka w surowym logu (CompileAssetCatalog: polecenie i ostrzeżenia)"
if [ -s "$LOG" ]; then
  # Zadania xcodebuild są rozdzielone pustymi liniami; blok CompileAssetCatalog zawiera polecenie actool z --app-icon, --output-partial-info-plist i platformą.
  awk 'BEGIN { RS = ""; ORS = "\n\n" } /CompileAssetCatalog/ && /Zegarek|watchos/' "$LOG" | head -n 120
  echo "--- wiersze z actool / AppIcon / app-icon w całym logu (najwyżej 60) ---"
  grep -nE 'actool|--app-icon|AppIcon|appiconset|CFBundleIconName' "$LOG" | cut -c1-400 | head -n 60
  echo "--- ostrzeżenia i błędy katalogu zasobów (najwyżej 40) ---"
  grep -nE 'xcassets.*(warning|error)|(warning|error):.*(icon|Icon|xcassets|asset catalog)' "$LOG" | cut -c1-400 | head -n 40
else
  echo "brak surowego logu: $LOG"
fi
koniec

sekcja "2. assetcatalog_generated_info.plist (częściowy plist actool; stąd trafia CFBundleIconName do Info.plist)"
for f in $(find "$BUILD" -name 'assetcatalog_generated_info.plist' 2>/dev/null); do
  echo "--- $f"; plutil -p "$f" 2>&1
done
[ -n "$(find "$BUILD" -name 'assetcatalog_generated_info.plist' 2>/dev/null | head -n 1)" ] || echo "brak assetcatalog_generated_info.plist w $BUILD (actool nie wyprodukował częściowego plistu)"
koniec

sekcja "3. Zbudowany pakiet zegarka: Info.plist, Assets.car, zawartość"
APP=$(find "$BUILD" -type d -name 'OczkoZegarek.app' 2>/dev/null | head -n 1)
if [ -n "$APP" ]; then
  echo "pakiet: $APP"; ls -la "$APP" | head -n 40
  echo "--- plutil -p $APP/Info.plist"; plutil -p "$APP/Info.plist" 2>&1
  if [ -f "$APP/Assets.car" ]; then echo "--- assetutil --info Assets.car (ikony i kolory)"; assetutil --info "$APP/Assets.car" 2>&1 | grep -E '"(Name|AssetType|Idiom|Platform|PixelWidth|PixelHeight|Scale)"' | head -n 60
  else echo "brak Assets.car w pakiecie"; fi
else
  echo "brak OczkoZegarek.app w $BUILD"
fi
koniec

sekcja "4. Katalog zasobów zegarka na dysku (wejście actool)"
ls -laR targets/watch/Assets.xcassets 2>&1 | head -n 60
cat targets/watch/Assets.xcassets/AppIcon.appiconset/Contents.json 2>&1
koniec

sekcja "5. Ustawienia budowy celu zegarka (xcodebuild -showBuildSettings)"
if [ -d "$PROJ" ]; then
  xcodebuild -project "$PROJ" -target OczkoZegarek -configuration Release -sdk watchos -showBuildSettings 2>/dev/null \
    | grep -E 'ASSETCATALOG|INFOPLIST|GENERATE_INFOPLIST|SDKROOT|WATCHOS_DEPLOYMENT|TARGETED_DEVICE|PRODUCT_BUNDLE_IDENTIFIER|ASSETCATALOG_COMPILER_APPICON_NAME|ASSETCATALOG_NOTICES|ENABLE_ON_DEMAND' | head -n 60
else
  echo "brak projektu $PROJ"
fi
koniec
exit 0
