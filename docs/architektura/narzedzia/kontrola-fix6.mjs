// kontrola-fix6.mjs — kontrola dokumentów roli 05 fix-6 (NZ-P5-PRZEGLAD; P-188, P-191, P-193, P-194, P-199): kontrakt partii 5
// w moduly.md, aneksy dane.md, ADR-0016/0018/0008/0009. Przed poprawką czerwone (dowód stanu wyjściowego), po poprawce zielone.
// Użycie: node docs/architektura/narzedzia/kontrola-fix6.mjs [--id sygn,aneksy,...]   (kod 1, gdy któraś pozycja nie przechodzi)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const K = join(import.meta.dirname, '../../..');
const czytaj = (p) => (existsSync(join(K, p)) ? readFileSync(join(K, p), 'utf8') : '');
const sekcja = (tekst, naglowek) => tekst.split(/^## /m).find((s) => s.startsWith(naglowek)) ?? '';
const moduly = czytaj('docs/architektura/moduly.md');
const p5 = sekcja(moduly, 'Kontrakt partii 5');
const sesja = sekcja(moduly, 'Maszyny stanów');
const dane = czytaj('docs/architektura/dane.md');
const NAZWY_ADR = { '0008': '0008-plus-jeden-z-ekranu-blokady-dziennik.md', '0009': '0009-zegarek-transport-limit-pro.md', '0016': '0016-zaleznosci-wersji-1.md', '0018': '0018-sygnal-awarii-bez-sdk-metrickit-lokalnie.md' };
const adrPlik = (prefiks) => czytaj(`docs/adr/${NAZWY_ADR[prefiks]}`);
const fix6 = (prefiks) => sekcja(adrPlik(prefiks), 'Uzupełnienie 2026-10-26 (fix-6');
/** Nazwy eksportowanych funkcji z pliku przypadków użycia (export function / export const … = (z…). */
const eksporty = (plik) => [...czytaj(plik).matchAll(/^export (?:async )?(?:function (\w+)|const (\w+) = \()/gm)].map((m) => m[1] ?? m[2]);
const SYGNATURY_P5 = [
  ['src/przypadki-uzycia/projekt.ts', ['dodajCzescProjektu', 'ustawDrut', 'ustawTermin']],
  ['src/przypadki-uzycia/czesc.ts', ['ustawZnaczenie', 'nastepnaCzesc']],
  ['src/przypadki-uzycia/widok-projektu.ts', ['widokProjektu', 'podgladTerminu']],
  ['src/przypadki-uzycia/widok-kosza.ts', ['widokKosza']],
  ['src/przypadki-uzycia/sesja.ts', ['startSesji', 'wstrzymajSesje', 'wznowSesje', 'zakonczSesje', 'korygujSesje', 'otwartaSesja', 'sesjeProjektu']],
];

/** id → lista [opis, warunek]. */
const KONTROLE = {
  sygn: [
    ['moduly.md: sekcja „Kontrakt partii 5” z sygnaturą każdej funkcji partii 5 (P-182 Q3a)', () => SYGNATURY_P5.every(([, f]) => f.every((n) => p5.includes(`function ${n}(`)))],
    ['każda z tych funkcji jest eksportowana z pliku wskazanego w kontrakcie', () => SYGNATURY_P5.every(([plik, f]) => f.every((n) => eksporty(plik).includes(n)))],
    ['kontrakt mówi o odczytach w kolejce i o „Stop it and start here?” jako dwóch pozycjach kolejki (P-191 P3a)', () => /[Oo]dczyt\w* [^\n]*kolejk/.test(p5) && /P3a/.test(p5)],
  ],
  aneksy: [
    ['dane.md: aneks `projekt.narzedzie` przejrzany przez 05 fix-6 (P-184)', () => /Rodzaj narzędzia projektu[^\n]*przejrzane 05 fix-6/.test(dane) && !/Rodzaj narzędzia projektu[^\n]*do przeglądu 05\)/.test(dane)],
    ['dane.md: klucz `jezyk` przejrzany przez 05 fix-6 (P-190)', () => /^\| `jezyk` \|[^\n]*przejrzane 05 fix-6/m.test(dane)],
  ],
  adr16: [['ADR-0016: wiersz datetimepicker 9.1.0 z prywatnością (bez PrivacyInfo, bez required reason API) i przeglądem 05', () => /`@react-native-community\/datetimepicker` 9\.1\.0[^\n]*PrivacyInfo[^\n]*required reason[^\n]*05 fix-6/.test(adrPlik('0016'))]],
  calosc: [
    ['Kontrakt partii 5: licznikCalosci zwraca number | null, reguła ≥ 2 liczniki rzędów, bez flagi (P-199 Q1a)', () => /function licznikCalosci\(liczniki: readonly LicznikKawalka\[\], czescId: string\): number \| null/.test(p5) && /≥ 2/.test(p5) && /P-199 Q1a/.test(p5)],
    ['Kontrakt partii 5: `licznik.sekcja` usunięta z v1 łatką (schemat.sql i 0001.sql razem)', () => /`licznik\.sekcja`[^\n]*(usunięt|znika)/.test(p5) && /0001\.sql/.test(p5)],
  ],
  para: [['Kontrakt partii 5: cel pary z rzędów pierwszej (S1, S3), dodajCzescPara bez kopii celu, zrobPonownie przepisuje para_z (P-199 Q2a)', () => /celCzesci/.test(p5) && /dodajCzescPara[^\n]*(bez kopii|nie kopiuje)/.test(p5) && /zrobPonownie[^\n]*para_z/.test(p5) && /P-199 Q2a/.test(p5)]],
  sesja: [
    ['Maszyna sesji: korekta zeruje przerwy_ms (P-199 Q4a, P-195 Q2a)', () => /\| zakonczona \| koryguj \| zakonczona \|[^\n]*`przerwy_ms = 0`[^\n]*P-199 Q4a/.test(sesja)],
    ['Stan v3: `sesjaStartMs` = start_ms + przerwy_ms przy „trwa”, null w pauzie; odświeżenie po każdym przejściu sesji (P-199 Q3c)', () => /sesjaStartMs[^\n]*start_ms \+ przerwy_ms[^\n]*null[^\n]*pauz/.test(p5) && /odswiezEkranBlokady/.test(p5) && /P-199 Q3c/.test(p5)],
    ['ADR-0008 (fix-6): pauza sesji na ekranie blokady w 1.0 bez pola stanu, widok pauzy w 1.1 z warunkiem', () => ['P-199 Q3c', 'sesjaStartMs', '1.1'].every((s) => fix6('0008').includes(s))],
  ],
  n12: [
    ['dane.md: manifest archiwum `wersja_schematu` = PRAGMA user_version bazy w archiwum (N12-07)', () => /N12-07[^\n]*user_version/.test(dane)],
    ['dane.md: migracja kopii roboczej z katalogKopii = katalog tymczasowy operacji (N12-08)', () => /N12-08[^\n]*katalog\w* tymczasow/.test(dane)],
    ['dane.md: plik stanu startu poza SQLite — wyjątek nazwany do 1.1 z warunkiem (N12-09, ARCH-22)', () => /N12-09[^\n]*ARCH-22[^\n]*1\.1/.test(dane)],
  ],
  adr18: [['ADR-0018 (fix-6): MetricKit w 1.1; przed TestFlight globalna obsługa błędów JS i „Zgłoś problem” w trybie awaryjnym (P-194)', () => ['P-194', 'MetricKit', '1.1', 'TestFlight', 'setGlobalHandler', 'tryb awaryjn'].every((s) => fix6('0018').includes(s))]],
  f58: [
    ['dane.md: klucz `zegarek_ostatnia_partia_ms` — stan urządzenia, bez iCloud, pomijany przy imporcie (P-199 Q5a)', () => /^\| `zegarek_ostatnia_partia_ms` \|[^\n]*\| nie \(stan urządzenia\) \| przy imporcie pomijany \|[^\n]*P-199 Q5a/m.test(dane)],
    ['ADR-0009 (fix-6): linia na zegarku, gdy najstarsza linia kolejki czeka ≥ ZEGAREK_PONOWIENIE_MS; kontrakt WC bez zmian (P-193, P-199 Q6a)', () => ['ZEGAREK_PONOWIENIE_MS', 'P-193', 'P-199 Q6a', 'bez zmian'].every((s) => fix6('0009').includes(s))],
  ],
  n4: [['dane.md: usuwanie włóczki i narzędzia przez kosz (dwa rodzaje), sprzątanie po 30 dniach bez przypisań, trwałe ukrycie przypisanej włóczki (P-209)', () => /P-209[^\n]*/.test(dane) && ['elementyKosza', 'projekt_wloczka', 'NOT EXISTS', 'doSprzatniecia', 'ukryt'].every((t) => (dane.match(/\*\*Usuwanie włóczki i narzędzia[^\n]*(?:\n(?!\n)[^\n]*)*/)?.[0] ?? '').includes(t))]],
};

const i = process.argv.indexOf('--id');
const wybrane = i > 0 ? process.argv[i + 1].split(',') : Object.keys(KONTROLE);
let zle = 0, razem = 0;
for (const id of wybrane) {
  for (const [opis, warunek] of KONTROLE[id] ?? [[`nieznane id ${id}`, () => false]]) {
    razem += 1;
    const ok = (() => { try { return warunek(); } catch { return false; } })();
    if (!ok) zle += 1;
    console.log(`${ok ? 'OK  ' : 'BRAK'} (${id}) ${opis}`);
  }
}
console.log(`${razem - zle}/${razem}`);
process.exit(zle ? 1 : 0);
