// Strażnik workflowu przekładu przez API (P-144, plan-prac 2.3): struktura bez sieci i bez uruchamiania. Wzór: tests/jakosc/linux-bramka.test.ts.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { YAML } from './maestro-runner';
import { parse, wyzwalacze } from './jakosc-ios-pomoc';

const tekst = readFileSync(join(__dirname, '../../.github/workflows/przeklad-tlumaczen.yml'), 'utf8');
const wf = parse(tekst);
const yaml = YAML.parse(tekst) as { permissions: Record<string, string>; on: { workflow_dispatch: { inputs: Record<string, { default: unknown; options?: string[] }> } }; jobs: Record<string, { permissions?: Record<string, string>; needs?: string; steps: { name?: string; run?: string; env?: Record<string, string> }[] }> };

describe('przeklad-tlumaczen.yml', () => {
  test('wyzwalacz tylko ręczny (workflow_dispatch), bez pull_request i push', () => {
    expect(Object.keys(wyzwalacze(tekst))).toEqual(['workflow_dispatch']);
  });
  test('sekret ANTHROPIC_API_KEY tylko w zadaniu przeklad i w jednym kroku; zadanie zapis bez sekretów', () => {
    const wystapienia = (j: string) => wf.jobs[j]?.steps?.filter((k) => JSON.stringify(k).includes('secrets.ANTHROPIC_API_KEY')).length ?? 0;
    expect(wystapienia('przeklad')).toBe(1);
    expect(JSON.stringify(wf.jobs.zapis)).not.toMatch(/secrets\.(?!GITHUB_TOKEN)/);
    expect(tekst.match(/secrets\./g)).toHaveLength(1);
  });
  test('uprawnienia: korzeń contents: read; zapis (contents: write) tylko w zadaniu bez sekretu', () => {
    expect(yaml.permissions).toEqual({ contents: 'read' });
    expect(yaml.jobs.przeklad.permissions).toBeUndefined();
    expect(yaml.jobs.zapis.permissions).toEqual({ contents: 'write' });
    expect(yaml.jobs.zapis.needs).toBe('przeklad');
  });
  test('domyślnie bezpiecznie: tylko szacunek, zgoda na koszt „nie”, model sonnet (wariant A, P-144)', () => {
    const i = yaml.on.workflow_dispatch.inputs;
    expect(i.tylko_szacuj.default).toBe(true);
    expect(i.zgoda_koszt.default).toBe('nie');
    expect(i.model.default).toBe('sonnet');
  });
  test('dane wejściowe tylko przez env (nie wprost w run:), wznow walidowany jako msgbatch_…', () => {
    for (const z of Object.values(yaml.jobs)) for (const k of z.steps) expect(k.run ?? '').not.toMatch(/\$\{\{\s*inputs\./);
    expect(tekst).toContain('^msgbatch_[A-Za-z0-9]+$');
  });
  test('zadanie zapis nie uruchamia się przy samym szacunku i nie dotyka src/', () => {
    expect(tekst).toMatch(/if: \$\{\{ !inputs\.tylko_szacuj \}\}/);
    expect(tekst).toContain('git add docs/lokalizacja/przeklad-api');
    expect(tekst).not.toMatch(/git add [^\n]*src\//);
  });
});
