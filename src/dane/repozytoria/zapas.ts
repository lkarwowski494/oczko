// Repozytorium zapasu włóczki (F-37; BR-ZAP-001, BR-ZAP-002 (U-9), BR-ZAP-004; RD-10 kategorie grubości).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Kategoria grubości: `wloczka.kategoria` (CYC 0–7 albo NULL, indeks `wloczka_kategoria`; fix 05 2026-10-25, P-099, P-110 Q6a).
import type { Wynik } from '../../domena/bledy';
import type { PortBazy } from '../../domena/porty';
import { powodBledu } from '../baza/bledy-sqlite';
import { liczba, liczbaLubNull, tekst, wiersze } from './wiersze';

export type WloczkaZapasu = { id: string; nazwa: string; motki: number; dlugoscMotkaM: number | null; kategoria: number | null };
const nieujemna = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const kategoriaOk = (v: unknown): boolean => v === undefined || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 7);
const zapisNieudany = (e: unknown): { ok: false; powod: 'zapis' | 'brak_miejsca' } => ({ ok: false, powod: powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' });

export async function dodajWloczke(baza: PortBazy, w: { id: string; nazwa: string; motki: number; dlugoscMotkaM?: number; kategoria?: number; terazMs: number }): Promise<Wynik<void>> {
  if (!w.nazwa.trim() || !nieujemna(w.motki) || (w.dlugoscMotkaM !== undefined && !(nieujemna(w.dlugoscMotkaM) && w.dlugoscMotkaM > 0)) || !kategoriaOk(w.kategoria)) {
    return { ok: false, powod: 'bledne_dane' }; // wpis użytkowniczki (P-118 Q1a); brak długości i kategorii zostaje brakiem (NULL)
  }
  try {
    await baza.run(
      `INSERT INTO wloczka (id, nazwa, motki, dlugosc_motka_m, kategoria, zmieniono_ms) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET nazwa = excluded.nazwa, motki = excluded.motki, dlugosc_motka_m = excluded.dlugosc_motka_m,
         kategoria = excluded.kategoria, zmieniono_ms = excluded.zmieniono_ms`,
      [w.id, w.nazwa.trim(), w.motki, w.dlugoscMotkaM ?? null, w.kategoria ?? null, w.terazMs],
    );
    return { ok: true, wartosc: undefined };
  } catch (e) {
    return zapisNieudany(e);
  }
}
/** Zapas bez usuniętych; `kategoria` filtruje po kategorii grubości (RD-10). Kolejność: nazwa bez wielkości liter (indeks wloczka_nazwa). */
export async function zapas(baza: PortBazy, w: { kategoria?: number } = {}): Promise<WloczkaZapasu[]> {
  const filtr = w.kategoria === undefined ? '' : 'AND kategoria = ?';
  const r = await wiersze(baza.all(
    `SELECT id, nazwa, motki, dlugosc_motka_m, kategoria FROM wloczka WHERE usunieto_ms IS NULL ${filtr} ORDER BY nazwa COLLATE NOCASE`,
    w.kategoria === undefined ? [] : [w.kategoria]), 'zapas');
  return r.map((x) => ({ id: tekst(x, 'id'), nazwa: tekst(x, 'nazwa'), motki: liczba(x, 'motki'), dlugoscMotkaM: liczbaLubNull(x, 'dlugosc_motka_m'), kategoria: liczbaLubNull(x, 'kategoria') }));
}
/**
 * Potwierdzenie zużycia przy zakończeniu projektu (U-9): `projekt_wloczka.zuzyto_motki` i `wloczka.motki` w jednej transakcji.
 * Zapas zmienia się o różnicę względem poprzedniego potwierdzenia, więc ponowne potwierdzenie tej samej liczby niczego nie odejmuje drugi raz;
 * zapas nie schodzi poniżej 0 (zużycie większe niż wpisany zapas: [DO USTALENIA 04] komunikat).
 */
export async function potwierdzZuzycie(baza: PortBazy, w: { projektId: string; zuzycie: { wloczkaId: string; motki: number }[]; terazMs: number }): Promise<Wynik<void>> {
  if (!w.zuzycie.every((z) => nieujemna(z.motki))) return { ok: false, powod: 'bledne_dane' };
  try {
    return await baza.transakcja(async (tx): Promise<Wynik<void>> => {
      for (const z of w.zuzycie) {
        const [byl] = await wiersze(tx.all('SELECT zuzyto_motki, odjeto_motki FROM projekt_wloczka WHERE projekt_id = ? AND wloczka_id = ?', [w.projektId, z.wloczkaId]), 'potwierdzZuzycie');
        const roznica = z.motki - ((byl ? liczbaLubNull(byl, 'zuzyto_motki') : null) ?? 0);
        const [zap] = await wiersze(tx.all('SELECT motki FROM wloczka WHERE id = ?', [z.wloczkaId]), 'potwierdzZuzycie');
        const przed = zap ? liczba(zap, 'motki') : 0;
        const odjetoStare = (byl ? liczbaLubNull(byl, 'odjeto_motki') : null) ?? 0;
        // P-334: zużycie rośnie → zapas nie schodzi poniżej 0, a `odjeto_motki` rośnie o faktyczne odjęcie; zużycie maleje → zwrot nie większy niż kiedykolwiek odjęto.
        const zwrot = roznica < 0 ? Math.min(-roznica, odjetoStare) : 0;
        const po = roznica < 0 ? przed + zwrot : Math.max(0, przed - roznica);
        const odjeto = roznica < 0 ? odjetoStare - zwrot : odjetoStare + (przed - po);
        await tx.run(
          `INSERT INTO projekt_wloczka (projekt_id, wloczka_id, zuzyto_motki, odjeto_motki, zmieniono_ms) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (projekt_id, wloczka_id) DO UPDATE SET zuzyto_motki = excluded.zuzyto_motki, odjeto_motki = excluded.odjeto_motki, zmieniono_ms = excluded.zmieniono_ms`,
          [w.projektId, z.wloczkaId, z.motki, odjeto, w.terazMs],
        );
        await tx.run('UPDATE wloczka SET motki = ?, zmieniono_ms = ? WHERE id = ?', [po, w.terazMs, z.wloczkaId]);
      }
      return { ok: true, wartosc: undefined };
    });
  } catch (e) {
    return zapisNieudany(e);
  }
}
