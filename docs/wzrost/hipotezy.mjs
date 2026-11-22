// hipotezy.mjs — ocena hipotez H według progów właściciela.
// Użycie: node hipotezy.mjs <hipotezy.json> [--dzis RRRR-MM-DD]. Kod: 0 dane poprawne, 1 błędy danych, 2 brak argumentu.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export const MAKS_AKTYWNYCH = 3;
export const dataOk = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;

export function wilson(k, n, z) {
  const p = k / n, z2 = z * z, m = 1 + z2 / n;
  const s = p + z2 / (2 * n), d = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return { p, dol: (s - d) / m, gora: (s + d) / m };
}

export function sprawdz(x) {
  if (!x || !Array.isArray(x.hipotezy)) return ['brak tablicy hipotezy'];
  const b = [], ids = new Set();
  if (x.z !== undefined && !(typeof x.z === 'number' && x.z > 0)) b.push('z: oczekiwana liczba dodatnia');
  const aktywne = x.hipotezy.filter((h) => !h?.zamknieta).length;
  if (aktywne > MAKS_AKTYWNYCH) b.push(`aktywnych hipotez ${aktywne}, najwyżej ${MAKS_AKTYWNYCH}`);
  for (const [i, h] of x.hipotezy.entries()) {
    const w = `hipotezy[${i}]${h?.id ? ` ${h.id}` : ''}`, p = h?.prog, d = h?.dane, m = h?.mierzalnosc;
    if (!/^H-\d{2,}$/.test(h?.id ?? '')) b.push(`${w}: id w formacie H-nn`);
    else if (ids.has(h.id)) b.push(`${w}: powtórzone id`);
    else ids.add(h.id);
    if (!h?.metryka || !h?.zrodlo) b.push(`${w}: brak metryki albo źródła danych`);
    if (typeof p?.wartosc !== 'number' || p.wartosc < 0 || p.wartosc > 1) b.push(`${w}: prog.wartosc: ułamek z [0; 1]`);
    if (!['>=', '<='].includes(p?.kierunek)) b.push(`${w}: prog.kierunek: ">=" albo "<="`);
    if (!p?.decyzja) b.push(`${w}: próg bez ID decyzji właściciela`);
    if (!Number.isInteger(h?.min_proba) || h.min_proba < 1) b.push(`${w}: min_proba: liczba całkowita ≥ 1`);
    if (!dataOk(h?.data_oceny)) b.push(`${w}: data_oceny: prawdziwa data RRRR-MM-DD`);
    if (!m?.zastepnik) b.push(`${w}: mierzalność: brak zastępnika na pustą komórkę`);
    if (!Number.isInteger(m?.oczekiwane_n) || m.oczekiwane_n < (h?.min_proba ?? 1)) b.push(`${w}: mierzalność: oczekiwane n poniżej minimalnej próby`);
    if (!d) continue;
    if (![d.licznik, d.mianownik].every(Number.isInteger) || d.licznik < 0 || d.mianownik < 1 || d.licznik > d.mianownik) b.push(`${w}: dane: 0 ≤ licznik ≤ mianownik, liczby całkowite, mianownik ≥ 1`);
    if (!dataOk((d.zrodlo ?? '').match(/\d{4}-\d{2}-\d{2}/)?.[0])) b.push(`${w}: dane: brak źródła z prawdziwą datą odczytu`);
  }
  return b;
}

export function ocen(h, z, dzis) {
  if (dzis < h.data_oceny) return { werdykt: 'przed terminem, bez oceny' };
  if (!h.dane) return { werdykt: 'po terminie, brak danych' };
  const w = wilson(h.dane.licznik, h.dane.mianownik, z), t = h.prog.wartosc, wiecej = h.prog.kierunek === '>=';
  if (h.dane.mianownik < h.min_proba) return { ...w, werdykt: 'za mało danych' };
  if (wiecej ? w.dol >= t : w.gora <= t) return { ...w, werdykt: 'potwierdzona' };
  return { ...w, werdykt: (wiecej ? w.gora < t : w.dol > t) ? 'obalona' : 'nierozstrzygnięta' };
}

const pr = (v) => `${(v * 100).toFixed(1).replace('.', ',')}%`;
export function tabela(x, dzis) {
  const z = x.z ?? 1.645;
  return [`| H | Metryka | Próg | Dane | Przedział (z = ${z}) | Werdykt |`, '|---|---|---|---|---|---|', ...x.hipotezy.map((h) => {
    const o = ocen(h, z, dzis), d = o.p === undefined ? null : h.dane;
    return `| ${h.id} | ${h.metryka} | ${h.prog.kierunek === '>=' ? '≥' : '≤'} ${pr(h.prog.wartosc)} (${h.prog.decyzja}) | ${d ? `${d.licznik}/${d.mianownik} = ${pr(o.p)}` : '—'} | ${d ? `${pr(o.dol)}–${pr(o.gora)}` : '—'} | ${o.werdykt} |`;
  })].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [plik, ...r] = process.argv.slice(2);
  if (!plik) { console.error('Użycie: node hipotezy.mjs <hipotezy.json> [--dzis RRRR-MM-DD]'); process.exit(2); }
  const dzis = r.includes('--dzis') ? r[r.indexOf('--dzis') + 1] : new Date().toISOString().slice(0, 10);
  const x = JSON.parse(readFileSync(plik, 'utf8'));
  const b = [...sprawdz(x), ...(dataOk(dzis) ? [] : ['--dzis: prawdziwa data RRRR-MM-DD'])];
  if (b.length) { for (const e of b) console.error(`BŁĄD ${e}`); process.exit(1); }
  console.log(tabela(x, dzis));
}
