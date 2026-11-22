/* Złote pliki kontraktu TS ↔ Swift (tests/wspolne; Z07-11, Z07-12; strategia §4 „Dziennik +1 i stany Live Activity/zegarka”).
 * Schemat NIE jest przepisany w teście: typy czytane są z docs/architektura/moduly.md (kontrakt roli 05), więc zmiana typu bez zmiany plików czerwieni test.
 * Ten sam zestaw plików czyta XCTest (tests/wspolne/xctest-specyfikacja.md) — obie strony raportują „wykonano N z N” według wzorce.json. */
import * as fs from 'fs';
import * as path from 'path';

const root = path.join(__dirname, '..', '..');
const KAT = path.join(root, 'tests/wspolne');
const manifest = JSON.parse(fs.readFileSync(path.join(KAT, 'wzorce.json'), 'utf8')) as {
  wersja_kontraktu: number; limit_bajtow_stanu: number;
  dziennik: { plik: string; linie: number; przyjete_id: string[]; odrzucone_linie: number[]; ostatnia_ucieta: boolean; skroc_do_id: string | null; nieznane_pola?: string[] }[];
  stany: { plik: string; typ: string }[];
};
const stany = JSON.parse(fs.readFileSync(path.join(root, 'docs/architektura/stany.json'), 'utf8')) as Record<string, string[]>;

/* ---------- mini-parser typów TS z moduly.md: string, number, boolean, null, literały '…', T[], { … }[], unie |, przecięcie & z nazwanym typem ---------- */
type Typ = { k: 'string' | 'number' | 'boolean' | 'null' } | { k: 'lit'; v: string } | { k: 'tab'; el: Typ } | { k: 'obj'; pola: Record<string, Typ> } | { k: 'unia'; z: Typ[] };
const podzielNaGorze = (s: string, sep: string) => { const out: string[] = []; let gl = 0, b = ''; for (const c of s) { if ('{[('.includes(c)) gl++; if ('}])'.includes(c)) gl--; if (c === sep && gl === 0) { out.push(b); b = ''; } else b += c; } if (b.trim()) out.push(b); return out.map(x => x.trim()).filter(Boolean); };
function typ(src: string, nazwane: Record<string, Typ>): Typ {
  const s = src.trim();
  const unia = podzielNaGorze(s, '|'); if (unia.length > 1) return { k: 'unia', z: unia.map(u => typ(u, nazwane)) };
  const przec = podzielNaGorze(s, '&'); if (przec.length > 1) { const pola: Record<string, Typ> = {}; for (const p of przec) { const t = typ(p, nazwane); if (t.k !== 'obj') throw new Error(`& z nie-obiektem: ${p}`); Object.assign(pola, t.pola); } return { k: 'obj', pola }; }
  if (s.endsWith('[]')) return { k: 'tab', el: typ(s.slice(0, -2), nazwane) };
  if (s.startsWith('{')) { const pola: Record<string, Typ> = {}; for (const p of podzielNaGorze(s.slice(1, -1), ';').flatMap(x => podzielNaGorze(x, ','))) { const i = p.indexOf(':'); pola[p.slice(0, i).trim()] = typ(p.slice(i + 1), nazwane); } return { k: 'obj', pola }; }
  if (/^'[^']*'$/.test(s)) return { k: 'lit', v: s.slice(1, -1) };
  if (['string', 'number', 'boolean', 'null'].includes(s)) return { k: s as 'string' };
  if (nazwane[s]) return nazwane[s];
  throw new Error(`Nieznany typ w moduly.md: ${s}`);
}
export function typyZModulow(md: string): Record<string, Typ> {
  const nazwane: Record<string, Typ> = {};
  for (const m of md.matchAll(/^export type (\w+) = (.+?);(?:\s*\/\/.*)?$/gm)) nazwane[m[1]] = typ(m[2], nazwane);
  return nazwane;
}
/** Zgodność wartości z typem; `luzne` = dozwolone pola spoza typu (zgodność vN+1 w dzienniku). */
export function bledy(v: unknown, t: Typ, sciezka = '$', luzne = false): string[] {
  switch (t.k) {
    case 'string': return typeof v === 'string' ? [] : [`${sciezka}: oczekiwano string`];
    case 'number': return typeof v === 'number' && Number.isFinite(v) ? [] : [`${sciezka}: oczekiwano number`];
    case 'boolean': return typeof v === 'boolean' ? [] : [`${sciezka}: oczekiwano boolean`];
    case 'null': return v === null ? [] : [`${sciezka}: oczekiwano null`];
    case 'lit': return v === t.v ? [] : [`${sciezka}: oczekiwano '${t.v}'`];
    case 'unia': return t.z.some(z => !bledy(v, z, sciezka, luzne).length) ? [] : [`${sciezka}: żaden wariant unii (${JSON.stringify(v)})`];
    case 'tab': return Array.isArray(v) ? v.flatMap((x, i) => bledy(x, t.el, `${sciezka}[${i}]`, luzne)) : [`${sciezka}: oczekiwano tablicy`];
    case 'obj': {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return [`${sciezka}: oczekiwano obiektu`];
      const o = v as Record<string, unknown>;
      const brak = Object.keys(t.pola).filter(k => !(k in o)).map(k => `${sciezka}.${k}: brak pola`);
      const obce = luzne ? [] : Object.keys(o).filter(k => !(k in t.pola)).map(k => `${sciezka}.${k}: pole spoza typu`);
      return [...brak, ...obce, ...Object.entries(t.pola).filter(([k]) => k in o).flatMap(([k, tt]) => bledy(o[k], tt, `${sciezka}.${k}`, luzne))];
    }
  }
}

/** Wzorcowy odczyt dziennika (kontrakt ADR-0008 + propozycje Z07-11): linia = JSON jednego zdarzenia zakończony \n; ucięta ostatnia linia bez \n → pominięta
 * i zgłoszona; uszkodzona linia w środku → pominięta i zgłoszona, reszta przyjęta; nieznane pola pomijane; skrócenie do ostatniego przyjętego id. */
export function czytajDziennik(tekst: string, t: Typ) {
  const czesci = tekst === '' ? [] : tekst.split('\n'); const konczySieNl = tekst.endsWith('\n'); if (konczySieNl) czesci.pop();
  const przyjete: Record<string, unknown>[] = []; const odrzucone: number[] = []; let ostatniaUcieta = false;
  czesci.forEach((l, i) => {
    const nr = i + 1; let o: unknown;
    try { o = JSON.parse(l); } catch { odrzucone.push(nr); if (i === czesci.length - 1 && !konczySieNl) ostatniaUcieta = true; return; }
    if (bledy(o, t, `linia ${nr}`, true).length) { odrzucone.push(nr); return; }
    przyjete.push(o as Record<string, unknown>);
  });
  return { linie: czesci.length, przyjete, odrzucone, ostatniaUcieta, skrocDoId: przyjete.length ? String(przyjete[przyjete.length - 1].id) : null };
}

const typy = typyZModulow(fs.readFileSync(path.join(root, 'docs/architektura/moduly.md'), 'utf8'));
const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DZIEN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/; /* = CHECK dzien GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' (schemat.sql) */
const dzienW = (ms: number, strefa: string) => new Intl.DateTimeFormat('en-CA', { timeZone: strefa, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms);
const plikiKatalogu = () => fs.readdirSync(KAT).filter(f => /\.(jsonl|json)$/.test(f) && f !== 'wzorce.json').sort();

describe('typy z moduly.md (źródło kontraktu)', () => {
  // Wersja 2 od przełączenia v1 → v2 (08 partia 3, P-111 (3), P-129 Q7a): StanZegarka = StanEkranuBlokady; v1 tylko w typach *V1 (pliki *-v1.json).
  // Wersja 3 (08 partia 4, N1, P-135 Q7a): pole `zablokowany` na końcu; wersja 2 tylko w typach *V2 (pliki *-v2.json).
  test('parser czyta typy kontraktu i ich pola (wersja 3: StanZegarka = StanEkranuBlokady; wersja 2: *V2 bez zablokowany; wersja 1: StanZegarkaV1 = StanEkranuBlokadyV1 & {…})', () => {
    for (const n of ['StanEkranuBlokady', 'StanZegarka', 'StanEkranuBlokadyV2', 'StanZegarkaV2', 'StanEkranuBlokadyV1', 'StanZegarkaV1', 'ZdarzenieWejsciowe']) expect(typy[n]?.k).toBe('obj');
    const pola = (n: string) => Object.keys((typy[n] as { pola: object }).pola).sort();
    expect(pola('StanEkranuBlokadyV2')).toEqual(['dniWMiesiacu', 'dzien', 'dzienDozwolony', 'glowa', 'licznikId', 'nazwa', 'ostatniPlusMs', 'pro', 'proWaznoscDo', 'przypomnienia', 'sesjaStartMs', 'wartosc', 'wersja', 'znaczenie']);
    expect(pola('StanEkranuBlokady')).toEqual([...pola('StanEkranuBlokadyV2'), 'zablokowany'].sort());
    expect(pola('StanZegarkaV2')).toEqual(pola('StanEkranuBlokadyV2'));
    expect(pola('StanZegarka')).toEqual(pola('StanEkranuBlokady'));
    expect(pola('StanEkranuBlokadyV1')).toEqual(['dzien', 'dzienDozwolony', 'glowa', 'licznikId', 'nazwa', 'sesjaStartMs', 'wartosc']);
    expect(pola('StanZegarkaV1')).toEqual([...pola('StanEkranuBlokadyV1'), 'dniWMiesiacu', 'pro', 'proWaznoscDo'].sort());
    expect(pola('ZdarzenieWejsciowe')).toEqual(['czasMs', 'dzien', 'id', 'licznikId', 'pro', 'rodzaj', 'rodzice', 'strefa', 'urzadzenie', 'zrodlo']);
  });
  test('pułapki walidatora: brak pola, pole obce, zły typ, zły literał, null w polu bez null', () => {
    const t = typy.StanEkranuBlokady; const ok = JSON.parse(fs.readFileSync(path.join(KAT, 'stan-ekranu-blokady-typowy.json'), 'utf8'));
    expect(bledy(ok, t)).toEqual([]);
    const { wartosc: _w, ...bezWartosci } = ok;
    expect(bledy(bezWartosci, t)).toEqual(['$.wartosc: brak pola']);
    expect(bledy({ ...ok, dzien_dozwolony: true }, t)).toEqual(['$.dzien_dozwolony: pole spoza typu']); /* R-027: zmiana nazwy pola */
    expect(bledy({ ...ok, sesjaStartMs: '1794336720' }, t).length).toBe(1); /* R-024: sekundy jako tekst */
    expect(bledy({ ...ok, nazwa: null }, t).length).toBe(1);
    expect(bledy({ id: 'x', licznikId: 'x', rodzaj: 'plusik', rodzice: [], czasMs: 1, strefa: 'UTC', dzien: '2026-01-01', zrodlo: 'ekran_blokady', urzadzenie: 'u', pro: false }, typy.ZdarzenieWejsciowe)).toEqual(['$.rodzaj: żaden wariant unii ("plusik")']);
    expect(bledy({ id: 'x', licznikId: 'x', rodzaj: 'plus', rodzice: [], czasMs: 1, strefa: 'UTC', dzien: '2026-01-01', zrodlo: 'lockscreen', urzadzenie: 'u', pro: false }, typy.ZdarzenieWejsciowe)).toEqual(['$.zrodlo: żaden wariant unii ("lockscreen")']);
  });
  test('literały rodzaj i zrodlo typu ZdarzenieWejsciowe ⊆ stany.json (CHECK bazy)', () => {
    const lit = (n: string) => ((typy.ZdarzenieWejsciowe as { pola: Record<string, Typ> }).pola[n] as { z: { v: string }[] }).z.map(x => x.v).sort();
    expect(lit('rodzaj').filter(x => !stany['zdarzenie.rodzaj'].includes(x))).toEqual([]);
    expect(lit('zrodlo').filter(x => !stany['zdarzenie.zrodlo'].includes(x))).toEqual([]);
  });
});

describe('manifest wzorce.json (liczność N z N)', () => {
  test('każdy plik katalogu jest w manifeście dokładnie raz i odwrotnie; manifest niepusty', () => {
    const wpisane = [...manifest.dziennik.map(d => d.plik), ...manifest.stany.map(s => s.plik)];
    expect(wpisane.length).toBeGreaterThanOrEqual(10);
    expect(new Set(wpisane).size).toBe(wpisane.length);
    expect([...wpisane].sort()).toEqual(plikiKatalogu());
    expect(manifest.dziennik.length).toBeGreaterThanOrEqual(3);
    expect(manifest.stany.filter(s => s.typ === 'StanEkranuBlokady').length).toBeGreaterThanOrEqual(2);
    expect(manifest.stany.filter(s => s.typ === 'StanZegarka').length).toBeGreaterThanOrEqual(2);
  });
});

describe('dziennik +1 (dziennik-plus-*.jsonl, ADR-0008, Z07-11)', () => {
  test.each(manifest.dziennik.map(d => [d.plik, d] as const))('%s: wynik wzorcowego odczytu = oczekiwania manifestu', (plik, d) => {
    const w = czytajDziennik(fs.readFileSync(path.join(KAT, plik), 'utf8'), typy.ZdarzenieWejsciowe);
    expect({ linie: w.linie, przyjete: w.przyjete.map(z => z.id), odrzucone: w.odrzucone, ucieta: w.ostatniaUcieta, skroc: w.skrocDoId })
      .toEqual({ linie: d.linie, przyjete: d.przyjete_id, odrzucone: d.odrzucone_linie, ucieta: d.ostatnia_ucieta, skroc: d.skroc_do_id });
    expect(w.przyjete.length).toBeGreaterThan(0); /* R-024: 0 poprawnych linii w niepustym pliku = błąd, bez skrócenia */
  });
  test('przyjęte linie: pola ściśle z typu (poza plikiem „nieznane-pole”), UUID v4, dzien ISO = data czasMs w strefie zdarzenia, źródło ekran_blokady', () => {
    for (const d of manifest.dziennik) {
      const w = czytajDziennik(fs.readFileSync(path.join(KAT, d.plik), 'utf8'), typy.ZdarzenieWejsciowe);
      for (const z of w.przyjete) {
        const obce = Object.keys(z).filter(k => !(k in (typy.ZdarzenieWejsciowe as { pola: object }).pola)).sort();
        expect({ plik: d.plik, obce }).toEqual({ plik: d.plik, obce: [...(d.nieznane_pola ?? [])].filter(p => obce.includes(p)).sort() });
        expect([UUID4.test(String(z.id)), UUID4.test(String(z.licznikId)), (z.rodzice as string[]).every(r => UUID4.test(r))]).toEqual([true, true, true]);
        expect(DZIEN.test(String(z.dzien))).toBe(true);
        expect(dzienW(Number(z.czasMs), String(z.strefa))).toBe(z.dzien);
        expect(z.zrodlo).toBe('ekran_blokady');
      }
    }
    const nowe = czytajDziennik(fs.readFileSync(path.join(KAT, 'dziennik-plus-nieznane-pole.jsonl'), 'utf8'), typy.ZdarzenieWejsciowe).przyjete[1];
    expect(Object.keys(nowe).filter(k => !(k in (typy.ZdarzenieWejsciowe as { pola: object }).pola)).sort()).toEqual(['wersja', 'znaczenie']);
  });
  test('dziennik-plus-poprawny: łańcuch rodziców (każde zdarzenie wskazuje poprzednie własne id — propozycja Z07-11 (1), M-10) i przejście przez północ; pro false i true', () => {
    const w = czytajDziennik(fs.readFileSync(path.join(KAT, 'dziennik-plus-poprawny.jsonl'), 'utf8'), typy.ZdarzenieWejsciowe).przyjete;
    for (let i = 1; i < w.length; i++) expect(w[i].rodzice).toEqual([w[i - 1].id]);
    expect(new Set(w.map(z => z.dzien))).toEqual(new Set(['2026-11-10', '2026-11-11']));
    expect(w.map(z => z.rodzaj)).toEqual(['plus', 'plus', 'plus', 'minus']);
    expect(w.map(z => z.pro)).toEqual([false, false, true, false]); // obie wartości: kodowanie true w Swift (X-DZ-02) też sprawdzone (F07-12, P-125)
  });
  test('pułapki odczytu: uszkodzona linia w środku pomijana bez utraty reszty; ucięta tylko ostatnia; pusty plik = 0 linii', () => {
    const [a, b] = fs.readFileSync(path.join(KAT, 'dziennik-plus-poprawny.jsonl'), 'utf8').split('\n');
    expect(czytajDziennik(`${a}\n{"id":\n${b}\n`, typy.ZdarzenieWejsciowe)).toMatchObject({ linie: 3, odrzucone: [2], ostatniaUcieta: false });
    expect(czytajDziennik(`${a}\n${b.slice(0, 20)}`, typy.ZdarzenieWejsciowe)).toMatchObject({ odrzucone: [2], ostatniaUcieta: true });
    expect(czytajDziennik('', typy.ZdarzenieWejsciowe)).toMatchObject({ linie: 0, przyjete: [], skrocDoId: null });
  });
});

describe('stany Live Activity i zegarka (stan-*.json, Z07-12)', () => {
  test.each(manifest.stany.map(s => [s.plik, s.typ] as const))('%s: zgodny ściśle z typem %s z moduly.md', (plik, nazwaTypu) => {
    const o = JSON.parse(fs.readFileSync(path.join(KAT, plik), 'utf8'));
    expect(bledy(o, typy[nazwaTypu])).toEqual([]);
    expect([UUID4.test(o.licznikId), o.glowa === null || UUID4.test(o.glowa), DZIEN.test(o.dzien)]).toEqual([true, true, true]);
    expect(Number.isInteger(o.wartosc) && o.wartosc >= 0).toBe(true);
    if (nazwaTypu === 'StanZegarka' || nazwaTypu === 'StanZegarkaV2' || nazwaTypu === 'StanZegarkaV1') { for (const d of o.dniWMiesiacu) expect(DZIEN.test(d.dzien)).toBe(true); expect(o.dniWMiesiacu.length).toBeLessThanOrEqual(31); }
  });
  test.each(manifest.stany.map(s => [s.plik] as const))('%s: rozmiar ładunku < 4 KB (JSON bez wcięć, UTF-8; rejestr Apple 1b, R-028)', plik => {
    const o = JSON.parse(fs.readFileSync(path.join(KAT, plik), 'utf8'));
    expect(manifest.limit_bajtow_stanu).toBe(4096);
    expect(Buffer.byteLength(JSON.stringify(o), 'utf8')).toBeLessThan(manifest.limit_bajtow_stanu);
    expect(fs.statSync(path.join(KAT, plik)).size).toBeLessThan(manifest.limit_bajtow_stanu); /* także plik z wcięciami */
  });
  test('najgorsze przypadki obecne: dzienDozwolony = false, glowa null, proWaznoscDo null przy pro = true (dożywotni, R-031), nazwa wielobajtowa', () => {
    const wszystkie = manifest.stany.map(s => JSON.parse(fs.readFileSync(path.join(KAT, s.plik), 'utf8')));
    expect(wszystkie.some(o => o.dzienDozwolony === false)).toBe(true);
    expect(wszystkie.some(o => o.glowa === null)).toBe(true);
    expect(wszystkie.some(o => o.pro === true && o.proWaznoscDo === null)).toBe(true);
    expect(wszystkie.some(o => o.pro === true && typeof o.proWaznoscDo === 'number')).toBe(true);
    expect(wszystkie.some(o => Buffer.byteLength(o.nazwa, 'utf8') > 2 * o.nazwa.length)).toBe(true);
  });
});
