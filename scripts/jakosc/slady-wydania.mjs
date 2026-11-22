#!/usr/bin/env node
// P-238: dowód, że bundel wydania iOS nie ma paneli E2E — eksport `expo export --platform ios` bez zmiennych EXPO_PUBLIC_E2E/… do katalogu
// tymczasowego i `scripts/wydanie/slady-testowe.mjs` na bajtkodzie (kod 0 = czysto). Z `--e2e`: eksport z EXPO_PUBLIC_E2E=1 i odwrotny wynik
// (panele muszą być obecne, kod 0, gdy slady-testowe znajduje ślady). Poza `verify` (eksport ok. 1–2 min); wołany ręcznie i przed TestFlight.
// Użycie: node scripts/jakosc/slady-wydania.mjs [--e2e]
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const e2e = process.argv.includes('--e2e');
const katalog = mkdtempSync(join(tmpdir(), 'oczko-eksport-'));
const env = { ...process.env };
for (const k of Object.keys(env)) if (/^EXPO_PUBLIC_(E2E|ZRZUTY|STORE_FAKE|WATCH_FAKE|ICLOUD_FAKE|WYMUS_AWARIE|PSEUDO)$/.test(k)) delete env[k];
if (e2e) env.EXPO_PUBLIC_E2E = '1';
try {
  execFileSync('npx', ['expo', 'export', '--platform', 'ios', '--clear', '--output-dir', katalog], { env, stdio: ['ignore', 'ignore', 'inherit'] });
  const js = join(katalog, '_expo/static/js/ios');
  const plik = readdirSync(js).find((n) => /^entry-.*\.hbc$/.test(n));
  if (!plik) { console.error('BŁĄD: brak entry-*.hbc w eksporcie'); process.exit(2); }
  const w = spawnSync('node', ['scripts/wydanie/slady-testowe.mjs', join(js, plik), ...(e2e ? ['--oczekiwane'] : [])], { encoding: 'utf8' }); // P-240: w E2E bez ::error::
  process.stdout.write(w.stdout); process.stderr.write(w.stderr);
  const ok = e2e ? w.status === 1 : w.status === 0;
  console.log(ok ? `OK: ${e2e ? 'build E2E ma panele' : 'build wydania bez śladów'}` : `BŁĄD: ${e2e ? 'build E2E bez paneli' : 'ślady w buildzie wydania'}`);
  process.exit(ok ? 0 : 1);
} finally {
  rmSync(katalog, { recursive: true, force: true });
}
