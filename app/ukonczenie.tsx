// Trasa „/ukonczenie?projekt=…”: karta ukończenia (U-9, BR-PRJ-015). „Done” → prośba o ocenę przez bramkę (P-160), potem lista projektów.
import React, { useCallback, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ukonczenie, type StanUkonczenia } from '../src/ekrany/Ukonczenie';
import { alertBleduZapisu } from '../src/ekrany/blad-zapisu';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { oglos, portOceny, systemAplikacji } from '../src/kompozycja/system';
import { stanUkonczenia } from '../src/kompozycja/ukonczenie';
import { prosbaPoUkonczeniu } from '../src/przypadki-uzycia/ocena';
import { kartaUkonczenia } from '../src/przypadki-uzycia/widok-ukonczenia';
import { zapiszZuzycie } from '../src/przypadki-uzycia/zapas';
import { formatujLiczbe, parsujLiczbe } from '../src/i18n/format';
import { ObrazKarty } from '../src/ekrany/ObrazKarty';
import { zrzutKarty } from '../src/platforma/zrzut';
import { udostepnijPlik } from '../src/platforma/system-plikow-uzytkownika';
import { usunPlik } from '../src/dane/pliki/system';

export default function EkranUkonczenia(): React.ReactElement {
  const { kontener } = useAplikacja();
  const { projekt } = useLocalSearchParams<{ projekt: string }>();
  const router = useRouter();
  const [stan, ustaw] = useState<StanUkonczenia | null>(null);
  const [blad, ustawBlad] = useState(false);
  const [bladOdczytu, ustawBladOdczytu] = useState(false); // M1-007: odczyt `{ ok: false }` albo wyjątek → błąd z „Try again”, nie karta bez wyjścia
  const obraz = useRef<View>(null); // obraz karty 1080 × 1350 (P-191 P10a, P-219 2A)
  const jezyk = kontener.j.jezyk();
  // Odświeżana po powrocie z arkusza wyboru włóczek i z „Edit stash” (07-jakosc-001): zapas i grupa włóczek na karcie od razu aktualne.
  const wczytaj = useCallback(async () => {
    const w = await kartaUkonczenia(kontener.z, { projektId: projekt }).catch(() => null);
    if (!w?.ok) { ustawBladOdczytu(true); return; }
    const ch = kontener.z.zegar.teraz();
    ustaw(stanUkonczenia(w.wartosc, { j: kontener.j, terazMs: ch.ms, strefa: ch.strefa, zdjecie: (sha) => kontener.z.magazyn.sciezka(sha) }));
    ustawBladOdczytu(false);
  }, [kontener, projekt]);
  useFocusEffect(useCallback(() => { void wczytaj(); }, [wczytaj]));
  if (!stan) return <StanWczytywania wyjscie={{ rodzaj: 'zamknij', naWyjdz: () => router.back() }} tlo="arkusz" stan={bladOdczytu ? 'blad' : 'ladowanie'} t={kontener.j.t} przedrostek="ukonczenie" naPonow={() => { ustawBladOdczytu(false); void wczytaj(); }} />;
  return (
    <Ukonczenie stan={{ ...stan, bladZapisu: blad }} t={kontener.j.t} oglos={oglos} system={systemAplikacji}
      liczby={{ formatuj: (n) => formatujLiczbe(n, jezyk, { maks: 2 }), parsuj: (x) => parsujLiczbe(x, jezyk) }}
      naEdytujZapas={(id) => router.push({ pathname: '/wloczka', params: { id } })}
      naWybierzWloczke={() => router.push({ pathname: '/formularz/[rodzaj]', params: { rodzaj: 'wloczki', projekt } })}
      naUdostepnij={() => void (async () => {
        const plik = await zrzutKarty(obraz).catch(() => null);
        if (!plik) { Alert.alert(...alertBleduZapisu(kontener.j.t, 'udostepnienie')); return; } // M1-120
        await udostepnijPlik(plik, 'image/png'); // aplikacja nic nie wysyła sama — arkusz systemowy (ZP-03)
        usunPlik(plik);
      })()}
      obrazKarty={<ObrazKarty ref={obraz} t={kontener.j.t}
        stan={{ nazwa: stan.nazwa, okres: stan.okres, rzedy: stan.rzedy, dni: stan.dni, czas: stan.czas, czesci: stan.czesci, wloczka: stan.wloczka.map((w) => w.nazwa), zdjecie: stan.zdjecie }} />}
      naGotowe={(zuzycie) => void (async () => {
        // F-37: zapis zużycia przed zamknięciem; nieudany — komunikat, karta zostaje (dane bez zmian, transakcja wycofana).
        if (zuzycie.length > 0 && !(await zapiszZuzycie(kontener.z, { projektId: projekt, zuzycie })).ok) { ustawBlad(true); return; }
        void prosbaPoUkonczeniu(kontener.z, portOceny);
        router.dismissTo('/projekty');
      })()} />
  );
}
