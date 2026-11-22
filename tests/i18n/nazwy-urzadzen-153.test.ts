// M1-audytor-generalny-153 (09-lokalizacja-514, LOK-11; trwała kontrola klasy 060): nazwa urządzenia („iPhon…” w każdej odmianie, „iPad”) występuje
// w przekładzie tylko wtedy, gdy jest w tekście en tego klucza. Źródło mówi „this device”, więc przekład nie może mówić „ten iPhone” (iPad, P-427).
// Kontekst tłumacza nie obiecuje zamiany „iPhone” na „iPad” w kodzie (takiej zamiany nie ma).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ZASOBY } from '../../src/i18n/slowniki';

const MODEL = /iPhon|iPad/;
const FORMA = /_(zero|one|two|few|many|other)$/;
const plaskie = (o: Record<string, unknown>, p = '', w: Record<string, string> = {}): Record<string, string> => {
  for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? plaskie(v as Record<string, unknown>, `${p}${k}.`, w) : (w[p + k] = String(v));
  return w;
};
const zasoby = ZASOBY as Record<string, { translation: Record<string, unknown> }>;
const enWgBazy = (() => {
  const w: Record<string, string> = {};
  for (const [k, v] of Object.entries(plaskie(zasoby.en?.translation ?? {}))) { const b = k.replace(FORMA, ''); w[b] = `${w[b] ?? ''} ${v}`; }
  return w;
})();

/** Pozycje „język klucz”, w których przekład ma nazwę urządzenia, a en tego klucza (żadna z form) jej nie ma. */
const nazwyBezZrodla = (): string[] => Object.keys(zasoby).filter((j) => j !== 'en').sort().flatMap((j) =>
  Object.entries(plaskie(zasoby[j]?.translation ?? {})).filter(([k, v]) => MODEL.test(v) && !MODEL.test(enWgBazy[k.replace(FORMA, '')] ?? '')).map(([k]) => `${j} ${k}`));

// Nazwany wyjątek do fali 09 (P-422): pt-BR „Igual ao iPhone” przy en „Same as phone”. Usunięcie przekładu dałoby wariant pt-PT „Como o telemóvel”
// (łańcuch pt-BR → pt → en), więc poprawka to nowy przekład pt-BR w fali; brzmienie en na iPadzie ocenia 04. Wyjątek nie może się zestarzeć.
const DO_FALI = ['pt-BR ustawienia.jezyk_automatyczny'];

test('nazwa urządzenia w przekładzie tylko, gdy jest w en (poza nazwanym wyjątkiem do fali)', () => {
  const w = nazwyBezZrodla();
  expect(w.filter((x) => !DO_FALI.includes(x))).toEqual([]);
  expect(DO_FALI.filter((x) => !w.includes(x))).toEqual([]);
});

test('reguła łapie odmianę polską („na tym iPhonie”) i mianownik', () => {
  expect(MODEL.test('Wszystko jest zapisane na tym iPhonie.')).toBe(true);
  expect(MODEL.test('Alles bleibt auf diesem iPhone.')).toBe(true);
  expect(MODEL.test('auf diesem iPad')).toBe(true);
});

test('kontekst tłumacza nie mówi o zamianie „iPhone” na „iPad” w kodzie', () => {
  const kx = readFileSync(join(__dirname, '..', '..', 'src', 'i18n', 'slowniki', 'en.kontekst.json'), 'utf8');
  expect(kx).not.toMatch(/zamieniany na „iPad”/);
});
