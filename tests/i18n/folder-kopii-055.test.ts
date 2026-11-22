// M1-audytor-generalny-055 (09-lokalizacja-010, LOK-11): trzy klucze wskazują folder kopii „Oczko › Backup” w Plikach. Kontekst tłumacza opisuje go
// jednym zdaniem (nie tłumaczyć „Backup”, „Oczko” = nazwa pod ikoną), a każdy przekład tych kluczy zawiera dokładną nazwę folderu z sciezki.ts
// i nazwę aplikacji z locales/systemowe (kontrola na falę 09, P-422: dziś klucze czekają na przekład).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sciezkiDanych } from '../../src/dane/baza/sciezki';
import { KLUCZE_FOLDERU, ZDANIE_FOLDERU } from './folder-kopii';

const KORZEN = join(__dirname, '..', '..');
const KAT = join(KORZEN, 'src', 'i18n', 'slowniki');
const czytaj = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as Record<string, Record<string, string>>;
const wartosc = (s: Record<string, Record<string, string>>, k: string) => { const [a, b] = k.split('.'); return a && b ? s[a]?.[b] : undefined; };
const FOLDER = sciezkiDanych('/kontener/Library').kopiePrzed.split('/').pop() ?? '';

test('nazwa folderu z sciezki.ts to „Backup” i en każdego klucza ją wymienia jako „Oczko › Backup”', () => {
  expect(FOLDER).toBe('Backup');
  const en = czytaj(join(KAT, 'en.json'));
  for (const k of KLUCZE_FOLDERU) expect([k, wartosc(en, k)]).toEqual([k, expect.stringContaining(`Oczko › ${FOLDER}`)]);
});

test('kontekst: to samo zdanie o folderze w trzech kluczach, bez sprzecznego „zgodnie z systemem” dla nazwy folderu', () => {
  const kx = czytaj(join(KAT, 'en.kontekst.json'));
  for (const k of KLUCZE_FOLDERU) {
    const opis = wartosc(kx, k) ?? '';
    expect([k, opis.includes(ZDANIE_FOLDERU)]).toEqual([k, true]);
    expect([k, opis.split('Oczko › Backup').length - 1]).toEqual([k, 1]); // jedyny opis ścieżki to wspólne zdanie
    expect([k, /folderu zgodnie z systemem/.test(opis)]).toEqual([k, false]);
  }
});

test('każdy przekład tych kluczy ma dokładnie „<nazwa pod ikoną> › Backup” (kontrola na falę 09)', () => {
  const zle: string[] = [];
  for (const f of readdirSync(KAT).filter((n) => /^[A-Za-z]{2,3}(-[A-Za-z0-9]+)?\.json$/.test(n) && n !== 'en.json')) {
    const j = f.slice(0, -5);
    const ikona = (JSON.parse(readFileSync(join(KORZEN, 'locales', 'systemowe', `${j}.json`), 'utf8')) as { ios: { CFBundleDisplayName: string } }).ios.CFBundleDisplayName;
    const s = czytaj(join(KAT, f));
    for (const k of KLUCZE_FOLDERU) { const v = wartosc(s, k); if (v !== undefined && !v.includes(`${ikona} › ${FOLDER}`)) zle.push(`${j} ${k}`); }
  }
  expect(zle).toEqual([]);
});
