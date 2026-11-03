// Synchronizacja iCloud po stronie bazy (moduly.md „Kontrakt partii 7”, ADR-0005 uzupełnienie fix-7, P-221 Q5a): stan w `synchronizacja`,
// skrzynka `zmiana_icloud` (wypełniają wyzwalacze L1), odbiór partii z `wejscie = 1` (zapis z iCloud nie wraca do skrzynki), poczekalnia.
// Wszystkie funkcje działają w transakcji wołającego (kolejka ADR-0002); zasoby plików kopiuje przypadek użycia przed transakcją.
import { TABELE_ICLOUD, tabelaIcloud } from '../../domena/icloud/kontrakt';
import { nazwaRekordu, rekordZJson, rekordZWiersza, wartosciKlucza, wierszZRekordu, type Wiersz as WierszIcloud } from '../../domena/icloud/odwzorowanie';
import type { PartiaIcloud, PortBazy, PotwierdzenieIcloud, RekordIcloud, ZmianaDoWyslania } from '../../domena/porty';
import { STANY } from '../../domena/stany';
import { zapiszBladW } from './bledy';
import { ma, odtworzWKoszu, warunekKlucza, wyrazenieKlucza, zatrzymaneNagrobki } from './icloud-nagrobki';
import { zapiszDzienLimitu } from './liczniki';
import { przeliczLicznik } from './przelicz';
import { liczba, liczbaLubNull, tekst, wiersze, type Wiersz } from './wiersze';

export type StanBazyIcloud = { wlaczona: boolean; stanSilnika: Uint8Array | null; zalegle: number };
export type WynikPartii = { zastosowane: number; poczekalnia: number; bledy: number; konflikty: number; liczniki: string[] };

export async function stanBazy(baza: PortBazy): Promise<StanBazyIcloud> {
  const [s] = await wiersze(baza.all('SELECT wlaczona, stan_silnika, (SELECT count(*) FROM zmiana_icloud) AS zalegle FROM synchronizacja WHERE id = 1'), 'stanBazy');
  if (!s) return { wlaczona: false, stanSilnika: null, zalegle: 0 };
  const st = s.stan_silnika;
  return { wlaczona: liczba(s, 'wlaczona') === 1, stanSilnika: st instanceof Uint8Array ? st : null, zalegle: liczba(s, 'zalegle') };
}

/** Włączenie (albo `polacz` po zmianie konta): wlaczona = 1 i pełne wpisanie do skrzynki jednym numerem zmiany; `zerujSilnik` dla innego konta. */
export async function wlaczWBazie(tx: PortBazy, terazMs: number, zerujSilnik: boolean): Promise<void> {
  await tx.run(`UPDATE synchronizacja SET wlaczona = 1, wejscie = 0, nr_zmiany = nr_zmiany + 1, zmieniono_ms = ?${zerujSilnik ? ', stan_silnika = NULL' : ''} WHERE id = 1`, [terazMs]);
  for (const t of TABELE_ICLOUD) {
    const tylko = t.tylkoKlucze ? `${t.klucz[0]} IN (${t.tylkoKlucze.map(() => '?').join(', ')})` : 'true';
    await tx.run(
      `INSERT INTO zmiana_icloud (encja, klucz, usuniete, nr) SELECT '${t.tabela}', ${wyrazenieKlucza(t)}, 0, (SELECT nr_zmiany FROM synchronizacja WHERE id = 1) FROM ${t.tabela}
       WHERE ${tylko} ON CONFLICT (encja, klucz) DO UPDATE SET usuniete = 0, nr = excluded.nr`, t.tylkoKlucze ? [...t.tylkoKlucze] : []);
  }
}
/** Wyłączenie: dane lokalne zostają (BR-DAN-002), skrzynka pusta; stan silnika zostaje (ponowne włączenie i tak wpisuje wszystko). */
export async function wylaczWBazie(tx: PortBazy, terazMs: number): Promise<void> {
  await tx.run('UPDATE synchronizacja SET wlaczona = 0, wejscie = 0, zmieniono_ms = ? WHERE id = 1', [terazMs]);
  await tx.run('DELETE FROM zmiana_icloud');
}

/** Wiersz tabeli z kontraktu: wartości tylko tekst, liczba albo null (kontrakt nie ma kolumn BLOB); inna wartość → BladDanych (P-118 Q1a). */
function polaIcloud(w: Wiersz): WierszIcloud {
  const pola: WierszIcloud = {};
  for (const k of Object.keys(w)) pola[k] = typeof w[k] === 'string' ? tekst(w, k) : liczbaLubNull(w, k);
  return pola;
}

/** Najstarsze zmiany ze skrzynki (po `nr`) z rekordem odczytanym teraz; brak wiersza = usunięcie. */
export async function zaleglosci(baza: PortBazy, limit: number, sciezkaPliku: (sha256: string) => string): Promise<ZmianaDoWyslania[]> {
  const out: ZmianaDoWyslania[] = [];
  for (const z of await wiersze(baza.all('SELECT encja, klucz, usuniete, nr FROM zmiana_icloud ORDER BY nr, encja, klucz LIMIT ?', [limit]), 'zaleglosci')) {
    const encja = tekst(z, 'encja');
    const klucz = tekst(z, 'klucz');
    const nr = liczba(z, 'nr');
    const t = tabelaIcloud(encja);
    const k = t ? wartosciKlucza(t, klucz) : null;
    if (!t || !k || !k.ok) continue; // wpis spoza kontraktu nie powstaje (wyzwalacze z kontraktu); pominięty, nie wysłany
    const [w] = liczba(z, 'usuniete') === 1 ? [] : await wiersze(baza.all(`SELECT * FROM ${t.tabela} WHERE ${warunekKlucza(t)}`, k.wartosc), 'zaleglosci');
    out.push({ encja, klucz, nr, rekord: w ? rekordZWiersza(t, polaIcloud(w), t.zasob ? sciezkaPliku(klucz) : null) : null });
  }
  return out;
}

/** Potwierdzenie wysyłki: wpis znika tylko, gdy nie zmienił się po wysłaniu (`nr <= wysłanego`); stan silnika w tej samej transakcji. */
export async function potwierdzWyslane(tx: PortBazy, p: PotwierdzenieIcloud): Promise<void> {
  for (const w of p.wyslane) await tx.run('DELETE FROM zmiana_icloud WHERE encja = ? AND klucz = ? AND nr <= ?', [w.encja, w.klucz, w.nr]);
  await tx.run('UPDATE synchronizacja SET stan_silnika = ? WHERE id = 1', [p.stanSilnika]);
}

type Wynik1 = 'zastosowany' | 'poczekalnia' | 'blad' | 'pominiety';

/** Kolumny tabeli → czy dopuszczają NULL. */
async function kolumnyTabeli(tx: PortBazy, tabela: string): Promise<Map<string, boolean>> {
  return new Map((await wiersze(tx.all(`SELECT name, "notnull" FROM pragma_table_info('${tabela}')`), 'kolumny')).map((r) => [tekst(r, 'name'), liczba(r, 'notnull') === 0]));
}
/** Rodzic z klucza obcego, którego jeszcze nie ma (sprawdzenie przed INSERT; odroczone klucze odrzuciłyby całą partię przy COMMIT). */
async function brakRodzica(tx: PortBazy, tabela: string, w: WierszIcloud): Promise<boolean> {
  for (const fk of await wiersze(tx.all(`SELECT "table" AS t, "from" AS z, "to" AS d FROM pragma_foreign_key_list('${tabela}')`), 'fk')) {
    const v = w[tekst(fk, 'z')];
    if (v === null || v === undefined) continue;
    const [jest] = await tx.all(`SELECT 1 FROM ${tekst(fk, 't')} WHERE ${tekst(fk, 'd')} = ?`, [v]);
    if (!jest) return true;
  }
  return false;
}
async function doPoczekalni(tx: PortBazy, r: RekordIcloud, powod: 'brak_rodzica' | 'brak_encji' | 'nowsza_wersja', terazMs: number): Promise<void> {
  await tx.run(
    `INSERT INTO poczekalnia (id, rodzaj_rekordu, dane, powod, zrodlo, przyszlo_ms) VALUES (?, ?, ?, ?, 'synchronizacja', ?)
     ON CONFLICT (id) DO UPDATE SET dane = excluded.dane, powod = excluded.powod, proby = proby + 1`,
    [nazwaRekordu(r.encja, r.klucz), r.encja === 'zdarzenie' ? 'zdarzenie' : 'encja', JSON.stringify(r), powod, terazMs]);
}

const RODZAJE_ZDARZEN: ReadonlySet<string> = new Set(STANY['zdarzenie.rodzaj']);
/**
 * Rekord nowszej wersji aplikacji (dane.md:125, M-15): zdarzenie o rodzaju spoza `stany.json` albo encja spoza kontraktu, która nie jest
 * tabelą tego urządzenia (nowa tabela nowszego schematu) → poczekalnia `nowsza_wersja` zamiast odrzucenia; „Data and sync” pokazuje
 * `icloud.niepelna_nowsza`. Encja o nazwie tabeli lokalnej (np. `poczekalnia`) to błąd danych, jak dotąd.
 */
async function zNowszejWersji(tx: PortBazy, r: RekordIcloud): Promise<boolean> {
  if (!tabelaIcloud(r.encja)) {
    if (!/^[a-z][a-z0-9_]*$/.test(r.encja)) return false;
    return (await tx.all("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ?", [r.encja])).length === 0;
  }
  const rodzaj = r.encja === 'zdarzenie' ? r.pola.rodzaj : undefined;
  return typeof rodzaj === 'string' && !RODZAJE_ZDARZEN.has(rodzaj);
}

/** Jeden rekord: sprawdzenie, rodzic, zapis według sposobu scalenia; błąd SQL tylko tego rekordu (SAVEPOINT) → `blad`, partia idzie dalej. */
async function zastosujRekord(tx: PortBazy, r: RekordIcloud, terazMs: number, liczniki: Set<string>, pliki: ReadonlySet<string>): Promise<Wynik1> {
  if (await zNowszejWersji(tx, r)) { await doPoczekalni(tx, r, 'nowsza_wersja', terazMs); return 'poczekalnia'; }
  const w = wierszZRekordu(r);
  if (!w.ok) { await zapiszBladW(tx, { czasMs: terazMs, kod: 'icloud_bledny_rekord', szczegoly: { encja: tabelaIcloud(r.encja) ? r.encja : '?' } }); return 'blad'; }
  const { tabela: t } = w.wartosc;
  if (t.zasob && !pliki.has(r.klucz)) { await doPoczekalni(tx, r, 'brak_encji', terazMs); return 'poczekalnia'; } // zasób jeszcze niepobrany albo zły SHA
  const kol = await kolumnyTabeli(tx, t.tabela);
  const wiersz = Object.fromEntries(Object.entries(w.wartosc.wiersz).filter(([k]) => kol.has(k))); // pole z nowszego schematu: pomijane (zmiany tylko dodające)
  if (await brakRodzica(tx, t.tabela, wiersz)) { await doPoczekalni(tx, r, 'brak_rodzica', terazMs); return 'poczekalnia'; }
  // CloudKit nie trzyma pól nil (zapis nil usuwa pole, Odwzorowanie.swift): brak kolumny dopuszczającej NULL = wyczyszczona na nadawcy
  // (cel, przywrócenie z kosza). Bez tego aktualizacja zostawiała starą wartość. Klucz i `pomin` (liczone lokalnie) bez zmian.
  if (t.scalanie === 'zmieniono_ms') for (const [k, nullable] of kol) if (nullable && !(k in wiersz) && !t.klucz.includes(k) && !t.pomin.includes(k)) wiersz[k] = null;
  const nazwy = Object.keys(wiersz);
  const wartosci = Object.values(wiersz);
  await tx.run('SAVEPOINT icloud_rekord');
  try {
    let wynik: Wynik1 = 'zastosowany';
    if (t.scalanie === 'zmieniono_ms') {
      const zmiany = nazwy.filter((k) => !t.klucz.includes(k)).map((k) => `${k} = excluded.${k}`).join(', ');
      await tx.run(`INSERT INTO ${t.tabela} (${nazwy.join(', ')}) VALUES (${nazwy.map(() => '?').join(', ')})
        ON CONFLICT (${t.klucz.join(', ')}) DO ${zmiany ? `UPDATE SET ${zmiany} WHERE excluded.zmieniono_ms > ${t.tabela}.zmieniono_ms` : 'NOTHING'}`, wartosci);
    } else if (t.scalanie === 'tylko_dopisywane') {
      if (t.tabela === 'zdarzenie') {
        const [byl] = await wiersze(tx.all('SELECT licznik_id, rodzaj, wartosc, rodzice, cofa FROM zdarzenie WHERE id = ?', [wiersz.id]), 'zdarzenie');
        const rozne = byl && (['licznik_id', 'rodzaj', 'wartosc', 'rodzice', 'cofa'] as const).some((k) => (byl[k] ?? null) !== (wiersz[k] ?? (k === 'rodzice' || k === 'cofa' ? '[]' : null)));
        if (rozne) { await zapiszBladW(tx, { czasMs: terazMs, kod: 'icloud_kolizja_id', szczegoly: { zdarzenie: String(wiersz.id) } }); wynik = 'blad'; } // M-14
      }
      if (wynik === 'zastosowany') await tx.run(`INSERT INTO ${t.tabela} (${nazwy.join(', ')}) VALUES (${nazwy.map(() => '?').join(', ')}) ON CONFLICT DO NOTHING`, wartosci);
    } else if (t.scalanie === 'dni_limitu') {
      await zapiszDzienLimitu(tx, { dzien: String(wiersz.dzien), pro: wiersz.pro === 1, zaczetoMs: Number(wiersz.zaczeto_ms), zdarzenieId: String(wiersz.zdarzenie_id) });
    } else if (wiersz.wartosc === 'true') { // ustawienie_or: okno „Uczciwe zasady” widziane na którymkolwiek urządzeniu (KP-16)
      await tx.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES (?, 'true', ?) ON CONFLICT (klucz) DO UPDATE SET wartosc = 'true'", [wiersz.klucz, Number(wiersz.zmieniono_ms ?? terazMs)]);
    }
    await tx.run('RELEASE icloud_rekord');
    if (t.tabela === 'licznik') liczniki.add(String(wiersz.id));
    if (t.tabela === 'zdarzenie' && wynik === 'zastosowany') liczniki.add(String(wiersz.licznik_id));
    return wynik;
  } catch {
    await tx.run('ROLLBACK TO icloud_rekord');
    await tx.run('RELEASE icloud_rekord');
    await zapiszBladW(tx, { czasMs: terazMs, kod: 'icloud_zapis_rekordu', szczegoly: { encja: t.tabela } });
    return 'blad';
  }
}

const kolejnosc = new Map(TABELE_ICLOUD.map((t, i) => [t.tabela, i]));
const wgKontraktu = (a: { encja: string }, b: { encja: string }): number => (kolejnosc.get(a.encja) ?? 99) - (kolejnosc.get(b.encja) ?? 99);

/**
 * Partia z iCloud w transakcji wołającego: `wejscie = 1`, rekordy w kolejności tabel z kontraktu, usunięcia (kaskada; nagrobek nad niewysłanymi
 * zmianami zatrzymany, szczyt w koszu — icloud-nagrobki.ts, ADR-0005 „Nagrobki”), ponowienie poczekalni
 * aż do braku postępu, `przeliczLicznik` dla dotkniętych liczników, stan silnika, `wejscie = 0`. `pliki` = klucze zasobów już w magazynie.
 */
export async function zastosujPartie(tx: PortBazy, p: PartiaIcloud, terazMs: number, pliki: ReadonlySet<string>): Promise<WynikPartii> {
  await tx.run('UPDATE synchronizacja SET wejscie = 1 WHERE id = 1');
  const liczniki = new Set<string>();
  const wynik: WynikPartii = { zastosowane: 0, poczekalnia: 0, bledy: 0, konflikty: 0, liczniki: [] };
  const licz = (w: Wynik1) => { if (w === 'zastosowany') wynik.zastosowane += 1; else if (w === 'blad') wynik.bledy += 1; };
  for (const r of [...p.rekordy].sort(wgKontraktu)) {
    const w = await zastosujRekord(tx, r, terazMs, liczniki, pliki);
    licz(w);
    if (w === 'zastosowany' || w === 'blad') await tx.run('DELETE FROM poczekalnia WHERE id = ?', [nazwaRekordu(r.encja, r.klucz)]);
  }
  const { zatrzymane, szczyty } = await zatrzymaneNagrobki(tx, p.usuniete);
  for (const u of [...p.usuniete].sort((a, b) => wgKontraktu(b, a))) { // dzieci przed rodzicami
    const t = tabelaIcloud(u.encja);
    const k = t ? wartosciKlucza(t, u.klucz) : null;
    await tx.run('DELETE FROM poczekalnia WHERE id = ?', [nazwaRekordu(u.encja, u.klucz)]);
    if (!t || !k || !k.ok) { wynik.bledy += 1; continue; }
    if (ma(zatrzymane, t.tabela, u.klucz)) continue; // ADR-0005 „Nagrobki”: niewysłane dane zostają, projekt w koszu (odtworzWKoszu)
    await tx.run('SAVEPOINT icloud_usun');
    try { await tx.run(`DELETE FROM ${t.tabela} WHERE ${warunekKlucza(t)}`, k.wartosc); await tx.run('RELEASE icloud_usun'); } catch {
      await tx.run('ROLLBACK TO icloud_usun'); await tx.run('RELEASE icloud_usun'); // plik z odwołaniem (RESTRICT): zostaje
    }
  }
  if (zatrzymane.size) await odtworzWKoszu(tx, zatrzymane, szczyty, terazMs);
  for (let postep = true; postep;) { // poczekalnia: rekord, którego rodzic doszedł w tej albo wcześniejszej partii
    postep = false;
    for (const c of await wiersze(tx.all("SELECT id, dane FROM poczekalnia WHERE zrodlo = 'synchronizacja' ORDER BY przyszlo_ms, id"), 'poczekalnia')) {
      const r = rekordZJson(JSON.parse(tekst(c, 'dane')));
      if (!r) { await tx.run('DELETE FROM poczekalnia WHERE id = ?', [tekst(c, 'id')]); wynik.bledy += 1; continue; } // uszkodzony wpis: nie do odtworzenia
      const [przed] = await wiersze(tx.all('SELECT proby FROM poczekalnia WHERE id = ?', [tekst(c, 'id')]), 'poczekalnia');
      const w = await zastosujRekord(tx, r, terazMs, liczniki, pliki);
      if (w === 'zastosowany' || w === 'blad') { await tx.run('DELETE FROM poczekalnia WHERE id = ?', [tekst(c, 'id')]); licz(w); postep = true; }
      else if (przed) await tx.run('UPDATE poczekalnia SET proby = ? WHERE id = ?', [liczba(przed, 'proby'), tekst(c, 'id')]); // ponowienie bez postępu nie liczy prób
    }
  }
  for (const l of [...liczniki].sort()) {
    const [jest] = await tx.all('SELECT 1 FROM licznik WHERE id = ?', [l]);
    if (jest && (await przeliczLicznik(tx, l, terazMs)) === 'konflikt') wynik.konflikty += 1;
  }
  wynik.liczniki = [...liczniki].sort();
  wynik.poczekalnia = liczba((await wiersze(tx.all("SELECT count(*) AS n FROM poczekalnia WHERE zrodlo = 'synchronizacja'"), 'poczekalnia'))[0], 'n');
  await tx.run('UPDATE synchronizacja SET stan_silnika = ?, wejscie = 0 WHERE id = 1', [p.stanSilnika]);
  return wynik;
}

/** Liczniki w konflikcie (wiersz „N counters have two versions” w Data and sync, P-220 I1a). */
export async function licznikiWKonflikcie(baza: PortBazy): Promise<number> {
  return liczba((await wiersze(baza.all('SELECT count(*) AS n FROM licznik WHERE konflikt = 1 AND usunieto_ms IS NULL'), 'konflikty'))[0], 'n');
}
/** Pierwszy licznik w konflikcie (najdawniej zmieniony) — „Choose a version” z Data and sync otwiera go i przechodzi do wyboru; null, gdy nie ma konfliktu. */
export async function pierwszyLicznikWKonflikcie(baza: PortBazy): Promise<string | null> {
  const [w] = await wiersze(baza.all('SELECT id FROM licznik WHERE konflikt = 1 AND usunieto_ms IS NULL ORDER BY zmieniono_ms, id LIMIT 1'), 'konflikty');
  return w ? tekst(w, 'id') : null;
}
/** Czy w poczekalni czeka rekord iCloud nowszej wersji aplikacji, który przyszedł przed `przedMs` — „Update Oczko…” w Data and sync. */
export async function nowszaWersjaWPoczekalni(baza: PortBazy, przedMs: number): Promise<boolean> {
  return (await baza.all("SELECT 1 FROM poczekalnia WHERE zrodlo = 'synchronizacja' AND powod = 'nowsza_wersja' AND przyszlo_ms < ? LIMIT 1", [przedMs])).length > 0;
}
/** Najstarszy rekord iCloud w poczekalni (ms) — „niepełna historia” po POCZEKALNIA_DNI (P-110 Q1a). */
export async function najstarszyWPoczekalni(baza: PortBazy): Promise<number | null> {
  const [r] = await wiersze(baza.all("SELECT min(przyszlo_ms) AS m FROM poczekalnia WHERE zrodlo = 'synchronizacja'"), 'poczekalnia');
  return r && r.m !== null ? liczba(r, 'm') : null;
}
