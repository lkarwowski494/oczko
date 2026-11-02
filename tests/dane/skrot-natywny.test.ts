// M1-audytor-generalny-017 (źródło 08-programista-003; P-130): na urządzeniu SHA-256 plików liczy natywny `sha256Pliku` modułu
// OczkoDziennikPlus (strumieniowo w Swift), nie TS na wątku JS. Atrapa modułu natywnego liczy wywołania; magazyn, archiwum (sprawdzenie
// pliku z archiwum) i kopia surowa ekranu awaryjnego dostają skrót z adaptera platformy. Kompozycji (kontener, start) nie da się zbudować
// w Node (moduły natywne), więc jej podłączenie sprawdza trwała kontrola źródła.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzMagazyn } from '../../src/dane/pliki/magazyn';
import { zipSurowejKopii } from '../../src/niezawodnosc/kopie';
import { katalogTymczasowy } from './pomocnicze/srodowisko';

const SKROT = 'ab'.repeat(32);
const mockSha = jest.fn(async (_sciezka: string) => SKROT);
jest.mock('../../modules/oczko-dziennik-plus', () => ({ natywny: () => ({ sha256Pliku: (s: string) => mockSha(s) }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const platforma = require('../../src/platforma/dziennik-plus') as { skrotPliku?: (s: string) => Promise<string> };
/* eslint-enable @typescript-eslint/no-require-imports */

beforeEach(() => mockSha.mockClear());

test('adapter platformy `skrotPliku` woła natywny sha256Pliku z tą samą ścieżką', async () => {
  expect(typeof platforma.skrotPliku).toBe('function');
  await expect(platforma.skrotPliku?.('/x/plik.pdf')).resolves.toBe(SKROT);
  expect(mockSha).toHaveBeenCalledWith('/x/plik.pdf');
});

test('magazyn ze skrótem platformy: zapis nazywa plik skrótem natywnym (TS nie liczy)', async () => {
  const k = katalogTymczasowy('oczko-skrot-');
  const zrodlo = join(k, 'wzor.pdf');
  writeFileSync(zrodlo, '%PDF-1.7 próbka');
  const m = utworzMagazyn(join(k, 'pliki'), { skrot: platforma.skrotPliku });
  expect(await m.zapisz(zrodlo, 'pdf')).toMatchObject({ ok: true, wartosc: { sha256: SKROT } });
  expect(mockSha).toHaveBeenCalledTimes(1);
});

test('kopia surowa ekranu awaryjnego ze skrótem platformy: manifest ze skrótem natywnym', async () => {
  const k = katalogTymczasowy('oczko-skrot-');
  writeFileSync(join(k, 'oczko.db'), 'SQLite format 3\0'.padEnd(120, '\0'));
  const w = await zipSurowejKopii(k, ['oczko.db'], join(k, 'kopia.zip'), { aplikacja: '1.0.0', build: '1', terazMs: 0, skrot: platforma.skrotPliku });
  expect(w).toMatchObject({ ok: true, wartosc: { pliki: [{ nazwa: 'oczko.db', sha256: SKROT }] } });
  expect(mockSha).toHaveBeenCalledTimes(1);
});

test('trwała kontrola: kompozycja podaje skrotPliku do magazynu, archiwum i kopii surowej', () => {
  const kontener = readFileSync(join(__dirname, '../../src/kompozycja/kontener.ts'), 'utf8');
  const start = readFileSync(join(__dirname, '../../src/kompozycja/start-aplikacji.ts'), 'utf8');
  expect(kontener).toMatch(/utworzMagazyn\(s\.pliki, \{ skrot: skrotPliku \}\)/);
  expect(kontener).toMatch(/utworzArchiwum\(\{[^}]*skrot: skrotPliku[^}]*\}\)/);
  expect(start).toMatch(/zipSurowejKopii\([^;]*skrot: skrotPliku/);
});
