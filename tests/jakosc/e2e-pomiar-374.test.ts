/* P-374 · scenariusze pod pomiar przed przebiegiem 4 (07). Dwie sprawy:
 *  (1) scen. 08: `import-gotowy` leży pod „Delete all data” (ADR-0029; wynik w `wynikDanych` na dole Ustawień, poprawki-e2-137-r.md „Otwarte” 1) — przed asercją trzeba przewinąć,
 *      jak w E2-136-S3 dla eksportu; samo czekanie na element poza ekranem mogło być przyczyną braku „import-gotowy” w #137 (hipoteza, [DO USTALENIA] do przebiegu 4);
 *  (2) panele pomiaru z 08 (R: `e2e-pomiar-operacji`; P: `e2e-pomiar-ladowania`, `*-ladowanie`, `*-blad`) czytane po kroku krytycznym: zrzut + odczyt OPCJONALNY,
 *      żeby po przebiegu 4 klasyfikacja „maszyna / aplikacja” była liczbą ze zrzutu, a nie nowym źródłem czerwieni bramki (P-367). Opcja 1 z 1206f70 zostaje. */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, Runner, wczytaj } from './maestro-runner';
import type { Element, EkranTestowy } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
const README = fs.readFileSync(path.join(__dirname, '..', '..', 'e2e/README.md'), 'utf8');
type Krok = { nazwa: string; arg: any };
const lista = (plik: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik)).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const id = typeof k.arg === 'object' && k.arg ? (k.arg.id ?? k.arg.element?.id ?? k.arg.visible?.id ?? k.arg.when?.visible?.id ?? k.arg.when?.notVisible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};
const jest = (k: Krok, nazwa: string, id: string) => k.nazwa === nazwa && idy(k).join('|') === id;
const SCEN_08 = '08-br-dan-006-s1-eksport-import.yaml';
const SCEN_17 = '17-br-prj-003-s1-zdjecie-etykiety.yaml';
const PODFLOW = 'subflows/dodaj-czesc-cel.yaml';

describe('P-374 · scen. 08: import-gotowy poza ekranem (pod „Delete all data”)', () => {
  const l = lista(SCEN_08);
  const stuknieciaImportu = l.map((k, i) => (jest(k, 'tapOn', 'e2e-pliki-importuj-ostatni') ? i : -1)).filter((i) => i >= 0);
  test('są dwa importy w scenariuszu (pierwszy po usunięciu danych, drugi idempotentny)', () => {
    expect(stuknieciaImportu).toHaveLength(2);
  });
  test.each([0, 1])('import %i: po stuknięciu przewinięcie do import-gotowy (opcjonalne ≤ 20 s), zrzut opoznienie-* i twarde przewinięcie ≥ 60 s dopiero gdy brak, twarda asercja', (n) => {
    const i = stuknieciaImportu[n];
    const nast = l.slice(i + 1, i + 8);
    const przewin = nast.findIndex((k) => jest(k, 'scrollUntilVisible', 'import-gotowy') && k.arg.optional === true && Number(k.arg.timeout) <= 20000 && String(k.arg.direction ?? 'DOWN').toUpperCase() === 'DOWN');
    expect(przewin).toBeGreaterThan(-1);
    const po = nast.slice(przewin + 1);
    const wr = po.findIndex((k) => k.nazwa === 'runFlow' && idy(k).join('|') === 'import-gotowy');
    expect(wr).toBeGreaterThan(-1);
    const wew = po.slice(wr + 1, wr + 4);
    expect(wew.some((k) => k.nazwa === 'takeScreenshot' && /^opoznienie-import-gotowy/.test(String(k.arg)))).toBe(true);
    expect(wew.some((k) => jest(k, 'scrollUntilVisible', 'import-gotowy') && !k.arg.optional && Number(k.arg.timeout) >= 60000)).toBe(true);
    expect(po.slice(wr + 1, wr + 8).some((k) => jest(k, 'assertVisible', 'import-gotowy') && !k.arg.optional)).toBe(true);
  });
  test.each([0, 1])('import %i: po twardej asercji zrzut pomiar-import-* i odczyt opcjonalny e2e-pomiar-operacji z „import N ms”', (n) => {
    const i = stuknieciaImportu[n];
    const a = l.findIndex((k, j) => j > i && jest(k, 'assertVisible', 'import-gotowy') && !k.arg.optional);
    expect(a).toBeGreaterThan(-1);
    const nast = l.slice(a + 1, a + 6);
    const p = nast.findIndex((k) => jest(k, 'scrollUntilVisible', 'e2e-pomiar-operacji') && k.arg.optional === true && String(k.arg.direction).toUpperCase() === 'UP');
    const z = nast.findIndex((k) => k.nazwa === 'takeScreenshot' && /^pomiar-import/.test(String(k.arg)));
    const o = nast.findIndex((k) => jest(k, 'assertVisible', 'e2e-pomiar-operacji') && k.arg.optional === true && /import/.test(String(k.arg.text)));
    expect(p).toBeGreaterThan(-1);
    expect(z).toBeGreaterThan(p);
    expect(o).toBeGreaterThan(z);
  });
});

describe('P-374 · scen. 17: odczyt panelu operacji po dodaniu zdjęcia', () => {
  const l = lista(SCEN_17);
  test('w ścieżce opóźnienia: odczyt opcjonalny e2e-pomiar-operacji (recode / photo / project albo running)', () => {
    const wr = l.findIndex((k) => k.nazwa === 'runFlow' && idy(k).join('|') === 'zdjecia-miniatura');
    expect(wr).toBeGreaterThan(-1);
    const wew = l.slice(wr + 1, wr + 6);
    const z = wew.findIndex((k) => k.nazwa === 'takeScreenshot' && /^opoznienie-/.test(String(k.arg)));
    expect(z).toBeGreaterThan(-1);
    expect(wew.slice(z + 1).some((k) => jest(k, 'assertVisible', 'e2e-pomiar-operacji') && k.arg.optional === true)).toBe(true);
  });
  test('po twardej asercji miniatury: zrzut pomiar-zdjecie i odczyt opcjonalny „photo N ms”', () => {
    const a = l.findIndex((k) => jest(k, 'assertVisible', 'zdjecia-miniatura') && !k.arg.optional);
    expect(a).toBeGreaterThan(-1);
    const nast = l.slice(a + 1, a + 5);
    const z = nast.findIndex((k) => k.nazwa === 'takeScreenshot' && /^pomiar-zdjecie/.test(String(k.arg)));
    const o = nast.findIndex((k) => jest(k, 'assertVisible', 'e2e-pomiar-operacji') && k.arg.optional === true && /photo/.test(String(k.arg.text)));
    expect(z).toBeGreaterThan(-1);
    expect(o).toBeGreaterThan(-1);
  });
});

describe('P-374 · wejście na ekran projektu (podprzepływ dodaj-czesc-cel: 34, 35) i okno ofert (07)', () => {
  test('ekran projektu: zrzut pomiar-ekran-projektu i odczyt opcjonalny „first data N ms” po twardej asercji projekt-dodaj', () => {
    const l = lista(PODFLOW);
    const a = l.findIndex((k) => jest(k, 'assertVisible', 'projekt-dodaj') && !k.arg.optional);
    expect(a).toBeGreaterThan(-1);
    const nast = l.slice(a + 1, a + 4);
    expect(nast.some((k) => k.nazwa === 'takeScreenshot' && /^pomiar-ekran-projektu/.test(String(k.arg)))).toBe(true);
    expect(nast.some((k) => jest(k, 'assertVisible', 'e2e-pomiar-ladowania') && k.arg.optional === true && /first data/.test(String(k.arg.text)))).toBe(true);
  });
  test.each([
    [PODFLOW, 'projekt-dodaj', ['projekt-ladowanie', 'projekt-blad']],
    ['07-p-089-3a-uczciwe-zasady.yaml', 'projekty-lista', ['projekty-ladowanie', 'projekty-blad']],
  ])('%s: ścieżka opóźnienia %s po zrzucie czyta opcjonalnie stan ładowania i błędu (aplikacja czeka na dane / bez testID = prezentacja)', (p, id, stany) => {
    const l = lista(p);
    const wr = l.findIndex((k) => k.nazwa === 'runFlow' && idy(k).join('|') === id);
    expect(wr).toBeGreaterThan(-1);
    const wew = l.slice(wr + 1, wr + 8);
    const z = wew.findIndex((k) => k.nazwa === 'takeScreenshot' && /^opoznienie-/.test(String(k.arg)));
    expect(z).toBeGreaterThan(-1);
    for (const s of stany) expect(wew.slice(z + 1).some((k) => jest(k, 'assertVisible', s) && k.arg.optional === true)).toBe(true);
    // czekanie do 60 s zostaje (1206f70)
    expect(wew.slice(z + 1).some((k) => k.nazwa === 'extendedWaitUntil' && !k.arg.optional && Number(k.arg.timeout) >= 60000 && idy(k).join('|') === id)).toBe(true);
  });
});

describe('P-374 · pomiar nie jest źródłem czerwieni (P-367): każdy krok na panelu pomiaru jest opcjonalny', () => {
  const PANELE = /^(e2e-pomiar-.*|projekty?-(ladowanie|blad|ponow))$/;
  const pliki = [...fs.readdirSync(KAT).filter((f) => f.endsWith('.yaml') && f !== 'config.yaml'), ...fs.readdirSync(path.join(KAT, 'subflows')).map((f) => `subflows/${f}`)];
  test('żaden twardy assertVisible / extendedWaitUntil / tapOn na e2e-pomiar-* ani *-ladowanie / *-blad / *-ponow; e2e-pomiar-plus (NFR-WYD-001) poza regułą', () => {
    const twarde: string[] = [];
    for (const p of pliki) for (const k of lista(p)) {
      if (!['assertVisible', 'assertNotVisible', 'extendedWaitUntil', 'tapOn', 'scrollUntilVisible'].includes(k.nazwa)) continue;
      if (idy(k).some((x) => PANELE.test(x) && x !== 'e2e-pomiar-plus') && !k.arg.optional) twarde.push(`${p}: ${k.nazwa} ${JSON.stringify(k.arg)}`);
    }
    expect(twarde).toEqual([]);
  });
  test('regułę łamie twardy krok (pułapka: wzorzec rozpoznaje panel)', () => {
    expect(PANELE.test('e2e-pomiar-operacji') && PANELE.test('e2e-pomiar-ladowania') && PANELE.test('projekty-blad') && PANELE.test('projekt-ladowanie')).toBe(true);
    expect(PANELE.test('projekty-lista') || PANELE.test('projekt-dodaj')).toBe(false);
  });
  test.each(['e2e-pomiar-operacji', 'e2e-pomiar-ladowania', 'projekty-ladowanie', 'projekty-blad', 'projekty-ponow', 'projekt-ladowanie', 'projekt-blad', 'projekt-ponow'])('e2e/README.md: wiersz testID „%s”', (id) => {
    expect(README).toContain(`| \`${id}\` |`);
  });
});

describe('P-374 · interpreter: optional na assertVisible, assertNotVisible i scrollUntilVisible (Maestro: YamlScrollUntilVisible.optional, selektor.optional)', () => {
  class PustyEkran implements EkranTestowy {
    przewiniecia: string[] = [];
    elementy(): Element[] { return [{ id: 'jest', teksty: ['Jest'] }]; }
    async uruchom() {} async zatrzymaj() {} async tlo() {} async stuknij() {} async wpisz() {} async usunZnaki() {} async enter() {} async przesun() {}
    async przewin(k: string) { this.przewiniecia.push(k); }
    async orientacja() {} async odczekaj() {}
  }
  test('brak elementu: wersja twarda rzuca, opcjonalna przechodzi; element obecny nie wymaga przewijania', async () => {
    const r = new Runner('x', new PustyEkran());
    await expect(r.krok({ assertVisible: { id: 'nie-ma' } }, '/k/a.yaml', {})).rejects.toThrow(/Element niewidoczny/);
    await expect(r.krok({ assertVisible: { id: 'nie-ma', optional: true } }, '/k/a.yaml', {})).resolves.toBeUndefined();
    await expect(r.krok({ assertNotVisible: { id: 'jest' } }, '/k/a.yaml', {})).rejects.toThrow(/Element widoczny/);
    await expect(r.krok({ assertNotVisible: { id: 'jest', optional: true } }, '/k/a.yaml', {})).resolves.toBeUndefined();
    await expect(r.krok({ scrollUntilVisible: { element: { id: 'nie-ma' }, direction: 'UP', timeout: 1000 } }, '/k/a.yaml', {})).rejects.toThrow(/po przewinięciu/);
    const ekran = new PustyEkran(); const r2 = new Runner('x', ekran);
    await expect(r2.krok({ scrollUntilVisible: { element: { id: 'nie-ma' }, direction: 'UP', timeout: 1000, optional: true } }, '/k/a.yaml', {})).resolves.toBeUndefined();
    expect(ekran.przewiniecia.length).toBeGreaterThan(0);
    expect(new Set(ekran.przewiniecia)).toEqual(new Set(['UP']));
    const e3 = new PustyEkran();
    await new Runner('x', e3).krok({ scrollUntilVisible: { element: { id: 'jest' }, timeout: 1000 } }, '/k/a.yaml', {});
    expect(e3.przewiniecia).toEqual([]);
  });
});
