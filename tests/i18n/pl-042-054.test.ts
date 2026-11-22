// Przegląd pl (P-422, P-473; zadania planu 042 i 054). Test przed poprawką tekstów.
// 042: pl `probka.uwaga_kategoria` ma oddać obie cechy włóczki z en („feel” = w dotyku, „drape” = jak się układa), nie dwa razy układanie (GRB-005).
// 054: {{miesiac}} to mianownik (Intl, pl „listopad”) — w pl nie stoi po przyimku wymagającym innego przypadku („w listopad” jest błędem; P-412, kontekst en).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KAT = join(__dirname, '..', '..', 'src', 'i18n', 'slowniki');
const plaski = (f: string): Record<string, string> => {
  const w: Record<string, string> = {};
  const s = (o: Record<string, unknown>, p = ''): void => { for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? s(v as Record<string, unknown>, `${p}${k}.`) : (w[p + k] = String(v)); };
  s(JSON.parse(readFileSync(join(KAT, f), 'utf8')) as Record<string, unknown>);
  return w;
};
const pl = plaski('pl.json');
const en = plaski('en.json');

test('042: en niesie dwie cechy (feel i drape); pl oddaje dotyk i układanie, a nie dwa razy układanie', () => {
  expect(en['probka.uwaga_kategoria']).toMatch(/feel/);
  expect(en['probka.uwaga_kategoria']).toMatch(/drape/);
  const t = pl['probka.uwaga_kategoria'] ?? '';
  expect(t).toMatch(/dotyk/);
  expect(t).toMatch(/układ/);
  expect(t).not.toMatch(/leżeć|leżą/);
});

test('054: pl projekty.dni — {{miesiac}} w każdej formie, nigdy po przyimku wymagającym innego przypadku niż mianownik', () => {
  const formy = Object.keys(pl).filter((k) => /^projekty\.dni_(one|few|many|other)$/.test(k));
  expect(formy.length).toBe(4);
  for (const k of formy) {
    expect(pl[k]).toContain('{{miesiac}}');
    expect(pl[k]).not.toMatch(/\b(w|we|do|od|z|ze|po|przed|dla|o|przy|u)\s+\{\{miesiac\}\}/i);
  }
});

test('054: żaden inny klucz pl nie stawia {{miesiac}} po przyimku wymagającym innego przypadku (na + biernik = mianownik jest dozwolone)', () => {
  const zle = Object.entries(pl).filter(([, v]) => /\b(w|we|do|od|z|ze|po|przed|dla|o|przy|u)\s+\{\{miesiac\}\}/i.test(v)).map(([k]) => k);
  expect(zle.sort()).toEqual([]);
});
