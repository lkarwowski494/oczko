#!/usr/bin/env node
// Wybór symulatora iPhone'a dla e2e-ios.yml (M1-audytor-generalny-058): z listy `simctl list devices available` (stdin) bierze urządzenia pasujące
// do wyrażenia (argument 1) i zwraca NAJWĘŻSZE (szerokość ekranu w pt), a nie pierwsze z listy — nocny przebieg „mały ekran” wybierał iPhone 17e (390 pt),
// bo lista jest posortowana po modelu, nie po rozmiarze. Remis szerokości: pierwszy z listy. Nieznany model: szerokość „?”, wybierany ostatni.
//   node scripts/ci/sim-wybor.mjs 'iPhone SE|iPhone 16e|iPhone 17e' < lista.txt          → UDID (pusty wynik = brak dopasowania)
//   node scripts/ci/sim-wybor.mjs 'iPhone SE|iPhone 16e|iPhone 17e' --opis < lista.txt   → „iPhone 17e — szerokość ekranu 390 pt (próg małego ekranu: 375 pt)”
import fs from 'node:fs';

/** Szerokość ekranu w punktach (pt) wg specyfikacji Apple; jedyne miejsce z tymi liczbami. */
export const SZEROKOSC_PT = {
  'iPhone SE (2nd generation)': 375, 'iPhone SE (3rd generation)': 375, 'iPhone 16e': 390, 'iPhone 17e': 390,
  'iPhone 16': 393, 'iPhone 17': 402, 'iPhone 16 Plus': 430, 'iPhone Air': 420, 'iPhone 16 Pro': 402, 'iPhone 17 Pro': 402,
  'iPhone 16 Pro Max': 440, 'iPhone 17 Pro Max': 440,
};
/** Próg „małego ekranu” — iPhone SE (macierz zawijania: tests/matrix-i18n.test.tsx). */
export const MALY_EKRAN_PT = 375;

export function parsujListe(tekst) {
  return tekst.split('\n').map(l => l.match(/^\s*(.+?) \(([0-9A-F-]{36})\)/)).filter(Boolean).map(m => ({ nazwa: m[1], udid: m[2], pt: SZEROKOSC_PT[m[1]] ?? null }));
}
export function wybierz(tekst, wzorzec) {
  const re = new RegExp(wzorzec);
  const kand = parsujListe(tekst).filter(d => re.test(`${d.nazwa} (${d.udid})`));
  return kand.map((d, i) => ({ d, i })).sort((a, b) => ((a.d.pt ?? 1e9) - (b.d.pt ?? 1e9)) || a.i - b.i)[0]?.d ?? null;
}
export const opis = d => `${d.nazwa} — szerokość ekranu ${d.pt ?? '?'} pt (próg małego ekranu: ${MALY_EKRAN_PT} pt)`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const d = wybierz(fs.readFileSync(0, 'utf8'), process.argv[2] ?? '.');
  if (d) console.log(process.argv.includes('--opis') ? opis(d) : d.udid);
}
