#!/usr/bin/env node
// Podział scenariuszy Maestro (e2e/scenariusze) na części (maszyny macOS) dla jakosc-ios.yml — deterministyczny i zrównoważony czasowo.
// Port scripts/ci/e2e-shards.mjs z repo lkarwowski494/trening @928d0ff (opis wzorca: docs/jakosc/e0/trening-wzorzec.md §2; strategia §5, DS-07, DS-11).
//   node scripts/ci/e2e-czesci.mjs plan            [--dir e2e/scenariusze] [--config e2e/czesci.json]  → JSON pełnego podziału (testy, podgląd)
//   node scripts/ci/e2e-czesci.mjs plan-podstawowy [...]                                                → JSON podziału pakietu podstawowego
//   node scripts/ci/e2e-czesci.mjs --plan          [...]                                                → oba plany jako tabela (podgląd dla człowieka)
//   node scripts/ci/e2e-czesci.mjs czesc N [--out .maestro-czesc] [...]                                 → katalog części N (scenariusze + subflows)
// Środowisko: ONLY ("04 31") — wybrane numery (wejście workflow; ma pierwszeństwo przed pakietem i NIE zmienia numeru części scenariusza);
// PAKIET = przypadki | pelny | podstawowy | ipad. Puste → `przypadki` (P-834, sesja BX 2026-11-15: katalog przypadków użycia
// docs/jakosc/przypadki-uzycia.md biegnie po KAŻDYM buildzie; wcześniej domyślny był podstawowy, a pełny tylko przy „[e2e-pelny]”, DS-11a / P-092).
// `przypadki` = wszystkie scenariusze telefonu (każdy jest przypisany do PU — tests/jakosc/przypadki-uzycia.test.ts); „[e2e-pelny]” i PAKIET=pelny
// to ten sam zestaw i ta sama bramka (nazwa zachowana dla historii poleceń). Bramka w obu: KAŻDY scenariusz części poza tagiem `oczekujacy`
// (scenariusz przed kodem albo przed pierwszym zielonym przebiegiem w CI — zasada roli 07 nr 8; wynik „czerwony-informacyjnie”).
// Tag `ipad` (P-225 Q1a): scenariusze iPada tylko w pakiecie `ipad` (osobna pozycja macierzy na symulatorze iPada, `czesci_ipad` maszyn),
// od P-834 uruchamiane przy każdym przebiegu (wcześniej tylko „[e2e-pelny]”/„[e2e-ipad]”); nie wchodzą do pakietów telefonu; bez bramki (P-225 Q1a).
// Pakiet podstawowy = scenariusze z tagiem `podstawowy` (bramka TestFlight, P-091 9a); liczy własny plan na `czesci_podstawowy` maszynach
// (jak Trening). Pełny i wybrane: plan liczony ZAWSZE dla pełnego zestawu, dopiero potem filtrowany.
// Waga scenariusza: `wagi_s[plik]` (pomiar z przebiegu) albo szacunek z liczby kroków: 50 s + 1,86 s × krok (regresja Treningu na 25 zmierzonych
// scenariuszach, docs/38:120 tamtego repo); kroki liczone rekurencyjnie (retry, runFlow z podprzepływami).
// Algorytm: LPT — największa waga najpierw na najmniej obciążoną część; remisy według nazwy pliku i numeru części.
// Tag `osobny-krok` (np. NFR-DOS-002: rozmiar tekstu AX5 ustawiany przez simctl) — scenariusz w swojej części, ale w osobnym kroku workflow.
// P-091 (9a): scenariusze z tagiem `stan-licznika` (asercja wartości licznika) NIE są ponawiane — wyjście `bez_ponowien`; `ponawialne` = reszta.
// Wyjście ($GITHUB_OUTPUT): main, osobne, any (true/false), ponawialne, bez_ponowien, bramka (nazwy plików po spacji), timeout_min (30 + 4 × scenariusze części, strategia §5).
// bramka (F07-15, P-198 Q1a; P-834): scenariusze, których porażka czerwieni krok — pakiet podstawowy i wybrane (ONLY): tag `podstawowy`;
// przypadki/pelny: wszystkie poza tagiem `oczekujacy` (scenariusz z tagiem `podstawowy` nie może mieć tagu `oczekujacy` — test przypadki-uzycia).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DOMYSLNY_KATALOG = path.join(root, 'e2e', 'scenariusze');
export const DOMYSLNA_KONFIGURACJA = path.join(root, 'e2e', 'czesci.json');
export const PODSTAWA_S = 50;
export const SEKUNDY_NA_KROK = 1.86;

export function czytajKonfiguracje(plik) { return JSON.parse(fs.readFileSync(plik, 'utf8')); }

/** Pliki scenariuszy: NN-*.yaml w katalogu (bez config.yaml i podkatalogu subflows). Pusty katalog to błąd (strategia §3, zasada 2). */
export function plikiScenariuszy(katalog) {
  if (!fs.existsSync(katalog)) throw new Error(`Brak katalogu scenariuszy: ${katalog}`);
  const pliki = fs.readdirSync(katalog, { withFileTypes: true }).filter(e => e.isFile() && /^\d{2,}-[^/]*\.yaml$/.test(e.name)).map(e => e.name).sort();
  if (!pliki.length) throw new Error(`Katalog scenariuszy bez scenariuszy NN-*.yaml: ${katalog}`);
  return pliki;
}

/** Scenariusz Maestro: pierwszy dokument YAML = nagłówek (appId, name, tags), ostatni = lista poleceń. */
export function wczytajScenariusz(plik) {
  const docs = YAML.parseAllDocuments(fs.readFileSync(plik, 'utf8')).map(d => { if (d.errors.length) throw new Error(`${plik}: ${d.errors[0].message}`); return d.toJS(); });
  const naglowek = docs.length > 1 ? (docs[0] ?? {}) : {};
  const polecenia = docs[docs.length - 1] ?? [];
  if (!Array.isArray(polecenia)) throw new Error(`${plik}: ostatni dokument YAML nie jest listą poleceń`);
  return { naglowek, polecenia, tagi: Array.isArray(naglowek.tags) ? naglowek.tags.map(String) : [] };
}

export const maTag = (katalog, f, tag) => wczytajScenariusz(path.join(katalog, f)).tagi.includes(tag);

/** Liczba kroków (jak w logu Maestro): każde polecenie; retry i runFlow także wnętrze (runFlow: plik podprzepływu względem pliku wołającego). */
export function liczKroki(plik, stos = []) {
  if (stos.includes(plik)) throw new Error(`Cykl runFlow: ${[...stos, plik].join(' → ')}`);
  const { polecenia } = wczytajScenariusz(plik);
  const zLisy = (lista) => lista.reduce((s, p) => s + jedno(p), 0);
  const jedno = (p) => {
    if (typeof p === 'string') return 1;
    const [nazwa, arg] = Object.entries(p)[0];
    if (nazwa === 'retry') return 1 + zLisy(arg?.commands ?? []);
    if (nazwa === 'repeat') return 1 + zLisy(arg?.commands ?? []);
    if (nazwa === 'runFlow') {
      if (typeof arg === 'string' || arg?.file) return 1 + liczKroki(path.resolve(path.dirname(plik), typeof arg === 'string' ? arg : arg.file), [...stos, plik]);
      return 1 + zLisy(arg?.commands ?? []);
    }
    return 1;
  };
  return zLisy(polecenia);
}

export const szacunekS = (kroki) => Math.round(PODSTAWA_S + SEKUNDY_NA_KROK * kroki);

export function waga(katalog, cfg, f) { return cfg.wagi_s?.[f] ?? szacunekS(liczKroki(path.join(katalog, f))); }

export function buildPlan(katalog, cfg, opt = {}) {
  const pliki = opt.files ?? plikiScenariuszy(katalog);
  const czesci = opt.czesci ?? cfg.czesci;
  if (!Number.isInteger(czesci) || czesci < 1) throw new Error(`Liczba części musi być dodatnią liczbą całkowitą (jest: ${czesci})`);
  const elementy = pliki.map(f => {
    const tagi = wczytajScenariusz(path.join(katalog, f)).tagi;
    const osobny = tagi.includes('osobny-krok');
    return { f, osobny, bezPonowien: tagi.includes('stan-licznika'), bramka: tagi.includes('podstawowy'), oczekujacy: tagi.includes('oczekujacy'), waga: waga(katalog, cfg, f) + (osobny ? cfg.narzut_osobnego_kroku_s ?? 0 : 0) };
  });
  elementy.sort((a, b) => b.waga - a.waga || a.f.localeCompare(b.f));
  const czesciL = Array.from({ length: czesci }, (_, i) => ({ czesc: i + 1, files: [], osobne: [], waga_s: 0, bez_ponowien: [], ponawialne: [], bramka: [], oczekujace: [], timeout_min: 0 }));
  for (const e of elementy) {
    const c = czesciL.reduce((m, x) => (x.waga_s < m.waga_s ? x : m), czesciL[0]);
    (e.osobny ? c.osobne : c.files).push(e.f); (e.bezPonowien ? c.bez_ponowien : c.ponawialne).push(e.f); if (e.bramka) c.bramka.push(e.f); if (e.oczekujacy) c.oczekujace.push(e.f); c.waga_s += e.waga;
  }
  for (const c of czesciL) { c.files.sort(); c.osobne.sort(); c.bez_ponowien.sort(); c.ponawialne.sort(); c.bramka.sort(); c.oczekujace.sort(); c.timeout_min = 30 + 4 * (c.files.length + c.osobne.length); }
  return czesciL;
}

export function plikiPakietu(katalog, lista) { return lista.filter(f => maTag(katalog, f, 'podstawowy')); }

/** „04 31” → filtr po numerach (całe numery, nie podciągi: „3” nie wybiera 31–39). */
export function wybierzPliki(lista, only) {
  const nums = (only || '').split(/[\s,]+/).filter(Boolean);
  if (!nums.length) return lista;
  return lista.filter(f => nums.includes(f.slice(0, f.indexOf('-'))));
}

/** Pakiet: ONLY → wybrane; PAKIET jawny; „[e2e-pelny]” w treści commitu → pełny (DS-11a); domyślnie przypadki użycia (P-834; ten sam zestaw i bramka co pełny). */
export function wybierzPakiet(env) {
  if ((env.ONLY || '').trim()) return 'wybrane';
  const p = (env.PAKIET || '').trim();
  if (p) { if (!['przypadki', 'podstawowy', 'pelny', 'ipad'].includes(p)) throw new Error(`Pakiet musi być „przypadki”, „podstawowy”, „pelny” albo „ipad” (jest: ${p})`); return p; }
  return /\[e2e-pelny\]/.test(env.COMMIT_MSG || '') ? 'pelny' : 'przypadki';
}

function arg(name, def) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : def; }

function tabela(tytul, parts) {
  const w = parts.map(p => p.waga_s); const sr = w.reduce((a, b) => a + b, 0) / w.length;
  const l = [`${tytul}: ${parts.length} części, razem ${w.reduce((a, b) => a + b, 0)} s, średnio ${Math.round(sr)} s, największa ${Math.max(...w)} s (${Math.round(Math.max(...w) / sr * 100)}% średniej)`];
  for (const p of parts) l.push(`  część ${p.czesc}: ${p.waga_s} s, ${p.files.length + p.osobne.length} scen., timeout ${p.timeout_min} min, bez ponowień ${p.bez_ponowien.length}: ${[...p.files, ...p.osobne.map(f => f + ' (osobny krok)')].join(', ')}`);
  return l.join('\n');
}

function main() {
  const cmd = process.argv[2];
  const katalog = path.resolve(arg('--dir', DOMYSLNY_KATALOG));
  const cfg = czytajKonfiguracje(path.resolve(arg('--config', DOMYSLNA_KONFIGURACJA)));
  const wszystkie = plikiScenariuszy(katalog);
  const telefon = wszystkie.filter(f => !maTag(katalog, f, 'ipad')), ipad = wszystkie.filter(f => maTag(katalog, f, 'ipad'));
  const planPodstawowy = () => buildPlan(katalog, cfg, { files: plikiPakietu(katalog, telefon), czesci: cfg.czesci_podstawowy });
  const planPelny = () => buildPlan(katalog, cfg, { files: telefon });
  if (cmd === 'plan') { console.log(JSON.stringify(planPelny(), null, 2)); return; }
  if (cmd === 'plan-podstawowy') { console.log(JSON.stringify(planPodstawowy(), null, 2)); return; }
  if (cmd === '--plan') { console.log(tabela('Pełny katalog', planPelny()) + '\n' + tabela('Pakiet podstawowy', planPodstawowy()) + (ipad.length ? '\n' + tabela('Pakiet iPada', buildPlan(katalog, cfg, { files: ipad, czesci: cfg.czesci_ipad ?? 1 })) : '')); return; }
  if (cmd !== 'czesc') { console.error('Użycie: e2e-czesci.mjs plan | plan-podstawowy | --plan | czesc N'); process.exit(2); }
  const only = process.env.ONLY || '';
  let pakiet; try { pakiet = wybierzPakiet(process.env); } catch (e) { console.error(e.message); process.exit(2); }
  const n = Number(process.argv[3]);
  if (!Number.isInteger(n) || n < 1 || n > cfg.czesci) { console.error(`Numer części musi być od 1 do ${cfg.czesci} (jest: ${process.argv[3]})`); process.exit(2); }
  const parts = pakiet === 'podstawowy' ? planPodstawowy()
    : pakiet === 'ipad' ? buildPlan(katalog, cfg, { files: ipad, czesci: cfg.czesci_ipad ?? 1 }) /* P-834: iPad przy każdym przebiegu */
    : planPelny();
  const unknown = only.split(/[\s,]+/).filter(Boolean).filter(x => !wybierzPliki(wszystkie, x).length);
  if (unknown.length) console.log(`::warning::Wybrane numery bez scenariusza: ${unknown.join(' ')}`);
  /* pakiet podstawowy ma mniej części niż macierz workflow — nadmiarowe maszyny kończą od razu (any=false) */
  const moja = parts[n - 1] ?? { files: [], osobne: [], waga_s: 0, bez_ponowien: [], ponawialne: [], bramka: [], oczekujace: [], timeout_min: 30 };
  const zwykle = wybierzPliki(moja.files, only), osobne = wybierzPliki(moja.osobne, only);
  const out = path.resolve(arg('--out', '.maestro-czesc'));
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  if (zwykle.length || osobne.length) fs.cpSync(path.join(katalog, 'subflows'), path.join(out, 'subflows'), { recursive: true });
  for (const f of zwykle) fs.copyFileSync(path.join(katalog, f), path.join(out, f));
  if (osobne.length) { fs.mkdirSync(path.join(out, 'osobne'), { recursive: true }); fs.cpSync(path.join(katalog, 'subflows'), path.join(out, 'osobne', 'subflows'), { recursive: true }); for (const f of osobne) fs.copyFileSync(path.join(katalog, f), path.join(out, 'osobne', f)); }
  const wybrane = [...zwykle, ...osobne];
  const bezPon = wybrane.filter(f => moja.bez_ponowien.includes(f)), pon = wybrane.filter(f => moja.ponawialne.includes(f)), bramka = pakiet === 'ipad' ? []
    : pakiet === 'przypadki' || pakiet === 'pelny' ? wybrane.filter(f => !moja.oczekujace.includes(f)) /* P-834 */
    : wybrane.filter(f => moja.bramka.includes(f));
  console.log(`Pakiet: ${pakiet}. Część ${n}/${parts.length}: ${zwykle.length} scenariuszy${osobne.length ? ` + ${osobne.length} w osobnym kroku` : ''} (waga ok. ${Math.round(moja.waga_s / 60)} min; bez ponowień P-091 9a: ${bezPon.length})`);
  for (const f of zwykle) console.log(`  ${f}${bezPon.includes(f) ? ' (stan-licznika: bez ponowienia)' : ''}${bramka.includes(f) ? '' : moja.oczekujace.includes(f) ? ' (oczekujący: informacyjnie)' : ' (informacyjnie)'}`);
  for (const f of osobne) console.log(`  ${f} (osobny krok)`);
  const lines = [`main=${zwykle.length > 0}`, `osobne=${osobne.length > 0}`, `any=${wybrane.length > 0}`, `ponawialne=${pon.join(' ')}`, `bez_ponowien=${bezPon.join(' ')}`, `bramka=${bramka.join(' ')}`, `timeout_min=${30 + 4 * wybrane.length}`];
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
