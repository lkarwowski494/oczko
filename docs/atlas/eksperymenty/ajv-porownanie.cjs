// Eksperyment E2: zgodność własnego walidatora z niezależną biblioteką JSON Schema (ajv 6, draft-07; słowa kluczowe schematu atlasu są wspólne dla draft-07 i 2020-12).
// Użycie: node docs/atlas/eksperymenty/ajv-porownanie.cjs (ajv jest w node_modules jako zależność narzędzia lint; eksperyment, nie część verify). Wynik 2026-10-26: karty [true,true,true], mutanty 30/30 odrzucone — tak samo jak własny walidator.
const fs = require('fs'); const path = require('path');
const Ajv = require('ajv');
const schemat = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'katalog.schema.json'), 'utf8'));
delete schemat.$schema;
const ajv = new Ajv({ allErrors: true }); const v = ajv.compile(schemat);
const karty = fs.readdirSync(path.join(__dirname, '..', 'prototyp', 'karty')).map((f) => JSON.parse(fs.readFileSync(path.join(path.join(__dirname, '..', 'prototyp', 'karty'), f), 'utf8')));
const mutanty = [];
for (const k of karty) {
  const m = (f) => { const c = JSON.parse(JSON.stringify(k)); f(c); mutanty.push(c); };
  m((c) => { c.format = 2; }); m((c) => { delete c.klucze; }); m((c) => { c.dodatkowe = 1; }); m((c) => { c.terminy['xx_YY'] = { skrot: 'a', twierdzenie: 'TW-A' }; });
  m((c) => { c.rysunek.probka.kolumny = 1; }); m((c) => { c.rysunek.operacja = { typ: 'scal', strona: 'prawe' }; }); m((c) => { c.kroki[0].faza = 'inna'; });
  m((c) => { c.twierdzenia[0].id = 'tw-1'; }); m((c) => { c.kroki[0].strzalka = { ruch: 'drut', od: 'glowa:9:1', do: 'drut_prawy' }; }); m((c) => { c.glif = { id: 'glif.x', origin: 'CYC', rs: 'a', ws: 'b' }; });
}
console.log(JSON.stringify({ karty: karty.map((k) => v(k)), mutantyOdrzucone: mutanty.filter((k) => !v(k)).length, mutanty: mutanty.length }));
