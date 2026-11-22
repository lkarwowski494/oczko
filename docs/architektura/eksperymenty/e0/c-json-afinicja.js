const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');
db.exec(`CREATE TABLE a(x JSON); CREATE TABLE b(x TEXT CHECK(json_valid(x)));`);
for (const v of ["123", "1.0", "\"123\"", "{\"k\":1}"]) {
  db.prepare('INSERT INTO a VALUES(?)').run(v); db.prepare('INSERT INTO b VALUES(?)').run(v);
}
console.log('JSON  :', JSON.stringify(db.prepare('SELECT x, typeof(x) t FROM a').all()));
console.log('TEXT+CHECK:', JSON.stringify(db.prepare('SELECT x, typeof(x) t FROM b').all()));
try { db.prepare('INSERT INTO b VALUES(?)').run('{zle'); console.log('niepoprawny JSON przyjety'); } catch (e) { console.log('niepoprawny JSON w b odrzucony:', e.message); }
try { db.prepare('INSERT INTO a VALUES(?)').run('{zle'); console.log('niepoprawny JSON w a (JSON) przyjety:', db.prepare("SELECT typeof(x) t FROM a WHERE x='{zle'").get().t); } catch (e) { console.log('a odrzucil', e.message); }
