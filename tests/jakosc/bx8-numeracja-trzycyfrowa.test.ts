/* KO-088 / BX-033: numer scenariusza 100+ (trzy cyfry) musi być widziany przez podział na części, kontrolę katalogu i pętle CI.
 * Wcześniej regex `^\d\d-` i glob `[0-9][0-9]-*.yaml` pomijały takie pliki po cichu (scenariusz nie biegł, katalog go nie widział). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';

const root = path.join(__dirname, '..', '..');
const skryptCzesci = path.join(root, 'scripts/ci/e2e-czesci.mjs');
const skryptBramki = path.join(root, 'scripts/jakosc/bramka-przypadki-uzycia.mjs');
const NAZWA = '100-bx8-trzycyfrowy.yaml';
const TRESC = ['appId: com.apps4brew.knitting', 'name: "BX8 · numer trzycyfrowy"', 'tags:', '  - przypadki-uzycia', '  - oczekujacy', '---', '- launchApp', '- assertVisible: { id: "licznik-plus" }', ''].join('\n');

describe('KO-088 / BX-033: scenariusz o numerze trzycyfrowym', () => {
  test('podział na części (e2e-czesci.mjs plan) zawiera scenariusz 100+', () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bx8-czesci-'));
    try {
      fs.cpSync(path.join(root, 'e2e/scenariusze'), d, { recursive: true });
      fs.writeFileSync(path.join(d, NAZWA), TRESC);
      const plan = JSON.parse(execFileSync('node', [skryptCzesci, 'plan', '--dir', d, '--config', path.join(root, 'e2e/czesci.json')], { encoding: 'utf8', env: { ...process.env, ONLY: '', PAKIET: '', COMMIT_MSG: '' } })) as { files: string[]; osobne: string[] }[];
      expect(plan.flatMap((c) => [...c.files, ...c.osobne]).filter((f) => f === NAZWA)).toEqual([NAZWA]);
    } finally { fs.rmSync(d, { recursive: true, force: true }); }
  });

  test('kontrola katalogu widzi scenariusz 100+ (bez PU w katalogu → błąd „nieprzypisany do PU”)', () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bx8-katalog-'));
    try {
      for (const k of ['app', 'src', 'tests']) fs.symlinkSync(path.join(root, k), path.join(d, k), 'dir');
      fs.cpSync(path.join(root, 'e2e/scenariusze'), path.join(d, 'e2e/scenariusze'), { recursive: true });
      fs.mkdirSync(path.join(d, 'docs/jakosc'), { recursive: true });
      fs.copyFileSync(path.join(root, 'docs/jakosc/przypadki-uzycia.md'), path.join(d, 'docs/jakosc/przypadki-uzycia.md'));
      fs.writeFileSync(path.join(d, 'e2e/scenariusze', NAZWA), TRESC);
      const kod = `import(${JSON.stringify(skryptBramki)}).then(m=>console.log(JSON.stringify(m.kontrolaKatalogu(${JSON.stringify(d)}))))`;
      const bledy = JSON.parse(execFileSync('node', ['-e', kod], { encoding: 'utf8' })) as string[];
      expect(bledy.filter((b) => b.startsWith(NAZWA))).toEqual([`${NAZWA}: nieprzypisany do PU`]);
    } finally { fs.rmSync(d, { recursive: true, force: true }); }
  });

  test('pętle Maestro w jakosc-ios.yml nie używają globu dwucyfrowego [0-9][0-9]-*.yaml', () => {
    const wf = fs.readFileSync(path.join(root, '.github/workflows/jakosc-ios.yml'), 'utf8');
    expect(wf.match(/\[0-9\]\[0-9\]-\*\.yaml/g) ?? []).toEqual([]);
  });
});
