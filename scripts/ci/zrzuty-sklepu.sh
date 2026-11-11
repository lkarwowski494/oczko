#!/usr/bin/env bash
# Zrzuty sklepu z symulatora (zrzuty-sklepu.yml; rola 10-wydanie, zadanie E-2; plan: docs/wydanie/metadane/zrzuty-plan.md, opcja A).
# Kolejność: (1) pasek stanu jak w materiałach Apple (9:41, pełna bateria), tryb jasny; (2) scenariusz 00-przygotuj.yaml wprowadza dane FIKCYJNE
# (e2e/zrzuty-sklepu); (3) każda scena 01…07 to osobny scenariusz Maestro (restart na tych samych danych + nawigacja, bez +1 na liczniku),
# po nim `xcrun simctl io screenshot` — natywne piksele urządzenia (iPhone 17 Pro Max 1320 × 2868, iPad Pro 13″ 2064 × 2752), bez ramki Maestro.
# Nieudana scena jest powtarzana raz; po drugiej porażce zapisana w `nieudane-<urządzenie>.txt` i pomijana (reszta idzie dalej, przebieg zbiorczy jest czerwony).
# Warunek OG-07 (docs/wydanie/metadane/zrzuty-plan.md, wiersze 3 i 4): zrzuty wzoru trafiają do `warunek-og07/…`, dopóki ostatni argument ≠ true
# (znacznik [og07-ok] w commicie albo wejście og07) — `asc-zrzuty.yml` czyta tylko `<rozmiar>/<język>/`, więc te dwa zrzuty nie wejdą do sklepu bez zgody.
# KO-032 (10.11.2026, „Ma być jak w Treningu”): osobny zestaw na każdą lokalizację sklepu. Dane fikcyjne wprowadza 00-przygotuj.yaml RAZ (po angielsku, język systemu), potem dla każdego
# języka z listy scenariusz 00-jezyk.yaml wybiera język w Ustawieniach aplikacji (trwały po restarcie; bez zmian w kodzie aplikacji), a sceny 01…07 robią zrzuty do `<rozmiar>/<język>/`.
# Jeden język może paść (00-jezyk albo scena) bez zatrzymywania reszty; przebieg zbiorczy jest wtedy czerwony (lista w `nieudane-<urządzenie>.txt`).
# Ostatni argument `zakup=true` (tylko iPhone, jedno zadanie): po językach wraca na angielski i robi zrzut ekranu zakupu dla App Review (99-zakup.yaml, atrapa sklepu) do <katalog_zakupu>/99-zakup-ceny.png
# (jak Trening: trening:.maestro/21-subskrypcja.yaml:57; plik wgrywa ręcznie właściciel przy produktach, sklep.md §3e).
# 10-wydanie-002 (uzupełnienie przebiegu, analogia trening:scripts/ci/store-screenshots.sh:10-12 zmienna UZUPELNIJ): zmienna SCENY_PLAN = "<język>=<scena>,<scena>;<język>=…" (z macierzy planu,
# scripts/ci/zrzuty-jezyki.mjs) — język robi tylko wymienione sceny (kolejność jak w SCENY), język bez wpisu jest pomijany; pusta = wszystkie sceny wszystkich języków (przebieg zwykły).
# W logu tylko nazwy plików i liczby (repo publiczne).
# 10-wydanie-011: JEZYKI bez wartości (argument nieobecny) = en; PUSTY argument = brak języków (wpis planu „tylko zakup”: zrzut zakupu bez ponawiania siedmiu scen en).
# Użycie: bash scripts/ci/zrzuty-sklepu.sh <UDID> <iphone|ipad> <katalog_zrzutów> <katalog_dzienników> <og07: true|false> [języki po przecinku, domyślnie en] [zakup: true|false] [katalog_zakupu]
set -uo pipefail
UDID="$1"; URZ="$2"; OUT="$3"; LOGI="$4"; OG07="${5:-false}"; JEZYKI="${6-en}"; ZAKUP="${7:-false}"; ZAKUP_OUT="${8:-zrzut-zakupu}"
FLOWS="$(cd "$(dirname "$0")/../.." && pwd)/e2e/zrzuty-sklepu"
case "$URZ" in
  iphone) ROZMIAR="6.9"; ORIENT_WZOR="PORTRAIT" ;;
  ipad)   ROZMIAR="ipad-13"; ORIENT_WZOR="LANDSCAPE_LEFT" ;;   # plan: wzór obok licznika na iPadzie poziomo
  *) echo "::error::nieznane urządzenie: $URZ"; exit 2 ;;
esac
# Kolejność ma znaczenie: „Kontynuuj ›” wraca do ostatniego miejsca pracy; po scenie 03 to strona wzoru (run 42777145130), więc 06 (licznik) idzie przed 03, a 04 działa z obu miejsc
SCENY="01-dzis 02-licznik 06-historia 03-wzor 04-zakreslenie 05-projekty 07-kalendarz"
WARUNKOWE=" 03-wzor 04-zakreslenie "
mkdir -p "$LOGI"
NIEUDANE="$LOGI/nieudane-$URZ.txt"; : > "$NIEUDANE"

SCENY_PLAN="${SCENY_PLAN:-}"
sceny_jezyka() {   # $1 = język → sceny do zrobienia (w kolejności z SCENY); bez SCENY_PLAN wszystkie
  [ -n "$SCENY_PLAN" ] || { echo "$SCENY"; return; }
  local wpis w="" s wynik=""
  while IFS= read -r wpis; do [ "${wpis%%=*}" = "$1" ] && w="${wpis#*=}"; done <<< "${SCENY_PLAN//;/$'\n'}"
  for s in $SCENY; do [[ ",$w," == *",$s,"* ]] && wynik="$wynik $s"; done
  echo "${wynik# }"
}

JEZYK_BIEZACY="start"   # w nazwie katalogu dziennika: kolejne języki nie nadpisują sobie logów
maestro_run() {   # $1 = nazwa scenariusza (bez .yaml), $2 = próba
  local log="$LOGI/$URZ-$JEZYK_BIEZACY-$1-$2"; mkdir -p "$log"
  maestro --device "$UDID" test "$FLOWS/$1.yaml" -e "ORIENT_WZOR=$ORIENT_WZOR" -e "JEZYK=$JEZYK_BIEZACY" --test-output-dir "$log" > "$log/maestro.log" 2>&1
}
zrob_zrzut() {   # $1 = scena, $2 = plik docelowy PNG; sleep, simctl screenshot, obrót zrzutu poziomego iPada
  sleep 4   # PDF i animacje przejścia kończą się po asercji; bez tego zrzut łapie stan pośredni
  xcrun simctl io "$UDID" screenshot --type=png "$2" >/dev/null 2>&1 && [ -s "$2" ]
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
  echo "::warning::00-przygotuj: próba 1 nieudana — ponawiam"; tail -15 "$LOGI/$URZ-start-00-przygotuj-1/maestro.log" | sed 's/^/    /'
  if ! maestro_run 00-przygotuj 2; then
    echo "::error::00-przygotuj nieudane dwukrotnie — brak danych do zrzutów"; tail -25 "$LOGI/$URZ-start-00-przygotuj-2/maestro.log" | sed 's/^/    /'
    echo "00-przygotuj" >> "$NIEUDANE"; exit 1
  fi
fi

# --- sceny, język po języku ---
for JEZ in ${JEZYKI//,/ }; do
  JEZYK_BIEZACY="$JEZ"
  TE_SCENY=$(sceny_jezyka "$JEZ")
  [ -n "$TE_SCENY" ] || { echo "== język $JEZ ($URZ): nic do zrobienia (plan uzupełnienia)"; continue; }
  echo "== język $JEZ ($URZ): $TE_SCENY"
  mkdir -p "$OUT/$ROZMIAR/$JEZ"
  jez_ok=0
  for proba in 1 2; do
    if maestro_run 00-jezyk "$proba"; then jez_ok=1; break; fi
    echo "::warning::00-jezyk $JEZ: próba $proba nieudana"; tail -12 "$LOGI/$URZ-$JEZ-00-jezyk-$proba/maestro.log" | sed 's/^/    /'
  done
  [ "$jez_ok" = 1 ] || { echo "$JEZ/00-jezyk" >> "$NIEUDANE"; continue; }
  for scena in $TE_SCENY; do
    ok=0
    for proba in 1 2; do
      if maestro_run "$scena" "$proba"; then
        if [[ "$WARUNKOWE" == *" $scena "* && "$OG07" != "true" ]]; then CEL="$OUT/warunek-og07/$ROZMIAR/$JEZ"; else CEL="$OUT/$ROZMIAR/$JEZ"; fi
        mkdir -p "$CEL"
        if zrob_zrzut "$scena" "$CEL/$scena.png"; then
          # simctl zapisuje bufor pionowy urządzenia: po LANDSCAPE_LEFT treść leży bokiem (run 42777145130: ipad 03-wzor.png 2064x2752, tekst obrócony o 90° w prawo) → obrót o 90° w lewo
          if [ "$ORIENT_WZOR" = "LANDSCAPE_LEFT" ] && [[ " 03-wzor 04-zakreslenie " == *" $scena "* ]]; then
            sips -r 270 "$CEL/$scena.png" >/dev/null 2>&1 || echo "::warning::$JEZ/$scena: obrót zrzutu poziomego nie powiódł się"
          fi
          echo "zrzut $URZ $JEZ/$scena: $(pomiar "$CEL/$scena.png"), $(wc -c < "$CEL/$scena.png" | tr -d ' ') B → ${CEL#"$OUT"/}"
          ok=1; break
        fi
        echo "::warning::$JEZ/$scena: simctl screenshot nie zapisał pliku (próba $proba)"
      else
        echo "::warning::$JEZ/$scena: scenariusz nieudany (próba $proba)"; tail -12 "$LOGI/$URZ-$JEZ-$scena-$proba/maestro.log" | sed 's/^/    /'
      fi
    done
    [ "$ok" = 1 ] || echo "$JEZ/$scena" >> "$NIEUDANE"
  done
done

# --- zrzut zakupu dla App Review (po angielsku, atrapa sklepu; jedno zadanie iPhone’a) ---
if [ "$ZAKUP" = "true" ] && [ "$URZ" = "iphone" ]; then
  JEZYK_BIEZACY="en"; mkdir -p "$ZAKUP_OUT"; ok=0
  for proba in 1 2; do
    if maestro_run 00-jezyk "z$proba" && maestro_run 99-zakup "$proba"; then
      if zrob_zrzut 99-zakup "$ZAKUP_OUT/99-zakup-ceny.png"; then echo "zakup: $(pomiar "$ZAKUP_OUT/99-zakup-ceny.png"), $(wc -c < "$ZAKUP_OUT/99-zakup-ceny.png" | tr -d ' ') B → 99-zakup-ceny.png"; ok=1; break; fi
    fi
    echo "::warning::99-zakup: próba $proba nieudana"; tail -12 "$LOGI/$URZ-en-99-zakup-$proba/maestro.log" 2>/dev/null | sed 's/^/    /'
  done
  [ "$ok" = 1 ] || echo "en/99-zakup" >> "$NIEUDANE"
fi

xcrun simctl status_bar "$UDID" clear >/dev/null 2>&1 || true
echo "Zrzuty: $(find "$OUT" "$ZAKUP_OUT" -name '*.png' 2>/dev/null | wc -l | tr -d ' ') plików; nieudane: $(wc -l < "$NIEUDANE" | tr -d ' ')"
if [ -s "$NIEUDANE" ]; then M="Języki i sceny nieudane dwukrotnie ($URZ): $(tr '\n' ' ' < "$NIEUDANE")"; echo "::error::$M"; [ -z "${GITHUB_STEP_SUMMARY:-}" ] || echo "$M" >> "$GITHUB_STEP_SUMMARY"; exit 1; fi
