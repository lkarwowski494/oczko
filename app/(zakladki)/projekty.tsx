// Trasa „/projekty”: zakładka Projekty (F-50, F-54; M3 p2 WD-1). Otwarcie projektu zapamiętuje jego pierwszy licznik (F-49) i otwiera licznik (/licznik nad zakładkami).
// Ustawienia tylko z zębatki „Dziś” (P-571); Historia i Narzędzia to zakładki — bez ikon w pasku listy i bez „Back” (korzeń zakładki).
import React, { useCallback, useEffect, useState } from 'react';
import { ActionSheetIOS } from 'react-native';
import { useFocusEffect, useIsFocused, useRouter } from 'expo-router';
import { ListaProjektow, type StanListyProjektow } from '../../src/ekrany/ListaProjektow';
import { StanWczytywania } from '../../src/ekrany/StanWczytywania';
import { useAplikacja } from '../../src/kompozycja/Kontekst';
import { Bezpieczny } from '../../src/kompozycja/Bezpieczny';
import { projektyDoSkrzynki, stanListy } from '../../src/kompozycja/projekty';
import { pokazacOknoUczciweZasady } from '../../src/przypadki-uzycia/informacje-pro';
import { widokProjektow, type WidokProjektow } from '../../src/przypadki-uzycia/widok-projektow';
import { SkrzynkaNaEkranie } from '../../src/kompozycja/SkrzynkaNaEkranie';
import { zapisano } from '../../src/kompozycja/po-zapisie';
import { krotkaData } from '../../src/kompozycja/projekt';
import { oglos } from '../../src/kompozycja/system';
import { dzienLokalny } from '../../src/domena/postep';
import { KOSZ_DNI } from '../../src/konfiguracja';
import { dodajDni } from '../../src/przypadki-uzycia/daty';
import { usunProjekt } from '../../src/przypadki-uzycia/projekt';

export default function EkranProjektow(): React.ReactElement {
  const aplikacja = useAplikacja();
  const { kontener, licznik } = aplikacja;
  const router = useRouter();
  const naWierzchu = useIsFocused(); // arkusz skrzynki tylko na ekranie na wierzchu stosu
  const [widok, ustawWidok] = useState<WidokProjektow | null>(null);
  const [blad, ustawBlad] = useState(false); // E2-137-A1: odczyt się nie udał (wyjątek albo wynik „nie ok”) — do pierwszych danych ekran pokazuje błąd z ponowieniem, nie pustą planszę
  const [zapytanie, ustawZapytanie] = useState('');
  const wczytaj = useCallback(async (zywy: () => boolean): Promise<void> => {
    const w = await widokProjektow(kontener.z).catch(() => null);
    if (!zywy()) return;
    if (w?.ok) ustawWidok(w.wartosc); else ustawBlad(true);
  }, [kontener]);
  useFocusEffect(useCallback(() => {
    let zywy = true;
    void wczytaj(() => zywy);
    return () => { zywy = false; };
  }, [wczytaj]));
  // P-089 (3a), BR-ZAK-006/S9 (ER-46): okno „Uczciwe zasady” raz, po minionym dniu z robótką, w pewnym stanie darmowym — tu, nigdy na liczniku (07-jakosc-022).
  useEffect(() => {
    let zywy = true;
    void pokazacOknoUczciweZasady(kontener.z, { poziom: kontener.dostep.stan().poziom, ekran: 'projekty' }).then((o) => {
      if (zywy && o.ok && o.wartosc) router.push('/uczciwe-zasady');
    });
    return () => { zywy = false; };
  }, [kontener, router]);
  if (!widok) {
    return (
      <Bezpieczny>
        <StanWczytywania stan={blad ? 'blad' : 'ladowanie'} t={kontener.j.t} przedrostek="projekty" naPonow={() => { ustawBlad(false); void wczytaj(() => true); }} />
      </Bezpieczny>
    );
  }
  const ch = kontener.z.zegar.teraz();
  const stan: StanListyProjektow = stanListy(widok, { zapytanie, j: kontener.j, terazMs: ch.ms, strefa: ch.strefa });
  // ••• wiersza (WD-3): arkusz systemowy jest też potwierdzeniem — tytuł, data końca kosza (KOSZ_DNI dni) i jedno działanie destrukcyjne; usuwanie jak na ekranie projektu.
  const menuWiersza = (id: string): void => {
    const nazwa = [...stan.wToku, ...stan.ukonczone].find((x) => x.id === id)?.nazwa;
    if (nazwa === undefined) return;
    const t = kontener.j.t;
    const d = dzienLokalny(ch.ms, ch.strefa);
    const doDnia = d.ok ? krotkaData(dodajDni(d.wartosc, KOSZ_DNI), kontener.j.jezyk()) : '';
    ActionSheetIOS.showActionSheetWithOptions({ title: t('usun.tytul', { nazwa }), message: t('usun.projekt_opis', { data: doDnia }),
      options: [t('usun.projekt'), t('wspolne.anuluj')], destructiveButtonIndex: 0, cancelButtonIndex: 1 }, (wybor) => {
      if (wybor !== 0) return;
      void usunProjekt(kontener.z, { projektId: id }).then(async (r) => {
        if (!zapisano(aplikacja, r)) return;
        await licznik.poUsunieciu(id);
        oglos(t('usun.ogloszenie', { nazwa }));
        await wczytaj(() => true);
      });
    });
  };
  return (
    <Bezpieczny>
      <ListaProjektow
        stan={stan}
        t={kontener.j.t}
        naSzukaj={ustawZapytanie}
        naOtworz={(id) => {
          const p = [...widok.wToku, ...widok.ukonczone].find((x) => x.id === id);
          if (!p?.licznik) return;
          void licznik.otworz(p.licznik.id).then(() => router.navigate('/licznik'));
        }}
        naNowy={() => router.push({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'nowy-projekt' } })}
        naKosz={() => router.push('/kosz')}
        naMenuWiersza={menuWiersza}
      />
      {/* Partia 6 (R2, scenariusz 52): arkusz „N patterns to add” nad listą — zlecenia ze skrzynki bez projektu; nie nad licznikiem (P-046). */}
      <SkrzynkaNaEkranie wz={kontener.wzor.k} t={kontener.j.t} aktywny={naWierzchu} projekty={() => projektyDoSkrzynki(kontener.z, kontener.j)}
        naPoWyborze={() => void widokProjektow(kontener.z).then((w) => { if (w.ok) ustawWidok(w.wartosc); })} />
    </Bezpieczny>
  );
}
