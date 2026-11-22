// JAK-15 (P-237, zgłoszenie 07): build wydania bez śladów trybu testowego — napisy paneli testowych, identyfikatory `e2e-`, klucze argumentów
// startu E2E i nazwy przełączników EXPO_PUBLIC_* trybu testowego. Skrypt scripts/wydanie/slady-testowe.mjs przeszukuje bajty main.jsbundle
// (bajtkod Hermesa trzyma napisy jako tekst); kontrola-ipa.sh woła go przed wysyłką. Lista wzorców musi nadążać za kodem (test niżej).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const SKRYPT = join(KORZEN, 'scripts/wydanie/slady-testowe.mjs');
const uruchom = (plik: string) => spawnSync(process.execPath, [SKRYPT, plik], { encoding: 'utf8' });
const wzorce = () => JSON.parse(execFileSync(process.execPath, [SKRYPT, '--wzorce'], { encoding: 'utf8' })) as string[];
const plikZ = (tresc: Buffer | string) => { const p = join(mkdtempSync(join(tmpdir(), 'slady-')), 'main.jsbundle'); writeFileSync(p, tresc); return p; };
// Nagłówek bajtkodu Hermesa (odczyt z `expo export --platform ios`, 2026-10-26: c6 1f bc 03 c1 03 19 1f) + napisy jak w puli tekstów.
const hermes = (...napisy: string[]) => Buffer.concat([Buffer.from('c61fbc03c103191f', 'hex'), Buffer.from(['zapas-lista', ...napisy].join('\0'))]);

test('czysty bundel: kod 0', () => {
  const w = uruchom(plikZ(hermes('Restore purchases', 'Report a problem')));
  expect(w.stdout + w.stderr).toMatch(/bez śladów trybu testowego/);
  expect(w.status).toBe(0);
});

test.each(['Test store: expire access', 'e2e-sklep-wygas', 'oczkoE2eTeraz', 'EXPO_PUBLIC_E2E', 'EXPO_PUBLIC_ICLOUD_FAKE', 'Test photo (EXIF GPS)'])(
  'kontrola negatywna: „%s” w bundlu → kod 1 z nazwą wzorca', (napis) => {
    const w = uruchom(plikZ(hermes(napis)));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain(napis.slice(0, 8));
  });

test('brak pliku: kod 2', () => {
  expect(uruchom(join(tmpdir(), 'nie-ma-takiego-bundla')).status).toBe(2);
});

function zrodla(kat: string, w: string[] = []): string[] {
  for (const n of readdirSync(kat)) {
    const p = join(kat, n);
    if (statSync(p).isDirectory()) zrodla(p, w); else if (/\.(ts|tsx)$/.test(n)) w.push(p);
  }
  return w;
}

test('lista wzorców nadąża za kodem: każdy testID „e2e-…”, napis panelu „Test …” i przełącznik EXPO_PUBLIC_* trybu testowego ma wzorzec', () => {
  const w = wzorce();
  const pasuje = (s: string) => w.some((x) => s.includes(x));
  const brak: string[] = [];
  for (const p of [...zrodla(join(KORZEN, 'app')), ...zrodla(join(KORZEN, 'src'))]) {
    const t = readFileSync(p, 'utf8');
    for (const m of t.matchAll(/testID="(e2e-[\w-]+)"/g)) if (!pasuje(m[1])) brak.push(`${p}: ${m[1]}`);
    for (const m of t.matchAll(/<Text>(Test [^<{]+)<\/Text>/g)) if (!pasuje(m[1])) brak.push(`${p}: ${m[1]}`);
    for (const m of t.matchAll(/process\.env\.(EXPO_PUBLIC_\w*(?:E2E|FAKE|PSEUDO|WYMUS)\w*)/g)) if (!pasuje(m[1])) brak.push(`${p}: ${m[1]}`);
    for (const m of t.matchAll(/argument\('(\w+)'\)/g)) if (!pasuje(m[1])) brak.push(`${p}: ${m[1]}`);
  }
  expect(brak).toEqual([]);
});

// P-240: w buildzie E2E (scripts/jakosc/slady-wydania.mjs --e2e) ślady są oczekiwane — bez adnotacji ::error:: w GitHub Actions,
// kod wyjścia bez zmian (1 = ślady znalezione; wywołujący odwraca wynik). W buildzie wydania ::error:: zostaje.
test('--oczekiwane (build E2E): ślady jako informacja, bez ::error::, kod nadal 1', () => {
  const plik = plikZ(hermes('Test store: expire access'));
  const w = spawnSync(process.execPath, [SKRYPT, plik, '--oczekiwane'], { encoding: 'utf8' });
  expect(w.status).toBe(1);
  expect(w.stdout + w.stderr).not.toContain('::error::');
  expect(w.stdout).toMatch(/oczekiwany ślad trybu testowego \(build E2E\): Test store/);
  expect(uruchom(plik).stdout).toContain('::error::'); // bez flagi: wydanie
});

test('slady-wydania.mjs przekazuje --oczekiwane tylko w trybie --e2e', () => {
  const src = readFileSync(join(KORZEN, 'scripts/jakosc/slady-wydania.mjs'), 'utf8');
  expect(src).toMatch(/\['scripts\/wydanie\/slady-testowe\.mjs', join\(js, plik\), \.\.\.\(e2e \? \['--oczekiwane'\] : \[\]\)\]/);
});
