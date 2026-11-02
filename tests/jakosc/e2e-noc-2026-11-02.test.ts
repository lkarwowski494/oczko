/* Przebieg nocny 2/3.11.2026 (polecenie 07 noc, P-400; zadania NOC-1…NOC-6). Struktura jak e2e-kruchosc-139.test.ts: czytamy scenariusze Maestro
 * jako listę kroków (maestro-runner) i pilnujemy kolejności kroków, których brak pada dopiero na symulatorze (macOS). */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const plik = (n: string) => fs.readdirSync(KAT).find((f) => f.startsWith(`${n}-`)) as string;
const lista = (n: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik(n))).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const a = k.arg;
  const id = typeof a === 'object' && a ? (a.id ?? a.element?.id ?? a.visible?.id ?? a.when?.visible?.id ?? a.when?.notVisible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};

/* NOC-1 · 66 (P-393, raport M1): po „Replace what’s here” ekran Ustawień jest przewinięty w dół (kroki `scrollUntilVisible import-wynik`), więc „Back” leży nad ekranem
 *       i nie ma go w hierarchii iOS — ten sam wzorzec co scenariusz 08 (E2-138-S1, 08:95). Przed `tapOn nav-wstecz` po `import-wynik` musi stać
 *       `scrollUntilVisible nav-wstecz` w górę (bez `optional`, timeout ≥ 30 s). */
describe('NOC-1 · 66 i 08: „Back” po imporcie wymaga przewinięcia w górę', () => {
  test.each(['08', '66'])('%s: tapOn nav-wstecz po import-wynik poprzedza scrollUntilVisible nav-wstecz w górę', (n) => {
    const l = lista(n);
    const wynik = l.map((k, i) => (k.nazwa === 'scrollUntilVisible' && idy(k).includes('import-wynik') ? i : -1)).filter((i) => i >= 0);
    expect(wynik.length).toBeGreaterThan(0);
    const wstecz = l.findIndex((k, i) => i > wynik[wynik.length - 1] && k.nazwa === 'tapOn' && idy(k).includes('nav-wstecz'));
    expect(wstecz).toBeGreaterThan(-1);
    const przed = l[wstecz - 1];
    expect(przed.nazwa).toBe('scrollUntilVisible');
    expect(idy(przed)).toContain('nav-wstecz');
    expect(String(przed.arg.direction).toUpperCase()).toBe('UP');
    expect(przed.arg.optional).not.toBe(true);
    expect(przed.arg.timeout).toBeGreaterThanOrEqual(30000);
  });
});

/* NOC-2 · luki zrzutów dla przejścia poznawczego 04 (raport 04, M1): zrzuty w punktach, w których 04 nie widział ekranu, a scenariusz go przechodził.
 *       Tylko `takeScreenshot` (bez zmiany asercji), nazwa opisowa z numerem scenariusza. Tabela: scenariusz → zrzut → po jakim kroku, przed jakim krokiem. */
type Cel = { nazwa: string; id?: string; tekst?: string };
const trafia = (k: Krok, c: Cel) => k.nazwa === c.nazwa && (!c.id || idy(k).includes(c.id)) && (!c.tekst || JSON.stringify(k.arg).includes(c.tekst));
const zrzut = (nazwa: string): Cel => ({ nazwa: 'takeScreenshot', tekst: nazwa });
const ZMIENIAJACE = new Set(['tapOn', 'inputText', 'eraseText', 'setOrientation', 'launchApp', 'back', 'swipe', 'longPressOn']);
const LUKI: { scen: string; zrzut: string; po: Cel; przed?: Cel; opis: string }[] = [
  // (a) menu „•••” otwarte, zanim scenariusz stuknie „Pattern”
  { scen: '21', zrzut: '21-menu-przed-wzorem', po: { nazwa: 'tapOn', id: 'licznik-menu' }, przed: { nazwa: 'tapOn', id: 'menu-wzor' }, opis: '(a) menu ••• przed menu-wzor' },
  { scen: '22', zrzut: '22-menu-przed-wzorem', po: { nazwa: 'tapOn', id: 'licznik-menu' }, przed: { nazwa: 'tapOn', id: 'menu-wzor' }, opis: '(a) menu ••• przed menu-wzor' },
  { scen: '23', zrzut: '23-menu-przed-wzorem', po: { nazwa: 'tapOn', id: 'licznik-menu' }, przed: { nazwa: 'tapOn', id: 'menu-wzor' }, opis: '(a) menu ••• przed menu-wzor' },
  { scen: '62', zrzut: '62-menu-przed-wzorem', po: { nazwa: 'tapOn', id: 'licznik-menu' }, przed: { nazwa: 'tapOn', id: 'menu-wpisz-wartosc' }, opis: '(a) menu ••• (to samo, z którego podprzepływ otworz-wzor-pdf stuka menu-wzor)' },
  { scen: '57', zrzut: '57-licznik-menu-przed-notatka', po: { nazwa: 'assertNotVisible' }, przed: { nazwa: 'tapOn', id: 'licznik-projekt' }, opis: '(a) licznik z „•••” przed wejściem do projektu i notatki' },
  // (b) ekran projektu z wierszem „Note” przed i po zapisie
  { scen: '57', zrzut: '57-projekt-wiersz-note-przed-zapisem', po: { nazwa: 'scrollUntilVisible', id: 'projekt-notatka' }, przed: { nazwa: 'tapOn', id: 'projekt-notatka' }, opis: '(b) wiersz Note przed zapisem' },
  { scen: '57', zrzut: '57-projekt-wiersz-note-po-zapisie', po: { nazwa: 'assertVisible', id: 'projekt-notatka' }, przed: { nazwa: 'tapOn', id: 'nav-wstecz' }, opis: '(b) wiersz Note po zapisie' },
  // (c) widok wzoru przed pierwszym znacznikiem i po +1 przy zamkniętym panelu
  { scen: '62', zrzut: '62-wzor-przed-znacznikiem', po: { nazwa: 'assertVisible', id: 'licznik-wartosc' }, przed: { nazwa: 'tapOn', id: 'wzor-zaznacz' }, opis: '(c) wzór przed pierwszym znacznikiem' },
  { scen: '62', zrzut: '62-wzor-po-plus-1-panel-zamkniety', po: { nazwa: 'tapOn', id: 'licznik-plus' }, przed: { nazwa: 'tapOn', id: 'wzor-zaznacz' }, opis: '(c) wzór po +1, panel znacznika zamknięty' },
  // (d) +1 w poziomie na telefonie
  { scen: '23', zrzut: '23-poziomo-po-plus-1', po: { nazwa: 'tapOn', id: 'licznik-plus' }, przed: { nazwa: 'setOrientation' }, opis: '(d) +1 w poziomie' },
  // (e) wąskie okno iPada: licznik > 0 i „•••”
  { scen: '46', zrzut: '46-waskie-licznik-wartosc-menu', po: { nazwa: 'tapOn', id: 'nav-wstecz' }, przed: { nazwa: 'tapOn', id: 'nav-projekty' }, opis: '(e) wąskie okno: licznik 1 i „•••”' },
];
describe('NOC-2 · luki zrzutów dla przejścia 04', () => {
  test.each(LUKI.map((x) => [x.scen, x.opis, x] as const))('%s %s', (_s, _o, x) => {
    const l = lista(x.scen);
    const z = l.findIndex((k) => trafia(k, zrzut(x.zrzut)));
    expect(z).toBeGreaterThan(-1);
    const wczesniej = l.slice(0, z);
    expect(wczesniej.some((k) => trafia(k, x.po))).toBe(true);
    if (x.przed) {
      const ostatniePo = wczesniej.map((k, i) => (trafia(k, x.po) ? i : -1)).filter((i) => i >= 0).pop() as number;
      const nastepny = l.findIndex((k, i) => i > z && trafia(k, x.przed!));
      expect(nastepny).toBeGreaterThan(z);
      // zrzut leży zaraz po kroku „po”: między nim a zrzutem nie ma kroku zmieniającego ekran (stuknięcie, wpis, obrót, start)
      const miedzy = l.slice(ostatniePo + 1, z);
      expect(miedzy.filter((k) => ZMIENIAJACE.has(k.nazwa)).map((k) => k.nazwa)).toEqual([]);
      // i tuż przed krokiem „przed”: pierwszy krok zmieniający ekran po zrzucie to właśnie on
      const pierwszyZmieniajacy = l.findIndex((k, i) => i > z && ZMIENIAJACE.has(k.nazwa));
      expect(pierwszyZmieniajacy).toBe(nastepny);
    }
  });
  test('każda nazwa zrzutu jest unikalna w swoim scenariuszu', () => {
    for (const s of new Set(LUKI.map((x) => x.scen))) {
      const nazwy = lista(s).filter((k) => k.nazwa === 'takeScreenshot').map((k) => JSON.stringify(k.arg));
      expect({ s, powt: nazwy.filter((n, i) => nazwy.indexOf(n) !== i) }).toEqual({ s, powt: [] });
    }
  });
});

/* NOC-3 · scenariusz 67 (P2-5b, P-373 wariant B; F-09, design-spec.md:905): w trybie „rząd w trakcie” pasek pod wzorem (iPhone pionowo) podpisuje liczbę „current row”
 *       (`licznik-podpis`, WzorLicznik.tsx:30) i nie ma linii „Now working row n” (`licznik-teraz-rzad`); w trybie „skończone” odwrotnie. Do #139 nie było scenariusza
 *       (raport 138: „P2-5b niepotwierdzone”). Kolejność kroków: wzór otwarty w „skończone” (linia jest, podpisu nie ma) → zmiana znaczenia → ten sam wzór w „w trakcie”. */
describe('NOC-3 · 67: podpis „current row” w pasku pod wzorem (P2-5b)', () => {
  test('scenariusz istnieje, jest informacyjny (bez tagu podstawowy) i ma tag BR-LIC-012-S1', () => {
    const p = plik('67');
    expect(p).toBeDefined();
    const s = wczytaj(path.join(KAT, p));
    expect((s.naglowek.tags ?? []).map(String)).toEqual(expect.arrayContaining(['BR-LIC-012-S1', 'wzor']));
    expect((s.naglowek.tags ?? []).map(String)).not.toContain('podstawowy');
  });
  test('w „skończone”: linia „Now working row” jest, podpisu „current row” nie ma — w „w trakcie”: odwrotnie, podpis dosłownie „current row”', () => {
    const l = lista('67');
    // wzór otwiera podprzepływ (menu ••• → Pattern → źródło testowe PDF); `kroki` nie rozwija runFlow, więc kotwicą jest jego wywołanie
    const wzor = l.findIndex((k) => k.nazwa === 'runFlow' && JSON.stringify(k.arg).includes('otworz-wzor-pdf'));
    expect(wzor).toBeGreaterThan(-1);
    const znaczenie = l.findIndex((k, i) => i > wzor && k.nazwa === 'tapOn' && idy(k).includes('menu-znaczenie'));
    expect(znaczenie).toBeGreaterThan(wzor);
    const po = (od: number, doI: number, nazwa: string, id: string) => l.slice(od, doI).filter((k) => k.nazwa === nazwa && idy(k).includes(id));
    // przed zmianą znaczenia
    expect(po(wzor, znaczenie, 'assertVisible', 'licznik-teraz-rzad').length).toBeGreaterThan(0);
    expect(po(wzor, znaczenie, 'assertNotVisible', 'licznik-podpis').length).toBeGreaterThan(0);
    // po zmianie: podpis dosłownie „current row” (Maestro dopasowuje cały tekst), w widoku wzoru
    const wzorPo = l.findIndex((k, i) => i > znaczenie && ['extendedWaitUntil', 'assertVisible'].includes(k.nazwa) && idy(k).includes('wzor-widok'));
    expect(wzorPo).toBeGreaterThan(znaczenie);
    const podpis = l.slice(wzorPo).find((k) => k.nazwa === 'assertVisible' && idy(k).includes('licznik-podpis'));
    expect(podpis?.arg.text).toBe('current row');
    expect(l.slice(wzorPo).some((k) => k.nazwa === 'assertNotVisible' && idy(k).includes('licznik-teraz-rzad'))).toBe(true);
    expect(l.slice(wzorPo).some((k) => k.nazwa === 'takeScreenshot')).toBe(true);
  });
});

/* NOC-6 · wagi części E2E z pomiaru (#140, run 41430188910): do tej pory wszystkie wagi były SZACUNKIEM z liczby kroków. Pomiar z dzienników zadań e2e leży w
 *       docs/jakosc/e2e-pomiar-140.json. Wagi [Passed] = czas z dziennika; [Failed] (pada w trakcie, czas zaniżony) i brak pomiaru (67) zostają szacunkiem.
 *       Limit czasu zadania zostaje formułą workflow (30 + 4 × scenariusze części, e2e-czesci.mjs:91) — test pilnuje, że mieści zmierzony czas kroku z zapasem 20 %. */
import { execFileSync } from 'child_process';
type Pomiar = { krok_scenariusze_s: Record<string, number>; scenariusze: Record<string, { czesc: string; wynik: string; s: number }> };
const ROOT = path.join(__dirname, '..', '..');
const pomiar = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/jakosc/e2e-pomiar-140.json'), 'utf8')) as Pomiar;
const wagi = (JSON.parse(fs.readFileSync(path.join(ROOT, 'e2e/czesci.json'), 'utf8')) as { wagi_s: Record<string, number> }).wagi_s;
const planCzesci = (): { czesc: number; files: string[]; osobne: string[]; timeout_min: number }[] =>
  JSON.parse(execFileSync('node', [path.join(ROOT, 'scripts/ci/e2e-czesci.mjs'), 'plan'], { encoding: 'utf8', env: { ...process.env, ONLY: '', PAKIET: '', COMMIT_MSG: '' } }));
describe('NOC-6 · wagi części E2E z pomiaru #140', () => {
  test('pomiar obejmuje wszystkie scenariusze poza nowym 67 i ma sensowne czasy', () => {
    const pliki = fs.readdirSync(KAT).filter((f) => /^\d\d-.*\.yaml$/.test(f));
    expect(pliki.filter((f) => !pomiar.scenariusze[f])).toEqual([plik('67')]);
    for (const [f, r] of Object.entries(pomiar.scenariusze)) expect({ f, ok: r.s > 0 && r.s < 900 }).toEqual({ f, ok: true });
  });
  test('waga każdego scenariusza [Passed] równa się czasowi z dziennika #140', () => {
    const rozne = Object.entries(pomiar.scenariusze).filter(([f, r]) => r.wynik === 'Passed' && wagi[f] !== r.s).map(([f, r]) => `${f}: waga ${wagi[f]}, pomiar ${r.s}`);
    expect(rozne).toEqual([]);
  });
  test('scenariusze [Failed] w #140 zachowują wagę szacunkową (czas zaniżony przez przerwanie), dodatnią', () => {
    for (const [f, r] of Object.entries(pomiar.scenariusze)) if (r.wynik === 'Failed') expect(wagi[f]).toBeGreaterThan(r.s);
  });
  test('trzy części iPhone: rozpiętość zmierzonych czasów ≤ 10 % średniej (bez scenariuszy iPada)', () => {
    const ipad = (f: string) => /^tags:\n(?:\s+- .*\n)*?\s+- ipad\s*$/m.test(fs.readFileSync(path.join(KAT, f), 'utf8').split(/^---$/m)[0]);
    const obc = planCzesci().map((c) => [...c.files, ...c.osobne].filter((f) => !ipad(f)).reduce((a, f) => a + (pomiar.scenariusze[f]?.s ?? wagi[f]), 0));
    const sr = obc.reduce((a, b) => a + b, 0) / obc.length;
    expect({ obc, rozpietoscProc: Math.round(((Math.max(...obc) - Math.min(...obc)) / sr) * 100), ok: Math.max(...obc) - Math.min(...obc) <= 0.1 * sr }).toMatchObject({ ok: true });
  });
  test('limit czasu zadania części (30 + 4 × scenariusze) mieści zmierzony czas kroku „Scenariusze” z zapasem 20 %', () => {
    const maxKrokMin = Math.max(...['iphone-1', 'iphone-2', 'iphone-3'].map((k) => pomiar.krok_scenariusze_s[k])) / 60;
    for (const c of planCzesci()) expect({ czesc: c.czesc, ok: c.timeout_min >= 1.2 * maxKrokMin }).toEqual({ czesc: c.czesc, ok: true });
  });
});
