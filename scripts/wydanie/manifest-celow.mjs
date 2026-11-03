// Manifesty prywatności celów @bacons/apple-targets (M1-audytor-generalny-076; 05-architekt-001, 10-wydanie-001; R-158).
// `expo.ios.privacyManifests` z app.json trafia tylko do pakietu aplikacji; zegarek, widżet i rozszerzenie to osobne pakiety, a Apple wymaga manifestu
// w każdym pakiecie, którego kod używa „required reason API” (developer.apple.com, describing-use-of-required-reason-api, odczyt 2026-11-02).
// Biblioteka celów wiąże katalog targets/<cel> jako folder synchronizowany Xcode, więc targets/<cel>/PrivacyInfo.xcprivacy trafia do pakietu celu.
//
// Użycie:
//   node scripts/wydanie/manifest-celow.mjs [--katalog targets]
//     kontrola repo (Linux): każdy cel, którego kod Swift używa API z listy Apple, ma targets/<cel>/PrivacyInfo.xcprivacy z tą kategorią i powodem.
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

export function sprawdzRepo(katalog) {
  return readdirSync(katalog).filter((n) => n !== '_shared' && statSync(join(katalog, n)).isDirectory()).sort().flatMap((cel) => {
    const m = join(katalog, cel, 'PrivacyInfo.xcprivacy');
    return sprawdzCel(`targets/${cel}`, uzyciaCelu(join(katalog, cel)), existsSync(m) ? readFileSync(m, 'utf8') : null);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const a = process.argv.slice(2), opcja = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  const katalog = opcja('--katalog') ?? 'targets', pakiet = opcja('--pakiet'), cel = opcja('--cel');
  let bledy;
  if (pakiet !== undefined) {
    if (!cel) { console.error('Użycie: manifest-celow.mjs --pakiet <plik|-> --cel <cel>'); process.exit(2); }
    bledy = sprawdzCel(`pakiet celu ${cel}`, uzyciaCelu(join(katalog, cel)), pakiet === '-' || !existsSync(pakiet) ? null : readFileSync(pakiet, 'utf8'));
  } else bledy = sprawdzRepo(katalog);
  for (const b of bledy) console.log(`::error::manifest celu: ${b}`);
  if (bledy.length === 0) console.log('manifesty celów: OK');
  process.exit(bledy.length ? 1 : 0);
}
