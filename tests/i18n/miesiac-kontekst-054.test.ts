// M1-audytor-generalny-054 (09-lokalizacja-009, LOK-11): {{miesiac}} to nazwa miesiąca z Intl (`month: 'long'`), czyli mianownik (pl „listopad”).
// Kontekst każdego klucza z {{miesiac}} mówi tłumaczowi, że to mianownik i nie może stać po przyimku wymagającym innego przypadku.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KAT = join(__dirname, '..', '..', 'src', 'i18n', 'slowniki');
const plaski = (f: string): Record<string, string> => {
  const w: Record<string, string> = {};
  const s = (o: Record<string, unknown>, p = ''): void => { for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? s(v as Record<string, unknown>, `${p}${k}.`) : (w[p + k] = String(v)); };
  s(JSON.parse(readFileSync(join(KAT, f), 'utf8')) as Record<string, unknown>);
  return w;
};

test('kontekst kluczy z {{miesiac}}: „mianownik, nie po przyimku”', () => {
  const en = plaski('en.json'), kontekst = plaski('en.kontekst.json');
  const bazy = [...new Set(Object.entries(en).filter(([, v]) => v.includes('{{miesiac}}')).map(([k]) => k.replace(/_(zero|one|two|few|many|other)$/, '')))].sort();
  expect(bazy.length).toBeGreaterThan(0);
  expect(bazy.filter((b) => !/mianownik, nie po przyimku/.test(kontekst[b] ?? ''))).toEqual([]);
});
