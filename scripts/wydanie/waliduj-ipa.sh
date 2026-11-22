#!/usr/bin/env bash
# Walidacja gotowego .ipa przez Apple — ta sama kontrola, co przy wysyłce do App Store Connect (xcrun altool --validate-app), ale BEZ wysyłki.
# Kopia z Treningu (scripts/wydanie/waliduj-ipa.sh; P-087, P-196 D5a): przy `bez_wysylki` ryzyka pakietu zamyka tylko ta walidacja.
# Użycie: ASC_KEY_ID=… ASC_ISSUER_ID=… waliduj-ipa.sh <plik.ipa> <plik klucza AuthKey.p8> [plik logu]
# Klucz .p8 jest kopiowany do katalogu tymczasowego poza repozytorium (altool szuka AuthKey_<ID>.p8 w API_PRIVATE_KEYS_DIR), a po walidacji usuwany.
# Identyfikatory klucza nie są wypisywane; log (jeśli podany) trzeba zamaskować przed publikacją artefaktu (krok „Identyfikatory klucza wycięte z logów”).
set -euo pipefail
IPA="${1:?plik .ipa}"; P8="${2:?plik klucza .p8}"; LOG="${3:-/dev/null}"
KID="${ASC_KEY_ID:?brak ASC_KEY_ID}"; ISS="${ASC_ISSUER_ID:?brak ASC_ISSUER_ID}"
[ -s "$IPA" ] || { echo "::error::Brak pliku .ipa do walidacji"; exit 1; }
[ -s "$P8" ] || { echo "::error::Brak pliku klucza API"; exit 1; }
KEYS="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/asc-keys.XXXXXX")"
trap 'rm -rf "$KEYS"' EXIT
umask 077
cp "$P8" "$KEYS/AuthKey_$KID.p8"
export API_PRIVATE_KEYS_DIR="$KEYS"
unset ASC_KEY_ID ASC_ISSUER_ID
xcrun altool --validate-app -f "$IPA" -t ios --apiKey "$KID" --apiIssuer "$ISS" --output-format normal 2>&1 | tee "$LOG"
echo "Walidacja Apple (altool --validate-app): OK"
