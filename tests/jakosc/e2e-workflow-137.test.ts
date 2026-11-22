/* E2-137-S2 · przebieg #137 część 2: krok „Scenariusze w osobnym kroku (AX5)” miał domyślne `success()`, więc po czerwonym kroku „Scenariusze” (07 czerwony) scenariusz 30 nie biegł. */
import * as fs from 'fs';
import * as path from 'path';
import { parse, yamlKroki } from './jakosc-ios-pomoc';

const KOR = path.join(__dirname, '..', '..');

describe('E2-137-S2 · krok AX5 biegnie także po czerwonym kroku „Scenariusze” (30)', () => {
  const wf = parse(fs.readFileSync(path.join(KOR, '.github/workflows/jakosc-ios.yml'), 'utf8'));
  const krok = (re: RegExp) => yamlKroki(wf, 'e2e').find((k) => re.test(k.name ?? '')) as (ReturnType<typeof yamlKroki>[number] & { if?: string }) | undefined;
  test('warunek kroku osobnego: !cancelled() albo always() oraz plan.outputs.osobne', () => {
    const k = krok(/osobnym kroku.*AX5/);
    expect(k).toBeDefined();
    expect(String(k?.if)).toMatch(/!cancelled\(\)|always\(\)/);
    expect(String(k?.if)).toContain("steps.plan.outputs.osobne == 'true'");
  });
  test('krok „Scenariusze” nadal może zawieść zadanie (exit $porazki) — pominięcie AX5 nie zastępuje bramki', () => {
    expect(krok(/^Scenariusze$/)?.run).toContain('exit $porazki');
    expect(krok(/osobnym kroku.*AX5/)?.run).toContain('exit $porazki');
  });
});

