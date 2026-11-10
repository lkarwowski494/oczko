// M1-audytor-generalny-304 (05-architekt-001, ARCH-08): manifest wydanych migracji uzbraja kontrolę MIGRACJA-WYDANA
// (`scripts/jakosc/kontrole-repo.mjs`). Bez manifestu zmiana `0001.sql` po wydaniu 1.0 przechodzi CI; z manifestem pada.
// Test pracuje na kopii prawdziwego manifestu i prawdziwej migracji w katalogu tymczasowym, nigdy na plikach repo.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const KONTROLE = join(KORZEN, 'scripts/jakosc/kontrole-repo.mjs');
const MANIFEST = 'docs/jakosc/migracje-wydane.json';
const MIGRACJA_1 = 'src/dane/migracje/0001.sql';
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex');

/** Kontrole repo na kopii: manifest (jeśli jest w repo) + 0001.sql, opcjonalnie z jednym zmienionym bajtem. */
function kontroleNaKopii(zmienBajt: boolean) {
  const k = mkdtempSync(join(tmpdir(), 'migracje-wydane-'));
  writeFileSync(join(k, 'package.json'), '{"dependencies":{}}');
  for (const p of [MANIFEST, MIGRACJA_1]) {
    if (!existsSync(join(KORZEN, p))) continue;
    mkdirSync(dirname(join(k, p)), { recursive: true });
    copyFileSync(join(KORZEN, p), join(k, p));
  }
  if (zmienBajt) {
    const b = readFileSync(join(k, MIGRACJA_1));
    b[b.length - 1] ^= 1;
    writeFileSync(join(k, MIGRACJA_1), b);
  }
  return spawnSync('node', [KONTROLE, '--katalog', k], { encoding: 'utf8' });
}

describe('M1-304: wydana migracja 0001.sql pod manifestem SHA-256', () => {
  test('manifest istnieje i ma SHA-256 0001.sql zgodny z plikiem', () => {
    expect(existsSync(join(KORZEN, MANIFEST))).toBe(true);
    const { migracje } = JSON.parse(readFileSync(join(KORZEN, MANIFEST), 'utf8')) as { migracje: { plik: string; sha256: string }[] };
    const wpis = migracje.find((m) => m.plik === MIGRACJA_1);
    expect(wpis?.sha256).toBe(sha256(readFileSync(join(KORZEN, MIGRACJA_1))));
    for (const m of migracje) expect(m.sha256).toBe(sha256(readFileSync(join(KORZEN, m.plik))));
  });

  test('kontrole repo z manifestem i niezmienioną 0001.sql: 0 naruszeń', () => {
    const w = kontroleNaKopii(false);
    expect(w.stdout).not.toContain('MIGRACJA-WYDANA');
    expect(w.stdout).toContain('naruszeń 0');
    expect(w.status).toBe(0);
  });

  test('zmiana jednego bajtu 0001.sql: MIGRACJA-WYDANA, kod 1', () => {
    const w = kontroleNaKopii(true);
    expect(w.stdout).toContain(`MIGRACJA-WYDANA ${MIGRACJA_1}`);
    expect(w.status).toBe(1);
  });

  test('lista przed wysyłką (docs/wydanie/sklep.md §5) ma krok „manifest migracji”', () => {
    const sklep = readFileSync(join(KORZEN, 'docs/wydanie/sklep.md'), 'utf8');
    const lista = sklep.slice(sklep.indexOf('## 5. Lista przed wysyłką'), sklep.indexOf('\n## 5a.'));
    expect(lista).toMatch(/\*\*Manifest migracji\.\*\*[^\n]*docs\/jakosc\/migracje-wydane\.json/);
  });
});
