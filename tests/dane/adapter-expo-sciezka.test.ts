// Ścieżka bazy na urządzeniu (ADR-0001: Library/Application Support/oczko.db): katalog ze spacją musi trafić do expo-sqlite jako URI `file://`,
// inaczej moduł natywny otwiera „Application%20Support” (E2E 40298771854: puste liczności eksportu i brak SHA bazy). Zastępnik odwzorowuje to zachowanie.
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { katalogJakoUri, otworzPortExpo } from '../../src/dane/baza/adapter-expo';

test('katalog „Application Support” → plik bazy pod tą ścieżką, nie pod „Application%20Support”', async () => {
  const lib = mkdtempSync(join(tmpdir(), 'oczko-lib-'));
  const as = join(lib, 'Application Support');
  mkdirSync(as);
  const port = otworzPortExpo(join(as, 'oczko.db'));
  await port.run('CREATE TABLE t (x INTEGER)');
  await port.zamknij();
  expect(existsSync(join(as, 'oczko.db'))).toBe(true);
  expect(existsSync(join(lib, 'Application%20Support'))).toBe(false);
});

test('katalogJakoUri koduje spację i znaki spoza URL', () => {
  expect(katalogJakoUri('/var/x/Library/Application Support')).toBe('file:///var/x/Library/Application%20Support');
});
