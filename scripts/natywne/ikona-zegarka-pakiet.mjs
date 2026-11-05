// Strażnik ZBUDOWANEGO zegarka (10-wydanie-002; testflight.yml #6, run 41983086785, build 1061): Info.plist pakietu `OczkoZegarek.app` musi mieć
// `CFBundleIconName = AppIcon`. Bez tego App Store Connect odrzuca wysyłkę („Missing Icons… CFBundleIconName”, Trening L-021), a `kontrola-ipa.sh` łapie to
// dopiero w .ipa po eksporcie, za bramką Approve właściciela. Strażnik z P-350 (`ikona-zegarka.mjs`) czyta tylko projekt po prebuild; tu sprawdzamy pakiet.
// Użycie: plutil -convert json -o - <Info.plist> > info.json && node scripts/natywne/ikona-zegarka-pakiet.mjs --info info.json
// Kody: 0 zgodny, 1 błąd (brak klucza, inna nazwa, nieczytelny plik), 2 zły argument.
import { readFileSync } from 'node:fs';

const OCZEKIWANA = 'AppIcon';

/** Lista błędów dla Info.plist (obiekt) zbudowanego zegarka; pusta = zielono. */
export function bledyPakietuZegarka(info) {
  if (typeof info !== 'object' || info === null || Array.isArray(info)) return ['Info.plist zegarka nie jest słownikiem'];
  const nazwa = info.CFBundleIconName;
  if (nazwa === undefined) return [`zegarek: brak CFBundleIconName w Info.plist zbudowanego pakietu (oczekiwano ${OCZEKIWANA}); App Store Connect odrzuci wysyłkę (Trening L-021)`];
  if (nazwa !== OCZEKIWANA) return [`zegarek: CFBundleIconName = ${JSON.stringify(nazwa)}, oczekiwano ${OCZEKIWANA}`];
  return [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--info');
  const sciezka = i > 0 ? process.argv[i + 1] : null;
  if (!sciezka) { console.log('użycie: --info <Info.plist jako JSON>'); process.exit(2); }
  let info;
  try { info = JSON.parse(readFileSync(sciezka, 'utf8')); } catch { console.log(`::error::${sciezka}: nie da się odczytać Info.plist zegarka jako JSON`); process.exit(1); }
  const bledy = bledyPakietuZegarka(info);
  if (bledy.length) { for (const b of bledy) console.log(`::error::${b}`); process.exit(1); }
  console.log(`zegarek ${info.CFBundleIdentifier ?? '?'}: CFBundleIconName = ${info.CFBundleIconName}`);
}
