// Licznik całości kawałka (BR-LIC-018, F-46; P-199 Q1a, moduly.md „Kontrakt partii 5”): każdy licznik rzędów części jest sekcją, bez ustawienia
// (F-46 „bez ustawienia”, propozycja 04 z P-183); całość liczona, nie zapisywana. Jedna funkcja dla ekranu projektu i ekranu licznika (ARCH-02).
import type { STANY } from './stany';

export type LicznikKawalka = { id: string; czescId: string; rodzaj: (typeof STANY)['licznik.rodzaj'][number]; wartosc: number };
/** Najmniej liczników rzędów w części, przy których całość ma sens (jeden licznik = jego własna liczba, bez osobnej linii). */
const SEKCJI_MIN = 2;
/** Suma liczników rzędów części `czescId`, gdy jest ich ≥ 2; inaczej `null`. Liczniki oczek i innych części (osobnych kawałków) nie wchodzą. */
export function licznikCalosci(liczniki: readonly LicznikKawalka[], czescId: string): number | null {
  const sekcje = liczniki.filter((l) => l.czescId === czescId && l.rodzaj === 'rzedy');
  return sekcje.length >= SEKCJI_MIN ? sekcje.reduce((s, l) => s + l.wartosc, 0) : null;
}
