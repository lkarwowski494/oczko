// Magazyn plików po SHA-256 (ADR-0001, port MagazynPlikow): `Application Support/pliki/<sha256>.<rozszerzenie>`, ten sam plik raz (adres = treść).
// Zapis: skrót źródła, kopia do pliku tymczasowego i zmiana nazwy (plik pod nazwą docelową zawsze pełny). Skrót wstrzykiwany: na urządzeniu
// natywny SHA-256 strumieniowo (moduł oczko-dziennik-plus, P-130), w Node i jako wzorzec — TS kawałkami 1 MiB (src/dane/archiwum/sha256.ts).
import type { Wynik } from '../../domena/bledy';
import type { MagazynPlikow } from '../../domena/porty';
import { sha256 } from '../archiwum/sha256';
import { powodBledu } from '../baza/bledy-sqlite';
import { czasZmiany, istniejeKatalog, istniejePlik, kopiuj, lista, otworzDoCzytania, polacz, przenies, rozmiar, usunPlik, utworzKatalog, wolneMiejsce } from './system';

const KAWALEK = 1 << 20;
const ROZSZERZENIE = /^[A-Za-z0-9]{1,16}$/;

/** SHA-256 pliku w TS, kawałkami (bez wczytania całego pliku do pamięci). */
export async function sha256PlikuTs(sciezka: string): Promise<string> {
  const c = otworzDoCzytania(sciezka);
  try {
    const s = sha256();
    for (let od = 0; od < c.rozmiar; od += KAWALEK) s.dodaj(c.czytaj(od, Math.min(KAWALEK, c.rozmiar - od)));
    return s.wynik();
  } finally {
    c.zamknij();
  }
}

export function utworzMagazyn(katalog: string, o: { skrot?: (sciezka: string) => Promise<string>; wolne?: () => number | null } = {}): MagazynPlikow {
  const skrot = o.skrot ?? sha256PlikuTs;
  const wolne = o.wolne ?? wolneMiejsce;
  return {
    async zapisz(zrodlo, rozszerzenie): Promise<Wynik<{ sha256: string; bajty: number }>> {
      if (!ROZSZERZENIE.test(rozszerzenie) || !istniejePlik(zrodlo)) return { ok: false, powod: 'bledne_dane' };
      try {
        utworzKatalog(katalog);
        const h = await skrot(zrodlo);
        const bajty = rozmiar(zrodlo);
        const cel = polacz(katalog, `${h}.${rozszerzenie}`);
        if (!istniejePlik(cel)) {
          const tymczasowy = `${cel}.tmp`;
          usunPlik(tymczasowy);
          kopiuj(zrodlo, tymczasowy);
          przenies(tymczasowy, cel);
        }
        return { ok: true, wartosc: { sha256: h, bajty } };
      } catch (e) {
        return { ok: false, powod: powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' };
      }
    },
    sciezka(h) {
      const n = lista(katalog).find((x) => x.startsWith(`${h}.`) && !x.endsWith('.tmp'));
      return polacz(katalog, n ?? h);
    },
    async usun(h) {
      for (const n of lista(katalog)) if (n.startsWith(`${h}.`)) usunPlik(polacz(katalog, n));
    },
    async wolneMiejsce() { return wolne(); },
    async pliki() {
      if (!istniejeKatalog(katalog)) return [];
      return lista(katalog).map((n) => ({ sha256: n.split('.')[0] ?? n, zmianaMs: czasZmiany(polacz(katalog, n)) }));
    },
  };
}

/** Panele buildu E2E (P-203, kontrakt 07): SHA-256 połączonych `.db` + `-wal` (brak `-wal` = pusty) i rozmiar `-wal`, bez checkpointu. */
export async function stanPlikuBazy(sciezka: string): Promise<{ sha: string; walBajty: number }> {
  const s = sha256();
  let walBajty = 0;
  for (const plik of [sciezka, `${sciezka}-wal`]) {
    if (!istniejePlik(plik)) continue;
    const c = otworzDoCzytania(plik);
    try {
      if (plik !== sciezka) walBajty = c.rozmiar;
      for (let od = 0; od < c.rozmiar; od += KAWALEK) s.dodaj(c.czytaj(od, Math.min(KAWALEK, c.rozmiar - od)));
    } finally {
      c.zamknij();
    }
  }
  return { sha: s.wynik(), walBajty };
}
