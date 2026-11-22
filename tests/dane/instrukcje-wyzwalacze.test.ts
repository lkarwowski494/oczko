// Runner migracji a wyzwalacze (05 fix-7 NZ-P217-05, łatka L1; P-221 Q5a): `CREATE TRIGGER … BEGIN … END;` to jedna instrukcja,
// także gdy ciało ma kilka instrukcji, CASE … END albo średnik w napisie; reszta skryptu dzielona po `;` jak dotąd.
import { instrukcjeSql } from '../../src/dane/baza/parametry';

test('L1: wyzwalacz z kilkoma instrukcjami, CASE … END i średnikiem w napisie = jedna instrukcja', () => {
  const skrypt = [
    'CREATE TABLE a (x INTEGER);',
    "CREATE TRIGGER a_i AFTER INSERT ON a WHEN (SELECT CASE WHEN NEW.x > 0 THEN 1 ELSE 0 END) BEGIN INSERT INTO a VALUES (1); UPDATE a SET x = CASE WHEN x = 1 THEN 2 ELSE x END WHERE x = ';'; END;",
    "create temp trigger b_d after delete on a begin delete from a; end ;",
    'CREATE INDEX a_x ON a(x);',
  ].join('\n');
  expect(() => instrukcjeSql(skrypt)).not.toThrow(); // przed łatką L1: „wyzwalacze nieobsługiwane”
  const w = instrukcjeSql(skrypt);
  expect(w).toHaveLength(4);
  expect(w[1]).toMatch(/^CREATE TRIGGER a_i[\s\S]*WHERE x = ';'; END$/);
  expect(w[2]).toMatch(/^create temp trigger b_d[\s\S]*delete from a; end$/);
  expect(w[3]).toBe('CREATE INDEX a_x ON a(x)');
});
test('L1: kolumna o nazwie „end” poza wyzwalaczem nie zmienia podziału [ZIELONY-OK: kontrola regresji podziału, działa przed łatką]', () => {
  expect(instrukcjeSql('CREATE TABLE t ("end" INTEGER); SELECT 1;')).toEqual(['CREATE TABLE t ("end" INTEGER)', 'SELECT 1']);
});
