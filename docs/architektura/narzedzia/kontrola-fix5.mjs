// kontrola-fix5.mjs — kontrola dokumentów roli 05 fix-5 (NZ-08-P4-05, P-151, P-156): ADR-0008 po P-142 (4a) i N3,
// kontrakt prośby o ocenę (P-150 E2-1a). Przed poprawką czerwone (dowód stanu wyjściowego), po poprawce zielone.
// Użycie: node docs/architektura/narzedzia/kontrola-fix5.mjs [--id adr4a,n3,...]   (kod 1, gdy któraś pozycja nie przechodzi)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const K = join(import.meta.dirname, '../../..');
const czytaj = (p) => (existsSync(join(K, p)) ? readFileSync(join(K, p), 'utf8') : '');
const sekcja = (tekst, naglowek) => tekst.split(/^## /m).find((s) => s.startsWith(naglowek)) ?? '';
const adr8 = czytaj('docs/adr/0008-plus-jeden-z-ekranu-blokady-dziennik.md');
const fix5 = sekcja(adr8, 'Uzupełnienie 2026-10-26 (fix-5');

const moduly = czytaj('docs/architektura/moduly.md');
const konf = czytaj('src/konfiguracja.ts');
const liczba = (n) => { const m = konf.match(new RegExp(`export const ${n} = (\\d+);`)); return m ? Number(m[1]) : null; };
const wektory = (() => { try { return JSON.parse(czytaj('docs/architektura/wektory-prosby-o-ocene.json')).wektory ?? []; } catch { return []; } })();
/** Tabela PO-nn → oczekiwane z docs/wzrost.md (rola 11): „tak” / „jak brak prośby (PO-02)” = true, „nie…” = false. */
const zWzrostu = new Map([...czytaj('docs/wzrost.md').matchAll(/^\| (PO-\d{2}) \|[^|\n]*\| ([^|\n]+) \|$/gm)].map((m) => [m[1], /^(tak|jak brak prośby)/.test(m[2].trim())]));
const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const nrDnia = (s) => {
  const m = typeof s === 'string' ? DATA.exec(s) : null;
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d.getTime() / 86_400_000 : null;
};
/** Wzorzec bramki z tekstu kontraktu (niezależny rachunek; kod 08 sprawdza test oczekujący na tych samych wektorach). */
function wzorzec(w, odstepDni) {
  if (w.zdarzenie !== 'zamknieto_karte_ukonczenia' || w.dostepna !== true || typeof w.wersja !== 'string' || !w.wersja) return false;
  const dzis = nrDnia(w.dzis);
  if (dzis === null) return false;
  const o = w.ostatniaProsba;
  if (!o || typeof o !== 'object' || typeof o.wersja !== 'string' || !o.wersja || nrDnia(o.dzien) === null) return true; // PO-11
  if (o.wersja === w.wersja) return false; // PROSB_NA_WERSJE = 1
  const roznica = dzis - nrDnia(o.dzien);
  return roznica >= 0 && roznica >= odstepDni; // PO-09, PO-04/05
}

/** id → lista [opis, warunek]. */
const KONTROLE = {
  adr4a: [['ADR-0008: przy `uwaga != null` przycisk +1 zostaje (P-142 4a), bez zdania „zamiast przycisku komunikat”', () => !/zamiast przycisku/.test(adr8) && /`uwaga != null`[^\n]*przycisk \+1 zostaje[^\n]*P-142 \(4a\)/.test(adr8)]],
  n3: [['ADR-0008 (fix-5): ryzyko nazwane N3 — zegarek ze stanem v2 nie widzi blokady; brzegowe; bez odrzucenia na telefonie (P-151)', () => ['N3', 'brzegowe', 'X-ZG-11', 'P-151', 'nie odrzuca'].every((s) => fix5.includes(s)) && /stan\w* v2/.test(fix5)]],
  po: [
    ['stałe ODSTEP_PROSBY_DNI = 14 i PROSB_NA_WERSJE = 1 w src/konfiguracja.ts i w tabeli „Konfiguracja”', () => liczba('ODSTEP_PROSBY_DNI') === 14 && liczba('PROSB_NA_WERSJE') === 1 && /\| `ODSTEP_PROSBY_DNI` \(dni\) \| 14 \|/.test(sekcja(moduly, 'Konfiguracja')) && /\| `PROSB_NA_WERSJE` \(prośby na wersję\) \| 1 \|/.test(sekcja(moduly, 'Konfiguracja'))],
    ['sygnatura czyProsicOOcene w „Funkcje domeny” i sekcja „Prośba o ocenę” w moduly.md; typy w src/domena/ocena.ts', () => /\| `ocena\.ts` \| `czyProsicOOcene\(w: WejscieProsby\): boolean` \|/.test(sekcja(moduly, 'Funkcje domeny')) && ['ostatnia_prosba_o_ocene', 'requestReview', 'P-156'].every((t) => sekcja(moduly, 'Prośba o ocenę').includes(t)) && ['export interface WejscieProsby', 'export type ZdarzenieProsby', 'export type OstatniaProsba'].every((t) => czytaj('src/domena/ocena.ts').includes(t))],
    ['klucz `ostatnia_prosba_o_ocene` w dane.md: stan urządzenia, bez iCloud, pomijany przy imporcie (P-156 Q1a)', () => /^\| `ostatnia_prosba_o_ocene` \| `\{ wersja, dzien \}`[^\n]*\| nie \(stan urządzenia\) \| przy imporcie pomijany \|[^\n]*P-156/m.test(czytaj('docs/architektura/dane.md'))],
    ['wektory: te same ID i oczekiwania co tabela PO-01–PO-11 w docs/wzrost.md', () => {
      const id = [...new Set(wektory.map((w) => w.id))];
      return zWzrostu.size === 11 && id.length === 11 && id.every((x) => zWzrostu.has(x)) && wektory.every((w) => w.oczekiwane === zWzrostu.get(w.id)); // także warianty: oczekiwanie z tabeli ID
    }],
    ['wektory zgodne z wzorcem bramki liczonym z kontraktu (odstęp ze stałej)', () => wektory.length > 11 && wektory.every((w) => wzorzec(w.wejscie, liczba('ODSTEP_PROSBY_DNI')) === w.oczekiwane)],
    ['test oczekujący tests/akceptacja/domena/prosba-o-ocene.test.ts czyta te wektory', () => /P-150/.test(czytaj('tests/akceptacja/domena/prosba-o-ocene.test.ts')) && czytaj('tests/akceptacja/domena/prosba-o-ocene.test.ts').includes('wektory-prosby-o-ocene.json')],
  ],
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
console.log(`kontrola fix-5: ${razem - zle}/${razem}`);
process.exit(zle ? 1 : 0);
