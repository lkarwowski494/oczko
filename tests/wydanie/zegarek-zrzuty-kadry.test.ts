/* Kadry sklepu z Apple Watch (scripts/ci/zegarek-kadry.mjs; ZW1, KO-197, 2026-11-22). Kontrakt: App Store Connect odmawia „Add for Review” dla wersji 1.0 (build 1221) bez zrzutu zegarka.
 * Wymaganie Apple (App Store Connect Help, „Screenshot specifications”, odczyt 2026-11-22): jeden z rozmiarów 422×514, 410×502, 416×496, 396×484, 368×448, 312×390; ten sam rozmiar we wszystkich
 * lokalizacjach; 1–10 zrzutów na rozmiar; PNG bez alfy. Dlaczego test, a nie czytanie workflowu: przebieg macOS trwa kilkadziesiąt minut i pokazuje tylko pierwszy błąd. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { pathToFileURL } from 'url';
import { kadr, png } from './zegarek-pomoc';

const korzen = path.join(__dirname, '..', '..');
const sciezka = path.join(korzen, 'scripts/ci/zegarek-kadry.mjs');
const node = (args: string[]) => spawnSync(process.execPath, [sciezka, ...args], { encoding: 'utf8', cwd: korzen });
/** Wyrażenie JS z modułem `m` (scripts/ci/zegarek-kadry.mjs) w osobnym procesie Node — Jest nie ładuje modułów ES; wynik jako JSON, błąd rzucony w module = { blad }. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const js = (wyrazenie: string): any => {
  const kod = `import fs from 'node:fs'; import * as m from ${JSON.stringify(pathToFileURL(sciezka).href)}; try { process.stdout.write(JSON.stringify({ wynik: await (${wyrazenie}) ?? null })); } catch (e) { process.stdout.write(JSON.stringify({ blad: String(e.message) })); }`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', kod], { encoding: 'utf8', cwd: korzen });
  if (r.status !== 0) throw new Error(`proces Node: ${r.stderr}`);
  return JSON.parse(r.stdout);
};
const stanyWszystkich = (jezyk: string) => js(`m.KADRY.map((k) => [k, m.stan({ jezyk: ${JSON.stringify(jezyk)}, kadr: k, dzien: '2026-11-22' })])`).wynik as [string, any][]; // eslint-disable-line @typescript-eslint/no-explicit-any
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-zegarek-'));

/** Zestaw PNG `<katalog>/<język>/<kadr>.png` o podanym rozmiarze (każdy kadr inną treścią). */
function zestaw(katalog: string, jezyki: string[], kadry: string[], szer = 416, wys = 496, alfa = false) {
  jezyki.forEach((j, ij) => {
    fs.mkdirSync(path.join(katalog, j), { recursive: true });
    kadry.forEach((k, ik) => fs.writeFileSync(path.join(katalog, j, `${k}.png`), kadr(szer, wys, ij * 10 + ik + 1, 0, alfa)));
  });
}

describe('zegarek-kadry.mjs: stałe z wymagań Apple', () => {
  test('rozmiary z listy Apple, domyślny 416×496 (Series 10/11/12), 2 kadry z nazwami NN-<kadr>', () => {
    const m = js('({ ...m })').wynik;
    expect(m.WYMIARY_ZEGARKA).toEqual([[422, 514], [410, 502], [416, 496], [396, 484], [368, 448], [312, 390]]);
    expect(m.ROZMIAR_DOMYSLNY).toEqual([416, 496]);
    expect(m.MAX_NA_JEZYK).toBe(10);
    // ZW2 (P-1025): kadr 03-zablokowany odpada (ucięty tekst w kadrze blokady); zestaw sklepu to dokładnie 2 kadry
    expect(m.KADRY).toEqual(['01-licznik', '02-przypomnienie']);
    expect(m.KADRY).not.toContain('03-zablokowany');
    m.KADRY.forEach((k: string, i: number) => expect(k).toMatch(new RegExp(`^0${i + 1}-[a-z]+$`)));
  });
});

describe('zegarek-kadry.mjs: stan zegarka = to, co dekoduje aplikacja', () => {
  const swift = fs.readFileSync(path.join(korzen, 'targets/watch/Wspolne/Stan.swift'), 'utf8');
  // FB1 (P-1124): `krok` (ADR-0036) jest jedynym kluczem OPCJONALNYM stanu (brak = 1, stan sprzed 1.0.2): jego brak nie daje ekranu „Otwórz Oczko na iPhonie”, więc kadry stanu go nie mają.
  const OPCJONALNE_KLUCZE = ['krok'];
  const kluczeSwift = ((swift.match(/enum CodingKeys: String, CodingKey \{\s*case ([^\n]+)/) ?? [])[1]?.split(',').map((k) => k.trim()).sort() ?? []).filter((k) => !OPCJONALNE_KLUCZE.includes(k));

  test('zbiór kluczy stanu = CodingKeys z targets/watch/Wspolne/Stan.swift (brak klucza = ekran „Otwórz Oczko na iPhonie”)', () => {
    expect(kluczeSwift.length).toBe(15);
    for (const [, s] of stanyWszystkich('en')) expect(Object.keys(s).sort()).toEqual(kluczeSwift);
  });

  test('klucze UserDefaults = te, które czyta ModelZegarka.init (kontekst v2, język v1)', () => {
    const m = js('({ ...m })').wynik;
    const aplikacja = fs.readFileSync(path.join(korzen, 'targets/watch/Aplikacja.swift'), 'utf8');
    expect(aplikacja).toContain(`"${m.KLUCZ_KONTEKSTU}"`);
    expect(aplikacja).toContain(`"${m.KLUCZ_JEZYKA}"`);
    expect(aplikacja).toMatch(/d\.data\(forKey: Self\.kluczKontekst\)/); // dane (NSData), nie napis: stąd `<hex>` w argumencie i `-data` w defaults
    expect(aplikacja).toContain('jezyk = d.string(forKey: Self.kluczJezyk)');
  });

  test('wersja stanu nie nowsza niż znana przez dekoder; typy pól jak w Swift (null tylko tam, gdzie opcjonalne)', () => {
    const wersja = Number((swift.match(/public let wersjaStanu = (\d+)/) ?? [])[1]);
    expect(wersja).toBeGreaterThan(0);
    for (const [, s] of stanyWszystkich('en')) {
      expect(s.wersja).toBeLessThanOrEqual(wersja);
      expect(['skonczone', 'w_trakcie']).toContain(s.znaczenie);
      for (const pole of ['wersja', 'wartosc']) expect(Number.isInteger(s[pole])).toBe(true);
      for (const pole of ['licznikId', 'nazwa', 'dzien']) expect(typeof s[pole]).toBe('string');
      for (const pole of ['dzienDozwolony', 'pro', 'zablokowany']) expect(typeof s[pole]).toBe('boolean');
      for (const pole of ['glowa', 'ostatniPlusMs', 'sesjaStartMs', 'proWaznoscDo']) expect(s[pole]).toBeNull();
      expect(Array.isArray(s.dniWMiesiacu)).toBe(true);
      expect(Array.isArray(s.przypomnienia)).toBe(true);
    }
  });

  test('kadr 02 wyzwala pas przypomnienia w rzędzie w robocie (RD-13: r ≥ od, (r−od) mod co = 0, (r−od)/co < razy), pozostałe kadry bez pasa; blokada licznika w żadnym kadrze (klucz `zablokowany` zostaje w stanie, bo dekoder Swift go wymaga)', () => {
    const wyzwala = (r: number, p: { od: number; co: number; razy: number }) => r >= p.od && (r - p.od) % p.co === 0 && (r - p.od) / p.co < p.razy;
    for (const [k, s] of stanyWszystkich('en')) {
      const rzad = s.wartosc + 1; // rzadWRobocie: skończone + 1
      expect(s.przypomnienia.some((p: { od: number; co: number; razy: number }) => wyzwala(rzad, p))).toBe(k === '02-przypomnienie');
      expect(s.zablokowany).toBe(false);
      expect(s.dzienDozwolony).toBe(true); // bez ekranu limitu (komunikat o limicie dni nie jest głównym przepływem sklepu)
    }
  });

  test('dane zgodne z kadrami iPhone’a: nazwa projektu głównego z e2e/zrzuty-sklepu/dane/<język>.json, licznik 20 jak w fiksturze (ZR3, P-998)', () => {
    expect(js('m.LICZNIK').wynik).toBe(20);
    for (const j of ['en', 'pl']) {
      const dane = JSON.parse(fs.readFileSync(path.join(korzen, `e2e/zrzuty-sklepu/dane/${j}.json`), 'utf8'));
      const [, s] = stanyWszystkich(j)[0];
      expect(s.nazwa).toBe(dane.PROJ_GLOWNY);
      expect(s.wartosc).toBe(20);
    }
    expect(fs.readFileSync(path.join(korzen, 'e2e/zrzuty-sklepu/00-przygotuj.yaml'), 'utf8')).toContain('licznik projektu głównego = 20');
  });

  test('język bez własnych danych dostaje dane `en` jawnie (zastepcze = true), en i pl własne', () => {
    expect(js("m.daneJezyka('en')").wynik.zastepcze).toBe(false);
    expect(js("m.daneJezyka('pl')").wynik.zastepcze).toBe(false);
    expect(js("m.daneJezyka('de')").wynik).toMatchObject({ klucz: 'en', zastepcze: true });
  });

  test('szesnastkowy zapis = bajty UTF-8 JSON-u (składnia <hex> argumentu i `defaults write -data`)', () => {
    const [, s] = stanyWszystkich('pl')[1];
    const hex: string = js(`m.naSzesnastkowy(m.stan({ jezyk: 'pl', kadr: '02-przypomnienie', dzien: '2026-11-22' }))`).wynik;
    expect(JSON.parse(Buffer.from(hex, 'hex').toString('utf8'))).toEqual(s);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  test('złe wejście: nieznany kadr i zły dzień = błąd', () => {
    expect(js(`m.stan({ jezyk: 'en', kadr: '99-x', dzien: '2026-11-22' })`).blad).toMatch(/nieznany kadr/);
    expect(js(`m.stan({ jezyk: 'en', kadr: '01-licznik', dzien: '22.11.2026' })`).blad).toMatch(/RRRR-MM-DD/);
  });

  test('CLI stany: <język>-<kadr>.json i .hex dla każdego języka i kadru; ostrzeżenie dla języka z danymi zastępczymi', () => {
    const k = tmp();
    const r = node(['stany', k, 'en,pl,de', '2026-11-22']);
    expect(r.status).toBe(0);
    expect(r.stderr).toMatch(/OSTRZEŻENIE de: dane pokazowe w języku angielskim/);
    expect(r.stderr).not.toMatch(/OSTRZEŻENIE (en|pl):/);
    expect(fs.readdirSync(k).sort()).toHaveLength(3 * 2 * 2);
    expect(JSON.parse(fs.readFileSync(path.join(k, 'pl-01-licznik.json'), 'utf8')).nazwa).toBe('Czapka z warkoczem');
  });
});

describe('zegarek-kadry.mjs: języki (jak zrzuty-sklepu.yml)', () => {
  test('domyślnie en i pl; all = 29 języków sklepu (en, pl i 27 kolejnych), bez języków bez lokalizacji sklepu', () => {
    expect(node(['plan', 'en,pl']).stdout.trim()).toBe('en,pl');
    const wszystkie = node(['plan', 'all']).stdout.trim().split(',');
    expect(wszystkie).toHaveLength(29);
    expect(wszystkie.slice(0, 2)).toEqual(['en', 'pl']);
    for (const bez of ['bg', 'sl', 'sr', 'lt', 'lv', 'et']) expect(wszystkie).not.toContain(bez);
  });
  test('nieznany język albo język bez lokalizacji sklepu = kod 2 (czerwony plan, nie po godzinie macOS)', () => {
    for (const zly of ['xx', 'en,bg']) {
      const r = node(['plan', zly]);
      expect({ zly, kod: r.status }).toEqual({ zly, kod: 2 });
      expect(r.stderr).toMatch(/BŁĄD ARGUMENTU/);
    }
  });
});

describe('zegarek-kadry.mjs komplet: języki × kadry, jeden rozmiar Apple, bez alfy', () => {
  const JEZYKI = ['en', 'pl'];
  const KADRY = ['01-licznik', '02-przypomnienie'];

  test('komplet 2 języków × 2 kadry 416×496 bez alfy = OK, kod 0', () => {
    const k = tmp(); zestaw(k, JEZYKI, KADRY);
    const r = node(['komplet', k, 'en,pl', '416x496']);
    expect(r.stdout).toMatch(/^OK: komplet 2 języków × 2 kadry/m);
    expect(r.status).toBe(0);
  });

  test.each([
    ['brak kadru', (k: string) => fs.rmSync(path.join(k, 'pl/02-przypomnienie.png')), /pl: pliki \[01-licznik\.png\] zamiast/],
    ['brak języka', (k: string) => fs.rmSync(path.join(k, 'pl'), { recursive: true }), /pl: brak katalogu języka/],
    ['język spoza listy', (k: string) => fs.mkdirSync(path.join(k, 'de')), /de: język spoza listy/],
    ['obcy plik w katalogu języka', (k: string) => fs.writeFileSync(path.join(k, 'en/99-zakup.png'), png(416, 496)), /en: pliki \[/],
    ['rozmiar spoza listy Apple', (k: string) => fs.writeFileSync(path.join(k, 'en/01-licznik.png'), png(400, 500)), /spoza listy Apple Watch/],
    ['rozmiar inny niż oczekiwany (396×484 jest na liście, ale nie 416×496)', (k: string) => { for (const j of JEZYKI) for (const f of KADRY) fs.writeFileSync(path.join(k, j, `${f}.png`), png(396, 484)); }, /oczekiwany 416x496/],
    ['dwa rozmiary w zestawie (Apple: ten sam rozmiar we wszystkich lokalizacjach)', (k: string) => fs.writeFileSync(path.join(k, 'pl/01-licznik.png'), png(422, 514)), /zestaw ma 2 rozmiarów/],
    ['kanał alfa', (k: string) => fs.writeFileSync(path.join(k, 'en/02-przypomnienie.png'), png(416, 496, { alfa: true })), /en\/02-przypomnienie\.png: kanał alfa/],
    ['plik nie jest PNG', (k: string) => fs.writeFileSync(path.join(k, 'en/01-licznik.png'), 'GIF89a'), /to nie jest plik PNG/],
  ])('wada: %s = kod 1 z opisem', (_nazwa, psuj, wzor) => {
    const k = tmp(); zestaw(k, JEZYKI, KADRY); psuj(k);
    const r = node(['komplet', k, 'en,pl', '416x496']);
    expect(r.stdout).toMatch(wzor);
    expect(r.status).toBe(1);
  });

  test('bez oczekiwanego rozmiaru (inny zegarek z wejścia „urzadzenie”): dowolny jeden rozmiar z listy Apple, np. Ultra 3 422×514', () => {
    const k = tmp(); zestaw(k, JEZYKI, KADRY, 422, 514);
    expect(node(['komplet', k, 'en,pl']).status).toBe(0);
  });

  test('brak katalogu = błąd, nie „OK” z pustego zbioru', () => {
    const r = node(['komplet', path.join(tmp(), 'nie-ma'), 'en']);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/brak katalogu/);
  });
});

describe('zegarek-kadry.mjs rozne: czy stan zmienił ekran (poza zegarem systemowym)', () => {
  test('ten sam ekran z innym zegarem (górny pas) = TAKIE SAME; inna treść = RÓŻNE; inny rozmiar = RÓŻNE; RGBA i RGB o tej samej treści = TAKIE SAME', () => {
    const k = tmp();
    const zapisz = (n: string, b: Buffer) => { fs.writeFileSync(path.join(k, n), b); return path.join(k, n); };
    const a = zapisz('a.png', kadr(416, 496, 3, 0)); const zegar = zapisz('b.png', kadr(416, 496, 3, 4)); const inna = zapisz('c.png', kadr(416, 496, 7));
    const rozmiar = zapisz('d.png', kadr(396, 484, 3)); const rgba = zapisz('e.png', kadr(416, 496, 3, 0, true));
    const rozne = (x: string, y: string): boolean => js(`m.rozne(fs.readFileSync(${JSON.stringify(x)}), fs.readFileSync(${JSON.stringify(y)}))`).wynik;
    expect(rozne(a, zegar)).toBe(false); // minuta później: zmienił się tylko zegar
    expect(rozne(a, inna)).toBe(true);
    expect(rozne(a, rozmiar)).toBe(true);
    expect(rozne(a, rgba)).toBe(false);
  });
  test('CLI: kody wyjścia 0 (różne) i 1 (takie same), z plików', () => {
    const k = tmp();
    fs.writeFileSync(path.join(k, 'a.png'), kadr(416, 496, 3));
    fs.writeFileSync(path.join(k, 'b.png'), kadr(416, 496, 3, 6));
    fs.writeFileSync(path.join(k, 'c.png'), kadr(416, 496, 9));
    expect(node(['rozne', path.join(k, 'a.png'), path.join(k, 'b.png')]).status).toBe(1);
    expect(node(['rozne', path.join(k, 'a.png'), path.join(k, 'c.png')]).status).toBe(0);
  });
});
