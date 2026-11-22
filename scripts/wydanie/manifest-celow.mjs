// Manifesty prywatności celów @bacons/apple-targets (M1-audytor-generalny-076; 05-architekt-001, 10-wydanie-001; R-158).
// `expo.ios.privacyManifests` z app.json trafia tylko do pakietu aplikacji; zegarek, widżet i rozszerzenie to osobne pakiety, a Apple wymaga manifestu
// w każdym pakiecie, którego kod używa „required reason API” (developer.apple.com, describing-use-of-required-reason-api, odczyt 2026-11-02).
// Biblioteka celów wiąże katalog targets/<cel> jako folder synchronizowany Xcode, więc targets/<cel>/PrivacyInfo.xcprivacy trafia do pakietu celu.
// WYJĄTEK (P-471, build #144 „Multiple commands produce OczkoZegarek.app/PrivacyInfo.xcprivacy”): cel typu watch to aplikacja (xcodeproj `symbol_type` :application),
// a React Native „Privacy Manifest Aggregation” (node_modules/react-native/scripts/cocoapods/privacy_manifest_utils.rb, `ensure_reference`, krok `pod install`) dopisuje
// manifest aplikacji do fazy zasobów każdego takiego celu. Własny plik w targets/watch kopiuje jeszcze grupa synchronizowana: dwa kopiowania na jedną ścieżkę pakietu.
// Dlatego zegarek nie ma własnego pliku; jego jedyny manifest to zbiorczy z `expo.ios.privacyManifests` (app.json) i to jego kategorie sprawdza kontrola repo
// (jak Trening, docs/35-zegarek-apple.md „Manifest prywatności zegarka”). Kontrola pakietu (--pakiet) pilnuje, że gotowy pakiet zegarka ma kategorie kodu.
//
// Użycie:
//   node scripts/wydanie/manifest-celow.mjs [--katalog targets] [--app-json app.json]
//     kontrola repo (Linux): każdy cel, którego kod Swift używa API z listy Apple, ma targets/<cel>/PrivacyInfo.xcprivacy z tą kategorią i powodem;
//     cel typu watch odwrotnie: bez własnego pliku, a kategorie jego kodu są w `expo.ios.privacyManifests` z app.json.
//   node scripts/wydanie/manifest-celow.mjs --kopie <cel> [--katalog targets]
//     liczba kopii PrivacyInfo.xcprivacy w pakiecie celu (własne pliki w folderze + kopia z agregacji RN dla celu typu aplikacja); ma być 1.
//   node scripts/wydanie/manifest-celow.mjs --pakiet <PrivacyInfo.xcprivacy w XML albo „-” gdy brak> --cel <cel> [--katalog targets]
//     kontrola pakietu (kontrola-ipa.sh, macOS): manifest w gotowym pakiecie ma kategorie wymagane przez kod celu.
// Kod 1 = błąd. Lista API: NSPrivacyAccessedAPIType (developer.apple.com, surowy JSON z 2026-11-02, dowód audytu 05-architekt-001).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Kategoria → wzorce użycia w Swift i powody dozwolone dla aplikacji (bez 0A2A.1 i C56D.1 — tylko dla SDK). */
export const KATEGORIE = {
  NSPrivacyAccessedAPICategoryFileTimestamp: {
    wzorce: [/\.(creationDate|modificationDate|fileModificationDate|contentModificationDateKey|creationDateKey)\b/, /\b(stat|fstat|fstatat|lstat|getattrlist|getattrlistbulk|fgetattrlist|getattrlistat)\s*\(/],
    powody: ['DDA9.1', 'C617.1', '3B52.1'],
  },
  NSPrivacyAccessedAPICategorySystemBootTime: { wzorce: [/\bsystemUptime\b/, /\bmach_absolute_time\s*\(/], powody: ['35F9.1', '8FFB.1', '3D61.1'] },
  NSPrivacyAccessedAPICategoryDiskSpace: {
    wzorce: [/\b(statfs|statvfs|fstatfs|fstatvfs|getattrlist|fgetattrlist|getattrlistat)\s*\(/, /\b(volumeAvailableCapacity\w*Key|volumeTotalCapacityKey|systemFreeSize|systemSize)\b/],
    powody: ['85F4.1', 'E174.1', '7D9E.1', 'B728.1'],
  },
  NSPrivacyAccessedAPICategoryActiveKeyboards: { wzorce: [/\bactiveInputModes\b/], powody: ['3EC4.1', '54BD.1'] },
  NSPrivacyAccessedAPICategoryUserDefaults: { wzorce: [/\bUserDefaults\b/], powody: ['CA92.1', '1C8F.1', 'AC6B.1'] },
};

const bezKomentarzy = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const pliki = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? pliki(p) : [p]; });

/** Kategorie używane przez kod Swift celu (z targets/_shared, który biblioteka dołącza do każdego celu): kategoria → pierwsze miejsce użycia. */
export function uzyciaCelu(katalogCelu) {
  const wynik = new Map(), wspolny = join(katalogCelu, '..', '_shared');
  const swift = [...pliki(katalogCelu).sort(), ...(existsSync(wspolny) ? pliki(wspolny).sort() : [])].filter((p) => p.endsWith('.swift'));
  for (const plik of swift) {
    const linie = bezKomentarzy(readFileSync(plik, 'utf8')).split('\n');
    for (const [kat, { wzorce }] of Object.entries(KATEGORIE)) {
      if (wynik.has(kat)) continue;
      const i = linie.findIndex((l) => wzorce.some((w) => w.test(l)));
      if (i >= 0) wynik.set(kat, `${relative(katalogCelu, plik)}:${i + 1}`);
    }
  }
  return wynik;
}

/** Kategorie i powody z manifestu w XML (plist). */
export function czytajManifest(xml) {
  if (!/<plist[\s>]/.test(xml)) throw new Error('to nie jest plik plist w formacie XML');
  const m = new Map();
  for (const blok of xml.match(/<dict>(?:(?!<dict>)[\s\S])*?NSPrivacyAccessedAPIType<\/key>[\s\S]*?<\/dict>/g) ?? []) {
    const kat = /<key>NSPrivacyAccessedAPIType<\/key>\s*<string>([^<]+)<\/string>/.exec(blok)?.[1];
    const powody = /<key>NSPrivacyAccessedAPITypeReasons<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(blok)?.[1] ?? '';
    if (kat) m.set(kat, [...powody.matchAll(/<string>([^<]+)<\/string>/g)].map((x) => x[1]));
  }
  return m;
}

/** Błędy dla jednego celu: `xml` = treść manifestu albo null, gdy go nie ma. */
export function sprawdzCel(nazwa, uzycia, xml) {
  if (uzycia.size === 0) return [];
  const gdzie = [...uzycia].map(([k, w]) => `${k.replace('NSPrivacyAccessedAPICategory', '')} (${w})`).join(', ');
  if (xml === null) return [`${nazwa}: brak PrivacyInfo.xcprivacy, a kod używa ${gdzie}`];
  let manifest;
  try { manifest = czytajManifest(xml); } catch (e) { return [`${nazwa}: ${e.message}`]; }
  const bledy = [];
  for (const [kat, w] of uzycia) {
    const powody = manifest.get(kat);
    if (!powody || powody.length === 0) bledy.push(`${nazwa}: manifest bez kategorii ${kat} (użycie: ${w})`);
    else for (const p of powody) if (!KATEGORIE[kat].powody.includes(p)) bledy.push(`${nazwa}: ${kat} — powód ${p} spoza listy dla aplikacji (${KATEGORIE[kat].powody.join(', ')})`);
  }
  return bledy;
}

/** Cel typu watch (aplikacja watchOS): agregacja RN dopisuje mu manifest aplikacji (P-471). */
export const celZAgregacja = (katalogCelu) => {
  const konf = join(katalogCelu, 'expo-target.config.js');
  return existsSync(konf) && /\btype:\s*['"]watch['"]/.test(readFileSync(konf, 'utf8'));
};
const wlasneManifesty = (katalogCelu) => pliki(katalogCelu).filter((p) => p.endsWith('.xcprivacy'));

/** Kopie PrivacyInfo.xcprivacy w pakiecie celu: własne pliki w folderze (grupa synchronizowana) + 1 z agregacji RN dla celu typu aplikacja. */
export const kopieManifestu = (katalogCelu) => wlasneManifesty(katalogCelu).length + (celZAgregacja(katalogCelu) ? 1 : 0);

/** Manifest zbiorczy aplikacji w XML (kształt jak czytajManifest) z `expo.ios.privacyManifests` w app.json. */
export function manifestZAppJson(appJson) {
  const typy = JSON.parse(appJson)?.expo?.ios?.privacyManifests?.NSPrivacyAccessedAPITypes ?? [];
  const wpis = (t) => `<dict><key>NSPrivacyAccessedAPIType</key><string>${t.NSPrivacyAccessedAPIType}</string><key>NSPrivacyAccessedAPITypeReasons</key><array>${(t.NSPrivacyAccessedAPITypeReasons ?? []).map((r) => `<string>${r}</string>`).join('')}</array></dict>`;
  return `<plist version="1.0"><dict><key>NSPrivacyAccessedAPITypes</key><array>${typy.map(wpis).join('')}</array></dict></plist>`;
}

export function sprawdzRepo(katalog, appJson = 'app.json') {
  return readdirSync(katalog).filter((n) => n !== '_shared' && statSync(join(katalog, n)).isDirectory()).sort().flatMap((cel) => {
    const nazwa = `targets/${cel}`, uzycia = uzyciaCelu(join(katalog, cel));
    if (celZAgregacja(join(katalog, cel))) {
      const wlasne = wlasneManifesty(join(katalog, cel));
      if (wlasne.length) return wlasne.map((p) => `${nazwa}: własny ${relative(join(katalog, cel), p)} dubluje manifest zbiorczy RN (agregacja dopisuje manifest aplikacji do celu typu aplikacja, a folder synchronizowany kopiuje własny: „Multiple commands produce …/PrivacyInfo.xcprivacy”, P-471); usuń go, manifest zegarka pochodzi z expo.ios.privacyManifests w app.json`);
      return sprawdzCel(nazwa, uzycia, manifestZAppJson(readFileSync(appJson, 'utf8')));
    }
    const m = join(katalog, cel, 'PrivacyInfo.xcprivacy');
    return sprawdzCel(nazwa, uzycia, existsSync(m) ? readFileSync(m, 'utf8') : null);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2), opcja = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  const katalog = opcja('--katalog') ?? 'targets', pakiet = opcja('--pakiet'), cel = opcja('--cel'), kopie = opcja('--kopie');
  let bledy;
  if (kopie !== undefined) {
    const n = kopieManifestu(join(katalog, kopie));
    console.log(`kopie PrivacyInfo.xcprivacy w pakiecie celu ${kopie}: ${n}`);
    process.exit(n === 1 ? 0 : 1);
  } else if (pakiet !== undefined) {
    if (!cel) { console.error('Użycie: manifest-celow.mjs --pakiet <plik|-> --cel <cel>'); process.exit(2); }
    bledy = sprawdzCel(`pakiet celu ${cel}`, uzyciaCelu(join(katalog, cel)), pakiet === '-' || !existsSync(pakiet) ? null : readFileSync(pakiet, 'utf8'));
  } else bledy = sprawdzRepo(katalog, opcja('--app-json') ?? 'app.json');
  for (const b of bledy) console.log(`::error::manifest celu: ${b}`);
  if (bledy.length === 0) console.log('manifesty celów: OK');
  process.exit(bledy.length ? 1 : 0);
}
