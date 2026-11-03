// M1-audytor-generalny-154 (09-lokalizacja-515, trwała kontrola 511): klucz czekający na falę przekładu, którego parametr formatuje się w języku
// aplikacji (data, miesiąc, godzina przez Intl), albo zdanie stanu z grupy 034 (licznik.powtorzenie, licznik.przypomnienie_postep) daje do fali zdanie
// mieszane („Done by 4 lis, today 2 of 5 rows”). Takie klucze są na liście `pierwsze_w_fali` w oczekujace.json (fala 09 zaczyna od nich, P-422),
// a bramka --wydanie kończy się kodem 1, dopóki czekają. Po fali (P-422) test akceptacyjny pl/de/ja/ru bez słów en dopisze 09.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
const OCZ = czytaj('docs/lokalizacja/oczekujace.json') as { klucze: string[]; pierwsze_w_fali?: string[] };
const FORMA = /_(zero|one|two|few|many|other)$/;
const enWgBazy = (() => {
  const w: Record<string, string> = {};
  const s = (o: Record<string, unknown>, p = ''): void => { for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? s(v as Record<string, unknown>, `${p}${k}.`) : (w[(p + k).replace(FORMA, '')] = `${w[(p + k).replace(FORMA, '')] ?? ''} ${String(v)}`); };
  s(czytaj('src/i18n/slowniki/en.json') as Record<string, unknown>);
  return w;
})();
const PARAMETR_JEZYKA = /\{\{(data|miesiac|godzina)\}\}/;
const GRUPA_034 = ['licznik.powtorzenie', 'licznik.przypomnienie_postep'];
const mieszane = OCZ.klucze.filter((k) => PARAMETR_JEZYKA.test(enWgBazy[k] ?? '') || GRUPA_034.includes(k)).sort();

test('każdy czekający klucz z parametrem w języku aplikacji (albo z grupy 034) jest na liście pierwsze_w_fali', () => {
  expect(mieszane).toEqual(expect.arrayContaining(['licznik.powtorzenie', 'projekt.termin_dzis', 'projekt.termin_po']));
  expect(mieszane.filter((k) => !(OCZ.pierwsze_w_fali ?? []).includes(k))).toEqual([]);
});

test('pierwsze_w_fali ⊆ klucze, posortowane, bez powtórzeń (lista się nie starzeje)', () => {
  const l = OCZ.pierwsze_w_fali ?? [];
  expect(l.filter((k) => !OCZ.klucze.includes(k))).toEqual([]);
  expect([...new Set(l)].sort()).toEqual(l);
});

test('do fali: bramka --wydanie kończy się kodem 1 (lista oczekujących niepusta)', () => {
  const r = spawnSync(process.execPath, ['scripts/sprawdz-i18n.mjs', 'src/i18n/slowniki', '--zrodlo', 'en', '--oczekujace', 'docs/lokalizacja/oczekujace.json',
    '--krytyczne', 'docs/lokalizacja/krytyczne.json', '--przeglad', 'docs/lokalizacja/przeglad-krytyczne.json', '--wydanie'], { cwd: KORZEN, encoding: 'utf8' });
  expect(r.status).toBe(1);
  expect(r.stdout).toMatch(/BŁĄD wydanie: oczekujace\.json niepusta/);
});
