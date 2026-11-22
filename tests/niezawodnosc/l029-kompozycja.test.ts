// P-271 (L-029 Treningu): prawdziwy kod startu (`src/kompozycja/start-aplikacji.ts`) na prawdziwym dysku, jak cwiczenia.test.ts.
// Świeża instalacja = pusty katalog Library (brak bazy, kopii i stanu startu). Wyjście do tła = `zapiszWyjscieDoTla` (app/_layout.tsx, AppState „background”).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { rozpocznijStart, trybAwaryjny, zapiszEtap, zapiszKamien, zapiszWyjscieDoTla } from '../../src/kompozycja/start-aplikacji';
import { diagnostykaAwaryjna } from '../../src/kompozycja/zgloszenie-awaryjne';
import { katalogTymczasowy } from '../dane/pomocnicze/srodowisko';

let mockBiblioteka = '';
jest.mock('../../src/dane/pliki/system', () => ({ ...jest.requireActual('../../src/dane/pliki/system'), katalogBiblioteki: () => mockBiblioteka }));
function swiezaInstalacja(): void {
  mockBiblioteka = join(katalogTymczasowy('oczko-l029-'), 'Library');
  mkdirSync(join(mockBiblioteka, 'Application Support'), { recursive: true });
}
const SR = { wersja: '1.0.0 (1)', system: 'iOS 26.1', model: 'iPhone17,1' };

test('L-029 (2): reinstalacja → otwarcie → natychmiastowe wyjście do tła → ponowne otwarcie (×3) → zawsze start normalny', async () => {
  swiezaInstalacja();
  for (let i = 0; i < 3; i++) {
    expect(await rozpocznijStart()).toEqual({ tryb: 'normalny' });
    await zapiszWyjscieDoTla(); // proces ubity w tle przed kamieniem
  }
  expect(await rozpocznijStart()).toEqual({ tryb: 'normalny' });
});

test('L-029 (2): po kamieniu tło nic nie zmienia; awaria na pierwszym planie (bez tła) dalej liczona → trzeci start awaryjny', async () => {
  swiezaInstalacja();
  await rozpocznijStart(); await zapiszKamien(); await zapiszWyjscieDoTla();
  expect(await rozpocznijStart()).toEqual({ tryb: 'normalny' });
  expect(await rozpocznijStart()).toEqual({ tryb: 'normalny' });
  expect(await rozpocznijStart()).toEqual({ tryb: 'awaryjny', powod: 'petla-startow' });
});

test('L-029 (3): „Zgłoś problem” w trybie awaryjnym podaje etap, do którego doszedł ostatni start normalny', async () => {
  swiezaInstalacja();
  await rozpocznijStart(); zapiszEtap('kontener'); // awaria po otwarciu bazy, przed pierwszym ekranem
  await rozpocznijStart(); zapiszEtap('kontener');
  expect((await rozpocznijStart()).tryb).toBe('awaryjny');
  const a = trybAwaryjny();
  await a.kopia;
  const d = await diagnostykaAwaryjna({ powod: 'petla-startow', nieudaneStarty: a.nieudaneStarty, etap: a.etapPoprzedniegoStartu, bledy: async () => [], srodowisko: SR });
  expect(d.find((x) => x.pole === 'bledy')?.wartosc).toMatch(/^safe_mode=petla-startow failed_starts=2 boot_phase=kontener boot_ms=\d+\n/);
});

// Podłączenie w korzeniu (bez testu renderu korzenia w repo; precedens: tests/domena/wzor/orientacja-ekranu.test.ts czyta app/_layout.tsx).
describe('L-029 podłączenie (app/_layout.tsx, EkranAwaryjny)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  const korzen = fs.readFileSync('app/_layout.tsx', 'utf8');
  const normalny = korzen.slice(korzen.indexOf('async function normalny'), korzen.indexOf('async function start'));
  test('(2) start normalny słucha AppState „background” → zapiszWyjscieDoTla; nasłuch zdjęty przy sprzątaniu efektu', () => {
    expect(normalny).toMatch(/AppState\.addEventListener\('change', \(st\) => \{ if \(st === 'background'\) void zapiszWyjscieDoTla\(\); \}\)/);
    expect(korzen).toMatch(/koniecTla\?\.\(\)/);
  });
  test('(3) etap „kontener” zapisany po udanym utworzKontener, przed pierwszym ekranem', () => {
    expect(normalny.indexOf("zapiszEtap('kontener')")).toBeGreaterThan(normalny.indexOf('if (!w || !w.ok)'));
    expect(normalny.indexOf("zapiszEtap('kontener')")).toBeLessThan(normalny.indexOf("rodzaj: 'gotowe'"));
  });
  test('(3) „Zgłoś problem” w trybie awaryjnym dostaje etap', () => {
    expect(fs.readFileSync('src/kompozycja/EkranAwaryjny.tsx', 'utf8')).toMatch(/etap: a\.etapPoprzedniegoStartu/);
  });
});
