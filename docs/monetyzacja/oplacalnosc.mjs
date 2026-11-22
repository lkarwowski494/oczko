// oplacalnosc.mjs — bramka opłacalności (rola 02): scenariusze [pes, norm, opt] per sklep i platforma, werdykt wobec progu, wrażliwość.
// node oplacalnosc.mjs dane.json · kod wyjścia: 0 wynik, 1 błędne dane, 2 złe wywołanie
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sprawdz as sprawdzRachunek, rachunek } from './rachunek.mjs';

const WERDYKT = { build: ['porzucić', 'odłożyć', 'budować'], audit: ['zamrozić albo połączyć', 'przerobić', 'wydać'] };
const ULAMEK = /^(konwersja|udzial|darmowa|jezyk)/;
const zl = (x) => x.toFixed(2).replace('.', ',');
const kurs = (d, w) => ((w ?? d.waluta) === d.waluta ? 1 : d.kursy[w].kurs);
const rs = (d, s) => ({ data: d.data, waluta: s.waluta ?? d.waluta, kursy: d.kursy, vat: s.vat, prowizja: s.prowizja, produkty: s.produkty ?? [s.produkt] });
// plan mieszany (D-028): przychód na płacącego = Σ udział planu × wpływ roczny planu; jeden produkt: udział 1
const naPlacacego = (d, s, k) => rachunek(rs(d, s)).produkty.reduce((a, p, i) => a + p.rocznie * (s.produkty ? s.produkty[i].udzial.s[k] : 1), 0);
// oceny z całego życia ÷ lata od wydania (min. 1)
export const ocenyNaRok = (d, k) => (k ? k.reduce((a, x) => a + x.oceny / Math.max(1, (Date.parse(d.data) - Date.parse(x.wydanie)) / 31557600000), 0) : 1);

export function sprawdz(d) {
  const b = [];
  const zr = (z, g) => { if (typeof z !== 'string' || !z.trim()) b.push(`${g}: brak źródła albo [ZAŁOŻENIE]`); };
  const waluta = (w, g) => { if ((w ?? d.waluta) !== d.waluta && !(d.kursy?.[w]?.kurs > 0)) b.push(`${g}: brak kursu ${w}`); };
  const blok = (x, g) => {
    for (const [i, k] of (x?.konkurenci ?? []).entries()) {
      if (!(typeof k?.oceny === 'number' && k.oceny >= 0) || !/^\d{4}-\d\d-\d\d/.test(k?.wydanie ?? '')) b.push(`${g}.konkurenci[${i}]: oceny ≥ 0 i wydanie RRRR-MM-DD`);
      zr(k?.zrodlo, `${g}.konkurenci[${i}]`);
    }
    if (!Object.keys(x?.zalozenia ?? {}).length) b.push(`${g}: brak założeń`);
    for (const [n, v] of Object.entries(x?.zalozenia ?? {})) {
      zr(v?.zrodlo, `${g}.${n}`);
      const s = v?.s, ul = ULAMEK.test(n);
      if (!Array.isArray(s) || s.length !== 3 || !s.every((y) => typeof y === 'number' && y >= 0 && (!ul || y <= 1))) b.push(`${g}.${n}: oczekiwane s: [pes, norm, opt] ≥ 0${ul ? ' i ≤ 1' : ''}`);
      else if (s[0] > s[1] || s[1] > s[2]) b.push(`${g}.${n}: kolejność pes ≤ norm ≤ opt`);
    }
  };
  if (!WERDYKT[d?.tryb]) b.push('tryb: build albo audit');
  if (d?.prog != null) { if (!Number.isFinite(d.prog.kwota)) b.push('prog.kwota: liczba'); zr(d.prog.zrodlo, 'prog'); waluta(d.prog.waluta, 'prog'); }
  for (const [p, x] of Object.entries(d?.platformy ?? {})) { if (!(x?.koszty_roczne >= 0)) b.push(`${p}.koszty_roczne: liczba ≥ 0`); zr(x?.koszty_zrodlo, `${p}.koszty`); }
  if (!d?.sklepy?.length) b.push('sklepy: co najmniej jeden');
  const nazwy = (d?.sklepy ?? []).map((s) => `${s?.platforma}/${s?.kraj}`);
  for (const [i, s] of (d?.sklepy ?? []).entries()) {
    const g = nazwy[i];
    if (nazwy.indexOf(g) !== i) b.push(`${g}: sklep powtórzony`);
    if (!d.platformy?.[s?.platforma]) b.push(`${g}: brak platformy`);
    waluta(s?.waluta, g);
    if (!s?.produkt === !s?.produkty) b.push(`${g}: dokładnie jedno z „produkt” albo „produkty”`);
    for (const [j, p] of (Array.isArray(s?.produkty) ? s.produkty : []).entries()) {
      zr(p?.udzial?.zrodlo, `${g}.produkty[${j}].udzial`);
      if (!Array.isArray(p?.udzial?.s) || p.udzial.s.length !== 3 || !p.udzial.s.every((y) => typeof y === 'number' && y >= 0 && y <= 1)) b.push(`${g}.produkty[${j}].udzial: s: [pes, norm, opt] w [0; 1]`);
    }
    if (Array.isArray(s?.produkty) && s.produkty.every((p) => p?.udzial?.s?.length === 3)) for (const k of [0, 1, 2]) if (Math.abs(s.produkty.reduce((a, p) => a + p.udzial.s[k], 0) - 1) > 1e-6) b.push(`${g}: udziały planów w scenariuszu ${k} sumują się do 1`);
    for (const e of sprawdzRachunek(rs(d, s ?? {}))) b.push(`${g}: ${e}`);
    blok(s, g);
    if (s?.zastepczo) { zr(s.zastepczo.opis, `${g}.zastepczo.opis`); blok(s.zastepczo, `${g}.zastepczo`); }
    else if (s?.konkurenci && s.konkurenci.reduce((a, k) => a + (k?.oceny || 0), 0) < 50) b.push(`${g}: konkurenci mają łącznie < 50 ocen: dodaj „zastepczo” (interpretacja B)`);
  }
  return b;
}

// k: scenariusz 0–2; zmiana: [„i.nazwa” albo „*.nazwa” (wszystkie sklepy), scenariusz], reszta w k
export function licz(d, k, zmiana) {
  const w = (klucz, v) => v.s[zmiana && [klucz, `*${klucz.slice(klucz.indexOf('.'))}`].includes(zmiana[0]) ? zmiana[1] : k];
  const sklepy = d.sklepy.map((s, i) => {
    const placacy = Object.entries(s.zalozenia).reduce((a, [n, v]) => a * w(`${i}.${n}`, v), ocenyNaRok(d, s.konkurenci));
    return { platforma: s.platforma, placacy, netto: placacy * naPlacacego(d, s, k) * kurs(d, s.waluta) };
  });
  const platformy = Object.entries(d.platformy).map(([p, x]) => sklepy.reduce((a, s) => a + (s.platforma === p ? s.netto : 0), -x.koszty_roczne));
  return { sklepy, platformy, wynik: platformy.reduce((a, x) => a + x, 0) };
}

export function bramka(d) {
  const sc = [0, 1, 2].map((k) => licz(d, k));
  const wspolne = [...new Set(d.sklepy.flatMap((s) => Object.keys(s.zalozenia)))].filter((n) => d.sklepy.filter((s) => n in s.zalozenia).length > 1);
  const wplyw = [...d.sklepy.flatMap((s, i) => Object.keys(s.zalozenia).map((n) => [`${i}.${n}`, `${s.platforma}/${s.kraj} ${n}`])), ...wspolne.map((n) => [`*.${n}`, `${n} (wszystkie sklepy)`])]
    .map(([k, nazwa]) => ({ nazwa, pes: licz(d, 1, [k, 0]).wynik, opt: licz(d, 1, [k, 2]).wynik }))
    .sort((a, b) => b.opt - b.pes - (a.opt - a.pes));
  const prog = d.prog ? d.prog.kwota * kurs(d, d.prog.waluta) : null;
  const nad = (x) => x >= prog;
  return { sc, wplyw, prog, werdykt: d.prog ? WERDYKT[d.tryb][nad(sc[1].wynik) ? 2 : nad(sc[2].wynik) ? 1 : 0] : null,
    zmienia: d.prog ? wplyw.filter((x) => nad(x.pes) !== nad(sc[1].wynik) || nad(x.opt) !== nad(sc[1].wynik)) : [] };
}

export function warianty(d) {
  const z = d.sklepy.filter((s) => s.zastepczo);
  const b = { ...d, sklepy: d.sklepy.map((s) => (s.zastepczo ? { ...s, konkurenci: s.zastepczo.konkurenci, zalozenia: s.zastepczo.zalozenia } : s)) };
  const ios = d.platformy.android && d.platformy.ios && { ...d, sklepy: d.sklepy.filter((s) => s.platforma === 'ios'), platformy: { ios: d.platformy.ios } };
  return [{ nazwa: 'A (dowody storefrontów)', w: bramka(d) }, ...(z.length ? [{ nazwa: `B (${z.map((s) => `${s.platforma}/${s.kraj}: ${s.zastepczo.opis}`).join('; ')})`, w: bramka(b) }] : []),
    ...(ios ? [{ nazwa: 'Sam iOS (A)', w: bramka(ios) }] : [])];
}

export function opis(d, wsz = warianty(d)) {
  const t = (w, f) => w.sc.map((x) => zl(f(x))).join(' / ');
  const A = wsz[0].w;
  const l = [`Bramka opłacalności ${d.data} (${d.waluta} netto/rok, pes. / norm. / opt.; bez kosztów portfela i czasu, D-024)`,
    ...d.sklepy.map((s, i) => `${s.platforma}/${s.kraj}: płacący ${t(A, (x) => x.sklepy[i].placacy)}; netto ${t(A, (x) => x.sklepy[i].netto)}`),
    ...Object.keys(d.platformy).map((p, j) => `${p}: po kosztach ${t(A, (x) => x.platformy[j])}`)];
  for (const { nazwa, w } of wsz) l.push(`${nazwa}: razem ${t(w, (x) => x.wynik)}; ${w.werdykt ? `werdykt wobec progu ${zl(w.prog)} [${d.prog.zrodlo}]: ${w.werdykt}; wynik normalny wobec progu zmienia: ${w.zmienia.map((x) => x.nazwa).join('; ') || 'żadne założenie'}` : 'brak progu właściciela [DO WYJAŚNIENIA]'}`);
  if (wsz[1]?.nazwa.startsWith('B') && wsz[1].w.werdykt !== A.werdykt) l.push('Werdykt zależy od interpretacji A/B: sprawdź ją najpierw.');
  l.push(`Największy wpływ (A, pes. → opt.): ${A.wplyw.slice(0, 3).map((x) => `${x.nazwa} ${zl(x.pes)} → ${zl(x.opt)}`).join('; ')}`);
  l.push('Przybliżenie z jawnych założeń, nie prognoza; bez podatku dochodowego i składek.');
  return l.join('\n');
}

// porównanie wariantów (D-028): każdy plik osobno, malejąco po wyniku normalnym A; podłogę ocenia raport
export function porownaj(lista) {
  if (new Set(lista.map(([, d]) => d.waluta)).size > 1) throw new Error('jednej waluty');
  const w = lista.map(([plik, d]) => ({ nazwa: d.wariant ?? plik, waluta: d.waluta, A: warianty(d)[0].w })).sort((a, b) => b.A.sc[1].wynik - a.A.sc[1].wynik);
  return ['| Wariant | Razem pes. / norm. / opt. | Werdykt |', '|---|---|---|', ...w.map((x) => `| ${x.nazwa} | ${x.A.sc.map((s) => zl(s.wynik)).join(' / ')} ${x.waluta} | ${x.A.werdykt ?? '—'} |`),
    `Najwyższy wynik normalny: ${w[0].nazwa} (optymalny tylko, jeśli przechodzi podłogę).`].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pliki = process.argv.slice(2);
  if (!pliki.length) { console.error('Użycie: node oplacalnosc.mjs dane.json [wariant2.json …]'); process.exit(2); }
  const lista = [];
  for (const plik of pliki) {
    let d;
    try { d = JSON.parse(readFileSync(plik, 'utf8')); } catch (e) { console.error(`BŁĄD ${plik}: ${e.message}`); process.exit(1); }
    const bledy = sprawdz(d);
    if (bledy.length) { for (const x of bledy) console.error(`BŁĄD ${plik}: ${x}`); process.exit(1); }
    lista.push([plik, d]);
  }
  console.log(lista.length === 1 ? opis(lista[0][1]) : porownaj(lista));
}
