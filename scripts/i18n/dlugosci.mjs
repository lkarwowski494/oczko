#!/usr/bin/env node
// Kontrola długości etykiet: limit „ok. N znaków” z en.kontekst.json vs przekład. Domyślnie bieżące słowniki src/i18n/slowniki/<kod>.json (stan prawdy, po fali 2026-11-03);
// --zrodlo propozycje = stare propozycje fali 1 (docs/lokalizacja/przeklad-api/*.json, pole slownik).
// Orientacyjna (limit w kontekście to „ok.”): znak CJK liczony jako 2 (szerokość). Użycie: node scripts/i18n/dlugosci.mjs [--prog 1.3] [--md plik] [--zrodlo slowniki|propozycje]
// Kod 0 zawsze (raport); ostateczna ocena na zrzutach 320 pt (rola 04).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const splaszcz = (o, p = '', w = {}) => { for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? splaszcz(v, p + k + '.', w) : (w[p + k] = String(v)); return w; };
const a = process.argv.slice(2), prog = Number(a[a.indexOf('--prog') + 1]) || 1.3, md = a.includes('--md') ? a[a.indexOf('--md') + 1] : null;
const zrodlo = a.includes('--zrodlo') ? a[a.indexOf('--zrodlo') + 1] : 'slowniki', propozycje = zrodlo === 'propozycje';
if (!['slowniki', 'propozycje'].includes(zrodlo)) { console.log('BŁĄD: --zrodlo slowniki|propozycje'); process.exit(2); }
const kx = splaszcz(JSON.parse(readFileSync('src/i18n/slowniki/en.kontekst.json', 'utf8')));
const en = splaszcz(JSON.parse(readFileSync('src/i18n/slowniki/en.json', 'utf8')));
const lim = {}; for (const [k, v] of Object.entries(kx)) { const m = v.match(/ok\.\s*(\d+)\s*znak/i); if (m) lim[k] = Number(m[1]); }
const sz = (s) => [...s.replace(/\{\{[^}]*\}\}/g, 'x')].reduce((n, c) => n + (/[぀-ヿ㐀-鿿가-힯＀-￯]/.test(c) ? 2 : 1), 0);
const dir = propozycje ? 'docs/lokalizacja/przeklad-api' : 'src/i18n/slowniki', wyn = [];
for (const f of readdirSync(dir).filter((f) => /^[A-Za-z0-9-]+\.json$/.test(f) && f !== 'en.json' && !f.includes('.kontekst.')).sort()) {
  const j = f.slice(0, -5), surowy = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')), t = propozycje ? surowy.slownik : splaszcz(surowy); let n = 0; const zle = [];
  for (const [k, v] of Object.entries(t)) { const b = k.replace(/_(zero|one|two|few|many|other)$/, ''), l = lim[b]; if (!l) continue; n++; const d = sz(v); if (d > l * prog) zle.push(`${k} ${d}/${l}`); }
  wyn.push({ j, n, zle });
}
const L = ['# Długości etykiet wobec limitu z kontekstu (orientacyjnie)', '', `Źródło: ${dir}${propozycje ? '/*.json (propozycje fali 1)' : '/<kod>.json (bieżące słowniki)'}. Próg: > ${prog} × „ok. N znaków”; CJK liczone jako 2. Kluczy z limitem: ${Object.keys(lim).length}. Ostateczna ocena: zrzuty 320 pt (04).`, '', '| język | kluczy z limitem | ponad próg | przykłady |', '|---|---|---|---|'];
for (const r of wyn) L.push(`| ${r.j} | ${r.n} | ${r.zle.length} | ${r.zle.slice(0, 6).join('; ')} |`);
console.log(L.join('\n')); if (md) writeFileSync(md, L.join('\n') + '\n');
