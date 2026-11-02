// Strażnik po `expo prebuild` (P-350; krok CI w jakosc-ios.yml obok „Intencja w celu aplikacji”; wzór: `verify:native` w Treningu, scripts/verify-native.mjs).
// Cel zegarka (SDKROOT = watchos, identyfikator `*.watchkitapp`) musi mieć w każdej konfiguracji `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`: bez tego actool
// nie wpisuje `CFBundleIconName` do Info.plist zegarka i App Store Connect odrzuca wysyłkę (Trening L-021, build 1026). @bacons/apple-targets 5.0.0 ustawia
// to tylko przy polu `icon:` w targets/watch/expo-target.config.js (tests/wydanie/ikona-zegarka.test.ts). `kontrola-ipa.sh` łapie to dopiero w archiwum,
// ten krok od razu po prebuild i bez budowania. Brak projektu albo celu zegarka to błąd (pusty zbiór to nie zaliczenie).
// Użycie: node scripts/natywne/ikona-zegarka.mjs --pbxproj ios/<nazwa>.xcodeproj/project.pbxproj
import { readFileSync } from 'node:fs';

const NAZWA_IKONY = 'AppIcon';
const KONFIGURACJE_ZEGARKA = 2; // Debug i Release

/** Konfiguracje budowania celu zegarka (blok `buildSettings` z `SDKROOT = watchos;`) z identyfikatorem pakietu i ustawioną nazwą zestawu ikon (null = brak). */
export function konfiguracjeZegarka(pbx) {
  const pole = (blok, klucz) => blok.match(new RegExp(`\\b${klucz} = ("[^"]*"|[^;\\s]+);`))?.[1]?.replace(/^"(.*)"$/, '$1') ?? null;
  return [...pbx.matchAll(/buildSettings = \{([\s\S]*?)\n\t\t\t\};/g)]
    .map((m) => m[1])
    .filter((blok) => /\bSDKROOT = watchos;/.test(blok))
    .map((blok) => ({ identyfikator: pole(blok, 'PRODUCT_BUNDLE_IDENTIFIER'), ikona: pole(blok, 'ASSETCATALOG_COMPILER_APPICON_NAME') }));
}

/** Lista błędów (pusta = zielono). */
export function bledyIkonyZegarka(pbx) {
  const k = konfiguracjeZegarka(pbx);
  if (k.length === 0) return ['brak celu zegarka w projekcie (SDKROOT = watchos)'];
  const bledy = [];
  if (k.length < KONFIGURACJE_ZEGARKA) bledy.push(`cel zegarka ma ${k.length} konfigurację, oczekiwano ${KONFIGURACJE_ZEGARKA} (Debug i Release)`);
  k.forEach((c, i) => {
    if (c.ikona !== NAZWA_IKONY) bledy.push(`cel zegarka ${c.identyfikator ?? '?'} (konfiguracja ${i + 1}): ASSETCATALOG_COMPILER_APPICON_NAME = ${c.ikona ?? 'brak'}, oczekiwano ${NAZWA_IKONY} — bez tego Info.plist zegarka nie ma CFBundleIconName i App Store Connect odrzuca wysyłkę (pole icon: w targets/watch/expo-target.config.js)`);
  });
  return bledy;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--pbxproj');
  const sciezka = i > 0 ? process.argv[i + 1] : null;
  if (!sciezka) { console.log('użycie: --pbxproj <project.pbxproj>'); process.exit(2); }
  let pbx;
  try { pbx = readFileSync(sciezka, 'utf8'); } catch { console.log(`::error::${sciezka}: nie da się odczytać projektu`); process.exit(1); }
  const bledy = bledyIkonyZegarka(pbx);
  if (bledy.length) { for (const b of bledy) console.log(`::error::${b}`); process.exit(1); }
  const k = konfiguracjeZegarka(pbx);
  console.log(`ikona zegarka: ${k.length} konfiguracje ${k[0].identyfikator}, ASSETCATALOG_COMPILER_APPICON_NAME = ${NAZWA_IKONY}`);
}
