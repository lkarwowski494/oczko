const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');
const fk = () => db.prepare('PRAGMA foreign_keys').get().foreign_keys;
db.exec('PRAGMA foreign_keys=ON'); console.log('po ON poza transakcja:', fk());
db.exec('BEGIN'); db.exec('PRAGMA foreign_keys=OFF'); console.log('po OFF wewnatrz BEGIN:', fk()); db.exec('COMMIT');
console.log('po COMMIT:', fk());
db.exec('PRAGMA foreign_keys=OFF'); console.log('po OFF poza transakcja:', fk());
