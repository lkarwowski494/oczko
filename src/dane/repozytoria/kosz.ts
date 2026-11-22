// Pozycje „Recently deleted” (F-33, BR-DAN-008, P-026): projekty w koszu oraz części i liczniki w koszu, których rodzic nie jest w koszu
// (przywrócenie rodzica przywraca je razem z nim — C1, design-spec „Ekran Recently deleted”). Termin = dzień usunięcia (RD-16) + KOSZ_DNI.
// Partia 6 (P-229): wzór w koszu, gdy jego projekt nie jest w koszu (wzór projektu w koszu idzie z projektem).
// P-209: włóczka i narzędzie w koszu tylko w terminie (teraz − usunieto_ms < KOSZ_DNI dób) — włóczka ukryta na stałe nie wraca.
import { dzienLokalny } from '../../domena/postep';
import type { PortBazy } from '../../domena/porty';
import { KOSZ_DNI } from '../../konfiguracja';
import { BladDanych } from '../../domena/bledy';
import { liczba, tekst, tekstLubNull, wiersze } from './wiersze';

const plusDni = (dzien: string, n: number): string => { const [r, m, d] = dzien.split('-').map(Number); return new Date(Date.UTC(r, m - 1, d + n)).toISOString().slice(0, 10); };

export type ElementKosza = {
  rodzaj: 'projekt' | 'czesc' | 'licznik' | 'wzor' | 'wloczka' | 'narzedzie'; id: string; nazwa: string; rodzajLicznika: 'rzedy' | 'oczka' | null;
  /** Projekt (sam albo rodzic części/licznika): nazwa zapasowa projektu roboczego to data — etykietę liczy kompozycja (dane.md „Projekt roboczy”). */
  projekt: string; projektNienazwany: boolean; projektUtworzonoMs: number; czesc: string | null; usunietoMs: number; doDnia: string;
  /** Tylko dla narzędzia: rodzaj, rozmiar i opis (nazwę formatuje kompozycja, RD-11/RD-19). */
  narzedzie?: { rodzaj: 'druty' | 'szydelko' | 'inne'; rozmiarMm: number | null; opis: string } | null;
};

const SQL = `
  SELECT 'projekt' AS rodzaj, p.id, p.nazwa, NULL AS rodzaj_licznika, p.nazwa AS projekt, p.nienazwany, p.utworzono_ms, NULL AS czesc, p.usunieto_ms
    FROM projekt p WHERE p.usunieto_ms IS NOT NULL
  UNION ALL
  SELECT 'czesc', c.id, c.nazwa, NULL, p.nazwa, p.nienazwany, p.utworzono_ms, NULL, c.usunieto_ms
    FROM czesc c JOIN projekt p ON p.id = c.projekt_id WHERE c.usunieto_ms IS NOT NULL AND p.usunieto_ms IS NULL
  UNION ALL
  SELECT 'licznik', l.id, l.nazwa, l.rodzaj, p.nazwa, p.nienazwany, p.utworzono_ms, c.nazwa, l.usunieto_ms
    FROM licznik l JOIN czesc c ON c.id = l.czesc_id JOIN projekt p ON p.id = c.projekt_id
   WHERE l.usunieto_ms IS NOT NULL AND c.usunieto_ms IS NULL AND p.usunieto_ms IS NULL
  UNION ALL
  SELECT 'wzor', w.id, w.nazwa, NULL, p.nazwa, p.nienazwany, p.utworzono_ms, NULL, w.usunieto_ms
    FROM wzor w JOIN projekt p ON p.id = w.projekt_id WHERE w.usunieto_ms IS NOT NULL AND p.usunieto_ms IS NULL
  UNION ALL
  SELECT 'wloczka', w.id, w.nazwa, NULL, '', 0, 0, NULL, w.usunieto_ms FROM wloczka w WHERE w.usunieto_ms IS NOT NULL AND w.usunieto_ms > ?1
  UNION ALL
  SELECT 'narzedzie', n.id, n.opis, n.rodzaj || ':' || ifnull(n.rozmiar_mm, ''), '', 0, 0, NULL, n.usunieto_ms FROM narzedzie n WHERE n.usunieto_ms IS NOT NULL AND n.usunieto_ms > ?1
  ORDER BY usunieto_ms, id`;
const DOBA_MS = 86_400_000;
const RODZAJE_NARZEDZI = ['druty', 'szydelko', 'inne'] as const;

/** Od najkrótszego terminu (najdawniej usunięte). `strefa` = strefa chwili odczytu (dzień usunięcia liczony lokalnie, RD-16). */
export async function elementyKosza(baza: PortBazy, strefa: string, terazMs: number): Promise<ElementKosza[]> {
  return (await wiersze(baza.all(SQL, [terazMs - KOSZ_DNI * DOBA_MS]), 'elementyKosza')).map((r): ElementKosza => {
    const usunietoMs = liczba(r, 'usunieto_ms');
    const dzien = dzienLokalny(usunietoMs, strefa);
    if (!dzien.ok) throw new BladDanych(`elementyKosza: strefa ${strefa}`); // brak terminu nie jest zgadywany
    const rl = tekstLubNull(r, 'rodzaj_licznika');
    const rodzaj = tekst(r, 'rodzaj');
    if (rodzaj === 'narzedzie') {
      const [rn, mm] = (rl ?? '').split(':');
      const r2 = RODZAJE_NARZEDZI.find((x) => x === rn);
      if (!r2) throw new BladDanych(`elementyKosza: rodzaj narzędzia ${String(rn)}`);
      const rozmiarMm = mm ? Number(mm) : null;
      return { rodzaj: 'narzedzie', id: tekst(r, 'id'), nazwa: tekst(r, 'nazwa'), rodzajLicznika: null, projekt: '', projektNienazwany: false, projektUtworzonoMs: 0,
        czesc: null, usunietoMs, doDnia: plusDni(dzien.wartosc, KOSZ_DNI), narzedzie: { rodzaj: r2, rozmiarMm: rozmiarMm !== null && Number.isFinite(rozmiarMm) ? rozmiarMm : null, opis: tekst(r, 'nazwa') } };
    }
    return {
      rodzaj: rodzaj === 'projekt' ? 'projekt' : rodzaj === 'czesc' ? 'czesc' : rodzaj === 'wloczka' ? 'wloczka' : rodzaj === 'wzor' ? 'wzor' : 'licznik', id: tekst(r, 'id'), nazwa: tekst(r, 'nazwa'),
      rodzajLicznika: rl === null ? null : rl === 'oczka' ? 'oczka' : 'rzedy', projekt: tekst(r, 'projekt'), projektNienazwany: liczba(r, 'nienazwany') === 1,
      projektUtworzonoMs: liczba(r, 'utworzono_ms'), czesc: tekstLubNull(r, 'czesc'), usunietoMs,
      doDnia: plusDni(dzien.wartosc, KOSZ_DNI),
    };
  });
}
