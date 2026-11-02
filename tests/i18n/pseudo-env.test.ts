// 09-lokalizacja-004 (M1-051): pseudolokalizacja en-XA w buildzie deweloperskim z EXPO_PUBLIC_PSEUDO=1 (i18n.ts: „nigdy w supportedLocales”).
// Zasoby wybiera moduł słowników (odwołanie statyczne do process.env, jak tryb-e2e.ts); kontener przekazuje je do utworzI18n.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type * as Slowniki from '../../src/i18n/slowniki';
import { JEZYK_PSEUDO, utworzI18n, type MagazynPreferencji } from '../../src/i18n/i18n';

const KORZEN = join(__dirname, '..', '..');
const magazyn: MagazynPreferencji = { odczytaj: async () => null, zapisz: async () => {} };

function zaladuj(pseudo: string | undefined): typeof Slowniki {
  let m: typeof Slowniki | undefined;
  const przed = process.env.EXPO_PUBLIC_PSEUDO;
  if (pseudo === undefined) delete process.env.EXPO_PUBLIC_PSEUDO; else process.env.EXPO_PUBLIC_PSEUDO = pseudo;
  jest.isolateModules(() => { m = require('../../src/i18n/slowniki') as typeof Slowniki; });
  if (przed === undefined) delete process.env.EXPO_PUBLIC_PSEUDO; else process.env.EXPO_PUBLIC_PSEUDO = przed;
  if (!m) throw new Error('moduł nie załadowany');
  return m;
}

describe('pseudolokalizacja za EXPO_PUBLIC_PSEUDO (M1-051)', () => {
  it('EXPO_PUBLIC_PSEUDO=1: język en-XA, t() zwraca tekst w ⟦…⟧ z wstawionymi parametrami', async () => {
    const m = zaladuj('1');
    const i = await utworzI18n({ magazyn, systemowe: () => ['pl-PL'], zasoby: m.ZASOBY, pseudo: m.ZASOBY_PSEUDO });
    expect(i.jezyk()).toBe(JEZYK_PSEUDO);
    expect(i.t('licznik.po_dodaniu', { zrobione: 3, nastepny: 4 })).toMatch(/^⟦3 .*4.*⟧$/);
  });

  it('tylko wartość „1” włącza pseudo; brak, „0” i „true” = zwykły wybór języka', () => {
    expect(zaladuj('1').ZASOBY_PSEUDO).toBeDefined();
    for (const v of [undefined, '0', 'true']) expect(zaladuj(v).ZASOBY_PSEUDO).toBeUndefined();
  });

  it('kontener przekazuje ZASOBY_PSEUDO do utworzI18n', () => {
    const kod = readFileSync(join(KORZEN, 'src/kompozycja/kontener.ts'), 'utf8');
    expect(kod).toMatch(/utworzI18n\(\{.*\bpseudo: ZASOBY_PSEUDO\b.*\}\);/); // jedna linia wywołania (. bez nowych linii)
  });
});
