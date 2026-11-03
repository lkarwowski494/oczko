// M1-audytor-generalny-108 (09-lokalizacja-512, trwała kontrola 501): w „{{zostalo}} of {{limit}} free crafting days” forma liczby mnogiej idzie za
// {{limit}} (count = limit). Kontekst tłumacza zabrania zgody czasownika i rzeczownika z {{zostalo}}, a każdy język z przekładem `projekty.dni`
// ma zatwierdzoną tabelę wektorów (zostalo ∈ {0, 1, 2, 5}, limit = 5): język dopisany w fali bez wektorów albo z inną treścią = czerwień.
// Wektory pl, ru, lt, cs = przekłady zweryfikowane w P-412 (a); pl z „w {{miesiac}}” do poprawki przypadku po uwadze właściciela (M1-audytor-generalny-054, P-422).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';

const ZOSTALO = [0, 1, 2, 5] as const;
const WEKTORY: Record<string, [string, string, string, string]> = {
  en: ['0 of 5 free crafting days left in M', '1 of 5 free crafting days left in M', '2 of 5 free crafting days left in M', '5 of 5 free crafting days left in M'],
  pl: ['Zostało 0 z 5 darmowych dni robótkowych w M', 'Zostało 1 z 5 darmowych dni robótkowych w M', 'Zostało 2 z 5 darmowych dni robótkowych w M', 'Zostało 5 z 5 darmowych dni robótkowych w M'],
  ru: ['M: осталось 0 из 5 бесплатных дней рукоделия', 'M: осталось 1 из 5 бесплатных дней рукоделия', 'M: осталось 2 из 5 бесплатных дней рукоделия', 'M: осталось 5 из 5 бесплатных дней рукоделия'],
  lt: ['M: liko 0 iš 5 nemokamų rankdarbio dienų', 'M: liko 1 iš 5 nemokamų rankdarbio dienų', 'M: liko 2 iš 5 nemokamų rankdarbio dienų', 'M: liko 5 iš 5 nemokamų rankdarbio dienų'],
  cs: ['Zbývá 0 z 5 volných dnů tvoření pro M', 'Zbývá 1 z 5 volných dnů tvoření pro M', 'Zbývá 2 z 5 volných dnů tvoření pro M', 'Zbývá 5 z 5 volných dnů tvoření pro M'],
};
const maPrzeklad = (j: string) => {
  const s = (ZASOBY as Record<string, { translation: Record<string, Record<string, unknown>> }>)[j]?.translation.projekty ?? {};
  return Object.keys(s).some((k) => /^dni(_(zero|one|two|few|many|other))?$/.test(k));
};
const Z_PRZEKLADEM = Object.keys(ZASOBY).filter(maPrzeklad).sort();

test('kontekst projekty.dni zabrania zgody z {{zostalo}} (czasownik i rzeczownik)', () => {
  const kx = JSON.parse(readFileSync(join(__dirname, '..', '..', 'src', 'i18n', 'slowniki', 'en.kontekst.json'), 'utf8')) as { projekty: { dni: string } };
  expect(kx.projekty.dni).toMatch(/ani czasownik, ani rzeczownik nie może zgadzać się z \{\{zostalo\}\}/);
});

test('każdy język z przekładem projekty.dni ma tabelę wektorów (i odwrotnie)', () => {
  expect(Z_PRZEKLADEM).toEqual(Object.keys(WEKTORY).sort());
});

describe.each(Z_PRZEKLADEM)('%s: t(projekty.dni) = tabela wektorów przy limit = 5', (jezyk) => {
  test.each(ZOSTALO.map((z, i) => [z, i] as const))('zostalo = %i', async (zostalo, i) => {
    const { t } = await utworzI18n({ magazyn: { odczytaj: async () => jezyk, zapisz: async () => {} }, systemowe: () => [], zasoby: ZASOBY });
    expect(t('projekty.dni', { count: 5, zostalo, limit: 5, miesiac: 'M' })).toBe(WEKTORY[jezyk]?.[i]);
  });
});
