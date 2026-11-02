#!/usr/bin/env node
// Sprawdzanie adresów wydania (P-349 (3); analogia: Trening `scripts/check-urls.mjs`, P-315). Każdy adres wpisany w aplikację
// (`src/kompozycja/adresy.ts`), w metadane sklepu (`docs/wydanie/metadane/*`) i w `docs/wydanie/adres-strony.json` musi zwracać 200,
// a strony Oczka pod bazą (polityka, wsparcie) muszą mieć na żywo tę samą treść co `site/`. Strona marki (apps4brew.com/oczko/) jest
// w osobnym repo `apps4brew-www` z kopią `site/` — rozjazd = brak strony albo stara treść u recenzenta (wytyczna 1.5: Support URL
// „must lead to actual contact information”; 5.1.1(i): polityka dostępna).
// NIE jest częścią `npm run verify` (verify działa bez sieci). Workflow: `.github/workflows/sprawdz-adresy.yml` (ręcznie, Linux).
// Użycie: node scripts/wydanie/sprawdz-adresy.mjs [--tylko-statusy] [--wydanie]
//   --tylko-statusy  bez porównania treści ze `site/`
//   --wydanie        zaślepka identyfikatora App Store (id0000000000) w adresie recenzji jest błędem (domyślnie: pominięta z komunikatem;
//                    w buildzie pilnuje jej scripts/wydanie/kontrola-adresow.mjs)
// Kod wyjścia: 0 = wszystko zgodne, 1 = niezgodność albo adres nie zwraca 200.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const ENCJE = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const dekoduj = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENCJE[e.toLowerCase()] ?? m));
/** Tekst bez znaczników, z zwiniętymi odstępami (jednakowo dla źródła i strony na żywo). */
export const tekst = (html) => dekoduj(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Identyfikator App Store złożony z samych zer to zaślepka (OP-24: prawdziwe Apple ID wpisuje rola 10 po kroku A5). */
export const zaslepka = (url) => /apps\.apple\.com\/[^?#]*\bid0+(?:[?#/]|$)/.test(url);

const URL_W_TEKSCIE = /https:\/\/[^\s"'<>)\]]+/g;
const bezKonca = (u) => u.replace(/[.,;:!?]+$/, '');

function zbierz(wartosc, zrodlo, wyj) {
  if (typeof wartosc === 'string') { for (const m of wartosc.matchAll(URL_W_TEKSCIE)) wyj.push([bezKonca(m[0]), zrodlo]); }
  else if (Array.isArray(wartosc)) wartosc.forEach((w, i) => zbierz(w, `${zrodlo}[${i}]`, wyj));
  else if (wartosc && typeof wartosc === 'object') for (const [k, v] of Object.entries(wartosc)) if (!k.startsWith('_')) zbierz(v, `${zrodlo}.${k}`, wyj);
}

/** Adresy z adres-strony.json, ADRESY w src/kompozycja/adresy.ts i plików metadanych (json: pola i opisy, txt: notatki). Bez powtórzeń. */
export function adresy(root = ROOT) {
  const wyj = [];
  const strona = JSON.parse(readFileSync(join(root, 'docs/wydanie/adres-strony.json'), 'utf8'));
  // `baza` to przedrostek, nie adres używany w aplikacji ani w sklepie (strona główna /oczko/ nie jest opublikowana w apps4brew-www, 404 — 2026-11-02);
  // sprawdzamy ją, gdy trafi do metadanych (np. Marketing URL), bo wtedy zbiera ją skan metadanych.
  wyj.push([strona.baza + strona.polityka, 'docs/wydanie/adres-strony.json polityka'], [strona.baza + strona.wsparcie, 'docs/wydanie/adres-strony.json wsparcie']);
  const ts = join(root, 'src/kompozycja/adresy.ts');
  if (existsSync(ts)) for (const m of readFileSync(ts, 'utf8').matchAll(/^\s*(\w+):\s*'(https:\/\/[^']+)'/gm)) wyj.push([m[2], `src/kompozycja/adresy.ts ADRESY.${m[1]}`]);
  const kat = join(root, 'docs/wydanie/metadane');
  for (const n of existsSync(kat) ? readdirSync(kat).sort() : []) {
    const rel = `docs/wydanie/metadane/${n}`;
    if (n.endsWith('.json')) zbierz(JSON.parse(readFileSync(join(kat, n), 'utf8')), rel, wyj);
    else if (n.endsWith('.txt')) zbierz(readFileSync(join(kat, n), 'utf8'), rel, wyj);
  }
  const wid = new Map();
  for (const [url, zrodlo] of wyj) if (!wid.has(url)) wid.set(url, zrodlo);
  return [...wid.entries()].map(([url, zrodlo]) => ({ url, zrodlo }));
}

/** Fragmenty tekstu strony źródłowej site/*.html (sekcje pl i en: h2, h3, p, li; bez h1 i znacznika marki), które muszą być na stronie na żywo. */
export function fragmenty(html) {
  const out = [];
  for (const sec of html.matchAll(/<section lang="(pl|en)"[^>]*>([\s\S]*?)<\/section>/g)) {
    const body = sec[2].replace(/<h1[\s\S]*?<\/h1>/g, '').replace(/<p class="brand"[\s\S]*?<\/p>/g, '');
    for (const b of body.matchAll(/<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)) { const t = tekst(b[2]); if (t) out.push(`${sec[1]}: ${t}`); }
  }
  return out;
}
/** Które fragmenty źródła nie występują w tekście strony na żywo (pusta lista = zgodne). */
export function brakujace(zrodloHtml, zywaHtml) {
  const zywy = tekst(zywaHtml);
  return fragmenty(zrodloHtml).filter((f) => !zywy.includes(f.slice(f.indexOf(': ') + 2)));
}

async function pobierz(url) {
  let ost;
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'oczko-sprawdz-adresy' } }); return { status: r.status, html: r.status === 200 ? await r.text() : '' }; }
    catch (e) { ost = e; await new Promise((s) => setTimeout(s, 1500)); }
  }
  return { status: 0, html: '', blad: String(ost?.message ?? ost).slice(0, 120) };
}

/** Plik źródłowy site/ dla adresu pod bazą: `<baza>nazwa.html` → site/nazwa.html (brak pliku = błąd); sama baza → site/index.html (brak = pomijamy). */
function plikZrodlowy(url, baza, root) {
  if (!url.startsWith(baza)) return null;
  const reszta = url.slice(baza.length);
  if (reszta === '') return existsSync(join(root, 'site/index.html')) ? { plik: join(root, 'site/index.html'), nazwa: 'site/index.html' } : null;
  if (/^[\w-]+\.html$/.test(reszta)) return { plik: join(root, 'site', reszta), nazwa: `site/${reszta}` };
  return null;
}

export async function main(argv = process.argv.slice(2), root = ROOT, pobierzFn = pobierz) {
  const tylkoStatusy = argv.includes('--tylko-statusy'), wydanie = argv.includes('--wydanie');
  const baza = JSON.parse(readFileSync(join(root, 'docs/wydanie/adres-strony.json'), 'utf8')).baza;
  let zle = 0;
  for (const { url, zrodlo } of adresy(root)) {
    const wiersze = [];
    if (zaslepka(url)) {
      if (wydanie) { zle++; console.log(`BŁĄD ${url}  [${zrodlo}]\n     zaślepka identyfikatora App Store (id0000000000): wpisz Apple ID z App Store Connect`); }
      else console.log(`POMINIĘTO ${url}  [${zrodlo}]\n     zaślepka identyfikatora App Store (id0000000000) — w buildzie pilnuje jej scripts/wydanie/kontrola-adresow.mjs; --wydanie uznaje ją za błąd`);
      continue;
    }
    const r = await pobierzFn(url);
    if (r.status !== 200) wiersze.push(`status ${r.status}${r.blad ? ` (${r.blad})` : ''}`);
    else if (!tylkoStatusy) {
      const z = plikZrodlowy(url, baza, root);
      if (z) {
        if (!existsSync(z.plik)) wiersze.push(`brak pliku źródłowego ${z.nazwa}`);
        else {
          const brak = brakujace(readFileSync(z.plik, 'utf8'), r.html);
          if (brak.length) wiersze.push(`treść na żywo różni się od ${z.nazwa}: brak ${brak.length} fragmentów, np. „${brak[0].slice(0, 90)}”`);
        }
      }
    }
    console.log(`${wiersze.length ? 'BŁĄD' : 'OK  '} ${url}  [${zrodlo}]${wiersze.length ? '\n     ' + wiersze.join('\n     ') : ''}`);
    zle += wiersze.length ? 1 : 0;
  }
  console.log(zle ? `\n${zle} adres(y) niezgodne — wydania nie robić (wytyczne 1.5, 5.1.1(i)).` : '\nWszystkie sprawdzone adresy zwracają 200, treść zgodna z site/.');
  return zle ? 1 : 0;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().then((c) => process.exit(c));
