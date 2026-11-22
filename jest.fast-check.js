/* global require, process */
// DS-03/DS-04: ziarno fast-check stałe na push (PROP_SEED z CI), 1 000 przypadków nocą (PROP_NOC=1); lokalnie domyślne zachowanie
// (nowe ziarno, wypisywane w raporcie porażki). „configureGlobal fully resets the settings” — dlatego jedno wywołanie z kompletem.
const fc = require('fast-check');
if (process.env.PROP_SEED || process.env.PROP_NOC) {
  fc.configureGlobal({
    ...(process.env.PROP_SEED ? { seed: Number(process.env.PROP_SEED) } : {}),
    numRuns: process.env.PROP_NOC === '1' ? 1000 : 100,
  });
}
