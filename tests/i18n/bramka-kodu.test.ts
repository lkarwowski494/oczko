// 09-lokalizacja-004 (M1-051): bramka `npm run i18n:kod` skanuje istniejący kod (src, app; wyjątki w docs/lokalizacja/wyjatki-kodu.json)
// i jej wynik zatrzymuje `jakosc:kontrole` (zasada wspólna 21). Próbki tekstu na sztywno tylko w kopii repo w katalogu tymczasowym.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const skrypty = JSON.parse(readFileSync(join(KORZEN, 'package.json'), 'utf8')).scripts as Record<string, string>;
const i18nKod = (cwd: string) => {
  const r = spawnSync('npm', ['run', '-s', 'i18n:kod'], { cwd, encoding: 'utf8' });
  return { kod: r.status, wyjscie: `${r.stdout}${r.stderr}` };
};

describe('npm run i18n:kod (M1-051)', () => {
  it('na repo: skan wykonany, błędy 0, kod 0', () => {
    const r = i18nKod(KORZEN);
    expect(r.wyjscie).not.toMatch(/skan kodu niewykonany/);
    expect(r.wyjscie).toMatch(/błędy: 0,/);
    expect(r.kod).toBe(0);
  }, 60_000);

  it.each(['src/ekrany', 'app'])('kopia repo z <Text>Hello</Text> w %s: błąd „tekst na sztywno”, kod 1', (katalog) => {
    const d = mkdtempSync(join(tmpdir(), 'i18n-kod-'));
    try {
      for (const p of ['package.json', 'scripts/sprawdz-i18n.mjs', 'src', 'app', 'docs/lokalizacja']) cpSync(join(KORZEN, p), join(d, p), { recursive: true });
      symlinkSync(join(KORZEN, 'node_modules'), join(d, 'node_modules'));
      writeFileSync(join(d, katalog, 'probka-051.tsx'), "import { Text } from 'react-native';\nexport const P = () => <Text>Hello</Text>;\n");
      const r = i18nKod(d);
      expect(r.wyjscie).toMatch(/probka-051\.tsx:2: tekst na sztywno „Hello”/);
      expect(r.kod).toBe(1);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  }, 60_000);
});

describe('jakosc:kontrole zatrzymuje się na wyniku i18n:kod (M1-051)', () => {
  it('i18n:kod jest krokiem łańcucha &&, bez zamiany kodu wyjścia na 0', () => {
    const k = skrypty['jakosc:kontrole'];
    expect(k.split('&&').map((s) => s.trim())).toContain('npm run -s i18n:kod');
    expect(k).not.toMatch(/exit 0|\|\||;/);
  });
});
