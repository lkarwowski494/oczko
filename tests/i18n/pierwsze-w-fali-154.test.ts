// M1-audytor-generalny-154 (09-lokalizacja-515, trwała kontrola 511): klucz czekający na falę przekładu, którego parametr formatuje się w języku
// aplikacji (data, miesiąc, godzina przez Intl), albo zdanie stanu z grupy 034 (licznik.powtorzenie, licznik.przypomnienie_postep) dawało do fali zdanie
// mieszane („Done by 4 lis, today 2 of 5 rows”). Do fali były na liście `pierwsze_w_fali` w oczekujace.json (fala 09 zaczęła od nich, P-422), a bramka --wydanie
// kończyła się kodem 1, dopóki czekały. Po fali 2026-11-03 (P-474) te klucze mają przekład w 33 językach, lista jest pusta, a zakres fali (kopia listy sprzed fali)
// pozwala pilnować klasy dalej: kluczy z parametrem w języku aplikacji nie może zabraknąć w żadnym języku (inaczej wraca zdanie mieszane). Test akceptacyjny
// pl/de/ja/ru bez słów en (P-422) dopisze 09 po przeglądzie rodzimym.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stanListyOczekujacych } from './wyjatek-build4';
import { JEZYKI_FALI, ZAKRES_FALI, brakiPrzekladu, teksty } from './fala-2026-11-03';

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
const mieszane = ZAKRES_FALI.filter((k) => PARAMETR_JEZYKA.test(enWgBazy[k] ?? '') || GRUPA_034.includes(k)).sort();

test('klucze z zakresu fali z parametrem w języku aplikacji (albo z grupy 034): przetłumaczone w 33 językach, z tym samym parametrem, i już nie czekają (lista oczekujących, pierwsze_w_fali puste)', () => {
  expect(mieszane).toEqual(expect.arrayContaining(['licznik.powtorzenie', 'projekt.termin_dzis', 'projekt.termin_po']));
  expect(mieszane.filter((k) => OCZ.klucze.includes(k) || (OCZ.pierwsze_w_fali ?? []).includes(k))).toEqual([]);
  expect(mieszane.flatMap((k) => brakiPrzekladu(k).map((j) => `${j} ${k}`))).toEqual([]);
  // parametr języka aplikacji (data, miesiąc, godzina) zostaje w przekładzie: bez niego zdanie nie pokazałoby daty w języku aplikacji (łączny zbiór parametrów jak w sprawdz-i18n)
  const bezParametru: string[] = [];
  for (const k of mieszane.filter((x) => PARAMETR_JEZYKA.test(enWgBazy[x] ?? ''))) {
    const wym = [...new Set(enWgBazy[k]?.match(new RegExp(PARAMETR_JEZYKA, 'g')) ?? [])];
    for (const j of JEZYKI_FALI) { const t = teksty(j, k).join(' '); for (const p of wym) if (!t.includes(p)) bezParametru.push(`${j} ${k} ${p}`); }
  }
  expect(bezParametru).toEqual([]);
});

test('pierwsze_w_fali ⊆ klucze, posortowane, bez powtórzeń (lista się nie starzeje)', () => {
  const l = OCZ.pierwsze_w_fali ?? [];
  expect(l.filter((k) => !OCZ.klucze.includes(k))).toEqual([]);
  expect([...new Set(l)].sort()).toEqual(l);
});

test('po fali: bramka --wydanie nie pada z powodu listy oczekujących; jedyne możliwe błędy to kontrola (a) treści krytycznej (DEC-11 a, osobny krok 09)', () => {
  const r = spawnSync(process.execPath, ['scripts/sprawdz-i18n.mjs', 'src/i18n/slowniki', '--zrodlo', 'en', '--oczekujace', 'docs/lokalizacja/oczekujace.json',
    '--krytyczne', 'docs/lokalizacja/krytyczne.json', '--przeglad', 'docs/lokalizacja/przeglad-krytyczne.json', '--wydanie'], { cwd: KORZEN, encoding: 'utf8' });
  const wyjatek = stanListyOczekujacych(KORZEN).tylkoWyjatekBuildu4; // KO-027/P-692: do fali 09 buildu 4 lista zawiera tylko 61 kluczy przewodnika
  if (wyjatek) { expect(r.stdout).toMatch(/oczekujace\.json niepusta/); expect(r.status).toBe(1); } else expect(r.stdout).not.toMatch(/oczekujace\.json niepusta/);
  const bledy = r.stdout.split('\n').filter((w) => w.startsWith('BŁĄD'));
  expect(bledy.filter((w) => !/kontrola \(a\) treści krytycznej/.test(w) && !(wyjatek && /oczekujace\.json niepusta/.test(w)))).toEqual([]);
  expect(r.status).toBe(bledy.length ? 1 : 0);
});
