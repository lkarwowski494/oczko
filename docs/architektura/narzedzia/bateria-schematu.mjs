// bateria-schematu.mjs — kontrole bazy PO migracjach (fix 05 2026-10-25, Z07-15), wspólne dla sprawdz-schemat.mjs (schemat.sql na node:sqlite)
// i dla testu runnera aplikacji (rola 07/08: baza zmigrowana przez src/dane/migracje + adapter-node, potem otwarta DatabaseSync i podana tutaj).
// Każda funkcja zwraca listę [warunek, opis]; nie rzuca wyjątków za dane, tylko za brak tabel.

/** integrity_check = ok, foreign_key_check pusty, foreign_keys = 1 wewnątrz transakcji. */
export function integralnosc(db) {
  db.exec('BEGIN'); const fkWTx = db.prepare('PRAGMA foreign_keys').get().foreign_keys; db.exec('COMMIT');
  return [
    [db.prepare('PRAGMA integrity_check').get().integrity_check === 'ok', 'PRAGMA integrity_check = ok'],
    [db.prepare('PRAGMA foreign_key_check').all().length === 0, 'PRAGMA foreign_key_check pusty'],
    [fkWTx === 1, 'PRAGMA foreign_keys = 1 wewnątrz transakcji zapisu'],
  ];
}

/** Stany ↔ CHECK w obie strony: każda lista z stany.json = zbiór wartości CHECK kolumny, a każda lista tekstowa `CHECK (kol IN ('…'))`
 *  w sqlite_schema ma wpis w stany.json (listy liczbowe, np. (0, 1), są flagami, nie stanami). */
export function stanyICheck(db, stany) {
  const wyniki = [];
  const ddl = new Map(db.prepare("SELECT name, sql FROM sqlite_schema WHERE type = 'table' AND sql IS NOT NULL").all().map((r) => [r.name, r.sql]));
  const zCheck = (tabela, kolumna) => {
    const m = (ddl.get(tabela) ?? '').match(new RegExp(`\\b${kolumna}\\b[^\\n]*?CHECK \\(${kolumna} IN \\(([^)]*)\\)`));
    return m ? m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')) : null;
  };
  for (const [klucz, lista] of Object.entries(stany).filter(([k]) => !k.startsWith('_'))) {
    const [tabela, kolumna] = klucz.split('.');
    const zc = zCheck(tabela, kolumna) ?? [];
    wyniki.push([JSON.stringify([...zc].sort()) === JSON.stringify([...lista].sort()), `stany = CHECK: ${klucz} = {${lista.join(', ')}}`]);
  }
  const bez = [];
  for (const [tabela, sql] of ddl) {
    for (const m of sql.matchAll(/CHECK \((\w+) IN \(('[^)]*)\)\)/g)) if (!(`${tabela}.${m[1]}` in stany)) bez.push(`${tabela}.${m[1]}`);
  }
  wyniki.push([bez.length === 0, `CHECK → stany.json: każda lista tekstowa CHECK ma wpis (${bez.length ? 'brak: ' + bez.join(', ') : 'wszystkie'})`]);
  return wyniki;
}

/** Plany zapytań głównych ekranów: każde zapytanie musi użyć oczekiwanego indeksu (nie wystarczy brak „SCAN tabeli”). */
export const PLANY = [
  ['lista projektów w toku', "SELECT id, nazwa FROM projekt WHERE stan = 'w_toku' AND usunieto_ms IS NULL ORDER BY ostatnia_praca_ms DESC", ['projekt_lista']],
  ['historia licznika (50 ostatnich)', "SELECT * FROM zdarzenie WHERE licznik_id = 'l3_1' ORDER BY czas_ms DESC LIMIT 50", ['zdarzenie_licznik_czas']],
  ['kalendarz miesiąca (dni z robótką)', "SELECT dzien, count(*) FROM zdarzenie WHERE dzien BETWEEN '2026-10-01' AND '2026-10-31' GROUP BY dzien", ['zdarzenie_dzien']],
  ['dzień: projekty i rzędy', "SELECT c.projekt_id, count(*) FROM zdarzenie z JOIN licznik l ON l.id = z.licznik_id JOIN czesc c ON c.id = l.czesc_id WHERE z.dzien = '2026-10-22' GROUP BY c.projekt_id", ['zdarzenie_dzien']],
  ['zapas: filtr kategorii (BR-ZAP-004)', 'SELECT id, nazwa FROM wloczka WHERE kategoria = 4 AND usunieto_ms IS NULL ORDER BY nazwa COLLATE NOCASE', ['wloczka_kategoria']],
  ['dni limitu w miesiącu', "SELECT dzien, pro FROM dzien_limitu WHERE dzien BETWEEN '2026-10-01' AND '2026-10-31'", ['sqlite_autoindex_dzien_limitu_1']],
];
export function plany(db, lista = PLANY) {
  return lista.map(([nazwa, q, indeksy]) => {
    const plan = db.prepare('EXPLAIN QUERY PLAN ' + q).all().map((r) => r.detail).join(' | ');
    const t = []; for (let k = 0; k < 20; k++) { const s = performance.now(); db.prepare(q).all(); t.push(performance.now() - s); }
    const p95 = [...t].sort((a, b) => a - b)[18].toFixed(3);
    const uzyty = indeksy.some((i) => new RegExp(`USING (COVERING )?INDEX ${i}\\b`).test(plan));
    return [uzyty, `plan „${nazwa}” używa ${indeksy[0]}: [${plan}] · p95 ${p95} ms (Linux, nie iPhone)`];
  });
}
