// Strażnik workflow przekładu przez API (P-474, P-144): ręczny, odczyt repo, klucz w jednym kroku, wynik tylko jako artefakt, domyślnie sam szacunek.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const W = readFileSync(join(__dirname, '../../.github/workflows/przeklad-tlumaczen.yml'), 'utf8');
const bezKomentarzy = W.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');

describe('workflow przeklad-tlumaczen.yml', () => {
  test('tylko ręcznie (workflow_dispatch), uprawnienia contents: read, bez środowiska i bez zapisu do repo', () => {
    expect(bezKomentarzy).toMatch(/^on:\n  workflow_dispatch:/m);
    expect(bezKomentarzy).not.toMatch(/^\s*(push|pull_request|schedule):/m);
    expect(bezKomentarzy).toMatch(/permissions:\n  contents: read/);
    expect(bezKomentarzy).not.toMatch(/^\s*environment:/m);
    expect(bezKomentarzy).not.toMatch(/git (push|commit|add)|contents: write|persist-credentials: true/);
    expect(bezKomentarzy).toMatch(/persist-credentials: false/);
  });
  test('sekret ANTHROPIC_API_KEY tylko w jednym kroku, jako zmienna środowiskowa; nigdy w argumentach ani echo', () => {
    expect(bezKomentarzy.match(/secrets\./g)).toHaveLength(1);
    expect(bezKomentarzy).toMatch(/ANTHROPIC_API_KEY: \$\{\{ secrets\.ANTHROPIC_API_KEY \}\}/);
    expect(bezKomentarzy).not.toMatch(/echo[^\n]*(API_KEY|secrets)/);
  });
  test('domyślnie tylko szacunek, limit 6 USD bez zgody, zakres = oczekujace.json bez pl, wynik jako artefakt 7 dni', () => {
    expect(bezKomentarzy).toMatch(/tylko_szacuj:[\s\S]*?default: true/);
    expect(bezKomentarzy).toMatch(/zgoda_koszt:[\s\S]*?default: 'nie'/);
    expect((bezKomentarzy.match(/--zakres docs\/lokalizacja\/oczekujace\.json --pomin pl/g) ?? []).length).toBe(2);
    expect(bezKomentarzy).toMatch(/upload-artifact@v4[\s\S]*name: raport-przekladu[\s\S]*retention-days: 7/);
    expect(bezKomentarzy).not.toMatch(/src\/i18n\/slowniki/);
  });
});
