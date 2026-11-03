// Akcje na otwartym wzorze wołane z przeglądarki (notatki, obrót strony, usunięcie): zapis przypadkiem użycia, potem odświeżenie widoku trasy.
// Wydzielone z trasy `app/wzor.tsx` bez zmiany zachowania (M1-audytor-generalny-106, DEC-30 a: trasy poniżej 20 KB). Błąd zapisu: alert z `zapisano` (M1-006).
import type { Aplikacja } from '../kompozycja/Kontekst';
import type { Kontener } from '../kompozycja/kontener';
import { zapisano } from '../kompozycja/po-zapisie';
import type { WidokLicznika } from '../przypadki-uzycia/widok-licznika';
import { usunWzor } from '../przypadki-uzycia/wzor';
import { dodajNotatkeWzoru, usunNotatkeWzoru, zmienNotatkeWzoru } from '../przypadki-uzycia/wzor-notatki';
import { ustawObrot, type WidokWzoru } from '../przypadki-uzycia/wzor-widok';

export type KontekstAkcjiWzoru = {
  aplikacja: Aplikacja;
  zw: Kontener['wzor']['z'];
  widok: WidokWzoru;
  lw: WidokLicznika;
  strona: { n: number; razem: number } | null;
  wczytaj: (wybrany?: string) => Promise<void>;
};

export function akcjeWzoru(c: KontekstAkcjiWzoru) {
  const { aplikacja, zw, widok, lw, strona, wczytaj } = c;
  return {
    naZmienNotatke: async (id: string, nowa: string): Promise<boolean> => { const r = await zmienNotatkeWzoru(zw, { wzorId: widok.wzorId, notatkaId: id, tekst: nowa }); if (r.ok) await wczytaj(widok.wzorId); return r.ok; },
    naUsunNotatke: async (id: string): Promise<boolean> => { const r = await usunNotatkeWzoru(zw, { wzorId: widok.wzorId, notatkaId: id }); if (r.ok) await wczytaj(widok.wzorId); return r.ok; },
    naNotatka: (tekst: string): void => void dodajNotatkeWzoru(zw, { wzorId: widok.wzorId, rzad: widok.znacznik?.rzad ?? lw.wartosc + 1, tekst }).then((r) => { zapisano(aplikacja, r); }), // M1-006
    naObroc: (): void => void ustawObrot(zw, { wzorId: widok.wzorId, strona: strona ? strona.n - 1 : 0, kat: (((widok.obroty[strona ? strona.n - 1 : 0] ?? 0) + 90) % 360) as 0 | 90 | 180 | 270 }).then(async (r) => { if (zapisano(aplikacja, r)) await wczytaj(widok.wzorId); }), // M1-006
    naUsun: (): void => void usunWzor(zw, { wzorId: widok.wzorId }).then(async (r) => { if (zapisano(aplikacja, r)) { await aplikacja.kontener.wzor.k.odswiezMigawke(); await wczytaj(); } }),
  };
}
