// Odczyt danych „Dziś” (M3 p2): tylko istniejące odczyty (ZM-18 wiersz „08 (p2)”) — `widokProjektow`, `widokHistorii` dla miesięcy bieżącego tygodnia,
// widok licznika (plany przypomnień) i miejsce pracy z kompozycji; model ekranu liczy `daneDzis` (czysta funkcja).
import type { DaneDzis } from '../ekrany/Dzis';
import { widokHistorii } from '../przypadki-uzycia/historia';
import { widokProjektow } from '../przypadki-uzycia/widok-projektow';
import { daneDzis, miesiaceTygodnia } from './dzis';
import type { Kontener } from './kontener';
import type { KompozycjaLicznika } from './licznik';

export async function wczytajDzis(kontener: Pick<Kontener, 'z' | 'j'>, licznik: Pick<KompozycjaLicznika, 'widok' | 'miejsce'>): Promise<DaneDzis | null> {
  const dzis = kontener.z.zegar.teraz().dzien;
  const [p, m, w] = await Promise.all([widokProjektow(kontener.z), licznik.miejsce(), licznik.widok()]);
  const h = await Promise.all(miesiaceTygodnia(dzis).map((miesiac) => widokHistorii(kontener.z, { miesiac, dzien: dzis })));
  if (!p.ok || !m.ok || h.some((x) => !x.ok)) return null;
  return daneDzis({
    dzis,
    historia: h.flatMap((x, i) => (x.ok ? [{ dniRobotki: x.wartosc.dniRobotki, dzien: miesiaceTygodnia(dzis)[i] === dzis.slice(0, 7) ? x.wartosc.dzien : [] }] : [])), // rzędy dnia raz
    projekty: { wToku: p.wartosc.wToku.length, dni: p.wartosc.dni },
    licznik: w && { projektId: w.projektId, dziergany: w.wartosc + 1, plany: w.plany },
    miejsce: m.wartosc,
  }, kontener.j);
}
