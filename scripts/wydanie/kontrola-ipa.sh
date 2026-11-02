#!/usr/bin/env bash
# Kontrola artefaktu, który idzie do Apple (ADR-0014, uzupełnienie 2026-10-25; rola 10, build E2 2026-10-26). Tylko macOS (PlistBuddy, plutil, codesign).
# Użycie: bash scripts/wydanie/kontrola-ipa.sh <Payload/X.app> <numer buildu> [ostatni numer w App Store Connect]
# BŁĄD (kod 1): tożsamość i integralność buildu — pakiety, numer i wersja, minimum systemu, zegarek, Hermes, brak modułów deweloperskich i śladów trybu testowego (JAK-15),
#   manifest prywatności aplikacji z kategoriami z app.json, klucz szyfrowania, tryby tła, reguła rozszerzenia udostępniania.
# UWAGA (kod 0, ::warning::): pozycje zależne od prac 08 w toku — typ `.oczko` (ADR-0004), katalogi .lproj (ADR-0017), manifest w celach,
#   lista uprawnień per pakiet (wypisana do podsumowania; wzorzec listy: docs/architektura/prywatnosc.md). Przed wysyłką do App Store UWAGI
#   rozstrzyga docs/wydanie/sklep.md (lista przed wysyłką). Trening: scripts/ci/check-entitlements.sh, ensure-privacy-manifest.mjs.
set -uo pipefail
APP=${1:?ścieżka .app}; NUMER=${2:?numer}; OSTATNI=${3:-0}
MIN_IOS=18.0; MIN_WATCH=11.0; POPRZEDNI_0_1_0=1004; DOZWOLONE_TLA="remote-notification" # ADR-0006, P-070, prywatnosc.md
bledy=0; uwagi=0
blad() { echo "::error::kontrola .ipa: $*"; bledy=$((bledy + 1)); }
uwaga() { echo "::warning::kontrola .ipa: $*"; uwagi=$((uwagi + 1)); }
pb() { /usr/libexec/PlistBuddy -c "Print :$1" "$2" 2>/dev/null; }
podsum() { [ -n "${GITHUB_STEP_SUMMARY:-}" ] && echo "$*" >> "$GITHUB_STEP_SUMMARY"; echo "$*"; }

[ -d "$APP" ] || { blad "brak $APP"; exit 1; }
ID=$(pb CFBundleIdentifier "$APP/Info.plist"); WERSJA=$(pb CFBundleShortVersionString "$APP/Info.plist")
podsum "### Kontrola .ipa: $ID $WERSJA ($NUMER)"

PAKIETY=("$APP")
WIDZET="$APP/PlugIns/OczkoWidget.appex"; [ -d "$WIDZET" ] || blad "brak widżetu Live Activity (PlugIns/OczkoWidget.appex)"
for x in "$APP"/PlugIns/*.appex; do [ -d "$x" ] && PAKIETY+=("$x"); done
ZEGAREK=$(ls -d "$APP"/Watch/*.app 2>/dev/null | head -n 1)
if [ -d targets/watch ]; then
  if [ -z "$ZEGAREK" ]; then blad "brak zegarka w Watch/*.app (cel targets/watch istnieje)"; else
    PAKIETY+=("$ZEGAREK")
    [ "$(pb WKCompanionAppBundleIdentifier "$ZEGAREK/Info.plist")" = "$ID" ] || blad "zegarek wskazuje inną aplikację towarzyszącą niż $ID"
    [ "$(pb MinimumOSVersion "$ZEGAREK/Info.plist")" = "$MIN_WATCH" ] || blad "zegarek: MinimumOSVersion ≠ $MIN_WATCH"
    # L-021 (Trening, P-349): bez ikony zegarka App Store Connect odrzuca wysyłkę („Missing Icons… CFBundleIconFiles”); actool wpisuje CFBundleIconName tylko z AppIcon.
    [ -n "$(pb CFBundleIconName "$ZEGAREK/Info.plist")" ] || blad "zegarek: brak CFBundleIconName w Info.plist (ikona zegarka; Trening L-021)"
  fi
fi

# Numer i wersja: ten sam CFBundleVersion i CFBundleShortVersionString w każdym pakiecie; numer > 1004 (0.1.0) i > ostatni w App Store Connect.
[[ "$NUMER" =~ ^[0-9]+$ ]] || blad "numer buildu $NUMER nie jest liczbą"
[ "$NUMER" -gt "$POPRZEDNI_0_1_0" ] && [ "$NUMER" -gt "$OSTATNI" ] || blad "numer $NUMER nie jest większy niż $POPRZEDNI_0_1_0 i ostatni w App Store Connect ($OSTATNI)"
for p in "${PAKIETY[@]}"; do
  n=${p#"$APP"}; n=${n:-/aplikacja}
  [ "$(pb CFBundleVersion "$p/Info.plist")" = "$NUMER" ] || blad "$n: CFBundleVersion ≠ $NUMER"
  [ "$(pb CFBundleShortVersionString "$p/Info.plist")" = "$WERSJA" ] || blad "$n: CFBundleShortVersionString ≠ $WERSJA"
  [ "$p" = "$ZEGAREK" ] || [ "$(pb MinimumOSVersion "$p/Info.plist")" = "$MIN_IOS" ] || blad "$n: MinimumOSVersion ≠ $MIN_IOS"
  u=$(codesign -d --entitlements - --xml "$p" 2>/dev/null | plutil -convert json -o - - 2>/dev/null || echo '{}')
  podsum "- $n: uprawnienia \`$u\`"
  [ -f "$p/PrivacyInfo.xcprivacy" ] || [ "$p" = "$APP" ] || uwaga "$n: brak PrivacyInfo.xcprivacy w pakiecie celu"
done

# 07-jakosc-008 (D4, P-325): adres „Rate Oczko” bez zaślepki id0000000000.
node scripts/wydanie/kontrola-adresow.mjs || bledy=$((bledy + 1))

# P-357 (P-320): lista kluczy czekających na falę przekładu musi być pusta w buildzie wydania.
node scripts/sprawdz-i18n.mjs src/i18n/slowniki --zrodlo en --oczekujace docs/lokalizacja/oczekujace.json --krytyczne docs/lokalizacja/krytyczne.json --przeglad docs/lokalizacja/przeglad-krytyczne.json --wydanie || bledy=$((bledy + 1))

# Hermes i brak modułów deweloperskich.
B="$APP/main.jsbundle"
if [ ! -s "$B" ]; then blad "brak main.jsbundle"; elif LC_ALL=C grep -qI . "$B"; then blad "main.jsbundle jest tekstem JS, nie bajtkodem Hermesa"; fi
# JAK-15 (P-237): bez śladów trybu testowego (napisy paneli E2E, testID e2e-, klucze oczkoE2e*, nazwy przełączników EXPO_PUBLIC_*).
[ -s "$B" ] && { node scripts/wydanie/slady-testowe.mjs "$B" || bledy=$((bledy + 1)); }
find "$APP" -iname '*DevLauncher*' -o -iname '*DevMenu*' | grep -q . && blad "w buildzie są moduły deweloperskie (DevLauncher/DevMenu)"
strings -a "$APP/$(basename "$APP" .app)" > "${RUNNER_TEMP:-/tmp}/kontrola-ipa-strings.txt" 2>/dev/null
grep -q EXDevLauncher "${RUNNER_TEMP:-/tmp}/kontrola-ipa-strings.txt" && blad "binarka aplikacji zawiera EXDevLauncher"

# Manifest prywatności aplikacji: każda kategoria i każdy powód z app.json (ios.privacyManifests) obecne w pakiecie.
if [ -f "$APP/PrivacyInfo.xcprivacy" ]; then
  plutil -convert json -o "${RUNNER_TEMP:-/tmp}/privacy.json" "$APP/PrivacyInfo.xcprivacy"
  node -e '
    const w = require(process.argv[1]).NSPrivacyAccessedAPITypes ?? [], a = require("./app.json").expo.ios.privacyManifests.NSPrivacyAccessedAPITypes ?? [];
    const m = new Map(w.map((x) => [x.NSPrivacyAccessedAPIType, new Set(x.NSPrivacyAccessedAPITypeReasons)]));
    const braki = a.flatMap((x) => x.NSPrivacyAccessedAPITypeReasons.filter((r) => !m.get(x.NSPrivacyAccessedAPIType)?.has(r)).map((r) => `${x.NSPrivacyAccessedAPIType} ${r}`));
    if (braki.length) { console.log("::error::kontrola .ipa: manifest prywatności bez: " + braki.join(", ")); process.exit(1); }' "${RUNNER_TEMP:-/tmp}/privacy.json" || bledy=$((bledy + 1))
else blad "brak PrivacyInfo.xcprivacy w aplikacji"; fi

# Szyfrowanie (wartość potwierdza rola 10 w sklep.md), tryby tła, rozszerzenia.
[ -n "$(pb ITSAppUsesNonExemptEncryption "$APP/Info.plist")" ] || blad "brak ITSAppUsesNonExemptEncryption w Info.plist"
for t in $(pb UIBackgroundModes "$APP/Info.plist" | sed -e '1d' -e '$d'); do
  [[ " $DOZWOLONE_TLA " == *" $t "* ]] || blad "tryb tła $t spoza ADR (dozwolone: $DOZWOLONE_TLA)"
done
for x in "$APP"/PlugIns/*.appex; do
  [ -d "$x" ] || continue
  r=$(pb NSExtension:NSExtensionAttributes:NSExtensionActivationRule "$x/Info.plist")
  [ "$r" = "TRUEPREDICATE" ] && blad "$(basename "$x"): NSExtensionActivationRule = TRUEPREDICATE (ADR-0011)"
done

# Zależne od prac w toku (UWAGA): typ .oczko, katalogi .lproj.
pb UTExportedTypeDeclarations "$APP/Info.plist" | grep -q oczko || uwaga "brak deklaracji typu .oczko (UTExportedTypeDeclarations, ADR-0004)"
for j in $(pb CFBundleLocalizations "$APP/Info.plist" | sed -e '1d' -e '$d'); do [ -d "$APP/$j.lproj" ] || uwaga "brak $j.lproj dla języka z CFBundleLocalizations (ADR-0017)"; done
podsum "- języki .lproj: $(ls -d "$APP"/*.lproj 2>/dev/null | wc -l | tr -d ' ')"

podsum "Wynik: błędów $bledy, uwag $uwagi"
[ "$bledy" -eq 0 ]
