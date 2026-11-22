#!/usr/bin/env node
// Układ podpisów na ramkach zrzutów App Store (ramki-sklepu.sh). Rola 10-wydanie, KO-032 (10.11.2026: „Ma być jak w Treningu”).
// Przeniesione z Treningu: trening:scripts/ci/store-caption-layout.mjs (main, odczyt 10.11.2026), dopasowane do Oczka: nazwa i ścieżki, brak zmian w algorytmie.
// Dlaczego algorytm, a nie `caption:` ImageMagicka (trening:store-caption-layout.mjs:2-4, przegląd przebiegu 40942847798): `caption:` dobiera rozmiar czcionki osobno
// dla każdego obrazu i łamie tylko na spacjach — w jednym języku podpisy miałyby różne rozmiary, pojedyncze słowo lądowałoby w trzecim wierszu, a japoński i chiński
// (bez spacji) byłyby cięte w środku słowa.
// Teraz: jeden rozmiar czcionki na język (największy, przy którym każdy podpis mieści się w polu w 1 albo 2 wierszach), podział na 2 wiersze wyrównane szerokością,
// tylko między słowami; ja i zh-Hant dzielone przez Intl.Segmenter; interpunkcja i w japońskim cząstki hiraganą doklejone do poprzedniego słowa.
// Użycie: node scripts/ci/uklad-podpisow.mjs <plik_podpisów> <język> <czcionka> <szerokość_pola> <wysokość_pola>
//   → stdout JSON {"pointsize": P, "podpisy": {"<ekran>": "wiersz 1\nwiersz 2"}}; pomiar tekstu: ImageMagick `convert … label:` (szerokość i wysokość przy 100 pt).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const NO_SPACES = new Set(['ja', 'zh-Hant']);
/** Znaki, od których wiersz nie może się zaczynać (interpunkcja zamykająca; japońskie i chińskie zasady łamania) — trening:store-caption-layout.mjs:14. */
export const NO_LINE_START = /^[、。，．,.!?！？:：;；)）\]」』…・ー]+$/u;
/** Podział zaraz po przecinku, pytajniku albo myślniku ma pierwszeństwo (jeśli mieści się w rozmiarze języka) — nie rozdziela fraz (trening:store-caption-layout.mjs:16-17). */
const AFTER_PUNCT = /[,，、?？:：;；—–]$/u;
const HIRAGANA_ONLY = /^[ぁ-ゟ]+$/u;

/** Słowa (jednostki, między którymi wolno złamać wiersz) wraz z separatorem, który je poprzedza. */
export function tokens(lang, text) {
  if (!NO_SPACES.has(lang)) return text.split(/ +/).filter(Boolean).map((w, i) => ({ w, sep: i ? ' ' : '' }));
  const out = []; let sep = '';
  for (const { segment } of new Intl.Segmenter(lang, { granularity: 'word' }).segment(text)) {
    if (segment.trim() === '') { sep = ' '; continue; } // spacja zostaje separatorem przed następnym słowem
    const glue = out.length && !sep && (NO_LINE_START.test(segment) || (lang === 'ja' && HIRAGANA_ONLY.test(segment)));
    if (glue) out[out.length - 1].w += segment; else out.push({ w: segment, sep });
    sep = '';
  }
  return out;
}

/** Kandydaci układu: jeden wiersz i każdy podział na dwa wiersze między słowami. */
export function layouts(toks) {
  const join = a => a.map((t, i) => (i ? t.sep : '') + t.w).join('');
  const out = [join(toks)];
  // Bez podziału zaraz po jednoliterowym słowie („a”, „i”, „w”, „z” — w pl, cs, sk, hr błąd składu; trening:store-caption-layout.mjs:37).
  for (let i = 1; i < toks.length; i++) if (!/^\p{L}$/u.test(toks[i - 1].w)) out.push(`${join(toks.slice(0, i))}\n${join(toks.slice(i))}`);
  return out;
}

/** Największy rozmiar (pt), przy którym tekst mieści się w polu W×H — pomiar przy 100 pt skaluje się liniowo. */
export const fit = ({ w, h }, W, H) => Math.floor(100 * Math.min(W / w, H / h));

/**
 * Wybór rozmiaru języka i układu każdego podpisu. `measure(text)` → {w, h} przy 100 pt.
 * Rozmiar języka = najmniejszy z najlepszych rozmiarów jego podpisów; przy nim podpis bierze jeden wiersz, jeśli się mieści,
 * inaczej podział po znaku interpunkcyjnym, a w dalszej kolejności najwęższy (trening:store-caption-layout.mjs:45-61).
 */
export function plan(lang, captions, W, H, measure) {
  const opts = Object.fromEntries(Object.entries(captions).map(([k, text]) =>
    [k, layouts(tokens(lang, text)).map(t => ({ t, f: fit(measure(t), W, H), w: measure(t).w }))]));
  const pointsize = Math.min(...Object.values(opts).map(o => Math.max(...o.map(x => x.f))));
  const podpisy = {};
  for (const [k, o] of Object.entries(opts)) {
    const ok = o.filter(x => x.f >= pointsize);
    const poZnaku = ok.filter(x => AFTER_PUNCT.test(x.t.split('\n')[0] ?? ''));
    podpisy[k] = (ok.find(x => !x.t.includes('\n')) ?? (poZnaku.length ? poZnaku : ok).sort((a, b) => a.w - b.w)[0]).t;
  }
  return { pointsize, podpisy };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [file, lang, font, W, H] = process.argv.slice(2);
  const caps = JSON.parse(readFileSync(file, 'utf8')).podpisy[lang] ?? {};
  if (!Object.keys(caps).length) { console.error(`brak podpisów dla języka ${lang}`); process.exit(3); }
  const cache = new Map();
  const measure = t => {
    if (!cache.has(t)) {
      const [w, h] = execFileSync('convert', ['-font', font, '-pointsize', '100', `label:${t}`, '-format', '%w %h', 'info:'], { encoding: 'utf8' }).trim().split(' ').map(Number);
      cache.set(t, { w, h });
    }
    return cache.get(t);
  };
  process.stdout.write(JSON.stringify(plan(lang, caps, Number(W), Number(H), measure)));
}
