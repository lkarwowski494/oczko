// Zdjęcie testowe buildu E2E: dekoder base64 daje prawidłowy JPEG (znacznik SOI/EOI) z blokiem EXIF (APP1) — scenariusze 17, 42.
import { zBase64 } from '../../src/kompozycja/e2e-zdjecie';

test('base64 → bajty jak Buffer z Node; JPEG zaczyna się FF D8 i ma APP1 Exif', () => {
  expect(Array.from(zBase64('TWFu'))).toEqual(Array.from(Buffer.from('TWFu', 'base64')));
  expect(Array.from(zBase64('TWE='))).toEqual(Array.from(Buffer.from('TWE=', 'base64')));
  const src = require('node:fs').readFileSync(require.resolve('../../src/kompozycja/e2e-zdjecie.ts'), 'utf8') as string;
  const b64 = /JPEG_B64 = '([^']+)'/.exec(src)?.[1] ?? '';
  const b = zBase64(b64);
  expect(Array.from(b)).toEqual(Array.from(Buffer.from(b64, 'base64')));
  expect([b[0], b[1], b[b.length - 2], b[b.length - 1]]).toEqual([0xff, 0xd8, 0xff, 0xd9]);
  expect(Buffer.from(b).includes(Buffer.from('Exif'))).toBe(true);
});
