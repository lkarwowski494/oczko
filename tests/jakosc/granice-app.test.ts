/* Bramka rozmiaru 20 KB (ADR-0003: „plik > 20 KB to błąd”) obejmuje trasy `app/` — M1-audytor-generalny-106, 07-jakosc-512, 08-programista-513.
 * DEC-30 (a) (P-414, P-430): `granice.mjs app` w `jakosc:kontrole`; podział `app/wzor.tsx` zrobił M2 (bb4cae6). Test bierze polecenie
 * z `package.json` (to, co naprawdę biegnie w bramce), uruchamia je na kopii `app/` w katalogu tymczasowym ze sztucznym plikiem 21 KB
 * (ma paść regułą ROZMIAR) i na kodzie (ma przejść). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const root = path.join(__dirname, '..', '..');
const GRANICE = 'docs/architektura/narzedzia/granice.mjs';
const kontrole: string = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts['jakosc:kontrole'];

/** Argumenty wywołań `node <GRANICE> app …` w skrypcie `jakosc:kontrole`. */
const wywolaniaApp = () => kontrole.split('&&').map(s => s.trim().split(/\s+/))
  .filter(a => a[0] === 'node' && a[1] === GRANICE && a[2] === 'app').map(a => a.slice(3));

const uruchom = (zrodla: string, reszta: string[]) =>
  spawnSync(process.execPath, [path.join(root, GRANICE), zrodla, ...reszta], { cwd: root, encoding: 'utf8' }); /* cwd: typescript z node_modules repo */

/** Kopia `app/` i katalogu domeny w układzie repo (granice.mjs: `--repo` = rodzic źródeł, `--domena` względem źródeł). */
function kopia(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'granice-app-'));
  fs.cpSync(path.join(root, 'app'), path.join(d, 'app'), { recursive: true });
  fs.cpSync(path.join(root, 'src', 'domena'), path.join(d, 'src', 'domena'), { recursive: true });
  fs.copyFileSync(path.join(root, 'tsconfig.json'), path.join(d, 'tsconfig.json'));
  return d;
}

describe('granice.mjs na trasach app/ w jakosc:kontrole (M1-audytor-generalny-106; 07-jakosc-512; DEC-30 a)', () => {
  test('jakosc:kontrole uruchamia granice.mjs na app (dokładnie raz), bez podniesionego limitu', () => {
    const w = wywolaniaApp();
    expect(w).toHaveLength(1);
    expect(w[0]).not.toContain('--limit');
  });

  test('to samo wywołanie pada regułą ROZMIAR na sztucznym pliku 21 KB w app/ (kopia) i przechodzi na kopii bez niego', () => {
    const [reszta] = wywolaniaApp(); expect(reszta).toBeDefined();
    const d = kopia();
    try {
      const czysta = uruchom(path.join(d, 'app'), reszta);
      expect({ kod: czysta.status, wynik: czysta.stdout.trim() }).toEqual({ kod: 0, wynik: expect.stringMatching(/^OK: \d+ plików, bez naruszeń$/) });
      fs.writeFileSync(path.join(d, 'app', 'duzy.tsx'), '// ' + 'x'.repeat(21 * 1024));
      const zla = uruchom(path.join(d, 'app'), reszta);
      expect(zla.status).toBe(1);
      expect(zla.stdout).toMatch(/^ROZMIAR duzy\.tsx: 21\.0 KB > 20 KB$/m);
    } finally { fs.rmSync(d, { recursive: true, force: true }); }
  });

  test('na kodzie (app/ repo) wywołanie z bramki daje kod 0 — żaden plik trasy nie przekracza 20 KB', () => {
    const [reszta] = wywolaniaApp(); expect(reszta).toBeDefined();
    const r = uruchom(path.join(root, 'app'), reszta);
    expect({ kod: r.status, wynik: r.stdout.trim() }).toEqual({ kod: 0, wynik: expect.stringMatching(/^OK: \d+ plików, bez naruszeń$/) });
  });
});
