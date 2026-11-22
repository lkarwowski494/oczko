// Uruchamia docs/architektura/schemat.sql w node:sqlite i sprawdza definicję ukończenia roli 05 (E2):
// integrity_check = ok, foreign_key_check pusty, kaskada, UPSERT zachowuje dzieci (REPLACE kontrolnie kasuje),
// CHECK odrzuca złe dane, jedna otwarta sesja, stany ⊆ CHECK, runner migracji (user_version, ponowne uruchomienie, baza nowsza),
// plany zapytań głównych ekranów na danych 3-letnich. Użycie: node --no-warnings sprawdz-schemat.mjs [katalog-architektury]
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { integralnosc, stanyICheck, plany } from './bateria-schematu.mjs';
const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const schemat = readFileSync(join(dir, 'schemat.sql'), 'utf8');
const stany = JSON.parse(readFileSync(join(dir, 'stany.json'), 'utf8'));
let bledy = 0; const ok = (w, opis) => { console.log(`${w ? 'OK  ' : 'BŁĄD'} ${opis}`); if (!w) bledy++; };
const rzuca = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };

// Połączenie jak w aplikacji: klucze obce domyślnie wyłączone, włączane PRAGMA poza transakcją (moduł, „Połączenie”).
const otworz = () => { const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: false }); db.exec('PRAGMA foreign_keys = ON'); return db; };

// Runner migracji (wzorzec modułu, wersja synchroniczna dla node:sqlite).
function migruj(db, migracje) {
  const start = db.prepare('PRAGMA user_version').get().user_version;
  const cel = Math.max(0, ...migracje.map((m) => m.wersja));
  if (start > cel) throw new Error(`Baza w wersji ${start} jest nowsza niż aplikacja (${cel}).`);
  for (const m of migracje.filter((x) => x.wersja > start).sort((a, b) => a.wersja - b.wersja)) {
    if (m.przebudowa) db.exec('PRAGMA foreign_keys = OFF');
    try {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec(m.sql);
        const zle = db.prepare('PRAGMA foreign_key_check').all();
        if (zle.length) throw new Error(`Migracja ${m.wersja}: ${zle.length} naruszeń kluczy obcych`);
        db.exec(`PRAGMA user_version = ${Number(m.wersja)}`);
        db.exec('COMMIT');
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    } finally { if (m.przebudowa) db.exec('PRAGMA foreign_keys = ON'); }
  }
  return Math.max(start, cel);
}
const MIGRACJE = [{ wersja: 1, sql: schemat }];

const db = otworz();
console.log('SQLite', db.prepare('SELECT sqlite_version() v').get().v, '· Node', process.version);
ok(migruj(db, MIGRACJE) === 1 && db.prepare('PRAGMA user_version').get().user_version === 1, 'migracja 1 na pustej bazie, user_version = 1');
ok(migruj(db, MIGRACJE) === 1, 'ponowne uruchomienie migracji niczego nie zmienia');
ok(db.prepare('PRAGMA integrity_check').get().integrity_check === 'ok', 'PRAGMA integrity_check = ok (pusta)');
ok(db.prepare('PRAGMA foreign_keys').get().foreign_keys === 1, 'PRAGMA foreign_keys = 1 poza transakcją');
db.exec('BEGIN'); ok(db.prepare('PRAGMA foreign_keys').get().foreign_keys === 1, 'PRAGMA foreign_keys = 1 wewnątrz transakcji zapisu'); db.exec('COMMIT');

// Dane: projekt → część → licznik → zdarzenia, przypomnienie, notatka; wzór z plikiem i rysunkiem; sesja; zapas.
const T = Date.UTC(2026, 9, 22, 10);
const sha = (c) => c.repeat(64);
db.exec(`INSERT INTO plik VALUES ('${sha('a')}', 'pdf', 1000, ${T}), ('${sha('b')}', 'pkdrawing', 40, ${T}), ('${sha('c')}', 'jpg', 600, ${T});`);
db.exec(`INSERT INTO projekt (id, nazwa, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES ('p1', 'Sweter', ${T}, ${T}, ${T});
INSERT INTO czesc VALUES ('c1', 'p1', 'Rękaw lewy', 1, 96, NULL, ${T}, NULL), ('c2', 'p1', 'Rękaw prawy', 2, 96, 'c1', ${T}, NULL);
INSERT INTO licznik (id, czesc_id, kolejnosc, zmieniono_ms, wartosc, glowa) VALUES ('l1', 'c1', 1, ${T}, 2, 'z2');
INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc_po, rodzice, zrodlo, urzadzenie, czas_ms, strefa, dzien) VALUES
 ('z1', 'l1', 'plus', 1, '[]', 'aplikacja', 'iphone', ${T}, 'Europe/Warsaw', '2026-10-22'),
 ('z2', 'l1', 'plus', 2, '["z1"]', 'ekran_blokady', 'iphone', ${T + 60000}, 'Europe/Warsaw', '2026-10-22');
INSERT INTO przypomnienie VALUES ('r1', 'l1', 6, 6, 5, 'ujmowanie', ${T});
INSERT INTO notatka_rzedu VALUES ('n1', 'l1', 30, 'ujmowanie', ${T});
INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, zmieniono_ms) VALUES ('w1', 'p1', 'Raglan', 'pdf', '${sha('a')}', ${T});
INSERT INTO rysunek VALUES ('w1', 0, '${sha('b')}', ${T});
INSERT INTO sesja (id, projekt_id, stan, start_ms, strefa, dzien) VALUES ('s1', 'p1', 'trwa', ${T}, 'Europe/Warsaw', '2026-10-22');
INSERT INTO wloczka (id, nazwa, motki, zmieniono_ms) VALUES ('y1', 'Merino', 5, ${T});
INSERT INTO projekt_wloczka (projekt_id, wloczka_id, zuzyto_motki, odjeto_motki, zmieniono_ms) VALUES ('p1', 'y1', NULL, NULL, ${T});
INSERT INTO zdjecie VALUES ('f1', 'p1', NULL, '${sha('c')}', ${T});
INSERT INTO dzien_limitu VALUES ('2026-10-22', 0, ${T}, 'z1');`);
ok(db.prepare('PRAGMA foreign_key_check').all().length === 0, 'PRAGMA foreign_key_check pusty (z danymi)');
const n = (t) => db.prepare(`SELECT count(*) n FROM ${t}`).get().n;

// UPSERT projektu zachowuje dzieci; REPLACE (kontrola negatywna, w transakcji wycofanej) kasuje je kaskadą.
db.prepare(`INSERT INTO projekt (id, nazwa, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES ('p1', 'Sweter raglan', ?, ?, ?)
  ON CONFLICT (id) DO UPDATE SET nazwa = excluded.nazwa, zmieniono_ms = excluded.zmieniono_ms`).run(T, T + 1, T);
ok(n('czesc') === 2 && n('zdarzenie') === 2 && db.prepare("SELECT nazwa FROM projekt WHERE id='p1'").get().nazwa === 'Sweter raglan', 'UPSERT projektu: nazwa zmieniona, części 2 i zdarzenia 2 zachowane');
db.exec('BEGIN');
db.prepare(`INSERT OR REPLACE INTO projekt (id, nazwa, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES ('p1', 'X', ?, ?, ?)`).run(T, T, T);
const poReplace = n('zdarzenie'); db.exec('ROLLBACK');
ok(poReplace === 0 && n('zdarzenie') === 2, `kontrola: INSERT OR REPLACE kasuje zdarzenia kaskadą (${poReplace}), ROLLBACK przywraca 2 — dlatego UPSERT`);

// CHECK odrzuca dane spoza niezmienników.
ok(/CHECK/.test(rzuca(() => db.exec(`INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc_po, zrodlo, urzadzenie, czas_ms, strefa, dzien) VALUES ('zx','l1','razy2',1,'aplikacja','i',${T},'UTC','2026-10-22')`)) ?? ''), 'CHECK: nieznany rodzaj zdarzenia odrzucony');
ok(/CHECK/.test(rzuca(() => db.exec(`INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc_po, zrodlo, urzadzenie, czas_ms, strefa, dzien) VALUES ('zy','l1','wpisanie',1,'aplikacja','i',${T},'UTC','2026-10-22')`)) ?? ''), 'CHECK: wpisanie bez wartości odrzucone');
ok(/CHECK/.test(rzuca(() => db.exec(`UPDATE licznik SET dlugosc_powtorzenia = 0 WHERE id='l1'`)) ?? ''), 'CHECK: długość powtórzenia 0 odrzucona (RD-12-W5)');
ok(/CHECK/.test(rzuca(() => db.exec(`UPDATE projekt SET stan='ukonczony' WHERE id='p1'`)) ?? ''), 'CHECK: ukończony bez ukonczono_ms odrzucony');
ok(/UNIQUE/.test(rzuca(() => db.exec(`INSERT INTO sesja (id, projekt_id, stan, start_ms, wstrzymano_ms, strefa, dzien) VALUES ('s2','p1','wstrzymana',${T},${T},'UTC','2026-10-22')`)) ?? ''), 'UNIQUE: druga otwarta sesja odrzucona');
ok(/FOREIGN KEY/.test(rzuca(() => db.exec(`DELETE FROM plik WHERE sha256='${sha('a')}'`)) ?? ''), 'RESTRICT: plik używany przez wzór nie da się usunąć');

// Kaskada: usunięcie projektu usuwa części, liczniki, zdarzenia, przypomnienia, notatki, wzory, rysunki, sesje, przypisania, zdjęcia; zostają pliki, włóczka i dni limitu.
db.exec("DELETE FROM projekt WHERE id='p1'");
ok(['czesc', 'licznik', 'zdarzenie', 'przypomnienie', 'notatka_rzedu', 'wzor', 'rysunek', 'sesja', 'projekt_wloczka', 'zdjecie'].every((t) => n(t) === 0)
  && n('plik') === 3 && n('wloczka') === 1 && n('dzien_limitu') === 1, 'kaskada usunięcia projektu; pliki (sprzątanie osobno), włóczka i dzień limitu zostają');
ok(db.prepare('PRAGMA foreign_key_check').all().length === 0 && db.prepare('PRAGMA integrity_check').get().integrity_check === 'ok', 'po kaskadzie: foreign_key_check pusty, integrity_check ok');

// Stany ↔ CHECK w obie strony i integralność po kaskadzie (bateria-schematu.mjs, wspólna z testem runnera aplikacji).
for (const [w, opis] of [...stanyICheck(db, stany), ...integralnosc(db)]) ok(w, opis);

// Zapis dnia limitu (P-109, scalDni L-20): instrukcja z dane.md („zapis-dnia-limitu.sql”) wykonana na bazie: pro = OR, najwcześniejszy start dnia zostaje.
const dane = readFileSync(join(dir, 'dane.md'), 'utf8');
const zapisDnia = dane.match(/```sql\n-- zapis-dnia-limitu\.sql[^\n]*\n([\s\S]*?)```/)?.[1];
ok(Boolean(zapisDnia), 'dane.md: blok „zapis-dnia-limitu.sql” istnieje');
if (zapisDnia) {
  const dbd = otworz(); migruj(dbd, MIGRACJE);
  const zd = dbd.prepare(zapisDnia);
  const dzien = () => dbd.prepare("SELECT pro, zaczeto_ms, zdarzenie_id FROM dzien_limitu WHERE dzien = '2026-10-22'").get();
  zd.run('2026-10-22', 0, 200, 'b'); zd.run('2026-10-22', 1, 300, 'c');
  ok(dzien().pro === 1 && dzien().zaczeto_ms === 200 && dzien().zdarzenie_id === 'b', 'dzień limitu: bez Pro, potem z Pro → pro = 1, start i zdarzenie z wcześniejszego zapisu');
  zd.run('2026-10-22', 0, 100, 'a');
  ok(dzien().pro === 1 && dzien().zaczeto_ms === 100 && dzien().zdarzenie_id === 'a' && dbd.prepare('SELECT count(*) n FROM dzien_limitu').get().n === 1, 'dzień limitu: wcześniejszy start z innego urządzenia bez Pro → pro zostaje 1, start = najwcześniejszy, jeden wiersz (L-20, L-23)');
}
// Kategoria grubości włóczki (P-099, P-110 Q6a): jedna wartość CYC 0–7 albo NULL.
const dbk = otworz(); migruj(dbk, MIGRACJE);
ok(/CHECK/.test(rzuca(() => dbk.exec(`INSERT INTO wloczka (id, nazwa, motki, kategoria, zmieniono_ms) VALUES ('k8', 'X', 1, 8, 1)`)) ?? 'brak kolumny'), 'CHECK: kategoria grubości 8 odrzucona');
ok(rzuca(() => dbk.exec(`INSERT INTO wloczka (id, nazwa, motki, kategoria, zmieniono_ms) VALUES ('k0', 'Koronka', 1, 0, 1), ('kn', 'Bez etykiety', 1, NULL, 1)`)) === null, 'kategoria 0 i NULL przyjęte');
// Synchronizacja i import (fix 2026-10-25, Z07-14): poczekalnia bez kluczy obcych (rekord czeka na rodzica albo encję, partia nie jest cofana),
// sesja zamknięta przy scaleniu albo po SESJA_MAKS_H oznaczona do korekty.
const dbs = otworz(); migruj(dbs, MIGRACJE);
const kolumny = (t) => dbs.prepare(`PRAGMA table_info(${t})`).all().map((k) => k.name);
ok(['id', 'rodzaj_rekordu', 'dane', 'powod', 'zrodlo', 'przyszlo_ms', 'proby'].every((k) => kolumny('poczekalnia').includes(k)), 'poczekalnia: kolumny id, rodzaj_rekordu, dane, powod, zrodlo, przyszlo_ms, proby');
ok(dbs.prepare('PRAGMA foreign_key_list(poczekalnia)').all().length === 0, 'poczekalnia bez kluczy obcych (rekord bez rodzica nie odrzuca partii)');
ok(rzuca(() => dbs.exec(`INSERT INTO poczekalnia (id, rodzaj_rekordu, dane, powod, zrodlo, przyszlo_ms) VALUES ('zx', 'zdarzenie', '{"licznik":"brak"}', 'brak_encji', 'synchronizacja', 1)`)) === null
  && /CHECK/.test(rzuca(() => dbs.exec(`INSERT INTO poczekalnia (id, rodzaj_rekordu, dane, powod, zrodlo, przyszlo_ms) VALUES ('zy', 'zdarzenie', 'x', 'brak_encji', 'synchronizacja', 1)`)) ?? ''), 'poczekalnia: zdarzenie bez licznika przyjęte, dane niebędące JSON odrzucone');
ok(kolumny('sesja').includes('do_korekty') && /CHECK/.test(rzuca(() => dbs.exec(`INSERT INTO projekt (id, nazwa, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES ('p', 'A', 1, 1, 1); INSERT INTO sesja (id, projekt_id, stan, start_ms, strefa, dzien, do_korekty) VALUES ('s', 'p', 'trwa', 1, 'UTC', '2026-10-22', 2)`)) ?? ''), 'sesja.do_korekty ∈ {0, 1} (zapomniany stoper, druga otwarta sesja przy scaleniu)');
// Skrzynka iCloud (M1-audytor-generalny-117, ADR-0005 uzupełnienie 2026-11-03, dane.md): wpis wysłany (wyslano_nr = nr) zostaje do pełnego pobrania.
dbs.exec("UPDATE synchronizacja SET wlaczona = 1 WHERE id = 1; INSERT INTO projekt (id, nazwa, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES ('pz', 'Z', 1, 1, 1)");
ok(dbs.prepare("SELECT wyslano_nr, objete FROM zmiana_icloud WHERE encja = 'projekt' AND klucz = 'pz'").get()?.objete === 0
  && rzuca(() => dbs.exec("UPDATE zmiana_icloud SET wyslano_nr = nr, objete = 1 WHERE klucz = 'pz'")) === null
  && /CHECK/.test(rzuca(() => dbs.exec("UPDATE zmiana_icloud SET wyslano_nr = nr + 1 WHERE klucz = 'pz'")) ?? '')
  && /CHECK/.test(rzuca(() => dbs.exec("UPDATE zmiana_icloud SET objete = 2 WHERE klucz = 'pz'")) ?? ''), 'zmiana_icloud: nowy wpis objete = 0; CHECK odrzuca wyslano_nr > nr i objete = 2');
// Baza nowsza niż aplikacja: odrzucona bez zmian.
const db2 = otworz(); db2.exec('PRAGMA user_version = 2');
ok(/nowsza/.test(rzuca(() => migruj(db2, MIGRACJE)) ?? '') && db2.prepare('PRAGMA user_version').get().user_version === 2, 'baza w wersji 2 odrzucona przez aplikację w wersji 1, bez zmian');
// Migracja łamiąca CHECK wycofana w całości.
const db3 = otworz(); migruj(db3, MIGRACJE);
db3.exec(`INSERT INTO projekt (id, nazwa, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES ('p', 'A', 1, 1, 1)`);
const zla = { wersja: 2, sql: "ALTER TABLE projekt ADD COLUMN x TEXT; UPDATE projekt SET nazwa = '';" };
ok(rzuca(() => migruj(db3, [...MIGRACJE, zla])) !== null && db3.prepare('PRAGMA user_version').get().user_version === 1 && db3.prepare("SELECT nazwa FROM projekt").get().nazwa === 'A'
  && !db3.prepare("SELECT sql FROM sqlite_schema WHERE name='projekt'").get().sql.includes(' x '), 'migracja łamiąca CHECK wycofana w całości (wersja, dane i schemat bez zmian)');

// Plany zapytań głównych ekranów na danych 3-letnich (150 000 zdarzeń, 45 projektów, E0 §3).
const dbp = otworz(); migruj(dbp, MIGRACJE);
const insZ = dbp.prepare(`INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc_po, rodzice, zrodlo, urzadzenie, czas_ms, strefa, dzien) VALUES (?, ?, 'plus', ?, '[]', 'aplikacja', 'i', ?, 'Europe/Warsaw', ?)`);
dbp.exec('BEGIN');
for (let p = 0; p < 45; p++) { dbp.exec(`INSERT INTO projekt (id, nazwa, stan, utworzono_ms, zmieniono_ms, ostatnia_praca_ms, ukonczono_ms, ukonczono_dzien) VALUES ('p${p}', 'P${p}', '${p < 40 ? 'ukonczony' : 'w_toku'}', 1, 1, ${p}, ${p < 40 ? "1, '1970-01-01'" : 'NULL, NULL'})`); // ukonczono_dzien: fix-3 (08 partia 3)
  for (let c = 0; c < 4; c++) { dbp.exec(`INSERT INTO czesc VALUES ('c${p}_${c}', 'p${p}', 'C', ${c}, NULL, NULL, 1, NULL); INSERT INTO licznik (id, czesc_id, kolejnosc, zmieniono_ms) VALUES ('l${p}_${c}', 'c${p}_${c}', 0, 1);`); } }
for (let i = 0; i < 150000; i++) { const czas = Date.UTC(2024, 0, 1) + i * 600000; insZ.run('z' + i, `l${Math.floor(i / 833) % 45}_${i % 4}`, i, czas, new Date(czas).toISOString().slice(0, 10)); }
for (let y = 0; y < 300; y++) dbp.exec(`INSERT INTO wloczka (id, nazwa, motki, kategoria, zmieniono_ms) VALUES ('y${y}', 'W${y}', 1, ${y % 8}, 1)`);
dbp.exec('COMMIT'); dbp.exec('ANALYZE');
for (const [w, opis] of plany(dbp)) ok(w, opis);
console.log(bledy ? `${bledy} błędów` : 'wszystkie kontrole OK'); process.exit(bledy ? 1 : 0);
