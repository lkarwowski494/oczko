// Sprzątanie „Ostatnio usuniętych” przy starcie (P-026, KOSZ_DNI; wiersze `plik` bez odwołań w transakcji, same pliki — `sprzatnijSierotyMagazynu`, ADR-0001).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Warunek dwóch startów w domenie (`doSprzatniecia`, P-118 W2): `ostatni_start_ms` czytany z `ustawienie` przed sprzątaniem.
import type { Wynik } from '../domena/bledy';
import { doSprzatniecia } from '../domena/maszyny/projekt';
import type { PortBazy } from '../domena/porty';
import { KOSZ_DNI, PLIKI_OCHRONA_MIN } from '../konfiguracja';
import { ostatniStartMs } from '../dane/repozytoria/ustawienia';
import { liczba, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { istniejeKatalog, lista, polacz } from '../dane/pliki/system';
import { najnowszaKopiaMs } from '../niezawodnosc/kopie';
import { wKolejce } from './kolejka';
import { wTransakcji } from './zapis';
import type { ZaleznosciPlikow } from './zaleznosci';

export type WynikSprzatania = { projekty: number; czesci: number; liczniki: number; wzory: number; wloczki: number; narzedzia: number; pliki: number };

const ODWOLANIA = `SELECT pdf_sha256 AS h FROM wzor UNION SELECT oryginal_sha256 FROM wzor UNION SELECT plik_sha256 FROM rysunek UNION SELECT plik_sha256 FROM zdjecie`;
/** Pliki odwoływane przez wiersze projektu (wzory, rysunki, zdjęcia) — kandydaci do usunięcia po trwałym usunięciu projektu. */
const PLIKI_PROJEKTU = `SELECT pdf_sha256 AS h FROM wzor WHERE projekt_id = ?1 UNION SELECT oryginal_sha256 FROM wzor WHERE projekt_id = ?1
  UNION SELECT r.plik_sha256 FROM rysunek r JOIN wzor w ON w.id = r.wzor_id WHERE w.projekt_id = ?1 UNION SELECT plik_sha256 FROM zdjecie WHERE projekt_id = ?1`;

async function usunieci(tx: PortBazy, sql: string): Promise<{ id: string; usunietoMs: number }[]> {
  return (await wiersze(tx.all(sql), 'sprzatnijKosz')).map((r) => ({ id: tekst(r, 'id'), usunietoMs: liczba(r, 'usunieto_ms') }));
}

/**
 * Bez kolejki: woła ją pozycja kolejki startu (`uruchomDane`). Usuwa tylko wiersze `plik`; pliki bez wierszy usuwa `sprzatnijSierotyMagazynu`
 * (ADR-0001, 05-architekt-513), więc obowiązuje reguła kopii M1-087: plik potrzebny kopii `.db` zostaje (05-architekt-512).
 */
export async function sprzatnijKoszWKolejce(z: ZaleznosciPlikow): Promise<Wynik<WynikSprzatania>> {
  const doUsuniecia: string[] = [];
  return wTransakcji(z, 'sprzatnijKosz', async (tx, teraz): Promise<Wynik<WynikSprzatania>> => {
    const ostatni = await ostatniStartMs(tx);
    const doKosza = (u: { usunietoMs: number }) => doSprzatniecia({ stan: 'w_toku', ukonczonoMs: null, usunietoMs: u.usunietoMs }, teraz, ostatni, KOSZ_DNI);
    const projekty = (await usunieci(tx, 'SELECT id, usunieto_ms FROM projekt WHERE usunieto_ms IS NOT NULL')).filter(doKosza);
    const czesci = (await usunieci(tx, 'SELECT c.id, c.usunieto_ms FROM czesc c JOIN projekt p ON p.id = c.projekt_id WHERE c.usunieto_ms IS NOT NULL AND p.usunieto_ms IS NULL')).filter(doKosza);
    const liczniki = (await usunieci(tx,
      'SELECT l.id, l.usunieto_ms FROM licznik l JOIN czesc c ON c.id = l.czesc_id JOIN projekt p ON p.id = c.projekt_id WHERE l.usunieto_ms IS NOT NULL AND c.usunieto_ms IS NULL AND p.usunieto_ms IS NULL')).filter(doKosza);
    // Partia 6 (P-229): wzór w koszu (projekt poza koszem) trwale z kaskadą rysunków; jego pliki to kandydaci do usunięcia.
    const wzory = (await usunieci(tx, 'SELECT w.id, w.usunieto_ms FROM wzor w JOIN projekt p ON p.id = w.projekt_id WHERE w.usunieto_ms IS NOT NULL AND p.usunieto_ms IS NULL')).filter(doKosza);
    const kandydaci = new Set<string>();
    for (const p of projekty) {
      for (const r of await wiersze(tx.all(PLIKI_PROJEKTU, [p.id]), 'sprzatnijKosz')) if (r.h !== null) kandydaci.add(tekst(r, 'h'));
      await tx.run('DELETE FROM projekt WHERE id = ?', [p.id]); // kaskada: części, liczniki, historia, wzory; dni limitu zostają (P-072 (8a))
    }
    for (const c of czesci) await tx.run('DELETE FROM czesc WHERE id = ?', [c.id]);
    for (const l of liczniki) await tx.run('DELETE FROM licznik WHERE id = ?', [l.id]);
    for (const w of wzory) {
      const pliki = await wiersze(tx.all('SELECT pdf_sha256 AS h FROM wzor WHERE id = ?1 UNION SELECT oryginal_sha256 FROM wzor WHERE id = ?1 UNION SELECT plik_sha256 FROM rysunek WHERE wzor_id = ?1', [w.id]), 'sprzatnijKosz');
      for (const r of pliki) if (r.h !== null) kandydaci.add(tekst(r, 'h'));
      await tx.run('DELETE FROM wzor WHERE id = ?', [w.id]);
    }
    // P-209: narzędzie trwale; włóczka tylko bez przypisań (inaczej kaskada skasowałaby zużycie w projektach) — przypisana zostaje ukryta na stałe.
    const narzedzia = (await usunieci(tx, 'SELECT id, usunieto_ms FROM narzedzie WHERE usunieto_ms IS NOT NULL')).filter(doKosza);
    for (const n of narzedzia) await tx.run('DELETE FROM narzedzie WHERE id = ?', [n.id]);
    let wloczki = 0;
    for (const w of (await usunieci(tx, 'SELECT id, usunieto_ms FROM wloczka WHERE usunieto_ms IS NOT NULL')).filter(doKosza)) {
      const pliki = await wiersze(tx.all('SELECT plik_sha256 AS h FROM zdjecie WHERE wloczka_id = ?', [w.id]), 'sprzatnijKosz');
      const r = await tx.run('DELETE FROM wloczka WHERE id = ? AND NOT EXISTS (SELECT 1 FROM projekt_wloczka WHERE wloczka_id = wloczka.id)', [w.id]);
      if (r.zmiany === 1) { wloczki++; for (const x of pliki) kandydaci.add(tekst(x, 'h')); } // zdjęcia etykiety kaskadą
    }
    const uzywane = new Set((await wiersze(tx.all(ODWOLANIA), 'sprzatnijKosz')).filter((r) => r.h !== null).map((r) => tekst(r, 'h')));
    // Pliki zwolnione przez to usunięcie + stare pliki bez odwołań; młodsze niż PLIKI_OCHRONA_MIN mogą czekać na wiersz (import w toku, Z07-15).
    const sieroty = (await wiersze(tx.all('SELECT sha256 FROM plik WHERE utworzono_ms <= ?', [teraz - PLIKI_OCHRONA_MIN * 60_000]), 'sprzatnijKosz')).map((r) => tekst(r, 'sha256'));
    for (const h of [...kandydaci, ...sieroty]) {
      if (uzywane.has(h) || doUsuniecia.includes(h)) continue;
      await tx.run('DELETE FROM plik WHERE sha256 = ?', [h]);
      doUsuniecia.push(h);
    }
    return { ok: true, wartosc: { projekty: projekty.length, czesci: czesci.length, liczniki: liczniki.length, wzory: wzory.length, wloczki, narzedzia: narzedzia.length, pliki: doUsuniecia.length } };
  });
}

/**
 * M1-023 (05-architekt-503, ADR-0001: „plik bez odwołania jest wykrywany”): plik magazynu bez wiersza `plik` (po „zastąp”, przywróceniu kopii,
 * nieudanym imporcie, zapisie rysunku, usunięciu zdjęcia, sprzątaniu kosza) usuwany przy starcie — jedyne miejsce usuwania plików poza „Usuń wszystkie
 * dane” (ADR-0001, 05-architekt-513); młodszy niż PLIKI_OCHRONA_MIN (czas zmiany pliku) zostaje, bo zapis pliku poprzedza wiersz (Z07-15).
 * Tylko w `uruchomDane` (przed pierwszym ekranem, w kolejce), nie przy ręcznym opróżnianiu kosza.
 * M1-087 (05-architekt-507, ADR-0020): kopie `.db` w `kopie/` nie mają plików magazynu, więc plik nie młodszy niż najnowsza kopia (istniał, gdy powstała) zostaje (cofnięcie
 * przywrócenia wraca z plikami); kopie znikają po KOPIE_RATUNKOWE_DNI (ADR-0020 (6)) i wtedy plik bez odwołań i bez kopii jest usuwany.
 */
export async function sprzatnijSierotyMagazynu(z: ZaleznosciPlikow): Promise<Wynik<number>> {
  try {
    const granica = z.zegar.teraz().ms - PLIKI_OCHRONA_MIN * 60_000;
    const znane = new Set((await wiersze(z.baza.all('SELECT sha256 FROM plik'), 'sprzatnijSierotyMagazynu')).map((r) => tekst(r, 'sha256')));
    const kopie = z.katalogi.kopie;
    const kopiaMs = najnowszaKopiaMs(lista(kopie).map((nazwa) => ({ nazwa, katalog: istniejeKatalog(polacz(kopie, nazwa)) })));
    const sieroty = new Set((await z.magazyn.pliki())
      .filter((p) => !znane.has(p.sha256) && p.zmianaMs !== null && p.zmianaMs <= granica && (kopiaMs === null || p.zmianaMs > kopiaMs)).map((p) => p.sha256));
    for (const h of sieroty) await z.magazyn.usun(h);
    return { ok: true, wartosc: sieroty.size };
  } catch {
    return { ok: false, powod: 'zapis' };
  }
}

export function sprzatnijKosz(z: ZaleznosciPlikow): Promise<Wynik<WynikSprzatania>> {
  return wKolejce(z.baza, () => sprzatnijKoszWKolejce(z));
}
