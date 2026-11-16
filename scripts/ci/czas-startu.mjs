#!/usr/bin/env node
// PU-162 (KO-111, BX14; słowa właściciela 16.11.2026 11:10 UTC: „krok w workflow”, informacyjnie, bez progu): czas od `launchApp` do widoczności `dzis-karta`
// z plików `commands.json` Maestro (katalog wyników `--test-output-dir`), jako linie markdown do `$GITHUB_STEP_SUMMARY`.
//   node scripts/ci/czas-startu.mjs <katalog z wynikami Maestro (np. e2e-out)> >> "$GITHUB_STEP_SUMMARY"
// Zawsze kod 0: brak katalogu, pliku, pól albo asercji `dzis-karta` = linia „PU-162: brak danych (powód)”, nigdy czerwony krok (informacyjnie, bez progu).
// Tylko odczyt katalogu; bez sieci, bez sekretów. Używa jakosc-ios.yml (krok „Czas startu (PU-162)” po kroku „Scenariusze”).
// Wzór (ustalenie BX13, zad. 4.4 część 1; pola `metadata.timestamp` i `metadata.duration` w ms, jeden zegar runnera):
//   czas = (timestamp + duration) asercji `dzis-karta` − timestamp `launchApp`.
// Pierwsza widoczność `dzis-karta` = pierwsze LIŚCIOWE polecenie `assertConditionCommand` z `condition.visible` na `dzis-karta` (opakowania `runFlowCommand`
// niosą to samo w środku, ale nie są pomiarem); `launchApp` = najbliższe `launchAppCommand` PRZED nią w tym samym pliku (na 27 plikach przebiegu 43828957399
// pierwszy i najbliższy dają ten sam wynik; najbliższy nie wlicza kroków sprzed ponownego uruchomienia).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CEL = 'dzis-karta';
const NAZWA_PLIKU = /^commands(-.*)?\.json$/;
const SEGMENT_DATY = /^\d{4}-\d{2}-\d{2}_\d{6}$/; // Maestro: <scenariusz>/<data>/<nazwa>/commands.json
const liczba = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

const widocznoscCelu = (e) => {
  const v = e?.command?.assertConditionCommand?.condition?.visible;
  return v !== null && typeof v === 'object' && (v.idRegex === CEL || v.id === CEL);
};
const uruchomienie = (e) => e?.command !== null && typeof e?.command === 'object' && 'launchAppCommand' in e.command;

/** Czas startu [ms] z jednego `commands.json` (już sparsowanego) albo powód braku danych. */
export function czasStartu(polecenia) {
  if (!Array.isArray(polecenia)) return { powod: 'plik nie jest listą poleceń Maestro' };
  const f = polecenia.findIndex(widocznoscCelu);
  if (f < 0) return { powod: `brak asercji widoczności ${CEL}` };
  const cel = polecenia[f];
  if (cel?.metadata?.status !== 'COMPLETED') return { powod: `asercja ${CEL} nie zakończona (status ${String(cel?.metadata?.status)})` };
  let l = -1;
  for (let i = f - 1; i >= 0; i--) if (uruchomienie(polecenia[i])) { l = i; break; }
  if (l < 0) return { powod: `brak launchApp przed ${CEL}` };
  const start = polecenia[l]?.metadata?.timestamp, koniecPocz = cel?.metadata?.timestamp, trwanie = cel?.metadata?.duration;
  if (!liczba(start) || !liczba(koniecPocz) || !liczba(trwanie)) return { powod: 'brak pól metadata.timestamp albo metadata.duration (liczby w ms)' };
  const ms = koniecPocz + trwanie - start;
  if (ms < 0) return { powod: 'niespójne znaczniki czasu (koniec przed początkiem)' };
  return { ms };
}

function pliki(katalog) { // rekurencyjnie, bez dowiązań, posortowane (wynik deterministyczny)
  const wynik = [];
  const idz = (d) => {
    for (const w of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, w.name);
      if (w.isDirectory()) idz(p);
      else if (w.isFile() && NAZWA_PLIKU.test(w.name)) wynik.push(p);
    }
  };
  idz(katalog);
  return wynik;
}

const etykieta = (katalog, plik) => { // „podejscie-1/<scenariusz>” albo „<scenariusz>”: ścieżka przed katalogiem daty
  const seg = path.relative(katalog, path.dirname(plik)).split(path.sep).filter(Boolean);
  const d = seg.findIndex((s) => SEGMENT_DATY.test(s));
  return (d > 0 ? seg.slice(0, d) : seg.slice(0, 1)).join('/') || '.';
};

export function zbierz(katalog) {
  const wyniki = [];
  for (const plik of pliki(katalog)) {
    const scenariusz = etykieta(katalog, plik);
    try { wyniki.push({ scenariusz, ...czasStartu(JSON.parse(fs.readFileSync(plik, 'utf8'))) }); }
    catch (e) { wyniki.push({ scenariusz, powod: `plik nie do odczytu (${String(e?.message ?? e).split('\n')[0].slice(0, 120)})` }); }
  }
  return wyniki;
}

const mediana = (v) => { const s = [...v].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

/** Linie markdown podsumowania; `wyniki` = zbierz(...) albo [] z `powodBrakuPlikow`. */
export function formatuj(wyniki, powodBrakuPlikow = 'brak plików commands.json') {
  const naglowek = [
    '### PU-162: czas startu do „Dziś” (informacyjnie, bez progu)',
    'Czas od `launchApp` do widoczności `dzis-karta` z `commands.json` Maestro (KO-111). To trend między przebiegami, nie czysty czas startu aplikacji: wartość zawiera narzut Maestro i symulatora (uruchomienie przez XCTest, `clearState`, wstrzyknięty zegar). Bez progu; krok nie zmienia wyniku zadania.',
    '',
  ];
  const dobre = wyniki.filter((w) => w.ms !== undefined), zle = wyniki.filter((w) => w.ms === undefined);
  const linie = [...naglowek];
  if (dobre.length) {
    linie.push('| Scenariusz | Czas startu [ms] |', '|---|---|', ...dobre.map((w) => `| ${w.scenariusz} | ${w.ms} |`), '');
    const v = dobre.map((w) => w.ms);
    linie.push(`n = ${v.length}, mediana ${mediana(v)} ms, maks ${Math.max(...v)} ms`);
  }
  if (!wyniki.length) linie.push(`PU-162: brak danych (${powodBrakuPlikow})`);
  for (const w of zle) linie.push(`PU-162: brak danych (${w.scenariusz}: ${w.powod})`);
  return linie.join('\n') + '\n';
}

export function podsumowanie(katalog) {
  if (!katalog) return formatuj([], 'brak argumentu: katalog z wynikami Maestro');
  if (!fs.existsSync(katalog) || !fs.statSync(katalog).isDirectory()) return formatuj([], `katalog nie istnieje: ${katalog}`);
  const wyniki = zbierz(katalog);
  return formatuj(wyniki, `brak plików commands.json w ${katalog}`);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try { process.stdout.write(podsumowanie(process.argv[2])); }
  catch (e) { process.stdout.write(`PU-162: brak danych (błąd skryptu: ${String(e?.message ?? e).split('\n')[0].slice(0, 160)})\n`); }
  process.exitCode = 0; // informacyjnie: nigdy nie zmienia wyniku zadania
}
