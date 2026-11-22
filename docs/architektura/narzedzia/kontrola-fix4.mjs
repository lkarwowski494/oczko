// kontrola-fix4.mjs — kontrola dokumentów roli 05 fix-4 (NZ-08-P3-05, P-135): dla każdego zgłoszenia (a)–(h), N1, N2 sprawdza, że
// kontrakt jest zapisany tam, gdzie czyta go rola 08. Przed poprawką czerwone (dowód stanu wyjściowego), po poprawce zielone.
// fix-5 (NZ-08-P4-05, P-151): 08 w partii 4 przeniosło deklaracje (e), (a), (b), (n1) z „Kontrakt partii 4” do „Porty domeny”
// i `src/domena/porty.ts` (`WERSJA_STANU` do `src/konfiguracja.ts`), a test (e) do `tests/dane/`; kontrola szuka tych samych napisów
// w nowych miejscach — w dokumencie i w kodzie (sprawdz-porty.mjs pilnuje ich równości) — a dla testu (e) także braku kopii w akceptacji.
// Użycie: node docs/architektura/narzedzia/kontrola-fix4.mjs [--id e,a,...]   (kod 1, gdy któraś pozycja nie przechodzi)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const K = join(import.meta.dirname, '../../..');
const czytaj = (p) => (existsSync(join(K, p)) ? readFileSync(join(K, p), 'utf8') : '');
const sekcja = (tekst, naglowek) => tekst.split(/^## /m).find((s) => s.startsWith(naglowek)) ?? '';
const moduly = czytaj('docs/architektura/moduly.md');
const partia4 = sekcja(moduly, 'Kontrakt partii 4');
const portyDok = sekcja(moduly, 'Porty domeny');
const portyKod = czytaj('src/domena/porty.ts');
/** Napis w bloku „Porty domeny” i w `src/domena/porty.ts` (miejsce po przeniesieniu przez 08, fix-5). */
const wPortach = (...napisy) => napisy.every((n) => portyDok.includes(n) && portyKod.includes(n));
const konfiguracja = sekcja(moduly, 'Konfiguracja');

/** id → lista [opis, warunek]. */
const KONTROLE = {
  e: [
    ['rejestr Apple 4f–4i (transferUserInfo, didFinish, outstanding, UserDefaults)', () => ['4f', '4g', '4h', '4i'].every((n) => new RegExp(`^\\| ${n} \\|`, 'm').test(czytaj('docs/architektura/rejestr/apple.md')))],
    ['ADR-0009: uzupełnienie 2026-10-26 z kolejką w pliku, potwierdzeniem i ponowieniem', () => {
      const u = sekcja(czytaj('docs/adr/0009-zegarek-transport-limit-pro.md'), 'Uzupełnienie 2026-10-26');
      return ['skrzynka-zegarka.jsonl', '`potwierdzone`', 'ZEGAREK_PONOWIENIE_MS', 'outstandingUserInfoTransfers', 'fsync'].every((s) => u.includes(s));
    }],
    ['wektory tests/wspolne/wzorce.json → zegarek_skrzynka: ≥ 9 scenariuszy ZG-*, id bez powtórzeń', () => {
      try {
        const w = JSON.parse(czytaj('tests/wspolne/wzorce.json')).zegarek_skrzynka;
        const id = w.scenariusze.map((s) => s.id);
        return id.length >= 9 && new Set(id).size === id.length && id.every((i) => /^ZG-\d{2}$/.test(i));
      } catch { return false; }
    }],
    ['specyfikacja X-ZG-01–X-ZG-09 w tests/wspolne/xctest-specyfikacja.md', () => Array.from({ length: 9 }, (_, i) => `X-ZG-0${i + 1}`).every((x) => czytaj('tests/wspolne/xctest-specyfikacja.md').includes(`| ${x} |`))],
    ['ZEGAREK_PONOWIENIE_MS i ZEGAREK_POTWIERDZENIA_MAKS w src/konfiguracja.ts i w tabeli „Konfiguracja”', () => ['ZEGAREK_PONOWIENIE_MS', 'ZEGAREK_POTWIERDZENIA_MAKS'].every((n) => new RegExp(`export const ${n} =`).test(czytaj('src/konfiguracja.ts')) && konfiguracja.includes(`\`${n}\``))],
    ['port Zegarek.potwierdz i WynikPartii.potwierdzone w „Porty domeny” i src/domena/porty.ts', () => wPortach('potwierdz(ids: readonly string[]): void', 'potwierdzone: string[]')],
    ['test strony telefonu w głównym zestawie tests/dane/zegarek-potwierdzenia.test.ts, bez kopii w tests/akceptacja/', () => czytaj('tests/dane/zegarek-potwierdzenia.test.ts').includes('P-135') && !existsSync(join(K, 'tests/akceptacja/dane/zegarek-potwierdzenia.test.ts'))],
  ],
  a: [['Sklep.kup → Promise<StatusZakupu> w „Porty domeny” i src/domena/porty.ts', () => wPortach('kup(id: string): Promise<StatusZakupu>', "export type StatusZakupu = 'sukces' | 'oczekujacy' | 'anulowany' | 'blad'")]],
  b: [['Haptyka.zagraj(w: WzorzecHaptyki) z kluczami tokenów 04', () => {
    const klucze = Object.keys(JSON.parse(czytaj('docs/design/tokeny.json') || '{}').haptyka ?? {}).filter((k) => !k.startsWith('_'));
    const typy = [portyDok, portyKod].map((t) => { const m = t.match(/export type WzorzecHaptyki = ([^;]+);/); return m ? [...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]) : []; });
    return wPortach('zagraj(w: WzorzecHaptyki): void') && klucze.length === 6 && typy.every((typ) => typ.length === klucze.length && klucze.every((k) => typ.includes(k)));
  }]],
  c: [['drzewo moduly.md: bez oczko-zegarek, z oczko-reguly', () => {
    const d = sekcja(moduly, 'Drzewo katalogów');
    return !d.includes('oczko-zegarek') && d.includes('oczko-reguly');
  }]],
  d: [
    ['ADR-0008: stan Live Activity z polem `uwaga` (odblokuj, blad_zapisu)', () => /`uwaga`[^\n]*'odblokuj'[^\n]*'blad_zapisu'/.test(czytaj('docs/adr/0008-plus-jeden-z-ekranu-blokady-dziennik.md'))],
    ['X-DZ-07 i X-DZ-14 (błąd zapisu) w specyfikacji z polem `uwaga`', () => /\| X-DZ-07 \|[^\n]*`uwaga: 'odblokuj'`/.test(czytaj('tests/wspolne/xctest-specyfikacja.md')) && /\| X-DZ-14 \|[^\n]*`uwaga: 'blad_zapisu'`/.test(czytaj('tests/wspolne/xctest-specyfikacja.md'))],
  ],
  n1: [['stan wersja 3: `zablokowany: boolean` w StanEkranuBlokady („Porty domeny”, porty.ts), WERSJA_STANU = 3 w src/konfiguracja.ts i opisie stanu, reguła w ADR-0008', () => [portyDok, portyKod].every((t) => /export type StanEkranuBlokady = \{[^\n]*zablokowany: boolean \}/.test(t)) && /export const WERSJA_STANU = 3;/.test(czytaj('src/konfiguracja.ts')) && /`WERSJA_STANU` = 3/.test(sekcja(moduly, 'Stan Live Activity i zegarka')) && /zablokowany/.test(sekcja(czytaj('docs/adr/0008-plus-jeden-z-ekranu-blokady-dziennik.md'), 'Uzupełnienie 2026-10-26 (fix-4'))]],
  n3: [['ADR-0008 (fix-4): zmiana języka aplikacji jako wyzwalacz odświeżenia stanu (P-137)', () => /zmian\w* języka aplikacji/.test(sekcja(czytaj('docs/adr/0008-plus-jeden-z-ekranu-blokady-dziennik.md'), 'Uzupełnienie 2026-10-26 (fix-4'))]],
  uk: [['zmienDateUkonczenia: ta sama pora dnia, zmienia się tylko data (P-137), w „Kontrakt partii 4”', () => partia4.includes('zmienDateUkonczenia(z: Zaleznosci, w: { projektId: string; ukonczonoDzien: string })') && /ta sama pora/.test(partia4)]],
  rd15: [['celDzienny z Z_teraz (RD-15, P-136) w „Kontrakt partii 4”', () => /celDzienny\(w: \{ suma: number; przedDzis: number; zrobioneTeraz: number; termin: string; dzis: string \}\)/.test(partia4)]],
  rd21: [['polozenieZnacznika z wariantem „przed schematem” (RD-21, P-134 Q3a) w „Kontrakt partii 4” i ADR-0011', () => partia4.includes('przedSchematem: boolean') && partia4.includes('rzadNotatki: number | null') && /RD-21/.test(sekcja(czytaj('docs/adr/0011-import-wzorow-rozszerzenie-pdf.md'), 'Uzupełnienie 2026-10-26 (fix-4'))]],
  f: [['wiersz DZIENNIK_BLAD_TEKST_MAKS w tabeli „Konfiguracja”', () => /\| `DZIENNIK_BLAD_TEKST_MAKS` \(znaki\) \| 4096 \|/.test(konfiguracja)]],
  g: [['opis ostatniPlusMs = ostatnie +1 w dowolnym projekcie', () => /`ostatniPlusMs`: czas ostatniego \+1 w dowolnym projekcie/.test(moduly) && !moduly.includes('`ostatniPlusMs`: czas ostatniej zmiany licznika')]],
  h: [['budżet SHA-256/CRC-32 jako nazwany stan „do ustalenia po pomiarze na urządzeniu” (ADR-0016, e3 §3)', () => czytaj('docs/adr/0016-zaleznosci-wersji-1.md').includes('do ustalenia po pomiarze na urządzeniu') && /\| Sprawdzenie archiwum[^\n]*do ustalenia po pomiarze na urządzeniu/.test(czytaj('docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md'))]],
};

const i = process.argv.indexOf('--id');
const wybrane = i > 0 ? process.argv[i + 1].split(',') : Object.keys(KONTROLE);
let zle = 0, razem = 0;
for (const id of wybrane) {
  for (const [opis, warunek] of KONTROLE[id] ?? [[`nieznane id ${id}`, () => false]]) {
    razem += 1;
    const ok = warunek();
    if (!ok) zle += 1;
    console.log(`${ok ? 'OK  ' : 'BRAK'} (${id}) ${opis}`);
  }
}
console.log(`kontrola fix-4: ${razem - zle}/${razem}`);
process.exit(zle ? 1 : 0);
