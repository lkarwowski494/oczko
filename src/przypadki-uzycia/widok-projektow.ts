// Model odczytu listy projektów (F-50, F-54, P-065 (2a); design-spec „Lista projektów”, „Projekt roboczy”): same dane, teksty i wyszukiwanie po
// etykiecie roboczej liczy kompozycja (etykieta zależy od języka, P-126 (1b)). Kolejność i kosz jak `listaProjektow` (BR-PRJ-012).
import type { Wynik } from '../domena/bledy';
import { dniDoTerminu, dzienLokalny, type CelDnia } from '../domena/postep';
import { mozeZaczacDzien } from '../domena/limit';
import { LIMIT_DNI_W_MIESIACU } from '../konfiguracja';
import { dniLimituMiesiaca, ostatniPlus } from '../dane/repozytoria/liczniki';
import { dzienProjektu, kolejnoscProjektow } from '../dane/repozytoria/kalendarz';
import { elementyKosza } from '../dane/repozytoria/kosz';
import { listaProjektow } from '../dane/repozytoria/projekty';
import { liczba, liczbaLubNull, tekst, tekstLubNull, wiersze } from '../dane/repozytoria/wiersze';
import { dodajDni } from './daty';
import { operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export type ProjektNaEkranie = {
  id: string; nazwa: string; nienazwany: boolean; utworzonoMs: number; ostatniaPracaMs: number;
  /** Ukończony: dzień lokalny ukończenia (RD-16) i suma zakończonych sesji stopera; `null` = nie ukończony / nie używano stopera (BR-PRJ-006/S1, BR-PRJ-015/S3). */
  ukonczonoDzien: string | null; czasPracyMs: number | null;
  /** Licznik z najnowszą zmianą w projekcie (BR-PRJ-016/S2, 07-jakosc-028); bez żadnej zmiany: pierwszy licznik pierwszej części. `null` = projekt bez licznika. */
  licznik: { id: string; czesc: string; wartosc: number; cel: number | null } | null;
  /** Dni kalendarzowe (RD-16) od ostatniej pracy do dziś — „last worked …” bez progu (BR-PRJ-016, P-182, P-183 1a). */
  dniOdPracy: number;
  /** Linia terminu na liście (BR-DNI-005/006): cel RD-15 i rzędy zrobione dziś; `null` bez terminu albo bez celów części. */
  dzis: { cel: CelDnia; zrobione: number } | null;
};
export type WidokProjektow = { wToku: ProjektNaEkranie[]; ukonczone: ProjektNaEkranie[]; dni: { zostalo: number; limit: number; dzis: string } | null; kosz: number };

export function widokProjektow(z: Zaleznosci): Promise<Wynik<WidokProjektow>> {
  return operacjaZapisu(z, 'widokProjektow', async (tx, teraz, chwila) => {
    const l = await listaProjektow(tx);
    const dodatki = new Map<string, { nienazwany: boolean; utworzonoMs: number; licznik: ProjektNaEkranie['licznik']; ukonczonoDzien: string | null; czasPracyMs: number | null }>();
    for (const r of await wiersze(tx.all(
      `SELECT p.id, p.nienazwany, p.utworzono_ms, p.ukonczono_dzien,
              (SELECT count(*) FROM sesja s WHERE s.projekt_id = p.id AND s.stan = 'zakonczona') AS sesji,
              (SELECT coalesce(sum(max(0, s.koniec_ms - s.start_ms - s.przerwy_ms)), 0) FROM sesja s WHERE s.projekt_id = p.id AND s.stan = 'zakonczona') AS czas_ms,
              (SELECT l.id FROM czesc c JOIN licznik l ON l.czesc_id = c.id WHERE c.projekt_id = p.id AND c.usunieto_ms IS NULL AND l.usunieto_ms IS NULL
                ORDER BY coalesce((SELECT max(z.czas_ms) FROM zdarzenie z WHERE z.licznik_id = l.id), -1) DESC, c.kolejnosc, l.kolejnosc LIMIT 1) AS licznik_id
         FROM projekt p WHERE p.usunieto_ms IS NULL`), 'widokProjektow')) {
      const lid = tekstLubNull(r, 'licznik_id');
      let licznik: ProjektNaEkranie['licznik'] = null;
      if (lid) {
        const [x] = await wiersze(tx.all('SELECT l.wartosc, c.nazwa, c.cel_rzedow FROM licznik l JOIN czesc c ON c.id = l.czesc_id WHERE l.id = ?', [lid]), 'widokProjektow');
        if (x) licznik = { id: lid, czesc: tekst(x, 'nazwa'), wartosc: liczba(x, 'wartosc'), cel: liczbaLubNull(x, 'cel_rzedow') };
      }
      dodatki.set(tekst(r, 'id'), { nienazwany: liczba(r, 'nienazwany') === 1, utworzonoMs: liczba(r, 'utworzono_ms'), licznik, ukonczonoDzien: tekstLubNull(r, 'ukonczono_dzien'),
        czasPracyMs: liczba(r, 'sesji') > 0 ? liczba(r, 'czas_ms') : null });
    }
    const dzis = chwila.dzien;
    const dniOd = (ms: number): number => {
      const d = dzienLokalny(ms, chwila.strefa);
      const n = d.ok ? dniDoTerminu(d.wartosc, dzis) : d;
      return n.ok ? Math.max(0, n.wartosc - 1) : 0; // dniDoTerminu liczy oba końce (+1); zegar cofnięty → 0, nie liczba ujemna
    };
    const terminy = new Map<string, string>();
    for (const r of await wiersze(tx.all("SELECT id, termin_dzien FROM projekt WHERE termin_dzien IS NOT NULL AND usunieto_ms IS NULL AND stan = 'w_toku'"), 'widokProjektow')) terminy.set(tekst(r, 'id'), tekst(r, 'termin_dzien'));
    const naEkranie = async (p: (typeof l.wToku)[number]): Promise<ProjektNaEkranie> => {
      const d = dodatki.get(p.id) ?? { nienazwany: false, utworzonoMs: p.ostatniaPracaMs, licznik: null, ukonczonoDzien: null, czasPracyMs: null };
      const termin = terminy.get(p.id);
      const dp = termin ? await dzienProjektu(tx, p.id, termin, dzis) : null;
      return { id: p.id, nazwa: p.nazwa, ostatniaPracaMs: p.ostatniaPracaMs, ...d, dniOdPracy: dniOd(p.ostatniaPracaMs), dzis: dp?.cel ? { cel: dp.cel, zrobione: dp.zrobioneDzis } : null };
    };
    const poKolei = async (lista: typeof l.wToku): Promise<ProjektNaEkranie[]> => { const w: ProjektNaEkranie[] = []; for (const p of lista) w.push(await naEkranie(p)); return w; }; // zapytania jedno po drugim w transakcji
    // Kolejność w toku: BR-DNI-006 (po terminie → cel na dziś malejąco → bez terminu wg ostatniej pracy), `kolejnoscProjektow`.
    const kolejnosc = new Map((await kolejnoscProjektow(tx, dzis)).map((p, i) => [p.id, i]));
    const wToku = [...l.wToku].sort((a, b) => (kolejnosc.get(a.id) ?? Infinity) - (kolejnosc.get(b.id) ?? Infinity));
    const pro = z.pro();
    const zaw = mozeZaczacDzien({ dni: await dniLimituMiesiaca(tx, dzis.slice(0, 7)), dzis, teraz, ostatniPlus: await ostatniPlus(tx, dodajDni(dzis, -2)), pro });
    return { ok: true, wartosc: { wToku: await poKolei(wToku), ukonczone: await poKolei(l.ukonczone), dni: pro ? null : { zostalo: zaw.zostalo, limit: LIMIT_DNI_W_MIESIACU, dzis },
      kosz: (await elementyKosza(tx, chwila.strefa, chwila.ms)).length } };
  });
}
