// Test prototypu scal (ADR-0005, 0008, 0009; fix 05 2026-10-25, Z07-13): wektory scal-wektory.json, każda permutacja wejścia
// (odwrócona i 20 losowych z ziarnem) daje ten sam wynik, wejście nie jest modyfikowane, łańcuch 150 000 zdarzeń bez rekurencji.
import { readFileSync } from 'node:fs'; import { pathToFileURL } from 'node:url';
const { scal } = await import(process.env.SCAL_MODUL ? pathToFileURL(process.env.SCAL_MODUL).href : './scal.mjs'); // SCAL_MODUL: mutant (mutanty-scal.mjs)
// M-18–M-20 (P-118 W1) przeniesione z scal-wektory-fix2.json w commicie 08, który zmienia src/domena/scal.ts (P-119).
const W = JSON.parse(readFileSync(new URL('./scal-wektory.json', import.meta.url)));
let ok = 0, n = 0;
let ziarno = 20261025; const los = () => ((ziarno = (ziarno * 1103515245 + 12345) % 2147483648) / 2147483648);
const tasuj = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(los() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const klucz = (r) => JSON.stringify(r.stan === 'czeka' ? { ...r, brakujacy: [...r.brakujacy].sort() } : r);
const sprawdz = (id, opis, warunek, r) => { n++; console.log(`${id} ${warunek ? 'OK' : 'BŁĄD'} — ${opis} → ${JSON.stringify(r).slice(0, 160)}`); if (warunek) ok++; };
for (const w of W) {
  const kopia = JSON.stringify(w.zdarzenia); const r = scal(w.zdarzenia); const o = w.oczekiwane;
  const zgodne = r.stan === o.stan && (o.wartosc === undefined || r.wartosc === o.wartosc) && (o.powod === undefined || r.powod === o.powod) && (o.id === undefined || r.id === o.id)
    && (!o.wartosci || JSON.stringify(r.kandydaci.map((k) => k.wartosc).sort((a, b) => a - b)) === JSON.stringify(o.wartosci))
    && (!o.kandydaci || JSON.stringify(Object.fromEntries(r.kandydaci.map((k) => [k.glowa, k.wartosc]))) === JSON.stringify(Object.fromEntries(Object.entries(o.kandydaci).sort()))) && JSON.stringify(w.zdarzenia) === kopia;
  const permutacje = [[...w.zdarzenia].reverse(), ...Array.from({ length: 20 }, () => tasuj(w.zdarzenia))];
  const stale = permutacje.every((p) => klucz(scal(p)) === klucz(r));
  sprawdz(w.id, w.opis, zgodne && stale, r);
}
// R-036: długa historia bez przepełnienia stosu (budżet: 150 000 zdarzeń, szacunek 3 lat, ADR-0005).
for (const N of [10_000, 150_000]) {
  const z = Array.from({ length: N }, (_, i) => ({ id: `e${i}`, licznik: 'l', rodzaj: 'plus', rodzice: i ? [`e${i - 1}`] : [] }));
  const t = performance.now(); let r; try { r = scal(z); } catch (e) { r = { stan: 'wyjatek', komunikat: e.message }; }
  const ms = (performance.now() - t).toFixed(0);
  sprawdz(`R-036-${N}`, `łańcuch ${N} zdarzeń plus → zgodny ${N} (${ms} ms, Linux)`, r.stan === 'zgodny' && r.wartosc === N && r.glowy.length === 1, r);
}
console.log(`${ok}/${n}`); process.exit(ok === n ? 0 : 1);
