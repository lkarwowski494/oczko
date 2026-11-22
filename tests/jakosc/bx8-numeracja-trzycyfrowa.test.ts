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

  // CE-06 (P3, ce-recenzja-bx7-bx8.md): test wyżej jest tylko negatywny; inny zły glob (np. `[0-9][0-9]-[a-z]*.yaml`) by przeszedł. Tu glob z workflow rozwija prawdziwy bash na katalogu z plikami 05-, 100-, 109-.
  test('pętle Maestro w jakosc-ios.yml łapią scenariusze 05-, 100- i 109- (rozwinięcie globu w bashu), nie łapią config.yaml (CE-06)', () => {
    const wf = fs.readFileSync(path.join(root, '.github/workflows/jakosc-ios.yml'), 'utf8');
    const globy = [...wf.matchAll(/for f in (e2e-czesc\/(?:osobne\/)?\[0-9\][^\s;]*-\*\.yaml); do/g)].map((m) => m[1] ?? '');
    expect(globy.length).toBeGreaterThanOrEqual(2); // pętla części i pętla AX5 (osobne)
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bx10-glob-'));
    try {
      for (const k of ['e2e-czesc', 'e2e-czesc/osobne']) { fs.mkdirSync(path.join(d, k), { recursive: true }); for (const f of ['05-x.yaml', '100-x.yaml', '109-x.yaml', 'config.yaml']) fs.writeFileSync(path.join(d, k, f), ''); }
      for (const glob of globy) {
        const wynik = execFileSync('bash', ['-c', `shopt -s nullglob; for f in ${glob}; do echo "$f"; done`], { cwd: d, encoding: 'utf8' }).split('\n').filter(Boolean).map((x) => path.basename(x)).sort();
        expect({ glob, wynik }).toEqual({ glob, wynik: ['05-x.yaml', '100-x.yaml', '109-x.yaml'] });
      }
    } finally { fs.rmSync(d, { recursive: true, force: true }); }
  });
});
