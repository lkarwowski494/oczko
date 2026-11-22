// Podpis ad hoc w testflight.yml: każdy cel (aplikacja, widżet, zegarek, rozszerzenie „Udostępnij do Oczka”) podpisany WŁASNYM plikiem
// uprawnień z CODE_SIGN_ENTITLEMENTS swojego celu, konfiguracja Release (P-233: wcześniej każdy .appex dostawał plik widżetu).
// Dane: tests/wydanie/dane/project.pbxproj — wynik `npx expo prebuild --platform ios --no-install` z 2026-10-26 (Linux; widżet i zegarek bez uprawnień).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SKRYPT = join(__dirname, '../../scripts/wydanie/uprawnienia-celow.mjs');
const PBX = join(__dirname, 'dane/project.pbxproj');
const mapa = (plik: string) => JSON.parse(execFileSync(process.execPath, [SKRYPT, plik, '--json'], { encoding: 'utf8' })) as Record<string, string>;

/** Kopia projektu: wpis CODE_SIGN_ENTITLEMENTS w konfiguracji `nazwaKonf` celu `cel` (po linii PRODUCT_NAME tej konfiguracji). */
function zWpisem(tekst: string, cel: string, nazwaKonf: string, wartosc: string): string {
  const lista = new RegExp(`/\\* Build configuration list for PBXNativeTarget "${cel}" \\*/ = \\{[\\s\\S]*?buildConfigurations = \\(([\\s\\S]*?)\\);`).exec(tekst);
  if (!lista) throw new Error(`brak celu ${cel}`);
  const id = new RegExp(`([0-9A-Z]{24}) /\\* ${nazwaKonf} \\*/`).exec(lista[1])?.[1];
  const start = tekst.indexOf(`${id} /* ${nazwaKonf} */ = {`);
  const linia = tekst.indexOf('buildSettings = {', start) + 'buildSettings = {'.length;
  return `${tekst.slice(0, linia)}\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = ${wartosc};${tekst.slice(linia)}`;
}

test('projekt z prebuild: uprawnienia ma tylko aplikacja (widżet i zegarek bez pliku)', () => {
  expect(mapa(PBX)).toEqual({ Oczko: 'Oczko/Oczko.entitlements' });
});

test('każdy cel dostaje własny plik — rozszerzenie nie dostaje pliku widżetu; liczy się Release, nie Debug', () => {
  let t = readFileSync(PBX, 'utf8');
  t = zWpisem(t, 'OczkoWidget', 'Release', '.targets/OczkoWidget/generated.entitlements');
  t = zWpisem(t, 'OczkoZegarek', 'Debug', '.targets/OczkoZegarek/debug.entitlements');
  // drugi .appex: kopia bloku celu widżetu pod inną nazwą nie jest potrzebna — wystarczy cel z inną nazwą produktu
  t = t.replace(/OczkoZegarek/g, 'OczkoUdostepnij');
  const plik = join(mkdtempSync(join(tmpdir(), 'pbx-')), 'project.pbxproj');
  writeFileSync(plik, zWpisem(t, 'OczkoUdostepnij', 'Release', '"Oczko Udostepnij/generated.entitlements"'));
  expect(mapa(plik)).toEqual({
    Oczko: 'Oczko/Oczko.entitlements',
    OczkoWidget: '.targets/OczkoWidget/generated.entitlements',
    OczkoUdostepnij: 'Oczko Udostepnij/generated.entitlements',
  });
});

test('wyjście dla powłoki: nazwa produktu i ścieżka oddzielone tabulatorem', () => {
  expect(execFileSync(process.execPath, [SKRYPT, PBX], { encoding: 'utf8' })).toBe('Oczko\tOczko/Oczko.entitlements\n');
});
