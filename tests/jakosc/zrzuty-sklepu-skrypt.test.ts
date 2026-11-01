/* Skrypt zrzutów sklepu (`scripts/ci/zrzuty-sklepu.sh`, P-319) sprawdzony BEZ macOS: na atrapach `xcrun`, `maestro` i `sips` w PATH.
 * Dowodzi przepływu sterowania (dane do kontenera przed każdym kadrem, argumenty Maestro, kontrola rozmiaru, powtórka, kod wyjścia), a nie tego,
 * jak wygląda aplikacja — to sprawdzi dopiero pierwszy przebieg z `[zrzuty-sklepu]` na macOS (zasada roli 4: czego nie uruchomiono, jest „nie sprawdzono”).
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const SKRYPT = path.join(__dirname, '..', '..', 'scripts/ci/zrzuty-sklepu.sh');
const KADRY = ['01-licznik', '02-wzor', '03-zakreslenie', '04-projekty', '05-historia', '06-kalendarz'];

// Atrapa `xcrun` (node): get_app_container → STUB_KONTENER; io screenshot → PNG z samym IHDR o wymiarach z STUB_W×STUB_H; log wywołań w STUB_LOG.
// STUB_ZLE_NR=<n>: n-te zrzucenie ma zamienione wymiary (do testu powtórki); STUB_ZLE_ZAWSZE=1: wszystkie błędne.
const XCRUN = `#!/usr/bin/env node
const fs = require('fs');
const a = process.argv.slice(2);
fs.appendFileSync(process.env.STUB_LOG, 'xcrun ' + a.join(' ') + '\\n');
if (a[1] === 'get_app_container') { if (process.env.STUB_KONTENER_BRAK === '1') process.exit(1); process.stdout.write(process.env.STUB_KONTENER + '\\n'); process.exit(0); }
if (a[1] === 'io' && a[3] === 'screenshot') {
  const licznik = process.env.STUB_LICZNIK; const n = Number(fs.existsSync(licznik) ? fs.readFileSync(licznik, 'utf8') : '0') + 1; fs.writeFileSync(licznik, String(n));
  let w = Number(process.env.STUB_W), h = Number(process.env.STUB_H);
  if (process.env.STUB_ZLE_ZAWSZE === '1' || Number(process.env.STUB_ZLE_NR) === n) { w = 100; h = 100; }
  const b = Buffer.alloc(24); Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0); b.write('IHDR', 12); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20);
  fs.writeFileSync(a[4], b); process.exit(0);
}
process.exit(0);
`;
const MAESTRO = `#!/usr/bin/env node
const fs = require('fs');
const a = process.argv.slice(2);
fs.appendFileSync(process.env.STUB_LOG, 'maestro ' + a.join(' ') + '\\n');
const plik = a.find((x) => x.endsWith('.yaml')) || '';
if (process.env.STUB_MAESTRO_PADA && plik.includes(process.env.STUB_MAESTRO_PADA)) { console.error('Assertion is false: x'); process.exit(1); }
process.exit(0);
`;
const SIPS = `#!/usr/bin/env node
const fs = require('fs');
const a = process.argv.slice(2);
const b = fs.readFileSync(a[a.length - 1]);
const klucz = a[1];
console.log(a[a.length - 1]); console.log('  ' + klucz + ': ' + (klucz === 'pixelWidth' ? b.readUInt32BE(16) : b.readUInt32BE(20)));
`;
const SLEEP = '#!/bin/sh\nexit 0\n';

type Wynik = { kod: number; wyjscie: string; log: string[]; kontener: string; wyjscieDir: string; dane: string };
function uruchom(klasa: string, o: { w: number; h: number; env?: Record<string, string>; kadry?: string; bezDanych?: boolean } = { w: 1320, h: 2868 }): Wynik {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zrzuty-skrypt-'));
  const bin = path.join(dir, 'bin'); fs.mkdirSync(bin);
  for (const [n, t] of Object.entries({ xcrun: XCRUN, maestro: MAESTRO, sips: SIPS, sleep: SLEEP })) { fs.writeFileSync(path.join(bin, n), t, { mode: 0o755 }); }
  const dane = path.join(dir, 'dane'); fs.mkdirSync(path.join(dane, 'pliki'), { recursive: true });
  if (!o.bezDanych) {
    fs.writeFileSync(path.join(dane, 'oczko.db'), 'BAZA-POKAZOWA');
    fs.writeFileSync(path.join(dane, 'pliki', 'abc.pdf'), '%PDF-1.4\n%%EOF\n');
    fs.writeFileSync(path.join(dane, 'podsumowanie.json'), JSON.stringify({ teraz: '2026-11-12T09:41:00' }));
  }
  const kontener = path.join(dir, 'kontener'); const as = path.join(kontener, 'Library/Application Support'); fs.mkdirSync(as, { recursive: true });
  for (const stary of ['oczko.db', 'oczko.db-wal', 'oczko.db-shm', 'stan-startu.json']) fs.writeFileSync(path.join(as, stary), 'STARE'); // zostałe po poprzednim kadrze
  fs.mkdirSync(path.join(as, 'pliki')); fs.writeFileSync(path.join(as, 'pliki', 'stary.pdf'), 'STARY');
  const log = path.join(dir, 'log.txt'); fs.writeFileSync(log, '');
  const wyjscieDir = path.join(dir, 'out');
  let kod = 0, wyjscie = '';
  try {
    wyjscie = execFileSync('bash', [SKRYPT, 'UDID-1', klasa, dane, wyjscieDir, ...(o.kadry ? [o.kadry] : [])], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, STUB_LOG: log, STUB_KONTENER: kontener, STUB_W: String(o.w), STUB_H: String(o.h), STUB_LICZNIK: path.join(dir, 'licznik.txt'), SEN: '0', GITHUB_STEP_SUMMARY: '', ...o.env },
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    const b = e as { status?: number; stdout?: string; stderr?: string };
    kod = b.status ?? -1; wyjscie = `${b.stdout ?? ''}${b.stderr ?? ''}`;
  }
  return { kod, wyjscie, log: fs.readFileSync(log, 'utf8').split('\n').filter(Boolean), kontener: as, wyjscieDir, dane };
}
const maestro = (w: Wynik): string[] => w.log.filter((l) => l.startsWith('maestro '));

describe('zrzuty-sklepu.sh · iPhone (1320×2868)', () => {
  const w = uruchom('iphone');
  test('komplet: kod 0, 6 zrzutów w <wyjście>/iphone, żaden w .nieudane', () => {
    expect(w.kod).toBe(0);
    expect(fs.readdirSync(path.join(w.wyjscieDir, 'iphone')).sort()).toEqual(KADRY.map((k) => `${k}.png`));
    expect(fs.readdirSync(path.join(w.wyjscieDir, '.nieudane', 'iphone'))).toEqual([]);
  });
  test('Maestro dostaje przepływ każdego kadru, TERAZ z podsumowania i KLASA, i pisze do własnego katalogu wyników', () => {
    const m = maestro(w);
    expect(m).toHaveLength(6);
    KADRY.forEach((k, i) => {
      expect(m[i]).toContain(`e2e/zrzuty-sklepu/${k}.yaml`);
      expect(m[i]).toContain('-e TERAZ=2026-11-12T09:41:00');
      expect(m[i]).toContain('-e KLASA=iphone');
      expect(m[i]).toContain('--device UDID-1');
      expect(m[i]).toContain(`--test-output-dir ${path.join(w.wyjscieDir, '.maestro', `iphone-${k}`)}`);
    });
  });
  test('przed każdym kadrem aplikacja zamknięta, a kontener ma świeże oczko.db i pliki wzoru bez śladów poprzedniego kadru', () => {
    expect(fs.readFileSync(path.join(w.kontener, 'oczko.db'), 'utf8')).toBe('BAZA-POKAZOWA');
    expect(fs.existsSync(path.join(w.kontener, 'oczko.db-wal'))).toBe(false);
    expect(fs.existsSync(path.join(w.kontener, 'oczko.db-shm'))).toBe(false);
    expect(fs.existsSync(path.join(w.kontener, 'stan-startu.json'))).toBe(false);
    expect(fs.readdirSync(path.join(w.kontener, 'pliki'))).toEqual(['abc.pdf']);
    const terminate = w.log.filter((l) => l === 'xcrun simctl terminate UDID-1 com.apps4brew.knitting');
    expect(terminate.length).toBeGreaterThanOrEqual(7); // po pierwszym starcie kontenera + przed każdym z 6 kadrów
  });
  test('wygląd jasny i pasek stanu 9:41 ustawione przed zrzutami, wyczyszczone po', () => {
    const i = (re: RegExp): number => w.log.findIndex((l) => re.test(l));
    expect(w.log[i(/status_bar UDID-1 override --time 9:41/)]).toBeDefined();
    expect(w.log[i(/ui UDID-1 appearance light/)]).toBeDefined();
    expect(i(/status_bar UDID-1 override/)).toBeLessThan(i(/maestro/));
    expect(i(/status_bar UDID-1 clear/)).toBeGreaterThan(w.log.map((l) => l.startsWith('maestro')).lastIndexOf(true));
  });
  test('iPhone przyjmuje tylko pion: poziomy rozmiar 2868×1320 jest błędem kadru', () => {
    const p = uruchom('iphone', { w: 2868, h: 1320 });
    expect(p.kod).toBe(1);
    expect(p.wyjscie).toContain('Kadry bez zrzutu po dwóch próbach (iphone)');
  });
});

describe('zrzuty-sklepu.sh · iPad 13″ (2064×2752)', () => {
  test('pion 2064×2752 i poziom 2752×2064 są poprawne', () => {
    expect(uruchom('ipad', { w: 2064, h: 2752 }).kod).toBe(0);
    const poziom = uruchom('ipad', { w: 2752, h: 2064 });
    expect(poziom.kod).toBe(0);
    expect(maestro(poziom)[0]).toContain('-e KLASA=ipad');
  });
  test('inny rozmiar (np. iPad 11″ 1668×2420) jest błędem', () => {
    const w = uruchom('ipad', { w: 1668, h: 2420 });
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('oczekiwano 2064×2752 albo 2752×2064');
  });
});

describe('zrzuty-sklepu.sh · błędy i powtórki', () => {
  test('kadr z błędnym rozmiarem za pierwszym razem jest powtarzany raz i komplet przechodzi', () => {
    const w = uruchom('iphone', { w: 1320, h: 2868, env: { STUB_ZLE_NR: '2' } });
    expect(w.kod).toBe(0);
    expect(maestro(w).filter((l) => l.includes('02-wzor.yaml'))).toHaveLength(2);
    expect(w.wyjscie).toContain('Ponawiam kadr 02-wzor');
  });
  test('przepływ, który pada dwa razy, daje kod 1 po przejściu wszystkich kadrów; pozostałe zrzuty zostają', () => {
    const w = uruchom('iphone', { w: 1320, h: 2868, env: { STUB_MAESTRO_PADA: '03-zakreslenie' } });
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('Kadry bez zrzutu po dwóch próbach (iphone): 03-zakreslenie');
    expect(maestro(w).filter((l) => l.includes('03-zakreslenie.yaml'))).toHaveLength(2);
    expect(fs.readdirSync(path.join(w.wyjscieDir, 'iphone')).sort()).toEqual(KADRY.filter((k) => k !== '03-zakreslenie').map((k) => `${k}.png`));
  });
  test('gdy nie da się wgrać danych (brak kontenera aplikacji), Maestro nie startuje na starych danych, a kod to 1', () => {
    const w = uruchom('iphone', { w: 1320, h: 2868, env: { STUB_KONTENER_BRAK: '1' } });
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('Nie udało się wgrać danych pokazowych');
    expect(maestro(w)).toEqual([]);
    expect(fs.existsSync(path.join(w.wyjscieDir, 'iphone', '01-licznik.png'))).toBe(false);
  });
  test('lista kadrów (argument 5) ogranicza uruchomienia do wskazanych', () => {
    const w = uruchom('iphone', { w: 1320, h: 2868, kadry: '04-projekty,06-kalendarz' });
    expect(w.kod).toBe(0);
    expect(maestro(w).map((l) => KADRY.find((k) => l.includes(`${k}.yaml`)))).toEqual(['04-projekty', '06-kalendarz']);
  });
  test('zła klasa urządzenia albo brak danych pokazowych → kod 2 bez uruchamiania Maestro', () => {
    const zla = uruchom('watch');
    expect(zla.kod).toBe(2);
    expect(zla.wyjscie).toContain('iphone albo ipad');
    const brak = uruchom('iphone', { w: 1320, h: 2868, bezDanych: true });
    expect(brak.kod).toBe(2);
    expect(brak.wyjscie).toContain('Brak danych pokazowych');
    expect(maestro(brak)).toEqual([]);
  });
});
