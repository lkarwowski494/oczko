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
const ZMIENIAJACE = new Set(['runFlow', 'tapOn', 'inputText', 'eraseText', 'setOrientation', 'launchApp', 'back', 'swipe', 'longPressOn']);
const LUKI: { scen: string; zrzut: string; po: Cel; przed?: Cel; opis: string }[] = [
  // (a) licznik z akcją „Wzór” pod liczbą (do 07 cz. 2: menu „•••” otwarte), zanim scenariusz stuknie „Pattern”
  { scen: '21', zrzut: '21-licznik-przed-wzorem', po: { nazwa: 'assertVisible', id: 'licznik-wzor' }, przed: { nazwa: 'tapOn', id: 'licznik-wzor' }, opis: '(a) licznik z akcją „Wzór” pod liczbą przed jej stuknięciem (ZM-04, P-580)' },
  { scen: '22', zrzut: '22-licznik-przed-wzorem', po: { nazwa: 'assertVisible', id: 'licznik-wzor' }, przed: { nazwa: 'tapOn', id: 'licznik-wzor' }, opis: '(a) licznik z akcją „Wzór” pod liczbą przed jej stuknięciem (ZM-04, P-580)' },
  { scen: '23', zrzut: '23-licznik-przed-wzorem', po: { nazwa: 'assertVisible', id: 'licznik-wzor' }, przed: { nazwa: 'tapOn', id: 'licznik-wzor' }, opis: '(a) licznik z akcją „Wzór” pod liczbą przed jej stuknięciem (ZM-04, P-580)' },
  { scen: '62', zrzut: '62-menu-przed-wzorem', po: { nazwa: 'tapOn', id: 'licznik-menu' }, przed: { nazwa: 'tapOn', id: 'menu-wpisz-wartosc' }, opis: '(a) menu ••• przed „Enter the row number” (wzór otwiera akcja „Wzór” pod liczbą w otworz-wzor-pdf)' },
  { scen: '57', zrzut: '57-licznik-przed-notatka', po: { nazwa: 'assertVisible', id: 'licznik-akcja-notatka' }, przed: { nazwa: 'tapOn', id: 'licznik-akcja-notatka' }, opis: '(a) licznik z akcją „Notatka” przed otwarciem arkusza (ZM-04)' },
  // (b) notatka: licznik z akcją „Notatka” i arkusz notatki przed wpisem (07 cz. 2, ZM-04; do tego dnia — ekran projektu z wierszem „Note”)
  { scen: '57', zrzut: '57-arkusz-notatki-przed-zapisem', po: { nazwa: 'assertVisible', id: 'formularz-notatka' }, przed: { nazwa: 'tapOn', id: 'formularz-notatka' }, opis: '(b) arkusz notatki z licznika przed wpisem' },
  // (c) widok wzoru przed pierwszym znacznikiem i po +1 przy zamkniętym panelu
  { scen: '62', zrzut: '62-wzor-przed-znacznikiem', po: { nazwa: 'assertVisible', id: 'licznik-wartosc' }, przed: { nazwa: 'tapOn', id: 'wzor-zaznacz' }, opis: '(c) wzór przed pierwszym znacznikiem' },
  { scen: '62', zrzut: '62-wzor-po-plus-1-panel-zamkniety', po: { nazwa: 'tapOn', id: 'licznik-plus' }, przed: { nazwa: 'tapOn', id: 'wzor-zaznacz' }, opis: '(c) wzór po +1, panel znacznika zamknięty' },
  // (d) +1 w poziomie na telefonie
  { scen: '23', zrzut: '23-poziomo-po-plus-1', po: { nazwa: 'tapOn', id: 'licznik-plus' }, przed: { nazwa: 'setOrientation' }, opis: '(d) +1 w poziomie' },
  // NOC-2b: uzupełnienie koordynatora — tabela luk 04 (docs/design/przejscie/maestro-2026-11-02.md @ e93f0e9), priorytet F-24, F-26, F-31, F-18, F-09
  { scen: '21', zrzut: '21-ekran-dodaj-wzor', po: { nazwa: 'assertVisible', id: 'wzor-dodaj' }, przed: { nazwa: 'tapOn', id: 'wzor-dodaj' }, opis: 'F-24 ekran dodaj wzór' },
  { scen: '22', zrzut: '22-ekran-dodaj-wzor', po: { nazwa: 'assertVisible', id: 'wzor-dodaj' }, przed: { nazwa: 'tapOn', id: 'wzor-dodaj' }, opis: 'F-24 ekran dodaj wzór' },
  { scen: '62', zrzut: '62-wybor-kierunku', po: { nazwa: 'assertVisible', id: 'wzor-kierunek' }, przed: { nazwa: 'tapOn' }, opis: 'F-26 wybór kierunku rzędów' },
  { scen: '62', zrzut: '62-wzor-po-gotowe', po: { nazwa: 'assertNotVisible', id: 'wzor-znacznik-pasek' }, przed: { nazwa: 'tapOn', id: 'licznik-plus' }, opis: 'F-26 stan po Done' },
  { scen: '10', zrzut: '10-formularz-wpisz-wartosc-przed-zapisem', po: { nazwa: 'assertVisible', id: 'wpisz-wartosc-pole' }, przed: { nazwa: 'tapOn', id: 'formularz-zapisz' }, opis: 'F-31 formularz przed zapisem' },
  { scen: '18', zrzut: '18-przed-restartem', po: { nazwa: 'assertVisible', id: 'licznik-wartosc' }, przed: { nazwa: 'runFlow' }, opis: 'F-18 licznik przed zamknięciem' },
  { scen: '56', zrzut: '56-menu-znaczenie', po: { nazwa: 'assertVisible', id: 'menu-znaczenie' }, przed: { nazwa: 'tapOn', id: 'menu-znaczenie' }, opis: 'F-09 menu przed wyborem znaczenia' },
  { scen: '56', zrzut: '56-arkusz-znaczenia', po: { nazwa: 'assertVisible', tekst: 'The row I' }, przed: { nazwa: 'tapOn' }, opis: 'F-09 arkusz znaczenia przed wyborem' },
  // (e) wąskie okno iPada: licznik > 0 i „•••”
  { scen: '46', zrzut: '46-waskie-licznik-wartosc-menu', po: { nazwa: 'tapOn', id: 'nav-wstecz' }, przed: { nazwa: 'tapOn', id: 'nav-wstecz' }, opis: '(e) wąskie okno: licznik 1 i „•••” (potem wstecz do listy, P-583)' },
  // NOC-2b (cz. 2, kontynuacja): Ustawienia przed wierszem (tabela luk 04, „Luki do 07/08” pkt 2), menu i formularze przed zapisem, skutki Save/Restore/„A second Back”/„Make another like this” (pkt 4)
  { scen: '08', zrzut: '08-ustawienia-przed-eksportem', po: { nazwa: 'assertVisible', id: 'ustawienia-eksport' }, przed: { nazwa: 'tapOn', id: 'ustawienia-eksport' }, opis: 'F-32 Ustawienia przed wierszem eksportu' },
  { scen: '08', zrzut: '08-ustawienia-przed-importem', po: { nazwa: 'assertVisible', id: 'ustawienia-import' }, przed: { nazwa: 'tapOn', id: 'e2e-pliki-importuj-ostatni' }, opis: 'F-32 Ustawienia przed importem' },
  { scen: '51', zrzut: '51-ustawienia-przed-usun-wszystko', po: { nazwa: 'scrollUntilVisible', id: 'ustawienia-usun-wszystko' }, przed: { nazwa: 'tapOn', id: 'ustawienia-usun-wszystko' }, opis: 'F-34 Ustawienia przed wierszem Delete all data' },
  { scen: '63', zrzut: '63-ustawienia-przed-zglos', po: { nazwa: 'assertVisible', id: 'ustawienia-zglos' }, przed: { nazwa: 'tapOn', id: 'ustawienia-zglos' }, opis: 'F-57 Ustawienia przed wierszem Report a problem' },
  { scen: '65', zrzut: '65-menu-przed-ukoncz', po: { nazwa: 'assertVisible', id: 'menu-ukoncz' }, przed: { nazwa: 'tapOn', id: 'menu-ukoncz' }, opis: 'F-64 menu ••• przed Ukończ' },
  { scen: '55', zrzut: '55-menu-powtorzenie', po: { nazwa: 'assertVisible', id: 'menu-powtorzenie' }, przed: { nazwa: 'tapOn', id: 'menu-powtorzenie' }, opis: 'F-05 menu ••• z pozycją Repeat' },
  { scen: '18', zrzut: '18-formularz-nazwa-przed-zapisem', po: { nazwa: 'assertVisible', id: 'formularz-zapisz' }, przed: { nazwa: 'tapOn', id: 'formularz-zapisz' }, opis: 'F-31 formularz nazwy przed zapisem' },
  { scen: '36', zrzut: '36-menu-usuwania', po: { nazwa: 'assertVisible', id: 'projekt-usun' }, przed: { nazwa: 'tapOn', id: 'projekt-usun' }, opis: 'F-33 menu projektu z pozycją usuwania' },
  { scen: '36', zrzut: '36-kosz-po-przywroceniu', po: { nazwa: 'assertNotVisible', id: 'kosz-przywroc' }, przed: { nazwa: 'tapOn', id: 'nav-wstecz' }, opis: 'F-33 kosz po Restore' },
  { scen: '36', zrzut: '36-lista-po-przywroceniu', po: { nazwa: 'assertNotVisible', id: 'projekty-kosz' }, przed: { nazwa: 'tapOn' }, opis: 'F-33 lista po Restore' },
  { scen: '34', zrzut: '34-po-wyborze-drugiej', po: { nazwa: 'assertVisible', id: 'licznik-wartosc', tekst: '"text":"0"' }, przed: { nazwa: 'tapOn', id: 'licznik-projekt-wejscie' }, opis: 'F-52 skutek wyboru „A second Back”' },
  { scen: '34', zrzut: '34-projekt-dwie-czesci', po: { nazwa: 'assertVisible', tekst: 'Pair of Back' }, opis: 'F-52 projekt z drugą częścią' },
  { scen: '61', zrzut: '61-menu-zrob-taka-sama', po: { nazwa: 'assertVisible', id: 'projekt-zrob-taka-sama' }, przed: { nazwa: 'tapOn', id: 'projekt-zrob-taka-sama' }, opis: 'F-20 menu z pozycją Make another like this' },
  { scen: '61', zrzut: '61-oryginal-po-operacji', po: { nazwa: 'assertVisible', id: 'licznik-wartosc', tekst: '"text":"2"' }, opis: 'F-20 oryginał po operacji' },
];
describe('NOC-2 · luki zrzutów dla przejścia 04', () => {
  test.each(LUKI.map((x) => [x.scen, x.opis, x] as const))('%s %s', (_s, _o, x) => {
    const l = lista(x.scen);
    const z = l.findIndex((k) => trafia(k, zrzut(x.zrzut)));
    expect(z).toBeGreaterThan(-1);
    const wczesniej = l.slice(0, z);
    expect(wczesniej.some((k) => trafia(k, x.po))).toBe(true);
    const ostatniePo = wczesniej.map((k, i) => (trafia(k, x.po) ? i : -1)).filter((i) => i >= 0).pop() as number;
    // zrzut leży zaraz po kroku „po”: między nim a zrzutem nie ma kroku zmieniającego ekran (stuknięcie, wpis, obrót, start)
    const miedzy = l.slice(ostatniePo + 1, z);
    expect(miedzy.filter((k) => ZMIENIAJACE.has(k.nazwa)).map((k) => k.nazwa)).toEqual([]);
    if (x.przed) {
      const nastepny = l.findIndex((k, i) => i > z && trafia(k, x.przed!));
      expect(nastepny).toBeGreaterThan(z);
      // i tuż przed krokiem „przed”: pierwszy krok zmieniający ekran po zrzucie to właśnie on
      const pierwszyZmieniajacy = l.findIndex((k, i) => i > z && ZMIENIAJACE.has(k.nazwa));
      expect(pierwszyZmieniajacy).toBe(nastepny);
    }
  });
  test('każda nazwa zrzutu jest unikalna w swoim scenariuszu', () => {
    for (const s of new Set([...LUKI.map((x) => x.scen), ...WARIANTY.flatMap((w) => w.wywolania.map((c) => c.scen))])) {
      const nazwy = lista(s).filter((k) => k.nazwa === 'takeScreenshot').map((k) => JSON.stringify(k.arg));
      const zEnv = lista(s).filter((k) => k.nazwa === 'runFlow' && k.arg?.env?.ZRZUT).map((k) => JSON.stringify(k.arg.env.ZRZUT));
      expect({ s, powt: [...nazwy, ...zEnv].filter((n, i, w) => w.indexOf(n) !== i) }).toEqual({ s, powt: [] });
    }
  });
});

/* NOC-2b (cz. 2) · zrzuty wewnątrz podprzepływów współdzielonych (nazwij-projekt, otworz-stan-danych, ustaw-powtorzenie): jedno `takeScreenshot` w pliku podprzepływu dałoby tę samą
 *       nazwę przy każdym wywołaniu (kolizja w artefakcie części). Decyzja: wariant `<podprzepływ>-ze-zrzutem.yaml` z parametrem `ZRZUT` (nazwa zrzutu podaje wołający w `env`),
 *       oryginał nietknięty, więc pozostałe scenariusze (które go wołają) nie zmieniają się. Pilnuje, że wariant = oryginał + jeden zrzut (bez dryfu kopii obejścia klawiatury). */
const SUBKAT = path.join(KAT, 'subflows');
const WARIANTY: { baza: string; po: Cel; przed: Cel; wywolania: { scen: string; zrzut: string; env?: Record<string, string> }[] }[] = [
  { baza: 'nazwij-projekt', po: { nazwa: 'assertVisible', id: 'formularz-zapisz' }, przed: { nazwa: 'tapOn', id: 'formularz-zapisz' }, wywolania: [{ scen: '11', zrzut: '11-formularz-nazwa-przed-zapisem' }] },
  { baza: 'otworz-stan-danych', po: { nazwa: 'scrollUntilVisible', tekst: 'Data and sync' }, przed: { nazwa: 'tapOn', tekst: 'Data and sync' }, wywolania: [{ scen: '48', zrzut: '48-ustawienia-przed-data-and-sync' }, { scen: '50', zrzut: '50-ustawienia-przed-data-and-sync' }] },
  { baza: 'ustaw-powtorzenie', po: { nazwa: 'assertVisible', id: 'formularz-zapisz' }, przed: { nazwa: 'tapOn', id: 'formularz-zapisz' }, wywolania: [{ scen: '55', zrzut: '55-formularz-powtorzenie-8-przed-zapisem', env: { DLUGOSC: '8' } }] },
];
const sub = (n: string) => wczytaj(path.join(SUBKAT, `${n}.yaml`));
describe('NOC-2b · warianty podprzepływów ze zrzutem (parametr ZRZUT)', () => {
  test.each(WARIANTY.map((w) => [w.baza, w] as const))('%s-ze-zrzutem = %s + jeden zrzut ${ZRZUT} w punkcie przed zmieniającym krokiem', (_b, w) => {
    const plikW = path.join(SUBKAT, `${w.baza}-ze-zrzutem.yaml`);
    expect(fs.existsSync(plikW)).toBe(true);
    const o = sub(w.baza);
    const v = wczytaj(plikW);
    expect(v.naglowek.appId).toBe(o.naglowek.appId);
    const bez = v.polecenia.filter((p) => !(typeof p === 'object' && p && 'takeScreenshot' in p));
    expect(bez).toEqual(o.polecenia);
    const zrzuty = v.polecenia.filter((p) => typeof p === 'object' && p && 'takeScreenshot' in p);
    expect(zrzuty).toEqual([{ takeScreenshot: '${ZRZUT}' }]);
    // zrzut stoi na najwyższym poziomie pliku: poprzedni krok to „po”, następny zmieniający — „przed”
    const l = [...kroki(v.polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
    const z = l.findIndex((k) => k.nazwa === 'takeScreenshot');
    expect(trafia(l[z - 1], w.po)).toBe(true);
    expect(trafia(l.slice(z + 1).find((k) => ZMIENIAJACE.has(k.nazwa)) as Krok, w.przed)).toBe(true);
  });
  test.each(WARIANTY.flatMap((w) => w.wywolania.map((c) => [`${c.scen} → ${w.baza}`, w, c] as const)))('%s: scenariusz woła wariant z nazwą zrzutu', (_o, w, c) => {
    const wyw = lista(c.scen).filter((k) => k.nazwa === 'runFlow' && JSON.stringify(k.arg).includes(`${w.baza}-ze-zrzutem.yaml`));
    expect(wyw.map((k) => k.arg.env?.ZRZUT)).toEqual([c.zrzut]);
    for (const [kl, wa] of Object.entries(c.env ?? {})) expect(wyw[0].arg.env[kl]).toBe(wa);
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
  test('pomiar obejmuje wszystkie scenariusze poza nowymi 67 i 68 (68: zadanie 002, bez pomiaru) i ma sensowne czasy', () => {
    const pliki = fs.readdirSync(KAT).filter((f) => /^\d\d-.*\.yaml$/.test(f));
    expect(pliki.filter((f) => !pomiar.scenariusze[f])).toEqual([plik('67'), plik('68')]);
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
