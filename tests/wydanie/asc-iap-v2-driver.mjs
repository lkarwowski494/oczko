// Sterownik testów scripts/asc/iap-localizations.mjs na atrapie modelu wersji (tests/wydanie/asc-iap-v2-atrapa.mjs). Wejście: JSON w argv[2]:
//   { obiekty: { group|monthly|yearly|lifetime: { rodzaj, id, productId?, wersje: [{ id, n, state, lok: [...] }] } }, dziedziczy?: bool,
//     data: { tlumaczenia }, appNames: {...}, kroki: [{ apply?: bool }] }
// Wyjście (stdout): JSON { kroki: [{ code, counts, zapisy, log }], stan, calls, nieznane }.
import { utworzAtrape } from './asc-iap-v2-atrapa.mjs';
import * as I from '../../scripts/asc/iap-localizations.mjs';

const sc = JSON.parse(process.argv[2]);
const a = utworzAtrape({ obiekty: sc.obiekty, dziedziczy: !!sc.dziedziczy });
const client = I.makeClient({ fetchFn: a.fetchFn, token: 'TOKEN-TESTOWY', sleep: async () => {} });
const kroki = [];
for (const k of sc.kroki) {
  const od = a.calls.length; const log = [];
  const w = await I.run({ client, data: sc.data, apply: !!k.apply, log: (t) => log.push(String(t)), appNames: sc.appNames ?? {} });
  const nowe = a.calls.slice(od);
  kroki.push({ code: w.code, counts: w.counts, problems: w.problems, zapisy: nowe.filter((c) => c.m !== 'GET').map((c) => ({ m: c.m, p: c.p, a: c.body?.data?.attributes ?? null, rel: c.body?.data?.relationships ?? null })), log });
}
process.stdout.write(JSON.stringify({ kroki, stan: a.s.obiekty, calls: a.calls.map((c) => `${c.m} ${c.p}`), nieznane: a.s.nieznane }));
