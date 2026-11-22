/* BX10 zad. 3 / CE-01 (P1, `docs/jakosc/ce-recenzja-bx7-bx8.md`): scenariusz, którego asercją jest BRAK systemowej prośby (powiadomienia, śledzenie, biblioteka zdjęć), nie może pasować zawsze.
 * Maestro 2.12.1 (przypięty w jakosc-ios.yml; `maestro-orchestra` Orchestra.kt:1345-1347, tag cli-2.12.1, odczyt CE 2026-11-16): `launchApp` bez `permissions` nadaje WSZYSTKIE uprawnienia
 * („default to allow all on app launch”), więc iOS nie pokaże prośby nawet wtedy, gdy kod o nią poprosi, a `assertNotVisible` przechodzi. Reguła: każdy `launchApp` w takim scenariuszu
 * (także w podprzepływach `runFlow`) ma `permissions: { all: unset }` — stan „jeszcze nie pytano”, w którym prośba z kodu musi się pojawić. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { kroki, podprzeplywy, wczytaj, type Scenariusz } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e', 'scenariusze');
export const PROSBA_SYSTEMOWA = /Would Like to|to track your activity/i;

type Krok = { nazwa: string; arg: unknown };
/** Kroki scenariusza z podprzepływami (rekurencyjnie, bez pętli). */
function wszystkieKroki(s: Scenariusz, stos: string[] = []): Krok[] {
  if (stos.includes(s.plik)) return [];
  const out: Krok[] = [...kroki(s.polecenia)].map((k) => ({ nazwa: k.nazwa, arg: k.arg }));
  for (const p of podprzeplywy(s)) if (fs.existsSync(p)) out.push(...wszystkieKroki(wczytaj(p), [...stos, s.plik]));
  return out;
}
const tekstSelektora = (arg: unknown): string | null => typeof arg === 'string' ? arg : (typeof arg === 'object' && arg !== null && 'text' in arg && typeof arg.text === 'string') ? arg.text : null;

/** Zwraca opisy problemów: scenariusz z asercją braku prośby systemowej, w którym jakiś `launchApp` nie ma `permissions: { all: unset }`. */
export function problemyUprawnien(s: Scenariusz): string[] {
  const k = wszystkieKroki(s);
  const brakProsby = k.some((x) => x.nazwa === 'assertNotVisible' && PROSBA_SYSTEMOWA.test(tekstSelektora(x.arg) ?? ''));
  if (!brakProsby) return [];
  const out: string[] = [];
  k.filter((x) => x.nazwa === 'launchApp').forEach((x, i) => {
    const p = typeof x.arg === 'object' && x.arg !== null && 'permissions' in x.arg ? (x.arg as { permissions?: unknown }).permissions : undefined;
    const unset = typeof p === 'object' && p !== null && 'all' in p && (p as { all?: unknown }).all === 'unset';
    if (!unset) out.push(`${path.basename(s.plik)}: launchApp #${i + 1} bez permissions: { all: unset } (domyślnie Maestro nadaje wszystkie uprawnienia, asercja braku prośby przechodzi zawsze)`);
  });
  return out;
}

const tmp = (tresc: string) => { const f = path.join(os.tmpdir(), `bx10-upr-${process.pid}-${Math.random().toString(36).slice(2)}.yaml`); fs.writeFileSync(f, tresc); return f; };

describe('CE-01 · scenariusze z asercją braku prośby systemowej startują z uprawnieniami „unset”', () => {
  test('wszystkie scenariusze katalogu spełniają regułę (w tym start przez podprzepływ start-czysty)', () => {
    const pliki = fs.readdirSync(KAT).filter((f) => /^\d{2,}-.*\.yaml$/.test(f)).sort();
    expect(pliki.length).toBeGreaterThan(90);
    const sprawdzone = pliki.filter((f) => wszystkieKroki(wczytaj(path.join(KAT, f))).some((x) => x.nazwa === 'assertNotVisible' && PROSBA_SYSTEMOWA.test(tekstSelektora(x.arg) ?? '')));
    expect(sprawdzone.length).toBeGreaterThan(0); // reguła ma co sprawdzać (PU-052, scen. 99)
    expect(pliki.flatMap((f) => problemyUprawnien(wczytaj(path.join(KAT, f))))).toEqual([]);
  });
  test('kontrola wykrywa launchApp bez permissions, z permissions bez „all: unset” i start przez podprzepływ', () => {
    const bez = tmp('appId: x\n---\n- launchApp: { clearState: true }\n- assertNotVisible: ".*Would Like to Send You Notifications.*"\n');
    expect(problemyUprawnien(wczytaj(bez))).toHaveLength(1);
    const allow = tmp('appId: x\n---\n- launchApp: { clearState: true, permissions: { all: allow } }\n- assertNotVisible: { text: ".*Allow .* to track your activity.*" }\n');
    expect(problemyUprawnien(wczytaj(allow))).toHaveLength(1);
    const sub = tmp('appId: x\n---\n- launchApp: { clearState: true }\n- assertVisible: "a"\n');
    const przezPodprzeplyw = tmp(`appId: x\n---\n- runFlow: ${sub}\n- assertNotVisible: ".*Would Like to Access Your Photos.*"\n`);
    expect(problemyUprawnien(wczytaj(przezPodprzeplyw))).toHaveLength(1);
    const dobry = tmp('appId: x\n---\n- launchApp: { clearState: true, permissions: { all: unset } }\n- assertNotVisible: ".*Would Like to Send You Notifications.*"\n');
    expect(problemyUprawnien(wczytaj(dobry))).toEqual([]);
  });
  test('scenariusz bez asercji braku prośby nie jest objęty regułą', () => {
    expect(problemyUprawnien(wczytaj(tmp('appId: x\n---\n- launchApp: { clearState: true }\n- assertVisible: "a"\n')))).toEqual([]);
  });
});
