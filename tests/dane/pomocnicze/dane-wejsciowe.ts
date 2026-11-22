// Dane wejściowe testów warstwy danych: instrukcje SQL (wolno tylko w testach), bazy wzorcowe z docs/architektura/schemat.sql
// zbudowane przez node:sqlite (niezależnie od kodu aplikacji) i archiwa `.oczko` z własnym zapisem ZIP (format PKWARE APPNOTE, metoda 0).
import { DatabaseSync } from 'node:sqlite';
import { inflateRawSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { T0, sha256 } from './srodowisko';

export const KORZEN = join(__dirname, '../../..');
export const SCHEMAT_V1 = readFileSync(join(KORZEN, 'docs/architektura/schemat.sql'), 'utf8');
export const STANY_JSON: Record<string, string[]> = JSON.parse(readFileSync(join(KORZEN, 'docs/architektura/stany.json'), 'utf8'));

export type Instr = [string, unknown[]];
// ukonczono_dzien (fix-3 05, 08 partia 3): dzień lokalny Europe/Warsaw chwili ukończenia, jak `dzien` zdarzenia niżej.
const dzienWaw = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
const P = (id: string, nazwa: string, t = T0, ext: { stan?: string; ukonczono?: number | null; usunieto?: number | null; ostatnia?: number; notatka?: string } = {}): Instr => [
  'INSERT INTO projekt (id, nazwa, stan, notatka, utworzono_ms, zmieniono_ms, ostatnia_praca_ms, ukonczono_ms, ukonczono_dzien, usunieto_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [id, nazwa, ext.stan ?? 'w_toku', ext.notatka ?? '', t, t, ext.ostatnia ?? t, ext.ukonczono ?? null, ext.ukonczono == null ? null : dzienWaw(ext.ukonczono), ext.usunieto ?? null],
];
export const projekt = P;
export const czesc = (id: string, projektId: string, nazwa: string, kolejnosc = 1, ext: { cel?: number | null; paraZ?: string | null; usunieto?: number | null } = {}): Instr => [
  'INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, cel_rzedow, para_z, zmieniono_ms, usunieto_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  [id, projektId, nazwa, kolejnosc, ext.cel ?? null, ext.paraZ ?? null, T0, ext.usunieto ?? null],
];
/**
 * Licznik z liniową historią `n` zdarzeń `plus` (id `${prefiks}1..n`, rodzic = poprzednie), wartość i głowa spójne (ADR-0005).
 * `od`: wspólny początek z innym urządzeniem (te same id). Zdarzenia co minutę od `t`.
 */
export function licznik(id: string, czescId: string, n: number, o: { prefiks?: string; rodzaj?: string; zablokowany?: 0 | 1; t?: number; strefa?: string; urzadzenie?: string; kolejnosc?: number; usunieto?: number | null } = {}): Instr[] {
  const pr = o.prefiks ?? `${id}-z`, t = o.t ?? T0, strefa = o.strefa ?? 'Europe/Warsaw';
  const w: Instr[] = [[
    'INSERT INTO licznik (id, czesc_id, rodzaj, zablokowany, wartosc, glowa, kolejnosc, zmieniono_ms, usunieto_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, czescId, o.rodzaj ?? 'rzedy', o.zablokowany ?? 0, n, n ? `${pr}${n}` : null, o.kolejnosc ?? 1, t, o.usunieto ?? null],
  ]];
  for (let i = 1; i <= n; i++) w.push(zdarzenie(`${pr}${i}`, id, 'plus', i, i > 1 ? [`${pr}${i - 1}`] : [], t + (i - 1) * 60_000, { strefa, urzadzenie: o.urzadzenie }));
  return w;
}
export function zdarzenie(id: string, licznikId: string, rodzaj: string, wartoscPo: number, rodzice: string[], czasMs: number, o: { wartosc?: number | null; cofa?: string[]; strefa?: string; dzien?: string; urzadzenie?: string; zrodlo?: string } = {}): Instr {
  const strefa = o.strefa ?? 'Europe/Warsaw';
  const dzien = o.dzien ?? new Intl.DateTimeFormat('en-CA', { timeZone: strefa, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(czasMs));
  return [
    'INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc, wartosc_po, rodzice, cofa, zrodlo, urzadzenie, czas_ms, strefa, dzien) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, licznikId, rodzaj, o.wartosc ?? null, wartoscPo, JSON.stringify(rodzice), JSON.stringify(o.cofa ?? []), o.zrodlo ?? 'aplikacja', o.urzadzenie ?? 'iphone-test', czasMs, strefa, dzien],
  ];
}
export const ustawGlowe = (licznikId: string, wartosc: number, glowa: string): Instr => ['UPDATE licznik SET wartosc = ?, glowa = ? WHERE id = ?', [wartosc, glowa, licznikId]];
export const plik = (h: string, rozszerzenie: string, bajty: number): Instr => ['INSERT INTO plik (sha256, rozszerzenie, bajty, utworzono_ms) VALUES (?, ?, ?, ?)', [h, rozszerzenie, bajty, T0]];
export const wzor = (id: string, projektId: string, pdf: string, znacznik = '{}'): Instr => [
  "INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, znacznik, zmieniono_ms) VALUES (?, ?, 'Wzór', 'pdf', ?, ?, ?)", [id, projektId, pdf, znacznik, T0]];
export const rysunek = (wzorId: string, strona: number, h: string): Instr => ['INSERT INTO rysunek (wzor_id, strona, plik_sha256, zmieniono_ms) VALUES (?, ?, ?, ?)', [wzorId, strona, h, T0]];
export const zdjecie = (id: string, projektId: string, h: string): Instr => ['INSERT INTO zdjecie (id, projekt_id, wloczka_id, plik_sha256, utworzono_ms) VALUES (?, ?, NULL, ?, ?)', [id, projektId, h, T0]];
export const wloczka = (id: string, nazwa: string, motki = 3): Instr => ['INSERT INTO wloczka (id, nazwa, motki, zmieniono_ms) VALUES (?, ?, ?, ?)', [id, nazwa, motki, T0]];
export const projektWloczka = (p: string, w: string): Instr => ['INSERT INTO projekt_wloczka (projekt_id, wloczka_id, zuzyto_motki, zmieniono_ms) VALUES (?, ?, NULL, ?)', [p, w, T0]];
export const notatkaRzedu = (id: string, licznikId: string, rzad: number, tekst: string): Instr => ['INSERT INTO notatka_rzedu (id, licznik_id, rzad, tekst, zmieniono_ms) VALUES (?, ?, ?, ?, ?)', [id, licznikId, rzad, tekst, T0]];
export const przypomnienie = (id: string, licznikId: string): Instr => ["INSERT INTO przypomnienie (id, licznik_id, od_rzedu, co_n, razy, tekst, zmieniono_ms) VALUES (?, ?, 6, 6, 5, 'ujmowanie', ?)", [id, licznikId, T0]];
export const dzienLimitu = (dzien: string, zdarzenieId = 'z-dzien', pro = 0): Instr => ['INSERT INTO dzien_limitu (dzien, pro, zaczeto_ms, zdarzenie_id) VALUES (?, ?, ?, ?)', [dzien, pro, T0, zdarzenieId]];
export const sesja = (id: string, projektId: string, startMs: number, stan = 'trwa'): Instr => [
  "INSERT INTO sesja (id, projekt_id, stan, start_ms, strefa, dzien) VALUES (?, ?, ?, ?, 'Europe/Warsaw', ?)", [id, projektId, stan, startMs, new Date(startMs).toISOString().slice(0, 10)]];

/** „Życie” użytkownika: 12 projektów z historią liczników, notatką, zapasem, wzorem z plikiem, rysunkiem i zdjęciem (BR-DAN-003/S1, BR-DAN-005/S1). */
export function zycie(pliki: { pdf: string; rys: string; jpg: string }): Instr[] {
  const w: Instr[] = [plik(pliki.pdf, 'pdf', 11), plik(pliki.rys, 'pkdrawing', 9), plik(pliki.jpg, 'jpg', 10)];
  for (let i = 1; i <= 12; i++) {
    w.push(P(`p${i}`, `Projekt ${i}`, T0, { notatka: i === 1 ? 'ujmowanie co 4 rzędy' : '' }), czesc(`c${i}`, `p${i}`, 'Przód'), ...licznik(`l${i}`, `c${i}`, i + 2));
  }
  w.push(notatkaRzedu('n1', 'l1', 2, 'warkocz'), przypomnienie('r1', 'l1'), wzor('w1', 'p1', pliki.pdf), rysunek('w1', 0, pliki.rys), zdjecie('f1', 'p1', pliki.jpg));
  w.push(wloczka('y1', 'Merino'), wloczka('y2', 'Alpaka', 2), projektWloczka('p1', 'y1'), dzienLimitu('2026-10-22', 'l1-z1'));
  return w;
}

/** Baza wzorcowa na node:sqlite: schemat.sql v1 (dokument roli 05) + instrukcje; `userVersion` nadpisuje PRAGMA user_version. */
export function bazaWzorcowa(sciezka: string, instrukcje: Instr[], o: { userVersion?: number; dodatkowySql?: string } = {}): void {
  const db = new DatabaseSync(sciezka);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('BEGIN');
  db.exec(SCHEMAT_V1);
  if (o.dodatkowySql) db.exec(o.dodatkowySql);
  for (const [sql, p] of instrukcje) db.prepare(sql).run(...(p as never[]));
  db.exec('COMMIT');
  db.exec(`PRAGMA user_version = ${o.userVersion ?? 1}`);
  db.close();
}
/** Odczyt pliku bazy osobnym połączeniem node:sqlite (wyrocznia niezależna od adaptera aplikacji). */
export function czytajBaze<T = Record<string, unknown>>(sciezka: string, sql: string): T[] {
  const db = new DatabaseSync(sciezka, { readOnly: true });
  try { return db.prepare(sql).all() as T[]; } finally { db.close(); }
}
export function licznosciPliku(sciezka: string): Record<string, number> {
  const w: Record<string, number> = {};
  for (const { name } of czytajBaze<{ name: string }>(sciezka, "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'"))
    w[name] = czytajBaze<{ n: number }>(sciezka, `SELECT count(*) n FROM ${name}`)[0].n;
  return w;
}

// --- ZIP (APPNOTE 6.3.x): zapis metodą 0 (stored), odczyt metod 0 i 8 (deflate). CRC-32 z własnej tablicy. ---
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function zapiszZip(sciezka: string, wpisy: { nazwa: string; dane: Buffer }[]): void {
  const lokalne: Buffer[] = [], centralne: Buffer[] = [];
  let off = 0;
  for (const { nazwa, dane } of wpisy) {
    const n = Buffer.from(nazwa, 'utf8'), crc = crc32(dane);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0); l.writeUInt16LE(20, 4); l.writeUInt16LE(0x0800, 6); l.writeUInt16LE(0, 8); l.writeUInt16LE(0, 10); l.writeUInt16LE(0x21, 12);
    l.writeUInt32LE(crc, 14); l.writeUInt32LE(dane.length, 18); l.writeUInt32LE(dane.length, 22); l.writeUInt16LE(n.length, 26); l.writeUInt16LE(0, 28);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(0, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(0x21, 14);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(dane.length, 20); c.writeUInt32LE(dane.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(off, 42);
    lokalne.push(l, n, dane); centralne.push(c, n);
    off += 30 + n.length + dane.length;
  }
  const cd = Buffer.concat(centralne), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(wpisy.length, 8); e.writeUInt16LE(wpisy.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  writeFileSync(sciezka, Buffer.concat([...lokalne, cd, e]));
}
export function czytajZip(sciezka: string): Map<string, Buffer> {
  const b = readFileSync(sciezka), w = new Map<string, Buffer>();
  let e = b.length - 22;
  while (e >= 0 && b.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error(`${sciezka}: to nie jest ZIP (brak EOCD)`);
  let p = b.readUInt32LE(e + 16);
  for (let i = 0; i < b.readUInt16LE(e + 10); i++) {
    const metoda = b.readUInt16LE(p + 10), rozm = b.readUInt32LE(p + 20), nl = b.readUInt16LE(p + 28), el = b.readUInt16LE(p + 30), kl = b.readUInt16LE(p + 32), lok = b.readUInt32LE(p + 42);
    const nazwa = b.subarray(p + 46, p + 46 + nl).toString('utf8');
    const start = lok + 30 + b.readUInt16LE(lok + 26) + b.readUInt16LE(lok + 28), surowe = b.subarray(start, start + rozm);
    w.set(nazwa, metoda === 0 ? Buffer.from(surowe) : metoda === 8 ? inflateRawSync(surowe) : Buffer.alloc(0));
    p += 46 + nl + el + kl;
  }
  return w;
}

/** Archiwum `.oczko` (dane.md „Kopie i eksport”) zbudowane bez kodu aplikacji: manifest + oczko.db + pliki/<sha>.<ext>. */
export function archiwumWzorcowe(katalog: string, nazwa: string, instrukcje: Instr[], o: { wersjaSchematu?: number; pliki?: { dane: Buffer; rozszerzenie: string }[]; zepsujSha?: boolean; format?: string } = {}): string {
  const db = join(katalog, `${nazwa}.db`);
  bazaWzorcowa(db, instrukcje, { userVersion: o.wersjaSchematu ?? 1 });
  const pliki = (o.pliki ?? []).map((p) => ({ ...p, sha: sha256(p.dane) }));
  const manifest = {
    format: o.format ?? 'oczko', wersja_formatu: 1, wersja_schematu: o.wersjaSchematu ?? 1, aplikacja: '1.0.0 (test)', utworzono: T0,
    licznosci: licznosciPliku(db), pliki: pliki.map((p) => ({ sha256: o.zepsujSha ? 'f'.repeat(64) : p.sha, bajty: p.dane.length })),
  };
  const cel = join(katalog, `${nazwa}.oczko`);
  zapiszZip(cel, [
    { nazwa: 'manifest.json', dane: Buffer.from(JSON.stringify(manifest)) },
    { nazwa: 'oczko.db', dane: readFileSync(db) },
    ...pliki.map((p) => ({ nazwa: `pliki/${p.sha}.${p.rozszerzenie}`, dane: p.dane })),
  ]);
  return cel;
}
