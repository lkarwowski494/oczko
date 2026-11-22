// rachunek.mjs — wpływ, próg pokrycia kosztów i lejek z danych wejściowych (rola 02-monetyzacja).
// node rachunek.mjs dane.json   · kod wyjścia: 0 wynik, 1 błędne dane, 2 złe wywołanie
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = /\d{4}-\d{2}-\d{2}/;
const zl = (x) => x.toFixed(2).replace('.', ',');
const pct = (x) => String(Math.round(x * 1000) / 10).replace('.', ',');

export function sprawdz(d) {
  const b = [];
  const ulamek = (x, g) => { if (typeof x !== 'number' || !(x >= 0 && x < 1)) b.push(`${g}: oczekiwany ułamek z przedziału [0; 1), jest ${JSON.stringify(x)}`); };
  const zrodlo = (z, g, zData) => {
    if (typeof z !== 'string' || !z.trim()) b.push(`${g}: brak źródła`);
    else if (zData && !DATA.test(z)) b.push(`${g}: źródło bez daty odczytu RRRR-MM-DD`);
  };
  const dodatnia = (x, g) => { if (!(typeof x === 'number' && x > 0)) b.push(`${g}: musi być > 0`); };
  if (!DATA.test(d?.data ?? '')) b.push('data: brak daty RRRR-MM-DD');
  if (typeof d?.waluta !== 'string') b.push('waluta: brak');
  for (const k of ['vat', 'prowizja']) { ulamek(d?.[k]?.stawka, `${k}.stawka`); zrodlo(d?.[k]?.zrodlo, k, true); }
  for (const [w, k] of Object.entries(d?.kursy ?? {})) { dodatnia(k?.kurs, `kursy.${w}`); zrodlo(k?.zrodlo, `kursy.${w}`, true); }
  for (const [i, k] of (d?.koszty_roczne ?? []).entries()) {
    dodatnia(k?.kwota, `koszty_roczne[${i}].kwota`); zrodlo(k?.zrodlo, `koszty_roczne[${i}]`, true);
    if (k?.waluta !== d?.waluta && !d?.kursy?.[k?.waluta]) b.push(`koszty_roczne[${i}]: brak kursu ${k?.waluta}`);
  }
  if (!Array.isArray(d?.produkty)) b.push('produkty: brak listy (pusta lista = model bez opłat)');
  for (const [i, p] of (Array.isArray(d?.produkty) ? d.produkty : []).entries()) {
    dodatnia(p?.cena_brutto, `produkty[${i}].cena_brutto`);
    if (p?.prowizja) { ulamek(p.prowizja.stawka, `produkty[${i}].prowizja.stawka`); zrodlo(p.prowizja.zrodlo, `produkty[${i}].prowizja`, true); }
    if (p?.wplyw_z_asc != null) { dodatnia(p.wplyw_z_asc, `produkty[${i}].wplyw_z_asc`); zrodlo(p.wplyw_zrodlo, `produkty[${i}].wplyw_zrodlo`, true); }
    if (p?.platnosci_w_roku != null) { dodatnia(p.platnosci_w_roku, `produkty[${i}].platnosci_w_roku`); zrodlo(p.platnosci_zrodlo, `produkty[${i}].platnosci_zrodlo`); }
  }
  for (const [i, s] of (d?.lejek ?? []).entries()) {
    if (!(s?.odslony_strony >= 0)) b.push(`lejek[${i}].odslony_strony: musi być ≥ 0`);
    ulamek(s?.konwersja, `lejek[${i}].konwersja`); ulamek(s?.zakup, `lejek[${i}].zakup`); zrodlo(s?.zrodlo, `lejek[${i}]`);
    if (!(Array.isArray(d?.produkty) && d.produkty.some((p) => p.id === s?.produkt))) b.push(`lejek[${i}]: nieznany produkt ${s?.produkt}`);
  }
  return b;
}

export function rachunek(d) {
  const koszty = (d.koszty_roczne ?? []).reduce((s, k) => s + k.kwota * (k.waluta === d.waluta ? 1 : d.kursy[k.waluta].kurs), 0);
  const produkty = d.produkty.map((p) => {
    const bezVat = p.cena_brutto / (1 + d.vat.stawka);
    const stawka = (p.prowizja ?? d.prowizja).stawka;
    const szacunek = bezVat * (1 - stawka); // prowizja od ceny bez podatków
    const wplyw = p.wplyw_z_asc ?? szacunek;
    const rocznie = wplyw * (p.platnosci_w_roku ?? 1);
    return { id: p.id, cena: p.cena_brutto, bezVat, stawka, szacunek, wplyw, zAsc: p.wplyw_z_asc != null, rocznie, prog: Math.ceil(koszty / rocznie - 1e-9) };
  });
  const lejek = (d.lejek ?? []).map((s) => {
    const p = produkty.find((x) => x.id === s.produkt);
    const placacy = s.odslony_strony * s.konwersja * s.zakup;
    return { nazwa: s.nazwa, placacy, przychod: placacy * p.rocznie, pokrycie: koszty > 0 ? (placacy * p.rocznie) / koszty : null };
  });
  return { koszty, produkty, lejek };
}

export function opis(d, w) {
  const l = [`Rachunek z ${d.data} (${d.waluta}); VAT ${pct(d.vat.stawka)}% [${d.vat.zrodlo}]; prowizja ${pct(d.prowizja.stawka)}% [${d.prowizja.zrodlo}]`];
  for (const k of d.koszty_roczne ?? []) l.push(`Koszt roczny: ${k.nazwa} ${k.kwota} ${k.waluta}${k.waluta === d.waluta ? '' : ` × ${String(d.kursy[k.waluta].kurs).replace('.', ',')} [${d.kursy[k.waluta].zrodlo}]`}`);
  l.push(`Koszty roczne razem: ${zl(w.koszty)} ${d.waluta}`);
  if (!w.produkty.length) l.push(`Model bez opłat: koszt roczny ${zl(w.koszty)} ${d.waluta}, wpływ 0`);
  for (const p of w.produkty) {
    const skad = p.zAsc ? `z App Store Connect; szacunek ${zl(p.szacunek)}` : 'szacunek; porównaj z wpływem z App Store Connect';
    l.push(`${p.id}: cena ${zl(p.cena)} → bez VAT ${zl(p.bezVat)} → prowizja ${pct(p.stawka)}% → wpływ ${zl(p.wplyw)} (${skad}); rocznie na płacącego ${zl(p.rocznie)}; próg: ${p.prog} płacących/rok`);
  }
  for (const s of w.lejek) l.push(`Lejek „${s.nazwa}”: płacący ${s.placacy.toFixed(1).replace('.', ',')} → wpływ ${zl(s.przychod)} ${d.waluta}/rok${s.pokrycie == null ? '' : ` → pokrycie kosztów ${Math.round(s.pokrycie * 100)}%`}`);
  l.push('Bez podatku dochodowego i składek; przybliżenie z danych wejściowych, nie prognoza.');
  return l.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [plik] = process.argv.slice(2);
  if (!plik) { console.error('Użycie: node rachunek.mjs dane.json'); process.exit(2); }
  let d;
  try { d = JSON.parse(readFileSync(plik, 'utf8')); } catch (e) { console.error(`BŁĄD: ${e.message}`); process.exit(1); }
  const bledy = sprawdz(d);
  if (bledy.length) { for (const x of bledy) console.error(`BŁĄD ${x}`); process.exit(1); }
  console.log(opis(d, rachunek(d)));
}
