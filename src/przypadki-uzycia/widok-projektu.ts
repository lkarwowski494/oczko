// Model odczytu ekranu projektu (08 partia 5, A1; sygnatura 08 do przeglądu 05, P-182 Q3a): części w kolejności z licznikami (F-04, F-14),
// licznik całości sekcji (F-46, BR-LIC-018), cel części z pary (F-52, BR-PRJ-014 S1/S3), postęp (F-60, RD-14), termin i cel na dziś (F-61, RD-15),
// notatka (F-15), drut z numerem US (F-17, RD-11), powrót po przerwie (F-18, BR-PRJ-005). Same dane; teksty i daty formatuje kompozycja.
import type { Wynik } from '../domena/bledy';
import type { PortBazy } from '../domena/porty';
import { celZPary } from '../domena/cel-pary';
import { licznikCalosci } from '../domena/licznik-calosci';
import { rozmiarUS } from '../domena/obliczenia/druty';
import { postepProcent, type CelDnia } from '../domena/postep';
import type { NarzedzieProjektu } from '../domena/stany';
import { dzienProjektu } from '../dane/repozytoria/kalendarz';
import { liczba, liczbaLubNull, tekst, tekstLubNull, wiersze } from '../dane/repozytoria/wiersze';
import { czytajMiejsce } from '../domena/miejsce';
import { polozenieZnacznika } from '../domena/znacznik-wzoru';
import { znacznikWzoru } from '../dane/repozytoria/wzory';
import { odczytajUstawienie } from '../dane/repozytoria/ustawienia';
import { jestDniem } from './daty';
import { blad, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export type LicznikWidoku = { id: string; nazwa: string; rodzaj: 'rzedy' | 'oczka'; wartosc: number; znaczenie: 'skonczone' | 'w_trakcie' };
/**
 * `rzedy` = suma liczników rzędów części (jak RD-14/RD-15 w `celProjektu`); `cel` = własny cel albo, w części pary bez celu, rzędy pierwszej
 * części, gdy ma rzędy (`celZPary`, BR-PRJ-014 S1; S3: pierwsza bez rzędów → brak celu); `calosc` = `licznikCalosci` (≥ 2 liczniki rzędów, P-199 Q1a) albo null.
 */
export type CzescWidoku = { id: string; nazwa: string; rzedy: number; cel: number | null; celZPary: boolean; paraZ: string | null; calosc: number | null; liczniki: LicznikWidoku[] };
export type WidokProjektu = {
  id: string; nazwa: string; nienazwany: boolean; stan: 'w_toku' | 'ukonczony'; utworzonoMs: number; zmienionoMs: number; ostatniaPracaMs: number;
  notatka: string; narzedzie: NarzedzieProjektu; drutMm: number | null; drutUS: string | null; terminDzien: string | null; celDnia: CelDnia | null; zrobioneDzis: number;
  postep: { rodzaj: 'procent'; wartosc: number } | { rodzaj: 'brak-celow' }; czesci: CzescWidoku[];
  ukonczonoDzien: string | null; // dzień lokalny ukończenia (F-51, `ukonczono_dzien`); w toku null
  probka: ProbkaProjektu | null;  // U-10: `projekt.probka` {oczka, na_cm}; brak albo zły zapis = null
  /** Miejsce we wzorze (F-18, BR-PRJ-005/S1): strona (od 1) i rząd znacznika ostatnio oglądanego wzoru, a bez niego pierwszego ze znacznikiem; brak znacznika albo rząd przed schematem = null. */
  miejsceWzoru: { strona: number; rzad: number | null } | null; // rzad null: znana tylko strona (ostatnie_miejsce), rzędu nie zgadujemy (aneks 04, poz. 3)
  /** Włóczki przypisane do projektu (wiersz „Yarn” w Details, 07-jakosc-001), po nazwie; także usunięte do kosza (historia zużycia zostaje). */
  wloczki: { id: string; nazwa: string }[];
};
export type ProbkaProjektu = { oczka: number; naCm: 10 | 10.16 };

/** `projekt.probka` (JSON z bazy, `unknown`) → próbka albo brak; podstawa tylko 10 cm albo 4 in (10,16 cm, JED-006). */
export function parsujProbke(tekstJson: string): ProbkaProjektu | null {
  let v: unknown;
  try { v = JSON.parse(tekstJson); } catch { return null; }
  if (typeof v !== 'object' || v === null || !('oczka' in v) || !('na_cm' in v)) return null;
  const { oczka, na_cm: naCm } = v;
  if (typeof oczka !== 'number' || !Number.isFinite(oczka) || oczka <= 0) return null;
  return naCm === 10 || naCm === 10.16 ? { oczka, naCm } : null;
}

const rodzaj = (t: string): LicznikWidoku['rodzaj'] => (t === 'oczka' ? 'oczka' : 'rzedy'); // CHECK schematu: tylko te dwie wartości
const znaczenie = (t: string): LicznikWidoku['znaczenie'] => (t === 'w_trakcie' ? 'w_trakcie' : 'skonczone');

/** Projekt w koszu albo nieistniejący → `bledne_dane` (jak `widokLicznika`). */
export function widokProjektu(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<WidokProjektu>> {
  return operacjaZapisu(z, 'widokProjektu', async (tx, _teraz, chwila) => {
    const [p] = await wiersze(tx.all(
      'SELECT id, nazwa, nienazwany, stan, notatka, drut_mm, narzedzie, probka, termin_dzien, ukonczono_dzien, utworzono_ms, zmieniono_ms, ostatnia_praca_ms FROM projekt WHERE id = ? AND usunieto_ms IS NULL',
      [w.projektId]), 'widokProjektu');
    if (!p) return blad('bledne_dane');
    const czesci = await wiersze(tx.all('SELECT id, nazwa, cel_rzedow, para_z FROM czesc WHERE projekt_id = ? AND usunieto_ms IS NULL ORDER BY kolejnosc, id', [w.projektId]), 'widokProjektu');
    const liczniki = await wiersze(tx.all(
      `SELECT l.id, l.czesc_id, l.nazwa, l.rodzaj, l.wartosc, l.znaczenie FROM licznik l JOIN czesc c ON c.id = l.czesc_id
        WHERE c.projekt_id = ? AND c.usunieto_ms IS NULL AND l.usunieto_ms IS NULL ORDER BY l.kolejnosc, l.id`, [w.projektId]), 'widokProjektu');
    const kawalek = liczniki.map((l) => ({ id: tekst(l, 'id'), czescId: tekst(l, 'czesc_id'), rodzaj: rodzaj(tekst(l, 'rodzaj')), wartosc: liczba(l, 'wartosc') }));
    const rzedyCzesci = new Map<string, number>();
    for (const l of kawalek) if (l.rodzaj === 'rzedy') rzedyCzesci.set(l.czescId, (rzedyCzesci.get(l.czescId) ?? 0) + l.wartosc);
    const wynik: CzescWidoku[] = czesci.map((c) => {
      const id = tekst(c, 'id');
      const paraZ = tekstLubNull(c, 'para_z');
      const wlasny = liczbaLubNull(c, 'cel_rzedow');
      const cel = celZPary({ cel: wlasny, paraZ, rzedyPary: paraZ === null ? 0 : rzedyCzesci.get(paraZ) ?? 0 });
      return {
        id, nazwa: tekst(c, 'nazwa'), rzedy: rzedyCzesci.get(id) ?? 0, cel, celZPary: wlasny === null && cel !== null, paraZ,
        calosc: licznikCalosci(kawalek, id),
        liczniki: liczniki.filter((l) => tekst(l, 'czesc_id') === id).map((l) => ({
          id: tekst(l, 'id'), nazwa: tekst(l, 'nazwa'), rodzaj: rodzaj(tekst(l, 'rodzaj')), wartosc: liczba(l, 'wartosc'), znaczenie: znaczenie(tekst(l, 'znaczenie')),
        })),
      };
    });
    const proc = postepProcent(wynik.map((c) => ({ rzedy: c.rzedy, cel: c.cel })));
    const drutMm = liczbaLubNull(p, 'drut_mm');
    const narzedzie: NarzedzieProjektu = tekst(p, 'narzedzie') === 'szydelko' ? 'szydelko' : 'druty'; // CHECK schematu: tylko te dwie
    const termin = tekstLubNull(p, 'termin_dzien');
    const dzien = termin ? await dzienProjektu(tx, w.projektId, termin, chwila.dzien) : { cel: null, zrobioneDzis: 0 };
    const miejsceWzoru = await miejsceWzoruProjektu(tx, w.projektId);
    const wloczki = (await wiersze(tx.all('SELECT w.id, w.nazwa FROM projekt_wloczka pw JOIN wloczka w ON w.id = pw.wloczka_id WHERE pw.projekt_id = ? ORDER BY w.nazwa COLLATE NOCASE, w.id', [w.projektId]), 'widokProjektu'))
      .map((x) => ({ id: tekst(x, 'id'), nazwa: tekst(x, 'nazwa') }));
    return {
      ok: true,
      wartosc: {
        id: w.projektId, nazwa: tekst(p, 'nazwa'), nienazwany: liczba(p, 'nienazwany') === 1, stan: tekst(p, 'stan') === 'ukonczony' ? 'ukonczony' : 'w_toku',
        utworzonoMs: liczba(p, 'utworzono_ms'), zmienionoMs: liczba(p, 'zmieniono_ms'), ostatniaPracaMs: liczba(p, 'ostatnia_praca_ms'),
        notatka: tekst(p, 'notatka'), narzedzie, drutMm, drutUS: drutMm === null ? null : rozmiarUS(drutMm, narzedzie),
        terminDzien: termin, celDnia: dzien.cel, zrobioneDzis: dzien.zrobioneDzis,
        postep: proc.ok ? { rodzaj: 'procent', wartosc: proc.wartosc } : { rodzaj: 'brak-celow' }, czesci: wynik, ukonczonoDzien: tekstLubNull(p, 'ukonczono_dzien'),
        probka: parsujProbke(tekst(p, 'probka')), miejsceWzoru, wloczki,
      },
    };
  });
}
/** Znacznik ostatnio oglądanego wzoru projektu (`ostatnie_miejsce.wzor`), inaczej pierwszego wzoru ze znacznikiem; położenie liczy `polozenieZnacznika` (jak widok wzoru). */
async function miejsceWzoruProjektu(tx: PortBazy, projektId: string): Promise<WidokProjektu['miejsceWzoru']> {
  const ids = (await wiersze(tx.all('SELECT id FROM wzor WHERE projekt_id = ? AND usunieto_ms IS NULL ORDER BY zmieniono_ms DESC, id', [projektId]), 'widokProjektu')).map((x) => tekst(x, 'id'));
  const m = await odczytajUstawienie(tx, 'ostatnie_miejsce');
  const ostatni = m && typeof m === 'object' && 'wzor' in m && typeof m.wzor === 'string' ? m.wzor : null;
  const kolejnosc = ostatni && ids.includes(ostatni) ? [ostatni, ...ids.filter((x) => x !== ostatni)] : ids;
  for (const id of kolejnosc) {
    const zn = await znacznikWzoru(tx, id);
    if (!zn) continue;
    const [l] = await wiersze(tx.all('SELECT wartosc FROM licznik WHERE id = ? AND usunieto_ms IS NULL', [zn.licznikId]), 'widokProjektu');
    const p = l ? polozenieZnacznika(zn, liczba(l, 'wartosc')) : null;
    if (p?.ok && !p.wartosc.przedSchematem) return { strona: p.wartosc.strona + 1, rzad: p.wartosc.rzad };
  }
  // Brak znacznika z rzędem: zapisana strona ostatnio oglądanego wzoru tego projektu → samo „Page N” (aneks 04, poz. 3; strona od 0 jak `znacznik.strona`).
  const zapisane = czytajMiejsce(m);
  return zapisane?.wzor && ids.includes(zapisane.wzor) && zapisane.strona !== undefined ? { strona: zapisane.strona + 1, rzad: null } : null;
}
/** Podgląd celu na dziś dla wybranej daty w arkuszu „Done by” (RD-15, design-spec) — odczyt bez zapisu; bez celów części → null. */
export function podgladTerminu(z: Zaleznosci, w: { projektId: string; terminDzien: string }): Promise<Wynik<CelDnia | null>> {
  if (!jestDniem(w.terminDzien)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'podgladTerminu', async (tx, _teraz, chwila) => ({ ok: true, wartosc: (await dzienProjektu(tx, w.projektId, w.terminDzien, chwila.dzien)).cel }));
}
