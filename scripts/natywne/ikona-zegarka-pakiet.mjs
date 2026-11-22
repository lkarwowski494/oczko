// Strażnik ZBUDOWANEGO zegarka (10-wydanie-002; testflight.yml #6, run 41983086785, build 1061): Info.plist pakietu `OczkoZegarek.app` musi wskazywać zestaw ikon
// `AppIcon`. Bez niego App Store Connect odrzuca wysyłkę („Missing Icons… CFBundleIconName”, Trening L-021). Strażnik z P-350 (`ikona-zegarka.mjs`) czyta tylko projekt
// po prebuild; tu sprawdzamy pakiet, w tym samym miejscu wywołuje go `kontrola-ipa.sh` (.ipa) i zadanie zegarek-ikona w jakosc-ios.yml (bez Approve).
// Postać klucza: actool z `--target-device watch --app-icon AppIcon` zapisuje nazwę zestawu w CFBundleIcons › CFBundlePrimaryIcon › CFBundleIconName, a nie na najwyższym
// poziomie (dowód: jakosc-ios.yml run 41987399061, `plutil -p` zbudowanego zegarka + assetcatalog_generated_info.plist). Poprzednia kontrola czytała tylko najwyższy poziom
// i dawała fałszywy alarm. Dopuszczamy obie postacie; brak obu albo inna nazwa to błąd.
// Użycie: plutil -convert json -o info.json <Info.plist> && node scripts/natywne/ikona-zegarka-pakiet.mjs --info info.json
// Kody: 0 zgodny, 1 błąd (brak ikony, inna nazwa, nieczytelny plik), 2 zły argument.
import { readFileSync } from 'node:fs';

const OCZEKIWANA = 'AppIcon';

const JAKO_SLOWNIK = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Gdzie Info.plist wskazuje zestaw ikon: `{ gdzie, nazwa }` albo null. Najwyższy poziom ma pierwszeństwo. */
export function nazwaIkony(info) {
  if (info.CFBundleIconName !== undefined) return { gdzie: 'CFBundleIconName', nazwa: info.CFBundleIconName };
  const pierwsza = JAKO_SLOWNIK(info.CFBundleIcons) && JAKO_SLOWNIK(info.CFBundleIcons.CFBundlePrimaryIcon) ? info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconName : undefined;
  return pierwsza === undefined ? null : { gdzie: 'CFBundleIcons › CFBundlePrimaryIcon › CFBundleIconName', nazwa: pierwsza };
}

/** Lista błędów dla Info.plist (obiekt) zbudowanego zegarka; pusta = zielono. */
export function bledyPakietuZegarka(info) {
  if (!JAKO_SLOWNIK(info)) return ['Info.plist zegarka nie jest słownikiem'];
  const ikona = nazwaIkony(info);
  if (ikona === null) return [`zegarek: Info.plist zbudowanego pakietu nie wskazuje zestawu ikon (ani CFBundleIconName, ani CFBundleIcons › CFBundlePrimaryIcon › CFBundleIconName; oczekiwano ${OCZEKIWANA}); App Store Connect odrzuci wysyłkę (Trening L-021)`];
  if (ikona.nazwa !== OCZEKIWANA) return [`zegarek: ${ikona.gdzie} = ${JSON.stringify(ikona.nazwa)}, oczekiwano ${OCZEKIWANA}`];
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
  const { gdzie, nazwa } = nazwaIkony(info);
  console.log(`zegarek ${info.CFBundleIdentifier ?? '?'}: ${gdzie} = ${nazwa}`);
}
