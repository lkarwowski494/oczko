// kontrola-brd.mjs — kontrola mechaniczna BRD (rola 01-odkrywanie).
// node kontrola-brd.mjs <katalog|plik.md>... [--szkic] [--wektory] [--zgodnosc=<brd.json>]
// Typy w wektorach (ER-39, P-097): `{a, b}` → zbiór (tablica), `a; b` → lista (tablica), `tak`/`nie` → true/false,
// `—` albo pusta → null, liczba z przecinkiem → liczba, reszta → tekst. --zgodnosc: plik = generator(BRD) i md → json → md bez strat.
// Wyjątek Oczko (P-018): persona to P-1…P-99; trzycyfrowe P-0nn to decyzje rejestru projektu, nie odwołania BRD.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ID = String.raw`(?:BR|NFR)-[A-Z]{2,6}-\d{3}|RD-\d{2}-W\d+|(?:J|ZP|PR|RD|OG|H|RYZ|S|OP|ER)-\d{2}|P-\d{1,2}`;
const RE_NAGL = new RegExp(`^(#{1,6})\\s+(${ID})(?=[\\s:·.]|$)`);
const RE_WIERSZ = /^\|\s*(S-\d{2}|OP-\d{2}|ER-\d{2}|RD-\d{2}-W\d+)\s*\|/;
const kom = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const norm = (l) => l.replace(/\*\*/g, '').replace(/^[\s>*-]*/, '').trim();
const liczba = (s = '') => { const t = s.replace(/\s/g, '').replace('−', '-'); return /^-?\d+([.,]\d+)?$/.test(t) ? Number(t.replace(',', '.')) : ['', '—'].includes(s) ? null : s; };
export const wartosc = (s = '') => {
  const t = s.trim();
  if (t === 'tak') return true;
  if (t === 'nie') return false;
  const z = t.match(/^\{(.*)\}$/);
  if (z) return z[1].trim() ? z[1].split(/,\s+/).map((x) => liczba(x.trim())) : [];
  if (/;\s/.test(t)) return t.split(/;\s+/).map((x) => liczba(x.trim()));
  return liczba(t);
};
// Odwrotność `wartosc` do kontroli md → json → md (zapis kanoniczny komórki).
export const zapis = (v) => {
  if (v === null) return '—';
  if (v === true) return 'tak';
  if (v === false) return 'nie';
  if (typeof v === 'number') return String(v).replace('.', ',');
  return String(v);
};
const kanon = (s = '') => s.trim().replace('−', '-').replace(/^(-?)\s+/, '$1');
function zapisKomorki(v, surowa) {
  if (Array.isArray(v)) return /^\{/.test(surowa.trim()) ? `{${v.map(zapis).join(', ')}}` : v.map(zapis).join('; ');
  return zapis(v);
}

export function parsuj(pliki) {
  const defs = new Map(), dup = [], refs = [], wiersze = [], zle = [];
  const dodaj = (d) => (defs.has(d.id) ? dup.push(d) : defs.set(d.id, d));
  for (const { plik, tekst } of pliki) {
    const linie = tekst.replace(/\r\n/g, '\n').split('\n');
    const stos = [];
    let nagl = null, kod = false;
    linie.forEach((l, i) => {
      const miejsce = `${plik}:${i + 1}`;
      if (/^\s*(`{3}|~{3})/.test(l)) kod = !kod;
      const h = !kod && l.match(/^(#{1,6})\s/);
      if (h) while (stos.length && stos.at(-1).poziom >= h[1].length) stos.pop();
      let wlasne = null;
      const n = !kod && l.match(RE_NAGL);
      if (!kod && !n && /^#{1,6}\s+(BR|NFR|RD|PR|J|ZP|OG|H|RYZ|S|OP|ER|P)-\w/.test(l)) zle.push({ miejsce, l: l.trim() });
      if (n) { wlasne = n[2]; const d = { id: wlasne, miejsce, poziom: n[1].length, linie: [] }; dodaj(d); stos.push(d); }
      else for (const d of stos) d.linie.push(l);
      if (/^\|[\s:|-]+\|$/.test(l.trim())) nagl = kom(linie[i - 1] || '');
      else if (!l.trim().startsWith('|')) nagl = null;
      const w = l.match(RE_WIERSZ);
      if (w) { wlasne = w[1]; dodaj({ id: wlasne, miejsce, k: kom(l), nagl }); }
      let pierwsze = true;
      for (const m of l.matchAll(new RegExp(`(?<![\\w-])(${ID})(?![\\w-])`, 'g'))) {
        if (m[1] === wlasne && pierwsze) { pierwsze = false; continue; }
        refs.push({ id: m[1], miejsce });
      }
      wiersze.push({ l, miejsce, wlasne });
    });
  }
  return { defs, dup, refs, wiersze, zle };
}

export function sprawdz(pliki, { szkic = false } = {}) {
  const { defs, dup, refs, wiersze, zle } = parsuj(pliki);
  const bledy = [], uwagi = [];
  const blad = (m, s) => bledy.push(`${m}: ${s}`);
  const brak = (m, s) => (szkic ? uwagi : bledy).push(`${m}: ${s}`);
  for (const d of dup) blad(d.miejsce, `zdublowane ID ${d.id}`);
  for (const z of zle) blad(z.miejsce, `nagłówek z ID w złym formacie: ${z.l}`);
  for (const r of refs) if (!defs.has(r.id)) blad(r.miejsce, `nieznane odwołanie ${r.id}`);
  const szczebel = (id) => Number(defs.get(id)?.k?.[5]);
  for (const d of defs.values()) {
    const tekst = (d.linie || []).join('\n');
    const pola = (d.linie || []).map(norm);
    const pole = (n) => pola.find((p) => p.startsWith(`${n}:`))?.slice(n.length + 1).trim();
    if (d.id.startsWith('S-')) {
      const [, adres, gdzie, cytat, odczyt, sz, przeglad] = d.k, data = /^\d{4}-\d\d-\d\d$/;
      if (!adres || !gdzie || !cytat || !data.test(odczyt || '') || !/^[1-5]$/.test(sz || ''))
        blad(d.miejsce, `źródło ${d.id} bez adresu, miejsca, cytatu, daty odczytu (RRRR-MM-DD) albo szczebla 1–5`);
      if (przeglad && przeglad !== '—' && !data.test(przeglad)) blad(d.miejsce, `źródło ${d.id}: przegląd nie w formacie RRRR-MM-DD`);
    } else if (d.id.startsWith('BR-') && !/Status:\s*wycofane/i.test(tekst)) {
      if (!/PR-\d{2}/.test(tekst)) brak(d.miejsce, `${d.id} bez przepływu PR`);
      if (!/Dowód potrzeby:[ \t]*\S/.test(tekst)) brak(d.miejsce, `${d.id} bez „Dowód potrzeby”`);
      const scen = [];
      for (const p of pola) {
        if (/^(Scenariusz|Przykład|Szablon scenariusza)( \d+)?:/.test(p)) scen.push({ p, wtedy: false });
        else if (scen.length && /^Wtedy\s/.test(p)) scen.at(-1).wtedy = true;
      }
      if (!scen.length) brak(d.miejsce, `${d.id} bez kryteriów akceptacji (Scenariusz)`);
      for (const s of scen) if (!s.wtedy) brak(d.miejsce, `${d.id}: „${s.p}” bez kroku „Wtedy”`);
    } else if (d.id.startsWith('NFR-')) {
      for (const n of ['Miara', 'Próg', 'Metoda']) if (!tekst.includes(`${n}:`)) brak(d.miejsce, `${d.id} bez „${n}:”`);
    } else if (d.id.startsWith('PR-') && !/J-\d{2}/.test(tekst)) {
      brak(d.miejsce, `${d.id} bez pracy J`);
    } else if (/^RD-\d\d$/.test(d.id)) {
      for (const n of ['Wzór', 'Jednostki', 'Granica', 'Podstawa', 'Krytyczna']) if (!pole(n)) brak(d.miejsce, `${d.id} bez pola „${n}:”`);
      const podst = pole('Podstawa') || '';
      if (podst && !/S-\d{2}|D-\d+|rachunek/i.test(podst)) brak(d.miejsce, `${d.id}: podstawa bez źródła S, decyzji ani rachunku`);
      if (/^tak/i.test(pole('Krytyczna') || '') && !(podst.match(/S-\d{2}/g) || []).some((s) => szczebel(s) <= 3))
        blad(d.miejsce, `${d.id}: reguła krytyczna bez źródła ze szczebla 1–3 (C-003)`);
      const sRD = podst.match(/S-\d{2}/g) || [];
      if (sRD.length && sRD.every((s) => szczebel(s) === 5) && !/D-\d+|rachunek/i.test(podst)) blad(d.miejsce, `${d.id}: podstawa tylko ze szczebla 5`);
      const wek = [...defs.values()].filter((x) => x.id.startsWith(`${d.id}-W`));
      const rodzaje = new Set(wek.map((w) => (w.k[(w.nagl || []).indexOf('Rodzaj')] || '').toLowerCase()));
      const n0 = wek[0]?.nagl || [], bezJ = n0.slice(1, n0.findIndex((k) => k.startsWith('Oczekiwane')) + 1).filter((k) => !/\[.+\]/.test(k));
      if (bezJ.length) brak(d.miejsce, `${d.id}: kolumny wektorów bez jednostki [..]: ${bezJ.join(', ')}`);
      if (wek.length < 3) brak(d.miejsce, `${d.id}: ${wek.length} wektory, potrzeba co najmniej 3`);
      if (pole('Granica') && !/^brak/i.test(pole('Granica')))
        for (const r of ['granica', 'poniżej', 'powyżej']) if (!rodzaje.has(r)) brak(d.miejsce, `${d.id}: brak wektora rodzaju „${r}”`);
      if (wek.length && !rodzaje.has('błąd')) uwagi.push(`${d.miejsce}: ${d.id}: brak wektora błędnych danych`);
    } else if (/^RD-\d\d-W/.test(d.id)) {
      const n = d.nagl || [];
      if (!defs.has(d.id.replace(/-W\d+$/, ''))) blad(d.miejsce, `wektor ${d.id} bez reguły`);
      const brakKol = ['ID', 'Tolerancja', 'Rodzaj', 'Pochodzenie'].filter((k) => !n.includes(k));
      if (!n.some((k) => k.startsWith('Oczekiwane'))) brakKol.push('Oczekiwane…');
      if (brakKol.length) blad(d.miejsce, `tabela wektorów bez kolumn: ${brakKol.join(', ')}`);
      else if (!/S-\d{2}|D-\d+|rachunek/i.test(d.k[n.indexOf('Pochodzenie')] || '')) brak(d.miejsce, `${d.id} bez pochodzenia (S-nn, decyzja albo rachunek)`);
    }
  }
  let otwarte = 0;
  for (const { l: surowa, miejsce, wlasne } of wiersze) {
    const l = surowa.replace(/`[^`]*`/g, '');
    for (const m of l.matchAll(/\[FAKT([^\]]*)\]/g)) {
      const ids = m[1].match(/S-\d{2}/g) || [];
      if (!ids.length) blad(miejsce, '[FAKT] bez źródła S-nn');
      else if (ids.every((s) => szczebel(s) === 5)) blad(miejsce, `jedyne źródła ze szczebla 5: ${ids.join(', ')}`);
    }
    if (wlasne?.startsWith('OP-')) { otwarte++; continue; }
    for (const m of l.matchAll(/\[DO (USTALENIA|WYJAŚNIENIA)\](?!\s*\(OP-\d{2}\))/g)) brak(miejsce, `[DO ${m[1]}] bez wpisu OP (dopisz „(OP-nn)”)`);
  }
  const ile = (re) => [...defs.keys()].filter((k) => re.test(k)).length;
  const podsumowanie = `kontrola-brd: ${pliki.length} plików, ${ile(/^BR-/)} wymagań BR, ${ile(/^RD-\d\d$/)} reguł RD, ${ile(/^RD-\d\d-W/)} wektorów, ${otwarte} otwartych pytań · ${bledy.length} błędów, ${uwagi.length} uwag`;
  return { bledy, uwagi, podsumowanie };
}

export function wektory(pliki) {
  return [...parsuj(pliki).defs.values()].filter((d) => /^RD-\d\d-W/.test(d.id) && d.nagl).map((d) => {
    const n = d.nagl, ocz = n.findIndex((k) => k.startsWith('Oczekiwane'));
    const wejscie = {}, oczekiwane = {};
    n.forEach((k, i) => {
      if (i > 0 && i < ocz) wejscie[k] = wartosc(d.k[i]);
      if (k.startsWith('Oczekiwane')) oczekiwane[k.replace(/^Oczekiwane:?\s*/, '')] = wartosc(d.k[i]);
    });
    const c = (k) => d.k[n.indexOf(k)];
    return { regula: d.id.replace(/-W\d+$/, ''), id: d.id, wejscie, oczekiwane, tolerancja: liczba(c('Tolerancja')), rodzaj: c('Rodzaj'), pochodzenie: c('Pochodzenie'), miejsce: d.miejsce };
  });
}

// Te same warunki co docs/brd/wektory.schema.json, bez zależności od walidatora (CI i chmura bez sieci).
export function bledySchematu(lista) {
  const b = [], skalar = (x) => x === null || ['number', 'string', 'boolean'].includes(typeof x);
  const wart = (x) => skalar(x) || (Array.isArray(x) && x.every((e) => ['number', 'string'].includes(typeof e)));
  const pola = ['regula', 'id', 'wejscie', 'oczekiwane', 'tolerancja', 'rodzaj', 'pochodzenie', 'miejsce'];
  if (!Array.isArray(lista)) return ['brd.json nie jest tablicą'];
  for (const v of lista) {
    const gdzie = v?.id ?? '?';
    if (Object.keys(v).sort().join() !== [...pola].sort().join()) b.push(`${gdzie}: pola ${Object.keys(v).join(', ')}`);
    if (!/^RD-\d{2}$/.test(v.regula) || !/^RD-\d{2}-W\d+$/.test(v.id) || !v.id.startsWith(`${v.regula}-`)) b.push(`${gdzie}: regula/id`);
    for (const k of ['wejscie', 'oczekiwane']) if (typeof v[k] !== 'object' || v[k] === null || !Object.values(v[k]).every(wart)) b.push(`${gdzie}: ${k} poza schematem`);
    if (!Object.keys(v.oczekiwane || {}).length) b.push(`${gdzie}: brak wyniku`);
    if (!(v.tolerancja === null || (typeof v.tolerancja === 'number' && v.tolerancja >= 0))) b.push(`${gdzie}: tolerancja`);
    if (!['typowy', 'granica', 'poniżej', 'powyżej', 'błąd'].includes(v.rodzaj)) b.push(`${gdzie}: rodzaj „${v.rodzaj}”`);
    if (typeof v.pochodzenie !== 'string' || !v.pochodzenie) b.push(`${gdzie}: pochodzenie`);
    if (!/^docs\/brd\/[^:]+\.md:\d+$/.test(v.miejsce || '')) b.push(`${gdzie}: miejsce`);
  }
  return b;
}

// Kontrola bez strat: każda komórka wejścia i wyniku po md → json → md daje ten sam zapis (np. zbiór „2, 3” nie staje się liczbą 2.3).
export function stratyZapisu(pliki) {
  const bledy = [];
  for (const d of parsuj(pliki).defs.values()) {
    if (!/^RD-\d\d-W/.test(d.id) || !d.nagl) continue;
    const ocz = d.nagl.findIndex((k) => k.startsWith('Oczekiwane'));
    d.nagl.forEach((k, i) => {
      if (!(i > 0 && (i < ocz || k.startsWith('Oczekiwane') || k === 'Tolerancja'))) return;
      const surowa = d.k[i] ?? '', v = wartosc(surowa), z = zapisKomorki(v, surowa);
      if (kanon(z) !== kanon(surowa) && !(v === null && kanon(surowa) === '')) bledy.push(`${d.miejsce}: ${d.id} „${k}”: „${surowa}” → ${JSON.stringify(v)} → „${z}”`);
    });
  }
  return bledy;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), sciezki = args.filter((a) => !a.startsWith('--'));
  if (!sciezki.length) { console.error('Użycie: node kontrola-brd.mjs <katalog|plik.md>... [--szkic] [--wektory] [--zgodnosc=<brd.json>]'); process.exit(2); }
  const pliki = sciezki.flatMap((s) => (statSync(s).isDirectory() ? readdirSync(s).filter((f) => f.endsWith('.md')).sort().map((f) => join(s, f)) : [s]))
    .map((p) => ({ plik: p, tekst: readFileSync(p, 'utf8') }));
  const { bledy, uwagi, podsumowanie } = sprawdz(pliki, { szkic: args.includes('--szkic') });
  const zg = args.find((a) => a.startsWith('--zgodnosc='));
  if (zg) {
    const plik = zg.slice('--zgodnosc='.length), straty = stratyZapisu(pliki);
    const oczek = JSON.stringify(wektory(pliki), null, 2) + '\n', jest = readFileSync(plik, 'utf8');
    let schemat;
    try { schemat = bledySchematu(JSON.parse(jest)); } catch (e) { schemat = [`${plik}: ${e.message}`]; }
    for (const b of [...bledy, ...straty, ...schemat]) console.log(`BŁĄD ${b}`);
    if (oczek !== jest) console.log(`BŁĄD ${plik} różni się od generatora; odtwórz: node docs/brd/narzedzia/kontrola-brd.mjs docs/brd --wektory > ${plik}`);
    const ok = !bledy.length && !straty.length && !schemat.length && oczek === jest;
    console.log(ok ? `zgodność brd.json: OK (${wektory(pliki).length} wektorów, bez strat zapisu, schemat spełniony)` : 'zgodność brd.json: BŁĘDY');
    process.exit(ok ? 0 : 1);
  }
  if (args.includes('--wektory')) {
    for (const b of bledy) console.error(`BŁĄD ${b}`);
    if (!bledy.length) console.log(JSON.stringify(wektory(pliki), null, 2));
  } else {
    for (const b of bledy) console.log(`BŁĄD ${b}`);
    for (const u of uwagi) console.log(`UWAGA ${u}`);
    console.log(podsumowanie);
  }
  process.exit(bledy.length ? 1 : 0);
}
