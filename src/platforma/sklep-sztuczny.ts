// Sztuczny sklep buildu E2E (e2e/README.md, wzór Treningu lib/store-fake.ts): ceny testowe, zakup bez okna Apple, „wygaś dostęp”
// (`e2e-sklep-wygas`), „Restore purchases” przywraca zakupy po wygaśnięciu (scenariusz 06). Zakupy przeżywają restart przez opcjonalny
// zapis w pliku buildu E2E (e2e/README.md: „transakcje zapisane w pliku buildu E2E”; odstępstwo nazwane od Treningu, który trzyma je w pamięci).
import type { Sklep, Transakcja } from '../domena/porty';

const CENY = { 'oczko.pro.monthly': ['$0.99', 'miesiac'], 'oczko.pro.yearly': ['$6.99', 'rok'], 'oczko.pro.lifetime': ['$14.99', 'dozywotni'] } as const;
const DOBA_MS = 86_400_000;
export type ZapisSklepu = { czytaj(): string | null; zapisz(tekst: string): void };
type Stan = { kupione: Transakcja[]; wygaslo: number | null };

function wczytaj(z?: ZapisSklepu): Stan {
  try {
    const x: unknown = z ? JSON.parse(z.czytaj() ?? 'null') : null;
    if (x && typeof x === 'object' && 'kupione' in x && Array.isArray(x.kupione) && 'wygaslo' in x) return { kupione: x.kupione as Transakcja[], wygaslo: typeof x.wygaslo === 'number' ? x.wygaslo : null };
  } catch { /* zły plik testowy = brak zakupów */ }
  return { kupione: [], wygaslo: null };
}

export function sklepSztuczny(terazMs: () => number = Date.now, zapis?: ZapisSklepu): Sklep & { wygas(): void } {
  let s = wczytaj(zapis);
  const obserwatorzy = new Set<() => void>();
  const zmien = (n: Stan) => { s = n; zapis?.zapisz(JSON.stringify(s)); obserwatorzy.forEach((f) => f()); };
  return {
    async produkty() { return Object.entries(CENY).map(([id, [cena, okres]]) => ({ id, cenaWyswietlana: cena, okres })); },
    async kup(id) {
      if (!(id in CENY)) return 'blad'; // nieznany produkt: jak błąd sklepu
      zmien({ kupione: [...s.kupione.filter((t) => t.produkt !== id), { produkt: id, wygasa: id === 'oczko.pro.lifetime' ? null : terazMs() + 30 * DOBA_MS, odebrane: false, karencjaDo: null }], wygaslo: null });
      return 'sukces';
    },
    /** Przywrócenie: zakupy z konta wracają (także po „expire access”). */
    async przywroc() { zmien({ ...s, wygaslo: null }); return { ok: true, wartosc: undefined }; },
    async transakcje() { return s.wygaslo === null ? s.kupione : s.kupione.map((t) => ({ ...t, wygasa: s.wygaslo, karencjaDo: null })); },
    obserwuj(fn) { obserwatorzy.add(fn); return () => obserwatorzy.delete(fn); },
    /** „Test store: expire access”: wszystkie uprawnienia kończą się teraz (dostęp liczy dostep.ts z końcem wyłącznym). */
    wygas() { zmien({ ...s, wygaslo: terazMs() }); },
  };
}
