// M1-audytor-generalny-113 (08-programista-516; DEC-31 b): wolne miejsce z platformy jest daną z zewnątrz (zasada programisty 10) — brak odczytu
// (`null` z `Paths.availableDiskSpace: Int64?`, wartość spoza liczb) albo wyjątek to „nie wiadomo”, nie „brak miejsca”: otwarcie wzoru bez ostrzeżenia.
// Wyrocznia: komentarz kontraktu `ostrzezenieMiejsca` („Błąd odczytu: bez ostrzeżenia”) i test akceptacyjny planu M1 (mutant M6: wyjątek → ostrzeżenie).
import { Alert } from 'react-native';
import { Paths } from 'expo-file-system';
import { ostrzezenieMiejsca } from '../../src/kompozycja/wzor-rysunki';
import { wolneMiejsce } from '../../src/dane/pliki/system';
import { RYSUNEK_MIEJSCE_MIN_MB } from '../../src/konfiguracja';

const t = (k: string) => k;
let alert: jest.SpyInstance;
beforeEach(() => { alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined); });
afterEach(() => jest.restoreAllMocks());

describe('M1-113: ostrzezenieMiejsca przy braku odczytu', () => {
  test('wolneMiejsce → null (system nie podał) → false, bez alertu', async () => {
    expect(await ostrzezenieMiejsca({ wolneMiejsce: async () => null }, t)).toBe(false);
    expect(alert).not.toHaveBeenCalled();
  });
  test('wolneMiejsce rzuca → false, bez alertu (mutant M6: wyjątek → ostrzeżenie)', async () => {
    expect(await ostrzezenieMiejsca({ wolneMiejsce: async () => { throw new Error('attributesOfFileSystem'); } }, t)).toBe(false);
    expect(alert).not.toHaveBeenCalled();
  });
  test('liczba poniżej progu → true, jeden alert (granica bez zmian)', async () => {
    expect(await ostrzezenieMiejsca({ wolneMiejsce: async () => RYSUNEK_MIEJSCE_MIN_MB * 1024 * 1024 - 1 }, t)).toBe(true);
    expect(alert).toHaveBeenCalledTimes(1);
  });
});

describe('M1-113: wolneMiejsce w src/dane/pliki/system.ts parsuje wartość platformy z unknown', () => {
  const zPlatformy = (v: unknown) => jest.spyOn(Paths, 'availableDiskSpace', 'get').mockReturnValue(v as number);
  test.each([[null], [undefined], [Number.NaN], [Number.POSITIVE_INFINITY], [-1], ['123']])('%p → null (nie wiadomo)', (v) => {
    zPlatformy(v);
    expect(wolneMiejsce()).toBeNull();
  });
  test('liczba skończona ≥ 0 → ta sama liczba', () => {
    zPlatformy(0);
    expect(wolneMiejsce()).toBe(0);
    zPlatformy(123456789);
    expect(wolneMiejsce()).toBe(123456789);
  });
});
