// Sprawdza wzorzec `dostep.mjs` na `wektory-dostepu.json`. Uruchomienie: node docs/monetyzacja/dostep-test.mjs
// Kod 0: wszystkie wektory zgodne; kod 1: co najmniej jeden niezgodny (lista na wyjściu).
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import * as D from './dostep.mjs';
const { decyzja, odczytajPamiec, ODBLOKOWUJA } = D;

const w = JSON.parse(readFileSync(new URL('./wektory-dostepu.json', import.meta.url), 'utf8'));
const bledy = [];
if (!isDeepStrictEqual([...ODBLOKOWUJA], w.odblokowuja)) bledy.push(`ODBLOKOWUJA ${JSON.stringify(ODBLOKOWUJA)} ≠ wektory ${JSON.stringify(w.odblokowuja)}`);
if (D.LASKA_OFFLINE_MS !== w.laska_offline_ms) bledy.push(`LASKA_OFFLINE_MS ${D.LASKA_OFFLINE_MS} ≠ wektory ${w.laska_offline_ms}`);
for (const t of w.decyzja) {
  const wynik = decyzja(t.odczyt, t.pamiec, w.teraz, w.odblokowuja);
  if (!isDeepStrictEqual(wynik, t.oczekiwane)) bledy.push(`${t.id} (${t.scenariusz}): ${JSON.stringify(wynik)} ≠ ${JSON.stringify(t.oczekiwane)}`);
}
for (const t of w.odczytajPamiec) {
  const wynik = odczytajPamiec(t.wejscie);
  if (!isDeepStrictEqual(wynik, t.oczekiwane)) bledy.push(`${t.id} (${t.scenariusz}): ${JSON.stringify(wynik)} ≠ ${JSON.stringify(t.oczekiwane)}`);
}
// Oczekiwany błąd danych to { blad: 'BLAD_DANYCH' } — tylko wyjątek z tym kodem, inny wyjątek to niezgodność (jak limit-test.mjs).
const wywolaj = (nazwa, ...arg) => {
  if (typeof D[nazwa] !== 'function') return `BRAK FUNKCJI ${nazwa}`;
  try { return D[nazwa](...arg); } catch (e) { return e?.kod === 'BLAD_DANYCH' ? { blad: 'BLAD_DANYCH' } : `WYJĄTEK ${e?.name}: ${e?.message}`; }
};
for (const t of w.komunikatZakupu || []) {
  const wynik = wywolaj('komunikatZakupu', t.wejscie);
  if (!isDeepStrictEqual(wynik, t.oczekiwane)) bledy.push(`${t.id} (${t.scenariusz}): ${JSON.stringify(wynik)} ≠ ${JSON.stringify(t.oczekiwane)}`);
}
// Pro na zegarku (ADR-0009 D): te same wektory czyta test Swift celu zegarka.
for (const t of w.proZegarka || []) {
  const wynik = wywolaj('proZegarka', t.zrodla, w.teraz);
  if (!isDeepStrictEqual(wynik, t.oczekiwane)) bledy.push(`${t.id} (${t.scenariusz}): ${JSON.stringify(wynik)} ≠ ${JSON.stringify(t.oczekiwane)}`);
  if (Array.isArray(t.zrodla) && !t.oczekiwane?.blad) {
    const odwrotnie = wywolaj('proZegarka', [...t.zrodla].reverse(), w.teraz);
    if (odwrotnie !== wynik) bledy.push(`${t.id}: proZegarka zależy od kolejności źródeł`);
  }
}
const n = w.decyzja.length + w.odczytajPamiec.length + (w.komunikatZakupu || []).length + (w.proZegarka || []).length;
console.log(bledy.length ? `NIEZGODNE ${bledy.length} z ${n}:\n${bledy.join('\n')}` : `zgodne ${n} z ${n} wektorów`);
process.exit(bledy.length ? 1 : 0);
