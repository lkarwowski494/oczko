// Zapas i narzędzia (F-37, BR-ZAP-001/003/004; P-191 P8a; 08 partia 5 grupa D) oraz zapis zużycia włóczki z karty ukończenia (F-37, BR-ZAP-002, U-9, P-126 (2a)): pozycja kolejki przypadków użycia wokół potwierdzZuzycie
// (jedna transakcja, różnica względem poprzedniego potwierdzenia, zapas nie poniżej 0). Nieudany zapis: wpis w `blad`, wynik do ekranu.
import type { Wynik } from '../domena/bledy';
import { potwierdzZuzycie } from '../dane/repozytoria/zapas';
import { zapiszBlad } from '../dane/repozytoria/bledy';
import { liczba, liczbaLubNull, tekst, tekstLubNull, wiersze } from '../dane/repozytoria/wiersze';
import { wKolejce } from './kolejka';
import { blad, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export function zapiszZuzycie(z: Pick<Zaleznosci, 'baza' | 'zegar'>, w: { projektId: string; zuzycie: { wloczkaId: string; motki: number }[] }): Promise<Wynik<void>> {
  return wKolejce(z.baza, async () => {
    const terazMs = z.zegar.teraz().ms;
    const r = await potwierdzZuzycie(z.baza, { projektId: w.projektId, zuzycie: w.zuzycie, terazMs });
    if (!r.ok && r.powod !== 'bledne_dane') await zapiszBlad(z.baza, { czasMs: terazMs, kod: 'zapis_zuzycie', szczegoly: { powod: r.powod } }).catch(() => undefined);
    return r;
  });
}

export type FormularzWloczki = {
  nazwa: string; producent: string; sklad: string; kolor: string; kategoria: number | null; motki: number;
  dlugoscMotkaM: number | null; wagaMotkaG: number | null; pielegnacja: string; notatka: string;
};
export type WloczkaPelna = FormularzWloczki & { id: string; zdjecieSha: string | null };
export type WierszZapasu = { id: string; nazwa: string; kategoria: number | null; motki: number; dlugoscMotkaM: number | null; wagaMotkaG: number | null; zdjecieSha: string | null };
export type RodzajNarzedzia = 'druty' | 'szydelko' | 'inne';
export type Narzedzie = { id: string; rodzaj: RodzajNarzedzia; rozmiarMm: number | null; opis: string };

const nieujemna = (v: number): boolean => Number.isFinite(v) && v >= 0;
const dodatniaLubNull = (v: number | null): boolean => v === null || (Number.isFinite(v) && v > 0);
const RODZAJE: readonly RodzajNarzedzia[] = ['druty', 'szydelko', 'inne'];

/** Włóczka z arkusza (P-191 P8a): UPSERT kolumn formularza; `usunieto_ms`, zdjęcia etykiety i przypisania do projektów zostają (zasada 10). */
export function zapiszWloczke(z: Zaleznosci, w: FormularzWloczki & { id?: string }): Promise<Wynik<{ id: string }>> {
  const nazwa = w.nazwa.trim();
  const kategoriaOk = w.kategoria === null || (Number.isInteger(w.kategoria) && w.kategoria >= 0 && w.kategoria <= 7);
  if (!nazwa || !nieujemna(w.motki) || !dodatniaLubNull(w.dlugoscMotkaM) || !dodatniaLubNull(w.wagaMotkaG) || !kategoriaOk) return Promise.resolve(blad('bledne_dane'));
  const id = w.id ?? z.id.nowy();
  return operacjaZapisu(z, 'zapiszWloczke', async (tx, teraz) => {
    await tx.run(
      `INSERT INTO wloczka (id, nazwa, producent, sklad, kolor, waga_motka_g, dlugosc_motka_m, motki, kategoria, pielegnacja, notatka, zmieniono_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET nazwa = excluded.nazwa, producent = excluded.producent, sklad = excluded.sklad, kolor = excluded.kolor,
         waga_motka_g = excluded.waga_motka_g, dlugosc_motka_m = excluded.dlugosc_motka_m, motki = excluded.motki, kategoria = excluded.kategoria,
         pielegnacja = excluded.pielegnacja, notatka = excluded.notatka, zmieniono_ms = excluded.zmieniono_ms`,
      [id, nazwa, w.producent.trim(), w.sklad.trim(), w.kolor.trim(), w.wagaMotkaG, w.dlugoscMotkaM, w.motki, w.kategoria, w.pielegnacja.trim(), w.notatka.trim(), teraz],
    );
    return { ok: true, wartosc: { id } };
  });
}

const ZDJECIE_ETYKIETY = '(SELECT plik_sha256 FROM zdjecie WHERE zdjecie.wloczka_id = wloczka.id ORDER BY utworzono_ms, id LIMIT 1) AS zdjecie';

/** Jedna włóczka do arkusza edycji; usunięta albo brak → `bledne_dane`. */
export async function wloczka(z: Pick<Zaleznosci, 'baza'>, id: string): Promise<Wynik<WloczkaPelna>> {
  const [r] = await wiersze(z.baza.all(
    `SELECT id, nazwa, producent, sklad, kolor, kategoria, motki, dlugosc_motka_m, waga_motka_g, pielegnacja, notatka, ${ZDJECIE_ETYKIETY}
     FROM wloczka WHERE id = ? AND usunieto_ms IS NULL`, [id]), 'wloczka');
  if (!r) return blad('bledne_dane');
  return { ok: true, wartosc: {
    id: tekst(r, 'id'), nazwa: tekst(r, 'nazwa'), producent: tekst(r, 'producent'), sklad: tekst(r, 'sklad'), kolor: tekst(r, 'kolor'),
    kategoria: liczbaLubNull(r, 'kategoria'), motki: liczba(r, 'motki'), dlugoscMotkaM: liczbaLubNull(r, 'dlugosc_motka_m'),
    wagaMotkaG: liczbaLubNull(r, 'waga_motka_g'), pielegnacja: tekst(r, 'pielegnacja'), notatka: tekst(r, 'notatka'), zdjecieSha: tekstLubNull(r, 'zdjecie'),
  } };
}

/** Lista zapasu (BR-ZAP-001, BR-ZAP-004): bez usuniętych, po nazwie bez wielkości liter; miniatura = pierwsze zdjęcie etykiety. */
export async function zapasZDetalami(z: Pick<Zaleznosci, 'baza'>): Promise<Wynik<WierszZapasu[]>> {
  const r = await wiersze(z.baza.all(
    `SELECT id, nazwa, kategoria, motki, dlugosc_motka_m, waga_motka_g, ${ZDJECIE_ETYKIETY}
     FROM wloczka WHERE usunieto_ms IS NULL ORDER BY nazwa COLLATE NOCASE, id`), 'zapasZDetalami');
  return { ok: true, wartosc: r.map((x) => ({
    id: tekst(x, 'id'), nazwa: tekst(x, 'nazwa'), kategoria: liczbaLubNull(x, 'kategoria'), motki: liczba(x, 'motki'),
    dlugoscMotkaM: liczbaLubNull(x, 'dlugosc_motka_m'), wagaMotkaG: liczbaLubNull(x, 'waga_motka_g'), zdjecieSha: tekstLubNull(x, 'zdjecie'),
  })) };
}

/** Druty, szydełka i inne (BR-ZAP-003): UPSERT rodzaju, rozmiaru (mm > 0 albo brak) i opisu; `usunieto_ms` zostaje. */
export function zapiszNarzedzie(z: Zaleznosci, w: { id?: string; rodzaj: RodzajNarzedzia; rozmiarMm: number | null; opis: string }): Promise<Wynik<{ id: string }>> {
  if (!RODZAJE.includes(w.rodzaj) || !dodatniaLubNull(w.rozmiarMm)) return Promise.resolve(blad('bledne_dane'));
  const id = w.id ?? z.id.nowy();
  return operacjaZapisu(z, 'zapiszNarzedzie', async (tx, teraz) => {
    await tx.run(
      `INSERT INTO narzedzie (id, rodzaj, rozmiar_mm, opis, zmieniono_ms) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET rodzaj = excluded.rodzaj, rozmiar_mm = excluded.rozmiar_mm, opis = excluded.opis, zmieniono_ms = excluded.zmieniono_ms`,
      [id, w.rodzaj, w.rozmiarMm, w.opis.trim(), teraz],
    );
    return { ok: true, wartosc: { id } };
  });
}

/** Lista narzędzi: druty, szydełka, inne; w grupie od najmniejszego rozmiaru (brak rozmiaru na końcu). */
export async function narzedzia(z: Pick<Zaleznosci, 'baza'>): Promise<Wynik<Narzedzie[]>> {
  const r = await wiersze(z.baza.all(
    `SELECT id, rodzaj, rozmiar_mm, opis FROM narzedzie WHERE usunieto_ms IS NULL
     ORDER BY CASE rodzaj WHEN 'druty' THEN 0 WHEN 'szydelko' THEN 1 ELSE 2 END, rozmiar_mm IS NULL, rozmiar_mm, opis, id`), 'narzedzia');
  const lista: Narzedzie[] = [];
  for (const x of r) {
    const rodzaj = RODZAJE.find((n) => n === tekst(x, 'rodzaj'));
    if (!rodzaj) return blad('bledne_dane');
    lista.push({ id: tekst(x, 'id'), rodzaj, rozmiarMm: liczbaLubNull(x, 'rozmiar_mm'), opis: tekst(x, 'opis') });
  }
  return { ok: true, wartosc: lista };
}

/**
 * Kosz włóczki i narzędzia (P-209; dane.md „Usuwanie włóczki i narzędzia przez kosz”): `usunieto_ms` = teraz albo NULL. Ponowne usunięcie
 * i przywrócenie nieusuniętego → `niedozwolone_przejscie` (termin się nie przesuwa). Tabela z zamkniętej listy.
 */
function koszZapasu(z: Zaleznosci, tabela: 'wloczka' | 'narzedzie', id: string, usun: boolean): Promise<Wynik<void>> {
  return operacjaZapisu(z, `${usun ? 'usun' : 'przywroc'}_${tabela}`, async (tx, teraz) => {
    const [r] = await wiersze(tx.all(`SELECT usunieto_ms FROM ${tabela} WHERE id = ?`, [id]), 'koszZapasu');
    if (!r) return blad('bledne_dane');
    if ((liczbaLubNull(r, 'usunieto_ms') !== null) === usun) return blad('niedozwolone_przejscie');
    await tx.run(`UPDATE ${tabela} SET usunieto_ms = ?, zmieniono_ms = ? WHERE id = ?`, [usun ? teraz : null, teraz, id]);
    return { ok: true, wartosc: undefined };
  });
}
export const usunWloczke = (z: Zaleznosci, w: { wloczkaId: string }) => koszZapasu(z, 'wloczka', w.wloczkaId, true);
export const przywrocWloczke = (z: Zaleznosci, w: { wloczkaId: string }) => koszZapasu(z, 'wloczka', w.wloczkaId, false);
export const usunNarzedzie = (z: Zaleznosci, w: { narzedzieId: string }) => koszZapasu(z, 'narzedzie', w.narzedzieId, true);
export const przywrocNarzedzie = (z: Zaleznosci, w: { narzedzieId: string }) => koszZapasu(z, 'narzedzie', w.narzedzieId, false);

// ── 07-jakosc-001 (F-37, BR-ZAP-002, design-spec „Partia 8” 001): przypisanie włóczek do projektu — jedyne miejsce zapisu `projekt_wloczka` poza potwierdzeniem zużycia.
export type WyborWloczek = { zapas: { id: string; nazwa: string; motki: number }[]; wybrane: string[] };
/** Zapas do wyboru (bez usuniętych, po nazwie) i włóczki już przypisane do projektu; włóczka z zapasem 0 też jest do wyboru (zużycie ponad zapas obsługuje karta). */
export async function wyborWloczek(z: Pick<Zaleznosci, 'baza'>, w: { projektId: string }): Promise<Wynik<WyborWloczek>> {
  const zapas = await wiersze(z.baza.all('SELECT id, nazwa, motki FROM wloczka WHERE usunieto_ms IS NULL ORDER BY nazwa COLLATE NOCASE, id'), 'wyborWloczek');
  const wybrane = await wiersze(z.baza.all('SELECT wloczka_id FROM projekt_wloczka WHERE projekt_id = ? ORDER BY wloczka_id', [w.projektId]), 'wyborWloczek');
  return { ok: true, wartosc: { zapas: zapas.map((x) => ({ id: tekst(x, 'id'), nazwa: tekst(x, 'nazwa'), motki: liczba(x, 'motki') })), wybrane: wybrane.map((x) => tekst(x, 'wloczka_id')) } };
}
/**
 * Zbiór włóczek projektu = dokładnie `wloczkaIds`: brakujące wiersze dochodzą (zużycie NULL), odznaczone znikają, pozostałe zachowują zapisane zużycie.
 * Zapas (`wloczka.motki`) zmienia się tylko przy odznaczeniu włóczki z potwierdzonym zużyciem (motki wracają, P-333) — poza tym zużycie zapisuje dopiero karta ukończenia. Nieznana albo usunięta włóczka, projekt w koszu: `bledne_dane`, nic się nie zapisuje.
 */
export function przypiszWloczki(z: Zaleznosci, w: { projektId: string; wloczkaIds: readonly string[] }): Promise<Wynik<void>> {
  const ids = [...new Set(w.wloczkaIds)];
  return operacjaZapisu(z, 'przypiszWloczki', async (tx, teraz) => {
    const [p] = await wiersze(tx.all('SELECT 1 AS ok FROM projekt WHERE id = ? AND usunieto_ms IS NULL', [w.projektId]), 'przypiszWloczki');
    if (!p) return blad('bledne_dane');
    const istnieja = new Set((await wiersze(tx.all('SELECT id FROM wloczka WHERE usunieto_ms IS NULL'), 'przypiszWloczki')).map((x) => tekst(x, 'id')));
    const byly = new Set((await wiersze(tx.all('SELECT wloczka_id FROM projekt_wloczka WHERE projekt_id = ?', [w.projektId]), 'przypiszWloczki')).map((x) => tekst(x, 'wloczka_id')));
    if (ids.some((id) => !istnieja.has(id) && !byly.has(id))) return blad('bledne_dane'); // włóczka już przypisana (np. potem wrzucona do kosza) może zostać
    for (const id of byly) {
      if (ids.includes(id)) continue;
      // P-333, zasada 10: zużycie potwierdzone na karcie pomniejszyło zapas, więc usunięcie powiązania zwraca motki w tej samej transakcji (inaczej zużycie znika z historii, a motki nie wracają).
      const [byl] = await wiersze(tx.all('SELECT zuzyto_motki FROM projekt_wloczka WHERE projekt_id = ? AND wloczka_id = ?', [w.projektId, id]), 'przypiszWloczki');
      const zuzyto = byl ? liczbaLubNull(byl, 'zuzyto_motki') : null;
      await tx.run('DELETE FROM projekt_wloczka WHERE projekt_id = ? AND wloczka_id = ?', [w.projektId, id]);
      if (zuzyto !== null && zuzyto > 0) await tx.run('UPDATE wloczka SET motki = motki + ?, zmieniono_ms = ? WHERE id = ?', [zuzyto, teraz, id]);
    }
    for (const id of ids) {
      if (!byly.has(id)) await tx.run('INSERT INTO projekt_wloczka (projekt_id, wloczka_id, zuzyto_motki, zmieniono_ms) VALUES (?, ?, NULL, ?)', [w.projektId, id, teraz]);
    }
    return { ok: true, wartosc: undefined };
  });
}
