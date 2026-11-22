// Zapisuje kopie źródeł Swift z scripts/natywne/kopie.json (P-129 Q2a). Ręcznie kopii nie edytować: zmiana idzie do źródła, potem ten skrypt.
// Użycie: node scripts/natywne/kopiuj-zrodla.mjs
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const KORZEN = join(import.meta.dirname, '../..');
const { zrodla } = JSON.parse(readFileSync(join(KORZEN, 'scripts/natywne/kopie.json'), 'utf8'));
for (const [z, cele] of Object.entries(zrodla)) for (const c of cele) {
  mkdirSync(dirname(join(KORZEN, c)), { recursive: true });
  copyFileSync(join(KORZEN, z), join(KORZEN, c));
}
console.log(`kopie Swift: ${Object.values(zrodla).flat().length} plików`);
