/* Bramka pakietu podstawowego E2E także w przebiegu pełnym (F07-15, P-198 Q1a; P-180). Zadanie `e2e` w jakosc-ios.yml nie ma
 * continue-on-error; krok „Scenariusze” (i krok osobny) liczy porażki tylko scenariuszy z wyjścia `bramka` planu części (tag `podstawowy`),
 * pozostałe wypisuje jako „czerwony-informacyjnie”. Kroki workflowu uruchamiane tu w bashu z udawanym `maestro` (Linux; macOS dopiero w CI). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { parse, yamlKroki } from './jakosc-ios-pomoc';

const KORZEN = path.join(__dirname, '..', '..');
const wf = parse(fs.readFileSync(path.join(KORZEN, '.github/workflows/jakosc-ios.yml'), 'utf8'));
const krok = (nazwa: RegExp) => { const k = yamlKroki(wf, 'e2e').find((x) => nazwa.test(x.name ?? '')); if (!k?.run) throw new Error(`brak kroku ${nazwa}`); return k; };

/** Uruchamia `run:` kroku jak GitHub (bash -e) w katalogu z e2e-czesc/; `maestro` pada dla plików z listy `czerwone`. */
function uruchom(nazwa: RegExp, pliki: string[], czerwone: string[], env: Record<string, string>, osobne = false) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-bramka-'));
  const kat = path.join(d, 'e2e-czesc', ...(osobne ? ['osobne'] : []));
  fs.mkdirSync(kat, { recursive: true });
  for (const f of pliki) fs.writeFileSync(path.join(kat, f), 'appId: x\n---\n- launchApp\n');
  const bin = path.join(d, 'bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'maestro'), `#!/bin/bash\nfor a in "$@"; do case "$a" in *.yaml) n=$(basename "$a" .yaml);; esac; done\n[[ " ${czerwone.join(' ')} " == *" $n "* ]] && exit 1 || exit 0\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'xcrun'), '#!/bin/bash\nexit 0\n', { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'python3'), '#!/bin/bash\nexit 0\n', { mode: 0o755 });
  const skrypt = path.join(d, 'krok.sh'); const podsumowanie = path.join(d, 'summary.md'); fs.writeFileSync(podsumowanie, '');
  fs.writeFileSync(skrypt, krok(nazwa).run!.replace(/\$\{\{ matrix\.czesc \}\}/g, '1').replace(/\$\{\{ matrix\.urzadzenie \}\}/g, 'iphone'));
  const r = spawnSync('bash', ['-e', skrypt], { cwd: d, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SIM: 'sim', GITHUB_STEP_SUMMARY: podsumowanie, PONAWIALNE: '', BRAMKA: '', ...env } });
  return { kod: r.status, podsumowanie: fs.readFileSync(podsumowanie, 'utf8') };
}

describe('jakosc-ios.yml: bramka pakietu podstawowego w każdym pakiecie (F07-15, P-198 Q1a)', () => {
  test('zadanie e2e: continue-on-error tylko dla pozycji iPada (inaczej „[e2e-pelny]” wyłącza bramkę scenariuszy podstawowych; P-225 Q1a)', () => {
    expect(String(wf.jobs.e2e['continue-on-error']).replace(/\s+/g, ' ')).toBe("${{ matrix.urzadzenie == 'ipad' }}");
    expect(JSON.stringify(yamlKroki(wf, 'e2e').find((x) => /^Plan części$/.test(x.name ?? '')))).toMatch(/matrix\.urzadzenie == 'ipad' && 'ipad'/);
  });

  test('krok „Scenariusze” dostaje listę bramki z planu części', () => {
    expect(krok(/^Scenariusze$/).run).toMatch(/BRAMKA/);
    expect(JSON.stringify(yamlKroki(wf, 'e2e').find((x) => /^Scenariusze$/.test(x.name ?? '')))).toMatch(/steps\.plan\.outputs\.bramka/);
  });

  const pliki = ['04-br-lic-002-s1-plus-minus-cofnij.yaml', '10-nfr-dan-002-kazda-zmiana-trwala.yaml'];
  test('pakiet pełny: czerwony scenariusz podstawowy → krok czerwony', () => {
    const r = uruchom(/^Scenariusze$/, pliki, ['04-br-lic-002-s1-plus-minus-cofnij'], { BRAMKA: pliki[0] });
    expect(r.kod).not.toBe(0);
    expect(r.podsumowanie).toMatch(/czerwony 04-/);
  });

  test('pakiet pełny: czerwony scenariusz spoza pakietu podstawowego → krok zielony, wynik „czerwony-informacyjnie” w podsumowaniu', () => {
    const r = uruchom(/^Scenariusze$/, pliki, ['10-nfr-dan-002-kazda-zmiana-trwala'], { BRAMKA: pliki[0] });
    expect(r.kod).toBe(0);
    expect(r.podsumowanie).toMatch(/czerwony-informacyjnie 10-/);
  });

  test('pakiet podstawowy (bramka = wszystkie scenariusze części): każda porażka czerwona; wszystkie zielone → kod 0', () => {
    expect(uruchom(/^Scenariusze$/, pliki, ['10-nfr-dan-002-kazda-zmiana-trwala'], { BRAMKA: pliki.join(' ') }).kod).not.toBe(0);
    expect(uruchom(/^Scenariusze$/, pliki, [], { BRAMKA: pliki.join(' ') }).kod).toBe(0);
  });

  test('krok osobny (AX5): ta sama reguła — poza bramką informacyjnie, w bramce czerwony', () => {
    const f = ['30-nfr-dos-002-duzy-tekst.yaml'];
    expect(uruchom(/osobnym kroku/, f, ['30-nfr-dos-002-duzy-tekst'], { BRAMKA: '' }, true).kod).toBe(0);
    expect(uruchom(/osobnym kroku/, f, ['30-nfr-dos-002-duzy-tekst'], { BRAMKA: f[0] }, true).kod).not.toBe(0);
  });
});
