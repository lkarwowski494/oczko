#!/bin/bash
# Instalacja ImageMagicka i czcionek Noto dla zadania „komplet” w zrzuty-sklepu.yml (rola 08-programista, tryb fix, KO-039/KO-040, 2026-11-11).
# Ten sam zestaw pakietów co wcześniej (imagemagick, fonts-noto-core, fonts-noto-cjk); zmienia się tylko sposób wykonania:
#  1. preflight DNS mirrora z obrazu runnera (azure.archive.ubuntu.com); przy braku: ::warning:: i przełączenie na oficjalny archive.ubuntu.com, o ile ten odpowiada; inaczej od razu ::error::,
#  2. `apt-get update` z ograniczonymi czasami i ponowieniami; „Failed to fetch” ze źródła Ubuntu (archive/security/azure.archive.ubuntu.com albo lista mirrorów apt-mirrors.txt) w wyniku to błąd mimo kodu 0
#     (tak było w przebiegu 43035080611); „Failed to fetch” ze źródła spoza Ubuntu (np. packages.microsoft.com z obrazu runnera) to tylko ::warning:: (10-wydanie-021: pakiety zestawu są z Ubuntu),
#  3. 3 próby update+install, na końcu jawny ::error:: i kod ≠ 0 (bez continue-on-error, bez timeout-minutes w workflowie).
# Dlaczego: przebieg 43035080611 stał ok. 23 min w tym kroku (DNS azure.archive.ubuntu.com nie działał), a potem padał z kodem 100 bez czytelnej przyczyny; awaria ma być krótka i opisana.
# Zmienne (tylko dla testu na atrapach): OCZKO_APT_MIRRORS, OCZKO_APT_SOURCES, OCZKO_APT_ZWLOKA_S.
set -uo pipefail

PAKIETY=(imagemagick fonts-noto-core fonts-noto-cjk)
MIRROR_RUNNERA="azure.archive.ubuntu.com"
MIRROR_OFICJALNY="archive.ubuntu.com"
PLIK_MIRRORS="${OCZKO_APT_MIRRORS:-/etc/apt/apt-mirrors.txt}"
PLIK_SOURCES="${OCZKO_APT_SOURCES:-/etc/apt/sources.list.d/ubuntu.sources}"
ZWLOKA_S="${OCZKO_APT_ZWLOKA_S:-5}"
PROBY=3
LIMIT_UPDATE_S=120   # na próbę; wartości z przebiegu: update bez limitu trwał 3 min 23 s, install 20 min
LIMIT_INSTALL_S=300  # pobranie pakietów
APT_OPCJE=(-o Acquire::Retries=3 -o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20)

if [ "$(id -u)" -eq 0 ] && ! command -v sudo >/dev/null 2>&1; then SUDO=(); else SUDO=(sudo); fi
blad() { echo "::error::$*"; exit 1; }
dns_ok() { local i; for i in $(seq 1 "$PROBY"); do getent hosts "$1" >/dev/null 2>&1 && return 0; [ "$i" -lt "$PROBY" ] && sleep "$ZWLOKA_S"; done; return 1; }

if ! dns_ok "$MIRROR_RUNNERA"; then
  dns_ok "$MIRROR_OFICJALNY" || blad "DNS nie rozwiązuje ani $MIRROR_RUNNERA, ani $MIRROR_OFICJALNY: runner nie ma dostępu do repozytoriów Ubuntu; ponów przebieg (nie jest to błąd kodu zrzutów)"
  echo "::warning::DNS nie rozwiązuje $MIRROR_RUNNERA (mirror z obrazu runnera); przełączam apt na oficjalny $MIRROR_OFICJALNY (ten sam Ubuntu, inny host)"
  for plik in "$PLIK_MIRRORS" "$PLIK_SOURCES"; do
    [ -f "$plik" ] && "${SUDO[@]}" sed -i "s/${MIRROR_RUNNERA//./\\.}/${MIRROR_OFICJALNY}/g" "$plik"
  done
  [ -f "$PLIK_MIRRORS" ] && { echo "Mirrory apt po przełączeniu ($PLIK_MIRRORS):"; cat "$PLIK_MIRRORS"; }
fi

# 10-wydanie-021: błąd tylko dla źródeł Ubuntu; inne źródła → ::warning:: z adresem. „Some index files failed to download” bez żadnej linii „Failed to fetch” nie mówi, które źródło padło → błąd (ostrożnie).
zrodlo_ubuntu() {   # $1 = adres z linii „Failed to fetch”; 0 = źródło Ubuntu
  local host
  case "$1" in mirror+file:*apt-mirrors.txt*) return 0 ;; esac   # lista mirrorów Ubuntu z obrazu runnera
  host="${1#*://}"; host="${host%%/*}"; host="${host%%:*}"
  case "$host" in archive.ubuntu.com|security.ubuntu.com|azure.archive.ubuntu.com) return 0 ;; *) return 1 ;; esac
}
update_bez_bledu_ubuntu() {   # $1 = plik z wynikiem `apt-get update`; 0 = brak błędu (ewentualnie ostrzeżenia), 1 = błąd
  local linia adres ubuntu=0 inne=0
  while IFS= read -r linia; do
    adres="$(sed -E 's/.*Failed to fetch +([^ ]+).*/\1/' <<<"$linia")"
    if zrodlo_ubuntu "$adres"; then ubuntu=$((ubuntu + 1)); else inne=$((inne + 1)); echo "::warning::apt-get update: nie pobrano źródła spoza Ubuntu, pomijam (pakiety zestawu są z Ubuntu): ${adres:0:200}"; fi
  done < <(grep "Failed to fetch" "$1")
  [ "$ubuntu" -eq 0 ] || return 1
  if [ "$inne" -eq 0 ] && grep -q "Some index files failed to download" "$1"; then return 1; fi
  return 0
}

zainstaluj() {
  local wynik
  wynik="$(mktemp)"
  timeout "$LIMIT_UPDATE_S" "${SUDO[@]}" apt-get "${APT_OPCJE[@]}" update >"$wynik" 2>&1
  local kod=$?
  cat "$wynik"
  if [ "$kod" -ne 0 ] || ! update_bez_bledu_ubuntu "$wynik"; then rm -f "$wynik"; echo "apt-get update: niepowodzenie (kod $kod albo „Failed to fetch” ze źródła Ubuntu w wyniku)"; return 1; fi
  rm -f "$wynik"
  # Limit czasu tylko na pobieranie: SIGTERM w trakcie dpkg zostawiłby blokadę i ponowienia nie miałyby szans. Właściwa instalacja idzie z pamięci podręcznej, bez limitu.
  timeout "$LIMIT_INSTALL_S" "${SUDO[@]}" apt-get "${APT_OPCJE[@]}" install --download-only -y -qq "${PAKIETY[@]}" >/dev/null || { echo "apt-get install --download-only: niepowodzenie"; return 1; }
  "${SUDO[@]}" apt-get "${APT_OPCJE[@]}" install -y -qq "${PAKIETY[@]}" >/dev/null || { echo "apt-get install: niepowodzenie"; return 1; }
}

for proba in $(seq 1 "$PROBY"); do
  if zainstaluj; then
    # pipefail: porażka convert/dpkg-query nie ginie w potoku do tee (jak w poprzednim kroku `set -eo pipefail`)
    { echo "ImageMagick: $(convert -version | head -1)"; dpkg-query -W -f='czcionki: ${Package} ${Version}\n' fonts-noto-core fonts-noto-cjk; } | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}" || blad "po instalacji brak convert albo pakietów czcionek (podsumowanie wersji nie powstało)"
    exit 0
  fi
  [ "$proba" -lt "$PROBY" ] && { echo "::warning::próba $proba z $PROBY nieudana; ponawiam za ${ZWLOKA_S} s"; sleep "$ZWLOKA_S"; }
done
blad "instalacja ${PAKIETY[*]} nie powiodła się w $PROBY próbach (źródło: log powyżej); ponów przebieg, a jeśli się powtarza, sprawdź dostępność mirrorów Ubuntu na runnerze"
