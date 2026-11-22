// Członkostwo pliku w celu aplikacji po `expo prebuild` (P-180; krok CI w jakosc-ios.yml obok „Cele natywne podłączone”).
// @bacons/apple-targets 5.0.0 dodaje `targets/<cel>/_shared/*` do celu aplikacji przez PBXFileSystemSynchronizedBuildFileExceptionSet
// z `target` = cel aplikacji w grupie synchronizowanej celu rozszerzenia (build/with-xcode-changes.js). Plik jest w celu aplikacji, gdy:
// zbiór wyjątków ma target = cel aplikacji (pierwszy w `targets` projektu, productType application), wymienia plik i należy do grupy
// synchronizowanej podłączonej do jakiegoś celu. Brak pliku, projektu albo celu to błąd (pusty zbiór to nie zaliczenie).
// Użycie: node scripts/natywne/czlonkostwo-celu.mjs --pbxproj ios/<nazwa>.xcodeproj/project.pbxproj --plik _shared/Stuknij.swift
import { readFileSync } from 'node:fs';

const lista = (tresc, klucz) => {
  const m = tresc.match(new RegExp(`\\b${klucz} = \\(([^)]*)\\);`));
  return m ? m[1].split(',').map((s) => s.replace(/\/\*.*?\*\//g, '').trim().replace(/^"(.*)"$/, '$1')).filter(Boolean) : [];
};
const pole = (tresc, klucz) => tresc.match(new RegExp(`\\b${klucz} = ("[^"]*"|[^;\\s]+)`))?.[1]?.replace(/^"(.*)"$/, '$1') ?? null;

/** Obiekty projektu: id → treść bloku (obiekty stoją na dwóch tabulatorach w sekcji `objects`). */
export function obiekty(pbx) {
  const mapa = new Map();
  for (const m of pbx.matchAll(/^\t\t([0-9A-Z]{24}) (?:\/\*.*?\*\/ )?= \{\n([\s\S]*?)\n\t\t\};$/gm)) mapa.set(m[1], m[2]);
  return mapa;
}

/** Nazwa celu aplikacji i lista plików, które zbiory wyjątków podłączonych grup dodają do tego celu. Null = brak projektu lub celu. */
export function plikiCeluAplikacji(pbx) {
  const ob = obiekty(pbx);
  const projekt = [...ob.values()].find((t) => pole(t, 'isa') === 'PBXProject');
  if (!projekt) return null;
  const idCelu = lista(projekt, 'targets')[0];
  const cel = idCelu ? ob.get(idCelu) : undefined;
  if (!cel || pole(cel, 'productType') !== 'com.apple.product-type.application') return null;
  const podlaczone = new Set([...ob.values()].filter((t) => pole(t, 'isa') === 'PBXNativeTarget').flatMap((t) => lista(t, 'fileSystemSynchronizedGroups')));
  const pliki = [];
  for (const idGrupy of podlaczone) {
    const grupa = ob.get(idGrupy);
    if (!grupa || pole(grupa, 'isa') !== 'PBXFileSystemSynchronizedRootGroup') continue;
    for (const idZbioru of lista(grupa, 'exceptions')) {
      const zbior = ob.get(idZbioru);
      if (zbior && pole(zbior, 'isa') === 'PBXFileSystemSynchronizedBuildFileExceptionSet' && pole(zbior, 'target') === idCelu) pliki.push(...lista(zbior, 'membershipExceptions'));
    }
  }
  return { cel: pole(cel, 'name'), pliki };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
  const sciezka = arg('--pbxproj'), plik = arg('--plik');
  if (!sciezka || !plik) { console.log('użycie: --pbxproj <project.pbxproj> --plik <ścieżka w grupie>'); process.exit(2); }
  const w = plikiCeluAplikacji(readFileSync(sciezka, 'utf8'));
  if (!w) { console.log(`::error::${sciezka}: brak projektu albo celu aplikacji`); process.exit(1); }
  if (!w.pliki.includes(plik)) { console.log(`::error::${plik} poza celem ${w.cel} (w celu z grup: ${w.pliki.join(', ') || 'nic'})`); process.exit(1); }
  console.log(`${plik} w celu ${w.cel}`);
}
