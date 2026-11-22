// Sterownik testów scripts/asc/produkty.mjs na atrapie serwera (tests/wydanie/asc-atrapa.mjs). Wejście: JSON w argv[2]:
//   { stan?: {...stan atrapy}, nadpisania?: {...dane}, kroki: [{ apply?: bool, opcje?: {...} }] }
// Wyjście (stdout): JSON { kroki: [{ code, akcje, stop, nieodwracalne, zapisy, log }], stan, calls }.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { utworzAtrape } from './asc-atrapa.mjs';
import { makeClient } from '../../scripts/asc/iap-localizations.mjs';
import * as P from '../../scripts/asc/produkty.mjs';

const sc = JSON.parse(process.argv[2]);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dane = { ...JSON.parse(readFileSync(join(rootDir, 'docs/wydanie/metadane/produkty.store.json'), 'utf8')), ...(sc.nadpisania ?? {}) };
const a = utworzAtrape({ stan: sc.stan });
const client = makeClient({ fetchFn: a.fetchFn, token: 'TOKEN-TESTOWY', sleep: async () => {} });
const kroki = [];
for (const k of sc.kroki) {
  const od = a.calls.length; const log = [];
  const w = await P.run({ client, data: dane, apply: !!k.apply, opcje: k.opcje ?? {}, log: (t) => log.push(String(t)) });
  const nowe = a.calls.slice(od);
  kroki.push({ code: w.code, akcje: w.plan.akcje, stop: w.plan.stop, nieodwracalne: w.plan.nieodwracalne, zapisy: nowe.filter((c) => c.m !== 'GET').length, metody: [...new Set(nowe.map((c) => c.m))], log });
}
process.stdout.write(JSON.stringify({ kroki, stan: a.s, calls: a.calls }));
