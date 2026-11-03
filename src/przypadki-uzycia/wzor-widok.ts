// Przeglądarka wzoru: obrót strony (P-246 S3a; P-218 (2): plik bez zmian) i model odczytu widoku (moduly.md „Kontrakt partii 6”: widok natywny tylko
// rysuje wynik `polozenieZnacznika`). Wydzielone z wzor.ts (limit rozmiaru pliku, granice ROZMIAR).
import type { Wynik } from '../domena/bledy';
import { chipyNotatek, polozenieZnacznika, type ChipNotatki } from '../domena/znacznik-wzoru';
import { notatkiWzoruZId, znacznikWzoru } from '../dane/repozytoria/wzory';
import { liczba, tekst, tekstLubNull, wiersze } from '../dane/repozytoria/wiersze';
import { OK, blad, operacjaZapisu } from './zapis';
import { wzorDoZapisu, zapiszRysunek } from './wzor';
import { ODRZUCENIA_ODWRACALNE, ODRZUCENIA_TRWALE, PLIK_OCZEKUJACY, najnowszeOczekujace } from './rysunki-oczekujace';
import { pozycjaWzoru, type PozycjaWzoru } from './wzor-miejsce';
import { czasZmiany, istniejePlik, lista, polacz, usunPlik } from '../dane/pliki/system';
import type { ZaleznosciPlikow } from './zaleznosci';

export type KatObrotu = 0 | 90 | 180 | 270;
/** Obrót strony w widoku (P-246 S3a; P-218 (2): plik bez zmian): `wzor.obroty` = { "<strona>": kąt }, 0° usuwa wpis; znacznik i rysunki w układzie strony przed obrotem. */
export function ustawObrot(z: ZaleznosciPlikow, w: { wzorId: string; strona: number; kat: KatObrotu }): Promise<Wynik<void>> {
  if (!Number.isInteger(w.strona) || w.strona < 0 || ![0, 90, 180, 270].includes(w.kat)) return Promise.resolve(blad('bledne_dane'));
  return operacjaZapisu(z, 'ustawObrot', async (tx, teraz) => {
    const stan = await wzorDoZapisu(tx, w.wzorId);
    if (stan) return blad(stan);
    const sciezka = `$."${w.strona}"`;
    await tx.run(w.kat === 0 ? 'UPDATE wzor SET obroty = json_remove(obroty, ?), zmieniono_ms = ? WHERE id = ?' : 'UPDATE wzor SET obroty = json_set(obroty, ?, ?), zmieniono_ms = ? WHERE id = ?',
      w.kat === 0 ? [sciezka, teraz, w.wzorId] : [sciezka, w.kat, teraz, w.wzorId]);
    return OK;
  });
}
export function obrotyWzoru(z: ZaleznosciPlikow, w: { wzorId: string }): Promise<Wynik<Record<number, KatObrotu>>> {
  return operacjaZapisu(z, 'obrotyWzoru', async (tx) => {
    const [r] = await wiersze(tx.all('SELECT obroty FROM wzor WHERE id = ?', [w.wzorId]), 'obrotyWzoru');
    if (!r) return blad('bledne_dane');
    const o: Record<number, KatObrotu> = {};
    for (const [k, v] of Object.entries(JSON.parse(tekst(r, 'obroty')) as Record<string, unknown>)) {
      if (/^\d+$/.test(k) && (v === 90 || v === 180 || v === 270)) o[Number(k)] = v;
    }
    return { ok: true, wartosc: o };
  });
}

export type WidokWzoru = {
  wzorId: string; projektId: string; nazwa: string; zrodlo: string;
  plikPdf: string | null;                         // null: Word w podglądzie zastępczym (pdf_sha256 NULL, P-071 (5a))
  oryginal: string | null;
  rysunki: { strona: number; plik: string }[];
  obroty: Record<number, KatObrotu>;
  notatki: ChipNotatki[];                         // chipy notatek na stronie znacznika (F-56, P-330 2A)
  miejsce: PozycjaWzoru | null;                   // 07-jakosc-006: pozycja z `ostatnie_miejsce`, tylko dla ostatnio oglądanego wzoru
  znacznik: { licznikId: string; strona: number; rzad: number; y: number; wysokosc: number; pozaStrona: boolean; przedSchematem: boolean; kierunek: 1 | -1 } | null;
};
/** Model odczytu przeglądarki (moduly.md „Kontrakt partii 6”: widok natywny tylko rysuje wynik `polozenieZnacznika`). */
/** `katalogOczekujacych` (M1-084): strona z plikiem oczekującym dostaje najnowszy taki plik zamiast rysunku z bazy. */
export function widokWzoru(z: ZaleznosciPlikow, w: { wzorId: string; katalogOczekujacych?: string }): Promise<Wynik<WidokWzoru>> {
  return operacjaZapisu(z, 'widokWzoru', async (tx) => {
    const stan = await wzorDoZapisu(tx, w.wzorId);
    if (stan) return blad(stan);
    const [r] = await wiersze(tx.all('SELECT projekt_id, nazwa, zrodlo, pdf_sha256, oryginal_sha256, obroty FROM wzor WHERE id = ?', [w.wzorId]), 'widokWzoru');
    const rys = await wiersze(tx.all('SELECT strona, plik_sha256 FROM rysunek WHERE wzor_id = ? ORDER BY strona', [w.wzorId]), 'widokWzoru');
    const pdf = tekstLubNull(r, 'pdf_sha256'), oryg = tekstLubNull(r, 'oryginal_sha256');
    const obroty: Record<number, KatObrotu> = {};
    for (const [k, v] of Object.entries(JSON.parse(tekst(r, 'obroty')) as Record<string, unknown>)) if (/^\d+$/.test(k) && (v === 90 || v === 180 || v === 270)) obroty[Number(k)] = v;
    let znacznik: WidokWzoru['znacznik'] = null;
    let notatki: ChipNotatki[] = [];
    const zn = await znacznikWzoru(tx, w.wzorId);
    if (zn) {
      const [l] = await wiersze(tx.all('SELECT wartosc FROM licznik WHERE id = ?', [zn.licznikId]), 'widokWzoru');
      const p = l ? polozenieZnacznika(zn, liczba(l, 'wartosc')) : null;
      if (p?.ok) notatki = chipyNotatek(zn, await notatkiWzoruZId(tx, w.wzorId));
      if (p?.ok) znacznik = { licznikId: zn.licznikId, strona: p.wartosc.strona, rzad: p.wartosc.rzad, y: p.wartosc.y, wysokosc: zn.wysokoscRzedu, pozaStrona: p.wartosc.pozaStrona, przedSchematem: p.wartosc.przedSchematem, kierunek: zn.kierunek };
    }
    return { ok: true, wartosc: {
      wzorId: w.wzorId, projektId: tekst(r, 'projekt_id'), nazwa: tekst(r, 'nazwa'), zrodlo: tekst(r, 'zrodlo'),
      plikPdf: pdf ? z.magazyn.sciezka(pdf) : null, oryginal: oryg ? z.magazyn.sciezka(oryg) : null,
      rysunki: zOczekujacymi(rys.map((x) => ({ strona: liczba(x, 'strona'), plik: z.magazyn.sciezka(tekst(x, 'plik_sha256')) })), w), obroty, znacznik, notatki, miejsce: await pozycjaWzoru(tx, w.wzorId),
    } };
  });
}

function zOczekujacymi(z: { strona: number; plik: string }[], w: { wzorId: string; katalogOczekujacych?: string }): { strona: number; plik: string }[] {
  if (!w.katalogOczekujacych) return z;
  const ocz = najnowszeOczekujace(w.katalogOczekujacych, w.wzorId);
  return [...z.filter((x) => !ocz.has(x.strona)), ...[...ocz].map(([strona, plik]) => ({ strona, plik }))].sort((a, b) => a.strona - b.strona);
}
/**
 * Odzysk rysunków zapisanych przez widok natywny, gdy ekran już się zamykał (zdarzenie `onRysunek` bez odbiorcy; przegląd 2026-10-26), i rysunków,
 * których zapis się nie udał (M1-084: plik zostaje): pliki `<wzorId>__<strona>__<uuid>.pkdrawing` z katalogu oczekujących → `zapiszRysunek`.
 * Na stronę liczy się najnowszy plik (cały rysunek strony): po jego zapisie starsze znikają; przy błędzie zapisu wszystkie zostają, a wynik to ten błąd.
 * M1-104: strona wzoru w koszu (albo w projekcie w koszu) jest pomijana bez błędu, a jej pliki czekają; znikają dopiero, gdy wzoru nie ma (`bledne_dane`).
 * Wynik = liczba zapisanych stron.
 */
export async function odzyskajRysunki(z: ZaleznosciPlikow, w: { katalog: string }): Promise<Wynik<number>> {
  const strony = new Map<string, { wzorId: string; strona: number; sciezka: string; czas: number }[]>();
  for (const nazwa of lista(w.katalog)) {
    const m = PLIK_OCZEKUJACY.exec(nazwa);
    if (!m) continue;
    const sciezka = polacz(w.katalog, nazwa);
    const klucz = `${m[1]}__${m[2]}`;
    strony.set(klucz, [...(strony.get(klucz) ?? []), { wzorId: m[1], strona: Number(m[2]), sciezka, czas: czasZmiany(sciezka) ?? 0 }]);
  }
  let n = 0;
  let bladZapisu: Wynik<number> | null = null;
  for (const pliki of strony.values()) {
    const kolejne = pliki.sort((a, b) => b.czas - a.czas); // najnowszy pierwszy
    for (const [i, p] of kolejne.entries()) {
      if (!istniejePlik(p.sciezka)) continue;
      const r = await zapiszRysunek(z, { wzorId: p.wzorId, strona: p.strona, plikTymczasowy: p.sciezka }).catch((): Wynik<void> => ({ ok: false, powod: 'zapis' })); // wyjątek: plik zostaje
      if (r.ok) {
        n += 1;
        for (const starszy of kolejne.slice(i + 1)) if (istniejePlik(starszy.sciezka)) usunPlik(starszy.sciezka);
        break;
      }
      if (ODRZUCENIA_ODWRACALNE.includes(r.powod)) break; // M1-104: wzór albo projekt w koszu — pliki strony czekają na przywrócenie, bez błędu
      if (!ODRZUCENIA_TRWALE.includes(r.powod)) { bladZapisu = r; break; } // pliki strony zostają; starszy nie zastępuje nowszego
    }
  }
  return bladZapisu ?? { ok: true, wartosc: n };
}
