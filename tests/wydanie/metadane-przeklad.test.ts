/*
 * Metadane sklepu dla wszystkich lokalizacji App Store Connect (P-501, rola 10): przekład opisów, tekstów promocyjnych i podtytułów przez API (Batch, jak P-474/P-486),
 * słowa kluczowe z danych wyszukiwarki i słów lokalnych (nie dosłownie), krytyk w świeżym kontekście, przyjęcie skryptem. Testy PRZED kodem; bez sieci (atrapa fetch).
 * Skrypty ESM wywoływane w procesie potomnym (`node --input-type=module -e`), jak tests/jakosc/przeklad-api.test.ts.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '../..');
const MOD = join(ROOT, 'scripts/i18n/przeklad-metadane.mjs');
const PRZYJMIJ = join(ROOT, 'scripts/i18n/przeklad-metadane-przyjmij.mjs');
const BADANIE = join(ROOT, 'scripts/wydanie/frazy-badanie.mjs');
const MET = 'docs/wydanie/metadane';
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8');
const json = (f: string) => JSON.parse(read(f)) as Record<string, any>;
const BEZ_KLUCZA: NodeJS.ProcessEnv = { ...process.env, ANTHROPIC_API_KEY: '' };

/** Uruchamia kod w module (import * as m) i zwraca JSON z ostatniej linii stdout. */
function run(modul: string, kod: string, env: NodeJS.ProcessEnv = {}) {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `import * as m from ${JSON.stringify(modul)}; ${kod}`], { encoding: 'utf8', env: { ...BEZ_KLUCZA, ...env }, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`proces: ${r.status}\n${r.stderr}\n${r.stdout.slice(-500)}`);
  return JSON.parse(r.stdout.trim().split('\n').at(-1)!);
}
const mod = (kod: string, env?: NodeJS.ProcessEnv) => run(MOD, kod, env);

const en = json(`${MET}/en.store.json`).apple.info['en-US'] as Record<string, any>;
const nazwy = json(`${MET}/nazwy.store.json`).apple.info as Record<string, { title: string }>;
const stale = json(`${MET}/slowa-aso.json`);
const STALE_KODY = ['pl', 'ja', 'no', 'de-DE', 'fr-FR'];
const WYMAGANE = Object.keys(nazwy).filter((k) => !k.startsWith('en-')); // 29 lokalizacji bez angielskich

/** Poprawna odpowiedź modelu zbudowana ze źródła en (atrapa tłumacza): marka zamiast „Oczko”, ta sama struktura i liczby. */
const marka = (loc: string) => nazwy[loc].title.split(':')[0].trim();
const odpowiedz = (loc: string) => {
  const b = marka(loc);
  const o: Record<string, unknown> = { promoText: en.promoText.replace(/Oczko/g, b), description: en.description.replace(/Oczko/g, b) };
  if (!STALE_KODY.includes(loc)) { o.subtitle = 'Podtytuł testowy'; o.slowa = ['jeden-testowy', 'drugi-testowy', 'trzeci-testowy', 'ab', 'jeden-testowy']; }
  return o;
};

describe('dane wejściowe: słowa i podtytuły pięciu lokalizacji z badania fraz (stałe)', () => {
  test('slowa-aso.json = tabela ASO w docs/wzrost.md (pl, ja, nb→no, de-DE, fr-FR); podtytuł ≤ 30 znaków, słowa ≤ 100 B, każde > 2 znaki', () => {
    expect(Object.keys(stale).filter((k) => !k.startsWith('_')).sort()).toEqual([...STALE_KODY].sort());
    const wzrost = read('docs/wzrost.md').split('\n').filter((l) => /^\| (pl|ja|nb|de-DE|fr-FR) \|/.test(l)).slice(0, 5);
    expect(wzrost).toHaveLength(5);
    for (const w of wzrost) {
      const c = w.split('|').map((x) => x.trim()); const kod = c[1] === 'nb' ? 'no' : c[1];
      expect(stale[kod].subtitle).toBe(c[3]); expect(stale[kod].keywords.join(',')).toBe(c[4]);
      expect(Buffer.byteLength(stale[kod].keywords.join(','))).toBe(Number(c[5]));
    }
    for (const k of STALE_KODY) {
      expect([...stale[k].subtitle].length).toBeLessThanOrEqual(30);
      expect(Buffer.byteLength(stale[k].keywords.join(','))).toBeLessThanOrEqual(100);
      for (const w of stale[k].keywords) expect([...w].length).toBeGreaterThan(2);
    }
  });
  test('29 lokalizacji do uzupełnienia = nazwy.store.json bez en-*; każda ma język aplikacji ze słownika terminów; bg, et, lt, lv, sr nie mają lokalizacji ASC', () => {
    const r = mod(`console.log(JSON.stringify({ l: m.LOKALIZACJE, j: m.JEZYK_APP }))`);
    expect(r.l).toEqual(WYMAGANE); expect(r.l).toHaveLength(29);
    const jezyki = json('docs/lokalizacja/slownik-terminow.json').jezyki as string[];
    for (const l of r.l) expect(jezyki).toContain(r.j[l]);
    expect(r.j.no).toBe('nb'); expect(r.j['es-MX']).toBe('es-419'); expect(r.j['de-DE']).toBe('de');
    expect(Object.values(r.j)).not.toEqual(expect.arrayContaining(['bg']));
    for (const k of ['bg', 'et', 'lt', 'lv', 'sr']) expect(Object.values(r.j)).not.toContain(k);
  });
});

describe('słowa kluczowe: pakowanie kandydatów (nie dosłowny przekład)', () => {
  test('w kolejności ważności do 100 B (UTF-8), bez powtórzeń, bez słów ≤ 2 znaków i bez słów z nazwy i podtytułu; pomijane z powodem', () => {
    const r = mod(`console.log(JSON.stringify(m.pakujSlowa(['Zähler', 'zähler', 'ab', 'Masche', 'stricken', 'häkeln', 'x'.repeat(60), 'Wolle', 'Garn', 'Nadeln'.repeat(5), 'Projekt'], { tytul: 'Masche: Reihenzähler', podtytul: 'Häkeln, Stricken, eigenes PDF' })))`);
    expect(r.slowa).toEqual(['Zähler', 'x'.repeat(60), 'Wolle', 'Garn', 'Projekt']);
    expect(r.bajty).toBe(Buffer.byteLength(r.slowa.join(',')));
    expect(r.bajty).toBeLessThanOrEqual(100);
    const powody = Object.fromEntries(r.pominiete.map((p: any) => [p.slowo, p.powod]));
    expect(powody['zähler']).toMatch(/powtórzenie/); expect(powody.ab).toMatch(/krótkie/); expect(powody.Masche).toMatch(/nazw/);
    expect(powody.stricken).toMatch(/nazw|podtytu/); expect(powody['Nadeln'.repeat(5)]).toMatch(/limit/);
  });
  test('CJK liczone w bajtach UTF-8 (3 B na znak), fraza zawarta w podtytule odpada', () => {
    const r = mod(`console.log(JSON.stringify(m.pakujSlowa(['棒針編み', 'かぎ針', 'あみぐるみ', '毛糸管理', 'メモ帳', 'x'.repeat(40)], { tytul: '編み目: 編み物カウンター', podtytul: 'かぎ針・棒針の段数と編み図' })))`);
    expect(r.slowa).not.toContain('かぎ針'); expect(r.slowa).toContain('棒針編み');
    expect(r.bajty).toBeLessThanOrEqual(100); expect(Buffer.byteLength(r.slowa.join(','))).toBe(r.bajty);
  });
});

describe('słowa kluczowe: długość minimalna zależy od pisma (P-510 wariant a)', () => {
  const pakuj = (k: string[], tytul = 'Oczko: licznik', podtytul = 'dwie techniki') => mod(`console.log(JSON.stringify(m.pakujSlowa(${JSON.stringify(k)}, ${JSON.stringify({ tytul, podtytul })})))`);
  test('słowo CJK (Han, hiragana, katakana, hangul) o długości 2 jest przyjmowane', () => {
    const r = pakuj(['棒針', 'ねこ', 'メモ', '뜨개']);
    expect(r.slowa).toEqual(['棒針', 'ねこ', 'メモ', '뜨개']);
    expect(r.pominiete).toEqual([]);
  });
  test('słowo łacińskie ≤ 2 znaki nadal odpada; CJK o długości 1 też', () => {
    const r = pakuj(['ab', 'x', '棒', 'pdf']);
    expect(r.slowa).toEqual(['pdf']);
    expect(r.pominiete.map((p: any) => p.slowo)).toEqual(['ab', 'x', '棒']);
    for (const p of r.pominiete) expect(p.powod).toMatch(/krótkie/);
  });
  test('pozostałe reguły bez zmian dla 2-znakowego CJK: powtórzenie, słowo w podtytule, limit 100 B', () => {
    const r = pakuj(['棒針', '棒針', '毛線', '鉤針'], '針目: 編織', '打毛線皆可');
    expect(r.slowa).toEqual(['棒針', '鉤針']);
    const powody = r.pominiete.map((p: any) => p.powod);
    expect(powody[0]).toMatch(/powtórzenie/); expect(powody[1]).toMatch(/podtytu|zawarte/);
    const dużo = pakuj(Array.from({ length: 20 }, (_, i) => String.fromCodePoint(0x4e00 + i * 2) + String.fromCodePoint(0x4e01 + i * 2)));
    expect(dużo.bajty).toBeLessThanOrEqual(100); expect(dużo.slowa).toHaveLength(14); expect(Buffer.byteLength(dużo.slowa.join(','))).toBe(dużo.bajty);
    expect(dużo.pominiete.every((p: any) => /limit/.test(p.powod))).toBe(true);
  });
  test('kontrola wpisu przed zapisem: keywords z 2-znakowym CJK przechodzą, z 2-znakowym łacińskim nie', () => {
    const tytulZh = nazwy['zh-Hant'].title;
    const kontrola = (kw: string[]) => mod(`const c = m.wczytajKontekst(); const e = { title: ${JSON.stringify(tytulZh)}, subtitle: 'x', promoText: 'x', description: 'x', keywords: ${JSON.stringify(kw)}, supportUrl: c.adresy.supportUrl, privacyPolicyUrl: c.adresy.privacyPolicyUrl }; console.log(JSON.stringify(m.sprawdzWpis('zh-Hant', e, c).filter((x) => x.startsWith('keywords'))))`);
    expect(kontrola(['棒針', '鉤針'])).toEqual([]);
    expect(kontrola(['ab', '棒針'])).toEqual(['keywords: słowo ≤ 2 znaki']);
  });
});

describe('żądanie do API: etap przekładu', () => {
  test('lokalizacja generowana (cs): źródło en, marka z nazwy, limity, słownik interfejsu, dane wyszukiwarki, prośba o podtytuł i kandydatów na słowa; bez klucza API', () => {
    const z = mod(`const c = m.wczytajKontekst(); console.log(JSON.stringify(m.budujZadanie('cs', c)))`);
    const t = z.messages[0].content as string;
    expect(t).toMatch(/Język docelowy: .*\(cs\)/); expect(t).toContain(en.description.slice(0, 80)); expect(t).toContain('Oczko: počítadlo řad');
    expect(t).toMatch(/30 znaków/); expect(t).toMatch(/170 znaków/); expect(t).toMatch(/4000 znaków/);
    expect(t).toContain('Słownik interfejsu'); expect(t).toMatch(/Ostatnio usunięte|Recently deleted/);
    expect(z.system).toMatch(/subtitle/); expect(z.system).toMatch(/slowa/); expect(z.system).toMatch(/nie dosłownie|nie tłumacz dosłownie/i);
    expect(t).toContain('Podtytuł'); expect(JSON.stringify(z)).not.toMatch(/sk-ant|api[_-]?key/i);
  });
  test('lokalizacja stała (de-DE): pola podtytułu i słów NIE są zlecane, tylko podane jako kontekst; marka „Masche” zamiast „Oczko”', () => {
    const z = mod(`const c = m.wczytajKontekst(); console.log(JSON.stringify(m.budujZadanie('de-DE', c)))`);
    const t = z.messages[0].content as string;
    expect(t).toContain('Häkeln, Stricken, eigenes PDF'); expect(t).toContain('Strickzähler,Maschenzähler');
    expect(t).toMatch(/marka[^\n]*Masche/i); expect(t).toMatch(/NIE zwracaj pól subtitle i slowa/);
  });
  test('zasady twierdzeń: tylko ze źródła (P-487), bez licznika bez subskrypcji ponad limit 5 dni, bez cen, zegarka, iCloud', () => {
    const z = mod(`console.log(JSON.stringify(m.budujZadanie('it', m.wczytajKontekst())))`);
    expect(z.system).toMatch(/tylko ze źródła|tylko twierdzenia ze źródła/i); expect(z.system).toMatch(/5 dni/); expect(z.system).toMatch(/cen/);
    expect(z.system).toMatch(/Apple Watch|zegark/i); expect(z.system).toMatch(/iCloud/);
    expect(z.system).toMatch(/JSON/);
  });
  test('słowa wyszukiwarki w dacie badania są w repo, bez nazw aplikacji (tylko słowa i liczby)', () => {
    const f = json(`${MET}/frazy-badanie.json`);
    expect(f.odczyt).toMatch(/^2026-11-0\d$/); expect(f.zrodlo).toMatch(/iTunes Search API/);
    for (const [loc, v] of Object.entries<any>(f.lokalizacje)) {
      expect(WYMAGANE).toContain(loc); expect(STALE_KODY).not.toContain(loc);
      expect(Array.isArray(v.slowa)).toBe(true);
      for (const s of v.slowa) { expect(typeof s.s).toBe('string'); expect(s.df).toBeGreaterThanOrEqual(2); expect(Object.keys(s).sort()).toEqual(['df', 's']); }
      expect(Object.keys(v).sort()).toEqual(['aplikacji', 'kraj', 'slowa', 'zapytania']);
    }
  });
});

describe('odpowiedź modelu: przyjęcie lub odrzucenie z powodem', () => {
  const parsuj = (loc: string, o: unknown) => mod(`console.log(JSON.stringify(m.parsuj(${JSON.stringify('```json\n' + JSON.stringify(o) + '\n```')}, '${loc}', m.wczytajKontekst())))`);
  test('poprawna odpowiedź (także w bloku kodu): pola przyjęte, słowa spakowane do 100 B, powtórzenie i słowo ≤ 2 znaki pominięte', () => {
    const r = parsuj('cs', odpowiedz('cs'));
    expect(r.blad).toBeNull(); expect(r.odrzucone).toEqual([]);
    expect(r.propozycja.subtitle).toBe('Podtytuł testowy'); expect(r.propozycja.slowa).toEqual(['jeden-testowy', 'drugi-testowy', 'trzeci-testowy']);
    expect(r.propozycja.bajty).toBeLessThanOrEqual(100);
    expect(r.propozycja.description).toContain('Oczko');
  });
  test('lokalizacja stała: odpowiedź bez podtytułu i słów jest poprawna; pola stałe uzupełnia kod, nie model', () => {
    const r = parsuj('fr-FR', odpowiedz('fr-FR'));
    expect(r.blad).toBeNull(); expect(r.odrzucone).toEqual([]);
    expect(r.propozycja.subtitle).toBe(stale['fr-FR'].subtitle); expect(r.propozycja.slowa).toEqual(stale['fr-FR'].keywords);
  });
  test('odrzuca: opis > 4000 znaków, tekst promocyjny > 170, podtytuł > 30, inna liczba punktów (struktura), nowe liczby, waluta, nazwy funkcji spoza źródła, brak marki, pusty tekst', () => {
    const baza = odpowiedz('cs') as any;
    const przyp: [string, any, RegExp][] = [
      ['description', { ...baza, description: baza.description + 'x'.repeat(4001) }, /4000/],
      ['promoText', { ...baza, promoText: 'x'.repeat(171) }, /170/],
      ['subtitle', { ...baza, subtitle: 'x'.repeat(31) }, /30/],
      ['description', { ...baza, description: baza.description.replace('• ', '') }, /struktur|punkt/i],
      ['description', { ...baza, description: baza.description + ' 99 dni' }, /liczb/i],
      ['description', { ...baza, description: baza.description + ' $4.99' }, /waluta|cen/i],
      ['description', { ...baza, description: baza.description + ' iCloud' }, /zakazane|spoza źródła/i],
      ['description', { ...baza, description: baza.description.replace(/Oczko/g, 'Inna') }, /marka/i],
      ['promoText', { ...baza, promoText: '  ' }, /puste/],
    ];
    for (const [pole, o, re] of przyp) {
      const r = parsuj('cs', o);
      const w = r.odrzucone.find((x: any) => x.pole === pole);
      expect(w).toBeTruthy(); expect(w.powod).toMatch(re);
    }
  });
  test('brak JSON albo brak pola słów: błąd lokalizacji, nic nie przyjęte', () => {
    const a = mod(`console.log(JSON.stringify(m.parsuj('nie json', 'cs', m.wczytajKontekst())))`);
    expect(a.blad).toMatch(/JSON/); expect(a.propozycja).toBeNull();
    const b = parsuj('cs', { ...(odpowiedz('cs') as any), slowa: [] });
    expect(b.odrzucone.some((x: any) => x.pole === 'slowa')).toBe(true);
  });
});

describe('krytyk w świeżym kontekście: tylko poprawki z powodem', () => {
  const prop = (loc: string) => JSON.parse(JSON.stringify(mod(`const c = m.wczytajKontekst(); console.log(JSON.stringify(m.parsuj(${JSON.stringify(JSON.stringify(odpowiedz('cs')))}, 'cs', c).propozycja))`)));
  test('żądanie krytyka: źródło en, obecny tekst, dane wyszukiwarki, zakaz przepisywania poprawnych tekstów', () => {
    const z = mod(`const c = m.wczytajKontekst(); const p = m.parsuj(${JSON.stringify(JSON.stringify(odpowiedz('cs')))}, 'cs', c).propozycja; console.log(JSON.stringify(m.budujKrytyka('cs', c, p)))`);
    expect(z.system).toMatch(/TYLKO poprawki|tylko poprawki/); expect(z.system).toMatch(/nie przepisuj/i); expect(z.system).toMatch(/dosłown/i);
    expect(z.messages[0].content).toContain('Podtytuł testowy'); expect(z.messages[0].content).toContain(en.promoText.slice(0, 40));
  });
  test('poprawki: przyjęte z powodem; odrzucone: nieznane pole, brak powodu, ten sam tekst, przekroczony limit; lokalizacja stała nie zmienia podtytułu ani słów', () => {
    const p = prop('cs');
    const poprawki = [
      { pole: 'promoText', tekst: 'Nowy tekst promocyjny', powod: 'naturalniej' },
      { pole: 'subtitle', tekst: 'x'.repeat(31), powod: 'za długi' },
      { pole: 'description', tekst: p.description, powod: 'bez zmian' },
      { pole: 'slowa', tekst: ['pletení', 'háčkování', 'přízi'], powod: 'frazy lokalne' },
      { pole: 'nazwa', tekst: 'x', powod: 'nie to pole' },
      { pole: 'promoText', tekst: 'bez powodu' },
    ];
    const r = mod(`const c = m.wczytajKontekst(); console.log(JSON.stringify(m.parsujKrytyka(${JSON.stringify(JSON.stringify({ poprawki }))}, 'cs', c, ${JSON.stringify(p)})))`);
    expect(r.blad).toBeNull();
    expect(r.poprawki.map((x: any) => x.pole).sort()).toEqual(['promoText', 'slowa']);
    expect(r.odrzucone).toHaveLength(4);
    const s = mod(`const c = m.wczytajKontekst(); console.log(JSON.stringify(m.parsujKrytyka(${JSON.stringify(JSON.stringify({ poprawki: [{ pole: 'subtitle', tekst: 'Inny', powod: 'x' }, { pole: 'slowa', tekst: ['abc', 'def'], powod: 'x' }] }))}, 'de-DE', c, { subtitle: ${JSON.stringify(stale['de-DE'].subtitle)}, slowa: ${JSON.stringify(stale['de-DE'].keywords)}, promoText: 'a', description: 'b' })))`);
    expect(s.poprawki).toEqual([]); expect(s.odrzucone).toHaveLength(2);
  });
});

describe('złożenie wpisu lokalizacji (format EAS) i walidacja Apple', () => {
  test('wpis: title z nazwy.store.json (P-174), adresy apps4brew (P-491, nigdy github.io), słowa jako tablica ≤ 100 B; przechodzi walidację limitów skryptu asc-metadane', () => {
    const r = mod(`const c = m.wczytajKontekst(); const p = m.parsuj(${JSON.stringify(JSON.stringify(odpowiedz('cs')))}, 'cs', c).propozycja;
      const w = m.zloz('cs', c, p, []); const a = await import(${JSON.stringify(join(ROOT, 'scripts/asc/metadane.mjs'))});
      const wanted = a.buildWanted({ merged: w.apple.info }); console.log(JSON.stringify({ w, err: a.validate({ wanted, mapping: { cs: 'cs' } }) }))`);
    const e = r.w.apple.info.cs;
    expect(e.title).toBe('Oczko: počítadlo řad'); expect(e.supportUrl).toBe('https://apps4brew.com/oczko/support.html'); expect(e.privacyPolicyUrl).toBe('https://apps4brew.com/oczko/privacy.html');
    expect(JSON.stringify(r.w)).not.toMatch(/github\.io/); expect(Array.isArray(e.keywords)).toBe(true); expect(e).not.toHaveProperty('releaseNotes');
    expect(r.err).toEqual([]);
  });
  test('poprawka krytyka nakładana po walidacji; nieprawidłowa poprawka nie psuje wpisu', () => {
    const r = mod(`const c = m.wczytajKontekst(); const p = m.parsuj(${JSON.stringify(JSON.stringify(odpowiedz('cs')))}, 'cs', c).propozycja;
      const w = m.zloz('cs', c, p, [{ pole: 'promoText', tekst: 'Poprawiony tekst', powod: 'x' }, { pole: 'subtitle', tekst: 'x'.repeat(40), powod: 'x' }]); console.log(JSON.stringify(w.apple.info.cs))`);
    expect(r.promoText).toBe('Poprawiony tekst'); expect(r.subtitle).toBe('Podtytuł testowy');
  });
});

describe('przebieg API na atrapie (Batch, dwa etapy), szacunek i pułap kosztu', () => {
  const ATRAPA = `
    const en = JSON.parse((await import('node:fs')).readFileSync(${JSON.stringify(join(ROOT, MET, 'en.store.json'))}, 'utf8')).apple.info['en-US'];
    const nazwy = JSON.parse((await import('node:fs')).readFileSync(${JSON.stringify(join(ROOT, MET, 'nazwy.store.json'))}, 'utf8')).apple.info;
    const STALE = ['pl','ja','no','de-DE','fr-FR']; const calls = []; let batches = 0; const zadane = {};
    const odp = (loc) => { const b = nazwy[loc].title.split(':')[0].trim(); const o = { promoText: en.promoText.replace(/Oczko/g, b), description: en.description.replace(/Oczko/g, b) };
      if (!STALE.includes(loc)) { o.subtitle = 'Podtytul'; o.slowa = ['jedno-slowo', 'drugie-slowo']; } return o; };
    const msg = (text) => ({ type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text }], usage: { input_tokens: 1000, output_tokens: 3000 } } });
    const fakeFetch = async (url, init = {}) => {
      const p = new URL(url).pathname, met = init.method || 'GET'; calls.push(met + ' ' + p);
      const r = (b) => ({ ok: true, status: 200, json: async () => b, text: async () => (typeof b === 'string' ? b : JSON.stringify(b)) });
      if (p.endsWith('/count_tokens')) return r({ input_tokens: 4000 });
      if (p.endsWith('/messages/batches') && met === 'POST') { const b = JSON.parse(init.body); batches++; zadane[batches] = b.requests; return r({ id: 'msgbatch_T' + batches }); }
      if (/\\/messages\\/batches\\/msgbatch_T\\d$/.test(p)) return r({ processing_status: 'ended', results_url: 'https://wyniki.test/' + p.at(-1), request_counts: {} });
      if (p.startsWith('/1') || p.startsWith('/2')) { const n = Number(p.slice(1)); return r(zadane[n].map((q) => { const loc = q.custom_id.replace(/^md[12]-/, '');
          const tekst = n === 1 ? JSON.stringify(odp(loc)) : JSON.stringify({ poprawki: loc === 'cs' ? [{ pole: 'promoText', tekst: 'Poprawiony', powod: 'naturalniej' }] : [] });
          return JSON.stringify({ custom_id: q.custom_id, result: msg(tekst) }); }).join('\\n')); }
      return { ok: false, status: 404, json: async () => ({}) , text: async () => '' };
    };`;
  const przebieg = (argv: string[], env: Record<string, string> = {}) => {
    const wyj = mkdtempSync(join(tmpdir(), 'md-'));
    const r = mod(`${ATRAPA}
      const logs = []; const kod = await m.main(${JSON.stringify([...argv, '--wyjscie', wyj])}, { fetchFn: fakeFetch, env: ${JSON.stringify({ ANTHROPIC_API_KEY: 'sk-ant-test-123', ...env })}, log: (x) => logs.push(String(x)), spij: async () => {} });
      console.log(JSON.stringify({ kod, logs, calls, zadane: Object.fromEntries(Object.entries(zadane).map(([k, v]) => [k, v.map((q) => ({ id: q.custom_id, model: q.params.model, effort: q.params.output_config?.effort, max: q.params.max_tokens }))])) }))`);
    return { ...r, wyj: wyj as string };
  };
  test('szacunek bez klucza: kod 0, nic płatnego, plik szacunek.json; 29 lokalizacji × (przekład + krytyk) w koszcie', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'md-'));
    const r = mod(`const logs = []; const kod = await m.main(['--szacuj', '--wyjscie', ${JSON.stringify(wyj)}], { env: {}, log: (x) => logs.push(String(x)) }); console.log(JSON.stringify({ kod, logs }))`);
    expect(r.kod).toBe(0); expect(r.logs.join('\n')).toMatch(/29 lokalizacji/);
    const s = JSON.parse(readFileSync(join(wyj, 'szacunek.json'), 'utf8'));
    expect(s.etapy).toEqual(['przeklad', 'krytyk']); expect(s.koszt_usd).toBeGreaterThan(0); expect(s.koszt_usd).toBeLessThan(30);
  });
  test('pułap kosztu: szacunek ponad limit bez zgody → kod 3 i zero wywołań płatnych (PRZEKLAD_LIMIT_USD może tylko obniżyć)', () => {
    const r = przebieg([], { PRZEKLAD_LIMIT_USD: '0.01' });
    expect(r.kod).toBe(3); expect(r.calls.filter((c: string) => c.startsWith('POST /v1/messages/batches'))).toEqual([]);
  });
  test('--limit 2 --tylko_szacuj=false: dwa etapy Batch (md1-, md2-), tylko pl i cs, wysiłek i model z argumentów, raport na lokalizację, bez klucza w logu', () => {
    const r = przebieg(['--limit', '2', '--model', 'opus', '--wysilek', 'high']);
    expect(r.kod).toBe(0);
    expect(r.zadane['1'].map((q: any) => q.id)).toEqual(['md1-pl', 'md1-cs']); expect(r.zadane['2'].map((q: any) => q.id)).toEqual(['md2-pl', 'md2-cs']);
    expect(r.zadane['1'][0]).toMatchObject({ model: 'claude-opus-5-5', effort: 'high', max: 64000 });
    expect(JSON.stringify(r.logs)).not.toContain('sk-ant');
    const cs = JSON.parse(readFileSync(join(r.wyj, 'cs.json'), 'utf8'));
    expect(cs.propozycja.subtitle).toBe('Podtytul'); expect(cs.krytyk.poprawki.map((x: any) => x.pole)).toEqual(['promoText']);
    const pl = JSON.parse(readFileSync(join(r.wyj, 'pl.json'), 'utf8'));
    expect(pl.propozycja.subtitle).toBe(stale.pl.subtitle);
    expect(existsSync(join(r.wyj, 'podsumowanie.md'))).toBe(true);
  });
  test('--tylko: tylko wskazane lokalizacje; nieznany kod → kod 2 przed wysłaniem', () => {
    const r = przebieg(['--tylko', 'ja,ko']);
    expect(r.zadane['1'].map((q: any) => q.id)).toEqual(['md1-ja', 'md1-ko']);
    const z = przebieg(['--tylko', 'xx']);
    expect(z.kod).toBe(2); expect(z.calls.filter((c: string) => c.includes('/batches'))).toEqual([]);
  });
  test('--etap przeklad: jeden batch, bez krytyka', () => {
    const r = przebieg(['--limit', '1', '--etap', 'przeklad']);
    expect(Object.keys(r.zadane)).toEqual(['1']);
  });
});

describe('przyjęcie artefaktu skryptem: pliki <kod ASC>.store.json i stan przekładu', () => {
  const kopia = () => {
    const d = mkdtempSync(join(tmpdir(), 'przyjmij-')); mkdirSync(join(d, MET), { recursive: true });
    for (const f of ['nazwy.store.json', 'en.store.json', 'adresy.json', 'slowa-aso.json']) cpSync(join(ROOT, MET, f), join(d, MET, f));
    writeFileSync(join(d, MET, 'przeklad-stan.json'), JSON.stringify({ wymagane: WYMAGANE, przyjete: {}, oczekujace: WYMAGANE }, null, 2));
    return d;
  };
  const artefakt = (loc: string, krytyk: unknown[] = [], poprawna = true) => {
    const d = mkdtempSync(join(tmpdir(), 'artefakt-'));
    const p = mod(`const c = m.wczytajKontekst(); console.log(JSON.stringify(m.parsuj(${JSON.stringify(JSON.stringify(poprawna ? odpowiedz(loc) : { ...odpowiedz(loc), description: 'x' })) }, '${loc}', c)))`);
    writeFileSync(join(d, `${loc}.json`), JSON.stringify({ jezyk: loc, propozycja: p.propozycja, odrzucone: p.odrzucone, krytyk: { poprawki: krytyk, odrzucone: [] }, blad: p.blad }));
    return d;
  };
  const przyjmij = (korzen: string, art: string, kody: string[], extra: string[] = []) =>
    spawnSync(process.execPath, [PRZYJMIJ, '--korzen', korzen, '--raport', art, ...extra, ...kody], { encoding: 'utf8' });
  test('zapisuje <kod>.store.json (apple.info.<kod>), nakłada poprawki krytyka, odejmuje z oczekujących; nie rusza en ani nazwy', () => {
    const k = kopia(); const a = artefakt('cs', [{ pole: 'promoText', tekst: 'Poprawiony', powod: 'x' }]);
    const r = przyjmij(k, a, ['cs']);
    expect(r.status).toBe(0);
    const f = JSON.parse(readFileSync(join(k, MET, 'cs.store.json'), 'utf8')).apple.info.cs;
    expect(f.promoText).toBe('Poprawiony'); expect(f.title).toBe('Oczko: počítadlo řad');
    const st = JSON.parse(readFileSync(join(k, MET, 'przeklad-stan.json'), 'utf8'));
    expect(st.oczekujace).not.toContain('cs'); expect(Object.keys(st.przyjete)).toEqual(['cs']); expect(st.oczekujace).toHaveLength(28);
    expect(readFileSync(join(k, MET, 'en.store.json'), 'utf8')).toBe(read(`${MET}/en.store.json`));
  });
  test('--bez-krytyka pomija poprawki; lokalizacja z błędem w raporcie nie jest przyjęta (kod 1, brak pliku)', () => {
    const k = kopia(); const a = artefakt('cs', [{ pole: 'promoText', tekst: 'Poprawiony', powod: 'x' }]);
    expect(przyjmij(k, a, ['cs'], ['--bez-krytyka']).status).toBe(0);
    expect(JSON.parse(readFileSync(join(k, MET, 'cs.store.json'), 'utf8')).apple.info.cs.promoText).toBe(en.promoText);
    const k2 = kopia(); const b = artefakt('sk', [], false);
    const r = przyjmij(k2, b, ['sk']);
    expect(r.status).toBe(1); expect(existsSync(join(k2, MET, 'sk.store.json'))).toBe(false);
  });
  test('--przepakuj: słowa z raportu pakowane ponownie (przyjęte najpierw, potem pominięte w kolejności) wg bieżących reguł; bez opcji raport przyjęty bez zmian', () => {
    const d = mkdtempSync(join(tmpdir(), 'artefakt-zh-'));
    const p = mod(`const c = m.wczytajKontekst(); console.log(JSON.stringify(m.parsuj(${JSON.stringify(JSON.stringify(odpowiedz('zh-Hant')))}, 'zh-Hant', c)))`);
    const stare = { ...p.propozycja, slowa: ['PDF'], bajty: 3, pominiete: ['鉤針', '棒針', '織圖', '針數'].map((slowo) => ({ slowo, powod: 'krótkie (≤ 2 znaki)' })) };
    writeFileSync(join(d, 'zh-Hant.json'), JSON.stringify({ jezyk: 'zh-Hant', propozycja: stare, odrzucone: [], krytyk: { poprawki: [], odrzucone: [] }, blad: null }));
    const k = kopia(); const k2 = kopia();
    expect(przyjmij(k, d, ['zh-Hant']).status).toBe(0);
    expect(JSON.parse(readFileSync(join(k, MET, 'zh-Hant.store.json'), 'utf8')).apple.info['zh-Hant'].keywords).toEqual(['PDF']);
    expect(przyjmij(k2, d, ['zh-Hant'], ['--przepakuj']).status).toBe(0);
    const f = JSON.parse(readFileSync(join(k2, MET, 'zh-Hant.store.json'), 'utf8')).apple.info['zh-Hant'];
    expect(f.keywords).toEqual(['PDF', '鉤針', '棒針', '織圖', '針數']);
    expect(Buffer.byteLength(f.keywords.join(','))).toBeLessThanOrEqual(100);
    const l = przyjmij(kopia(), d, ['zh-Hant'], ['--przepakuj']);
    expect(l.stdout).toMatch(/zh-Hant: przyjęta/);
  });
  test('nie przyjmuje kodu spoza listy 29 i nie nadpisuje bez --nadpisz', () => {
    const k = kopia(); const a = artefakt('cs');
    expect(przyjmij(k, a, ['en-US']).status).toBe(2);
    expect(przyjmij(k, a, ['cs']).status).toBe(0);
    expect(przyjmij(k, a, ['cs']).status).toBe(2);
    expect(przyjmij(k, a, ['cs'], ['--nadpisz']).status).toBe(0);
  });
});

describe('badanie fraz: iTunes Search API (atrapa) → tylko słowa i liczby, bez nazw aplikacji', () => {
  test('agregacja: słowa z nazw wyników z df ≥ 2 różnych aplikacji (duplikat trackId liczony raz); nazwa własna jednej aplikacji i słowa zakazane nie trafiają do pliku', () => {
    const r = run(BADANIE, `console.log(JSON.stringify(m.agreguj([
      { trackId: 1, trackName: 'Zähler Wollquark: Reihenzähler', userRatingCount: 10 }, { trackId: 2, trackName: 'Reihenzähler zum Stricken App', userRatingCount: 5 },
      { trackId: 3, trackName: 'Pro Maschen', userRatingCount: 1 }, { trackId: 3, trackName: 'Pro Maschen', userRatingCount: 1 }, { trackId: 4, trackName: 'Maschen App 12', userRatingCount: 1 }], { zakazane: ['app'] })))`);
    const s = Object.fromEntries(r.map((x: any) => [x.s, x.df]));
    expect(s['reihenzähler']).toBe(2); expect(s['maschen']).toBe(2);
    expect(s).not.toHaveProperty('wollquark'); expect(s).not.toHaveProperty('app'); expect(s).not.toHaveProperty('12'); expect(s).not.toHaveProperty('pro');
  });
  test('zapytania z słownika terminów (zalecane wyrazy), kraje iTunes dla 24 lokalizacji generowanych, ponawianie po 403 bez zasypywania', () => {
    const r = run(BADANIE, `console.log(JSON.stringify({ k: m.KRAJE, z: m.zapytania('cs', m.wczytajSlownik()) }))`);
    expect(Object.keys(r.k)).toHaveLength(24); expect(r.k['es-MX']).toBe('mx'); expect(r.k['zh-Hant']).toBe('tw'); expect(r.k.sl).toBe('si');
    for (const l of STALE_KODY) expect(r.k).not.toHaveProperty(l);
    expect(r.z.length).toBeGreaterThanOrEqual(3); expect(r.z.join(' ')).toMatch(/pletení|háčkov/);
  });
});

describe('workflow przeklad-tlumaczen.yml: tryb metadane (P-501) w istniejącym pliku — P-472: nowy plik workflow nie byłby dostępny przed scaleniem do main', () => {
  const wf = read('.github/workflows/przeklad-tlumaczen.yml');
  test('tryb metadane + etap + tylko; domyślnie tylko szacunek; ten sam pułap 30 USD; klucz API w jednym kroku; artefakt raport-metadane 7 dni', () => {
    expect(wf).toMatch(/options: \[przeklad, przeglad, zwrotny, metadane, produkty\]/);
    expect(wf).toContain('scripts/i18n/przeklad-metadane.mjs'); expect(wf).toContain('raport-metadane');
    expect(wf).toMatch(/etap:/); expect(wf).toMatch(/tylko:/);
    expect(wf).toMatch(/tylko_szacuj:[\s\S]*?default: true/); expect(wf).toMatch(/retention-days: 7/);
    expect((wf.match(/secrets\.ANTHROPIC_API_KEY/g) ?? []).length).toBe(1);
    expect(wf).not.toMatch(/environment:/);
  });
});

describe('dane metadanych: stan przekładu, kompletność i zakazy (P-491)', () => {
  const stan = json(`${MET}/przeklad-stan.json`);
  const pliki = readdirSync(join(ROOT, MET)).filter((f) => f.endsWith('.store.json') && !['en.store.json', 'nazwy.store.json', 'produkty.store.json'].includes(f));
  test('wymagane = 29; przyjęte ∪ oczekujące = wymagane, rozłączne; każda przyjęta ma plik, każdy plik jest przyjęty', () => {
    expect(stan.wymagane).toEqual(WYMAGANE);
    const przyjete = Object.keys(stan.przyjete);
    expect([...przyjete, ...stan.oczekujace].sort()).toEqual([...WYMAGANE].sort());
    expect(przyjete.filter((p) => stan.oczekujace.includes(p))).toEqual([]);
    expect(pliki.map((f) => f.replace('.store.json', '')).sort()).toEqual([...przyjete].sort());
  });
  test('każdy przyjęty plik: komplet pól, limity Apple, adresy apps4brew, title = nazwy.store.json, słowa ≤ 100 B, bez cen, zegarka, iCloud i github.io', () => {
    const a = JSON.parse(spawnSync(process.execPath, ['--input-type=module', '-e', `
      import * as A from ${JSON.stringify(join(ROOT, 'scripts/asc/metadane.mjs'))};
      const f = A.loadStoreFiles(${JSON.stringify(join(ROOT, MET))}); const { merged, errs } = A.mergeStoreFiles(f); const w = A.buildWanted({ merged });
      const map = Object.fromEntries(Object.keys(w).map((k) => [k, k]));
      console.log(JSON.stringify({ errs, v: A.validate({ wanted: w, mapping: map }) }));`], { encoding: 'utf8' }).stdout);
    const dotyczy = new Set([...pliki.map((f) => f.replace('.store.json', '')), 'en-US', 'en-GB', 'en-AU', 'en-CA']);
    expect(a.errs).toEqual([]);
    expect(a.v.filter((e: any) => dotyczy.has(e.lang))).toEqual([]);
    for (const f of pliki) {
      const kod = f.replace('.store.json', ''); const e = json(`${MET}/${f}`).apple.info[kod];
      expect(Object.keys(json(`${MET}/${f}`).apple.info)).toEqual([kod]);
      expect(e.title).toBe(nazwy[kod].title);
      for (const k of ['subtitle', 'description', 'promoText', 'supportUrl', 'privacyPolicyUrl']) expect(String(e[k] ?? '').trim()).not.toBe('');
      expect(Buffer.byteLength(e.keywords.join(','))).toBeLessThanOrEqual(100);
      expect(e.supportUrl).toBe('https://apps4brew.com/oczko/support.html'); expect(e.privacyPolicyUrl).toBe('https://apps4brew.com/oczko/privacy.html');
      expect(JSON.stringify(e)).not.toMatch(/github\.io|iCloud|Apple Watch|\$|USD/i);
      expect(e.description).toContain(marka(kod)); expect(e).not.toHaveProperty('releaseNotes');
    }
  });
  test('github.io nie występuje w metadanych sklepu ani w sklep.md (adres polityki = apps4brew.com, P-491); en bez zmian względem P-487', () => {
    for (const f of readdirSync(join(ROOT, MET))) if (/\.(json|txt|md)$/.test(f)) expect(read(`${MET}/${f}`)).not.toMatch(/github\.io/);
    expect(read('docs/wydanie/sklep.md')).not.toMatch(/github\.io/);
    expect(en.keywords.join(',')).toBe('knitting,stitch,tracker,pattern,pdf,yarn,stash,needles,project,tally,gauge,crochet,amigurumi,swatch');
    expect(json(`${MET}/en.store.json`).apple.info['en-GB'].keywords.join(',')).toBe('knitting,stitch,tracker,pattern,pdf,yarn,wool,stash,needles,project,tally,gauge,crochet,amigurumi');
  });
  test('sklep.md opisuje języki bez lokalizacji ASC (bg, et, lt, lv, sr, wg Treningu: strona w języku domyślnym storefrontu) i notatkę dla recenzenta jako plik wklejany w pole Notes', () => {
    const s = read('docs/wydanie/sklep.md');
    expect(s).toMatch(/bg, et, lt, lv, sr[^\n]*język[^\n]*domyślny/i); expect(s).toMatch(/notatka-recenzja\.txt[^\n]*Notes|Notes[^\n]*notatka-recenzja\.txt/);
  });
});

describe('uwagi właściciela P-508: obietnica subskrypcji w pierwszym akapicie opisu i opis pl', () => {
  // Pierwszy akapit każdej lokalizacji niesie „Pro jest subskrypcją albo zakupem jednorazowym” (jak nowe en), nie „subskrypcja niepotrzebna” (limit 5 dni → wytyczna 2.3, P-487).
  const PRO: Record<string, string> = {
    cs: 'Pro je předplatné nebo jednorázový nákup', da: 'Pro er et abonnement eller et engangskøb', 'de-DE': 'Masche Pro gibt es als Abo oder als Einmalkauf', el: 'το Pro διατίθεται ως συνδρομή ή ως εφάπαξ αγορά',
    'es-ES': 'Pro es una suscripción o una compra única', 'es-MX': 'Pro es una suscripción o una compra única', fi: 'Pro on tilaus tai kertaosto', 'fr-FR': 'Pro est un abonnement ou un achat unique',
    hr: 'Pro je pretplata ili jednokratna kupnja', hu: 'a Pro előfizetés vagy egyszeri vásárlás', id: 'Pro berupa langganan atau pembelian sekali bayar', it: 'Pro è un abbonamento o un acquisto unico',
    ja: 'Proはサブスクリプションまたは買い切りです', ko: 'Pro는 구독 또는 일회성 구매입니다', ms: 'Pro ialah langganan atau pembelian sekali', 'nl-NL': 'Pro is een abonnement of een eenmalige aankoop',
    no: 'Pro er et abonnement eller et engangskjøp', pl: 'Pro kupisz jako subskrypcję albo jednorazowo', 'pt-BR': 'o Pro é uma assinatura ou uma compra única', 'pt-PT': 'o Pro é uma subscrição ou uma compra única',
    ro: 'Pro este un abonament sau o achiziție unică', ru: 'Pro — это подписка или разовая покупка', sk: 'Pro je predplatné alebo jednorazový nákup', sl: 'Pro je naročnina ali enkratni nakup',
    sv: 'Pro är en prenumeration eller ett engångsköp', tr: 'Pro bir abonelik ya da tek seferlik satın almadır', uk: 'Pro — це підписка або одноразова покупка', vi: 'Pro là gói đăng ký hoặc mua một lần', 'zh-Hant': 'Pro 提供訂閱或一次性購買',
  };
  const opis = (kod: string) => String(json(`${MET}/${kod}.store.json`).apple.info[kod].description);
  test('tabela obejmuje wszystkie 29 lokalizacji; każda ma w pierwszym akapicie zdanie o Pro jako subskrypcji albo zakupie jednorazowym', () => {
    expect(Object.keys(PRO).sort()).toEqual([...WYMAGANE].sort());
    for (const kod of WYMAGANE) expect(opis(kod).split('\n\n')[0]).toContain(PRO[kod]);
  });
  test('en (4 lokalizacje): bez „no subscription required”, z „Pro is a subscription or a one-time purchase”', () => {
    const info = json(`${MET}/en.store.json`).apple.info as Record<string, { description: string }>;
    for (const k of ['en-US', 'en-GB', 'en-AU', 'en-CA']) { expect(info[k].description).not.toMatch(/no subscription required/i); expect(info[k].description.split('\n\n')[0]).toContain('Pro is a subscription or a one-time purchase'); }
  });
  test('pl: bez „subskrypcja nie jest wymagana”, „w folderze „Ostatnio usunięte”” we wstępie, bez dwóch powtórzonych punktów, blokada jako osobny punkt, słowa = slowa-aso.json', () => {
    const d = opis('pl'), pl = json(`${MET}/pl.store.json`).apple.info.pl;
    expect(d).not.toMatch(/subskrypcja nie jest wymagana/i);
    expect(d.split('\n\n')[0]).toContain('w folderze „Ostatnio usunięte”');
    expect(d).not.toContain('Jeśli stuknięcia posypią się');
    expect(d).not.toContain('Usunięte projekty zostają w');
    expect(d).toContain('• Opcjonalna blokada ignoruje przypadkowe dotknięcia.');
    expect(pl.keywords).toEqual(stale.pl.keywords); expect(pl.subtitle).toBe(stale.pl.subtitle);
  });
  test('lokalizacje ze stałymi polami (ja, no, de-DE, fr-FR) mają podtytuł i słowa z slowa-aso.json', () => {
    for (const kod of STALE_KODY) { const e = json(`${MET}/${kod}.store.json`).apple.info[kod]; expect(e.subtitle).toBe(stale[kod].subtitle); expect(e.keywords).toEqual(stale[kod].keywords); }
  });
});
