// Zdjęcia projektu i etykiety włóczki (F-16, BR-PRJ-003; P-191 P9a: grupa „Photos”, zdjęcie etykiety w formularzu włóczki, usuwanie
// z potwierdzeniem, bez kosza — BR-DAN-008 obejmuje projekty, części i liczniki). Plik do magazynu przed wierszem (ADR-0001: sprzątanie
// chroni pliki młodsze niż PLIKI_OCHRONA_MIN); wiersz `plik` bez innych odwołań usuwany w transakcji, sam plik przy starcie (`sprzatnijSierotyMagazynu`,
// ADR-0001, 05-architekt-513: dodanie tego samego zdjęcia może być w locie).
import type { Wynik } from '../domena/bledy';
import { liczba, liczbaLubNull, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { wKolejce } from './kolejka';
import { blad, wTransakcji, operacjaZapisu } from './zapis';
import type { ZaleznosciPlikow } from './zaleznosci';

export type CelZdjecia = { projektId: string } | { wloczkaId: string };
export type Zdjecie = { id: string; sha256: string; utworzonoMs: number };

/** Formaty z wyboru zdjęcia iOS (aparat i biblioteka); inne → bledne_dane. */
const ROZSZERZENIA: Record<string, string> = { jpg: 'jpg', jpeg: 'jpg', heic: 'heic', png: 'png' };
const ODWOLANIA_PLIKU = `SELECT 1 FROM zdjecie WHERE plik_sha256 = ?1 UNION ALL SELECT 1 FROM wzor WHERE pdf_sha256 = ?1 OR oryginal_sha256 = ?1
  UNION ALL SELECT 1 FROM rysunek WHERE plik_sha256 = ?1 LIMIT 1`;
const rodzic = (c: CelZdjecia): [string, string] => ('projektId' in c ? ['projekt', c.projektId] : ['wloczka', c.wloczkaId]);

export async function dodajZdjecie(z: ZaleznosciPlikow, w: { cel: CelZdjecia; plik: { sciezka: string; rozszerzenie: string } }): Promise<Wynik<{ zdjecieId: string }>> {
  const rozszerzenie = ROZSZERZENIA[w.plik.rozszerzenie.toLowerCase()];
  if (!rozszerzenie) return blad('bledne_dane');
  const zapis = await z.magazyn.zapisz(w.plik.sciezka, rozszerzenie);
  if (!zapis.ok) return zapis;
  const [tabela, id] = rodzic(w.cel);
  return operacjaZapisu(z, 'dodajZdjecie', async (tx, teraz) => {
    const [r] = await wiersze(tx.all(`SELECT usunieto_ms FROM ${tabela} WHERE id = ?`, [id]), 'dodajZdjecie'); // tabela z zamkniętej listy
    if (!r) return blad('bledne_dane');
    if (liczbaLubNull(r, 'usunieto_ms') !== null) return blad('niedozwolone_przejscie');
    await tx.run('INSERT INTO plik (sha256, rozszerzenie, bajty, utworzono_ms) VALUES (?, ?, ?, ?) ON CONFLICT (sha256) DO NOTHING', [zapis.wartosc.sha256, rozszerzenie, zapis.wartosc.bajty, teraz]);
    const zdjecieId = z.id.nowy();
    await tx.run('INSERT INTO zdjecie (id, projekt_id, wloczka_id, plik_sha256, utworzono_ms) VALUES (?, ?, ?, ?, ?)',
      [zdjecieId, tabela === 'projekt' ? id : null, tabela === 'wloczka' ? id : null, zapis.wartosc.sha256, teraz]);
    return { ok: true, wartosc: { zdjecieId } };
  });
}

export function usunZdjecie(z: ZaleznosciPlikow, w: { zdjecieId: string }): Promise<Wynik<void>> {
  return wKolejce(z.baza, () => wTransakcji(z, 'usunZdjecie', async (tx) => {
    const [zd] = await wiersze(tx.all('SELECT plik_sha256 FROM zdjecie WHERE id = ?', [w.zdjecieId]), 'usunZdjecie');
    if (!zd) return blad('bledne_dane');
    const h = tekst(zd, 'plik_sha256');
    await tx.run('DELETE FROM zdjecie WHERE id = ?', [w.zdjecieId]);
    if ((await wiersze(tx.all(ODWOLANIA_PLIKU, [h]), 'usunZdjecie')).length === 0) await tx.run('DELETE FROM plik WHERE sha256 = ?', [h]);
    return { ok: true, wartosc: undefined };
  }));
}

/** Zdjęcia projektu albo włóczki, od najnowszego. */
export function zdjecia(z: ZaleznosciPlikow, c: CelZdjecia): Promise<Wynik<Zdjecie[]>> {
  const [tabela, id] = rodzic(c);
  return wKolejce(z.baza, async () => {
    const r = await wiersze(z.baza.all(`SELECT id, plik_sha256, utworzono_ms FROM zdjecie WHERE ${tabela}_id = ? ORDER BY utworzono_ms DESC, id`, [id]), 'zdjecia');
    return { ok: true, wartosc: r.map((x) => ({ id: tekst(x, 'id'), sha256: tekst(x, 'plik_sha256'), utworzonoMs: liczba(x, 'utworzono_ms') })) };
  });
}
