// Trasa „/menu”: menu ••• projektu (prototyp.html:129). Formularze otwierają się w miejsce menu; blokada, zerowanie i ukończenie zapisują od razu.
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { MenuProjektu } from '../src/ekrany/MenuProjektu';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { zapisano, zglosBladZapisu } from '../src/kompozycja/po-zapisie';
import type { Wynik } from '../src/domena/bledy';
import { ustawBlokade, wyzeruj } from '../src/przypadki-uzycia/licznik';
import { zakonczProjekt } from '../src/przypadki-uzycia/projekt';
import type { WidokLicznika } from '../src/przypadki-uzycia/widok-licznika';
import { listaWzorow } from '../src/przypadki-uzycia/wzor';

export default function EkranMenu(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener, licznik } = aplikacja;
  const router = useRouter();
  const [w, ustaw] = useState<WidokLicznika | null>(null);
  const [maWzor, ustawMaWzor] = useState(false); // partia 6: „Pattern” albo „Add pattern…” (W2a)
  const [blad, ustawBlad] = useState(false); // M1-007: brak widoku licznika (odczyt nieudany) albo wyjątek → błąd z „Try again”, nie pusty arkusz
  const wczytaj = useCallback(async () => {
    const x = await licznik.widok().catch(() => null);
    if (!x) { ustawBlad(true); return; }
    ustaw(x);
    const l = await listaWzorow(kontener.z, { projektId: x.projektId });
    ustawMaWzor(l.ok && l.wartosc.length > 0);
  }, [licznik, kontener]);
  useEffect(() => { void wczytaj(); }, [wczytaj]);
  if (!w) return <StanWczytywania tlo="arkusz" stan={blad ? 'blad' : 'ladowanie'} t={kontener.j.t} przedrostek="menu" naPonow={() => { ustawBlad(false); void wczytaj(); }} />;
  const z = kontener.z;
  // M1-006: błąd zapisu → alert, menu zostaje otwarte (bez powrotu jak po sukcesie; zamyka je użytkowniczka). Inny powód (np. licznik zablokowany) — jak dotąd.
  const poZapisie = async (r: Wynik<unknown>) => {
    if (r.ok) await licznik.poZmianie();
    else if (zglosBladZapisu(aplikacja, r.powod)) return;
    router.back();
  };
  const formularz = (rodzaj: string) => router.replace({ pathname: '/formularz/[rodzaj]', params: { rodzaj } });
  return (
    <MenuProjektu
      stan={{ projekt: licznik.nazwaProjektu(w), zablokowany: w.zablokowany, wartosc: w.wartosc, maWzor, oczka: w.rodzaj === 'oczka', przypomnienia: w.plany.length }}
      naWzor={() => router.replace('/wzor')}
      t={kontener.j.t}
      naNazwa={() => formularz('nazwa')} naCel={() => formularz('cel')} naPrzypomnienie={() => formularz('przypomnienie')} naPrzypomnienia={() => formularz('przypomnienia')}
      naPowtorzenie={() => formularz('powtorzenie')} naWpisz={() => formularz('wpisz')} naZnaczenie={() => formularz('znaczenie')}
      naZablokuj={() => void ustawBlokade(z, { licznikId: w.licznikId, zablokowany: true }).then(poZapisie)}
      naOdblokuj={() => void ustawBlokade(z, { licznikId: w.licznikId, zablokowany: false }).then(poZapisie)}
      naZeruj={() => void wyzeruj(z, { licznikId: w.licznikId }).then(poZapisie)}
      naUkoncz={() => void zakonczProjekt(z, { projektId: w.projektId }).then(async (r) => {
        if (!zapisano(aplikacja, r)) return;
        await licznik.poZmianie();
        router.replace({ pathname: '/ukonczenie', params: { projekt: w.projektId } });
      })}
      naZamknij={() => router.back()}
    />
  );
}
