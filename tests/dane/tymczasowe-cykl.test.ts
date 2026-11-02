// M1-audytor-generalny-001 (05-architekt-501, 12-niezawodnosc-004): katalog tymczasowy w `Application Support/tmp` jest objęty kopią urządzenia,
// więc pliki pochodne (eksport `.oczko`, ZIP ratunkowy, katalogi importu i zgłoszeń) muszą mieć cykl życia: usunięcie po użyciu, sprzątanie przy
// kamieniu milowym startu (wpisy starsze niż start procesu, poza pamięciami podręcznymi) i pełne czyszczenie przy „Delete all data”.
import { existsSync, mkdirSync, readFileSync, readdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { sprzatnijTymczasowe, tymczasoweDoUsuniecia } from '../../src/niezawodnosc/kopie';
import { eksportuj } from '../../src/przypadki-uzycia/archiwum';
import { usunWszystkieDane } from '../../src/przypadki-uzycia/projekt';
import { zycie } from './pomocnicze/dane-wejsciowe';
import { czasWTle, licznosci, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

async function srodowisko() {
  const s = await przygotuj();
  const pliki = { pdf: wlozPlik(s.magazyn, Buffer.from('PDF-1.4 abc'), 'pdf'), rys: wlozPlik(s.magazyn, Buffer.from('PKDRAWING'), 'pkdrawing'), jpg: wlozPlik(s.magazyn, Buffer.from('JPEG-DANE!'), 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  return { ...s, za: { ...s.z, archiwum, czasWTle } };
}
const ustawCzas = (sciezka: string, ms: number) => utimesSync(sciezka, ms / 1000, ms / 1000);

test('M1-001: po „Delete all data” w katalogu tymczasowym nie zostają pliki pochodne (miniatury, rysunki, katalog importu, ZIP ratunkowy, eksport-*.db)', async () => {
  const s = await srodowisko();
  const tmp = s.z.katalogi.tymczasowy;
  writeFileSync(join(tmp, 'oczko-ratunkowa-1.zip'), 'ZIP');
  writeFileSync(join(tmp, 'eksport-1.db'), 'DB');
  mkdirSync(join(tmp, 'rysunki-wzoru'), { recursive: true });
  writeFileSync(join(tmp, 'rysunki-wzoru', 'r.png'), 'PNG');
  mkdirSync(join(tmp, 'miniatury'), { recursive: true });
  writeFileSync(join(tmp, 'miniatury', 'abc.png'), 'PNG');
  mkdirSync(join(tmp, 'import-1'), { recursive: true });
  writeFileSync(join(tmp, 'import-1', 'baza.db'), 'DB');
  expect(readdirSync(tmp).length).toBeGreaterThan(0);
  expect(await usunWszystkieDane(s.za)).toMatchObject({ ok: true });
  expect(existsSync(tmp) ? readdirSync(tmp) : []).toEqual([]);
  expect((await licznosci(s.baza)).projekt).toBe(0);
  expect(readdirSync(s.z.katalogi.kopiePrzed)).toEqual(['oczko-przed-usunieciem-2026-10-22.oczko']); // kopia bezpieczeństwa poza tmp zostaje
});

test('M1-001: eksport .oczko z bieżącego startu przeżywa „Delete all data” (E2-137-A3, build E2E bez arkusza), a sprzątanie następnego startu go usuwa', async () => {
  const s = await srodowisko();
  const tmp = s.z.katalogi.tymczasowy;
  const e = await eksportuj(s.za, { katalogDocelowy: tmp });
  if (!e.ok) throw new Error(e.powod);
  expect(await usunWszystkieDane(s.za)).toMatchObject({ ok: true });
  const nazwa = e.wartosc.sciezka.slice(e.wartosc.sciezka.lastIndexOf('/') + 1);
  expect(readdirSync(tmp)).toEqual([nazwa]);
  expect(sprzatnijTymczasowe(tmp, Date.now() + 1_000)).toEqual({ ok: true, wartosc: [nazwa] }); // następny start
  expect(readdirSync(tmp)).toEqual([]);
});

test('M1-001: wybór sprzątania — starsze niż start procesu znikają; nowsze (eksport w otwartym arkuszu), pamięci podręczne i wpisy bez czasu zostają', () => {
  const start = 1_000_000;
  const w = tymczasoweDoUsuniecia([
    { nazwa: 'oczko-2026-10-22.oczko', zmianaMs: start - 1 },
    { nazwa: 'oczko-ratunkowa-1.zip', zmianaMs: start - 10 },
    { nazwa: 'import-5', zmianaMs: start - 5 },
    { nazwa: 'oczko-2026-10-23.oczko', zmianaMs: start },
    { nazwa: 'zgloszenie-9', zmianaMs: start + 5 },
    { nazwa: 'miniatury', zmianaMs: 1 },
    { nazwa: 'rysunki-wzoru', zmianaMs: 1 },
    { nazwa: 'nieczytelny', zmianaMs: null },
  ], start);
  expect(w.sort()).toEqual(['import-5', 'oczko-2026-10-22.oczko', 'oczko-ratunkowa-1.zip']);
});

test('M1-001: adapter na kopii — usuwa stare pliki i katalogi tmp; baza, magazyn i kopie bez zmian (liczności i pliki przed/po)', async () => {
  const s = await srodowisko();
  const tmp = s.z.katalogi.tymczasowy;
  const start = Date.now();
  writeFileSync(join(tmp, 'oczko-2026-10-21.oczko'), 'STARY');
  ustawCzas(join(tmp, 'oczko-2026-10-21.oczko'), start - 60_000);
  mkdirSync(join(tmp, 'import-1'));
  writeFileSync(join(tmp, 'import-1', 'baza.db'), 'DB');
  ustawCzas(join(tmp, 'import-1'), start - 60_000);
  writeFileSync(join(tmp, 'oczko-2026-10-22.oczko'), 'W ARKUSZU');
  ustawCzas(join(tmp, 'oczko-2026-10-22.oczko'), start + 1_000);
  mkdirSync(join(tmp, 'miniatury'));
  ustawCzas(join(tmp, 'miniatury'), start - 60_000);
  const przed = await licznosci(s.baza);
  const magazynPrzed = readdirSync(s.magazyn.katalog).sort();
  const w = sprzatnijTymczasowe(tmp, start);
  expect(w).toEqual({ ok: true, wartosc: ['import-1', 'oczko-2026-10-21.oczko'] });
  expect(readdirSync(tmp).sort()).toEqual(['miniatury', 'oczko-2026-10-22.oczko']);
  expect(await licznosci(s.baza)).toEqual(przed);
  expect(readdirSync(s.magazyn.katalog).sort()).toEqual(magazynPrzed);
});

test('M1-001: brak katalogu tymczasowego = nic do zrobienia, bez błędu', () => {
  expect(sprzatnijTymczasowe(join(__dirname, 'nie-ma-takiego-katalogu-m1-001'), Date.now())).toEqual({ ok: true, wartosc: [] });
});

test('M1-001: kamień milowy startu sprząta katalog tymczasowy od początku bieżącego startu', () => {
  const zrodlo = readFileSync(join(__dirname, '../../src/kompozycja/start-aplikacji.ts'), 'utf8');
  const kamien = zrodlo.slice(zrodlo.indexOf('export async function zapiszKamien'), zrodlo.indexOf('export async function zapiszWyjscieDoTla'));
  expect(kamien).toMatch(/sprzatnijTymczasowe\(polacz\(s\.katalogDanych, 'tmp'\), poczatekMs\)/);
});

test('M1-001 (trwała kontrola): każde miejsce, które pisze do katalogu tymczasowego, ma nazwany cykl życia', () => {
  // Nowe miejsce = decyzja o cyklu życia (usunięcie po użyciu albo pamięć podręczna wyjęta ze sprzątania), dopisana tutaj.
  const CYKL: Record<string, string> = {
    'app/ustawienia.tsx': 'eksport: usunięcie po zamknięciu arkusza; siatka: kamień milowy',
    'app/zdjecie.tsx': 'zdjęcie bez metadanych: usunięcie po zapisie do magazynu; siatka: kamień milowy',
    'app/projekt/[id].tsx': 'zdjęcie bez metadanych i panel E2E: usunięcie po zapisie; siatka: kamień milowy',
    'app/wloczka.tsx': 'zdjęcie bez metadanych: usunięcie po zapisie; siatka: kamień milowy',
    'app/wzor.tsx': 'rysunki-wzoru: pamięć podręczna (wyjęta ze sprzątania startu), czyszczona przy Delete all data',
    'src/dane/archiwum.ts': 'eksport-*.db i import-*: usunięcie po użyciu; siatka: kamień milowy',
    'src/dane/kopia-ratunkowa.ts': 'przywracanie-*.db: siatka: kamień milowy',
    'src/kompozycja/kontener.ts': 'utworzenie katalogu',
    'src/kompozycja/start-aplikacji.ts': 'zgłoszenie i ZIP ratunkowy trybu awaryjnego; siatka: kamień milowy',
    'src/kompozycja/kopia-awaryjna.ts': 'archiwum trybu awaryjnego: siatka: kamień milowy',
    'src/kompozycja/miniatury.ts': 'miniatury: pamięć podręczna (wyjęta ze sprzątania startu), czyszczona przy Delete all data',
    'src/przypadki-uzycia/projekt.ts': 'Delete all data: czyszczenie całego katalogu',
  };
  const wynik = execFileSync('grep', ['-rlE', 'katalogi\\.tymczasowy|polacz\\([a-zA-Z.]*katalogDanych, .tmp.\\)', 'src', 'app', '--include=*.ts', '--include=*.tsx'], { cwd: join(__dirname, '../..'), encoding: 'utf8' });
  const pliki = wynik.trim().split('\n').filter((p) => !p.includes('/e2e/')).sort();
  expect(pliki).toEqual(Object.keys(CYKL).sort());
});
