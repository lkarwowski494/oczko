// M1-audytor-generalny-075 (12-niezawodnosc-007; ADR-0008: dziennik +1 to dane użytkownika do scalenia; ADR-0020 (3); zasada wspólna 10 — kopia
// kompletna): tryb awaryjny nie scala dziennika +1 z ekranu blokady i zegarka do bazy, więc ZIP surowej kopii („Zapisz kopię danych”, gdy baza się
// nie otwiera albo archiwum zawodzi) musi zawierać plik dziennika z SHA-256 w manifeście. Prawdziwy kod trybu awaryjnego
// (`src/kompozycja/start-aplikacji.ts`) na prawdziwym dysku i SQLite (zastępniki z jest.config.js), na kopii instalacji w katalogu tymczasowym.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { rozpocznijStart, trybAwaryjny } from '../../src/kompozycja/start-aplikacji';
import type { ManifestSurowejKopii } from '../../src/niezawodnosc/kopie';
import { czytajZip, licznosciPliku, zycie } from '../dane/pomocnicze/dane-wejsciowe';
import { katalogTymczasowy, licznosci, przygotuj, sha256, sha256Pliku, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';

let mockBiblioteka = '';
let mockBladKopiiDziennika: Error | null = null;
jest.mock('../../src/dane/pliki/system', () => {
  const prawdziwy = jest.requireActual<typeof import('../../src/dane/pliki/system')>('../../src/dane/pliki/system');
  return {
    ...prawdziwy,
    katalogBiblioteki: () => mockBiblioteka,
    // M1-156: błąd kopii samego dziennika +1 (migawka obok ZIP-a); pliki bazy kopiowane jak zwykle.
    kopiuj: (zrodlo: string, cel: string) => {
      if (mockBladKopiiDziennika && zrodlo.endsWith('dziennik-plus.jsonl')) throw mockBladKopiiDziennika;
      prawdziwy.kopiuj(zrodlo, cel);
    },
  };
});
// SHA-256 pliku: na urządzeniu natywnie (P-130), w Node wzorzec TS (ten sam wynik, tests/niezawodnosc/kopie.test.ts).
jest.mock('../../src/platforma/dziennik-plus', () => ({
  skrotPliku: (p: string) => jest.requireActual<typeof import('../../src/dane/pliki/magazyn')>('../../src/dane/pliki/magazyn').sha256PlikuTs(p),
}));

const PLIKI = ['oczko.db', 'oczko.db-wal', 'oczko.db-shm'];
/** Trzy +1 z ekranu blokady i zegarka czekające na scalenie (ADR-0008), ostatnia linia bez końca wiersza (zapis w toku). */
const DZIENNIK = [
  { id: 'e1', licznikId: 'l1', rodzaj: 'plus', rodzice: [], czasMs: 1_792_000_000_000, strefa: 'Europe/Warsaw', dzien: '2026-10-21', zrodlo: 'ekran_blokady', pro: false },
  { id: 'e2', licznikId: 'l1', rodzaj: 'plus', rodzice: ['e1'], czasMs: 1_792_000_060_000, strefa: 'Europe/Warsaw', dzien: '2026-10-21', zrodlo: 'zegarek', pro: false },
  { id: 'e3', licznikId: 'l1', rodzaj: 'plus', rodzice: ['e2'], czasMs: 1_792_000_120_000, strefa: 'Europe/Warsaw', dzien: '2026-10-21', zrodlo: 'ekran_blokady', pro: false },
].map((z) => JSON.stringify(z)).join('\n');
const linie = (t: string) => t.split('\n').filter((l) => l.length > 0);

/** Instalacja z danymi, pętla awarii → tryb awaryjny; proces kończy się bez zamknięcia bazy (zapisy w -wal). */
async function trybAwaryjnyZDanymi(dziennik: string | null) {
  mockBiblioteka = join(katalogTymczasowy('oczko-075-'), 'Library');
  const as = join(mockBiblioteka, 'Application Support');
  mkdirSync(as, { recursive: true });
  const s = await przygotuj({ katalog: as });
  await s.baza.run('PRAGMA wal_autocheckpoint = 0');
  await wykonaj(s.baza, zycie({ pdf: wlozPlik(s.magazyn, 'a', 'pdf'), rys: wlozPlik(s.magazyn, 'b', 'pkdrawing'), jpg: wlozPlik(s.magazyn, 'c', 'jpg') }));
  const przed = await licznosci(s.baza);
  if (dziennik !== null) writeFileSync(join(as, 'dziennik-plus.jsonl'), dziennik);
  await rozpocznijStart(); await rozpocznijStart();
  expect((await rozpocznijStart()).tryb).toBe('awaryjny');
  const sha = () => [...PLIKI, 'dziennik-plus.jsonl'].filter((n) => existsSync(join(as, n))).map((n) => `${n}:${sha256Pliku(join(as, n))}`);
  return { as, przed, sha, a: trybAwaryjny() };
}
/** Baza z ZIP-a (trzy pliki surowej kopii) w osobnym katalogu: liczności, integrity_check, foreign_key_check. */
function bazaZZipa(zip: Map<string, Buffer>) {
  const k = katalogTymczasowy('oczko-075-zip-');
  for (const n of PLIKI) if (zip.has(n)) writeFileSync(join(k, n), zip.get(n)!);
  const db = new DatabaseSync(join(k, 'oczko.db'));
  const wynik = { integrity: db.prepare('PRAGMA integrity_check').all(), fk: db.prepare('PRAGMA foreign_key_check').all().length };
  db.close();
  return { ...wynik, licznosci: licznosciPliku(join(k, 'oczko.db')) };
}

test('M1-075: ZIP surowej kopii zawiera dziennik +1 z SHA-256 w manifeście; linie w ZIP = linie na urządzeniu; baza w ZIP kompletna', async () => {
  const { as, przed, sha, a } = await trybAwaryjnyZDanymi(DZIENNIK);
  const shaPrzed = sha();
  const cel = await a.zipSurowej();
  if (!cel) throw new Error('ZIP surowej kopii = null');
  const zip = czytajZip(cel);
  const manifest = JSON.parse(zip.get('manifest.json')!.toString('utf8')) as ManifestSurowejKopii;
  const wpis = manifest.pliki.find((p) => p.nazwa === 'dziennik-plus.jsonl');
  expect(wpis).toEqual({ nazwa: 'dziennik-plus.jsonl', bajty: Buffer.byteLength(DZIENNIK), sha256: sha256(DZIENNIK) });
  expect(sha256(zip.get('dziennik-plus.jsonl')!)).toBe(wpis?.sha256);
  expect(linie(zip.get('dziennik-plus.jsonl')!.toString('utf8'))).toEqual(linie(readFileSync(join(as, 'dziennik-plus.jsonl'), 'utf8')));
  for (const p of manifest.pliki) expect({ nazwa: p.nazwa, sha: sha256(zip.get(p.nazwa)!) }).toEqual({ nazwa: p.nazwa, sha: p.sha256 });
  expect(bazaZZipa(zip)).toEqual({ integrity: [{ integrity_check: 'ok' }], fk: 0, licznosci: przed });
  expect(sha()).toEqual(shaPrzed); // oryginały (baza i dziennik) nietknięte
});

test('M1-075: bez dziennika (nie było stuknięć poza aplikacją) ZIP powstaje jak dotąd — trzy pliki bazy i manifest', async () => {
  const { przed, a } = await trybAwaryjnyZDanymi(null);
  const cel = await a.zipSurowej();
  if (!cel) throw new Error('ZIP surowej kopii = null');
  const zip = czytajZip(cel);
  expect([...zip.keys()].sort()).toEqual(['manifest.json', ...PLIKI].sort());
  expect(bazaZZipa(zip)).toEqual({ integrity: [{ integrity_check: 'ok' }], fk: 0, licznosci: przed });
});

// M1-audytor-generalny-156 (12-niezawodnosc-504; ADR-0020 (3), zasada roli 12 nr 1 — baza przed plikiem pobocznym): nieudana kopia dziennika +1
// nie odbiera osobie ZIP-a z bazą. ZIP ma trzy pliki bazy, a manifest adnotację `pominiete` z powodem; dziennik zostaje na telefonie nietknięty.
describe.each([
  ['ENOSPC', 'ENOSPC: no space left on device, copyfile', 'brak_miejsca'],
  ['EACCES', 'EACCES: permission denied, copyfile', 'zapis'],
] as const)('M1-156: kopia dziennika +1 rzuca %s', (_kod, komunikat, powod) => {
  afterEach(() => { mockBladKopiiDziennika = null; });
  test('ZIP powstaje z trzema plikami bazy i manifestem z adnotacją pominięcia; baza z ZIP-a ma liczności sprzed awarii; oryginały nietknięte', async () => {
    const { as, przed, sha, a } = await trybAwaryjnyZDanymi(DZIENNIK);
    const shaPrzed = sha();
    mockBladKopiiDziennika = new Error(komunikat);
    const cel = await a.zipSurowej();
    if (!cel) throw new Error('ZIP surowej kopii = null');
    const zip = czytajZip(cel);
    expect([...zip.keys()].sort()).toEqual(['manifest.json', ...PLIKI].sort());
    const manifest = JSON.parse(zip.get('manifest.json')!.toString('utf8')) as ManifestSurowejKopii;
    expect(manifest.pliki.map((p) => p.nazwa).sort()).toEqual([...PLIKI].sort());
    for (const p of manifest.pliki) expect({ nazwa: p.nazwa, sha: sha256(zip.get(p.nazwa)!) }).toEqual({ nazwa: p.nazwa, sha: p.sha256 });
    expect(manifest.pominiete).toEqual([{ nazwa: 'dziennik-plus.jsonl', powod }]);
    expect(bazaZZipa(zip)).toEqual({ integrity: [{ integrity_check: 'ok' }], fk: 0, licznosci: przed });
    expect(readdirSync(dirname(cel)).filter((n) => n.includes('dziennik-plus'))).toEqual([]); // bez migawki w katalogu tymczasowym
    expect(sha()).toEqual(shaPrzed);
    expect(linie(readFileSync(join(as, 'dziennik-plus.jsonl'), 'utf8'))).toEqual(linie(DZIENNIK));
  });
});
