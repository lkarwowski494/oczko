/* 04-studio-projektowe-001 / P1-001 (plan B, P-306): krój tytułowy Libre Franklin Bold jako plik STATYCZNY (instancja wght 700 pliku zmiennego z docs/design/fonty),
 * bo iOS z pliku zmiennego potrafi wziąć domyślną instancję (Thin) mimo fontWeight. Ładowany natywnie pluginem expo-font (iOS: nazwa rodziny z pliku);
 * `KROJ_TYTULOWY` = ta rodzina. Licencja OFL obok pliku. Wygląd na urządzeniu: zrzut licznika w przebiegu e2e. */
import * as fs from 'fs';
import * as path from 'path';
import { KROJ_TYTULOWY, typografia } from '../../src/ekrany/motyw';

const KORZEN = path.join(__dirname, '..', '..');
const PLIK = 'assets/fonts/LibreFranklin-Bold.ttf';

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

test('P1-001: plik kroju jest statyczny (bez fvar), wagi 700, rodzina = KROJ_TYTULOWY, styl Bold', () => {
  const f = odczytaj(fs.readFileSync(path.join(KORZEN, PLIK)));
  expect(f.tablice).not.toContain('fvar');
  expect(f.waga).toBe(700);
  expect(f.nazwy[1]).toBe(KROJ_TYTULOWY);
  expect(f.nazwy[2]).toBe('Bold');
  expect(f.nazwy[6]).toBe('LibreFranklin-Bold');
});

test('P1-001: app.json ładuje ten plik pluginem expo-font (iOS); w aplikacji nie ma pliku zmiennego', () => {
  const app = JSON.parse(fs.readFileSync(path.join(KORZEN, 'app.json'), 'utf8')) as { expo: { plugins: unknown[] } };
  const wpis = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-font') as [string, { ios?: { fonts?: string[] } }] | undefined;
  expect(wpis?.[1].ios?.fonts).toEqual(['./' + PLIK]);
  expect(fs.existsSync(path.join(KORZEN, 'assets/fonts/LibreFranklin.ttf'))).toBe(false);
});

test('P1-001: licencja OFL kroju leży obok pliku w aplikacji, instancja ma ślad pochodzenia (plan B: generator w scripts/design)', () => {
  expect(fs.readFileSync(path.join(KORZEN, 'assets/fonts/librefranklin-OFL.txt'), 'utf8')).toBe(fs.readFileSync(path.join(KORZEN, 'docs/design/fonty/librefranklin-OFL.txt'), 'utf8'));
  expect(fs.existsSync(path.join(KORZEN, 'scripts/design/instancja-kroju.py'))).toBe(true);
});

test('P1-001: KROJ_TYTULOWY = „Libre Franklin”; liczba, tytuł i przycisk używają go w wadze 700 (reszta tekstu: krój systemowy)', () => {
  expect(KROJ_TYTULOWY).toBe('Libre Franklin');
  for (const s of [typografia.liczba, typografia.tytul, typografia.instrukcja, typografia.przycisk]) expect(s).toMatchObject({ fontFamily: 'Libre Franklin', fontWeight: '700' });
  expect(typografia.tresc).not.toHaveProperty('fontFamily');
});
