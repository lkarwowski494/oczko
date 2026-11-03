// ADR-0005 „Nagrobki” (uzupełnienie 2026-10-25; M1-audytor-generalny-005, 05-architekt-502): nagrobek z iCloud nie kasuje kaskadą
// niewysłanych zmian ze skrzynki `zmiana_icloud`; projekt (albo inny szczyt) wraca do „Ostatnio usuniętych”, wiersze znów do wysłania.
// Działa w transakcji partii (`zastosujPartie`, `wejscie = 1`, więc wyzwalacze milczą i skrzynkę uzupełnia ten moduł). Klucze SQL tabel
// kontraktu (`wyrazenieKlucza`, `warunekKlucza`) mieszkają tu, żeby icloud.ts nie importował się w kółko (granice: CYKL).
import { TABELE_ICLOUD, tabelaIcloud, type TabelaIcloud } from '../../domena/icloud/kontrakt';
import { wartosciKlucza } from '../../domena/icloud/odwzorowanie';
import type { PortBazy } from '../../domena/porty';
import { liczba, tekst, wiersze } from './wiersze';

export const wyrazenieKlucza = (t: TabelaIcloud): string => (t.klucz.length === 1 ? t.klucz[0] : `json_array(${t.klucz.join(', ')})`);
export const warunekKlucza = (t: TabelaIcloud): string => t.klucz.map((k) => `${k} = ?`).join(' AND ');

export type Zbior = Map<string, Set<string>>; // tabela → klucze w postaci skrzynki (klucz złożony = json_array)
const dodaj = (z: Zbior, tabela: string, klucz: string): boolean => {
  const s = z.get(tabela) ?? new Set<string>();
  z.set(tabela, s);
  if (s.has(klucz)) return false;
  s.add(klucz);
  return true;
};
export const ma = (z: Zbior, tabela: string, klucz: string): boolean => z.get(tabela)?.has(klucz) === true;
type Szczyt = { t: TabelaIcloud; klucz: string };
/**
 * Tabele, których wiersz znika tylko kaskadą z rodzicem, nigdy sam (zdarzenia licznika są tylko dopisywane, ADR-0005 opcja A): nagrobek takiego
 * wiersza oznacza nagrobek rodzica w tej albo innej partii (CloudKit dzieli zmiany na partie; 05-architekt-511, M1-audytor-generalny-116).
 */
const TYLKO_Z_RODZICEM: ReadonlySet<string> = new Set(['zdarzenie']);
type KluczObcy = { rodzic: string; kolumna: string; kaskada: boolean };

/** Klucze obce tabeli do rodzica z kontraktu; bez SET NULL (usunięcie rodzica nie usuwa wtedy dziecka, np. `kopia_z`, `para_z`). */
async function kluczeObce(tx: PortBazy, tabela: string, pamiec: Map<string, KluczObcy[]>): Promise<KluczObcy[]> {
  const byly = pamiec.get(tabela);
  if (byly) return byly;
  const out: KluczObcy[] = [];
  for (const fk of await wiersze(tx.all(`SELECT "table" AS t, "from" AS z, "to" AS d, on_delete AS u FROM pragma_foreign_key_list('${tabela}')`), 'fk')) {
    const r = tabelaIcloud(tekst(fk, 't'));
    const u = tekst(fk, 'u');
    if (r && r.klucz.length === 1 && r.klucz[0] === fk.d && u !== 'SET NULL' && u !== 'SET DEFAULT') out.push({ rodzic: r.tabela, kolumna: tekst(fk, 'z'), kaskada: u === 'CASCADE' });
  }
  pamiec.set(tabela, out);
  return out;
}
/** Wartości `wynik` wierszy tabeli `t`, których `kolumna` jest w `klucze` (jedno zapytanie na tabelę i poziom, nie na wiersz). */
async function wartosciPo(tx: PortBazy, t: TabelaIcloud, wynik: string, kolumna: string, klucze: ReadonlySet<string>): Promise<string[]> {
  return (await wiersze(tx.all(`SELECT DISTINCT ${wynik} AS v FROM ${t.tabela} WHERE ${kolumna} IN (SELECT value FROM json_each(?)) AND ${wynik} IS NOT NULL`,
    [JSON.stringify([...klucze])]), 'nagrobki')).map((r) => tekst(r, 'v'));
}

/** Czy rodzic (kaskada) wiersza `klucz` tabeli z TYLKO_Z_RODZICEM jest przodkiem wiersza z niewysłaną zmianą. */
async function rodzicPrzodkiem(tx: PortBazy, t: TabelaIcloud, klucz: string, przodkowie: Zbior, fk: Map<string, KluczObcy[]>): Promise<boolean> {
  for (const k of await kluczeObce(tx, t.tabela, fk)) {
    if (k.kaskada) for (const v of await wartosciPo(tx, t, k.kolumna, wyrazenieKlucza(t), new Set([klucz]))) if (ma(przodkowie, k.rodzic, v)) return true;
  }
  return false;
}

/**
 * Nagrobki partii, które skasowałyby (wprost albo kaskadą) wiersz z niewysłaną zmianą. Zatrzymany jest nagrobek samego wiersza i jego przodków
 * (CASCADE i RESTRICT) oraz nagrobki całego poddrzewa tego przodka (kaskada): historia licznika zostaje cała, bo `scal` bez rodzica
 * zdarzenia czeka. Nagrobek zdarzenia, którego licznik jest takim przodkiem, też — także gdy nagrobek licznika przyszedł w innej partii
 * (M1-audytor-generalny-116). Szczyty = zatrzymane bez zatrzymanego rodzica; trafiają do kosza (`odtworzWKoszu`).
 */
export async function zatrzymaneNagrobki(tx: PortBazy, usuniete: readonly { encja: string; klucz: string }[]): Promise<{ zatrzymane: Zbior; szczyty: Szczyt[] }> {
  const nagrobki: Zbior = new Map();
  for (const u of usuniete) if (tabelaIcloud(u.encja)) dodaj(nagrobki, u.encja, u.klucz);
  if (!nagrobki.size) return { zatrzymane: new Map(), szczyty: [] };
  const fk = new Map<string, KluczObcy[]>();
  let fala: Zbior = new Map();
  const przodkowie: Zbior = new Map(); // wiersze z niewysłaną zmianą i ich przodkowie
  for (const z of await wiersze(tx.all('SELECT encja, klucz FROM zmiana_icloud WHERE usuniete = 0'), 'nagrobki')) {
    // Przegląd ścieżki wrażliwej M2 p2 (P1): sam wiersz z niewysłaną zmianą (np. projekt przywrócony z kosza offline) też zatrzymuje swój nagrobek.
    dodaj(fala, tekst(z, 'encja'), tekst(z, 'klucz'));
    dodaj(przodkowie, tekst(z, 'encja'), tekst(z, 'klucz'));
  }
  while (fala.size) { // w górę od wierszy z niewysłaną zmianą
    const nastepna: Zbior = new Map();
    for (const [tabela, klucze] of fala) {
      const t = tabelaIcloud(tabela);
      if (t) for (const k of await kluczeObce(tx, tabela, fk)) for (const v of await wartosciPo(tx, t, k.kolumna, wyrazenieKlucza(t), klucze)) if (dodaj(przodkowie, k.rodzic, v)) dodaj(nastepna, k.rodzic, v);
    }
    fala = nastepna;
  }
  const bazowe: Szczyt[] = [];
  const poddrzewo: Zbior = new Map();
  for (const [tabela, klucze] of nagrobki) {
    const t = tabelaIcloud(tabela);
    if (t) for (const k of klucze) {
      if (ma(przodkowie, tabela, k) || (TYLKO_Z_RODZICEM.has(tabela) && await rodzicPrzodkiem(tx, t, k, przodkowie, fk))) { bazowe.push({ t, klucz: k }); dodaj(poddrzewo, tabela, k); }
    }
  }
  if (!bazowe.length) return { zatrzymane: new Map(), szczyty: [] };
  fala = new Map([...poddrzewo].map(([t, s]) => [t, new Set(s)]));
  while (fala.size) { // w dół (kaskada) od zatrzymanych przodków
    const nastepna: Zbior = new Map();
    for (const [rodzic, klucze] of fala) for (const c of TABELE_ICLOUD) for (const k of await kluczeObce(tx, c.tabela, fk)) {
      if (k.kaskada && k.rodzic === rodzic) for (const v of await wartosciPo(tx, c, wyrazenieKlucza(c), k.kolumna, klucze)) if (dodaj(poddrzewo, c.tabela, v)) dodaj(nastepna, c.tabela, v);
    }
    fala = nastepna;
  }
  const zatrzymane: Zbior = new Map();
  for (const [tabela, klucze] of nagrobki) for (const k of klucze) if (ma(poddrzewo, tabela, k)) dodaj(zatrzymane, tabela, k);
  const szczyty: Szczyt[] = [];
  for (const b of bazowe) {
    let podZatrzymanym = false;
    for (const k of await kluczeObce(tx, b.t.tabela, fk)) if (k.kaskada) for (const v of await wartosciPo(tx, b.t, k.kolumna, wyrazenieKlucza(b.t), new Set([b.klucz]))) podZatrzymanym ||= ma(zatrzymane, k.rodzic, v);
    if (!podZatrzymanym) szczyty.push(b);
  }
  return { zatrzymane, szczyty };
}

/** Szczyt do kosza od teraz (sprzątanie po KOSZ_DNI; tabela bez kosza: zostaje jak był), zatrzymane wiersze znów do wysłania (serwer je usunął). */
export async function odtworzWKoszu(tx: PortBazy, zatrzymane: Zbior, szczyty: readonly Szczyt[], terazMs: number): Promise<void> {
  for (const s of szczyty) {
    const k = wartosciKlucza(s.t, s.klucz);
    const [kol] = await wiersze(tx.all("SELECT count(*) AS n FROM pragma_table_info(?) WHERE name IN ('usunieto_ms', 'zmieniono_ms')", [s.t.tabela]), 'nagrobki');
    if (k.ok && kol && liczba(kol, 'n') === 2) {
      await tx.run(`UPDATE ${s.t.tabela} SET usunieto_ms = ?, zmieniono_ms = max(zmieniono_ms, ?) WHERE ${warunekKlucza(s.t)}`, [terazMs, terazMs, ...k.wartosc]);
    }
  }
  await tx.run('UPDATE synchronizacja SET nr_zmiany = nr_zmiany + 1 WHERE id = 1');
  for (const [encja, klucze] of zatrzymane) for (const klucz of klucze) {
    await tx.run(`INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) VALUES (?, ?, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1))
      ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = 0, nr = excluded.nr`, [encja, klucz]);
  }
}
