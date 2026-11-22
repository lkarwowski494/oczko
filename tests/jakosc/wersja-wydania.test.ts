/* P-300, P-306 (B), P-519: wersja pierwszego wydania publicznego to 1.0.0; app.json i package.json(-lock) zgodne (scripts/verify-native.mjs:33).
   Numer buildu osobno: CFBundleVersion nadaje testflight.yml (ADR-0014, run_number × 10 + run_attempt + PRZESUNIECIE > 1004 z 0.1.0). */
import * as fs from 'fs';
import * as path from 'path';

const czytaj = (p: string): unknown => JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8'));
const pole = (o: unknown, k: string): unknown => (typeof o === 'object' && o !== null && k in o ? (o as Record<string, unknown>)[k] : undefined);

test('P-306: app.json expo.version = 1.0.0', () => {
  expect(pole(pole(czytaj('app.json'), 'expo'), 'version')).toBe('1.0.0');
});

test('P-306: package.json i package-lock.json (korzeń i pakiet "") zgodne z app.json (verify-native)', () => {
  const lock = czytaj('package-lock.json');
  expect([pole(czytaj('package.json'), 'version'), pole(lock, 'version'), pole(pole(pole(lock, 'packages'), ''), 'version')]).toEqual(['1.0.0', '1.0.0', '1.0.0']);
});
