// Format archiwum w TS (P-120 Q2a, ADR-0004): SHA-256 kawałkami = node:crypto, ZIP „stored” czytany niezależnym czytnikiem testów 07 (czytajZip),
// zły CRC wykrywany przy wypakowaniu. Test roli 08; wyrocznia: node:crypto i czytnik APPNOTE z tests/dane/pomocnicze.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, truncateSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sha256 } from '../../src/dane/archiwum/sha256';
import { czytajKatalog, wypakuj, zapiszZip } from '../../src/dane/archiwum/zip';
import { czytajZip } from './pomocnicze/dane-wejsciowe';
import { katalogTymczasowy } from './pomocnicze/srodowisko';

test('ADR-0004: SHA-256 liczony kawałkami = node:crypto (długości 0, 55, 56, 64, 65, 1 MiB + 3, podział na nierówne kawałki)', () => {
  for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 120, (1 << 20) + 3]) {
    const b = randomBytes(n);
    const s = sha256();
    for (let i = 0; i < n; i += 37) s.dodaj(b.subarray(i, i + 37));
    expect({ n, h: s.wynik() }).toEqual({ n, h: createHash('sha256').update(b).digest('hex') });
  }
});

test('ADR-0004: ZIP z plikiem z dysku i danymi w pamięci → czytnik 07 widzi te same bajty; wypakowanie z CRC; zepsuty bajt → CRC zły', () => {
  const k = katalogTymczasowy();
  const duzy = randomBytes((1 << 20) * 2 + 17);
  writeFileSync(join(k, 'duzy.bin'), duzy);
  const zip = join(k, 'a.oczko');
  zapiszZip(zip, [{ nazwa: 'manifest.json', dane: new TextEncoder().encode('{"format":"oczko"}') }, { nazwa: 'pliki/żółw.bin', plik: join(k, 'duzy.bin') }]);
  const z = czytajZip(zip);
  expect([...z.keys()]).toEqual(['manifest.json', 'pliki/żółw.bin']);
  expect(z.get('pliki/żółw.bin')!.equals(duzy)).toBe(true);
  const kat = czytajKatalog(zip)!;
  expect(wypakuj(zip, kat[1], join(k, 'out.bin'))).toBe(true);
  expect(readFileSync(join(k, 'out.bin')).equals(duzy)).toBe(true);
  const b = readFileSync(zip);
  b[kat[1].danePrzesuniecie + 5] ^= 0xff;
  writeFileSync(zip, b);
  expect(wypakuj(zip, kat[1], join(k, 'out2.bin'))).toBe(false);
  writeFileSync(join(k, 'tekst.oczko'), 'to nie jest archiwum');
  expect(czytajKatalog(join(k, 'tekst.oczko'))).toBeNull();
});

// ADR-0016 (wiersz ZIP, fix-3 05; partia 3 roli 08): bez ZIP64 — zapis odmawia wynikiem (nie wyjątkiem) i nie zostawia pliku;
// odczyt odrzuca wpis szyfrowany (bit 0) i ZIP64 (lokalizator końca katalogu ZIP64), zanim cokolwiek trafi do danych.
describe('ZIP bez ZIP64: granice jako Wynik (ADR-0016)', () => {
  test('> 65 535 wpisów → { ok: false, powod: za_duze }, pliku archiwum nie ma', () => {
    const k = katalogTymczasowy();
    const zip = join(k, 'wiele.oczko');
    const wpisy = Array.from({ length: 65_536 }, (_, i) => ({ nazwa: `p/${i}`, dane: new Uint8Array(0) }));
    expect(zapiszZip(zip, wpisy)).toEqual({ ok: false, powod: 'za_duze' });
    expect(existsSync(zip)).toBe(false);
  });

  test('65 535 wpisów mieści się (granica) i czyta się z powrotem', () => {
    const k = katalogTymczasowy();
    const zip = join(k, 'granica.oczko');
    const wpisy = Array.from({ length: 65_535 }, (_, i) => ({ nazwa: `p/${i}`, dane: new Uint8Array(0) }));
    expect(zapiszZip(zip, wpisy)).toEqual({ ok: true, wartosc: undefined });
    expect(czytajKatalog(zip)?.length).toBe(65_535);
  });

  test('plik wpisu ≥ 4 GiB (plik rzadki, bez czytania) → za_duze, pliku archiwum nie ma', () => {
    const k = katalogTymczasowy();
    const duzy = join(k, 'rzadki.bin');
    writeFileSync(duzy, '');
    truncateSync(duzy, 2 ** 32);
    const zip = join(k, 'duzy.oczko');
    expect(zapiszZip(zip, [{ nazwa: 'oczko.db', plik: duzy }])).toEqual({ ok: false, powod: 'za_duze' });
    expect(existsSync(zip)).toBe(false);
  });

  test('wpis z bitem szyfrowania (bit 0) albo lokalizator ZIP64 → katalog odrzucony (null)', () => {
    const k = katalogTymczasowy();
    const zip = join(k, 'a.oczko');
    zapiszZip(zip, [{ nazwa: 'manifest.json', dane: new TextEncoder().encode('{}') }]);
    const kat = czytajKatalog(zip);
    expect(kat?.length).toBe(1);
    const b = readFileSync(zip);
    const cd = b.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    const szyfrowany = Buffer.from(b);
    szyfrowany.writeUInt16LE(szyfrowany.readUInt16LE(cd + 8) | 1, cd + 8);
    writeFileSync(join(k, 'szyfr.oczko'), szyfrowany);
    expect(czytajKatalog(join(k, 'szyfr.oczko'))).toBeNull();
    const eocd = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    const lokalizator = Buffer.alloc(20); // APPNOTE 4.3.15: lokalizator końca katalogu ZIP64 przed końcem katalogu
    lokalizator.writeUInt32LE(0x07064b50, 0);
    const zip64 = Buffer.concat([b.subarray(0, eocd), lokalizator, b.subarray(eocd)]);
    writeFileSync(join(k, 'zip64.oczko'), zip64);
    expect(czytajKatalog(join(k, 'zip64.oczko'))).toBeNull();
  });
});
