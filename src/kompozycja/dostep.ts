// Dostęp Pro w aplikacji (ADR-0010, KP-06, P-103 (3a)): odczyt transakcji ze sklepu → `decyzja` (domena); błąd odczytu → pamięć ostatniego stanu
// z oknem offline. Pamięć w pliku poza bazą (KP-06: poza danymi synchronizowanymi i archiwum). Poziom dla okna „Uczciwe zasady”: pewny stan
// darmowy tylko po udanym odczycie sklepu (P-103 (5a)); błąd odczytu bez Pro = „niepewny”.
import { decyzja, odczytajPamiec, type Pamiec } from '../domena/dostep';
import type { PoziomDostepu } from '../domena/limit';
import type { Sklep } from '../domena/porty';
import { PRODUKT_DOZYWOTNI, PRODUKTY_PRO } from '../konfiguracja';
import type { AktywnePro } from '../ekrany/Oferty';

export type MagazynPamieci = { czytaj(): Promise<string | null>; zapisz(tekst: string): Promise<void> };
export type StanDostepu = { pro: boolean; poziom: PoziomDostepu; aktywne: AktywnePro; wygasa: number | null };

export function dostepPro(sklep: Sklep, magazyn: MagazynPamieci, terazMs: () => number) {
  let stan: StanDostepu = { pro: false, poziom: 'niepewny', aktywne: null, wygasa: null };
  const sluchacze = new Set<(s: StanDostepu) => void>();
  let ostatni = 0; // numer odczytu, którego wynik ustawił stan — późny wynik starszego odczytu nie nadpisuje nowszego
  let licznikOdczytow = 0;
  type Transakcje = Awaited<ReturnType<Sklep['transakcje']>>;
  async function zastosuj(nr: number, pamiec: Pamiec, transakcje: Transakcje | null): Promise<StanDostepu> {
    if (nr < ostatni) return stan;
    ostatni = nr;
    const d = decyzja(transakcje ? { zrodlo: 'sklep', uprawnienia: transakcje } : { zrodlo: 'blad' }, pamiec, terazMs(), PRODUKTY_PRO);
    if (transakcje) await magazyn.zapisz(JSON.stringify(d.pamiec ?? { produkty: [], wygasa: null })).catch(() => undefined);
    const produkty = d.pamiec?.produkty ?? [];
    const subskrypcja = produkty.find((p) => p !== PRODUKT_DOZYWOTNI);
    const aktywne: AktywnePro = !d.dostep ? null
      : !produkty.includes(PRODUKT_DOZYWOTNI) ? { rodzaj: 'subskrypcja', produkt: produkty[0] ?? '' }
      : subskrypcja === undefined ? { rodzaj: 'dozywotni' } : { rodzaj: 'dozywotni', subskrypcja }; // M1-091 (KP-14): subskrypcja trwa obok dożywotniego
    stan = { pro: d.dostep, poziom: d.dostep ? 'pro' : transakcje ? 'darmowa' : 'niepewny', aktywne, wygasa: d.pamiec?.wygasa ?? null };
    sluchacze.forEach((f) => f(stan));
    return stan;
  }
  /** `limitMs` (M1-022, P-396): sklep bez odpowiedzi w limicie → decyzja jak przy błędzie odczytu (pamięć offline); wynik sklepu, który
   *  przyjdzie później, ustawia stan i trafia do słuchaczy `naZmiane`. Bez limitu: czeka na sklep. */
  async function odswiez(limitMs?: number): Promise<StanDostepu> {
    const nr = ++licznikOdczytow;
    let pamiec: Pamiec = null;
    try { pamiec = odczytajPamiec(await magazyn.czytaj()); } catch { pamiec = null; }
    const odczyt: Promise<Transakcje | null> = (async () => sklep.transakcje())().then((t) => t, () => null); // także wyjątek synchroniczny = błąd odczytu
    if (limitMs === undefined) return zastosuj(nr, pamiec, await odczyt);
    let zegar: ReturnType<typeof setTimeout> | undefined;
    const PO_LIMICIE = Symbol('po-limicie');
    const wynik = await Promise.race([odczyt, new Promise<typeof PO_LIMICIE>((r) => { zegar = setTimeout(() => r(PO_LIMICIE), limitMs); })]);
    clearTimeout(zegar);
    if (wynik !== PO_LIMICIE) return zastosuj(nr, pamiec, wynik);
    void odczyt.then((t) => (t ? zastosuj(nr, pamiec, t) : undefined)).catch(() => undefined);
    return zastosuj(nr, pamiec, null);
  }
  return {
    odswiez,
    stan: () => stan,
    naZmiane(f: (s: StanDostepu) => void) { sluchacze.add(f); return () => void sluchacze.delete(f); },
    /** KP-07: nasłuch transakcji od startu; każda zmiana → ponowna decyzja. */
    nasluchuj: () => sklep.obserwuj(() => { void odswiez(); }),
  };
}
export type DostepPro = ReturnType<typeof dostepPro>;
