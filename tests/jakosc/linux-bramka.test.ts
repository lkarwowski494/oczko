// JAK-09 (P-290): w „Jakość · Linux” żadne zadanie nie jest informacyjne — `akceptacja` (testy przed kodem) przeszła zielona i jest bramką
// jak `verify`. Nowe zadanie informacyjne wymaga wpisu tutaj z ID decyzji (zasada 8: najpierw raz informacyjnie w CI).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './jakosc-ios-pomoc';

const INFORMACYJNE: Record<string, string> = {}; // zadanie → ID decyzji

test('jakosc-linux.yml: continue-on-error tylko przy zadaniach z listy INFORMACYJNE', () => {
  const wf = parse(readFileSync(join(__dirname, '../../.github/workflows/jakosc-linux.yml'), 'utf8'));
  expect(Object.keys(wf.jobs)).toContain('akceptacja');
  const informacyjne = Object.entries(wf.jobs).filter(([, z]) => z['continue-on-error'] !== undefined && z['continue-on-error'] !== false).map(([id]) => id);
  expect(informacyjne.filter((id) => !(id in INFORMACYJNE))).toEqual([]);
});

// M1-audytor-generalny-161 (07-jakosc-525; JAK-05, „Polityka niestabilnych testów” pkt 3): test zależny od kolejności (stan modułu w haku E2E,
// M1-043) przechodzi w stałej kolejności CI. Krok `jest --randomize` z ziarnem wyliczonym z SHA (to samo ziarno przy ponowieniu, wypisane do
// podsumowania) tasuje kolejność testów w pliku na każdym pushu.
test('jakosc-linux.yml: zadanie verify ma krok Jest z --randomize i ziarnem z SHA, wypisanym w podsumowaniu', () => {
  const wf = parse(readFileSync(join(__dirname, '../../.github/workflows/jakosc-linux.yml'), 'utf8'));
  const kroki = (wf.jobs.verify?.steps ?? []).filter((k) => /\bjest\b/.test(k.run ?? '') && /--randomize\b/.test(k.run ?? ''));
  expect(kroki).toHaveLength(1);
  const run = kroki[0].run ?? '';
  expect(run).toMatch(/--seed[= ]"?\$\{?seed\}?"?/);
  expect(run).toMatch(/seed=\$\(\(16#\$\{GITHUB_SHA:0:7\}\)\)/); // 28 bitów, w zakresie --seed Jesta
  expect(run).toMatch(/\$seed[^\n]*>> "\$GITHUB_STEP_SUMMARY"/);
  expect(kroki[0]).not.toHaveProperty('continue-on-error');
});
