// Zapis preferencji urządzenia (ADR-0029): walidacja, UPSERT przez kolejkę portu (jedna transakcja), wynik = stan po COMMIT.
import type { Wynik } from '../domena/bledy';
import { preferencjeZUstawien, type Preferencje } from '../domena/preferencje';
import { wczytajPreferencje, zapiszPreferencje } from '../dane/repozytoria/ustawienia';
import { blad, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export function ustawPreferencje(z: Zaleznosci, zmiana: Partial<Preferencje>): Promise<Wynik<Preferencje>> {
  // wartość spoza typu (np. 'furlongs') nie trafia do bazy: ta sama walidacja co przy odczycie
  const poprawna = preferencjeZUstawien({ wibracje: zmiana.wibracje, ekran_nie_gasnie: zmiana.ekranNieGasnie, uklad_miar: zmiana.ukladMiar });
  const dozwolona: Partial<Preferencje> = {};
  if (zmiana.wibracje !== undefined) { if (typeof zmiana.wibracje !== 'boolean') return Promise.resolve(blad('bledne_dane')); dozwolona.wibracje = poprawna.wibracje; }
  if (zmiana.ekranNieGasnie !== undefined) { if (typeof zmiana.ekranNieGasnie !== 'boolean') return Promise.resolve(blad('bledne_dane')); dozwolona.ekranNieGasnie = poprawna.ekranNieGasnie; }
  if (zmiana.ukladMiar !== undefined) { if (zmiana.ukladMiar !== poprawna.ukladMiar) return Promise.resolve(blad('bledne_dane')); dozwolona.ukladMiar = poprawna.ukladMiar; }
  return operacjaZapisu(z, 'ustawPreferencje', async (tx, teraz) => {
    await zapiszPreferencje(tx, dozwolona, teraz);
    return { ok: true, wartosc: await wczytajPreferencje(tx) };
  });
}
