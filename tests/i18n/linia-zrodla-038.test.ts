/* M1-audytor-generalny-038 (06-tresci-004, DEC-21 a; P-085, P-112 (2), BR-KAL-008): linia źródła CYC na ekranie „Źródła wiedzy” jest warunkiem
 * użycia materiałów dawcy, więc stoi dosłownie po angielsku we wszystkich językach — to nie przekład, tylko formuła dawcy. Pilnuje słowników
 * aplikacji, wyników przekładu API (wejście kolejnej fali 09) i kontekstu dla tłumaczy, żeby następna fala nie przywróciła „Źródło:”/„Quelle:”. */
import * as fs from 'fs';
import * as path from 'path';

const KORZEN = path.join(__dirname, '..', '..');
const LINIA = "Source: Craft Yarn Council's www.YarnStandards.com";
const czytaj = (p: string): Record<string, unknown> => JSON.parse(fs.readFileSync(path.join(KORZEN, p), 'utf8')) as Record<string, unknown>;
const zrodla = (o: Record<string, unknown>): Record<string, unknown> => (o.zrodla ?? {}) as Record<string, unknown>;
const SLOWNIKI = fs.readdirSync(path.join(KORZEN, 'src/i18n/slowniki')).filter((f) => /^[a-zA-Z0-9-]+\.json$/.test(f));
const API = fs.readdirSync(path.join(KORZEN, 'docs/lokalizacja/przeklad-api')).filter((f) => f.endsWith('.json'));

test('038: en ma linię w brzmieniu z BRD (BR-KAL-008) i 35 słowników', () => {
  expect(zrodla(czytaj('src/i18n/slowniki/en.json')).linia_standardow).toBe(LINIA);
  expect(SLOWNIKI).toHaveLength(35);
});

test('038: zrodla.linia_standardow równe en we wszystkich słownikach aplikacji', () => {
  const inne = SLOWNIKI.filter((f) => zrodla(czytaj(`src/i18n/slowniki/${f}`)).linia_standardow !== LINIA);
  expect(inne).toEqual([]);
});

test('038: wyniki przekładu API mają linię dosłownie po angielsku (kolejna fala nie przywraca przekładu)', () => {
  const inne = API.filter((f) => {
    const o = czytaj(`docs/lokalizacja/przeklad-api/${f}`);
    return 'zrodla.linia_standardow' in o && o['zrodla.linia_standardow'] !== LINIA;
  });
  expect(inne).toEqual([]);
});

test('038: kontekst dla tłumaczy mówi „nie tłumaczyć”, bez zgody na przekład słowa „Source:”', () => {
  const k = String(zrodla(czytaj('src/i18n/slowniki/en.kontekst.json')).linia_standardow);
  expect(k).toMatch(/nie tłumaczyć/i);
  expect(k).not.toMatch(/zmienia się tylko słowo/);
});
