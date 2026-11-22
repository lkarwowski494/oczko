// Wektory odwzorowania dla XCTest modułu `oczko-icloud` (modules/oczko-icloud/Pakiet/wektory.json; 08 partia 7). Ten sam plik czyta `swift test`
// pakietu — tu sprawdzamy, że wektory zgadzają się z TS: rekord = rekordZWiersza, recordName = nazwaRekordu, typy pól = cloudkit/schemat.ckdb,
// powrót z CloudKit = rekord bez pól null (CKRecord nie trzyma nil) i nadal poprawny dla wierszZRekordu.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tabelaIcloud } from '../../../src/domena/icloud/kontrakt';
import { nazwaRekordu, rekordZWiersza, rozbierzNazwe, wierszZRekordu } from '../../../src/domena/icloud/odwzorowanie';
import type { RekordIcloud } from '../../../src/domena/porty';

const KORZEN = join(__dirname, '../../..');
type Wektor = { co: string; tabela: string; wiersz: Record<string, string | number | null>; sciezka: string | null; rekord: RekordIcloud;
  ck: { typ: string; nazwa: string; pola: Record<string, string> }; powrot: RekordIcloud };
const W: { rekordy: Wektor[]; obce: { co: string; typ: string; nazwa: string }[] } =
  JSON.parse(readFileSync(join(KORZEN, 'modules/oczko-icloud/Pakiet/wektory.json'), 'utf8'));
const CKDB = readFileSync(join(KORZEN, 'cloudkit/schemat.ckdb'), 'utf8');
function typyPolCkdb(typ: string): Record<string, string> {
  const blok = new RegExp(`RECORD TYPE ${typ} \\(([\\s\\S]*?)\\);`).exec(CKDB);
  if (!blok) throw new Error(`brak typu ${typ} w schemat.ckdb`);
  return Object.fromEntries([...blok[1].matchAll(/^\s+(\w+)\s+([A-Z0-9]+)/gm)].filter((m) => !m[1].startsWith('_')).map((m) => [m[1], m[2]]));
}

test('pokrycie: DOUBLE (całkowita i ułamek), pole null, kolumny pomin, klucz złożony z dwukropkiem, zasób, rekordy obce', () => {
  const typy = W.rekordy.flatMap((v) => Object.values(v.ck.pola));
  expect(W.rekordy.length).toBeGreaterThanOrEqual(6);
  expect(typy).toEqual(expect.arrayContaining(['STRING', 'INT64', 'DOUBLE', 'ASSET']));
  expect(W.rekordy.some((v) => Object.values(v.rekord.pola).includes(null))).toBe(true);
  expect(W.rekordy.some((v) => (tabelaIcloud(v.tabela)?.pomin.length ?? 0) > 0)).toBe(true);
  expect(W.rekordy.some((v) => v.rekord.klucz.startsWith('[') && v.rekord.klucz.includes(':'))).toBe(true);
  expect(W.obce.length).toBeGreaterThanOrEqual(3);
});

test.each(W.rekordy.map((v) => [v.co, v] as const))('%s', (_co, v) => {
  const t = tabelaIcloud(v.tabela);
  if (!t) throw new Error(`tabela spoza kontraktu: ${v.tabela}`);
  expect(v.rekord).toEqual(rekordZWiersza(t, v.wiersz, v.sciezka));
  expect(v.ck.typ).toBe(t.typ);
  expect(v.ck.nazwa).toBe(nazwaRekordu(v.tabela, v.rekord.klucz));
  const ckdb = typyPolCkdb(t.typ);
  const oczekiwane = Object.fromEntries(Object.entries(v.rekord.pola).filter(([, x]) => x !== null).map(([k]) => [k, ckdb[k]]));
  if (t.zasob) oczekiwane.dane = 'ASSET';
  expect(v.ck.pola).toEqual(oczekiwane);
  expect(Object.values(v.ck.pola)).not.toContain(undefined);
  expect(v.powrot).toEqual({ ...v.rekord, pola: Object.fromEntries(Object.entries(v.rekord.pola).filter(([, x]) => x !== null)) });
  expect(wierszZRekordu(v.powrot).ok).toBe(true);
});

test.each(W.obce.map((o) => [o.co, o] as const))('obcy: %s → poza kontraktem', (_co, o) => {
  const n = rozbierzNazwe(o.nazwa);
  expect(n !== null && tabelaIcloud(n.encja)?.typ === o.typ).toBe(false);
});
