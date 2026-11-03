// Pliki stanu urządzenia obok bazy, poza bazą i archiwum (08 partia 4, 3A; KP-06): identyfikator urządzenia, pamięć uprawnień Pro, lustro języka.
// Zapis przez zapiszAtomowo (M1-026, ARCH-22), odczyt przez czytajAtomowo (odzysk `.tmp` po przerwaniu przed przeniesieniem, M1-096).
import { czytajAtomowo, polacz, zapiszAtomowo } from '../dane/pliki/system';
import type { MagazynPreferencji } from '../i18n/i18n';
import { jestJezykiem, type PreferencjaJezyka } from '../i18n/jezyki';
import type { MagazynPamieci } from './dostep';

/**
 * Identyfikator urządzenia w zdarzeniach (`zdarzenie.urzadzenie`, ADR-0005): UUID w pliku obok bazy, poza bazą, więc nie wchodzi do kopii ani archiwum.
 * Miejsce pliku: odstępstwo nazwane 08 (partia 4, 3A) do potwierdzenia przez 05 — dane.md nie ustala źródła tego pola.
 */
export async function identyfikatorUrzadzenia(katalog: string, nowyId: () => string): Promise<string> {
  const plik = polacz(katalog, 'urzadzenie.txt');
  const t = (await czytajAtomowo(plik))?.trim();
  if (t !== undefined && /^[0-9a-f-]{36}$/i.test(t)) return t;
  const nowy = nowyId();
  zapiszAtomowo(plik, nowy); // M1-026: przerwany zapis nie zostawia uciętego identyfikatora
  return nowy;
}

/** Pamięć uprawnień Pro (KP-06): plik `pamiec-pro.json` obok bazy, poza bazą i archiwum. */
export function pamiecProWPliku(katalog: string): MagazynPamieci {
  const plikPro = polacz(katalog, 'pamiec-pro.json');
  return { czytaj: () => czytajAtomowo(plikPro), zapisz: async (t) => zapiszAtomowo(plikPro, t) };
}

/** Lustro `ustawienie.jezyk` dla ekranu awaryjnego (M1-070, P-455; dane.md „Pliki stanu urządzenia poza bazą”): czytane bez SQLite. */
export const PLIK_JEZYKA = 'jezyk.json';
const KLUCZ_JEZYKA = 'jezyk';
const preferencjaZ = (v: unknown): PreferencjaJezyka | null => (typeof v === 'string' && (v === 'auto' || jestJezykiem(v)) ? v : null);

/** Treść `jezyk.json` → preferencja; brak, nie-JSON, obcy kształt albo nieznany tag → null (język systemu). */
export function odczytajPlikJezyka(tekst: unknown): PreferencjaJezyka | null {
  if (typeof tekst !== 'string') return null;
  try {
    const x: unknown = JSON.parse(tekst);
    return typeof x === 'object' && x !== null && 'jezyk' in x ? preferencjaZ(x.jezyk) : null;
  } catch {
    return null;
  }
}
/** Odczyt lustra; nigdy nie rzuca (ekran awaryjny). */
export async function jezykZPliku(katalog: string): Promise<PreferencjaJezyka | null> {
  try { return odczytajPlikJezyka(await czytajAtomowo(polacz(katalog, PLIK_JEZYKA))); } catch { return null; }
}
/**
 * Magazyn preferencji z lustrem w pliku: baza zostaje źródłem prawdy. Po udanym zapisie do bazy i po udanym odczycie z bazy (start normalny)
 * plik dostaje tę samą wartość, jeśli się różni (uszkodzony zapis w bazie = „auto”, jak `preferencja()`); nieudany odczyt z bazy lustra nie zmienia.
 * Błąd zapisu pliku połknięty: lustro nie blokuje zmiany języka, uzgodni je następny start.
 */
export function zLustremJezyka(m: MagazynPreferencji, katalog: string): MagazynPreferencji {
  const uzgodnij = async (v: string | null): Promise<void> => {
    const p = preferencjaZ(v) ?? 'auto';
    try { if ((await jezykZPliku(katalog)) !== p) zapiszAtomowo(polacz(katalog, PLIK_JEZYKA), JSON.stringify({ jezyk: p })); } catch { /* lustro nie blokuje */ }
  };
  return {
    async odczytaj(klucz) {
      const v = await m.odczytaj(klucz);
      if (klucz === KLUCZ_JEZYKA) await uzgodnij(v);
      return v;
    },
    async zapisz(klucz, wartosc) {
      await m.zapisz(klucz, wartosc);
      if (klucz === KLUCZ_JEZYKA) await uzgodnij(wartosc);
    },
  };
}
