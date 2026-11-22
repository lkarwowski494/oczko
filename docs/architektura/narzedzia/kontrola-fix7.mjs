// kontrola-fix7.mjs — kontrola dokumentów roli 05 fix-7 (NZ-P217-05; P-217, P-218, P-220, P-221): fundament i kontrakty partii 6 i 7
// w moduly.md, porty, ADR-0005/0011/0012/0016, nowy ADR-0026, dane.md, prywatnosc.md, kontrakt tabel iCloud, testy oczekujące i łatki.
// Przed poprawką czerwone (dowód stanu wyjściowego), po poprawce zielone.
// Użycie: node docs/architektura/narzedzia/kontrola-fix7.mjs [--id fundament,p6,...] [--latki <katalog łatek>]   (kod 1, gdy któraś pozycja nie przechodzi)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const K = join(import.meta.dirname, '../../..');
const czytaj = (p) => (existsSync(join(K, p)) ? readFileSync(join(K, p), 'utf8') : '');
const sekcja = (tekst, naglowek) => tekst.split(/^## /m).find((s) => s.startsWith(naglowek)) ?? '';
const moduly = czytaj('docs/architektura/moduly.md');
const fundament = sekcja(moduly, 'Fundament partii 6 i 7');
const p6 = sekcja(moduly, 'Kontrakt partii 6');
const p7 = sekcja(moduly, 'Kontrakt partii 7');
const porty = czytaj('src/domena/porty.ts');
const adr = (plik) => czytaj(`docs/adr/${plik}`);
const fix7 = (plik) => sekcja(adr(plik), 'Uzupełnienie 2026-10-26 (fix-7');
const arg = process.argv.slice(2);
const latki = arg.includes('--latki') ? arg[arg.indexOf('--latki') + 1] : null;
const LATKI = ['L1-schemat-skrzynka-icloud.patch', 'L2-sesja-zmieniono.patch', 'L3a-ipad-orientacja.patch', 'L3b-app-group.patch', 'L3c-icloud-uprawnienia.patch'];
let kontraktIcloud = null;
try { kontraktIcloud = JSON.parse(czytaj('docs/architektura/icloud-tabele.json')); } catch { kontraktIcloud = null; }

/** id → lista [opis, warunek]. */
const KONTROLE = {
  fundament: [
    ['moduly.md: sekcja „Fundament partii 6 i 7” z łatkami L1–L3c w kolejności', () => LATKI.every((l) => fundament.includes(l)) && LATKI.map((l) => fundament.indexOf(l)).every((v, i, a) => i === 0 || v > a[i - 1])],
    ['moduly.md: tabela plików wspólnych obu partii (en.json, kontener, start, Licznik, package.json, testflight.yml)', () => ['en.json', 'kontener.ts', 'start.ts', 'Licznik.tsx', 'package.json', 'testflight.yml'].every((p) => fundament.includes(p))],
  ],
  porty: [
    ['porty.ts: nowe porty partii 6 (SkrzynkaImportu z ZlecenieImportu, MigawkaProjektow, KonwersjaWzoru, SkanerStron, Orientacja)', () => ['ZlecenieImportu', 'MigawkaProjektow', 'KonwersjaWzoru', 'SkanerStron', 'Orientacja'].every((n) => new RegExp(`export (interface|type) ${n}\\b`).test(porty))],
    ['porty.ts: Synchronizacja v2 bez zglosZmiane, z wyslij/odbieraj/wyslane/statusKonta', () => /export interface Synchronizacja \{[^\n]*wyslij\([^\n]*odbieraj\([^\n]*wyslane\(/.test(porty) && /statusKonta\(\)/.test(porty) && !/zglosZmiane\(/.test(porty)],
  ],
  p6: [
    ['moduly.md: kontrakt partii 6 — moduł oczko-wzor z PDFPageOverlayViewProvider, cel share, migawka, skrzynka z manifestem na końcu', () => ['oczko-wzor', 'PDFPageOverlayViewProvider', 'targets/share', 'projekty-migawka.json', 'zlecenie.json'].every((t) => p6.includes(t))],
    ['moduly.md: kontrakt partii 6 — dodajWzor, listaWzorow, usunWzor (ocena utraty N4), zapiszRysunek, przetworzSkrzynke', () => ['function', 'dodajWzor(', 'listaWzorow(', 'usunWzor(', 'zapiszRysunek(', 'przetworzSkrzynke('].slice(1).every((t) => p6.includes(t)) && p6.includes('Ocena utraty danych (N4)')],
    ['moduly.md: kontrakt partii 6 — iPad (WCSession.isSupported, układ według szerokości), podpis .appex, E2E iPada, testy oczekujące', () => ['isSupported', 'szerokości okna', 'Podpis rozszerzenia', 'E2E iPada', 'Testy oczekujące dla 07'].every((t) => p6.includes(t))],
    ['moduly.md: kontrakt partii 6 — ograniczenia patentowe P-218 (1)–(3) w kontrakcie', () => ['P-218 (1)', 'P-218 (2)', 'P-218 (3)'].every((t) => p6.includes(t))],
  ],
  p7: [
    ['moduly.md: kontrakt partii 7 — skrzynka (nr ≤ wysłanego), flaga wejścia, poczekalnia, ZM-06 (ICLOUD_W_1_0), N3, N5', () => ['nr <= ?', 'wejscie = 1', 'poczekalnia', 'ICLOUD_W_1_0', 'N3', 'N5'].every((t) => p7.includes(t))],
    ['moduly.md: kontrakt partii 7 — testy oczekujące (odwzorowanie, dwa urządzenia, konto, pliki)', () => ['icloud-odwzorowanie', 'icloud-dwa-urzadzenia', 'icloud-konto', 'icloud-pliki'].every((t) => p7.includes(t))],
  ],
  icloud: [
    ['icloud-tabele.json: 17 tabel synchronizowanych + 4 lokalne, każda tabela schematu v1 na jednej z list', () => {
      if (!kontraktIcloud) return false;
      const schemat = [...czytaj('docs/architektura/schemat.sql').matchAll(/^CREATE TABLE (\w+)/gm)].map((m) => m[1]);
      const wszystkie = [...kontraktIcloud.tabele.map((t) => t.tabela), ...kontraktIcloud.lokalne];
      return kontraktIcloud.tabele.length === 17 && kontraktIcloud.lokalne.length === 4 && schemat.every((t) => wszystkie.includes(t));
    }],
    ['testy oczekujące L1: tests/akceptacja/dane/icloud-skrzynka.test.ts i instrukcje-wyzwalacze.test.ts albo przeniesione do tests/dane', () =>
      ['icloud-skrzynka', 'instrukcje-wyzwalacze'].every((n) => existsSync(join(K, `tests/akceptacja/dane/${n}.test.ts`)) || existsSync(join(K, `tests/dane/${n}.test.ts`)))],
  ],
  adr: [
    ['ADR-0005, 0011, 0012, 0016: uzupełnienia fix-7', () => [
      '0005-synchronizacja-icloud-cloudkit-dziennik.md', '0011-import-wzorow-rozszerzenie-pdf.md', '0012-rysik-i-zakreslacz-pencilkit.md', '0016-zaleznosci-wersji-1.md',
    ].every((p) => fix7(p).length > 200)],
    ['ADR-0026 iPad: przyjęta, TN3192, trzy opcje', () => { const t = adr('0026-ipad-uklad-wedlug-szerokosci-orientacja.md'); return /Status: \*\*przyjęta/.test(t) && t.includes('TN3192') && (t.split('## Opcje: zalety i wady')[1] ?? '').split('\n### ').length - 1 >= 3; }],
  ],
  dane: [
    ['dane.md: sekcja skrzynki zmian (wyzwalacze, usunięcie wszystkiego, wzór usunięty, App Group)', () => { const s = sekcja(czytaj('docs/architektura/dane.md'), 'Synchronizacja iCloud: skrzynka zmian'); return ['AFTER INSERT/UPDATE/DELETE', 'Usuń wszystkie dane', 'wzor.usunieto_ms', 'oczko-migawka'].every((t) => s.includes(t)); }],
    ['prywatnosc.md: migawka projektów i skan stron w inwentarzu', () => { const t = czytaj('docs/architektura/prywatnosc.md'); return t.includes('Migawka projektów') && t.includes('Skan stron'); }],
  ],
};
if (latki) KONTROLE.latki = [
  ['łatki L1–L3c w katalogu (git format-patch, nagłówek From)', () => LATKI.every((l) => existsSync(join(latki, l)) && readFileSync(join(latki, l), 'utf8').startsWith('From '))],
];

const ip = arg.indexOf('--id');
const wybrane = ip >= 0 ? arg[ip + 1].split(',') : Object.keys(KONTROLE);
let ok = 0, razem = 0;
for (const id of wybrane) {
  for (const [opis, warunek] of KONTROLE[id] ?? []) {
    razem++;
    let wynik = false;
    try { wynik = Boolean(warunek()); } catch { wynik = false; }
    if (wynik) ok++;
    console.log(`${wynik ? 'OK  ' : 'BRAK'} [${id}] ${opis}`);
  }
}
console.log(`kontrola-fix7: ${ok}/${razem}`);
process.exit(ok === razem && razem > 0 ? 0 : 1);
