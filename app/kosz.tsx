// Trasa „/kosz”: „Recently deleted” (F-33, BR-DAN-008; P-183 2a — wejście z ostatniego wiersza listy projektów). Przywrócenie projektu, części
// albo licznika (`przywroc*`), potem lista od nowa i ogłoszenie `kosz.przywrocono`; pusty kosz zostaje na ekranie (wiersz listy znika po wyjściu).
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Kosz, type PozycjaKosza, type StanKosza } from '../src/ekrany/Kosz';
import { useKolory } from '../src/ekrany/motyw';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { zapisano } from '../src/kompozycja/po-zapisie';
import { stanKosza } from '../src/kompozycja/projekt';
import { oglos } from '../src/kompozycja/system';
import { przywrocCzesc, przywrocLicznik, przywrocProjekt } from '../src/przypadki-uzycia/projekt';
import { widokKosza } from '../src/przypadki-uzycia/widok-kosza';
import { przywrocWzor } from '../src/przypadki-uzycia/wzor';
import { przywrocNarzedzie, przywrocWloczke } from '../src/przypadki-uzycia/zapas';

export default function EkranKosza(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener, licznik } = aplikacja;
  const router = useRouter();
  const k = useKolory();
  const [stan, ustaw] = useState<StanKosza | null>(null);
  const wczytaj = useCallback(async () => {
    const w = await widokKosza(kontener.z);
    if (w.ok) { const c = kontener.z.zegar.teraz(); ustaw(stanKosza(w.wartosc, kontener.j, { terazMs: c.ms, strefa: c.strefa })); }
  }, [kontener]);
  useFocusEffect(useCallback(() => { void wczytaj(); }, [wczytaj]));
  if (!stan) return <View style={{ flex: 1, backgroundColor: k.papier }} />;
  const z = kontener.z;
  async function przywroc(p: { rodzaj: PozycjaKosza['rodzaj']; id: string }): Promise<void> {
    const nazwa = stan?.pozycje.find((x) => x.id === p.id && x.rodzaj === p.rodzaj)?.nazwa ?? '';
    const r = p.rodzaj === 'projekt' ? await przywrocProjekt(z, { projektId: p.id })
      : p.rodzaj === 'czesc' ? await przywrocCzesc(z, { czescId: p.id })
      : p.rodzaj === 'wloczka' ? await przywrocWloczke(z, { wloczkaId: p.id }) // P-209
      : p.rodzaj === 'wzor' ? await przywrocWzor(z, { wzorId: p.id }) // partia 6, P-229
      : p.rodzaj === 'narzedzie' ? await przywrocNarzedzie(z, { narzedzieId: p.id })
      : await przywrocLicznik(z, { licznikId: p.id });
    if (!zapisano(aplikacja, r)) return; // M1-006: nieudane przywrócenie → alert błędu zapisu
    await licznik.poZmianie();
    oglos(kontener.j.t('kosz.przywrocono', { nazwa }));
    await wczytaj();
  }
  return <Bezpieczny><Kosz stan={stan} t={kontener.j.t} naPrzywroc={(p) => void przywroc(p)} naWstecz={() => router.back()} /></Bezpieczny>;
}
