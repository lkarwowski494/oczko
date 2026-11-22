// 09-lokalizacja-001 (E5 redesignu M3): jednostka płatnego limitu („crafting day”) ma w każdym języku jedną nazwę we wszystkich kluczach,
// w których źródło en zawiera to wyrażenie (limit, Dziś, Projekty, Historia, Oczko Pro, arkusz limitu, etykieta VoiceOver).
// Termin zalecany: pojęcie `dzien_robotki` w docs/lokalizacja/slownik-terminow.json (pole `rdzen` = fragment małymi literami, który mieści każdą formę fleksyjną).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const KAT = join(KORZEN, 'src', 'i18n', 'slowniki');
type Drzewo = { [k: string]: string | Drzewo };
const splaszcz = (o: Drzewo, p = '', w: Record<string, string> = {}): Record<string, string> => {
  for (const [k, v] of Object.entries(o)) typeof v === 'object' ? splaszcz(v, `${p}${k}.`, w) : (w[p + k] = String(v));
  return w;
};
const slowniki: Record<string, Record<string, string>> = {};
for (const f of readdirSync(KAT)) if (/^[a-z]{2,3}(-[A-Za-z0-9]+)*\.json$/.test(f)) slowniki[f.slice(0, -5)] = splaszcz(JSON.parse(readFileSync(join(KAT, f), 'utf8')));
const glosariusz = JSON.parse(readFileSync(join(KORZEN, 'docs', 'lokalizacja', 'slownik-terminow.json'), 'utf8')) as {
  jezyki: string[];
  pojecia: { id: string; wykrywaj: string; jezyki: Record<string, { zalecany: string; rdzen?: string }> }[];
};
const pojecie = glosariusz.pojecia.find((p) => p.id === 'dzien_robotki')!;
const wzorzec = new RegExp(pojecie.wykrywaj, 'iu');
const en = slowniki['en']!;
const baza = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '');
const bazyEn = [...new Set(Object.keys(en).filter((k) => wzorzec.test(en[k]!)).map(baza))];
// klucze języka (także formy _few/_many…, których nie ma w en) należące do tych baz
const kluczeJezyka = (j: string) => Object.keys(slowniki[j]!).filter((k) => bazyEn.includes(baza(k)));
const jezyki = Object.keys(slowniki).filter((j) => j !== 'en');
const norm = (s: string) => s.normalize('NFC').toLowerCase();

test('glosariusz ma pojęcie dzien_robotki z rdzeniem dla każdego języka słownika, a termin zalecany zawiera własny rdzeń', () => {
  expect(pojecie).toBeDefined();
  expect(Object.keys(slowniki).sort()).toEqual([...glosariusz.jezyki].sort());
  for (const j of glosariusz.jezyki) {
    const t = pojecie.jezyki[j]!;
    expect(t.rdzen && t.rdzen.length >= 3).toBeTruthy();
    expect(norm(t.zalecany)).toContain(norm(t.rdzen!));
  }
});

test('źródło en: 15 baz kluczy z „crafting day” (limit, Dziś, Projekty, Historia, Oczko Pro, arkusz, VoiceOver, przewodnik); lista zmienia się tylko świadomie', () => {
  expect(bazyEn).toHaveLength(15); // P-692 (KO-027): + `przewodnik.f_pro` (opis Oczko Pro w przewodniku po funkcjach, ta sama jednostka limitu)
  expect(bazyEn).toContain('przewodnik.f_pro');
});

describe.each(jezyki)('%s: jedna nazwa jednostki limitu', (j) => {
  const rdzen = norm(pojecie.jezyki[j]!.rdzen!);
  test.each(kluczeJezyka(j))('%s zawiera termin zalecany', (k) => {
    expect(norm(slowniki[j]![k]!)).toContain(rdzen);
  });
});
