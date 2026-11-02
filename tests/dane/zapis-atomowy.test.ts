// M1-audytor-generalny-026 (źródło 05-architekt-003; ARCH-22): pamięć uprawnień Pro (`pamiec-pro.json`, KP-06) i identyfikator urządzenia
// (`urzadzenie.txt`) zapisywane przez plik tymczasowy → odczyt kontrolny → przeniesienie (wzorzec `src/platforma/migawka.ts`), nie wprost
// do pliku docelowego (expo-file-system pisze bez `atomically`). Przerwany zapis (wyjątek po utworzeniu pliku tymczasowego) zostawia
// poprzednią treść. Zastępnik expo-file-system na prawdziwym dysku (tests/narzedzia/expo-file-system-node.ts).
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { File } from 'expo-file-system';
import { zapiszAtomowo, zapiszTekst } from '../../src/dane/pliki/system';
import { katalogTymczasowy } from './pomocnicze/srodowisko';

afterEach(() => jest.restoreAllMocks());

/** Zapis przerwany w połowie: połowa treści trafia do pliku, potem wyjątek (pełny dysk, ubity proces). */
function przerwijZapis(): void {
  const prawdziwy = File.prototype.write;
  jest.spyOn(File.prototype, 'write').mockImplementation(function (this: File, tresc: string | Uint8Array) {
    prawdziwy.call(this, typeof tresc === 'string' ? tresc.slice(0, Math.floor(tresc.length / 2)) : tresc.slice(0, tresc.length >> 1));
    throw new Error('ENOSPC');
  });
}

test.each(['pamiec-pro.json', 'urzadzenie.txt'])('%s: przerwany zapis zostawia poprzednią treść i nie zostawia pliku tymczasowego pod nazwą docelową', (nazwa) => {
  const k = katalogTymczasowy('oczko-atomowo-');
  const cel = join(k, nazwa);
  writeFileSync(cel, 'poprzednia-tresc-0123456789');
  expect(typeof zapiszAtomowo).toBe('function');
  przerwijZapis();
  expect(() => zapiszAtomowo(cel, 'nowa-tresc-abcdefghijklmnopqrstuvwxyz')).toThrow();
  expect(readFileSync(cel, 'utf8')).toBe('poprzednia-tresc-0123456789');
});

test('próbka negatywna (test potrafi paść): ten sam przerwany zapis wprost do pliku docelowego (zapiszTekst) psuje poprzednią treść', () => {
  const cel = join(katalogTymczasowy('oczko-atomowo-'), 'pamiec-pro.json');
  writeFileSync(cel, 'poprzednia-tresc-0123456789');
  przerwijZapis();
  expect(() => zapiszTekst(cel, 'nowa-tresc-abcdefghijklmnopqrstuvwxyz')).toThrow();
  expect(readFileSync(cel, 'utf8')).not.toBe('poprzednia-tresc-0123456789');
});

test('udany zapis: nowa treść pod nazwą docelową, bez pozostałego pliku tymczasowego; zapis bez poprzedniego pliku', () => {
  const k = katalogTymczasowy('oczko-atomowo-');
  const cel = join(k, 'pamiec-pro.json');
  zapiszAtomowo(cel, '{"produkty":[]}');
  expect(readFileSync(cel, 'utf8')).toBe('{"produkty":[]}');
  zapiszAtomowo(cel, '{"produkty":["oczko.pro.yearly"]}');
  expect(readFileSync(cel, 'utf8')).toBe('{"produkty":["oczko.pro.yearly"]}');
  expect(readdirSync(k)).toEqual(['pamiec-pro.json']);
  expect(existsSync(`${cel}.tmp`)).toBe(false);
});

test('trwała kontrola: kontener zapisuje pamięć Pro i identyfikator urządzenia tylko przez zapiszAtomowo', () => {
  const kontener = readFileSync(join(__dirname, '../../src/kompozycja/kontener.ts'), 'utf8');
  expect(kontener).not.toMatch(/zapiszTekst\(plikPro\b/);
  expect(kontener).not.toMatch(/zapiszTekst\(plik, nowy\)/);
  expect(kontener).toMatch(/zapiszAtomowo\(plikPro, t\)/);
  expect(kontener).toMatch(/zapiszAtomowo\(plik, nowy\)/);
});
