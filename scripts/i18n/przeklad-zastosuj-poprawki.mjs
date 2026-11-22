#!/usr/bin/env node
// Przyjęcie poprawek z drugiego przeglądu AI (P-486, D-027): wynik trybu `przeglad` (raport-przegladu/<kod>.json, pole `poprawki`) → src/i18n/slowniki/<kod>.json.
//   node scripts/i18n/przeklad-zastosuj-poprawki.mjs [--raport raport-przegladu] [--zakres docs/lokalizacja/zakres-fali-2026-11-03.json] [--korzen .] [--sucho] <kod…>
// Każda poprawka jest oceniana OSOBNO i przyjęta tylko, gdy wynik przechodzi kontrolę tej pozycji w sprawdz-i18n (parametry, kategorie CLDR, twierdzenia, pusty tekst)
// i strażnik terminów slownik.mjs (termin zakazany w słowniku terminów). Odrzucone zostają w raporcie przyjęcia z powodem (<raport>/przyjecie-<kod>.json), słownik ich nie widzi.
// Pary (język, baza) z przetlumaczone_czesciowo (zweryfikowane wcześniej) zostają nietknięte — poprawka jest odrzucona jako „chroniona”, do decyzji człowieka.
// --sucho: nic nie zapisuje. Kod wyjścia: 0 ok, 2 konfiguracja (brak kodów, brak raportu, błąd odczytu).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splaszcz, rozplaszcz } from './przeklad-api.mjs';
import { sprawdzSlowniki } from '../sprawdz-i18n.mjs';
import { straznik } from '../../docs/lokalizacja/narzedzia/slownik.mjs';

const KAT = /_(zero|one|two|few|many|other)$/, RANGA = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 };
const baza = (k) => k.replace(KAT, '');
const formyBazy = (slownik, b) => Object.keys(slownik).filter((k) => baza(k) === b && (k === b || KAT.test(k)));
const wycinek = (slownik, b) => Object.fromEntries(formyBazy(slownik, b).map((k) => [k, slownik[k]]));

/** Zamienia wszystkie klucze bazy `b` w `slownik` na `nowy` ({klucz: tekst}); pozycja pierwszego starego klucza zostaje, kategorie CLDR w kolejności zero…other. */
function podmien(slownik, b, nowy) {
  const stare = new Set(formyBazy(slownik, b)), wynik = {};
  const nowe = Object.entries(nowy).sort(([x], [y]) => (RANGA[x.match(KAT)?.[1]] ?? 0) - (RANGA[y.match(KAT)?.[1]] ?? 0));
  let wstawione = false;
  for (const [k, v] of Object.entries(slownik)) {
    if (!stare.has(k)) { wynik[k] = v; continue; }
    if (!wstawione) { for (const [nk, nv] of nowe) wynik[nk] = nv; wstawione = true; }
  }
  return wynik;
}

/** Czysta funkcja: płaski słownik języka + lista poprawek → { wynik, przyjete: [{klucz, powod, krytyczny}], odrzucone: [{klucz, powod}] }.
 *  Opcje: kod, en (płaski), slownik (słownik terminów), chronione ({baza: [języki]}), wyjatki (strażnik terminów), krytyczne (Set baz treści krytycznej). */
export function nalozPoprawki(aktualny, poprawki, { kod, en, slownik, chronione = {}, wyjatki = [], krytyczne = new Set() }) {
  let wynik = { ...aktualny };
  const przyjete = [], odrzucone = [];
  for (const p of poprawki) {
    const b = p.klucz, odrzuc = (powod) => odrzucone.push({ klucz: b, powod });
    if ((chronione[b] ?? []).includes(kod)) { odrzuc('chroniona para (język, baza) z przetlumaczone_czesciowo — do decyzji człowieka'); continue; }
    if (!formyBazy(wynik, b).length) { odrzuc('klucz spoza słownika języka'); continue; }
    const nowy = typeof p.tekst === 'string' ? { [b]: p.tekst } : Object.fromEntries(Object.entries(p.tekst ?? {}).map(([c, t]) => [`${b}_${c}`, t]));
    const stary = wycinek(wynik, b);
    if (JSON.stringify(Object.entries(nowy).sort()) === JSON.stringify(Object.entries(stary).sort())) { odrzuc('bez zmiany względem obecnego tekstu'); continue; }
    const kandydat = podmien(wynik, b, nowy), wyc = wycinek(kandydat, b);
    const bledy = sprawdzSlowniki({ en: wycinek(en, b), [kod]: wyc }, 'en').bledy;
    const zakazane = straznik(slownik, en, { [kod]: wyc }, wyjatki);
    if (bledy.length || zakazane.length) { odrzuc([...bledy.map((x) => x.replace(`${kod} ${b}: `, '')), ...zakazane.map((x) => `termin zakazany: ${x}`)].join('; ')); continue; }
    wynik = kandydat;
    przyjete.push({ klucz: b, powod: p.powod, krytyczny: krytyczne.has(b) });
  }
  return { wynik, przyjete, odrzucone };
}
function main(argv) {
  const opt = { '--raport': 'raport-przegladu', '--zakres': 'docs/lokalizacja/zakres-fali-2026-11-03.json', '--korzen': resolve(fileURLToPath(new URL('../..', import.meta.url))) }, kody = [];
  let sucho = false;
  for (let i = 0; i < argv.length; i++) argv[i] === '--sucho' ? (sucho = true) : argv[i] in opt ? (opt[argv[i]] = argv[++i]) : kody.push(argv[i]);
  if (!kody.length) { console.log('Użycie: przeklad-zastosuj-poprawki.mjs [--raport katalog] [--zakres plik] [--korzen katalog] [--sucho] <kod…>'); return 2; }
  const korzen = resolve(opt['--korzen']), raport = resolve(korzen, opt['--raport']), czytaj = (p) => JSON.parse(readFileSync(p, 'utf8'));
  try {
    const en = splaszcz(czytaj(join(korzen, 'src/i18n/slowniki/en.json'))), slownik = czytaj(join(korzen, 'docs/lokalizacja/slownik-terminow.json'));
    const pw = join(korzen, 'docs/lokalizacja/slownik-wyjatki.json'), wyjatki = existsSync(pw) ? czytaj(pw).wyjatki : [];
    const chronione = czytaj(resolve(korzen, opt['--zakres'])).przetlumaczone_czesciowo ?? {};
    const pk = join(korzen, 'docs/lokalizacja/krytyczne.json'), krytyczne = new Set(existsSync(pk) ? Object.keys(czytaj(pk).klucze ?? {}) : []);
    for (const kod of kody) {
      const pr = join(raport, `${kod}.json`); if (!existsSync(pr)) { console.log(`BŁĄD: brak ${pr}`); return 2; }
      const r = czytaj(pr); if (r.blad) { console.log(`${kod}: pominięto — raport z błędem: ${r.blad}`); continue; }
      const sl = join(korzen, 'src/i18n/slowniki', `${kod}.json`);
      const { wynik, przyjete, odrzucone } = nalozPoprawki(splaszcz(czytaj(sl)), r.poprawki ?? [], { kod, en, slownik, chronione, wyjatki, krytyczne });
      if (!sucho) {
        if (przyjete.length) writeFileSync(sl, JSON.stringify(rozplaszcz(wynik), null, 2) + '\n');
        writeFileSync(join(raport, `przyjecie-${kod}.json`), JSON.stringify({ jezyk: kod, przyjete, odrzucone }, null, 1) + '\n');
      }
      const kryt = przyjete.filter((x) => x.krytyczny).map((x) => x.klucz);
      console.log(`${kod}: przyjęte: ${przyjete.length}, odrzucone: ${odrzucone.length}${sucho ? ' (próba, bez zapisu)' : ''}${kryt.length ? `; TREŚĆ KRYTYCZNA zmieniona (unieważnia wpis kontroli (a), wymaga ponownego przekładu zwrotnego): ${kryt.join(', ')}` : ''}`);
      for (const o of odrzucone.slice(0, 20)) console.log(`  - ${o.klucz}: ${o.powod}`);
    }
  } catch (e) { console.log(`BŁĄD: ${e.message}`); return 2; }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) process.exitCode = main(process.argv.slice(2));
