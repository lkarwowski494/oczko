#!/usr/bin/env node
// Plan zrzutów sklepu na wiele lokalizacji (zrzuty-sklepu.yml, zadanie „plan”). Rola 10-wydanie, KO-032, 2026-11-10: „osobny zestaw na każdą lokalizację”.
// Dlaczego osobny zestaw: bez zrzutów danej lokalizacji App Store pokazuje w niej podpisy z języka głównego (Trening: docs/48:299, trening:scripts/asc/zrzuty.mjs:42-46); sklep Oczka ma
// 29 języków aplikacji z lokalizacją ASC (SHOT_LOCALES w scripts/asc/zrzuty.mjs: pozostałe 6 — bg, sl, sr, lt, lv, et — ma pustą listę, bez lokalizacji sklepu).
// Wejście: lista kodów języków aplikacji po przecinku albo „all” (= wszystkie z lokalizacją sklepu), liczba zadań na urządzenie, lista urządzeń (iphone, ipad).
// Wyjście (stdout, JSON): {"jezyki":[…], "matrix":[{"urzadzenie":"iphone","jezyki":"en,pl","nr":1,"zakup":true}, …]}; błąd wejścia = kod 2.
// `zakup` = true tylko dla pierwszego zadania iPhone’a (zrzut ekranu zakupu dla App Review robimy raz, po angielsku).
// Użycie: node scripts/ci/zrzuty-jezyki.mjs "<jezyki|all>" <zadan> [urządzenia]
import { fileURLToPath } from 'node:url';
import { SHOT_LOCALES } from '../asc/zrzuty.mjs';

export const JEZYKI_SKLEPU = Object.entries(SHOT_LOCALES).filter(([, lok]) => lok.length > 0).map(([k]) => k);
export const URZADZENIA = ['iphone', 'ipad'];
export const MAX_ZADAN = 8;

/** Lista języków: puste → en; „all” → wszystkie z lokalizacją sklepu (en pierwszy, potem pl, reszta jak w SHOT_LOCALES); inaczej kody; nieznany kod albo język bez lokalizacji sklepu → błąd. */
export function jezyki(tekst) {
  const t = String(tekst ?? '').trim();
  if (t === 'all') return ['en', 'pl', ...JEZYKI_SKLEPU.filter((k) => k !== 'en' && k !== 'pl')];
  const l = [...new Set((t || 'en').split(',').map((x) => x.trim()).filter(Boolean))];
  const zle = l.filter((x) => !JEZYKI_SKLEPU.includes(x));
  if (zle.length) throw new Error(`język bez lokalizacji sklepu albo nieznany: ${zle.join(', ')} (dozwolone: ${JEZYKI_SKLEPU.join(', ')})`);
  return l;
}

/** Podział na `n` zadań na przemian (en i pl trafiają do różnych zadań, więc pierwsze wyniki są po pierwszej fali); zadań nie więcej niż języków. */
export function chunki(lista, n) {
  const k = Math.max(1, Math.min(Number(n) || 1, MAX_ZADAN, lista.length));
  const wynik = Array.from({ length: k }, () => []);
  lista.forEach((j, i) => wynik[i % k].push(j));
  return wynik;
}

export function plan(tekstJezykow, zadan, urzadzenia = 'iphone,ipad') {
  const lista = jezyki(tekstJezykow);
  const urz = String(urzadzenia).split(',').map((x) => x.trim()).filter(Boolean);
  const zle = urz.filter((u) => !URZADZENIA.includes(u));
  if (!urz.length || zle.length) throw new Error(`nieznane urządzenie: ${zle.join(', ') || '(puste)'} (dozwolone: ${URZADZENIA.join(', ')})`);
  const czesci = chunki(lista, zadan);
  const matrix = urz.flatMap((u) => czesci.map((c, i) => ({ urzadzenie: u, jezyki: c.join(','), nr: i + 1, zakup: u === 'iphone' && i === 0 })));
  return { jezyki: lista, matrix };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(JSON.stringify(plan(process.argv[2], process.argv[3], process.argv[4]))); } catch (e) { console.error(`BŁĄD: ${e.message}`); process.exit(2); }
}
