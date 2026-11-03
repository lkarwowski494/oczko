// M1-audytor-generalny-026 (źródło 05-architekt-003; ARCH-22): pamięć uprawnień Pro (`pamiec-pro.json`, KP-06) i identyfikator urządzenia
// (`urzadzenie.txt`) zapisywane przez plik tymczasowy → odczyt kontrolny → przeniesienie (wzorzec `src/platforma/migawka.ts`), nie wprost
// do pliku docelowego (expo-file-system pisze bez `atomically`). Przerwany zapis (wyjątek po utworzeniu pliku tymczasowego) zostawia
// poprzednią treść. Zastępnik expo-file-system na prawdziwym dysku (tests/narzedzia/expo-file-system-node.ts).
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { File } from 'expo-file-system';
import { zapiszAtomowo, zapiszTekst } from '../../src/dane/pliki/system';
import { identyfikatorUrzadzenia, pamiecProWPliku } from '../../src/kompozycja/pliki-urzadzenia';
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
  const pliki = readFileSync(join(__dirname, '../../src/kompozycja/pliki-urzadzenia.ts'), 'utf8'); // odczyt i zapis obu plików (wydzielone z kontenera)
  expect(kontener).toMatch(/identyfikatorUrzadzenia\(katalogDanych,/);
  expect(kontener).toMatch(/pamiecProWPliku\(katalogDanych\)/);
  expect(kontener).not.toMatch(/pamiec-pro\.json|urzadzenie\.txt/);
  expect(pliki).not.toMatch(/zapiszTekst\(plikPro\b/);
  expect(pliki).not.toMatch(/zapiszTekst\(plik, nowy\)/);
  expect(pliki).toMatch(/zapiszAtomowo\(plikPro, t\)/);
  expect(pliki).toMatch(/zapiszAtomowo\(plik, nowy\)/);
});

// M1-audytor-generalny-096 (05-architekt-509; ARCH-22 „odzyskanie pliku tymczasowego przy starcie”): moveSync nie nadpisuje, więc
// zapiszAtomowo usuwa cel tuż przed przeniesieniem; proces ubity w tym oknie zostawia tylko `<cel>.tmp` (treść po odczycie kontrolnym).
/** Proces ubity po usunięciu celu, przed przeniesieniem `.tmp` → cel. */
function przerwijPrzeniesienie(): void {
  jest.spyOn(File.prototype, 'moveSync').mockImplementationOnce(() => { throw new Error('proces ubity przed przeniesieniem'); });
}
const ID_A = '0f8fad5b-d9cb-469f-a165-70867728950e', ID_B = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const PRO_A = '{"produkty":[],"wygasa":null}', PRO_B = '{"produkty":["oczko.pro.yearly"],"wygasa":1900000000000}';

describe('M1-audytor-generalny-096: odczyt przy starcie odzyskuje `.tmp`, gdy zapis przerwano między usunięciem celu a przeniesieniem', () => {
  test.each([
    ['pamiec-pro.json', PRO_A, PRO_B, (k: string) => pamiecProWPliku(k).czytaj()],
    ['urzadzenie.txt', ID_A, ID_B, (k: string) => identyfikatorUrzadzenia(k, () => 'ffffffff-ffff-4fff-bfff-ffffffffffff')],
  ] as const)('%s: cel usunięty, `.tmp` z ostatnią zapisaną treścią → odczyt zwraca tę treść, potem cel jest, `.tmp` nie', async (nazwa, stara, nowa, czytaj) => {
    const k = katalogTymczasowy('oczko-atomowo-');
    const cel = join(k, nazwa);
    zapiszAtomowo(cel, stara);
    przerwijPrzeniesienie();
    expect(() => zapiszAtomowo(cel, nowa)).toThrow('proces ubity');
    jest.restoreAllMocks();
    const przed = readdirSync(k).sort();
    expect(przed).toEqual([`${nazwa}.tmp`]); // stan po przerwaniu: 0 plików docelowych, 1 tymczasowy
    expect(readFileSync(`${cel}.tmp`, 'utf8')).toBe(nowa);
    expect(await czytaj(k)).toBe(nowa);
    expect(readdirSync(k).sort()).toEqual([nazwa]); // po odczycie: 1 plik docelowy, 0 tymczasowych
    expect(readFileSync(cel, 'utf8')).toBe(nowa);
  });

  test('urzadzenie.txt: niepełny `.tmp` z przerwanego pierwszego zapisu (bez celu) → nowy identyfikator jak przy pierwszym starcie, bez `.tmp`', async () => {
    const k = katalogTymczasowy('oczko-atomowo-');
    writeFileSync(join(k, 'urzadzenie.txt.tmp'), ID_A.slice(0, 17));
    expect(await identyfikatorUrzadzenia(k, () => ID_B)).toBe(ID_B);
    expect(readdirSync(k)).toEqual(['urzadzenie.txt']);
    expect(readFileSync(join(k, 'urzadzenie.txt'), 'utf8')).toBe(ID_B);
  });

  test('cel i `.tmp` naraz (przerwanie przed usunięciem celu) → odczyt celu', async () => {
    const k = katalogTymczasowy('oczko-atomowo-');
    zapiszAtomowo(join(k, 'pamiec-pro.json'), PRO_A);
    writeFileSync(join(k, 'pamiec-pro.json.tmp'), PRO_B.slice(0, 10));
    expect(await pamiecProWPliku(k).czytaj()).toBe(PRO_A);
  });
});
