// Środowisko testów akceptacyjnych warstwy danych (rola 07, E3): katalog tymczasowy, baza przez utworzPortNode + migruj aplikacji,
// atrapy portów (Zegar, Identyfikatory, MagazynPlikow, DziennikPlus, CzasWTle). Atrapy są kodem testu, nie aplikacji.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CzasWTle, DziennikPlus, Identyfikatory, MagazynPlikow, PortBazy, Zegar, ZdarzenieWejsciowe } from '../../../src/domena/porty';
import { utworzArchiwum } from '../../../src/dane/archiwum';
import { utworzPortNode, type PortNode } from '../../../src/dane/baza/adapter-node';
import { migruj } from '../../../src/dane/migracje/migruj';
import type { Zaleznosci, ZaleznosciPlikow } from '../../../src/przypadki-uzycia/zaleznosci';

export const MIN = 60_000;
export const GODZ = 3_600_000;
export const DOBA = 86_400_000;
export const T0 = Date.UTC(2026, 9, 22, 10); // 2026-10-22 12:00 Europe/Warsaw (jak sprawdz-schemat.mjs)

export const sha256 = (dane: Buffer | string) => createHash('sha256').update(dane).digest('hex');
export const sha256Pliku = (sciezka: string) => sha256(readFileSync(sciezka));

/** Data lokalna RRRR-MM-DD w strefie (RD-16), liczona przez Intl — inne narzędzie niż kod aplikacji. */
export function dzienLokalny(ms: number, strefa: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: strefa, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}

export type ZegarTestowy = Zegar & { ustaw(ms: number, strefa?: string, dzien?: string): void; przesun(ms: number): void };
export function zegarTestowy(ms = T0, strefa = 'Europe/Warsaw', dzien?: string): ZegarTestowy {
  let s = { ms, strefa, dzien: dzien ?? dzienLokalny(ms, strefa) };
  return {
    teraz: () => ({ ...s }),
    ustaw(m, st = s.strefa, d) { s = { ms: m, strefa: st, dzien: d ?? dzienLokalny(m, st) }; },
    przesun(d) { s = { ...s, ms: s.ms + d, dzien: dzienLokalny(s.ms + d, s.strefa) }; },
  };
}

export function identyfikatory(prefiks = '0'): Identyfikatory {
  let n = 0;
  return { nowy: () => `${prefiks.repeat(8)}-0000-4000-8000-${String(++n).padStart(12, '0')}` };
}

export type MagazynTestowy = MagazynPlikow & { katalog: string; usuniete: string[]; wolne: number };
/** Atrapa magazynu plików po SHA-256 (ADR-0001) z szpiegiem `usun` i ustawianym wolnym miejscem. */
export function magazynTestowy(katalog: string): MagazynTestowy {
  mkdirSync(katalog, { recursive: true });
  const m: MagazynTestowy = {
    katalog,
    usuniete: [],
    wolne: 1e12,
    async zapisz(zrodlo, rozszerzenie) {
      const bajty = readFileSync(zrodlo);
      const h = sha256(bajty);
      writeFileSync(join(katalog, `${h}.${rozszerzenie}`), bajty);
      return { ok: true, wartosc: { sha256: h, bajty: bajty.length } };
    },
    sciezka(h) {
      const n = readdirSync(katalog).find((x) => x.startsWith(h));
      return join(katalog, n ?? h);
    },
    async usun(h) {
      m.usuniete.push(h);
      for (const n of readdirSync(katalog)) if (n.startsWith(h)) rmSync(join(katalog, n));
    },
    async wolneMiejsce() { return m.wolne; },
  };
  return m;
}
/** Wkłada plik do magazynu bez kodu aplikacji (dane wejściowe testu); zwraca sha256. */
export function wlozPlik(m: MagazynTestowy, tresc: Buffer | string, rozszerzenie: string): string {
  const h = sha256(tresc);
  writeFileSync(join(m.katalog, `${h}.${rozszerzenie}`), tresc);
  return h;
}

export type DziennikTestowy = DziennikPlus & { linie: ZdarzenieWejsciowe[]; skrocono: string[] };
export function dziennikTestowy(linie: ZdarzenieWejsciowe[] = []): DziennikTestowy {
  const d: DziennikTestowy = {
    linie: [...linie],
    skrocono: [],
    async odczytaj() { return [...d.linie]; },
    async skroc(doId) {
      d.skrocono.push(doId);
      const i = d.linie.findIndex((l) => l.id === doId);
      if (i >= 0) d.linie = d.linie.slice(i + 1);
    },
  };
  return d;
}
export const czasWTle: CzasWTle = { chron: (_n, fn) => fn({ wygaslo: () => false }) }; // sygnał wygaśnięcia: fix-3 05 (ADR-0002 (7)), 08 partia 3

export function katalogTymczasowy(nazwa = 'oczko-dane-'): string {
  return mkdtempSync(join(tmpdir(), nazwa));
}

export type Srodowisko = {
  katalog: string;
  baza: PortNode;
  zegar: ZegarTestowy;
  magazyn: MagazynTestowy;
  dziennik: DziennikTestowy;
  pro: { wartosc: boolean };
  z: ZaleznosciPlikow & { dziennik: DziennikTestowy };
};
/** Baza aplikacji na pliku w katalogu tymczasowym: utworzPortNode → migruj (migracje aplikacji, nie schemat.sql). */
export async function przygotuj(o: { katalog?: string; zegar?: ZegarTestowy; urzadzenie?: string; prefiksId?: string; trybDeweloperski?: boolean } = {}): Promise<Srodowisko> {
  const katalog = o.katalog ?? katalogTymczasowy();
  const baza = utworzPortNode(join(katalog, 'oczko.db'), { trybDeweloperski: o.trybDeweloperski });
  const m = await migruj(baza);
  if (!m.ok) throw new Error(`migruj: ${m.powod}`);
  const zegar = o.zegar ?? zegarTestowy();
  const magazyn = magazynTestowy(join(katalog, 'pliki'));
  const dziennik = dziennikTestowy();
  const pro = { wartosc: false };
  const katalogi = { kopie: join(katalog, 'kopie'), kopiePrzed: join(katalog, 'Documents', 'Backup'), tymczasowy: join(katalog, 'tmp') };
  mkdirSync(katalogi.kopie, { recursive: true });
  mkdirSync(katalogi.kopiePrzed, { recursive: true });
  mkdirSync(katalogi.tymczasowy, { recursive: true });
  const z = { baza, zegar, id: identyfikatory(o.prefiksId), urzadzenie: o.urzadzenie ?? 'iphone-test', pro: () => pro.wartosc, magazyn, katalogi, dziennik };
  return { katalog, baza, zegar, magazyn, dziennik, pro, z };
}
export const zaleznosci = (s: Srodowisko): Zaleznosci => s.z;
/** Zależności z prawdziwym archiwum i czasem w tle (przypadki użycia, które zapisują kopię: import, eksport, „Delete all data”). */
export function zArchiwum<Z extends ZaleznosciPlikow & { dziennik: DziennikTestowy }>(z: Z) {
  const archiwum = utworzArchiwum({ baza: z.baza, magazyn: z.magazyn, zegar: z.zegar, katalogi: z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  return { ...z, archiwum, czasWTle };
}

/** Wykonuje listę instrukcji danych wejściowych przez port (SQL tylko w testach). */
export async function wykonaj(baza: PortBazy, instrukcje: [string, unknown[]][]): Promise<void> {
  for (const [sql, p] of instrukcje) await baza.run(sql, p);
}
export async function jeden<T>(baza: PortBazy, sql: string, p: unknown[] = []): Promise<T> {
  const w = await baza.all<T>(sql, p);
  if (w.length !== 1) throw new Error(`oczekiwano 1 wiersza, jest ${w.length}: ${sql}`);
  return w[0];
}
export async function ile(baza: PortBazy, tabela: string, gdzie = '1', p: unknown[] = []): Promise<number> {
  return (await jeden<{ n: number }>(baza, `SELECT count(*) AS n FROM ${tabela} WHERE ${gdzie}`, p)).n;
}
/** Tabele użytkownika z sqlite_schema bazy (bez sqlite_*). */
export async function tabele(baza: PortBazy): Promise<string[]> {
  return (await baza.all<{ name: string }>("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).map((r) => r.name);
}
export async function licznosci(baza: PortBazy): Promise<Record<string, number>> {
  const w: Record<string, number> = {};
  for (const t of await tabele(baza)) w[t] = await ile(baza, t);
  return w;
}
/** Pełna migawka danych: każdy wiersz każdej tabeli, posortowany — „baza bez zmian” mocniej niż liczności. */
export async function migawka(baza: PortBazy, pomin: string[] = []): Promise<string> {
  const w: Record<string, unknown[]> = {};
  for (const t of await tabele(baza)) {
    if (pomin.includes(t)) continue;
    const wiersze = await baza.all<Record<string, unknown>>(`SELECT * FROM ${t}`);
    w[t] = wiersze.map((r) => JSON.stringify(r)).sort();
  }
  return JSON.stringify(w);
}
export const istnieje = existsSync;
