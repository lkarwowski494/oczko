/* 04-studio-projektowe-001 / P1-001: krój tytułowy Libre Franklin (design-spec.md:13) jest ładowany natywnie (plugin expo-font, iOS: nazwa rodziny z pliku),
 * a `KROJ_TYTULOWY` wskazuje tę rodzinę. Plik w aplikacji = plik z docs/design/fonty; licencja OFL obok. Wygląd na urządzeniu: zrzut licznika w przebiegu e2e. */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { KROJ_TYTULOWY, typografia } from '../../src/ekrany/motyw';

const KORZEN = path.join(__dirname, '..', '..');
const sha = (p: string): string => crypto.createHash('sha256').update(fs.readFileSync(path.join(KORZEN, p))).digest('hex');

test('P1-001: app.json ładuje LibreFranklin.ttf pluginem expo-font (iOS), plik istnieje i jest taki sam jak w docs/design/fonty', () => {
  const app = JSON.parse(fs.readFileSync(path.join(KORZEN, 'app.json'), 'utf8')) as { expo: { plugins: unknown[] } };
  const wpis = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-font') as [string, { ios?: { fonts?: string[] } }] | undefined;
  expect(wpis?.[1].ios?.fonts).toEqual(['./assets/fonts/LibreFranklin.ttf']);
  expect(sha('assets/fonts/LibreFranklin.ttf')).toBe(sha('docs/design/fonty/LibreFranklin.ttf'));
});

test('P1-001: licencja OFL kroju leży obok pliku w aplikacji', () => {
  expect(sha('assets/fonts/librefranklin-OFL.txt')).toBe(sha('docs/design/fonty/librefranklin-OFL.txt'));
});

test('P1-001: KROJ_TYTULOWY = „Libre Franklin”; liczba, tytuł i przycisk używają go w wadze 700 (reszta tekstu: krój systemowy)', () => {
  expect(KROJ_TYTULOWY).toBe('Libre Franklin');
  for (const s of [typografia.liczba, typografia.tytul, typografia.instrukcja, typografia.przycisk]) expect(s).toMatchObject({ fontFamily: 'Libre Franklin', fontWeight: '700' });
  expect(typografia.tresc).not.toHaveProperty('fontFamily');
});
