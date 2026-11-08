/*
 * Interpreter scenariuszy Maestro (e2e/scenariusze/*.yaml) dla Jest — port tests/maestro-runner.ts Treningu @928d0ff (docs/jakosc/e0/trening-wzorzec.md §4).
 * Po co (Trening L-006, docs/40-lekcje.md:295): nieaktualny selektor, tekst albo kolejność kroków wychodzi lokalnie w Jest, zanim scenariusz trafi
 * na symulator (przebieg macOS ok. 40 min pokazuje tylko PIERWSZY nieaktualny krok).
 *
 * Dwie części:
 *  1. Kontrola statyczna (główny zestaw, tests/jakosc/maestro-scenariusze.test.ts): składnia, znane polecenia i klucze selektorów, asercja po każdej akcji
 *     zmieniającej stan (strategia §3, zasada 8), brak hideKeyboard po polu liczbowym (Trening docs/38:112), reguły P-091 (9a) dla asercji wartości licznika,
 *     każdy testID opisany w e2e/README.md.
 *  2. Wykonanie kroków (`Runner`) na abstrakcyjnym ekranie `EkranTestowy`. Rola 08 podłącza go do drzewa dostępności ekranów (RNTL, jest-expo/ios)
 *     w tests/akceptacja/ekrany/ (adapter: `elementyZDrzewa` + renderowanie aplikacji z portami-atrapami). Uproszczenia jak w Treningu (nazwane):
 *     „widoczny” = w drzewie dostępności i nie ukryty (bez modelu układu i przewijania — Trening tests/maestro-layout.ts przyjdzie z 08, gdy będą ekrany);
 *     dopasowanie tekstu jak Maestro (Filters.textMatches): wyrażenie regularne do CAŁEGO tekstu, bez wielkości liter, DOT_MATCHES_ALL, albo równość dosłowna;
 *     klawiatura nie jest modelowana poza zakazem hideKeyboard na polu liczbowym (Trening docs/40-lekcje.md:262 — Jest tego nie łapie, łapie symulator).
 * Polecenie albo klucz selektora, których interpreter nie zna, to błąd (Trening E2E 91: nieobsłużony `leftOf` przechodził po cichu).
 */
import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
/* `yaml` 2.9.1 (devDependency): preset jest-expo/ios rozwiązuje warunek „default” (wersja ESM dla przeglądarki), więc wprost wersja CommonJS dla Node. */
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const YAML: typeof import('yaml') = require(join(__dirname, '..', '..', 'node_modules', 'yaml', 'dist', 'index.js'));

/* ------------------------------------------------------------------ słownik poleceń ------------------------------------------------------------------ */

/** Polecenia znane interpreterowi (i używane w scenariuszach Oczka). */
export const ZNANE_POLECENIA = new Set([
  'launchApp', 'stopApp', 'tapOn', 'doubleTapOn', 'longPressOn', 'inputText', 'eraseText', 'pressKey', 'hideKeyboard', 'swipe', 'scrollUntilVisible',
  'setOrientation', 'assertVisible', 'assertNotVisible', 'extendedWaitUntil', 'assertTrue', 'copyTextFrom', 'evalScript', 'retry', 'runFlow', 'repeat',
  'takeScreenshot', 'waitForAnimationToEnd',
]);
/** Klucze selektora / opcji kroku — inny klucz to błąd. */
export const KLUCZE_SELEKTORA = new Set(['text', 'id', 'index', 'below', 'above', 'checked', 'selected', 'enabled', 'optional', 'repeat', 'delay', 'element', 'visible', 'notVisible',
  'timeout', 'direction', 'centerElement', 'speed', 'visibilityPercentage', 'start', 'end', 'duration', 'from', 'label', 'retryTapIfNoChange', 'waitToSettleTimeoutMs']);
/** Akcje zmieniające stan aplikacji: po każdej (z wyjątkiem łańcuchów wpisu niżej) musi przyjść asercja (strategia §3 zasada 8). */
export const ZMIENIAJACE = new Set(['launchApp', 'stopApp', 'tapOn', 'doubleTapOn', 'longPressOn', 'inputText', 'eraseText', 'pressKey', 'hideKeyboard', 'swipe', 'setOrientation']);
export const ASERCJE = new Set(['assertVisible', 'assertNotVisible', 'extendedWaitUntil', 'assertTrue']);
/** Kroki przezroczyste dla reguły asercji (nie zmieniają stanu aplikacji ani niczego nie sprawdzają). */
export const PRZEZROCZYSTE = new Set(['waitForAnimationToEnd', 'takeScreenshot', 'copyTextFrom', 'evalScript', 'scrollUntilVisible']);
/** Dozwolone łańcuchy bez asercji pomiędzy: fokus pola → wpis, usunięcie → wpis, wpis po znaku, zabicie → start, tło → powrót. */
const LANCUCHY: Record<string, string[]> = { tapOn: ['eraseText', 'inputText'], doubleTapOn: ['eraseText', 'inputText'], eraseText: ['inputText'], inputText: ['inputText'], stopApp: ['launchApp'], pressKey: ['launchApp'] };

/** testID elementów, których stuknięcie zmienia wartość licznika (P-091 9a: scenariusz z asercją wartości nie jest ponawiany). */
// 07-e2e (ZM-18, 2026-11-08): „+1” karty na „Dziś” (`dzis-plus`) to to samo zdarzenie co +1 licznika (NFR-PIE-001, ER-68) — ta sama reguła P-091 (9a).
export const ID_ZMIANY_LICZNIKA = ['licznik-plus', 'licznik-minus', 'baner-serii-cofnij', 'dzis-plus'];
/** Teksty (etykiety VoiceOver z design-spec), których stuknięcie zmienia wartość licznika. */
export const TEKST_ZMIANY_LICZNIKA = [/^\\?\+1 row/, /^−1 row/, /^Undo \d+ rows?$/];
export const ID_WARTOSCI = 'licznik-wartosc';
/** Wartość licznika na karcie „Dziś” (ZM-18): po `dzis-plus` pierwsza asercja to wartość karty albo licznika. */
export const ID_WARTOSCI_KARTY = 'dzis-wartosc';

export type Selektor = string | { [k: string]: unknown };
export type Polecenie = string | Record<string, unknown>;
export type Scenariusz = { plik: string; naglowek: { appId?: string; name?: string; tags?: string[] }; polecenia: Polecenie[] };

export function wczytaj(plik: string): Scenariusz {
  const docs = YAML.parseAllDocuments(readFileSync(plik, 'utf8')).map(d => { if (d.errors.length) throw new Error(`${plik}: ${d.errors[0].message}`); return d.toJS(); });
  const naglowek = docs.length > 1 ? (docs[0] ?? {}) : {};
  const polecenia = docs[docs.length - 1];
  if (!Array.isArray(polecenia)) throw new Error(`${plik}: ostatni dokument YAML nie jest listą poleceń`);
  return { plik, naglowek, polecenia };
}

export const rozbierz = (p: Polecenie): [string, any] => typeof p === 'string' ? [p, undefined] : (Object.entries(p)[0] as [string, any]);
/** Polecenia zagnieżdżone (retry, repeat, runFlow z commands) — z flagą, czy są w retry. */
export function* kroki(lista: Polecenie[], wRetry = false): Generator<{ nazwa: string; arg: any; wRetry: boolean; lista: Polecenie[]; i: number }> {
  for (let i = 0; i < lista.length; i++) {
    const [nazwa, arg] = rozbierz(lista[i]); yield { nazwa, arg, wRetry, lista, i };
    if ((nazwa === 'retry' || nazwa === 'repeat' || nazwa === 'runFlow') && Array.isArray(arg?.commands)) yield* kroki(arg.commands, wRetry || nazwa === 'retry');
  }
}
/** Ścieżki podprzepływów runFlow (względem pliku wołającego, jak w Maestro). */
export function podprzeplywy(s: Scenariusz): string[] {
  const out: string[] = [];
  for (const k of kroki(s.polecenia)) if (k.nazwa === 'runFlow') { const f = typeof k.arg === 'string' ? k.arg : k.arg?.file; if (f) out.push(resolve(dirname(s.plik), f)); }
  return out;
}
/** Wszystkie selektory kroku (tapOn: sel, assertVisible: sel, extendedWaitUntil: {visible: sel}, scrollUntilVisible: {element: sel}, swipe: {from: sel}, copyTextFrom, kotwice below/above). */
export function selektory(nazwa: string, arg: any): Selektor[] {
  const zKotwic = (s: Selektor): Selektor[] => typeof s === 'object' && s ? [s, ...['below', 'above'].flatMap(k => s[k] != null ? zKotwic(s[k] as Selektor) : [])] : [s];
  if (['tapOn', 'doubleTapOn', 'longPressOn', 'assertVisible', 'assertNotVisible', 'copyTextFrom'].includes(nazwa) && arg != null) return zKotwic(arg);
  if (nazwa === 'extendedWaitUntil') return [arg?.visible, arg?.notVisible].filter(x => x != null).flatMap(zKotwic);
  if (nazwa === 'scrollUntilVisible') return arg?.element != null ? zKotwic(arg.element) : [];
  if (nazwa === 'swipe') return arg?.from != null ? zKotwic(arg.from) : [];
  if (nazwa === 'runFlow') return [arg?.when?.visible, arg?.when?.notVisible].filter(x => x != null).flatMap(zKotwic);
  return [];
}
/** testID użyte w scenariuszu (alternatywa `a|b` rozbita na pojedyncze id). */
export function identyfikatory(s: Scenariusz): string[] {
  const ids = new Set<string>();
  for (const k of kroki(s.polecenia)) for (const sel of selektory(k.nazwa, k.arg)) if (typeof sel === 'object' && typeof sel.id === 'string') for (const p of sel.id.split('|')) ids.add(p);
  return [...ids].sort();
}

/* ------------------------------------------------------------------ kontrola statyczna ------------------------------------------------------------------ */

export function problemySkladni(s: Scenariusz): string[] {
  const out: string[] = [];
  if (!s.naglowek.appId) out.push(`${s.plik}: brak appId w nagłówku`);
  for (const k of kroki(s.polecenia)) {
    if (!ZNANE_POLECENIA.has(k.nazwa)) { out.push(`${s.plik}: nieznane polecenie „${k.nazwa}”`); continue; }
    for (const sel of selektory(k.nazwa, k.arg)) if (typeof sel === 'object' && sel) for (const kl of Object.keys(sel)) if (!KLUCZE_SELEKTORA.has(kl)) out.push(`${s.plik}: ${k.nazwa}: nieznany klucz selektora „${kl}”`);
    if (k.nazwa !== 'runFlow' && k.arg && typeof k.arg === 'object' && !Array.isArray(k.arg)) for (const kl of Object.keys(k.arg)) if (!KLUCZE_SELEKTORA.has(kl) && !['clearState', 'arguments', 'permissions', 'stopApp', 'clearKeychain', 'maxRetries', 'commands', 'times', 'while'].includes(kl)) out.push(`${s.plik}: ${k.nazwa}: nieznana opcja „${kl}”`);
    for (const sel of selektory(k.nazwa, k.arg)) if (typeof sel === 'object' && typeof sel.id === 'string') for (const id of sel.id.split('|')) if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) out.push(`${s.plik}: id „${id}” poza alfabetem [a-z0-9-] (selektor id to wyrażenie regularne — Trening maestro-selectors.test.ts:9)`);
  }
  return out;
}

const nastepny = (lista: Polecenie[], i: number) => { for (let j = i + 1; j < lista.length; j++) { const [n] = rozbierz(lista[j]); if (!PRZEZROCZYSTE.has(n)) return { n, arg: rozbierz(lista[j])[1], j }; } return null; };

/** Strategia §3 zasada 8: po każdej akcji zmieniającej stan — asercja (przed następną akcją i przed końcem listy kroków). */
export function problemyAsercji(s: Scenariusz): string[] {
  const out: string[] = [];
  const sprawdz = (lista: Polecenie[]) => lista.forEach((p, i) => {
    const [n, arg] = rozbierz(p);
    if ((n === 'retry' || n === 'repeat' || n === 'runFlow') && Array.isArray(arg?.commands)) sprawdz(arg.commands);
    if (!ZMIENIAJACE.has(n)) return;
    const nx = nastepny(lista, i);
    if (nx && (LANCUCHY[n] ?? []).includes(nx.n) && (n !== 'pressKey' || /^home$/i.test(String(arg)))) return;
    if (!nx || !ASERCJE.has(nx.n)) out.push(`${s.plik}: po „${n} ${JSON.stringify(arg) ?? ''}” brak asercji (następny krok: ${nx ? nx.n : 'koniec listy'})`);
  });
  sprawdz(s.polecenia);
  return out;
}

/** Trening docs/38:112 i L-013: hideKeyboard zakazany po polu klawiatury liczbowej (iOS nie ma akcji „schowaj”). `liczbowe` = id pól z e2e/README.md. */
export function problemyKlawiatury(s: Scenariusz, liczbowe: Set<string>): string[] {
  const out: string[] = []; let pole: string | null = null;
  for (const k of kroki(s.polecenia)) {
    if (k.nazwa === 'tapOn' || k.nazwa === 'doubleTapOn') { const sel = k.arg; pole = typeof sel === 'object' && typeof sel?.id === 'string' ? sel.id : null; }
    if (k.nazwa === 'hideKeyboard' && pole && liczbowe.has(pole)) out.push(`${s.plik}: hideKeyboard po polu liczbowym „${pole}” — klawiatura numeryczna iOS nie ma akcji schowania (zapis przyciskiem arkusza)`);
  }
  return out;
}

const zmieniaLicznik = (nazwa: string, arg: any) => {
  if (!['tapOn', 'doubleTapOn', 'longPressOn'].includes(nazwa) || arg == null) return false;
  if (typeof arg === 'string') return TEKST_ZMIANY_LICZNIKA.some(r => r.test(arg));
  if (typeof arg.id === 'string') return ID_ZMIANY_LICZNIKA.includes(arg.id);
  return typeof arg.text === 'string' && TEKST_ZMIANY_LICZNIKA.some(r => r.test(arg.text));
};
const asercjaWartosci = (nazwa: string, arg: any) => nazwa === 'assertVisible' && typeof arg === 'object' && (arg?.id === ID_WARTOSCI || arg?.id === ID_WARTOSCI_KARTY) && typeof arg.text === 'string';

/** Czy scenariusz (z podprzepływami) sprawdza wartość licznika — wtedy musi mieć tag `stan-licznika` (P-091 9a: bez ponowień). */
export function sprawdzaWartoscLicznika(s: Scenariusz, wczytajPlik: (p: string) => Scenariusz = wczytaj, stos: string[] = []): boolean {
  if (stos.includes(s.plik)) throw new Error(`Cykl runFlow: ${[...stos, s.plik].join(' → ')}`);
  for (const k of kroki(s.polecenia)) if (asercjaWartosci(k.nazwa, k.arg)) return true;
  return podprzeplywy(s).some(p => sprawdzaWartoscLicznika(wczytajPlik(p), wczytajPlik, [...stos, s.plik]));
}

/** P-091 (9a) i NFR-DAN-002: po stuknięciu zmieniającym licznik pierwsza asercja to wartość licznika; w retry nie ma stuknięć zmieniających licznik
 * (ponowienie bloku dodałoby rząd drugi raz). */
export function problemyLicznika(s: Scenariusz): string[] {
  const out: string[] = [];
  for (const k of kroki(s.polecenia)) {
    if (!zmieniaLicznik(k.nazwa, k.arg)) continue;
    if (k.wRetry) out.push(`${s.plik}: stuknięcie zmieniające licznik („${JSON.stringify(k.arg)}”) w bloku retry — ponowienie zmieniłoby wartość drugi raz`);
    const nx = nastepny(k.lista, k.i);
    if (!nx || !asercjaWartosci(nx.n, nx.arg)) out.push(`${s.plik}: po „${k.nazwa} ${JSON.stringify(k.arg)}” pierwsza asercja nie sprawdza wartości licznika (assertVisible { id: "${ID_WARTOSCI}", text })`);
  }
  return out;
}

/** e2e/README.md: wiersze tabeli `| \`id\` | ekran | element | tekst / etykieta | klawiatura |`. */
export function opisyIdentyfikatorow(readme: string): Map<string, { klawiatura: string }> {
  const m = new Map<string, { klawiatura: string }>();
  for (const w of readme.split('\n')) { const r = /^\|\s*`([a-z0-9-]+)`\s*\|(.*)\|\s*$/.exec(w); if (r) { const kol = r[2].split('|').map(x => x.trim()); m.set(r[1], { klawiatura: kol[kol.length - 1] ?? '' }); } }
  return m;
}

/* ------------------------------------------------------------------ wykonanie kroków ------------------------------------------------------------------ */

/** Maestro (Filters.textMatches, Orchestra REGEX_OPTIONS: IGNORE_CASE, DOT_MATCHES_ALL, MULTILINE): wyrażenie do CAŁEGO tekstu albo równość dosłowna;
 * zły wzorzec — dosłownie (toRegexSafe). Kotwice (?<![\s\S]) / (?![\s\S]) = początek i koniec całego tekstu (Trening run 37900617167). */
export const pasuje = (wzorzec: string) => {
  let r: RegExp;
  try { r = new RegExp(`(?<![\\s\\S])(?:${wzorzec})(?![\\s\\S])`, 'ism'); } catch { r = new RegExp(`(?<![\\s\\S])${wzorzec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\s\\S])`, 'ism'); }
  return (t: string) => [t, t.replace(/\n/g, ' ')].some(v => v === wzorzec || r.test(v));
};

/** Element drzewa dostępności tak, jak widzi go Maestro na iOS. */
export type Element = { id?: string; teksty: string[]; zaznaczony?: boolean; wybrany?: boolean; wlaczony?: boolean; klawiatura?: string; pole?: boolean };
/** Ekran pod scenariuszem — implementuje rola 08 (adapter RNTL nad aplikacją z portami-atrapami) albo test (atrapa). */
export interface EkranTestowy {
  elementy(): Element[];
  uruchom(o: { wyczyscStan: boolean; argumenty: Record<string, string>; powrot: boolean }): Promise<void>;
  zatrzymaj(): Promise<void>;
  tlo(): Promise<void>;
  stuknij(e: Element, o: { podwojnie?: boolean; dlugo?: boolean }): Promise<void>;
  wpisz(tekst: string): Promise<void>;
  usunZnaki(n: number): Promise<void>;
  enter(): Promise<void>;
  przesun(start: { x: number; y: number }, koniec: { x: number; y: number }, ms: number): Promise<void>;
  przewin(kierunek: string): Promise<void>;
  orientacja(o: string): Promise<void>;
  odczekaj(ms: number): Promise<void>;
  zrzut?(nazwa: string): void;
}

/** Wyrażenia `${…}` Maestro (JS z dostępem do env, output, maestro.copiedText). */
export function wyrazenie(src: string, ctx: { env: Record<string, string>; output: Record<string, unknown>; maestro: { copiedText?: string } }): unknown {
  // eslint-disable-next-line no-new-func
  return new Function('ctx', `with (ctx.env) { with (ctx) { return (${src}); } }`)(ctx);
}
export function podstaw(v: unknown, ctx: Parameters<typeof wyrazenie>[1]): any {
  if (typeof v === 'string') { const cale = /^\$\{([\s\S]*)\}$/.exec(v); if (cale) { const w = wyrazenie(cale[1], ctx); return typeof w === 'number' ? String(w) : w; } return v.replace(/\$\{([^}]*)\}/g, (_, e) => String(wyrazenie(e, ctx))); }
  if (Array.isArray(v)) return v.map(x => podstaw(x, ctx));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'commands' ? x : podstaw(x, ctx)]));
  return v;
}

export class BladKroku extends Error {}

export class Runner {
  log: string[] = []; ponowienia: string[] = []; zrzuty: string[] = [];
  output: Record<string, unknown> = {}; maestro: { copiedText?: string } = {};
  fokus: Element | null = null;
  constructor(public nazwa: string, public ekran: EkranTestowy) {}

  znajdz(sel: Selektor): Element[] {
    const s = typeof sel === 'string' ? { text: sel } : sel;
    for (const k of Object.keys(s)) if (!KLUCZE_SELEKTORA.has(k)) throw new BladKroku(`[${this.nazwa}] nieobsługiwany klucz selektora „${k}”`);
    const lista = this.ekran.elementy();
    let hit = lista.filter(e => (s.text == null || e.teksty.some(pasuje(String(s.text)))) && (s.id == null || (e.id != null && pasuje(String(s.id))(e.id))));
    if (s.checked != null) hit = hit.filter(e => !!e.zaznaczony === s.checked);
    if (s.selected != null) hit = hit.filter(e => !!e.wybrany === s.selected);
    if (s.enabled != null) hit = hit.filter(e => (e.wlaczony ?? true) === s.enabled);
    const poz = (e: Element) => lista.indexOf(e);
    if (s.below != null) { const a = this.znajdz(s.below as Selektor)[0]; hit = a ? hit.filter(e => poz(e) > poz(a)) : []; }
    if (s.above != null) { const a = this.znajdz(s.above as Selektor)[0]; hit = a ? hit.filter(e => poz(e) < poz(a)) : []; }
    if (s.index != null) hit = hit[Number(s.index)] ? [hit[Number(s.index)]] : [];
    return hit;
  }
  async czekaj(sel: Selektor, widoczny: boolean, ms: number): Promise<boolean> {
    for (let t = 0; t <= ms; t += 100) { if ((this.znajdz(sel).length > 0) === widoczny) return true; await this.ekran.odczekaj(100); }
    return false;
  }
  blad(krok: string, why: string): never {
    throw new BladKroku(`[${this.nazwa}] krok: ${krok}\n${why}\nNa ekranie:\n  ${this.ekran.elementy().map(e => e.teksty.join(' | ') + (e.id ? ` #${e.id}` : '')).join('\n  ')}`);
  }

  async uruchomPlik(plik: string, env: Record<string, string> = {}) { const s = wczytaj(plik); await this.wykonaj(s.polecenia, plik, env); }

  async wykonaj(polecenia: Polecenie[], plik: string, env: Record<string, string>) { for (const p of polecenia) await this.krok(p, plik, env); }

  async krok(surowy: Polecenie, plik: string, env: Record<string, string>) {
    const [nazwa, arg0] = rozbierz(surowy);
    const ctx = { env, output: this.output, maestro: this.maestro };
    const arg = nazwa === 'retry' || nazwa === 'repeat' || nazwa === 'evalScript' || nazwa === 'assertTrue' ? arg0 : podstaw(arg0, ctx);
    const krok = `${plik.split('/').slice(-2).join('/')}: ${nazwa} ${JSON.stringify(arg) ?? ''}`; this.log.push(krok);
    const sel = (a: any): Selektor => typeof a === 'string' ? a : (a.element ?? a.visible ?? a.notVisible ?? a);
    const opcjonalny = typeof arg === 'object' && arg?.optional === true;
    switch (nazwa) {
      case 'launchApp': await this.ekran.uruchom({ wyczyscStan: arg?.clearState === true, argumenty: Object.fromEntries(Object.entries(arg?.arguments ?? {}).map(([k, v]) => [k, String(v)])), powrot: arg?.stopApp === false }); this.fokus = null; break;
      case 'stopApp': await this.ekran.zatrzymaj(); this.fokus = null; break;
      case 'tapOn': case 'doubleTapOn': case 'longPressOn': {
        const powt = typeof arg === 'object' ? Number(arg.repeat ?? 1) : 1;
        for (let r = 0; r < powt; r++) {
          if (!(await this.czekaj(sel(arg), true, 3000))) { if (opcjonalny) return; this.blad(krok, 'Element niewidoczny — nie ma w co stuknąć.'); }
          const e = this.znajdz(sel(arg))[0]; this.fokus = e.pole ? e : null;
          await this.ekran.stuknij(e, { podwojnie: nazwa === 'doubleTapOn', dlugo: nazwa === 'longPressOn' });
          if (r < powt - 1) await this.ekran.odczekaj(Number(arg.delay ?? 100));
        }
        break;
      }
      case 'inputText': if (!this.fokus) this.blad(krok, 'Wpis bez pola z fokusem.'); await this.ekran.wpisz(String(arg)); break;
      case 'eraseText': if (!this.fokus) this.blad(krok, 'Usuwanie bez pola z fokusem.'); await this.ekran.usunZnaki(Number(arg ?? 50)); break;
      case 'pressKey': if (/^home$/i.test(String(arg))) { this.fokus = null; await this.ekran.tlo(); } else if (/^enter$/i.test(String(arg))) { await this.ekran.enter(); this.fokus = null; } else this.blad(krok, `Klawisz „${arg}” nieobsłużony.`); break;
      case 'hideKeyboard': { const kl = this.fokus?.klawiatura ?? ''; if (/number|decimal|phone|numeric|liczbowa/i.test(kl)) this.blad(krok, `Couldn't hide the keyboard (klawiatura „${kl}” nie ma akcji zamknięcia).`); this.fokus = null; break; }
      case 'swipe': {
        const pkt = (s: string) => { const m = /^\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*$/.exec(String(s)); if (!m) this.blad(krok, `swipe: punkt „${s}” — interpreter zna tylko procenty ekranu`); return { x: +m[1], y: +m[2] }; };
        await this.ekran.przesun(pkt(arg.start), pkt(arg.end), Number(arg.duration ?? 400)); break;
      }
      case 'scrollUntilVisible': {
        const ms = Number(arg.timeout ?? 20000);
        for (let t = 0; t <= ms; t += 500) { if (this.znajdz(sel(arg)).length) return; await this.ekran.przewin(String(arg.direction ?? 'DOWN')); await this.ekran.odczekaj(500); }
        if (!opcjonalny) this.blad(krok, 'Element nie pojawił się po przewinięciu.'); /* P-374: `optional: true` (Maestro: YamlScrollUntilVisible.optional) */
        break;
      }
      case 'setOrientation': await this.ekran.orientacja(String(arg)); break;
      case 'assertVisible': if (!(await this.czekaj(sel(arg), true, 1500)) && !opcjonalny) this.blad(krok, 'Element niewidoczny.'); break;
      case 'assertNotVisible': if (!(await this.czekaj(sel(arg), false, 1500)) && !opcjonalny) this.blad(krok, 'Element widoczny.'); break;
      case 'extendedWaitUntil': {
        const ok = arg.visible != null ? await this.czekaj(arg.visible, true, Number(arg.timeout ?? 10000)) : await this.czekaj(arg.notVisible, false, Number(arg.timeout ?? 10000));
        if (!ok && !opcjonalny) this.blad(krok, 'Warunek nie spełniony w limicie czasu.'); break;
      }
      case 'copyTextFrom': { const e = this.znajdz(sel(arg))[0]; if (!e) this.blad(krok, 'Brak elementu do skopiowania.'); this.maestro.copiedText = e.teksty[0] ?? ''; break; }
      case 'evalScript': try { const src = /^\$\{([\s\S]*)\}$/.exec(String(arg))?.[1] ?? String(arg); wyrazenie(src, ctx); } catch (e) { this.blad(krok, `Błąd wyrażenia: ${(e as Error).message}`); } break;
      case 'assertTrue': { const src = /^\$\{([\s\S]*)\}$/.exec(String(arg))?.[1] ?? String(arg); let v: unknown; try { v = wyrazenie(src, ctx); } catch (e) { this.blad(krok, `Błąd wyrażenia: ${(e as Error).message}`); } if (!v) this.blad(krok, 'Wyrażenie fałszywe.'); break; }
      case 'retry': {
        const max = Number(arg?.maxRetries ?? 1);
        for (let p = 0; ; p++) { try { await this.wykonaj(arg.commands, plik, env); break; } catch (e) { if (p >= max) throw e; this.ponowienia.push((e as Error).message.split('\n')[0]); } }
        break;
      }
      case 'repeat': { for (let r = 0; r < Number(arg?.times ?? 1); r++) await this.wykonaj(arg.commands, plik, env); break; }
      case 'runFlow': {
        const a = typeof arg === 'string' ? { file: arg } : arg;
        if (a.when) { const w = a.when; if (w.visible != null && !this.znajdz(w.visible).length) break; if (w.notVisible != null && this.znajdz(w.notVisible).length) break; }
        const env2 = { ...env, ...Object.fromEntries(Object.entries(a.env ?? {}).map(([k, v]) => [k, String(v)])) };
        if (a.file) { const p = resolve(dirname(plik), a.file); await this.wykonaj(wczytaj(p).polecenia, p, env2); } else await this.wykonaj(a.commands ?? [], plik, env2);
        break;
      }
      case 'takeScreenshot': this.zrzuty.push(String(arg)); this.ekran.zrzut?.(String(arg)); break;
      case 'waitForAnimationToEnd': await this.ekran.odczekaj(100); break;
      default: this.blad(krok, `Polecenie „${nazwa}” nieznane interpreterowi — dopisz je do tests/jakosc/maestro-runner.ts.`);
    }
  }
}

/* ------------------------------------------------------------------ adapter drzewa dostępności (dla 08) ------------------------------------------------------------------ */

/** Węzeł drzewa react-test-renderer (screen.UNSAFE_root w RNTL) — tylko pola, z których korzysta adapter. */
export type Wezel = { type: unknown; props: Record<string, any>; children?: (Wezel | string)[]; parent: Wezel | null };
const host = (n: Wezel) => typeof n.type === 'string';
const tekstWezla = (n: Wezel | string): string => typeof n === 'string' ? n : (n.children ?? []).map(tekstWezla).join('');
const ukryty = (n: Wezel) => { for (let p: Wezel | null = n; p; p = p.parent) if (host(p) && (p.props['aria-hidden'] === true || p.props.accessibilityElementsHidden === true || p.props.importantForAccessibility === 'no-hide-descendants')) return true; return false; };
const wDostepnym = (n: Wezel) => { for (let p = n.parent; p; p = p.parent) if (host(p) && (p.props.accessible === true || (typeof p.props.accessibilityLabel === 'string' && p.props.accessible !== false))) return true; return false; };

/** Elementy tak, jak Maestro czyta je z iOS (port Trening tests/maestro-runner.ts screenCands): etykieta dostępności zastępuje tekst; Text bez dostępnego
 * przodka; wartość pola (placeholder NIE jest tekstem, Trening E2E 38483827437); ukryte gałęzie (aria-hidden, ekrany pod stosem) pominięte.
 * `wszystkie` = lista hostów w kolejności drzewa (np. root.findAll(n => typeof n.type === 'string')). */
export function elementyZDrzewa(wszystkie: Wezel[]): Element[] {
  const out: Element[] = [];
  for (const n of wszystkie) {
    if (!host(n) || ukryty(n)) continue;
    const p = n.props; const teksty: string[] = []; const pole = n.type === 'TextInput' || n.type === 'RCTSinglelineTextInputView';
    if (pole) { if (p.value != null && p.value !== '') teksty.push(String(p.value)); if (typeof p.accessibilityLabel === 'string') teksty.push(p.accessibilityLabel); }
    else if (typeof p.accessibilityLabel === 'string' && p.accessibilityLabel !== '') { if (!wDostepnym(n)) teksty.push(p.accessibilityLabel); }
    else if (n.type === 'Text' && !wDostepnym(n)) { const t = tekstWezla(n); if (t) teksty.push(t); }
    else if (p.accessible === true) { const t = tekstWezla(n); if (t) teksty.push(t); }
    if (!teksty.length && !p.testID) continue;
    const st = p.accessibilityState ?? {};
    out.push({ id: p.testID, teksty, zaznaczony: st.checked === true || p.value === true, wybrany: st.selected === true, wlaczony: st.disabled !== true, klawiatura: pole ? String(p.keyboardType ?? 'default') : undefined, pole });
  }
  return out;
}
