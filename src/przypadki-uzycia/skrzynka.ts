// Skrzynka importu „Udostępnij do Oczka” (ADR-0011 fix-7; moduly.md „Kontrakt partii 6”: przetworzSkrzynke; design-spec R2; P-230 Q2a).
// Woła kompozycja po starcie danych (po `sprzatnijKosz`, poza pozycją kolejki startu: dodajWzor czeka na sieć poza transakcją) i przy `AppState → active`.
// Zlecenie znika ze skrzynki tylko po zapisanym wzorze albo po potwierdzeniu błędu przez użytkowniczkę (alert `skrzynka.nie_dodano`) — nic po cichu.
import type { Powod, Wynik } from '../domena/bledy';
import { rodzajPliku } from '../domena/rodzaj-pliku';
import type { SkrzynkaImportu, ZlecenieImportu } from '../domena/porty';
import { zapiszBlad } from '../dane/repozytoria/bledy';
import { tekst, wiersze } from '../dane/repozytoria/wiersze';
import { OK, blad, operacjaZapisu } from './zapis';
import { dodajWzor, type ZaleznosciWzoru, type ZrodloDodania } from './wzor';
import { ustawFilm } from './film';

/** Powody przejściowe: zlecenie czeka w skrzynce do następnej próby (sieć, miejsce, zapis, wygaśnięcie czasu w tle) — plik nie jest kasowany. */
export const PRZEJSCIOWE: readonly Powod[] = ['brak_sieci', 'brak_miejsca', 'zapis'];
export type ZaleznosciSkrzynki = ZaleznosciWzoru & { skrzynka: SkrzynkaImportu };
export type WynikSkrzynki = { zaimportowano: number; doWyboru: ZlecenieImportu[]; czekaSiec: ZlecenieImportu[]; bledy: { zlecenie: ZlecenieImportu; powod: Powod }[] };

/** Źródło wzoru ze zlecenia (UTI albo MIME z rozszerzenia, `rodzajPliku`); null = typ nieobsługiwany (alert `wzor.blad_typ`). */
export function zrodloZlecenia(z: ZlecenieImportu): ZrodloDodania | null {
  if (z.rodzaj === 'film') return null; // film nie jest wzorem
  if (z.rodzaj === 'adres') return z.adres ? { rodzaj: 'adres', adres: z.adres } : null;
  const [pierwsza] = z.sciezki;
  if (!pierwsza) return null;
  const rodzaj = rodzajPliku(z.nazwa, z.typ); // jedna reguła rozszerzeń (ADR-0031 pkt 5): Word = .docx
  if (rodzaj === 'obraz') return { rodzaj: 'obrazy', sciezki: z.sciezki }; // kilka zdjęć = jeden wzór (P-248 D1a)
  if (z.sciezki.length !== 1 || !rodzaj) return null;
  return { rodzaj, plik: { id: z.id, nazwa: z.nazwa, sciezka: pierwsza, typ: z.typ } };
}
const nazwaWzoru = (z: ZlecenieImportu): string => z.nazwa.replace(/\.(pdf|docx?|jpe?g|png|heic)$/i, '').trim() || z.nazwa;

async function projektDostepny(z: ZaleznosciSkrzynki, projektId: string): Promise<boolean> {
  const w = await operacjaZapisu(z, 'skrzynkaProjekt', async (tx) => {
    const r = await wiersze(tx.all("SELECT id FROM projekt WHERE id = ? AND stan = 'w_toku' AND usunieto_ms IS NULL", [projektId]), 'skrzynka');
    return { ok: true, wartosc: r.length === 1 ? tekst(r[0], 'id') : null };
  });
  return w.ok && w.wartosc !== null;
}

/** Zlecenie → wzór w projekcie; po zapisie zlecenie usunięte ze skrzynki. Błąd zostawia zlecenie (wpis w `blad` bez treści — NFR-PRY-001). */
export async function przypiszZlecenie(z: ZaleznosciSkrzynki, w: { zlecenie: ZlecenieImportu; projektId: string }): Promise<Wynik<{ wzorId: string | null }>> {
  const zrodlo = zrodloZlecenia(w.zlecenie);
  const wynik: Wynik<{ wzorId: string | null }> = w.zlecenie.rodzaj === 'film' // „Video link” → film projektu, nie wzór (P-246 S4a, P-218 (4))
    ? await filmZeZlecenia(z, w.zlecenie, w.projektId)
    : zrodlo ? await dodajWzor(z, { projektId: w.projektId, nazwa: nazwaWzoru(w.zlecenie), zrodlo }) : blad('bledne_dane');
  if (wynik.ok) await z.skrzynka.usun(w.zlecenie.id);
  else if (!PRZEJSCIOWE.includes(wynik.powod) || wynik.powod === 'zapis') await zapiszBlad(z.baza, { czasMs: z.zegar.teraz().ms, kod: 'skrzynka_import', szczegoly: { powod: wynik.powod, rodzaj: w.zlecenie.rodzaj } });
  return wynik;
}
async function filmZeZlecenia(z: ZaleznosciSkrzynki, zl: ZlecenieImportu, projektId: string): Promise<Wynik<{ wzorId: null }>> {
  const r = await ustawFilm(z, { projektId, adres: zl.adres ?? '', nazwa: zl.nazwa });
  return r.ok ? { ok: true, wartosc: { wzorId: null } } : r;
}
export async function odrzucZlecenie(z: Pick<ZaleznosciSkrzynki, 'skrzynka'>, w: { id: string }): Promise<Wynik<void>> {
  await z.skrzynka.usun(w.id);
  return OK;
}

export async function przetworzSkrzynke(z: ZaleznosciSkrzynki): Promise<Wynik<WynikSkrzynki>> {
  const wynik: WynikSkrzynki = { zaimportowano: 0, doWyboru: [], czekaSiec: [], bledy: [] };
  for (const zl of await z.skrzynka.pobierz()) {
    if (!zl.projektId || !(await projektDostepny(z, zl.projektId))) { wynik.doWyboru.push(zl); continue; }
    const r = await przypiszZlecenie(z, { zlecenie: zl, projektId: zl.projektId });
    if (r.ok) wynik.zaimportowano += 1;
    else if (PRZEJSCIOWE.includes(r.powod)) wynik.czekaSiec.push(zl);
    else wynik.bledy.push({ zlecenie: zl, powod: r.powod });
  }
  return { ok: true, wartosc: wynik };
}
