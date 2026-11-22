// Generator strony atlasu (ADR-0025): karty + słowniki tekstów → katalog HTML (podkatalogi językowe, hreflang, x-default, mapa strony).
// Użycie: node --experimental-strip-types --no-warnings scripts/atlas/strona.mjs --karty <katalog> --teksty <katalog tag.json> --adres https://…/ --wyjscie <katalog> [--sklep <adres>]
// Adres strony to decyzja właściciela (P-093 D4, ADR-0025 Q2) — bez niego generator kończy się błędem. Kod: 0 = zapisano, 1 = błędy, 2 = użycie.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walidujKarte } from './silnik/kontrakt.ts';
import { paletaZTokenow } from './silnik/svg.ts';
import { sprawdzKrok } from './silnik/sprawdz.ts';
import { zbudujStrone } from './silnik/strona.ts';

const KORZEN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; };
const [katKart, katTekstow, adres, wyjscie] = ['karty', 'teksty', 'adres', 'wyjscie'].map(arg);
if (!katKart || !katTekstow || !wyjscie || !existsSync(katKart) || !existsSync(katTekstow)) { console.error('Użycie: strona.mjs --karty <k> --teksty <k> --adres <https://…/> --wyjscie <k>'); process.exit(2); }
const tokeny = JSON.parse(readFileSync(join(KORZEN, 'docs/design/tokeny.json'), 'utf8'));
const palety = { jasny: paletaZTokenow(tokeny, 'jasny'), ciemny: paletaZTokenow(tokeny, 'ciemny') };
const karty = readdirSync(katKart).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(katKart, f), 'utf8')));
let bledy = 0;
for (const k of karty) for (const e of walidujKarte(k, { sprawdzKrok: sprawdzKrok(Object.values(palety)) })) { console.log(`${k.id} [${e.kod}] ${e.sciezka}: ${e.szczegol}`); bledy++; }
const teksty = Object.fromEntries(readdirSync(katTekstow).filter((f) => f.endsWith('.json')).map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(katTekstow, f), 'utf8'))]));
const w = zbudujStrone({ adres: adres ?? '', karty, teksty, palety, odnosnikSklepu: arg('sklep') });
for (const e of w.bledy) { console.log(`strona: ${e}`); bledy++; }
if (bledy) { console.log(`${bledy} błędów — nic nie zapisano`); process.exit(1); }
for (const [p, tresc] of Object.entries(w.pliki)) { mkdirSync(dirname(join(wyjscie, p)), { recursive: true }); writeFileSync(join(wyjscie, p), tresc); }
console.log(`OK: ${Object.keys(w.pliki).length} plików w ${wyjscie}`);
