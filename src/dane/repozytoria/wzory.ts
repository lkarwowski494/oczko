// Repozytorium wzorów: znacznik bieżącego rzędu (BR-WZR-003) i notatki w miejscu wzoru (BR-WZR-008).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// `wzor.znacznik` (JSON, schemat.sql): {licznik_id, strona, y, wysokosc_rzedu, rzad_bazowy, wartosc_przy_ustawieniu, kierunek} (ADR-0011, W7).
// Notatki wzoru = `notatka_rzedu` licznika ze znacznika (schemat v1 nie ma osobnej tabeli; P-120: [DO USTALENIA 05] potwierdzenie).
import { BladDanych } from '../../domena/bledy';
import type { PortBazy } from '../../domena/porty';
import { polozenieZnacznika, type NotatkaWzoru, type ZnacznikWzoru } from '../../domena/znacznik-wzoru';
import { liczba, tekst, wiersz, wiersze } from './wiersze';

export type ZnacznikZapisany = ZnacznikWzoru & { licznikId: string };

/** Licznik, z którym idzie znacznik (wystarcza do notatek); null = wzór bez znacznika. */
export async function licznikZnacznika(baza: PortBazy, wzorId: string): Promise<string | null | undefined> {
  const [w] = await wiersze(baza.all('SELECT znacznik FROM wzor WHERE id = ?', [wzorId]), 'wzor');
  if (!w) return undefined; // nie ma wzoru
  const z = wiersz(JSON.parse(tekst(w, 'znacznik')), 'wzor.znacznik');
  return typeof z.licznik_id === 'string' ? z.licznik_id : null;
}
export async function znacznikWzoru(baza: PortBazy, wzorId: string): Promise<ZnacznikZapisany | null> {
  const [w] = await wiersze(baza.all('SELECT znacznik FROM wzor WHERE id = ?', [wzorId]), 'wzor');
  if (!w) return null;
  const z = wiersz(JSON.parse(tekst(w, 'znacznik')), 'wzor.znacznik');
  if (!('licznik_id' in z)) return null; // znacznik nieustawiony ('{}')
  const kierunek = liczba(z, 'kierunek');
  if (kierunek !== 1 && kierunek !== -1) throw new BladDanych('wzor.znacznik: kierunek spoza {1, -1}');
  return {
    licznikId: tekst(z, 'licznik_id'), strona: liczba(z, 'strona'), y: liczba(z, 'y'), wysokoscRzedu: liczba(z, 'wysokosc_rzedu'),
    rzadBazowy: liczba(z, 'rzad_bazowy'), wartoscPrzyUstawieniu: liczba(z, 'wartosc_przy_ustawieniu'), kierunek,
  };
}
export const znacznikJson = (z: ZnacznikZapisany): string => JSON.stringify({
  licznik_id: z.licznikId, strona: z.strona, y: z.y, wysokosc_rzedu: z.wysokoscRzedu, rzad_bazowy: z.rzadBazowy, wartosc_przy_ustawieniu: z.wartoscPrzyUstawieniu, kierunek: z.kierunek,
});

/** Strona i rząd znacznika przy bieżącej wartości licznika (znacznik idzie z licznikiem, BR-WZR-003). */
export async function odczytajZnacznik(baza: PortBazy, wzorId: string): Promise<{ licznikId: string; strona: number; rzad: number } | null> {
  const z = await znacznikWzoru(baza, wzorId);
  if (!z) return null;
  const [l] = await wiersze(baza.all('SELECT wartosc FROM licznik WHERE id = ?', [z.licznikId]), 'wzor');
  if (!l) return null; // licznik trwale usunięty: znacznik bez licznika nie wskazuje rzędu
  const p = polozenieZnacznika(z, liczba(l, 'wartosc'));
  if (!p.ok) return null; // CHECK wartosc >= 0 w schemacie: nieosiągalne bez uszkodzonej bazy
  return { licznikId: z.licznikId, strona: p.wartosc.strona, rzad: p.wartosc.rzad };
}
export async function notatkiWzoru(baza: PortBazy, wzorId: string): Promise<{ rzad: number; tekst: string }[]> {
  const licznikId = await licznikZnacznika(baza, wzorId);
  if (!licznikId) return [];
  const w = await wiersze(baza.all('SELECT rzad, tekst FROM notatka_rzedu WHERE licznik_id = ? ORDER BY rzad', [licznikId]), 'notatkiWzoru');
  return w.map((r) => ({ rzad: liczba(r, 'rzad'), tekst: tekst(r, 'tekst') }));
}

/** Notatki wzoru z identyfikatorem (chip na stronie i zmiana/usunięcie): kolejność rząd, kolejność wstawienia (zmiana treści jej nie ruszą) (BR-WZR-008). */
export async function notatkiWzoruZId(baza: PortBazy, wzorId: string): Promise<NotatkaWzoru[]> {
  const licznikId = await licznikZnacznika(baza, wzorId);
  if (!licznikId) return [];
  const w = await wiersze(baza.all('SELECT id, rzad, tekst FROM notatka_rzedu WHERE licznik_id = ? ORDER BY rzad, rowid', [licznikId]), 'notatkiWzoruZId');
  return w.map((r) => ({ id: tekst(r, 'id'), rzad: liczba(r, 'rzad'), tekst: tekst(r, 'tekst') }));
}
