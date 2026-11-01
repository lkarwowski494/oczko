// Kompozycja listy projektów (F-50, F-54, P-065 (2a)): etykieta projektu roboczego w bieżącym języku i wyszukiwanie po niej (design-spec
// „Projekt roboczy”: w wyszukiwaniu ta sama etykieta). Opis wiersza: część i rząd dziergany — klucze „row 47 of 96 · today” z makiety
// ekrany.html `projekty` nie są jeszcze w słowniku 04 (zgłoszenie 08 partia 4, 3A), więc opis używa istniejącego `licznik.teraz`.
import type { StanListyProjektow, WierszProjektu } from '../ekrany/ListaProjektow';
import { widokProjektow, type ProjektNaEkranie, type WidokProjektow } from '../przypadki-uzycia/widok-projektow';
import type { Zaleznosci } from '../przypadki-uzycia/zaleznosci';
import { projektyZFilmem } from '../przypadki-uzycia/film';
import { etykietaRobocza, type Jezyk } from './licznik';
import { czasPracy } from './ukonczenie';
import { liniaDzis, ostatniaPraca } from './projekt';

const nazwaMiesiaca = (dzien: string, j: string) =>
  new Intl.DateTimeFormat(j, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(Number(dzien.slice(0, 4)), Number(dzien.slice(5, 7)) - 1, 1)));

/** Dzień ukończenia jako krótka data regionu, z rokiem tylko gdy inny niż bieżący (design-spec 027); dzień RRRR-MM-DD w UTC, więc się nie przesuwa (RD-16). */
function ukonczonoData(dzien: string, jezyk: string, terazMs: number, strefa: string): string {
  const [r, m, d] = dzien.split('-').map(Number);
  const rokTeraz = Number(new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: strefa }).format(new Date(terazMs)));
  return new Intl.DateTimeFormat(jezyk, { month: 'short', day: 'numeric', ...(r === rokTeraz ? {} : { year: 'numeric' }), timeZone: 'UTC' }).format(new Date(Date.UTC(r, m - 1, d)));
}

export function stanListy(w: WidokProjektow, o: { zapytanie: string; j: Jezyk; terazMs: number; strefa: string }): StanListyProjektow {
  const { j } = o;
  const szukaj = o.zapytanie.trim().toLocaleLowerCase();
  const wiersz = (p: ProjektNaEkranie, wToku: boolean): WierszProjektu => {
    const nazwa = p.nienazwany ? etykietaRobocza(p.utworzonoMs, o.terazMs, j, o.strefa) : p.nazwa;
    // Wiersz w toku: „{część} · row {n} of {cel}” (design-spec „Lista projektów”; n = liczba widoczna na liczniku); projekt roboczy bez nazwy części: „Now knitting row n”.
    const opis = !p.licznik ? '' : p.nienazwany ? j.t('licznik.teraz', { n: p.licznik.wartosc + 1 })
      : p.licznik.cel === null ? j.t('projekty.wiersz', { czesc: p.licznik.czesc, n: p.licznik.wartosc }) : j.t('projekty.wiersz_cel', { czesc: p.licznik.czesc, n: p.licznik.wartosc, cel: p.licznik.cel });
    if (!wToku && p.ukonczonoDzien) { // lista ukończonych: „Finished {data} · {czas}” bez stopera sama data, nigdy „0 min” (BR-PRJ-006/S1, design-spec 027)
      const data = ukonczonoData(p.ukonczonoDzien, j.jezyk(), o.terazMs, o.strefa), czas = p.czasPracyMs === null ? null : czasPracy(p.czasPracyMs, j);
      return { id: p.id, nazwa, kolorWloczki: null, opis: czas === null ? j.t('projekty.ukonczono_bez_czasu', { data }) : j.t('projekty.ukonczono_wiersz', { data, czas }),
        etykieta: czas === null ? j.t('projekty.ukonczono_bez_czasu_a11y', { nazwa, data }) : j.t('projekty.ukonczono_a11y', { nazwa, data, czas }) };
    }
    return { id: p.id, nazwa, opis, kolorWloczki: null, ...(wToku ? { termin: liniaDzis(p.dzis, j.t), ostatniaPraca: ostatniaPraca(p.dniOdPracy, j.t) } : {}) };
  };
  const filtr = (l: ProjektNaEkranie[], wToku = false) => l.map((p) => wiersz(p, wToku)).filter((x) => !szukaj || x.nazwa.toLocaleLowerCase().includes(szukaj));
  return {
    wToku: filtr(w.wToku, true), ukonczone: filtr(w.ukonczone), zapytanie: o.zapytanie, kosz: w.kosz,
    dni: w.dni && { zostalo: w.dni.zostalo, limit: w.dni.limit, miesiac: nazwaMiesiaca(w.dni.dzis, j.jezyk()) },
  };
}

/** Projekty w toku dla arkusza skrzynki (R2): kolejność i nazwy jak na liście projektów, bez filtra wyszukiwania; błąd odczytu = pusta lista („New project” zostaje). */
export async function projektyDoSkrzynki(z: Zaleznosci, j: Jezyk): Promise<{ id: string; nazwa: string; film: boolean }[]> {
  const w = await widokProjektow(z);
  if (!w.ok) return [];
  const f = await projektyZFilmem(z);
  const zFilmem = new Set(f.ok ? f.wartosc : []); // P-283 (a): linia „zastąpi” przy „Video link”
  const ch = z.zegar.teraz();
  return stanListy(w.wartosc, { zapytanie: '', j, terazMs: ch.ms, strefa: ch.strefa }).wToku.map((p) => ({ id: p.id, nazwa: p.nazwa, film: zFilmem.has(p.id) }));
}
