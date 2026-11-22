/* BX30 (KO-170, diagnoza docs/jakosc/bx30-diagnoza-czesc3.md): BR-PRJ-007/S1 padł w run 44114826259 na kroku „tapOn projekt-dodaj → assertVisible projekt-dodaj-czesc” (stuknięcie zakończone, menu nie pojawiło się w 17,8 s).
 * Podprzepływ `dodaj-czesc-cel.yaml` ma więc ponowić TYLKO stuknięcie otwierające menu, gdy menu się nie pojawi — bez zmiany asercji wartości licznika, tekstów, progów i tagów,
 * a 61 zostaje scenariuszem BEZ ponowień (P-091 9a: ma własną asercję wartości licznika) z niezmienioną wagą w planie części. */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { kroki, wczytaj, maWlasnaAsercjeWartosci } from './maestro-runner';

const root = path.join(__dirname, '..', '..');
const KAT = path.join(root, 'e2e/scenariusze');
const PODPRZEPLYW = path.join(KAT, 'subflows/dodaj-czesc-cel.yaml');
const UZYWAJACE = [
  '108-pu-044-cel-dnia-na-liscie-i-projekcie-projekt-z-terminem-wyzej.yaml',
  '120-pu-135-ax5-licznik-dzis-historia-ustawienia-oczko-pro-licencje.yaml',
  '34-br-lic-011-s1-nastepna-czesc-blizniak.yaml',
  '35-br-dni-005-s1-termin-cel-dnia.yaml',
  '59-br-dni-004-s1-postep-w-procentach.yaml',
  '61-br-prj-007-s1-zrob-taka-sama.yaml',
];
const sel = (a: any): string | undefined => (typeof a === 'object' && a ? (a.id ?? a.visible?.id ?? a.when?.visible?.id ?? a.when?.notVisible?.id) : undefined);
const polecenia = () => wczytaj(PODPRZEPLYW).polecenia as any[];
const nazwa = (p: any): string => (typeof p === 'string' ? p : Object.keys(p)[0]);
const arg = (p: any): any => (typeof p === 'string' ? undefined : Object.values(p)[0]);

describe('BX30 · podprzepływ dodaj-czesc-cel: ponowienie samego stuknięcia „+” projektu', () => {
  const l = polecenia();
  const i = l.findIndex((p) => nazwa(p) === 'tapOn' && sel(arg(p)) === 'projekt-dodaj');

  test('po stuknięciu „projekt-dodaj”: krótkie czekanie opcjonalne na menu, runFlow when notVisible z tapOn projekt-dodaj i asercją menu (reguła: po akcji asercja), potem twarda asercja menu', () => {
    expect(i).toBeGreaterThan(0);
    const czekanie = l[i + 1];
    expect(nazwa(czekanie)).toBe('extendedWaitUntil');
    expect(arg(czekanie).optional).toBe(true);
    expect(sel(arg(czekanie).visible)).toBe('projekt-dodaj-czesc');
    expect(Number(arg(czekanie).timeout)).toBeLessThanOrEqual(8000);
    const ponowienie = l[i + 2];
    expect(nazwa(ponowienie)).toBe('runFlow');
    expect(arg(ponowienie).when?.notVisible?.id).toBe('projekt-dodaj-czesc');
    expect(arg(ponowienie).commands).toHaveLength(2);
    expect(nazwa(arg(ponowienie).commands[0])).toBe('tapOn');
    expect(sel(arg(arg(ponowienie).commands[0]))).toBe('projekt-dodaj');
    expect(nazwa(arg(ponowienie).commands[1])).toBe('assertVisible');
    expect(sel(arg(arg(ponowienie).commands[1]))).toBe('projekt-dodaj-czesc');
    const twarda = l[i + 3];
    expect(nazwa(twarda)).toBe('assertVisible');
    expect(arg(twarda).id).toBe('projekt-dodaj-czesc');
    expect(arg(twarda).optional).toBeUndefined();
  });

  test('ponawiane jest wyłącznie stuknięcie otwierające menu: jedyny runFlow when notVisible z tapOn to ten krok, a „projekt-dodaj” jest stukane dokładnie dwa razy (stuknięcie + ponowienie)', () => {
    const stuknieciaPlus = [...kroki(l)].filter((k) => k.nazwa === 'tapOn' && sel(k.arg) === 'projekt-dodaj');
    expect(stuknieciaPlus).toHaveLength(2);
    const ponowieniaZTapem = [...kroki(l)].filter((k) => k.nazwa === 'runFlow' && Array.isArray(k.arg?.commands) && k.arg.commands.some((c: any) => nazwa(c) === 'tapOn'));
    expect(ponowieniaZTapem).toHaveLength(1);
  });

  test('bez zmian: asercje wpisu (nazwa „Back”, cel ${CEL}), brak asercji wartości licznika w podprzepływie i brak tagów', () => {
    const tekst = fs.readFileSync(PODPRZEPLYW, 'utf8');
    expect(tekst).toContain('assertVisible: { id: "formularz-nazwa-czesci", text: "Back" }');
    expect(tekst).toContain('assertVisible: { id: "formularz-cel-czesci", text: "${CEL}" }');
    expect(tekst).toContain('- assertVisible: { id: "licznik-plus" }');
    expect(tekst).not.toMatch(/licznik-wartosc|dzis-wartosc/);
    expect(wczytaj(PODPRZEPLYW).naglowek.tags).toBeUndefined();
  });

  test('scenariusze używające podprzepływu: dokładnie lista z diagnozy BX30 (6)', () => {
    const uzywajace = fs.readdirSync(KAT).filter((f) => /^\d{2,}-.*\.yaml$/.test(f) && fs.readFileSync(path.join(KAT, f), 'utf8').includes('subflows/dodaj-czesc-cel.yaml')).sort();
    expect(uzywajace).toEqual([...UZYWAJACE].sort());
  });
});

describe('BX30 · 61 zostaje bez ponowień, plan części bez zmiany', () => {
  const plan = JSON.parse(execFileSync('node', [path.join(root, 'scripts/ci/e2e-czesci.mjs'), 'plan', '--dir', KAT, '--config', path.join(root, 'e2e/czesci.json')], { encoding: 'utf8', env: { ...process.env, ONLY: '', PAKIET: '', COMMIT_MSG: '', GITHUB_OUTPUT: '' } })) as { czesc: number; files: string[]; osobne: string[]; bez_ponowien: string[]; ponawialne: string[] }[];
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'e2e/czesci.json'), 'utf8')) as { wagi_s: Record<string, number> };
  const f61 = '61-br-prj-007-s1-zrob-taka-sama.yaml';

  test('61 ma własną asercję wartości licznika (runner) i leży w „bez_ponowien”, nie w „ponawialne”', () => {
    expect(maWlasnaAsercjeWartosci(wczytaj(path.join(KAT, f61)))).toBe(true);
    const c = plan.find((x) => [...x.files, ...x.osobne].includes(f61))!;
    expect(c.czesc).toBe(3);
    expect(c.bez_ponowien).toContain(f61);
    expect(c.ponawialne).not.toContain(f61);
  });

  test('waga 61 i pozostałych użytkowników podprzepływu jest jawna w e2e/czesci.json (dodane kroki nie przesuwają planu)', () => {
    for (const f of UZYWAJACE) expect(cfg.wagi_s[f]).toBeGreaterThan(0);
    expect(cfg.wagi_s[f61]).toBe(238);
  });
});
