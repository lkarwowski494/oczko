// M1-audytor-generalny-108 (09-lokalizacja-512, trwała kontrola 501): w „{{zostalo}} of {{limit}} free crafting days” forma liczby mnogiej idzie za
// {{limit}} (count = limit). Kontekst tłumacza zabrania zgody czasownika i rzeczownika z {{zostalo}}, a każdy język z przekładem `projekty.dni`
// ma zatwierdzoną tabelę wektorów (zostalo ∈ {0, 1, 2, 5}, limit = 5): język dopisany w fali bez wektorów albo z inną treścią = czerwień.
// Wektory pl, ru, lt, cs = przekłady zweryfikowane w P-412 (a); pl: „({{miesiac}})” zamiast „w {{miesiac}}” (M1-audytor-generalny-054, 2026-11-03; do akceptacji właściciela, P-422).
// Pozostałe 30 języków: fala przekładu 2026-11-03 (P-474) + drugi przegląd AI (P-486) — tabela w projekty-dni-wektory-108.json (generuje
// scripts/i18n/wektory-projekty-dni.mjs po każdej zmianie słownika; zmiana treści = widoczny diff do przeglądu). To blokada regresji, nie dowód poprawności
// gramatycznej: tę oceniał przegląd AI (reguła „forma za {{limit}}”), a przegląd rodzimy (jezyki.md) może ją zmienić — wtedy wektory regeneruje się świadomie.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';

const ZOSTALO = [0, 1, 2, 5] as const;
const WEKTORY: Record<string, [string, string, string, string]> = {
  en: ['0 of 5 free crafting days left in M', '1 of 5 free crafting days left in M', '2 of 5 free crafting days left in M', '5 of 5 free crafting days left in M'],
  pl: ['Zostało 0 z 5 darmowych dni robótkowych (M)', 'Zostało 1 z 5 darmowych dni robótkowych (M)', 'Zostało 2 z 5 darmowych dni robótkowych (M)', 'Zostało 5 z 5 darmowych dni robótkowych (M)'],
  ru: ['M: осталось 0 из 5 бесплатных дней рукоделия', 'M: осталось 1 из 5 бесплатных дней рукоделия', 'M: осталось 2 из 5 бесплатных дней рукоделия', 'M: осталось 5 из 5 бесплатных дней рукоделия'],
  lt: ['M: liko 0 iš 5 nemokamų rankdarbio dienų', 'M: liko 1 iš 5 nemokamų rankdarbio dienų', 'M: liko 2 iš 5 nemokamų rankdarbio dienų', 'M: liko 5 iš 5 nemokamų rankdarbio dienų'],
  cs: ['Zbývá 0 z 5 volných dnů tvoření pro M', 'Zbývá 1 z 5 volných dnů tvoření pro M', 'Zbývá 2 z 5 volných dnů tvoření pro M', 'Zbývá 5 z 5 volných dnů tvoření pro M'],
};
const PO_FALI = (JSON.parse(readFileSync(join(__dirname, 'projekty-dni-wektory-108.json'), 'utf8')) as { jezyki: Record<string, [string, string, string, string]> }).jezyki;
const WSZYSTKIE_WEKTORY: Record<string, [string, string, string, string]> = { ...PO_FALI, ...WEKTORY };
const maPrzeklad = (j: string) => {
  const s = (ZASOBY as Record<string, { translation: Record<string, Record<string, unknown>> }>)[j]?.translation.projekty ?? {};
  return Object.keys(s).some((k) => /^dni(_(zero|one|two|few|many|other))?$/.test(k));
};
const Z_PRZEKLADEM = Object.keys(ZASOBY).filter(maPrzeklad).sort();

test('kontekst projekty.dni zabrania zgody z {{zostalo}} (czasownik i rzeczownik)', () => {
  const kx = JSON.parse(readFileSync(join(__dirname, '..', '..', 'src', 'i18n', 'slowniki', 'en.kontekst.json'), 'utf8')) as { projekty: { dni: string } };
  expect(kx.projekty.dni).toMatch(/ani czasownik, ani rzeczownik nie może zgadzać się z \{\{zostalo\}\}/);
});

test('każdy język z przekładem projekty.dni ma tabelę wektorów (i odwrotnie); tabela po fali nie dubluje ręcznie zweryfikowanych', () => {
  expect(Object.keys(PO_FALI).filter((j) => j in WEKTORY)).toEqual([]);
  expect(Z_PRZEKLADEM).toEqual(Object.keys(WSZYSTKIE_WEKTORY).sort());
  expect(Z_PRZEKLADEM.length).toBe(35);
});
test('każdy wektor niesie wszystkie trzy parametry: liczbę dni (zostalo), limit 5 i miesiąc (M); żadnego niewypełnionego {{…}}', () => {
  for (const [j, w] of Object.entries(WSZYSTKIE_WEKTORY)) w.forEach((s, i) => {
    expect([j, i, s.includes(String(ZOSTALO[i])), s.includes('5'), s.includes('M'), /\{\{|\}\}/.test(s)]).toEqual([j, i, true, true, true, false]);
  });
});

describe.each(Z_PRZEKLADEM)('%s: t(projekty.dni) = tabela wektorów przy limit = 5', (jezyk) => {
  test.each(ZOSTALO.map((z, i) => [z, i] as const))('zostalo = %i', async (zostalo, i) => {
    const { t } = await utworzI18n({ magazyn: { odczytaj: async () => jezyk, zapisz: async () => {} }, systemowe: () => [], zasoby: ZASOBY });
    expect(t('projekty.dni', { count: 5, zostalo, limit: 5, miesiac: 'M' })).toBe(WSZYSTKIE_WEKTORY[jezyk]?.[i]);
  });
});
