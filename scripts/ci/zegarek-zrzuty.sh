#!/usr/bin/env bash
# Zrzuty ekranu aplikacji Oczko na Apple Watch z symulatora (zrzuty-zegarka.yml; rola 10-wydanie, ZW1, KO-197; wzorzec: trening:scripts/ci/watch-screenshots.sh + lekcja L-064).
# Układ wyjścia = kontrakt `asc-zrzuty.yml` / `scripts/asc/zrzuty.mjs --zegarek`: <katalog>/<język>/NN-<kadr>.png (artefakt `zegarek-zrzuty`), PNG bez alfy, jeden rozmiar.
# KOD APLIKACJI I CELU ZEGARKA SIĘ NIE ZMIENIA: stan (kontekst telefonu, język) aplikacja czyta przy starcie z UserDefaults (targets/watch/Aplikacja.swift, ModelZegarka.init),
# a skrypt podaje go (1) argumentami uruchomienia `-klucz wartość` (argument domain UserDefaults; dane jako `<hex>` = NSData starego formatu plist), a gdy ekran po tym nie różni się od
# ekranu BEZ stanu („Otwórz Oczko na iPhonie”) — (2) zapisem do pliku preferencji w kontenerze aplikacji (`defaults write <ścieżka> … -data`) i ponownym uruchomieniem.
# Obie metody sprawdza porównanie zrzutów (treść poza zegarem systemowym) z ekranem bez stanu i kadrów między sobą; żadna nie zadziałała = błąd 5 (głośno, bez cichych pustych kadrów).
# Aplikacja zegarka nie ma w symulatorze telefonu-matki: watchOS po kilku minutach potrafi ją usunąć („installing or uninstalling”, trening docs/40 L-064) — do 5 prób co 20 s,
# gdy aplikacji nie ma, ponowna instalacja z wyniku budowania.
# Użycie: bash scripts/ci/zegarek-zrzuty.sh <UDID> <Aplikacja.app> <katalog_wyjściowy> <języki po przecinku | all> <RRRR-MM-DD>
# Zmienne: PROB (próby uruchomienia, domyślnie 5), PRZERWA (s między próbami, domyślnie 20), CZEKAJ (s po uruchomieniu przed zrzutem, domyślnie 4).
set -euo pipefail
UDID="${1:?UDID}"; APP="${2:?ścieżka do .app}"; OUT="${3:?katalog wyjściowy}"; LANGS="${4:?języki}"; DZIEN="${5:?RRRR-MM-DD}"
PROB="${PROB:-5}"; PRZERWA="${PRZERWA:-20}"; CZEKAJ="${CZEKAJ:-4}"
SKRYPTY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LISTA=$(node "$SKRYPTY/zegarek-kadry.mjs" plan "$LANGS") || { echo "::error::Zła lista języków: $LANGS"; exit 2; }
[ -d "$APP" ] || { echo "::error::Brak aplikacji zegarka: $APP"; exit 2; }
BUNDLE=$(plutil -extract CFBundleIdentifier raw "$APP/Info.plist")
[ -n "$BUNDLE" ] || { echo "::error::Brak CFBundleIdentifier w $APP/Info.plist"; exit 2; }
STANY="$OUT.stany"; mkdir -p "$OUT" "$STANY"
node "$SKRYPTY/zegarek-kadry.mjs" stany "$STANY" "$LISTA" "$DZIEN" 2>&1 | sed 's/^OSTRZEŻENIE /::warning::/'
KADRY=$(node -e 'import("'"$SKRYPTY"'/zegarek-kadry.mjs").then(m => console.log(m.KADRY.join(" ")))')
# kadry „takie same” = treść poza górnym pasem z zegarem systemowym (zmienia się co minutę, więc sumy plików by tego nie wykryły; zegarek-kadry.mjs rozne)
takie_same() { ! node "$SKRYPTY/zegarek-kadry.mjs" rozne "$1" "$2"; }
bez_alfa() { node "$SKRYPTY/splaszcz-png.mjs" "$1" "$1.tmp.png" && mv "$1.tmp.png" "$1"; }

instaluj() { xcrun simctl install "$UDID" "$APP" >/dev/null 2>&1; }
# uruchomienie z ponowieniami; argumenty po nazwie funkcji trafiają do aplikacji (`simctl launch <udid> <bundle> args…`)
uruchom() {
  local t
  for t in $(seq 1 "$PROB"); do
    xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1 || true
    if xcrun simctl launch "$UDID" "$BUNDLE" "$@" >/dev/null; then return 0; fi
    echo "::warning::Uruchomienie aplikacji zegarka nie powiodło się (próba $t z $PROB)"
    sleep "$PRZERWA"
    if ! xcrun simctl get_app_container "$UDID" "$BUNDLE" >/dev/null 2>&1; then
      echo "::warning::Aplikacji nie ma już na zegarku — instaluję ponownie"
      instaluj || echo "::warning::Ponowna instalacja nie powiodła się"
    fi
  done
  return 1
}
zrzut() { sleep "$CZEKAJ"; xcrun simctl io "$UDID" screenshot --type=png "$1" >/dev/null 2>&1 && [ -s "$1" ] || { echo "::error::Zrzut ekranu zegarka nie powiódł się ($1)"; exit 4; }; bez_alfa "$1"; }

# Metoda 2: zapis do preferencji w kontenerze aplikacji (aplikacja zatrzymana).
ustaw_preferencje() { # <język> <plik .hex>
  local kontener plist
  kontener=$(xcrun simctl get_app_container "$UDID" "$BUNDLE" data) || return 1
  plist="$kontener/Library/Preferences/$BUNDLE"
  mkdir -p "$kontener/Library/Preferences"
  xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1 || true
  defaults write "$plist" oczko.zegarek.kontekst.v2 -data "$(cat "$2")" && defaults write "$plist" oczko.zegarek.jezyk.v1 -string "$1"
}

instaluj || { echo "::error::Instalacja aplikacji zegarka nie powiodła się"; exit 4; }
# Ekran BEZ stanu („Otwórz Oczko na iPhonie”): wzorzec do porównań (kadr identyczny z nim = stan nie dotarł do aplikacji).
uruchom || { echo "::error::Aplikacja zegarka nie uruchomiła się po $PROB próbach"; exit 4; }
zrzut "$STANY/bez-stanu.png"; BAZA="$STANY/bez-stanu.png"
xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1 || true

METODA=argumenty; N=0
for lang in ${LISTA//,/ }; do
  mkdir -p "$OUT/$lang"; POPRZEDNIE=(); i=0
  for kadr in $KADRY; do
    i=$((i + 1)); PLIK="$OUT/$lang/$kadr.png"; HEX=$(cat "$STANY/$lang-$kadr.hex")
    if [ "$METODA" = argumenty ]; then
      uruchom -oczko.zegarek.jezyk.v1 "$lang" -oczko.zegarek.kontekst.v2 "<$HEX>" || { echo "::error::Aplikacja zegarka nie uruchomiła się ($lang/$kadr) po $PROB próbach"; exit 4; }
    else
      ustaw_preferencje "$lang" "$STANY/$lang-$kadr.hex" || { echo "::error::Zapis preferencji aplikacji zegarka nie powiódł się ($lang/$kadr)"; exit 4; }
      uruchom || { echo "::error::Aplikacja zegarka nie uruchomiła się ($lang/$kadr) po $PROB próbach"; exit 4; }
    fi
    zrzut "$PLIK"
    if takie_same "$PLIK" "$BAZA" && [ "$METODA" = argumenty ] && [ "$N" -eq 0 ]; then
      echo "::warning::Argumenty uruchomienia nie przekazały stanu (kadr równy ekranowi bez stanu) — przechodzę na zapis preferencji w kontenerze aplikacji"
      METODA=preferencje
      ustaw_preferencje "$lang" "$STANY/$lang-$kadr.hex" && uruchom && zrzut "$PLIK" || { echo "::error::Zapis preferencji nie powiódł się"; exit 5; }
    fi
    if takie_same "$PLIK" "$BAZA"; then
      echo "::error::Kadr $lang/$kadr jest taki sam jak ekran bez stanu („Otwórz Oczko na iPhonie”): stan nie dotarł do aplikacji (metoda: $METODA)"; exit 5
    fi
    for poprzedni in "${POPRZEDNIE[@]:-}"; do
      if [ -n "$poprzedni" ] && takie_same "$PLIK" "$poprzedni"; then echo "::error::Kadr $lang/$kadr jest taki sam jak wcześniejszy kadr tego języka (stan nie zmienia ekranu)"; exit 5; fi
    done
    POPRZEDNIE+=("$PLIK"); N=$((N + 1))
  done
done
xcrun simctl terminate "$UDID" "$BUNDLE" >/dev/null 2>&1 || true
echo "Zrzuty zegarka: $N plików, języków: $(echo "$LISTA" | tr ',' '\n' | wc -l | tr -d ' '), metoda przekazania stanu: $METODA"
