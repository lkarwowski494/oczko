// sprawdz-i18n.mjs <katalog> --zrodlo en [--kod src,app] [--wyjatki w.json] [--oczekujace o.json [--wydanie]] [--pseudo plik.json]
// --oczekujace (P-357, wzór Treningu): { powod, odwolania, klucze: [bazy kluczy] } — brak przekładu tych kluczy to uwaga, nie błąd; lista = dokładnie różnica źródło ↔ słowniki
//   (klucz z listy już przetłumaczony albo nieistniejący w źródle = błąd). --wydanie: niepusta lista = błąd (fala przekładu przed wydaniem, P-320).
// --wyjatki: { klucze, wartosci, pliki: { ścieżka względna: powód } } — `pliki` (M1-051): pliki pod ścieżką poza skanem kodu; nieistniejąca ścieżka = kod 2.
// --krytyczne k.json --przeglad p.json (M1-audytor-generalny-008, DEC-11 a): k.json = klucze treści krytycznej oznaczone przez 06 ID twierdzeń; p.json = stan kontroli (a) na język
//   (przekład zwrotny na pl w świeżej sesji, zgodny z kluczem przez skrót tekstu). --wydanie bez tych dwóch flag = kod 2; brak ważnego wpisu (a) dla klucza krytycznego w którymkolwiek języku poza źródłem = błąd (kod 1).
//   --skrot <język> wypisuje skróty kluczy krytycznych tego języka (do wpisu kontroli).
// Słowniki <tag>.json w formacie i18next v4. Kod wyjścia: 0 bez błędów, 1 błędy, 2 konfiguracja albo skan kodu niewykonany.
import { readFileSync, readdirSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const KAT = /_(ordinal_)?(zero|one|two|few|many|other)$/;
const ZN = /\{\{\s*([^{},\s]+)[^{}]*\}\}|\{([A-Za-z_][\w.]*)\}|<\/?(\w+)\s*\/?>/g; // parametry w klamrach, znaczniki <Trans>
const TW = /\[T:[^\]]*\]/g; // znaczniki twierdzeń roli 06
const PISMO = { Latn: 'Latin', Cyrl: 'Cyrillic', Grek: 'Greek', Hans: 'Han', Hant: 'Han', Jpan: 'Han|Hiragana|Katakana', Kore: 'Hangul|Han', Arab: 'Arabic', Hebr: 'Hebrew' };
const PROPSY = new Set(['title', 'label', 'placeholder', 'accessibilityLabel', 'accessibilityHint', 'headerTitle', 'tabBarLabel', 'body', 'subtitle', 'message', 'text', 'aria-label']);

export const splaszcz = (o, p = '', w = {}) => {
  for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? splaszcz(v, p + k + '.', w) : v !== null && (w[p + k] = String(v));
  return w;
};
const znaczniki = (xs) => [...new Set(xs.flatMap((s) => [...s.matchAll(ZN)].map((m) => (m[1] ? `${'{'.repeat(2)}${m[1]}}}` : m[2] ? `{${m[2]}}` : `<${m[3]}>`))))].sort().join(',');
const tw = (xs) => xs.flatMap((s) => s.match(TW) || []).sort().join(',');
const bez = (s) => s.replace(ZN, ' ').replace(TW, ' ');
function liczby(s, j) { // separatory według języka: „2,5” (pl) = „2.5” (en) ≠ „25”
  let g = ',', d = '.';
  try { for (const p of new Intl.NumberFormat(j).formatToParts(12345.6)) p.type === 'group' ? (g = p.value) : p.type === 'decimal' ? (d = p.value) : 0; } catch { /* domyślne */ }
  return (bez(s).replace(/(\d)[\s  ](?=\d{3}\b)/g, '$1').match(/\d+(?:[.,'’]\d+)*/g) || []).map((x) => String(Number(x.split(g).join('').replace(d, '.')))).sort().join(',');
}
export function wpisy(slownik) { // baza → { formy: {kategoria: tekst}, porzadkowe } albo { tekst }
  const w = {};
  for (const [k, v] of Object.entries(slownik)) {
    const m = k.match(KAT), b = m ? k.slice(0, m.index) : k;
    if (m) { w[b] ??= { formy: {}, porzadkowe: !!m[1] }; w[b].formy ? (w[b].formy[m[2]] = v) : (w[b].konflikt = true); } else if (w[b]) w[b].konflikt = true; else w[b] = { tekst: v };
  }
  return w;
}
const kategorie = (j, p) => { try { return new Intl.PluralRules(j, { type: p ? 'ordinal' : 'cardinal' }).resolvedOptions().pluralCategories; } catch { return null; } };
const pismo = (j) => { try { const s = PISMO[new Intl.Locale(j).maximize().script]; return s && new RegExp(s.split('|').map((x) => `\\p{Script=${x}}`).join('|'), 'u'); } catch { return null; } };

export function sprawdzSlowniki(slowniki, zrodlo, { wyjatki = {}, kontekst = null, oczekujace = [] } = {}) {
  const bledy = [], uwagi = [], zr = wpisy(slowniki[zrodlo]), ocz = new Set(oczekujace);
  for (const b of ocz) if (!zr[b]) bledy.push(`oczekujace: klucza ${b} nie ma w źródle`);
  for (const [j, slownik] of Object.entries(slowniki)) {
    const ws = wpisy(slownik), baz = j.split('-')[0], nakladka = j !== baz && slowniki[baz], litery = pismo(j);
    for (const [b, w] of Object.entries(ws)) {
      const e = (m) => bledy.push(`${j} ${b}: ${m}`), u = (m) => uwagi.push(`${j} ${b}: ${m}`);
      if (w.konflikt) e('klucz zwykły i w formach liczby mnogiej');
      if (w.formy) {
        const wym = kategorie(j, w.porzadkowe) || [];
        for (const k of wym) if (!(k in w.formy)) e(`brak formy _${k} (wymagane: ${wym.join(', ')})`);
        for (const k in w.formy) if (!wym.includes(k) && k !== 'zero') u(`forma _${k} nie występuje w tym języku`);
      }
      if ((w.formy ? Object.values(w.formy) : [w.tekst]).some((s) => !s.trim())) e('pusty tekst');
      const z = zr[b];
      if (j === zrodlo) continue;
      if (!z) { u('klucza nie ma w źródle'); continue; }
      if (!z.formy !== !w.formy) { e(`formy liczby mnogiej tylko w ${z.formy ? 'źródle' : 'tłumaczeniu'}`); continue; }
      const t = w.formy ? Object.values(w.formy) : [w.tekst], zt = z.formy ? Object.values(z.formy) : [z.tekst];
      if (znaczniki(t) !== znaczniki(zt)) e(`parametry [${znaczniki(t)}] ≠ źródło [${znaczniki(zt)}]`);
      if (tw(t) !== tw(zt)) e(`twierdzenia [${tw(t)}] ≠ źródło [${tw(zt)}]`);
      if ((wyjatki.klucze || []).includes(b)) continue;
      if (!w.formy && liczby(w.tekst, j) !== liczby(z.tekst, zrodlo)) (tw(zt) ? e : u)(`liczby inne niż w źródle („${w.tekst}”)`);
      for (const s of t) { const l = bez(s).match(/\p{L}/gu) || []; if (litery && l.length && !l.some((c) => litery.test(c))) u(`brak liter pisma języka („${s}”)`); }
      if (!w.formy && w.tekst === z.tekst && (w.tekst.match(/\p{L}/gu) || []).length >= 4 && !(wyjatki.wartosci || []).includes(w.tekst)) u('tekst taki sam jak w źródle');
    }
    if (j !== zrodlo && !nakladka) for (const b in zr) if (!ws[b]) (ocz.has(b) ? uwagi : bledy).push(`${j} ${b}: brak tłumaczenia${ocz.has(b) ? ' (czeka na falę przekładu, oczekujace.json)' : ''}`);
    if (j !== zrodlo) for (const b of ocz) if (ws[b] && zr[b]) bledy.push(`${j} ${b}: klucz z oczekujace.json już przetłumaczony — usuń go z listy`);
  }
  const bk = kontekst ? Object.keys(zr).filter((k) => !kontekst[k]) : [];
  if (bk.length) uwagi.push(`${zrodlo}: ${bk.length} kluczy bez kontekstu (np. ${bk.slice(0, 5).join(', ')})`);
  return { bledy, uwagi };
}

// --- Treść krytyczna (DEC-11 a): mapa klucz → ID twierdzeń (06) × stan kontroli (a) na język (09) ---
const ID_TW = /^[A-Z]{3}-[A-Z0-9]+$/;
const METODY_A = ['przeklad-zwrotny-pl']; // kontrola (a) „szerokiej” (docs/lokalizacja/jezyki.md): przekład zwrotny na pl w świeżej sesji z porównaniem sensu
const WYNIKI_A = ['zgodny', 'rozbieżny'];
// Skrót tekstu klucza (12 znaków sha256): tekst albo linie „kategoria=tekst” posortowane po kategorii; zmiana tekstu po kontroli unieważnia wpis.
export const skrotKlucza = (w) => createHash('sha256').update(w.formy ? Object.keys(w.formy).sort().map((k) => `${k}=${w.formy[k]}`).join('\n') : w.tekst).digest('hex').slice(0, 12);

export function sprawdzKrytyczne(slowniki, zrodlo, mapa, przeglad, { wydanie = false } = {}) {
  const bledy = [], uwagi = [], zr = wpisy(slowniki[zrodlo]), klucze = mapa.klucze ?? {}, ids = new Set(mapa.krytyczne_id ?? []);
  const sl = Object.fromEntries(Object.entries(slowniki).map(([j, x]) => [j, wpisy(x)]));
  for (const [k, m] of Object.entries(klucze)) {
    if (!zr[k]) { bledy.push(`krytyczne: klucza ${k} nie ma w źródle`); continue; }
    const tw = m.twierdzenia ?? [];
    if (!tw.length || !tw.every((id) => ID_TW.test(id))) bledy.push(`krytyczne: ${k} — brak twierdzeń albo zły format ID`);
    else if (!tw.some((id) => ids.has(id))) bledy.push(`krytyczne: ${k} nie ma twierdzenia z listy krytyczne_id`);
    const sk = skrotKlucza(zr[k]);
    if (m.sha_en !== sk) (wydanie ? bledy : uwagi).push(`krytyczne: ${k} — tekst źródłowy zmieniony od oznaczenia przez 06 (sha_en ${m.sha_en} ≠ ${sk}); 06 weryfikuje twierdzenie i odnawia mapę, 09 unieważnia kontrole (a)`);
  }
  for (const [j, kk] of Object.entries(przeglad.jezyki ?? {})) {
    if (!slowniki[j]) { bledy.push(`przeglad: język ${j} — brak słownika`); continue; }
    if (j === zrodlo) { bledy.push(`przeglad: język ${j} — źródło nie ma kontroli (a), kanon prowadzi 06`); continue; }
    for (const [k, e] of Object.entries(kk)) {
      if (!klucze[k]) { bledy.push(`przeglad: ${j} ${k} — klucz spoza krytyczne.json`); continue; }
      const a = e?.a;
      if (!a) continue;
      const brak = ['kto', 'data', 'metoda', 'wynik', 'sha'].filter((f) => !a[f]);
      if (brak.length) bledy.push(`przeglad: ${j} ${k} — wpis a bez pól ${brak.join(', ')}`);
      if (a.data && !/^\d{4}-\d{2}-\d{2}$/.test(a.data)) bledy.push(`przeglad: ${j} ${k} — data „${a.data}” nie jest RRRR-MM-DD`);
      if (a.metoda && !METODY_A.includes(a.metoda)) bledy.push(`przeglad: ${j} ${k} — metoda „${a.metoda}” spoza ${METODY_A.join(', ')}`);
      if (a.wynik && !WYNIKI_A.includes(a.wynik)) bledy.push(`przeglad: ${j} ${k} — wynik „${a.wynik}” spoza ${WYNIKI_A.join(', ')}`);
    }
  }
  let par = 0, bezWpisu = 0;
  for (const j of Object.keys(slowniki).filter((x) => x !== zrodlo)) {
    const braki = [], nieaktualne = [], niezgodne = [];
    for (const k of Object.keys(klucze)) {
      const w = sl[j][k];
      if (!w) continue; // brak tekstu: nakładka dziedziczy z języka bazowego (jego wpis), brak w pełnym słowniku to błąd sprawdzSlowniki
      par++;
      const a = przeglad.jezyki?.[j]?.[k]?.a;
      if (!a || !a.kto || !a.data || !a.metoda || !a.sha || !WYNIKI_A.includes(a.wynik) || !METODY_A.includes(a.metoda)) { braki.push(k); bezWpisu++; }
      else if (a.wynik !== 'zgodny') { niezgodne.push(k); bezWpisu++; }
      else if (a.sha !== skrotKlucza(w)) { nieaktualne.push(k); bezWpisu++; }
    }
    if (wydanie) {
      const e = (m, l) => l.length && bledy.push(`${j}: kontrola (a) treści krytycznej — ${m} dla ${l.join(', ')}`);
      e('brak wpisu', braki); e('wpis nieaktualny (tekst zmieniony po kontroli)', nieaktualne); e('wynik niezgodny', niezgodne);
    }
  }
  if (!wydanie && bezWpisu) uwagi.push(`kontrola (a) treści krytycznej: ${bezWpisu} z ${par} par język × klucz bez ważnego wpisu (sprawdz-i18n --wydanie traktuje to jako błąd; stan: docs/lokalizacja/przeglad-krytyczne.json)`);
  return { bledy, uwagi };
}

const AKC = Object.fromEntries([...'aceinorsuyzACEINORSUYZ'].map((c, i) => [c, 'àçéîñöŕšûýžÀÇÉÎÑÖŔŠÛÝŽ'[i]]));
export function pseudo(s) { // akcenty, wydłużenie według tabeli W3C, nawiasy; parametry nietknięte
  let n = 0, w = '', od = 0;
  const zmien = (x) => x.replace(/\p{L}/gu, (c) => (n++, AKC[c] ?? c));
  for (const m of s.matchAll(new RegExp(`${ZN.source}|${TW.source}`, 'g'))) { w += zmien(s.slice(od, m.index)) + m[0]; od = m.index + m[0].length; }
  w += zmien(s.slice(od));
  const x = n <= 10 ? 2 : n <= 20 ? 1.8 : n <= 30 ? 1.6 : n <= 50 ? 1.4 : n <= 70 ? 1.5 : 1.3;
  return `⟦${w}${'~'.repeat(Math.ceil(n * (x - 1)))}⟧`;
}

const pliki = (k, w = []) => {
  for (const f of readdirSync(k)) { const p = join(k, f); statSync(p).isDirectory() ? !['node_modules', '__tests__'].includes(f) && pliki(p, w) : /\.[jt]sx?$/.test(f) && !/\.(test|spec)\./.test(f) && w.push(p); }
  return w;
};
export function skanujKod(ts, katalogi, wyjatki = {}) {
  const uzyte = new Map(), teksty = [], dynamiczne = [], sklejenia = [], pomin = Object.keys(wyjatki.pliki || {});
  const pominiety = (p) => { const r = relative(process.cwd(), p).split(sep).join('/'); return pomin.some((w) => r === w || r.startsWith(`${w}/`)); };
  for (const plik of katalogi.flatMap((k) => pliki(k)).filter((p) => !pominiety(p))) {
    const zr = ts.createSourceFile(plik, readFileSync(plik, 'utf8'), ts.ScriptTarget.Latest, true, /(x|\.js)$/.test(plik) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const gdzie = (n) => `${relative(process.cwd(), plik)}:${zr.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
    const lit = (n) => n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n));
    const st = (n) => !n ? [] : ts.isJsxExpression(n) || ts.isParenthesizedExpression(n) ? st(n.expression) : ts.isConditionalExpression(n) ? [...st(n.whenTrue), ...st(n.whenFalse)]
      : lit(n) ? [n.text] : ts.isTemplateExpression(n) ? [[n.head, ...n.templateSpans.map((x) => x.literal)].map((x) => x.text).join('…')] : [];
    const tekst = (s) => /\p{L}{2,}/u.test(s) && !(wyjatki.wartosci || []).includes(s.trim());
    const wT = (n) => ts.isCallExpression(n) && (ts.isIdentifier(n.expression) ? n.expression.text === 't' : ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 't');
    const dodaj = (n, s, blad) => teksty.push({ gdzie: gdzie(n), tekst: s.trim(), blad });
    const odwiedz = (n) => {
      const nazwa = (ts.isJsxAttribute(n) || ts.isPropertyAssignment(n)) && n.name.getText(zr);
      if (ts.isJsxText(n) && tekst(n.text)) dodaj(n, n.text, true);
      if (ts.isJsxExpression(n) && !ts.isJsxAttribute(n.parent)) for (const s of st(n)) if (tekst(s)) dodaj(n, s, true);
      if (PROPSY.has(nazwa)) for (const s of st(n.initializer)) if (tekst(s)) dodaj(n, s, ts.isJsxAttribute(n));
      if (ts.isCallExpression(n) && /Alert\.alert$/.test(n.expression.getText(zr))) for (const a of n.arguments) for (const s of st(a)) if (tekst(s)) dodaj(a, s, false);
      if (wT(n)) { let a = n.arguments[0]; if (a && ts.isArrowFunction(a) && ts.isPropertyAccessExpression(a.body)) a = ts.factory.createStringLiteral(a.body.getText(zr).split('.').slice(1).join('.')); lit(a) ? uzyte.has(a.text) || uzyte.set(a.text, gdzie(n)) : a && dynamiczne.push(`${gdzie(n)} t(${a.getText(zr)})`); }
      if (nazwa === 'i18nKey' && lit(n.initializer)) uzyte.set(n.initializer.text, gdzie(n));
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken && [n.left, n.right].some(wT) && [n.left, n.right].some((x) => wT(x) || (lit(x) && tekst(x.text)))) sklejenia.push(gdzie(n));
      ts.forEachChild(n, odwiedz);
    };
    odwiedz(zr);
  }
  return { uzyte, teksty, dynamiczne, sklejenia };
}

function main(argv) {
  const o = { _: [] }, czytaj = (p) => JSON.parse(readFileSync(p, 'utf8')), slowniki = {};
  for (let i = 0; i < argv.length; i++) argv[i] === '--wydanie' ? (o.wydanie = true) : argv[i].startsWith('--') ? (o[argv[i].slice(2)] = argv[++i]) : o._.push(argv[i]);
  const [kat] = o._, zrodlo = o.zrodlo;
  if (!kat || !zrodlo) { console.log('Użycie: patrz nagłówek pliku'); return 2; }
  if ((o.wydanie || o.krytyczne || o.przeglad) && !(o.krytyczne && o.przeglad)) { console.log(o.wydanie ? 'BŁĄD konfiguracji: --wydanie wymaga --krytyczne i --przeglad (kontrola treści krytycznej, DEC-11 a)' : 'BŁĄD konfiguracji: --krytyczne i --przeglad idą parą'); return 2; }
  for (const f of readdirSync(kat)) if (/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$/.test(f)) slowniki[f.slice(0, -5)] = splaszcz(czytaj(join(kat, f)));
  if (!slowniki[zrodlo]) { console.log(`BŁĄD konfiguracji: brak ${zrodlo}.json w ${kat}`); return 2; }
  const wyjatki = o.wyjatki ? czytaj(o.wyjatki) : {}, pk = join(kat, `${zrodlo}.kontekst.json`), zr = wpisy(slowniki[zrodlo]);
  const oczekujace = o.oczekujace ? czytaj(o.oczekujace).klucze ?? [] : [];
  const { bledy, uwagi } = sprawdzSlowniki(slowniki, zrodlo, { wyjatki, kontekst: existsSync(pk) ? splaszcz(czytaj(pk)) : null, oczekujace });
  if (o.wydanie && oczekujace.length) bledy.push(`wydanie: oczekujace.json niepusta (${oczekujace.length} kluczy) — fala przekładu przed wydaniem (P-320, P-357)`);
  let krytyczne = null;
  if (o.krytyczne) {
    try { krytyczne = sprawdzKrytyczne(slowniki, zrodlo, czytaj(o.krytyczne), czytaj(o.przeglad), { wydanie: !!o.wydanie }); } catch (e) { console.log(`BŁĄD konfiguracji: ${o.krytyczne} / ${o.przeglad}: ${e.message}`); return 2; }
    bledy.push(...krytyczne.bledy); uwagi.push(...krytyczne.uwagi);
    if (o.skrot) for (const k of Object.keys(czytaj(o.krytyczne).klucze ?? {})) { const w = wpisy(slowniki[o.skrot] ?? {})[k]; if (w) console.log(`${o.skrot} ${k} ${skrotKlucza(w)}`); }
  }
  let kod = 0;
  if (o.kod) {
    let ts;
    // typescript: najpierw z projektu (katalog roboczy), potem z repo tego skryptu — w CI nie ma globalnego typescript (rola 07, 2026-10-25: test przechodził lokalnie tylko dzięki NODE_PATH kontenera).
    for (const baza of [resolve('package.json'), import.meta.url]) { try { ts = createRequire(baza)('typescript'); break; } catch { /* następna baza */ } }
    if (!ts) { console.log('BŁĄD konfiguracji: brak pakietu typescript w projekcie; skan kodu niewykonany'); kod = 2; }
    const brak = o.kod.split(',').filter((k) => !existsSync(k));
    if (brak.length) { console.log(`BŁĄD konfiguracji: brak katalogu ${brak.join(', ')}; skan kodu niewykonany`); kod = 2; }
    const zbedne = Object.keys(wyjatki.pliki || {}).filter((w) => !existsSync(w));
    if (zbedne.length) { console.log(`BŁĄD konfiguracji: wyjątek pliki na nieistniejącą ścieżkę ${zbedne.join(', ')}; skan kodu niewykonany`); kod = 2; }
    if (ts && !brak.length && !zbedne.length) {
      const s = skanujKod(ts, o.kod.split(','), wyjatki);
      for (const [k, g] of s.uzyte) if (!zr[k] && !(wyjatki.klucze || []).includes(k)) bledy.push(`kod ${g}: klucza „${k}” nie ma w ${zrodlo}.json`);
      for (const t of s.teksty) (t.blad ? bledy : uwagi).push(`kod ${t.gdzie}: tekst na sztywno „${t.tekst}”`);
      for (const d of s.dynamiczne) uwagi.push(`kod ${d}: klucz dynamiczny, sprawdź listę wartości`);
      for (const g of s.sklejenia) uwagi.push(`kod ${g}: sklejanie tekstów, użyj parametru`);
      const nu = Object.keys(zr).filter((k) => !s.uzyte.has(k));
      if (nu.length && !s.dynamiczne.length) uwagi.push(`${nu.length} kluczy nieużywanych w kodzie (np. ${nu.slice(0, 5).join(', ')})`);
    }
  }
  if (o.pseudo) writeFileSync(o.pseudo, JSON.stringify(Object.fromEntries(Object.entries(slowniki[zrodlo]).map(([k, v]) => [k, pseudo(v)])), null, 2) + '\n');
  for (const b of bledy) console.log('BŁĄD', b);
  for (const u of uwagi) console.log('UWAGA', u);
  console.log(`błędy: ${bledy.length}, uwagi: ${uwagi.length}; języki: ${Object.keys(slowniki).sort().join(', ')}; kluczy w źródle: ${Object.keys(zr).length}`);
  return kod || (bledy.length ? 1 : 0);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
