// Kopia spójna bazy przez VACUUM INTO, nigdy kopia samego pliku (dane.md, eksperyment D, docs/niezawodnosc/eksperymenty/wal-kopia.out).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
import type { Wynik } from '../../domena/bledy';
import type { PortBazy } from '../../domena/porty';
import { istniejePlik, katalogPliku, rozmiar, usunPlik, utworzKatalog } from '../pliki/system';
import { powodBledu } from './bledy-sqlite';

/** Cel nie może istnieć (VACUUM INTO nie nadpisuje); niepełny plik po błędzie jest usuwany (moduly.md „Import archiwum”, P-118 W3). */
export async function kopiaBazy(baza: PortBazy, cel: string): Promise<Wynik<{ bajty: number }>> {
  if (istniejePlik(cel)) return { ok: false, powod: 'zapis' };
  try {
    utworzKatalog(katalogPliku(cel));
    await baza.run('VACUUM INTO ?', [cel]); // poza transakcją (VACUUM nie działa w transakcji), w kolejce portu
    return { ok: true, wartosc: { bajty: rozmiar(cel) } };
  } catch (e) {
    usunPlik(cel);
    const powod = powodBledu(e);
    return { ok: false, powod: powod === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' };
  }
}
