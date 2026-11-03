// Pułapki kontroli Swift (X-RG-04, scripts/natywne/kontrola-swift.mjs) i zgodności stałych Swift z src/konfiguracja.ts (generuj-stale --check).
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const kontrola = (katalog: string) => {
  try {
    return { kod: 0, wyjscie: execFileSync('node', [join(KORZEN, 'scripts/natywne/kontrola-swift.mjs'), '--katalog', katalog], { encoding: 'utf8' }) };
  } catch (e) {
    const b = e as { status: number; stdout: string };
    return { kod: b.status, wyjscie: b.stdout };
  }
};
function kopiaRepo(): string {
  const k = mkdtempSync(join(tmpdir(), 'kontrola-swift-'));
  cpSync(join(KORZEN, 'modules/oczko-reguly/Sources'), join(k, 'modules/oczko-reguly/Sources'), { recursive: true });
  return k;
}

describe('kontrola Swift (X-RG-04)', () => {
  test('repo: kod 0', () => expect(kontrola(KORZEN)).toMatchObject({ kod: 0 }));
  test('pułapka: druga definicja mozeZaczacDzien w celu zegarka → kod 1 z nazwą pliku', () => {
    const k = kopiaRepo();
    mkdirSync(join(k, 'targets/watch'), { recursive: true });
    writeFileSync(join(k, 'targets/watch/Limit.swift'), 'func mozeZaczacDzien() -> Bool { true }\n');
    const w = kontrola(k);
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('JEDNA-REGULA mozeZaczacDzien: druga definicja w targets/watch/Limit.swift');
  });
  test('pułapka: dwa pliki o tej samej nazwie w jednym module → NAZWA, kod 1', () => {
    const k = kopiaRepo();
    mkdirSync(join(k, 'modules/m/ios'), { recursive: true }); mkdirSync(join(k, 'modules/m/Pakiet'), { recursive: true });
    writeFileSync(join(k, 'modules/m/ios/A.swift'), 'let a = 1\n'); writeFileSync(join(k, 'modules/m/Pakiet/A.swift'), 'let b = 2\n');
    const w = kontrola(k);
    expect([w.kod, w.wyjscie.includes('NAZWA A.swift')]).toEqual([1, true]);
  });
  test('dowiązanie (ten sam plik w osobnym pakiecie SwiftPM, P-261) i manifesty Package.swift nie są duplikatami (bez NAZWA)', () => {
    const k = kopiaRepo();
    mkdirSync(join(k, 'modules/m/ios'), { recursive: true }); mkdirSync(join(k, 'modules/m/Testy/Zrodla'), { recursive: true }); mkdirSync(join(k, 'modules/m/Pakiet'), { recursive: true });
    writeFileSync(join(k, 'modules/m/ios/A.swift'), 'let a = 1\n');
    symlinkSync('../../ios/A.swift', join(k, 'modules/m/Testy/Zrodla/A.swift'));
    writeFileSync(join(k, 'modules/m/Pakiet/Package.swift'), '// a\n'); writeFileSync(join(k, 'modules/m/Testy/Package.swift'), '// b\n');
    expect(kontrola(k).wyjscie).not.toContain('NAZWA'); // KOPIA w okrojonej kopii repo — poza tym testem
  });
  test('pułapka: brak pakietu → PUSTO, kod 1', () => {
    const w = kontrola(mkdtempSync(join(tmpdir(), 'kontrola-swift-pusto-')));
    expect([w.kod, w.wyjscie.includes('PUSTO')]).toEqual([1, true]);
  });
});

test('stałe Swift (Stale.swift, stale.json) zgodne z src/konfiguracja.ts (generuj-stale --check)', () => {
  expect(() => execFileSync('node', ['--experimental-strip-types', '--no-warnings', join(KORZEN, 'scripts/natywne/generuj-stale.mjs'), '--check'], { encoding: 'utf8' })).not.toThrow();
});

/** Okrojona kopia repo dla generuj-stale (KORZEN skryptu = dwa katalogi nad nim): skrypt, konfiguracja, wygenerowane stałe i Info.plist celu share. */
function kopiaDlaStalych(): string {
  const k = mkdtempSync(join(tmpdir(), 'generuj-stale-'));
  for (const p of ['scripts/natywne/generuj-stale.mjs', 'src/konfiguracja.ts', 'modules/oczko-reguly/stale.json', 'modules/oczko-reguly/Sources/OczkoReguly/Stale.swift',
    'modules/oczko-wzor/Pakiet/stale.json', 'modules/oczko-wzor/Pakiet/Sources/OczkoWzorLogika/StaleWzoru.swift', 'targets/share/Info.plist']) {
    mkdirSync(join(k, p, '..'), { recursive: true });
    cpSync(join(KORZEN, p), join(k, p));
  }
  return k;
}
const generujStaleCheck = (k: string) => {
  try {
    execFileSync('node', ['--experimental-strip-types', '--no-warnings', join(k, 'scripts/natywne/generuj-stale.mjs'), '--check'], { encoding: 'utf8', stdio: 'pipe' });
    return { kod: 0, blad: '' };
  } catch (e) {
    const b = e as { status: number; stderr: string };
    return { kod: b.status, blad: b.stderr };
  }
};

describe('M1-audytor-generalny-079 (05-architekt-005): limit zdjęć wzoru — stała w konfiguracja.ts zgodna z regułą aktywacji celu share', () => {
  test('kopia bez zmian → --check przechodzi', () => {
    expect(generujStaleCheck(kopiaDlaStalych()).kod).toBe(0);
  });
  test('reguła aktywacji w targets/share/Info.plist inna niż stała → --check zgłasza różnicę (kod 1)', () => {
    const k = kopiaDlaStalych();
    const plist = join(k, 'targets/share/Info.plist');
    const przed = readFileSync(plist, 'utf8');
    const po = przed.replace(/("public\.image"\)\.@count &lt;= )\d+/, '$119');
    expect(po).not.toBe(przed);
    writeFileSync(plist, po);
    const w = generujStaleCheck(k);
    expect(w.kod).toBe(1);
    expect(w.blad).toContain('targets/share/Info.plist');
  });
});
