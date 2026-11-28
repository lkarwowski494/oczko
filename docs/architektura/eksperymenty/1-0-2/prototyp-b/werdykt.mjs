// Werdykt prototypu B z wyników przebieg.sh (PB1; kryterium AR1 w docs/architektura/1-0-2.md „Prototyp B”). Użycie: node werdykt.mjs <katalog-wyjścia> [--json wyjscie.json]
// TAK: w obu przebiegach (a) proces aplikacji nieobecny, (b) treść czasu różna między odczytami ≥ 30 s, (c) znacznik STALE nieobecny przed staleDate i obecny najpóźniej 15 s po nim.
// NIE: (b) albo (c) nie zachodzi mimo odczytu (zrzuty czytelne). BRAK-ODCZYTU: żaden zrzut nie pokazuje Live Activity (ani tekst, ani znacznik pikselowy).
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const wy = process.argv[2];
const jsonOut = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
const czas = (t) => { const m = /(?:^|\D)(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\D|$)/.exec(t); if (!m) return null; return m[3] ? +m[1] * 3600 + +m[2] * 60 + +m[3] : +m[1] * 60 + +m[2]; };
const przebiegi = readdirSync(wy).filter((n) => /^przebieg-\d+$/.test(n)).sort();
const wynik = { przebiegi: [], werdykt: null };
for (const nazwa of przebiegi) {
  const p = join(wy, nazwa);
  const r = { przebieg: nazwa, uwagi: [] };
  if (!existsSync(join(p, 'meta.json'))) { r.status = 'BRAK-ODCZYTU'; r.uwagi.push('brak meta.json'); wynik.przebiegi.push(r); continue; }
  const meta = JSON.parse(readFileSync(join(p, 'meta.json'), 'utf8'));
  if (meta.blad || !meta.startMs) { r.status = 'BRAK-ODCZYTU'; r.uwagi.push(`meta: ${meta.blad ?? 'bez startMs'}`); wynik.przebiegi.push(r); continue; }
  r.startMs = meta.startMs; r.staleMs = meta.staleMs;
  const proc = existsSync(join(p, 'proces.txt')) ? readFileSync(join(p, 'proces.txt'), 'utf8') : '';
  const po = proc.split('== po terminate')[1] ?? '';
  r.procesNieobecny = /PROCES-BRAK/.test(po) && /LAUNCHCTL-BRAK/.test(po);
  const przed = proc.split('== po terminate')[0] ?? '';
  r.procesBylPrzed = /\d+\s+\S*\.app\//.test(przed) || /\d+\s+\S+/.test(przed.split('\n').filter((l) => !/^==|\(pgrep|\(launchctl/.test(l)).join('\n'));
  const mapa = new Map(readFileSync(join(p, 'zrzuty.tsv'), 'utf8').trim().split('\n').filter(Boolean).map((l) => { const [t, ms, plik] = l.split('\t'); return [plik, { t: +t, ms: +ms }]; }));
  const ocr = existsSync(join(p, 'ocr.jsonl')) ? readFileSync(join(p, 'ocr.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const probki = ocr.map((o) => {
    const m = mapa.get(o.plik) ?? { t: null, ms: null };
    const teksty = o.teksty;
    const stale = teksty.some((x) => /stale/i.test(x));
    const licznik = teksty.map(czas).find((x) => x !== null) ?? null;
    return { plik: o.plik, t: m.t, ms: m.ms, stale, licznikSek: licznik, czerwone: o.czerwone, teksty };
  }).filter((x) => x.ms);
  r.probki = probki.map(({ plik, t, ms, stale, licznikSek, czerwone, teksty }) => ({ plik, t, ms, stale, licznikSek, czerwone, teksty }));
  const widoczne = probki.filter((x) => x.stale || x.licznikSek !== null);
  if (!widoczne.length) { r.status = 'BRAK-ODCZYTU'; r.uwagi.push('na żadnym zrzucie OCR nie odczytał licznika ani znacznika (sprawdź zrzuty i czerwone[])'); wynik.przebiegi.push(r); continue; }
  const zLicznikiem = probki.filter((x) => x.licznikSek !== null);
  let roznica = false;
  for (const a of zLicznikiem) for (const b of zLicznikiem) if (b.ms - a.ms >= 30000 && b.licznikSek !== a.licznikSek) roznica = true;
  r.czasRozny30s = roznica;
  const przedStale = probki.filter((x) => x.ms <= meta.staleMs);
  const poStale = probki.filter((x) => x.ms > meta.staleMs);
  r.znacznikPrzedStale = przedStale.some((x) => x.stale);
  const pierwszy = poStale.find((x) => x.stale);
  r.znacznikPierwszyPoStaleSek = pierwszy ? (pierwszy.ms - meta.staleMs) / 1000 : null;
  r.znacznikNajpozniej15s = !!pierwszy && pierwszy.ms - meta.staleMs <= 15000;
  r.znacznikTrwaly = !!pierwszy && poStale.filter((x) => x.ms >= pierwszy.ms).every((x) => x.stale);
  r.status = r.procesNieobecny && r.czasRozny30s && !r.znacznikPrzedStale && r.znacznikNajpozniej15s ? 'TAK' : (r.procesNieobecny ? 'NIE' : 'PROCES-ISTNIEJE');
  wynik.przebiegi.push(r);
}
const st = wynik.przebiegi.map((x) => x.status);
wynik.werdykt = st.length >= 2 && st.every((x) => x === 'TAK') ? 'TAK' : st.some((x) => x === 'BRAK-ODCZYTU') ? 'BRAK-ODCZYTU' : st.some((x) => x === 'NIE') ? 'NIE' : (st.length ? 'NIEROZSTRZYGNIETE' : 'BRAK-ODCZYTU');
const opis = JSON.stringify(wynik, (k, v) => (k === 'probki' ? undefined : v), 2);
console.log(opis);
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(wynik, null, 2));
for (const r of wynik.przebiegi) console.log(`${r.przebieg}: ${r.status} · proces nieobecny=${r.procesNieobecny} · czas różny ≥30 s=${r.czasRozny30s} · STALE przed=${r.znacznikPrzedStale} · pierwszy po staleDate za ${r.znacznikPierwszyPoStaleSek} s`);
console.log(`WERDYKT: ${wynik.werdykt}`);
