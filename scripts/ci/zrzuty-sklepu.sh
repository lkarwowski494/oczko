#!/usr/bin/env bash
# Zrzuty sklepu z symulatora (zrzuty-sklepu.yml; rola 10-wydanie, zadanie E-2; plan: docs/wydanie/metadane/zrzuty-plan.md, opcja A).
# Kolejność: (1) pasek stanu jak w materiałach Apple (9:41, pełna bateria), tryb jasny; (2) scenariusz 00-przygotuj.yaml wprowadza dane FIKCYJNE
# (e2e/zrzuty-sklepu); (3) każda scena 01…07 to osobny scenariusz Maestro (restart na tych samych danych + nawigacja, bez +1 na liczniku),
# po nim `xcrun simctl io screenshot` — natywne piksele urządzenia (iPhone 17 Pro Max 1320 × 2868, iPad Pro 13″ 2064 × 2752), bez ramki Maestro.
# Nieudana scena jest powtarzana raz; po drugiej porażce zapisana w `nieudane-<urządzenie>.txt` i pomijana (reszta idzie dalej, przebieg zbiorczy jest czerwony).
# Warunek OG-07 (docs/wydanie/metadane/zrzuty-plan.md, wiersze 3 i 4): zrzuty wzoru trafiają do `warunek-og07/…`, dopóki ostatni argument ≠ true
# (znacznik [og07-ok] w commicie albo wejście og07) — `asc-zrzuty.yml` czyta tylko `<rozmiar>/<język>/`, więc te dwa zrzuty nie wejdą do sklepu bez zgody.
# W logu tylko nazwy plików i liczby (repo publiczne).
# Użycie: bash scripts/ci/zrzuty-sklepu.sh <UDID> <iphone|ipad> <katalog_zrzutów> <katalog_dzienników> <og07: true|false> [język]
set -uo pipefail
UDID="$1"; URZ="$2"; OUT="$3"; LOGI="$4"; OG07="${5:-false}"; JEZYK="${6:-en}"
FLOWS="$(cd "$(dirname "$0")/../.." && pwd)/e2e/zrzuty-sklepu"
case "$URZ" in
  iphone) ROZMIAR="6.9"; ORIENT_WZOR="PORTRAIT" ;;
  ipad)   ROZMIAR="ipad-13"; ORIENT_WZOR="LANDSCAPE_LEFT" ;;   # plan: wzór obok licznika na iPadzie poziomo
  *) echo "::error::nieznane urządzenie: $URZ"; exit 2 ;;
esac
# Kolejność ma znaczenie: „Kontynuuj ›” wraca do ostatniego miejsca pracy; po scenie 03 to strona wzoru (run 42777145130), więc 06 (licznik) idzie przed 03, a 04 działa z obu miejsc
SCENY="01-dzis 02-licznik 06-historia 03-wzor 04-zakreslenie 05-projekty 07-kalendarz"
WARUNKOWE=" 03-wzor 04-zakreslenie "
mkdir -p "$OUT/$ROZMIAR/$JEZYK" "$LOGI"
NIEUDANE="$LOGI/nieudane-$URZ.txt"; : > "$NIEUDANE"

maestro_run() {   # $1 = nazwa scenariusza (bez .yaml), $2 = próba
  local log="$LOGI/$URZ-$1-$2"; mkdir -p "$log"
  maestro --device "$UDID" test "$FLOWS/$1.yaml" -e "ORIENT_WZOR=$ORIENT_WZOR" --test-output-dir "$log" > "$log/maestro.log" 2>&1
}
pomiar() {   # $1 = plik PNG → „SZERxWYS”
  local w h; w=$(sips -g pixelWidth "$1" | awk '/pixelWidth/ {print $2}'); h=$(sips -g pixelHeight "$1" | awk '/pixelHeight/ {print $2}'); echo "${w}x${h}"
}

# --- pasek stanu i wygląd ---
xcrun simctl status_bar "$UDID" override --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 --batteryState charged --batteryLevel 100 >/dev/null 2>&1 \
  || echo "::warning::Nie udało się ustawić paska stanu (zrzuty będą miały godzinę z maszyny)"
xcrun simctl ui "$UDID" appearance light >/dev/null 2>&1 || true

# --- dane fikcyjne (dwie próby; scenariusz zaczyna od clearState, więc powtórka jest bezpieczna) ---
if ! maestro_run 00-przygotuj 1; then
  echo "::warning::00-przygotuj: próba 1 nieudana — ponawiam"; tail -15 "$LOGI/$URZ-00-przygotuj-1/maestro.log" | sed 's/^/    /'
  if ! maestro_run 00-przygotuj 2; then
    echo "::error::00-przygotuj nieudane dwukrotnie — brak danych do zrzutów"; tail -25 "$LOGI/$URZ-00-przygotuj-2/maestro.log" | sed 's/^/    /'
    echo "00-przygotuj" >> "$NIEUDANE"; exit 1
  fi
fi

# --- sceny ---
for scena in $SCENY; do
  ok=0
  for proba in 1 2; do
    if maestro_run "$scena" "$proba"; then
      sleep 4   # PDF i animacje przejścia kończą się po asercji; bez tego zrzut łapie stan pośredni
      if [[ "$WARUNKOWE" == *" $scena "* && "$OG07" != "true" ]]; then CEL="$OUT/warunek-og07/$ROZMIAR/$JEZYK"; else CEL="$OUT/$ROZMIAR/$JEZYK"; fi
      mkdir -p "$CEL"
      if xcrun simctl io "$UDID" screenshot --type=png "$CEL/$scena.png" >/dev/null 2>&1 && [ -s "$CEL/$scena.png" ]; then
        # simctl zapisuje bufor pionowy urządzenia: po LANDSCAPE_LEFT treść leży bokiem (run 42777145130: ipad 03-wzor.png 2064x2752, tekst obrócony o 90° w prawo) → obrót o 90° w lewo
        if [ "$ORIENT_WZOR" = "LANDSCAPE_LEFT" ] && [[ " 03-wzor 04-zakreslenie " == *" $scena "* ]]; then
          sips -r 270 "$CEL/$scena.png" >/dev/null 2>&1 || echo "::warning::$scena: obrót zrzutu poziomego nie powiódł się"
        fi
        echo "zrzut $URZ $scena: $(pomiar "$CEL/$scena.png"), $(wc -c < "$CEL/$scena.png" | tr -d ' ') B → ${CEL#"$OUT"/}"
        ok=1; break
      fi
      echo "::warning::$scena: simctl screenshot nie zapisał pliku (próba $proba)"
    else
      echo "::warning::$scena: scenariusz nieudany (próba $proba)"; tail -12 "$LOGI/$URZ-$scena-$proba/maestro.log" | sed 's/^/    /'
    fi
  done
  [ "$ok" = 1 ] || echo "$scena" >> "$NIEUDANE"
done

xcrun simctl status_bar "$UDID" clear >/dev/null 2>&1 || true
echo "Zrzuty: $(find "$OUT" -name '*.png' | wc -l | tr -d ' ') plików; nieudane: $(wc -l < "$NIEUDANE" | tr -d ' ')"
if [ -s "$NIEUDANE" ]; then M="Sceny nieudane dwukrotnie ($URZ): $(tr '\n' ' ' < "$NIEUDANE")"; echo "::error::$M"; [ -z "${GITHUB_STEP_SUMMARY:-}" ] || echo "$M" >> "$GITHUB_STEP_SUMMARY"; exit 1; fi
