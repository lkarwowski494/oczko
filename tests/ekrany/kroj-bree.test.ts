/* M3 p1 (P-553, P-563 (9), M3-S3-04; zastępuje kroj-tytulowy.test.ts kroju Libre Franklin): krój tytułowy Bree Serif (OFL, Reserved Font Name „Bree”) jako plik STATYCZNY
 * bez przycinania (ten sam plik co docs/design/fonty/BreeSerif.ttf), ładowany natywnie pluginem expo-font; `KROJ_TYTULOWY` = rodzina z tokenów.
 * Zachowanie z poprzedniego testu: plik statyczny (bez fvar), nazwa rodziny = KROJ_TYTULOWY, plugin w app.json, licencja obok, treść krojem systemowym. */
import * as fs from 'fs';
import * as path from 'path';
import { KROJ_TYTULOWY, typografia } from '../../src/ekrany/motyw';

const KORZEN = path.join(__dirname, '..', '..');
const PLIK = 'assets/fonts/BreeSerif.ttf';

/** Minimalny odczyt sfnt: tablice (tag → offset), usWeightClass z OS/2 i napisy z tablicy `name` (Windows/Unicode BMP, UTF-16BE). */
function odczytaj(buf: Buffer): { tablice: string[]; waga: number; nazwy: Record<number, string> } {
  const n = buf.readUInt16BE(4);
  const wpisy = new Map<string, { off: number; len: number }>();
  for (let i = 0; i < n; i++) { const o = 12 + i * 16; wpisy.set(buf.toString('latin1', o, o + 4), { off: buf.readUInt32BE(o + 8), len: buf.readUInt32BE(o + 12) }); }
  const os2 = wpisy.get('OS/2'), nm = wpisy.get('name');
  if (!os2 || !nm) throw new Error('brak OS/2 albo name');
  const nazwy: Record<number, string> = {};
  const licz = buf.readUInt16BE(nm.off + 2), strOff = nm.off + buf.readUInt16BE(nm.off + 4);
  for (let i = 0; i < licz; i++) {
    const r = nm.off + 6 + i * 12;
    if (buf.readUInt16BE(r) !== 3) continue; // platforma Windows
    const id = buf.readUInt16BE(r + 6), dl = buf.readUInt16BE(r + 8), of = buf.readUInt16BE(r + 10);
    const b = Buffer.from(buf.subarray(strOff + of, strOff + of + dl)).swap16();
    nazwy[id] = b.toString('utf16le');
  }
  return { tablice: [...wpisy.keys()], waga: buf.readUInt16BE(os2.off + 4), nazwy };
}

test('plik kroju jest statyczny (bez fvar), waga 400, rodzina = KROJ_TYTULOWY, styl Regular, jedna odmiana', () => {
  const f = odczytaj(fs.readFileSync(path.join(KORZEN, PLIK)));
  expect(f.tablice).not.toContain('fvar');
  expect(f.waga).toBe(400);
  expect(f.nazwy[1]).toBe(KROJ_TYTULOWY);
  expect(f.nazwy[2]).toBe('Regular');
  expect(f.nazwy[6]).toBe('BreeSerif-Regular');
});

test('plik w aplikacji = plik projektu bez przycinania (te same bajty co docs/design/fonty/BreeSerif.ttf; Reserved Font Name zabrania zmiany nazwy po zmianie pliku)', () => {
  expect(fs.readFileSync(path.join(KORZEN, PLIK)).equals(fs.readFileSync(path.join(KORZEN, 'docs/design/fonty/BreeSerif.ttf')))).toBe(true);
});

test('app.json ładuje ten plik pluginem expo-font (iOS); w aplikacji nie ma starego kroju', () => {
  const app = JSON.parse(fs.readFileSync(path.join(KORZEN, 'app.json'), 'utf8')) as { expo: { plugins: unknown[] } };
  const wpis = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-font') as [string, { ios?: { fonts?: string[] } }] | undefined;
  expect(wpis?.[1].ios?.fonts).toEqual(['./' + PLIK]);
  expect(fs.existsSync(path.join(KORZEN, 'assets/fonts/LibreFranklin-Bold.ttf'))).toBe(false);
});

test('licencja OFL kroju leży obok pliku w aplikacji i jest identyczna z projektową', () => {
  expect(fs.readFileSync(path.join(KORZEN, 'assets/fonts/breeserif-OFL.txt'), 'utf8')).toBe(fs.readFileSync(path.join(KORZEN, 'docs/design/fonty/breeserif-OFL.txt'), 'utf8'));
});

test('KROJ_TYTULOWY = „Bree Serif” (tokeny kroje.tytul.rodzina); duży tytuł, tytuł i liczby używają go w jednej odmianie, treść i „+1” krojem systemowym', () => {
  expect(KROJ_TYTULOWY).toBe('Bree Serif');
  for (const s of [typografia.liczba, typografia.liczbaPaska, typografia.tytul, typografia.duzyTytul]) expect(s).toMatchObject({ fontFamily: 'Bree Serif', fontWeight: '400' });
  expect(typografia.tresc).not.toHaveProperty('fontFamily');
  expect(typografia.przycisk).not.toHaveProperty('fontFamily');
});
