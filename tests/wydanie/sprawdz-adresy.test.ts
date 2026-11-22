/* Sprawdzanie adresów wydania (P-349 (3), analogia: Trening `scripts/check-urls.mjs` + `.github/workflows/check-urls.yml`, P-315).
 * Skrypt `scripts/wydanie/sprawdz-adresy.mjs`: każdy adres wpisany w aplikację (`src/kompozycja/adresy.ts`), w metadane sklepu
 * (`docs/wydanie/metadane/*.json`) i w `docs/wydanie/adres-strony.json` zwraca 200, a strony Oczka na apps4brew.com mają treść zgodną z `site/`.
 * Dlaczego: martwy adres polityki albo wsparcia to odrzucenie 1.5 / 5.1.1(i), a strona marki jest w osobnym repo (apps4brew-www) z kopią `site/`.
 * Testy działają offline (pobieranie podstawiane); sam skrypt NIE jest częścią `npm run verify` (verify działa bez sieci).
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { YAML } from '../jakosc/maestro-runner';

const ROOT = path.join(__dirname, '..', '..');
const SKRYPT = path.join(ROOT, 'scripts/wydanie/sprawdz-adresy.mjs');
const WORKFLOW = path.join(ROOT, '.github/workflows/sprawdz-adresy.yml');
const czytaj = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const site = (n: string) => czytaj(`site/${n}`);
const SHELL = (sekcje: string) => `<html><body><nav>Menu</nav>${sekcje}<footer>stopka</footer></body></html>`;

/** Wykonuje kod w module ESM skryptu i zwraca wynik jako JSON (skrypt jest .mjs, test .ts). */
const run = (kod: string): any =>
  JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    `import * as m from ${JSON.stringify(SKRYPT)}; const out = await (async () => { ${kod} })(); console.log(JSON.stringify(out));`], { encoding: 'utf8' }));

function korzenTestowy(pliki: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adresy-'));
  for (const [rel, tresc] of Object.entries(pliki)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), tresc);
  }
  return dir;
}
const MIN = {
  'docs/wydanie/adres-strony.json': JSON.stringify({ baza: 'https://przyklad.test/oczko/', polityka: 'privacy.html', wsparcie: 'support.html' }),
  'src/kompozycja/adresy.ts': "export const ADRESY = {\n  polityka: 'https://przyklad.test/oczko/privacy.html',\n  warunki: 'https://przyklad.test/eula/',\n  recenzja: 'https://apps.apple.com/app/id0000000000?action=write-review',\n} as const;\n",
};

describe('sprawdz-adresy: lista adresów', () => {
  test('repo: polityka, wsparcie (baza + nazwa), EULA z aplikacji i adresy z metadanych sklepu; każdy z nazwą źródła', () => {
    const lista = run('return m.adresy()') as { url: string; zrodlo: string }[];
    const urls = new Set(lista.map((a) => a.url));
    const strona = JSON.parse(czytaj('docs/wydanie/adres-strony.json'));
    expect(urls).not.toContain(strona.baza); // przedrostek, nie adres w użyciu (strona główna nie jest opublikowana)
    expect(urls).toContain(strona.baza + strona.polityka);
    expect(urls).toContain(strona.baza + strona.wsparcie);
    expect(urls).toContain(/warunki:\s*'(https:[^']+)'/.exec(czytaj('src/kompozycja/adresy.ts'))![1]);
    const en = JSON.parse(czytaj('docs/wydanie/metadane/en.store.json')).apple.info['en-US'];
    expect(urls).toContain(en.supportUrl);
    expect(urls).toContain(en.privacyPolicyUrl);
    expect(lista.every((a) => a.zrodlo.length > 3)).toBe(true);
  });
  test('adres w opisie sklepu (przyszły link EULA, P-349 (2)) i w tekście promocyjnym trafia na listę; końcowa kropka nie jest częścią adresu', () => {
    const root = korzenTestowy({
      ...MIN,
      'docs/wydanie/metadane/xx.store.json': JSON.stringify({ apple: { info: { 'en-US': { description: 'Terms of Use (EULA): https://przyklad.test/eula/.\nDruga linia', promoText: 'Zobacz https://przyklad.test/promo)', supportUrl: 'https://przyklad.test/oczko/support.html' } } } }),
    });
    const urls = run(`return m.adresy(${JSON.stringify(root)}).map(a => a.url)`) as string[];
    expect(urls).toEqual(expect.arrayContaining(['https://przyklad.test/eula/', 'https://przyklad.test/promo', 'https://przyklad.test/oczko/support.html']));
    expect(urls).not.toContain('https://przyklad.test/eula/.');
  });
  test('ten sam adres z kilku źródeł występuje raz', () => {
    const root = korzenTestowy({ ...MIN });
    const urls = run(`return m.adresy(${JSON.stringify(root)}).map(a => a.url)`) as string[];
    expect(new Set(urls).size).toBe(urls.length);
  });
  test('zaślepka identyfikatora App Store (id0000000000) jest rozpoznana; prawdziwy identyfikator nie', () => {
    expect(run("return m.zaslepka('https://apps.apple.com/app/id0000000000?action=write-review')")).toBe(true);
    expect(run("return m.zaslepka('https://apps.apple.com/app/id6451234567?action=write-review')")).toBe(false);
    expect(run("return m.zaslepka('https://apps4brew.com/oczko/privacy.html')")).toBe(false);
  });
});

describe('sprawdz-adresy: porównanie treści strony na żywo ze site/', () => {
  test('ta sama treść w innej powłoce (bez h1 i znacznika marki) jest zgodna — każda strona site/ z sekcjami językowymi', () => {
    for (const n of ['privacy.html', 'support.html', 'index.html']) {
      const src = site(n);
      const sekcje = [...src.matchAll(/<section lang="(?:pl|en)"[\s\S]*?<\/section>/g)].map((x) => x[0].replace(/<h1[\s\S]*?<\/h1>/g, '')).join('\n');
      expect(run(`return m.fragmenty(${JSON.stringify(src)}).length`)).toBeGreaterThan(2);
      expect(run(`return m.brakujace(${JSON.stringify(src)}, ${JSON.stringify(SHELL(sekcje))})`)).toEqual([]);
    }
  });
  test('stara albo cudza treść na żywo jest wykryta (brakujący akapit, inna strona, 404)', () => {
    const src = site('privacy.html');
    const bezAkapitu = src.replace(/<li>W tej wersji aplikacja nie synchronizuje danych między urządzeniami przez iCloud\.<\/li>/, '');
    expect(bezAkapitu).not.toBe(src); // test pilnuje, że wycinany fragment istnieje
    expect(run(`return m.brakujace(${JSON.stringify(src)}, ${JSON.stringify(bezAkapitu)}).length`)).toBeGreaterThan(0);
    expect(run(`return m.brakujace(${JSON.stringify(src)}, ${JSON.stringify(SHELL('<section lang="pl"><p>Zupełnie inna strona</p></section>'))}).length`)).toBeGreaterThan(0);
    expect(run(`return m.brakujace(${JSON.stringify(src)}, '<html><body>404 Not Found</body></html>').length`)).toBeGreaterThan(0);
  });
  test('encje HTML i odstępy nie dają fałszywego alarmu', () => {
    expect(run("return m.tekst('<p>Ala&nbsp;ma   &quot;kota&quot;&amp;psa</p>')")).toBe('Ala ma "kota"&psa');
  });
});

describe('sprawdz-adresy: main (pobieranie podstawione, bez sieci)', () => {
  const mainZ = (korzen: string, argv: string[], odpowiedzi: Record<string, { status: number; html?: string }>) =>
    run(`const o = ${JSON.stringify(odpowiedzi)}; const wyj = []; const log = console.log; console.log = (...a) => wyj.push(a.join(' '));
         const kod = await m.main(${JSON.stringify(argv)}, ${JSON.stringify(korzen)}, async (u) => o[u] ?? { status: 404, html: '' });
         console.log = log; return { kod, wyj };`) as { kod: number; wyj: string[] };
  const wszystkie200 = {
    'https://przyklad.test/oczko/': { status: 200, html: '<html></html>' },
    'https://przyklad.test/oczko/privacy.html': { status: 200, html: '<html></html>' },
    'https://przyklad.test/oczko/support.html': { status: 200, html: '<html></html>' },
    'https://przyklad.test/eula/': { status: 200, html: '<html></html>' },
  };
  test('wszystkie 200 (--tylko-statusy) → kod 0; zaślepka identyfikatora pominięta z komunikatem, nie jako błąd', () => {
    const w = mainZ(korzenTestowy({ ...MIN }), ['--tylko-statusy'], wszystkie200);
    expect(w.kod).toBe(0);
    expect(w.wyj.join('\n')).toMatch(/zaślepk/i);
  });
  test('jeden adres 404 → kod 1 z nazwą adresu i źródła', () => {
    const { ['https://przyklad.test/eula/']: _pominiety, ...bezEula } = wszystkie200;
    const w = mainZ(korzenTestowy({ ...MIN }), ['--tylko-statusy'], bezEula);
    expect(w.kod).toBe(1);
    expect(w.wyj.join('\n')).toMatch(/BŁĄD https:\/\/przyklad\.test\/eula\/[\s\S]*status 404/);
  });
  test('--wydanie: zaślepka identyfikatora to błąd (build wydania nie może jej mieć)', () => {
    const w = mainZ(korzenTestowy({ ...MIN }), ['--tylko-statusy', '--wydanie'], wszystkie200);
    expect(w.kod).toBe(1);
    expect(w.wyj.join('\n')).toMatch(/id0000000000/);
  });
  test('strona pod bazą z plikiem site/: treść na żywo inna niż źródło → kod 1; zgodna → kod 0', () => {
    const zrodlo = (a: string[]) => `<html><body><section lang="pl">${a.map((x) => `<p>${x}</p>`).join('')}</section></body></html>`;
    const korzen = korzenTestowy({ ...MIN, 'site/privacy.html': zrodlo(['Dane zostają na urządzeniu.', 'Drugi akapit polityki.']), 'site/support.html': zrodlo(['Pisz do nas.', 'Odpowiadamy w kilka dni.']) });
    const zywa = { ...wszystkie200,
      'https://przyklad.test/oczko/privacy.html': { status: 200, html: SHELL('<p>Dane zostają na urządzeniu.</p><p>Drugi akapit polityki.</p>') },
      'https://przyklad.test/oczko/support.html': { status: 200, html: SHELL('<p>Pisz do nas.</p><p>Odpowiadamy w kilka dni.</p>') } };
    expect(mainZ(korzen, [], zywa).kod).toBe(0);
    const stara = { ...zywa, 'https://przyklad.test/oczko/privacy.html': { status: 200, html: SHELL('<p>Dane zostają na urządzeniu.</p>') } };
    const w = mainZ(korzen, [], stara);
    expect(w.kod).toBe(1);
    expect(w.wyj.join('\n')).toMatch(/site\/privacy\.html/);
  });
  test('termin limitu na stronie na żywo inny niż w aplikacji („knitting days” zamiast „crafting days”) → kod 1 z nazwą terminu (plan P3C2, 10-wydanie-007)', () => {
    const en = JSON.stringify({ dni: { dni_robotki_one: '{{count}} crafting day', dni_robotki_other: '{{count}} crafting days' } });
    const zrodlo = '<html><body><section lang="en"><p>Free for up to 5 crafting days a month.</p><p>Drugi akapit.</p></section></body></html>';
    const korzen = korzenTestowy({ ...MIN, 'src/i18n/slowniki/en.json': en, 'site/privacy.html': zrodlo, 'site/support.html': zrodlo });
    const zgodna = { ...wszystkie200,
      'https://przyklad.test/oczko/privacy.html': { status: 200, html: SHELL('<p>Free for up to 5 crafting days a month.</p><p>Drugi akapit.</p>') },
      'https://przyklad.test/oczko/support.html': { status: 200, html: SHELL('<p>Free for up to 5 crafting days a month.</p><p>Drugi akapit.</p>') } };
    expect(mainZ(korzen, [], zgodna).kod).toBe(0);
    const stary = { ...zgodna, 'https://przyklad.test/oczko/support.html': { status: 200, html: SHELL('<p>Free for up to 5 crafting days a month.</p><p>Drugi akapit.</p><p>Free for 5 knitting days.</p>') } };
    const w = mainZ(korzen, [], stary);
    expect(w.kod).toBe(1);
    expect(w.wyj.join('\n')).toMatch(/termin limitu[\s\S]*knitting days[\s\S]*crafting days/);
  });
  test('strona .html pod bazą bez pliku w site/ → kod 1 (rozjazd bez źródła do porównania)', () => {
    const w = mainZ(korzenTestowy({ ...MIN }), [], wszystkie200);
    expect(w.kod).toBe(1);
    expect(w.wyj.join('\n')).toMatch(/brak pliku źródłowego/);
  });
});

describe('workflow sprawdz-adresy.yml (koszt 0, bez macOS)', () => {
  const wf = () => YAML.parse(fs.readFileSync(WORKFLOW, 'utf8')) as any;
  test('istnieje; wyzwalacz tylko ręczny (jak Trening), odczyt repozytorium, bez sekretów', () => {
    expect(fs.existsSync(WORKFLOW)).toBe(true);
    const tekst = fs.readFileSync(WORKFLOW, 'utf8');
    const w = wf();
    const on = w.on ?? w.true;
    expect(Object.keys(on)).toEqual(['workflow_dispatch']);
    expect(w.permissions).toEqual({ contents: 'read' });
    expect(tekst).not.toMatch(/secrets\.(?!GITHUB_TOKEN)/);
    expect(tekst).not.toMatch(/environment:/);
  });
  test('każde zadanie na ubuntu-latest (żadnego macOS, P-349 (3)), z limitem czasu, uruchamia skrypt', () => {
    const w = wf();
    const zadania = Object.values(w.jobs) as any[];
    expect(zadania.length).toBeGreaterThan(0);
    for (const z of zadania) {
      expect(z['runs-on']).toBe('ubuntu-latest');
      expect(typeof z['timeout-minutes']).toBe('number');
    }
    expect(fs.readFileSync(WORKFLOW, 'utf8')).toContain('node scripts/wydanie/sprawdz-adresy.mjs');
  });
  test('skrypt nie jest częścią verify ani kontroli repo (verify działa offline); jest osobną komendą npm', () => {
    const p = JSON.parse(czytaj('package.json')).scripts;
    expect(p.verify).not.toContain('sprawdz-adresy');
    expect(p['jakosc:kontrole']).not.toContain('sprawdz-adresy');
    expect(p['wydanie:adresy']).toBe('node scripts/wydanie/sprawdz-adresy.mjs');
  });
});
