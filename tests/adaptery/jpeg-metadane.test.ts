// P-219 (2A): zdjęcia zapisane bez metadanych i GPS. Druga kontrola po przekodowaniu natywnym (expo-image-manipulator): z JPEG znikają
// segmenty APP1 i APP3–APP15 (Exif z GPS, XMP, MPF i inne) oraz komentarze COM; zostaje APP0 (JFIF) i APP2 tylko z profilem kolorów
// ICC_PROFILE (bez danych osobowych, bez niego kolory P3 by się przesunęły). Obraz (SOF, DQT, DHT, SOS i dane) bez zmian. Wzorzec: zdjęcie testowe buildu E2E z EXIF GPS (src/kompozycja/e2e-zdjecie.ts).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { maMetadane, usunMetadaneJpeg } from '../../src/dane/pliki/jpeg';
import { zBase64 } from '../../src/kompozycja/e2e-zdjecie';

const zrodlo = readFileSync(join(__dirname, '../../src/kompozycja/e2e-zdjecie.ts'), 'utf8');
const ZGPS = zBase64(/JPEG_B64 = '([^']+)'/.exec(zrodlo)?.[1] ?? '');
const segmenty = (b: Uint8Array) => { const s: number[] = []; let i = 2; while (i + 4 <= b.length && b[i] === 0xff) { const m = b[i + 1]!; s.push(m); if (m === 0xda) break; i += 2 + ((b[i + 2]! << 8) | b[i + 3]!); } return s; };

test('wzorzec z GPS ma metadane (APP1 Exif); po usunięciu: bez APP1 i bez napisu Exif, JPEG od SOI do EOI, dane obrazu te same', () => {
  expect(maMetadane(ZGPS)).toBe(true);
  expect(segmenty(ZGPS)).toContain(0xe1);
  const c = usunMetadaneJpeg(ZGPS);
  expect(c).not.toBeNull();
  if (!c) return;
  expect(maMetadane(c)).toBe(false);
  expect(Buffer.from(c).includes(Buffer.from('Exif'))).toBe(false);
  expect(segmenty(c).filter((m) => (m >= 0xe1 && m <= 0xef && m !== 0xe2) || m === 0xfe)).toEqual([]);
  expect([c[0], c[1], c[c.length - 2], c[c.length - 1]]).toEqual([0xff, 0xd8, 0xff, 0xd9]);
  const sos = (b: Uint8Array) => Buffer.from(b).subarray(Buffer.from(b).indexOf(Buffer.from([0xff, 0xda])));
  expect(sos(c).equals(sos(ZGPS))).toBe(true);
  expect(usunMetadaneJpeg(c)).toEqual(c); // drugi raz bez zmian
});

test('nie-JPEG (PNG, pusty, ucięty) → null: zapis odrzucony zamiast pliku z metadanymi', () => {
  expect(usunMetadaneJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
  expect(usunMetadaneJpeg(new Uint8Array())).toBeNull();
  expect(usunMetadaneJpeg(ZGPS.subarray(0, 30))).toBeNull();
});
