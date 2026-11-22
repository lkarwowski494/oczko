// Sprawdza wzorzec `limit.mjs` na `wektory-limitu.json`. Uruchomienie: node docs/monetyzacja/limit-test.mjs
// Kod 0: wszystkie wektory i własności zgodne; kod 1: co najmniej jeden niezgodny (lista na wyjściu).
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import * as L from './limit.mjs';
const { startDnia, LIMIT_DNI, PRZERWA_MS } = L;

const w = JSON.parse(readFileSync(new URL('./wektory-limitu.json', import.meta.url), 'utf8'));
const bledy = [];
if (LIMIT_DNI !== w.limit) bledy.push(`LIMIT_DNI ${LIMIT_DNI} ≠ wektory ${w.limit}`);
if (PRZERWA_MS !== w.przerwa_ms) bledy.push(`PRZERWA_MS ${PRZERWA_MS} ≠ wektory ${w.przerwa_ms}`);

// Wywołanie funkcji wzorca; oczekiwany błąd danych to { blad: 'BLAD_DANYCH' } — tylko wyjątek z tym kodem (R-178), inny wyjątek to niezgodność.
const wywolaj = (nazwa, wejscie) => {
  if (typeof L[nazwa] !== 'function') return `BRAK FUNKCJI ${nazwa}`;
  try { return L[nazwa](wejscie); } catch (e) { return e?.kod === 'BLAD_DANYCH' ? { blad: 'BLAD_DANYCH' } : `WYJĄTEK ${e?.name}: ${e?.message}`; }
};
const sekcje = [['startDnia', w.startDnia], ['wolaStraznika', w.wolaStraznika || []], ['mozeZaczacDzien', w.mozeZaczacDzien || []], ['wznowienieLimitu', w.wznowienieLimitu || []], ['cofniecieSerii', w.cofniecieSerii || []], ['scalDni', w.scalDni || []], ['oknoUczciweZasady', w.oknoUczciweZasady || []]];
for (const [nazwa, lista] of sekcje) {
  for (const t of lista) {
    const kopia = structuredClone(t.wejscie);
    const wynik = wywolaj(nazwa, t.wejscie);
    if (!isDeepStrictEqual(wynik, t.oczekiwane)) bledy.push(`${t.id} (${t.scenariusz}): ${JSON.stringify(wynik)} ≠ ${JSON.stringify(t.oczekiwane)}`);
    if (!isDeepStrictEqual(kopia, t.wejscie)) bledy.push(`${t.id}: funkcja zmieniła wejście`);
  }
}

// Własność scalenia (Z07-09): kolejność urządzeń nie zmienia wyniku.
for (const t of (w.scalDni || []).filter((x) => !x.oczekiwane?.blad)) {
  const ab = wywolaj('scalDni', t.wejscie), ba = wywolaj('scalDni', { a: t.wejscie.b, b: t.wejscie.a });
  if (!isDeepStrictEqual(ab, ba)) bledy.push(`${t.id}: scalDni zależy od kolejności: ${JSON.stringify(ab)} ≠ ${JSON.stringify(ba)}`);
}

// Własności (Z07-07) na wszystkich poprawnych wektorach startDnia i mozeZaczacDzien.
const dzienLokalny = (ms, strefa) => new Intl.DateTimeFormat('en-CA', { timeZone: strefa, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
const poprawne = [...w.startDnia, ...(w.mozeZaczacDzien || [])].filter((t) => !t.oczekiwane?.blad);
if (typeof w.strefa !== 'string') bledy.push('wektory: brak pola strefa (R-101)');
let wlasnosci = 0;
for (const t of poprawne) {
  // R-101: świat wektorów możliwy — dzis to data lokalna chwili teraz w strefie wektorów.
  if (typeof w.strefa === 'string' && dzienLokalny(t.wejscie.teraz, w.strefa) !== t.wejscie.dzis) bledy.push(`${t.id}: dzis ${t.wejscie.dzis} ≠ data lokalna teraz w ${w.strefa} (${dzienLokalny(t.wejscie.teraz, w.strefa)})`);
  // R-099: przy Pro nigdy limit zawczasu ani linia o ostatnim darmowym dniu.
  const zPro = wywolaj('mozeZaczacDzien', { ...t.wejscie, pro: true });
  if (zPro?.limitZawczasu !== false || zPro?.ostatniDarmowy !== false) bledy.push(`${t.id}: przy pro ${JSON.stringify(zPro)} (oczekiwane limitZawczasu i ostatniDarmowy false)`);
  // R-102: wynik niezależny od zdublowanych wpisów listy dni (P-103 (1a)).
  if (t.wejscie.dni.length) {
    const podwojne = { ...t.wejscie, dni: [...t.wejscie.dni, ...t.wejscie.dni] };
    for (const f of ['startDnia', 'mozeZaczacDzien']) {
      const a = wywolaj(f, t.wejscie), b = wywolaj(f, podwojne);
      if (!isDeepStrictEqual(a, b)) bledy.push(`${t.id}: ${f} zależy od duplikatów dni: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
    }
  }
  wlasnosci += 1;
}
// Z07-02: każdy wektor limitu (L-, Z-) cytowany w BRD istnieje w wektorach (S-NN w BRD to źródła, nie wektory strażnika).
const ids = new Set(sekcje.flatMap(([, l]) => l.map((t) => t.id)));
for (const plik of ['wymagania-dane.md', 'wymagania-licznik.md', 'reguly.md', 'README.md']) {
  let tekst = '';
  // Poza repo (kopia do narzędzia mutantów 07) BRD nie ma: kontrola pominięta z ostrzeżeniem, żeby nie zabijać mutantów fałszywie.
  try { tekst = readFileSync(new URL(`../brd/${plik}`, import.meta.url), 'utf8'); } catch { console.warn(`UWAGA: brak ../brd/${plik} — kontrola cytatów BRD pominięta`); continue; }
  for (const id of new Set(tekst.match(/\b[LZ]-\d{2}[a-z]?\b/g) || [])) if (!ids.has(id)) bledy.push(`BRD ${plik} cytuje ${id}, którego nie ma w wektory-limitu.json`);
}
const n = sekcje.reduce((s, [, l]) => s + l.length, 0);
console.log(bledy.length ? `NIEZGODNE ${bledy.length} (wektorów ${n}, własności na ${wlasnosci}):\n${bledy.join('\n')}` : `zgodne ${n} z ${n} wektorów; własności (strefa, Pro, duplikaty) na ${wlasnosci} wektorach`);
process.exit(bledy.length ? 1 : 0);
