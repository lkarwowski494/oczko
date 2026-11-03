// Kolejka zapisów przypadków użycia (ADR-0002, ADR-0008 (2)): jedna na port bazy. Pozycja może przed transakcją przeczytać coś poza bazą
// (dziennik +1), a i tak żaden zapis z ekranu jej nie wyprzedzi — w samej transakcji portu czekanie poza bazą jest zakazane.
import type { PortBazy } from '../domena/porty';

const ogony = new WeakMap<PortBazy, Promise<unknown>>();

export function wKolejce<T>(baza: PortBazy, zadanie: () => Promise<T>): Promise<T> {
  const ogon = ogony.get(baza) ?? Promise.resolve();
  const wynik = ogon.then(zadanie, zadanie);
  ogony.set(baza, wynik.catch(() => undefined)); // błąd zostaje u wołającego; następna pozycja i tak rusza
  return wynik;
}

const ogonyKluczy = new WeakMap<PortBazy, Map<string, Promise<unknown>>>();
/**
 * M1-105: kolejka na klucz (np. strona rysunku) dla zadań, które przed `wKolejce` robią coś poza bazą (plik do magazynu): następne zadanie z tym
 * kluczem rusza po poprzednim, więc kolejność zapisów wyznacza kolejność wywołań, a nie czas kroku poza bazą. Pusty ogon znika z mapy.
 */
export function wKolejceKlucza<T>(baza: PortBazy, klucz: string, zadanie: () => Promise<T>): Promise<T> {
  const mapa = ogonyKluczy.get(baza) ?? new Map<string, Promise<unknown>>();
  ogonyKluczy.set(baza, mapa);
  const wynik = (mapa.get(klucz) ?? Promise.resolve()).then(zadanie, zadanie);
  const ogon = wynik.catch(() => undefined);
  mapa.set(klucz, ogon);
  void ogon.then(() => { if (mapa.get(klucz) === ogon) mapa.delete(klucz); });
  return wynik;
}
