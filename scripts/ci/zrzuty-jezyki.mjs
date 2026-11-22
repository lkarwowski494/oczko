#!/usr/bin/env node
// Plan zrzutów sklepu na wiele lokalizacji (zrzuty-sklepu.yml, zadanie „plan”). Rola 10-wydanie, KO-032, 2026-11-10: „osobny zestaw na każdą lokalizację”.
// Dlaczego osobny zestaw: bez zrzutów danej lokalizacji App Store pokazuje w niej podpisy z języka głównego (Trening: docs/48:299, trening:scripts/asc/zrzuty.mjs:42-46); sklep Oczka ma
// 29 języków aplikacji z lokalizacją ASC (SHOT_LOCALES w scripts/asc/zrzuty.mjs: pozostałe 6 — bg, sl, sr, lt, lv, et — ma pustą listę, bez lokalizacji sklepu).
// Wejście: lista kodów języków aplikacji po przecinku albo „all” (= wszystkie z lokalizacją sklepu), liczba zadań na urządzenie, lista urządzeń (iphone, ipad).
// Wyjście (stdout, JSON): {"jezyki":[…], "matrix":[{"urzadzenie":"iphone","jezyki":"en,pl","nr":1,"zakup":true}, …]}; błąd wejścia = kod 2.
// `zakup` = true tylko dla pierwszego zadania iPhone’a (zrzut ekranu zakupu dla App Review robimy raz, po angielsku).
// Uzupełnienie (10-wydanie-002; analogia: trening:scripts/ci/store-shards.mjs:36-50 i store-screenshots.yml:37-44): 4. argument = katalog z surowymi zrzutami POPRZEDNIEGO przebiegu, 5. = lista `powtorz`
// (po `zrzuty-uzupelnij.mjs powtorz`). Wtedy macierz zawiera tylko języki z brakującymi scenami, pole `sceny` ("język=scena,scena;język=…") mówi zadaniu, co zrobić, a waga języka = liczba brakujących scen.
// `zakup` w uzupełnieniu tylko na życzenie (`en/99-zakup` w `powtorz`): pierwsze zadanie iPhone’a albo osobne zadanie bez języków. Wyjście ma też `zadania` (liczba wpisów macierzy; 0 = nic do roboty na macOS).
// Zmienna ZRZUTY_DZIEN (RRRR-MM-DD, opcjonalna): dopisuje do wpisów macierzy `teraz` i `dzien` (AQ, KO-046; tests/wydanie/zrzuty-data-ipada.test.ts).
// Użycie: node scripts/ci/zrzuty-jezyki.mjs "<jezyki|all>" <zadan> [urządzenia] [katalog_poprzednich] [powtorz]
import { fileURLToPath } from 'node:url';
import { SHOT_LOCALES } from '../asc/zrzuty.mjs';
import { brakujace, dniPracy, parsujPowtorz, sprawdzDzien, terazDnia } from './zrzuty-uzupelnij.mjs';

export const JEZYKI_SKLEPU = Object.entries(SHOT_LOCALES).filter(([, lok]) => lok.length > 0).map(([k]) => k);
export const URZADZENIA = ['iphone', 'ipad'];
export const MAX_ZADAN = 8;
/** Pomiar przebiegu 42784539154: ≈ 4,9 min na scenę (34 min na 7 scen) + ≈ 8 min danych; 35 scen (5 języków) ≈ 3 h przy limicie zadania 330 min (`timeout-minutes` w workflowie). */
export const MAX_SCEN_NA_ZADANIE = 35;
const SCEN_NA_JEZYK = 7;
/** Najwyżej tyle języków w zadaniu przebiegu zwykłego (= MAX_SCEN_NA_ZADANIE / SCEN_NA_JEZYK; P-718 „po ≤ 5 języków”); więcej = błąd planu (kod 2), nie cichy podział po swojemu. */
export const MAX_JEZYKOW_NA_ZADANIE = MAX_SCEN_NA_ZADANIE / SCEN_NA_JEZYK;

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

/** Podział z wagami: najcięższy język najpierw, zawsze do najlżejszego zadania (remis: wcześniejsze); w zadaniu języki alfabetycznie (trening:store-shards.mjs:46-50). */
export function chunkiWazone(lista, n, waga) {
  const k = Math.max(1, Math.min(n, lista.length));
  const kosze = Array.from({ length: k }, () => ({ obciazenie: 0, jezyki: [] }));
  for (const j of [...lista].sort((a, b) => waga(b) - waga(a) || a.localeCompare(b))) {
    const k0 = kosze.reduce((m, x) => (x.obciazenie < m.obciazenie ? x : m));
    k0.jezyki.push(j); k0.obciazenie += waga(j);
  }
  return kosze.map((x) => x.jezyki.sort());
}

/** AQ (KO-046): z `opcje.dzien` każdy wpis macierzy niesie `teraz` (zegar aplikacji = dzień przebiegu o 9:41) i `dzien` (dzień przebiegu = data maszyny na pasku iPada) — jedna wartość dla wszystkich zadań zrzutów. */
export function plan(tekstJezykow, zadan, urzadzenia = 'iphone,ipad', opcje = {}) {
  const wynik = planBazowy(tekstJezykow, zadan, urzadzenia, opcje);
  if (opcje.dzien === undefined) return wynik;
  const dzien = sprawdzDzien(opcje.dzien);
  dniPracy(dzien); // 023: dzień, od którego fikstura nie da sensownych kadrów (poniedziałek, 1–7 dzień miesiąca), odrzucamy w planie, przed kolejką macOS
  return { ...wynik, matrix: wynik.matrix.map((m) => ({ ...m, teraz: terazDnia(dzien), dzien })) };
}

function planBazowy(tekstJezykow, zadan, urzadzenia, opcje) {
  const lista = jezyki(tekstJezykow);
  const urz = String(urzadzenia).split(',').map((x) => x.trim()).filter(Boolean);
  const zle = urz.filter((u) => !URZADZENIA.includes(u));
  if (!urz.length || zle.length) throw new Error(`nieznane urządzenie: ${zle.join(', ') || '(puste)'} (dozwolone: ${URZADZENIA.join(', ')})`);
  if (opcje.poprzednie) return planUzupelnienia(lista, zadan, urz, opcje);
  const czesci = chunki(lista, zadan);
  const najwiecej = Math.max(...czesci.map((c) => c.length));
  if (najwiecej > MAX_JEZYKOW_NA_ZADANIE) {
    const potrzeba = Math.ceil(lista.length / MAX_JEZYKOW_NA_ZADANIE);
    throw new Error(`${najwiecej} języków na zadanie > ${MAX_JEZYKOW_NA_ZADANIE} (limit czasu zadania 330 min, ≈ 30 min na język): ustaw zadan ≥ ${potrzeba}${potrzeba > MAX_ZADAN ? ` (najwyżej ${MAX_ZADAN} — zawęź języki albo rób partiami)` : ''}`);
  }
  const matrix = urz.flatMap((u) => czesci.map((c, i) => ({ urzadzenie: u, jezyki: c.join(','), nr: i + 1, zakup: u === 'iphone' && i === 0 })));
  return { jezyki: lista, matrix, zadania: matrix.length };
}

function planUzupelnienia(lista, zadan, urz, { poprzednie, powtorz }) {
  const { pary, zakup } = parsujPowtorz(powtorz);
  const obce = [...new Set(pary.map((p) => p.jezyk))].filter((j) => !lista.includes(j));
  if (obce.length) throw new Error(`powtorz: język spoza listy przebiegu: ${obce.join(', ')}`);
  if (zakup && !urz.includes('iphone')) throw new Error('powtorz: zakup (en/99-zakup) robi tylko iPhone — dodaj urządzenie iphone');
  if (zakup && !lista.includes('en')) throw new Error('powtorz: zakup (en/99-zakup) wymaga języka en na liście przebiegu');
  const matrix = [];
  for (const u of urz) {
    const braki = new Map(lista.map((j) => [j, brakujace(poprzednie, u, j)]).filter(([, b]) => b.length));
    const razem = [...braki.values()].reduce((a, b) => a + b.length, 0);
    const k = Math.max(1, Math.min(Number(zadan) || 1, MAX_ZADAN, braki.size, Math.ceil(razem / SCEN_NA_JEZYK))); // zadanie z mniej niż jednym językiem pracy nie zwraca 8 min danych fikcyjnych
    const czesci = braki.size ? chunkiWazone([...braki.keys()], k, (j) => braki.get(j).length) : [];
    czesci.forEach((c, i) => {
      const scen = c.reduce((a, j) => a + braki.get(j).length, 0);
      if (scen > MAX_SCEN_NA_ZADANIE) throw new Error(`zadanie ${u} ${i + 1}: ${scen} scen do zrobienia > ${MAX_SCEN_NA_ZADANIE} (limit czasu zadania) — zwiększ liczbę zadań (zadan) albo zawęź języki`);
      matrix.push({ urzadzenie: u, jezyki: c.join(','), nr: i + 1, zakup: false, sceny: c.map((j) => `${j}=${braki.get(j).join(',')}`).join(';') });
    });
  }
  if (zakup) {
    const pierwszy = matrix.find((m) => m.urzadzenie === 'iphone');
    if (pierwszy) pierwszy.zakup = true; else matrix.unshift({ urzadzenie: 'iphone', jezyki: '', nr: 1, zakup: true, sceny: '' });
  }
  return { jezyki: lista, matrix, zadania: matrix.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(JSON.stringify(plan(process.argv[2], process.argv[3], process.argv[4] || undefined, { poprzednie: process.argv[5] || undefined, powtorz: process.argv[6], dzien: process.env.ZRZUTY_DZIEN || undefined }))); } catch (e) { console.error(`BŁĄD: ${e.message}`); process.exit(2); }
}
