/* Odwołania plik:linia w inwentarzu kryteriów (F07-20, P-203 Q7a, JAK-15): narzędzie wyznacza linię z treści BRD, a --check pada na rozjeździe.
 * Pułapka: kopia repo z BRD przesuniętym o jedną linię → kod 1; po --zapisz → kod 0. */
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const KORZEN = join(__dirname, '..', '..');
const SKRYPT = join(KORZEN, 'docs/jakosc/narzedzia/linie-kryteriow.mjs');
const uruchom = (korzen: string, ...arg: string[]) => spawnSync(process.execPath, [SKRYPT, '--korzen', korzen, ...arg], { encoding: 'utf8' });
const kopia = () => {
  const d = mkdtempSync(join(tmpdir(), 'kryteria-'));
  for (const p of ['docs/jakosc/e0', 'docs/brd']) { mkdirSync(join(d, p), { recursive: true }); cpSync(join(KORZEN, p), join(d, p), { recursive: true }); }
  cpSync(join(KORZEN, 'docs/monetyzacja.md'), join(d, 'docs/monetyzacja.md'));
  return d;
};

describe('linie-kryteriow.mjs (F07-20)', () => {
  test('repo: każde z 221 odwołań wskazuje właściwy wiersz BRD/kontraktu (--check kod 0)', () => {
    const r = uruchom(KORZEN, '--check');
    expect(r.stdout).toMatch(/kryteria: 221, rozjazdów: 0, bez miejsca: 0/);
    expect(r.status).toBe(0);
  });
  test('pułapka: wiersz wstawiony na początku pliku BRD → rozjazd i kod 1; --zapisz naprawia JSON i MD', () => {
    const d = kopia();
    const f = join(d, 'docs/brd/wymagania-dane.md');
    writeFileSync(f, '\n' + readFileSync(f, 'utf8'));
    const r = uruchom(d, '--check');
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/ROZJAZD BR-DAN-001\/S1: docs\/brd\/wymagania-dane\.md:(\d+) → docs\/brd\/wymagania-dane\.md:\d+/);
    expect(uruchom(d, '--zapisz').status).toBe(0);
    expect(uruchom(d, '--check').status).toBe(0);
    const json = JSON.parse(readFileSync(join(d, 'docs/jakosc/e0/kryteria.json'), 'utf8')) as { id: string; plik: string }[];
    const plik = json.find((k) => k.id === 'BR-DAN-001/S1')!.plik;
    const n = Number(plik.split(':')[1]);
    expect(readFileSync(f, 'utf8').split('\n')[n - 1]).toMatch(/^\s+- Scenariusz/);
    expect(readFileSync(join(d, 'docs/jakosc/e0/kryteria.md'), 'utf8')).toContain(`| ${plik} |`);
  });
  test('pułapka: scenariusz usunięty z BRD → „bez miejsca” i kod 1', () => {
    const d = kopia();
    const f = join(d, 'docs/brd/wymagania-dane.md');
    writeFileSync(f, readFileSync(f, 'utf8').replace(/### BR-DAN-001:/, '### BR-DAN-901:'));
    const r = uruchom(d, '--check');
    expect(r.stdout).toMatch(/BŁĄD BR-DAN-001\/S1: brak miejsca/);
    expect(r.status).toBe(1);
  });
});
