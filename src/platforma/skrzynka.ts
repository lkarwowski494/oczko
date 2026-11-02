// Skrzynka importu „Udostępnij do Oczka” w kontenerze App Group (ADR-0011 fix-7; moduly.md „Kontrakt partii 6”, cel targets/share).
// Rozszerzenie kopiuje plik do `<grupa>/skrzynka/<id>/` i na końcu zapisuje manifest `zlecenie.json` (plik tymczasowy → rename); `sciezka`
// w manifeście: `sciezki` względne (nazwy plików w katalogu zlecenia; kilka zdjęć jednego udostępnienia = jedno zlecenie, P-248 D1a). Katalog bez poprawnego manifestu to zlecenie niepełne: usuwane dopiero, gdy
// nie zmieniał się od SKRZYNKA_PORZUCONE_H (rozszerzenie mogło jeszcze kopiować).
import type { NoweZlecenie, SkrzynkaImportu, ZlecenieImportu } from '../domena/porty';
import { SKRZYNKA_PORZUCONE_H } from '../konfiguracja';
import { czasZmianyKatalogu, czytajTekst, istniejePlik, lista, polacz, przenies, usunKatalog, utworzKatalog, zapiszTekst } from '../dane/pliki/system';
import { identyfikatory } from './identyfikatory';

const MANIFEST = 'zlecenie.json';
const GODZINA_MS = 3_600_000;

function zlecenieZManifestu(tekst: string, katalog: string, id: string): ZlecenieImportu | null {
  let m: unknown;
  try { m = JSON.parse(tekst); } catch { return null; }
  if (typeof m !== 'object' || m === null) return null;
  const r = m as Record<string, unknown>;
  const napis = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : null);
  const rodzaj = r.rodzaj === 'plik' || r.rodzaj === 'adres' || r.rodzaj === 'film' ? r.rodzaj : null;
  const nazwa = napis('nazwa'), typ = napis('typ');
  const sciezki = Array.isArray(r.sciezki) && r.sciezki.every((x) => typeof x === 'string') ? (r.sciezki as string[]) : null;
  if (r.id !== id || !rodzaj || !nazwa || typ === null || typeof r.utworzonoMs !== 'number') return null;
  if (!sciezki) return null;
  if (rodzaj === 'plik' && (sciezki.length === 0 || sciezki.some((x) => !x || x.includes('/') || !istniejePlik(polacz(katalog, x))))) return null; // tylko pliki w katalogu zlecenia
  if (rodzaj !== 'plik' && !napis('adres')) return null;
  return { id, rodzaj, nazwa, sciezki: rodzaj === 'plik' ? sciezki.map((x) => polacz(katalog, x)) : [], adres: napis('adres'), typ, projektId: napis('projektId'), utworzonoMs: r.utworzonoMs };
}

/**
 * `grupa` = katalog kontenera App Group (null: grupa niedostępna — np. build bez uprawnień; skrzynka pusta, `dodaj` → `zapis`).
 * `noweId`: id zlecenia dopisywanego z aplikacji (UUID jak w rozszerzeniu; nazwa katalogu = `id` w manifeście).
 */
export function skrzynkaWKatalogu(grupa: string | null, teraz: () => number, noweId: () => string = identyfikatory.nowy): SkrzynkaImportu {
  const korzen = grupa ? polacz(grupa, 'skrzynka') : null;
  return {
    async pobierz() {
      if (!korzen) return [];
      const wynik: ZlecenieImportu[] = [];
      for (const id of lista(korzen)) {
        const k = polacz(korzen, id);
        const m = istniejePlik(polacz(k, MANIFEST)) ? zlecenieZManifestu(await czytajTekst(polacz(k, MANIFEST)), k, id) : null;
        if (m) { wynik.push(m); continue; }
        const zmiana = czasZmianyKatalogu(k);
        if (zmiana !== null && teraz() - zmiana > SKRZYNKA_PORZUCONE_H * GODZINA_MS) usunKatalog(k);
      }
      return wynik.sort((a, b) => a.utworzonoMs - b.utworzonoMs || (a.id < b.id ? -1 : 1));
    },
    async usun(id) {
      if (!korzen || id.includes('/')) return;
      usunKatalog(polacz(korzen, id));
    },
    /**
     * Zlecenie z aplikacji (ADR-0031 pkt 3): ten sam `zlecenie.json` co rozszerzenie, zapisany atomowo — plik tymczasowy w katalogu zlecenia, potem zmiana nazwy.
     * Katalog bez manifestu to zlecenie niepełne (`pobierz` go nie widzi). Błąd zapisu sprząta katalog i daje `zapis`; wołający pokazuje alert, adres zostaje w polu.
     */
    async dodaj(nowe: NoweZlecenie) {
      if (!korzen) return { ok: false, powod: 'zapis' };
      const id = noweId();
      const k = polacz(korzen, id);
      try {
        utworzKatalog(k);
        const tmp = polacz(k, `${MANIFEST}.tmp`);
        zapiszTekst(tmp, JSON.stringify({ id, rodzaj: nowe.rodzaj, nazwa: nowe.nazwa, sciezki: [], adres: nowe.adres, typ: 'public.url', projektId: nowe.projektId, utworzonoMs: teraz() }));
        przenies(tmp, polacz(k, MANIFEST));
        return { ok: true, wartosc: { id } };
      } catch {
        try { usunKatalog(k); } catch { /* sprzątanie best-effort: katalog bez manifestu i tak usuwa `pobierz` po SKRZYNKA_PORZUCONE_H */ }
        return { ok: false, powod: 'zapis' };
      }
    },
  };
}
