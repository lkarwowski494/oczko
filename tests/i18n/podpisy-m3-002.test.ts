// 09-lokalizacja-002 (E5 redesignu M3): podpisy zakładek i akcji M3 mówią to samo co tytuły ekranów, które otwierają, i etykiety VoiceOver tego samego elementu.
// Pary: zakładka ↔ tytuł ekranu; akcja „Stoper” ↔ stoper.* (etykiety VoiceOver); akcja „Wzór” ↔ tytuł ekranu wzoru i etykieta VoiceOver wzoru.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KAT = join(__dirname, '..', '..', 'src', 'i18n', 'slowniki');
type Drzewo = { [k: string]: string | Drzewo };
const splaszcz = (o: Drzewo, p = '', w: Record<string, string> = {}): Record<string, string> => {
  for (const [k, v] of Object.entries(o)) typeof v === 'object' ? splaszcz(v, `${p}${k}.`, w) : (w[p + k] = String(v));
  return w;
};
const slowniki: Record<string, Record<string, string>> = {};
for (const f of readdirSync(KAT)) if (/^[a-z]{2,3}(-[A-Za-z0-9]+)*\.json$/.test(f)) slowniki[f.slice(0, -5)] = splaszcz(JSON.parse(readFileSync(join(KAT, f), 'utf8')));
const jezyki = Object.keys(slowniki).filter((j) => j !== 'en');
const norm = (s: string) => s.normalize('NFC').trim().toLowerCase();

// Wyjątki: język → pary (z uzasadnieniem w docs/lokalizacja/jezyki.md). Puste: brak świadomych wyjątków (E5 fix, 2026-11-09).
const WYJATKI: Record<string, string[]> = {};
const bez = (j: string, id: string) => (WYJATKI[j] ?? []).includes(id);

const ZAKLADKI: [string, string][] = [
  ['zakladki.dzis', 'dzis.tytul'],
  ['zakladki.projekty', 'projekty.tytul'],
  ['zakladki.narzedzia', 'narzedzia.tytul'],
  ['zakladki.historia', 'dni.tytul'],
];

describe.each(jezyki)('%s', (j) => {
  const s = slowniki[j]!;
  test.each(ZAKLADKI)('podpis zakładki %s = tytuł ekranu %s', (zak, tytul) => {
    if (bez(j, zak)) return;
    expect(norm(s[zak]!)).toBe(norm(s[tytul]!));
  });
  test('akcja licznika „Stoper” (licznik.akcja_stoper) występuje w etykiecie VoiceOver stopera', () => {
    if (bez(j, 'licznik.akcja_stoper')) return;
    const podpis = norm(s['licznik.akcja_stoper']!);
    const etykiety = ['stoper.start_a11y', 'stoper.trwa_a11y', 'stoper.wstrzymana_a11y'].map((k) => norm(s[k]!));
    expect(etykiety.some((e) => e.includes(podpis))).toBe(true);
  });
  test('akcja licznika „Wzór” (licznik.akcja_wzor) = tytuł ekranu wzoru i występuje w etykiecie VoiceOver wzoru', () => {
    if (bez(j, 'licznik.akcja_wzor')) return;
    const podpis = norm(s['licznik.akcja_wzor']!);
    expect(podpis).toBe(norm(s['wzor.tytul']!));
    expect(norm(s['licznik.wzor_a11y']!)).toContain(podpis);
  });
});
