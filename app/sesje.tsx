// Trasa „/sesje?projekt=…”: sesje projektu (F-51, BR-PRJ-013; P-191 P4a–P5a). Stuknięcie w zakończoną sesję → arkusz korekty.
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Sesje, type PropsSesji } from '../src/ekrany/Sesje';
import { StanWczytywania } from '../src/ekrany/StanWczytywania';
import { useAplikacja } from '../src/kompozycja/Kontekst';
import { Bezpieczny } from '../src/kompozycja/Bezpieczny';
import { stanSesji } from '../src/kompozycja/sesje';
import { sesjeProjektu } from '../src/przypadki-uzycia/sesja';

export default function EkranSesji(): React.ReactElement {
  const { kontener } = useAplikacja();
  const { projekt } = useLocalSearchParams<{ projekt: string }>();
  const router = useRouter();
  const [stan, ustaw] = useState<PropsSesji['stan'] | null>(null);
  const [blad, ustawBlad] = useState(false); // M1-007: odczyt `{ ok: false }` albo wyjątek → błąd z „Try again”, nie pusta plansza
  const wczytaj = useCallback(async () => {
    const w = await sesjeProjektu(kontener.z, { projektId: projekt }).catch(() => null);
    if (!w?.ok) { ustawBlad(true); return; }
    const ch = kontener.z.zegar.teraz();
    ustaw(stanSesji(w.wartosc, { j: kontener.j, terazMs: ch.ms, strefa: ch.strefa }));
    ustawBlad(false);
  }, [kontener, projekt]);
  useFocusEffect(useCallback(() => { void wczytaj(); }, [wczytaj]));
  if (!stan) return <Bezpieczny><StanWczytywania wyjscie={{ rodzaj: 'wstecz', naWyjdz: () => router.back() }} stan={blad ? 'blad' : 'ladowanie'} t={kontener.j.t} przedrostek="sesje" naPonow={() => { ustawBlad(false); void wczytaj(); }} /></Bezpieczny>;
  return (
    <Bezpieczny>
      <Sesje stan={stan} t={kontener.j.t} naWstecz={() => router.back()}
        naKorekta={(sesja) => router.push({ pathname: '/sesja-korekta', params: { sesja, projekt } })} />
    </Bezpieczny>
  );
}
