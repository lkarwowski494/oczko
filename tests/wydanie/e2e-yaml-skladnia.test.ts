/* 10-wydanie-027 (AY, KO-050 po AU): każdy plik `e2e/**\/*.yaml` musi być poprawnym YAML-em (wszystkie dokumenty). Dlaczego: po 10-wydanie-023 `00-przygotuj.yaml` miał `env: { TERAZ: ${ZRZUTY_SESJA_2} }`
 * (wskaźniki `{ }` w skalarze przepływowym) — Maestro nie wczytałby pliku, a testy sprawdzały tylko obecność tekstu. Wynik na runnerze macOS: niesprawdzone. */
import * as fs from 'fs';
import * as path from 'path';
import { YAML } from '../jakosc/maestro-runner';

const korzen = path.join(__dirname, '..', '..');
const pliki = (kat: string): string[] => fs.readdirSync(kat, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? pliki(path.join(kat, e.name)) : /\.ya?ml$/.test(e.name) ? [path.join(kat, e.name)] : []));
const wszystkie = pliki(path.join(korzen, 'e2e'));

describe('10-wydanie-027: składnia YAML w e2e/', () => {
  test('jest co najmniej 100 plików, a każdy parsuje się bez błędów (wszystkie dokumenty)', () => {
    expect(wszystkie.length).toBeGreaterThanOrEqual(100);
    const bledy = wszystkie.flatMap((f) => YAML.parseAllDocuments(fs.readFileSync(f, 'utf8')).flatMap((d: { errors: { message: string }[] }) => d.errors.map((e) => `${path.relative(korzen, f)}: ${e.message.split('\n')[0]}`)));
    expect(bledy).toEqual([]);
  });
  test('00-przygotuj.yaml: TERAZ trzech sesji po parsowaniu = ${ZRZUTY_SESJA_1..3} (w tej kolejności)', () => {
    const t = fs.readFileSync(path.join(korzen, 'e2e/zrzuty-sklepu/00-przygotuj.yaml'), 'utf8');
    const docs = YAML.parseAllDocuments(t).map((d: { toJS: () => unknown }) => d.toJS());
    const teraz: string[] = [];
    const idz = (x: unknown): void => { if (Array.isArray(x)) x.forEach(idz); else if (x && typeof x === 'object') { for (const [k, v] of Object.entries(x as Record<string, unknown>)) { if (k === 'TERAZ' && typeof v === 'string') teraz.push(v); else idz(v); } } };
    docs.forEach(idz);
    expect(teraz).toEqual(['${ZRZUTY_SESJA_1}', '${ZRZUTY_SESJA_2}', '${ZRZUTY_SESJA_3}']);
  });
});
