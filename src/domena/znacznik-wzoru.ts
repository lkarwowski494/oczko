// Znacznik bieżącego rzędu we wzorze idzie z licznikiem (BR-WZR-003, F-26; wzor.znacznik w schemat.sql).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22); kierunek i krawędź strony: fix-2 W7 (08, partia 2).
import type { Wynik } from './bledy';
// `rzadBazowy`: rząd wzoru wskazany przy ustawieniu, gdy licznik miał `wartoscPrzyUstawieniu` (ADR-0011, uzupełnienie fix-2, P-118 Q2a).

/** `y`, `wysokoscRzedu`: ułamek wysokości strony 0–1 od góry (ADR-0011, Z07-17); `kierunek`: 1 = następny rząd niżej, −1 = wyżej (P-118 Q2a). */
export type ZnacznikWzoru = { strona: number; y: number; wysokoscRzedu: number; rzadBazowy: number; wartoscPrzyUstawieniu: number; kierunek: 1 | -1 };
const EPS = 1e-9; // liczby zmiennoprzecinkowe (wyrocznia ADR-0011)
/**
 * Rząd i położenie znacznika przy bieżącej wartości licznika s (skończone rzędy): rząd = rzadBazowy + (s − wartoscPrzyUstawieniu) — rząd w robocie
 * (RD-21, P-134 Q2a); o jedną wysokość rzędu na zmianę licznika, w kierunku znacznika. Poza stroną znacznik staje na krawędzi z `pozaStrona: true`,
 * a rząd liczy się dalej (ADR-0011, W7). Rząd < 1 → „przed schematem” (P-134 Q3a): znacznik na rzędzie 1 schematu przyciętym do strony, bez
 * notatki. `rzadNotatki` = s + 1 (notatka na znaczniku, rząd w robocie w układzie licznika). s < 0 albo ułamek → bledne_dane (RD-21-W7).
 */
export function polozenieZnacznika(z: ZnacznikWzoru, wartoscLicznika: number): Wynik<{ strona: number; rzad: number; y: number; pozaStrona: boolean; przedSchematem: boolean; rzadNotatki: number | null }> {
  if (!Number.isInteger(wartoscLicznika) || wartoscLicznika < 0) return { ok: false, powod: 'bledne_dane' };
  const krok = wartoscLicznika - z.wartoscPrzyUstawieniu;
  const rzad = z.rzadBazowy + krok;
  const przytnij = (y: number) => Math.min(Math.max(y, 0), 1 - z.wysokoscRzedu);
  if (rzad < 1) {
    const yRzedu1 = z.y + z.kierunek * (1 - z.rzadBazowy) * z.wysokoscRzedu;
    return { ok: true, wartosc: { strona: z.strona, rzad, y: przytnij(yRzedu1), pozaStrona: false, przedSchematem: true, rzadNotatki: null } };
  }
  const y = z.y + z.kierunek * krok * z.wysokoscRzedu;
  const naStronie = y >= -EPS && y + z.wysokoscRzedu <= 1 + EPS;
  return { ok: true, wartosc: { strona: z.strona, rzad, y: naStronie ? y : przytnij(y), pozaStrona: !naStronie, przedSchematem: false, rzadNotatki: wartoscLicznika + 1 } };
}

/** RD-21 (P-134 Q2a): rząd schematu przy ustawieniu znacznika domyślnie = rząd w robocie = s_ust + 1, niezależnie od trybu licznika (BR-LIC-012). */
export function domyslnyRzadBazowy(sUst: number): number { return sUst + 1; }

/** Notatka wzoru: `rzad` to rząd licznika (rząd w robocie w chwili dodania, `rzadNotatki`), `tekst` bez zmian (BR-WZR-008). */
export type NotatkaWzoru = { id: string; rzad: number; tekst: string };
/**
 * Chip notatki na stronie wzoru (F-56, P-330 2A): notatki jednego rzędu to jeden chip. `rzadWzoru` = rząd schematu (numer w chipie, jak etykieta znacznika);
 * `y` = góra rzędu jako ułamek wysokości strony. Notatka poza stroną znacznika albo przed schematem nie ma tu miejsca (stronę obok zna tylko widok natywny).
 */
export type ChipNotatki = { rzad: number; rzadWzoru: number; strona: number; y: number; wysokosc: number; notatki: NotatkaWzoru[] };
export function chipyNotatek(z: ZnacznikWzoru, notatki: readonly NotatkaWzoru[]): ChipNotatki[] {
  const wg = new Map<number, ChipNotatki>();
  for (const n of notatki) {
    const krok = n.rzad - 1 - z.wartoscPrzyUstawieniu;
    const rzadWzoru = z.rzadBazowy + krok;
    const y = z.y + z.kierunek * krok * z.wysokoscRzedu;
    if (rzadWzoru < 1 || y < -EPS || y + z.wysokoscRzedu > 1 + EPS) continue;
    const jest = wg.get(n.rzad);
    if (jest) jest.notatki.push(n);
    else wg.set(n.rzad, { rzad: n.rzad, rzadWzoru, strona: z.strona, y, wysokosc: z.wysokoscRzedu, notatki: [n] });
  }
  return [...wg.values()].sort((a, b) => a.rzad - b.rzad);
}

// --- Ustawianie znacznika na stronie (F-26, 07-jakosc-023; design-spec „Znacznik rzędu na wzorze”) ---
/** Góra pasa rzędu przy przytrzymaniu w `yDotyku` (ułamek wysokości strony): pas wyśrodkowany na palcu, w obrębie strony. */
export function gornaKrawedzRzedu(yDotyku: number, wysokoscRzedu: number): number {
  return Math.min(Math.max(yDotyku - wysokoscRzedu / 2, 0), 1 - wysokoscRzedu);
}
/** Rząd schematu po przestawieniu pasa: przeniesienie zachowuje rząd znacznika (BR-WZR-003 S3), pierwsze ustawienie bierze rząd w robocie. Rząd przed schematem wraca na 1. */
export function rzadPoPrzeniesieniu(obecny: { rzad: number } | null, rzadWRobocie: number): number {
  return obecny ? Math.max(1, obecny.rzad) : rzadWRobocie;
}
/** Góra pasa po przejściu na następną stronę: pas staje przy krawędzi, od której zaczyna się kierunek rzędów (↑ od dołu, ↓ od góry). */
export function gornaKrawedzNaNastepnejStronie(kierunek: 1 | -1, wysokoscRzedu: number): number {
  return kierunek === -1 ? 1 - wysokoscRzedu : 0;
}
/**
 * Krok VoiceOver (zwiększ/zmniejsz) lub strzałek: pas o jeden rząd dalej w kierunku rzędów (rząd +1) albo bliżej (rząd −1). Gdy pas dotknąłby krawędzi strony,
 * zwraca null (pas zostaje; przejście na następną stronę to osobna akcja). Rząd schematu nie spada poniżej 1.
 */
export function krokZnacznika(z: { y: number; wysokosc: number; kierunek: 1 | -1; rzad: number }, delta: 1 | -1): { y: number; rzadBazowy: number } | null {
  const rzadBazowy = Math.max(1, z.rzad) + delta;
  if (rzadBazowy < 1) return null;
  const y = z.y + z.kierunek * delta * z.wysokosc;
  if (y < -EPS || y + z.wysokosc > 1 + EPS) return null;
  return { y: Math.min(Math.max(y, 0), 1 - z.wysokosc), rzadBazowy };
}
