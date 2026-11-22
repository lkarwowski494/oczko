// 09 fala E5 (P-618 b): narzędzie liczące czas sesji w górę to STOPER (stopwatch), nie minutnik/timer. Pojęcie `stoper` w docs/lokalizacja/slownik-terminow.json:
// termin zalecany i wzorce zakazane (słowa na minutnik) na język; test sprawdza, że w każdym kluczu, którego źródło en mówi o stoperze (timer/stopwatch),
// żaden język nie używa zakazanego słowa (wszystkie formy liczby mnogiej), a etykieta `licznik.akcja_stoper` zawiera termin zalecany języka.
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
  pojecia: { id: string; wykrywaj: string; jezyki: Record<string, { zalecany: string; zakazane?: { wzorzec: string; powod: string }[] }> }[];
};
const pojecie = glosariusz.pojecia.find((p) => p.id === 'stoper');
const en = slowniki['en']!;
const baza = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '');
const wykrywaj = new RegExp(pojecie?.wykrywaj ?? '$^', 'iu');
const bazy = new Set(Object.keys(en).filter((k) => wykrywaj.test(en[k]!)).map(baza));
const jezykiDocelowe = glosariusz.jezyki.filter((j) => j !== 'en');

describe('stoper (P-618 b): nazwa narzędzia liczącego w górę', () => {
  it('glosariusz ma pojęcie `stoper` z terminem zalecanym w każdym języku, a źródło en trafia w co najmniej 15 baz kluczy', () => {
    expect(pojecie).toBeDefined();
    expect(bazy.size).toBeGreaterThanOrEqual(15);
    for (const j of glosariusz.jezyki) expect(pojecie!.jezyki[j]?.zalecany?.trim()).toBeTruthy();
  });

  it.each(jezykiDocelowe)('%s: żaden tekst stopera nie używa słowa na minutnik (wzorce zakazane z glosariusza)', (j) => {
    const zakazy = (pojecie?.jezyki[j]?.zakazane ?? []).map((z) => new RegExp(z.wzorzec, 'iu'));
    const trafienia = Object.entries(slowniki[j]!).filter(([k, t]) => bazy.has(baza(k)) && zakazy.some((r) => r.test(t))).map(([k, t]) => `${k}: ${t}`);
    expect(trafienia).toEqual([]);
  });

  it.each(jezykiDocelowe)('%s: etykieta licznik.akcja_stoper to termin zalecany (bez względu na wielkość liter)', (j) => {
    const zal = pojecie!.jezyki[j]!.zalecany.toLowerCase();
    const jest = slowniki[j]!['licznik.akcja_stoper']!.toLowerCase();
    // pierwszy człon terminu (przed nawiasem, ukośnikiem lub przecinkiem) musi się mieścić w etykiecie
    expect(jest).toContain(zal.split(/[ (\/,]/)[0]!.slice(0, Math.max(3, zal.split(/[ (\/,]/)[0]!.length - 1)));
  });
});
