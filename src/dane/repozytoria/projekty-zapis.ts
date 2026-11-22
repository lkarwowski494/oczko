// Odczyt stanu projektu, części i licznika dla maszyny projektu (moduly.md „Projekt”, ADR-0013) i kopie struktury projektu (F-20, BR-PRJ-014).
import type { Projekt } from '../../domena/maszyny/projekt';
import type { PortBazy } from '../../domena/porty';
import { liczbaLubNull, tekst, wiersze } from './wiersze';

export async function stanProjektu(tx: PortBazy, projektId: string): Promise<Projekt | null> {
  const [w] = await wiersze(tx.all('SELECT stan, ukonczono_ms, usunieto_ms FROM projekt WHERE id = ?', [projektId]), 'stanProjektu');
  if (!w) return null;
  return { stan: tekst(w, 'stan') === 'ukonczony' ? 'ukonczony' : 'w_toku', ukonczonoMs: liczbaLubNull(w, 'ukonczono_ms'), usunietoMs: liczbaLubNull(w, 'usunieto_ms') };
}
/**
 * `ukonczonoDzien`: dzień lokalny RD-16 zapisany przy ukończeniu (moduly.md „Ukończone w tygodniu…”, P-124 Q5a); `undefined` = kolumna bez zmian
 * (usuń, przywróć), a ukończenie zdjęte (`ukonczonoMs = null`) zawsze czyści też dzień (CHECK tabeli).
 */
export async function zapiszStanProjektu(tx: PortBazy, projektId: string, p: Projekt, terazMs: number, ukonczonoDzien?: string | null): Promise<void> {
  const dzien = p.ukonczonoMs === null ? null : ukonczonoDzien;
  if (dzien === undefined) {
    await tx.run('UPDATE projekt SET stan = ?, ukonczono_ms = ?, usunieto_ms = ?, zmieniono_ms = ? WHERE id = ?', [p.stan, p.ukonczonoMs, p.usunietoMs, terazMs, projektId]);
  } else {
    await tx.run('UPDATE projekt SET stan = ?, ukonczono_ms = ?, ukonczono_dzien = ?, usunieto_ms = ?, zmieniono_ms = ? WHERE id = ?', [p.stan, p.ukonczonoMs, dzien, p.usunietoMs, terazMs, projektId]);
  }
}
/** Usunięcie (kosz) części albo licznika: `usunieto_ms`; tabela z zamkniętej listy (nazwa tabeli nie jest parametrem SQL). */
export type TabelaKosza = 'czesc' | 'licznik';
export async function usunietoMs(tx: PortBazy, tabela: TabelaKosza, id: string): Promise<{ jest: boolean; usunietoMs: number | null }> {
  const [w] = await wiersze(tx.all(`SELECT usunieto_ms FROM ${tabela === 'czesc' ? 'czesc' : 'licznik'} WHERE id = ?`, [id]), 'usunietoMs');
  return w ? { jest: true, usunietoMs: liczbaLubNull(w, 'usunieto_ms') } : { jest: false, usunietoMs: null };
}
export async function ustawUsuniecie(tx: PortBazy, tabela: TabelaKosza, id: string, ms: number | null, terazMs: number): Promise<void> {
  await tx.run(`UPDATE ${tabela === 'czesc' ? 'czesc' : 'licznik'} SET usunieto_ms = ?, zmieniono_ms = ? WHERE id = ?`, [ms, terazMs, id]);
}
