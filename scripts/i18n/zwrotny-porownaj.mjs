#!/usr/bin/env node
// Zestawienie do porównania sensu (kontrola (a) treści krytycznej, P-498): dla każdego klucza krytycznego en, a pod nim przekład zwrotny na pl każdego języka z raportu trybu `zwrotny`
// (katalog artefaktu raport-zwrotny). Kontrole maszynowe jako FLAGA: PARAMETRY (przekład zwrotny zmienia {{parametr}} albo znacznik wobec en), PARAMETRY-JEZYKA (sam tekst języka ma inne
// parametry niż en), LICZBY (liczby w przekładzie zwrotnym ≠ en; 10,16 ≡ 10.16), BRAK (pozycja bez przekładu), SHA (tekst języka zmieniony po przebiegu). Sens czyta człowiek/rola 06.
// Użycie: node scripts/i18n/zwrotny-porownaj.mjs <katalog raportu> [--jezyki bg,cs] [--slowniki src/i18n/slowniki] [--krytyczne docs/lokalizacja/krytyczne.json] 
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wpisy, skrotKlucza } from '../sprawdz-i18n.mjs';
import { splaszcz } from './przeklad-api.mjs';

const KORZEN = fileURLToPath(new URL('../..', import.meta.url));
const CZYTAJ = (p) => JSON.parse(readFileSync(p, 'utf8'));
const PARAM = /\{\{\s*([^{}\s,]+)[^{}]*\}\}|<\/?\w+\s*\/?>/g;
const teksty = (w) => (w.formy ? Object.values(w.formy) : [w.tekst]);
const parametry = (ts) => [...new Set(ts.flatMap((t) => [...String(t).matchAll(PARAM)].map((m) => m[0].replace(/\s+/g, ''))))].sort().join(' ');
const liczby = (ts) => [...new Set(ts.flatMap((t) => (String(t).replace(PARAM, ' ').match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => String(Number(x.replace(',', '.'))))))].sort().join(',');
export const poprawna = (ts) => ts.filter((t) => typeof t === 'string');

/** Flagi kontroli maszynowych dla jednej pozycji raportu: { klucz, flagi: [kod…] }. */
export function flagi(wpisEn, wpisJezyka, poz) {
  const f = [], en = teksty(wpisEn);
  const plT = poz.pl === null || poz.pl === undefined ? null : poprawna(typeof poz.pl === 'string' ? [poz.pl] : Object.values(poz.pl));
  if (!plT?.length) f.push('BRAK');
  if (!wpisJezyka || poz.sha !== skrotKlucza(wpisJezyka)) f.push('SHA');
  if (wpisJezyka && parametry(teksty(wpisJezyka)) !== parametry(en)) f.push('PARAMETRY-JEZYKA');
  if (plT?.length) { if (parametry(plT) !== parametry(en)) f.push('PARAMETRY'); if (liczby(plT) !== liczby(en)) f.push('LICZBY'); }
  return f;
}

export function wczytaj(katalog, { slowniki = join(KORZEN, 'src/i18n/slowniki'), jezyki = null } = {}) {
  const pliki = readdirSync(katalog).filter((f) => f.endsWith('.json') && f !== 'szacunek.json').map((f) => f.slice(0, -5)).filter((k) => !jezyki || jezyki.includes(k)).sort();
  const en = wpisy(splaszcz(CZYTAJ(join(slowniki, 'en.json'))));
  return { en, raporty: pliki.map((k) => ({ ...CZYTAJ(join(katalog, `${k}.json`)), slownik: wpisy(splaszcz(CZYTAJ(join(slowniki, `${k}.json`)))) })) };
}

export function main(argv, log = console.log) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) argv[i].startsWith('--') ? (o[argv[i].slice(2)] = argv[++i]) : o._.push(argv[i]);
  if (!o._[0]) { log('BŁĄD: podaj katalog raportu (artefakt raport-zwrotny)'); return 2; }
  const { en, raporty } = wczytaj(resolve(o._[0]), { slowniki: o.slowniki && resolve(o.slowniki), jezyki: o.jezyki?.split(',') });
  const klucze = Object.keys(CZYTAJ(resolve(o.krytyczne ?? join(KORZEN, 'docs/lokalizacja/krytyczne.json'))).klucze);
  let n = 0;
  for (const k of klucze) {
    log(`\n## ${k}\nEN: ${en[k].formy ? Object.entries(en[k].formy).map(([c, t]) => `${c}: ${t}`).join(' | ') : en[k].tekst}`);
    for (const r of raporty) {
      const p = r.przeklady.find((x) => x.klucz === k); if (!p) { log(`FLAGA ${r.jezyk} ${k}: BRAK`); n++; continue; }
      const fl = flagi(en[k], r.slownik[k], p);
      log(`${r.jezyk}: ${typeof p.pl === 'string' ? p.pl : p.pl ? Object.entries(p.pl).map(([c, t]) => `${c}: ${t}`).join(' | ') : '∅'}`);
      for (const x of fl) { log(`FLAGA ${r.jezyk} ${k}: ${x}`); n++; }
    }
  }
  log(`\nFlag: ${n}; języków: ${raporty.length}; kluczy: ${klucze.length}`);
  return 0;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exitCode = main(process.argv.slice(2));
