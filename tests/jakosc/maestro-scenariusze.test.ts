/* Scenariusze E2E wersji 1 (e2e/scenariusze) — kontrola składni i selektorów w głównym zestawie (strategia §3 „Scenariusz w interpreterze”, §6 „Przepływ”).
 * Przejście scenariuszy po drzewie dostępności ekranów to test akceptacyjny roli 08 (tests/akceptacja/ekrany/, adapter `elementyZDrzewa` + `Runner`);
 * tu: każdy scenariusz parsuje się, każde polecenie i klucz selektora zna interpreter, po akcji zmieniającej stan jest asercja, brak hideKeyboard po polu
 * liczbowym, reguły P-091 (9a) dla wartości licznika, każde id opisane w e2e/README.md. Każda reguła ma pułapkę (strategia §3, zasada 2). */
import * as fs from 'fs';
import * as path from 'path';
import {
  wczytaj, problemySkladni, problemyAsercji, problemyKlawiatury, problemyLicznika, sprawdzaWartoscLicznika, identyfikatory, opisyIdentyfikatorow,
  podprzeplywy, kroki, Runner, pasuje, elementyZDrzewa, YAML, type Scenariusz, type EkranTestowy, type Element, type Wezel,
} from './maestro-runner';

const root = path.join(__dirname, '..', '..');
const KAT = path.join(root, 'e2e/scenariusze');
const SUB = path.join(KAT, 'subflows');
const README = fs.readFileSync(path.join(root, 'e2e/README.md'), 'utf8');
const APP_ID = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo.ios.bundleIdentifier as string;
const pliki = fs.readdirSync(KAT).filter(f => /^\d\d-.*\.yaml$/.test(f)).sort();
const podpliki = fs.readdirSync(SUB).filter(f => f.endsWith('.yaml')).sort();
const scen = pliki.map(f => wczytaj(path.join(KAT, f)));
const subs = podpliki.map(f => wczytaj(path.join(SUB, f)));
const wszystkie = [...scen, ...subs];
const nazwa = (s: Scenariusz) => path.relative(KAT, s.plik);
const OGOLNE = new Set(['podstawowy', 'stan-licznika', 'osobny-krok', 'wzor', 'zegarek', 'pomiar', 'ipad']); // ipad: P-225 Q1a
const opisy = opisyIdentyfikatorow(README);
const liczbowe = new Set([...opisy].filter(([, o]) => o.klawiatura === 'liczbowa').map(([id]) => id));
const zYaml = (plik: string, tekst: string): Scenariusz => { const docs = YAML.parseAllDocuments(tekst).map(d => d.toJS()); return { plik, naglowek: docs.length > 1 ? docs[0] : {}, polecenia: docs[docs.length - 1] }; };

describe('katalog scenariuszy', () => {
  test('scenariusze i podprzepływy istnieją (pusta lista to błąd testu) i parsują się jako YAML Maestro (nagłówek + lista poleceń)', () => {
    expect(pliki.length).toBeGreaterThanOrEqual(26);
    expect(podpliki.length).toBeGreaterThan(0);
    for (const s of wszystkie) expect({ plik: nazwa(s), lista: Array.isArray(s.polecenia) && s.polecenia.length > 0 }).toEqual({ plik: nazwa(s), lista: true });
  });

  test('appId = ios.bundleIdentifier z app.json; nazwa pliku NN-<id>-…; name i tagi niosą ID kryterium; każdy scenariusz ma zrzut w punkcie kontrolnym', () => {
    expect(APP_ID).toBe('com.apps4brew.knitting');
    for (const s of wszystkie) expect({ plik: nazwa(s), appId: s.naglowek.appId }).toEqual({ plik: nazwa(s), appId: APP_ID });
    const zle: string[] = [];
    for (const s of scen) {
      const tagi = (s.naglowek.tags ?? []).map(String); const ids = tagi.filter(t => !OGOLNE.has(t));
      const nazwaN = String(s.naglowek.name ?? '').replace(/\s*\((\w+)\)/g, '-$1').replace(/\//g, '-');
      const wNazwie = ids.filter(id => nazwaN.includes(id));
      if (!wNazwie.length) zle.push(`${nazwa(s)}: name bez ID z tagów`);
      else if (!wNazwie.some(id => nazwa(s).includes(id.toLowerCase()))) zle.push(`${nazwa(s)}: nazwa pliku bez ID (${wNazwie.join(', ')})`);
      if (![...kroki(s.polecenia)].some(k => k.nazwa === 'takeScreenshot')) zle.push(`${nazwa(s)}: bez takeScreenshot`);
    }
    expect(zle).toEqual([]);
  });

  test('każde kryterium o poziomie E2E-symulator (docs/jakosc/e0/kryteria.json) ma scenariusz z tagiem tego ID', () => {
    const kryteria = (JSON.parse(fs.readFileSync(path.join(root, 'docs/jakosc/e0/kryteria.json'), 'utf8')) as { id: string; poziom_sugerowany: string }[]).filter(k => k.poziom_sugerowany === 'E2E-symulator').map(k => k.id);
    expect(kryteria.length).toBe(26);
    const tagi = new Set(scen.flatMap(s => (s.naglowek.tags ?? []).map(String)));
    expect(kryteria.filter(id => !tagi.has(id.replace(/\//g, '-')))).toEqual([]);
  });

  test('runFlow wskazuje istniejące podprzepływy; każdy podprzepływ jest używany', () => {
    const uzyte = new Set<string>();
    for (const s of wszystkie) for (const p of podprzeplywy(s)) { expect({ z: nazwa(s), plik: path.relative(KAT, p), istnieje: fs.existsSync(p) }).toEqual({ z: nazwa(s), plik: path.relative(KAT, p), istnieje: true }); uzyte.add(p); }
    expect(subs.map(s => s.plik).filter(p => !uzyte.has(p))).toEqual([]);
  });
});

describe('reguły scenariuszy (pliki z repo)', () => {
  test('składnia: polecenia i klucze selektorów znane interpreterowi, id w alfabecie [a-z0-9-]', () => {
    expect(wszystkie.flatMap(problemySkladni)).toEqual([]);
  });
  test('po każdej akcji zmieniającej stan jest asercja (strategia §3 zasada 8)', () => {
    expect(wszystkie.flatMap(problemyAsercji)).toEqual([]);
  });
  test('brak hideKeyboard po polu klawiatury liczbowej (Trening docs/38:112); pola liczbowe są opisane w README', () => {
    expect(liczbowe.size).toBeGreaterThanOrEqual(4);
    expect(wszystkie.flatMap(s => problemyKlawiatury(s, liczbowe))).toEqual([]);
  });
  test('P-091 (9a): po stuknięciu zmieniającym licznik — asercja wartości; żadnego takiego stuknięcia w retry', () => {
    expect(wszystkie.flatMap(problemyLicznika)).toEqual([]);
  });
  test('P-091 (9a): tag stan-licznika ⇔ scenariusz (z podprzepływami) sprawdza wartość licznika', () => {
    const zle = scen.filter(s => sprawdzaWartoscLicznika(s) !== (s.naglowek.tags ?? []).includes('stan-licznika')).map(nazwa);
    expect(zle).toEqual([]);
    expect(scen.filter(s => (s.naglowek.tags ?? []).includes('stan-licznika')).length).toBeGreaterThan(0);
  });
  test('każde id z scenariuszy ma wiersz w tabeli testID w e2e/README.md (lista dla 08)', () => {
    const ids = [...new Set(wszystkie.flatMap(identyfikatory))].sort();
    expect(ids.length).toBeGreaterThan(50);
    expect(ids.filter(id => !opisy.has(id))).toEqual([]);
  });
  test('selektor id dopasowuje swój testID dosłownie (Trening maestro-selectors.test.ts:9 — nawiasy w id były grupą regex)', () => {
    for (const id of [...opisy.keys()]) expect({ id, ok: pasuje(id)(id) }).toEqual({ id, ok: true });
  });
});

describe('pułapki: każda reguła czerwienieje na złym scenariuszu', () => {
  const zly = zYaml('/x/zly.yaml', [
    'appId: x', 'name: Zły', '---',
    '- launchApp', '- tapOn: { id: "licznik-plus" }', '- tapOn: { id: "licznik-plus" }', '- assertVisible: "1"',
    '- retry:', '    maxRetries: 1', '    commands:', '      - tapOn: { id: "licznik-minus" }', '      - assertVisible: { id: "licznik-wartosc", text: "0" }',
    '- tapOn: { id: "wpisz-wartosc-pole" }', '- inputText: "4"', '- hideKeyboard', '- tapOn: { leftOf: "x" }', '- assertVisible: "y"', '- dotknij: "z"',
    '- tapOn: { id: "Zle(ID)" }', '- assertVisible: "q"', '- swipe: { start: "1%, 1%", end: "2%, 2%" }',
  ].join('\n'));
  test('składnia: nieznane polecenie, nieznany klucz selektora, id poza alfabetem', () => {
    const p = problemySkladni(zly);
    expect(p.some(x => /nieznane polecenie „dotknij”/.test(x))).toBe(true);
    expect(p.some(x => /nieznany klucz selektora „leftOf”/.test(x))).toBe(true);
    expect(p.some(x => /id „Zle\(ID\)”/.test(x))).toBe(true);
  });
  test('asercja: dwa stuknięcia z rzędu i akcja na końcu listy bez asercji', () => {
    const p = problemyAsercji(zly);
    expect(p.some(x => /po „tapOn \{"id":"licznik-plus"\}” brak asercji \(następny krok: tapOn\)/.test(x))).toBe(true);
    expect(p.some(x => /po „swipe .*brak asercji \(następny krok: koniec listy\)/.test(x))).toBe(true);
    expect(problemyAsercji(zYaml('/x/ok.yaml', 'appId: x\n---\n- tapOn: { id: "a" }\n- waitForAnimationToEnd\n- eraseText: 3\n- inputText: "1"\n- inputText: "2"\n- assertVisible: { id: "a", text: "12" }\n- stopApp\n- launchApp\n- extendedWaitUntil: { visible: "b", timeout: 1 }\n- pressKey: Home\n- launchApp: { stopApp: false }\n- assertVisible: "c"\n'))).toEqual([]);
    expect(problemyAsercji(zYaml('/x/enter.yaml', 'appId: x\n---\n- pressKey: Enter\n- launchApp\n- assertVisible: "c"\n')).length).toBe(1); /* tylko Home łączy się z launchApp */
  });
  test('klawiatura: hideKeyboard po polu liczbowym (z README) jest błędem, po tekstowym nie', () => {
    expect(problemyKlawiatury(zly, liczbowe).length).toBe(1);
    expect(problemyKlawiatury(zYaml('/x/t.yaml', 'appId: x\n---\n- tapOn: { id: "zapas-szukaj" }\n- hideKeyboard\n'), liczbowe)).toEqual([]);
  });
  test('licznik: stuknięcie +1 bez asercji wartości i stuknięcie −1 w retry', () => {
    const p = problemyLicznika(zly);
    expect(p.filter(x => /pierwsza asercja nie sprawdza wartości/.test(x)).length).toBe(2);
    expect(p.filter(x => /w bloku retry/.test(x)).length).toBe(1);
    expect(problemyLicznika(zYaml('/x/t.yaml', 'appId: x\n---\n- tapOn: "\\\\+1 row.*"\n- assertVisible: "Undo"\n')).length).toBe(1); /* także po etykiecie VoiceOver */
  });
  test('tag stan-licznika: asercja wartości wykryta także przez podprzepływ', () => {
    const glowny = zYaml('/x/g.yaml', 'appId: x\n---\n- runFlow: sub.yaml\n');
    const sub = zYaml('/x/sub.yaml', 'appId: x\n---\n- assertVisible: { id: "licznik-wartosc", text: "1" }\n');
    expect(sprawdzaWartoscLicznika(glowny, p => { expect(p).toBe('/x/sub.yaml'); return sub; })).toBe(true);
    expect(sprawdzaWartoscLicznika(zYaml('/x/b.yaml', 'appId: x\n---\n- assertVisible: { id: "licznik-plus" }\n'))).toBe(false);
  });
  test('README: id spoza tabeli jest wykrywane', () => {
    expect(identyfikatory(zYaml('/x/r.yaml', 'appId: x\n---\n- assertVisible: { id: "nie-ma-w-readme|licznik-plus" }\n')).filter(id => !opisy.has(id))).toEqual(['nie-ma-w-readme']);
  });
});

/* Interpreter na atrapie ekranu (bez React): semantyka dopasowania Maestro, retry, runFlow z env i wyrażeniami, repeat, optional, hideKeyboard. */
class AtrapaLicznika implements EkranTestowy {
  wartosc = 0; tekstPola = ''; uruchomienia: Record<string, string>[] = []; zablokowany = false; utraconyZnak = 1;
  elementy(): Element[] {
    return [
      { id: 'licznik-wartosc', teksty: [String(this.wartosc)] },
      { id: 'licznik-teraz-rzad', teksty: [`Now working row ${this.wartosc + 1}`] },
      { id: 'licznik-plus', teksty: [`+1 row, when row ${this.wartosc + 1} is done`] },
      { id: 'wpisz-wartosc-pole', teksty: this.tekstPola ? [this.tekstPola] : ['Rows already finished'], pole: true, klawiatura: 'number-pad' },
    ];
  }
  async uruchom(o: { wyczyscStan: boolean; argumenty: Record<string, string> }) { if (o.wyczyscStan) this.wartosc = 0; this.uruchomienia.push(o.argumenty); }
  async zatrzymaj() {}
  async tlo() {}
  async stuknij(e: Element) { if (e.id === 'licznik-plus') this.wartosc++; }
  async wpisz(t: string) { if (this.utraconyZnak > 0) { this.utraconyZnak--; return; } this.tekstPola += t; } /* symulator gubi pierwszy znak (Trening Q-029) */
  async usunZnaki() { this.tekstPola = ''; }
  async enter() {}
  async przesun() {}
  async przewin() {}
  async orientacja() {}
  async odczekaj() {}
}

describe('interpreter (Runner) na atrapie ekranu', () => {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'maestro-'));
  const zapisz = (n: string, t: string) => { const p = path.join(tmp, n); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); return p; };

  test('dopasowanie jak Maestro: wyrażenie do CAŁEGO tekstu, bez wielkości liter, z \\n jako spacją; zły wzorzec dosłownie', () => {
    expect(pasuje('\\+1 row.*')('+1 row, when row 2 is done')).toBe(true);
    expect(pasuje('row')('+1 row')).toBe(false);
    expect(pasuje('now working row 2')('Now working row 2')).toBe(true);
    expect(pasuje('a b')('a\nb')).toBe(true);
    expect(pasuje('(x')('(x')).toBe(true);
  });

  test('scenariusz z podprzepływem, env, wyrażeniem ${…}, repeat i retry (zgubiony pierwszy znak — druga próba wpisu)', async () => {
    zapisz('sub/start.yaml', 'appId: x\n---\n- launchApp:\n    clearState: true\n    arguments:\n      oczkoE2eTeraz: ${TERAZ}\n- extendedWaitUntil: { visible: { id: "licznik-plus" }, timeout: 100 }\n');
    zapisz('sub/plus.yaml', 'appId: x\n---\n- tapOn: { id: "licznik-plus" }\n- assertVisible: { id: "licznik-wartosc", text: "${Number(OD) + 1}" }\n');
    const p = zapisz('01-test.yaml', [
      'appId: x', 'name: T', '---',
      '- runFlow: { file: sub/start.yaml, env: { TERAZ: "2026-11-01T00:05:00" } }',
      '- tapOn: { id: "licznik-plus" }', '- assertVisible: { id: "licznik-wartosc", text: "1" }',
      '- runFlow: { file: sub/plus.yaml, env: { OD: "1" } }',
      '- tapOn: { id: "licznik-plus", repeat: 3, delay: 150 }', '- assertVisible: { id: "licznik-wartosc", text: "5" }',
      '- assertVisible: { id: "licznik-teraz-rzad", text: "Now working row 6" }',
      '- retry:', '    maxRetries: 1', '    commands:', '      - tapOn: { id: "wpisz-wartosc-pole" }', '      - eraseText: 5', '      - inputText: "4"', '      - inputText: "6"', '      - assertVisible: { id: "wpisz-wartosc-pole", text: "46" }',
      '- tapOn: { id: "nie-ma", optional: true }', '- assertNotVisible: { id: "nie-ma" }',
      '- copyTextFrom: { id: "licznik-wartosc" }', '- evalScript: ${output.w = maestro.copiedText}', '- assertTrue: ${output.w == "5"}',
      '- takeScreenshot: 01-koniec',
    ].join('\n'));
    const ekran = new AtrapaLicznika(); const r = new Runner('01-test.yaml', ekran);
    await r.uruchomPlik(p);
    expect(ekran.wartosc).toBe(5);
    expect(ekran.uruchomienia).toEqual([{ oczkoE2eTeraz: '2026-11-01T00:05:00' }]);
    expect(r.ponowienia).toHaveLength(1); expect(r.ponowienia[0]).toMatch(/wpisz-wartosc-pole/);
    expect(r.zrzuty).toEqual(['01-koniec']);
    expect(problemyAsercji(wczytaj(p))).toEqual([]);
  });

  test('błąd kroku podaje plik, krok i elementy na ekranie; nieznane polecenie i hideKeyboard na polu liczbowym to błędy', async () => {
    const ekran = new AtrapaLicznika(); const r = new Runner('x', ekran);
    await expect(r.krok({ assertVisible: { id: 'licznik-wartosc', text: '7' } }, '/k/02.yaml', {})).rejects.toThrow(/krok: k\/02\.yaml: assertVisible[\s\S]*Element niewidoczny[\s\S]*#licznik-wartosc/);
    await expect(r.krok({ dotknij: 'x' }, '/k/02.yaml', {})).rejects.toThrow(/nieznane interpreterowi/);
    await r.krok({ tapOn: { id: 'wpisz-wartosc-pole' } }, '/k/02.yaml', {});
    await expect(r.krok('hideKeyboard', '/k/02.yaml', {})).rejects.toThrow(/Couldn't hide the keyboard/);
    await expect(r.krok({ tapOn: { leftOf: 'x' } }, '/k/02.yaml', {})).rejects.toThrow(/nieobsługiwany klucz selektora „leftOf”/);
  });
});

describe('adapter drzewa dostępności (elementyZDrzewa) — dla roli 08', () => {
  const w = (type: string, props: Record<string, unknown>, children: (Wezel | string)[] = [], parent: Wezel | null = null): Wezel => { const n: Wezel = { type, props, children, parent }; for (const c of children) if (typeof c !== 'string') c.parent = n; return n; };
  test('etykieta dostępności zastępuje tekst dzieci; Text bez dostępnego przodka; pole: wartość bez placeholdera; ukryte gałęzie pominięte', () => {
    const tekstPlus = w('Text', {}, ['+1 row']);
    const plus = w('View', { accessible: true, accessibilityLabel: '+1 row, when row 48 is done', testID: 'licznik-plus' }, [tekstPlus]);
    const liczba = w('Text', { testID: 'licznik-wartosc' }, ['47']);
    const pole = w('TextInput', { testID: 'wpisz-wartosc-pole', value: '', placeholder: 'Enter the row number', accessibilityLabel: 'Rows already finished', keyboardType: 'number-pad' });
    const kreski = w('View', { 'aria-hidden': true }, [w('Text', {}, ['IIII'])]);
    const nodes = [plus, tekstPlus, liczba, pole, kreski, ...(kreski.children as Wezel[])];
    expect(elementyZDrzewa(nodes)).toEqual([
      { id: 'licznik-plus', teksty: ['+1 row, when row 48 is done'], zaznaczony: false, wybrany: false, wlaczony: true, klawiatura: undefined, pole: false },
      { id: 'licznik-wartosc', teksty: ['47'], zaznaczony: false, wybrany: false, wlaczony: true, klawiatura: undefined, pole: false },
      { id: 'wpisz-wartosc-pole', teksty: ['Rows already finished'], zaznaczony: false, wybrany: false, wlaczony: true, klawiatura: 'number-pad', pole: true },
    ]);
  });
});
