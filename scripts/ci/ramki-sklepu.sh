#!/usr/bin/env bash
# Podpisy i ramki na zrzutach do App Store (rola 10-wydanie, KO-032, 2026-11-10: słowa właściciela „Ma być jak w Treningu”; zadanie „ramki” w zrzuty-sklepu.yml).
# Przeniesione z Treningu: trening:scripts/ci/store-frames.sh (main, odczyt 10.11.2026; tam decyzja D-6 B). Różnice (nazwane): (1) układ katalogów dowolnej głębokości
# (`<klasa>/<język>/` oraz `warunek-og07/<klasa>/<język>/` — katalog warunkowy OG-07 przechodzi bez zmian); (2) kolory z systemu 04 (docs/design/tokeny.json, tryb jasny,
# nazwy tokenów w pliku podpisów), krój Bree Serif z docs/design/fonty (Trening: IBM Plex z node_modules); (3) jeden rozmiar czcionki liczony dla najmniejszego pola w katalogu
# (iPad ma zrzuty pionowe i poziome); (4) kontrola wymiarów robi scripts/ci/wymiary-asc.mjs, nie ten skrypt.
# Wejście: <katalog_zrzutów>/[warunek-og07/]<klasa>/<język>/NN-<ekran>.png (surowe zrzuty z zrzuty-sklepu.sh). Wyjście: ten sam układ w <katalog_wyjściowy>,
# obraz o TYM SAMYM rozmiarze co zrzut (rozmiary wymagane przez App Store Connect bez zmian), RGB bez kanału alfa („Images can’t include alpha channels or transparencies”).
# Układ obrazu: tło (token `ramka.tlo`), podpis u góry (`ramka.tekst`, czcionka marki; pole 86% szerokości × 15% wysokości), zrzut pomniejszony do 78% z zaokrągleniem 7%
# i obwódką (`ramka.obwodka`); promień zaokrąglenia 7% (iPad 1,5%, 10-wydanie-012). Ramka własna, bez obudów urządzeń Apple (wytyczne Apple Marketing Resources: tylko obudowy dostarczone przez Apple, bez modyfikacji).
# Język bez podpisów jest pomijany z ostrzeżeniem (surowe zrzuty zostają w artefakcie surowym). Narzędzia: ImageMagick 6 (`convert`, `identify`), node.
# Czcionki poza Bree (kroj.systemowy: bg, el, nl, ru, sr, uk, vi → Noto Sans Bold z fonts-noto-core; kroj.cjk: ja, ko, zh-Hant → Noto Sans CJK Bold z fonts-noto-cjk).
# Użycie: bash scripts/ci/ramki-sklepu.sh <katalog_zrzutów> <katalog_wyjściowy> [plik_podpisów] [plik_tokenów]
set -euo pipefail
IN="${1:?katalog zrzutów}"; OUT="${2:?katalog wyjściowy}"
CAP="${3:-docs/wydanie/metadane/podpisy-zrzutow.json}"; TOK="${4:-docs/design/tokeny.json}"
FONT_SYS="${FONT_SYS:-/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf}"
FONT_CJK="${FONT_CJK:-/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc}"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
cap() { node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); const v=process.argv.slice(2).reduce((o,k)=>o==null?o:o[k],c); process.stdout.write(v==null?"":typeof v==="object"?JSON.stringify(v):String(v))' "$CAP" "$@"; }
# Kolor = token z docs/design/tokeny.json (kolory.<tryb>.<token>); nazwy tokenów i tryb w pliku podpisów.
kolor() { node -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); const t=JSON.parse(require("fs").readFileSync(process.argv[2],"utf8")).kolory; const r=c.ramka; const v=t[r.tryb][r[process.argv[3]]]; if(!/^#[0-9A-Fa-f]{6}$/.test(v||"")) { console.error("brak tokenu "+process.argv[3]); process.exit(1) } process.stdout.write(v)' "$CAP" "$TOK" "$1"; }
BG=$(kolor tlo); FG=$(kolor tekst); LINE=$(kolor obwodka)
FONT_BREE=$(cap kroj plik); [ -f "$FONT_BREE" ] || { echo "::error::brak pliku kroju $FONT_BREE"; exit 1; }
SYS_LANGS=" $(cap kroj systemowy | node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(0,"utf8")).join(" "))') "
CJK_LANGS=" $(cap kroj cjk | node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(0,"utf8")).join(" "))') "
n=0
while IFS= read -r dir; do
  rel="${dir#"$IN"/}"; lang=$(basename "$dir")
  if [ -z "$(cap podpisy "$lang" 01-dzis)$(cap podpisy "$lang" 02-licznik)" ]; then echo "::warning::Brak podpisów dla języka $lang ($rel) — bez ramek (surowe zrzuty w artefakcie surowym)"; continue; fi
  if [[ "$CJK_LANGS" == *" $lang "* ]]; then FONT="$FONT_CJK"; elif [[ "$SYS_LANGS" == *" $lang "* ]]; then FONT="$FONT_SYS"; else FONT="$FONT_BREE"; fi
  [ -f "$FONT" ] || { echo "::error::brak czcionki $FONT dla języka $lang (apt: fonts-noto-core, fonts-noto-cjk)"; exit 1; }
  mkdir -p "$OUT/$rel"
  # 10-wydanie-012 (sesja AH): promień zaokrąglenia w promilach szerokości zrzutu po pomniejszeniu; iPhone 7% (jak dotąd), iPad 1,5% — przy 7% róg ucinał pasek stanu iPada
  # (pion: „9” przy ramce, poziom: tylko „41 AM”, bateria ucięta; ipad-13/{en,pl}/* i warunek-og07/ipad-13/*), a pasek iPada zaczyna się ok. 40 px od lewej i 14 px od góry zrzutu.
  if [[ "$rel" == *ipad* ]]; then RPM=15; else RPM=70; fi
  # Jeden rozmiar czcionki i podział wierszy dla języka w tym katalogu (uklad-podpisow.mjs); pole podpisu = 86% szerokości × 15% wysokości, dla NAJMNIEJSZEGO zrzutu w katalogu.
  FW=999999; FH=999999
  for shot in "$dir"/*.png; do
    read -r W0 H0 < <(identify -format '%w %h\n' "$shot")
    [ $(( W0 * 86 / 100 )) -lt "$FW" ] && FW=$(( W0 * 86 / 100 )); [ $(( H0 * 15 / 100 )) -lt "$FH" ] && FH=$(( H0 * 15 / 100 ))
  done
  node scripts/ci/uklad-podpisow.mjs "$CAP" "$lang" "$FONT" "$FW" "$FH" > "$TMP/plan.json"
  PT=$(node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).pointsize))' "$TMP/plan.json")
  for shot in "$dir"/*.png; do
    file=$(basename "$shot"); sc=${file%.png}
    text=$(node -e 'const p=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).podpisy[process.argv[2]]; process.stdout.write(p==null?"":p)' "$TMP/plan.json" "$sc")
    [ -n "$text" ] || { echo "::warning::Brak podpisu: $lang/$sc — pomijam"; continue; }
    read -r W H < <(identify -format '%w %h\n' "$shot")
    SW=$(( W * 78 / 100 )); SH=$(( H * 78 / 100 )); R=$(( SW * RPM / 1000 )); B=$(( W / 120 + 2 ))
    CAPH=$(( H * 15 / 100 )); TOP=$(( H * 19 / 100 )); X=$(( (W - SW) / 2 ))
    convert "$shot" -alpha off -resize "${SW}x${SH}!" "$TMP/s.png"
    convert -size "${SW}x${SH}" xc:black -fill white -draw "roundrectangle 0,0,$((SW - 1)),$((SH - 1)),$R,$R" "$TMP/m.png"
    convert "$TMP/s.png" "$TMP/m.png" -alpha off -compose CopyOpacity -composite "$TMP/r.png"
    convert -background none -fill "$FG" -font "$FONT" -size "$(( W * 86 / 100 ))x$CAPH" -gravity center -pointsize "$PT" label:"$text" "$TMP/c.png"
    convert -size "${W}x${H}" "xc:$BG" \
      -fill "$LINE" -draw "roundrectangle $((X - B)),$((TOP - B)),$((X + SW - 1 + B)),$((TOP + SH - 1 + B)),$((R + B)),$((R + B))" \
      "$TMP/r.png" -geometry "+$X+$TOP" -compose over -composite \
      "$TMP/c.png" -geometry "+$(( W * 7 / 100 ))+$(( H * 3 / 100 ))" -compose over -composite \
      -alpha remove -alpha off -depth 8 -define png:color-type=2 "$OUT/$rel/$file"
    n=$((n + 1))
  done
done < <(find "$IN" -type f -name '*.png' -exec dirname {} \; | sort -u)
echo "Ramki: $n plików"
