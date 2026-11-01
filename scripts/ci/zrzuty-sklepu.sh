#!/usr/bin/env bash
# Zrzuty sklepu (App Store) z symulatora: sześć kadrów z planu docs/wydanie/metadane/zrzuty-plan.md, bez zmian w kodzie aplikacji.
# Wzór: Trening scripts/ci/store-screenshots.sh. Dla każdego kadru: (1) świeże dane pokazowe do kontenera aplikacji
# (oczko.db + pliki wzoru z tests/narzedzia/zrzuty-sklepu-ziarno.ts, ścieżki z src/dane/baza/sciezki.ts: Library/Application Support),
# (2) przepływ Maestro z e2e/zrzuty-sklepu/ (nawigacja; zegar aplikacji z podsumowanie.json przez oczkoE2eTeraz), (3) `xcrun simctl io … screenshot`
# (natywny rozmiar symulatora), (4) kontrola rozmiaru. Kadr, który nie przeszedł, jest powtarzany raz; drugi raz nieudany idzie do .nieudane,
# a skrypt kończy się kodem 1 po przejściu wszystkich kadrów (niepełny komplet nie jest wynikiem). W logu tylko nazwy plików i liczby (repo publiczne).
# Rozmiary (Apple, zrzuty-plan.md; odczyt reguł ponowić w dniu wykonania): iPhone 1320×2868 tylko pionowo; iPad 13″ 2064×2752 lub 2752×2064
# (kadry 2 i 3 na iPadzie są poziome: wzór obok licznika, BR-WZR-005/S2). Kanał alfa zrzutów z symulatora zdejmuje krok ramek (rola 10), nie ten skrypt.
# Użycie: bash scripts/ci/zrzuty-sklepu.sh <UDID> <iphone|ipad> <katalog_danych> <katalog_wyjsciowy> [kadry po przecinku, np. 01-licznik,04-projekty]
# Zmienne: WYGLAD=light|dark (domyślnie light, plan: tryb jasny), SEN=<sekundy> (czas na start aplikacji; domyślnie 6; testy podają 0).
set -euo pipefail
UDID="${1:?UDID symulatora}"; KLASA="${2:?iphone albo ipad}"; DANE="${3:?katalog danych}"; OUT="${4:?katalog wyjściowy}"; WYBRANE="${5:-}"
BUNDLE="com.apps4brew.knitting"
KORZEN="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FLOWS="$KORZEN/e2e/zrzuty-sklepu"
SEN="${SEN:-6}"; WYGLAD="${WYGLAD:-light}"
case "$KLASA" in
  iphone) SZER=1320; WYS=2868; PIONOWO_TYLKO=1 ;;
  ipad) SZER=2064; WYS=2752; PIONOWO_TYLKO=0 ;;
  *) echo "::error::Klasa urządzenia: iphone albo ipad (jest: $KLASA)" >&2; exit 2 ;;
esac
[ -f "$DANE/oczko.db" ] && [ -d "$DANE/pliki" ] && [ -f "$DANE/podsumowanie.json" ] || { echo "::error::Brak danych pokazowych w $DANE (oczko.db, pliki/, podsumowanie.json)" >&2; exit 2; }
TERAZ="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).teraz)' "$DANE/podsumowanie.json")"
[ -n "$TERAZ" ] || { echo "::error::podsumowanie.json bez pola teraz" >&2; exit 2; }
KADRY=(01-licznik 02-wzor 03-zakreslenie 04-projekty 05-historia 06-kalendarz)
for k in "${KADRY[@]}"; do [ -f "$FLOWS/$k.yaml" ] || { echo "::error::Brak przepływu $FLOWS/$k.yaml" >&2; exit 2; }; done
mkdir -p "$OUT/$KLASA" "$OUT/.maestro" "$OUT/.nieudane/$KLASA"

# Pasek stanu jak w materiałach Apple: 9:41, pełna bateria, zasięg (bez nazwy operatora); wygląd systemu jak aplikacja (plan: jasny).
xcrun simctl status_bar "$UDID" override --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100 >/dev/null 2>&1 || echo "::warning::Nie udało się ustawić paska stanu"
xcrun simctl ui "$UDID" appearance "$WYGLAD" >/dev/null 2>&1 || echo "::warning::Nie udało się ustawić wyglądu ($WYGLAD)"

# Kontener danych powstaje przy pierwszym uruchomieniu: raz uruchom i zamknij aplikację.
xcrun simctl launch "$UDID" "$BUNDLE" >/dev/null 2>&1 || true
sleep "$SEN"
xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1 || true

wgraj_dane() {
  xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1 || true
  local c as
  c="$(xcrun simctl get_app_container "$UDID" "$BUNDLE" data)" || return 1
  [ -n "$c" ] || return 1
  as="$c/Library/Application Support"
  mkdir -p "$as" || return 1
  rm -rf "$as/oczko.db" "$as/oczko.db-wal" "$as/oczko.db-shm" "$as/pliki" "$as/kopie" "$as/stan-startu.json" "$as/dziennik-plus.jsonl" || return 1
  cp "$DANE/oczko.db" "$as/oczko.db" || return 1
  cp -R "$DANE/pliki" "$as/pliki" || return 1
}

rozmiar_ok() { # $1 = plik PNG; 0 gdy rozmiar zgodny z klasą
  local w h
  w="$(sips -g pixelWidth "$1" 2>/dev/null | awk '/pixelWidth/ {print $2}')"
  h="$(sips -g pixelHeight "$1" 2>/dev/null | awk '/pixelHeight/ {print $2}')"
  if [ "$w" = "$SZER" ] && [ "$h" = "$WYS" ]; then return 0; fi
  if [ "$PIONOWO_TYLKO" = 0 ] && [ "$w" = "$WYS" ] && [ "$h" = "$SZER" ]; then return 0; fi
  echo "::warning::Rozmiar $(basename "$1"): ${w:-?}×${h:-?}, oczekiwano ${SZER}×${WYS}$([ "$PIONOWO_TYLKO" = 0 ] && echo " albo ${WYS}×${SZER}")"
  return 1
}

jeden_kadr() { # $1 = kadr; 0 = zrzut gotowy i poprawny
  local k="$1" log="$OUT/.maestro/$KLASA-$1" plik="$OUT/$KLASA/$1.png"
  # `if jeden_kadr` wyłącza `set -e` w funkcji, więc każdy krok kończy się jawnym `|| return 1`
  wgraj_dane || { echo "::warning::Nie udało się wgrać danych pokazowych ($k)"; return 1; }
  rm -f "$plik"
  mkdir -p "$log" || return 1
  if ! maestro --device "$UDID" test "$FLOWS/$k.yaml" -e "TERAZ=$TERAZ" -e "KLASA=$KLASA" --test-output-dir "$log" > "$log/maestro.log" 2>&1; then
    echo "::warning::Przepływ $k nie powiódł się ($KLASA)"; tail -5 "$log/maestro.log" | sed 's/^/    /'; return 1
  fi
  sleep 1
  xcrun simctl io "$UDID" screenshot "$plik" >/dev/null 2>&1 || { echo "::warning::Zrzut $k nie powstał"; return 1; }
  rozmiar_ok "$plik"
}

NIEUDANE=""; GOTOWE=0
for k in "${KADRY[@]}"; do
  if [ -n "$WYBRANE" ] && [[ ",$WYBRANE," != *",$k,"* ]]; then continue; fi
  if jeden_kadr "$k" || { echo "Ponawiam kadr $k"; jeden_kadr "$k"; }; then
    GOTOWE=$((GOTOWE + 1)); echo "Kadr $KLASA/$k: gotowy"
  else
    NIEUDANE="$NIEUDANE $k"
    mv "$OUT/$KLASA/$k.png" "$OUT/.nieudane/$KLASA/" 2>/dev/null || true
  fi
done

xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1 || true
xcrun simctl status_bar "$UDID" clear >/dev/null 2>&1 || true
echo "Zrzuty $KLASA: $GOTOWE gotowych, $(find "$OUT/$KLASA" -name '*.png' | wc -l | tr -d ' ') plików"
if [ -n "$NIEUDANE" ]; then
  echo "::error::Kadry bez zrzutu po dwóch próbach ($KLASA):$NIEUDANE"
  [ -z "${GITHUB_STEP_SUMMARY:-}" ] || echo "Kadry bez zrzutu ($KLASA):$NIEUDANE" >> "$GITHUB_STEP_SUMMARY"
  exit 1
fi
