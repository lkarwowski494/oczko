// Przejście katalogu atlasu z kontraktu 0.1 na format 1 (wersja 1.1) — tylko zmiany mechaniczne; resztę zgłasza walidator.
// Dane należą do roli 06 (P-212): narzędzie nie nadpisuje wejścia, zapisuje do wskazanego pliku.
// Użycie: node --experimental-strip-types --no-warnings scripts/atlas/migruj-0-1.mjs <katalog-0.1.json> <wyjście.json>
// Kod: 0 = zapisano i wynik przechodzi walidator, 1 = zapisano, ale zostały błędy (lista), 2 = użycie.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { walidujKarte } from './silnik/kontrakt.ts';

const [wej, wyj] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!wej || !wyj || !existsSync(wej) || wej === wyj) { console.error('Użycie: migruj-0-1.mjs <katalog-0.1.json> <wyjście.json> (wyjście ≠ wejście)'); process.exit(2); }
const zrodlo = JSON.parse(readFileSync(wej, 'utf8'));
const bezNull = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null));
const zmiany = {};
const zanotuj = (co) => { zmiany[co] = (zmiany[co] ?? 0) + 1; };

function migruj(k0) {
  const k = { format: 1, ...structuredClone(k0) };
  if (k.rzemioslo === 'schemat') { k.rzemioslo = 'oba'; k.rodzaj = 'schemat'; zanotuj('rzemioslo schemat → oba, rodzaj schemat'); }
  if (k.rzemioslo === 'tabela') {
    k.rzemioslo = /\.szydelko(\.|$)/.test(k.id) ? 'szydelko' : /\.druty(\.|$)/.test(k.id) ? 'druty' : 'oba';
    k.rodzaj = 'tabela';
    zanotuj('rzemioslo tabela → z id, rodzaj tabela');
  }
  // terminy: lista; pełniejsza wersja z rozszerzenie_06_terminy, jeśli jest
  const pelne = k.rozszerzenie_06_terminy ?? {};
  for (const [tag, w] of Object.entries(k.terminy ?? {})) {
    k.terminy[tag] = pelne[tag] ?? (Array.isArray(w) ? w : [w]);
    zanotuj('terminy → lista');
  }
  for (const [tag, w] of Object.entries(pelne)) if (!(tag in k.terminy)) { k.terminy[tag] = w; zanotuj('terminy z rozszerzenia'); }
  delete k.rozszerzenie_06_terminy;
  // twierdzenia: bez null; wysokosc → narzuty (kontrakt 1); wpis bez wartości pominięty
  k.twierdzenia = (k.twierdzenia ?? []).flatMap((t) => {
    const w = bezNull(t.wartosc ?? {});
    if ('wysokosc' in w) { w.narzuty = w.wysokosc; delete w.wysokosc; zanotuj('wysokosc → narzuty'); }
    if (Object.keys(w).length !== Object.keys(t.wartosc ?? {}).length) zanotuj('null usunięte z wartosc');
    if (!Object.keys(w).length) { zanotuj('twierdzenie bez wartości pominięte (ID zostaje w krokach)'); return []; }
    return [{ ...t, wartosc: w }];
  });
  if (k.rysunek === null) { delete k.rysunek; zanotuj('rysunek null usunięty'); }
  if (k.rysunek) for (const p of ['probka', 'tlo']) if (k.rysunek[p] === null) { delete k.rysunek[p]; zanotuj(`rysunek.${p} null usunięte`); }
  if (Array.isArray(k.kroki) && !k.kroki.length) { delete k.kroki; zanotuj('kroki [] usunięte'); }
  for (const krok of k.kroki ?? []) {
    const r = krok.rozszerzenie_06;
    if (r) {
      if (r.faza_opis) { krok.faza_opis = r.faza_opis; zanotuj('kroki: faza_opis z rozszerzenia'); }
      if (typeof r.drut === 'string') { krok.drut = { ktory: r.drut }; zanotuj('kroki: drut z rozszerzenia'); }
      const reszta = Object.keys(r).filter((x) => !['faza_opis', 'drut'].includes(x));
      if (reszta.length) krok.rozszerzenie_06 = Object.fromEntries(reszta.map((x) => [x, r[x]])); else delete krok.rozszerzenie_06;
    }
    if (krok.faza_opis === undefined && 'faza_opis' in krok) delete krok.faza_opis;
  }
  return k;
}

const karty = (zrodlo.karty ?? []).map(migruj);
writeFileSync(wyj, JSON.stringify({ format: 1, wersja: `${zrodlo.data ?? 'bez-daty'}.migracja-0.1`, karty }, null, 1) + '\n');
console.log(`zmiany mechaniczne: ${Object.entries(zmiany).map(([k, n]) => `${k} ×${n}`).join('; ')}`);
let bledy = 0;
const kody = {};
for (const k of karty) for (const e of walidujKarte(k, {})) { console.log(`${k.id} [${e.kod}] ${e.sciezka}: ${e.szczegol}`); bledy++; kody[e.kod] = (kody[e.kod] ?? 0) + 1; }
console.log(bledy ? `zapisano ${wyj}; do decyzji 06: ${bledy} błędów (${Object.entries(kody).map(([k, n]) => `${k} ${n}`).join(', ')})` : `zapisano ${wyj}; OK: ${karty.length} kart bez błędów struktury i semantyki`);
process.exit(bledy ? 1 : 0);
