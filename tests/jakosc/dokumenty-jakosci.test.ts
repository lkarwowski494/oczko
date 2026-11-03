/* Kontrakt dokumentów roli 07 z wykonaniem (JAK-15, JAK-17; zasada wspólna 4: rejestr, nie pamięć). Dokumenty jakości są czytane przez
 * następne sesje 07 i 08 jako lista zadań i definicja ukończenia, więc zapowiedź pracy już wykonanej albo kontrola, której nie ma, to fałszywy sygnał. */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function plikiKodu(kat: string): string[] {
  const p = path.join(ROOT, kat);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p, { withFileTypes: true }).flatMap((d) => {
    const r = path.join(kat, d.name);
    if (d.isDirectory()) return plikiKodu(r);
    return /\.(ts|tsx)$/.test(d.name) ? [r] : [];
  });
}
const KOD = ['src', 'app'].flatMap(plikiKodu).map(czytaj).join('\n');
/** `wybor-*` → prefiks `wybor-`; `pole-x` → dokładnie; szuka literału w cudzysłowie (testID w propsach). */
const wKodzie = (id: string, kod = KOD): boolean => {
  const glob = id.endsWith('*');
  const rdzen = (glob ? id.slice(0, -1) : id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`['"\`]${rdzen}${glob ? '[a-z0-9-]+' : ''}['"\`]`).test(kod);
};

/** Pozycje „Czeka:” najnowszego wpisu stanu (pierwsza sekcja `# Stan`), rozbite na `(1) …`, `(2) …`. */
export function pozycjeCzeka(stan: string): string[] {
  const wpis = stan.split(/^# Stan/m)[1] ?? '';
  const linia = wpis.split('\n').find((l) => /\*\*Czeka:\*\*/.test(l)) ?? '';
  return linia.split(/\(\d+\)/).slice(1).map((s) => s.trim());
}
/** Zapowiedzi „08: testID `x`” w pozycjach Czeka, które kod już ma, a pozycja nie mówi „zrobione”. */
export function zapowiedziWykonane(stan: string, kod = KOD): string[] {
  return pozycjeCzeka(stan)
    .filter((p) => /\b08\b/.test(p) && /testID/.test(p) && !/zrobione/i.test(p))
    .flatMap((p) => [...p.matchAll(/`([a-z][a-z0-9-]*\*?)`/g)].map((m) => m[1]).filter((id) => wKodzie(id, kod)).map((id) => `${id} — ${p.slice(0, 80)}`));
}
/** Wiersze README E2E, które twierdzą, że scenariusze „stukają jeszcze po tekście”, choć ich pliki stukają już po `id` z kodu — bez oznaczenia „zastąpione”. */
export function wierszeNieaktualne(readme: string, scenariusz: (n: string) => string): string[] {
  return readme.split('\n').filter((l) => /stukają jeszcze po tekście/.test(l) && !/zastąpion/i.test(l)).filter((l) => {
    const ids = [...l.matchAll(/`([a-z][a-z0-9-]*\*?)`/g)].map((m) => m[1]).filter((id) => wKodzie(id));
    const nry = [...(l.match(/scenariusze ([\d, i]+) stukają/)?.[1] ?? '').matchAll(/\d+/g)].map((m) => m[0]);
    return ids.length > 0 && nry.length > 0 && nry.every((n) => ids.some((id) => scenariusz(n).includes(`id: "${id.replace('*', '')}`) || scenariusz(n).includes(`id: ${id.replace('*', '')}`)));
  });
}
const KAT_E2E = path.join(ROOT, 'e2e/scenariusze');
const scenariusz = (n: string): string => {
  const f = fs.readdirSync(KAT_E2E).find((x) => x.startsWith(`${n}-`));
  return f ? fs.readFileSync(path.join(KAT_E2E, f), 'utf8') : '';
};

describe('097 · stan roli 07 i README E2E nie zapowiadają pracy wykonanej (JAK-15; 07-jakosc-501)', () => {
  test('najnowszy wpis docs/jakosc/stan.md: „Czeka” bez testID dla 08, które kod już ma (albo z dopiskiem „zrobione”)', () => {
    expect(pozycjeCzeka(czytaj('docs/jakosc/stan.md')).length).toBeGreaterThan(0);
    expect(zapowiedziWykonane(czytaj('docs/jakosc/stan.md'))).toEqual([]);
  });
  test('e2e/README.md: wiersz „stukają jeszcze po tekście” oznaczony jako zastąpiony, gdy scenariusze stukają po id', () => {
    expect(wierszeNieaktualne(czytaj('e2e/README.md'), scenariusz)).toEqual([]);
  });
  test('pułapki: zapowiedź istniejącego testID i nieoznaczony wiersz README są wykrywane', () => {
    const stan = '# Stan · x\n- **Czeka:** (1) 08: testID `wybor-*` w `Arkusz.tsx`; (2) przebieg na macOS\n';
    expect(zapowiedziWykonane(stan, "testID: 'wybor-rodzaj-rzedy'")).toHaveLength(1);
    expect(zapowiedziWykonane(stan.replace('(1) 08', '(1) zrobione cb6f1ec: 08'), "testID: 'wybor-rodzaj-rzedy'")).toEqual([]);
    expect(zapowiedziWykonane(stan, "testID: 'inne'")).toEqual([]);
    const readme = '- x: kontrakt `wybor-*`; scenariusze 54, 56 stukają jeszcze po tekście — przejście na `id` po wdrożeniu';
    const scen = () => 'tapOn:\n    id: "wybor-rodzaj-oczka"';
    expect(wierszeNieaktualne(readme, scen)).toHaveLength(1);
    expect(wierszeNieaktualne(`${readme} (zastąpione wierszem niżej)`, scen)).toEqual([]);
    expect(wierszeNieaktualne(readme, () => 'tapOn: "Stitches"')).toEqual([]);
  });
});
