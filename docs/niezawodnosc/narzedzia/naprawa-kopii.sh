#!/usr/bin/env bash
# naprawa-kopii.sh <katalog-z-plikami-od-użytkownika> [nazwa.db] — tylko na komputerze dewelopera, tylko na kopii (ADR-0020 (7), runbook §4).
# Wzorzec: moduł roli 12 `ratowanie-danych` (sprawdzony 18.10.2026: sqlite3 3.54.1, 2005/2005 wierszy z uszkodzonej bazy WAL, oryginał bez zmian).
# Pliki od użytkownika to dane osobowe: katalog w scratchpadzie, nigdy w repo; po zamknięciu sprawy usunięcie za zgodą właściciela.
set -euo pipefail
zrodlo="$1"; baza="${2:-oczko.db}"
command -v sqlite3 >/dev/null || { echo "brak sqlite3: sqlite-tools z https://sqlite.org/download.html do scratchpadu" >&2; exit 2; }
praca="$(mktemp -d)"
cp -p "$zrodlo/$baza" "$praca/"                                   # oryginały zostają nietknięte
for s in -wal -shm; do if [ -f "$zrodlo/$baza$s" ]; then cp -p "$zrodlo/$baza$s" "$praca/"; fi; done
echo "== integrity_check kopii"; sqlite3 "$praca/$baza" "PRAGMA integrity_check;" || true
sqlite3 "$praca/$baza" ".recover" > "$praca/odzysk.sql"
sqlite3 "$praca/odzyskana.db" < "$praca/odzysk.sql"
echo "== odzyskana.db"; sqlite3 "$praca/odzyskana.db" "PRAGMA integrity_check; PRAGMA foreign_key_check;"
sqlite3 "$praca/odzyskana.db" "SELECT name FROM sqlite_schema WHERE type='table';" | while read -r t; do
  echo "$t: $(sqlite3 "$praca/odzyskana.db" "SELECT count(*) FROM \"$t\";")"; done
echo "Wynik: $praca/odzyskana.db (wiersze bez rozpoznanej tabeli: lost_and_found)"
