/**
 * Terms of Use (EULA Apple) w opisie każdej lokalizacji sklepu (M1-audytor-generalny-201; 10-wydanie-002; wytyczna 3.1.2; DEC-01 P-528 wybór a).
 * Ostatnia linia opisu: „<etykieta w języku lokalizacji>: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/”, przed nią pusta linia,
 * opis ≤ 4000 znaków (limit ASC liczony w punktach kodowych). Etykiety wzięte dosłownie z repo `trening` (P-315).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KAT = join(__dirname, '../../docs/wydanie/metadane');
const EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const pliki = readdirSync(KAT).filter((f) => f.endsWith('.store.json')).sort();
const opisy: [string, string][] = [];
for (const f of pliki) {
  const info = (JSON.parse(readFileSync(join(KAT, f), 'utf8')).apple?.info ?? {}) as Record<string, { description?: string }>;
  for (const [loc, v] of Object.entries(info)) if (v.description !== undefined) opisy.push([`${f}:${loc}`, v.description]);
}

describe('Terms of Use w opisie sklepu (3.1.2)', () => {
  it('pliki *.store.json: 32 pliki, 33 opisy (nazwy i produkty bez opisów)', () => {
    expect(pliki).toHaveLength(32);
    expect(opisy).toHaveLength(33);
  });
  it.each(opisy)('%s: ostatnia linia to „Etykieta: adres EULA”, przed nią pusta linia, opis ≤ 4000 znaków', (_n, opis) => {
    const linie = opis.trimEnd().split('\n');
    const ostatnia = linie[linie.length - 1];
    expect(ostatnia).toMatch(/^\S.*[:：]\s?https:\/\/www\.apple\.com\/legal\/internet-services\/itunes\/dev\/stdeula\/$/u);
    expect(ostatnia.endsWith(EULA)).toBe(true);
    expect(linie[linie.length - 2]).toBe('');
    expect(opis.split(EULA)).toHaveLength(2); // adres raz
    expect([...opis].length).toBeLessThanOrEqual(4000);
  });
});
