// Notatki tekstowe w miejscu wzoru (BR-WZR-008, ADR-0011): wiersze `notatka_rzedu` licznika ze znacznika wzoru. Wydzielone z `wzor.ts`
// (limit rozmiaru pliku, kontrola granic) bez zmiany zachowania.
import type { Wynik } from '../domena/bledy';
import type { PortBazy } from '../domena/porty';
import { licznikZnacznika } from '../dane/repozytoria/wzory';
import { wiersze } from '../dane/repozytoria/wiersze';
import { OK, blad, operacjaZapisu } from './zapis';
import { wzorDoZapisu } from './wzor';
import type { ZaleznosciPlikow } from './zaleznosci';

/** Notatka przy rzędzie wzoru; plik wzoru bez zmian (BR-WZR-008/S2). Wzór bez znacznika (bez licznika) → `niedozwolone_przejscie` (ADR-0011 uzupełnienie 2026-10-26, P-124 Q6a). */
export function dodajNotatkeWzoru(z: ZaleznosciPlikow, w: { wzorId: string; rzad: number; tekst: string }): Promise<Wynik<void>> {
  if (!Number.isInteger(w.rzad) || w.rzad < 1 || !w.tekst.trim()) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'dodajNotatkeWzoru', async (tx, teraz) => {
    if (await wzorDoZapisu(tx, w.wzorId) === 'niedozwolone_przejscie') return blad('niedozwolone_przejscie'); // wzór w koszu (fix-7)
    const licznikId = await licznikZnacznika(tx, w.wzorId);
    if (licznikId === undefined) return blad('bledne_dane');
    if (licznikId === null) return blad('niedozwolone_przejscie');
    await tx.run('INSERT INTO notatka_rzedu (id, licznik_id, rzad, tekst, zmieniono_ms) VALUES (?, ?, ?, ?, ?)', [z.id.nowy(), licznikId, w.rzad, w.tekst, teraz]);
    return OK;
  });
}

/** Zmiana treści notatki wzoru (arkusz notatki: Edit → Save, P-330 2A); notatka cudzego wzoru albo pusty tekst → `bledne_dane`. */
export function zmienNotatkeWzoru(z: ZaleznosciPlikow, w: { wzorId: string; notatkaId: string; tekst: string }): Promise<Wynik<void>> {
  const nowy = w.tekst.trim();
  if (!nowy) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'zmienNotatkeWzoru', async (tx, teraz) => {
    const stan = await notatkaDoZapisu(tx, w);
    if (stan) return blad(stan);
    await tx.run('UPDATE notatka_rzedu SET tekst = ?, zmieniono_ms = ? WHERE id = ?', [nowy, teraz, w.notatkaId]);
    return OK;
  });
}
/** Usunięcie jednej notatki wzoru („Delete note” z potwierdzeniem w UI); tylko notatka licznika ze znacznika tego wzoru. */
export function usunNotatkeWzoru(z: ZaleznosciPlikow, w: { wzorId: string; notatkaId: string }): Promise<Wynik<void>> {
  return operacjaZapisu(z, 'usunNotatkeWzoru', async (tx) => {
    const stan = await notatkaDoZapisu(tx, w);
    if (stan) return blad(stan);
    await tx.run('DELETE FROM notatka_rzedu WHERE id = ?', [w.notatkaId]);
    return OK;
  });
}
/** Notatka musi należeć do licznika ze znacznika tego wzoru (nie ruszamy notatek innych liczników); wzór w koszu → `niedozwolone_przejscie`. */
async function notatkaDoZapisu(tx: PortBazy, w: { wzorId: string; notatkaId: string }): Promise<'bledne_dane' | 'niedozwolone_przejscie' | null> {
  const stan = await wzorDoZapisu(tx, w.wzorId);
  if (stan) return stan;
  const licznikId = await licznikZnacznika(tx, w.wzorId);
  if (!licznikId) return 'bledne_dane';
  const [n] = await wiersze(tx.all('SELECT 1 AS jest FROM notatka_rzedu WHERE id = ? AND licznik_id = ?', [w.notatkaId, licznikId]), 'notatkaDoZapisu');
  return n ? null : 'bledne_dane';
}
