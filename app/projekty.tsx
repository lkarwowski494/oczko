// Trasa „/projekty”: lista projektów (F-50, F-54). Otwarcie projektu zapamiętuje jego pierwszy licznik (F-49) i wraca do licznika.
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useIsFocused, useRouter } from 'expo-router';
import { ListaProjektow, type StanListyProjektow } from '../src/ekrany/ListaProjektow';
import { useKolory } from '../src/ekrany/motyw';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { projektyDoSkrzynki, stanListy } from '../src/kompozycja/projekty';
import { pokazacOknoUczciweZasady } from '../src/przypadki-uzycia/informacje-pro';
import { widokProjektow, type WidokProjektow } from '../src/przypadki-uzycia/widok-projektow';
import { SkrzynkaNaEkranie } from '../src/kompozycja/SkrzynkaNaEkranie';

export default function EkranProjektow(): React.ReactElement {
  const { kontener, licznik } = useAplikacja();
  const router = useRouter();
  const naWierzchu = useIsFocused(); // arkusz skrzynki tylko na ekranie na wierzchu stosu
  const k = useKolory();
  const [widok, ustawWidok] = useState<WidokProjektow | null>(null);
  const [zapytanie, ustawZapytanie] = useState('');
  useFocusEffect(useCallback(() => {
    let zywy = true;
    void widokProjektow(kontener.z).then((w) => { if (zywy && w.ok) ustawWidok(w.wartosc); });
    return () => { zywy = false; };
  }, [kontener]));
  // P-089 (3a), BR-ZAK-006/S9 (ER-46): okno „Uczciwe zasady” raz, po minionym dniu z robótką, w pewnym stanie darmowym — tu, nigdy na liczniku (07-jakosc-022).
  useEffect(() => {
    let zywy = true;
    void pokazacOknoUczciweZasady(kontener.z, { poziom: kontener.dostep.stan().poziom, ekran: 'projekty' }).then((o) => {
      if (zywy && o.ok && o.wartosc) router.push('/uczciwe-zasady');
    });
    return () => { zywy = false; };
  }, [kontener, router]);
  if (!widok) return <View style={{ flex: 1, backgroundColor: k.papier }} />;
  const ch = kontener.z.zegar.teraz();
  const stan: StanListyProjektow = stanListy(widok, { zapytanie, j: kontener.j, terazMs: ch.ms, strefa: ch.strefa });
  const wroc = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <Bezpieczny>
      <ListaProjektow
        stan={stan}
        t={kontener.j.t}
        naSzukaj={ustawZapytanie}
        naOtworz={(id) => {
          const p = [...widok.wToku, ...widok.ukonczone].find((x) => x.id === id);
          if (!p?.licznik) return;
          void licznik.otworz(p.licznik.id).then(wroc);
        }}
        naNowy={() => router.push({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'nowy-projekt' } })}
        naUstawienia={() => router.push('/ustawienia')}
        naHistoria={() => router.push('/dni')}
        naNarzedzia={() => router.push('/narzedzia')}
        naKosz={() => router.push('/kosz')}
      />
      {/* Partia 6 (R2, scenariusz 52): arkusz „N patterns to add” nad listą — zlecenia ze skrzynki bez projektu; nie nad licznikiem (P-046). */}
      <SkrzynkaNaEkranie wz={kontener.wzor.k} t={kontener.j.t} aktywny={naWierzchu} projekty={() => projektyDoSkrzynki(kontener.z, kontener.j)}
        naPoWyborze={() => void widokProjektow(kontener.z).then((w) => { if (w.ok) ustawWidok(w.wartosc); })} />
    </Bezpieczny>
  );
}
