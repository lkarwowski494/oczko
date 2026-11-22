// Odświeżenie stanu ekranu blokady i zegarka po COMMIT (ADR-0008 (7), ADR-0009; 08 partia 3 D4): odczyt w pozycji kolejki (widzi zapisy
// zlecone wcześniej), potem ten sam ładunek do Live Activity i zegarka. Który licznik i jaka nazwa (projekt roboczy przez t(), P-126 (1b))
// oraz dostęp (decyzja ADR-0010 z datą wygaśnięcia) podaje wołający — ekran, partia 4.
import type { Wynik } from '../domena/bledy';
import { startDnia } from '../domena/limit';
import type { LiveActivity, StanEkranuBlokady, Zegarek } from '../domena/porty';
import { stanEkranuBlokady } from '../domena/zegarek';
import { licznikEkranuBlokady, przypomnieniaLicznika, startSesjiEkranu } from '../dane/repozytoria/ekran-blokady';
import { dniLimituMiesiaca, ostatniPlus } from '../dane/repozytoria/liczniki';
import { dodajDni } from './daty';
import { blad, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export type ZaleznosciEkranuBlokady = Zaleznosci & { liveActivity: LiveActivity; zegarek: Zegarek };

export async function odswiezEkranBlokady(
  z: ZaleznosciEkranuBlokady,
  w: { licznikId: string; nazwa: string; dostep: { pro: boolean; wygasa: number | null } },
): Promise<Wynik<StanEkranuBlokady>> {
  const stan = await operacjaZapisu(z, 'ekranBlokady', async (tx, teraz, chwila) => {
    const l = await licznikEkranuBlokady(tx, w.licznikId);
    if (!l) return blad('bledne_dane'); // licznik w koszu albo nieistniejący: zwykły stan, nie błąd diagnostyki
    const dni = await dniLimituMiesiaca(tx, chwila.dzien.slice(0, 7));
    const plus = await ostatniPlus(tx, dodajDni(chwila.dzien, -2));
    return {
      ok: true,
      wartosc: stanEkranuBlokady({
        licznik: { id: l.id, wartosc: l.wartosc, glowa: l.glowa, znaczenie: l.znaczenie, zablokowany: l.zablokowany },
        nazwa: w.nazwa,
        dzis: chwila.dzien,
        dzienDozwolony: startDnia({ dni, dzis: chwila.dzien, teraz, ostatniPlus: plus, pro: w.dostep.pro }).dozwolone,
        sesjaStartMs: await startSesjiEkranu(tx, l.projektId),
        ostatniPlusMs: plus,
        dostep: w.dostep,
        dniLimitu: dni.map((d) => ({ data: d.data, pro: d.pro })),
        przypomnienia: await przypomnieniaLicznika(tx, l.id),
      }),
    };
  });
  if (!stan.ok) {
    if (stan.powod === 'bledne_dane') await z.liveActivity.zakoncz();
    return stan;
  }
  await z.liveActivity.aktualizuj(stan.wartosc);
  await z.zegarek.wyslijStan(stan.wartosc);
  return stan;
}
