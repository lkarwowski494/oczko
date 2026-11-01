// Klucze tabeli `ustawienie` (dane.md „Klucze tabeli ustawienie”): wartość JSON; nowy klucz wymaga wiersza w tej tabeli dokumentu.
import type { PortBazy } from '../../domena/porty';
import { tekst, wiersze } from './wiersze';
import { preferencjeZUstawien, type Preferencje } from '../../domena/preferencje';

export type KluczUstawienia = 'okno_uczciwe_zasady_widziane' | 'ostatnie_miejsce' | 'ostatni_start_ms' | 'icloud_uzytkownik' | 'ostatnia_prosba_o_ocene' | 'jezyk' | 'zegarek_ostatnia_partia_ms' | 'wibracje' | 'ekran_nie_gasnie' | 'uklad_miar';

export async function odczytajUstawienie(tx: PortBazy, klucz: KluczUstawienia): Promise<unknown> {
  const [w] = await wiersze(tx.all('SELECT wartosc FROM ustawienie WHERE klucz = ?', [klucz]), 'ustawienie');
  return w ? JSON.parse(tekst(w, 'wartosc')) : undefined; // undefined = brak klucza (nie „wartość domyślna”)
}
export async function zapiszUstawienie(tx: PortBazy, klucz: KluczUstawienia, wartosc: unknown, terazMs: number): Promise<void> {
  await tx.run(
    `INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES (?, ?, ?)
     ON CONFLICT (klucz) DO UPDATE SET wartosc = excluded.wartosc, zmieniono_ms = excluded.zmieniono_ms`,
    [klucz, JSON.stringify(wartosc), terazMs],
  );
}
/** `ostatni_start_ms` (P-110 Q5a): liczba całkowita albo brak; zły zapis = brak (czeka na następny start, nigdy nie kasuje). */
export async function ostatniStartMs(tx: PortBazy): Promise<number | null> {
  const v = await odczytajUstawienie(tx, 'ostatni_start_ms');
  return typeof v === 'number' && Number.isInteger(v) ? v : null;
}
/** `zegarek_ostatnia_partia_ms` (P-199 Q5a): czas ostatniej partii z zegarka dla Stanu danych (BR-DAN-011/S3); brak albo zły zapis = brak. */
export async function zegarekOstatniaPartiaMs(tx: PortBazy): Promise<number | null> {
  const v = await odczytajUstawienie(tx, 'zegarek_ostatnia_partia_ms');
  return typeof v === 'number' && Number.isInteger(v) ? v : null;
}

/** Preferencje urządzenia (ADR-0029): brak klucza albo zapis złego typu = wartość domyślna z konfiguracji. */
export async function wczytajPreferencje(tx: PortBazy): Promise<Preferencje> {
  return preferencjeZUstawien({
    wibracje: await odczytajUstawienie(tx, 'wibracje'), ekran_nie_gasnie: await odczytajUstawienie(tx, 'ekran_nie_gasnie'), uklad_miar: await odczytajUstawienie(tx, 'uklad_miar'),
  }); // wiersz jest JSON-em z definicji tabeli (CHECK json_valid); zły typ obsługuje preferencjeZUstawien
}
/** UPSERT tylko podanych preferencji (ON CONFLICT DO UPDATE; pozostałe wiersze `ustawienie` nietknięte). */
export async function zapiszPreferencje(tx: PortBazy, zmiana: Partial<Preferencje>, terazMs: number): Promise<void> {
  if (zmiana.wibracje !== undefined) await zapiszUstawienie(tx, 'wibracje', zmiana.wibracje, terazMs);
  if (zmiana.ekranNieGasnie !== undefined) await zapiszUstawienie(tx, 'ekran_nie_gasnie', zmiana.ekranNieGasnie, terazMs);
  if (zmiana.ukladMiar !== undefined) await zapiszUstawienie(tx, 'uklad_miar', zmiana.ukladMiar, terazMs);
}
