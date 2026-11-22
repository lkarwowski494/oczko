#!/usr/bin/env node
// Wyniki E2E z raportów JUnit Maestro (decyzja właściciela 19.10.2026: ponowienie pojedynczego scenariusza + pomiar niestabilności).
//   node scripts/ci/e2e-wyniki.mjs nieudane <report.xml> <katalog-scenariuszy>     → nazwy plików nieudanych scenariuszy (jeden na linię) do ponowienia
//   node scripts/ci/e2e-wyniki.mjs wyniki <e2e-out> <część>                          → e2e-out/wyniki-<część>.json + tabela Markdown na stdout (do $GITHUB_STEP_SUMMARY)
//   node scripts/ci/e2e-wyniki.mjs zbierz <katalog z wyniki-*.json> [--out plik]      → jedno podsumowanie przebiegu: JSON (--out) + Markdown na stdout
// Wynik scenariusza: przeszedl | przeszedl_w_ponowieniu | padl_dwa_razy | padl (tryb ścisły: bez ponowienia). Czas w sekundach z raportu.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const attr = (s, k) => { const m = new RegExp(`\\b${k}="([^"]*)"`).exec(s); return m ? m[1].replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : undefined; };

/** Przypadki testowe z raportu JUnit Maestro: { name, ok, time_s }. Porażka = <failure>/<error> albo status inny niż SUCCESS. */
export function parseJunit(xml) {
  const out = [];
  for (const m of xml.matchAll(/<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const head = m[1], body = m[3] ?? ''; const name = attr(head, 'name') ?? attr(head, 'id'); if (!name) continue;
    const status = attr(head, 'status'); const failed = /<(failure|error)\b/.test(body) || (status != null && !/^(SUCCESS|PASSED|OK)$/i.test(status));
    out.push({ name, ok: !failed, time_s: Math.round(Number(attr(head, 'time') ?? 0)) });
  }
  return out;
}

/** Nazwa scenariusza (`name:` z pliku) → plik w katalogu. */
export function nameToFile(dir) {
  const map = new Map();
  for (const f of fs.readdirSync(dir).filter(x => /\.yaml$/.test(x) && x !== 'config.yaml')) {
    const m = /^name:\s*(.+?)\s*$/m.exec(fs.readFileSync(path.join(dir, f), 'utf8')); if (m) map.set(m[1].replace(/^["']|["']$/g, ''), f);
  }
  return map;
}

const readIf = f => (fs.existsSync(f) ? parseJunit(fs.readFileSync(f, 'utf8')) : []);
const xmls = d => (fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.xml')).sort().map(f => path.join(d, f)) : []);

export function collect(out) {
  const first = [readIf(path.join(out, 'report.xml')), ...xmls(path.join(out, 'aktualizacja')).map(f => parseJunit(fs.readFileSync(f, 'utf8')))].flat();
  const retry = [...xmls(path.join(out, 'ponowienie')), ...xmls(path.join(out, 'aktualizacja', 'ponowienie'))].flatMap(f => parseJunit(fs.readFileSync(f, 'utf8')));
  const rmap = new Map(retry.map(r => [r.name, r]));
  return first.map(f => {
    const r = rmap.get(f.name);
    const wynik = f.ok ? 'przeszedl' : r ? (r.ok ? 'przeszedl_w_ponowieniu' : 'padl_dwa_razy') : 'padl';
    return { scenariusz: f.name, wynik, czas_s: f.time_s, ...(r ? { czas_ponowienia_s: r.time_s } : {}) };
  });
}

const ETYK = { przeszedl: 'przeszedł', przeszedl_w_ponowieniu: 'przeszedł w ponowieniu', padl_dwa_razy: 'padł dwa razy', padl: 'padł (bez ponowienia)' };
export function markdown(rows, tytul) {
  const lines = [`## ${tytul}`, '', `Scenariuszy: ${rows.length}; przeszło za pierwszym razem: ${rows.filter(r => r.wynik === 'przeszedl').length}; w ponowieniu: ${rows.filter(r => r.wynik === 'przeszedl_w_ponowieniu').length}; padło: ${rows.filter(r => /^padl/.test(r.wynik)).length}.`, ''];
  const shaky = rows.filter(r => r.wynik === 'przeszedl_w_ponowieniu'), bad = rows.filter(r => /^padl/.test(r.wynik));
  if (shaky.length) lines.push('**Zielone dopiero w ponowieniu (niestabilne):** ' + shaky.map(r => r.scenariusz).join('; '), '');
  if (bad.length) lines.push('**Czerwone:** ' + bad.map(r => `${r.scenariusz} (${ETYK[r.wynik]})`).join('; '), '');
  lines.push('| Scenariusz | Wynik | Czas [s] | Czas ponowienia [s] |', '|---|---|---:|---:|');
  for (const r of rows) lines.push(`| ${r.scenariusz} | ${ETYK[r.wynik]} | ${r.czas_s} | ${r.czas_ponowienia_s ?? ''} |`);
  return lines.join('\n') + '\n';
}

function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'nieudane') {
    const map = nameToFile(b); const failed = readIf(a).filter(r => !r.ok);
    for (const r of failed) { const f = map.get(r.name); if (f) console.log(f); else console.error(`::warning::Nie znaleziono pliku scenariusza „${r.name}” — bez ponowienia`); }
    return;
  }
  if (cmd === 'wyniki') {
    const rows = collect(a); fs.mkdirSync(a, { recursive: true });
    fs.writeFileSync(path.join(a, `wyniki-${b ?? '0'}.json`), JSON.stringify({ czesc: b ?? '0', scenariusze: rows }, null, 2) + '\n');
    process.stdout.write(markdown(rows, `Wyniki E2E — część ${b ?? '0'}`)); return;
  }
  if (cmd === 'zbierz') {
    const files = []; const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/^wyniki-.*\.json$/.test(e.name)) files.push(p); } }; walk(a);
    const rows = files.sort().flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')).scenariusze).sort((x, y) => x.scenariusz.localeCompare(y.scenariusz));
    const oi = process.argv.indexOf('--out'); if (oi > 0) fs.writeFileSync(process.argv[oi + 1], JSON.stringify({ scenariusze: rows }, null, 2) + '\n');
    process.stdout.write(markdown(rows, 'Wyniki E2E — cały przebieg')); return;
  }
  console.error('Użycie: e2e-wyniki.mjs nieudane <report.xml> <dir> | wyniki <e2e-out> <część> | zbierz <dir> [--out plik]'); process.exit(2);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
