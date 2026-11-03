// Stałe reguł dla Swift (ADR-0007 uzupełnienie, Z07-12): jedno źródło src/konfiguracja.ts → modules/oczko-reguly/stale.json
// + Sources/OczkoReguly/Stale.swift (wygenerowane, ręcznie nie edytować). `swift test` porównuje Stale.swift z stale.json,
// a `--check` (jakosc:kontrole) — oba pliki z konfiguracja.ts oraz limit zdjęć w regule aktywacji celu share (targets/share/Info.plist,
// ZDJECIA_WZORU_MAKS; M1-audytor-generalny-079). Użycie: node --experimental-strip-types scripts/natywne/generuj-stale.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(import.meta.dirname, '../..');
const k = await import(join(KORZEN, 'src/konfiguracja.ts'));
/** Nazwa w Swift → [nazwa w konfiguracja.ts, typ Swift]. Tylko stałe, których używa kod Swift (intencja, zegarek). */
const STALE = {
  limitDniWMiesiacu: ['LIMIT_DNI_W_MIESIACU', 'Int'],
  przerwaNowegoDniaMs: ['PRZERWA_NOWEGO_DNIA_MS', 'Int64'],
  oknoOfflineProMs: ['OKNO_OFFLINE_PRO_MS', 'Int64'],
  produktyPro: ['PRODUKTY_PRO', '[String]'],
  zegarekPonowienieMs: ['ZEGAREK_PONOWIENIE_MS', 'Int64'], // kolejka zegarka (ADR-0009, 2026-10-26; fix-4 05)
};
const wartosci = Object.fromEntries(Object.entries(STALE).map(([n, [z]]) => {
  if (!(z in k)) throw new Error(`generuj-stale: brak ${z} w src/konfiguracja.ts`);
  return [n, k[z]];
}));
const json = `${JSON.stringify(wartosci, null, 2)}\n`;
const swift = [
  '// Wygenerowane: node --experimental-strip-types scripts/natywne/generuj-stale.mjs — nie edytować (źródło: src/konfiguracja.ts).',
  '// Zgodność z stale.json sprawdza `swift test` (StaleTests), z konfiguracja.ts — `--check` w jakosc:kontrole.',
  'public enum Stale {',
  ...Object.entries(STALE).map(([n, [z, t]]) => `  /// ${z}\n  public static let ${n}: ${t} = ${JSON.stringify(wartosci[n])}`),
  '}',
  '',
].join('\n');
// Partia 6 (moduly.md „Kontrakt partii 6”): stałe modułu `oczko-wzor` i celu share w pakiecie logiki wzoru (StaleTests porównuje z stale.json).
const STALE_WZORU = {
  wzorMaksMb: ['WZOR_MAKS_MB', 'Int'],
  rysunekZapisMs: ['RYSUNEK_ZAPIS_MS', 'Int'],
  migawkaWersja: ['MIGAWKA_WERSJA', 'Int'],
};
const wartosciWzoru = Object.fromEntries(Object.entries(STALE_WZORU).map(([n, [z]]) => {
  if (!(z in k)) throw new Error(`generuj-stale: brak ${z} w src/konfiguracja.ts`);
  return [n, k[z]];
}));
const swiftWzoru = [
  '// Wygenerowane: node --experimental-strip-types scripts/natywne/generuj-stale.mjs — nie edytować (źródło: src/konfiguracja.ts).',
  '// Zgodność z stale.json sprawdza `swift test` (StaleTests), z konfiguracja.ts — `--check` w jakosc:kontrole.',
  'public enum StaleWzoru {',
  ...Object.entries(STALE_WZORU).map(([n, [z, t]]) => `  /// ${z}\n  public static let ${n}: ${t} = ${JSON.stringify(wartosciWzoru[n])}`),
  '}',
  '',
].join('\n');
const pliki = {
  'modules/oczko-reguly/stale.json': json, 'modules/oczko-reguly/Sources/OczkoReguly/Stale.swift': swift,
  'modules/oczko-wzor/Pakiet/stale.json': `${JSON.stringify(wartosciWzoru, null, 2)}\n`, 'modules/oczko-wzor/Pakiet/Sources/OczkoWzorLogika/StaleWzoru.swift': swiftWzoru,
};
/** Reguła aktywacji celu share (plik ręczny, nie generowany): limit `public.image` = ZDJECIA_WZORU_MAKS. */
function limitZdjecShare() {
  const p = 'targets/share/Info.plist';
  if (!('ZDJECIA_WZORU_MAKS' in k)) throw new Error('generuj-stale: brak ZDJECIA_WZORU_MAKS w src/konfiguracja.ts');
  let tekst;
  try { tekst = readFileSync(join(KORZEN, p), 'utf8'); } catch { return `${p}: brak pliku`; }
  const trafienia = [...tekst.matchAll(/UTI-CONFORMS-TO "public\.image"\)\.@count &lt;= (\d+)/g)].map((m) => Number(m[1]));
  if (trafienia.length !== 1) return `${p}: oczekiwano jednego limitu "public.image" w NSExtensionActivationRule, jest ${trafienia.length}`;
  return trafienia[0] === k.ZDJECIA_WZORU_MAKS ? null : `${p}: limit "public.image" ${trafienia[0]} ≠ ZDJECIA_WZORU_MAKS ${k.ZDJECIA_WZORU_MAKS}`;
}
if (process.argv.includes('--check')) {
  const zle = Object.entries(pliki).filter(([p, t]) => { try { return readFileSync(join(KORZEN, p), 'utf8') !== t; } catch { return true; } }).map(([p]) => p);
  if (zle.length) { console.error(`generuj-stale: nieaktualne ${zle.join(', ')} — uruchom node --experimental-strip-types scripts/natywne/generuj-stale.mjs`); process.exit(1); }
  const share = limitZdjecShare();
  if (share) { console.error(`generuj-stale: ${share} — popraw regułę aktywacji ręcznie (plik nie jest generowany)`); process.exit(1); }
  console.log('stałe Swift i limit zdjęć celu share zgodne z src/konfiguracja.ts');
} else for (const [p, t] of Object.entries(pliki)) writeFileSync(join(KORZEN, p), t);
