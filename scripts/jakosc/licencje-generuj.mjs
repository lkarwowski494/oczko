// Generator danych ekranu „Open source licenses” (M1-245, P-661, 2026-11-10): lista pakietów npm z licencją i notą o prawach autorskich, treści licencji,
// biblioteki natywne iOS spoza npm i kroje dołączone do aplikacji → src/domena/licencje.generated.ts (moduł wchodzi do paczki JS aplikacji; to dowód,
// że tekst OFL kroju Bree Serif jest w pakiecie, a nie tylko w assets/ czytanym przez testy). Rozszerza scripts/jakosc/licencje.mjs (wspólny graf
// zależności produkcyjnych); wzór: Trening scripts/licenses.mjs (2e4b0f8). Różnice względem Treningu: (1) kroje to osobna sekcja z pełnym tekstem licencji
// (OFL warunek 2: nota i licencja przy każdej kopii kroju), (2) zawijanie akapitów treści licencji (reguła z docs/design/narzedzia/licencje-makieta.mjs),
// (3) bez pakietów związanych z platformą (pola os/cpu w package-lock: fsevents, lightningcss-*) — narzędzia budowania, których nie ma w paczce iOS,
// a ich obecność w node_modules zależy od systemu, więc lista byłaby różna na Linuksie i macOS.
// Uproszczenie nazwane (jak Trening): graf `dependencies` obejmuje też narzędzia budowania wymagane przez pakiety aplikacji (Expo CLI) — lista raczej za szeroka niż za wąska.
// Użycie: node scripts/jakosc/licencje-generuj.mjs [--check] [--katalog <korzeń>]  (zapis albo kontrola zgodności; kod 1 = rozjazd lub błąd danych, 2 = brak locka)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { grafProdukcyjny } from './licencje.mjs';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
export const WYJSCIE = 'src/domena/licencje.generated.ts';

/** Wiersz, którego nie łączymy z sąsiednim: pusty, same dywizy, nagłówek wersalikami (PREAMBLE, DEFINITIONS…). */
const sztywna = (l) => !l.trim() || /^-+$/.test(l.trim()) || /^[A-Z0-9 .,-]+$/.test(l.trim());
/** Zawijanie akapitów: pojedyncze złamanie wiersza w akapicie → spacja; bez zmian puste linie, linie z samych dywizów, nagłówki wersalikami i punkty „1)”.
 *  Pliki licencji mają twarde złamania co ok. 60–70 znaków, które przy 320 pt dają poszarpane wiersze; tekst poza białymi znakami bez zmian. */
export const zawin = (t) => t.split('\n').reduce((acc, l) => {
  const p = acc.length ? acc[acc.length - 1] : null;
  if (p !== null && !sztywna(p) && !sztywna(l) && !/^\d+\)/.test(l.trim())) acc[acc.length - 1] = `${p} ${l.trim()}`; else acc.push(l);
  return acc;
}, []).join('\n');

const PLIK_LICENCJI = /^(licen[cs]e|copying)([._-].*)?$/i;
const NOTA = /^\s*(?:copyright\b|\(c\)\s*\d|©)/i;
const PODSTAWKA = /<[^>]+>|\[[^\]]*(?:yyyy|year|name)[^\]]*\]|copyright (?:notice|holders?|owner)|copyright and license|^\s*copyright\s*$/i;
const zbij = (s) => s.replace(/\s+/g, ' ').trim();
const nazwaPakietu = (k) => k.slice(k.lastIndexOf('node_modules/') + 'node_modules/'.length);

export function zbuduj(korzen) {
  const bledy = [];
  const graf = grafProdukcyjny(korzen);
  if (!graf) return null;
  const pliki = (dir) => { try { return readdirSync(join(korzen, dir)).filter((f) => PLIK_LICENCJI.test(f)).sort(); } catch { return []; } };
  const noty = (dir, pj) => {
    const out = [];
    for (const f of pliki(dir)) {
      for (const linia of readFileSync(join(korzen, dir, f), 'utf8').split(/\r?\n/)) {
        const l = zbij(linia);
        if (NOTA.test(l) && /\d{4}|©|\(c\)/i.test(l) && !PODSTAWKA.test(l) && l.length < 200 && !out.includes(l)) out.push(l);
      }
    }
    if (!out.length && pj) { const a = typeof pj.author === 'string' ? pj.author : pj.author?.name; if (a) out.push(`© ${zbij(a.replace(/\s*[<(][^>)]*[>)]/g, ''))}`); }
    return out.slice(0, 3);
  };
  const wiersze = [];
  let pominiete = 0;
  for (const [k, e] of graf.widziane) {
    if (e.os || e.cpu) { pominiete++; continue; }
    if (!existsSync(join(korzen, k))) { bledy.push(`${nazwaPakietu(k)}: brak katalogu w node_modules (uruchom npm ci)`); continue; }
    let pj = null;
    try { pj = JSON.parse(readFileSync(join(korzen, k, 'package.json'), 'utf8')); } catch { /* licencja z package-lock.json */ }
    const lic = e.license ?? (typeof pj?.license === 'string' ? pj.license : Array.isArray(pj?.licenses) ? pj.licenses.map((x) => x.type ?? x).join(' OR ') : 'UNKNOWN');
    wiersze.push({ n: nazwaPakietu(k), v: e.version ?? pj?.version ?? '', l: lic, c: noty(k, pj), dir: k });
  }
  wiersze.sort((a, b) => (a.n < b.n ? -1 : a.n > b.n ? 1 : a.v < b.v ? -1 : a.v > b.v ? 1 : 0));
  const uniq = wiersze.filter((r, i) => !(i > 0 && wiersze[i - 1].n === r.n && wiersze[i - 1].v === r.v));
  if (!uniq.length) bledy.push('lista pakietów npm pusta');

  // Treść licencji: z pliku LICENSE pierwszego pakietu z tą (prostą) licencją, bez linii z prawami autorskimi (noty są przy pakietach).
  const ids = [...new Set(uniq.flatMap((r) => r.l.replace(/[()]/g, ' ').split(/\s+(?:OR|AND)\s+|\s+/).filter((x) => x && x !== 'OR' && x !== 'AND')))].sort();
  const teksty = {};
  for (const id of ids) {
    const zr = uniq.find((r) => r.l === id && pliki(r.dir).length);
    if (!zr) continue;
    const surowy = readFileSync(join(korzen, zr.dir, pliki(zr.dir)[0]), 'utf8').split(/\r?\n/).filter((l) => !(NOTA.test(zbij(l)) && !PODSTAWKA.test(zbij(l)))).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    teksty[id] = { z: zr.n, tekst: zawin(surowy) };
  }

  // Biblioteki natywne iOS spoza npm (wersje z podspec React Native) i kroje z plikami licencji.
  const opis = JSON.parse(readFileSync(join(korzen, 'scripts/jakosc/licencje-natywne.json'), 'utf8'));
  const RN = join(korzen, 'node_modules/react-native');
  const pomocnik = readFileSync(join(RN, 'scripts/cocoapods/helpers.rb'), 'utf8');
  const wersjaPoda = (pod) => (pod === 'RCT-Folly' ? /@@folly_config = \{\s*:version => '([^']+)'/.exec(pomocnik)?.[1]
    : pod === 'SocketRocket' ? /@@socket_rocket_config = \{\s*:version => '([^']+)'/.exec(pomocnik)?.[1]
    : existsSync(join(RN, 'third-party-podspecs', `${pod}.podspec`)) ? /spec\.version\s*=\s*['"]([^'"]+)['"]/.exec(readFileSync(join(RN, 'third-party-podspecs', `${pod}.podspec`), 'utf8'))?.[1] : undefined);
  for (const p of opis.pods) if (!p.zrodloWersji && wersjaPoda(p.pod) !== p.version) bledy.push(`${p.pod}: lista ${p.version}, podspec ${wersjaPoda(p.pod) ?? 'brak'}`);
  for (const f of readdirSync(join(RN, 'third-party-podspecs')).filter((x) => x.endsWith('.podspec') && x !== 'ReactNativeDependencies.podspec')) {
    if (!opis.pods.some((p) => `${p.pod}.podspec` === f)) bledy.push(`${f}: podspec React Native bez wpisu w scripts/jakosc/licencje-natywne.json`);
  }
  for (const p of opis.pods) {
    if (teksty[p.license]) continue;
    const f = join(korzen, 'scripts/jakosc/licencje-natywne', `${p.license}.txt`);
    if (existsSync(f)) teksty[p.license] = { z: p.name, tekst: zawin(readFileSync(f, 'utf8').replace(/\r\n/g, '\n').trim()) };
    else bledy.push(`${p.name}: brak treści licencji ${p.license}`);
  }
  const kroje = [];
  for (const f of opis.fonts) {
    if (!existsSync(join(korzen, f.file))) { bledy.push(`${f.name}: brak pliku licencji kroju ${f.file}`); continue; }
    if (!existsSync(join(korzen, f.font))) bledy.push(`${f.name}: brak pliku kroju ${f.font}`);
    const tekst = readFileSync(join(korzen, f.file), 'utf8').replace(/\r\n/g, '\n').trim();
    const nota = tekst.split('\n')[0].trim();
    if (!NOTA.test(nota)) bledy.push(`${f.name}: pierwszy wiersz pliku licencji nie jest notą o prawach autorskich`);
    kroje.push({ id: f.id, nazwa: f.name, spdx: f.license, nota, tekst: zawin(tekst) });
  }
  // Każdy krój dołączany wtyczką expo-font (app.json) musi być na liście: brak = krój w paczce bez licencji w aplikacji.
  const app = JSON.parse(readFileSync(join(korzen, 'app.json'), 'utf8'));
  for (const w of app.expo?.plugins ?? []) {
    if (Array.isArray(w) && w[0] === 'expo-font') {
      for (const plik of w[1]?.ios?.fonts ?? []) {
        const rel = plik.replace(/^\.\//, '');
        if (!opis.fonts.some((f) => f.font === rel)) bledy.push(`app.json: krój ${rel} bez wpisu w scripts/jakosc/licencje-natywne.json (fonts)`);
      }
    }
  }

  const wpis = (r) => JSON.stringify([r.n, r.v, r.l, r.c]);
  const natywne = opis.pods.map((p) => JSON.stringify([p.name, p.version, p.license, p.copyright]));
  const tekstyPosortowane = Object.fromEntries(Object.entries(teksty).sort(([a], [b]) => (a < b ? -1 : 1)));
  const ciało = [
    '// Wygenerowane: node scripts/jakosc/licencje-generuj.mjs (M1-245, P-661) — nie edytować ręcznie; `--check` w jakosc:kontrole sprawdza zgodność z package-lock.json i node_modules.',
    '',
    '/** [nazwa, wersja, licencja (SPDX), noty o prawach autorskich]. */',
    'export type WpisLicencji = readonly [string, string, string, readonly string[]];',
    '',
    `/** Pakiety npm, od których zależy aplikacja (package-lock, bez devDependencies, bez pakietów związanych z platformą: ${pominiete}). */`,
    `export const PAKIETY_NPM: readonly WpisLicencji[] = [\n${uniq.map((r) => `  ${wpis(r)},`).join('\n')}\n];`,
    '',
    '/** Biblioteki natywne iOS spoza npm wkompilowane przez React Native (wersje z podspec; scripts/jakosc/licencje-natywne.json). */',
    `export const NATYWNE_IOS: readonly WpisLicencji[] = [\n${natywne.map((r) => `  ${r},`).join('\n')}\n];`,
    '',
    '/** Kroje dołączone do aplikacji: pełny tekst licencji razem z notą (OFL-1.1, warunek 2). */',
    'export const KROJE: readonly { readonly id: string; readonly nazwa: string; readonly spdx: string; readonly nota: string; readonly tekst: string }[] = '
      + `${JSON.stringify(kroje, null, 2)};`,
    '',
    `/** Treść licencji wg identyfikatora SPDX (z pliku LICENSE pakietu \`z\`). Bez treści w pakietach: ${JSON.stringify(ids.filter((i) => !teksty[i]))}. */`,
    `export const TEKSTY_LICENCJI: Readonly<Record<string, { readonly z: string; readonly tekst: string }>> = ${JSON.stringify(tekstyPosortowane, null, 2)};`,
    '',
  ].join('\n');
  return { ciało, bledy, liczby: { pakiety: uniq.length, natywne: opis.pods.length, kroje: kroje.length, teksty: Object.keys(teksty).length, pominiete } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const korzen = arg('--katalog') ?? process.cwd();
  const w = zbuduj(korzen);
  if (!w) { console.log(`BŁĄD ${korzen}: brak package-lock.json`); process.exit(2); }
  for (const b of w.bledy) console.log(`BŁĄD licencje: ${b}`);
  if (w.bledy.length) process.exit(1);
  const cel = join(korzen, WYJSCIE);
  const opis = `${w.liczby.pakiety} pakietów npm, ${w.liczby.natywne} bibliotek natywnych, ${w.liczby.kroje} krojów, ${w.liczby.teksty} treści licencji`;
  if (process.argv.includes('--check')) {
    if ((existsSync(cel) ? readFileSync(cel, 'utf8') : '') !== w.ciało) { console.log(`BŁĄD licencje: ${WYJSCIE} nie zgadza się z package-lock.json / node_modules / plikami licencji — uruchom: node scripts/jakosc/licencje-generuj.mjs`); process.exit(1); }
    console.log(`licencje-generuj: OK (${opis})`);
  } else { writeFileSync(cel, w.ciało); console.log(`licencje-generuj: zapisano ${WYJSCIE} (${opis})`); }
}
