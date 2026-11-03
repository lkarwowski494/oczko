/* Kontrakt testID 04 → 07 (F07-17): każdy id z list „**testID** (propozycja dla tabeli 07 / dla 07)” w docs/design/design-spec.md ma wiersz
 * w tabeli e2e/README.md, a żaden scenariusz nie używa id wycofanych przez 04. Bez tego tabela 07 rozjechała się z fix-6 (scenariusz 28 na
 * menu-sesja / sesja-trwa, których nie było ani w kodzie, ani w projekcie). */
import * as fs from 'fs';
import * as path from 'path';
import { opisyIdentyfikatorow } from './maestro-runner';

const root = path.join(__dirname, '..', '..');
const README = fs.readFileSync(path.join(root, 'e2e/README.md'), 'utf8');
const SPEC = fs.readFileSync(path.join(root, 'docs/design/design-spec.md'), 'utf8');
/** Wyjątki nazwane: id z design-spec, którego tabela 07 świadomie nie ma. */
const BEZ_WIERSZA: Record<string, string> = {
  'potwierdz-usun': 'potwierdzenie usuwania to alert systemowy bez testID (08 partia 5, e2e/README.md: scenariusz stuka w tekst przycisku)',
};
const WYCOFANE = ['menu-sesja', 'sesja-trwa', 'sesja-zakoncz', 'menu-zdjecia', 'zdjecia-licznik', 'nav-zapas', 'projekty-uspione'];

export function idZeSpec(spec: string): string[] {
  return spec.split('\n').filter((l) => /\*\*testID\*\* \(propozycja/.test(l)).flatMap((l) => [...l.matchAll(/`([a-z0-9][a-z0-9-]*)`/g)].map((m) => m[1]));
}

describe('kontrakt testID design-spec → e2e/README.md (F07-17)', () => {
  test('każdy id z list testID design-spec ma wiersz w tabeli (poza nazwanymi wyjątkami)', () => {
    const ids = idZeSpec(SPEC);
    expect(ids.length).toBeGreaterThanOrEqual(40); /* trzy listy: fix-5, fix-6 B, fix-6 D */
    const tabela = opisyIdentyfikatorow(README);
    expect(ids.filter((id) => !tabela.has(id) && !(id in BEZ_WIERSZA))).toEqual([]);
  });

  test('id wycofane przez 04 nie mają wiersza i nie występują w scenariuszach', () => {
    const tabela = opisyIdentyfikatorow(README);
    expect(WYCOFANE.filter((id) => tabela.has(id))).toEqual([]);
    const kat = path.join(root, 'e2e/scenariusze');
    const pliki = [...fs.readdirSync(kat).filter((f) => f.endsWith('.yaml')).map((f) => path.join(kat, f)), ...fs.readdirSync(path.join(kat, 'subflows')).map((f) => path.join(kat, 'subflows', f))];
    const uzycia = pliki.flatMap((p) => WYCOFANE.filter((id) => new RegExp(`id: "(?:[a-z0-9-]+\\|)*${id}(?:\\|[a-z0-9-]+)*"`).test(fs.readFileSync(p, 'utf8'))).map((id) => `${path.basename(p)}: ${id}`));
    expect(uzycia).toEqual([]);
  });

  test('pułapka: lista spec z id spoza tabeli → wykryte', () => {
    const tabela = opisyIdentyfikatorow(README);
    const ids = idZeSpec('- **testID** (propozycja dla 07): `licznik-plus`, `nie-ma-takiego-id`.');
    expect(ids.filter((id) => !tabela.has(id))).toEqual(['nie-ma-takiego-id']);
  });

  // M1-audytor-generalny-150 (07-jakosc-524, JAK-15): przykład tekstu w tabeli to wzorzec dla autorów scenariuszy — zdania stanu z en.json
  // (decyzja 04 „Separator „ · ””, M1-034: bez „ · ”). Przykład spoza en.json daje scenariusz czerwony po przepisaniu z README.
  test('M1-150 przykład w wierszu projekt-linia-terminu jest tekstem klucza projekt.termin_dzis_other z en.json, bez „ · ”', () => {
    const en = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/slowniki/en.json'), 'utf8')) as { projekt: Record<string, string> };
    const wiersz = README.split('\n').find((l) => l.startsWith('| `projekt-linia-terminu` |')) ?? '';
    const przyklad = /„([^”]+)”/.exec(wiersz.split('|')[4] ?? '')?.[1] ?? '';
    expect(przyklad).not.toContain(' · ');
    const wzor = new RegExp(`^${en.projekt.termin_dzis_other.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\\\{\w+\\\}\\\}/g, '.+')}$`);
    expect(przyklad).toMatch(wzor);
  });
});
